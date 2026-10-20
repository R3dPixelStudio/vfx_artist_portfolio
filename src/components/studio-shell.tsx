'use client';
import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';
import type {Locale} from '@/lib/content';
import {chapterFromPath} from '@/lib/routes';
import {Studio} from './studio';

export function StudioShell({locale,children}:{locale:Locale;children:ReactNode}){
 const chapter=chapterFromPath(usePathname());
 return chapter===null?children:<Studio locale={locale} routeChapter={chapter}>{children}</Studio>;
}
