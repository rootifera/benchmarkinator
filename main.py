# main.py
from datetime import datetime
import time
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.sql import text
from sqlmodel import Session, select

from routers import cpu, gpu, motherboard, ram, disk, oses, config, benchmark, benchmark_results
from models.benchmark import Benchmark
from models.benchmark_results import BenchmarkResult
from models.config import Config
from models.cpu import CPU, CPUBrand, CPUFamily
from models.gpu import GPU, GPUBrand, GPUManufacturer, GPUModel
from utils.auth import authenticate, authenticate_credentials, TOKEN_TTL_SECONDS
from utils.hardware_loader import run_if_enabled
from database import init_db, engine


def _allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "*").strip()
    if raw == "*" or raw == "":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    run_if_enabled()
    yield


app = FastAPI(
    lifespan=lifespan,
    dependencies=[Depends(authenticate)],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)


class LoginRequest(BaseModel):
    username: str
    password: str


@auth_app.post("/login")
def login(payload: LoginRequest):
    token = authenticate_credentials(payload.username, payload.password)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": TOKEN_TTL_SECONDS,
        "user": {
            "username": payload.username,
            "role": "admin",
        },
    }


app.mount("/api/auth", auth_app)

public_app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)


@public_app.get("/results-data")
def public_results_data():
    with Session(engine) as session:
        return {
            "results": session.exec(select(BenchmarkResult)).all(),
            "benchmarks": session.exec(select(Benchmark)).all(),
            "configurations": session.exec(select(Config)).all(),
            "cpus": session.exec(select(CPU)).all(),
            "gpus": session.exec(select(GPU)).all(),
            "cpuBrands": session.exec(select(CPUBrand)).all(),
            "cpuFamilies": session.exec(select(CPUFamily)).all(),
            "gpuManufacturers": session.exec(select(GPUManufacturer)).all(),
            "gpuBrands": session.exec(select(GPUBrand)).all(),
            "gpuModels": session.exec(select(GPUModel)).all(),
        }


app.mount("/api/public", public_app)

# Routers
app.include_router(cpu.router, prefix="/api/cpu", tags=["CPU"])
app.include_router(gpu.router, prefix="/api/gpu", tags=["GPU"])
app.include_router(motherboard.router, prefix="/api/motherboard", tags=["Motherboard"])
app.include_router(ram.router, prefix="/api/ram", tags=["RAM"])
app.include_router(disk.router, prefix="/api/disk", tags=["Disk"])
app.include_router(oses.router, prefix="/api/oses", tags=["OS"])
app.include_router(config.router, prefix="/api/config", tags=["Config"])
app.include_router(benchmark.router, prefix="/api/benchmark", tags=["Benchmark"])
app.include_router(benchmark_results.router, prefix="/api/benchmark_results", tags=["Benchmark Results"])

healthz_app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)


@healthz_app.get("/", include_in_schema=False)
def healthz():
    return {"status": "ok"}


readyz_app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)


@readyz_app.get("/", include_in_schema=False)
def readyz():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ready"}


app.mount("/healthz", healthz_app)
app.mount("/readyz", readyz_app)


@app.get("/")
def read_root():
    version = datetime.now().strftime("%d%m%Y")
    return {
        "app": "benchmarkinator-api",
        "version": version,
        "db": "mysql",
        "build_no": int(time.time()),
        "build_name": "Manuel Cavalera",
    }
