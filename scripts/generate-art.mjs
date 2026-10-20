import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('public/art', { recursive: true });
let seed = 57;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const svg = (body) => '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1100" viewBox="0 0 1200 1100">' + body + '</svg>';
let points = [];
for (let i = 0; i < 16500; i++) {
  const t = rand() * Math.PI * 2, a = rand() * Math.PI * 2, w = Math.pow(rand(), 1.6) * 55;
  const r = 290 + 90 * Math.cos(3 * t);
  let x = r * Math.cos(2 * t), y = r * Math.sin(2 * t), z = 110 * Math.sin(3 * t);
  x += w * Math.cos(a); y += w * Math.sin(a); z += w * Math.sin(a + t);
  const xx = x * 0.89 + z * 0.45, zz = -x * 0.45 + z * 0.89;
  const yy = y * 0.92 + xx * 0.25;
  const perspective = 1000 / (1000 - zz);
  const light = rand();
  points.push({ z: zz, text: '<circle cx="' + (600 + xx * perspective).toFixed(1) + '" cy="' + (545 + yy * perspective).toFixed(1) + '" r="' + (0.4 + light * 1.15).toFixed(2) + '" fill="' + (light > 0.8 ? '#ffcf91' : light > 0.4 ? '#f88b4a' : '#a7411e') + '" opacity="' + (0.25 + light * 0.7).toFixed(2) + '"/>' });
}
writeFileSync('public/art/entropy.svg', svg('<defs><radialGradient id="g"><stop stop-color="#bd4516" stop-opacity=".08"/><stop offset="1" stop-color="#bd4516" stop-opacity="0"/></radialGradient></defs><ellipse cx="600" cy="550" rx="500" ry="480" fill="url(#g)"/>' + points.sort((a, b) => a.z - b.z).map(p => p.text).join('')));
let ribbons = '';
for (let i = 0; i < 190; i++) {
  const t = i / 189, angle = t * Math.PI * 2;
  const cx = 600 + Math.sin(angle * 2) * 45, cy = 540 + Math.cos(angle * 3) * 18;
  const rx = 120 + t * 300, ry = 75 + t * 250;
  const lum = Math.round(55 + Math.pow(Math.sin(t * 21) * 0.5 + 0.5, 2) * 180);
  ribbons += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" transform="rotate(' + (-40 + Math.sin(t * 5) * 23).toFixed(1) + ' 600 550)" fill="none" stroke="rgb(' + (lum * 0.85).toFixed(0) + ',' + (lum * 0.89).toFixed(0) + ',' + lum + ')" stroke-width="2.3"/>';
}
writeFileSync('public/art/soft-matter.svg', svg('<defs><radialGradient id="g"><stop stop-color="#292837"/><stop offset="1" stop-color="#111113"/></radialGradient></defs><rect width="1200" height="1100" fill="url(#g)"/>' + ribbons));
let beams = '';
for (let i = 0; i < 100; i++) {
  const x = 370 + i * 4.7, height = 110 + Math.sin(i / 100 * Math.PI) * 360;
  beams += '<path d="M' + x.toFixed(1) + ' ' + (540 - height).toFixed(1) + 'V' + (550 + height * 0.8).toFixed(1) + '" stroke="#bedda0" stroke-opacity="' + (0.015 + rand() * 0.045).toFixed(3) + '" stroke-width="1"/>';
}
writeFileSync('public/art/afterlight.svg', svg('<defs><radialGradient id="sky"><stop stop-color="#283324"/><stop offset="1" stop-color="#0d110e"/></radialGradient><linearGradient id="h" x2="0" y2="1"><stop stop-color="#d1e9a5" stop-opacity=".5"/><stop offset="1" stop-color="#162015" stop-opacity="0"/></linearGradient><radialGradient id="sun"><stop offset=".78" stop-color="#0c130e"/><stop offset=".92" stop-color="#172217"/><stop offset="1" stop-color="#bacf8c"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="20"/></filter></defs><rect width="1200" height="1100" fill="url(#sky)"/>' + beams + '<ellipse cx="600" cy="550" rx="290" ry="16" fill="#d1e9a5" opacity=".3" filter="url(#b)"/><circle cx="600" cy="438" r="146" fill="url(#sun)"/><path d="M0 550H1200V1100H0Z" fill="#0e140f"/><path d="M260 550H940L1080 940H100Z" fill="url(#h)" opacity=".14"/><path d="M150 550H1050" stroke="#d1e9a5" stroke-width="1" opacity=".8"/>'));
console.log('Generated three original procedural study assets.');

for (const name of ['entropy', 'soft-matter', 'afterlight']) {
  await sharp('public/art/' + name + '.svg').webp({ quality: 88, effort: 6 }).toFile('public/art/' + name + '.webp');
}
