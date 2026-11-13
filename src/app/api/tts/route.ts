import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimitShared } from '@/lib/rate-limit';

const MAX_TEXT_LENGTH = 1500;
const CHUNK_MAX = 180;

function splitTextForTts(input: string, maxLen = CHUNK_MAX): string[] {
  const clean = input.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const parts = clean.match(/[^.!?;:,]+[.!?;:,]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if ((current + part).length <= maxLen) {
      current += part;
      continue;
    }
    if (current.trim()) {
      chunks.push(current.trim());
      current = '';
    }
    if (part.length <= maxLen) {
      current = part;
    } else {
      const words = part.trim().split(/\s+/);
      for (const w of words) {
        if ((current + ' ' + w).trim().length <= maxLen) {
          current = current ? `${current} ${w}` : w;
        } else {
          if (current.trim()) chunks.push(current.trim());
          current = w.slice(0, maxLen);
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Gọi bộ tổng hợp giọng đọc Neural2/WaveNet 24kHz (jQ1olc) có ngữ điệu nhấn nhá tự nhiên.
 */
async function synthesizeNeuralRpc(text: string, tl: 'en' | 'vi', slow = false): Promise<Uint8Array | null> {
  try {
    const rpc = [[['jQ1olc', JSON.stringify([text, tl, slow ? true : null, 'null']), null, 'generic']]];
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
    if (!res.ok) return null;
    const raw = await res.text();
    for (const line of raw.split('\n')) {
      if (!line.includes('jQ1olc')) continue;
      const parsed = JSON.parse(line) as unknown;
      if (!Array.isArray(parsed) || !Array.isArray(parsed[0]) || typeof parsed[0][2] !== 'string') continue;
      const inner = JSON.parse(parsed[0][2]) as unknown;
      if (Array.isArray(inner) && typeof inner[0] === 'string' && inner[0].length > 0) {
        return new Uint8Array(Buffer.from(inner[0], 'base64'));
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Chỉ phục vụ chính trang EduChain Kids: trang web khác gọi sang (trình duyệt gắn Sec-Fetch-Site: cross-site) bị từ chối.
  if (req.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  // Giới hạn theo IP, đếm chung mọi bản máy chủ. Cả lớp dùng chung wifi nên mức đủ rộng; câu giống nhau đã có CDN giữ sẵn.
  if (!(await rateLimitShared(`tts:${clientIp(req.headers)}`, 600, 10 * 60_000))) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429, headers: { 'Retry-After': '120' } });
  }
  const { searchParams } = new URL(req.url);
  const rawLang = (searchParams.get('lang') ?? 'vi').toLowerCase();
  const tl: 'en' | 'vi' = rawLang.startsWith('en') ? 'en' : 'vi';
  const slow = searchParams.get('slow') === '1';
  const rawText = (searchParams.get('q') ?? '').trim().slice(0, MAX_TEXT_LENGTH);

  if (!rawText) {
    return NextResponse.json({ error: 'Missing text query parameter (q)' }, { status: 400 });
  }

  const chunks = splitTextForTts(rawText);
  if (chunks.length === 0) {
    return NextResponse.json({ error: 'Empty text' }, { status: 400 });
  }

  try {
    const buffers: Uint8Array[] = [];
    for (const chunk of chunks) {
      // Ưu tiên bộ giọng Neural2/WaveNet 24kHz có ngữ điệu tự nhiên
      const neural = await synthesizeNeuralRpc(chunk, tl, slow);
      if (neural && neural.byteLength > 0) {
        buffers.push(neural);
        continue;
      }

      // Fallback sang endpoint trực tiếp
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });
      if (!res.ok) {
        return NextResponse.json({ error: `TTS upstream returned ${res.status}` }, { status: 502 });
      }
      const ab = await res.arrayBuffer();
      buffers.push(new Uint8Array(ab));
    }

    const totalLength = buffers.reduce((sum, b) => sum + b.byteLength, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const b of buffers) {
      merged.set(b, offset);
      offset += b.byteLength;
    }

    return new NextResponse(merged, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(merged.byteLength),
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 502 });
  }
}
