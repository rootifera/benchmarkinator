from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from utils.helper import validate_and_normalize_name
from models.ram import RAMBrand, RAMType, RAMModule
from models.config import Config
from database import get_db

router = APIRouter()


def _nz(s: str | None) -> str:
    """Ensure a non-empty, stripped string (for required fields like size)."""
    if s is None or not s.strip():
        raise HTTPException(status_code=400, detail="size must not be empty")
    return s.strip()


def _clean_opt(s: str | None) -> str | None:
    """Strip string if provided, else return None."""
    return s.strip() if s and s.strip() else None


# -------------------- Brands -------------------- #

@router.post("/brand/", response_model=RAMBrand)
def create_ram_brand(brand: RAMBrand, db: Session = Depends(get_db)):
    brand.name = validate_and_normalize_name(brand.name, db, RAMBrand)
    db.add(brand)
    try:
        db.commit()
        db.refresh(brand)
        return brand
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="RAM brand already exists")


@router.get("/brand/", response_model=list[RAMBrand])
def get_ram_brands(db: Session = Depends(get_db)):
    return db.exec(select(RAMBrand)).all()


@router.get("/brand/{brand_id}", response_model=RAMBrand)
def get_ram_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.get(RAMBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="RAM brand not found")
    return b


@router.delete("/brand/{brand_id}")
def delete_ram_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.get(RAMBrand, brand_id)
    if not b:
        raise HTTPException(status_code=404, detail="RAM brand not found")

    has_modules = db.exec(select(RAMModule).where(RAMModule.brand_id == brand_id)).first()
    if has_modules:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete RAM brand with existing modules.")

    db.delete(b)
    db.commit()
    return {"message": "RAM brand deleted successfully"}


# -------------------- Types -------------------- #

@router.post("/type/", response_model=RAMType)
def create_ram_type(rtype: RAMType, db: Session = Depends(get_db)):
    rtype.name = validate_and_normalize_name(rtype.name, db, RAMType)
    db.add(rtype)
    try:
        db.commit()
        db.refresh(rtype)
        return rtype
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="RAM type already exists")


@router.get("/type/", response_model=list[RAMType])
def get_ram_types(db: Session = Depends(get_db)):
    return db.exec(select(RAMType)).all()


@router.get("/type/{type_id}", response_model=RAMType)
def get_ram_type(type_id: int, db: Session = Depends(get_db)):
    t = db.get(RAMType, type_id)
    if not t:
        raise HTTPException(status_code=404, detail="RAM type not found")
    return t


@router.delete("/type/{type_id}")
def delete_ram_type(type_id: int, db: Session = Depends(get_db)):
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
def create_ram_module(mod: RAMModule, db: Session = Depends(get_db)):
    if not db.get(RAMBrand, mod.brand_id):
        raise HTTPException(status_code=400, detail="Invalid RAM brand")
    if not db.get(RAMType, mod.type_id):
        raise HTTPException(status_code=400, detail="Invalid RAM type")

    mod.size = _nz(mod.size)
    mod.speed_mhz = _clean_opt(mod.speed_mhz)
    mod.part_number = _clean_opt(mod.part_number)
    mod.notes = _clean_opt(mod.notes)

    db.add(mod)
    try:
        db.commit()
        db.refresh(mod)
        return mod
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create RAM module")


@router.get("/module/", response_model=list[RAMModule])
def get_ram_modules(db: Session = Depends(get_db)):
    return db.exec(select(RAMModule)).all()


@router.get("/module/{module_id}", response_model=RAMModule)
def get_ram_module(module_id: int, db: Session = Depends(get_db)):
    m = db.get(RAMModule, module_id)
    if not m:
        raise HTTPException(status_code=404, detail="RAM module not found")
    return m


@router.delete("/module/{module_id}")
def delete_ram_module(module_id: int, db: Session = Depends(get_db)):
    m = db.get(RAMModule, module_id)
    if not m:
        raise HTTPException(status_code=404, detail="RAM module not found")

    in_config = db.exec(select(Config).where(Config.ram_module_id == module_id)).first()
    if in_config:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete RAM module because it is referenced by one or more config records."
        )

    db.delete(m)
    db.commit()
    return {"message": "RAM module deleted successfully"}


@router.put("/module/{module_id}", response_model=RAMModule)
def update_ram_module(module_id: int, mod: RAMModule, db: Session = Depends(get_db)):
    """
    Update a RAM module.
    - brand_id / type_id may change but must reference existing Brand/Type
    - size is required (non-empty, free text)
    - speed_mhz / part_number / notes are optional (free text, normalized)
    """
    db_m = db.get(RAMModule, module_id)
    if not db_m:
        raise HTTPException(status_code=404, detail="RAM module not found")

    if mod.brand_id is not None and mod.brand_id != db_m.brand_id:
        if not db.get(RAMBrand, mod.brand_id):
            raise HTTPException(status_code=400, detail="Invalid RAM brand")
        db_m.brand_id = mod.brand_id

    if mod.type_id is not None and mod.type_id != db_m.type_id:
        if not db.get(RAMType, mod.type_id):
            raise HTTPException(status_code=400, detail="Invalid RAM type")
        db_m.type_id = mod.type_id

    if mod.size is not None:
        s = (mod.size or "").strip()
        if not s:
            raise HTTPException(status_code=400, detail="size must not be empty")
        db_m.size = s

    if mod.speed_mhz is not None:
        db_m.speed_mhz = mod.speed_mhz.strip() or None
    if mod.part_number is not None:
        db_m.part_number = mod.part_number.strip() or None
    if mod.notes is not None:
        db_m.notes = mod.notes.strip() or None

    try:
        db.commit()
        db.refresh(db_m)
        return db_m
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update RAM module")
