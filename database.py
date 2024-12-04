from sqlmodel import SQLModel, create_engine
from sqlalchemy import inspect
from models.cpu import CPU
from models.gpu import GPU
from models.motherboard import MotherboardManufacturer, MotherboardChipset, Motherboard
from models.ram import RAM
from models.disk import Disk
from models.oses import OS
from models.config import Config
from models.benchmark import BenchmarkTarget, Benchmark, Benchmarks
from models.benchmark_results import BenchmarkResult

DATABASE_URL = "sqlite:///./benchmarkinator.db"

engine = create_engine(DATABASE_URL, echo=True)

def check_tables_exist():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return "config" in tables and "cpu" in tables and "gpu" in tables and "motherboard" in tables and "ram" in tables and "disk" in tables and "os" in tables and "benchmark" in tables and "benchmarkresult" in tables

def drop_tables():
    if check_tables_exist():
        SQLModel.metadata.drop_all(bind=engine)

def init_db():
    if not check_tables_exist():
        SQLModel.metadata.create_all(bind=engine)

# Initialize the database
init_db()