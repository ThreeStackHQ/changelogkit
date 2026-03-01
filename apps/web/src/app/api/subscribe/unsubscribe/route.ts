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
      .where(eq(emailSubscribers.unsubscribeToken, token))
      .limit(1);

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe token" },
        { status: 404 }
      );
    }

    await db
      .delete(emailSubscribers)
      .where(eq(emailSubscribers.id, subscriber.id));

    // Return a simple success HTML page for browser access
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Unsubscribed</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; max-width: 400px; margin: 0 16px; }
    h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 12px; }
    p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; padding: 10px 24px; border-radius: 8px; background: #10b77f; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
    .emoji { font-size: 40px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">👋</div>
    <h1>You've been unsubscribed</h1>
    <p>You've been removed from the changelog mailing list. You won't receive any more email updates.</p>
    <a href="/">Back to home</a>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[unsubscribe] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
