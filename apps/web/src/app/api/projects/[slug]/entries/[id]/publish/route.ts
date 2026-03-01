import { and, changelogEntries, eq, getDb, projects, subscribers } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sendChangelogEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.slug, params.slug), eq(projects.userId, session.user.id))
    )
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [entry] = await db
    .select()
    .from(changelogEntries)
    .where(
      and(
        eq(changelogEntries.id, params.id),
        eq(changelogEntries.projectId, project.id)
      )
    )
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (entry.status === "published") {
    return NextResponse.json({ error: "Already published" }, { status: 409 });
  }

  const publishedAt = new Date();
  const [published] = await db
    .update(changelogEntries)
    .set({ status: "published", publishedAt })
    .where(eq(changelogEntries.id, entry.id))
    .returning();

  // Send email to confirmed subscribers (fire-and-forget)
  const subs = await db
    .select()
    .from(subscribers)
    .where(and(eq(subscribers.projectId, project.id), eq(subscribers.confirmed, true)));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://changelogkit.threestack.io";
  const changelogUrl = `${appUrl}/p/${project.slug}`;

  for (const sub of subs) {
    const unsubscribeUrl = `${appUrl}/api/public/${project.slug}/unsubscribe?token=${sub.unsubscribeToken}`;
    try {
      await sendChangelogEmail({
        to: sub.email,
        projectName: project.name,
        entryTitle: entry.title,
        bodyHtml: entry.bodyHtml,
        changelogUrl,
        unsubscribeUrl,
      });
    } catch (err) {
      console.error("[publish email]", err);
    }
  }

  return NextResponse.json({ entry: published });
}
