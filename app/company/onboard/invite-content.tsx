"use client"

import { useSearchParams } from "next/navigation"

export default function InviteContent() {
  const params = useSearchParams()
  const token = params.get("token")

  if (!token) {
    return <p className="mt-4 text-red-500">Missing invitation token.</p>
  }

  return (
    <div className="mt-4 break-all">
      Invitation token:
      <br />
      <code>{token}</code>
    </div>
  )
}
