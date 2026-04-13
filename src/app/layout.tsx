import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { PHProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mobile Ice Cream Ordering",
  description: "Just park, order, and we'll bring your order to your car!",
  openGraph: {
    title: "Mobile Ice Cream Ordering",
    description: "Just park, order, and we'll bring your order to your car!",
    siteName: "Park and Order",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile Ice Cream Ordering",
    description: "Just park, order, and we'll bring your order to your car!",
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
