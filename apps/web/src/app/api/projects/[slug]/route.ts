import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, count, getDb, projects, changelogEntries, subscribers } from "@changelogkit/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  customDomain: z.string().optional().nullable(),
  githubRepo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/)
    .optional()
    .nullable(),
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

  const db = getDb();
  const [entriesCount] = await db
    .select({ value: count() })
    .from(changelogEntries)
    .where(eq(changelogEntries.projectId, project.id));

  const [subsCount] = await db
    .select({ value: count() })
    .from(subscribers)
    .where(eq(subscribers.projectId, project.id));

  return NextResponse.json({
    project,
    stats: {
      totalEntries: entriesCount.value,
      totalSubscribers: subsCount.value,
    },
  });
}

export async function PATCH(
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

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.logoUrl !== undefined && { logoUrl: parsed.data.logoUrl }),
      ...(parsed.data.primaryColor !== undefined && {
        primaryColor: parsed.data.primaryColor,
      }),
      ...(parsed.data.customDomain !== undefined && {
        customDomain: parsed.data.customDomain,
      }),
      ...(parsed.data.githubRepo !== undefined && {
        githubRepo: parsed.data.githubRepo,
      }),
    })
    .where(eq(projects.id, project.id))
    .returning();

  return NextResponse.json({ project: updated });
}

export async function DELETE(
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

  const db = getDb();
  await db.delete(projects).where(eq(projects.id, project.id));

  return NextResponse.json({ success: true });
}
