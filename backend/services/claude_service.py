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
