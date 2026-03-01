import { and, changelogEntries, eq, getDb, projects } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { marked } from "marked";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  bodyMarkdown: z.string().optional(),
  category: z
    .enum(["feature", "fix", "improvement", "breaking", "other"])
    .optional(),
});

async function getOwnedProject(userId: string, slug: string) {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

async function getEntry(projectId: string, entryId: string) {
  const db = getDb();
  const [entry] = await db
    .select()
    .from(changelogEntries)
    .where(
      and(
        eq(changelogEntries.id, entryId),
        eq(changelogEntries.projectId, projectId)
      )
    )
    .limit(1);
  return entry ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(session.user.id, params.slug);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await getEntry(project.id, params.id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ entry });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(session.user.id, params.slug);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await getEntry(project.id, params.id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.bodyMarkdown !== undefined) {
    updates.bodyMarkdown = parsed.data.bodyMarkdown;
    updates.bodyHtml = await marked(parsed.data.bodyMarkdown);
  }

  const db = getDb();
  const [updated] = await db
    .update(changelogEntries)
    .set(updates)
    .where(eq(changelogEntries.id, entry.id))
    .returning();

  return NextResponse.json({ entry: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(session.user.id, params.slug);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await getEntry(project.id, params.id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  await db.delete(changelogEntries).where(eq(changelogEntries.id, entry.id));

  return NextResponse.json({ success: true });
}
