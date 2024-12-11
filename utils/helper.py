from fastapi import HTTPException
from sqlmodel import Session, select


def validate_and_normalize_name(name: str, db: Session, model_class):
    """
    Validates and normalizes the name field:
    - Strips leading and trailing spaces.
    - Checks for uniqueness in the database.
    """
    # Strip leading and trailing spaces
    normalized_name = name.strip()

    # Check for uniqueness
    query = select(model_class).where(model_class.name == normalized_name)
    existing_entry = db.exec(query).first()
    if existing_entry:
        raise HTTPException(status_code=400, detail="Name already exists")

    return normalized_name
