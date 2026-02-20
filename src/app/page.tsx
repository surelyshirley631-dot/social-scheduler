export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">多平台社交媒体排期系统</h1>
        <p className="mb-6 text-sm text-gray-600">
          请点击下方按钮登录并进入仪表盘开始创建排期。
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm text-white"
        >
          进入仪表盘
        </a>
      </div>
    </main>
  );
}
