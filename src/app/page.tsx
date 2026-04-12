"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  function handleViewMenu() {
    setExiting(true);
    setTimeout(() => router.push("/menu"), 350);
  }

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center bg-cream px-6 ${exiting ? "page-exit" : ""}`}
    >
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Brand name */}
        <div className="anim-logo flex flex-col items-center gap-1">
          <h1 className="text-4xl font-black tracking-tight text-brand">
            Bruster&apos;s
          </h1>
          <p className="text-lg font-semibold tracking-wide text-charcoal">
            of La Ca&ntilde;ada
          </p>
        </div>

        {/* Tagline */}
        <div className="anim-text flex flex-col gap-2">
          <p className="text-base text-muted">
            Order ahead for pickup or curbside delivery
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleViewMenu}
          className="anim-cta mt-2 inline-flex h-14 items-center justify-center rounded-xl bg-brand px-12 text-lg font-semibold text-white shadow-md transition-transform active:scale-95"
        >
          View Menu
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 flex flex-col items-center gap-1">
        <div className="flex items-center gap-3 text-xs text-muted/60">
          <Link href="/terms" className="underline hover:text-muted">Terms</Link>
          <span aria-hidden="true">&middot;</span>
          <Link href="/privacy" className="underline hover:text-muted">Privacy</Link>
        </div>
        <p className="text-sm text-muted/60">
          Powered by Juni Platforms
        </p>
      </div>
    </div>
  );
}
