from fastapi import APIRouter, HTTPException, Depends
from models.benchmark import Benchmark
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/", response_model=Benchmark)
def create_benchmark(benchmark: Benchmark, db: Session = Depends(get_db)):
    db.add(benchmark)
    db.commit()
    db.refresh(benchmark)
    return benchmark


@router.get("/", response_model=list[Benchmark])
def get_benchmarks(db: Session = Depends(get_db)):
    benchmarks = db.execute(select(Benchmark)).scalars().all()
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
    db_benchmark.result = benchmark.result

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
