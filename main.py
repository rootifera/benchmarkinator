from fastapi import FastAPI, Depends
from routers import cpu
from database import init_db
from utils.auth import authenticate

app = FastAPI(dependencies=[Depends(authenticate)])


init_db()


app.include_router(cpu.router, prefix="/api", tags=["CPU"])

@app.get("/")
def read_root():
    return {"message": "Welcome to The Benchmarkinator!"}
