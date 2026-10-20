import type {Locale} from './content';
import type {Chapter} from './store';

export const sectionSlugs:Record<Chapter,string>={landing:'',about:'about',gallery:'works',contact:'contact'};
export function sectionHref(locale:Locale,chapter:Chapter){
 const slug=sectionSlugs[chapter];
 return '/'+locale+'/'+(slug?slug+'/':'');
}
export function chapterFromPath(pathname:string):Chapter|null{
 const parts=pathname.split('/').filter(Boolean);
 if(parts[0]==='en'||parts[0]==='fa')parts.shift();
 if(parts.length===0)return 'landing';
 if(parts.length!==1)return null;
 return parts[0]==='about'?'about':parts[0]==='works'?'gallery':parts[0]==='contact'?'contact':null;
}
