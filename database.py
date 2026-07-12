# database.py
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect, text
import os

# Load .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Import models so SQLModel knows all tables at metadata time
from models.cpu import CPU, CPUBrand, CPUFamily
from models.gpu import GPU, GPUManufacturer, GPUBrand as GPUBrandModel, GPUModel, GPUVRAMType
from models.motherboard import MotherboardManufacturer, MotherboardChipset, Motherboard
from models.ram import RAM
from models.disk import Disk
from models.oses import OS
from models.config import Config
from models.benchmark import BenchmarkTarget, Benchmark
from models.benchmark_results import BenchmarkResult
from models.settings import Setting  # <-- new: key/value settings table


def _env(name: str, default: str | None = None) -> str | None:
    v = os.getenv(name)
    return v if (v is not None and v != "") else default


def _build_mysql_url_from_parts() -> str:
    user = _env("MYSQL_USER", "benchmarkinator")
    pwd = _env("MYSQL_PASSWORD", "benchmarkinatorpassword")
    host = _env("MYSQL_HOST", "benchmarkinator-db")
    port = _env("MYSQL_PORT", "3306")
    db = _env("MYSQL_DATABASE", "benchmarkinator")
    return f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}"


DATABASE_URL = _env("DATABASE_URL") or _build_mysql_url_from_parts()
SQL_ECHO = (_env("SQL_ECHO", "false") or "false").lower() in {"1", "true", "yes"}
MYSQL_POOL_RECYCLE_SECONDS = int(_env("MYSQL_POOL_RECYCLE_SECONDS", "1800") or "1800")

engine_kwargs = {"echo": SQL_ECHO}
if DATABASE_URL.startswith("mysql"):
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": MYSQL_POOL_RECYCLE_SECONDS,
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)


def check_tables_exist() -> bool:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    required = {
        "cpubrand", "cpufamily", "cpu",
        "gpubrand", "gpumanufacturer", "gpumodel", "gpuvramtype", "gpu",
        "motherboardmanufacturer", "motherboardchipset", "motherboard",
        "ram",
        "disk", "os",
        "config",
        "benchmarktarget", "benchmark",
        "benchmarkresult",
        "settings",  # ensure our new settings table is considered
    }
    return required.issubset(tables)


def init_db():
    """
    Create all tables if they don't already exist.
    Always call create_all so newly added models (e.g., 'settings') are created
    even on an existing database.
    """
    SQLModel.metadata.create_all(bind=engine)
    _ensure_config_quantity_columns()


def _ensure_config_quantity_columns():
    inspector = inspect(engine)
    if "config" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("config")}
    statements = []
    if "cpu_quantity" not in existing_columns:
        statements.append("ALTER TABLE config ADD COLUMN cpu_quantity INTEGER NOT NULL DEFAULT 1")
    if "cpu_component_ids" not in existing_columns:
        statements.append("ALTER TABLE config ADD COLUMN cpu_component_ids TEXT")
    if "gpu_quantity" not in existing_columns:
        statements.append("ALTER TABLE config ADD COLUMN gpu_quantity INTEGER NOT NULL DEFAULT 1")
    if "gpu_component_ids" not in existing_columns:
        statements.append("ALTER TABLE config ADD COLUMN gpu_component_ids TEXT")

    if not statements:
        return

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


def get_db():
    session = Session(engine)
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
