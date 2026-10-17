'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Delete, GraduationCap, LogIn, Users } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { createClient } from '@/lib/supabase/client';
import { safeNext } from '@/lib/auth/safe-next';

type Tab = 'student' | 'adult';
type Classmate = { id: string; name: string };
const TONES = ['blue', 'green', 'coral', 'purple', 'yellow', 'sky'];

function adultError(message: string): string {
  if (/invalid login|invalid_credentials/i.test(message)) return 'Email hoặc mật khẩu chưa đúng.';
  if (/email not confirmed/i.test(message)) return 'Email chưa được xác nhận. Hãy mở thư xác nhận rồi đăng nhập lại.';
  if (/rate|too many/i.test(message)) return 'Thử quá nhiều lần. Vui lòng đợi vài phút.';
  return 'Không đăng nhập được. Vui lòng thử lại.';
}

function AdultLogin({ next, configured }: { next: string; configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error: err } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (err) return setError(adultError(err.message));
      router.replace(`/sau-dang-nhap${next ? `?next=${encodeURIComponent(next)}` : ''}`);
      router.refresh();
    } catch {
      setError('Không đăng nhập được. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="adm-field">
        <span>Email</span>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Mật khẩu</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="adm-alert is-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary auth-submit" disabled={busy || !configured}>
        <LogIn aria-hidden="true" /> {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
      <p className="auth-switch"><Link href="/quen-mat-khau">Quên mật khẩu?</Link></p>
      <p className="auth-switch">Chưa có tài khoản? <Link href="/dang-ky">Đăng ký tài khoản thầy cô</Link></p>
    </form>
  );
}

type Remembered = { code: string; className: string; id: string; name: string };
const REMEMBER_KEY = 'educhain-hoc-sinh';

// Nhớ lớp + tên của em trên thiết bị này (chỉ tên gọi và mã lớp, không lưu PIN) để lần sau chỉ cần nhập PIN.
function loadRemembered(): Remembered | null {
  try {
    const v = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? 'null') as Remembered | null;
    return v && typeof v.code === 'string' && typeof v.id === 'string' && typeof v.name === 'string' ? v : null;
  } catch {
    return null;
  }
}
function saveRemembered(v: Remembered | null) {
  try {
    if (v) localStorage.setItem(REMEMBER_KEY, JSON.stringify(v));
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* trình duyệt chặn lưu trữ: bỏ qua, lần sau chọn lại tên */
  }
}

function StudentLogin({ configured, initialCode, next = '' }: { configured: boolean; initialCode: string; next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'name' | 'pin'>('code');
  const [code, setCode] = useState(initialCode);
  const [className, setClassName] = useState('');
  const [mates, setMates] = useState<Classmate[]>([]);
  const [me, setMe] = useState<Classmate | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  // Thiết bị đã nhớ em (và không mở bằng link của lớp khác) -> vào thẳng bước nhập PIN
  useEffect(() => {
    const saved = loadRemembered();
    if (!saved || (initialCode && initialCode !== saved.code)) return;
    setCode(saved.code);
    setClassName(saved.className);
    setMe({ id: saved.id, name: saved.name });
    setStep('pin');
  }, [initialCode]);

  useEffect(() => { if (step === 'pin') pinRef.current?.focus(); }, [step]);

  const loadClass = async (value: string): Promise<boolean> => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/hoc-sinh/lop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: value }) });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 429 ? 'Em thử nhiều quá rồi, đợi một lát nhé.' : data.error === 'not_configured' ? 'Máy chủ chưa bật đăng nhập học sinh.' : data.error === 'server_error' ? 'Máy chủ chưa kết nối được cơ sở dữ liệu. Em nhờ thầy cô báo quản trị nhé.' : data.error === 'class_archived' ? 'Lớp này đang được lưu trữ. Em nhờ thầy cô bấm "Mở lại lớp" nhé.' : 'Không tìm thấy lớp. Em xem lại mã lớp trên thẻ nhé.');
        return false;
      }
      if (!data.students.length) { setError('Lớp này chưa có bạn nào có tài khoản. Em hỏi thầy cô nhé.'); return false; }
      setCode(data.code);
      setClassName(data.className);
      setMates(data.students);
      return true;
    } catch {
      setError('Không kết nối được. Em thử lại nhé.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const findClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await loadClass(code)) setStep('name');
  };

  // "Không phải em?" -> quên thiết bị, hiện danh sách tên của lớp
  const notMe = async () => {
    saveRemembered(null);
    setMe(null);
    setPin('');
    if (mates.length || (await loadClass(code))) setStep('name');
    else setStep('code');
  };

  const login = async (value: string) => {
    if (!me || inFlight.current) return;
    if (value.length !== 6) { setError('Mã PIN có 6 số. Em nhập đủ 6 số nhé.'); return; }
    inFlight.current = true;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/hoc-sinh/dang-nhap', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code, studentId: me.id, pin: value }) });
      const data = await res.json();
      if (res.ok) {
        saveRemembered({ code, className, id: me.id, name: me.name });
        // Bị chuyển tới đây từ trang học (vd. /lam-bai?…) thì quay lại đúng trang đó; còn lại về trang học sinh
        router.replace(next.startsWith('/chon-bai') || next.startsWith('/lam-bai') || next.startsWith('/tro-choi') || next.startsWith('/thanh-tich') || next.startsWith('/ket-qua') || next.startsWith('/hoc-sinh') ? next : (data.next ?? '/hoc-sinh'));
        router.refresh();
        return;
      }
      setPin('');
      pinRef.current?.focus();
      if (data.error === 'locked') setError(`Tài khoản tạm khóa ${data.minutes} phút vì nhập sai nhiều lần. Em nhờ thầy cô mở khóa nhé.`);
      else if (data.error === 'wrong_pin') setError(`Mã PIN chưa đúng. Em còn ${data.remaining} lần thử.`);
      else if (res.status === 429) setError('Em thử nhiều quá rồi, đợi một lát nhé.');
      else if (res.status === 404 || res.status === 403) {
        saveRemembered(null);
        setError('Không tìm thấy em trong lớp này nữa. Em chọn lại lớp và tên nhé.');
      } else setError('Không đăng nhập được. Em hỏi thầy cô nhé.');
    } catch {
      setError('Không kết nối được. Em thử lại nhé.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const press = (d: string) => {
    if (busy) return;
    const v = (pin + d).slice(0, 6);
    setPin(v);
    if (v.length === 6) void login(v);
  };
  // Giữ con trỏ ở ô PIN khi bấm bàn phím số trên màn hình -> phím Enter của bàn phím thật vẫn gửi PIN
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  if (step === 'code') {
    return (
      <form className="auth-form" onSubmit={findClass}>
        <label className="adm-field">
          <span>Mã lớp (trên thẻ đăng nhập)</span>
          <input className="class-code-input" inputMode="text" autoCapitalize="characters" autoComplete="off" placeholder="ABC-123" maxLength={8} required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </label>
        {error && <p className="adm-alert is-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-yellow auth-submit" disabled={busy || !configured}>{busy ? 'Đang tìm lớp…' : 'Tiếp tục'}</button>
      </form>
    );
  }

  if (step === 'name') {
    return (
      <div className="auth-form">
        <p className="auth-step-title">Lớp {className} — em là bạn nào?</p>
        {error && <p className="adm-alert is-error" role="alert">{error}</p>}
        <ul className="name-grid">
          {mates.map((m, i) => (
            <li key={m.id}>
              <button type="button" className={`name-btn tone-${TONES[i % TONES.length]}`} onClick={() => { setMe(m); setPin(''); setError(''); setStep('pin'); }}>
                <span className="name-initial" aria-hidden="true">{m.name.trim().split(/\s+/).pop()?.[0] ?? '?'}</span>
                <span>{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="auth-back" onClick={() => { setStep('code'); setError(''); }}><ArrowLeft size={16} aria-hidden="true" /> Đổi mã lớp</button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void login(pin); }}>
      <p className="auth-step-title">
        {className ? <>Lớp {className} · </> : null}Chào <strong>{me?.name}</strong>! Em nhập mã PIN rồi bấm <b>Vào lớp</b> (hoặc Enter).
      </p>
      <label className="sr-only" htmlFor="pin-input">Mã PIN</label>
      <input
        id="pin-input"
        ref={pinRef}
        className="pin-hidden"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={pin}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6);
          setPin(v);
          if (error) setError('');
          if (v.length === 6) void login(v);
        }}
      />
      <div className="pin-dots" aria-hidden="true" onClick={() => pinRef.current?.focus()}>
        {Array.from({ length: 6 }, (_, i) => <span key={i} className={i < pin.length ? 'is-on' : undefined} />)}
      </div>
      {error && <p className="adm-alert is-error" role="alert">{error}</p>}
      <div className="keypad" role="group" aria-label="Bàn phím số">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" onMouseDown={keepFocus} onClick={() => press(d)} disabled={busy}>{d}</button>
        ))}
        <button type="button" onMouseDown={keepFocus} onClick={() => setPin('')} disabled={busy} aria-label="Xóa hết">C</button>
        <button type="button" onMouseDown={keepFocus} onClick={() => press('0')} disabled={busy}>0</button>
        <button type="button" onMouseDown={keepFocus} onClick={() => setPin(pin.slice(0, -1))} disabled={busy} aria-label="Xóa một số"><Delete aria-hidden="true" /></button>
      </div>
      <button type="submit" className="btn btn-yellow auth-submit" disabled={busy || !configured}>
        <LogIn aria-hidden="true" /> {busy ? 'Đang vào lớp…' : 'Vào lớp'}
      </button>
      <div className="pin-links">
        <button type="button" className="auth-back" onClick={() => void notMe()} disabled={busy}>Không phải {me?.name}? Chọn tên khác</button>
        <button type="button" className="auth-back" onClick={() => { saveRemembered(null); setMe(null); setMates([]); setPin(''); setError(''); setStep('code'); }} disabled={busy}>Đổi lớp</button>
      </div>
    </form>
  );
}

function LoginScreen() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [tab, setTab] = useState<Tab>(params.get('vai') === 'nguoi-lon' || next.startsWith('/quan-tri') || next.startsWith('/giao-vien') || next.startsWith('/phu-huynh') ? 'adult' : 'student');
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand auth-brand" aria-label="EduChain Kids - Trang chủ"><BrandLogo size={40} /></Link>
        <h1>Đăng nhập</h1>
        {configured && /^\/(chon-bai|lam-bai|ket-qua|tro-choi|thanh-tich)/.test(next) && (
          <p className="adm-alert is-ok" role="status">Em đăng nhập bằng mã lớp và mã PIN để làm bài nhé. Bài làm sẽ được lưu để thầy cô xem.</p>
        )}
        {!configured && (
          <p className="adm-alert is-warn">Chưa kết nối Supabase nên chưa đăng nhập được. Xem hướng dẫn trong docs/AUTH-SETUP.md.</p>
        )}
        <div className="auth-tabs" role="tablist" aria-label="Ai đăng nhập?">
          <button type="button" role="tab" aria-selected={tab === 'student'} className="auth-tab" onClick={() => setTab('student')}>
            <GraduationCap aria-hidden="true" /> Học sinh
          </button>
          <button type="button" role="tab" aria-selected={tab === 'adult'} className="auth-tab" onClick={() => setTab('adult')}>
            <Users aria-hidden="true" /> Thầy cô
          </button>
        </div>
        <div role="tabpanel">
          {tab === 'student' ? <StudentLogin configured={configured} initialCode={(params.get('lop') ?? '').toUpperCase().slice(0, 8)} next={next} /> : <AdultLogin next={next} configured={configured} />}
        </div>
        <Link href="/" className="auth-back"><ArrowLeft size={16} aria-hidden="true" /> Về trang chủ</Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
