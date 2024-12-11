from fastapi import HTTPException
from sqlmodel import Session, select


def validate_and_normalize_name(name: str, db: Session, model_class):
    """
    Validates and normalizes the name field:
    - Strips leading and trailing spaces.
    - Checks for case-insensitive uniqueness in the database.
    """
    normalized_name = name.strip()

    query = select(model_class).where(model_class.name.ilike(normalized_name))
    existing_entry = db.exec(query).first()
    if existing_entry:
        raise HTTPException(status_code=400, detail="Name already exists")

    return normalized_name
