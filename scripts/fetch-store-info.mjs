/* global process, console, fetch */
/* eslint-disable no-console */
/**
 * Setup script: fetches store info from Brainerce using the connection ID
 * and saves NEXT_PUBLIC_STORE_NAME (and other public fields) to .env.local.
 *
 * Run: node scripts/fetch-store-info.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');

if (!existsSync(envPath)) {
  console.error(
    '❌  .env.local not found. Create it first with NEXT_PUBLIC_BRAINERCE_CONNECTION_ID set.'
  );
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');

function getVar(content, key) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

function setVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  return content.trimEnd() + `\n${key}=${value}\n`;
}

const connectionId = getVar(envContent, 'NEXT_PUBLIC_BRAINERCE_CONNECTION_ID');
const apiUrl = (getVar(envContent, 'BRAINERCE_API_URL') || 'https://api.brainerce.com').replace(
  /\/$/,
  ''
);

if (!connectionId) {
  console.error('❌  NEXT_PUBLIC_BRAINERCE_CONNECTION_ID is not set in .env.local');
  process.exit(1);
}

console.log(`Fetching store info for connection: ${connectionId} ...`);

let storeInfo;
try {
  const res = await fetch(`${apiUrl}/api/vc/${connectionId}/info`);
  if (!res.ok) {
    console.error(`❌  API returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  storeInfo = await res.json();
} catch (err) {
  console.error(`❌  Failed to reach ${apiUrl}: ${err.message}`);
  process.exit(1);
}

const name = storeInfo.name;
const currency = storeInfo.currency;

if (!name) {
  console.error('❌  Store info response has no `name` field:', storeInfo);
  process.exit(1);
}

let updated = envContent;
updated = setVar(updated, 'NEXT_PUBLIC_STORE_NAME', name);
if (currency) {
  updated = setVar(updated, 'NEXT_PUBLIC_STORE_CURRENCY', currency);
}

writeFileSync(envPath, updated, 'utf-8');

console.log(`✓ NEXT_PUBLIC_STORE_NAME=${name}`);
if (currency) console.log(`✓ NEXT_PUBLIC_STORE_CURRENCY=${currency}`);
console.log('Done. Restart the dev server for changes to take effect.');
