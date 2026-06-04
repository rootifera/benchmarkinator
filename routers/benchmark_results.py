import json

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.benchmark_results import BenchmarkResult
from models.config import Config
from models.benchmark import Benchmark
from database import get_db

router = APIRouter()


def _component_ids(raw: str | None, fallback_id: int | None) -> set[int]:
    ids = set()
    if fallback_id is not None:
        ids.add(int(fallback_id))
    if not raw:
        return ids
    try:
        values = json.loads(raw)
    except json.JSONDecodeError:
        return ids
    if not isinstance(values, list):
        return ids
    for value in values:
        try:
            ids.add(int(value))
        except (TypeError, ValueError):
            continue
    return ids


def _config_has_cpu(config: Config | None, cpu_id: int) -> bool:
    if config is None:
        return False
    return cpu_id in _component_ids(config.cpu_component_ids, config.cpu_id)


def _config_has_gpu(config: Config | None, gpu_id: int) -> bool:
    if config is None:
        return False
    return gpu_id in _component_ids(config.gpu_component_ids, config.gpu_id)


@router.post("/", response_model=BenchmarkResult)
def create_benchmark_result(benchmark_result: BenchmarkResult, db: Session = Depends(get_db)):
    benchmark = db.get(Benchmark, benchmark_result.benchmark_id)
    if benchmark is None:
        raise HTTPException(status_code=400, detail="Invalid benchmark ID")

    config = db.get(Config, benchmark_result.config_id)
    if config is None:
        raise HTTPException(status_code=400, detail="Invalid config ID")

    if hasattr(benchmark_result, "name"):
        benchmark_result.name = validate_and_normalize_name(benchmark_result.name, db, BenchmarkResult)

    db.add(benchmark_result)
    db.commit()
    db.refresh(benchmark_result)
    return benchmark_result


@router.put("/{result_id}", response_model=BenchmarkResult)
def update_benchmark_result(result_id: int, benchmark_result: BenchmarkResult, db: Session = Depends(get_db)):
    db_result = db.get(BenchmarkResult, result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Benchmark result not found")

    if benchmark_result.benchmark_id is not None:
        benchmark = db.get(Benchmark, benchmark_result.benchmark_id)
        if benchmark is None:
            raise HTTPException(status_code=400, detail="Invalid benchmark ID")

    if benchmark_result.config_id is not None:
        config = db.get(Config, benchmark_result.config_id)
        if config is None:
            raise HTTPException(status_code=400, detail="Invalid config ID")

    if hasattr(benchmark_result, "name"):
        benchmark_result.name = validate_and_normalize_name(benchmark_result.name, db, BenchmarkResult,
                                                            current_id=result_id)

    for key, value in benchmark_result.dict(exclude_unset=True).items():
        setattr(db_result, key, value)

    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.delete("/{result_id}", response_model=dict)
def delete_benchmark_result(result_id: int, db: Session = Depends(get_db)):
    db_result = db.get(BenchmarkResult, result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Benchmark result not found")

    db.delete(db_result)
    db.commit()
    return {"message": "Benchmark result deleted successfully"}


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
    results = db.exec(select(BenchmarkResult)).all()
    configs = {config.id: config for config in db.exec(select(Config)).all()}
    return [result for result in results if _config_has_cpu(configs.get(result.config_id), cpu_id)]


@router.get("/gpu/{gpu_id}", response_model=list[BenchmarkResult])
def get_results_by_gpu(gpu_id: int, db: Session = Depends(get_db)):
    results = db.exec(select(BenchmarkResult)).all()
    configs = {config.id: config for config in db.exec(select(Config)).all()}
    return [result for result in results if _config_has_gpu(configs.get(result.config_id), gpu_id)]


@router.get("/cpu-gpu/{cpu_id}/{gpu_id}", response_model=list[BenchmarkResult])
def get_results_by_cpu_and_gpu(cpu_id: int, gpu_id: int, db: Session = Depends(get_db)):
    results = db.exec(select(BenchmarkResult)).all()
    configs = {config.id: config for config in db.exec(select(Config)).all()}
    return [
        result
        for result in results
        if _config_has_cpu(configs.get(result.config_id), cpu_id)
        and _config_has_gpu(configs.get(result.config_id), gpu_id)
    ]


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


@router.get("/compare/configs", response_model=list)
def compare_configs(
    config_id_1: int,
    config_id_2: int,
    benchmark_id: int | None = None,
    db: Session = Depends(get_db),
):
    if benchmark_id is not None and not db.get(Benchmark, benchmark_id):
        raise HTTPException(status_code=404, detail="Benchmark not found")

    results_1 = db.exec(select(BenchmarkResult).where(BenchmarkResult.config_id == config_id_1)).all()
    results_2 = db.exec(select(BenchmarkResult).where(BenchmarkResult.config_id == config_id_2)).all()

    if not results_1 or not results_2:
        raise HTTPException(
            status_code=404,
            detail="Benchmark results for one or both configurations not found"
        )

    comparison = []

    for result_1 in results_1:
        if benchmark_id is not None and result_1.benchmark_id != benchmark_id:
            continue

        result_2 = next((r for r in results_2 if r.benchmark_id == result_1.benchmark_id), None)
        if result_2:
            benchmark = db.get(Benchmark, result_1.benchmark_id)
            if not benchmark:
                continue

            percentage_change = calculate_percentage_change(result_1.result, result_2.result)

            # Flip if lower numbers are better
            if benchmark.lower_is_better:
                percentage_change = -percentage_change

            comparison.append({
                "benchmark_id": result_1.benchmark_id,
                "benchmark_name": benchmark.name,
                "lower_is_better": benchmark.lower_is_better,
                "config_1_result": result_1.result,
                "config_2_result": result_2.result,
                "percentage_change": round(percentage_change, 2),
            })

    if benchmark_id is not None and not comparison:
        raise HTTPException(
            status_code=404,
            detail="Benchmark results for the selected benchmark were not found for both configurations"
        )

    return comparison
