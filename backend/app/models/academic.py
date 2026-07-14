from sqlalchemy import Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, TenantMixin

class Department(Base, TimestampMixin, TenantMixin):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hod_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="departments")
    hod = relationship("User", foreign_keys=[hod_id])
    programs = relationship("Program", back_populates="department", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_departments_tenant_id_code"),
    )

class Program(Base, TimestampMixin, TenantMixin):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    department_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    duration_years: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    total_credits: Mapped[int] = mapped_column(Integer, nullable=False, default=160)

    # Relationships
    department = relationship("Department", back_populates="programs")

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_programs_tenant_id_code"),
    )
