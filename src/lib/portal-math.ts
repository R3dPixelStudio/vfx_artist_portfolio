// Shared by the tunnel and image renderer so their portal silhouettes agree.
export const portalPointGLSL=`
vec3 portalPoint(vec3 seed,float clock){
 float flow=fract(seed.x+clock*.032);
 float angle=flow*6.2831853;
 float gaussian=clamp(sqrt(-2.*log(max(seed.y,.001)))*cos(seed.z*6.2831853),-2.2,2.2);
 float width=.16+.11*(.5+.5*sin(angle*3.+clock*.2));
 float radius=2.28+.13*sin(angle*3.-clock*.18)+gaussian*width;
 vec3 point=vec3(cos(angle)*radius,sin(angle)*radius*1.08,(seed.z-.5)*1.75);
 float curl=clock*.4+flow*20.+seed.z*6.2831853;
 point.xy+=vec2(sin(curl),cos(curl*1.2))*width*.28;
 point.z+=sin(angle*3.-clock*.23)*.32;
 return point;
}

vec3 displacePortal(vec3 p,vec2 pointer,vec4 pulses[6],float clock,float works,float contact){
 vec2 displacement=vec2(0.);
 float recoil=0.;
 for(int i=0;i<6;i++){
  float age=max(0.,clock-pulses[i].z);
  if(age<4.){
   recoil+=.014*exp(-age*3.);
   vec2 delta=p.xy-pulses[i].xy;
   float distance=length(delta);
   float wave=exp(-pow((distance-age*2.5)*2.,2.))*exp(-age*.9);
   displacement+=delta/max(distance,.001)*wave*.3;
  }
 }
 float strength=length(displacement);
 p.xy+=displacement*min(1.,.55/max(strength,.001))*(1.-contact);
 p.xy*=1.+min(recoil,.075)*(1.-works)*(1.-contact);
 vec2 delta=p.xy-pointer;
 float distance=length(delta);
 p.xy+=delta/max(distance,.001)*exp(-distance*distance*1.2)*.12*(1.-contact);
 return p;
}
`;

export function createPortalSeeds(eco:boolean){
 let seed=1937;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 return Float32Array.from({length:(eco?28000:76000)*4},random);
}
export function createPortalCorrespondence(eco:boolean,count:number){
 const seeds=createPortalSeeds(eco),points=new Float32Array(count*4);
 let index=0;
 for(let i=0;i<seeds.length&&index<count;i+=4){
  if(seeds[i+3]>=.58)continue;
  points.set(seeds.subarray(i,i+3),index*4);points[index*4+3]=1;index++;
 }
 // Extra image samples remain visible in the image, but do not add density to the portal.
 for(let i=index;i<count;i++)points.set(points.subarray((i%index)*4,(i%index)*4+3),i*4);
 return points;
}
