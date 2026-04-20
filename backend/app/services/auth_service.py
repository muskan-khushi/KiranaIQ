from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
import hashlib

# Suppress passlib's bcrypt version warning (cosmetic only, does not affect correctness)
import warnings
warnings.filterwarnings("ignore", ".*error reading bcrypt version.*")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prep(password: str) -> str:
    """
    bcrypt has a hard 72-byte limit. SHA-256 the password first so
    any length password is safely handled. The hex digest is always 64 chars
    which is safely under the 72-byte limit.

    Note: some versions of the `bcrypt` C library raise a ValueError during
    passlib's internal wrap-bug detection when the test vector exceeds 72 bytes.
    The _prep() step also sidesteps that internal test since our secrets are
    always exactly 64 bytes.
    """
    return hashlib.sha256(password.encode()).hexdigest()  # always 64 chars


def hash_password(password: str) -> str:
    prepped = _prep(password)
    # Explicitly encode to bytes and slice to 72 to be 100% safe across
    # all bcrypt backend versions (pyca/bcrypt >= 4.x raises on > 72 bytes)
    return pwd_context.hash(prepped[:72])


def verify_password(plain: str, hashed: str) -> bool:
    prepped = _prep(plain)
    return pwd_context.verify(prepped[:72], hashed)


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