# database.py
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect
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

engine = create_engine(DATABASE_URL, echo=SQL_ECHO)


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


def get_db():
    with Session(engine) as session:
        yield session
