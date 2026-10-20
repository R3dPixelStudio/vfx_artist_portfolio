import {Matrix4,Vector2,type Texture} from 'three';

export const PULSE_COUNT=6;
export type ImageChannel={
 rect:{x:number;y:number;width:number;height:number};
 texture:Texture|null;formation:number;surface:number;detailReady:boolean;detailLive:boolean;
 open:boolean;mapFailed:boolean;active:boolean;mode:number;
};
const imageChannel=():ImageChannel=>({
 rect:{x:0,y:0,width:0,height:0},texture:null,formation:0,surface:0,
 detailReady:false,detailLive:false,open:false,mapFailed:false,active:false,mode:0,
});
export const visualBridge={
 time:4.8,pointerX:0,pointerY:0,portal:{projection:new Matrix4(),depth:0,pointer:new Vector2(50,50),dpr:1},
 pulses:Array.from({length:PULSE_COUNT},()=>({born:-1000,x:0,y:0,worldX:0,worldY:0,needsProjection:false})),
 pulseCursor:0,images:{hero:imageChannel(),work:imageChannel()},workPortalLive:false,
 contactRect:{x:0,y:0,width:0,height:0},
 craft:1,x:0,y:0,onProject:null as null|((x:number,y:number)=>void),
};
export function queueParticlePulse(x:number,y:number){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 const pulse=visualBridge.pulses[visualBridge.pulseCursor];
 pulse.born=visualBridge.time;pulse.x=Math.max(-1,Math.min(1,x));pulse.y=Math.max(-1,Math.min(1,y));pulse.needsProjection=true;
 visualBridge.pulseCursor=(visualBridge.pulseCursor+1)%PULSE_COUNT;
}
