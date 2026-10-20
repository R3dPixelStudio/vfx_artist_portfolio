import type {MetadataRoute} from 'next';
import {sectionHref,sectionSlugs} from '@/lib/routes';
import type {Chapter} from '@/lib/store';
export const dynamic='force-static';
export default function sitemap():MetadataRoute.Sitemap{
 const origin=process.env.NEXT_PUBLIC_SITE_URL;if(!origin)return [];
 return (['en','fa'] as const).flatMap(locale=>(Object.keys(sectionSlugs) as Chapter[]).map(chapter=>({
  url:new URL(sectionHref(locale,chapter),origin).href,
  alternates:{languages:{en:new URL(sectionHref('en',chapter),origin).href,fa:new URL(sectionHref('fa',chapter),origin).href}},
 })));
}
