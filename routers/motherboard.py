from fastapi import APIRouter, HTTPException, Depends
from models.motherboard import Motherboard
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/", response_model=Motherboard)
def create_motherboard(motherboard: Motherboard, db: Session = Depends(get_db)):
    db.add(motherboard)
    db.commit()
    db.refresh(motherboard)
    return motherboard


@router.get("/", response_model=list[Motherboard])
def get_motherboards(db: Session = Depends(get_db)):
    motherboards = db.execute(select(Motherboard)).scalars().all()
    return motherboards


@router.get("/{motherboard_id}", response_model=Motherboard)
def get_motherboard(motherboard_id: int, db: Session = Depends(get_db)):
    motherboard = db.get(Motherboard, motherboard_id)
    if motherboard is None:
        raise HTTPException(status_code=404, detail="Motherboard not found")
    return motherboard


@router.put("/{motherboard_id}", response_model=Motherboard)
def update_motherboard(motherboard_id: int, motherboard: Motherboard, db: Session = Depends(get_db)):
    db_motherboard = db.get(Motherboard, motherboard_id)
    if db_motherboard is None:
        raise HTTPException(status_code=404, detail="Motherboard not found")

    db_motherboard.manufacturer = motherboard.manufacturer
    db_motherboard.chipset = motherboard.chipset
    db_motherboard.serial = motherboard.serial

    db.commit()
    db.refresh(db_motherboard)
    return db_motherboard


@router.delete("/{motherboard_id}")
def delete_motherboard(motherboard_id: int, db: Session = Depends(get_db)):
    motherboard = db.get(Motherboard, motherboard_id)
    if motherboard is None:
        raise HTTPException(status_code=404, detail="Motherboard not found")

    db.delete(motherboard)
    db.commit()
    return {"message": "Motherboard deleted successfully"}
