import { Listing } from "@/lib/api";
import Image from "next/image";

export default function ListingCard({ item }: { item: Listing }) {
  return (
    <a
      href={item.itemWebUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.title} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📌</div>
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
    </a>
  );
}
