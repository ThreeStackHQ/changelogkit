import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db, emailSubscribers, projects, eq, and } from "@changelogkit/db";
import { resend } from "@/lib/email/resend";
import { confirmationEmailHtml } from "@/lib/email/templates";

const SubscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255),
  name: z.string().max(100).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const projectId = params.id;

    // Fetch project to validate it exists
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse + validate body
    const body: unknown = await req.json();
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email, name } = parsed.data;
    const confirmToken = randomBytes(32).toString("hex");
    const unsubscribeToken = randomBytes(32).toString("hex");

    // Check for duplicate
    const [existing] = await db
      .select({ id: emailSubscribers.id, isConfirmed: emailSubscribers.isConfirmed })
      .from(emailSubscribers)
      .where(
        and(
          eq(emailSubscribers.projectId, projectId),
          eq(emailSubscribers.email, email)
        )
      )
      .limit(1);

    if (existing) {
      if (existing.isConfirmed) {
        return NextResponse.json(
          { error: "This email is already subscribed" },
          { status: 409 }
        );
      }
      // Re-send confirmation if not yet confirmed
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const confirmUrl = `${appUrl}/api/subscribe/confirm?token=${existing.id}&project=${projectId}`;
      // Update tokens so previous links are invalidated
      await db
        .update(emailSubscribers)
        .set({ confirmToken, unsubscribeToken })
        .where(eq(emailSubscribers.id, existing.id));

      const newConfirmUrl = `${appUrl}/api/subscribe/confirm?token=${confirmToken}`;
      await resend.emails.send({
        from: "ChangelogKit <no-reply@changelogkit.threestack.io>",
        to: email,
        subject: `Confirm your subscription to ${project.name} changelog`,
        html: confirmationEmailHtml({ projectName: project.name, confirmUrl: newConfirmUrl }),
      });

      return NextResponse.json({
        success: true,
        message: "Check your email to confirm your subscription",
      });
    }

    // Insert new subscriber
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const confirmUrl = `${appUrl}/api/subscribe/confirm?token=${confirmToken}`;

    await db.insert(emailSubscribers).values({
      projectId,
      email,
      name: name ?? null,
      isConfirmed: false,
      confirmToken,
      unsubscribeToken,
    });

    // Send confirmation email
    await resend.emails.send({
      from: "ChangelogKit <no-reply@changelogkit.threestack.io>",
      to: email,
      subject: `Confirm your subscription to ${project.name} changelog`,
      html: confirmationEmailHtml({ projectName: project.name, confirmUrl }),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Check your email to confirm your subscription",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[subscribe] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
