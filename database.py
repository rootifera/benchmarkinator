from sqlmodel import SQLModel, create_engine
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

def drop_tables():
    SQLModel.metadata.drop_all(bind=engine)

def init_db():
    SQLModel.metadata.create_all(bind=engine)

# Drop tables and recreate them
drop_tables()
init_db()