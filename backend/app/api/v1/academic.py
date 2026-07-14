from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.academic import Department, Program
from app.schemas.academic import (
    DepartmentCreate, DepartmentResponse, DepartmentUpdate,
    ProgramCreate, ProgramResponse, ProgramUpdate
)
from app.schemas.common import PaginationParams, PaginatedResponse, PaginationMetadata
from app.services.audit import AuditLogService

router = APIRouter()

# --- Departments Endpoints ---

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    dept_in: DepartmentCreate,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("departments:create")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Create a new department inside the active tenant space.
    """
    # Check duplicate code under active tenant context
    dup = await db.execute(
        select(Department).where(Department.code == dept_in.code)
    )
    if dup.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department with code '{dept_in.code}' already exists."
        )
        
    dept = Department(
        code=dept_in.code,
        name=dept_in.name,
        hod_id=dept_in.hod_id,
        tenant_id=tenant.id
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    
    await AuditLogService.create(
        db=db,
        action="create_department",
        resource="departments",
        details={"code": dept.code, "name": dept.name},
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return dept

@router.get("/departments", response_model=PaginatedResponse[DepartmentResponse])
async def list_departments(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("departments:read")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    List all departments belonging to the active tenant.
    """
    # Count scoped to tenant (automatically enforced by query listener)
    count_result = await db.execute(select(Department))
    total = len(count_result.scalars().all())
    
    offset = (pagination.page - 1) * pagination.limit
    query = select(Department).offset(offset).limit(pagination.limit)
    result = await db.execute(query)
    depts = result.scalars().all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        data=list(depts),
        pagination=PaginationMetadata(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            pages=pages
        )
    )

@router.get("/departments/{dept_id}", response_model=DepartmentResponse)
async def get_department(
    dept_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("departments:read")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Fetch a single department's profile.
    """
    result = await db.execute(
        select(Department).where(Department.id == dept_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    return dept

@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: int,
    dept_update: DepartmentUpdate,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("departments:update")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Update department settings/attributes.
    """
    result = await db.execute(
        select(Department).where(Department.id == dept_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
        
    old_details = {"code": dept.code, "name": dept.name, "hod_id": dept.hod_id}
    
    if dept_update.code is not None:
        if dept_update.code != dept.code:
            dup = await db.execute(select(Department).where(Department.code == dept_update.code))
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Department code already in use.")
        dept.code = dept_update.code
    if dept_update.name is not None:
        dept.name = dept_update.name
    if dept_update.hod_id is not None:
        dept.hod_id = dept_update.hod_id
        
    await db.commit()
    await db.refresh(dept)
    
    new_details = {"code": dept.code, "name": dept.name, "hod_id": dept.hod_id}
    await AuditLogService.create(
        db=db,
        action="update_department",
        resource="departments",
        details={"old": old_details, "new": new_details},
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return dept

@router.delete("/departments/{dept_id}")
async def delete_department(
    dept_id: int,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("departments:delete")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Removes a department record from the system.
    """
    result = await db.execute(
        select(Department).where(Department.id == dept_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
        
    await db.delete(dept)
    await db.commit()
    
    await AuditLogService.create(
        db=db,
        action="delete_department",
        resource="departments",
        details={"code": dept.code, "name": dept.name},
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return {"status": "success", "message": "Department deleted."}


# --- Programs Endpoints ---

@router.post("/programs", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
    prog_in: ProgramCreate,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("programs:create")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Create a new program within the active tenant space.
    """
    # Verify department exists under tenant (automatically filtered)
    result_dept = await db.execute(
        select(Department).where(Department.id == prog_in.department_id)
    )
    if not result_dept.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Associated Department not found.")

    dup = await db.execute(
        select(Program).where(Program.code == prog_in.code)
    )
    if dup.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Program with code '{prog_in.code}' already exists."
        )

    prog = Program(
        department_id=prog_in.department_id,
        code=prog_in.code,
        name=prog_in.name,
        duration_years=prog_in.duration_years,
        total_credits=prog_in.total_credits,
        tenant_id=tenant.id
    )
    db.add(prog)
    await db.commit()
    await db.refresh(prog)

    await AuditLogService.create(
        db=db,
        action="create_program",
        resource="programs",
        details={"code": prog.code, "name": prog.name},
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return prog

@router.get("/programs", response_model=PaginatedResponse[ProgramResponse])
async def list_programs(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("programs:read")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    List all programs inside the active tenant space.
    """
    count_result = await db.execute(select(Program))
    total = len(count_result.scalars().all())

    offset = (pagination.page - 1) * pagination.limit
    query = select(Program).offset(offset).limit(pagination.limit)
    result = await db.execute(query)
    progs = result.scalars().all()

    pages = (total + pagination.limit - 1) // pagination.limit

    return PaginatedResponse(
        data=list(progs),
        pagination=PaginationMetadata(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            pages=pages
        )
    )

@router.get("/programs/{prog_id}", response_model=ProgramResponse)
async def get_program(
    prog_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("programs:read")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Retrieve program details.
    """
    result = await db.execute(
        select(Program).where(Program.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found.")
    return prog

@router.put("/programs/{prog_id}", response_model=ProgramResponse)
async def update_program(
    prog_id: int,
    prog_update: ProgramUpdate,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("programs:update")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Update program attributes.
    """
    result = await db.execute(
        select(Program).where(Program.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found.")

    old_details = {
        "code": prog.code,
        "name": prog.name,
        "department_id": prog.department_id,
        "duration_years": prog.duration_years,
        "total_credits": prog.total_credits
    }

    if prog_update.department_id is not None:
        result_dept = await db.execute(
            select(Department).where(Department.id == prog_update.department_id)
        )
        if not result_dept.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Associated Department not found.")
        prog.department_id = prog_update.department_id

    if prog_update.code is not None:
        if prog_update.code != prog.code:
            dup = await db.execute(select(Program).where(Program.code == prog_update.code))
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Program code already in use.")
        prog.code = prog_update.code

    if prog_update.name is not None:
        prog.name = prog_update.name
    if prog_update.duration_years is not None:
        prog.duration_years = prog_update.duration_years
    if prog_update.total_credits is not None:
        prog.total_credits = prog_update.total_credits

    await db.commit()
    await db.refresh(prog)

    new_details = {
        "code": prog.code,
        "name": prog.name,
        "department_id": prog.department_id,
        "duration_years": prog.duration_years,
        "total_credits": prog.total_credits
    }
    await AuditLogService.create(
        db=db,
        action="update_program",
        resource="programs",
        details={"old": old_details, "new": new_details},
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return prog

@router.delete("/programs/{prog_id}")
async def delete_program(
    prog_id: int,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.require_permission("programs:delete")),
    tenant = Depends(deps.get_current_tenant)
):
    """
    Remove a program.
    """
    result = await db.execute(
        select(Program).where(Program.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found.")

    await db.delete(prog)
    await db.commit()

    await AuditLogService.create(
        db=db,
        action="delete_program",
        resource="programs",
        details={"code": prog.code, "name": prog.name},
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return {"status": "success", "message": "Program deleted."}
