import { create } from 'zustand';
import type { Locale } from './content';
export const chapters = ['landing','about','gallery','contact'] as const;
export type Chapter = typeof chapters[number];
export type MotionPreference = 'auto' | 'on' | 'off';
type StudioState = {
 locale:Locale; chapter:Chapter; destination:Chapter; transitioning:boolean; travelPhase:'idle'|'forming'|'diving';
 workPreview:boolean; setWorkPreview:(value:boolean)=>void; portalPulse:number; pulsePortal:()=>void; craftFocus:number; setCraftFocus:(value:number)=>void; activeWork:number; motion:MotionPreference; reduced:boolean; quality:'auto'|'eco'; overlayOpen:boolean; portalHovered:boolean; setPortalHovered:(value:boolean)=>void;
 setLocale:(locale:Locale)=>void; navigate:(destination:Chapter)=>void;
 setChapter:(chapter:Chapter)=>void; setTransitioning:(value:boolean)=>void;
 setActiveWork:(index:number)=>void; setMotion:(value:MotionPreference)=>void;
 setReduced:(value:boolean)=>void; setQuality:(value:'auto'|'eco')=>void; setOverlayOpen:(value:boolean)=>void;
};
export const motionEnabled=(s:Pick<StudioState,'motion'|'reduced'>)=>s.motion==='on'||(s.motion==='auto'&&!s.reduced);
export const useStudio=create<StudioState>((set)=>({
 workPreview:false,setWorkPreview:(workPreview)=>set({workPreview}),portalPulse:0,pulsePortal:()=>set(s=>({portalPulse:s.portalPulse+1})),
 locale:'en',chapter:'landing',destination:'landing',transitioning:false,travelPhase:'idle',craftFocus:-1,setCraftFocus:(craftFocus)=>set({craftFocus}),activeWork:0,motion:'auto',reduced:false,quality:'auto',overlayOpen:false,portalHovered:false,setPortalHovered:(portalHovered)=>set({portalHovered}),
 setLocale:(locale)=>set({locale}),navigate:(destination)=>set({destination}),
 setChapter:(chapter)=>set({chapter}),setTransitioning:(transitioning)=>set({transitioning}),
 setActiveWork:(activeWork)=>set({activeWork}),setMotion:(motion)=>set({motion}),
 setReduced:(reduced)=>set({reduced}),setQuality:(quality)=>set({quality}),setOverlayOpen:(overlayOpen)=>set({overlayOpen}),
}));
// Only the journey timeline writes these values. The render loop reads them.
export const journey={depth:0,offset:-2.65,gallery:0,contact:0,homeImage:1,homeSurface:1,homeReform:0,homeHandoff:0,rush:0};
export const destinations:Record<Chapter,Omit<typeof journey,'rush'>>={
 landing:{depth:0,offset:-2.65,gallery:0,contact:0,homeImage:1,homeSurface:1,homeReform:0,homeHandoff:0},
 about:{depth:24,offset:-.7,gallery:0,contact:0,homeImage:0,homeSurface:0,homeReform:1,homeHandoff:1},
 gallery:{depth:48,offset:0,gallery:1,contact:0,homeImage:0,homeSurface:0,homeReform:1,homeHandoff:1},
 contact:{depth:72,offset:-3.2,gallery:0,contact:1,homeImage:0,homeSurface:0,homeReform:1,homeHandoff:1},
};
