from sqlmodel import SQLModel, Field, Relationship
from models.config import Config
from models.benchmark import Benchmark


class BenchmarkResult(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    benchmark_id: int = Field(foreign_key="benchmark.id")
    config_id: int = Field(foreign_key="config.id")
    result: float
    timestamp: str = Field(default=None, nullable=True)
    notes: str = Field(default=None, nullable=True)

    benchmark: "Benchmark" = Relationship(back_populates="benchmark_results")
    config: "Config" = Relationship(back_populates="benchmark_results")  # Add this line
