import { eq, and, gte, count, getDb, users, projects, changelogEntries } from "@changelogkit/db";
import { PLANS, type PlanKey } from "./stripe";

export async function getUserTier(userId: string): Promise<PlanKey> {
  const db = getDb();
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return "free";
  return (user.plan as PlanKey) ?? "free";
}

export async function canCreateProject(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  const plan = PLANS[tier];
  if (plan.maxProjects === Infinity) return true;

  const db = getDb();
  const [{ value }] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  return value < plan.maxProjects;
}

export async function canCreateEntry(
  userId: string,
  projectId: string
): Promise<boolean> {
  const tier = await getUserTier(userId);
  const plan = PLANS[tier];
  if (plan.maxEntriesPerMonth === Infinity) return true;

  const db = getDb();
  // Count entries created this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ value }] = await db
    .select({ value: count() })
    .from(changelogEntries)
    .where(
      and(
        eq(changelogEntries.projectId, projectId),
        gte(changelogEntries.createdAt, startOfMonth)
      )
    );

  return value < plan.maxEntriesPerMonth;
}

export async function canUseWidget(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return PLANS[tier].widget;
}

export async function canUseAIDraft(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return PLANS[tier].aiDrafts;
}

export async function canUseCustomDomain(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return PLANS[tier].customDomain;
}
