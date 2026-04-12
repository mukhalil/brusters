"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StaffLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        setError("Invalid PIN");
        setPin("");
        return;
      }

      sessionStorage.setItem("staff-pin", pin);
      router.push("/staff/dashboard");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-charcoal">Staff Login</h1>
          <p className="mt-1 text-sm text-muted">
            Enter your PIN to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setPin(value);
              setError(null);
            }}
            placeholder="Enter PIN"
            autoFocus
            className="w-full rounded-xl border border-border bg-surface px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] text-charcoal placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={pin.length < 4}
          >
            Enter
          </Button>
        </form>
      </div>
    </div>
  );
}
