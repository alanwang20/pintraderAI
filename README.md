# PinTraderAI

AI-powered price lookup and eBay listing tool for Olympic trading pins.

PinTraderAI lets collectors photograph an Olympic trading pin, see what similar pins are actively listed and recently sold for on eBay, and post their own listing — all from a mobile-friendly web interface.

---

## Overview

Olympic trading pins vary significantly in value depending on sport, country/NOC, edition, year, and event exclusivity. Manually searching eBay for accurate comps takes several minutes and requires knowing the right search terms.

PinTraderAI solves this by:

1. Using eBay's image search to find visually similar active listings instantly
2. Letting the user curate which results actually match their pin
3. Using Claude AI to generate a precise keyword from the selected listings
4. Searching for recently completed/sold listings using that keyword
5. Letting the user review and post their own listing directly to eBay

---

## App Flow (4 pages)

**Page 1 — Upload**
User photographs or uploads a pin image. The app calls eBay's Browse API `searchByImage` to find visually similar active listings.

**Page 2 — Select Active Listings**
Active listings are displayed as selectable cards. The user taps to include or exclude results, removing unrelated pins (e.g. image search sometimes returns visually similar but unrelated items). Selected listing titles are passed to Claude.

**Page 3 — Recently Sold**
Claude generates a precise eBay search keyword from the selected listing titles (identifying sport, country/NOC, mascot, games year, design shape). That keyword is used to find recently completed/sold listings via the eBay Finding API. The user selects which sold results are relevant.

**Page 4 — Results + Post**
The top of the page shows the selected active and sold listings as a price reference grid (with median active price and average sold price). Below, a Claude-generated listing description is pre-filled into an eBay posting form. The user can edit and post directly to eBay via OAuth.

---

## Tech Stack

### Frontend
- Next.js (App Router) + TypeScript + Tailwind CSS
- Mobile-first, designed for use on a phone

### Backend
- Python + FastAPI
- Async/await throughout, parallel API calls via `asyncio.gather`

### External Services
- **eBay Browse API** — `searchByImage` for active listing image search
- **eBay Finding API** — `findCompletedItems` for sold/completed listings
- **eBay Sell/Trading API** — post listings on behalf of authenticated users
- **eBay OAuth 2.0** — user authentication for listing creation
- **Anthropic Claude** — keyword generation (Haiku) and listing description generation (Sonnet)

---

## Architecture

```
User (mobile browser)
  ↓
Next.js Frontend
  ↓
FastAPI Backend
  ├── POST /api/search      → eBay Browse API searchByImage (active listings)
  ├── POST /api/sold        → Claude keyword extraction → eBay Finding API findCompletedItems
  ├── POST /api/describe    → Claude Sonnet vision (generate listing description)
  ├── GET  /api/auth/ebay   → eBay OAuth redirect
  ├── GET  /api/auth/callback → Exchange code for user token
  └── POST /api/list        → eBay Trading API AddItem
```

---

## Known Limitations

**Sold listing data requires eBay approval**
The eBay Finding API (`findCompletedItems`) is blocked for newer production keysets. The proper replacement — the Marketplace Insights API (`buy.marketplace.insights`) — requires manual approval from eBay. Until approved, the sold listings page cannot return real completed sales data. eBay's approval process requires the app to be live with real usage before they will review the request.

**Image search can return unrelated pins**
eBay's `searchByImage` is not pin-specific and will sometimes return visually similar but unrelated items (e.g. a Starbucks bear pin mixed in with Olympic jacket pins). The manual selection step on page 2 exists specifically to let users filter these out before the keyword is generated.

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- ngrok (required for eBay OAuth HTTPS callback)

### Setup

```
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in API keys
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# ngrok (separate terminal)
ngrok http 8000
```

Or use the included launch script to open all three in separate windows:

```
.\start.ps1
```

### Environment Variables

```
EBAY_PROD_APP_ID=
EBAY_PROD_CERT_ID=
EBAY_DEV_ID=
EBAY_REDIRECT_URI=        # RuName from eBay developer dashboard
ANTHROPIC_API_KEY=
SESSION_SECRET=
EBAY_DELETION_ENDPOINT_URL=
EBAY_VERIFICATION_TOKEN=
```

---

## Roadmap

### Current — MVP
- 4-page image → select → sold → post flow
- eBay OAuth and listing creation
- Claude keyword generation and description generation

### Pending eBay Approval
- Real sold/completed listing data via Marketplace Insights API

### Future
- Sold price history chart
- Collection tracking
- Batch listing mode
- Pin rarity scoring

---

## Author

Alan Wang
