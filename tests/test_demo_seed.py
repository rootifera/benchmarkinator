from sqlmodel import Session, select

from database import engine
from models.benchmark import Benchmark
from models.benchmark_results import BenchmarkResult
from models.config import Config
from scripts.seed_demo_data import DEMO_PREFIX, seed_demo_data


def test_demo_seed_populates_public_browsing_data():
    with Session(bind=engine) as session:
        summary = seed_demo_data(session, reset_demo=True)

        assert summary["systems"] == 15
        assert summary["benchmarks"] == 14
        assert summary["results"] > 100

        systems = session.exec(select(Config).where(Config.name.startswith(DEMO_PREFIX))).all()
        benchmarks = session.exec(select(Benchmark).where(Benchmark.name.startswith(DEMO_PREFIX))).all()
        results = session.exec(select(BenchmarkResult)).all()

        assert len(systems) == summary["systems"]
        assert len(benchmarks) == summary["benchmarks"]
        assert len(results) == summary["results"]


def test_demo_seed_reset_is_repeatable():
    with Session(bind=engine) as session:
        first = seed_demo_data(session, reset_demo=True)
        second = seed_demo_data(session, reset_demo=True)

        results = session.exec(select(BenchmarkResult)).all()

        assert second == first
        assert len(results) == second["results"]
