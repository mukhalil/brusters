"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EventForm,
  initialValues,
  valuesToBody,
  type EventFormValues,
} from "@/components/staff/event-form";

export default function NewEventPage() {
  const router = useRouter();
  const [staffPin, setStaffPin] = useState<string | null>(null);
  const [value, setValue] = useState<EventFormValues>(initialValues());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pin = sessionStorage.getItem("staff-pin");
    if (!pin) {
      router.push("/staff");
      return;
    }
    setStaffPin(pin);
  }, [router]);

  async function handleSubmit() {
    if (!staffPin) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-staff-pin": staffPin,
        },
        body: JSON.stringify(valuesToBody(value)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create event");
      }
      const created = await res.json();
      router.push(`/staff/events/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!staffPin) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
        <Link
          href="/staff/events"
          aria-label="Back"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-charcoal">
          New Event
        </h1>
        <div className="w-11" />
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <EventForm
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Create event"
          error={error}
        />
      </main>
    </div>
  );
}
