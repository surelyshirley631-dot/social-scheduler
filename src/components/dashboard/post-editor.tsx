"use client"

import { useEffect, useState } from "react"

type Platform = "INSTAGRAM" | "TIKTOK"

type PostEditorProps = {
  scheduledAt?: string
  file?: File | null
}

export function PostEditor(props: PostEditorProps) {
  const [scheduledAt, setScheduledAt] = useState(props.scheduledAt ?? "")
  const [caption, setCaption] = useState("")
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [file, setFile] = useState<File | null>(props.file ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (props.scheduledAt !== undefined) {
      setScheduledAt(props.scheduledAt)
    }
  }, [props.scheduledAt])

  useEffect(() => {
    if (props.file !== undefined) {
      setFile(props.file ?? null)
      if (props.file) {
        const url = URL.createObjectURL(props.file)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
      }
    }
  }, [props.file])

  function togglePlatform(p: Platform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  function validate() {
    if (!scheduledAt) {
      return "Please select a scheduled time"
    }
    if (!file) {
      return "Please upload an image or video"
    }
    if (platforms.length === 0) {
      return "Please select at least one platform"
    }
    const isVideo = file.type.startsWith("video/")
    const isImage = file.type.startsWith("image/")
    if (!isVideo && !isImage) {
      return "Only image or video files are supported"
    }
    if (platforms.includes("TIKTOK") && !isVideo) {
      return "TikTok only supports video files"
    }
    const maxCaptionLength = 2200
    if (caption.length > maxCaptionLength) {
      return `Caption cannot exceed ${maxCaptionLength} characters`
    }
    return null
  }

  async function handleSubmit() {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    if (!file) return
    setSubmitting(true)
    setError(null)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("caption", caption)
    formData.append("scheduledAt", new Date(scheduledAt).toISOString())
    formData.append("platforms", JSON.stringify(platforms))
    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    })
    setSubmitting(false)
    if (!res.ok) {
      const text = await res.text()
      setError(text || "Failed to create schedule")
      return
    }
    setCaption("")
    setFile(null)
    setPreviewUrl(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setFile(f ?? null)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const isVideo = file?.type.startsWith("video/")

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 text-base font-semibold">Create new schedule</div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        <div className="space-y-1 text-xs">
          <div className="text-gray-600">Scheduled time</div>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1 text-xs">
          <div className="text-gray-600">Target platforms</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded border px-3 py-1 text-sm ${
                platforms.includes("INSTAGRAM")
                  ? "bg-black text-white"
                  : "bg-white"
              }`}
              onClick={() => togglePlatform("INSTAGRAM")}
            >
              Instagram
            </button>
            <button
              type="button"
              className={`flex-1 rounded border px-3 py-1 text-sm ${
                platforms.includes("TIKTOK")
                  ? "bg-black text-white"
                  : "bg-white"
              }`}
              onClick={() => togglePlatform("TIKTOK")}
            >
              TikTok
            </button>
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="text-gray-600">Caption</div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="w-full rounded border px-2 py-1 text-sm"
            placeholder="Write your caption"
          />
          <div className="text-right text-[10px] text-gray-400">
            {caption.length} characters
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="text-gray-600">Media file</div>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="w-full text-sm"
          />
          {previewUrl && (
            <div className="mt-2">
              {isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  className="h-40 w-full rounded object-cover"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-40 w-full rounded object-cover"
                />
              )}
            </div>
          )}
        </div>
        {error && (
          <div className="text-xs text-red-500">{error}</div>
        )}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-3 w-full rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save schedule"}
      </button>
    </div>
  )
}
