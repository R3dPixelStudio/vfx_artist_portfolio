import type {Metadata} from 'next';
import type {Locale} from './content';
import type {Chapter} from './store';
import {sectionHref} from './routes';

export const sectionDescriptions={
 en:{
  landing:{title:'VFX Artist & Motion Design — Arman Mehr',description:'Independent visual effects, particle simulation, 3D motion and compositing. Explore interactive visual studies, meet the artist, and discuss your next project.'},
  about:{title:'About the VFX Artist — Arman Mehr',description:'Explore an independent visual practice in particle simulation, 3D motion, materials, light and compositing. Meet the artist behind the imagined worlds.'},
  gallery:{title:'Selected VFX & 3D Motion Work — Arman Mehr',description:'Explore Kinetic bloom, Soft matter and Afterlight: concept studies in particle art, procedural form and compositing, with full project image galleries.'},
  contact:{title:'Hire a VFX & Motion Artist — Arman Mehr',description:'Discuss a visual effects, particle simulation, 3D motion or compositing project. Prepare a creative brief and find the studio’s available contact channels.'},
 },
 fa:{
  landing:{title:'هنرمند جلوه‌های بصری و موشن — Arman Mehr',description:'جلوه‌های بصری مستقل، شبیه‌سازی ذرات، موشن سه‌بعدی و کامپوزیت. تجربه‌های تعاملی را ببینید، با هنرمند آشنا شوید و درباره پروژه خود گفتگو کنید.'},
  about:{title:'درباره هنرمند جلوه‌های بصری — Arman Mehr',description:'آشنایی با نگاه یک هنرمند مستقل در شبیه‌سازی ذرات، موشن سه‌بعدی، متریال، نور و کامپوزیت؛ سه وجه از یک نگاه خلاق.'},
  gallery:{title:'آثار منتخب جلوه‌های بصری و موشن — Arman Mehr',description:'مجموعه‌های شکوفایی جنبش، ماده نرم و پس‌تاب؛ مطالعات مفهومی در هنر ذرات، فرم مولد و کامپوزیت، همراه با گالری تصاویر هر اثر.'},
  contact:{title:'همکاری با هنرمند جلوه‌های بصری — Arman Mehr',description:'برای پروژه جلوه‌های بصری، شبیه‌سازی ذرات، موشن سه‌بعدی یا کامپوزیت گفتگو کنید؛ بریف بسازید و راه‌های ارتباط موجود را ببینید.'},
 },
};
export function siteMetadata(locale:Locale,chapter:Chapter='landing'):Metadata{
 const origin=process.env.NEXT_PUBLIC_SITE_URL;
 const {title,description}=sectionDescriptions[locale][chapter];
 const path=sectionHref(locale,chapter);
 const keywords=locale==='en'?['VFX artist','visual effects','particle simulation','3D motion design','compositing','procedural art','freelance VFX']:['هنرمند جلوه‌های بصری','شبیه‌سازی ذرات','موشن سه‌بعدی','کامپوزیت','هنر مولد','فریلنسر جلوه‌های بصری'];
 const images=origin?[{url:new URL('/art/templates/kinetic-bloom.webp',origin).href,width:1600,height:1100,alt:locale==='en'?'Kinetic bloom — a particle art concept study':'شکوفایی جنبش — مطالعه مفهومی هنر ذرات'}]:undefined;
 return {
  title,description,keywords,applicationName:'Arman Mehr',
  ...(origin?{metadataBase:new URL(origin),alternates:{canonical:path,languages:{en:sectionHref('en',chapter),fa:sectionHref('fa',chapter),'x-default':sectionHref('en',chapter)}}}:{}),
  openGraph:{title,description,type:'website',siteName:'Arman Mehr',locale:locale==='en'?'en_US':'fa_IR',alternateLocale:locale==='en'?['fa_IR']:['en_US'],...(origin?{url:path,images}: {})},
  twitter:{card:origin?'summary_large_image':'summary',title,description,...(images?{images:images.map(image=>image.url)}:{})},
  robots:{index:true,follow:true},icons:{icon:'/icon.svg'},
 };
}
