'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image,
  Eye,
  EyeOff,
  Save,
  Send,
  ChevronDown,
} from 'lucide-react'

// Sprint 2.2 — Rich Text Editor UI — Wren

// ─── Types ─────────────────────────────────────────────────────────────────────

type EntryStatus = 'draft' | 'published'
type EntryCategory = 'feature' | 'fix' | 'improvement' | 'breaking' | 'security'

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: EntryCategory; label: string; color: string; bg: string }[] = [
  { value: 'feature',     label: '✨ Feature',     color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  { value: 'fix',         label: '🐛 Fix',          color: 'text-red-400',     bg: 'bg-red-500/15' },
  { value: 'improvement', label: '⚡ Improvement',  color: 'text-amber-400',   bg: 'bg-amber-500/15' },
  { value: 'breaking',    label: '⚠️ Breaking',     color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  { value: 'security',    label: '🔒 Security',     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
]

const TOOLBAR_ITEMS = [
  { icon: Bold,         label: 'Bold',           cmd: 'bold' },
  { icon: Italic,       label: 'Italic',         cmd: 'italic' },
  { icon: Heading1,     label: 'Heading 1',      cmd: 'h1' },
  { icon: Heading2,     label: 'Heading 2',      cmd: 'h2' },
  { icon: List,         label: 'Bullet List',    cmd: 'ul' },
  { icon: ListOrdered,  label: 'Ordered List',   cmd: 'ol' },
  { icon: Code,         label: 'Code',           cmd: 'code' },
  { icon: LinkIcon,     label: 'Link',           cmd: 'link' },
  { icon: Image,        label: 'Image',          cmd: 'image' },
]

const PLACEHOLDER_CONTENT = `What's new in this release?

- List the key changes and improvements
- Keep it scannable and clear
- Link to relevant docs or issues

**Example heading**

This release includes performance improvements and bug fixes...`

// ─── Preview Renderer ──────────────────────────────────────────────────────────

function renderMarkdownPreview(text: string): string {
  return text
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mb-3 mt-6">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-white mb-2 mt-5">$1</h2>')
    .replace(/^\*\*(.+)\*\*$/gm, '<p class="font-semibold text-white mb-2">$1</p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-300">$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 text-xs font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="text-gray-300 mb-1 ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-gray-300 mb-1 ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="text-gray-400 mb-3">')
    .replace(/\n/g, '<br />')
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewEntryPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('')
  const [version, setVersion] = useState('')
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<EntryCategory>('feature')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<EntryStatus>('draft')
  const [previewMode, setPreviewMode] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [saved, setSaved] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const selectedCategory = CATEGORIES.find(c => c.value === category)!

  const insertMarkdown = useCallback((cmd: string) => {
    const el = editorRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.slice(start, end)

    let replacement = ''
    switch (cmd) {
      case 'bold':      replacement = `**${selected || 'bold text'}**`; break
      case 'italic':    replacement = `*${selected || 'italic text'}*`; break
      case 'h1':        replacement = `\n# ${selected || 'Heading 1'}\n`; break
      case 'h2':        replacement = `\n## ${selected || 'Heading 2'}\n`; break
      case 'ul':        replacement = `\n- ${selected || 'List item'}\n`; break
      case 'ol':        replacement = `\n1. ${selected || 'List item'}\n`; break
      case 'code':      replacement = `\`${selected || 'code'}\``; break
      case 'link':      replacement = `[${selected || 'link text'}](url)`; break
      case 'image':     replacement = `![alt text](image-url)`; break
      default:          replacement = selected
    }

    const newContent = content.slice(0, start) + replacement + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      el.selectionStart = start + replacement.length
      el.selectionEnd = start + replacement.length
      el.focus()
    }, 0)
  }, [content])

  const handleSaveDraft = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link href={`/projects/${params.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Project
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-xs text-gray-400">New Entry</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-white/10 text-xs text-gray-400 hover:border-white/20 transition-colors"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'published' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              {status === 'published' ? 'Published' : 'Draft'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 top-9 z-20 bg-[#1c2128] border border-white/10 rounded-lg shadow-xl overflow-hidden w-32">
                  <button onClick={() => { setStatus('draft'); setShowStatusDropdown(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Draft
                  </button>
                  <button onClick={() => { setStatus('published'); setShowStatusDropdown(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Published
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              previewMode
                ? 'bg-[#10b77f]/15 border-[#10b77f]/30 text-[#10b77f]'
                : 'bg-[#161b22] border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>

          {/* Save draft */}
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : 'Save Draft'}
          </button>

          {/* Publish */}
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-[#10b77f] hover:bg-[#0fa371] transition-colors">
            <Send className="w-3.5 h-3.5" />
            Publish Now
          </button>
        </div>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left sidebar — metadata */}
        <aside className="w-64 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-[#161b22] border border-white/10 rounded-xl p-4 flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Version</label>
              <input
                type="text"
                placeholder="e.g. v2.4.0"
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10b77f]/40 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Release Date</label>
              <input
                type="date"
                value={releaseDate}
                onChange={e => setReleaseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white focus:outline-none focus:border-[#10b77f]/40 transition-colors [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm focus:outline-none hover:border-white/20 transition-colors ${selectedCategory.color}`}
                >
                  <span>{selectedCategory.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {showCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                    <div className="absolute left-0 top-10 z-20 w-full bg-[#1c2128] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => { setCategory(cat.value); setShowCategoryDropdown(false) }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${cat.color} ${cat.value === category ? 'bg-white/5' : ''}`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Word count */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Words</span>
                <span>{wordCount}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>Chars</span>
                <span>{content.length}</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#10b77f]/5 border border-[#10b77f]/15 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-[#10b77f] mb-1.5">✍️ Writing Tips</p>
            <ul className="text-[10px] text-gray-500 space-y-1">
              <li>• Start with the most important change</li>
              <li>• Use bullet points for readability</li>
              <li>• Link to docs for breaking changes</li>
              <li>• Mention the problem you solved</li>
            </ul>
          </div>
        </aside>

        {/* Main editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#161b22] border border-white/10 rounded-xl overflow-hidden">
          {/* Title input */}
          <div className="px-6 pt-5 pb-0">
            <input
              type="text"
              placeholder="Entry title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-xl font-semibold text-white placeholder-gray-700 bg-transparent border-none focus:outline-none"
            />
          </div>

          {/* Toolbar (hidden in preview mode) */}
          {!previewMode && (
            <div className="flex items-center gap-0.5 px-5 py-3 border-b border-white/5">
              {TOOLBAR_ITEMS.map((item, i) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.cmd}
                    onClick={() => insertMarkdown(item.cmd)}
                    title={item.label}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors ${
                      [3, 5, 6].includes(i) ? 'mr-1 border-r border-white/5 pr-2.5' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Editor / Preview */}
          <div className="flex-1 overflow-auto">
            {previewMode ? (
              <div className="px-6 py-5">
                {/* Preview header */}
                <div className="flex items-center gap-2 mb-4">
                  {version && (
                    <span className="px-2 py-0.5 rounded bg-[#10b77f]/15 border border-[#10b77f]/25 text-xs font-mono text-[#10b77f]">
                      {version}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs ${selectedCategory.color} ${selectedCategory.bg}`}>
                    {selectedCategory.label}
                  </span>
                  <span className="text-xs text-gray-600">{releaseDate}</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-6">{title || 'Untitled Entry'}</h1>
                {content ? (
                  <div
                    className="prose prose-invert max-w-none text-gray-400 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(content) }}
                  />
                ) : (
                  <p className="text-gray-700 text-sm italic">Nothing to preview yet. Switch back to edit mode and write something.</p>
                )}
              </div>
            ) : (
              <textarea
                ref={editorRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={PLACEHOLDER_CONTENT}
                className="w-full h-full px-6 py-5 bg-transparent text-sm text-gray-300 placeholder-gray-700 focus:outline-none resize-none font-mono leading-relaxed"
                spellCheck
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
