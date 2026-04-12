"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
        {/* Logo */}
        <div className="anim-logo w-72 max-w-full drop-shadow-sm">
          <Image
            src="/BrustersLogo.svg"
            alt="Bruster's Real Ice Cream"
            width={480}
            height={188}
            priority
            className="w-full h-auto"
          />
        </div>

        {/* Text */}
        <div className="anim-text flex flex-col gap-2">
          <p className="text-xl font-bold text-charcoal">
            Welcome to Bruster&apos;s of La Ca&ntilde;ada
          </p>
          <p className="text-base text-muted">
            Order from your car and we&apos;ll bring it to you
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
    </div>
  );
}
