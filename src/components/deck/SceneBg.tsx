/* eslint-disable @next/next/no-img-element -- hình dán nền, kích thước tự do */
import { memo } from 'react';
import type React from 'react';
import { SCENE_BY_ID } from '@/lib/deck/scenes';

/** Cảnh nền minh hoạ (vẽ sau các vật, không bấm được) */
function SceneBg({ id }: { id: string }) {
  const sc = SCENE_BY_ID[id]; if (!sc) return null;
  return (
    <div className="dk-scene" aria-hidden="true" style={{ background: sc.bg }}>
      {sc.parts.map((p, i) => p.src
        ? <img key={i} src={p.src} alt="" draggable={false} style={{ left: p.x, top: p.y, width: p.w, opacity: p.op, transform: p.flip ? 'scaleX(-1)' : undefined }} />
        : <div key={i} style={{ left: p.x, top: p.y, width: p.w, height: p.h, ...cssObj(p.css) }} />)}
    </div>
  );
}
function cssObj(css?: string): React.CSSProperties {
  const o: Record<string, string> = {};
  for (const d of (css ?? '').split(';')) { const k = d.indexOf(':'); if (k > 0) o[d.slice(0, k).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = d.slice(k + 1).trim(); }
  return o as React.CSSProperties;
}
export default memo(SceneBg);
