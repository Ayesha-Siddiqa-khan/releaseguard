from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.seed import seed_data

router = APIRouter()


@router.post("/seed")
async def seed_database(db: AsyncSession = Depends(get_db)):
    await seed_data(db)
    return {"message": "Database seeded successfully"}
