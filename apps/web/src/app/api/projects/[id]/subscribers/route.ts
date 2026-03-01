import { NextRequest, NextResponse } from "next/server";
import { db, emailSubscribers, projects, eq } from "@changelogkit/db";
import { assertProjectOwner } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const projectId = params.id;

    // Auth check
    const authResult = await assertProjectOwner(req, projectId);
    if ("error" in authResult) return authResult.error as NextResponse;
    const { user } = authResult;

    // Verify project belongs to this user
    const [project] = await db
      .select({ id: projects.id, userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all subscribers (confirmed + unconfirmed)
    const subscribers = await db
      .select({
        id: emailSubscribers.id,
        email: emailSubscribers.email,
        name: emailSubscribers.name,
        isConfirmed: emailSubscribers.isConfirmed,
        confirmedAt: emailSubscribers.confirmedAt,
        createdAt: emailSubscribers.createdAt,
      })
      .from(emailSubscribers)
      .where(eq(emailSubscribers.projectId, projectId))
      .orderBy(emailSubscribers.createdAt);

    const confirmed = subscribers.filter((s) => s.isConfirmed);
    const pending = subscribers.filter((s) => !s.isConfirmed);

    return NextResponse.json({
      success: true,
      data: {
        total: subscribers.length,
        confirmed: confirmed.length,
        pending: pending.length,
        subscribers,
      },
    });
  } catch (err) {
    console.error("[subscribers] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
