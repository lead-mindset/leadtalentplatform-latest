"use client";
import { Chip } from "@/components/ui/chip";

import { useState } from "react";
import { X } from "lucide-react";

const skillPool = [
  "Python",
  "React",
  "Java",
  "SQL",
  "TypeScript",
  "Machine Learning",
  "Data Analysis",
  "Deep Learning",
  "AWS",
  "System Design",
  "Figma",
  "Design Systems",
  "Econometrics",
  "SolidWorks",
  "Kotlin",
];

export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  hint,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [value, setValue] = useState("");

  const suggestions = skillPool
    .filter((skill) => skill.toLowerCase().includes(value.toLowerCase()) && !tags.includes(skill))
    .slice(0, 6);

  const add = (raw: string) => {
    const tag = raw.trim();
    if (tag && !tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) onAdd(tag);
    setValue("");
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-card p-2">
        {tags.map((tag) => (
          <Chip key={tag} className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              aria-label={`Quitar ${tag}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Chip>
        ))}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(value);
            }
          }}
          placeholder={tags.length === 0 ? (placeholder ?? "Escribe una skill…") : ""}
          className="min-w-24 flex-1 bg-transparent text-small outline-none placeholder:text-muted-foreground"
          aria-label="Agregar skill"
        />
      </div>

      {value.trim() && suggestions.length > 0 && (
        <div className="mt-1.5 rounded-md border border-border bg-card p-1">
          {suggestions.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => add(skill)}
              className="block w-full rounded px-2 py-1 text-left text-small text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {skill}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-caption text-muted-foreground">
        {hint ?? "Escribe y presiona Enter o elige una sugerencia."}
      </p>
    </div>
  );
}