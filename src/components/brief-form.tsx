'use client';
import { useState, type FormEvent } from 'react';
import { copy, type Locale } from '@/lib/content';

export function BriefForm({ locale, recipient }: { locale: Locale; recipient?: string }) {
  const t = copy[locale];
  const [status, setStatus] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = [
      'VFX FREELANCER — PROJECT BRIEF', '',
      `${t.name}: ${form.get('name')}`, `${t.email}: ${form.get('email')}`,
      `${t.service}: ${form.get('service')}`, `${t.timeline}: ${form.get('timeline')}`,
      '', `${t.description}:`, String(form.get('description')),
    ].join('\n');
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value === 'email' && recipient) {
      window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent('New VFX project brief')}&body=${encodeURIComponent(text)}`;
      setStatus(t.emailSuccess);
    } else {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'vfx-project-brief.txt'; anchor.click();
      // The click has consumed the URL before the next task releases it.
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus(t.success);
    }
  }
  return <>
    <p className="eyebrow accent">LET’S CREATE / VFX FREELANCER</p>
    <h2 className="dialog-title">{t.dialogTitle}</h2>
    <p className="muted dialog-intro">{t.dialogIntro}</p>
    <form onSubmit={submit} className="brief-form">
      <div className="form-row">
        <label>{t.name}<input name="name" autoComplete="name" required maxLength={100} /></label>
        <label>{t.email}<input name="email" type="email" autoComplete="email" required maxLength={160} dir="ltr" /></label>
      </div>
      <div className="form-row">
        <label>{t.service}<select name="service">{t.disciplines.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>{t.timeline}<select name="timeline">{t.timelines.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label>{t.description}<textarea name="description" rows={4} required minLength={15} maxLength={2500} placeholder={t.placeholder} /></label>
      <p className="privacy">{t.privacy}</p>
      <button className="button button-orange" type="submit" value="download">{t.download}<span aria-hidden="true">↓</span></button>
      {recipient && <button className="text-button" type="submit" value="email">{t.send} ↗</button>}
      <p className="form-status" role="status">{status}</p>
    </form>
  </>;
}
