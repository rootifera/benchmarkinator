from fastapi import APIRouter, HTTPException, Depends
from models.cpu import CPU
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/cpu/", response_model=CPU)
def create_cpu(cpu: CPU, db: Session = Depends(get_db)):
    db.add(cpu)
    db.commit()
    db.refresh(cpu)
    return cpu


@router.get("/cpu/", response_model=list[CPU])
def get_cpus(db: Session = Depends(get_db)):
    cpus = db.execute(select(CPU)).scalars().all()
    return cpus


@router.get("/cpu/{cpu_id}", response_model=CPU)
def get_cpu(cpu_id: int, db: Session = Depends(get_db)):
    cpu = db.get(CPU, cpu_id)
    if cpu is None:
        raise HTTPException(status_code=404, detail="CPU not found")
    return cpu


@router.put("/cpu/{cpu_id}", response_model=CPU)
def update_cpu(cpu_id: int, cpu: CPU, db: Session = Depends(get_db)):
    db_cpu = db.get(CPU, cpu_id)
    if db_cpu is None:
        raise HTTPException(status_code=404, detail="CPU not found")

    db_cpu.brand = cpu.brand
    db_cpu.family = cpu.family
    db_cpu.model = cpu.model
    db_cpu.speed = cpu.speed
    db_cpu.core_count = cpu.core_count
    db_cpu.serial = cpu.serial

    db.commit()
    db.refresh(db_cpu)
    return db_cpu


@router.delete("/cpu/{cpu_id}")
def delete_cpu(cpu_id: int, db: Session = Depends(get_db)):
    cpu = db.get(CPU, cpu_id)
    if cpu is None:
        raise HTTPException(status_code=404, detail="CPU not found")

    db.delete(cpu)
    db.commit()
    return {"message": "CPU deleted successfully"}
