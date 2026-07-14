from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Union
import jwt
import bcrypt
import pyotp
from app.core.config import settings

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed value."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of the password."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(subject: Union[str, int], tenant_id: int, expires_delta: timedelta = None) -> str:
    """Create a short-lived access JWT token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": tenant_id,
        "type": "access"
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(subject: Union[str, int], tenant_id: int, expires_delta: timedelta = None) -> str:
    """Create a long-lived refresh JWT token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": tenant_id,
        "type": "refresh"
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies a JWT token.
    Raises jwt.PyJWTError if invalid.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

# TOTP MFA helpers
def generate_totp_secret() -> str:
    """Generate a random base32 MFA secret for TOTP."""
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str, tenant_name: str = "College ERP") -> str:
    """Get the TOTP provisioning URI for QR code configuration."""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=tenant_name)

def verify_totp(secret: str, code: str) -> bool:
    """Verify a 6-digit TOTP code against the secret."""
    totp = pyotp.totp.TOTP(secret)
    return totp.verify(code, valid_window=1)
