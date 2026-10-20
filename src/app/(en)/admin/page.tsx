import type { Metadata } from 'next';
import { AdminPanel } from '@/components/admin-panel';
import '../../admin.css';
export const metadata: Metadata = { title: 'Studio desk — Arman Mehr', robots: { index:false, follow:false } };
export default function Page() { return <AdminPanel />; }
