import { customAlphabet } from "nanoid";
import type { Event } from "@/types/event";

const slugAlphabet = "23456789abcdefghjkmnpqrstuvwxyz";
const makeSlug = customAlphabet(slugAlphabet, 10);

export function generateSlug(): string {
  return makeSlug();
}

export function isEventOrderingOpen(event: Event, now: Date = new Date()): boolean {
  if (event.status !== "active") return false;
  if (event.startsAt && new Date(event.startsAt).getTime() > now.getTime()) return false;
  if (event.endsAt && new Date(event.endsAt).getTime() < now.getTime()) return false;
  return true;
}

export function eventDisplayName(event: Pick<Event, "name" | "brandName">): string {
  return event.brandName && event.brandName.trim() ? event.brandName : event.name;
}

export function formatShortQueue(queueNumber: number | null | undefined): string {
  if (queueNumber == null) return "";
  return `#${String(queueNumber).padStart(2, "0")}`;
}

// Accept http(s) URLs only — rejects data: URIs and other schemes that would
// otherwise bloat the events row (logos stored as base64 can reach megabytes).
const LOGO_URL_RE = /^https?:\/\/[^\s<>"']+$/i;
export const LOGO_URL_MAX_LENGTH = 2048;

export function validateLogoUrl(value: unknown): { ok: true } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true };
  if (typeof value !== "string") return { ok: false, error: "Logo URL must be a string" };
  if (value.length > LOGO_URL_MAX_LENGTH) {
    return { ok: false, error: `Logo URL must be ${LOGO_URL_MAX_LENGTH} characters or fewer` };
  }
  if (!LOGO_URL_RE.test(value)) {
    return { ok: false, error: "Logo URL must start with http:// or https:// (data URLs are not allowed)" };
  }
  return { ok: true };
}
