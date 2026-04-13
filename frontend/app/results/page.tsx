"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import ListingForm from "@/components/ListingForm";
import { Listing, SoldListing, generateDescription, getAuthStatus } from "@/lib/api";

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<SoldListing[]>([]);
  const [description, setDescription] = useState("");
  const [descLoading, setDescLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const rawActive = sessionStorage.getItem("selectedActive");
    const rawSold = sessionStorage.getItem("selectedSold");
    if (!rawActive && !rawSold) { router.replace("/"); return; }
    setActiveListings(rawActive ? JSON.parse(rawActive) : []);
    setSoldListings(rawSold ? JSON.parse(rawSold) : []);
  }, [router]);

  useEffect(() => {
    getAuthStatus().then((s) => setIsAuthenticated(s.authenticated));
  }, [searchParams]);

  // Generate AI description from image + selected active listing titles
  useEffect(() => {
    if (activeListings.length === 0) return;
    const dataUrl = sessionStorage.getItem("pinImageDataUrl");
    if (!dataUrl) return;

    async function fetchDescription() {
      setDescLoading(true);
      try {
        const res = await fetch(dataUrl!);
        const blob = await res.blob();
        const file = new File([blob], "pin.jpg", { type: blob.type });
        const titles = activeListings.map((l) => l.title);
        const { description: desc } = await generateDescription(file, titles, "");
        setDescription(desc);
      } catch {
        setDescription("");
      } finally {
        setDescLoading(false);
      }
    }
    fetchDescription();
  }, [activeListings]);

  const soldPrices = soldListings.map((s) => parseFloat(s.soldPrice)).filter((n) => !isNaN(n));
  const avgSold = soldPrices.length
    ? (soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length).toFixed(2)
    : null;

  const activePrices = activeListings.map((l) => parseFloat(l.price)).filter((n) => !isNaN(n));
  const medianActive = activePrices.length
    ? [...activePrices].sort((a, b) => a - b)[Math.floor(activePrices.length / 2)].toFixed(2)
    : null;

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-indigo-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/sold")} className="text-indigo-200 hover:text-white text-lg">←</button>
        <h1 className="font-bold text-lg">Results</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* ── SELECTED ACTIVE LISTINGS ── */}
        {activeListings.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-indigo-50">
              <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Active Listings</h2>
              {medianActive && (
                <span className="text-sm font-semibold text-indigo-700">Median ${medianActive}</span>
              )}
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {activeListings.map((item) => (
                <a
                  key={item.itemId}
                  href={item.itemWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full aspect-square bg-gray-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill sizes="120px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📌</div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="text-xs text-gray-700 line-clamp-2 leading-tight">{item.title}</p>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── SELECTED SOLD LISTINGS ── */}
        {soldListings.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-emerald-50">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Recently Sold</h2>
              {avgSold && (
                <span className="text-sm font-semibold text-emerald-700">Avg ${avgSold}</span>
              )}
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {soldListings.map((item, i) => (
                <a
                  key={i}
                  href={item.itemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full aspect-square bg-gray-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill sizes="120px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📌</div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="text-xs text-gray-700 line-clamp-2 leading-tight">{item.title}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5">${parseFloat(item.soldPrice || "0").toFixed(2)}</p>
                    {item.soldDate && <p className="text-xs text-gray-400">{item.soldDate}</p>}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="border-t border-gray-200" />

        {/* ── POST YOUR PIN ── */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-1">Post Your Pin</h2>
          <p className="text-xs text-gray-400 mb-4">AI-generated description · post directly to eBay</p>
          {descLoading ? (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
              <p className="text-sm text-indigo-500 animate-pulse">Generating description…</p>
            </div>
          ) : (
            <ListingForm description={description} isAuthenticated={isAuthenticated} />
          )}
        </section>

      </div>
    </main>
  );
}
