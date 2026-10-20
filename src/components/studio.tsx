'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {copy,type Locale} from '@/lib/content';
import {experienceCopy} from '@/lib/experience-copy';
import {defaultProfile,type StudioProfile} from '@/lib/profile';
import {chapters,motionEnabled,useStudio,type Chapter} from '@/lib/store';
import {sectionHref} from '@/lib/routes';
import {visualBridge} from '@/lib/visual-bridge';
import {useJourney} from './use-journey';
import {Modal} from './modal';
import {BriefForm} from './brief-form';
import {AssistantChat} from './assistant-chat';
import {AboutBranches} from './about-branches';
import {ProjectViewer} from './project-viewer';
import {WorkGallery} from './work-gallery';
import {HeroExperience} from './hero-experience';
import {SectionWayfinder} from './section-wayfinder';
import '@/app/experience-refinement.css';

const PortalScene=dynamic(()=>import('./particle-scene'),{ssr:false});
export function Studio({locale,routeChapter='landing',children}:{locale:Locale;routeChapter?:Chapter;children?:ReactNode}){
 const t=experienceCopy[locale],router=useRouter();
 const storedChapter=useStudio(s=>s.chapter),transitioning=useStudio(s=>s.transitioning),enabled=useStudio(motionEnabled),quality=useStudio(s=>s.quality);
 const travelPhase=useStudio(s=>s.travelPhase);
 const panel=useRef<HTMLDivElement>(null);
 const hydrated=useJourney(panel,routeChapter),chapter=hydrated?storedChapter:routeChapter;
 const [profile,setProfile]=useState<StudioProfile>(defaultProfile);
 const [detail,setDetail]=useState<number|null>(null),[detailFrame,setDetailFrame]=useState(0),[brief,setBrief]=useState(false);
 useEffect(()=>{
  useStudio.getState().setLocale(locale);
  const abort=new AbortController();
  fetch('/api/profile',{signal:abort.signal}).then(res=>res.ok?res.json():null).then(data=>{if(data?.profile&&!abort.signal.aborted)setProfile(data.profile);}).catch(()=>{});
  return ()=>{abort.abort();useStudio.getState().setOverlayOpen(false);};
 },[locale]);
 useEffect(()=>{setDetail(null);setBrief(false);},[routeChapter]);
 useEffect(()=>{
  useStudio.getState().setOverlayOpen(detail!==null||brief);
  return ()=>useStudio.getState().setOverlayOpen(false);
 },[detail,brief]);
 useLayoutEffect(()=>{
  if(chapter!=='contact')return;
  const node=panel.current?.querySelector<HTMLElement>('.contact-particle-stage');
  if(!node)return;
  const measure=()=>{const r=node.getBoundingClientRect();if(r.width>1&&r.height>1){Object.assign(visualBridge.contactRect,{x:r.x,y:r.y,width:r.width,height:r.height});useStudio.getState().pulsePortal();}};
  const observer=new ResizeObserver(measure);observer.observe(node);measure();
  const scroller=node.closest('.contact-panel');
  scroller?.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);
  return ()=>{observer.disconnect();scroller?.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);};
 },[chapter]);
 const step=chapters.indexOf(routeChapter);
 return <div className={'experience chapter-'+chapter} data-motion={enabled?'on':'off'} data-travelling={transitioning} data-travel-phase={travelPhase}>
  <a className="skip-link" href="#chapter-content">{locale==='en'?'Skip to content':'رفتن به محتوا'}</a>
  <div className="world-backdrop" aria-hidden="true"><div className="portal-fallback"/><div className="grain"/></div>
  <PortalScene/><div className="world-shade" aria-hidden="true"/>
  <header className="experience-header">
   <Link className="brand arman-wordmark" href={sectionHref(locale,'landing')} scroll={false} aria-label={locale==='en'?'Arman Mehr — Home':'آرمان مهر — آغاز'} dir="ltr"><span className="brand-name">Arman <b>Mehr</b><i aria-hidden="true"/></span><small>VISUAL EFFECTS & MOTION</small></Link>
   <nav className="chapter-navigation" aria-label={locale==='en'?'Main navigation':'پیمایش اصلی'}>{chapters.map((item,i)=><Link key={item} href={sectionHref(locale,item)} scroll={false} aria-current={routeChapter===item?'page':undefined} data-pending={transitioning&&routeChapter===item&&chapter!==item}><span className="phase-index" aria-hidden="true">0{i}</span><span>{t.nav[i]}</span></Link>)}</nav>
   <div className="header-tools"><a className="journal-link" href={locale==='en'?'/blog/':'/fa/blog/'}>{t.journal} ↗</a><a className="locale-switch" href={sectionHref(locale==='en'?'fa':'en',routeChapter)} hrefLang={locale==='en'?'fa':'en'}>{locale==='en'?'فارسی':'EN'}</a></div>

  </header>
  <main className="experience-main">
   <div ref={panel} className="chapter-content" id="chapter-content" aria-busy={transitioning} inert={transitioning}>
    <section className="landing-panel" hidden={chapter!=='landing'} aria-labelledby="landing-title"><HeroExperience locale={locale} active={chapter==='landing'}/></section>
    <section className="about-panel" hidden={chapter!=='about'} aria-labelledby="about-title"><AboutBranches locale={locale} profile={profile} active={chapter==='about'}/></section>
    <WorkGallery locale={locale} active={chapter==='gallery'} onOpen={(project,frame)=>{setDetailFrame(frame);setDetail(project);}}/>
    <section className="contact-panel" hidden={chapter!=='contact'} aria-labelledby="contact-title">
     <div className="contact-intro"><p className="eyebrow">{locale==='en'?'03 / START A CONVERSATION':'۰۳ / آغاز یک گفتگو'}</p><h1 id="contact-title" tabIndex={-1}>{t.contactTitle[0]}<br/><span>{t.contactTitle[1]}</span></h1><p>{t.contactIntro}</p><div className="contact-particle-stage" aria-hidden="true"><span>{locale==='en'?'A NEW SIGNAL. A NEW POSSIBILITY.':'یک سیگنال تازه. یک امکان تازه.'}</span></div><button className="enter-button" onClick={()=>setBrief(true)}>{t.brief}<span>↗</span></button><div className="contact-signature"><span className="contact-signature-mark" aria-hidden="true">↗</span><div><strong>{locale==='en'?profile.name_en:profile.name_fa}</strong><small>{locale==='en'?'Independent VFX & motion artist':'هنرمند مستقل جلوه‌های بصری و موشن'}</small></div></div></div>
     <AssistantChat locale={locale} profile={profile} onBrief={()=>setBrief(true)}/>
    </section>
   </div>
   <SectionWayfinder locale={locale} chapter={chapter}/>
  </main>
  <div className="experience-bottom">
   <footer className="experience-footer"><div className="scene-controls"><button aria-label={enabled?t.motionOn:t.motionOff} aria-pressed={enabled} onClick={()=>useStudio.getState().setMotion(enabled?'off':'on')}><span aria-hidden="true">{enabled?'Ⅱ':'▷'}</span> {locale==='en'?'Motion':'حرکت'}</button><button aria-label={quality==='eco'?t.full:t.eco} aria-pressed={quality==='eco'} onClick={()=>useStudio.getState().setQuality(quality==='eco'?'auto':'eco')}>{quality==='eco'?'ECO':'HQ'}</button></div><span className="canvas-status">{transitioning?t.transition+' '+t.nav[step]:(locale==='en'?'SECTION':'بخش')+' 0'+step+' / 03'}</span><span className="site-credit">{t.credit} <strong>REDDPIXEL</strong></span></footer>
  </div>
  <p className="sr-only" role="status">{transitioning?t.transition+' '+t.nav[step]:t.nav[chapters.indexOf(chapter)]}</p>
  {detail!==null&&<ProjectViewer project={detail} initialFrame={detailFrame} locale={locale} onClose={()=>setDetail(null)} onContact={()=>{setDetail(null);router.push(sectionHref(locale,'contact'),{scroll:false});}}/>}
  {brief&&<Modal title={copy[locale].dialogTitle} closeLabel={t.close} onClose={()=>setBrief(false)}><BriefForm locale={locale} recipient={profile.email||undefined}/></Modal>}
  {children}
 </div>;
}
