"""
Claude vision service — generate a short, appealing eBay listing description
for a trading pin based on the photo and similar listing titles.
"""
import base64
import os
import anthropic

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


def _detect_media_type(image_bytes: bytes) -> str:
    if image_bytes[:4] == b'\x89PNG':
        return "image/png"
    if image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
        return "image/webp"
    if image_bytes[:6] in (b'GIF87a', b'GIF89a'):
        return "image/gif"
    return "image/jpeg"


async def generate_pin_search_keyword(image_bytes: bytes) -> str:
    """
    Look at a pin image and return a concise eBay search query (5-10 words).
    Always assumes the subject is an Olympic trading pin.
    """
    image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    media_type = _detect_media_type(image_bytes)
    prompt = (
        "This is an Olympic trading pin. Generate a concise eBay search query (5-10 words) "
        "that would find this exact pin on eBay.\n\n"
        "Identify what type of pin it is and extract the most searchable details:\n"
        "- SPORT PICTOGRAM: name the sport exactly as it appears (e.g. figure skating, alpine skiing, swimming)\n"
        "- COUNTRY/NOC: include the country or NOC name (e.g. Team USA, Canada, Great Britain, France)\n"
        "- MASCOT: include the mascot name if readable (e.g. Miga, Sumi, Wenlock, Miraitowa)\n"
        "- LOGO/EMBLEM: describe the emblem (e.g. Olympic rings, torch, flame, wreath)\n"
        "- DESIGN SHAPE: describe what the pin looks like physically (e.g. jacket, helmet, snowflake, flag, medal)\n"
        "- GAMES: if a city, year, or 2-digit number is visible, include the full year (26=2026, 24=2024, 22=2022) and city if legible\n"
        "- SPONSOR/BRAND: include sponsor name if prominently shown\n\n"
        "Always include 'Olympic pin' in the query. Only include details clearly visible — do not guess.\n"
        "Output ONLY the search query, nothing else."
    )

    client = _get_client()
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=40,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": image_b64},
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )
    return message.content[0].text.strip()


async def extract_search_keyword(listing_titles: list[str]) -> str:
    """
    Given a list of eBay listing titles for the same pin, return a concise
    search keyword (3-6 words) that best identifies the specific pin for
    searching sold/completed listings.
    """
    titles_text = "\n".join(f"- {t}" for t in listing_titles[:5])
    prompt = (
        "You are a trading pin expert. Given these eBay listing titles for the same pin, "
        "extract the most specific 3-6 word search keyword that uniquely identifies this pin. "
        "Focus on: character name, event/park, edition info, year. "
        "Omit generic words like 'Disney', 'trading pin', 'LE', 'lot', 'new', 'rare'. "
        "Output ONLY the keyword phrase, nothing else.\n\n"
        f"Titles:\n{titles_text}"
    )

    client = _get_client()
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=32,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


async def generate_pin_description(
    image_bytes: bytes,
    listing_titles: list[str],
    user_details: str = "",
) -> str:
    """
    Send pin image + eBay listing context to Claude and return a
    ≤15-word appealing listing description.
    """
    image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

    context_block = ""
    if listing_titles:
        titles_text = "\n".join(f"- {t}" for t in listing_titles[:5])
        context_block = f"\n\nSimilar listings on eBay for reference:\n{titles_text}"

    user_block = f"\n\nSeller notes: {user_details}" if user_details else ""

    prompt = (
        "You are a trading pin marketplace expert. "
        "Write a single eBay listing description for the pin shown in the image. "
        "Requirements:\n"
        "- Maximum 15 words\n"
        "- Appealing and collector-focused tone\n"
        "- Highlight what makes it desirable (rarity, edition, character, event)\n"
        "- No generic filler phrases like 'Great condition' or 'Must have'\n"
        "- Output ONLY the description, nothing else"
        f"{context_block}{user_block}"
    )

    client = _get_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=64,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )

    description = message.content[0].text.strip()
    # Enforce word limit client-side as a safety net
    words = description.split()
    if len(words) > 15:
        description = " ".join(words[:15])
    return description
