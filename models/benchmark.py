from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional


class BenchmarkTarget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    benchmarks: List["Benchmark"] = Relationship(back_populates="target")


class Benchmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    benchmark_target_id: Optional[int] = Field(default=None, foreign_key="benchmarktarget.id")

    target: Optional[BenchmarkTarget] = Relationship(back_populates="benchmarks")


class Benchmarks(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    config_id: Optional[int] = Field(default=None, foreign_key="config.id")
    benchmark_id: Optional[int] = Field(default=None, foreign_key="benchmark.id")

    result: Optional[str] = None

    config: Optional["Config"] = Relationship()
    benchmark: Optional["Benchmark"] = Relationship()
