from fastapi import APIRouter, HTTPException, Depends
from models.gpu import GPU
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/", response_model=GPU)
def create_gpu(gpu: GPU, db: Session = Depends(get_db)):
    db.add(gpu)
    db.commit()
    db.refresh(gpu)
    return gpu


@router.get("/", response_model=list[GPU])
def get_gpus(db: Session = Depends(get_db)):
    gpus = db.execute(select(GPU)).scalars().all()
    return gpus


@router.get("/{gpu_id}", response_model=GPU)
def get_gpu(gpu_id: int, db: Session = Depends(get_db)):
    gpu = db.get(GPU, gpu_id)
    if gpu is None:
        raise HTTPException(status_code=404, detail="GPU not found")
    return gpu


@router.put("/{gpu_id}", response_model=GPU)
def update_gpu(gpu_id: int, gpu: GPU, db: Session = Depends(get_db)):
    db_gpu = db.get(GPU, gpu_id)
    if db_gpu is None:
        raise HTTPException(status_code=404, detail="GPU not found")

    db_gpu.manufacturer = gpu.manufacturer
    db_gpu.brand = gpu.brand
    db_gpu.vram_size = gpu.vram_size
    db_gpu.vram_type = gpu.vram_type
    db_gpu.serial = gpu.serial

    db.commit()
    db.refresh(db_gpu)
    return db_gpu


@router.delete("/{gpu_id}")
def delete_gpu(gpu_id: int, db: Session = Depends(get_db)):
    gpu = db.get(GPU, gpu_id)
    if gpu is None:
        raise HTTPException(status_code=404, detail="GPU not found")

    db.delete(gpu)
    db.commit()
    return {"message": "GPU deleted successfully"}
