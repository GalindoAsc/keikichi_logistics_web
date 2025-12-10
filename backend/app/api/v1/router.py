from fastapi import APIRouter

from app.api.v1 import auth, users, trips, spaces, reservations, label_prices, system_config, client_documents
from app.api.v1.endpoints import catalog, admin_users, admin_dashboard, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(spaces.router, prefix="/spaces", tags=["spaces"])
api_router.include_router(reservations.router, prefix="/reservations", tags=["reservations"])
api_router.include_router(client_documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(label_prices.router, prefix="/label-prices", tags=["label-prices"])
api_router.include_router(system_config.router, prefix="/system-config", tags=["system-config"])
from app.api.v1 import fleet
api_router.include_router(fleet.router, prefix="/fleet", tags=["fleet"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["admin-users"])
api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["admin-dashboard"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

from app.api.v1 import trip_quotes
api_router.include_router(trip_quotes.router)

from app.api.v1.endpoints import files, verifications
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(verifications.router, prefix="/admin/verifications", tags=["admin-verifications"])
# Also include for client uploads (the router handles both paths if structured correctly, 
# but verifications.py has /ine and /pending. 
# /ine is for client, /pending is for admin.
# Let's split or just mount it twice or mount at root if paths are distinct.
# verifications.py has:
# @router.post("/ine") -> /ine
# @router.get("/pending") -> /pending
# @router.post("/{user_id}/approve") -> /{user_id}/approve
# It seems mixed. 
# Let's mount it at /verifications and clients use /verifications/ine and admins use /verifications/pending
api_router.include_router(verifications.router, prefix="/verifications", tags=["verifications"])


@api_router.get("/info")
async def info():
    return {
        "api_version": "v1",
        "status": "running"
    }
