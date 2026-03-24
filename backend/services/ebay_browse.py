"""
eBay Browse API — searchByImage
Returns top N active listings visually similar to the uploaded image.
"""
import base64
import os
import httpx

SANDBOX_BASE = "https://api.sandbox.ebay.com"
PROD_BASE = "https://api.ebay.com"


def _base_url() -> str:
    return SANDBOX_BASE if os.getenv("EBAY_ENV", "sandbox") == "sandbox" else PROD_BASE


async def get_app_token() -> str:
    """Fetch an OAuth application token (client credentials grant)."""
    base = _base_url()
    app_id = os.getenv("EBAY_APP_ID", "")
    cert_id = os.getenv("EBAY_CERT_ID", "")
    credentials = base64.b64encode(f"{app_id}:{cert_id}".encode()).decode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/identity/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "client_credentials",
                "scope": "https://api.ebay.com/oauth/api_scope",
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def search_by_image(image_bytes: bytes, limit: int = 5) -> list[dict]:
    """
    Call Browse API searchByImage and return simplified listing objects.
    """
    token = await get_app_token()
    base = _base_url()
    image_b64 = base64.b64encode(image_bytes).decode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/buy/browse/v1/item_summary/search_by_image",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
            },
            json={"image": image_b64},
            params={"limit": limit},
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("itemSummaries", [])
    results = []
    for item in items[:limit]:
        price_val = item.get("price", {})
        results.append(
            {
                "itemId": item.get("itemId", ""),
                "title": item.get("title", ""),
                "price": price_val.get("value", "0.00"),
                "currency": price_val.get("currency", "USD"),
                "condition": item.get("condition", ""),
                "imageUrl": item.get("image", {}).get("imageUrl", ""),
                "itemWebUrl": item.get("itemWebUrl", ""),
            }
        )
    return results
