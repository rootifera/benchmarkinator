from fastapi import Depends, HTTPException
from fastapi.security.api_key import APIKeyHeader

# Static API key (you can later move this to an environment variable for security)
API_KEY = "supersecurebenchmarkinatorkey"
API_KEY_NAME = "X-API-Key"

# FastAPI dependency for the API key
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def authenticate(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
