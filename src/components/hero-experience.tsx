'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {sectionHref} from '@/lib/routes';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type PointerEvent} from 'react';
import {studies,type Locale} from '@/lib/content';
import {queueParticlePulse,visualBridge} from '@/lib/visual-bridge';
import {useStudio} from '@/lib/store';
import {useParticleMap} from './use-particle-map';
import type {ImageInteraction,PreviewBounds} from './image-particles';

const ParticleImages=dynamic(()=>import('./image-particles'),{ssr:false});
const artwork=studies[0];

export function HeroExperience({locale,active}:{locale:Locale;active:boolean}){
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 const root=useRef<HTMLDivElement>(null),art=useRef<HTMLButtonElement>(null);
 const bounds=useRef<PreviewBounds[]>([]);
 const interactions=useMemo(()=>[{current:{x:30,y:30,strength:0,hovered:false,tap:0} as ImageInteraction}],[]);
 const field=visualBridge.images.hero;
 const travelling=useStudio(s=>s.transitioning);
 useParticleMap(artwork.preview,active,field);
 useEffect(()=>{
  field.active=active;field.mode=0;field.detailReady=active&&(ready||failed);
  useStudio.getState().pulsePortal();
 },[active,ready,failed,field]);
 useEffect(()=>{
  if(!active){setReady(false);setFailed(false);interactions[0].current={x:30,y:30,strength:0,hovered:false,tap:0};}
 },[active,interactions]);
 useLayoutEffect(()=>{
  if(!active||!root.current||!art.current)return;
  const host=root.current,node=art.current;
  const measure=()=>{
   const r=host.getBoundingClientRect(),a=node.getBoundingClientRect();
   field.rect={x:a.x,y:a.y,width:a.width,height:a.height};
   bounds.current=[{x:a.x-r.x,y:a.y-r.y,width:a.width,height:a.height,alpha:1}];
   useStudio.getState().pulsePortal();
  };
  const observer=new ResizeObserver(measure);observer.observe(host);observer.observe(node);
  window.addEventListener('resize',measure);measure();
  return ()=>{observer.disconnect();window.removeEventListener('resize',measure);};
 },[active,locale,field]);
 const status=useCallback((value:boolean)=>{setReady(value);setFailed(!value);},[]);
 const sync=useCallback(()=>{},[]);
 function point(event:PointerEvent<HTMLButtonElement>){
  const r=event.currentTarget.getBoundingClientRect(),value=interactions[0].current;
  value.x=(event.clientX-r.left)/r.width*2-1;value.y=1-(event.clientY-r.top)/r.height*2;
  value.strength=event.pointerType==='mouse'?.2:.45;value.hovered=event.pointerType==='mouse';
 }
 function ripple(event?:PointerEvent<HTMLButtonElement>){
  if(event)point(event);
  const r=art.current?.getBoundingClientRect();if(!r)return;
  const x=event?.clientX??r.x+r.width/2,y=event?.clientY??r.y+r.height/2;
  const value=interactions[0].current;
  if(!event){value.x=0;value.y=0;}
  value.tap=((value.tap||0)+1)%1000000;value.strength=1;
  queueParticlePulse((x/window.innerWidth*2-1)*(locale==='fa'?-1:1),1-y/window.innerHeight*2);
  useStudio.getState().pulsePortal();
 }
 return <div className="hero-experience" ref={root}>
  <div className="hero-intro">
   <p className="eyebrow">{locale==='en'?'INDEPENDENT VFX / MOTION ARTIST':'هنرمند مستقل جلوه‌های بصری و موشن'}</p>
   <h1 id="landing-title" tabIndex={-1}>{locale==='en'?'Unreal.':'فراتر از واقعیت.'}<br/><span>{locale==='en'?'By design.':'با طراحی.'}</span></h1>
   <p className="hero-description">{locale==='en'?'Visual effects, 3D motion, and imagined worlds. Made to move you.':'جلوه‌های بصری، موشن سه‌بعدی و جهان‌های خیالی؛ برای خلق یک حس تازه.'}</p>
   <Link className="hero-cta" href={sectionHref(locale,'about')} scroll={false} aria-disabled={travelling} onClick={event=>{if(travelling)event.preventDefault();}}><span>{locale==='en'?'About the artist':'درباره هنرمند'}</span><span className="hero-cta-arrow" aria-hidden="true">↗</span></Link>
   <p className="hero-discover"><span aria-hidden="true">↘</span>{locale==='en'?'Touch the artwork. Then step inside.':'اثر را لمس کنید؛ سپس وارد پورتال شوید.'}</p>
  </div>
  {active&&!failed&&<ParticleImages sources={[artwork.image]} channel="hero" bounds={bounds} interactions={interactions} onReady={status} onTransition={sync}/>}
  <button ref={art} className="hero-art" aria-label={locale==='en'?'Touch the artwork to send a wave through its particles':'برای ایجاد موج در ذرات، اثر را لمس کنید'} onPointerMove={point} onPointerLeave={()=>{interactions[0].current.hovered=false;interactions[0].current.strength=0;}} onPointerDown={event=>{if(event.button===0)ripple(event);}} onClick={event=>{if(event.detail===0)ripple();}}>
   {failed&&<img className="hero-static" src={artwork.image} alt={locale==='en'?'An abstract particle composition':'ترکیبی انتزاعی از ذرات'} width={1600} height={1100}/>}
   <span className="hero-art-corner corner-a" aria-hidden="true"/><span className="hero-art-corner corner-b" aria-hidden="true"/>
   <span className="hero-art-instruction"><i aria-hidden="true">+</i>{locale==='en'?'Click or tap to send a wave':'برای ایجاد موج، کلیک یا لمس کنید'}</span>
  </button>
  <noscript><img className="hero-static hero-noscript" src={artwork.image} alt={locale==='en'?'An abstract particle composition':'ترکیبی انتزاعی از ذرات'} width={1600} height={1100}/></noscript>
 </div>;
}
