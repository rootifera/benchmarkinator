from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from models.ram import RAM
from models.config import Config
from database import get_db
from utils.helper import validate_and_normalize_name

router = APIRouter()

@router.post("/", response_model=RAM)
def create_ram(ram: RAM, db: Session = Depends(get_db)):
    ram.name = validate_and_normalize_name(ram.name, db, RAM)
    db.add(ram)
    db.commit()
    db.refresh(ram)
    return ram

@router.get("/", response_model=list[RAM])
def get_rams(db: Session = Depends(get_db)):
    return db.exec(select(RAM)).all()

@router.get("/{ram_id}", response_model=RAM)
def get_ram(ram_id: int, db: Session = Depends(get_db)):
    r = db.get(RAM, ram_id)
    if not r:
        raise HTTPException(status_code=404, detail="RAM not found")
    return r

@router.put("/{ram_id}", response_model=RAM)
def update_ram(ram_id: int, ram: RAM, db: Session = Depends(get_db)):
    r = db.get(RAM, ram_id)
    if not r:
        raise HTTPException(status_code=404, detail="RAM not found")
    ram.name = validate_and_normalize_name(ram.name, db, RAM, current_id=ram_id)
    r.name = ram.name
    db.commit()
    db.refresh(r)
    return r

@router.delete("/{ram_id}")
def delete_ram(ram_id: int, db: Session = Depends(get_db)):
    r = db.get(RAM, ram_id)
    if not r:
        raise HTTPException(status_code=404, detail="RAM not found")

    in_config = db.exec(select(Config).where(Config.ram_id == ram_id)).first()
    if in_config:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete RAM because it is referenced by one or more config records."
        )

    db.delete(r)
    db.commit()
    return {"message": "RAM deleted successfully"}
