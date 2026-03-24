from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.claude_service import generate_pin_description
import json

router = APIRouter()


@router.post("/describe")
async def describe(
    image: UploadFile = File(...),
    listing_titles: str = Form(default="[]"),
    user_details: str = Form(default=""),
):
    """
    Generate a ≤15-word eBay listing description for the uploaded pin image.

    - image: pin photo
    - listing_titles: JSON array of eBay listing title strings for context
    - user_details: optional free-text seller notes
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    try:
        titles: list[str] = json.loads(listing_titles)
    except (json.JSONDecodeError, ValueError):
        titles = []

    try:
        description = await generate_pin_description(image_bytes, titles, user_details)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Description generation failed: {str(e)}")

    return {"description": description}
