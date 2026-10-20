'use client';
import {useEffect,useRef} from 'react';
import {LinearFilter,SRGBColorSpace,TextureLoader,type Texture} from 'three';
import {visualBridge,type ImageChannel} from '@/lib/visual-bridge';
import {useStudio} from '@/lib/store';

// Each scene owns a bounded cache. Stale async loads never change its current texture.
export function useParticleMap(src:string|undefined,active:boolean,field:ImageChannel){
 const maps=useRef(new Map<string,Texture>());
 useEffect(()=>{
  if(!active||!src)return;
  let alive=true;
  const accept=(texture:Texture)=>{
   if(!alive){texture.dispose();return;}
   texture.colorSpace=SRGBColorSpace;texture.generateMipmaps=false;
   texture.minFilter=LinearFilter;texture.magFilter=LinearFilter;
   maps.current.set(src,texture);field.texture=texture;field.mapFailed=false;
   for(const [key,map] of maps.current)if(maps.current.size>3&&map!==texture){maps.current.delete(key);map.dispose();}
   useStudio.getState().pulsePortal();
  };
  const known=maps.current.get(src);
  if(known){field.texture=known;field.mapFailed=false;useStudio.getState().pulsePortal();}
  else new TextureLoader().load(src,accept,undefined,()=>{if(alive){field.mapFailed=true;useStudio.getState().pulsePortal();}});
  return ()=>{alive=false;};
 },[src,active,field]);
 useEffect(()=>()=>{
  field.texture=null;field.detailLive=false;field.active=false;field.open=false;field.detailReady=false;field.mapFailed=false;
  for(const texture of maps.current.values())texture.dispose();
  maps.current.clear();
 },[field]);
}
