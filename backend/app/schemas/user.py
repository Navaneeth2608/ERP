from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    email: EmailStr
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role_type: str = Field(default="student", description="Initial role of the user")

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None

class UserRoleResponse(BaseModel):
    id: int
    role_type: str
    scope: Dict[str, Any]

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    tenant_id: int
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    mfa_enabled: bool
    roles: List[UserRoleResponse] = []
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str
    mfa_code: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    mfa_required: bool = False

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class MfaSetupResponse(BaseModel):
    secret: str
    qr_code_uri: str

class MfaVerifyRequest(BaseModel):
    code: str
