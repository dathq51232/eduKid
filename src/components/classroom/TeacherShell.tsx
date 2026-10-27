'use client';

// Khung làm việc của giáo viên: thanh bên trái (công cụ theo nhóm, đổi lớp, tài khoản), ô tìm nhanh Ctrl+K,
// thanh tab dưới đáy trên điện thoại. Bọc mọi trang /giao-vien (xem src/app/giao-vien/layout.tsx).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MailOpen,
  Award, BookCheck, ChevronDown, ClipboardCheck, Dices, FileText, GraduationCap, Home, LayoutGrid, LogOut, Menu, MessageSquareHeart,
  NotebookPen, Radar, Search, Send, SpellCheck, Table2, Users, X, UsersRound, Trophy, Timer, Contact, Box, type LucideIcon,
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/brand/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { MiniTimer } from '@/components/classroom/ClassTimer';
import AiAssistant from '@/components/classroom/AiAssistant';
import { FEATURES } from '@/lib/features';
import { TOOLS, TOOL_GROUPS, classIdOfPath, fold, toolHref, toolOfPath, type Tool, type ToolKey } from '@/lib/classroom/teacher-nav';

export const TOOL_ICON: Record<ToolKey, LucideIcon> = {
  'so-lop': BookCheck, 'goi-ten': Dices, 'ke-hoach': NotebookPen, 'giao-bai': Send, 'phieu-bai-tap': FileText, 'phieu-chinh-ta': SpellCheck,
  'lo-hong': Radar, 'de-kiem-tra': Table2, 'nhan-xet': ClipboardCheck, 'ket-qua-truong': GraduationCap, 'phieu-tien-bo': MessageSquareHeart,
  'thu-khen': Award, lop: Users, nhom: UsersRound, 'thi-dua': Trophy, 'hen-gio': Timer, 'danh-ba': Contact, 'bai-giang-3d': Box, 'tin-nhan': MailOpen,
};
export const USAGE_KEY = 'gv-dung-nhanh';

type ShellClass = { id: string; name: string; grade: number; status: string; students: number };
type Props = { classes: ShellClass[]; teacherName: string; schoolName: string; children: React.ReactNode };

const initials = (name: string) => name.trim().split(/\s+/).slice(-1)[0]?.charAt(0).toUpperCase() ?? '?';

export default function TeacherShell({ classes, teacherName, schoolName, children }: Props) {
  const pathname = usePathname() ?? '/giao-vien';
  const router = useRouter();
  const fromPath = classIdOfPath(pathname);
  const active = classes.find((c) => c.id === fromPath) ?? classes.find((c) => c.status === 'active') ?? classes[0] ?? null;
  const current = toolOfPath(pathname);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [switcher, setSwitcher] = useState(false);

  // đếm số lần mở từng công cụ (cho mục "Dùng nhanh" ở trang Hôm nay)
  useEffect(() => {
    setDrawer(false); setSwitcher(false);
    if (!current || current === 'lop') return;
    try {
      const c = JSON.parse(localStorage.getItem(USAGE_KEY) ?? '{}') as Record<string, number>;
      c[current] = (c[current] ?? 0) + 1;
      localStorage.setItem(USAGE_KEY, JSON.stringify(c));
    } catch { /* bỏ qua */ }
  }, [pathname, current]);

  // Ctrl+K / Cmd+K mở ô tìm nhanh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const switchClass = (id: string) => {
    setSwitcher(false);
    router.push(fromPath ? pathname.replace(fromPath, id) : `/giao-vien/lop/${id}`);
  };

  const nav = (
    <>
      <Link href="/giao-vien" className={`tsh-nav${pathname === '/giao-vien' ? ' is-on' : ''}`} aria-current={pathname === '/giao-vien' ? 'page' : undefined}>
        <span className="tsh-ic tone-blue"><Home aria-hidden="true" /></span>Hôm nay
      </Link>
      {active && TOOL_GROUPS.map((g) => (
        <div key={g} className="tsh-group">
          <p className="tsh-group-title">{g}</p>
          {TOOLS.filter((t) => t.group === g).map((t) => {
            const Icon = TOOL_ICON[t.key];
            const on = current === t.key;
            return (
              <Link key={t.key} href={toolHref(t, active.id)} className={`tsh-nav${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined}>
                <span className={`tsh-ic tone-${t.tone}`}><Icon aria-hidden="true" /></span>{t.label}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <div className="tsh">
      <aside className={`tsh-side${drawer ? ' is-open' : ''}`} aria-label="Công cụ giáo viên">
        <div className="tsh-brand">
          <Link href="/" aria-label="EduChain Kids - Trang chủ"><BrandLogo size={30} /></Link>
          <button type="button" className="tsh-close" aria-label="Đóng menu" onClick={() => setDrawer(false)}><X aria-hidden="true" /></button>
        </div>
        {active ? (
          <div className="tsh-class">
            <button type="button" className="tsh-class-btn" aria-expanded={switcher} onClick={() => setSwitcher((v) => !v)} disabled={classes.length < 2}>
              <span className="tsh-class-av">{active.name.slice(0, 3)}</span>
              <span className="tsh-class-txt"><b>Lớp {active.name}</b><span>{active.students} học sinh · Khối {active.grade}{active.status !== 'active' ? ' · đã lưu trữ' : ''}</span></span>
              {classes.length > 1 && <ChevronDown aria-hidden="true" />}
            </button>
            {switcher && (
              <ul className="tsh-class-menu">
                {classes.map((c) => (
                  <li key={c.id}><button type="button" aria-current={c.id === active.id} onClick={() => switchClass(c.id)}>Lớp {c.name}<span>{c.status === 'active' ? `${c.students} em` : 'đã lưu trữ'}</span></button></li>
                ))}
              </ul>
            )}
          </div>
        ) : <p className="tsh-noclass">Chưa có lớp. Tạo lớp ở trang Hôm nay.</p>}
        <button type="button" className="tsh-search" onClick={() => setPalette(true)}>
          <Search aria-hidden="true" /> Tìm em, công cụ… <kbd>Ctrl K</kbd>
        </button>
        <nav className="tsh-navs">{nav}</nav>
        <div className="tsh-me">
          <span className="tsh-me-av" aria-hidden="true">{initials(teacherName)}</span>
          <span className="tsh-me-txt"><b>{teacherName}</b><span>{schoolName || 'Giáo viên'}</span></span>
          <ThemeToggle />
          <form action="/dang-xuat" method="post"><button type="submit" className="tsh-icon-btn" aria-label="Đăng xuất" title="Đăng xuất"><LogOut aria-hidden="true" /></button></form>
        </div>
      </aside>
      {drawer && <div className="tsh-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}

      <div className="tsh-main">
        {/* thanh trên trên điện thoại */}
        <div className="tsh-mtop">
          <Link href="/" aria-label="Trang chủ"><BrandLogo size={26} /></Link>
          {active && <span className="tsh-mtop-class">Lớp {active.name}</span>}
          <button type="button" className="tsh-icon-btn" aria-label="Tìm nhanh" onClick={() => setPalette(true)}><Search aria-hidden="true" /></button>
        </div>
        {children}
      </div>

      {/* thanh tab dưới đáy (điện thoại) */}
      {active && (
        <nav className="tsh-tabs" aria-label="Điều hướng giáo viên">
          <Link href="/giao-vien" className={pathname === '/giao-vien' ? 'is-on' : ''}><Home aria-hidden="true" />Hôm nay</Link>
          <Link href={`/giao-vien/lop/${active.id}/so-lop`} className={current === 'so-lop' ? 'is-on' : ''}><BookCheck aria-hidden="true" />Sổ lớp</Link>
          <Link href={`/giao-vien/lop/${active.id}/goi-ten`} className={`tsh-tab-big${current === 'goi-ten' ? ' is-on' : ''}`}><span><Dices aria-hidden="true" /></span>Gọi tên</Link>
          <Link href={`/giao-vien/lop/${active.id}/ke-hoach`} className={current === 'ke-hoach' ? 'is-on' : ''}><NotebookPen aria-hidden="true" />Dạy học</Link>
          <button type="button" onClick={() => setDrawer(true)}><Menu aria-hidden="true" />Thêm</button>
        </nav>
      )}

      {/* hẹn giờ đang chạy: ô nhỏ góc dưới ở mọi trang (trừ trang Hẹn giờ) */}
      <MiniTimer href={active ? `/giao-vien/lop/${active.id}/hen-gio` : null} hidden={current === 'hen-gio'} />

      {/* trợ lý AI: nút nổi + bảng hội thoại, dùng API key của chính thầy cô (migration 0030) */}
      {FEATURES.ai && <AiAssistant />}

      {palette && <CommandPalette classId={active?.id ?? null} onClose={() => setPalette(false)} />}
    </div>
  );
}

/* ====================================================================== ô tìm nhanh Ctrl+K */
type Item = { id: string; group: string; label: string; hint: string; href: string; Icon: LucideIcon };

function CommandPalette({ classId, onClose }: { classId: string | null; onClose: () => void }) {
  const router = useRouter();
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [roster, setRoster] = useState<{ id: string; name: string }[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    if (!classId || !supabase) return;
    void supabase.rpc('teacher_class_roster', { p_class: classId }).then(({ data }) => {
      const rows = (data ?? []) as { student_id: string; display_name: string; membership_status: string }[];
      setRoster(rows.filter((r) => r.membership_status === 'active').map((r) => ({ id: r.student_id, name: r.display_name })));
    });
  }, [classId, supabase]);

  const items = useMemo<Item[]>(() => {
    const f = fold(q);
    const out: Item[] = [];
    if (classId) {
      const kids = f ? roster.filter((r) => fold(r.name).includes(f)) : [];
      for (const k of kids.slice(0, 4)) {
        out.push({ id: `hs-${k.id}`, group: 'Học sinh', label: k.name, hint: 'Mở hồ sơ', href: `/giao-vien/lop/${classId}/hoc-sinh/${k.id}`, Icon: Users });
      }
      const k = kids[0];
      if (k) {
        out.push({ id: 'a-sl', group: 'Việc nhanh', label: `Điểm danh, ghi chú cho ${k.name}`, hint: 'Sổ lớp', href: `/giao-vien/lop/${classId}/so-lop?em=${k.id}`, Icon: BookCheck });
        out.push({ id: 'a-tn', group: 'Việc nhanh', label: `Soạn tin nhắn cho phụ huynh ${k.name}`, hint: 'Sổ lớp', href: `/giao-vien/lop/${classId}/so-lop?tab=tin-nhan`, Icon: MessageSquareHeart });
      }
      const tools = TOOLS.filter((t: Tool) => !f || fold(`${t.label} ${t.desc}`).includes(f) || t.keywords.includes(f));
      for (const t of tools) out.push({ id: `t-${t.key}`, group: 'Công cụ', label: t.label, hint: t.desc, href: toolHref(t, classId), Icon: TOOL_ICON[t.key] });
    }
    if (!f || fold('hom nay trang chinh').includes(f)) out.push({ id: 'home', group: 'Trang', label: 'Hôm nay', hint: 'Trang chính của thầy cô', href: '/giao-vien', Icon: LayoutGrid });
    return out;
  }, [q, roster, classId]);

  useEffect(() => { setSel(0); }, [q]);
  const open = useCallback((it?: Item) => { if (!it) return; onClose(); router.push(it.href); }, [onClose, router]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); open(items[sel]); }
  };

  let lastGroup = '';
  return (
    <div className="tsh-pal-bg" onClick={onClose}>
      <div className="tsh-pal" role="dialog" aria-modal="true" aria-label="Tìm nhanh" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <label className="tsh-pal-in">
          <Search aria-hidden="true" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ tên em hoặc tên công cụ…" aria-label="Tìm nhanh" role="combobox" aria-expanded="true" aria-controls="tsh-pal-list" aria-activedescendant={items[sel] ? `pal-${items[sel].id}` : undefined} />
          <kbd>Esc</kbd>
        </label>
        <ul id="tsh-pal-list" className="tsh-pal-list" role="listbox">
          {items.length === 0 && <li className="tsh-pal-empty">Không tìm thấy “{q}”.</li>}
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.id} role="presentation">
                {head && <p className="tsh-pal-group">{head}</p>}
                <button type="button" id={`pal-${it.id}`} role="option" aria-selected={i === sel} className={i === sel ? 'is-sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => open(it)}>
                  <it.Icon aria-hidden="true" /><span className="tsh-pal-label">{it.label}</span><span className="tsh-pal-hint">{it.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="tsh-pal-foot"><kbd>↑</kbd><kbd>↓</kbd> chọn · <kbd>Enter</kbd> mở · <kbd>Ctrl K</kbd> bật / tắt</p>
      </div>
    </div>
  );
}
