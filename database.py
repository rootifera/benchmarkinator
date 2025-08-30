# database.py
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect
import os

from models.cpu import CPU, CPUBrand, CPUFamily
from models.gpu import GPU, GPUManufacturer, GPUBrand as GPUBrandModel, GPUModel, GPUVRAMType
from models.motherboard import MotherboardManufacturer, MotherboardChipset, Motherboard
from models.ram import RAM
from models.disk import Disk
from models.oses import OS
from models.config import Config
from models.benchmark import BenchmarkTarget, Benchmark, Benchmarks
from models.benchmark_results import BenchmarkResult

# -----------------------------------------------------------------------------

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://benchmarkinator:benchmarkinatorpassword@benchmarkinator-db:3306/benchmarkinator",
)

engine = create_engine(DATABASE_URL, echo=True)

def check_tables_exist() -> bool:
    """
    We only verify a representative subset to decide whether to create metadata.
    If these exist, we assume the DB is already initialized.
    """
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    required = {
        "cpubrand", "cpufamily", "cpu",
        "gpubrand", "gpumanufacturer", "gpumodel", "gpuvramtype", "gpu",
        "motherboardmanufacturer", "motherboardchipset", "motherboard",
        "ram",
        "disk", "os",
        "config",
        "benchmarktarget", "benchmark", "benchmarks",
        "benchmarkresult",
    }
    return required.issubset(tables)

def drop_tables():
    """Dangerous in prod; fine for dev/test resets."""
    if check_tables_exist():
        SQLModel.metadata.drop_all(bind=engine)

def init_db():
    """Create all tables if they don't already exist."""
    if not check_tables_exist():
        SQLModel.metadata.create_all(bind=engine)

def get_db():
    with Session(engine) as session:
        yield session

init_db()
