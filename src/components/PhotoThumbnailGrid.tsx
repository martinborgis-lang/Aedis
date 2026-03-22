"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Photo } from "@/lib/types/database";
import { PhotoLightbox } from "./PhotoLightbox";

interface PhotoThumbnailGridProps {
  photos: Photo[];
  maxVisible?: number;
  className?: string;
}

export function PhotoThumbnailGrid({ photos, maxVisible = 4, className = "" }: PhotoThumbnailGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const visible = photos.slice(0, maxVisible);
  const remaining = photos.length - maxVisible;

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Camera className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex gap-1">
          {visible.map((photo, i) => (
            <button
              key={photo.id}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
              className="w-8 h-8 rounded overflow-hidden border border-border hover:border-primary transition-colors shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || "Photo"}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {remaining > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(maxVisible); }}
              className="w-8 h-8 rounded border border-border bg-muted/20 flex items-center justify-center text-xs text-muted-foreground hover:border-primary transition-colors shrink-0"
            >
              +{remaining}
            </button>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
