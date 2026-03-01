'use client'

import { useState } from 'react'
import {
  Upload, Palette, Globe, ToggleLeft, ToggleRight, Bell, Mail,
  Monitor, AlignLeft, AlignRight, Code2, Check, Save, AlertCircle
} from 'lucide-react'

const BRAND = '#10b981'

const PRESET_COLORS = [
  { label: 'Emerald', value: '#10b981' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
]

const TABS = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'widget', label: 'Widget', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
      style={{ background: BRAND }}
    >
      {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  )
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <button onClick={onChange} className="flex-shrink-0">
        {checked
          ? <ToggleRight className="w-9 h-9" style={{ color: BRAND }} />
          : <ToggleLeft className="w-9 h-9 text-gray-600" />}
      </button>
    </div>
  )
}

// ── Branding Tab ──────────────────────────────────────────────────────────────

function BrandingTab() {
  const [color, setColor] = useState('#10b981')
  const [customColor, setCustomColor] = useState('#10b981')
  const [companyName, setCompanyName] = useState('Acme Inc.')
  const [domain, setDomain] = useState('')
  const [badge, setBadge] = useState(true)
  const [saved, setSaved] = useState(false)

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-5">
      {/* Logo */}
      <SectionCard title="Logo" desc="Upload your company logo. PNG or SVG, max 1 MB.">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 flex-shrink-0">
            <span className="text-2xl font-bold text-gray-600">A</span>
          </div>
          <div>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors w-fit">
              <Upload className="w-4 h-4" />
              Upload Logo
              <input type="file" accept="image/*" className="hidden" />
            </label>
            <p className="text-xs text-gray-500 mt-2">Recommended: 128×128 px, transparent background</p>
          </div>
        </div>
      </SectionCard>

      {/* Brand Color */}
      <SectionCard title="Brand Color" desc="Choose a color for buttons, highlights, and accents in your public changelog.">
        <div className="flex flex-wrap gap-3 mb-4">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => { setColor(c.value); setCustomColor(c.value) }}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{
                background: c.value,
                borderColor: color === c.value ? 'white' : 'transparent',
                boxShadow: color === c.value ? `0 0 0 2px ${c.value}60` : undefined,
              }}
            />
          ))}
          {/* Custom color */}
          <label className="relative w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer overflow-hidden"
            title="Custom color">
            <span className="text-[10px] text-gray-400">+</span>
            <input
              type="color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value) }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ background: color }} />
          <code className="text-xs text-gray-400 font-mono">{color}</code>
          <span className="ml-auto text-xs text-gray-500">Preview:</span>
          <button className="px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ background: color }}>
            View Changelog
          </button>
        </div>
      </SectionCard>

      {/* Company Name */}
      <SectionCard title="Company Name" desc="Shown in the changelog header and email notifications.">
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:border-emerald-500/50"
          style={{ '--tw-ring-color': `${BRAND}50` } as React.CSSProperties}
          placeholder="Your Company Name"
        />
      </SectionCard>

      {/* Custom Domain */}
      <SectionCard title="Custom Domain" desc="Serve your public changelog on your own domain.">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:border-emerald-500/50"
            style={{ '--tw-ring-color': `${BRAND}50` } as React.CSSProperties}
            placeholder="changelog.yourcompany.com"
          />
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/5 rounded-lg p-3">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
          Point a CNAME record to <code className="text-emerald-400 mx-1">cname.changelogkit.io</code> then enter your domain above.
        </div>
      </SectionCard>

      {/* Badge Toggle */}
      <SectionCard title="Powered by Badge" desc="Show or hide the 'Powered by ChangelogKit' badge on your public changelog.">
        <Toggle checked={badge} onChange={() => setBadge(!badge)} label="Show 'Powered by ChangelogKit' badge" />
        {!badge && (
          <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Removing the badge requires a Pro plan.
          </p>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton onClick={save} saved={saved} />
      </div>
    </div>
  )
}

// ── Widget Tab ────────────────────────────────────────────────────────────────

function WidgetTab() {
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [buttonText, setButtonText] = useState("What's new?")
  const [highlight, setHighlight] = useState('#10b981')
  const [saved, setSaved] = useState(false)

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const snippet = `<script 
  src="https://cdn.changelogkit.io/widget.js" 
  data-project="YOUR_ID"
  data-position="${position}"
  data-color="${highlight}"
></script>`

  return (
    <div className="space-y-5">
      {/* Position */}
      <SectionCard title="Widget Position" desc="Where the changelog widget button appears on your site.">
        <div className="grid grid-cols-2 gap-3">
          {(['bottom-right', 'bottom-left'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className="flex items-center gap-3 p-4 rounded-xl border transition-all text-sm font-medium"
              style={{
                borderColor: position === pos ? BRAND : 'rgba(255,255,255,0.1)',
                background: position === pos ? `${BRAND}12` : 'rgba(255,255,255,0.03)',
                color: position === pos ? '#10b981' : '#9ca3af',
              }}
            >
              {pos === 'bottom-right' ? <AlignRight className="w-5 h-5" /> : <AlignLeft className="w-5 h-5" />}
              {pos === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Button Text */}
      <SectionCard title="Widget Button Text" desc="Text shown on the floating widget button.">
        <input
          type="text"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
          maxLength={30}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none"
          placeholder="What's new?"
        />
        <p className="text-xs text-gray-500 mt-1.5">{buttonText.length}/30 characters</p>
      </SectionCard>

      {/* Highlight Color */}
      <SectionCard title="Highlight Color" desc="Accent color for the widget badge and header.">
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            className="w-12 h-12 rounded-lg border border-white/10 bg-transparent cursor-pointer"
          />
          <div>
            <code className="text-sm text-gray-300 font-mono">{highlight}</code>
            <p className="text-xs text-gray-500 mt-0.5">Click to open color picker</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Preview:</span>
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg"
                style={{ background: highlight }}
              >
                {buttonText || "What's new?"}
                <span className="w-4 h-4 rounded-full bg-white/30 text-[9px] flex items-center justify-center font-bold">3</span>
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Snippet */}
      <SectionCard title="Install Snippet" desc="Paste this into your HTML just before the closing </body> tag.">
        <div className="rounded-lg border border-white/10 bg-gray-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">HTML</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(snippet)}
              className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Copy
            </button>
          </div>
          <pre className="p-4 text-xs text-green-400 overflow-x-auto font-mono leading-relaxed">
            {snippet}
          </pre>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Replace <code className="text-emerald-400">YOUR_ID</code> with your project ID from the Projects page.
        </p>
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton onClick={save} saved={saved} />
      </div>
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  const [digest, setDigest] = useState<'daily' | 'weekly' | 'never'>('weekly')
  const [notifyOnPublish, setNotifyOnPublish] = useState(true)
  const [fromName, setFromName] = useState('Acme Changelog')
  const [fromEmail, setFromEmail] = useState('changelog@acme.com')
  const [saved, setSaved] = useState(false)

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-5">
      {/* Email Digest */}
      <SectionCard title="Email Digest" desc="Send subscribers a digest of new changelog entries.">
        <div className="grid grid-cols-3 gap-3">
          {(['daily', 'weekly', 'never'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setDigest(opt)}
              className="p-3 rounded-xl border text-sm font-medium capitalize transition-all"
              style={{
                borderColor: digest === opt ? BRAND : 'rgba(255,255,255,0.1)',
                background: digest === opt ? `${BRAND}12` : 'rgba(255,255,255,0.03)',
                color: digest === opt ? '#10b981' : '#9ca3af',
              }}
            >
              {opt === 'daily' ? '📅 Daily' : opt === 'weekly' ? '📆 Weekly' : '🔕 Never'}
            </button>
          ))}
        </div>
        {digest !== 'never' && (
          <p className="text-xs text-gray-500 mt-3">
            Subscribers will receive a {digest} digest of new entries every {digest === 'daily' ? 'morning at 9 AM' : 'Monday morning'}.
          </p>
        )}
      </SectionCard>

      {/* Notify on Publish */}
      <SectionCard title="Publish Notifications" desc="Automatically notify subscribers when you publish a new entry.">
        <Toggle
          checked={notifyOnPublish}
          onChange={() => setNotifyOnPublish(!notifyOnPublish)}
          label="Notify subscribers when an entry is published"
        />
      </SectionCard>

      {/* From Name + Email */}
      <SectionCard title="Notification Sender" desc="The name and email address subscribers see in their inbox.">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">From Name</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none"
              placeholder="Acme Changelog"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">From Email</label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none"
                placeholder="changelog@yourcompany.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Custom sender requires domain verification. <a href="#" className="text-emerald-400 hover:underline">Verify domain →</a>
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Preview */}
      <SectionCard title="Email Preview" desc="How your notification emails will appear to subscribers.">
        <div className="rounded-xl border border-white/10 bg-gray-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
            <div className="text-xs text-gray-500 space-y-1">
              <div><span className="text-gray-600">From:</span> {fromName} &lt;{fromEmail}&gt;</div>
              <div><span className="text-gray-600">Subject:</span> 🎉 New in Acme — 3 updates this week</div>
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-gray-400">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: BRAND }}>A</div>
                <span className="font-medium text-white">{fromName}</span>
              </div>
              <p className="text-gray-500">Here are this week&apos;s updates from Acme...</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton onClick={save} saved={saved} />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState('branding')

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Customize your changelog appearance, widget, and notifications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 border border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 flex-1 justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === id ? BRAND : 'transparent',
              color: tab === id ? 'white' : '#6b7280',
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'branding' && <BrandingTab />}
      {tab === 'widget' && <WidgetTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  )
}
