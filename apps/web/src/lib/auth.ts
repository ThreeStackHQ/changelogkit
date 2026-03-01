import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { eq, getDb, users } from "@changelogkit/db";
import { encrypt } from "./crypto";
import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      plan: string;
    };
  }
}

const config: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;
        const ok = await bcryptjs.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      const db = getDb();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (account?.provider === "github" && account.access_token) {
        const encryptedToken = await encrypt(account.access_token as string);
        if (existing) {
          await db
            .update(users)
            .set({
              name: user.name ?? existing.name,
              githubTokenEncrypted: encryptedToken,
            })
            .where(eq(users.id, existing.id));
        } else {
          await db.insert(users).values({
            email: user.email,
            name: user.name ?? null,
            githubTokenEncrypted: encryptedToken,
          });
        }
      } else if (account?.provider === "google") {
        if (existing) {
          await db
            .update(users)
            .set({
              name: user.name ?? existing.name,
              googleId: account.providerAccountId,
            })
            .where(eq(users.id, existing.id));
        } else {
          await db.insert(users).values({
            email: user.email,
            name: user.name ?? null,
            googleId: account.providerAccountId,
          });
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const db = getDb();
        const [dbUser] = await db
          .select({ id: users.id, plan: users.plan })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        if (dbUser) {
          token.userId = dbUser.id;
          token.plan = dbUser.plan;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        (session.user as { plan: string }).plan = (token.plan as string) ?? "free";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
