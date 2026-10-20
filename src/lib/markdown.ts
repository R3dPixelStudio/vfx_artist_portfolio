export const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]!));
function inline(text: string) {
  const plain = (value: string) => escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  let output = ''; let cursor = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    output += plain(text.slice(cursor, match.index));
    const href = match[2];
    let safe = /^\/(?!\/)/.test(href) && !/[\\\r\n]/.test(href);
    try { const parsed = new URL(href); safe ||= parsed.protocol === 'https:' && !parsed.username && !parsed.password; } catch {}
    output += safe ? '<a href="' + escapeHtml(href) + '">' + plain(match[1]) + '</a>' : plain(match[0]);
    cursor = match.index! + match[0].length;
  }
  return output + plain(text.slice(cursor));
}
export function renderMarkdown(markdown: string) {
  const lines = markdown.replace(/\r/g, '').split('\n'); let output = ''; let paragraph: string[] = []; let list = false; let code: string[] | null = null;
  const flush = () => { if (paragraph.length) { output += '<p>' + inline(paragraph.join(' ')) + '</p>'; paragraph = []; } if (list) { output += '</ul>'; list = false; } };
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (code !== null) { output += '<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>'; code = null; }
      else { flush(); code = []; }
      continue;
    }
    if (code !== null) { code.push(line); continue; }
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flush(); const level = Math.max(2, heading[1].length); output += '<h' + level + '>' + inline(heading[2]) + '</h' + level + '>'; continue; }
    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) { if (paragraph.length) { output += '<p>' + inline(paragraph.join(' ')) + '</p>'; paragraph = []; } if (!list) { output += '<ul>'; list = true; } output += '<li>' + inline(item[1]) + '</li>'; continue; }
    if (list) { output += '</ul>'; list = false; }
    paragraph.push(line);
  }
  if (code !== null) output += '<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>';
  flush(); return output;
}
