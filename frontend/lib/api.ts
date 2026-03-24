const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Bypass ngrok browser interstitial page for API calls
const NGROK_HEADERS: Record<string, string> = API_BASE.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

export interface Listing {
  itemId: string;
  title: string;
  price: string;
  currency: string;
  condition: string;
  imageUrl: string;
  itemWebUrl: string;
}

export interface SoldListing {
  title: string;
  soldPrice: string;
  currency: string;
  soldDate: string;
  imageUrl: string;
  itemUrl: string;
}

export interface SearchResult {
  listings: Listing[];
  estimatedPrice: number | null;
  currency: string;
}

export interface SoldResult {
  soldListings: SoldListing[];
}

export interface DescribeResult {
  description: string;
}

export interface ListingResult {
  listingId: string;
  listingUrl: string;
}

export interface AuthStatus {
  authenticated: boolean;
}

export async function searchByImage(imageFile: File): Promise<SearchResult> {
  const form = new FormData();
  form.append("image", imageFile);
  const res = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    credentials: "include",
    headers: NGROK_HEADERS,
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "Search failed");
  return res.json();
}

export async function getSoldListings(query: string): Promise<SoldResult> {
  const res = await fetch(
    `${API_BASE}/api/sold?query=${encodeURIComponent(query)}`,
    { credentials: "include", headers: NGROK_HEADERS }
  );
  if (!res.ok) throw new Error((await res.json()).detail ?? "Sold lookup failed");
  return res.json();
}

export async function generateDescription(
  imageFile: File,
  listingTitles: string[],
  userDetails: string
): Promise<DescribeResult> {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("listing_titles", JSON.stringify(listingTitles));
  form.append("user_details", userDetails);
  const res = await fetch(`${API_BASE}/api/describe`, {
    method: "POST",
    credentials: "include",
    headers: NGROK_HEADERS,
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "Description failed");
  return res.json();
}

export async function createListing(payload: {
  title: string;
  description: string;
  conditionId: string;
  listingFormat: string;
  startPrice: number;
  buyItNowPrice?: number | null;
  duration: string;
}): Promise<ListingResult> {
  const res = await fetch(`${API_BASE}/api/list`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "Listing failed");
  return res.json();
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/status`, {
      credentials: "include",
      headers: NGROK_HEADERS,
    });
    if (!res.ok) return { authenticated: false };
    return res.json();
  } catch {
    return { authenticated: false };
  }
}

export function getEbayAuthUrl(): string {
  return `${API_BASE}/api/auth/ebay`;
}
