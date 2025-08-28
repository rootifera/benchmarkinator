from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.cpu import CPU, CPUBrand, CPUFamily
from database import get_db

router = APIRouter()


@router.post("/brand/", response_model=CPUBrand)
def create_cpu_brand(cpu_brand: CPUBrand, db: Session = Depends(get_db)):
    cpu_brand.name = validate_and_normalize_name(cpu_brand.name, db, CPUBrand)
    db.add(cpu_brand)
    db.commit()
    db.refresh(cpu_brand)
    return cpu_brand


@router.get("/brand/", response_model=list[CPUBrand])
def get_cpu_brands(db: Session = Depends(get_db)):
    return db.exec(select(CPUBrand)).all()


@router.get("/brand/{brand_id}", response_model=CPUBrand)
def get_cpu_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.get(CPUBrand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="CPU brand not found")
    return brand


@router.put("/brand/{brand_id}", response_model=CPUBrand)
def update_cpu_brand(brand_id: int, cpu_brand: CPUBrand, db: Session = Depends(get_db)):
    db_brand = db.get(CPUBrand, brand_id)
    if not db_brand:
        raise HTTPException(status_code=404, detail="CPU brand not found")

    cpu_brand.name = validate_and_normalize_name(cpu_brand.name, db, CPUBrand, current_id=brand_id)
    db_brand.name = cpu_brand.name
    db.commit()
    db.refresh(db_brand)
    return db_brand


@router.delete("/brand/{brand_id}")
def delete_cpu_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.get(CPUBrand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="CPU brand not found")

    has_family = db.exec(select(CPUFamily).where(CPUFamily.cpu_brand_id == brand_id)).first()
    has_cpu = db.exec(select(CPU).where(CPU.cpu_brand_id == brand_id)).first()
    if has_family or has_cpu:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete brand with existing families or CPUs."
        )

    db.delete(brand)
    db.commit()
    return {"message": "CPU brand deleted successfully"}


# ---------- Families ----------

@router.post("/family/", response_model=CPUFamily)
def create_cpu_family(cpu_family: CPUFamily, db: Session = Depends(get_db)):
    cpu_family.name = validate_and_normalize_name(cpu_family.name, db, CPUFamily)

    brand = db.get(CPUBrand, cpu_family.cpu_brand_id)
    if not brand:
        raise HTTPException(status_code=400, detail="Invalid CPU brand")

    db.add(cpu_family)
    db.commit()
    db.refresh(cpu_family)
    return cpu_family


@router.get("/family/", response_model=list[CPUFamily])
def get_cpu_families(db: Session = Depends(get_db)):
    return db.exec(select(CPUFamily)).all()


@router.get("/family/{family_id}", response_model=CPUFamily)
def get_cpu_family(family_id: int, db: Session = Depends(get_db)):
    family = db.get(CPUFamily, family_id)
    if not family:
        raise HTTPException(status_code=404, detail="CPU family not found")
    return family


@router.put("/family/{family_id}", response_model=CPUFamily)
def update_cpu_family(family_id: int, cpu_family: CPUFamily, db: Session = Depends(get_db)):
    db_family = db.get(CPUFamily, family_id)
    if not db_family:
        raise HTTPException(status_code=404, detail="CPU family not found")

    cpu_family.name = validate_and_normalize_name(cpu_family.name, db, CPUFamily, current_id=family_id)

    if cpu_family.cpu_brand_id is not None and cpu_family.cpu_brand_id != db_family.cpu_brand_id:
        if not db.get(CPUBrand, cpu_family.cpu_brand_id):
            raise HTTPException(status_code=400, detail="Invalid CPU brand")
        db_family.cpu_brand_id = cpu_family.cpu_brand_id

    db_family.name = cpu_family.name
    try:
        db.commit()
        db.refresh(db_family)
        return db_family
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Family name already exists under this brand")


@router.delete("/family/{family_id}")
def delete_cpu_family(family_id: int, db: Session = Depends(get_db)):
    family = db.get(CPUFamily, family_id)
    if not family:
        raise HTTPException(status_code=404, detail="CPU family not found")

    has_cpu = db.exec(select(CPU).where(CPU.cpu_family_id == family_id)).first()
    if has_cpu:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete family with existing CPUs."
        )

    db.delete(family)
    db.commit()
    return {"message": "CPU family deleted successfully"}


@router.post("/", response_model=CPU)
def create_cpu(cpu: CPU, db: Session = Depends(get_db)):
    brand = db.get(CPUBrand, cpu.cpu_brand_id)
    if not brand:
        raise HTTPException(status_code=400, detail="Invalid CPU brand")

    family = db.get(CPUFamily, cpu.cpu_family_id)
    if not family:
        raise HTTPException(status_code=400, detail="Invalid CPU family")
    if family.cpu_brand_id != cpu.cpu_brand_id:
        raise HTTPException(status_code=400, detail="CPU family does not belong to the specified brand")

    db.add(cpu)
    try:
        db.commit()
        db.refresh(cpu)
        return cpu
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate CPU for this family (model+speed)")


@router.get("/", response_model=list[CPU])
def get_cpus(db: Session = Depends(get_db)):
    return db.exec(select(CPU)).all()


@router.get("/{cpu_id}", response_model=CPU)
def get_cpu(cpu_id: int, db: Session = Depends(get_db)):
    cpu = db.get(CPU, cpu_id)
    if not cpu:
        raise HTTPException(status_code=404, detail="CPU not found")
    return cpu


@router.put("/{cpu_id}", response_model=CPU)
def update_cpu(cpu_id: int, cpu: CPU, db: Session = Depends(get_db)):
    db_cpu = db.get(CPU, cpu_id)
    if not db_cpu:
        raise HTTPException(status_code=404, detail="CPU not found")

    if cpu.cpu_brand_id is not None:
        brand = db.get(CPUBrand, cpu.cpu_brand_id)
        if not brand:
            raise HTTPException(status_code=400, detail="Invalid CPU brand")

    if cpu.cpu_family_id is not None:
        family = db.get(CPUFamily, cpu.cpu_family_id)
        if not family:
            raise HTTPException(status_code=400, detail="Invalid CPU family")
        if (cpu.cpu_brand_id or db_cpu.cpu_brand_id) != family.cpu_brand_id:
            raise HTTPException(status_code=400, detail="CPU family does not belong to the specified brand")

    db_cpu.model = cpu.model
    db_cpu.speed = cpu.speed
    db_cpu.core_count = cpu.core_count
    db_cpu.serial = cpu.serial
    db_cpu.cpu_brand_id = cpu.cpu_brand_id
    db_cpu.cpu_family_id = cpu.cpu_family_id

    try:
        db.commit()
        db.refresh(db_cpu)
        return db_cpu
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate CPU for this family (model+speed)")


@router.delete("/{cpu_id}", status_code=status.HTTP_200_OK)
def delete_cpu(cpu_id: int, db: Session = Depends(get_db)):
    cpu = db.get(CPU, cpu_id)
    if not cpu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CPU not found")

    try:
        db.delete(cpu)
        db.commit()
        return {"message": "CPU deleted successfully"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete CPU because it is referenced by one or more config records."
        )
