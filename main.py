from fastapi.middleware.cors import CORSMiddleware
from routers import cpu, gpu, motherboard, ram, disk, oses, config, benchmark, benchmark_results
from utils.auth import authenticate
from database import init_db, get_db
from fastapi import FastAPI, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import text

app = FastAPI(dependencies=[Depends(authenticate)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cpu.router, prefix="/api/cpu", tags=["CPU"])
app.include_router(gpu.router, prefix="/api/gpu", tags=["GPU"])
app.include_router(motherboard.router, prefix="/api/motherboard", tags=["Motherboard"])
app.include_router(ram.router, prefix="/api/ram", tags=["RAM"])
app.include_router(disk.router, prefix="/api/disk", tags=["Disk"])
app.include_router(oses.router, prefix="/api/oses", tags=["OS"])
app.include_router(config.router, prefix="/api/config", tags=["Config"])
app.include_router(benchmark.router, prefix="/api/benchmark", tags=["Benchmark"])
app.include_router(benchmark_results.router, prefix="/api/benchmark_results", tags=["Benchmark Results"])

init_db()


@app.get("/")
def read_root():
    return {
        "app": "benchmarkinator-api",
        "version": "1.0.0",
        "db": "mysql",
        "build_no": "01"
    }


@app.post("/import_sql/")
def import_sql(file: UploadFile, db: Session = Depends(get_db)):
    """
    Endpoint to import an SQL file for initializing or updating the database.
    This is a generic function and can handle any valid SQL file.
    """
    try:
        sql_content = file.file.read().decode("utf-8")

        statements = sql_content.split(";")

        for statement in statements:
            statement = statement.strip()
            if statement:
                db.execute(text(statement))

        db.commit()
        return {"message": "SQL file imported successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to import SQL file: {str(e)}")
    finally:
        file.file.close()
