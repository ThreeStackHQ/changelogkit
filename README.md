# ChangelogKit

**Embeddable changelog widget for indie SaaS** — show product updates inside your app. Lighter than ChangeHub, zero-config.

## Stack
- Next.js 14 + TypeScript + TailwindCSS + Drizzle ORM
- Vanilla JS embed widget (<4KB, esbuild)

## Structure
```
apps/web      — Dashboard + API (manage changelog entries)
apps/widget   — Embed widget (renders changelog popup in customer apps)
packages/db   — Schema + client
packages/config — Shared configs
```
