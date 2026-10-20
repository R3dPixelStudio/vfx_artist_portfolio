import type {Texture} from 'three';

export function textureAspect(texture:Texture,fallback=1.454545):number{
 const image:unknown=texture.image;
 if(!image||typeof image!=='object'||!('width' in image)||!('height' in image))return fallback;
 const {width,height}=image;
 return typeof width==='number'&&typeof height==='number'&&Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0?width/height:fallback;
}
