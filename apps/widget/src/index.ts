/**
 * ChangelogKit Embed Widget
 * Shows a changelog popup bell inside any web app.
 * Usage: <script src="https://cdn.changelogkit.threestack.io/widget.js" data-api-key="ck_live_..."></script>
 */
interface Entry { id: string; title: string; content: string; category: string; publishedAt: string; }
const API = "https://changelogkit.threestack.io";
const BADGE_ID = "ck-badge";
const PANEL_ID = "ck-panel";
let apiKey = "";

async function fetchEntries(): Promise<Entry[]> {
  const r = await fetch(`${API}/api/widget/entries`, { headers: { "X-API-Key": apiKey } });
  if (!r.ok) throw new Error("Failed");
  return (await r.json() as { entries: Entry[] }).entries;
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = { feature: "#6366f1", fix: "#ef4444", improvement: "#f59e0b", breaking: "#dc2626" };
  return map[cat] || "#6b7280";
}

function renderPanel(entries: Entry[], color: string) {
  const panel = document.getElementById(PANEL_ID)!;
  if (!entries.length) { panel.innerHTML = '<div class="ck-empty">No updates yet 🎉</div>'; return; }
  panel.innerHTML = entries.map(e => `
    <div class="ck-entry">
      <div class="ck-meta">
        <span class="ck-cat" style="background:${categoryColor(e.category)}">${e.category}</span>
        <span class="ck-date">${new Date(e.publishedAt).toLocaleDateString()}</span>
      </div>
      <div class="ck-title">${e.title}</div>
      <div class="ck-body">${e.content.slice(0, 150)}${e.content.length > 150 ? "…" : ""}</div>
    </div>`).join("");
}

function injectCSS(color: string) {
  const s = document.createElement("style");
  s.textContent = `
    #ck-wrap{position:fixed;bottom:20px;right:20px;z-index:99999;font-family:system-ui,sans-serif}
    #ck-badge{width:40px;height:40px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,.3)}
    #ck-unread{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
    #ck-panel{position:absolute;bottom:52px;right:0;width:320px;max-height:400px;overflow-y:auto;background:#1f2937;border:1px solid #374151;border-radius:10px;padding:12px;display:none}
    #ck-panel.open{display:block}
    #ck-panel h3{font-size:14px;font-weight:700;color:#f9fafb;margin:0 0 10px}
    .ck-entry{padding:10px 0;border-bottom:1px solid #374151}
    .ck-entry:last-child{border:none}
    .ck-meta{display:flex;align-items:center;gap:6px;margin-bottom:4px}
    .ck-cat{padding:2px 6px;border-radius:4px;color:#fff;font-size:10px;font-weight:600;text-transform:uppercase}
    .ck-date{font-size:11px;color:#6b7280}
    .ck-title{font-size:13px;font-weight:600;color:#f9fafb;margin-bottom:2px}
    .ck-body{font-size:12px;color:#9ca3af;line-height:1.4}
    .ck-empty{text-align:center;padding:20px;color:#6b7280;font-size:13px}
  `;
  document.head.appendChild(s);
}

export function init(opts: { apiKey: string; color?: string }) {
  apiKey = opts.apiKey;
  const color = opts.color || "#6366f1";
  injectCSS(color);
  const wrap = document.createElement("div"); wrap.id = "ck-wrap";
  wrap.innerHTML = `<div id="${BADGE_ID}">📣<span id="ck-unread" style="display:none">0</span></div><div id="${PANEL_ID}"><h3>What's New</h3></div>`;
  document.body.appendChild(wrap);
  const badge = document.getElementById(BADGE_ID)!;
  const panel = document.getElementById(PANEL_ID)!;
  badge.addEventListener("click", () => { panel.classList.toggle("open"); });
  document.addEventListener("click", e => { if (!wrap.contains(e.target as Node)) panel.classList.remove("open"); });
  fetchEntries().then(entries => {
    renderPanel(entries, color);
    const unread = document.getElementById("ck-unread")!;
    if (entries.length) { unread.style.display = "flex"; unread.textContent = String(entries.length); }
  }).catch(() => {});
}

const s = document.currentScript as HTMLScriptElement | null;
if (s?.dataset.apiKey) {
  document.addEventListener("DOMContentLoaded", () => init({ apiKey: s.dataset.apiKey!, color: s.dataset.color }));
}
(window as unknown as Record<string, unknown>).ChangelogKit = { init };
