from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect
import os
from models.cpu import CPU, CPUBrand, CPUFamily
from models.gpu import GPU, GPUManufacturer, GPUBrand as GPUBrandModel, GPUModel, GPUVRAMType
from models.motherboard import MotherboardManufacturer, MotherboardChipset, Motherboard
from models.ram import RAMBrand, RAMType, RAMModule
from models.disk import Disk
from models.oses import OS
from models.config import Config
from models.benchmark import BenchmarkTarget, Benchmark, Benchmarks
from models.benchmark_results import BenchmarkResult

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://user:password@benchmarkinator-db:3306/benchmarkinator",
)

engine = create_engine(DATABASE_URL, echo=True)


def check_tables_exist() -> bool:
    """
    Return True if ALL expected tables exist.
    Update the set below when the schema changes.
    """
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    expected = {
        # CPU
        "cpubrand",
        "cpufamily",
        "cpu",
        # GPU
        "gpumanufacturer",
        "gpubrand",
        "gpumodel",
        "gpuvramtype",
        "gpu",
        # Motherboard
        "motherboardmanufacturer",
        "motherboardchipset",
        "motherboard",
        # RAM (split)
        "rambrand",
        "ramtype",
        "rammodule",
        # Disk / OS
        "disk",
        "os",
        # Config
        "config",
        # Benchmarks
        "benchmarktarget",
        "benchmark",
        "benchmarks",
        "benchmarkresult",
    }

    return expected.issubset(tables)


def drop_tables() -> None:
    """Dev helper to drop all known tables."""
    if check_tables_exist():
        SQLModel.metadata.drop_all(bind=engine)


def init_db() -> None:
    """Create all tables if they don't already exist."""
    if not check_tables_exist():
        SQLModel.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session."""
    with Session(engine) as session:
        yield session


init_db()
