"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.heic,.heif";

interface PhotoUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: taille max 10 Mo`;
  }
  const type = file.type.toLowerCase();
  const ext = file.name.toLowerCase().split(".").pop();
  if (!ACCEPTED_TYPES.includes(type) && !["jpg", "jpeg", "png", "heic", "heif"].includes(ext || "")) {
    return `${file.name}: format non support\u00e9 (JPEG, PNG, HEIC uniquement)`;
  }
  return null;
}

export function PhotoUpload({ onUpload, disabled = false, className = "" }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    setErrors(validationErrors);

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      await onUpload(validFiles);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-accent/50"
        } ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            Envoi en cours...
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-secondary p-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">
              Glissez des photos ou cliquez pour s&eacute;lectionner
            </span>
            <span className="text-xs text-muted-foreground/60">
              JPEG, PNG, HEIC &mdash; 10 Mo max
            </span>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{err}</span>
              <button onClick={() => setErrors(errors.filter((_, j) => j !== i))} className="ml-auto p-0.5 hover:bg-destructive/10 rounded">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
