from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
import hashlib
import warnings

# Suppress passlib's bcrypt version warning (cosmetic only)
warnings.filterwarnings("ignore", ".*error reading bcrypt version.*")
warnings.filterwarnings("ignore", ".*trapped.*bcrypt.*")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prep(password: str) -> bytes:
    """
    SHA-256 hash the password first so any-length input is safely handled.
    The hex digest is always 64 ASCII chars → 64 bytes, well under bcrypt's 72-byte limit.
    Slicing [:72] is a belt-and-suspenders guard for all bcrypt backend versions.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()[:72].encode("utf-8")


def hash_password(password: str) -> str:
    return pwd_context.hash(_prep(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prep(plain), hashed)


def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None