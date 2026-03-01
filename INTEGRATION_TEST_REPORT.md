# ChangelogKit — Integration Test Report
**Sprint 4.3 | Tested by Sage (WC16) | 2026-03-01**

---

## Executive Summary

| Item | Result |
|------|--------|
| **Overall Status** | 🔴 NOT DEPLOYMENT READY — 6 Critical/High blockers |
| **E2E Flows Tested** | 6 |
| **PASS** | 1 |
| **PARTIAL** | 2 |
| **FAIL** | 3 |
| **New Critical Bugs Found** | 2 |
| **WC15 Issues Remaining Unresolved** | 5/5 (0 fixed) |

The email subscriber plumbing (subscribe, confirm, unsubscribe, blast) is architecturally solid and partially functional. However, the entire product lifecycle is broken: **there are no API routes to create projects, create entries, or publish entries**. The dashboard UI is fully disconnected from any backend. The widget API endpoint does not exist. Billing is unimplemented. GitHub AI draft does not exist. Custom domain is unimplemented. None of the WC15 security findings were addressed.

---

## Scope

Integration testing was performed via static code analysis of:
- `apps/web/src/app/api/` — all 5 API route files
- `apps/web/src/app/(dashboard)/` — dashboard UI pages
- `apps/web/src/app/changelog/[slug]/` — public changelog page
- `apps/widget/src/index.ts` — embed widget
- `packages/db/src/schema.ts` — database schema
- `apps/web/src/lib/` — auth, email templates, utilities
- `SECURITY_AUDIT.md` from WC15

---

## E2E Flow Test Results

### TEST-01: Create Project → Write Entry → Publish → Email Blast
**Result: 🔴 FAIL**

**Expected flow:**
1. Authenticated user hits `POST /api/projects` to create a project → gets `projectId`
2. User hits `POST /api/projects/{id}/entries` to create a draft entry
3. User hits `PATCH /api/projects/{id}/entries/{entryId}` with `isPublished: true`
4. User hits `POST /api/entries/{id}/notify` to trigger email blast

**Findings:**

| Step | Status | Root Cause |
|------|--------|------------|
| Create project | ❌ FAIL | No `POST /api/projects` route exists |
| Write entry | ❌ FAIL | No `POST /api/projects/{id}/entries` route exists |
| Publish entry | ❌ FAIL | No `PATCH /api/entries/{id}` route exists |
| Email blast | ⚠️ PARTIAL | Route exists (`POST /api/entries/{id}/notify`) but has a critical bug (see BUG-001) |

**Root Cause:** Only 5 API routes exist in the entire application. There is no CRUD layer for projects or entries. The dashboard "New Entry" page (`/projects/[id]/entries/new`) has "Save Draft" and "Publish Now" buttons that call only local state setters (`setSaved(true)`, `setStatus('published')`) — no API calls are made. The user workflow is entirely non-functional.

**Dead code example:**
```typescript
// apps/web/src/app/(dashboard)/projects/[id]/entries/new/page.tsx
const handleSaveDraft = () => {
  setSaved(true);                    // local state only — no API call
  setTimeout(() => setSaved(false), 2000);
}
// "Publish Now" button also has no onClick handler that calls an API
```

---

### TEST-02: GitHub AI Draft Flow
**Result: 🔴 FAIL**

**Expected flow:**
1. User authenticates and selects a project
2. User inputs a GitHub commit URL or repo
3. System calls GitHub API to fetch commits/diff
4. System calls OpenAI/Anthropic to generate a draft changelog entry
5. Draft is pre-populated in the entry editor

**Findings:**
- No `/api/github/draft` or any AI-related route exists
- No OpenAI/Anthropic API key in `.env.example` (noted as absent in WC15 audit)
- The entry editor UI has no GitHub integration UI or "AI Draft" button
- No GitHub webhook or OAuth flow exists

**Root Cause:** Feature was not implemented in any Sprint wave. Not present in Wave 8B or any prior wave. The WC15 audit noted "No OpenAI or Anthropic API keys observed" — this remains true.

---

### TEST-03: Widget Embed on Static Page
**Result: 🔴 FAIL**

**Expected flow:**
1. User embeds `<script src="https://cdn.changelogkit.threestack.io/widget.js" data-api-key="ck_live_...">` 
2. Widget calls `GET /api/widget/entries` with `X-API-Key` header
3. Widget renders changelog popup bell with recent published entries

**Findings:**

| Component | Status | Root Cause |
|-----------|--------|------------|
| Widget JS bundle | ⚠️ EXISTS (not built) | Source at `apps/widget/src/index.ts`, but no build artifact verified |
| `GET /api/widget/entries` route | ❌ MISSING | Route does not exist in `apps/web/src/app/api/` |
| Widget HTML injection (XSS) | ❌ UNRESOLVED | BUG-003 — `innerHTML` without sanitization (WC15 HIGH, still present) |
| CORS headers | ❌ MISSING | No `Access-Control-Allow-Origin: *` on widget API |

**Root Cause:** The widget source code calls `fetch(`${API}/api/widget/entries`)` but the corresponding Next.js route handler was never implemented. This was flagged as LOW-006 in WC15 but remains unaddressed. The widget is entirely non-functional.

---

### TEST-04: Subscriber Confirm + Unsubscribe
**Result: ✅ PASS (with caveats)**

**Flow tested:**
1. `POST /api/projects/{id}/subscribe` — insert subscriber, send confirmation email
2. `GET /api/subscribe/confirm?token={confirmToken}` — mark as confirmed, redirect
3. `GET /api/subscribe/unsubscribe?token={unsubscribeToken}` — delete record, render HTML

**Findings:**

| Step | Status | Notes |
|------|--------|-------|
| Subscribe (new email) | ✅ PASS | Correct Zod validation, `randomBytes(32)` tokens, inserts with `isConfirmed: false` |
| Subscribe (existing, unconfirmed) | ✅ PASS | Rotates tokens, re-sends confirmation |
| Subscribe (existing, confirmed) | ✅ PASS | Returns 409 Conflict |
| Confirm token lookup | ✅ PASS | Matches on `confirmToken`, sets `isConfirmed: true`, `confirmedAt: new Date()` |
| Confirm already-confirmed | ✅ PASS | Redirects with `?subscribed=already` |
| Unsubscribe | ✅ PASS | Deletes record, returns success HTML page |
| Dead code bug (WC15 LOW-007) | ⚠️ PRESENT | `confirmUrl` built with `existing.id` still exists (overwritten by `newConfirmUrl`, harmless but messy) |

**Caveat:** No rate limiting on subscribe endpoint (WC15 HIGH-003 unresolved — see BUG-005).

---

### TEST-05: Billing Upgrade Enforcement (Plan Limits)
**Result: 🔴 FAIL**

**Expected flow:**
1. Free plan user hits project/entry creation limits
2. System checks subscription tier from `subscriptions` table
3. User is blocked and redirected to upgrade
4. User upgrades via Stripe checkout
5. Webhook updates `subscriptions` table with new tier

**Findings:**

| Component | Status | Notes |
|-----------|--------|-------|
| `subscriptions` table schema | ✅ EXISTS | Schema correct: `tier`, `status`, `stripeCustomerId`, etc. |
| Plan limit enforcement | ❌ MISSING | No API routes exist to check plan limits (no entry/project CRUD routes at all) |
| Stripe checkout route | ❌ MISSING | No `/api/billing/checkout` or `/api/stripe/*` routes |
| Stripe webhook handler | ❌ MISSING | WC15 HIGH-002 unresolved — no `POST /api/stripe/webhook` |
| Billing dashboard page | ❌ NOT WIRED | `/billing` page exists in sidebar nav but no route found in directory listing |

**Root Cause:** Billing feature set is entirely unimplemented beyond the database schema. No Stripe SDK integration, no webhook handler, no checkout flow, no plan limit gates.

---

### TEST-06: Custom Domain Redirect
**Result: 🔴 FAIL**

**Expected flow:**
1. User sets custom domain for their project (e.g., `changelog.myapp.com`)
2. DNS is configured to point to ChangelogKit
3. Incoming request on custom domain is matched to project
4. Changelog is served with project data

**Findings:**
- No `customDomain` field in `projects` schema
- No domain verification mechanism
- No Next.js `middleware.ts` for custom domain routing (also noted in WC15 MEDIUM-005)
- No route like `/api/projects/{id}/domain` or domain-matching logic

**Root Cause:** Feature not designed or implemented. Schema has no custom domain field.

---

## Critical Bugs Found

### BUG-001: Email Blast Sends to Unconfirmed Subscribers
**Severity: 🔴 HIGH**  
**File:** `apps/web/src/app/api/entries/[id]/notify/route.ts`  
**Lines:** 53–63

**Description:**  
The notify route fetches ALL subscribers for a project without filtering by `isConfirmed: true`. This means users who submitted their email but have not yet clicked the confirmation link will receive blast emails. This violates double opt-in compliance (GDPR/CAN-SPAM) and contradicts the WC15 audit claim that "Blast endpoint only emails `isConfirmed` subscribers."

**Evidence:**
```typescript
// BUGGY: Missing isConfirmed filter
const subscribers = await db
  .select({ id: emailSubscribers.id, ... })
  .from(emailSubscribers)
  .where(eq(emailSubscribers.projectId, project.id));  // ← no isConfirmed filter!
```

**Fix Required:**
```typescript
.where(
  and(
    eq(emailSubscribers.projectId, project.id),
    eq(emailSubscribers.isConfirmed, true)   // ← add this
  )
)
```

---

### BUG-002: `assertProjectOwner()` Does Not Verify Project Ownership
**Severity: 🔴 HIGH**  
**File:** `apps/web/src/lib/auth.ts`  
**Lines:** 43–72

**Description:**  
The `assertProjectOwner()` helper is named and documented to "verify that a user owns a project by ID," but the implementation only checks that the user exists in the database. It never queries the `projects` table to verify `project.userId === user.id`. The `projectId` parameter is accepted but **never used**.

**Evidence:**
```typescript
export async function assertProjectOwner(
  req: NextRequest,
  projectId: string   // ← parameter accepted but NEVER USED
): Promise<...> {
  const user = await getSessionUser(req);
  if (!user) { return { error: ... }; }

  // Only checks user exists — does NOT check project ownership!
  const [dbUser] = await db.select({ id: users.id })
    .from(users).where(eq(users.id, user.id)).limit(1);
  if (!dbUser) { return { error: ... }; }

  return { user };   // ← always returns user, never validates projectId
}
```

**Impact:** Any authenticated user can call `GET /api/projects/{id}/subscribers` for any project ID they don't own and receive the full subscriber list. This is a broken access control / IDOR vulnerability on the subscribers endpoint.

**Fix Required:**
```typescript
export async function assertProjectOwner(
  req: NextRequest,
  projectId: string
) {
  const user = await getSessionUser(req);
  if (!user) return { error: ... };
  
  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);
  
  if (!project) return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) };
  return { user, project };
}
```

---

### BUG-003: Widget XSS via innerHTML (WC15 HIGH-001 — UNRESOLVED)
**Severity: 🔴 HIGH**  
**File:** `apps/widget/src/index.ts`  
**Line:** `panel.innerHTML = entries.map(...)`

**Status:** Reported in WC15 Sprint 4.2. Not fixed. `e.title`, `e.category`, and `e.content` are interpolated directly into `innerHTML` template literals without HTML encoding.

---

### BUG-004: No Stripe Webhook Route (WC15 HIGH-002 — UNRESOLVED)
**Severity: 🔴 HIGH**  
**Status:** Reported in WC15. Not fixed. `STRIPE_WEBHOOK_SECRET` in `.env.example` but no `/api/stripe/webhook` route exists.

---

### BUG-005: No Rate Limiting on Subscribe Endpoint (WC15 HIGH-003 — UNRESOLVED)
**Severity: 🔴 HIGH**  
**Status:** Reported in WC15. Not fixed. `POST /api/projects/{id}/subscribe` remains unauthenticated with no rate limiting — allows email spam abuse.

---

### BUG-006: Unsanitized Marked Output in Email HTML (WC15 MEDIUM-004 — UNRESOLVED)
**Severity: 🟡 MEDIUM**  
**Status:** Reported in WC15. Not fixed. `marked.parse(entry.content)` output injected directly into `entryBlastEmailHtml()` template without HTML sanitization.

---

### BUG-007: No Next.js Middleware for Dashboard Auth (WC15 MEDIUM-005 — UNRESOLVED)
**Severity: 🟡 MEDIUM**  
**Status:** Reported in WC15. Not fixed. No `middleware.ts` exists. Dashboard routes (`/projects`, `/entries`, etc.) are accessible to unauthenticated users.

---

## Missing Routes / Feature Gaps

The following routes/features are required for a functional product and are **completely absent**:

| Route | Required For | Priority |
|-------|-------------|----------|
| `POST /api/projects` | Create project | 🔴 P0 |
| `GET /api/projects` | List user projects | 🔴 P0 |
| `GET /api/projects/{id}` | Load project detail | 🔴 P0 |
| `PATCH /api/projects/{id}` | Update project settings | 🟡 P1 |
| `DELETE /api/projects/{id}` | Delete project | 🟡 P1 |
| `POST /api/projects/{id}/entries` | Create entry | 🔴 P0 |
| `GET /api/projects/{id}/entries` | List entries | 🔴 P0 |
| `GET /api/entries/{id}` | Load single entry | 🔴 P0 |
| `PATCH /api/entries/{id}` | Update/publish entry | 🔴 P0 |
| `DELETE /api/entries/{id}` | Delete entry | 🟡 P1 |
| `GET /api/widget/entries` | Widget embed fetch | 🔴 P0 |
| `POST /api/github/draft` | GitHub AI draft | 🟡 P1 |
| `POST /api/billing/checkout` | Stripe checkout | 🟡 P1 |
| `POST /api/stripe/webhook` | Stripe events | 🔴 P0 (security) |
| `GET /api/billing/status` | Check plan tier | 🟡 P1 |
| `PATCH /api/projects/{id}/domain` | Custom domain | 🔵 P2 |

---

## UI/API Integration Status

| Dashboard Page | API Connected? | Notes |
|----------------|---------------|-------|
| `/projects` | ❌ NO | Static "empty state" UI, New Project button has no onClick |
| `/projects/[id]/entries/new` | ❌ NO | Save Draft and Publish Now call only local state setters |
| `/changelog/[slug]` | ❌ NO | Uses hardcoded `MOCK_ENTRIES` (FeedbackKit data, wrong project) |
| `/settings` | ❌ NO | UI-only, no save API calls |
| `/subscribers` | ❌ NOT FOUND | Nav item present but page route not found |
| `/entries` | ❌ NOT FOUND | Nav item present but page route not found |
| `/billing` | ❌ NOT FOUND | Nav item present but page route not found |

---

## Wave 10 (Bolt) Fixes Required Before Deployment

Prioritized by severity:

### 🔴 P0 — Blockers (must fix before any beta)

1. **[BUG-001] Fix email blast confirmed-only filter** — Add `eq(emailSubscribers.isConfirmed, true)` to notify route WHERE clause. 1-line fix.

2. **[BUG-002] Fix `assertProjectOwner()` to actually check project ownership** — Add DB query to verify `project.userId === user.id`. Prevents IDOR on subscriber list endpoint.

3. **[FEAT] Implement project CRUD API** — `POST/GET /api/projects`, `GET/PATCH/DELETE /api/projects/{id}`. Required for create project flow.

4. **[FEAT] Implement entry CRUD API** — `POST/GET /api/projects/{id}/entries`, `GET/PATCH/DELETE /api/entries/{id}` with publish support. Required for write entry + publish flow.

5. **[FEAT] Implement widget API** — `GET /api/widget/entries` with X-API-Key authentication, CORS headers, returns published entries only. Required for embed flow.

6. **[BUG-003] Fix widget XSS** — Replace `innerHTML` with `textContent` setters or `DOMPurify`. Required before any public widget distribution.

7. **[BUG-004] Implement Stripe webhook route** — `POST /api/stripe/webhook` with `stripe.webhooks.constructEvent()` signature verification. Required before billing can be trusted.

8. **[FEAT] Wire dashboard UI to API** — Connect New Entry save/publish buttons, Projects page creation, to actual API endpoints.

### 🟡 P1 — High Priority (must fix before GA)

9. **[BUG-005] Add rate limiting to subscribe endpoint** — 5 req/IP/hour via `@upstash/ratelimit` or similar. 

10. **[BUG-006] Sanitize marked output before email injection** — Apply `sanitize-html` with strict allowlist to `contentHtml` before injecting into email templates.

11. **[BUG-007] Add Next.js middleware for dashboard auth** — Create `src/middleware.ts` to redirect unauthenticated users from `/(dashboard)/` routes to `/login`.

12. **[FEAT] GitHub AI Draft endpoint** — `POST /api/github/draft`, requires GitHub API integration + LLM call. Can be deferred post-beta but needed for Sprint 4.3 feature completeness.

13. **[FEAT] Billing/Stripe checkout** — `POST /api/billing/checkout`, Stripe customer creation, checkout session, portal link.

14. **[FEAT] Plan limit enforcement** — Check `subscriptions` tier before allowing entry/project creation beyond free limits.

15. **[FEAT] Connect public changelog page to real data** — Replace `MOCK_ENTRIES` with actual DB query for published entries by project ID/slug.

### 🔵 P2 — Nice to Have (post-GA)

16. **[FEAT] Custom domain support** — Add `customDomain` column to projects schema, domain verification flow, Next.js middleware routing.

17. **[CLEANUP] Remove dead `confirmUrl` code** — First `confirmUrl` assignment in subscribe re-send block uses `existing.id` as token (WC15 LOW-007). Remove to reduce confusion.

18. **[FEAT] Auth routes** — Login, register, password reset pages and API handlers. Schema has `passwordHash` but no auth routes found.

---

## WC15 Security Finding Resolution Status

| Finding | Severity | WC15 Status | WC16 Status |
|---------|----------|-------------|-------------|
| Widget XSS via innerHTML | 🔴 HIGH | Open | ❌ Still Open |
| Missing Stripe webhook route | 🔴 HIGH | Open | ❌ Still Open |
| No rate limiting on /subscribe | 🔴 HIGH | Open | ❌ Still Open |
| Unsanitized marked output in email | 🟡 MEDIUM | Open | ❌ Still Open |
| No dashboard route protection middleware | 🟡 MEDIUM | Open | ❌ Still Open |
| Dead `confirmUrl` code | 🔵 LOW | Open | ❌ Still Open |
| Missing `/api/widget/entries` route | 🔵 LOW | Open | ❌ Still Open |

**0 of 7 WC15 findings were resolved between Sprint 4.2 and Sprint 4.3.**

---

## Test Matrix

| Test ID | Flow | Result | Blocking? |
|---------|------|--------|-----------|
| T-01-a | Create project via API | ❌ FAIL — route missing | Yes |
| T-01-b | Write entry via API | ❌ FAIL — route missing | Yes |
| T-01-c | Publish entry via API | ❌ FAIL — route missing | Yes |
| T-01-d | Trigger email blast | ⚠️ PARTIAL — route exists but BUG-001 | Yes |
| T-01-e | Blast only confirmed subscribers | ❌ FAIL — BUG-001 | Yes |
| T-02-a | GitHub commit fetch | ❌ FAIL — route missing | Yes |
| T-02-b | AI changelog generation | ❌ FAIL — not implemented | Yes |
| T-02-c | Draft pre-fill in editor | ❌ FAIL — no UI hookup | No |
| T-03-a | Widget script tag load | ⚠️ PARTIAL — source exists, CDN not verified | Yes |
| T-03-b | Widget API call to /api/widget/entries | ❌ FAIL — route missing | Yes |
| T-03-c | Widget renders entries | ❌ FAIL — depends on T-03-b | Yes |
| T-03-d | Widget XSS safe | ❌ FAIL — BUG-003 unresolved | Yes |
| T-04-a | Subscribe new email | ✅ PASS | — |
| T-04-b | Confirmation email sent | ✅ PASS | — |
| T-04-c | Confirm token activates subscription | ✅ PASS | — |
| T-04-d | Already-confirmed duplicate rejected | ✅ PASS | — |
| T-04-e | Unsubscribe removes record | ✅ PASS | — |
| T-04-f | Re-subscribe rotates tokens | ✅ PASS | — |
| T-05-a | Free plan project limit enforced | ❌ FAIL — no enforcement code | Yes |
| T-05-b | Stripe checkout session | ❌ FAIL — route missing | Yes |
| T-05-c | Stripe webhook updates tier | ❌ FAIL — route missing | Yes |
| T-05-d | Pro plan limit unlocked after upgrade | ❌ FAIL — not implemented | Yes |
| T-06-a | Custom domain stored on project | ❌ FAIL — no schema field | Yes |
| T-06-b | Custom domain redirect works | ❌ FAIL — not implemented | Yes |

**Summary: 6 PASS, 3 PARTIAL, 15 FAIL**

---

## Conclusion

ChangelogKit has a solid data model and a working subscriber confirm/unsubscribe flow. However, the product is missing core CRUD routes that make every other feature possible. The UI is entirely disconnected from any backend. None of the WC15 security findings were addressed. Two new high-severity bugs were discovered (BUG-001: blast to unconfirmed subscribers; BUG-002: `assertProjectOwner` IDOR).

**Bolt Wave 10 must address a minimum of items 1–8 (P0 blockers) before any further sprint integration testing is meaningful.**

---

*Integration testing conducted by Sage (WC16) via static code analysis. Scope: full repository. No live environment tested — DB/API assumed to match codebase.*
