import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from jose import jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..services.github import exchange_code_for_token, get_github_user, get_oauth_url

router = APIRouter(prefix="/auth", tags=["auth"])

# In production use Redis; this is fine for a single-process v1
_pending_states: set[str] = set()


def create_jwt(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


@router.get("/github")
def github_login():
    state = secrets.token_urlsafe(16)
    _pending_states.add(state)
    return RedirectResponse(get_oauth_url(state))


@router.get("/github/callback")
async def github_callback(code: str, state: str, db: Session = Depends(get_db)):
    if state not in _pending_states:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    _pending_states.discard(state)

    access_token = await exchange_code_for_token(code)
    if not access_token:
        raise HTTPException(status_code=400, detail="GitHub token exchange failed")

    gh_user = await get_github_user(access_token)
    github_id = gh_user.get("id")
    if not github_id:
        raise HTTPException(status_code=400, detail="Could not fetch GitHub user")

    user = db.query(User).filter(User.github_id == github_id).first()
    if user:
        user.github_access_token = access_token
        user.github_username = gh_user.get("login", "")
    else:
        user = User(
            github_id=github_id,
            github_username=gh_user.get("login", ""),
            github_access_token=access_token,
            email=gh_user.get("email"),
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    token = create_jwt(user.id)
    return RedirectResponse(f"{settings.frontend_url}/dashboard?token={token}")
