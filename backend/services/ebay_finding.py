"""
eBay Finding API — findCompletedItems (XML-based)
Returns sold/completed listings for a keyword query.
"""
import os
import httpx
import xml.etree.ElementTree as ET

FINDING_SANDBOX = "https://svcs.sandbox.ebay.com/services/search/FindingService/v1"
FINDING_PROD = "https://svcs.ebay.com/services/search/FindingService/v1"

NS = "http://www.ebay.com/marketplace/search/v1/services"


def _endpoint() -> str:
    return FINDING_SANDBOX if os.getenv("EBAY_ENV", "sandbox") == "sandbox" else FINDING_PROD


async def find_completed_items(query: str, limit: int = 5) -> list[dict]:
    """
    Query findCompletedItems with soldItemsOnly=true and return simplified results.
    """
    app_id = os.getenv("EBAY_APP_ID", "")
    params = {
        "OPERATION-NAME": "findCompletedItems",
        "SERVICE-VERSION": "1.13.0",
        "SECURITY-APPNAME": app_id,
        "RESPONSE-DATA-FORMAT": "XML",
        "keywords": query,
        "itemFilter(0).name": "SoldItemsOnly",
        "itemFilter(0).value": "true",
        "paginationInput.entriesPerPage": str(limit),
        "sortOrder": "EndTimeSoonest",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(_endpoint(), params=params)
        resp.raise_for_status()

    root = ET.fromstring(resp.text)

    items = root.findall(f".//{{{NS}}}item")
    results = []
    for item in items[:limit]:
        def txt(tag: str) -> str:
            el = item.find(f"{{{NS}}}{tag}")
            return el.text if el is not None else ""

        selling_status = item.find(f"{{{NS}}}sellingStatus")
        sold_price = ""
        if selling_status is not None:
            price_el = selling_status.find(f"{{{NS}}}convertedCurrentPrice")
            if price_el is not None:
                sold_price = price_el.text or ""

        end_time = ""
        listing_info = item.find(f"{{{NS}}}listingInfo")
        if listing_info is not None:
            et_el = listing_info.find(f"{{{NS}}}endTime")
            if et_el is not None:
                end_time = et_el.text or ""

        image_url = ""
        gallery_info = item.find(f"{{{NS}}}galleryInfoContainer")
        if gallery_info is not None:
            img_el = gallery_info.find(f"{{{NS}}}galleryURL")
            if img_el is not None:
                image_url = img_el.text or ""
        # fallback — top-level galleryURL
        if not image_url:
            img_el = item.find(f"{{{NS}}}galleryURL")
            if img_el is not None:
                image_url = img_el.text or ""

        results.append(
            {
                "title": txt("title"),
                "soldPrice": sold_price,
                "currency": "USD",
                "soldDate": end_time,
                "imageUrl": image_url,
                "itemUrl": txt("viewItemURL"),
            }
        )

    return results
