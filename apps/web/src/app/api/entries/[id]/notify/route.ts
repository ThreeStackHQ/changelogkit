import { NextRequest, NextResponse } from "next/server";
import { marked } from "marked";
import {
  db,
  entries,
  projects,
  emailSubscribers,
  emailSends,
  eq,
} from "@changelogkit/db";
import { resend } from "@/lib/email/resend";
import { entryBlastEmailHtml } from "@/lib/email/templates";
import { getSessionUser } from "@/lib/auth";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const entryId = params.id;

    // Auth check
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch entry with its project
    const [entry] = await db
      .select()
      .from(entries)
      .where(eq(entries.id, entryId))
      .limit(1);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Fetch project and verify ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, entry.projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all confirmed subscribers for this project
    const subscribers = await db
      .select({
        id: emailSubscribers.id,
        email: emailSubscribers.email,
        name: emailSubscribers.name,
        unsubscribeToken: emailSubscribers.unsubscribeToken,
      })
      .from(emailSubscribers)
      .where(eq(emailSubscribers.projectId, project.id));

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        message: "No confirmed subscribers to notify",
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const changelogUrl = `${appUrl}/changelog/${project.id}`;

    // Convert markdown content to HTML
    const contentHtml = await Promise.resolve(
      marked.parse(entry.content, { async: false }) as string
    );

    let sent = 0;
    let failed = 0;

    // Process in batches of 50 with 1-second delay between batches
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (subscriber) => {
          const unsubscribeUrl = `${appUrl}/api/subscribe/unsubscribe?token=${subscriber.unsubscribeToken}`;

          const emailHtml = entryBlastEmailHtml({
            projectName: project.name,
            projectColor: project.widgetColor,
            entryTitle: entry.title,
            category: entry.category,
            contentHtml,
            changelogUrl,
            unsubscribeUrl,
          });

          const result = await resend.emails.send({
            from: "ChangelogKit <no-reply@changelogkit.threestack.io>",
            to: subscriber.email,
            subject: `${project.name} — ${entry.title}`,
            html: emailHtml,
          });

          // Log send in emailSends table
          const status = result.error ? "failed" : "sent";
          await db.insert(emailSends).values({
            entryId: entry.id,
            projectId: project.id,
            subscriberEmail: subscriber.email,
            status,
          });

          if (result.error) {
            throw new Error(result.error.message ?? "Failed to send email");
          }

          return subscriber.email;
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          sent++;
        } else {
          failed++;
          console.error("[notify] Email send error:", result.reason);
        }
      }

      // Delay between batches (except after the last batch)
      if (i + BATCH_SIZE < subscribers.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscribers.length,
    });
  } catch (err) {
    console.error("[notify] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
