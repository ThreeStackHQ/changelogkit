import { eq, getDb, subscribers } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const db = getDb();
  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.confirmToken, token))
    .limit(1);

  if (!subscriber) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (subscriber.confirmed) {
    return NextResponse.redirect(
      new URL(
        `/p/confirmed?already=true`,
        process.env.NEXT_PUBLIC_APP_URL ?? "https://changelogkit.threestack.io"
      )
    );
  }

  await db
    .update(subscribers)
    .set({ confirmed: true })
    .where(eq(subscribers.id, subscriber.id));

  return NextResponse.redirect(
    new URL(
      `/p/confirmed`,
      process.env.NEXT_PUBLIC_APP_URL ?? "https://changelogkit.threestack.io"
    )
  );
}
