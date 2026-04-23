import { NextRequest, NextResponse } from "next/server";

export function requireStaff(request: NextRequest): NextResponse | null {
  const pin = request.headers.get("x-staff-pin");
  if (!pin || pin !== process.env.STAFF_PIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
