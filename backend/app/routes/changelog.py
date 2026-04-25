from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChangelogEntry, Project, User
from .projects import get_current_user

router = APIRouter(tags=["changelog"])


class EntryResponse(BaseModel):
    id: int
    pr_number: int | None
    pr_url: str | None
    generated_title: str | None
    generated_summary: str | None
    category: str
    is_published: bool
    published_at: str | None

    model_config = {"from_attributes": True}


class UpdateEntryRequest(BaseModel):
    generated_title: str | None = None
    generated_summary: str | None = None
    category: str | None = None
    is_published: bool | None = None


def _serialize(entry: ChangelogEntry) -> dict:
    return {
        "id": entry.id,
        "pr_number": entry.pr_number,
        "pr_url": entry.pr_url,
        "generated_title": entry.generated_title,
        "generated_summary": entry.generated_summary,
        "category": entry.category,
        "is_published": entry.is_published,
        "published_at": entry.published_at.isoformat() if entry.published_at else None,
    }


# Public endpoint — no auth required
@router.get("/public/{slug}")
def public_changelog(slug: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.slug == slug).first()
    if not project:
        raise HTTPException(status_code=404, detail="Changelog not found")

    entries = (
        db.query(ChangelogEntry)
        .filter(ChangelogEntry.project_id == project.id, ChangelogEntry.is_published == True)
        .order_by(ChangelogEntry.published_at.desc())
        .all()
    )
    return {
        "repo_owner": project.repo_owner,
        "repo_name": project.repo_name,
        "entries": [_serialize(e) for e in entries],
    }


# Authenticated endpoints
@router.get("/api/projects/{project_id}/entries")
def list_entries(
    project_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    entries = (
        db.query(ChangelogEntry)
        .filter(ChangelogEntry.project_id == project.id)
        .order_by(ChangelogEntry.published_at.desc())
        .all()
    )
    return [_serialize(e) for e in entries]


@router.patch("/api/entries/{entry_id}")
def update_entry(
    entry_id: int,
    body: UpdateEntryRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    entry = db.query(ChangelogEntry).filter(ChangelogEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Verify ownership through project → user
    project = db.query(Project).filter(Project.id == entry.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not your entry")

    if body.generated_title is not None:
        entry.generated_title = body.generated_title
    if body.generated_summary is not None:
        entry.generated_summary = body.generated_summary
    if body.category is not None:
        entry.category = body.category
    if body.is_published is not None:
        entry.is_published = body.is_published

    db.commit()
    db.refresh(entry)
    return _serialize(entry)


@router.delete("/api/entries/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    entry = db.query(ChangelogEntry).filter(ChangelogEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    project = db.query(Project).filter(Project.id == entry.project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not your entry")

    db.delete(entry)
    db.commit()
