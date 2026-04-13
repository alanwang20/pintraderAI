"""
eBay Marketplace Insights API — item_sales/search
Returns actually-sold items by keyword with lastSoldDate filter.
"""
import os
import httpx
from datetime import datetime, timedelta, timezone

from services.ebay_browse import get_app_token

INSIGHTS_PROD = "https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search"
INSIGHTS_SCOPE = "https://api.ebay.com/oauth/api_scope/buy.marketplace.insights"


async def get_insights_token() -> str:
    """Fetch app token with marketplace insights scope."""
    import base64
    app_id = os.getenv("EBAY_PROD_APP_ID") or os.getenv("EBAY_APP_ID", "")
    cert_id = os.getenv("EBAY_PROD_CERT_ID") or os.getenv("EBAY_CERT_ID", "")
    credentials = base64.b64encode(f"{app_id}:{cert_id}".encode()).decode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.ebay.com/identity/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "client_credentials",
                "scope": f"https://api.ebay.com/oauth/api_scope {INSIGHTS_SCOPE}",
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def find_completed_items(query: str, limit: int = 5) -> list[dict]:
    """
    Search Marketplace Insights for recently sold items matching the keyword.
    Falls back to Browse API keyword search if insights scope is unavailable.
    """
    try:
        token = await get_insights_token()
    except Exception:
        token = await get_app_token()

    # Last 90 days
    now = datetime.now(timezone.utc)
    since = (now - timedelta(days=90)).strftime("%Y-%m-%dT%H:%M:%SZ")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            INSIGHTS_PROD,
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
            },
            params={
                "q": query,
                "limit": limit,
                "filter": f"lastSoldDate:[{since}..]",
            },
        )

        if resp.status_code == 403:
            # Scope not approved — fall back to Browse search
            from services.ebay_browse import get_app_token as browse_token
            token2 = await browse_token()
            resp = await client.get(
                "https://api.ebay.com/buy/browse/v1/item_summary/search",
                headers={"Authorization": f"Bearer {token2}", "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"},
                params={"q": query, "limit": limit, "sort": "newlyListed"},
            )
            resp.raise_for_status()
            items = resp.json().get("itemSummaries", [])
            return [
                {
                    "title": i.get("title", ""),
                    "soldPrice": i.get("price", {}).get("value", "0.00"),
                    "currency": i.get("price", {}).get("currency", "USD"),
                    "soldDate": i.get("itemCreationDate", ""),
                    "imageUrl": i.get("image", {}).get("imageUrl", ""),
                    "itemUrl": i.get("itemWebUrl", ""),
                }
                for i in items[:limit]
            ]

        resp.raise_for_status()
        data = resp.json()

    items = data.get("itemSales", [])
    results = []
    for item in items[:limit]:
        price_val = item.get("lastSoldPrice", item.get("price", {}))
        results.append({
            "title": item.get("title", ""),
            "soldPrice": price_val.get("value", "0.00"),
            "currency": price_val.get("currency", "USD"),
            "soldDate": item.get("lastSoldDate", ""),
            "imageUrl": item.get("image", {}).get("imageUrl", ""),
            "itemUrl": item.get("itemWebUrl", ""),
        })
    return results
