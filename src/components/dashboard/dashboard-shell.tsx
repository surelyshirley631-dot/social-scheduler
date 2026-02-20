"use client"

import { useState } from "react"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { PostEditor } from "@/components/dashboard/post-editor"

export function DashboardShell() {
  const [scheduledAt, setScheduledAt] = useState("")
  const [file, setFile] = useState<File | null>(null)

  function handleDayDrop(date: Date, droppedFile: File) {
    const local = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      9,
      0,
      0,
      0
    )
    const isoLocal = new Date(
      local.getTime() - local.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16)
    setScheduledAt(isoLocal)
    setFile(droppedFile)
  }

  return (
    <section className="flex flex-1 gap-4 p-4">
      <div className="flex-1 rounded-lg border bg-white">
        <CalendarView onDayDrop={handleDayDrop} />
      </div>
      <div className="w-[380px] rounded-lg border bg-white p-4">
        <PostEditor />
      </div>
    </section>
  )
}
