'use client';
import {Component,useCallback,useEffect,useMemo,useRef,useState,type MutableRefObject,type ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {GPUComputationRenderer,type Variable} from 'three/addons/misc/GPUComputationRenderer.js';
import * as THREE from 'three';
import {journey,motionEnabled,useStudio} from '@/lib/store';
import {createPortalCorrespondence,portalPointGLSL} from '@/lib/portal-math';
import {PULSE_COUNT,visualBridge} from '@/lib/visual-bridge';
type ImageChannelName='hero'|'work';

export type PreviewBounds={x:number;y:number;width:number;height:number;alpha:number};
export type ImageInteraction={x:number;y:number;strength:number;hovered?:boolean;tap?:number};
const velocityShader=`
uniform float uDelta,uTime,uBurst,uForce,uAspect,uHero,uMode;
uniform vec4 uRipples[6];
uniform vec2 uPointer;
uniform vec4 uHit;
uniform sampler2D uImage;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution.xy;
 vec3 p=texture2D(texturePosition,uv).xyz;
 vec3 v=texture2D(textureVelocity,uv).xyz;
 float lum=dot(texture2D(uImage,uv).rgb,vec3(.299,.587,.114));
 vec3 rest=vec3((uv-.5)*vec2(uAspect*2.,2.),(lum-.2)*.08);
 float h=hash(uv),a=h*6.2831853;
 vec3 drift=vec3(cos(a),sin(a),sin(a*3.))*(.6+hash(uv+1.)*.9);
 drift.xy+=vec2(sin(uv.y*8.+uTime),cos(uv.x*7.+uTime))*.25;
 rest+=drift*uBurst;
 rest.z+=sin(uTime*.3+uv.x*6.)*.006;
 rest.xy+=vec2(cos(uTime*.24+uv.y*7.),sin(uTime*.38+uv.x*8.))*.003;
 rest.xy+=vec2(sin(uTime*.48+uv.y*4.),cos(uTime*.36+uv.x*4.))*.018*uHero;
 vec2 diff=p.xy-uPointer;
 float distance=length(diff),influence=exp(-distance*distance*23.)*uForce;
 vec3 force=vec3(diff/max(distance,.01),.35)*influence*8.;
 vec2 hitDelta=p.xy-uHit.xy;float hitRadius=length(hitDelta);
 float band=(hitRadius-uHit.z*1.7)*6.;
 float wave=exp(-band*band)*exp(-uHit.z*2.7)*uHit.w;
 force+=vec3(hitDelta/max(hitRadius,.01),.2)*wave*2.8;
 if(uHero>.5)for(int i=0;i<6;i++){
  vec2 ray=p.xy-uRipples[i].xy;float radius=length(ray),age=uRipples[i].z;
  float band=(radius-age*2.1)*5.;
  float wave=exp(-band*band)*exp(-age*1.4)*uRipples[i].w*uHero;
  vec2 outward=ray/max(radius,.02);
  float facet=mix(1.,sin(floor(uv.x*28.)*.8+floor(uv.y*20.)*.5),step(.5,uMode)*(1.-step(1.5,uMode)));
  force+=vec3(outward*(uMode>1.5?.6:1.6),facet*(uMode>1.5?2.:1.2))*wave*6.;
 }
 v+=(rest-p)*uDelta*38.+force*uDelta;
 v*=exp(-uDelta*9.);
 gl_FragColor=vec4(clamp(v,vec3(-5.),vec3(5.)),1.);
}`;
const positionShader=`
uniform float uDelta;
void main(){
 vec2 uv=gl_FragCoord.xy/resolution.xy;
 vec3 p=texture2D(texturePosition,uv).xyz;
 vec3 v=texture2D(textureVelocity,uv).xyz;
 gl_FragColor=vec4(clamp(p+v*uDelta,vec3(-4.),vec3(4.)),1.);
}`;
const responseGLSL=`
float imageResponse(vec2 base){
 vec2 delta=base-uPointer;
 float hover=exp(-dot(delta,delta)*9.)*uHover;
 vec2 hit=base-uTap.xy;float band=(length(hit)-uTap.z*1.7)*6.;
 float tap=exp(-band*band)*exp(-uTap.z*2.7)*uTap.w;
 float ripple=0.;
 if(uHero>.5)for(int i=0;i<6;i++){
  float wave=(length(base-uRipples[i].xy)-uRipples[i].z*2.1)*5.;
  ripple=max(ripple,exp(-wave*wave)*exp(-uRipples[i].z*1.4)*uRipples[i].w);
 }
 float living=0.;
 if(uHero>.5){
  float sweep=exp(-pow((base.x+.18*sin(base.y*3.+uClock*.5)-sin(uClock*.48)*uAspect)*3.,2.));
  living=.14+.32*sweep;
 }
 return clamp(max(max(max(hover,tap),ripple),living),0.,1.);
}
float releaseAt(vec2 uv){
 float delay=.22*(uv.x*.65+uv.y*.35);
 return smoothstep(delay,delay+.72,uReform);
}

`;
const portalMorphGLSL=`
${portalPointGLSL}
float randomAt(vec2 uv){return fract(sin(dot(uv,vec2(127.1,311.7)))*43758.5453);}
vec3 portalTarget(out float pointSize){
 vec3 position=portalPoint(aPortalSeed.xyz,uPortalClock);
 position=displacePortal(position,uPortalPointer,uPortalPulses,uPortalClock,0.,0.);
 position.z-=uPortalDepth;
 vec4 clip=uPortalProjection*vec4(position,1.);
 vec2 screen=clip.xy/max(.001,clip.w);
 vec2 pixel=vec2((screen.x*uPortalScale.z*.5+.5)*uPortalScreen.x,(.5-screen.y*.5)*uPortalScreen.y);
 float sparkle=pow(.5+.5*sin(aPortalSeed.y*87.+uPortalClock*1.2),16.);
 float size=(.85+aPortalSeed.y*1.7+sparkle*.35)*11./max(1.,clip.w);
 pointSize=clamp(size*uPortalDpr,.65,4.)/uPortalDpr;
 return vec3((pixel.x-uPortalScreen.z)*uPortalScale.x,(uPortalScreen.w-pixel.y)*uPortalScale.y,0.);
}
`;
const drawVertex=`
attribute vec2 aLookup;
attribute vec4 aPortalSeed;
uniform sampler2D uPositions,uFrom,uTo;
uniform float uMix,uSize,uReveal,uStill,uAspect,uHover,uPresence,uHero,uMode,uClock,uTrace,uReform,uPortalClock,uPortalDepth,uPortalDpr;
uniform mat4 uPortalProjection;
uniform vec4 uPortalScreen,uRipples[6];
uniform vec3 uPortalScale;
uniform vec2 uPortalGrid,uPortalPointer;
uniform vec4 uPortalPulses[6];
uniform vec2 uPointer;
uniform vec4 uTap;
varying vec3 vColor;
varying float vAlpha,vPortal;
${portalMorphGLSL}
${responseGLSL}
void main(){
 vec3 origin=mix(texture2D(uPositions,aLookup).xyz,vec3((aLookup-.5)*vec2(uAspect*2.,2.),0.),uStill);
 vec3 p=origin;
 vec4 source=texture2D(uFrom,aLookup),target=texture2D(uTo,aLookup);
 vColor=mix(source.rgb,target.rgb,uMix);
 float lum=dot(vColor,vec3(.299,.587,.114));
 float ink=1.-smoothstep(.85,.995,lum);
 vec2 base=(aLookup-.5)*vec2(uAspect*2.,2.);
 float response=imageResponse(base);
 float coverage=max(1.-uReveal,response*.98);
 float release=releaseAt(aLookup);
 float size=uSize*(1.+response*.4*uHero);
 float portalAlpha=(.16+aPortalSeed.y*.4)*aPortalSeed.w;
 if(uReform>.0001&&uTrace<.5){
  float targetSize;
  vec3 destination=portalTarget(targetSize);
  vec2 travel=destination.xy-origin.xy;
  vec2 tangent=vec2(-travel.y,travel.x)/max(length(travel),.001);
  float curl=sin(release*3.14159265)*.23*sin(aLookup.y*5.+aLookup.x*4.+uClock*.3);
  p=mix(origin,destination,release);p.xy+=tangent*curl;
  size=mix(size,targetSize,release);
 }
 float released=smoothstep(0.,.22,release);
 float visibleInk=mix(ink,1.,smoothstep(.62,.96,release));
 vColor=mix(vColor,vec3(.010023,.012535,.009264),smoothstep(.08,.85,release));
 vAlpha=mix(source.a,target.a,uMix)*visibleInk*mix(coverage,portalAlpha,released)*uPresence;
 vPortal=release;
 if(uTrace>.5){
  float seed=randomAt(aLookup),t=uClock*.85+seed*6.2831853;
  p=origin;
  p.xy+=vec2(sin(t+aLookup.y*3.),cos(t*.8+aLookup.x*4.))*(.055+seed*.06);
  p.xy+=vec2(sin(aLookup.y*5.+uClock*.65),cos(aLookup.x*4.-uClock*.5))*.055;
  vAlpha=ink*(.36+.2*sin(t*.7+seed))*uPresence*(1.-smoothstep(0.,.35,uReform))*uHero;
  size=3.1+seed*1.7;
  vPortal=0.;
 }
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
 gl_PointSize=size;
}
`;
const drawFragment=`
varying vec3 vColor;
varying float vAlpha,vPortal;
void main(){
 vec2 p=gl_PointCoord*2.-1.;
 float disc=1.-smoothstep(.32,.5,length(gl_PointCoord-.5));
 float alpha=mix(disc,exp(-dot(p,p)*4.2),vPortal)*vAlpha;
 if(alpha<.002)discard;
 gl_FragColor=vec4(vColor,alpha);
 #include <colorspace_fragment>
}
`;
const planeVertex=`
uniform sampler2D uPositions;
uniform float uStill,uAspect,uReform,uClock,uHero;
varying vec2 vUv;
void main(){
 vUv=uv;
 vec3 p=mix(texture2D(uPositions,uv).xyz,vec3((uv-.5)*vec2(uAspect*2.,2.),0.),uStill);
 p.xy+=vec2(sin(uv.y*4.+uClock*.4),cos(uv.x*4.-uClock*.3))*.017*sin(uReform*3.14159265)*uHero;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}
`;
const planeFragment=`
uniform sampler2D uFrom,uTo;
uniform float uMix,uReveal,uAspect,uHover,uPresence,uHero,uMode,uClock,uReform;
uniform vec4 uRipples[6];
uniform vec2 uPointer;
uniform vec4 uTap;
varying vec2 vUv;
${responseGLSL}
void main(){
 vec4 color=mix(texture2D(uFrom,vUv),texture2D(uTo,vUv),uMix);
 color.rgb*=1.+uHero*.016*sin(uClock*.55+vUv.x*5.+vUv.y*3.);
 float ink=1.-smoothstep(.85,.995,dot(color.rgb,vec3(.299,.587,.114)));
 float release=releaseAt(vUv);
 float surface=pow(1.-release,1.35);
 float disturbance=imageResponse((vUv-.5)*vec2(uAspect*2.,2.))*mix(.94,.8,uHero);
 gl_FragColor=vec4(color.rgb,color.a*uReveal*ink*uPresence*surface*(1.-disturbance));
 #include <colorspace_fragment>
}
`;
type Engine={gpu:GPUComputationRenderer;position:Variable;velocity:Variable;initial:THREE.DataTexture;from:THREE.Texture|null;to:THREE.Texture|null;pending:THREE.Texture|null;mix:number;time:number;aspect:number;arrival:boolean;reported:number;accumulator:number;tapId:number;hitAge:number;hitX:number;hitY:number};
function ImageField({src,eco,animate,interaction,onReady,onTransition,bounds,slot,channel}:{channel:ImageChannelName;src:string;eco:boolean;animate:boolean;interaction:MutableRefObject<ImageInteraction>;onTransition:MutableRefObject<((src:string,phase:number)=>void)|undefined>;bounds:MutableRefObject<PreviewBounds[]>;slot:number;onReady:(ready:boolean)=>void}){
 const {gl,viewport,size,invalidate}=useThree();
 const field=visualBridge.images[channel];
 const engine=useRef<Engine|null>(null),material=useRef<THREE.ShaderMaterial>(null),surface=useRef<THREE.ShaderMaterial>(null),points=useRef<THREE.Points>(null),tracers=useRef<THREE.Points>(null),traceMaterial=useRef<THREE.ShaderMaterial>(null),group=useRef<THREE.Group>(null);
 const cache=useRef(new Map<string,THREE.Texture>()),request=useRef(0);
 const w=eco?160:256,h=eco?110:176;
 const geometry=useMemo(()=>{
  const position=new Float32Array(w*h*3),lookup=new Float32Array(w*h*2);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;lookup[i*2]=(x+.5)/w;lookup[i*2+1]=(y+.5)/h;}
  const portalSeeds=createPortalCorrespondence(eco,w*h);
  const traceLookup=new Float32Array(Math.ceil(w*h/32)*2);
  let cursor=0;
  for(let i=0;i<traceLookup.length/2;i++){const sample=(i*73+157)%(w*h);traceLookup[cursor++]=lookup[sample*2];traceLookup[cursor++]=lookup[sample*2+1];}
  const traceSeeds=new Float32Array(traceLookup.length*2);
  for(let i=0;i<traceLookup.length/2;i++){const sample=(i*73+157)%(w*h);traceSeeds.set(portalSeeds.subarray(sample*4,sample*4+4),i*4);}
  return {position,lookup,portalSeeds,traceLookup,traceSeeds,tracePosition:new Float32Array(traceLookup.length/2*3)};
 },[w,h,eco]);
 const uniforms=useMemo<Record<string,THREE.IUniform>>(()=>({uPositions:{value:null},uFrom:{value:null},uTo:{value:null},uMix:{value:1},uSize:{value:1.7},uReveal:{value:0},uStill:{value:0},uAspect:{value:1.454545},uPointer:{value:new THREE.Vector2(30,30)},uHover:{value:0},uTap:{value:new THREE.Vector4(0,0,4,0)},uPresence:{value:0},uHero:{value:0},uMode:{value:0},uClock:{value:0},uTrace:{value:0},uReform:{value:0},uPortalClock:{value:0},uPortalDpr:{value:1},uPortalPointer:{value:new THREE.Vector2(50,50)},uPortalPulses:{value:Array.from({length:PULSE_COUNT},()=>new THREE.Vector4(0,0,-1000,0))},uPortalDepth:{value:0},uPortalProjection:{value:new THREE.Matrix4()},uPortalScreen:{value:new THREE.Vector4()},uPortalScale:{value:new THREE.Vector3(1,1,1)},uPortalGrid:{value:new THREE.Vector2()},uRipples:{value:Array.from({length:PULSE_COUNT},()=>new THREE.Vector4(0,0,10,0))}}),[]);
 const traceUniforms=useMemo(()=>({...uniforms,uTrace:{value:1}}),[uniforms]);
 useEffect(()=>{
  const gpu=new GPUComputationRenderer(w,h,gl);gpu.setDataType(THREE.HalfFloatType);
  const initial=gpu.createTexture(),rest=gpu.createTexture(),zero=gpu.createTexture();
  const data=initial.image.data as Float32Array;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;data[i]=((x+.5)/w-.5)*2.90909;data[i+1]=((y+.5)/h-.5)*2;data[i+3]=1;data[i+2]=0;const base=rest.image.data as Float32Array;base[i]=((x+.5)/w-.5)*2.90909;base[i+1]=((y+.5)/h-.5)*2;base[i+3]=1;}
  const position=gpu.addVariable('texturePosition',positionShader,initial),velocity=gpu.addVariable('textureVelocity',velocityShader,zero);
  gpu.setVariableDependencies(position,[position,velocity]);gpu.setVariableDependencies(velocity,[position,velocity]);
  position.material.uniforms.uDelta={value:1/60};
  Object.assign(velocity.material.uniforms,{uDelta:{value:1/60},uTime:{value:0},uBurst:{value:0},uForce:{value:0},uPointer:{value:new THREE.Vector2(30,30)},uImage:{value:initial},uAspect:{value:1.454545},uHit:{value:new THREE.Vector4(0,0,4,0)},uHero:{value:channel==='hero'?1:0},uMode:{value:0},uRipples:{value:Array.from({length:PULSE_COUNT},()=>new THREE.Vector4(0,0,10,0))}});
  const error=gpu.init();
  if(error){field.detailLive=false;gpu.dispose();position.material.dispose();velocity.material.dispose();rest.dispose();onReady(false);return;}
  const state:Engine={gpu,position,velocity,initial:rest,from:null,to:null,pending:null,mix:0,time:0,aspect:1.454545,arrival:true,reported:-1,accumulator:0,tapId:0,hitAge:4,hitX:0,hitY:0};engine.current=state;invalidate();
  return ()=>{field.detailLive=false;engine.current=null;request.current++;gpu.dispose();position.material.dispose();velocity.material.dispose();rest.dispose();for(const texture of cache.current.values())texture.dispose();cache.current.clear();};
 },[gl,w,h,invalidate,onReady,channel]);
 useEffect(()=>{
  const state=engine.current;if(!state)return;
  const id=++request.current;let alive=true;
  const accept=(texture:THREE.Texture)=>{
   if(!alive||request.current!==id||engine.current!==state){if(!cache.current.has(src))texture.dispose();return;}
   texture.userData.src=src;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
   cache.current.set(src,texture);state.pending=texture;
   if(!state.to){state.from=texture;state.to=texture;state.pending=null;field.detailLive=true;onReady(true);}
   invalidate();
  };
  const known=cache.current.get(src);if(known)accept(known);else new THREE.TextureLoader().load(src,accept,undefined,()=>{if(alive)onReady(false);});
  return ()=>{alive=false;};
 },[src,w,h,invalidate,onReady]);
 useFrame((_,delta)=>{
  const e=engine.current,m=material.current;if(!e||!m||!e.to||!e.from)return;
  const rect=bounds.current[slot];
  if(!rect||rect.width<1||rect.alpha<.01){if(group.current)group.current.visible=false;return;}
  const state=useStudio.getState();
  if(channel==='hero'&&state.transitioning&&state.destination!=='landing'&&journey.homeHandoff>=.999){if(group.current)group.current.visible=false;return;}
  if(group.current)group.current.visible=true;
  const width=rect.width/size.width*viewport.width,height=rect.height/size.height*viewport.height;
  const dt=Math.min(delta,.033);
  const targetAspect=e.to.image.width/e.to.image.height;
  e.aspect=animate?THREE.MathUtils.damp(e.aspect,targetAspect,6,dt):targetAspect;
  const fit=Math.min(width/(e.aspect*2),height/2)*.94;
  group.current?.scale.setScalar(fit);
  group.current?.position.set(((rect.x+rect.width/2)/size.width-.5)*viewport.width,(.5-(rect.y+rect.height/2)/size.height)*viewport.height,0);
  if(e.pending&&(e.mix>=1||!animate)){
   e.from=e.to;e.to=e.pending;e.pending=null;e.mix=animate?0:1;e.arrival=false;e.reported=-1;
   // Only the newest requested image is retained; rapid navigation cannot enqueue timelines.
   for(const [key,texture] of cache.current)if(cache.current.size>3&&texture!==e.from&&texture!==e.to&&texture!==e.pending){texture.dispose();cache.current.delete(key);}
  }
  e.mix=animate?Math.min(1,e.mix+Math.min(delta,.25)/1.65):1;
  const blend=e.mix*e.mix*(3.-2.*e.mix);
  uniforms.uHero.value=channel==='hero'&&animate?1:0;uniforms.uMode.value=field.mode;
  const velocity=e.velocity.material.uniforms;
  velocity.uHero.value=uniforms.uHero.value;velocity.uMode.value=field.mode;
  let globalWave=false;
  for(let i=0;i<PULSE_COUNT;i++){
   const pulse=visualBridge.pulses[i],age=Math.max(0,visualBridge.time-pulse.born);
   const screenX=((useStudio.getState().locale==='fa'?-pulse.x:pulse.x)*.5+.5)*window.innerWidth;
   const screenY=(.5-pulse.y*.5)*window.innerHeight;
   const x=(screenX-field.rect.x-field.rect.width/2)/Math.max(1,field.rect.width)*width/fit;
   const y=(field.rect.y+field.rect.height/2-screenY)/Math.max(1,field.rect.height)*height/fit;
   if(channel==='hero'&&animate&&age<3)globalWave=true;
   uniforms.uRipples.value[i].set(x,y,Math.min(10,age),animate&&age<3?1:0);
   velocity.uRipples.value[i].copy(uniforms.uRipples.value[i]);
  }
  if(animate){
   e.time+=dt;
   if((interaction.current.tap||0)!==e.tapId){e.tapId=interaction.current.tap||0;e.hitAge=0;e.hitX=interaction.current.x*width/2/fit;e.hitY=interaction.current.y*height/2/fit;}
   e.hitAge=Math.min(4,e.hitAge+dt);
   e.accumulator+=Math.min(delta,.1);
   const interval=eco?1/30:1/45;
   if(e.accumulator>=interval){
   const step=Math.min(e.accumulator,.04);e.accumulator%=interval;
   const u=e.velocity.material.uniforms;
   u.uDelta.value=step;u.uTime.value=e.time;u.uBurst.value=e.arrival?0:Math.sin(e.mix*Math.PI)*.55;
   u.uAspect.value=e.aspect;
   u.uImage.value=e.to;u.uForce.value=interaction.current.hovered?.22:interaction.current.strength;
   u.uHit.value.set(e.hitX,e.hitY,e.hitAge,e.hitAge<1.5?1:0);
   u.uPointer.value.set(interaction.current.x*width/2/fit,interaction.current.y*height/2/fit);
   interaction.current.strength*=Math.exp(-step*3.8);
   e.position.material.uniforms.uDelta.value=step;e.gpu.compute();
   }
  }
  uniforms.uClock.value=e.time;
  uniforms.uReform.value=channel==='hero'&&animate?journey.homeReform:0;
  uniforms.uPortalClock.value=visualBridge.time;
  uniforms.uPortalDepth.value=visualBridge.portal.depth;
  uniforms.uPortalDpr.value=visualBridge.portal.dpr;
  uniforms.uPortalPointer.value.copy(visualBridge.portal.pointer);
  for(let i=0;i<PULSE_COUNT;i++){const pulse=visualBridge.pulses[i];uniforms.uPortalPulses.value[i].set(pulse.worldX,pulse.worldY,pulse.born,0);}
  uniforms.uPortalGrid.value.set(1/w,1/h);
  uniforms.uPortalProjection.value.copy(visualBridge.portal.projection);
  uniforms.uPortalScreen.value.set(window.innerWidth,window.innerHeight,field.rect.x+field.rect.width/2,field.rect.y+field.rect.height/2);
  uniforms.uPortalScale.value.set(viewport.width/size.width/fit,viewport.height/size.height/fit,state.locale==='fa'?-1:1);
  uniforms.uPositions.value=animate?e.gpu.getCurrentRenderTarget(e.position).texture:e.initial;
  uniforms.uFrom.value=e.from;uniforms.uTo.value=e.to;uniforms.uMix.value=blend;
  uniforms.uReveal.value=animate&&!e.arrival?1.-Math.sin(e.mix*Math.PI)*.94:1;
  uniforms.uPresence.value=animate&&visualBridge.workPortalLive&&!field.mapFailed?field.surface:1;
  uniforms.uPointer.value.set(interaction.current.x*width/2/fit,interaction.current.y*height/2/fit);
  uniforms.uHover.value=animate?THREE.MathUtils.damp(uniforms.uHover.value,interaction.current.hovered?.9:Math.min(1,interaction.current.strength*5),10,dt):0;
  uniforms.uTap.value.set(e.hitX,e.hitY,e.hitAge,animate&&e.hitAge<1.5?1:0);uniforms.uStill.value=animate?0:1;uniforms.uAspect.value=e.aspect;
  if(points.current)points.current.visible=uniforms.uReveal.value<.999||uniforms.uHover.value>.01||(animate&&e.hitAge<1.5)||globalWave||(animate&&channel==='hero')||uniforms.uReform.value>0;
  if(tracers.current)tracers.current.visible=channel==='hero'&&animate&&uniforms.uReform.value<.35;
  const reported=animate&&e.arrival&&visualBridge.workPortalLive&&!field.mapFailed?Math.min(e.mix,field.formation):e.mix;
  if(e.reported!==reported){onTransition.current?.(String(e.to.userData.src),reported);e.reported=reported;}
  uniforms.uSize.value=Math.min(3.8,Math.max(1.1,rect.width/w*gl.getPixelRatio()*1.65));
  for(const key in uniforms){m.uniforms[key].value=uniforms[key].value;if(surface.current)surface.current.uniforms[key].value=uniforms[key].value;if(traceMaterial.current&&key!=='uTrace')traceMaterial.current.uniforms[key].value=uniforms[key].value;}
  if(e.mix<1||e.pending)invalidate();
 });
 return <group ref={group}><mesh frustumCulled={false} renderOrder={0}><planeGeometry args={[2,2,eco?28:48,eco?20:33]}/><shaderMaterial ref={surface} uniforms={uniforms} vertexShader={planeVertex} fragmentShader={planeFragment} transparent depthWrite={false} toneMapped={false}/></mesh><points ref={points} frustumCulled={false} renderOrder={1}>
  <bufferGeometry><bufferAttribute attach="attributes-position" args={[geometry.position,3]}/><bufferAttribute attach="attributes-aLookup" args={[geometry.lookup,2]}/><bufferAttribute attach="attributes-aPortalSeed" args={[geometry.portalSeeds,4]}/></bufferGeometry>
  <shaderMaterial ref={material} uniforms={uniforms} vertexShader={drawVertex} fragmentShader={drawFragment} transparent depthWrite={false} toneMapped={false}/>
 </points>{channel==='hero'&&<points ref={tracers} frustumCulled={false} renderOrder={2}>
  <bufferGeometry><bufferAttribute attach="attributes-position" args={[geometry.tracePosition,3]}/><bufferAttribute attach="attributes-aLookup" args={[geometry.traceLookup,2]}/><bufferAttribute attach="attributes-aPortalSeed" args={[geometry.traceSeeds,4]}/></bufferGeometry>
  <shaderMaterial ref={traceMaterial} uniforms={traceUniforms} vertexShader={drawVertex} fragmentShader={drawFragment} transparent depthWrite={false} toneMapped={false}/>
 </points>}</group>;
}
class ImageBoundary extends Component<{children:ReactNode;failed:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.failed();}render(){return this.state.failed?null:this.props.children;}
}
type PreviewsProps={channel?:ImageChannelName;sources:string[];bounds:MutableRefObject<PreviewBounds[]>;interactions:MutableRefObject<ImageInteraction>[];onReady:(ready:boolean)=>void;onTransition:(slot:number,src:string,phase:number)=>void};
function TileField({slot,src,eco,animate,bounds,interaction,onReady,onTransition,channel}:{channel:ImageChannelName;slot:number;src:string;eco:boolean;animate:boolean;bounds:PreviewsProps['bounds'];interaction:MutableRefObject<ImageInteraction>;onReady:PreviewsProps['onReady'];onTransition:PreviewsProps['onTransition']}){
 const notify=useRef<((src:string,phase:number)=>void)|undefined>(undefined);notify.current=(src,phase)=>onTransition(slot,src,phase);
 return <ImageField channel={channel} src={src} eco={eco} animate={animate} bounds={bounds} slot={slot} interaction={interaction} onReady={onReady} onTransition={notify}/>;
}
function Invalidation(){const invalidate=useThree(s=>s.invalidate);useEffect(()=>useStudio.subscribe(()=>invalidate()),[invalidate]);return null;}
export default function ProjectPreviews({sources,bounds,interactions,onReady,onTransition,channel='work'}:PreviewsProps){
 const [lost,setLost]=useState(false),[visible,setVisible]=useState(true),[compact,setCompact]=useState(true);const host=useRef<HTMLDivElement>(null);
 const motion=useStudio(motionEnabled),quality=useStudio(s=>s.quality),blocked=useStudio(s=>s.overlayOpen||(channel==='work'&&s.transitioning));
 const readyHandler=useCallback((value:boolean)=>{onReady(value);if(!value)setLost(true);},[onReady]);
 useEffect(()=>{const media=matchMedia('(max-width:767px)');const sync=()=>setCompact(media.matches),visibility=()=>setVisible(!document.hidden);sync();visibility();media.addEventListener('change',sync);document.addEventListener('visibilitychange',visibility);return ()=>{media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{const node=host.current;const fail=(event:Event)=>{event.preventDefault();setLost(true);onReady(false);};node?.addEventListener('webglcontextlost',fail,true);return ()=>node?.removeEventListener('webglcontextlost',fail,true);},[onReady]);
 return <div className="project-particle-world" ref={host}>{!lost&&<ImageBoundary failed={()=>{setLost(true);onReady(false);}}><Canvas orthographic camera={{position:[0,0,4],zoom:100,near:.1,far:20}} dpr={1} frameloop={!visible||blocked?'never':motion?'always':'demand'} gl={{alpha:true,antialias:false,powerPreference:'low-power'}}><Invalidation/>{sources.map((src,i)=><TileField channel={channel} key={i} slot={i} src={src} eco={compact||quality==='eco'} animate={motion&&visible&&!blocked} bounds={bounds} interaction={interactions[i]} onReady={readyHandler} onTransition={onTransition}/>)}</Canvas></ImageBoundary>}</div>;
}
