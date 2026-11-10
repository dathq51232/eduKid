// ============================================================================
// REFLEX ENGINE — ĐO LƯỜNG ĐỘ TRỄ PHẢN XẠ (VAD T1 - T0) & CHẤM ĐIỂM RS
// ============================================================================

export type ReflexTier = 'LIGHTNING' | 'NATURAL' | 'THINKING' | 'HESITANT';

export interface ReflexMetrics {
  latencyMs: number;       // ΔT_reflex = T1 - T0 (ms)
  speechDurationMs: number;// ΔT_duration = T2 - T1 (ms)
  speedScore: number;      // S_speed (0..100)
  /** S_acc (0..100). null = trình duyệt không nhận dạng được giọng nói → không chấm nội dung. */
  accuracyScore: number | null;
  fluencyScore: number;    // S_fluency (0..100)
  reflexScore: number;     // RS = 0.5*S_speed + 0.3*S_acc + 0.2*S_fluency
  tier: ReflexTier;
  /** Câu máy nghe được. null = không có nhận dạng giọng nói. */
  heard: string | null;
}

export const REFLEX_TIER_META: Record<
  ReflexTier,
  { badge: string; label: string; vi: string; color: string; tip: string; expBonus: number }
> = {
  LIGHTNING: {
    badge: '⚡',
    label: 'Lightning Reflex',
    vi: 'Phản xạ Tia chớp',
    color: 'lightning',
    tip: 'Xuất sắc! Em bật ra tiếng Anh tức thì không cần dịch nhẩm!',
    expBonus: 30,
  },
  NATURAL: {
    badge: '🌿',
    label: 'Natural Reflex',
    vi: 'Phản xạ Tự nhiên',
    color: 'natural',
    tip: 'Rất tốt! Nhịp phản xạ tự nhiên và rõ ràng.',
    expBonus: 20,
  },
  THINKING: {
    badge: '💭',
    label: 'Thinking Mode',
    vi: 'Đang dịch nhẩm',
    color: 'thinking',
    tip: 'Em nói đúng ý rồi! Thử nhìn tranh và bật tiếng ngay để dưới 1.2 giây nhé.',
    expBonus: 10,
  },
  HESITANT: {
    badge: '🐢',
    label: 'Hesitant',
    vi: 'Đang ngẫm nghĩ',
    color: 'hesitant',
    tip: 'Đừng ngại nhé! Hãy nhìn gợi ý hình ảnh và đọc to cụm từ đầu tiên.',
    expBonus: 5,
  },
};

const normalizeWords = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/**
 * Tính điểm độ chính xác nội dung (S_acc) theo tỷ lệ từ khớp.
 */
export function computeAccuracyScore(expectedText: string, heardText: string): number {
  const expected = normalizeWords(expectedText);
  if (expected.length === 0) return 100;
  const heardWords = new Map<string, number>();
  normalizeWords(heardText).forEach((w) => heardWords.set(w, (heardWords.get(w) ?? 0) + 1));

  let matched = 0;
  for (const w of expected) {
    const count = heardWords.get(w) ?? 0;
    if (count > 0) {
      matched++;
      heardWords.set(w, count - 1);
    }
  }
  return Math.round((matched / expected.length) * 100);
}

/**
 * Tính điểm tốc độ phản xạ S_speed theo công thức trong tài liệu thiết kế:
 * - ΔT_reflex <= T_target -> 100
 * - T_target < ΔT_reflex < T_max -> 100 * (T_max - ΔT_reflex) / (T_max - T_target)
 * - ΔT_reflex >= T_max -> 0
 */
export function computeSpeedScore(latencyMs: number, targetMs = 1000, maxMs = 3000): number {
  if (latencyMs <= targetMs) return 100;
  if (latencyMs >= maxMs) return 0;
  return Math.round(100 * ((maxMs - latencyMs) / (maxMs - targetMs)));
}

/**
 * Tính điểm độ trôi chảy cơ miệng (S_fluency) dựa trên thời lượng phát âm thực tế
 * so với thời lượng kỳ vọng của câu (khoảng 340ms / từ).
 */
export function computeFluencyScore(speechDurationMs: number, expectedWordCount: number): number {
  if (speechDurationMs <= 0 || expectedWordCount <= 0) return 60;
  const idealMs = Math.max(700, expectedWordCount * 340);
  const ratio = speechDurationMs / idealMs;
  // Lý tưởng nằm trong khoảng 0.65x .. 1.45x thời lượng chuẩn
  if (ratio >= 0.65 && ratio <= 1.45) return 100;
  if (ratio < 0.65) {
    return Math.max(30, Math.round((ratio / 0.65) * 100));
  }
  const overPenalty = Math.min(60, Math.round(((ratio - 1.45) / 1.55) * 60));
  return Math.max(40, 100 - overPenalty);
}

/**
 * Tổng hợp điểm phản xạ RS = 0.5*S_speed + 0.3*S_acc + 0.2*S_fluency và phân hạng Tier.
 */
export function evaluateReflexMetrics(params: {
  latencyMs: number;
  speechDurationMs: number;
  expectedText: string;
  /**
   * Câu máy nhận dạng được.
   * - chuỗi (kể cả rỗng ''): đã chạy nhận dạng giọng nói → chấm độ chính xác ('' = 0 điểm).
   * - null: trình duyệt không hỗ trợ / lỗi mạng → KHÔNG cộng điểm nội dung, chỉ chấm tốc độ + trôi chảy.
   */
  heardText: string | null;
  targetLatencyMs?: number;
}): ReflexMetrics {
  const words = normalizeWords(params.expectedText);
  const targetMs = params.targetLatencyMs ?? (words.length <= 5 ? 800 : words.length <= 9 ? 1000 : 1200);
  const speedScore = computeSpeedScore(params.latencyMs, targetMs, 3000);
  const accuracyScore = params.heardText === null ? null : computeAccuracyScore(params.expectedText, params.heardText);
  const fluencyScore = computeFluencyScore(params.speechDurationMs, words.length);

  // Không có điểm nội dung thì chia lại trọng số cho tốc độ + trôi chảy (không tặng điểm ảo).
  const reflexScore = accuracyScore === null
    ? Math.round((0.5 * speedScore + 0.2 * fluencyScore) / 0.7)
    : Math.round(0.5 * speedScore + 0.3 * accuracyScore + 0.2 * fluencyScore);

  let tier: ReflexTier = 'HESITANT';
  if (params.latencyMs <= Math.max(850, targetMs) && reflexScore >= 82) {
    tier = 'LIGHTNING';
  } else if (params.latencyMs <= 1550 && reflexScore >= 68) {
    tier = 'NATURAL';
  } else if (params.latencyMs <= 2500 && reflexScore >= 50) {
    tier = 'THINKING';
  }
  // Chưa xác nhận được nội dung → không trao hạng Tia chớp; nói sai phần lớn → tối đa "Đang dịch nhẩm".
  if (accuracyScore === null && tier === 'LIGHTNING') tier = 'NATURAL';
  if (accuracyScore !== null && accuracyScore < 50 && (tier === 'LIGHTNING' || tier === 'NATURAL')) tier = 'THINKING';

  return {
    latencyMs: Math.max(120, Math.round(params.latencyMs)),
    speechDurationMs: Math.max(300, Math.round(params.speechDurationMs)),
    speedScore,
    accuracyScore,
    fluencyScore,
    reflexScore,
    tier,
    heard: params.heardText,
  };
}

/**
 * Phát tiếng gõ nhịp phách (Rhythm Beat: "Clap - Clap - Speak!") bằng Web Audio API
 * giúp khóa nhịp cơ miệng trẻ trước khi nói nhại lại.
 */
export async function playRhythmCountIn(beats = 2, bpm = 108): Promise<void> {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const intervalSec = 60 / bpm;

    for (let i = 0; i < beats; i++) {
      const startTime = ctx.currentTime + i * intervalSec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Beat cuối cao hơn một quãng để báo hiệu "Bắt đầu nói!"
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(i === beats - 1 ? 880 : 587.33, startTime);
      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    }

    await new Promise((r) => setTimeout(r, beats * intervalSec * 1000));
    await ctx.close();
  } catch {
    // Bỏ qua nếu trình duyệt chặn AudioContext
  }
}

/**
 * Bộ theo dõi VAD (Voice Activity Detection) qua Web Audio API để bắt chính xác mốc T1
 * ngay khi trẻ bắt đầu bật âm vào micro.
 *
 * Micro được mở MỘT LẦN (openMic) rồi dùng lại cho nhiều lượt đo (monitor). Nhờ vậy mốc T0
 * chỉ được ghi khi micro ĐÃ sẵn sàng — thời gian xin quyền / khởi tạo micro không bị cộng
 * nhầm vào ΔT của trẻ.
 */
export interface VadStats { latencyMs: number | null; durationMs: number; currentDb: number }
export interface VadSession { stop: () => VadStats }

export interface MicHandle {
  /** Bắt đầu đo một lượt với mốc T0 cho trước (đồng bộ, không chờ). */
  monitor: (opts: {
    t0: number;
    hintTimeoutMs?: number;
    onSpeechOnset?: (latencyMs: number) => void;
    /** Gọi mỗi khung hình — chỉ nên ghi thẳng vào DOM, KHÔNG setState. */
    onLevel?: (levelPercent: number) => void;
    onHintNeeded?: () => void;
    /** Gọi một lần khi trẻ đã bật âm rồi im lặng liên tục `endSilenceMs` (mặc định 1400 ms). */
    onSpeechEnd?: () => void;
    endSilenceMs?: number;
  }) => VadSession;
  close: () => void;
}

const VAD_THRESHOLD_DB = -42; // Ngưỡng dB phát hiện bật âm giọng nói

export async function openMic(): Promise<MicHandle | null> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    return null;
  }

  const ctx = new AudioCtx();
  try { await ctx.resume(); } catch { /* Một số trình duyệt tự chạy sẵn */ }
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const dataArray = new Float32Array(analyser.fftSize);
  let closed = false;
  let stopCurrent: (() => void) | null = null;

  const readDb = () => {
    analyser.getFloatTimeDomainData(dataArray);
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) sumSquares += dataArray[i] * dataArray[i];
    return 20 * Math.log10(Math.max(Math.sqrt(sumSquares / dataArray.length), 1e-7));
  };

  return {
    monitor: (opts) => {
      stopCurrent?.(); // Mỗi micro chỉ đo một lượt tại một thời điểm
      let stopped = false;
      let t1: number | null = null;
      let lastActiveTime: number | null = null;
      let consecutiveAbove = 0;
      let lastDb = -100;
      let frame = 0;
      let endFired = false;
      const endSilenceMs = opts.endSilenceMs ?? 1400;

      const hintTimer = window.setTimeout(() => {
        if (!stopped && t1 === null) opts.onHintNeeded?.();
      }, opts.hintTimeoutMs ?? 2500);

      const tick = () => {
        if (stopped || closed) return;
        const db = readDb();
        lastDb = db;
        opts.onLevel?.(Math.max(0, Math.min(100, Math.round(((db + 65) / 50) * 100))));
        if (db > VAD_THRESHOLD_DB) {
          consecutiveAbove++;
          lastActiveTime = performance.now();
          // Cần ít nhất 2 frame liên tiếp vượt ngưỡng để lọc nhiễu tích tắc
          if (t1 === null && consecutiveAbove >= 2) {
            t1 = performance.now();
            window.clearTimeout(hintTimer);
            opts.onSpeechOnset?.(Math.max(120, Math.round(t1 - opts.t0)));
          }
        } else {
          consecutiveAbove = 0;
          if (!endFired && t1 !== null && lastActiveTime !== null && performance.now() - lastActiveTime > endSilenceMs) {
            endFired = true;
            opts.onSpeechEnd?.();
            if (stopped) return;
          }
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      const stop = (): VadStats => {
        if (!stopped) {
          stopped = true;
          cancelAnimationFrame(frame);
          window.clearTimeout(hintTimer);
          opts.onLevel?.(0);
          if (stopCurrent === stopFn) stopCurrent = null;
        }
        const latencyMs = t1 !== null ? Math.max(120, Math.round(t1 - opts.t0)) : null;
        const t2 = lastActiveTime ?? performance.now();
        const durationMs = t1 !== null ? Math.max(350, Math.round(t2 - t1)) : 0;
        return { latencyMs, durationMs, currentDb: lastDb };
      };
      const stopFn = () => { stop(); };
      stopCurrent = stopFn;
      return { stop };
    },
    close: () => {
      if (closed) return;
      closed = true;
      stopCurrent?.();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => {});
    },
  };
}
