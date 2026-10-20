'use client';
import {Component,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import * as THREE from 'three';
import {journey,motionEnabled,useStudio} from '@/lib/store';
import {textureAspect} from '@/lib/texture-aspect';
import {experienceCopy} from '@/lib/experience-copy';
import {PULSE_COUNT,visualBridge} from '@/lib/visual-bridge';
import {createPortalSeeds,portalPointGLSL} from '@/lib/portal-math';

const vertex=`
attribute vec4 aSeed;
uniform float uTime,uDepth,uRush,uDpr,uBlue,uDimension,uComposite,uWorks,uContact,uHalo,uWorkSurface,uWorkAspect,uImageMirror,uBackdropImage;
uniform sampler2D uWorkImage;
uniform vec4 uWorkRect;
uniform vec2 uPointer;
uniform vec4 uContactRect;
uniform vec4 uPulses[6];
varying float vAlpha,vBlue,vSplit,vChannel,vWork,vFrame;
varying vec3 vWorkColor;
${portalPointGLSL}
mat2 spin(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
void main(){
 float flow=fract(aSeed.x+uTime*.032);
 float angle=flow*6.2831853;
 float gaussian=clamp(sqrt(-2.*log(max(aSeed.y,.001)))*cos(aSeed.z*6.2831853),-2.2,2.2);
 float width=.16+.11*(.5+.5*sin(angle*3.+uTime*.2));
 float radius=2.28+.13*sin(angle*3.-uTime*.18)+gaussian*width;
 vec3 p;
 bool front=aSeed.w<.58;
 vSplit=0.;vChannel=floor(aSeed.z*3.);vWork=0.;vFrame=0.;vWorkColor=vec3(1.);
 if(front){
  p=portalPoint(aSeed.xyz,uTime);
  // VFX: emission and curl turn the ring into a turbulent, volumetric simulation.
  if(uBlue>.001){
  float life=fract(aSeed.z+uTime*.145);
  float emission=step(.67,aSeed.y);
  float stormAngle=angle+.24*sin(aSeed.z*19.+uTime*.7)+emission*life*.9;
  float stormRadius=2.13+gaussian*.12+.17*sin(stormAngle*5.-uTime*.8)+emission*sin(life*3.14159265)*.58;
  vec3 storm=vec3(cos(stormAngle)*stormRadius,sin(stormAngle)*stormRadius,sin(stormAngle*2.+life*6.2831853)*.43);
  storm.z+=emission*(life-.5)*3.1;storm.y+=emission*(life-.5)*.52;
  p=mix(p,storm,uBlue);
  }

  // 3D & motion: latitude and meridian lines describe a rotating volume.
  if(uDimension>.001){
  float latitude=(floor(aSeed.y*11.)+.5)/11.*3.14159265;
  float longitude=floor(aSeed.y*14.)/14.*6.2831853;
  vec3 parallels=vec3(cos(angle)*sin(latitude),cos(latitude),sin(angle)*sin(latitude));
  vec3 meridians=vec3(sin(angle)*cos(longitude),cos(angle),sin(angle)*sin(longitude));
  vec3 wire=mix(parallels,meridians,step(.5,aSeed.z))*2.05;
  if(aSeed.z>.93){wire=vec3(cos(angle)*2.52,sin(angle)*2.52,0.);wire.yz=spin(.85)*wire.yz;}
  wire.xz=spin(uTime*.24+.5)*wire.xz;
  wire.yz=spin(-.38+.1*sin(uTime*.23))*wire.yz;
  p=mix(p,wire,uDimension);
  }

  // Compositing: three framed planes separate, then periodically register.
  if(uComposite>.001){
  float channel=vChannel-1.;
  float registration=pow(.5+.5*sin(uTime*.48),5.);
  float separation=1.-registration*.7;
  float edge=aSeed.x*4.;
  vec2 frame;
  if(edge<1.)frame=vec2(mix(-1.98,1.98,edge),2.12);
  else if(edge<2.)frame=vec2(1.98,mix(2.12,-2.12,edge-1.));
  else if(edge<3.)frame=vec2(mix(1.98,-1.98,edge-2.),-2.12);
  else frame=vec2(-1.98,mix(-2.12,2.12,edge-3.));
  float border=step(.87,aSeed.y);
  vec3 plate=vec3(mix(p.xy*.78,frame,border),(aSeed.z-.5)*.08);
  plate.xy+=vec2(channel*.64,channel*.32)*separation;
  plate.z+=channel*1.35*separation;
  p=mix(p,plate,uComposite);
  vSplit=uComposite*(.7+.3*separation);vFrame=border*uComposite;
  }

  // Contact settles into a sparse, slowly drifting accent.
  float quietAngle=aSeed.x*6.2831853;
  float envelope=sin(aSeed.x*3.14159265);
  float lane=floor(aSeed.z*3.);
  float trace=sin(quietAngle*1.3-uTime*.22+lane*.6)*envelope;
  vec3 signal=vec3(uContactRect.x+(aSeed.x*2.-1.)*uContactRect.z,uContactRect.y+trace*uContactRect.w*.58+gaussian*.012,(aSeed.y-.5)*.08);
  p=mix(p,signal,uContact);

  // The existing ring points each acquire one image coordinate; no replacement ring is drawn.
  float formation=smoothstep(0.,.82,uWorks)*(1.-uRush);
  float halfWidth=min(uWorkRect.z,uWorkRect.w*uWorkAspect)*.94;
  vec2 halfSize=vec2(halfWidth,halfWidth/max(.01,uWorkAspect));
  vec2 imageUV=aSeed.xy;
  vec3 imageColor=texture2D(uWorkImage,vec2(mix(imageUV.x,1.-imageUV.x,uImageMirror),imageUV.y)).rgb;
  vec3 imagePosition=vec3(uWorkRect.xy+(imageUV*2.-1.)*halfSize,(dot(imageColor,vec3(.299,.587,.114))-.2)*.08);
  vec3 arc=vec3(sin(angle*2.),cos(angle*3.),sin(angle+uTime*.2))*sin(formation*3.14159265)*.48;
  p=mix(p,imagePosition,formation)+arc;
  vWork=formation;vWorkColor=imageColor;
  p=displacePortal(p,uPointer,uPulses,uTime,uWorks,uContact);

  p.z-=uDepth*(1.-uRush);
 }else{
  // Continuous helical curtains: a hollow, flowing volume rather than stacked rings.
  float z=-4.-aSeed.z*137.;
  float lane=(floor(aSeed.x*18.)+fract(aSeed.x*18.)*.55)/18.*6.2831853;
  float a=mix(aSeed.x*6.2831853,lane,.7)+z*.075+uTime*.085;
  float entrance=.3*exp(-max(0.,-z-4.)*.09);
  float folds=.18*sin(a*3.+z*.16-uTime*.25)+.1*sin(a*7.-z*.11);
  float r=2.42+entrance+folds+gaussian*.14;
  p=vec3(cos(a)*r,sin(a)*r,z+.3*sin(a*3.+z*.12));
  if(aSeed.w>.972){
   float dustRadius=sqrt(aSeed.y)*2.1;
   p=vec3(cos(a)*dustRadius,sin(a)*dustRadius,-aSeed.z*134.);
  }
 }
 vec4 view=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*view;
 float distance=-view.z;
 float fade=smoothstep(.15,1.4,distance)*(1.-smoothstep(32.,80.,distance));
 float sparkle=pow(.5+.5*sin(aSeed.y*87.+uTime*1.2),16.);
 float size=(.85+aSeed.y*1.7+sparkle*.35)*uDpr*11./max(1.,distance);
 gl_PointSize=clamp(size*mix(1.,6.5,uHalo),mix(.65,2.,uHalo),mix(4.,24.,uHalo));
 float density=front?1.:.62+uRush*.65;
 vAlpha=(.16+aSeed.y*.4)*fade*density;
 if(front){
  float ink=1.-smoothstep(.85,.995,dot(vWorkColor,vec3(.299,.587,.114)));
  vAlpha*=mix(1.,ink*2.4,vWork)*(1.-uWorkSurface);
  gl_PointSize=mix(gl_PointSize,max(gl_PointSize,1.65*uDpr),vWork);
 }else vAlpha*=1.-uBackdropImage*.55*(1.-uRush);
 float quiet=front&&aSeed.w<.085?.95:0.;
 vAlpha*=mix(1.,mix(quiet,1.,uRush),uContact);
 vAlpha*=mix(1.,1.45,vFrame);
 gl_PointSize*=1.+vFrame*.15;
 vAlpha*=mix(1.,uBlue*.16,uHalo);
 vBlue=uBlue;
}
`;
const fragment=`
uniform float uHalo;
varying float vAlpha,vBlue,vSplit,vChannel,vWork,vFrame;
varying vec3 vWorkColor;
void main(){
 vec2 p=gl_PointCoord*2.-1.;
 float alpha=exp(-dot(p,p)*mix(4.2,3.1,uHalo))*vAlpha;
 if(alpha<.002)discard;
 vec3 ink=vec3(.10,.115,.095);
 vec3 blue=mix(vec3(.035,.22,.85),vec3(.22,.52,1.),uHalo);
 vec3 color=mix(ink,blue,vBlue);
 vec3 passColor=vChannel<.5?vec3(.35,.15,.14):vChannel<1.5?vec3(.14,.29,.21):vec3(.14,.23,.47);
 color=mix(color,passColor,vSplit*.8);
 color=mix(color,pow(max(vWorkColor,vec3(0.)),vec3(1./2.2)),vWork);
 gl_FragColor=vec4(color,alpha);
}
`;
const SCALARS=['uTime','uDepth','uRush','uDpr','uBlue','uDimension','uComposite','uWorks','uContact','uWorkSurface','uWorkAspect','uImageMirror','uBackdropImage'] as const;
type Rect={x:number;y:number;width:number;height:number};
function ParticleField({eco,animate,active}:{eco:boolean;animate:boolean;active:boolean}){
 const material=useRef<THREE.ShaderMaterial>(null),glow=useRef<THREE.ShaderMaterial>(null);
 const invalidate=useThree(s=>s.invalidate);
 const project=useMemo(()=>new THREE.Vector3(),[]),pointer=useMemo(()=>new THREE.Vector3(),[]),direction=useMemo(()=>new THREE.Vector3(),[]),corner=useMemo(()=>new THREE.Vector3(),[]);
 const currentChapter=useRef('landing'),imageChannel=useRef('hero'),heroWasReforming=useRef(false);
 const seeds=useMemo(()=>createPortalSeeds(eco),[eco]);
 const haloSeeds=useMemo(()=>seeds.slice(0,(eco?1600:5600)*4),[seeds,eco]);
 const placeholder=useMemo(()=>{const texture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);texture.needsUpdate=true;return texture;},[]);
 useEffect(()=>()=>placeholder.dispose(),[placeholder]);
 const createUniforms=(halo:number)=>({
  uTime:{value:4.8},uDepth:{value:0},uRush:{value:0},uDpr:{value:1},uBlue:{value:0},uDimension:{value:0},uComposite:{value:0},
  uWorkImage:{value:placeholder},uWorkRect:{value:new THREE.Vector4(0,0,3,2)},uImageMirror:{value:0},uWorkAspect:{value:1.454545},uWorkSurface:{value:0},
  uWorks:{value:0},uBackdropImage:{value:0},uContact:{value:0},uHalo:{value:halo},
  uPointer:{value:new THREE.Vector2(50,50)},uContactRect:{value:new THREE.Vector4(-2,0,2,.7)},
  uPulses:{value:Array.from({length:PULSE_COUNT},()=>new THREE.Vector4(0,0,-1000,0))},
 });
 const uniforms=useMemo(()=>createUniforms(0),[]);
 const haloUniforms=useMemo(()=>createUniforms(1),[]);

 useEffect(()=>{invalidate();return useStudio.subscribe(()=>invalidate());},[invalidate,active,animate,eco]);
 useFrame(({camera,size,viewport},delta)=>{
  const u=material.current?.uniforms,h=glow.current?.uniforms;if(!u||!h)return;
  const dt=Math.min(delta,.05),state=useStudio.getState();
  if(animate)visualBridge.time+=dt;
  const t=visualBridge.time;
  const damp=(key:string,target:number,speed=5)=>{u[key].value=animate?THREE.MathUtils.damp(u[key].value,target,speed,dt):target;};
  damp('uBlue',state.chapter==='about'&&!state.transitioning&&state.craftFocus===0?1:0,state.transitioning?10:5);
  damp('uDimension',state.chapter==='about'&&!state.transitioning&&state.craftFocus===1?1:0,state.transitioning?10:4);
  damp('uComposite',state.chapter==='about'&&!state.transitioning&&state.craftFocus===2?1:0,state.transitioning?10:4);
  const channel=state.chapter==='landing'?'hero':'work';
  const field=visualBridge.images[channel];
  if(imageChannel.current!==channel){u.uWorks.value=0;u.uWorkSurface.value=0;imageChannel.current=channel;}
  const heroReforming=channel==='hero'&&field.detailLive&&state.transitioning&&(state.destination!=='landing'||journey.homeReform>.001);
  u.uWorkImage.value=field.texture||placeholder;
  u.uImageMirror.value=state.locale==='fa'?1:0;
  if(field.texture)u.uWorkAspect.value=textureAspect(field.texture);
  if(heroReforming){
   // The image renderer owns all visible points until its ring is complete.
   u.uWorks.value=0;u.uWorkSurface.value=1-journey.homeHandoff;
   field.surface=1-journey.homeHandoff;field.formation=1;
  }else{
   if(heroWasReforming.current&&channel==='hero'&&state.destination==='landing'){
    u.uWorks.value=1;u.uWorkSurface.value=1;
   }
   const imageActive=channel==='hero'?field.active:state.workPreview;
   const weight=channel==='hero'?journey.homeImage:journey.gallery;
   const workTarget=weight*(imageActive&&(field.texture||field.mapFailed)?1:0);
   u.uWorks.value=animate?u.uWorks.value+Math.sign(workTarget-u.uWorks.value)*Math.min(Math.abs(workTarget-u.uWorks.value),Math.min(delta,.25)/1.45):workTarget;
   field.formation=u.uWorks.value;
   const surfaceTarget=field.open?1:field.detailReady?THREE.MathUtils.smoothstep(u.uWorks.value,.82,1)*(channel==='hero'?journey.homeSurface:1-journey.rush):0;
   u.uWorkSurface.value=animate&&!field.open?THREE.MathUtils.damp(u.uWorkSurface.value,surfaceTarget,12,Math.min(delta,.1)):surfaceTarget;
   field.surface=u.uWorkSurface.value;
  }
  u.uBackdropImage.value=heroReforming?1-journey.homeReform:u.uWorks.value;
  heroWasReforming.current=heroReforming;
  u.uContact.value=journey.contact;
  const mobile=size.width<768;
  const parallax=animate&&!mobile ? (.08+u.uDimension.value*.3)*(1-journey.contact) : 0;
  camera.position.x=(mobile?0:journey.offset*(1-journey.rush))+visualBridge.pointerX*parallax;
  const about=1-THREE.MathUtils.smoothstep(Math.abs(journey.depth-24),0,18);
  camera.position.y=mobile?THREE.MathUtils.lerp(2.25,-1.25,about)*(1-journey.rush):0;
  camera.position.z=(mobile?17.5:10.4)-journey.depth;
  camera.rotation.z=animate?(Math.sin(t*.15)*.008*(1-journey.contact)+journey.rush*.1):0;
  camera.updateMatrixWorld();
  visualBridge.portal.projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  visualBridge.portal.depth=journey.depth*(1-journey.rush);
  const projectPointer=(x:number,y:number,target:THREE.Vector3)=>{
   target.set(x,y,.5).unproject(camera);
   direction.copy(target).sub(camera.position).normalize();
   const divisor=direction.z;
   if(Math.abs(divisor)<.0001){target.set(0,0,-journey.depth);return;}
   const distance=(-journey.depth-camera.position.z)/divisor;
   target.copy(camera.position).addScaledVector(direction,distance);
  };
  const fitRect=(rect:Rect,target:THREE.Vector4)=>{
   if(rect.width<1||rect.height<1)return;
   const rtl=state.locale==='fa'?-1:1;
   const x=((rect.x+rect.width/2)/size.width*2-1)*rtl;
   const y=1-(rect.y+rect.height/2)/size.height*2;
   projectPointer(x,y,project);
   projectPointer(((rect.x+rect.width)/size.width*2-1)*rtl,1-rect.y/size.height*2,corner);
   target.set(project.x,project.y,Math.abs(corner.x-project.x),Math.abs(corner.y-project.y));
  };
  fitRect(visualBridge.contactRect,u.uContactRect.value);
  fitRect(field.rect,u.uWorkRect.value);
  if(currentChapter.current!==state.chapter){
   for(const pulse of visualBridge.pulses)pulse.born=-1000;
   currentChapter.current=state.chapter;
  }
  for(let i=0;i<PULSE_COUNT;i++){
   const pulse=visualBridge.pulses[i];
   if(pulse.needsProjection){
    projectPointer(pulse.x,pulse.y,project);pulse.worldX=project.x;pulse.worldY=project.y;pulse.needsProjection=false;
   }
   u.uPulses.value[i].set(pulse.worldX,pulse.worldY,pulse.born,0);
   h.uPulses.value[i].copy(u.uPulses.value[i]);
  }
  projectPointer(visualBridge.pointerX,visualBridge.pointerY,pointer);u.uPointer.value.set(pointer.x,pointer.y);
  visualBridge.portal.pointer.copy(u.uPointer.value);visualBridge.portal.dpr=viewport.dpr;
  u.uTime.value=t;u.uDepth.value=journey.depth;u.uRush.value=journey.rush;u.uDpr.value=viewport.dpr;
  for(const key of SCALARS)h[key].value=u[key].value;
  h.uWorkImage.value=u.uWorkImage.value;h.uWorkRect.value.copy(u.uWorkRect.value);
  h.uPointer.value.copy(u.uPointer.value);h.uContactRect.value.copy(u.uContactRect.value);
  const centerX=u.uContactRect.value.x*journey.contact;
  const centerY=u.uContactRect.value.y*journey.contact;
  project.set(centerX,centerY,-journey.depth).project(camera);
  visualBridge.x=(state.locale==='fa'?1-(project.x*.5+.5):project.x*.5+.5)*size.width;
  visualBridge.y=(-project.y*.5+.5)*size.height;visualBridge.onProject?.(visualBridge.x,visualBridge.y);
 });
 return <>
  <points frustumCulled={false} renderOrder={1}>
   <bufferGeometry><bufferAttribute attach="attributes-position" args={[haloSeeds,4]}/><bufferAttribute attach="attributes-aSeed" args={[haloSeeds,4]}/></bufferGeometry>
   <shaderMaterial ref={glow} uniforms={haloUniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} toneMapped={false}/>
  </points>
  <points frustumCulled={false} renderOrder={2}>
   <bufferGeometry><bufferAttribute attach="attributes-position" args={[seeds,4]}/><bufferAttribute attach="attributes-aSeed" args={[seeds,4]}/></bufferGeometry>
   <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} toneMapped={false}/>
  </points>
 </>;
}
class SceneBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onError();}
 render(){return this.state.failed?null:this.props.children;}
}
export default function ParticleScene(){
 const host=useRef<HTMLDivElement>(null);
 const animate=useStudio(motionEnabled),obscured=useStudio(s=>s.overlayOpen),transitioning=useStudio(s=>s.transitioning),quality=useStudio(s=>s.quality),locale=useStudio(s=>s.locale);
 const [mobile,setMobile]=useState(true),[ready,setReady]=useState(false),[visible,setVisible]=useState(true),[lost,setLost]=useState(false),[live,setLive]=useState(false),[generation,setGeneration]=useState(0);
 useEffect(()=>{
  const compact=matchMedia('(max-width:767px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const sync=()=>{setMobile(compact.matches);useStudio.getState().setReduced(reduced.matches);setReady(true);};
  const visibility=()=>setVisible(!document.hidden);
  const move=(event:globalThis.PointerEvent)=>{
   const x=event.clientX/window.innerWidth*2-1;
   visualBridge.pointerX=useStudio.getState().locale==='fa'?-x:x;
   visualBridge.pointerY=1-event.clientY/window.innerHeight*2;
  };
  sync();visibility();compact.addEventListener('change',sync);reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pointermove',move,{passive:true});
  return ()=>{compact.removeEventListener('change',sync);reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointermove',move);};
 },[]);
 useEffect(()=>{
  const node=host.current;const onLost=(event:Event)=>{event.preventDefault();setLost(true);setLive(false);};
  node?.addEventListener('webglcontextlost',onLost,true);
  return ()=>node?.removeEventListener('webglcontextlost',onLost,true);
 },[]);
 
 
 useEffect(()=>{visualBridge.workPortalLive=live&&!lost;return ()=>{visualBridge.workPortalLive=false;};},[live,lost]);
 const active=visible&&!obscured,eco=quality==='eco'||mobile;
 return <div ref={host} className="world-canvas" data-live={live&&!lost}>
  {ready&&!lost&&<SceneBoundary key={generation} onError={()=>{setLost(true);setLive(false);}}>
   <Canvas aria-hidden="true" dpr={eco?1:[1,1.5]} frameloop={!active?'never':animate||transitioning?'always':'demand'}
    gl={{alpha:true,antialias:false,powerPreference:'low-power'}} onCreated={({gl})=>{gl.setClearColor(0xedece7,0);setLive(true);}}>
    <PerspectiveCamera makeDefault fov={46} position={[-2.65,0,10.4]} near={.1} far={160}/>
    <ParticleField eco={eco} animate={animate&&active} active={active}/>
   </Canvas>
  </SceneBoundary>}
  {lost&&<button className="canvas-retry" onClick={()=>{setLost(false);setGeneration(n=>n+1);}}>{experienceCopy[locale].retryScene} ↗</button>}
 </div>;
}
