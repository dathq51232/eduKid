'use client';

// Khối "Tiếng Anh sư phạm" trên dashboard giáo viên (mục "Của tôi"): tiến độ lộ trình 24 tuần, bài tiếp theo,
// một mẫu câu Classroom English mỗi ngày (nghe được) và lối vào ngân hàng mẫu câu.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Volume2 } from 'lucide-react';
import { LESSONS, SECTIONS } from '@/lib/teacher-english/roadmap';
import { PHRASES } from '@/lib/teacher-english/classroom-bank';
import { useTeacherEnglish } from '@/lib/teacher-english/progress';
import { f3dSrc, phraseImage } from '@/lib/teacher-english/phrase-images';
import { speakSegments, stopSpeaking } from '@/lib/speech';

export default function TeacherEnglishCard({ href, grade, day }: { href: string; grade?: number; day: string }) {
  const { progress, sync } = useTeacherEnglish();
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stopSpeaking(), []);

  const done = LESSONS.reduce((n, l) => n + (progress[l.id]?.sections.length ?? 0), 0);
  const pct = Math.round((done / (LESSONS.length * SECTIONS.length)) * 100);
  const next = LESSONS.find((l) => !progress[l.id]?.completedAt);
  // Câu của ngày: ưu tiên câu theo khối của lớp, đổi theo ngày (cùng ngày luôn cùng câu)
  const phrase = useMemo(() => {
    const pool = PHRASES.filter((p) => p.grade === 0 || p.grade === grade);
    const seed = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    return pool[seed % pool.length];
  }, [grade, day]);

  const listen = () => {
    if (playing) { stopSpeaking(); setPlaying(false); return; }
    setPlaying(true);
    void speakSegments([{ text: phrase.en, lang: 'en' }], { onEnd: () => setPlaying(false) }).then((r) => { if (!r.ok) setPlaying(false); });
  };

  return (
    <section className="uw te-card-dash" aria-labelledby="uw-te-h">
      <div className="uw-hd">
        <h2 id="uw-te-h">🎓 Tiếng Anh sư phạm</h2>
        <Link href={href} className="uw-more">Mở <ChevronRight aria-hidden="true" /></Link>
      </div>
      <div className="uw-meter" role="img" aria-label={`Đã học ${pct}% lộ trình`}><i style={{ width: `${pct}%` }} /></div>
      <p className="uw-muted">{sync === 'loading' ? 'Đang tải…' : `Lộ trình · đã học ${pct}%`}</p>
      {next && (
        <Link href={`${href}#${next.id}`} className="te-dash-next">
          <span>Tuần {next.week} · {next.title[1]}</span>
          <small lang="en">{next.title[0]}</small>
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
      <div className="te-dash-phrase">
        <p className="uw-muted">💬 Câu của ngày · Phrase of the day</p>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- hình 3D webp nhỏ đã tối ưu sẵn */}
          <img className="te-phrase-img" src={f3dSrc(phraseImage(phrase))} width={48} height={48} alt="" aria-hidden="true" decoding="async" />
          <span><b lang="en">{phrase.en}</b><small>{phrase.vi}</small></span>
          <button type="button" className={`te-ic${playing ? ' is-on' : ''}`} onClick={listen} aria-label={`Nghe: ${phrase.en}`}><Volume2 aria-hidden="true" /></button>
        </div>
      </div>
      <Link href={`${href}#mau-cau`} className="uw-fund">
        <span>📚 Ngân hàng mẫu câu</span>
        <span>{PHRASES.length} câu Anh–Việt{grade ? ` · lọc sẵn lớp ${grade}` : ''}</span>
        <ChevronRight aria-hidden="true" />
      </Link>
    </section>
  );
}
