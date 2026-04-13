from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from services.ebay_browse import search_by_image, search_sold_by_image
import statistics

router = APIRouter()


@router.post("/search")
async def search(image: UploadFile = File(...)):
    """
    Accept a pin image, return:
    - top 5 visually similar active eBay listings + median price estimate
    - Claude-extracted search keyword from listing titles
    - top 5 sold/completed listings using that keyword
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

    # Search sold listings using the same image
    sold_items = []
    try:
        sold_raw = await search_sold_by_image(image_bytes, limit=5)
        # Convert to SoldListing shape
        for item in sold_raw:
            sold_items.append({
                "title": item["title"],
                "soldPrice": item["price"],
                "currency": item["currency"],
                "soldDate": "",
                "imageUrl": item["imageUrl"],
                "itemUrl": item["itemWebUrl"],
            })
    except Exception as e:
        print(f"[sold by image error] {e}")

    return {
        "listings": listings,
        "estimatedPrice": estimated_price,
        "currency": "USD",
        "searchKeyword": "",
        "soldListings": sold_items,
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
