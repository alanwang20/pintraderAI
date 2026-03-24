"use client";

import { useState } from "react";
import { createListing, getEbayAuthUrl, ListingResult } from "@/lib/api";

interface Props {
  description: string;
  isAuthenticated: boolean;
}

const CONDITIONS = [
  { id: "1000", label: "New" },
  { id: "2750", label: "Like New" },
  { id: "3000", label: "Used – Very Good" },
  { id: "4000", label: "Used – Good" },
  { id: "5000", label: "Used – Acceptable" },
];

const DURATIONS = [
  { value: "Days_3", label: "3 days" },
  { value: "Days_5", label: "5 days" },
  { value: "Days_7", label: "7 days" },
  { value: "Days_10", label: "10 days" },
  { value: "GTC", label: "Good Till Cancelled" },
];

type ListingFormat = "Chinese" | "FixedPriceItem" | "LeadGeneration";

const FORMATS: { value: ListingFormat; label: string; desc: string }[] = [
  { value: "Chinese", label: "Auction", desc: "Bidding starts at your price" },
  { value: "FixedPriceItem", label: "Buy It Now", desc: "Fixed price, buy immediately" },
  { value: "LeadGeneration", label: "Hybrid", desc: "Auction + Buy It Now option" },
];

export default function ListingForm({ description: initialDesc, isAuthenticated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(initialDesc);
  const [conditionId, setConditionId] = useState("3000");
  const [format, setFormat] = useState<ListingFormat>("Chinese");
  const [startPrice, setStartPrice] = useState("0.99");
  const [binPrice, setBinPrice] = useState("");
  const [duration, setDuration] = useState("Days_7");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = getEbayAuthUrl();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createListing({
        title,
        description,
        conditionId,
        listingFormat: format,
        startPrice: parseFloat(startPrice) || 0.99,
        buyItNowPrice: binPrice ? parseFloat(binPrice) : null,
        duration,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post listing");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3">
        <div className="text-3xl">🎉</div>
        <p className="font-semibold text-emerald-800">Listing posted successfully!</p>
        <a
          href={result.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-indigo-600 underline break-all"
        >
          View on eBay →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* eBay connect banner */}
      {!isAuthenticated && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-3">
          <span className="text-xl">🔗</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Connect your eBay account</p>
            <p className="text-xs text-amber-700">Required to post listings directly to eBay.</p>
          </div>
          <a
            href={getEbayAuthUrl()}
            className="ml-auto shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            Connect
          </a>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Listing title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          placeholder="e.g. Disney Mickey Mouse Trading Pin — Limited Edition"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
          <span className="text-xs text-gray-400 ml-1">(max 15 words, AI-generated)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <select
          value={conditionId}
          onChange={(e) => setConditionId(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Listing format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Listing format</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={`rounded-xl border p-2 text-center transition-colors ${
                format === f.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <p className="text-xs font-semibold">{f.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {format === "FixedPriceItem" ? "Buy It Now price" : "Starting price"}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        {(format === "Chinese" || format === "LeadGeneration") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buy It Now price
              <span className="text-xs text-gray-400 ml-1">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={binPrice}
                onChange={(e) => setBinPrice(e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-xl pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
      >
        {loading ? "Posting…" : isAuthenticated ? "Post to eBay" : "Connect eBay & Post"}
      </button>
    </form>
  );
}
