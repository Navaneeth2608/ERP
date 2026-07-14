from datetime import datetime
from typing import Dict, Any
from sqlalchemy import Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)          # e.g., create_user, update_department, login_success
    resource: Mapped[str] = mapped_column(String(100), nullable=False)        # e.g., users, departments, programs
    details: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)  # e.g., {"old": ..., "new": ...} or error info
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="audit_logs")
