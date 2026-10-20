import type { ReactNode } from 'react';
import {StudioShell} from '@/components/studio-shell';
import { siteMetadata } from '@/lib/metadata';
import '../globals.css';
export const metadata = siteMetadata('fa');
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="fa" dir="rtl"><body><StudioShell locale="fa">{children}</StudioShell></body></html>;
}
