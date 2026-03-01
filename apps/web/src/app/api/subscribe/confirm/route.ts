import { NextRequest, NextResponse } from "next/server";
import { db, emailSubscribers, eq } from "@changelogkit/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const [subscriber] = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.confirmToken, token))
      .limit(1);

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid or expired confirmation token" },
        { status: 404 }
      );
    }

    if (subscriber.isConfirmed) {
      // Already confirmed — redirect to changelog
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      return NextResponse.redirect(
        `${appUrl}/changelog/${subscriber.projectId}?subscribed=already`
      );
    }

    // Mark as confirmed
    await db
      .update(emailSubscribers)
      .set({ isConfirmed: true, confirmedAt: new Date() })
      .where(eq(emailSubscribers.id, subscriber.id));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/changelog/${subscriber.projectId}?subscribed=true`
    );
  } catch (err) {
    console.error("[confirm] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
