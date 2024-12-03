from fastapi import APIRouter, HTTPException, Depends
from models.cpu import CPU, CPUBrand, CPUFamily
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


# CPUBrand CRUD Operations
@router.post("/brand/", response_model=CPUBrand)
def create_cpu_brand(cpu_brand: CPUBrand, db: Session = Depends(get_db)):
    db.add(cpu_brand)
    db.commit()
    db.refresh(cpu_brand)
    return cpu_brand


@router.get("/brand/", response_model=list[CPUBrand])
def get_cpu_brands(db: Session = Depends(get_db)):
    cpu_brands = db.exec(select(CPUBrand)).all()
    return cpu_brands


@router.get("/brand/{brand_id}", response_model=CPUBrand)
def get_cpu_brand(brand_id: int, db: Session = Depends(get_db)):
    cpu_brand = db.get(CPUBrand, brand_id)
    if cpu_brand is None:
        raise HTTPException(status_code=404, detail="CPU brand not found")
    return cpu_brand


@router.put("/brand/{brand_id}", response_model=CPUBrand)
def update_cpu_brand(brand_id: int, cpu_brand: CPUBrand, db: Session = Depends(get_db)):
    db_cpu_brand = db.get(CPUBrand, brand_id)
    if db_cpu_brand is None:
        raise HTTPException(status_code=404, detail="CPU brand not found")

    db_cpu_brand.name = cpu_brand.name

    db.commit()
    db.refresh(db_cpu_brand)
    return db_cpu_brand


@router.delete("/brand/{brand_id}")
def delete_cpu_brand(brand_id: int, db: Session = Depends(get_db)):
    cpu_brand = db.get(CPUBrand, brand_id)
    if cpu_brand is None:
        raise HTTPException(status_code=404, detail="CPU brand not found")

    db.delete(cpu_brand)
    db.commit()
    return {"message": "CPU brand deleted successfully"}


# CPUFamily CRUD Operations
@router.post("/family/", response_model=CPUFamily)
def create_cpu_family(cpu_family: CPUFamily, db: Session = Depends(get_db)):
    db.add(cpu_family)
    db.commit()
    db.refresh(cpu_family)
    return cpu_family


@router.get("/family/", response_model=list[CPUFamily])
def get_cpu_families(db: Session = Depends(get_db)):
    cpu_families = db.exec(select(CPUFamily)).all()
    return cpu_families


@router.get("/family/{family_id}", response_model=CPUFamily)
def get_cpu_family(family_id: int, db: Session = Depends(get_db)):
    cpu_family = db.get(CPUFamily, family_id)
    if cpu_family is None:
        raise HTTPException(status_code=404, detail="CPU family not found")
    return cpu_family


@router.put("/family/{family_id}", response_model=CPUFamily)
def update_cpu_family(family_id: int, cpu_family: CPUFamily, db: Session = Depends(get_db)):
    db_cpu_family = db.get(CPUFamily, family_id)
    if db_cpu_family is None:
        raise HTTPException(status_code=404, detail="CPU family not found")

    db_cpu_family.name = cpu_family.name

    db.commit()
    db.refresh(db_cpu_family)
    return db_cpu_family


@router.delete("/family/{family_id}")
def delete_cpu_family(family_id: int, db: Session = Depends(get_db)):
    cpu_family = db.get(CPUFamily, family_id)
    if cpu_family is None:
        raise HTTPException(status_code=404, detail="CPU family not found")

    db.delete(cpu_family)
    db.commit()
    return {"message": "CPU family deleted successfully"}


# CPU CRUD Operations
@router.post("/", response_model=CPU)
def create_cpu(cpu: CPU, db: Session = Depends(get_db)):
    db.add(cpu)
    db.commit()
    db.refresh(cpu)
    return cpu


@router.get("/", response_model=list[CPU])
def get_cpus(db: Session = Depends(get_db)):
    cpus = db.exec(select(CPU)).all()
    return cpus


@router.get("/{cpu_id}", response_model=CPU)
def get_cpu(cpu_id: int, db: Session = Depends(get_db)):
    cpu = db.get(CPU, cpu_id)
    if cpu is None:
        raise HTTPException(status_code=404, detail="CPU not found")
    return cpu


@router.put("/{cpu_id}", response_model=CPU)
def update_cpu(cpu_id: int, cpu: CPU, db: Session = Depends(get_db)):
    db_cpu = db.get(CPU, cpu_id)
    if db_cpu is None:
        raise HTTPException(status_code=404, detail="CPU not found")

    db_cpu.model = cpu.model
    db_cpu.speed = cpu.speed
    db_cpu.core_count = cpu.core_count
    db_cpu.serial = cpu.serial
    db_cpu.cpu_brand_id = cpu.cpu_brand_id
    db_cpu.cpu_family_id = cpu.cpu_family_id

    db.commit()
    db.refresh(db_cpu)
    return db_cpu


@router.delete("/{cpu_id}")
def delete_cpu(cpu_id: int, db: Session = Depends(get_db)):
    cpu = db.get(CPU, cpu_id)
    if cpu is None:
        raise HTTPException(status_code=404, detail="CPU not found")

    db.delete(cpu)
    db.commit()
    return {"message": "CPU deleted successfully"}
