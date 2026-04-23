import type { EventBranding } from "@/types/event";

interface EventThemeProps {
  branding: EventBranding;
  children: React.ReactNode;
  className?: string;
}

// Scoped CSS-variable override. When primary/accent colors are set on the
// event, they replace --color-brand and --color-brand-light for children
// so Tailwind utilities like `bg-brand` pick up the event colors.
export function EventTheme({ branding, children, className }: EventThemeProps) {
  const style: React.CSSProperties = {};
  if (branding.brandPrimaryColor) {
    (style as Record<string, string>)["--color-brand"] = branding.brandPrimaryColor;
  }
  if (branding.brandAccentColor) {
    (style as Record<string, string>)["--color-brand-light"] = branding.brandAccentColor;
  } else if (branding.brandPrimaryColor) {
    (style as Record<string, string>)["--color-brand-light"] = branding.brandPrimaryColor;
  }

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
