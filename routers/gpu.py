from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from database import engine
from models.gpu import GPU, GPUManufacturer, GPUBrand, GPUModel, GPUVRAMType

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

# GPUManufacturer CRUD Operations
@router.post("/manufacturer/", response_model=GPUManufacturer)
def create_gpu_manufacturer(gpu_manufacturer: GPUManufacturer, db: Session = Depends(get_db)):
    db.add(gpu_manufacturer)
    db.commit()
    db.refresh(gpu_manufacturer)
    return gpu_manufacturer

@router.get("/manufacturer/", response_model=list[GPUManufacturer])
def get_gpu_manufacturers(db: Session = Depends(get_db)):
    gpu_manufacturers = db.exec(select(GPUManufacturer)).all()
    return gpu_manufacturers

@router.get("/manufacturer/{manufacturer_id}", response_model=GPUManufacturer)
def get_gpu_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    gpu_manufacturer = db.get(GPUManufacturer, manufacturer_id)
    if gpu_manufacturer is None:
        raise HTTPException(status_code=404, detail="GPU manufacturer not found")
    return gpu_manufacturer

@router.put("/manufacturer/{manufacturer_id}", response_model=GPUManufacturer)
def update_gpu_manufacturer(manufacturer_id: int, gpu_manufacturer: GPUManufacturer, db: Session = Depends(get_db)):
    db_gpu_manufacturer = db.get(GPUManufacturer, manufacturer_id)
    if db_gpu_manufacturer is None:
        raise HTTPException(status_code=404, detail="GPU manufacturer not found")

    db_gpu_manufacturer.name = gpu_manufacturer.name

    db.commit()
    db.refresh(db_gpu_manufacturer)
    return db_gpu_manufacturer

@router.delete("/manufacturer/{manufacturer_id}")
def delete_gpu_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    gpu_manufacturer = db.get(GPUManufacturer, manufacturer_id)
    if gpu_manufacturer is None:
        raise HTTPException(status_code=404, detail="GPU manufacturer not found")

    db.delete(gpu_manufacturer)
    db.commit()
    return {"message": "GPU manufacturer deleted successfully"}

# GPUBrand CRUD Operations
@router.post("/brand/", response_model=GPUBrand)
def create_gpu_brand(gpu_brand: GPUBrand, db: Session = Depends(get_db)):
    db.add(gpu_brand)
    db.commit()
    db.refresh(gpu_brand)
    return gpu_brand

@router.get("/brand/", response_model=list[GPUBrand])
def get_gpu_brands(db: Session = Depends(get_db)):
    gpu_brands = db.exec(select(GPUBrand)).all()
    return gpu_brands

@router.get("/brand/{brand_id}", response_model=GPUBrand)
def get_gpu_brand(brand_id: int, db: Session = Depends(get_db)):
    gpu_brand = db.get(GPUBrand, brand_id)
    if gpu_brand is None:
        raise HTTPException(status_code=404, detail="GPU brand not found")
    return gpu_brand

@router.put("/brand/{brand_id}", response_model=GPUBrand)
def update_gpu_brand(brand_id: int, gpu_brand: GPUBrand, db: Session = Depends(get_db)):
    db_gpu_brand = db.get(GPUBrand, brand_id)
    if db_gpu_brand is None:
        raise HTTPException(status_code=404, detail="GPU brand not found")

    db_gpu_brand.name = gpu_brand.name

    db.commit()
    db.refresh(db_gpu_brand)
    return db_gpu_brand

@router.delete("/brand/{brand_id}")
def delete_gpu_brand(brand_id: int, db: Session = Depends(get_db)):
    gpu_brand = db.get(GPUBrand, brand_id)
    if gpu_brand is None:
        raise HTTPException(status_code=404, detail="GPU brand not found")

    db.delete(gpu_brand)
    db.commit()
    return {"message": "GPU brand deleted successfully"}

# GPUModel CRUD Operations
@router.post("/model/", response_model=GPUModel)
def create_gpu_model(gpu_model: GPUModel, db: Session = Depends(get_db)):
    db.add(gpu_model)
    db.commit()
    db.refresh(gpu_model)
    return gpu_model

@router.get("/model/", response_model=list[GPUModel])
def get_gpu_models(db: Session = Depends(get_db)):
    gpu_models = db.exec(select(GPUModel)).all()
    return gpu_models

@router.get("/model/{model_id}", response_model=GPUModel)
def get_gpu_model(model_id: int, db: Session = Depends(get_db)):
    gpu_model = db.get(GPUModel, model_id)
    if gpu_model is None:
        raise HTTPException(status_code=404, detail="GPU model not found")
    return gpu_model

@router.put("/model/{model_id}", response_model=GPUModel)
def update_gpu_model(model_id: int, gpu_model: GPUModel, db: Session = Depends(get_db)):
    db_gpu_model = db.get(GPUModel, model_id)
    if db_gpu_model is None:
        raise HTTPException(status_code=404, detail="GPU model not found")

    db_gpu_model.name = gpu_model.name

    db.commit()
    db.refresh(db_gpu_model)
    return db_gpu_model

@router.delete("/model/{model_id}")
def delete_gpu_model(model_id: int, db: Session = Depends(get_db)):
    gpu_model = db.get(GPUModel, model_id)
    if gpu_model is None:
        raise HTTPException(status_code=404, detail="GPU model not found")

    db.delete(gpu_model)
    db.commit()
    return {"message": "GPU model deleted successfully"}

# GPUVRAMType CRUD Operations
@router.post("/vram_type/", response_model=GPUVRAMType)
def create_gpu_vram_type(gpu_vram_type: GPUVRAMType, db: Session = Depends(get_db)):
    db.add(gpu_vram_type)
    db.commit()
    db.refresh(gpu_vram_type)
    return gpu_vram_type

@router.get("/vram_type/", response_model=list[GPUVRAMType])
def get_gpu_vram_types(db: Session = Depends(get_db)):
    gpu_vram_types = db.exec(select(GPUVRAMType)).all()
    return gpu_vram_types

@router.get("/vram_type/{vram_type_id}", response_model=GPUVRAMType)
def get_gpu_vram_type(vram_type_id: int, db: Session = Depends(get_db)):
    gpu_vram_type = db.get(GPUVRAMType, vram_type_id)
    if gpu_vram_type is None:
        raise HTTPException(status_code=404, detail="GPU VRAM type not found")
    return gpu_vram_type

@router.put("/vram_type/{vram_type_id}", response_model=GPUVRAMType)
def update_gpu_vram_type(vram_type_id: int, gpu_vram_type: GPUVRAMType, db: Session = Depends(get_db)):
    db_gpu_vram_type = db.get(GPUVRAMType, vram_type_id)
    if db_gpu_vram_type is None:
        raise HTTPException(status_code=404, detail="GPU VRAM type not found")

    db_gpu_vram_type.name = gpu_vram_type.name

    db.commit()
    db.refresh(db_gpu_vram_type)
    return db_gpu_vram_type

@router.delete("/vram_type/{vram_type_id}")
def delete_gpu_vram_type(vram_type_id: int, db: Session = Depends(get_db)):
    gpu_vram_type = db.get(GPUVRAMType, vram_type_id)
    if gpu_vram_type is None:
        raise HTTPException(status_code=404, detail="GPU VRAM type not found")

    db.delete(gpu_vram_type)
    db.commit()
    return {"message": "GPU VRAM type deleted successfully"}

# GPU CRUD Operations
@router.post("/", response_model=GPU)
def create_gpu(gpu: GPU, db: Session = Depends(get_db)):
    db.add(gpu)
    db.commit()
    db.refresh(gpu)
    return gpu

@router.get("/", response_model=list[GPU])
def get_gpus(db: Session = Depends(get_db)):
    gpus = db.exec(select(GPU)).all()
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

    db_gpu.vram_size = gpu.vram_size
    db_gpu.serial = gpu.serial
    db_gpu.gpu_manufacturer_id = gpu.gpu_manufacturer_id
    db_gpu.gpu_brand_id = gpu.gpu_brand_id
    db_gpu.gpu_model_id = gpu.gpu_model_id
    db_gpu.gpu_vram_type_id = gpu.gpu_vram_type_id

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