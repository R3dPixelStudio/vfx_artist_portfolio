import type { ReactNode } from 'react';
import {StudioShell} from '@/components/studio-shell';
import { siteMetadata } from '@/lib/metadata';
import '../globals.css';
export const metadata = siteMetadata('en');
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en" dir="ltr"><body><StudioShell locale="en">{children}</StudioShell></body></html>;
}
