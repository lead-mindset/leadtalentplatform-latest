"use client";

import { ValidationQueue } from "@/components/validation-queue";
import { useAdminRole } from "@/lib/admin-role";

export default function AdminValidacionesPage() {
  const { role, scope } = useAdminRole();
  return <ValidationQueue scope={role === "chapter" ? "chapter" : "global"} chapter={scope} />;
}
