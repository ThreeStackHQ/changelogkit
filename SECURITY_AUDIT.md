# Security Audit — ChangelogKit
**Sprint 4.2 | Audited by Sage (WC15) | 2026-03-01**

---

## Executive Summary

| Item | Result |
|------|--------|
| **Overall Status** | ⚠️ CONDITIONAL PASS — 3 High, 2 Medium, 2 Low findings |
| **Critical Issues** | 0 |
| **High Issues** | 3 |
| **Medium Issues** | 2 |
| **Low Issues** | 2 |
| **Passed Checks** | 9 |

The core authentication and authorization logic is solid, with properly protected API routes, cryptographically secure tokens, Drizzle ORM (no raw SQL), and a working double opt-in flow. However, **three high-severity issues require remediation before launch**: widget XSS via `innerHTML`, missing Stripe webhook route (signature verification unverifiable), and a complete absence of rate limiting on the public subscribe endpoint. No critical issues were found.

---

## Findings

| # | Severity | Area | Description | Recommendation |
|---|----------|------|-------------|---------------|
| 1 | 🔴 HIGH | Widget/Embed | **Widget XSS via `innerHTML`** — `renderPanel()` in `apps/widget/src/index.ts` injects `e.title`, `e.category`, and `e.content` directly into `panel.innerHTML` using template literals, without HTML-encoding. A changelog entry containing `<script>alert(1)</script>` or `<img onerror=...>` in the title or content field would execute in the browser of every site embedding the widget. | Use a sanitization library (`DOMPurify` or a simple `textContent` setter). Replace innerHTML injection with `document.createElement` + `textContent` assignments, or apply `escapeHtml()` before interpolation. |
| 2 | 🔴 HIGH | Stripe Billing | **No Stripe Webhook Route** — `STRIPE_WEBHOOK_SECRET` is present in `.env.example`, indicating Stripe billing was wired up (Sprint 3.3), but no `/api/stripe/webhook` route exists in the codebase. The webhook handler — including `stripe.webhooks.constructEvent()` signature verification — cannot be confirmed as implemented. Unverified webhooks allow attackers to fake billing events. | Implement `POST /api/stripe/webhook` using `stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)` before processing any event. Read the raw body with `await req.arrayBuffer()` to preserve signature integrity. |
| 3 | 🔴 HIGH | Rate Limiting | **No Rate Limiting on Subscribe Endpoint** — `POST /api/projects/[id]/subscribe` sends a confirmation email for every request and has no rate limiting. An attacker can enumerate project IDs and send thousands of confirmation emails through ChangelogKit's Resend account, exhausting quota and spamming victims. | Add IP-based rate limiting (e.g., `@upstash/ratelimit` + Redis, or `next-rate-limit`). Recommend: 5 requests/IP/hour per project. Also consider CAPTCHA on the public subscribe form. |
| 4 | 🟡 MEDIUM | Email Content | **Markdown-to-HTML Not Sanitized Before Email Injection** — In the notify route, `marked.parse(entry.content)` converts markdown to HTML and injects the result directly into email templates (`${contentHtml}`) without sanitization. `marked` does not sanitize HTML by default. A changelog entry containing raw `<script>` or `<a href="javascript:...">` will be present in outbound emails. While most email clients block JavaScript, malicious links and HTML injection in email bodies are still a risk. | Pass `contentHtml` through a server-safe sanitizer before injecting into the template. Use `sanitize-html` with a strict allowlist (block `script`, `iframe`, `form`, `on*` attributes). |
| 5 | 🟡 MEDIUM | Dashboard Auth | **No Next.js Middleware — Dashboard Unprotected at Route Level** — No `middleware.ts` file exists in the Next.js app. The dashboard group `(dashboard)/` uses a `'use client'` layout that does not enforce authentication. Unauthenticated users can access dashboard page URLs (e.g., `/projects`, `/settings`) and see the full UI shell. While API routes correctly return 401, the page HTML and layout render without auth checks. | Add `middleware.ts` at the `apps/web/src` root to redirect unauthenticated users to `/login` for all routes matching `/(dashboard)/.*`. Verify session using the `AUTH_SECRET` cookie before serving any dashboard page. |
| 6 | 🔵 LOW | Widget API | **Missing `/api/widget/entries` Route** — The widget (`apps/widget/src/index.ts`) fetches from `https://changelogkit.threestack.io/api/widget/entries` with `X-API-Key` authentication, but no such route exists in the codebase. Either the route is implemented elsewhere (not reviewed), or the widget is non-functional. If implemented later without review, CORS and authentication could be misconfigured. | Implement the widget API route with: proper `X-API-Key` header validation, CORS header scoped to allow-all origins (public widget use case: `Access-Control-Allow-Origin: *`), and rate limiting per API key. Return only published entries for the corresponding project. |
| 7 | 🔵 LOW | Email / Re-send | **Dead Code: `confirmUrl` Built with Wrong Token** — In `subscribe/route.ts`, during re-send confirmation flow, `confirmUrl` is constructed using `existing.id` (a UUID record ID) as the token: `?token=${existing.id}&project=${projectId}`. This URL is never sent (it's overwritten by `newConfirmUrl` 3 lines later), but the dead code is misleading and could be a bug if refactored carelessly. | Remove the dead `confirmUrl` line (first assignment in the re-send block) to prevent accidental reintroduction. Only `newConfirmUrl` built with the fresh `confirmToken` should exist. |

---

## Passed Checks

| ✅ Check | Details |
|----------|---------|
| **Authentication — JWT Verification** | `getSessionUser()` uses `jose.jwtVerify()` with `HS256` and `AUTH_SECRET`. Covers both cookie and `Authorization: Bearer` header patterns. |
| **Authorization — Project Ownership** | `assertProjectOwner()` validates JWT then queries DB to confirm the user record exists. Notify route separately verifies `project.userId === user.id`. No IDOR risk on audited routes. |
| **Input Validation — Zod on Subscribe** | `POST /api/projects/[id]/subscribe` validates email format (max 255), name (max 100) with Zod before any DB operation. |
| **SQL Injection Prevention — Drizzle ORM** | All DB queries use Drizzle's typed query builder. No raw SQL strings or `db.execute(sql)` patterns found. Parameters are fully escaped by the ORM. |
| **Email Tokens — Cryptographically Random** | Both `confirmToken` and `unsubscribeToken` are generated with `randomBytes(32).toString("hex")` (256-bit entropy). Not sequential IDs. |
| **Double Opt-In Flow** | Subscription only activates after email confirmation. Blast endpoint only emails `isConfirmed` subscribers. Re-subscription correctly invalidates prior tokens. |
| **Secrets — Server-Side Only** | `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `AUTH_SECRET` are server-side env vars only. Only `NEXT_PUBLIC_APP_URL` is exposed client-side (intentional, non-sensitive). |
| **Email Batch Rate Limiting** | Outbound blast uses `BATCH_SIZE = 50` with 1-second delay between batches — responsible send rate to avoid Resend throttling. |
| **AI Keys — Not Exposed** | No OpenAI or Anthropic API keys observed in `.env.example` or any source file. If the GitHub Commit Auto-Draft (Sprint 3.1) uses AI, it is not present in the web app routes reviewed (server-side safe if kept there). |

---

## v2 Recommendations

These are not current vulnerabilities but should be addressed before or during v2:

1. **Content Security Policy (CSP)** — Add a `Content-Security-Policy` header in `next.config.js` to restrict script sources. This provides defense-in-depth against any future XSS vectors in the dashboard.

2. **CORS Policy on API Routes** — Define explicit CORS headers on all API routes. Authenticated routes should restrict `Access-Control-Allow-Origin` to the app's own origin. The future widget endpoint should explicitly allow `*` (public) but restrict to GET-only.

3. **AI Route Audit (Sprint 3.1)** — The GitHub Commit Auto-Draft feature was not present in the API routes reviewed. When implemented/exposed via API, ensure: the AI API key is server-side only, AI endpoints are authenticated (not public), and rate limiting prevents AI quota exhaustion.

4. **Password Auth Routes** — The `users` table has a `passwordHash` column but no login/register/reset routes were found in the codebase. Ensure any credential handling uses `bcrypt` (cost factor ≥ 12) or `argon2id`, and that password reset tokens follow the same `randomBytes(32)` pattern used for email tokens.

5. **Webhook Idempotency** — Once the Stripe webhook route is implemented, store processed event IDs to prevent duplicate processing on Stripe retries.

6. **Audit Logging** — Add structured logging for auth failures, subscription events, and billing events to aid incident response.

7. **`marked` — Enable `sanitize` Option or Replace** — For consistency, configure `marked` with a sanitizer option or replace with `markdown-it` + `markdown-it-sanitizer` to prevent any future HTML injection from markdown content throughout the app.

---

*Audit conducted by Sage (WC15) via static code review. Scope: `apps/web`, `apps/widget`, `packages/db`. No dynamic testing or penetration testing was performed.*
