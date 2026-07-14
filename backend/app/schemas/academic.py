from typing import Optional
from pydantic import BaseModel, Field

class DepartmentBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    hod_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=255)
    hod_id: Optional[int] = None

class DepartmentResponse(DepartmentBase):
    id: int
    tenant_id: int

    class Config:
        from_attributes = True

class ProgramBase(BaseModel):
    department_id: int
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    duration_years: int = Field(default=4, ge=1)
    total_credits: int = Field(default=160, ge=1)

class ProgramCreate(ProgramBase):
    pass

class ProgramUpdate(BaseModel):
    department_id: Optional[int] = None
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=255)
    duration_years: Optional[int] = Field(None, ge=1)
    total_credits: Optional[int] = Field(None, ge=1)

class ProgramResponse(ProgramBase):
    id: int
    tenant_id: int

    class Config:
        from_attributes = True
