import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Bruster's Real Ice Cream – La Cañada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const logoSvg = readFileSync(join(process.cwd(), "public/BrustersLogo.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logoSvg.toString("base64")}`;

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
          padding: "8px 20px",
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={800} height={313} alt="" />

        {/* Location + tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#8B1A1A",
              letterSpacing: "-0.02em",
            }}
          >
            La Cañada
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#6B7280",
              letterSpacing: "0.01em",
            }}
          >
            Order from your car · We&apos;ll bring it to you
          </div>
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
