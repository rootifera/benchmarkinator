from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect
from models.cpu import CPUBrand, CPUFamily, CPU
from models.gpu import GPUManufacturer, GPUBrand, GPUModel, GPUVRAMType, GPU
from models.motherboard import MotherboardManufacturer, MotherboardChipset, Motherboard
from models.ram import RAMBrand, RAMType, RAMModule
from models.disk import Disk
from models.oses import OS
from models.config import Config
from models.benchmark import BenchmarkTarget, Benchmark, Benchmarks
from models.benchmark_results import BenchmarkResult

import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://user:password@benchmarkinator-db:3306/benchmarkinator",
)

engine = create_engine(DATABASE_URL, echo=True)


def check_tables_exist() -> bool:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    required = {
        # CPU
        "cpubrand", "cpufamily", "cpu",
        # GPU
        "gpumanufacturer", "gpubrand", "gpumodel", "gpuvramtype", "gpu",
        # Motherboard
        "motherboardmanufacturer", "motherboardchipset", "motherboard",
        # RAM
        "rambrand", "ramtype", "rammodule",
        # Other
        "disk", "os", "config",
        "benchmarktarget", "benchmark", "benchmarks", "benchmarkresult",
    }
    return required.issubset(tables)


def drop_tables():
    if check_tables_exist():
        SQLModel.metadata.drop_all(bind=engine)


def init_db():
    if not check_tables_exist():
        SQLModel.metadata.create_all(bind=engine)


def get_db():
    with Session(engine) as session:
        yield session


# Initialize on import (ok for service startup)
init_db()
