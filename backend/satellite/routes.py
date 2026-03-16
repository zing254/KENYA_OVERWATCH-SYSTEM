from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/satellite", tags=["Satellite"])


@router.get("/status")
async def status():
    return {"status": "ok"}
