from fastapi import HTTPException, Request
import secrets
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = (os.getenv("API_KEY") or "").strip()


def authenticate(request: Request):
    api_key = (request.headers.get("X-API-Key") or "").strip()
    if not API_KEY or not api_key or not secrets.compare_digest(api_key, API_KEY):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True
