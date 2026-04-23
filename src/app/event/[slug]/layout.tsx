import { notFound } from "next/navigation";
import { loadEventBySlug } from "@/lib/events";
import { EventTheme } from "@/components/event/event-theme";

export default async function EventLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const event = await loadEventBySlug(slug);
  if (!event) notFound();

  return (
    <EventTheme
      branding={{
        brandName: event.brandName,
        brandLogoUrl: event.brandLogoUrl,
        brandPrimaryColor: event.brandPrimaryColor,
        brandAccentColor: event.brandAccentColor,
        welcomeMessage: event.welcomeMessage,
      }}
      className="min-h-dvh"
    >
      {children}
    </EventTheme>
  );
}
