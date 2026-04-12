import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ valid: false });
    }

    const valid = pin === process.env.STAFF_PIN;

    return NextResponse.json({ valid });
  } catch (error) {
    console.error("Error validating staff PIN:", error);
    return NextResponse.json({ valid: false });
  }
}
