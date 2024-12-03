from fastapi import APIRouter, HTTPException, Depends
from models.ram import RAM
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/", response_model=RAM)
def create_ram(ram: RAM, db: Session = Depends(get_db)):
    db.add(ram)
    db.commit()
    db.refresh(ram)
    return ram


@router.get("/", response_model=list[RAM])
def get_rams(db: Session = Depends(get_db)):
    rams = db.exec(select(RAM)).all()
    return rams


@router.get("/{ram_id}", response_model=RAM)
def get_ram(ram_id: int, db: Session = Depends(get_db)):
    ram = db.get(RAM, ram_id)
    if ram is None:
        raise HTTPException(status_code=404, detail="RAM not found")
    return ram


@router.put("/{ram_id}", response_model=RAM)
def update_ram(ram_id: int, ram: RAM, db: Session = Depends(get_db)):
    db_ram = db.get(RAM, ram_id)
    if db_ram is None:
        raise HTTPException(status_code=404, detail="RAM not found")

    db_ram.name = ram.name

    db.commit()
    db.refresh(db_ram)
    return db_ram


@router.delete("/{ram_id}")
def delete_ram(ram_id: int, db: Session = Depends(get_db)):
    ram = db.get(RAM, ram_id)
    if ram is None:
        raise HTTPException(status_code=404, detail="RAM not found")

    db.delete(ram)
    db.commit()
    return {"message": "RAM deleted successfully"}
