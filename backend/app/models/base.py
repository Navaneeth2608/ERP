from datetime import datetime
from sqlalchemy import DateTime, Integer, ForeignKey, String
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func
from cryptography.fernet import Fernet
from app.core.config import settings

class Base(DeclarativeBase):
    pass

class EncryptedString(TypeDecorator):
    """
    SQLAlchemy Custom Type for transparently encrypting data at rest using Fernet symmetric encryption.
    """
    impl = String
    cache_ok = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        key = settings.ENCRYPTION_KEY.encode()
        self.fernet = Fernet(key)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return self.fernet.encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return self.fernet.decrypt(value.encode()).decode()
        except Exception:
            # Fallback to returning the encrypted string if decryption fails
            return value

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class TenantMixin:
    tenant_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
