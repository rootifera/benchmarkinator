# main.py
from datetime import datetime
import time
import os
from threading import Lock
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.sql import text
from sqlmodel import Session, select

from routers import cpu, gpu, motherboard, ram, disk, oses, config, benchmark, benchmark_results
from models.benchmark import Benchmark, BenchmarkOption, BenchmarkTarget
from models.benchmark_results import BenchmarkResult
from models.config import Config
from models.cpu import CPU, CPUBrand, CPUFamily
from models.disk import Disk
from models.gpu import GPU, GPUBrand, GPUManufacturer, GPUModel, GPUVRAMType
from models.motherboard import Motherboard, MotherboardChipset, MotherboardManufacturer
from models.oses import OS
from models.ram import RAM
from utils.auth import (
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_SAMESITE,
    AUTH_COOKIE_SECURE,
    TOKEN_TTL_SECONDS,
    WEBADMIN,
    authenticate,
    authenticate_credentials,
    check_login_rate_limit,
    clear_login_rate_limit,
)
from utils.hardware_loader import run_if_enabled
from database import init_db, engine


def _allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if raw == "":
        return []
    if raw == "*":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


def _client_id(request: Request) -> str:
    forwarded_for = (request.headers.get("X-Forwarded-For") or "").split(",", 1)[0].strip()
    if forwarded_for:
        return forwarded_for
    return request.client.host if request.client else "unknown"


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
def login(payload: LoginRequest, request: Request, response: Response):
    client_id = _client_id(request)
    check_login_rate_limit(client_id)
    token = authenticate_credentials(payload.username, payload.password)
    clear_login_rate_limit(client_id)
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=TOKEN_TTL_SECONDS,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path="/api",
    )
    return {
        "expires_in": TOKEN_TTL_SECONDS,
        "user": {
            "username": payload.username,
            "role": "admin",
        },
    }


@auth_app.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path="/api",
    )
    return {"status": "ok"}


@auth_app.get("/session")
def session(request: Request):
    authenticate(request)
    return {
        "user": {
            "username": WEBADMIN,
            "role": "admin",
        },
        "expires_in": TOKEN_TTL_SECONDS,
    }


app.mount("/api/auth", auth_app)

public_app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)
PUBLIC_RESULTS_CACHE_SECONDS = int(os.getenv("PUBLIC_RESULTS_CACHE_SECONDS", "15"))
_public_results_cache_lock = Lock()
_public_results_cache: tuple[float, dict] | None = None


@public_app.get("/results-data")
def public_results_data(response: Response):
    global _public_results_cache

    now = time.monotonic()
    with _public_results_cache_lock:
        if (
            _public_results_cache is not None
            and now - _public_results_cache[0] < PUBLIC_RESULTS_CACHE_SECONDS
        ):
            response.headers["Cache-Control"] = f"public, max-age={PUBLIC_RESULTS_CACHE_SECONDS}"
            response.headers["X-Cache"] = "HIT"
            return _public_results_cache[1]

    with Session(engine) as session:
        payload = {
            "results": session.exec(select(BenchmarkResult)).all(),
            "benchmarks": session.exec(select(Benchmark)).all(),
            "benchmarkOptions": session.exec(select(BenchmarkOption)).all(),
            "benchmarkTargets": session.exec(select(BenchmarkTarget)).all(),
            "configurations": session.exec(select(Config)).all(),
            "cpus": session.exec(select(CPU)).all(),
            "gpus": session.exec(select(GPU)).all(),
            "cpuBrands": session.exec(select(CPUBrand)).all(),
            "cpuFamilies": session.exec(select(CPUFamily)).all(),
            "gpuManufacturers": session.exec(select(GPUManufacturer)).all(),
            "gpuBrands": session.exec(select(GPUBrand)).all(),
            "gpuModels": session.exec(select(GPUModel)).all(),
            "gpuVramTypes": session.exec(select(GPUVRAMType)).all(),
            "motherboards": session.exec(select(Motherboard)).all(),
            "motherboardManufacturers": session.exec(select(MotherboardManufacturer)).all(),
            "motherboardChipsets": session.exec(select(MotherboardChipset)).all(),
            "ramTypes": session.exec(select(RAM)).all(),
            "disks": session.exec(select(Disk)).all(),
            "oses": session.exec(select(OS)).all(),
        }

    with _public_results_cache_lock:
        _public_results_cache = (time.monotonic(), payload)

    response.headers["Cache-Control"] = f"public, max-age={PUBLIC_RESULTS_CACHE_SECONDS}"
    response.headers["X-Cache"] = "MISS"
    return payload


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
