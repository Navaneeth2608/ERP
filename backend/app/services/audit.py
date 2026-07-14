from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from app.core.tenant import get_current_tenant_id

class AuditLogService:
    @staticmethod
    async def create(
        db: AsyncSession,
        action: str,
        resource: str,
        details: Dict[str, Any],
        user_id: Optional[int] = None,
        tenant_id: Optional[int] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Creates and persists an audit log record.
        """
        # Resolve tenant_id if not explicitly provided
        if tenant_id is None:
            tenant_id = get_current_tenant_id()

        audit_log = AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address
        )
        
        db.add(audit_log)
        # Flush to populate default database-generated fields (like ID and timestamp) without committing
        await db.flush()
        return audit_log
