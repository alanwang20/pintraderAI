# PinTraderAI

AI-powered trading pin price lookup using image search and the eBay API.

PinTraderAI allows collectors to take a photo of a trading pin and quickly estimate its current market value by searching for similar listings on eBay.

The goal is to make **real-time pin trading easier by providing instant price insight.**

---

## Overview

Trading pins can vary significantly in value depending on rarity, edition size, event exclusivity, and market demand. Currently, collectors often have to manually search online marketplaces to estimate value.

PinTraderAI simplifies this process by:

1. Uploading a photo of a pin
2. Searching eBay for visually similar listings
3. Aggregating prices from those listings
4. Returning an estimated market value

This reduces the typical **2–3 minute manual search process to a few seconds.**

---

## Features (MVP)

- Image upload for trading pins
- Image-based search using eBay API
- Retrieval of similar listings
- Estimated price range from active listings
- Display of top matching items

---

## Example Workflow

1. User uploads a photo of a trading pin
2. Backend converts the image to Base64
3. Application sends image to the eBay image search API
4. eBay returns similar listings
5. The system calculates a price estimate
6. Results are displayed to the user

---

## Tech Stack

### Frontend
- React / Next.js
- Image upload interface
- Result display UI

### Backend
- Python FastAPI or Node.js
- Image processing
- eBay API integration

### External Services
- eBay Browse API

---

## Architecture

```
User
  ↓
Upload Pin Photo
  ↓
Frontend (React)
  ↓
Backend API
  ↓
Image → Base64 Conversion
  ↓
eBay Image Search API
  ↓
Matching Listings Returned
  ↓
Price Aggregation Algorithm
  ↓
Estimated Price Displayed
```

---

## Installation (Future)

Clone the repository:

```
git clone https://github.com/yourusername/pintraderai.git
cd pintraderai
```

Install dependencies:

```
npm install
```

Run development server:

```
npm run dev
```

---

## API Integration

PinTraderAI uses the **eBay Browse API** to retrieve matching listings.

Key API capability used:

- Image-based item search
- Listing metadata retrieval
- Price aggregation

---

## Roadmap

### Phase 1 — MVP
- Image upload
- eBay image search
- Price estimation

### Phase 2 — Improved Matching
- Keyword extraction from listings
- Better similarity filtering
- Confidence scoring

### Phase 3 — Advanced Features
- Sold listing analysis
- Historical price tracking
- Collection management
- Mobile app

---

## Risks

- Visually similar pins may have different values
- Some pins may not have current listings
- API rate limits may require caching

---

## Future Vision

PinTraderAI could expand into a full **AI-powered pin trading platform**, including:

- Real-time trade evaluation
- Marketplace aggregation
- Pin rarity detection
- Personal collection tracking

---

## Author

Alan Wang

---
