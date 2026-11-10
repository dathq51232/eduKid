'use client';

import { Square } from 'lucide-react';
import { REFLEX_TIER_META, type ReflexMetrics } from '@/lib/english/reflexEngine';
import type { ReflexRound } from '@/components/english/useReflexRound';

/** Thanh âm lượng micro + ΔT trực tiếp. Độ dài thanh do hook ghi thẳng vào DOM. */
export function VadMeter({ reflex, label, inline = false, showStop = false }: {
  reflex: ReflexRound;
  label: string;
  inline?: boolean;
  showStop?: boolean;
}) {
  return (
    <div className={`en-vad-meter${inline ? ' is-inline' : ''}`} aria-live="polite">
      <span>{reflex.status === 'scoring' ? '⏳ Milo đang chấm…' : label}</span>
      <div className="en-vad-bar" aria-hidden="true"><i ref={reflex.meterRef} /></div>
      {reflex.liveLatency !== null && <strong className="en-vad-latency is-detected">ΔT: {reflex.liveLatency} ms</strong>}
      {showStop && reflex.status === 'listening' && (
        <button type="button" className="en-vad-stop" onClick={reflex.finish}>
          <Square size={14}/> Chấm điểm
        </button>
      )}
    </div>
  );
}

export function ReflexScorecard({ metrics, targetMs, showExp = true, showHeard = false }: {
  metrics: ReflexMetrics;
  targetMs?: number;
  showExp?: boolean;
  showHeard?: boolean;
}) {
  const tier = REFLEX_TIER_META[metrics.tier];
  return (
    <div className={`en-reflex-scorecard is-${tier.color}`} role="status">
      <div className="en-rs-header">
        <span className="en-rs-badge">{tier.badge} {tier.label} · {tier.vi}</span>
        <strong className="en-rs-total">Reflex Score: {metrics.reflexScore}/100{showExp && ` (+${tier.expBonus} EXP)`}</strong>
      </div>
      <div className="en-rs-metrics">
        <div className="en-rs-metric">
          <small>Độ trễ bật âm (ΔT = T1 − T0)</small>
          <b>{metrics.latencyMs} ms</b>
          <span>{targetMs ? `Mục tiêu ≤ ${targetMs} ms · ` : ''}Điểm tốc độ: {metrics.speedScore}/100</span>
        </div>
        <div className="en-rs-metric">
          <small>Độ chính xác nội dung</small>
          <b>{metrics.accuracyScore === null ? '—' : `${metrics.accuracyScore}%`}</b>
          <span>{metrics.accuracyScore === null ? 'Chưa chấm (trình duyệt không hỗ trợ)' : `Trọng số 30%`}</span>
        </div>
        <div className="en-rs-metric">
          <small>Độ trôi chảy (Fluency)</small>
          <b>{metrics.fluencyScore}/100</b>
          <span>Thời lượng nói: {(metrics.speechDurationMs / 1000).toFixed(1)}s</span>
        </div>
      </div>
      <p className="en-rs-tip">
        {tier.tip}
        {showHeard && metrics.heard && <> · Máy nghe được: <em>“{metrics.heard}”</em></>}
      </p>
    </div>
  );
}
