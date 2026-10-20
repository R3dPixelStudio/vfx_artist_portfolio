import {SectionSEO} from '@/components/section-seo';
import {siteMetadata} from '@/lib/metadata';
export const metadata=siteMetadata('en','gallery');
export default function Page(){return <SectionSEO locale="en" chapter="gallery"/>;}
