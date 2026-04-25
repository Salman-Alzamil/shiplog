import re


def generate_changelog_entry(pr_title: str, pr_body: str | None, repo_name: str) -> dict:
    """Format a merged PR as a changelog entry without any external API call.

    Infers category from common PR title prefixes (feat/fix/chore etc.).
    Returns {"title": str, "summary": str, "category": "feature"|"fix"|"improvement"}
    """
    title = _strip_prefix(pr_title)
    category = _infer_category(pr_title)
    summary = (pr_body or "").strip() or title

    return {"title": title, "summary": summary, "category": category}


_PREFIX_RE = re.compile(
    r"^(feat|feature|fix|bug|chore|refactor|perf|style|docs|test|ci|build|revert)"
    r"(\([^)]*\))?[!:]?\s*",
    re.IGNORECASE,
)


def _strip_prefix(title: str) -> str:
    return _PREFIX_RE.sub("", title).strip().capitalize()


def _infer_category(title: str) -> str:
    lower = title.lower()
    if re.match(r"(feat|feature)", lower):
        return "feature"
    if re.match(r"(fix|bug)", lower):
        return "fix"
    return "improvement"
