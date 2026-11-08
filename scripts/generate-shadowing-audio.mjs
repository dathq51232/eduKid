import fs from 'fs';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const src = fs.readFileSync('src/lib/english/communicationBank.ts', 'utf8');
const storiesIdx = src.indexOf('export const ENGLISH_COMMUNICATION_STORIES');
const jsonStart = src.indexOf('{', storiesIdx + 60);
const jsonEnd = src.lastIndexOf('};');
const storiesObj = JSON.parse(src.slice(jsonStart, jsonEnd + 1));

const byKey = new Map();
for (const [storyId, list] of Object.entries(storiesObj)) {
  for (const q of list) {
    const key = `${storyId}/${String(q.storyIndex).padStart(3, '0')}.mp3`;
    if (!byKey.has(key)) {
      const cleanAction = q.action.replace(/[.!?,;]+$/, '').trim();
      const cleanReason = q.reason.trim();
      const withDot = /[.!?]$/.test(cleanReason) ? cleanReason : `${cleanReason}.`;
      byKey.set(key, {
        number: q.number,
        storyId,
        storyIndex: q.storyIndex,
        key,
        prosodicText: `${cleanAction}, ${withDot}`,
      });
    }
  }
}

const items = [...byKey.values()];
console.log(`Found ${items.length} unique shadowing sentences across stories.`);

async function synthesizeMp3(text) {
  const rpc = [[['jQ1olc', JSON.stringify([text, 'en', null, 'null']), null, 'generic']]];
  const body = `f.req=${encodeURIComponent(JSON.stringify(rpc))}&`;
  const res = await fetch('https://translate.google.com/_/TranslateWebserverUi/data/batchexecute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    },
    body,
  });
  const raw = await res.text();
  for (const line of raw.split('\n')) {
    if (!line.includes('jQ1olc')) continue;
    const parsed = JSON.parse(line);
    if (Array.isArray(parsed) && Array.isArray(parsed[0]) && typeof parsed[0][2] === 'string') {
      const inner = JSON.parse(parsed[0][2]);
      if (Array.isArray(inner) && typeof inner[0] === 'string' && inner[0].length > 0) {
        return Buffer.from(inner[0], 'base64');
      }
    }
  }
  throw new Error(`Failed to synthesize: ${text}`);
}

async function uploadToSupabase(objectPath, mp3Buffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/english-shadowing-audio/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
      'Cache-Control': '31536000',
    },
    body: mp3Buffer,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }
}

let completed = 0;
const CONCURRENCY = 8;

for (let i = 0; i < items.length; i += CONCURRENCY) {
  const batch = items.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(async (item) => {
      const buf = await synthesizeMp3(item.prosodicText);
      await uploadToSupabase(item.key, buf);
      completed++;
    }),
  );
  if (completed % 40 === 0 || completed === items.length) {
    console.log(`Uploaded ${completed}/${items.length} MP3 files...`);
  }
}

console.log('Done! All 200 shadowing MP3 files are uploaded to Supabase Storage.');
