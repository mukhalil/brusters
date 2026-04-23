import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEventBySlug, isEventOrderingOpen, eventDisplayName } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await loadEventBySlug(slug);
  if (!event) notFound();

  const isOpen = isEventOrderingOpen(event);
  const name = eventDisplayName(event);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center bg-cream">
      <div className="flex flex-col items-center gap-6">
        {event.brandLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.brandLogoUrl}
            alt=""
            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
          />
        )}

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-black tracking-tight text-brand">{name}</h1>
          {event.brandName && event.name !== event.brandName && (
            <p className="text-sm text-muted">{event.name}</p>
          )}
        </div>

        {event.welcomeMessage ? (
          <p className="max-w-sm whitespace-pre-wrap text-base text-charcoal">
            {event.welcomeMessage}
          </p>
        ) : (
          <p className="max-w-sm text-base text-muted">
            Order ice cream from your phone — we&apos;ll text you when it&apos;s ready.
          </p>
        )}

        {isOpen ? (
          <Link
            href={`/event/${event.slug}/menu`}
            className="mt-3 inline-flex h-14 items-center justify-center rounded-xl bg-brand px-12 text-lg font-semibold text-white shadow-md transition-transform active:scale-95"
          >
            Start your order
          </Link>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4">
            <span className="text-sm font-semibold text-amber-800">
              Ordering is not open yet
            </span>
            {event.startsAt && (
              <span className="text-xs text-amber-700">
                Opens{" "}
                {new Date(event.startsAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-1 pt-4 text-xs text-muted">
          {event.paymentMode === "prepaid" ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Covered by the host
            </span>
          ) : (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Pay individually at checkout
            </span>
          )}
          {event.maxOrdersPerGuest != null && (
            <span>
              Limit: {event.maxOrdersPerGuest} order
              {event.maxOrdersPerGuest === 1 ? "" : "s"} per guest
            </span>
          )}
          {event.pickupInstructions && (
            <span className="max-w-sm text-center">
              Pickup: {event.pickupInstructions}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
