export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-4xl font-bold">MyApp</h1>
      <p className="text-center text-muted">
        Turborepo · Expo · Next.js · Firebase
      </p>

      <div className="w-full rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-3 font-semibold">API routes</h2>
        <ul className="space-y-2 text-sm text-muted">
          <li>
            <code className="rounded bg-background px-1.5 py-0.5">
              GET /api/health
            </code>{" "}
            — health check (the mobile app pings this from Settings)
          </li>
          <li>
            <code className="rounded bg-background px-1.5 py-0.5">
              GET /api/me
            </code>{" "}
            — verifies a Firebase ID token and returns the user&apos;s
            Firestore document
          </li>
        </ul>
      </div>
    </main>
  );
}
