from pydantic import BaseModel, EmailStr
from typing import Optional


class UserInDB(BaseModel):
    id: str
    email: str
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"