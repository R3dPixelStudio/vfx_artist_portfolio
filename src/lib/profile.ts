export type StudioProfile = {
  name_en: string; name_fa: string; expertise_en: string; expertise_fa: string;
  email: string; instagram: string; telegram: string; whatsapp: string;
  is_demo: boolean;
};
export const defaultProfile: StudioProfile = {
  name_en: 'Arman Mehr', name_fa: 'آرمان مهر',
  expertise_en: 'Visual effects, procedural particle art, 3D motion and compositing. The gallery currently contains concept studies, not client commissions.',
  expertise_fa: 'جلوه‌های بصری، هنر مولد با ذرات، موشن سه‌بعدی و کامپوزیت. گالری فعلاً شامل مطالعات مفهومی است، نه پروژه‌های مشتری.',
  email: '', instagram: '', telegram: '', whatsapp: '', is_demo: true,
};
export function contactLinks(profile: StudioProfile) {
  return [
    { label: 'Email', href: profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) ? 'mailto:' + profile.email : '' },
    { label: 'Instagram', href: safeContact(profile.instagram, ['instagram.com', 'www.instagram.com']) },
    { label: 'Telegram', href: safeContact(profile.telegram, ['t.me']) },
    { label: 'WhatsApp', href: safeContact(profile.whatsapp, ['wa.me', 'api.whatsapp.com']) },
  ].filter((link) => link.href);
}
export function safeContact(value: string, hosts: string[]) {
  try { const url = new URL(value); return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
