from datetime import datetime
import time
from io import BytesIO
from fastapi.responses import StreamingResponse
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
    version = datetime.now().strftime("%d%m%Y")
    return {
        "app": "benchmarkinator-api",
        "version": version,
        "db": "mysql",
        "build_no": int(time.time()),
        "build_name": "Commander Boston Low"
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


@app.get("/backup_database")
async def backup_database(db: Session = Depends(get_db)):
    """
    Endpoint to create a MySQL database backup by generating SQL statements
    for the schema and data, and returning it as a downloadable file.
    """
    try:
        sql_dump = BytesIO()

        tables = db.execute(text("SHOW TABLES")).fetchall()
        tables = [table[0] for table in tables]

        for table in tables:
            create_table_sql = db.execute(text(f"SHOW CREATE TABLE {table}")).fetchone()[1]
            sql_dump.write(f"{create_table_sql};\n\n".encode('utf-8'))

            rows = db.execute(text(f"SELECT * FROM {table}")).fetchall()
            if rows:
                for row in rows:
                    insert_sql = f"INSERT INTO {table} ({', '.join([col[0] for col in db.execute(text(f'SHOW COLUMNS FROM {table}')).fetchall()])}) VALUES ({', '.join([repr(val) for val in row])});\n"
                    sql_dump.write(insert_sql.encode('utf-8'))
                sql_dump.write(b"\n")

        sql_dump.seek(0)

        return StreamingResponse(
            sql_dump,
            media_type="application/sql",
            headers={"Content-Disposition": f"attachment; filename=backup.sql"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating backup: {str(e)}")
