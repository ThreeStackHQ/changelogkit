import { and, changelogEntries, desc, eq, getDb, projects } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { marked } from "marked";

import { auth } from "@/lib/auth";
import { canCreateEntry } from "@/lib/tier";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  bodyMarkdown: z.string().default(""),
  category: z
    .enum(["feature", "fix", "improvement", "breaking", "other"])
    .default("feature"),
});

const listSchema = z.object({
  status: z.enum(["draft", "published"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(session.user.id, params.slug);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = listSchema.safeParse(sp);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { status, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const db = getDb();
  const conditions = [eq(changelogEntries.projectId, project.id)];
  if (status) conditions.push(eq(changelogEntries.status, status));

  const entries = await db
    .select()
    .from(changelogEntries)
    .where(and(...conditions))
    .orderBy(desc(changelogEntries.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ entries, page, limit });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(session.user.id, params.slug);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await canCreateEntry(session.user.id, project.id);
  if (!ok) {
    return NextResponse.json(
      {
        error:
          "Free plan allows 3 entries/month. Upgrade to Starter for unlimited.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const bodyHtml = await marked(parsed.data.bodyMarkdown);

  const db = getDb();
  const [entry] = await db
    .insert(changelogEntries)
    .values({
      projectId: project.id,
      title: parsed.data.title,
      bodyMarkdown: parsed.data.bodyMarkdown,
      bodyHtml,
      category: parsed.data.category,
      status: "draft",
    })
    .returning();

  return NextResponse.json({ entry }, { status: 201 });
}
