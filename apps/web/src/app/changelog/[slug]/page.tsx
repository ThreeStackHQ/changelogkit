'use client'

import { useState } from 'react'
import { Bell, Rss, CheckCircle, ChevronDown, ExternalLink } from 'lucide-react'

// Sprint 2.3 — Public Changelog Page — Wren
// Public-facing changelog at /changelog/[slug]

// ─── Types ─────────────────────────────────────────────────────────────────────

type EntryCategory = 'feature' | 'fix' | 'improvement' | 'breaking' | 'security'

interface ChangelogEntry {
  id: string
  title: string
  version: string
  date: string
  category: EntryCategory
  content: string
  highlights: string[]
  reactions: number
  hasReacted: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<EntryCategory, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  feature:     { label: 'Feature',     color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100',    emoji: '✨' },
  fix:         { label: 'Fix',          color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100',     emoji: '🐛' },
  improvement: { label: 'Improvement', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   emoji: '⚡' },
  breaking:    { label: 'Breaking',    color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100',  emoji: '⚠️' },
  security:    { label: 'Security',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', emoji: '🔒' },
}

const CATEGORY_FILTERS: { label: string; value: EntryCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: '✨ Features', value: 'feature' },
  { label: '🐛 Fixes', value: 'fix' },
  { label: '⚡ Improvements', value: 'improvement' },
  { label: '🔒 Security', value: 'security' },
]

const MOCK_ENTRIES: ChangelogEntry[] = [
  {
    id: '1',
    title: 'New API Rate Limiting & Enhanced Webhook Reliability',
    version: 'v2.4.0',
    date: 'March 1, 2026',
    category: 'feature',
    content: 'We\'re rolling out intelligent API rate limiting to protect your integrations and improve overall platform stability.',
    highlights: [
      'Per-endpoint rate limiting with configurable thresholds',
      'Automatic retry with exponential backoff for webhooks',
      'Real-time rate limit headers in all API responses',
      'New dashboard widget showing API usage trends',
    ],
    reactions: 47,
    hasReacted: false,
  },
  {
    id: '2',
    title: 'Dark Mode & Accessibility Improvements',
    version: 'v2.3.2',
    date: 'February 22, 2026',
    category: 'improvement',
    content: 'Following months of community requests, we\'ve shipped full dark mode support across all dashboard pages.',
    highlights: [
      'System-level dark mode that follows OS preference',
      'Manual toggle that persists across sessions',
      'Improved contrast ratios for WCAG AA compliance',
      'Keyboard navigation improvements across all modals',
    ],
    reactions: 89,
    hasReacted: true,
  },
  {
    id: '3',
    title: 'CSV Export & Data Portability',
    version: 'v2.3.0',
    date: 'February 15, 2026',
    category: 'feature',
    content: 'Export your data at any time with our new comprehensive CSV export feature.',
    highlights: [
      'Export all feedback requests with all metadata',
      'Filter exports by status, date range, or board',
      'Scheduled exports via email (weekly/monthly)',
      'API endpoint for programmatic exports',
    ],
    reactions: 63,
    hasReacted: false,
  },
  {
    id: '4',
    title: 'Critical Auth Bug Fix',
    version: 'v2.2.1',
    date: 'February 8, 2026',
    category: 'fix',
    content: 'We identified and fixed a bug where some users were getting logged out unexpectedly after 30 minutes.',
    highlights: [
      'Fixed session token refresh race condition',
      'Improved error messages during auth failures',
      'Added fallback for cookie-disabled browsers',
    ],
    reactions: 12,
    hasReacted: false,
  },
  {
    id: '5',
    title: 'Slack & GitHub Integrations',
    version: 'v2.2.0',
    date: 'February 1, 2026',
    category: 'feature',
    content: 'Connect FeedbackKit directly to your workflow with native Slack and GitHub integrations.',
    highlights: [
      'Slack notifications for new requests and status changes',
      'Create GitHub issues directly from feedback requests',
      'Configurable notification filters per board',
      'Webhook support for any custom integration',
    ],
    reactions: 134,
    hasReacted: false,
  },
]

// ─── Subscribe Modal ───────────────────────────────────────────────────────────

function SubscribeModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
        {subscribed ? (
          <>
            <CheckCircle className="w-12 h-12 text-[#10b77f] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">You're subscribed!</h3>
            <p className="text-sm text-gray-500 mb-4">We'll email you whenever a new changelog entry is published.</p>
            <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#10b77f] hover:bg-[#0fa371]">Done</button>
          </>
        ) : (
          <>
            <Bell className="w-10 h-10 text-[#10b77f] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Stay in the loop</h3>
            <p className="text-sm text-gray-500 mb-4">Get notified when we ship new features and improvements.</p>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#10b77f]/50 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => email.trim() && setSubscribed(true)}
                disabled={!email.trim()}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#10b77f] hover:bg-[#0fa371] disabled:opacity-50"
              >
                Subscribe
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Entry Card ────────────────────────────────────────────────────────────────

function EntryCard({ entry, onReact }: { entry: ChangelogEntry; onReact: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true)
  const cat = CATEGORY_CONFIG[entry.category]

  return (
    <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Color accent top bar */}
      <div className={`h-1 ${cat.bg} border-b ${cat.border}`} />

      <div className="p-6">
        {/* Meta row */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cat.color} ${cat.bg} ${cat.border}`}>
            {cat.emoji} {cat.label}
          </span>
          {entry.version && (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-600">
              {entry.version}
            </span>
          )}
          <time className="text-xs text-gray-400 ml-auto">{entry.date}</time>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{entry.title}</h2>

        {/* Content */}
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{entry.content}</p>

        {/* Highlights */}
        {expanded && (
          <ul className="space-y-1.5 mb-4">
            {entry.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-[#10b77f] flex-shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Show less' : `Show ${entry.highlights.length} highlights`}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <button
            onClick={() => onReact(entry.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              entry.hasReacted
                ? 'bg-[#10b77f]/10 text-[#10b77f] border border-[#10b77f]/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent'
            }`}
          >
            <span>👍</span>
            <span>{entry.reactions}</span>
            {!entry.hasReacted && <span className="text-gray-400">Helpful</span>}
          </button>

          <a
            href={`#entry-${entry.id}`}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Permalink
          </a>
        </div>
      </div>
    </article>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicChangelogPage({ params }: { params: { slug: string } }) {
  const [activeFilter, setActiveFilter] = useState<EntryCategory | 'all'>('all')
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [inlineSubscribed, setInlineSubscribed] = useState(false)
  const [entries, setEntries] = useState<ChangelogEntry[]>(MOCK_ENTRIES)

  const projectName = 'FeedbackKit'

  const handleReact = (id: string) => {
    setEntries(prev =>
      prev.map(e =>
        e.id === id ? { ...e, hasReacted: !e.hasReacted, reactions: e.hasReacted ? e.reactions - 1 : e.reactions + 1 } : e
      )
    )
  }

  const filtered = entries.filter(e => activeFilter === 'all' || e.category === activeFilter)

  return (
    <div className="min-h-screen bg-gray-50">
      {showSubscribeModal && <SubscribeModal onClose={() => setShowSubscribeModal(false)} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#10b77f] flex items-center justify-center">
              <span className="text-white text-xs font-bold">CK</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">{projectName}</span>
              <span className="ml-2 text-xs text-gray-400">Changelog</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="#rss" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" title="RSS Feed">
              <Rss className="w-4 h-4" />
            </a>
            <button
              onClick={() => setShowSubscribeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-[#10b77f] hover:bg-[#0fa371] transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              Subscribe
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex gap-8">
          {/* Left sidebar */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <div className="sticky top-8">
              {/* Project info */}
              <div className="mb-6">
                <h1 className="text-lg font-bold text-gray-900 mb-1">{projectName}</h1>
                <p className="text-xs text-gray-500">Product updates and release notes</p>
              </div>

              {/* Subscribe inline */}
              {!inlineSubscribed ? (
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                  <p className="text-xs font-semibold text-gray-700 mb-2.5">📬 Get updates</p>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={subscribeEmail}
                    onChange={e => setSubscribeEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#10b77f]/50 mb-2"
                  />
                  <button
                    onClick={() => subscribeEmail.trim() && setInlineSubscribed(true)}
                    disabled={!subscribeEmail.trim()}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#10b77f] hover:bg-[#0fa371] disabled:opacity-50 transition-colors"
                  >
                    Subscribe
                  </button>
                </div>
              ) : (
                <div className="bg-[#10b77f]/5 border border-[#10b77f]/20 rounded-xl p-4 mb-6 text-center">
                  <CheckCircle className="w-6 h-6 text-[#10b77f] mx-auto mb-1" />
                  <p className="text-xs text-[#10b77f] font-medium">Subscribed! ✓</p>
                </div>
              )}

              {/* Category filter */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Filter by type</p>
                <div className="space-y-0.5">
                  {CATEGORY_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setActiveFilter(f.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeFilter === f.value
                          ? 'bg-[#10b77f]/10 text-[#10b77f] font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Entries */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Release Notes</h2>
                <p className="text-sm text-gray-500 mt-0.5">{filtered.length} updates</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filtered.map(entry => (
                <EntryCard key={entry.id} entry={entry} onReact={handleReact} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">No entries in this category yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-100 text-center">
        <a href="https://changelogkit.threestack.io" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Powered by <span className="font-medium">ChangelogKit</span>
        </a>
      </footer>
    </div>
  )
}
