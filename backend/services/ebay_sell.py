"""
eBay Sell — Trading API AddItem (XML/SOAP)
Creates a listing on behalf of a user using their OAuth access token.
"""
import os
import httpx

TRADING_SANDBOX = "https://api.sandbox.ebay.com/ws/api.dll"
TRADING_PROD = "https://api.ebay.com/ws/api.dll"

# eBay Trading API compatibility level
COMPATIBILITY_LEVEL = "1227"

# Category ID for Trading Pins (eBay category 13544)
TRADING_PIN_CATEGORY_ID = "13544"


def _endpoint() -> str:
    return TRADING_SANDBOX if os.getenv("EBAY_ENV", "sandbox") == "sandbox" else TRADING_PROD


def _build_add_item_xml(
    title: str,
    description: str,
    condition_id: str,
    listing_type: str,
    start_price: float,
    buy_it_now_price: float | None,
    duration: str,
    quantity: int = 1,
) -> str:
    """Build the XML body for AddItem call."""
    bin_block = ""
    if listing_type in ("FixedPriceItem", "LeadGeneration") or (
        listing_type == "Chinese" and buy_it_now_price
    ):
        bin_block = f"<BuyItNowPrice currencyID='USD'>{buy_it_now_price:.2f}</BuyItNowPrice>"

    return f"""<?xml version="1.0" encoding="utf-8"?>
<AddItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>__TOKEN__</eBayAuthToken>
  </RequesterCredentials>
  <Item>
    <Title>{_escape(title)}</Title>
    <Description><![CDATA[{description}]]></Description>
    <PrimaryCategory>
      <CategoryID>{TRADING_PIN_CATEGORY_ID}</CategoryID>
    </PrimaryCategory>
    <StartPrice currencyID="USD">{start_price:.2f}</StartPrice>
    {bin_block}
    <ConditionID>{condition_id}</ConditionID>
    <Country>US</Country>
    <Currency>USD</Currency>
    <Location>United States</Location>
    <ListingDuration>{duration}</ListingDuration>
    <ListingType>{listing_type}</ListingType>
    <Quantity>{quantity}</Quantity>
    <PaymentMethods>PayPal</PaymentMethods>
    <ShippingDetails>
      <ShippingType>Flat</ShippingType>
      <ShippingServiceOptions>
        <ShippingServicePriority>1</ShippingServicePriority>
        <ShippingService>USPSFirstClass</ShippingService>
        <ShippingServiceCost currencyID="USD">3.00</ShippingServiceCost>
      </ShippingServiceOptions>
    </ShippingDetails>
    <ReturnPolicy>
      <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
      <RefundOption>MoneyBack</RefundOption>
      <ReturnsWithinOption>Days_30</ReturnsWithinOption>
      <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
    </ReturnPolicy>
    <Site>US</Site>
  </Item>
</AddItemRequest>"""


def _escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


async def add_item(
    user_token: str,
    title: str,
    description: str,
    condition_id: str,
    listing_type: str,
    start_price: float,
    buy_it_now_price: float | None,
    duration: str,
) -> dict:
    """
    Call Trading API AddItem and return the new listing ID and URL.

    listing_type options: "Chinese" (auction), "FixedPriceItem" (BIN), "LeadGeneration" (hybrid)
    condition_id: "1000" = New, "3000" = Used (Very Good), etc.
    duration: "Days_3", "Days_5", "Days_7", "Days_10", "GTC"
    """
    xml_body = _build_add_item_xml(
        title, description, condition_id, listing_type,
        start_price, buy_it_now_price, duration
    ).replace("__TOKEN__", user_token)

    dev_id = os.getenv("EBAY_DEV_ID", "")
    app_id = os.getenv("EBAY_APP_ID", "")
    cert_id = os.getenv("EBAY_CERT_ID", "")

    headers = {
        "X-EBAY-API-COMPATIBILITY-LEVEL": COMPATIBILITY_LEVEL,
        "X-EBAY-API-DEV-NAME": dev_id,
        "X-EBAY-API-APP-NAME": app_id,
        "X-EBAY-API-CERT-NAME": cert_id,
        "X-EBAY-API-CALL-NAME": "AddItem",
        "X-EBAY-API-SITEID": "0",
        "Content-Type": "text/xml",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(_endpoint(), content=xml_body.encode(), headers=headers)
        resp.raise_for_status()

    import xml.etree.ElementTree as ET
    root = ET.fromstring(resp.text)
    ns = "urn:ebay:apis:eBLBaseComponents"

    ack = root.findtext(f"{{{ns}}}Ack", "")
    if ack not in ("Success", "Warning"):
        errors = root.findall(f".//{{{ns}}}ShortMessage")
        msg = "; ".join(e.text for e in errors if e.text) or "Unknown eBay error"
        raise RuntimeError(f"AddItem failed: {msg}")

    item_id = root.findtext(f"{{{ns}}}ItemID", "")
    env = os.getenv("EBAY_ENV", "sandbox")
    if env == "sandbox":
        listing_url = f"https://cgi.sandbox.ebay.com/ws/eBayISAPI.dll?ViewItem&item={item_id}"
    else:
        listing_url = f"https://www.ebay.com/itm/{item_id}"

    return {"listingId": item_id, "listingUrl": listing_url}
