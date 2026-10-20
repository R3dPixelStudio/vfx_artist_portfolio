'use client';
import { useEffect, useRef, useState } from 'react';
import { defaultProfile, type StudioProfile } from '@/lib/profile';
import { renderMarkdown } from '@/lib/markdown';
type Post = { id?: string; slug: string; title_en: string; title_fa: string; excerpt_en: string; excerpt_fa: string; body_en: string; body_fa: string; tags: string; status: 'draft' | 'published'; revision?: number; published_at?: string | null };
const blank = (): Post => ({ slug:'', title_en:'', title_fa:'', excerpt_en:'', excerpt_fa:'', body_en:'', body_fa:'', tags:'', status:'draft' });
const words = {
  en: { title:'Studio desk', login:'Owner sign-in', password:'Password', signIn:'Sign in', articles:'Journal', profile:'Profile & contact', logout:'Sign out', new:'New note', save:'Save draft', publish:'Publish note', update:'Update published note', unpublish:'Unpublish', preview:'Preview', edit:'Write', english:'English', persian:'Persian', name:'Name', expertise:'Verified expertise and project information', contacts:'Contact links', saveProfile:'Save profile', sample:'This is a sample identity', empty:'No notes yet. Start your first draft.', loading:'Loading…', unsaved:'Discard unsaved changes?', saved:'Saved.', draft:'Draft', published:'Published', next:'Older', previous:'Newer', site:'View experience', note:'The assistant uses only this profile. Add approved expertise, process, and contact details. Keep API keys in Cloudflare secrets.', markdown:'Markdown: ## headings, **bold**, lists, links and fenced code. Raw HTML is displayed as text.' },
  fa: { title:'میز کار استودیو', login:'ورود صاحب سایت', password:'رمز عبور', signIn:'ورود', articles:'ژورنال', profile:'پروفایل و ارتباط', logout:'خروج', new:'یادداشت تازه', save:'ذخیره پیش‌نویس', publish:'انتشار یادداشت', update:'به‌روزرسانی یادداشت', unpublish:'لغو انتشار', preview:'پیش‌نمایش', edit:'نوشتن', english:'انگلیسی', persian:'فارسی', name:'نام', expertise:'تخصص تأییدشده و اطلاعات پروژه', contacts:'راه‌های ارتباط', saveProfile:'ذخیره پروفایل', sample:'این یک هویت نمونه است', empty:'هنوز یادداشتی ندارید. اولین پیش‌نویس را بسازید.', loading:'در حال بارگذاری…', unsaved:'تغییرات ذخیره‌نشده کنار گذاشته شوند؟', saved:'ذخیره شد.', draft:'پیش‌نویس', published:'منتشرشده', next:'قدیمی‌تر', previous:'جدیدتر', site:'مشاهده تجربه', note:'دستیار فقط از این پروفایل استفاده می‌کند. تخصص، فرایند و راه‌های ارتباط تأییدشده را وارد کنید. کلیدهای API فقط در بخش Secrets کلادفلر قرار می‌گیرند.', markdown:'مارک‌داون: عنوان با ##، متن پررنگ با **، فهرست، لینک و کد. HTML خام به‌صورت متن نمایش داده می‌شود.' },
};
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(path, { ...options, signal:options.signal || AbortSignal.timeout(18000), credentials:'same-origin', headers:{ 'Content-Type':'application/json', ...options.headers } });
  const data = await response.json().catch(() => ({ error:'The service is unavailable. Use the Cloudflare preview for admin and D1.' }));
  if (!response.ok) { const error = new Error(data.error || 'Request failed.') as Error & { status:number }; error.status = response.status; throw error; }
  return data;
}
export function AdminPanel() {
  const [locale, setLocale] = useState<'en'|'fa'>('en'); const t = words[locale];
  const [auth, setAuth] = useState<'loading'|'in'|'out'>('loading');
  const [password, setPassword] = useState(''); const [tab, setTab] = useState<'posts'|'profile'>('posts');
  const [posts, setPosts] = useState<Post[]>([]); const [page, setPage] = useState(1); const [total,setTotal] = useState(0);
  const [post,setPost] = useState<Post>(blank); const [profile,setProfile] = useState<StudioProfile>(defaultProfile);
  const [lang,setLang] = useState<'en'|'fa'>('en'); const [preview,setPreview] = useState(false);
  const [busy,setBusy] = useState(false); const [notice,setNotice] = useState(''); const [error,setError] = useState('');
  const [dirty,setDirty] = useState(false); const locked = useRef(false); const alive = useRef(true);
  const lifetime = useRef<AbortController | null>(null);
  const [loadingData,setLoadingData] = useState(false);
  function ownedRequest(path:string, options:RequestInit = {}) {
    const signals = [AbortSignal.timeout(18000)];
    if(options.signal) signals.push(options.signal);
    if(lifetime.current) signals.push(lifetime.current.signal);
    return request(path,{...options,signal:AbortSignal.any(signals)});
  }
  useEffect(() => {
    alive.current = true;
    const abort = new AbortController(); lifetime.current = abort;
    ownedRequest('/api/auth/session',{ signal:abort.signal }).then(() => { if (alive.current) setAuth('in'); }).catch((e) => { if (alive.current && !abort.signal.aborted) { setAuth('out'); if (e.status !== 401) setError(e.message); } });
    return () => { alive.current = false; abort.abort(); };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event:BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload',warn); return () => window.removeEventListener('beforeunload',warn);
  }, [dirty]);
  useEffect(() => {
    if (auth !== 'in') return;
    setLoadingData(true);
    const abort = new AbortController();
    Promise.all([ownedRequest('/api/admin/posts?page=' + page,{signal:abort.signal}),ownedRequest('/api/admin/profile',{signal:abort.signal})]).then(([a,b]) => {
      if (!abort.signal.aborted) { setPosts(a.posts); setTotal(a.total); setProfile(b.profile); }
    }).catch((e) => { if (!abort.signal.aborted) fail(e); }).finally(()=>{if(!abort.signal.aborted)setLoadingData(false);});
    return () => abort.abort();
  }, [auth,page]);
  function fail(e: Error & {status?:number}) { if (!alive.current) return; setError(e.message); if(e.status===401) setAuth('out'); }
  async function action(fn:() => Promise<void>) {
    if (locked.current) return; locked.current=true; setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch(e) { fail(e as Error); } finally { locked.current=false; if(alive.current) setBusy(false); }
  }
  function mayDiscard() { return !dirty || window.confirm(t.unsaved); }
  async function refresh() { const data=await ownedRequest('/api/admin/posts?page='+page); if(alive.current){setPosts(data.posts);setTotal(data.total);} }
  function updatePost(key:keyof Post,value:string) { setPost((old)=>({...old,[key]:value}));setDirty(true);setNotice(''); }
  async function save(status:'draft'|'published') {
    await action(async()=>{ const result=await ownedRequest('/api/admin/posts'+(post.id?'/'+post.id:''),{method:post.id?'PUT':'POST',body:JSON.stringify({...post,status})});
      if(alive.current){setPost(result.post);setDirty(false);setNotice(t.saved);} await refresh(); });
  }
  if(auth==='loading') return <main className="admin-login"><p>{t.loading}</p></main>;
  if(auth==='out') return <main className="admin-login" dir={locale==='fa'?'rtl':'ltr'}>
    <a href="/" className="admin-brand">Arman Mehr</a><div className="login-card"><p className="eyebrow">PRIVATE / STUDIO DESK</p><h1>{t.login}</h1><form onSubmit={(event)=>{event.preventDefault();void action(async()=>{await ownedRequest('/api/auth/login',{method:'POST',body:JSON.stringify({password})});setPassword('');if(alive.current)setAuth('in');});}}><label>{t.password}<input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required maxLength={256}/></label><button className="button button-orange" disabled={busy}>{busy?t.loading:t.signIn} ↗</button></form>{error&&<p role="alert" className="admin-error">{error}</p>}<button className="admin-locale" onClick={()=>setLocale(locale==='en'?'fa':'en')}>{locale==='en'?'فارسی':'English'}</button></div><a href="/">{t.site} ↗</a>
  </main>;
  return <div className="admin-shell" dir={locale==='fa'?'rtl':'ltr'}>
    <header className="admin-header"><a href="/" className="admin-brand">Arman Mehr <small>{t.title}</small></a><div><button onClick={()=>setLocale(locale==='en'?'fa':'en')}>{locale==='en'?'فارسی':'EN'}</button><a href="/blog/" target="_blank" rel="noreferrer">{t.articles} ↗</a><button disabled={busy} onClick={()=>{if(mayDiscard())void action(async()=>{await ownedRequest('/api/auth/logout',{method:'POST'});setAuth('out');setDirty(false);setPost(blank());setPassword('');});}}>{t.logout}</button></div></header>
    <nav className="admin-tabs"><button disabled={busy||loadingData} aria-current={tab==='posts'?'page':undefined} onClick={()=>{if(mayDiscard()){setTab('posts');setPost(blank());setDirty(false);void action(refresh);}}}>{t.articles}</button><button disabled={busy||loadingData} aria-current={tab==='profile'?'page':undefined} onClick={()=>{if(mayDiscard()){setTab('profile');setPost(blank());setDirty(false);void action(async()=>{const data=await ownedRequest('/api/admin/profile');setProfile(data.profile);});}}}>{t.profile}</button></nav>
    {(error||notice)&&<div className={error?'admin-error admin-banner':'admin-success admin-banner'} role={error?'alert':'status'}>{error||notice}</div>}
    {tab==='posts'?<main className="admin-workspace">
      <aside className="post-sidebar"><button className="new-note" disabled={busy} onClick={()=>{if(mayDiscard()){setPost(blank());setPreview(false);setDirty(false);setNotice('');setError('');}}}>+ {t.new}</button>{posts.length===0&&<p className="admin-muted">{t.empty}</p>}
        {posts.map((item)=><button key={item.id} className={item.id===post.id?'post-list-item selected':'post-list-item'} disabled={busy} onClick={()=>{if(mayDiscard())void action(async()=>{const data=await ownedRequest('/api/admin/posts/'+item.id);setPost(data.post);setDirty(false);setPreview(false);});}}><span>{item.status==='published'?t.published:t.draft}</span><strong>{locale==='fa'&&item.title_fa?item.title_fa:item.title_en}</strong><small>/{item.slug}</small></button>)}
        <div className="admin-pagination"><button disabled={page<=1||busy} onClick={()=>{if(mayDiscard()){setPost(blank());setDirty(false);setPage(page-1);}}}>{t.previous}</button><span>{page}</span><button disabled={page*20>=total||busy} onClick={()=>{if(mayDiscard()){setPost(blank());setDirty(false);setPage(page+1);}}}>{t.next}</button></div>
      </aside>
      <section className="post-editor"><fieldset className="editor-lock" disabled={busy||loadingData}><div className="editor-toolbar"><div><button aria-pressed={lang==='en'} onClick={()=>setLang('en')}>{t.english}</button><button aria-pressed={lang==='fa'} onClick={()=>setLang('fa')}>{t.persian}</button></div><button onClick={()=>setPreview(!preview)}>{preview?t.edit:t.preview}</button><span className="dirty-indicator">{dirty?'●':''} {post.status==='published'?t.published:t.draft}</span></div>
        <div className="post-editor-fields" dir={lang==='fa'?'rtl':'ltr'}>
          <label>{lang==='en'?'Title':'عنوان'}<input value={post['title_'+lang as 'title_en'|'title_fa']} onChange={(e)=>updatePost(('title_'+lang) as keyof Post,e.target.value)} maxLength={120}/></label>
          <label>{lang==='en'?'Search summary (meta description)':'خلاصه برای موتور جستجو'}<textarea rows={2} value={post['excerpt_'+lang as 'excerpt_en'|'excerpt_fa']} onChange={(e)=>updatePost(('excerpt_'+lang) as keyof Post,e.target.value)} maxLength={300}/></label>
          {preview?<div className="markdown-preview" dangerouslySetInnerHTML={{__html:renderMarkdown(post['body_'+lang as 'body_en'|'body_fa'])}}/>:<label>{lang==='en'?'Article':'متن یادداشت'}<textarea className="body-editor" rows={16} value={post['body_'+lang as 'body_en'|'body_fa']} onChange={(e)=>updatePost(('body_'+lang) as keyof Post,e.target.value)} maxLength={25000}/></label>}
          <p className="admin-muted">{t.markdown}</p>
        </div>
        <div className="editor-meta"><label>URL slug<input dir="ltr" value={post.slug} disabled={Boolean(post.published_at)} onChange={(e)=>updatePost('slug',e.target.value)} maxLength={100} placeholder="the-art-of-particle-light"/></label><label>{locale==='en'?'Tags, separated by commas':'برچسب‌ها، با کاما جدا شوند'}<input value={post.tags} onChange={(e)=>updatePost('tags',e.target.value)} maxLength={160}/></label></div>
        <div className="editor-actions"><button disabled={busy} className="button button-orange" onClick={()=>void save('published')}>{post.status==='published'?t.update:t.publish} ↗</button><button disabled={busy} className="button button-outline" onClick={()=>void save('draft')}>{post.status==='published'?t.unpublish:t.save}</button>{post.published_at&&post.status==='published'&&<a target="_blank" rel="noreferrer" href={'/blog/'+post.slug+'/'}>{t.preview} ↗</a>}</div>
      </fieldset></section>
    </main>:<main className="profile-editor"><h1>{t.profile}</h1><p className="admin-muted">{t.note}</p><form onSubmit={(event)=>{event.preventDefault();void action(async()=>{const data=await ownedRequest('/api/admin/profile',{method:'PUT',body:JSON.stringify(profile)});setProfile(data.profile);setDirty(false);setNotice(t.saved);});}}>
      <fieldset className="editor-lock" disabled={busy||loadingData}><div className="admin-form-grid">{(['en','fa'] as const).map((language)=><div key={language} dir={language==='fa'?'rtl':'ltr'}><label>{t.name} — {language.toUpperCase()}<input required maxLength={100} value={profile['name_'+language as 'name_en'|'name_fa']} onChange={(e)=>{setProfile({...profile,['name_'+language]:e.target.value});setDirty(true);}}/></label><label>{t.expertise} — {language.toUpperCase()}<textarea rows={8} maxLength={4000} value={profile['expertise_'+language as 'expertise_en'|'expertise_fa']} onChange={(e)=>{setProfile({...profile,['expertise_'+language]:e.target.value});setDirty(true);}}/></label></div>)}</div>
      <h2>{t.contacts}</h2><div className="admin-form-grid">{(['email','instagram','telegram','whatsapp'] as const).map((key)=><label key={key}>{key}<input dir="ltr" type={key==='email'?'email':'url'} maxLength={300} value={profile[key]} placeholder={key==='email'?'': 'https://'} onChange={(e)=>{setProfile({...profile,[key]:e.target.value});setDirty(true);}}/></label>)}</div>
      <label className="checkbox-label"><input type="checkbox" checked={profile.is_demo} onChange={(e)=>{setProfile({...profile,is_demo:e.target.checked});setDirty(true);}}/>{t.sample}</label><button className="button button-orange" disabled={busy}>{t.saveProfile}</button></fieldset>
    </form></main>}
  </div>;
}
