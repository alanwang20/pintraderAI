"""
eBay Marketplace Account Deletion Notification endpoint.
Required by eBay for production keysets (GDPR compliance).
"""
import hashlib
import os
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/ebay/account-deletion")
async def account_deletion_challenge(challenge_code: str, request: Request):
    """
    Respond to eBay's endpoint verification challenge.
    eBay sends a GET with ?challenge_code=... and expects:
    SHA-256(challengeCode + verificationToken + endpointUrl)
    """
    verification_token = os.getenv("EBAY_VERIFICATION_TOKEN", "")
    # Use the registered public URL — must match exactly what was entered in the eBay portal
    endpoint_url = os.getenv(
        "EBAY_DELETION_ENDPOINT_URL",
        str(request.url).split("?")[0],
    )

    hash_val = hashlib.sha256(
        f"{challenge_code}{verification_token}{endpoint_url}".encode()
    ).hexdigest()

    return JSONResponse({"challengeResponse": hash_val})


@router.post("/ebay/account-deletion")
async def account_deletion_notification(request: Request):
    """
    Receive eBay account deletion notifications.
    For now we acknowledge receipt — no user data is stored server-side.
    """
    return JSONResponse({"status": "ok"})
