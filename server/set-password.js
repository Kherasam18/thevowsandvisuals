import crypto from 'node:crypto';
import { hashPassword } from './auth.js';

/*
  Prints the lines to put in .env for a given password.

  Run: npm run admin:password -- "the password"

  The password is taken as an argument rather than stored anywhere, and only
  its hash is ever written down. Nothing here echoes the password back.
*/

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run admin:password -- "your-password"');
  console.error('Wrap it in quotes if it contains spaces or symbols.');
  process.exit(1);
}

if (password.length < 10) {
  console.error(`That password is ${password.length} characters. Use at least 10.`);
  process.exit(1);
}

console.log('\nAdd these to .env (never commit that file):\n');
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
console.log(`ADMIN_SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log('\nKeep ADMIN_SESSION_SECRET as it is unless you want to sign everyone out.\n');
