from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.benchmark import Benchmark, BenchmarkOption, BenchmarkTarget
from models.benchmark_results import BenchmarkResult
from database import get_db

router = APIRouter()


@router.post("/target/", response_model=BenchmarkTarget)
def create_benchmark_target(benchmark_target: BenchmarkTarget, db: Session = Depends(get_db)):
    benchmark_target.name = validate_and_normalize_name(benchmark_target.name, db, BenchmarkTarget)

    db.add(benchmark_target)
    db.commit()
    db.refresh(benchmark_target)
    return benchmark_target


@router.get("/target/", response_model=list[BenchmarkTarget])
def get_benchmark_targets(db: Session = Depends(get_db)):
    benchmark_targets = db.exec(select(BenchmarkTarget)).all()
    return benchmark_targets


@router.get("/target/{target_id}", response_model=BenchmarkTarget)
def get_benchmark_target(target_id: int, db: Session = Depends(get_db)):
    benchmark_target = db.get(BenchmarkTarget, target_id)
    if benchmark_target is None:
        raise HTTPException(status_code=404, detail="Benchmark target not found")
    return benchmark_target


@router.put("/target/{target_id}", response_model=BenchmarkTarget)
def update_benchmark_target(target_id: int, benchmark_target: BenchmarkTarget, db: Session = Depends(get_db)):
    db_benchmark_target = db.get(BenchmarkTarget, target_id)
    if db_benchmark_target is None:
        raise HTTPException(status_code=404, detail="Benchmark target not found")

    benchmark_target.name = validate_and_normalize_name(benchmark_target.name, db, BenchmarkTarget, current_id=target_id)

    db_benchmark_target.name = benchmark_target.name

    db.commit()
    db.refresh(db_benchmark_target)
    return db_benchmark_target


@router.delete("/target/{target_id}")
def delete_benchmark_target(target_id: int, db: Session = Depends(get_db)):
    benchmark_target = db.get(BenchmarkTarget, target_id)
    if benchmark_target is None:
        raise HTTPException(status_code=404, detail="Benchmark target not found")

    has_benchmark = db.exec(select(Benchmark).where(Benchmark.benchmark_target_id == target_id)).first()
    if has_benchmark:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete benchmark target with existing benchmarks."
        )

    db.delete(benchmark_target)
    db.commit()
    return {"message": "Benchmark target deleted successfully"}


def _validate_option_payload(option: BenchmarkOption, db: Session):
    if not db.get(Benchmark, option.benchmark_id):
        raise HTTPException(status_code=400, detail="Invalid benchmark ID")

    option.name = (option.name or "").strip()
    option.values = (option.values or "").strip()
    if not option.name:
        raise HTTPException(status_code=400, detail="Option name is required")
    if not option.values:
        raise HTTPException(status_code=400, detail="Option values are required")
    return option


@router.get("/options/", response_model=list[BenchmarkOption])
def get_benchmark_options(db: Session = Depends(get_db)):
    return db.exec(select(BenchmarkOption)).all()


@router.get("/{benchmark_id}/options/", response_model=list[BenchmarkOption])
def get_options_for_benchmark(benchmark_id: int, db: Session = Depends(get_db)):
    if not db.get(Benchmark, benchmark_id):
        raise HTTPException(status_code=404, detail="Benchmark not found")
    return db.exec(
        select(BenchmarkOption)
        .where(BenchmarkOption.benchmark_id == benchmark_id)
        .order_by(BenchmarkOption.sort_order, BenchmarkOption.id)
    ).all()


@router.post("/options/", response_model=BenchmarkOption)
def create_benchmark_option(option: BenchmarkOption, db: Session = Depends(get_db)):
    option = _validate_option_payload(option, db)
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


@router.put("/options/{option_id}", response_model=BenchmarkOption)
def update_benchmark_option(option_id: int, option: BenchmarkOption, db: Session = Depends(get_db)):
    db_option = db.get(BenchmarkOption, option_id)
    if db_option is None:
        raise HTTPException(status_code=404, detail="Benchmark option not found")

    option = _validate_option_payload(option, db)
    db_option.benchmark_id = option.benchmark_id
    db_option.name = option.name
    db_option.values = option.values
    db_option.sort_order = option.sort_order

    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    return db_option


@router.delete("/options/{option_id}")
def delete_benchmark_option(option_id: int, db: Session = Depends(get_db)):
    db_option = db.get(BenchmarkOption, option_id)
    if db_option is None:
        raise HTTPException(status_code=404, detail="Benchmark option not found")

    db.delete(db_option)
    db.commit()
    return {"message": "Benchmark option deleted successfully"}


@router.post("/", response_model=Benchmark)
def create_benchmark(benchmark: Benchmark, db: Session = Depends(get_db)):
    benchmark.name = validate_and_normalize_name(benchmark.name, db, Benchmark)
    if benchmark.benchmark_target_id is not None and not db.get(BenchmarkTarget, benchmark.benchmark_target_id):
        raise HTTPException(status_code=400, detail="Invalid benchmark target")

    db.add(benchmark)            
    db.commit()
    db.refresh(benchmark)
    return benchmark


@router.get("/", response_model=list[Benchmark])
def get_benchmarks(db: Session = Depends(get_db)):
    benchmarks = db.exec(select(Benchmark)).all()
    return benchmarks


@router.get("/{benchmark_id}", response_model=Benchmark)
def get_benchmark(benchmark_id: int, db: Session = Depends(get_db)):
    benchmark = db.get(Benchmark, benchmark_id)
    if benchmark is None:
        raise HTTPException(status_code=404, detail="Benchmark not found")
    return benchmark


@router.put("/{benchmark_id}", response_model=Benchmark)
def update_benchmark(benchmark_id: int, benchmark: Benchmark, db: Session = Depends(get_db)):
    db_benchmark = db.get(Benchmark, benchmark_id)
    if db_benchmark is None:
        raise HTTPException(status_code=404, detail="Benchmark not found")

    benchmark.name = validate_and_normalize_name(benchmark.name, db, Benchmark, current_id=benchmark_id)
    if benchmark.benchmark_target_id is not None and not db.get(BenchmarkTarget, benchmark.benchmark_target_id):
        raise HTTPException(status_code=400, detail="Invalid benchmark target")

    db_benchmark.name = benchmark.name
    db_benchmark.benchmark_target_id = benchmark.benchmark_target_id
    db_benchmark.lower_is_better = benchmark.lower_is_better

    db.commit()
    db.refresh(db_benchmark)
    return db_benchmark



@router.delete("/{benchmark_id}")
def delete_benchmark(benchmark_id: int, db: Session = Depends(get_db)):
    benchmark = db.get(Benchmark, benchmark_id)
    if benchmark is None:
        raise HTTPException(status_code=404, detail="Benchmark not found")

    has_results = db.exec(select(BenchmarkResult).where(BenchmarkResult.benchmark_id == benchmark_id)).first()
    if has_results:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete benchmark because it is referenced by one or more benchmark results."
        )

    options = db.exec(select(BenchmarkOption).where(BenchmarkOption.benchmark_id == benchmark_id)).all()
    for option in options:
        db.delete(option)

    db.delete(benchmark)
    db.commit()
    return {"message": "Benchmark deleted successfully"}
