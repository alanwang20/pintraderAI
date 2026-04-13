"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SoldListing } from "@/lib/api";

export default function SoldPage() {
  const router = useRouter();
  const [soldListings, setSoldListings] = useState<SoldListing[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const raw = sessionStorage.getItem("soldData");
    if (!raw) { router.replace("/"); return; }
    const data = JSON.parse(raw);
    const items: SoldListing[] = data.soldListings ?? [];
    setSoldListings(items);
    setSearchKeyword(data.searchKeyword ?? "");
    setSelected(new Set(items.map((_, i) => i)));
  }, [router]);

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function handleContinue() {
    sessionStorage.setItem(
      "selectedSold",
      JSON.stringify(soldListings.filter((_, i) => selected.has(i)))
    );
    router.push("/results");
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-emerald-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/select")} className="text-emerald-200 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-lg leading-tight">Recently Sold</h1>
          {searchKeyword && (
            <p className="text-xs text-emerald-200">&ldquo;{searchKeyword}&rdquo;</p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Completed Sales</h2>
            <span className="text-xs text-emerald-600">{selected.size} / {soldListings.length} selected</span>
          </div>

          {soldListings.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-6 text-center">No recent sales found.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {soldListings.map((item, i) => {
                const isSelected = selected.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
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
                        <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        ${parseFloat(item.soldPrice || "0").toFixed(2)}
                      </p>
                      {item.soldDate && (
                        <p className="text-xs text-gray-400 mt-0.5">Sold {item.soldDate}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <button
          onClick={handleContinue}
          className="w-full max-w-lg mx-auto block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl text-base transition-colors"
        >
          Continue {selected.size > 0 ? `(${selected.size} selected)` : ""}
        </button>
      </div>
    </main>
  );
}
