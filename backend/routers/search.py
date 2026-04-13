import statistics
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from services.ebay_browse import search_by_image
from services.claude_service import extract_search_keyword
from services.ebay_finding import find_completed_items

router = APIRouter()


@router.post("/search")
async def search(image: UploadFile = File(...)):
    """
    Accept a pin image and return visually similar active eBay listings.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    try:
        listings = await search_by_image(image_bytes, limit=8)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"eBay search failed: {str(e)}")

    prices = []
    for item in listings:
        try:
            prices.append(float(item["price"]))
        except (ValueError, TypeError):
            pass

    estimated_price = round(statistics.median(prices), 2) if prices else None

    return {
        "listings": listings,
        "estimatedPrice": estimated_price,
        "currency": "USD",
    }


class SoldRequest(BaseModel):
    titles: list[str]


@router.post("/sold")
async def sold(body: SoldRequest):
    """
    Given selected listing titles, generate a keyword and return completed/sold listings.
    """
    if not body.titles:
        return {"soldListings": [], "searchKeyword": ""}

    try:
        keyword = await extract_search_keyword(body.titles)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Keyword generation failed: {str(e)}")

    print(f"[sold] keyword='{keyword}'")

    try:
        sold_items = await find_completed_items(keyword, limit=8)
    except Exception as e:
        print(f"[sold] Finding API error: {e}")
        sold_items = []

    return {"soldListings": sold_items, "searchKeyword": keyword}
