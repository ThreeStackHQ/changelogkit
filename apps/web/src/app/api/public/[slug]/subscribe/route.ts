import { and, eq, getDb, projects, subscribers } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendConfirmationEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().email(),
});

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const db = getDb();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, params.slug))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Check existing subscriber
  const [existing] = await db
    .select()
    .from(subscribers)
    .where(
      and(eq(subscribers.projectId, project.id), eq(subscribers.email, email))
    )
    .limit(1);

  if (existing) {
    if (existing.confirmed) {
      return NextResponse.json({ message: "Already subscribed" });
    }
    // Resend confirmation
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://changelogkit.threestack.io";
    const confirmUrl = `${appUrl}/api/public/confirm?token=${existing.confirmToken}`;
    try {
      await sendConfirmationEmail({
        to: email,
        projectName: project.name,
        confirmUrl,
      });
    } catch (err) {
      console.error("[subscribe] resend error:", err);
    }
    return NextResponse.json({ message: "Confirmation email resent" });
  }

  const confirmToken = randomToken();
  const unsubscribeToken = randomToken();

  await db.insert(subscribers).values({
    projectId: project.id,
    email,
    confirmed: false,
    confirmToken,
    unsubscribeToken,
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://changelogkit.threestack.io";
  const confirmUrl = `${appUrl}/api/public/confirm?token=${confirmToken}`;

  try {
    await sendConfirmationEmail({
      to: email,
      projectName: project.name,
      confirmUrl,
    });
  } catch (err) {
    console.error("[subscribe] resend error:", err);
  }

  return NextResponse.json(
    { message: "Subscribed! Check your email to confirm." },
    { status: 201 }
  );
}
