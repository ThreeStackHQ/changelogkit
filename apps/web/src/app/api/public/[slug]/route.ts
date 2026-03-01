import { and, changelogEntries, eq, getDb, projects } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const db = getDb();

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      description: projects.description,
      logoUrl: projects.logoUrl,
      primaryColor: projects.primaryColor,
    })
    .from(projects)
    .where(eq(projects.slug, params.slug))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entries = await db
    .select({
      id: changelogEntries.id,
      title: changelogEntries.title,
      bodyMarkdown: changelogEntries.bodyMarkdown,
      bodyHtml: changelogEntries.bodyHtml,
      category: changelogEntries.category,
      publishedAt: changelogEntries.publishedAt,
      createdAt: changelogEntries.createdAt,
    })
    .from(changelogEntries)
    .where(
      and(
        eq(changelogEntries.projectId, project.id),
        eq(changelogEntries.status, "published")
      )
    )
    .orderBy(changelogEntries.publishedAt);

  return NextResponse.json({ project, entries });
}
