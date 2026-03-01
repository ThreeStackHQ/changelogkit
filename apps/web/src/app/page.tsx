import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ChangelogKit — Beautiful Changelogs for SaaS',
  description: 'Publish changelog updates, notify subscribers, and embed a live widget in your app. 5-minute setup.',
  keywords: ['changelog', 'release notes', 'product updates', 'changelog widget', 'saas changelog'],
  openGraph: {
    title: 'ChangelogKit — Beautiful Changelogs for SaaS',
    description: 'Publish beautiful changelogs, notify subscribers, embed in your app.',
    url: 'https://changelogkit.threestack.io',
    siteName: 'ChangelogKit',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChangelogKit — Beautiful Changelogs for SaaS',
    description: 'Ship fast. Tell everyone. Changelogs made easy.',
  },
}

const FEATURES = [
  { icon: '⚡', title: 'One-Click Publishing', desc: 'Write an update, hit publish. Your changelog is live instantly with a shareable public URL.' },
  { icon: '📧', title: 'Email Notifications', desc: 'Subscribers get notified automatically when you ship. Grows your engaged user base.' },
  { icon: '</>', title: 'Embeddable Widget', desc: 'Add a live changelog popup to your app with one script tag. Zero build required.' },
  { icon: '🌐', title: 'Public Changelog Page', desc: 'A beautiful hosted page at yourapp.clog.io — link from your docs or footer.' },
  { icon: '🤖', title: 'GitHub Auto-Draft (AI)', desc: 'Connect your repo. AI reads your commits and drafts changelog entries for you.' },
  { icon: '👥', title: 'Subscriber Management', desc: 'See who\'s subscribed, manage your list, and track open rates for each release.' },
]

const STEPS = [
  { n: '01', title: 'Write your update', desc: 'Use our rich editor to write a changelog entry. Tag it as a feature, fix, or improvement.' },
  { n: '02', title: 'Publish in one click', desc: 'Hit publish and your update appears on your public changelog page immediately.' },
  { n: '03', title: 'Notify subscribers', desc: 'All subscribers get a beautifully formatted email. Builds loyalty and reduces churn.' },
]

const PLANS = [
  { name: 'Free', price: '$0', period: '', desc: 'For solo makers', features: ['3 entries/month', 'Public changelog page', 'Embeddable widget', '50 subscribers', 'ChangelogKit branding'], cta: 'Start Free', highlight: false },
  { name: 'Pro', price: '$9', period: '/mo', desc: 'For active products', features: ['Unlimited entries', 'Email notifications', 'Unlimited subscribers', 'Custom domain', 'Remove branding', 'GitHub auto-draft (AI)', 'Priority support'], cta: 'Start 14-Day Trial', highlight: true },
  { name: 'Business', price: '$19', period: '/mo', desc: 'For teams', features: ['Everything in Pro', 'Multiple projects', 'Team members', 'White-label emails', 'API access', 'Analytics', 'Dedicated support'], cta: 'Start 14-Day Trial', highlight: false },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="font-bold text-white">ChangelogKit</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Sign in</Link>
            <Link href="/signup" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-powered changelog drafting
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Ship Fast.{' '}
              <span className="text-emerald-400">Tell Everyone.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Publish beautiful changelogs, notify subscribers, and embed a live widget in your app.
              {' '}<span className="text-gray-200">5-minute setup.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/25 text-center">
                Start for Free
              </Link>
              <Link href="/demo" className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-gray-300 hover:bg-white/5 transition-colors text-center">
                See Demo →
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">Free forever · No credit card required</p>
          </div>

          {/* Changelog entry mockup */}
          <div className="rounded-2xl border border-white/10 bg-[#111113] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <span className="text-sm font-semibold">YourApp Changelog</span>
              </div>
              <span className="text-xs text-gray-500">3 updates</span>
            </div>
            <div className="space-y-4">
              {[
                { tag: 'v2.4.0', type: 'feature', title: 'Dark mode is here 🌙', date: 'Mar 1, 2026', desc: 'Requested by 89 users. Finally! Toggle in Settings → Appearance.', typeColor: 'text-emerald-400 bg-emerald-500/20' },
                { tag: 'v2.3.2', type: 'fix', title: 'Invoice export bug fixed', date: 'Feb 22, 2026', desc: 'PDF exports now include all line items correctly.', typeColor: 'text-blue-400 bg-blue-500/20' },
                { tag: 'v2.3.0', type: 'improvement', title: 'Faster dashboard load', date: 'Feb 15, 2026', desc: '40% faster initial load thanks to edge caching.', typeColor: 'text-amber-400 bg-amber-500/20' },
              ].map((entry) => (
                <div key={entry.tag} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">{entry.tag}</code>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${entry.typeColor}`}>{entry.type}</span>
                    <span className="text-xs text-gray-500 ml-auto">{entry.date}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">{entry.title}</p>
                  <p className="text-xs text-gray-400">{entry.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Embed code */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Add to your app in 30 seconds</h2>
          <p className="text-gray-400 text-sm">One script tag. That&apos;s it.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111113] overflow-hidden shadow-xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-gray-500 ml-2">index.html</span>
          </div>
          <pre className="p-6 text-sm text-gray-300 overflow-x-auto">
            <code>{`<!-- Add this before </body> — that's it! -->
<script
  src="https://cdn.changelogkit.io/widget.js"
  data-project="your-project-id"
  data-position="bottom-right"
  data-theme="dark"
  defer
></script>`}</code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything you need to keep users informed</h2>
          <p className="text-gray-400">Built for indie hackers who ship fast and want their users to notice.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/30 transition-colors group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Three steps to better user retention</h2>
          <p className="text-gray-400">Users who know what&apos;s new stick around longer.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm mx-auto mb-4">
                {step.n}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Pricing that grows with you</h2>
          <p className="text-gray-400">Start free, upgrade when your users start subscribing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-8 flex flex-col ${plan.highlight ? 'border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
              {plan.highlight && <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 rounded-full px-3 py-1 self-start mb-4">Most Popular</div>}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{plan.desc}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-gray-400 mb-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`text-center rounded-xl py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'border border-white/20 text-gray-300 hover:bg-white/5'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Your users deserve to know what&apos;s new</h2>
          <p className="text-gray-400 mb-8 text-lg">Start for free. No credit card. Live in minutes.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-10 py-4 text-base font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/25">
            Create Your Changelog →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-4">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold">ChangelogKit</span>
            <span className="text-gray-500 text-sm ml-2">by ThreeStack</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
