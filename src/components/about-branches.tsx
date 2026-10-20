'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {Locale} from '@/lib/content';
import type {StudioProfile} from '@/lib/profile';
import {useStudio} from '@/lib/store';
import {visualBridge} from '@/lib/visual-bridge';
const words={
 en:{label:'THE ARTIST',role:'Independent VFX & motion artist.',bio:'Simulation, form, and the final frame. Three sides of one practice.',names:['Visual effects','3D & motion','Compositing'],notes:['Emission · turbulence · simulation','Wireframe · depth · rotation','Foreground · subject · background'],sample:'Sample artist identity'},
 fa:{label:'هنرمند',role:'هنرمند مستقل جلوه‌های بصری و موشن.',bio:'شبیه‌سازی، فرم و تصویر نهایی؛ سه وجه از یک نگاه.',names:['جلوه‌های بصری','سه‌بعدی و موشن','کامپوزیت'],notes:['انتشار · آشفتگی · شبیه‌سازی','وایرفریم · عمق · چرخش','پیش‌زمینه · سوژه · پس‌زمینه'],sample:'هویت نمونه هنرمند'},
};
function Study({index}:{index:number}){
 return <svg className={'branch-study study-'+index} viewBox="0 0 90 64" aria-hidden="true">
  {index===0?Array.from({length:9},(_,i)=><path key={i} d={'M 4 '+(10+i*5)+' C 28 '+(-15+i*5)+', 54 '+(78-i*4)+', 86 '+(10+i*5)} fill="none"/>):index===1?<g className="dimension-study"><path d="M45 5 76 23 76 44 45 61 14 44 14 23Z M14 23 45 40 76 23 M45 40V61 M45 5V26L14 44 M45 26 76 44" fill="none"/><path d="M23 18 54 36V56 M33 12 65 30V50 M14 30 45 48 76 30 M14 37 45 54 76 37" fill="none" opacity=".35"/></g>:<g className="layers-study"><rect x="8" y="8" width="48" height="32" fill="none"/><rect x="20" y="16" width="48" height="32" fill="none"/><rect x="32" y="24" width="48" height="32" fill="currentColor" fillOpacity=".06"/><path d="M38 48 49 35 58 44 65 38 75 49" fill="none"/></g>}
 </svg>;
}
export function AboutBranches({locale,profile,active}:{locale:Locale;profile:StudioProfile;active:boolean}){
 const t=words[locale],focus=useStudio(s=>s.craftFocus);
 const [selection,setSelection]=useState(-1);
 const selected=useRef(-1),hovered=useRef(-1);
 function publish(){useStudio.getState().setCraftFocus(hovered.current>=0?hovered.current:selected.current);}
 function select(i:number){selected.current=selected.current===i?-1:i;hovered.current=-1;setSelection(selected.current);publish();}
 useEffect(()=>{if(active)publish();else useStudio.getState().setCraftFocus(-1);},[active]);

 const root=useRef<HTMLDivElement>(null);
 const paths=useRef<(SVGPathElement|null)[]>([]);
 useLayoutEffect(()=>{
  if(!active||!root.current)return;
  const host=root.current;
  const scroller=host.parentElement;
  let bounds={x:0,y:0};
  let ends:{x:number;y:number}[]=[];
  let lastX=-999,lastY=-999;
  const draw=(x:number,y:number)=>{
   const sx=x-bounds.x,sy=y-bounds.y;
   if(Math.abs(sx-lastX)<.3&&Math.abs(sy-lastY)<.3)return;
   lastX=sx;lastY=sy;
   paths.current.forEach((path,i)=>{
    const end=ends[i];if(!path||!end)return;
    const dx=end.x-sx;
    const bend=Math.abs(dx)<110?85:dx*.52;
    path.setAttribute('d', 'M '+sx+' '+sy+' C '+(sx+bend)+' '+(sy+26)+', '+(end.x-bend*.55)+' '+end.y+', '+end.x+' '+end.y);
   });
   host.style.setProperty('--origin-x',sx+'px');host.style.setProperty('--origin-y',sy+'px');
  };
  const measure=()=>{
   const rect=host.getBoundingClientRect();bounds={x:rect.x,y:rect.y};
   ends=Array.from(host.querySelectorAll<HTMLElement>('.branch-anchor')).map(node=>{const r=node.getBoundingClientRect();return {x:r.x+r.width/2-rect.x,y:r.y+r.height/2-rect.y};});
   lastX=-999;draw(visualBridge.x||rect.x+rect.width*.55,visualBridge.y||rect.y+rect.height*.48);
  };
  const resize=new ResizeObserver(measure);resize.observe(host);
  host.querySelectorAll('.craft-branch').forEach(node=>resize.observe(node));
  visualBridge.onProject=draw;
  window.addEventListener('resize',measure);scroller?.addEventListener('scroll',measure,{passive:true});
  measure();
  return ()=>{resize.disconnect();window.removeEventListener('resize',measure);scroller?.removeEventListener('scroll',measure);if(visualBridge.onProject===draw)visualBridge.onProject=null;};
 },[active,locale]);
 return <div ref={root} className="artist-constellation">
  <div className="artist-caption"><p className="eyebrow">{t.label}</p><h1 id="about-title" tabIndex={-1}>{locale==='en'?profile.name_en:profile.name_fa}</h1><p className="artist-role">{t.role}</p><p className="artist-statement">{t.bio}</p>{profile.is_demo&&<small>{t.sample}</small>}<p className="branch-help"><span className="pointer-copy">{locale==='en'?'Hover to explore · click to keep an effect':'برای کشف حرکت کنید · برای نگه‌داشتن کلیک کنید'}</span><span className="touch-copy">{locale==='en'?'Tap a discipline to explore. Tap again to reset.':'برای دیدن جلوه روی یک شاخه بزنید؛ دوباره بزنید تا بازنشانی شود.'}</span></p></div>
  <svg className="craft-connections" aria-hidden="true">{[0,1,2].map(i=><path key={i} ref={node=>{paths.current[i]=node;}} className={focus===i?'is-selected':''}/>)}</svg>
  <span className="craft-source" aria-hidden="true"/>
  {t.names.map((name,i)=><button key={name} className={'craft-branch branch-'+i+(focus===i?' is-selected':'')} aria-pressed={selection===i}
   onPointerEnter={event=>{if(event.pointerType==='mouse'){hovered.current=i;publish();}}}
   onPointerLeave={event=>{if(event.pointerType==='mouse'){hovered.current=-1;publish();}}}
   onFocus={event=>{if(event.currentTarget.matches(':focus-visible')){hovered.current=i;publish();}}}
   onBlur={()=>{hovered.current=-1;publish();}} onClick={()=>select(i)}>
   <span className="branch-anchor" aria-hidden="true"/><span className="branch-number">0{i+1}</span><span className="branch-copy"><strong>{name}</strong><small>{t.notes[i]}</small></span><Study index={i}/>
  </button>)}
 </div>;
}
