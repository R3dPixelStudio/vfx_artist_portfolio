import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';
if (!process.stdin.isTTY) throw new Error('Run this interactively in your terminal.');
emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdout.write('New admin password (hidden; at least 14 characters): ');
let password = '';
process.stdin.on('keypress', (text, key) => {
  if (key?.ctrl && key.name === 'c') { process.stdin.setRawMode(false); process.exit(130); }
  if (key?.name === 'return') {
    if (password.length < 14) { process.stdout.write('\nUse at least 14 characters. Try again: '); password = ''; return; }
    const salt = randomBytes(16);
    const digest = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    password = '';
    process.stdin.setRawMode(false);
    process.stdout.write('\nADMIN_PASSWORD_HASH (store as a Cloudflare secret):\n' + ['pbkdf2-sha256','100000',salt.toString('hex'),digest.toString('hex')].join('$') + '\n');
    process.exit(0);
  }
  if (key?.name === 'backspace') password = password.slice(0,-1);
  else if (text && !key?.ctrl && !key?.meta) password += text;
});
