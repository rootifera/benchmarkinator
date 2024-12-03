from fastapi import FastAPI, Depends
from routers import cpu, gpu, motherboard, ram, disk, oses, config, benchmark
from utils.auth import authenticate
from database import init_db

app = FastAPI(dependencies=[Depends(authenticate)])

app.include_router(cpu.router, prefix="/api/cpu", tags=["CPU"])
app.include_router(gpu.router, prefix="/api/gpu", tags=["GPU"])
app.include_router(motherboard.router, prefix="/api/motherboard", tags=["Motherboard"])
app.include_router(ram.router, prefix="/api/ram", tags=["RAM"])
app.include_router(disk.router, prefix="/api/disk", tags=["Disk"])
app.include_router(oses.router, prefix="/api/oses", tags=["OS"])
app.include_router(config.router, prefix="/api/config", tags=["Config"])
app.include_router(benchmark.router, prefix="/api/benchmark", tags=["Benchmark"])

init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to The Benchmarkinator!"}
