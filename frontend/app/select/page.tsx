"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Listing, getSoldByTitles } from "@/lib/api";

export default function SelectPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("activeListings");
    if (!raw) { router.replace("/"); return; }
    const data = JSON.parse(raw);
    const items: Listing[] = data.listings ?? [];
    setListings(items);
    // Pre-select all
    setSelected(new Set(items.map((l) => l.itemId)));
  }, [router]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleFindSold() {
    const chosenTitles = listings
      .filter((l) => selected.has(l.itemId))
      .map((l) => l.title);

    if (chosenTitles.length === 0) {
      setError("Select at least one listing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getSoldByTitles(chosenTitles);
      sessionStorage.setItem(
        "selectedActive",
        JSON.stringify(listings.filter((l) => selected.has(l.itemId)))
      );
      sessionStorage.setItem(
        "soldData",
        JSON.stringify({ soldListings: result.soldListings, searchKeyword: result.searchKeyword })
      );
      router.push("/sold");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-indigo-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-indigo-200 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-lg leading-tight">Select Matches</h1>
          <p className="text-xs text-indigo-200">Tap to include or exclude a listing</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Active Listings</h2>
            <span className="text-xs text-indigo-500">{selected.size} / {listings.length} selected</span>
          </div>

          {listings.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-6 text-center">No listings found.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {listings.map((item) => {
                const isSelected = selected.has(item.itemId);
                return (
                  <button
                    key={item.itemId}
                    onClick={() => toggle(item.itemId)}
                    className={`w-full flex gap-3 p-3 text-left transition-colors ${
                      isSelected ? "bg-white" : "bg-gray-50 opacity-50"
                    }`}
                  >
                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.title} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📌</div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                      <p className="text-sm font-bold text-indigo-600 mt-1">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                      {item.condition && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.condition}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center mt-4 px-4">{error}</p>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <button
          onClick={handleFindSold}
          disabled={selected.size === 0 || loading}
          className="w-full max-w-lg mx-auto block bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3 rounded-2xl text-base transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block">⏳</span> Finding sold prices…
            </span>
          ) : (
            `Find Sold Prices (${selected.size} selected)`
          )}
        </button>
      </div>
    </main>
  );
}
