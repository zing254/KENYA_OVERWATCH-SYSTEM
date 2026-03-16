from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/counties", tags=["Counties"])


@router.get("/stats")
async def counties_stats():
    return {"counties": []}
