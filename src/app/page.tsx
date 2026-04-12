import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-brand">
          Brusters
        </h1>

        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold text-charcoal">
            Welcome to Brusters!
          </p>
          <p className="text-base text-muted">
            Order from your car and we&apos;ll bring it to you
          </p>
        </div>

        <Link
          href="/menu"
          className="mt-4 inline-flex h-13 items-center justify-center rounded-lg bg-brand px-10 text-lg font-semibold text-white transition-colors hover:bg-brand-light active:bg-brand-light"
        >
          View Menu
        </Link>
      </div>
    </div>
  );
}
