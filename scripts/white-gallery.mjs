import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
mkdirSync('public/art/white',{recursive:true});mkdirSync('public/art/previews',{recursive:true});
const names=['entropy','soft-matter','afterlight','phase-shift','silk-memory','fracture','event-horizon','echo'];
for(const name of names){for(let frame=0;frame<3;frame++){
 const {data,info}=await sharp('public/art/frames/'+name+'-'+frame+'.webp').removeAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=info.channels){const lum=data[i]*.299+data[i+1]*.587+data[i+2]*.114;const value=Math.max(22,Math.round(255-Math.max(0,lum-34)*1.38));data[i]=value;data[i+1]=value;data[i+2]=value;}
 await sharp(data,{raw:{width:info.width,height:info.height,channels:3}}).webp({quality:92}).toFile('public/art/white/'+name+'-'+frame+'.webp');
 if(frame===0)await sharp(data,{raw:{width:info.width,height:info.height,channels:3}}).resize(640).webp({quality:88}).toFile('public/art/previews/'+name+'.webp');
 }console.log(name);}
