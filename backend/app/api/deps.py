from typing import Generator, Optional, Callable, Dict, Set
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.tenant import set_current_tenant_id, get_current_tenant_id
from app.core.security import verify_token
from app.models.tenant import Tenant
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Define roles and permissions mappings
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "super_admin": {"*"},
    "college_admin": {
        "tenant:read", "tenant:update",
        "users:create", "users:read", "users:update", "users:delete",
        "departments:create", "departments:read", "departments:update", "departments:delete",
        "programs:create", "programs:read", "programs:update", "programs:delete",
        "audit:read"
    },
    "principal": {
        "users:read",
        "departments:read", "departments:update",
        "programs:read", "programs:update",
        "audit:read"
    },
    "hod": {
        "users:read",
        "departments:read",
        "programs:read", "programs:update"
    },
    "faculty": {
        "departments:read",
        "programs:read"
    },
    "student": {
        "departments:read",
        "programs:read"
    }
}

def resolve_subdomain(host: str) -> Optional[str]:
    """
    Parses host string to extract subdomain for tenant scoping.
    E.g. tenant-a.collegeerp.com -> tenant-a
    """
    host = host.split(":")[0]
    parts = host.split(".")
    if len(parts) > 1:
        # Ignore local domains & suffixes
        if parts[-1] in ("localhost", "local", "127.0.0.1"):
            # e.g. tenant1.localhost or tenant1.collegeerp.local
            if len(parts) > 2 and parts[-2] == "collegeerp":
                return parts[0]
            if parts[-1] == "localhost" and len(parts) == 2:
                return parts[0]
            return parts[0]
        # E.g. tenant1.collegeerp.com -> tenant1
        return parts[0]
    return None

async def get_optional_tenant(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[Tenant]:
    """
    Tries to resolve tenant via custom header or subdomain, then injects it into context.
    Does not raise exceptions if no tenant is found.
    """
    tenant_id_header = request.headers.get("X-Tenant-ID")
    host = request.headers.get("host", "")
    subdomain = resolve_subdomain(host)

    tenant = None
    if tenant_id_header:
        try:
            t_id = int(tenant_id_header)
            result = await db.execute(
                select(Tenant).where(Tenant.id == t_id).execution_options(tenant_bypass=True)
            )
            tenant = result.scalar_one_or_none()
        except ValueError:
            pass
    elif subdomain:
        # Don't treat administrative or main system subdomains as tenants
        if subdomain not in ("www", "api", "admin", "app"):
            result = await db.execute(
                select(Tenant).where(Tenant.subdomain == subdomain).execution_options(tenant_bypass=True)
            )
            tenant = result.scalar_one_or_none()

    if tenant:
        set_current_tenant_id(tenant.id)
    else:
        set_current_tenant_id(None)
    
    return tenant

async def get_current_tenant(
    tenant: Optional[Tenant] = Depends(get_optional_tenant)
) -> Tenant:
    """
    Strict dependency ensuring that a valid tenant is resolved.
    Raises HTTPException if missing.
    """
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active tenant context is required. Specify subdomain or X-Tenant-ID header."
        )
    return tenant

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    tenant: Optional[Tenant] = Depends(get_optional_tenant)
) -> User:
    """
    Resolves active user from authentication token, ensuring matching tenant constraints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        token_tenant_id: int = payload.get("tenant_id")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except Exception:
        raise credentials_exception

    # Load user bypassing RLS check to fetch the record, eagerly loading roles, then validate manually
    from sqlalchemy.orm import joinedload
    result = await db.execute(
        select(User).where(User.id == int(user_id)).options(joinedload(User.roles)).execution_options(tenant_bypass=True)
    )
    user = result.unique().scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Check for superadmin status. If not superadmin, user must match active tenant
    is_super_admin = any(r.role_type == "super_admin" for r in user.roles)
    active_tenant_id = get_current_tenant_id()

    if not is_super_admin:
        if active_tenant_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context is required for non-super-admin users."
            )
        if user.tenant_id != active_tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User tenant context mismatch."
            )

    return user

def require_permission(permission_name: str) -> Callable:
    """
    Returns a dependency function verifying that the logged-in user possesses the required permission.
    """
    async def permission_dependency(
        current_user: User = Depends(get_current_user)
    ) -> User:
        for role in current_user.roles:
            role_type = role.role_type
            allowed_permissions = ROLE_PERMISSIONS.get(role_type, set())
            if "*" in allowed_permissions or permission_name in allowed_permissions:
                return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: user does not have permission '{permission_name}'"
        )
    return permission_dependency
