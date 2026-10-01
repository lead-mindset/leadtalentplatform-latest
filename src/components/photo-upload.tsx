"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "cn";

export function PhotoUpload({
  value,
  onChange,
  initials,
  label = "Sube tu foto",
  className,
}: {
  value?: string;
  onChange: (preview: string, file?: File) => void;
  initials?: string;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Elige una imagen (jpg, png o webp)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La foto pesa más de 5 MB. Elige una más ligera");
      return;
    }
    setError(undefined);
    onChange(URL.createObjectURL(file), file);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <div
          role="button"
          tabIndex={0}
          aria-label={label}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors",
            dragging ? "border-brand-purple-light bg-brand-purple/10" : "border-muted-foreground/40 hover:border-brand-purple-light/60 hover:bg-brand-purple/5"
          )}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Tu foto de perfil" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </>
          ) : initials ? (
            <span className="text-h1 font-bold text-brand-purple-light">{initials}</span>
          ) : (
            <Camera className="size-6 text-muted-foreground" />
          )}
          {!value && (
            <span className="absolute bottom-1 right-1 grid size-6 place-items-center rounded-full bg-brand-purple text-primary-foreground shadow-sm">
              <Camera className="size-3" />
            </span>
          )}
        </div>
        <div>
          <p className="text-small font-medium">{label}</p>
          <p className="mt-0.5 text-caption text-muted-foreground">jpg, png o webp · máx 5 MB</p>
          {error && (
            <p className="mt-0.5 text-caption text-destructive-light" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}