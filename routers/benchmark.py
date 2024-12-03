from fastapi import APIRouter, HTTPException, Depends
from models.benchmark import Benchmark, BenchmarkTarget
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


# BenchmarkTarget CRUD Operations
@router.post("/target/", response_model=BenchmarkTarget)
def create_benchmark_target(benchmark_target: BenchmarkTarget, db: Session = Depends(get_db)):
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

    db_benchmark_target.name = benchmark_target.name

    db.commit()
    db.refresh(db_benchmark_target)
    return db_benchmark_target


@router.delete("/target/{target_id}")
def delete_benchmark_target(target_id: int, db: Session = Depends(get_db)):
    benchmark_target = db.get(BenchmarkTarget, target_id)
    if benchmark_target is None:
        raise HTTPException(status_code=404, detail="Benchmark target not found")

    db.delete(benchmark_target)
    db.commit()
    return {"message": "Benchmark target deleted successfully"}


# Benchmark CRUD Operations
@router.post("/", response_model=Benchmark)
def create_benchmark(benchmark: Benchmark, db: Session = Depends(get_db)):
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

    db_benchmark.name = benchmark.name
    db_benchmark.benchmark_target_id = benchmark.benchmark_target_id

    db.commit()
    db.refresh(db_benchmark)
    return db_benchmark


@router.delete("/{benchmark_id}")
def delete_benchmark(benchmark_id: int, db: Session = Depends(get_db)):
    benchmark = db.get(Benchmark, benchmark_id)
    if benchmark is None:
        raise HTTPException(status_code=404, detail="Benchmark not found")

    db.delete(benchmark)
    db.commit()
    return {"message": "Benchmark deleted successfully"}
