from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    tenant_id: Optional[int]
    user_id: Optional[int]
    action: str
    resource: str
    details: Dict[str, Any]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True
