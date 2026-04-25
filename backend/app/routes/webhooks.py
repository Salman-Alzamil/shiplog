import hashlib
import hmac
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChangelogEntry, Project
from ..services.ai import generate_changelog_entry

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_signature(payload: bytes, signature: str | None, secret: str) -> bool:
    if not signature:
        return False
    expected = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/github/{webhook_token}")
async def receive_github_webhook(
    webhook_token: str,
    request: Request,
    x_hub_signature_256: str | None = Header(default=None),
    x_github_event: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.webhook_token == webhook_token).first()
    if not project:
        raise HTTPException(status_code=404, detail="Unknown webhook token")

    body = await request.body()

    if not _verify_signature(body, x_hub_signature_256, project.webhook_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    if x_github_event != "pull_request":
        return {"status": "ignored", "reason": "not a pull_request event"}

    payload = await request.json()
    action = payload.get("action")
    pr = payload.get("pull_request", {})

    if action != "closed" or not pr.get("merged"):
        return {"status": "ignored", "reason": "PR not merged"}

    pr_number = pr.get("number")
    # Deduplicate: skip if we already have an entry for this PR
    existing = (
        db.query(ChangelogEntry)
        .filter(
            ChangelogEntry.project_id == project.id,
            ChangelogEntry.pr_number == pr_number,
        )
        .first()
    )
    if existing:
        return {"status": "ignored", "reason": "duplicate"}

    try:
        generated = generate_changelog_entry(
            pr_title=pr.get("title", ""),
            pr_body=pr.get("body"),
            repo_name=project.repo_name,
        )
    except Exception:
        # Don't fail the webhook if AI generation fails; store raw PR data
        generated = {
            "title": pr.get("title", ""),
            "summary": pr.get("body") or "No description provided.",
            "category": "improvement",
        }

    entry = ChangelogEntry(
        project_id=project.id,
        pr_number=pr_number,
        pr_title=pr.get("title"),
        pr_body=pr.get("body"),
        pr_url=pr.get("html_url"),
        pr_merged_by=pr.get("merged_by", {}).get("login"),
        generated_title=generated["title"],
        generated_summary=generated["summary"],
        category=generated["category"],
        is_published=True,
        published_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()

    return {"status": "ok", "entry_id": entry.id}
