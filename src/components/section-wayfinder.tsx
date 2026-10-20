'use client';
import Link from 'next/link';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import type {Locale} from '@/lib/content';
import {experienceCopy} from '@/lib/experience-copy';
import {chapters,useStudio,type Chapter} from '@/lib/store';
import {sectionHref} from '@/lib/routes';

export function SectionWayfinder({locale,chapter}:{locale:Locale;chapter:Chapter}){
 const router=useRouter(),busy=useStudio(s=>s.transitioning),phase=useStudio(s=>s.travelPhase);
 const step=chapters.indexOf(chapter),next=chapters[(step+1)%chapters.length],previous=chapters[Math.max(0,step-1)],names=experienceCopy[locale].nav;
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||useStudio.getState().overlayOpen||useStudio.getState().transitioning)return;
   const target=event.target;
   if(target instanceof Element&&target.closest('input,textarea,select,button,a,[contenteditable=true],[role=dialog]'))return;
   const forward=locale==='en'?'ArrowRight':'ArrowLeft',back=locale==='en'?'ArrowLeft':'ArrowRight';
   if(event.key!==forward&&event.key!==back)return;
   if(event.key===back&&step===0)return;
   event.preventDefault();router.push(sectionHref(locale,event.key===forward?next:previous),{scroll:false});
  };
  window.addEventListener('keydown',key);
  return ()=>window.removeEventListener('keydown',key);
 },[locale,next,previous,step,router]);
 const status=phase==='forming'?(locale==='en'?'Reforming the portal':'در حال شکل‌گیری پورتال'):phase==='diving'?(locale==='en'?'Travelling through the portal':'در حال عبور از پورتال'):(locale==='en'?'Your next perspective':'نگاهی تازه در ادامه مسیر');
 if(step===0)return null;
 return <nav className="section-wayfinder" aria-label={locale==='en'?'Previous and next section':'بخش قبلی و بعدی'} data-busy={busy} data-phase={phase}>
  <div className="wayfinder-location"><span className="wayfinder-overline" role="status"><i aria-hidden="true"/>{status}</span><div className="wayfinder-progress" aria-label={locale==='en'?'Section '+(step+1)+' of 4':'بخش '+(step+1)+' از ۴'}><span>0{step}<small> / 03</small></span><div aria-hidden="true">{chapters.map((item,i)=><i key={item} className={i<=step?'is-reached':''}/>)}</div><p>{locale==='en'?'Use the buttons or ← → keys':'از دکمه‌ها یا کلیدهای جهت استفاده کنید'}</p></div></div>
  <div className="wayfinder-actions">
   {step>0&&<Link href={sectionHref(locale,previous)} scroll={false} className="wayfinder-back" aria-disabled={busy} onClick={event=>{if(busy)event.preventDefault();}}><span aria-hidden="true">←</span><span><small>{locale==='en'?'Previous section':'بخش قبلی'}</small><strong>{names[step-1]}</strong></span></Link>}
   <Link href={sectionHref(locale,next)} scroll={false} className="wayfinder-next" aria-disabled={busy} onClick={event=>{if(busy)event.preventDefault();}}><span><small>{busy?status:locale==='en'?(step===0?'ENTER THE PORTAL':'NEXT SECTION'):(step===0?'ورود به پورتال':'بخش بعدی')}</small><strong>{step===0?(locale==='en'?'About the artist':'درباره هنرمند'):names[(step+1)%chapters.length]}</strong></span><span className="wayfinder-arrow" aria-hidden="true">→</span></Link>
  </div>
 </nav>;
}
