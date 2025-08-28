from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.motherboard import MotherboardManufacturer, MotherboardChipset, Motherboard
from models.config import Config
from database import get_db

router = APIRouter()

# -------------------- Manufacturers -------------------- #

@router.post("/manufacturer/", response_model=MotherboardManufacturer)
def create_manufacturer(manufacturer: MotherboardManufacturer, db: Session = Depends(get_db)):
    manufacturer.name = validate_and_normalize_name(manufacturer.name, db, MotherboardManufacturer)
    db.add(manufacturer)
    db.commit()
    db.refresh(manufacturer)
    return manufacturer


@router.get("/manufacturer/", response_model=list[MotherboardManufacturer])
def get_manufacturers(db: Session = Depends(get_db)):
    return db.exec(select(MotherboardManufacturer)).all()


@router.get("/manufacturer/{manufacturer_id}", response_model=MotherboardManufacturer)
def get_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    m = db.get(MotherboardManufacturer, manufacturer_id)
    if not m:
        raise HTTPException(status_code=404, detail="Motherboard manufacturer not found")
    return m


@router.put("/manufacturer/{manufacturer_id}", response_model=MotherboardManufacturer)
def update_manufacturer(manufacturer_id: int, manufacturer: MotherboardManufacturer, db: Session = Depends(get_db)):
    db_m = db.get(MotherboardManufacturer, manufacturer_id)
    if not db_m:
        raise HTTPException(status_code=404, detail="Motherboard manufacturer not found")

    manufacturer.name = validate_and_normalize_name(
        manufacturer.name, db, MotherboardManufacturer, current_id=manufacturer_id
    )
    db_m.name = manufacturer.name
    db.commit()
    db.refresh(db_m)
    return db_m


@router.delete("/manufacturer/{manufacturer_id}")
def delete_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    m = db.get(MotherboardManufacturer, manufacturer_id)
    if not m:
        raise HTTPException(status_code=404, detail="Motherboard manufacturer not found")

    has_board = db.exec(select(Motherboard).where(Motherboard.manufacturer_id == manufacturer_id)).first()
    if has_board:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete manufacturer with existing motherboards."
        )

    db.delete(m)
    db.commit()
    return {"message": "Motherboard manufacturer deleted successfully"}



@router.post("/chipset/", response_model=MotherboardChipset)
def create_chipset(chipset: MotherboardChipset, db: Session = Depends(get_db)):
    chipset.name = validate_and_normalize_name(chipset.name, db, MotherboardChipset)
    db.add(chipset)
    db.commit()
    db.refresh(chipset)
    return chipset


@router.get("/chipset/", response_model=list[MotherboardChipset])
def get_chipsets(db: Session = Depends(get_db)):
    return db.exec(select(MotherboardChipset)).all()


@router.get("/chipset/{chipset_id}", response_model=MotherboardChipset)
def get_chipset(chipset_id: int, db: Session = Depends(get_db)):
    c = db.get(MotherboardChipset, chipset_id)
    if not c:
        raise HTTPException(status_code=404, detail="Motherboard chipset not found")
    return c


@router.put("/chipset/{chipset_id}", response_model=MotherboardChipset)
def update_chipset(chipset_id: int, chipset: MotherboardChipset, db: Session = Depends(get_db)):
    db_c = db.get(MotherboardChipset, chipset_id)
    if not db_c:
        raise HTTPException(status_code=404, detail="Motherboard chipset not found")

    chipset.name = validate_and_normalize_name(chipset.name, db, MotherboardChipset, current_id=chipset_id)
    db_c.name = chipset.name
    db.commit()
    db.refresh(db_c)
    return db_c


@router.delete("/chipset/{chipset_id}")
def delete_chipset(chipset_id: int, db: Session = Depends(get_db)):
    c = db.get(MotherboardChipset, chipset_id)
    if not c:
        raise HTTPException(status_code=404, detail="Motherboard chipset not found")

    has_board = db.exec(select(Motherboard).where(Motherboard.chipset_id == chipset_id)).first()
    if has_board:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete chipset with existing motherboards."
        )

    db.delete(c)
    db.commit()
    return {"message": "Motherboard chipset deleted successfully"}



@router.post("/", response_model=Motherboard)
def create_motherboard(board: Motherboard, db: Session = Depends(get_db)):
    # Validate FKs
    if not db.get(MotherboardManufacturer, board.manufacturer_id):
        raise HTTPException(status_code=400, detail="Invalid motherboard manufacturer")
    if not db.get(MotherboardChipset, board.chipset_id):
        raise HTTPException(status_code=400, detail="Invalid motherboard chipset")

    db.add(board)
    try:
        db.commit()
        db.refresh(board)
        return board
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate motherboard for this manufacturer (model already exists)")


@router.get("/", response_model=list[Motherboard])
def get_motherboards(db: Session = Depends(get_db)):
    return db.exec(select(Motherboard)).all()


@router.get("/{board_id}", response_model=Motherboard)
def get_motherboard(board_id: int, db: Session = Depends(get_db)):
    b = db.get(Motherboard, board_id)
    if not b:
        raise HTTPException(status_code=404, detail="Motherboard not found")
    return b


@router.put("/{board_id}", response_model=Motherboard)
def update_motherboard(board_id: int, board: Motherboard, db: Session = Depends(get_db)):
    db_b = db.get(Motherboard, board_id)
    if not db_b:
        raise HTTPException(status_code=404, detail="Motherboard not found")

    if board.manufacturer_id is not None:
        if not db.get(MotherboardManufacturer, board.manufacturer_id):
            raise HTTPException(status_code=400, detail="Invalid motherboard manufacturer")
        db_b.manufacturer_id = board.manufacturer_id

    if board.chipset_id is not None:
        if not db.get(MotherboardChipset, board.chipset_id):
            raise HTTPException(status_code=400, detail="Invalid motherboard chipset")
        db_b.chipset_id = board.chipset_id

    db_b.model = board.model
    db_b.serial = board.serial
    db_b.notes = board.notes

    try:
        db.commit()
        db.refresh(db_b)
        return db_b
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate motherboard for this manufacturer (model already exists)")


@router.delete("/{board_id}")
def delete_motherboard(board_id: int, db: Session = Depends(get_db)):
    b = db.get(Motherboard, board_id)
    if not b:
        raise HTTPException(status_code=404, detail="Motherboard not found")

    in_config = db.exec(select(Config).where(Config.motherboard_id == board_id)).first()
    if in_config:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete motherboard because it is referenced by one or more config records."
        )

    db.delete(b)
    db.commit()
    return {"message": "Motherboard deleted successfully"}
