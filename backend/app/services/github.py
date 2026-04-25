import httpx
from ..config import settings

GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL = "https://api.github.com"


def get_oauth_url(state: str) -> str:
    return (
        f"{GITHUB_OAUTH_URL}"
        f"?client_id={settings.github_client_id}"
        f"&scope=read:user,user:email"
        f"&state={state}"
    )


async def exchange_code_for_token(code: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        data = response.json()
        return data.get("access_token", "")


async def get_github_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GITHUB_API_URL}/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        return response.json()
