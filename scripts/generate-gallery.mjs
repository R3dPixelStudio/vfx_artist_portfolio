import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
mkdirSync('public/art/frames',{recursive:true});
const names=['entropy','soft-matter','afterlight','phase-shift','silk-memory','fracture','event-horizon','echo'];
const palettes=[['#dbc098','#8d6e45'],['#e1e7e8','#637180'],['#d5e0b0','#727e55'],['#b5d2d6','#3e6571'],['#dfcfc0','#8b7366'],['#d6d8d0','#6b746c'],['#d6d2c0','#8a8168'],['#c4d0ba','#5f7668']];
for(let n=0;n<names.length;n++)for(let f=0;f<3;f++){
 let seed=932+n*91+f*7;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const [bright,dim]=palettes[n];let body='';const phase=f*.8;
 if(n===2||n===6){
  body+='<ellipse cx="800" cy="935" rx="490" ry="28" fill="'+dim+'" opacity=".15" filter="url(#blur)"/>';
  const cx=800+f*45,cy=470-f*40,r=230+f*22;
  body+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="url(#halo)" filter="url(#blur)" opacity=".8"/><circle cx="'+cx+'" cy="'+cy+'" r="'+(r*.88)+'" fill="#0a0f0f"/>';
  for(let j=0;j<120;j++){const a=j/120*Math.PI*2;body+='<ellipse cx="'+cx+'" cy="'+(cy+175)+'" rx="'+(r+80+j*1.3)+'" ry="'+(35+j*.27)+'" fill="none" stroke="'+bright+'" stroke-width=".5" opacity="'+(.03+rnd()*.14)+'" transform="rotate('+(-16+f*7)+' '+cx+' '+(cy+175)+')"/>';}
 }else if(n===5){
  for(let j=0;j<180;j++){
   const a=j*2.39996+phase,r=Math.sqrt(j/180)*360,x=800+Math.cos(a)*r,y=550+Math.sin(a)*r*.85;
   const w=15+rnd()*65,h=20+rnd()*100;
   body+='<path d="M'+x+' '+y+'l'+w+' '+(-h)+' '+(w*.35)+' '+(h*1.5)+'z" fill="url(#metal)" stroke="'+bright+'" stroke-opacity=".2" stroke-width=".7" transform="rotate('+(a*57.3+f*20)+' '+x+' '+y+')"/>';
  }
 }else if(n===1||n===4){
  for(let j=0;j<260;j++){
   const t=j/259;let d='';
   for(let k=0;k<=180;k++){
    const u=k/180*Math.PI*2,rx=190+t*340,ry=75+t*235;
    let x=rx*Math.cos(u),y=ry*Math.sin(u),z=110*Math.sin(u*3+phase+t*4);
    if(n===4){x=(t-.5)*900;y=(k/180-.5)*650;z=100*Math.sin(t*8+k/180*7+phase)+100*Math.cos(k/180*9+t*5);}
    const xx=800+x*.9+z*.5,yy=550+y*.75+x*.25-z*.4;
    d+=(k?'L':'M')+xx.toFixed(1)+' '+yy.toFixed(1);
   }
   body+='<path d="'+d+'" fill="none" stroke="'+(j%9===0?bright:dim)+'" stroke-width="'+(j%9===0?1.4:.7)+'" opacity="'+(.2+.65*Math.pow(Math.sin(t*15+phase)*.5+.5,3))+'"/>';
  }
 }else{
  let dots=[];
  for(let j=0;j<23000;j++){
   const u=rnd()*Math.PI*2,v=rnd()*Math.PI*2,t=rnd(),spread=(rnd()-.5)*22;
   let x,y,z;
   if(n===0){const r=240+75*Math.cos(3*u+phase);x=r*Math.cos(2*u);y=r*Math.sin(2*u);z=100*Math.sin(3*u+phase);x+=spread*Math.cos(v);y+=spread*Math.sin(v);}
   else if(n===3){const r=180+120*Math.sin(u*2+phase)*Math.cos(v);x=(r+90*Math.cos(v))*Math.cos(u);y=(r+90*Math.cos(v))*Math.sin(u);z=95*Math.sin(v+u*3);}
   else{const r=100+300*t;x=r*Math.cos(u);y=140*Math.sin(u)+100*Math.sin(t*7+phase);z=r*Math.sin(u)*.45;}
   const xx=800+x*1.25+z*.5,yy=550+y*.94+x*.12-z*.48;
   dots.push({z,text:'<circle cx="'+xx.toFixed(1)+'" cy="'+yy.toFixed(1)+'" r="'+(.35+rnd()*1.3).toFixed(2)+'" fill="'+(rnd()>.58?bright:dim)+'" opacity="'+(.2+rnd()*.7).toFixed(2)+'"/>'});
  }body+=dots.sort((a,b)=>a.z-b.z).map(p=>p.text).join('');
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100"><defs><radialGradient id="bg"><stop stop-color="#202724"/><stop offset="1" stop-color="#090d0e"/></radialGradient><radialGradient id="halo"><stop offset=".7" stop-color="'+dim+'" stop-opacity="0"/><stop offset=".91" stop-color="'+bright+'"/><stop offset="1" stop-color="'+bright+'" stop-opacity="0"/></radialGradient><linearGradient id="metal" x2=".8" y2="1"><stop stop-color="'+bright+'"/><stop offset=".3" stop-color="'+dim+'"/><stop offset="1" stop-color="#111a19"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="25"/></filter></defs><rect width="1600" height="1100" fill="url(#bg)"/>'+body+'</svg>';
 await sharp(Buffer.from(svg)).webp({quality:90}).toFile('public/art/frames/'+names[n]+'-'+f+'.webp');
 console.log(names[n]+' / '+(f+1));
}
