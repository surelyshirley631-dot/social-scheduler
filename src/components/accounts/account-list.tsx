"use client"

import { useEffect, useState } from "react"

type AccountItem = {
  id: string
  platform: "INSTAGRAM" | "TIKTOK"
  platformAccountId: string
  platformAccountUsername: string | null
  createdAt: string
}

export function AccountList() {
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const res = await fetch("/api/accounts", { cache: "no-store" })
    if (!res.ok) {
      setError("Failed to load accounts")
      setLoading(false)
      return
    }
    const data = await res.json()
    setAccounts(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRemove(id: string) {
    const ok = window.confirm(
      "Disconnect this account? Related scheduled posts will be removed."
    )
    if (!ok) return
    setRemovingId(id)
    setError(null)
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
    setRemovingId(null)
    if (!res.ok) {
      const text = await res.text()
      setError(text || "Failed to disconnect account")
      return
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  function handleConnectInstagram() {
    window.location.href = "/api/oauth/instagram/start"
  }

  function handleConnectTiktok() {
    window.location.href = "/api/oauth/tiktok/start"
  }

  const igAccounts = accounts.filter((a) => a.platform === "INSTAGRAM")
  const ttAccounts = accounts.filter((a) => a.platform === "TIKTOK")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">Connected accounts</div>
          <div className="text-xs text-gray-500">
            You can connect multiple Instagram Business and TikTok accounts.
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded border px-3 py-1 text-xs disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
      <div className="space-y-4">
        <PlatformSection
          title="Instagram Business account"
          description="Used for images and Reels publishing"
          accounts={igAccounts}
          removingId={removingId}
          onRemove={handleRemove}
          onConnect={handleConnectInstagram}
          badgeClass="bg-pink-100 text-pink-700"
        />
        <PlatformSection
          title="TikTok account"
          description="Used for posting TikTok videos"
          accounts={ttAccounts}
          removingId={removingId}
          onRemove={handleRemove}
          onConnect={handleConnectTiktok}
          badgeClass="bg-purple-100 text-purple-700"
        />
      </div>
    </div>
  )
}

type PlatformSectionProps = {
  title: string
  description: string
  accounts: AccountItem[]
  removingId: string | null
  onRemove: (id: string) => void
  onConnect: () => void
  badgeClass: string
}

function PlatformSection(props: PlatformSectionProps) {
  const { title, description, accounts, removingId, onRemove, onConnect, badgeClass } =
    props

  return (
    <div className="space-y-2 rounded border p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-gray-500">{description}</div>
        </div>
        <button
          type="button"
          onClick={onConnect}
          className="rounded bg-black px-3 py-1 text-xs text-white"
        >
          Connect new account
        </button>
      </div>
      {accounts.length === 0 ? (
        <div className="text-[11px] text-gray-400">
          No accounts are connected yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-xs"
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2">
                  <span className={`rounded px-1 text-[10px] ${badgeClass}`}>
                    {a.platform}
                  </span>
                  <span className="font-medium">
                    {a.platformAccountUsername || a.platformAccountId}
                  </span>
                </span>
                <span className="mt-0.5 text-[10px] text-gray-400">
                  ID: {a.platformAccountId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                disabled={removingId === a.id}
                className="rounded border px-2 py-1 text-[11px] text-red-600 disabled:opacity-50"
              >
                {removingId === a.id ? "Disconnecting..." : "Disconnect"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
