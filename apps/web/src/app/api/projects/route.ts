import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, getDb, projects } from "@changelogkit/db";
import { auth } from "@/lib/auth";
import { canCreateProject } from "@/lib/tier";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  customDomain: z.string().optional(),
  githubRepo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/)
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(projects.createdAt);

  return NextResponse.json({ projects: userProjects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const ok = await canCreateProject(userId);
  if (!ok) {
    return NextResponse.json(
      { error: "Free plan allows only 1 project. Upgrade to create more." },
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

  const db = getDb();

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, parsed.data.slug))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const [project] = await db
    .insert(projects)
    .values({
      userId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      logoUrl: parsed.data.logoUrl ?? null,
      primaryColor: parsed.data.primaryColor ?? "#6366f1",
      customDomain: parsed.data.customDomain ?? null,
      githubRepo: parsed.data.githubRepo ?? null,
    })
    .returning();

  return NextResponse.json({ project }, { status: 201 });
}
