import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { PostEditor } from "@/components/dashboard/post-editor"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  return (
    <main className="flex h-[100vh] flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="text-lg font-semibold">社交媒体排期</div>
        <div className="text-xs text-gray-500">
          {session.user?.email}
        </div>
      </header>
      <section className="flex flex-1 gap-4 p-4">
        <div className="flex-1 rounded-lg border bg-white">
          <CalendarView />
        </div>
        <div className="w-[380px] rounded-lg border bg-white p-4">
          <PostEditor />
        </div>
      </section>
    </main>
  )
}

