from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from app.api import deps
from app.core import security
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    MfaSetupResponse,
    MfaVerifyRequest
)
from app.services.auth import AuthService
from app.services.audit import AuditLogService

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    request: Request,
    tenant: Tenant = Depends(deps.get_current_tenant),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Register a new user inside the active tenant environment.
    """
    if tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant account is not active."
        )
        
    # Check duplicate username/email under the active tenant context
    existing = await AuthService.get_user_by_username_or_email(db, user_in.username)
    if not existing:
        existing = await AuthService.get_user_by_username_or_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered under this tenant."
        )

    user = await AuthService.create_user(db, user_in, tenant.id)
    await db.commit()
    
    # Track event via audit logs
    await AuditLogService.create(
        db=db,
        action="create_user",
        resource="users",
        details={"username": user.username, "email": user.email, "role": user_in.role_type},
        user_id=user.id,
        tenant_id=tenant.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    

    return user

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    tenant: Optional[Tenant] = Depends(deps.get_optional_tenant),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Standard username/password login endpoint, verifying TOTP tokens if MFA is enabled.
    Handles both tenant-scoped users and platform-wide Super Admins.
    """
    if tenant and tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant account is not active."
        )

    # If no tenant context resolved, we are on the administrative subdomain
    # We must bypass the tenant RLS filter to locate the Super Admin user
    bypass_tenant = (tenant is None)
    user = await AuthService.authenticate_user(
        db,
        login_data.username,
        login_data.password,
        bypass_tenant=bypass_tenant
    )
    
    ip_addr = request.client.host if request.client else None
    t_id = tenant.id if tenant else (user.tenant_id if user else None)

    if not user:
        await AuditLogService.create(
            db=db,
            action="login_failure",
            resource="users",
            details={"username": login_data.username, "reason": "Invalid credentials"},
            tenant_id=t_id,
            ip_address=ip_addr
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password."
        )


    # If logging in without tenant context (admin subdomain), user MUST be a super_admin
    if tenant is None:
        is_super = any(r.role_type == "super_admin" for r in user.roles)
        if not is_super:
            await AuditLogService.create(
                db=db,
                action="login_failure",
                resource="users",
                details={"username": user.username, "reason": "Non-superadmin login attempt on admin domain"},
                tenant_id=user.tenant_id,
                ip_address=ip_addr
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only Super Admins are permitted to login here."
            )

    # Verify MFA if enabled for the user account
    if user.mfa_enabled:
        if not login_data.mfa_code:
            return TokenResponse(mfa_required=True)
        if not security.verify_totp(user.mfa_secret, login_data.mfa_code):
            await AuditLogService.create(
                db=db,
                action="login_failure",
                resource="users",
                details={"username": user.username, "reason": "Invalid MFA token"},
                user_id=user.id,
                tenant_id=t_id,
                ip_address=ip_addr
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid multi-factor verification code."
            )

    # Issue JWT Credentials
    access_token = security.create_access_token(subject=user.id, tenant_id=t_id)
    refresh_token = security.create_refresh_token(subject=user.id, tenant_id=t_id)
    
    await AuditLogService.create(
        db=db,
        action="login_success",
        resource="users",
        details={"username": user.username},
        user_id=user.id,
        tenant_id=t_id,
        ip_address=ip_addr
    )
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        mfa_required=False
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Regenerates access credentials using a valid refresh token.
    """
    try:
        payload = security.verify_token(refresh_data.refresh_token)
        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id")
        token_type = payload.get("type")
        if user_id is None or tenant_id is None or token_type != "refresh":
            raise HTTPException(status_code=400, detail="Invalid refresh token.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid refresh token.")

    # Load user from db bypassing tenant constraints to execute validation
    result = await db.execute(
        select(User).where(User.id == int(user_id)).execution_options(tenant_bypass=True)
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="User not found or inactive.")

    access_token = security.create_access_token(subject=user.id, tenant_id=tenant_id)
    new_refresh_token = security.create_refresh_token(subject=user.id, tenant_id=tenant_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token
    )

@router.post("/mfa/setup", response_model=MfaSetupResponse)
async def setup_mfa(
    tenant: Tenant = Depends(deps.get_current_tenant),
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Initializes TOTP credentials for the authenticated user.
    """
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled.")
        
    mfa_data = await AuthService.setup_mfa(db, current_user, tenant.name)
    await db.commit()
    
    await AuditLogService.create(
        db=db,
        action="mfa_setup_initiate",
        resource="users",
        details={},
        user_id=current_user.id,
        tenant_id=tenant.id
    )
    await db.commit()
    
    return mfa_data

@router.post("/mfa/verify")
async def verify_mfa(
    verify_data: MfaVerifyRequest,
    tenant: Tenant = Depends(deps.get_current_tenant),
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Validates the setup token code and enables MFA.
    """
    success = await AuthService.verify_and_enable_mfa(db, current_user, verify_data.code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid verification code.")
        
    await db.commit()
    
    await AuditLogService.create(
        db=db,
        action="mfa_enabled",
        resource="users",
        details={},
        user_id=current_user.id,
        tenant_id=tenant.id
    )
    await db.commit()
    
    return {"status": "success", "message": "Multi-factor authentication has been enabled."}
