import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
for (const [route,lang,dir] of [['index.html','en','ltr'],['en/index.html','en','ltr'],['fa/index.html','fa','rtl']]) {
  test(route + ' has localized prerendered chapters and available assets', async () => {
    const html = await readFile(resolve('out',route),'utf8');
    assert.match(html,new RegExp('<html[^>]*lang="' + lang + '"[^>]*dir="' + dir + '"'));
    for (const id of ['landing-title','about-title','gallery-title','contact-title']) assert.ok(html.includes('id="' + id + '"'));
    assert.ok(html.includes('REDDPIXEL'));
    assert.ok(html.includes(lang === 'en' ? 'Unreal.' : 'فراتر از واقعیت.'));
    const assets = [...html.matchAll(/(?:src|href)="(\/(?:_next|art)\/[^"?#]+)/g)].map(m => m[1]);
    assert.ok(assets.length > 3);
    await Promise.all(assets.map(asset => access(resolve('out','.' + asset))));
  });
}
test('admin shell is excluded from indexing and export includes security headers',async () => {
  const admin = await readFile('out/admin/index.html','utf8');
  assert.match(admin, /name="robots" content="noindex, nofollow"/);
  assert.match(await readFile('out/_headers','utf8'),/X-Content-Type-Options: nosniff/);
  await access('out/404.html');
});
