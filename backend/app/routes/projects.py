import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Project, User

router = APIRouter(prefix="/api/projects", tags=["projects"])
security = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class CreateProjectRequest(BaseModel):
    repo_owner: str
    repo_name: str


class ProjectResponse(BaseModel):
    id: int
    repo_owner: str
    repo_name: str
    slug: str
    webhook_url: str
    webhook_secret: str

    model_config = {"from_attributes": True}


def _make_slug(owner: str, name: str) -> str:
    base = f"{owner}-{name}".lower().replace("/", "-").replace("_", "-")
    return f"{base}-{secrets.token_hex(4)}"


@router.get("/", response_model=list[ProjectResponse])
def list_projects(
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    request=None,
):
    projects = db.query(Project).filter(Project.user_id == user.id).all()
    return [_to_response(p) for p in projects]


@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(
    body: CreateProjectRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Project)
        .filter(
            Project.user_id == user.id,
            Project.repo_owner == body.repo_owner,
            Project.repo_name == body.repo_name,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Project already connected")

    project = Project(
        user_id=user.id,
        repo_owner=body.repo_owner,
        repo_name=body.repo_name,
        webhook_token=secrets.token_urlsafe(24),
        webhook_secret=secrets.token_urlsafe(24),
        slug=_make_slug(body.repo_owner, body.repo_name),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_response(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()


def _to_response(p: Project) -> dict:
    base_url = settings.base_url
    return {
        "id": p.id,
        "repo_owner": p.repo_owner,
        "repo_name": p.repo_name,
        "slug": p.slug,
        "webhook_url": f"{base_url}/webhooks/github/{p.webhook_token}",
        "webhook_secret": p.webhook_secret,
    }
