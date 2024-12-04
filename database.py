from sqlmodel import SQLModel, create_engine
from models.cpu import CPU, CPUBrand, CPUFamily
from models.gpu import GPU, GPUManufacturer, GPUBrand, GPUModel, GPUVRAMType
from models.motherboard import Motherboard
from models.ram import RAM
from models.disk import Disk
from models.oses import OS
from models.config import Config
from models.benchmark import BenchmarkTarget, Benchmark, Benchmarks

DATABASE_URL = "sqlite:///./benchmarkinator.db"

engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    SQLModel.metadata.create_all(bind=engine)