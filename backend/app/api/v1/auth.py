from fastapi import APIRouter, HTTPException, status
from app.models.user import LoginRequest, TokenResponse
from app.db.repositories.user_repo import UserRepository
from app.services.auth_service import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    repo = UserRepository()
    user = await repo.find_by_email(body.email)

    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user["id"], user["email"])
    return {"access_token": token, "token_type": "bearer"}