import { auth } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardPage() {
  const session = await auth()
  return (
    <main className="flex h-[100vh] flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="text-lg font-semibold">Social media schedule</div>
        <div className="text-xs text-gray-500">
          {session.user?.email}
        </div>
      </header>
      <DashboardShell />
    </main>
  )
}
