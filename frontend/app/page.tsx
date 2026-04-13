"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { searchByImage, getAuthStatus, getEbayAuthUrl } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ebayUsername, setEbayUsername] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    getAuthStatus()
      .then((s) => {
        setIsAuthenticated(s.authenticated);
        setEbayUsername(s.username ?? "");
      })
      .finally(() => setAuthLoading(false));
  }, [searchParams]);

  function handleImageSelected(file: File) {
    setSelectedFile(file);
    setError(null);
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const searchResult = await searchByImage(selectedFile);

      sessionStorage.setItem(
        "activeListings",
        JSON.stringify({
          listings: searchResult.listings,
          estimatedPrice: searchResult.estimatedPrice,
        })
      );

      // Store image as data URL for Claude call on results page
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem("pinImageDataUrl", reader.result as string);
        router.push("/select");
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-indigo-800 tracking-tight">PinTraderAI</h1>
        <p className="text-sm text-gray-500 mt-1">
          Instant price lookup &amp; listing for trading pins
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* eBay auth status pill */}
        {!authLoading && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isAuthenticated ? "bg-emerald-400" : "bg-gray-300"}`} />
              <span className="text-sm text-gray-700">
                {isAuthenticated
                  ? ebayUsername ? `Connected: ${ebayUsername}` : "eBay connected"
                  : "eBay not connected"}
              </span>
            </div>
            {isAuthenticated ? (
              <button
                onClick={async () => {
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/auth/logout`, {
                    method: "POST",
                    credentials: "include",
                  });
                  setIsAuthenticated(false);
                  setEbayUsername("");
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <a
                href={getEbayAuthUrl()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Sign in with eBay →
              </a>
            )}
          </div>
        )}

        <ImageUpload onImageSelected={handleImageSelected} loading={loading} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedFile || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-base transition-colors shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block">⏳</span> Looking up price…
            </span>
          ) : (
            "Estimate Value"
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Powered by eBay listings · AI by Claude
        </p>
      </div>
    </main>
  );
}
