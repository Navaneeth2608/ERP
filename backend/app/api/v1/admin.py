from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate
from app.schemas.common import PaginationParams, PaginatedResponse, PaginationMetadata
from app.services.audit import AuditLogService

router = APIRouter()

# Helper dependency to check if current user is Super Admin
async def require_super_admin(current_user=Depends(deps.get_current_user)):
    is_super = any(role.role_type == "super_admin" for role in current_user.roles)
    if not is_super:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Super Admin role is required."
        )
    return current_user

@router.post("/tenants", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_in: TenantCreate,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    admin_user = Depends(require_super_admin)
):
    """
    Creates a new subscriber tenant inside the platform. (Super Admin only).
    """
    # Verify subdomain is unique
    result = await db.execute(
        select(Tenant).where(Tenant.subdomain == tenant_in.subdomain).execution_options(tenant_bypass=True)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain is already taken."
        )

    tenant = Tenant(
        name=tenant_in.name,
        subdomain=tenant_in.subdomain,
        subscription_tier=tenant_in.subscription_tier,
        config=tenant_in.config,
        status="active"
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    
    # Audit log entry
    await AuditLogService.create(
        db=db,
        action="create_tenant",
        resource="tenants",
        details={"name": tenant.name, "subdomain": tenant.subdomain},
        user_id=admin_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return tenant

@router.get("/tenants", response_model=PaginatedResponse[TenantResponse])
async def list_tenants(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(deps.get_db),
    admin_user = Depends(require_super_admin)
):
    """
    Lists subscriber tenants (Super Admin only).
    """
    # Total count query
    count_result = await db.execute(
        select(Tenant).execution_options(tenant_bypass=True)
    )
    all_tenants = count_result.scalars().all()
    total = len(all_tenants)
    
    # Page slice query
    offset = (pagination.page - 1) * pagination.limit
    query = select(Tenant).offset(offset).limit(pagination.limit).execution_options(tenant_bypass=True)
    result = await db.execute(query)
    tenants = result.scalars().all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        data=list(tenants),
        pagination=PaginationMetadata(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            pages=pages
        )
    )

@router.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(deps.get_db),
    admin_user = Depends(require_super_admin)
):
    """
    Fetch a single tenant's registration details (Super Admin only).
    """
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id).execution_options(tenant_bypass=True)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    return tenant

@router.put("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_update: TenantUpdate,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    admin_user = Depends(require_super_admin)
):
    """
    Updates tenant registration, status, or settings (Super Admin only).
    """
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id).execution_options(tenant_bypass=True)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
        
    old_details = {
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "status": tenant.status,
        "subscription_tier": tenant.subscription_tier,
        "config": tenant.config
    }
    
    if tenant_update.name is not None:
        tenant.name = tenant_update.name
    if tenant_update.subdomain is not None:
        if tenant_update.subdomain != tenant.subdomain:
            dup = await db.execute(
                select(Tenant).where(Tenant.subdomain == tenant_update.subdomain).execution_options(tenant_bypass=True)
            )
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Subdomain is already taken.")
        tenant.subdomain = tenant_update.subdomain
    if tenant_update.status is not None:
        tenant.status = tenant_update.status
    if tenant_update.subscription_tier is not None:
        tenant.subscription_tier = tenant_update.subscription_tier
    if tenant_update.config is not None:
        tenant.config = tenant_update.config

    await db.commit()
    
    new_details = {
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "status": tenant.status,
        "subscription_tier": tenant.subscription_tier,
        "config": tenant.config
    }
    
    await AuditLogService.create(
        db=db,
        action="update_tenant",
        resource="tenants",
        details={"old": old_details, "new": new_details},
        user_id=admin_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    await db.refresh(tenant)
    
    return tenant
