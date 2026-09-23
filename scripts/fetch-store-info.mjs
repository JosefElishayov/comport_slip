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
  if (!match) return null;
  // .env values are sometimes quoted (e.g. BRAINERCE_API_URL="https://...");
  // strip matching outer quotes so callers get the raw value either way.
  return match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
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
const siteUrl = getVar(envContent, 'NEXT_PUBLIC_SITE_URL') || 'https://comfortsleep.co.il';

if (!connectionId) {
  console.error('❌  NEXT_PUBLIC_BRAINERCE_CONNECTION_ID is not set in .env.local');
  process.exit(1);
}

console.log(`Fetching store info for connection: ${connectionId} ...`);

let storeInfo;
try {
  // The API rejects vibe-coded requests with no Origin header (403), same
  // check a real browser satisfies automatically — this script has to set it.
  const res = await fetch(`${apiUrl}/api/vc/${connectionId}/info`, {
    headers: { Origin: siteUrl },
  });
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
const ga4MeasurementId = storeInfo.tracking?.ga4MeasurementId;

if (!name) {
  console.error('❌  Store info response has no `name` field:', storeInfo);
  process.exit(1);
}

let updated = envContent;
updated = setVar(updated, 'NEXT_PUBLIC_STORE_NAME', name);
if (currency) {
  updated = setVar(updated, 'NEXT_PUBLIC_STORE_CURRENCY', currency);
}
if (ga4MeasurementId) {
  updated = setVar(updated, 'NEXT_PUBLIC_GA4_MEASUREMENT_ID', ga4MeasurementId);
}

writeFileSync(envPath, updated, 'utf-8');

console.log(`✓ NEXT_PUBLIC_STORE_NAME=${name}`);
if (currency) console.log(`✓ NEXT_PUBLIC_STORE_CURRENCY=${currency}`);
if (ga4MeasurementId) console.log(`✓ NEXT_PUBLIC_GA4_MEASUREMENT_ID=${ga4MeasurementId}`);
else console.log('ℹ No GA4 measurement id configured on this sales channel — left untouched.');
console.log('Done. Restart the dev server for changes to take effect.');
