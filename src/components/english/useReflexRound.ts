'use client';

// ============================================================================
// useReflexRound — MỘT LƯỢT ĐO PHẢN XẠ NÓI (dùng chung cho Pattern Lab, Boss Battle, Shadowing)
// ----------------------------------------------------------------------------
// • Micro mở một lần và giữ lại giữa các lượt (tự đóng sau 60 s không dùng / khi rời trang).
// • Mốc T0 chỉ được ghi SAU khi micro đã sẵn sàng và phần `before` (câu hỏi, nhịp phách) xong.
// • Mỗi lượt có `run` riêng: bấm lại / chuyển bước / rời trang thì lượt cũ bị huỷ sạch,
//   không bao giờ còn micro hay nhận dạng giọng nói chạy ngầm.
// • Thanh âm lượng được ghi thẳng vào DOM qua `meterRef` (transform), không setState theo khung hình.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateReflexMetrics, openMic, type MicHandle, type ReflexMetrics, type VadSession } from '@/lib/english/reflexEngine';

type RecognitionResultLike = { transcript: string };
type RecognitionEventLike = Event & { results: ArrayLike<ArrayLike<RecognitionResultLike>> };
type RecognitionErrorLike = Event & { error?: string };
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives?: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => RecognitionLike;
  webkitSpeechRecognition?: new () => RecognitionLike;
};

export type ReflexStatus = 'idle' | 'preparing' | 'listening' | 'scoring';

export type ReflexStartOptions = {
  /** Câu trả lời mong đợi (để chấm độ chính xác). */
  expected: string;
  targetMs?: number;
  /** Nhãn khu vực đang đo — để giao diện chỉ hiện đồng hồ/điểm đúng nơi bấm. */
  tag?: string;
  /**
   * Chạy sau khi micro đã mở, trước mốc T0 (phát câu hỏi, gõ nhịp…). Trả về false để huỷ lượt.
   * `isActive()` cho biết lượt còn hiệu lực (dùng để bỏ qua các bước sau khi đã bị huỷ).
   */
  before?: (isActive: () => boolean) => Promise<boolean | void>;
  onScored?: (metrics: ReflexMetrics) => void;
};

type Round = {
  run: number;
  opts: ReflexStartOptions;
  vad: VadSession | null;
  rec: RecognitionLike | null;
  /** Có nhận dạng giọng nói hoạt động trong lượt này không. */
  asr: boolean;
  heard: string | null;
  onset: number | null;
  finalized: boolean;
  timers: number[];
};

const MAX_LISTEN_MS = 9000;
const FINISH_GRACE_MS = 1300;
const MIC_IDLE_CLOSE_MS = 60_000;

export const NO_ASR_NOTE =
  'Trình duyệt này chưa nhận dạng được giọng nói nên Milo chỉ đo tốc độ bật âm, chưa chấm nội dung. Dùng Chrome hoặc Edge để được chấm đầy đủ nhé!';

export function useReflexRound() {
  const [status, setStatus] = useState<ReflexStatus>('idle');
  const [tag, setTag] = useState<string | null>(null);
  const [liveLatency, setLiveLatency] = useState<number | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [metrics, setMetrics] = useState<ReflexMetrics | null>(null);
  const [note, setNote] = useState('');

  const runRef = useRef(0);
  const disposedRef = useRef(false);
  const micRef = useRef<MicHandle | null>(null);
  const micPromiseRef = useRef<Promise<MicHandle | null> | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const meterElRef = useRef<HTMLElement | null>(null);
  const roundRef = useRef<Round | null>(null);

  const writeLevel = useCallback((pct: number) => {
    const el = meterElRef.current;
    if (el) el.style.transform = `scaleX(${pct / 100})`;
  }, []);

  /** Gắn vào phần tử thanh âm lượng (<i>) — được cập nhật trực tiếp, không qua React. */
  const meterRef = useCallback((el: HTMLElement | null) => {
    meterElRef.current = el;
    if (el) el.style.transform = 'scaleX(0)';
  }, []);

  const clearIdle = () => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  };

  const closeMic = () => {
    clearIdle();
    micRef.current?.close();
    micRef.current = null;
    micPromiseRef.current = null;
  };

  const scheduleIdleClose = () => {
    clearIdle();
    if (!micRef.current) return;
    idleTimerRef.current = window.setTimeout(() => {
      if (!roundRef.current) closeMic();
    }, MIC_IDLE_CLOSE_MS);
  };

  const ensureMic = (): Promise<MicHandle | null> => {
    if (micRef.current) return Promise.resolve(micRef.current);
    if (!micPromiseRef.current) {
      micPromiseRef.current = openMic().then((mic) => {
        if (disposedRef.current) { mic?.close(); return null; }
        micRef.current = mic;
        if (!mic) micPromiseRef.current = null;
        return mic;
      });
    }
    return micPromiseRef.current;
  };

  /** Dừng mọi thứ của một lượt, trả về số liệu VAD cuối cùng. */
  const teardown = (round: Round) => {
    round.timers.forEach((t) => window.clearTimeout(t));
    round.timers = [];
    const stats = round.vad?.stop() ?? null;
    round.vad = null;
    const rec = round.rec;
    round.rec = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { if (rec.abort) rec.abort(); else rec.stop(); } catch { /* đã dừng */ }
    }
    writeLevel(0);
    return stats;
  };

  const isLive = (round: Round) => !round.finalized && runRef.current === round.run && !disposedRef.current;

  const finalize = (round: Round) => {
    if (!isLive(round)) return;
    round.finalized = true;
    const stats = teardown(round);
    roundRef.current = null;
    setStatus('idle');
    scheduleIdleClose();

    const latencyMs = round.onset ?? stats?.latencyMs ?? null;
    if (latencyMs === null) {
      setNote(round.heard
        ? 'Micro chưa bắt được lúc em bật âm — em nói to hơn một chút rồi thử lại nhé!'
        : 'Cú Milo chưa nghe thấy em. Bấm thử lại và nói to ngay sau tiếng phách nhé!');
      return;
    }
    const result = evaluateReflexMetrics({
      latencyMs,
      speechDurationMs: stats?.durationMs || 700,
      expectedText: round.opts.expected,
      heardText: round.asr ? round.heard ?? '' : null,
      targetLatencyMs: round.opts.targetMs,
    });
    setMetrics(result);
    setNote(round.asr ? '' : NO_ASR_NOTE);
    round.opts.onScored?.(result);
  };

  /** Huỷ lượt đang chạy (không chấm điểm). Giữ nguyên kết quả cũ. */
  const cancel = useCallback(() => {
    runRef.current++;
    const round = roundRef.current;
    roundRef.current = null;
    if (round) { round.finalized = true; teardown(round); }
    if (disposedRef.current) return;
    setStatus('idle');
    scheduleIdleClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Huỷ lượt và xoá kết quả (khi đổi câu / đổi bước). */
  const reset = useCallback(() => {
    cancel();
    setMetrics(null);
    setNote('');
    setHintVisible(false);
    setLiveLatency(null);
    setTag(null);
  }, [cancel]);

  const start = async (opts: ReflexStartOptions) => {
    cancel();
    const run = runRef.current;
    clearIdle();
    setMetrics(null);
    setNote('');
    setHintVisible(false);
    setLiveLatency(null);
    setTag(opts.tag ?? null);
    setStatus('preparing');

    const mic = await ensureMic();
    if (run !== runRef.current || disposedRef.current) return;
    if (!mic) {
      setStatus('idle');
      setNote('Em cần cho phép dùng micro để Milo đo phản xạ nhé (bấm biểu tượng 🔒/🎙️ trên thanh địa chỉ).');
      return;
    }

    if (opts.before) {
      const ok = await opts.before(() => run === runRef.current && !disposedRef.current);
      if (run !== runRef.current || disposedRef.current) return;
      if (ok === false) { setStatus('idle'); scheduleIdleClose(); return; }
    }

    // Mốc T0: micro đã chạy sẵn, câu hỏi/nhịp phách vừa dứt.
    const t0 = performance.now();
    const round: Round = { run, opts, vad: null, rec: null, asr: false, heard: null, onset: null, finalized: false, timers: [] };
    roundRef.current = round;

    round.vad = mic.monitor({
      t0,
      hintTimeoutMs: 2500,
      onLevel: writeLevel,
      onSpeechOnset: (lat) => {
        if (!isLive(round)) return;
        round.onset = lat;
        setLiveLatency(lat);
      },
      onHintNeeded: () => { if (isLive(round)) setHintVisible(true); },
      onSpeechEnd: () => {
        if (!isLive(round)) return;
        // Không có nhận dạng giọng nói → chấm ngay. Có thì chờ thêm một chút cho kết quả về.
        if (!round.rec) finalize(round);
        else round.timers.push(window.setTimeout(() => finalize(round), FINISH_GRACE_MS));
      },
    });
    setStatus('listening');
    round.timers.push(window.setTimeout(() => finalize(round), MAX_LISTEN_MS));

    const Ctor = (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      if (!isLive(round)) return;
      round.heard = event.results[event.results.length - 1]?.[0]?.transcript ?? '';
      finalize(round);
    };
    rec.onerror = (event) => {
      if (!isLive(round)) return;
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (round.heard === null) round.heard = '';
      } else {
        // Lỗi mạng / không cấp quyền… → coi như không có nhận dạng, vẫn đo bằng VAD.
        round.asr = false;
      }
    };
    rec.onend = () => {
      if (!isLive(round)) return;
      round.rec = null;
      // Nhận dạng tắt mà chưa có kết quả: nếu em đã nói thì chấm luôn; nếu đang mất nhận dạng
      // (lỗi mạng) mà em chưa nói thì để VAD tiếp tục chờ.
      if (round.onset !== null || round.asr) finalize(round);
    };
    round.rec = rec;
    try {
      rec.start();
      round.asr = true;
    } catch {
      round.rec = null;
    }
  };

  /** Bấm "Chấm điểm" thủ công: dừng nghe, chờ nhận dạng trả kết quả cuối rồi chấm. */
  const finish = () => {
    const round = roundRef.current;
    if (!round || !isLive(round)) return;
    setStatus('scoring');
    if (round.rec) {
      try { round.rec.stop(); } catch { /* đã dừng */ }
      round.timers.push(window.setTimeout(() => finalize(round), FINISH_GRACE_MS));
    } else {
      finalize(round);
    }
  };

  useEffect(() => {
    const runs = runRef; // đối tượng ref, không phải nút DOM
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      runs.current++;
      const round = roundRef.current;
      roundRef.current = null;
      if (round) { round.finalized = true; teardown(round); }
      closeMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    listening: status === 'listening' || status === 'scoring',
    busy: status !== 'idle',
    tag,
    liveLatency,
    hintVisible,
    metrics,
    note,
    meterRef,
    start,
    finish,
    cancel,
    reset,
  };
}

export type ReflexRound = ReturnType<typeof useReflexRound>;
