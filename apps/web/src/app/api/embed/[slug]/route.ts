import { and, changelogEntries, desc, eq, getDb, projects } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug.replace(/\.js$/, ""); // strip .js if present
  const db = getDb();

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      primaryColor: projects.primaryColor,
    })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!project) {
    return new NextResponse("// ChangelogKit: project not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const entries = await db
    .select({
      id: changelogEntries.id,
      title: changelogEntries.title,
      category: changelogEntries.category,
      publishedAt: changelogEntries.publishedAt,
    })
    .from(changelogEntries)
    .where(
      and(
        eq(changelogEntries.projectId, project.id),
        eq(changelogEntries.status, "published")
      )
    )
    .orderBy(desc(changelogEntries.publishedAt))
    .limit(5);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://changelogkit.threestack.io";
  const color = project.primaryColor;
  const projectName = project.name.replace(/'/g, "\\'");

  const entriesJson = JSON.stringify(
    entries.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      publishedAt: e.publishedAt?.toISOString() ?? null,
      url: `${appUrl}/p/${slug}#entry-${e.id}`,
    }))
  );

  const js = `(function(){
  'use strict';
  var SLUG='${slug}';
  var COLOR='${color}';
  var PROJECT='${projectName}';
  var LS_KEY='ck_read_'+SLUG;
  var ENTRIES=${entriesJson};

  function getReadIds(){try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]');}catch(e){return[];}}
  function setReadIds(ids){try{localStorage.setItem(LS_KEY,JSON.stringify(ids));}catch(e){}}

  function getUnreadCount(){
    var read=getReadIds();
    return ENTRIES.filter(function(e){return read.indexOf(e.id)===-1;}).length;
  }

  function injectStyles(){
    if(document.getElementById('ck-styles'))return;
    var s=document.createElement('style');
    s.id='ck-styles';
    s.textContent=[
      '#ck-btn{position:fixed;bottom:24px;right:24px;z-index:9999;background:'+COLOR+';color:#fff;border:none;border-radius:50px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;}',
      '#ck-badge{background:#ef4444;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;}',
      '#ck-panel{position:fixed;bottom:80px;right:24px;z-index:9998;width:340px;max-height:480px;background:#1f2937;border:1px solid #374151;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;display:none;font-family:system-ui,sans-serif;}',
      '#ck-header{padding:16px 20px;border-bottom:1px solid #374151;display:flex;justify-content:space-between;align-items:center;}',
      '#ck-header h3{margin:0;color:#f9fafb;font-size:15px;}',
      '#ck-close{background:none;border:none;color:#9ca3af;cursor:pointer;font-size:20px;padding:0;line-height:1;}',
      '#ck-list{overflow-y:auto;max-height:400px;}',
      '.ck-entry{padding:14px 20px;border-bottom:1px solid #374151;cursor:pointer;text-decoration:none;display:block;color:inherit;}',
      '.ck-entry:hover{background:#374151;}',
      '.ck-entry-title{font-size:14px;color:#f9fafb;font-weight:500;margin:0 0 4px;}',
      '.ck-entry-meta{display:flex;gap:8px;align-items:center;}',
      '.ck-cat{font-size:11px;padding:2px 8px;border-radius:100px;font-weight:600;text-transform:uppercase;}',
      '.ck-date{font-size:12px;color:#9ca3af;}',
      '.ck-empty{padding:32px 20px;text-align:center;color:#9ca3af;font-size:14px;}',
      '#ck-panel.open{display:block;}',
    ].join('');
    document.head.appendChild(s);
  }

  function catColor(cat){
    var m={feature:''+COLOR,fix:'#ef4444',improvement:'#f59e0b',breaking:'#dc2626',other:'#6b7280'};
    return m[cat]||'#6b7280';
  }

  function formatDate(iso){
    if(!iso)return'';
    try{return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}catch(e){return'';}
  }

  function render(){
    injectStyles();
    var unread=getUnreadCount();

    var btn=document.createElement('button');
    btn.id='ck-btn';
    btn.innerHTML='<span>What\\'s New</span>'+(unread>0?'<span id="ck-badge">'+unread+'</span>':'');

    var panel=document.createElement('div');
    panel.id='ck-panel';

    var header=document.createElement('div');
    header.id='ck-header';
    header.innerHTML='<h3>'+PROJECT+' Updates</h3><button id="ck-close">&times;</button>';

    var list=document.createElement('div');
    list.id='ck-list';

    if(!ENTRIES.length){
      list.innerHTML='<div class="ck-empty">No updates yet 🎉</div>';
    } else {
      ENTRIES.forEach(function(e){
        var a=document.createElement('a');
        a.className='ck-entry';
        a.href=e.url;
        a.target='_blank';
        a.rel='noopener';
        a.innerHTML='<div class="ck-entry-title">'+e.title+'</div>'+
          '<div class="ck-entry-meta">'+
            '<span class="ck-cat" style="background:'+catColor(e.category)+';color:#fff">'+e.category+'</span>'+
            '<span class="ck-date">'+formatDate(e.publishedAt)+'</span>'+
          '</div>';
        list.appendChild(a);
      });
    }

    panel.appendChild(header);
    panel.appendChild(list);
    document.body.appendChild(panel);
    document.body.appendChild(btn);

    btn.addEventListener('click',function(){
      panel.classList.toggle('open');
      if(panel.classList.contains('open')){
        // Mark all as read
        setReadIds(ENTRIES.map(function(e){return e.id;}));
        var badge=document.getElementById('ck-badge');
        if(badge)badge.remove();
      }
    });

    document.getElementById('ck-close').addEventListener('click',function(){
      panel.classList.remove('open');
    });

    document.addEventListener('click',function(ev){
      if(!panel.contains(ev.target)&&ev.target!==btn){
        panel.classList.remove('open');
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',render);
  } else {
    render();
  }
})();`;

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
