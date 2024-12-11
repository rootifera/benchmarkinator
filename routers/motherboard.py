from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.motherboard import Motherboard, MotherboardManufacturer, MotherboardChipset
from database import get_db

router = APIRouter()


@router.post("/manufacturer/", response_model=MotherboardManufacturer)
def create_motherboard_manufacturer(motherboard_manufacturer: MotherboardManufacturer, db: Session = Depends(get_db)):
    motherboard_manufacturer.name = validate_and_normalize_name(motherboard_manufacturer.name, db,
                                                                MotherboardManufacturer)
    db.add(motherboard_manufacturer)
    db.commit()
    db.refresh(motherboard_manufacturer)
    return motherboard_manufacturer


@router.get("/manufacturer/", response_model=list[MotherboardManufacturer])
def get_motherboard_manufacturers(db: Session = Depends(get_db)):
    motherboard_manufacturers = db.exec(select(MotherboardManufacturer)).all()
    return motherboard_manufacturers


@router.get("/manufacturer/{manufacturer_id}", response_model=MotherboardManufacturer)
def get_motherboard_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    motherboard_manufacturer = db.get(MotherboardManufacturer, manufacturer_id)
    if motherboard_manufacturer is None:
        raise HTTPException(status_code=404, detail="Motherboard manufacturer not found")
    return motherboard_manufacturer


@router.put("/manufacturer/{manufacturer_id}", response_model=MotherboardManufacturer)
def update_motherboard_manufacturer(manufacturer_id: int, motherboard_manufacturer: MotherboardManufacturer,
                                    db: Session = Depends(get_db)):
    db_motherboard_manufacturer = db.get(MotherboardManufacturer, manufacturer_id)
    if db_motherboard_manufacturer is None:
        raise HTTPException(status_code=404, detail="Motherboard manufacturer not found")
    motherboard_manufacturer.name = validate_and_normalize_name(motherboard_manufacturer.name, db,
                                                                MotherboardManufacturer)
    db_motherboard_manufacturer.name = motherboard_manufacturer.name
    db.commit()
    db.refresh(db_motherboard_manufacturer)
    return db_motherboard_manufacturer


@router.delete("/manufacturer/{manufacturer_id}")
def delete_motherboard_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    motherboard_manufacturer = db.get(MotherboardManufacturer, manufacturer_id)
    if motherboard_manufacturer is None:
        raise HTTPException(status_code=404, detail="Motherboard manufacturer not found")
    db.delete(motherboard_manufacturer)
    db.commit()
    return {"message": "Motherboard manufacturer deleted successfully"}


@router.post("/chipset/", response_model=MotherboardChipset)
def create_motherboard_chipset(motherboard_chipset: MotherboardChipset, db: Session = Depends(get_db)):
    motherboard_chipset.name = validate_and_normalize_name(motherboard_chipset.name, db, MotherboardChipset)
    db.add(motherboard_chipset)
    db.commit()
    db.refresh(motherboard_chipset)
    return motherboard_chipset


@router.get("/chipset/", response_model=list[MotherboardChipset])
def get_motherboard_chipsets(db: Session = Depends(get_db)):
    motherboard_chipsets = db.exec(select(MotherboardChipset)).all()
    return motherboard_chipsets


@router.get("/chipset/{chipset_id}", response_model=MotherboardChipset)
def get_motherboard_chipset(chipset_id: int, db: Session = Depends(get_db)):
    motherboard_chipset = db.get(MotherboardChipset, chipset_id)
    if motherboard_chipset is None:
        raise HTTPException(status_code=404, detail="Motherboard chipset not found")
    return motherboard_chipset


@router.put("/chipset/{chipset_id}", response_model=MotherboardChipset)
def update_motherboard_chipset(chipset_id: int, motherboard_chipset: MotherboardChipset, db: Session = Depends(get_db)):
    db_motherboard_chipset = db.get(MotherboardChipset, chipset_id)
    if db_motherboard_chipset is None:
        raise HTTPException(status_code=404, detail="Motherboard chipset not found")
    motherboard_chipset.name = validate_and_normalize_name(motherboard_chipset.name, db, MotherboardChipset)
    db_motherboard_chipset.name = motherboard_chipset.name
    db.commit()
    db.refresh(db_motherboard_chipset)
    return db_motherboard_chipset


@router.delete("/chipset/{chipset_id}")
def delete_motherboard_chipset(chipset_id: int, db: Session = Depends(get_db)):
    motherboard_chipset = db.get(MotherboardChipset, chipset_id)
    if motherboard_chipset is None:
        raise HTTPException(status_code=404, detail="Motherboard chipset not found")
    db.delete(motherboard_chipset)
    db.commit()
    return {"message": "Motherboard chipset deleted successfully"}


@router.post("/", response_model=Motherboard)
def create_motherboard(motherboard: Motherboard, db: Session = Depends(get_db)):
    if hasattr(motherboard, "name"):
        motherboard.name = validate_and_normalize_name(motherboard.name, db, Motherboard)
    db.add(motherboard)
    db.commit()
    db.refresh(motherboard)
    return motherboard


@router.get("/", response_model=list[Motherboard])
def get_motherboards(db: Session = Depends(get_db)):
    motherboards = db.exec(select(Motherboard)).all()
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
    if hasattr(motherboard, "name"):
        motherboard.name = validate_and_normalize_name(motherboard.name, db, Motherboard)
    db_motherboard.serial = motherboard.serial
    db_motherboard.motherboard_manufacturer_id = motherboard.motherboard_manufacturer_id
    db_motherboard.motherboard_chipset_id = motherboard.motherboard_chipset_id
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
