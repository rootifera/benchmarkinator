import json

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from utils.config_components import config_has_cpu, config_has_gpu
from models.benchmark import Benchmark, BenchmarkOption
from models.benchmark_results import BenchmarkResult
from models.config import Config
from database import get_db

router = APIRouter()


def _parse_option_values(raw: str | None) -> dict[str, str]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid result option values")
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=400, detail="Invalid result option values")
    return {str(key): str(value).strip() for key, value in parsed.items() if str(value).strip()}


def _apply_generated_settings(benchmark_result: BenchmarkResult, db: Session):
    option_values = _parse_option_values(benchmark_result.option_values)
    if not option_values:
        if benchmark_result.settings is not None:
            benchmark_result.settings = benchmark_result.settings.strip() or None
        return

    options = db.exec(
        select(BenchmarkOption)
        .where(BenchmarkOption.benchmark_id == benchmark_result.benchmark_id)
        .order_by(BenchmarkOption.sort_order, BenchmarkOption.id)
    ).all()
    labels = []
    for option in options:
        selected = option_values.get(str(option.id))
        if selected:
            labels.append(f"{option.name}: {selected}")

    generated_settings = ", ".join(labels)
    custom_settings = (benchmark_result.settings or "").strip()
    if generated_settings and custom_settings == generated_settings:
        custom_settings = ""
    elif generated_settings and custom_settings.startswith(f"{generated_settings}, "):
        custom_settings = custom_settings[len(generated_settings) + 2:].strip()

    if labels:
        benchmark_result.settings = ", ".join([generated_settings] + ([custom_settings] if custom_settings else []))
    elif custom_settings:
        benchmark_result.settings = custom_settings
    else:
        benchmark_result.settings = None


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

    _apply_generated_settings(benchmark_result, db)
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

    _apply_generated_settings(benchmark_result, db)
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
    return [
        result
        for result in results
        if configs.get(result.config_id) is not None and config_has_cpu(configs[result.config_id], cpu_id)
    ]


@router.get("/gpu/{gpu_id}", response_model=list[BenchmarkResult])
def get_results_by_gpu(gpu_id: int, db: Session = Depends(get_db)):
    results = db.exec(select(BenchmarkResult)).all()
    configs = {config.id: config for config in db.exec(select(Config)).all()}
    return [
        result
        for result in results
        if configs.get(result.config_id) is not None and config_has_gpu(configs[result.config_id], gpu_id)
    ]


@router.get("/cpu-gpu/{cpu_id}/{gpu_id}", response_model=list[BenchmarkResult])
def get_results_by_cpu_and_gpu(cpu_id: int, gpu_id: int, db: Session = Depends(get_db)):
    results = db.exec(select(BenchmarkResult)).all()
    configs = {config.id: config for config in db.exec(select(Config)).all()}
    return [
        result
        for result in results
        if configs.get(result.config_id) is not None
        and config_has_cpu(configs[result.config_id], cpu_id)
        and config_has_gpu(configs[result.config_id], gpu_id)
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


def normalize_result_settings(value: str | None) -> str:
    return (value or "").strip()


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

        result_1_settings = normalize_result_settings(result_1.settings)
        result_2 = next(
            (
                r for r in results_2
                if r.benchmark_id == result_1.benchmark_id
                and normalize_result_settings(r.settings) == result_1_settings
            ),
            None,
        )
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
                "settings": result_1_settings,
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
