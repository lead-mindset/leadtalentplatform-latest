"use client";

import { useEffect, useState } from "react";
import { testUsers, type TestUser } from "@/lib/data/test-users";

const KEY = "lead-view-as";
const EVENT = "lead-view-as-change";

function readStoredUser(): TestUser {
  if (typeof window === "undefined") return testUsers[0];
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const found = testUsers.find((item) => item.id === saved);
      if (found) return found;
    }
  } catch {
    /* ignore */
  }
  return testUsers[0];
}

export function setViewAsUser(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function useCurrentUser(): TestUser {
  const [user, setUser] = useState<TestUser>(testUsers[0]);

  useEffect(() => {
    setUser(readStoredUser());
    const sync = () => setUser(readStoredUser());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  return user;
}