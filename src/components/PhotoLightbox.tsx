"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Photo } from "@/lib/types/database";

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex = 0, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const photo = photos[index];

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
      >
        <X className="h-6 w-6" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || "Photo"}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        <div className="mt-3 text-center">
          {photo.caption && (
            <p className="text-white/90 text-sm">{photo.caption}</p>
          )}
          <p className="text-white/50 text-xs mt-1">
            {new Date(photo.created_at).toLocaleDateString("fr-FR")}
            {photos.length > 1 && ` — ${index + 1} / ${photos.length}`}
          </p>
        </div>
      </div>
    </div>
  );
}
