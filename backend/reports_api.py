from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.get("/")
async def list_reports():
    return {"reports": []}
