from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/integrations", tags=["Integrations"])


@router.get("/healthcheck")
async def healthcheck():
    return {"status": "integrations ready"}
