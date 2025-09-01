from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from models.benchmark_results import BenchmarkResult

class BenchmarkTarget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    benchmarks: List["Benchmark"] = Relationship(back_populates="target")


class Benchmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    lower_is_better: bool = Field(default=False, nullable=False)

    benchmark_target_id: Optional[int] = Field(default=None, foreign_key="benchmarktarget.id")

    target: Optional[BenchmarkTarget] = Relationship(back_populates="benchmarks")

    benchmark_results: List["BenchmarkResult"] = Relationship(back_populates="benchmark")
