from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class TenantBase(BaseModel):
    name: str = Field(..., max_length=255, description="Name of the institution")
    subdomain: str = Field(..., max_length=100, description="Institution unique subdomain")
    subscription_tier: str = Field(default="standard", max_length=50)
    config: Dict[str, Any] = Field(default_factory=dict)

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    subdomain: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    subscription_tier: Optional[str] = Field(None, max_length=50)
    config: Optional[Dict[str, Any]] = None

class TenantResponse(TenantBase):
    id: int
    status: str

    class Config:
        from_attributes = True
