from typing import Dict, Any, List, Optional
from sqlalchemy import Integer, String, Boolean, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantMixin, EncryptedString

class User(Base, TimestampMixin, TenantMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # MFA fields
    mfa_secret: Mapped[str] = mapped_column(String(100), nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # PII encrypted fields
    phone_encrypted: Mapped[str] = mapped_column(EncryptedString(500), nullable=True)
    address_encrypted: Mapped[str] = mapped_column(EncryptedString(1000), nullable=True)

    # Helper properties for transparent mapping
    @property
    def phone(self) -> Optional[str]:
        return self.phone_encrypted

    @phone.setter
    def phone(self, value: Optional[str]) -> None:
        self.phone_encrypted = value

    @property
    def address(self) -> Optional[str]:
        return self.address_encrypted

    @address.setter
    def address(self, value: Optional[str]) -> None:
        self.address_encrypted = value

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("tenant_id", "username", name="uq_users_tenant_id_username"),
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_id_email"),
    )

class UserRole(Base, TimestampMixin, TenantMixin):
    __tablename__ = "user_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., super_admin, college_admin, hod, faculty, student, parent, accountant, librarian, support_staff
    scope: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    user = relationship("User", back_populates="roles")

    __table_args__ = (
        UniqueConstraint("user_id", "role_type", name="uq_user_roles_user_id_role_type"),
    )
