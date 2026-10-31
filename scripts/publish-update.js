#!/usr/bin/env node
// Sends an over-the-air update to everyone running the production app (no new Play Store review needed for JavaScript / asset changes).
//
//   npm run update:production -- "what changed"
//
// The production values below are set explicitly so that a local .env pointing at a development server can never end up inside an update
// that every user receives (variables already in the environment win over .env files).
const { spawnSync } = require('child_process');

const message = process.argv.slice(2).join(' ').trim();
if (message.length < 5) {
  console.error('Say what changed:  npm run update:production -- "Pharmacy ratings show plain counts"');
  process.exit(1);
}

const env = {
  ...process.env,
  EXPO_PUBLIC_API_BASE_URL: 'https://backend.medicoo.in',
  EXPO_PUBLIC_WEB_APP_URL: 'https://medicoo.in',
  EXPO_PUBLIC_BLOG_URL: 'https://medicoo.in/blog',
  EXPO_PUBLIC_DONATE_BLOOD_URL: 'https://medicoo.in/donate-blood',
};

const result = spawnSync('npx', ['eas-cli', 'update', '--channel', 'production', '--message', message], { stdio: 'inherit', env, shell: true });
process.exit(result.status === null ? 1 : result.status);
