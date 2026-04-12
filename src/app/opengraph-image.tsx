import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bruster's of La Cañada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#FFF8E7",
          gap: 4,
          padding: "0 60px",
        }}
      >
        {/* Brand name */}
        <div
          style={{
            fontSize: 220,
            fontWeight: 900,
            color: "#8B1A1A",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          Bruster&apos;s
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#231f20",
            letterSpacing: "0.01em",
          }}
        >
          of La Cañada
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "#6B7280",
            marginTop: 4,
          }}
        >
          Order from your car · We&apos;ll bring it to you
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 12,
            backgroundColor: "#8B1A1A",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
