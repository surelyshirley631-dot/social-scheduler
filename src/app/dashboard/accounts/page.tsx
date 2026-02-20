import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AccountList } from "@/components/accounts/account-list"

export default async function AccountsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  return (
    <main className="flex h-[100vh] flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="text-lg font-semibold">账号管理</div>
        <div className="text-xs text-gray-500">
          {session.user?.email}
        </div>
      </header>
      <section className="flex-1 p-4">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-4">
          <AccountList />
        </div>
      </section>
    </main>
  )
}

