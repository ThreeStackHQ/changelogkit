import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { db, users, eq } from "@changelogkit/db";

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Extracts and verifies the session from a Next.js request.
 * Supports:
 *  - next-auth v5 session token cookie (next-auth.session-token or __Secure-next-auth.session-token)
 *  - Authorization: Bearer <token> header (for API clients)
 */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const token =
    req.cookies.get("__Secure-next-auth.session-token")?.value ??
    req.cookies.get("next-auth.session-token")?.value ??
    req.headers.get("Authorization")?.replace(/^Bearer\s+/, "");

  if (!token) return null;

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });

    const userId =
      (payload["sub"] as string | undefined) ??
      (payload["id"] as string | undefined);
    const email =
      (payload["email"] as string | undefined) ??
      (payload["user"] as { email?: string } | undefined)?.email;

    if (!userId || !email) return null;
    return { id: userId, email };
  } catch {
    // Token invalid or expired
    return null;
  }
}

/**
 * Verify that a user owns a project by ID.
 */
export async function assertProjectOwner(
  req: NextRequest,
  projectId: string
): Promise<{ user: SessionUser } | { error: Response }> {
  const user = await getSessionUser(req);
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // Verify user actually exists in DB
  const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!dbUser) {
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { user };
}
