"use client"

import { useEffect, useMemo, useState } from "react"
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns"

type CalendarPost = {
  id: string
  scheduledAt: string
  platform: "INSTAGRAM" | "TIKTOK"
  status: "PENDING" | "SUCCESS" | "FAILED"
}

type ViewMode = "month" | "week"

type CalendarViewProps = {
  onDayDrop?: (date: Date, file: File) => void
}

export function CalendarView(props: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [loading, setLoading] = useState(false)
  const { onDayDrop } = props

  useEffect(() => {
    async function load() {
      setLoading(true)
      const range = getRange(currentDate, viewMode)
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      })
      const res = await fetch(`/api/posts?${params.toString()}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
      setLoading(false)
    }
    load()
  }, [currentDate, viewMode])

  const days = useMemo(
    () => buildDays(currentDate, viewMode),
    [currentDate, viewMode]
  )

  function handlePrev() {
    setCurrentDate(
      viewMode === "month"
        ? addDays(currentDate, -30)
        : addDays(currentDate, -7)
    )
  }

  function handleNext() {
    setCurrentDate(
      viewMode === "month"
        ? addDays(currentDate, 30)
        : addDays(currentDate, 7)
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={handlePrev}
          >
            Previous
          </button>
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={handleNext}
          >
            Next
          </button>
          <div className="ml-4 text-sm font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={`rounded border px-3 py-1 text-xs ${
              viewMode === "month" ? "bg-black text-white" : ""
            }`}
            onClick={() => setViewMode("month")}
          >
            Month view
          </button>
          <button
            className={`rounded border px-3 py-1 text-xs ${
              viewMode === "week" ? "bg-black text-white" : ""
            }`}
            onClick={() => setViewMode("week")}
          >
            Week view
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b text-center text-[11px] text-gray-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="border-r px-2 py-1 last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const dayPosts = posts.filter((p) =>
            isSameDay(new Date(p.scheduledAt), day)
          )
          const hasIg = dayPosts.some((p) => p.platform === "INSTAGRAM")
          const hasTt = dayPosts.some((p) => p.platform === "TIKTOK")
          return (
            <div
              key={day.toISOString()}
              className={`flex flex-col border-r border-b px-1 py-1 text-xs last:border-r-0 ${
                isSameMonth(day, currentDate) ? "bg-white" : "bg-gray-50"
              } ${isSameDay(day, new Date()) ? "bg-gray-100" : ""}`}
              onDragOver={(e) => {
                if (!onDayDrop) return
                if (
                  Array.from(e.dataTransfer.items).some(
                    (item) => item.kind === "file"
                  )
                ) {
                  e.preventDefault()
                }
              }}
              onDrop={(e) => {
                if (!onDayDrop) return
                const file = e.dataTransfer.files?.[0]
                if (file) {
                  e.preventDefault()
                  onDayDrop(day, file)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span>{format(day, "d")}</span>
                <div className="flex gap-1">
                  {hasIg && (
                    <span className="rounded bg-pink-100 px-1 text-[10px] text-pink-700">
                      IG
                    </span>
                  )}
                  {hasTt && (
                    <span className="rounded bg-purple-100 px-1 text-[10px] text-purple-700">
                      TT
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayPosts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] ${
                      p.status === "PENDING" &&
                      "bg-yellow-100 text-yellow-800"
                    } ${
                      p.status === "SUCCESS" && "bg-green-100 text-green-800"
                    } ${p.status === "FAILED" && "bg-red-100 text-red-800"}`}
                  >
                    {p.platform === "INSTAGRAM" ? "IG" : "TT"}{" "}
                    {format(new Date(p.scheduledAt), "HH:mm")}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-[10px] text-gray-400">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 text-xs text-gray-500">
          Loading…
        </div>
      )}
    </div>
  )
}

function getRange(date: Date, mode: ViewMode) {
  if (mode === "week") {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })
    return { from: start, to: end }
  }
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
  return { from: start, to: end }
}

function buildDays(date: Date, mode: ViewMode) {
  const range = getRange(date, mode)
  return eachDayOfInterval({ start: range.from, end: range.to })
}
