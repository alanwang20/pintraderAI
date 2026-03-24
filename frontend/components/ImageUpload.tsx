"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  onImageSelected: (file: File) => void;
  loading?: boolean;
}

export default function ImageUpload({ onImageSelected, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelected(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-indigo-400">
          <Image src={preview} alt="Pin preview" fill className="object-cover" />
          {!loading && (
            <button
              onClick={() => {
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div
          className="w-full max-w-sm mx-auto aspect-square border-2 border-dashed border-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer bg-indigo-50 active:bg-indigo-100 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-5xl">📷</div>
          <p className="text-center text-sm text-indigo-700 font-medium px-4">
            Tap to take a photo or upload a pin image
          </p>
        </div>
      )}
    </div>
  );
}
