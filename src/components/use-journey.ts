'use client';
import {useLayoutEffect,useRef,useState,type RefObject} from 'react';
import gsap from 'gsap';
import {destinations,journey,motionEnabled,useStudio,type Chapter} from '@/lib/store';
import {visualBridge} from '@/lib/visual-bridge';

export function useJourney(panel:RefObject<HTMLDivElement|null>,destination:Chapter){
 const firstChapter=useRef(destination),focusPending=useRef(false);
 const [hydrated,setHydrated]=useState(false);
 const enabled=useStudio(motionEnabled),transitioning=useStudio(s=>s.transitioning);
 useLayoutEffect(()=>{
  const initial=firstChapter.current;
  Object.assign(journey,destinations[initial],{rush:0});
  useStudio.setState({chapter:initial,destination:initial,transitioning:false,travelPhase:'idle'});
  setHydrated(true);
  return ()=>{
   Object.assign(journey,destinations.landing,{rush:0});
   useStudio.setState({chapter:'landing',destination:'landing',transitioning:false,travelPhase:'idle',overlayOpen:false,portalHovered:false});
  };
 },[]);
 useLayoutEffect(()=>{
  if(!transitioning&&focusPending.current){
   focusPending.current=false;
   panel.current?.querySelector<HTMLElement>('section:not([hidden]) h1,section:not([hidden]) h2')?.focus({preventScroll:true});
  }
 },[transitioning,panel]);
 useLayoutEffect(()=>{
  const state=useStudio.getState();
  if(state.destination!==destination)state.navigate(destination);
  const heroText=panel.current?.querySelectorAll<HTMLElement>('.hero-intro > *, .hero-art-instruction, .hero-art-corner')??[];
  const complete=()=>{
   focusPending.current=true;
   gsap.set(heroText,{clearProps:'opacity,visibility,transform'});
   useStudio.setState({transitioning:false,travelPhase:'idle'});
  };
  if(state.chapter===destination&&Math.abs(journey.depth-destinations[destination].depth)<.01){
   if(!state.transitioning)return;
   useStudio.setState({travelPhase:'idle'});
   const restore=gsap.timeline({onComplete:complete});
   restore.to(journey,{...destinations[destination],rush:0,duration:enabled?.85:.15,ease:'power2.out'},0);
   restore.to(panel.current,{autoAlpha:1,y:0,duration:enabled?.5:.15},0);
   restore.to(heroText,{autoAlpha:1,y:0,duration:enabled?.65:.15,stagger:enabled?.045:0},0);
   return ()=>{restore.kill();};
  }
  const returningHome=enabled&&destination==='landing'&&state.chapter!=='landing'&&visualBridge.workPortalLive;
  if(returningHome){
   const flight=2.15,arrival=1.55;
   let readinessTick:(()=>void)|null=null;
   const stopWaiting=()=>{if(readinessTick){gsap.ticker.remove(readinessTick);readinessTick=null;}};
   useStudio.setState({transitioning:true,travelPhase:'diving'});
   const reverse=gsap.timeline({onComplete:()=>{stopWaiting();complete();}});
   // Retrace the tunnel and image morph together, keeping the same ring at the handoff.
   reverse.set(journey,{homeImage:0,homeSurface:0,homeReform:1,homeHandoff:1},0);
   reverse.to(panel.current,{autoAlpha:0,y:8,duration:.48,ease:'sine.inOut'},0);
   reverse.to(journey,{depth:0,offset:destinations.landing.offset,gallery:0,contact:0,duration:flight,ease:'power2.inOut'},0);
   reverse.to(journey,{rush:.85,duration:.78,ease:'sine.inOut'},0);
   reverse.to(journey,{rush:0,duration:flight-.78,ease:'sine.inOut'},.78);
   // Mount the home renderer behind the still-visible portal before handing it the ring.
   reverse.call(()=>{
    gsap.set(heroText,{autoAlpha:0,y:18});
    useStudio.getState().setChapter('landing');
    gsap.set(panel.current,{autoAlpha:1,y:0});
   },[],.48);
   reverse.call(()=>{
    const hero=visualBridge.images.hero;
    if(hero.detailLive||hero.detailReady||!visualBridge.workPortalLive)return;
    reverse.pause();
    const started=performance.now();
    readinessTick=()=>{
     if(!hero.detailLive&&!hero.detailReady&&visualBridge.workPortalLive&&performance.now()-started<5000)return;
     stopWaiting();reverse.resume();
    };
    gsap.ticker.add(readinessTick);
   },[],arrival);
   reverse.call(()=>useStudio.setState({travelPhase:'forming'}),[],arrival+.01);
   reverse.set(journey,{homeImage:1,homeSurface:1},arrival);
   reverse.to(journey,{homeHandoff:0,duration:.24,ease:'sine.inOut'},arrival);
   reverse.to(journey,{homeReform:0,duration:1.65,ease:'sine.inOut'},arrival+.22);
   reverse.to(heroText,{autoAlpha:1,y:0,duration:1.05,stagger:.055,ease:'sine.out'},arrival+.75);
   return ()=>{stopWaiting();reverse.kill();};
  }
  const reform=enabled&&state.chapter==='landing'&&destination!=='landing'&&journey.depth<1&&visualBridge.images.hero.detailLive&&visualBridge.workPortalLive;
  const approach=reform?2.85:0,flight=enabled?2.15:.2;
  useStudio.setState({transitioning:true,travelPhase:reform?'forming':'diving'});
  if(destination==='landing'&&state.chapter!=='landing')gsap.set(heroText,{clearProps:'opacity,visibility,transform'});
  const timeline=gsap.timeline({onComplete:complete});
  if(reform){
   // Keep the image canvas visible. Its own points peel from the surface and form the ring.
   timeline.to(heroText,{autoAlpha:0,y:-14,duration:.9,stagger:.065,ease:'power2.inOut'},.08);
   timeline.to(journey,{homeReform:1,duration:2.05,ease:'sine.inOut'},.18);
   // Only the completed ring is handed to the continuous tunnel renderer.
   timeline.to(journey,{homeHandoff:1,duration:.46,ease:'sine.inOut'},2.23);
   timeline.to(panel.current,{autoAlpha:0,y:0,duration:.15,ease:'sine.inOut'},2.7);
   timeline.call(()=>useStudio.setState({travelPhase:'diving'}),[],approach);
  }else timeline.to(panel.current,{autoAlpha:0,y:enabled?-8:0,duration:flight*.22,ease:'sine.inOut'},0);
  timeline.to(journey,{...destinations[destination],duration:flight,ease:'power2.inOut'},approach);
  timeline.to(journey,{rush:enabled?1:0,duration:flight*.38,ease:'power2.inOut'},approach);
  timeline.to(journey,{rush:0,duration:flight*.62,ease:'power2.inOut'},approach+flight*.38);
  timeline.call(()=>useStudio.getState().setChapter(destination),[],approach+flight*.5);
  // A future fromTo must not hide the currently visible section when the timeline is created.
  timeline.fromTo(panel.current,{autoAlpha:0,y:enabled?16:0},{autoAlpha:1,y:0,duration:flight*.36,ease:'power2.out',immediateRender:false},approach+flight*.63);
  return ()=>{timeline.kill();};
 },[destination,enabled,panel]);
 return hydrated;
}
