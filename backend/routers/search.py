from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from services.ebay_browse import search_by_image
from services.ebay_finding import find_completed_items
import statistics

router = APIRouter()


@router.post("/search")
async def search(image: UploadFile = File(...)):
    """
    Accept a pin image, return top 5 visually similar active eBay listings
    plus a median price estimate.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    try:
        listings = await search_by_image(image_bytes, limit=5)
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


@router.get("/sold")
async def sold(query: str = Query(..., description="Search keyword for completed listings")):
    """
    Return last 5 sold/completed eBay listings matching the query.
    """
    try:
        sold_items = await find_completed_items(query, limit=5)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"eBay sold lookup failed: {str(e)}")

    return {"soldListings": sold_items}
