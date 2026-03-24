import base64
import os
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import httpx

from services.ebay_sell import add_item

router = APIRouter()

SANDBOX_OAUTH = "https://auth.sandbox.ebay.com/oauth2/authorize"
PROD_OAUTH = "https://auth.ebay.com/oauth2/authorize"
SANDBOX_TOKEN_URL = "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
PROD_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"

SELL_SCOPE = "https://api.ebay.com/oauth/api_scope/sell.inventory"


def _is_sandbox() -> bool:
    return os.getenv("EBAY_ENV", "sandbox") == "sandbox"


def _oauth_url() -> str:
    return SANDBOX_OAUTH if _is_sandbox() else PROD_OAUTH


def _token_url() -> str:
    return SANDBOX_TOKEN_URL if _is_sandbox() else PROD_TOKEN_URL


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@router.get("/auth/ebay")
def auth_ebay(request: Request):
    """Redirect the user to eBay's OAuth authorization page."""
    app_id = os.getenv("EBAY_APP_ID", "")
    # EBAY_REDIRECT_URI must be the RuName from developer.ebay.com, not the actual URL
    ru_name = os.getenv("EBAY_REDIRECT_URI", "")
    params = urlencode({
        "client_id": app_id,
        "response_type": "code",
        "redirect_uri": ru_name,
        "scope": SELL_SCOPE,
    })
    return RedirectResponse(url=f"{_oauth_url()}?{params}")


@router.get("/auth/callback")
async def auth_callback(code: str, request: Request):
    """Exchange auth code for user access token and store in session."""
    app_id = os.getenv("EBAY_APP_ID", "")
    cert_id = os.getenv("EBAY_CERT_ID", "")
    # Token exchange also uses the RuName, not the actual callback URL
    redirect_uri = os.getenv("EBAY_REDIRECT_URI", "")
    credentials = base64.b64encode(f"{app_id}:{cert_id}".encode()).decode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _token_url(),
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )
        resp.raise_for_status()
        token_data = resp.json()

    request.session["ebay_token"] = token_data.get("access_token", "")
    request.session["ebay_refresh_token"] = token_data.get("refresh_token", "")

    # Redirect back to frontend home page
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(url=f"{frontend_url}/?auth=success")


@router.get("/auth/status")
def auth_status(request: Request):
    """Return whether the user has a valid eBay token in session."""
    token = request.session.get("ebay_token", "")
    return {"authenticated": bool(token)}


@router.post("/auth/logout")
def auth_logout(request: Request):
    request.session.pop("ebay_token", None)
    request.session.pop("ebay_refresh_token", None)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Listing creation
# ---------------------------------------------------------------------------

class ListingRequest(BaseModel):
    title: str
    description: str
    conditionId: str = "3000"          # 1000=New, 3000=Used Very Good
    listingFormat: str = "Chinese"     # Chinese=Auction, FixedPriceItem=BIN, LeadGeneration=Hybrid
    startPrice: float = 0.99
    buyItNowPrice: float | None = None
    duration: str = "Days_7"           # Days_3, Days_5, Days_7, Days_10, GTC


@router.post("/list")
async def create_listing(payload: ListingRequest, request: Request):
    """Post a listing to eBay on behalf of the authenticated user."""
    user_token = request.session.get("ebay_token", "")
    if not user_token:
        raise HTTPException(status_code=401, detail="Not authenticated with eBay")

    try:
        result = await add_item(
            user_token=user_token,
            title=payload.title,
            description=payload.description,
            condition_id=payload.conditionId,
            listing_type=payload.listingFormat,
            start_price=payload.startPrice,
            buy_it_now_price=payload.buyItNowPrice,
            duration=payload.duration,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"eBay listing failed: {str(e)}")

    return result
