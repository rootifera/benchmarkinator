from fastapi import HTTPException
from sqlmodel import Session, select


def validate_and_normalize_name(name: str, db: Session, model_class, current_id: int = None):
    """
    Validates and normalizes the name field:
    - Strips leading and trailing spaces.
    - Checks for case-insensitive uniqueness in the database.
    - Allows updates to the same record (if current_id is provided).
    """
    normalized_name = name.strip()

    print(f"Normalized Name: {normalized_name}, Current ID: {current_id}")

    query = select(model_class).where(model_class.name.ilike(normalized_name))
    existing_entry = db.exec(query).first()

    if existing_entry:
        print(f"Existing Entry: {existing_entry.name}, ID: {existing_entry.id}")

    if existing_entry:
        if current_id is None or existing_entry.id != current_id:
            raise HTTPException(status_code=400, detail="Name already exists")

    return normalized_name
