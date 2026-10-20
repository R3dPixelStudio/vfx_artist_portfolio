'use client';
import {useEffect,useRef,useState} from 'react';
import {studies,type Locale} from '@/lib/content';
import {Modal} from './modal';
export function ProjectViewer({project,initialFrame,locale,onClose,onContact}:{project:number;initialFrame:number;locale:Locale;onClose:()=>void;onContact:()=>void}){
 const study=studies[project],fa=locale==='fa';
 const [frame,setFrame]=useState(initialFrame),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0});
 const stage=useRef<HTMLDivElement>(null),pointers=useRef(new Map<number,{x:number;y:number}>()),drag=useRef({x:0,y:0,px:0,py:0,distance:0,zoom:1});
 const clamp=(x:number,y:number,z=zoom)=>{const r=stage.current?.getBoundingClientRect();return {x:Math.max(-(r?.width||0)*(z-1)/2,Math.min((r?.width||0)*(z-1)/2,x)),y:Math.max(-(r?.height||0)*(z-1)/2,Math.min((r?.height||0)*(z-1)/2,y))};};
 function changeFrame(next:number){setFrame((next+study.images.length)%study.images.length);setZoom(1);setPan({x:0,y:0});pointers.current.clear();}
 function changeZoom(next:number){const value=Math.max(1,Math.min(3,next));setZoom(value);setPan(value===1?{x:0,y:0}:clamp(pan.x,pan.y,value));}
 useEffect(()=>{const node=stage.current;if(!node)return;const observer=new ResizeObserver(()=>setPan({x:0,y:0}));observer.observe(node);return ()=>observer.disconnect();},[]);
 return <Modal title={study.title[locale]} closeLabel={fa?'بستن':'Close viewer'} onClose={onClose} fullscreen>
  <div className="project-viewer" onKeyDown={event=>{if((event.target as HTMLElement).tagName==='INPUT')return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();changeFrame(frame+(event.key==='ArrowRight'?1:-1)*(fa?-1:1));}}}>
   <header className="viewer-header"><div><span>{fa?'مطالعه مفهومی مستقل':'INDEPENDENT CONCEPT STUDY'}</span><h2>{study.title[locale]}</h2></div><div className="viewer-zoom"><button onClick={()=>changeZoom(zoom-.5)} aria-label={fa?'کوچک‌نمایی':'Zoom out'}>−</button><output>{Math.round(zoom*100)}%</output><button onClick={()=>changeZoom(zoom+.5)} aria-label={fa?'بزرگ‌نمایی':'Zoom in'}>+</button><button onClick={()=>changeZoom(1)}>{fa?'اندازه مناسب':'Fit'}</button></div></header>
   <div ref={stage} className="viewer-image" data-zoomed={zoom>1} onDoubleClick={()=>changeZoom(zoom>1?1:2)}
    onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});drag.current={x:event.clientX,y:event.clientY,px:pan.x,py:pan.y,distance:0,zoom};if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];drag.current.distance=Math.hypot(a.x-b.x,a.y-b.y);}}}
    onPointerMove={event=>{if(!pointers.current.has(event.pointerId))return;pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];if(drag.current.distance>0)changeZoom(drag.current.zoom*Math.hypot(a.x-b.x,a.y-b.y)/drag.current.distance);}else if(zoom>1)setPan(clamp(drag.current.px+event.clientX-drag.current.x,drag.current.py+event.clientY-drag.current.y));}}
    onPointerUp={event=>{pointers.current.delete(event.pointerId);if(pointers.current.size===1){const a=[...pointers.current.values()][0];Object.assign(drag.current,{x:a.x,y:a.y,px:pan.x,py:pan.y});}}} onPointerCancel={()=>pointers.current.clear()}>
    <img src={study.images[frame]} alt={study.title[locale]+' — '+(fa?'تصویر':'frame')+' '+(frame+1)} draggable={false} style={{transform:'translate('+pan.x+'px,'+pan.y+'px) scale('+zoom+')'}}/>
    <span className="viewer-image-help">{fa?'دو ضربه برای زوم · کشیدن برای حرکت':'Double tap to zoom · drag to inspect'}</span>
   </div>
   <footer className="viewer-footer"><nav aria-label={fa?'تصاویر پروژه':'Project images'}>{study.images.map((src,i)=><button key={src} aria-pressed={i===frame} onClick={()=>changeFrame(i)} aria-label={(fa?'تصویر ':'Frame ')+(i+1)}><img src={src} alt="" width={120} height={84}/><span>0{i+1}</span></button>)}</nav><p>{study.category[locale]}<small>{fa?'تصویر':'FRAME'} 0{frame+1} / 0{study.images.length}</small></p><button className="viewer-contact" onClick={onContact}>{fa?'شروع یک پروژه':'Start a project'} ↗</button></footer>
  </div>
 </Modal>;
}
