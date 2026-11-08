import { NextRequest, NextResponse } from 'next/server';

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
      // Cắt theo từ nếu mệnh đề quá dài không có dấu câu
      const words = part.trim().split(/\s+/);
      for (const w of words) {
        if ((current + ' ' + w).trim().length <= maxLen) {
          current = (current ? `${current} ${w}` : w);
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawLang = (searchParams.get('lang') ?? 'vi').toLowerCase();
  const tl = rawLang.startsWith('en') ? 'en' : 'vi';
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
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
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
