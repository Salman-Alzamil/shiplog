import json
import anthropic
from ..config import settings

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


def generate_changelog_entry(pr_title: str, pr_body: str | None, repo_name: str) -> dict:
    """Turn a merged PR into a user-facing changelog entry.

    Returns {"title": str, "summary": str, "category": "feature"|"fix"|"improvement"}
    """
    prompt = f"""You are writing a changelog entry for a software product called "{repo_name}".

A pull request was just merged:
Title: {pr_title}
Description: {pr_body or "No description provided."}

Write a concise, user-friendly changelog entry. Return ONLY valid JSON with these keys:
- "title": Short title written for end users, not developers (max 8 words, no jargon)
- "summary": 1-2 sentences describing what changed and why the user cares
- "category": exactly one of "feature", "fix", or "improvement"

Focus on user impact. Use plain language. Do not include markdown or extra text."""

    message = _get_client().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text.strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    parsed = json.loads(text[start:end])

    # Normalise category in case the model drifts
    if parsed.get("category") not in ("feature", "fix", "improvement"):
        parsed["category"] = "improvement"

    return parsed
