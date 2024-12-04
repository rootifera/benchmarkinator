from fastapi import APIRouter, HTTPException, Depends
from models.benchmark_results import BenchmarkResult
from models.config import Config
from models.cpu import CPU
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/", response_model=BenchmarkResult)
def create_benchmark_result(benchmark_result: BenchmarkResult, db: Session = Depends(get_db)):
    db.add(benchmark_result)
    db.commit()
    db.refresh(benchmark_result)
    return benchmark_result


@router.get("/", response_model=list[BenchmarkResult])
def get_benchmark_results(db: Session = Depends(get_db)):
    results = db.exec(select(BenchmarkResult)).all()
    return results


@router.get("/config/{config_id}", response_model=list[BenchmarkResult])
def get_results_by_config(config_id: int, db: Session = Depends(get_db)):
    results = db.exec(select(BenchmarkResult).where(BenchmarkResult.config_id == config_id)).all()
    return results


@router.get("/cpu/{cpu_id}", response_model=list[BenchmarkResult])
def get_results_by_cpu(cpu_id: int, db: Session = Depends(get_db)):
    results = db.exec(
        select(BenchmarkResult)
        .join(Config)
        .join(CPU)
        .where(CPU.id == cpu_id)
    ).all()
    return results


@router.get("/{result_id}", response_model=BenchmarkResult)
def get_benchmark_result(result_id: int, db: Session = Depends(get_db)):
    result = db.get(BenchmarkResult, result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Benchmark result not found")
    return result


def calculate_percentage_change(old_value: float, new_value: float) -> float:
    if old_value == 0:
        return 0.0
    return ((new_value - old_value) / old_value) * 100


@router.get("/compare/configs", response_model=dict)
def compare_configs(config_id_1: int, config_id_2: int, db: Session = Depends(get_db)):
    results_1 = db.exec(select(BenchmarkResult).where(BenchmarkResult.config_id == config_id_1)).all()
    results_2 = db.exec(select(BenchmarkResult).where(BenchmarkResult.config_id == config_id_2)).all()

    if not results_1 or not results_2:
        raise HTTPException(status_code=404, detail="Benchmark results for one or both configurations not found")

    comparison = {}

    for result_1 in results_1:
        result_2 = next((r for r in results_2 if r.benchmark_id == result_1.benchmark_id), None)
        if result_2:
            percentage_change = calculate_percentage_change(result_1.result, result_2.result)
            comparison[result_1.benchmark_id] = {
                "benchmark_id": result_1.benchmark_id,
                "config_1_result": result_1.result,
                "config_2_result": result_2.result,
                "percentage_change": round(percentage_change, 2),
            }

    return comparison
