from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.gpu import GPU, GPUManufacturer, GPUBrand, GPUModel, GPUVRAMType
from database import get_db

router = APIRouter()


@router.post("/manufacturer/", response_model=GPUManufacturer)
def create_gpu_manufacturer(gpu_manufacturer: GPUManufacturer, db: Session = Depends(get_db)):
    gpu_manufacturer.name = validate_and_normalize_name(gpu_manufacturer.name, db, GPUManufacturer)
    db.add(gpu_manufacturer)
    db.commit()
    db.refresh(gpu_manufacturer)
    return gpu_manufacturer


@router.get("/manufacturer/", response_model=list[GPUManufacturer])
def get_gpu_manufacturers(db: Session = Depends(get_db)):
    return db.exec(select(GPUManufacturer)).all()


@router.get("/manufacturer/{manufacturer_id}", response_model=GPUManufacturer)
def get_gpu_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    m = db.get(GPUManufacturer, manufacturer_id)
    if not m:
        raise HTTPException(status_code=404, detail="GPU manufacturer not found")
    return m


@router.put("/manufacturer/{manufacturer_id}", response_model=GPUManufacturer)
def update_gpu_manufacturer(manufacturer_id: int, gpu_manufacturer: GPUManufacturer, db: Session = Depends(get_db)):
    m = db.get(GPUManufacturer, manufacturer_id)
    if not m:
        raise HTTPException(status_code=404, detail="GPU manufacturer not found")

    gpu_manufacturer.name = validate_and_normalize_name(gpu_manufacturer.name, db, GPUManufacturer,
                                                        current_id=manufacturer_id)
    m.name = gpu_manufacturer.name
    db.commit()
    db.refresh(m)
    return m


@router.delete("/manufacturer/{manufacturer_id}")
def delete_gpu_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    m = db.get(GPUManufacturer, manufacturer_id)
    if not m:
        raise HTTPException(status_code=404, detail="GPU manufacturer not found")

    has_gpu = db.exec(select(GPU).where(GPU.gpu_manufacturer_id == manufacturer_id)).first()
    if has_gpu:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete manufacturer with existing GPUs.")

    db.delete(m)
    db.commit()
    return {"message": "GPU manufacturer deleted successfully"}


@router.post("/brand/", response_model=GPUBrand)
def create_gpu_brand(gpu_brand: GPUBrand, db: Session = Depends(get_db)):
    gpu_brand.name = validate_and_normalize_name(gpu_brand.name, db, GPUBrand)
    db.add(gpu_brand)
    db.commit()
    db.refresh(gpu_brand)
    return gpu_brand


@router.get("/brand/", response_model=list[GPUBrand])
def get_gpu_brands(db: Session = Depends(get_db)):
    return db.exec(select(GPUBrand)).all()


@router.get("/brand/{brand_id}", response_model=GPUBrand)
def get_gpu_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.get(GPUBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="GPU brand not found")
    return b


@router.put("/brand/{brand_id}", response_model=GPUBrand)
def update_gpu_brand(brand_id: int, gpu_brand: GPUBrand, db: Session = Depends(get_db)):
    b = db.get(GPUBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="GPU brand not found")

    gpu_brand.name = validate_and_normalize_name(gpu_brand.name, db, GPUBrand, current_id=brand_id)
    b.name = gpu_brand.name
    db.commit()
    db.refresh(b)
    return b


@router.delete("/brand/{brand_id}")
def delete_gpu_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.get(GPUBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="GPU brand not found")

    has_model = db.exec(select(GPUModel).where(GPUModel.gpu_brand_id == brand_id)).first()
    has_gpu = db.exec(select(GPU).where(GPU.gpu_brand_id == brand_id)).first()
    if has_model or has_gpu:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete brand with existing models or GPUs.")

    db.delete(b)
    db.commit()
    return {"message": "GPU brand deleted successfully"}


# ---------- Models ----------

@router.post("/model/", response_model=GPUModel)
def create_gpu_model(gpu_model: GPUModel, db: Session = Depends(get_db)):
    gpu_model.name = validate_and_normalize_name(gpu_model.name, db, GPUModel)

    if not db.get(GPUBrand, gpu_model.gpu_brand_id):
        raise HTTPException(status_code=400, detail="Invalid GPU brand")

    db.add(gpu_model)
    try:
        db.commit()
        db.refresh(gpu_model)
        return gpu_model
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Model name already exists under this brand")


@router.get("/model/", response_model=list[GPUModel])
def get_gpu_models(db: Session = Depends(get_db)):
    return db.exec(select(GPUModel)).all()


@router.get("/model/{model_id}", response_model=GPUModel)
def get_gpu_model(model_id: int, db: Session = Depends(get_db)):
    m = db.get(GPUModel, model_id)
    if not m:
        raise HTTPException(status_code=404, detail="GPU model not found")
    return m


@router.put("/model/{model_id}", response_model=GPUModel)
def update_gpu_model(model_id: int, gpu_model: GPUModel, db: Session = Depends(get_db)):
    m = db.get(GPUModel, model_id)
    if not m:
        raise HTTPException(status_code=404, detail="GPU model not found")

    gpu_model.name = validate_and_normalize_name(gpu_model.name, db, GPUModel, current_id=model_id)

    if gpu_model.gpu_brand_id is not None and gpu_model.gpu_brand_id != m.gpu_brand_id:
        if not db.get(GPUBrand, gpu_model.gpu_brand_id):
            raise HTTPException(status_code=400, detail="Invalid GPU brand")
        m.gpu_brand_id = gpu_model.gpu_brand_id

    m.name = gpu_model.name
    try:
        db.commit()
        db.refresh(m)
        return m
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Model name already exists under this brand")


@router.delete("/model/{model_id}")
def delete_gpu_model(model_id: int, db: Session = Depends(get_db)):
    m = db.get(GPUModel, model_id)
    if not m:
        raise HTTPException(status_code=404, detail="GPU model not found")

    has_gpu = db.exec(select(GPU).where(GPU.gpu_model_id == model_id)).first()
    if has_gpu:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete model with existing GPUs.")

    db.delete(m)
    db.commit()
    return {"message": "GPU model deleted successfully"}


@router.post("/vram_type/", response_model=GPUVRAMType)
def create_gpu_vram_type(gpu_vram_type: GPUVRAMType, db: Session = Depends(get_db)):
    gpu_vram_type.name = validate_and_normalize_name(gpu_vram_type.name, db, GPUVRAMType)
    db.add(gpu_vram_type)
    db.commit()
    db.refresh(gpu_vram_type)
    return gpu_vram_type


@router.get("/vram_type/", response_model=list[GPUVRAMType])
def get_gpu_vram_types(db: Session = Depends(get_db)):
    return db.exec(select(GPUVRAMType)).all()


@router.get("/vram_type/{vram_type_id}", response_model=GPUVRAMType)
def get_gpu_vram_type(vram_type_id: int, db: Session = Depends(get_db)):
    vt = db.get(GPUVRAMType, vram_type_id)
    if not vt:
        raise HTTPException(status_code=404, detail="GPU VRAM type not found")
    return vt


@router.put("/vram_type/{vram_type_id}", response_model=GPUVRAMType)
def update_gpu_vram_type(vram_type_id: int, gpu_vram_type: GPUVRAMType, db: Session = Depends(get_db)):
    vt = db.get(GPUVRAMType, vram_type_id)
    if not vt:
        raise HTTPException(status_code=404, detail="GPU VRAM type not found")

    gpu_vram_type.name = validate_and_normalize_name(gpu_vram_type.name, db, GPUVRAMType, current_id=vram_type_id)
    vt.name = gpu_vram_type.name
    db.commit()
    db.refresh(vt)
    return vt


@router.delete("/vram_type/{vram_type_id}")
def delete_gpu_vram_type(vram_type_id: int, db: Session = Depends(get_db)):
    vt = db.get(GPUVRAMType, vram_type_id)
    if not vt:
        raise HTTPException(status_code=404, detail="GPU VRAM type not found")

    has_gpu = db.exec(select(GPU).where(GPU.gpu_vram_type_id == vram_type_id)).first()
    if has_gpu:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete VRAM type with existing GPUs.")

    db.delete(vt)
    db.commit()
    return {"message": "GPU VRAM type deleted successfully"}


# ---------- GPUs ----------

@router.post("/", response_model=GPU)
def create_gpu(gpu: GPU, db: Session = Depends(get_db)):
    if gpu.gpu_manufacturer_id is not None and not db.get(GPUManufacturer, gpu.gpu_manufacturer_id):
        raise HTTPException(status_code=400, detail="Invalid GPU manufacturer")

    brand = db.get(GPUBrand, gpu.gpu_brand_id)
    if not brand:
        raise HTTPException(status_code=400, detail="Invalid GPU brand")

    model = db.get(GPUModel, gpu.gpu_model_id)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid GPU model")
    if model.gpu_brand_id != gpu.gpu_brand_id:
        raise HTTPException(status_code=400, detail="GPU model does not belong to the specified brand")

    if not db.get(GPUVRAMType, gpu.gpu_vram_type_id):
        raise HTTPException(status_code=400, detail="Invalid GPU VRAM type")

    db.add(gpu)
    try:
        db.commit()
        db.refresh(gpu)
        return gpu
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate GPU spec for this model (vram type + size)")


@router.get("/", response_model=list[GPU])
def get_gpus(db: Session = Depends(get_db)):
    return db.exec(select(GPU)).all()


@router.get("/{gpu_id}", response_model=GPU)
def get_gpu(gpu_id: int, db: Session = Depends(get_db)):
    g = db.get(GPU, gpu_id)
    if not g:
        raise HTTPException(status_code=404, detail="GPU not found")
    return g


@router.put("/{gpu_id}", response_model=GPU)
def update_gpu(gpu_id: int, gpu: GPU, db: Session = Depends(get_db)):
    db_gpu = db.get(GPU, gpu_id)
    if not db_gpu:
        raise HTTPException(status_code=404, detail="GPU not found")

    if gpu.gpu_manufacturer_id is not None:
        if not db.get(GPUManufacturer, gpu.gpu_manufacturer_id):
            raise HTTPException(status_code=400, detail="Invalid GPU manufacturer")

    if gpu.gpu_brand_id is not None:
        if not db.get(GPUBrand, gpu.gpu_brand_id):
            raise HTTPException(status_code=400, detail="Invalid GPU brand")

    if gpu.gpu_model_id is not None:
        model = db.get(GPUModel, gpu.gpu_model_id)
        if not model:
            raise HTTPException(status_code=400, detail="Invalid GPU model")

        effective_brand_id = gpu.gpu_brand_id if gpu.gpu_brand_id is not None else db_gpu.gpu_brand_id
        if model.gpu_brand_id != effective_brand_id:
            raise HTTPException(status_code=400, detail="GPU model does not belong to the specified brand")

    if gpu.gpu_vram_type_id is not None:
        if not db.get(GPUVRAMType, gpu.gpu_vram_type_id):
            raise HTTPException(status_code=400, detail="Invalid GPU VRAM type")

    db_gpu.vram_size = gpu.vram_size
    db_gpu.serial = gpu.serial
    db_gpu.gpu_manufacturer_id = gpu.gpu_manufacturer_id
    db_gpu.gpu_brand_id = gpu.gpu_brand_id
    db_gpu.gpu_model_id = gpu.gpu_model_id
    db_gpu.gpu_vram_type_id = gpu.gpu_vram_type_id

    try:
        db.commit()
        db.refresh(db_gpu)
        return db_gpu
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate GPU spec for this model (vram type + size)")


@router.delete("/{gpu_id}")
def delete_gpu(gpu_id: int, db: Session = Depends(get_db)):
    g = db.get(GPU, gpu_id)
    if not g:
        raise HTTPException(status_code=404, detail="GPU not found")

    db.delete(g)
    db.commit()
    return {"message": "GPU deleted successfully"}
