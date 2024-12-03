from fastapi import HTTPException, Request

API_KEY = "your_api_key_here"

def authenticate(request: Request):
    api_key = request.headers.get("X-API-Key")
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True
