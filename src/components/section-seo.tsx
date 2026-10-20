import type {Locale} from '@/lib/content';
import {studies} from '@/lib/content';
import type {Chapter} from '@/lib/store';
import {sectionHref} from '@/lib/routes';
import {sectionDescriptions} from '@/lib/metadata';
import {defaultProfile} from '@/lib/profile';

export function SectionSEO({locale,chapter}:{locale:Locale;chapter:Chapter}){
 const origin=process.env.NEXT_PUBLIC_SITE_URL;
 const absolute=(path:string)=>origin?new URL(path,origin).href:undefined;
 const page=sectionDescriptions[locale][chapter],url=absolute(sectionHref(locale,chapter));
 const person={'@type':'Person',name:locale==='en'?defaultProfile.name_en:defaultProfile.name_fa,jobTitle:locale==='en'?'Independent VFX and motion artist':'هنرمند مستقل جلوه‌های بصری و موشن',knowsAbout:['Visual effects','Particle simulation','3D motion design','Compositing']};
 const graph=[
  {'@type':'WebSite',name:'Arman Mehr',...(origin?{'@id':absolute('/#website'),url:absolute('/en/')}:{}),inLanguage:['en','fa']},
  {'@type':chapter==='gallery'?'CollectionPage':chapter==='contact'?'ContactPage':chapter==='about'?'AboutPage':'WebPage',name:page.title,description:page.description,inLanguage:locale,...(url?{'@id':url,url}:{}),about:person,
   ...(chapter==='gallery'?{hasPart:studies.map(study=>({'@type':'CreativeWork',name:study.title[locale],description:study.description[locale],keywords:study.tags.join(', '),...(origin?{image:absolute(study.image)}:{})}))}:{})},
  ...(origin?[{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:locale==='en'?'Home':'آغاز',item:absolute(sectionHref(locale,'landing'))},...(chapter==='landing'?[]:[{'@type':'ListItem',position:2,name:page.title,item:url}])]}]:[]),
 ];
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}}/>;
}
