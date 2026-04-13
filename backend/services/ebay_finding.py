"""
eBay Finding API — findCompletedItems
Returns actually-sold/completed listings by keyword.
Uses the legacy XML Finding API which works with any App ID, no special scope needed.
"""
import os
import urllib.parse
import httpx
import xml.etree.ElementTree as ET

FINDING_ENDPOINT = "https://svcs.ebay.com/services/search/FindingService/v1"
NS = "http://www.ebay.com/marketplace/search/v1/services"
PIN_CATEGORY_ID = "13544"


async def find_completed_items(query: str, limit: int = 5) -> list[dict]:
    """
    Call Finding API findCompletedItems and return sold listings.
    Only returns items where the sale actually completed (soldItemsOnly=true).
    Query string is built manually to preserve literal parentheses in filter names,
    which httpx would otherwise percent-encode, breaking the Finding API.
    """
    app_id = os.getenv("EBAY_PROD_APP_ID") or os.getenv("EBAY_APP_ID", "")

    # Build query string manually — eBay Finding API requires literal parentheses
    # in itemFilter(N).name / itemFilter(N).value; httpx would encode them as %28/%29
    parts = [
        ("OPERATION-NAME", "findCompletedItems"),
        ("SERVICE-VERSION", "1.0.0"),
        ("SECURITY-APPNAME", app_id),
        ("RESPONSE-DATA-FORMAT", "XML"),
        ("keywords", query),
        ("categoryId", PIN_CATEGORY_ID),
        ("itemFilter(0).name", "SoldItemsOnly"),
        ("itemFilter(0).value", "true"),
        ("paginationInput.entriesPerPage", str(limit)),
        ("outputSelector(0)", "PictureURLLarge"),
    ]
    qs = "&".join(f"{k}={urllib.parse.quote(str(v), safe='()')}" for k, v in parts)
    url = f"{FINDING_ENDPOINT}?{qs}"

    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        resp.raise_for_status()

    root = ET.fromstring(resp.text)

    def tag(name: str) -> str:
        return f"{{{NS}}}{name}"

    results = []
    for item in root.iter(tag("searchResult")):
        for listing in item.findall(tag("item")):
            title_el    = listing.find(tag("title"))
            url_el      = listing.find(tag("viewItemURL"))
            img_el      = listing.find(tag("galleryURL"))
            end_el      = listing.find(f".//{tag('endTime')}")
            price_el    = listing.find(f".//{tag('currentPrice')}")

            results.append({
                "title":     title_el.text if title_el is not None else "",
                "soldPrice": price_el.text if price_el is not None else "0.00",
                "currency":  price_el.attrib.get("currencyId", "USD") if price_el is not None else "USD",
                "soldDate":  end_el.text[:10] if end_el is not None else "",
                "imageUrl":  img_el.text if img_el is not None else "",
                "itemUrl":   url_el.text if url_el is not None else "",
            })

    return results[:limit]
