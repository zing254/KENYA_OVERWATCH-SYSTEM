from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/anpr", tags=["ANPR"])


class PlateResult(BaseModel):
    plate: str
    confidence: float


@router.post("/detect")
async def detect_plate():
    # Minimal stub: return no plates detected
    return {"plates": []}
