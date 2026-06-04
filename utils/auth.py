import base64
import hashlib
import hmac
import json
import time

import secrets
import os

from fastapi import HTTPException, Request
from dotenv import load_dotenv

load_dotenv()

API_KEY = (os.getenv("API_KEY") or "").strip()
WEBADMIN = (os.getenv("WEBADMIN") or "admin").strip()
WEBPASSWORD = (os.getenv("WEBPASSWORD") or "").strip()
TOKEN_TTL_SECONDS = int(os.getenv("AUTH_TOKEN_TTL_SECONDS", "43200"))


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(payload: str) -> str:
    return _b64encode(hmac.new(API_KEY.encode(), payload.encode(), hashlib.sha256).digest())


def create_access_token(username: str) -> str:
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API authentication is not configured")

    payload = _b64encode(json.dumps(
        {
            "sub": username,
            "exp": int(time.time()) + TOKEN_TTL_SECONDS,
        },
        separators=(",", ":"),
    ).encode())
    return f"bm.{payload}.{_sign(payload)}"


def verify_access_token(token: str) -> bool:
    if not API_KEY or not token.startswith("bm."):
        return False

    try:
        _prefix, payload, signature = token.split(".", 2)
        if not secrets.compare_digest(signature, _sign(payload)):
            return False
        data = json.loads(_b64decode(payload))
        return int(data.get("exp", 0)) >= int(time.time())
    except Exception:
        return False


def authenticate_credentials(username: str, password: str) -> str:
    if not API_KEY or not WEBADMIN or not WEBPASSWORD:
        raise HTTPException(status_code=500, detail="Authentication is not configured")

    if (
        secrets.compare_digest((username or "").strip(), WEBADMIN)
        and secrets.compare_digest((password or "").strip(), WEBPASSWORD)
    ):
        return create_access_token(WEBADMIN)

    raise HTTPException(status_code=401, detail="Invalid username or password")


def authenticate(request: Request):
    api_key = (request.headers.get("X-API-Key") or "").strip()
    authorization = (request.headers.get("Authorization") or "").strip()
    bearer = authorization[7:].strip() if authorization.lower().startswith("bearer ") else ""

    if API_KEY and api_key and secrets.compare_digest(api_key, API_KEY):
        return True

    token = bearer or api_key
    if token and verify_access_token(token):
        return True

    if not API_KEY:
        raise HTTPException(status_code=500, detail="API authentication is not configured")

    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    raise HTTPException(status_code=401, detail="Unauthorized")
