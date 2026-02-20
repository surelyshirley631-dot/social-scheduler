export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">
          Multi-platform social media scheduler
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Click the button below to open the dashboard and create your schedule.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm text-white"
        >
          Open dashboard
        </a>
      </div>
    </main>
  );
}
