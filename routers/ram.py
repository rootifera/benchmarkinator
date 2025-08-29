from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.ram import RAMBrand, RAMType, RAMModule
from database import get_db

router = APIRouter()

# -------------------- Brands -------------------- #

@router.post("/brand/", response_model=RAMBrand)
def create_brand(brand: RAMBrand, db: Session = Depends(get_db)):
    brand.name = validate_and_normalize_name(brand.name, db, RAMBrand)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand

@router.get("/brand/", response_model=list[RAMBrand])
def get_brands(db: Session = Depends(get_db)):
    return db.exec(select(RAMBrand)).all()

@router.get("/brand/{brand_id}", response_model=RAMBrand)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.get(RAMBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="RAM brand not found")
    return b

@router.put("/brand/{brand_id}", response_model=RAMBrand)
def update_brand(brand_id: int, brand: RAMBrand, db: Session = Depends(get_db)):
    b = db.get(RAMBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="RAM brand not found")

    brand.name = validate_and_normalize_name(brand.name, db, RAMBrand, current_id=brand_id)
    b.name = brand.name
    db.commit()
    db.refresh(b)
    return b

@router.delete("/brand/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.get(RAMBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="RAM brand not found")

    has_modules = db.exec(select(RAMModule).where(RAMModule.brand_id == brand_id)).first()
    if has_modules:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete brand with existing RAM modules.")
    db.delete(b)
    db.commit()
    return {"message": "RAM brand deleted successfully"}


# -------------------- Types -------------------- #

@router.post("/type/", response_model=RAMType)
def create_type(ram_type: RAMType, db: Session = Depends(get_db)):
    ram_type.name = validate_and_normalize_name(ram_type.name, db, RAMType)
    db.add(ram_type)
    db.commit()
    db.refresh(ram_type)
    return ram_type

@router.get("/type/", response_model=list[RAMType])
def get_types(db: Session = Depends(get_db)):
    return db.exec(select(RAMType)).all()

@router.get("/type/{type_id}", response_model=RAMType)
def get_type(type_id: int, db: Session = Depends(get_db)):
    t = db.get(RAMType, type_id)
    if not t:
        raise HTTPException(status_code=404, detail="RAM type not found")
    return t

@router.put("/type/{type_id}", response_model=RAMType)
def update_type(type_id: int, ram_type: RAMType, db: Session = Depends(get_db)):
    t = db.get(RAMType, type_id)
    if not t:
        raise HTTPException(status_code=404, detail="RAM type not found")

    ram_type.name = validate_and_normalize_name(ram_type.name, db, RAMType, current_id=type_id)
    t.name = ram_type.name
    db.commit()
    db.refresh(t)
    return t

@router.delete("/type/{type_id}")
def delete_type(type_id: int, db: Session = Depends(get_db)):
    t = db.get(RAMType, type_id)
    if not t:
        raise HTTPException(status_code=404, detail="RAM type not found")

    has_modules = db.exec(select(RAMModule).where(RAMModule.type_id == type_id)).first()
    if has_modules:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete RAM type with existing modules.")
    db.delete(t)
    db.commit()
    return {"message": "RAM type deleted successfully"}


# -------------------- Modules -------------------- #

@router.post("/module/", response_model=RAMModule)
def create_module(module: RAMModule, db: Session = Depends(get_db)):
    if not db.get(RAMBrand, module.brand_id):
        raise HTTPException(status_code=400, detail="Invalid RAM brand")
    if not db.get(RAMType, module.type_id):
        raise HTTPException(status_code=400, detail="Invalid RAM type")

    db.add(module)
    try:
        db.commit()
        db.refresh(module)
        return module
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate RAM module spec (brand+type+size_mb+speed_mhz) or part number already exists")

@router.get("/module/", response_model=list[RAMModule])
def get_modules(db: Session = Depends(get_db)):
    return db.exec(select(RAMModule)).all()

@router.get("/module/{module_id}", response_model=RAMModule)
def get_module(module_id: int, db: Session = Depends(get_db)):
    m = db.get(RAMModule, module_id)
    if not m:
        raise HTTPException(status_code=404, detail="RAM module not found")
    return m

@router.put("/module/{module_id}", response_model=RAMModule)
def update_module(module_id: int, module: RAMModule, db: Session = Depends(get_db)):
    m = db.get(RAMModule, module_id)
    if not m:
        raise HTTPException(status_code=404, detail="RAM module not found")

    # Validate potential FK changes
    if module.brand_id is not None and module.brand_id != m.brand_id:
        if not db.get(RAMBrand, module.brand_id):
            raise HTTPException(status_code=400, detail="Invalid RAM brand")
        m.brand_id = module.brand_id

    if module.type_id is not None and module.type_id != m.type_id:
        if not db.get(RAMType, module.type_id):
            raise HTTPException(status_code=400, detail="Invalid RAM type")
        m.type_id = module.type_id

    # Scalar fields
    m.size_mb = module.size_mb
    m.speed_mhz = module.speed_mhz
    m.part_number = module.part_number
    m.notes = module.notes

    try:
        db.commit()
        db.refresh(m)
        return m
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate RAM module spec (brand+type+size_mb+speed_mhz) or part number already exists")

@router.delete("/module/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db)):
    m = db.get(RAMModule, module_id)
    if not m:
        raise HTTPException(status_code=404, detail="RAM module not found")

    db.delete(m)
    db.commit()
    return {"message": "RAM module deleted successfully"}
