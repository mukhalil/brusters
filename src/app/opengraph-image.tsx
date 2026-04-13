import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Park and Order — Ice Cream";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [pacificoFont, interFont] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ96A4sijpFu_.ttf"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf"
    ).then((res) => res.arrayBuffer()),
  ]);

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
          gap: 8,
          padding: "0 60px",
        }}
      >
        {/* Brand name in Pacifico */}
        <div
          style={{
            fontFamily: "Pacifico",
            fontSize: 130,
            color: "#8B1A1A",
            lineHeight: 1.1,
          }}
        >
          Park and Order
        </div>
        <div
          style={{
            fontFamily: "Pacifico",
            fontSize: 72,
            color: "#231f20",
            letterSpacing: "0.01em",
          }}
        >
          Ice Cream
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 32,
            color: "#6B7280",
            marginTop: 8,
          }}
        >
          Just park, order, and we&apos;ll bring your order to your car!
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
    {
      ...size,
      fonts: [
        {
          name: "Pacifico",
          data: pacificoFont,
          style: "normal",
        },
        {
          name: "Inter",
          data: interFont,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
