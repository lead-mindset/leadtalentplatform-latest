"use client";

import { useEffect, useState } from "react";
import { talent } from "@/lib/data/talent";

const KEY = "lead-saved-talent";
const DEFAULT_SAVED = ["t1", "t4"];

export function useSavedTalent() {
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setSaved(raw ? (JSON.parse(raw) as string[]) : DEFAULT_SAVED);
    } catch {
      setSaved(DEFAULT_SAVED);
    }
    setReady(true);
  }, []);

  const toggle = (id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const savedPeople = talent.filter((person) => saved.includes(person.id));

  return { saved, savedPeople, toggle, ready };
}