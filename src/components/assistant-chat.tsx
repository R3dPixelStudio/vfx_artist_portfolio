'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/content';
import { experienceCopy } from '@/lib/experience-copy';
import { contactLinks, type StudioProfile } from '@/lib/profile';
import { LiveMark } from './live-mark';
type Message = { role: 'user' | 'assistant'; content: string };

export function AssistantChat({ locale, profile, onBrief }: { locale: Locale; profile: StudioProfile; onBrief: () => void }) {
  const t = experienceCopy[locale];
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const transcript = useRef<HTMLDivElement>(null);
  const links = contactLinks(profile);
  useEffect(() => () => { const request = controller.current; controller.current = null; request?.abort(); }, []);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: 'instant' });
  }, [messages, busy, error]);
  async function send(value: string) {
    const text = value.trim();
    if (!text || busyRef.current) return;
    const next: Message[] = [...messages, { role: 'user', content: text.slice(0, 1200) }];
    setMessages(next); setDraft(''); setError(''); setBusy(true); busyRef.current = true;
    const request = new AbortController(); controller.current = request;
    const timeout = setTimeout(() => request.abort(), 25000);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, messages: next.slice(-12).reduceRight<Message[]>((history, message) => { if (history.reduce((sum, item) => sum + item.content.length, 0) + message.content.length <= 9000) history.unshift(message); return history; }, []) }), signal: request.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.code === 'NOT_CONFIGURED' ? 'offline' : data.code === 'RATE_LIMITED' ? 'rate' : 'upstream');
      if (typeof data.reply !== 'string') throw new Error('upstream');
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (reason) {
      if (!request.signal.aborted) setError(reason instanceof Error && reason.message === 'offline' ? t.offline :
        reason instanceof Error && reason.message === 'rate' ? (locale === 'en' ? 'A few too many messages. Please try again in a minute.' : 'تعداد پیام‌ها زیاد است. یک دقیقه دیگر تلاش کنید.') : t.retry);
      else if (controller.current === request) setError(locale === 'en' ? 'Response stopped. Your message is still here.' : 'پاسخ متوقف شد. پیام شما اینجا باقی مانده است.');
    } finally {
      clearTimeout(timeout);
      if (controller.current === request) { setBusy(false); busyRef.current = false; controller.current = null; }
    }
  }
  function clear() {
    const request = controller.current; controller.current = null; request?.abort();
    busyRef.current = false; setBusy(false); setMessages([]); setError(''); setDraft('');
  }
  return <div className="conversation-card">
    <div className="chat-heading"><span className="assistant-glyph" aria-hidden="true">✳</span><div><h3>{t.assistant}</h3><p>{t.assistantNote}</p></div><LiveMark /></div>
    <div className="chat-transcript" ref={transcript} role="log" aria-live="polite" aria-relevant="additions text">
      <p className="chat-bubble assistant">{t.chatWelcome}</p>
      {messages.map((message, i) => <p key={i} className={`chat-bubble ${message.role}`}><span className="sr-only">{message.role === 'user' ? (locale === 'en' ? 'You: ' : 'شما: ') : t.assistant + ': '}</span>{message.content}</p>)}
      {busy && <p className="chat-thinking">{t.thinking}</p>}
      {error && <p className="chat-error" role="status">{error}</p>}
    </div>
    {messages.length === 0 && <div className="chat-prompts">{t.prompts.map((prompt) => <button key={prompt} onClick={() => void send(prompt)} disabled={busy}>{prompt}<span>↗</span></button>)}</div>}
    <form className="chat-compose" onSubmit={(event: FormEvent) => { event.preventDefault(); void send(draft); }}>
      <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.chatPlaceholder} aria-label={t.chatPlaceholder} maxLength={1200} disabled={busy} />
      {busy ? <button type="button" onClick={() => controller.current?.abort()} aria-label={t.stop}>■</button> : <button type="submit" disabled={!draft.trim()} aria-label={t.send}>↑</button>}
    </form>
    <div className="chat-meta"><p>{t.privacy}</p>{messages.length > 0 && <button onClick={clear}>{t.clear}</button>}</div>
    <div className="direct-contact"><div><span>{t.direct}</span><button onClick={onBrief}>{t.brief} ↗</button></div>
      {links.length > 0 ? <div className="contact-links">{links.map((link) => <a key={link.label} href={link.href} target={link.href.startsWith('https:') ? '_blank' : undefined} rel="noopener noreferrer">{link.label} ↗</a>)}</div> : <p>{t.unset}</p>}
    </div>
  </div>;
}
