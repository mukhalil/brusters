import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { PHProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bruster's Real Ice Cream – La Cañada",
  description: "Order your favorite Bruster's ice cream for curbside pickup. We'll bring it right to your car.",
  openGraph: {
    title: "Bruster's Real Ice Cream – La Cañada",
    description: "Order from your car and we'll bring it to you.",
    siteName: "Bruster's Real Ice Cream",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bruster's Real Ice Cream – La Cañada",
    description: "Order from your car and we'll bring it to you.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <PHProvider>{children}</PHProvider>
      </body>
    </html>
  );
}
