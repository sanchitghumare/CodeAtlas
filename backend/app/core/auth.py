# app/core/auth.py

import os

from fastapi import Header, HTTPException

INTERNAL_TOKEN = os.getenv("INTERNAL_API_TOKEN")

async def verify_internal_token(
    x_internal_token: str | None = Header(default=None),
):
    if x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )