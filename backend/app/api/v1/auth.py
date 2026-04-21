from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import LoginRequest, TokenResponse
from app.db.repositories.user_repo import UserRepository
from app.services.auth_service import verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])
bearer_scheme = HTTPBearer()


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


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """
    Accept a (possibly near-expired) valid JWT and issue a fresh one.
    The old token must still be decodable (not expired) for this to work.
    """
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token — please login again",
        )

    # Re-validate the user still exists and is active
    repo = UserRepository()
    user = await repo.find_by_id(payload["sub"])
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_token = create_access_token(user["id"], user["email"])
    return {"access_token": new_token, "token_type": "bearer"}