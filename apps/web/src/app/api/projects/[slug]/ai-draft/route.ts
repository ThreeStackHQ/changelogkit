import { and, changelogEntries, eq, getDb, projects, users } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";

import { marked } from "marked";
import OpenAI from "openai";

import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { canUseAIDraft } from "@/lib/tier";

export const dynamic = "force-dynamic";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return _openai;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check plan
  const allowed = await canUseAIDraft(userId);
  if (!allowed) {
    return NextResponse.json(
      { error: "AI drafts require a Pro plan" },
      { status: 403 }
    );
  }

  const db = getDb();

  // Get project
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, params.slug), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.githubRepo) {
    return NextResponse.json(
      { error: "No GitHub repo configured for this project" },
      { status: 422 }
    );
  }

  // Get user's encrypted GitHub token
  const [user] = await db
    .select({ githubTokenEncrypted: users.githubTokenEncrypted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.githubTokenEncrypted) {
    return NextResponse.json(
      { error: "No GitHub account connected. Sign in with GitHub to use AI drafts." },
      { status: 422 }
    );
  }

  let githubToken: string;
  try {
    githubToken = await decrypt(user.githubTokenEncrypted);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt GitHub token" },
      { status: 500 }
    );
  }

  // Fetch commits from last 7 days
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const ghRes = await fetch(
    `https://api.github.com/repos/${project.githubRepo}/commits?since=${since.toISOString()}&per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    console.error("[ai-draft] GitHub API error:", errText);
    return NextResponse.json(
      { error: `GitHub API error: ${ghRes.status}` },
      { status: 502 }
    );
  }

  const commits = (await ghRes.json()) as GitHubCommit[];

  if (!commits.length) {
    return NextResponse.json(
      { error: "No commits found in the last 7 days" },
      { status: 422 }
    );
  }

  const commitMessages = commits
    .map((c) => `- ${c.commit.message.split("\n")[0]}`)
    .join("\n");

  // Call OpenAI
  let aiTitle: string;
  let aiBody: string;
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a product changelog writer. Generate user-friendly changelog entries from commit messages. Return JSON with exactly two fields: title (string) and body (string in markdown format). Focus on user-facing changes, not implementation details.",
        },
        {
          role: "user",
          content: `Generate a changelog entry from these recent commits:\n\n${commitMessages}\n\nReturn JSON: {"title": string, "body": string (markdown)}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(content) as { title?: unknown; body?: unknown };
    if (typeof parsed.title !== "string" || typeof parsed.body !== "string") {
      throw new Error("Invalid JSON structure from OpenAI");
    }
    aiTitle = parsed.title;
    aiBody = parsed.body;
  } catch (err) {
    console.error("[ai-draft] OpenAI error:", err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }

  const bodyHtml = await marked(aiBody);

  // Save draft entry
  const [entry] = await db
    .insert(changelogEntries)
    .values({
      projectId: project.id,
      title: aiTitle,
      bodyMarkdown: aiBody,
      bodyHtml,
      category: "feature",
      status: "draft",
    })
    .returning();

  return NextResponse.json({
    entry_id: entry.id,
    title: entry.title,
    body_markdown: entry.bodyMarkdown,
  });
}
