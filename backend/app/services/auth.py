from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload

from app.core.security import get_password_hash, verify_password, generate_totp_secret, get_totp_uri, verify_totp
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.schemas.user import UserCreate

class AuthService:
    @staticmethod
    async def get_user_by_username_or_email(
        db: AsyncSession,
        username_or_email: str,
        bypass_tenant: bool = False
    ) -> Optional[User]:
        """
        Retrieves a user by username or email, eagerly loading their roles.
        Supports bypass_tenant for administrative lookups.
        """
        query = select(User).where(
            or_(
                User.username == username_or_email,
                User.email == username_or_email
            )
        ).options(joinedload(User.roles))
        
        if bypass_tenant:
            query = query.execution_options(tenant_bypass=True)
            
        result = await db.execute(query)
        return result.unique().scalar_one_or_none()

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        username_or_email: str,
        password: str,
        bypass_tenant: bool = False
    ) -> Optional[User]:
        """
        Validates credentials, supporting tenant bypass for platform administrators.
        """
        user = await AuthService.get_user_by_username_or_email(db, username_or_email, bypass_tenant=bypass_tenant)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    async def create_user(
        db: AsyncSession,
        user_in: UserCreate,
        tenant_id: int
    ) -> User:
        """
        Creates a new user, hashes their password, encrypts PII, and assigns initial roles.
        """
        hashed_password = get_password_hash(user_in.password)
        
        # Instantiate UserRole (User.id is mapped automatically during flush)
        db_role = UserRole(
            tenant_id=tenant_id,
            role_type=user_in.role_type,
            scope={}
        )
        
        db_user = User(
            tenant_id=tenant_id,
            username=user_in.username,
            email=user_in.email,
            password_hash=hashed_password,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            is_active=True,
            mfa_enabled=False,
            roles=[db_role]
        )
        
        if user_in.phone:
            db_user.phone = user_in.phone
        if user_in.address:
            db_user.address = user_in.address
            
        db.add(db_user)
        await db.flush()
        return db_user

    @staticmethod
    async def setup_mfa(db: AsyncSession, user: User, tenant_name: str) -> dict:
        """
        Generates random TOTP secret key and provisioning URI.
        """
        secret = generate_totp_secret()
        user.mfa_secret = secret
        db.add(user)
        await db.flush()
        
        qr_uri = get_totp_uri(secret, user.email, tenant_name)
        return {"secret": secret, "qr_code_uri": qr_uri}

    @staticmethod
    async def verify_and_enable_mfa(db: AsyncSession, user: User, code: str) -> bool:
        """
        Verifies TOTP token and enables MFA if correct.
        """
        if not user.mfa_secret:
            return False
        if verify_totp(user.mfa_secret, code):
            user.mfa_enabled = True
            db.add(user)
            await db.flush()
            return True
        return False
