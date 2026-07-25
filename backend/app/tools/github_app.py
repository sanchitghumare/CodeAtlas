import time
import httpx
from pathlib import Path

import jwt # type: ignore
from app.services.config import GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY

def _app_jwt() -> str:
    private_key = GITHUB_APP_PRIVATE_KEY
    now = int(time.time())
    payload = {"iat": now - 60, "exp": now + 570, "iss": GITHUB_APP_ID}
    return jwt.encode(payload, private_key, algorithm="RS256")

def get_installation_token(installation_id: str) -> str:
    """Mint a short-lived (1hr) installation access token. Never persisted."""
    app_jwt = _app_jwt()
    resp = httpx.post(
        f"https://api.github.com/app/installations/{installation_id}/access_tokens",
        headers={
            "Authorization": f"Bearer {app_jwt}",
            "Accept": "application/vnd.github+json",
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()["token"]