"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import SoldCard from "@/components/SoldCard";
import ListingForm from "@/components/ListingForm";
import {
  Listing,
  SoldListing,
  generateDescription,
  getAuthStatus,
} from "@/lib/api";

interface PinResults {
  listings: Listing[];
  estimatedPrice: number | null;
  soldListings: SoldListing[];
}

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<PinResults | null>(null);
  const [description, setDescription] = useState<string>("");
  const [descLoading, setDescLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pinResults");
    if (!raw) {
      router.replace("/");
      return;
    }
    setResults(JSON.parse(raw));
  }, [router]);

  // Check eBay auth status (also handles redirect back from eBay OAuth)
  useEffect(() => {
    getAuthStatus().then((s) => setIsAuthenticated(s.authenticated));
  }, [searchParams]);

  // Generate AI description once we have results + image
  useEffect(() => {
    if (!results) return;
    const dataUrl = sessionStorage.getItem("pinImageDataUrl");
    if (!dataUrl) return;

    async function fetchDescription() {
      setDescLoading(true);
      try {
        // Convert data URL back to File
        const res = await fetch(dataUrl!);
        const blob = await res.blob();
        const file = new File([blob], "pin.jpg", { type: blob.type });

        const titles = results!.listings.map((l) => l.title);
        const { description: desc } = await generateDescription(file, titles, "");
        setDescription(desc);
      } catch {
        setDescription("");
      } finally {
        setDescLoading(false);
      }
    }
    fetchDescription();
  }, [results]);

  if (!results) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Top bar */}
      <div className="bg-indigo-700 text-white px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-indigo-200 hover:text-white text-lg"
        >
          ←
        </button>
        <h1 className="font-bold text-lg">Pin Results</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-6">
        {/* Estimated price banner */}
        {results.estimatedPrice !== null && (
          <div className="bg-indigo-600 text-white rounded-2xl p-4 text-center">
            <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
              Estimated Market Value
            </p>
            <p className="text-4xl font-bold">
              ${results.estimatedPrice.toFixed(2)}
            </p>
            <p className="text-xs opacity-70 mt-1">
              Median of {results.listings.length} similar active listings
            </p>
          </div>
        )}

        {/* Active listings */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Similar Active Listings
          </h2>
          {results.listings.length > 0 ? (
            <div className="space-y-2">
              {results.listings.map((item) => (
                <ListingCard key={item.itemId} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No similar listings found.</p>
          )}
        </section>

        {/* Sold listings */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Recently Sold
          </h2>
          {results.soldListings.length > 0 ? (
            <div className="space-y-2">
              {results.soldListings.map((item, i) => (
                <SoldCard key={i} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No recent sales found.</p>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Post your pin section */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-1">Post Your Pin</h2>
          <p className="text-xs text-gray-400 mb-4">
            AI-generated description · post directly to eBay
          </p>

          {descLoading ? (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
              <p className="text-sm text-indigo-500 animate-pulse">
                Generating description…
              </p>
            </div>
          ) : (
            <ListingForm
              description={description}
              isAuthenticated={isAuthenticated}
            />
          )}
        </section>
      </div>
    </main>
  );
}
