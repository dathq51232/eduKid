'use client';

// Hồ sơ học sinh dạng bảng tính: STT · Họ và tên · Ngày sinh · Chỗ ở hiện nay (migration 0050).
// Nhập nhanh như Excel: dán cả bảng từ file của trường (tự ghép theo tên), dán một cột vào ô là tự điền xuống,
// Enter / ↑ ↓ để đi giữa các dòng, lưu một lần cho cả lớp, tải lại ra Excel đúng mẫu.
// DỮ LIỆU CÁ NHÂN: chỉ giáo viên của lớp đọc/ghi qua hàm trong database, mọi lần lưu có nhật ký.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardPaste, Download, Save, Undo2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/xlsx';
import {
  EMPTY_PROFILE, birthIso, birthVi, byRoll, isBirthOk, isRollOk, matchPaste, parseBirth, parseProfilePaste, parseRoll, profileSheet,
  type Profile, type ProfileStudent,
} from '@/lib/classroom/profiles';

type Col = 'roll' | 'birth' | 'address';
const COLS: Col[] = ['roll', 'birth', 'address'];
const MISSING = 'Chưa bật Hồ sơ học sinh: hãy chạy supabase/migrations/0050_student_profile.sql trên Supabase.';
const same = (a: Profile, b: Profile) => a.roll === b.roll && a.birth === b.birth && a.address === b.address;
const lacks = (p: Profile) => !p.birth || !p.address;

export default function StudentProfiles({ classId, className, students }: { classId: string; className: string; students: ProfileStudent[] }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [saved, setSaved] = useState<Record<string, Profile>>({});
  const [draft, setDraft] = useState<Record<string, Profile>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState<string | null>(null);
  const [onlyLack, setOnlyLack] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const ids = students.map((s) => s.id).join(',');

  const load = useCallback(async () => {
    if (!supabase) { setState('missing'); return; }
    const { data, error } = await supabase.rpc('teacher_student_profiles', { p_class: classId });
    if (error) { setState('missing'); return; }
    const raw = (data ?? {}) as Record<string, { roll: number | null; birth: string | null; address: string | null }>;
    const p: Record<string, Profile> = {};
    for (const [id, v] of Object.entries(raw)) p[id] = { roll: v.roll ? String(v.roll) : '', birth: birthVi(v.birth), address: v.address ?? '' };
    setSaved(p);
    setDraft(p);
    setState('ready');
  }, [supabase, classId]);
  // tải lại khi danh sách em trong lớp đổi (vừa thêm / rời lớp)
  useEffect(() => { void load(); }, [load, ids]);

  const get = (id: string) => draft[id] ?? EMPTY_PROFILE;
  const set = (id: string, col: Col, v: string) => setDraft((d) => ({ ...d, [id]: { ...(d[id] ?? EMPTY_PROFILE), [col]: v } }));
  const dirty = students.filter((s) => !same(get(s.id), saved[s.id] ?? EMPTY_PROFILE));
  const bad = dirty.filter((s) => !isBirthOk(get(s.id).birth) || !isRollOk(get(s.id).roll));
  const ordered = useMemo(() => byRoll(students, saved), [students, saved]);
  const lackCount = students.filter((s) => lacks(get(s.id))).length;
  const shown = onlyLack ? ordered.filter((s) => lacks(get(s.id)) || dirty.includes(s)) : ordered;

  // ---- Dán cả bảng từ Excel: ghép theo tên ----
  const preview = useMemo(() => (paste ? matchPaste(parseProfilePaste(paste), students) : null), [paste, students]);
  const applyRows = (m: NonNullable<typeof preview>) => {
    setDraft((d) => {
      const n = { ...d };
      for (const { student, row } of m.matched) {
        const cur = n[student.id] ?? EMPTY_PROFILE;
        n[student.id] = { roll: row.roll || cur.roll, birth: row.birth || cur.birth, address: row.address || cur.address };
      }
      return n;
    });
    setMsg({ kind: 'ok', text: `Đã điền ${m.matched.length} em vào bảng${m.unmatched.length ? `; ${m.unmatched.length} tên không có trong lớp: ${m.unmatched.join(', ')}` : ''}. Xem lại rồi bấm “Lưu”.` });
  };

  // ---- Nhập kiểu bảng tính ----
  const focusCell = (r: number, c: number) => {
    const el = tableRef.current?.querySelector<HTMLInputElement>(`[data-cell="${r}-${c}"]`);
    if (el) { el.focus(); el.select(); }
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); focusCell(r + (e.shiftKey && e.key === 'Enter' ? -1 : 1), c); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusCell(r - 1, c); }
  };
  const onPasteCell = (e: React.ClipboardEvent<HTMLInputElement>, r: number, c: number) => {
    const text = e.clipboardData.getData('text/plain');
    if (!/[\t\n]/.test(text.trim())) return; // một ô: để trình duyệt dán bình thường
    e.preventDefault();
    // có cột họ tên → dán cả bảng, ghép theo tên
    const full = matchPaste(parseProfilePaste(text), students);
    if (full.matched.length) { applyRows(full); return; }
    // không có tên → điền xuống từ ô đang chọn (và sang phải nếu có nhiều cột)
    const lines = text.replace(/\r/g, '').replace(/\n+$/, '').split('\n');
    setDraft((d) => {
      const n = { ...d };
      lines.forEach((line, i) => {
        const s = shown[r + i];
        if (!s) return;
        const p = { ...(n[s.id] ?? EMPTY_PROFILE) };
        line.split('\t').forEach((v, j) => {
          const col = COLS[c + j];
          if (!col) return;
          const t = v.trim();
          p[col] = col === 'birth' ? parseBirth(t) ?? t : col === 'roll' ? t.replace(/\D/g, '') : t.slice(0, 200);
        });
        n[s.id] = p;
      });
      return n;
    });
    setMsg({ kind: 'ok', text: `Đã điền ${Math.min(lines.length, shown.length - r)} dòng. Xem lại rồi bấm “Lưu”.` });
  };

  const save = async () => {
    if (!supabase || !dirty.length) return;
    if (bad.length) { setMsg({ kind: 'error', text: `Ngày sinh hoặc STT chưa đúng ở: ${bad.map((s) => s.name).join(', ')} (ngày sinh dạng 10/05/2020).` }); return; }
    setBusy(true); setMsg(null);
    const rows = dirty.map((s) => { const p = get(s.id); return { student_id: s.id, roll: parseRoll(p.roll), birth: birthIso(p.birth), address: p.address.trim() || null }; });
    const { error } = await supabase.rpc('teacher_profiles_save', { p_class: classId, p_rows: rows });
    setBusy(false);
    if (error) { setMsg({ kind: 'error', text: /function|schema cache/i.test(error.message) ? MISSING : /invalid_address/.test(error.message) ? 'Có địa chỉ dài quá 200 ký tự.' : 'Chưa lưu được. Kiểm tra mạng rồi thử lại.' }); return; }
    const norm: Record<string, Profile> = { ...draft };
    for (const s of dirty) { const p = get(s.id); norm[s.id] = { roll: p.roll.trim(), birth: parseBirth(p.birth) ?? '', address: p.address.trim() }; }
    setSaved(norm); setDraft(norm);
    setMsg({ kind: 'ok', text: `Đã lưu hồ sơ ${dirty.length} em.` });
  };

  if (state === 'missing') return <p className="adm-alert is-warn">{MISSING}</p>;
  if (state === 'loading') return <p className="dash-muted">Đang tải hồ sơ…</p>;

  return (
    <div className="sp">
      <div className="sp-bar">
        <button type="button" className="mini-btn is-primary" onClick={() => setPaste((p) => (p === null ? '' : null))} aria-expanded={paste !== null}>
          <ClipboardPaste aria-hidden="true" /> Dán từ Excel
        </button>
        <div className="sp-filter" role="group" aria-label="Lọc">
          <button type="button" className={`sp-chip${onlyLack ? '' : ' is-on'}`} onClick={() => setOnlyLack(false)}>Tất cả ({students.length})</button>
          <button type="button" className={`sp-chip${onlyLack ? ' is-on' : ''}`} onClick={() => setOnlyLack(true)} disabled={!lackCount && !onlyLack}>Còn thiếu ({lackCount})</button>
        </div>
        <button type="button" className="mini-btn sp-xlsx" onClick={() => downloadXlsx(`danh-sach-hoc-sinh-lop-${className}.xlsx`, [profileSheet(className, ordered, saved)])}>
          <Download aria-hidden="true" /> Tải Excel
        </button>
      </div>

      {paste !== null && (
        <div className="sp-paste">
          <div className="sp-paste-head">
            <b>Dán bảng danh sách của trường</b>
            <button type="button" className="mini-btn" onClick={() => setPaste(null)} aria-label="Đóng"><X aria-hidden="true" /></button>
          </div>
          <p className="dash-muted">Trong Excel / Google Sheets, bôi đen từ cột <b>STT</b> đến cột <b>Chỗ ở</b> của các dòng học sinh (có thể lấy cả dòng tiêu đề), bấm Ctrl+C rồi dán vào đây. Hệ thống tự nhận cột và ghép đúng em theo họ tên — thứ tự dòng không cần khớp.</p>
          <textarea rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'1\tNguyễn Huỳnh Bảo An\t10/05/2020\tSố nhà 12, đường Hàn Mặc Tử, thôn 6\n2\tLê Nguyễn Phương Anh\t06/04/2020\t…'} autoFocus />
          {preview && paste.trim() && (
            <div className="sp-preview" aria-live="polite">
              {preview.matched.length ? (
                <p><b className="sp-ok">Khớp {preview.matched.length}/{students.length} em</b>
                  {' · '}{preview.matched.filter((m) => m.row.birth).length} có ngày sinh · {preview.matched.filter((m) => m.row.address).length} có chỗ ở · {preview.matched.filter((m) => m.row.roll).length} có STT</p>
              ) : <p className="sp-warn">Chưa nhận ra họ tên học sinh nào — nhớ chép cả cột Họ và tên.</p>}
              {preview.unmatched.length > 0 && <p className="sp-warn">Không có trong lớp: {preview.unmatched.join(', ')}</p>}
              {preview.matched.length > 0 && preview.missing.length > 0 && <p className="dash-muted">Chưa có trong bảng dán: {preview.missing.map((s) => s.name).join(', ')}</p>}
              <button type="button" className="btn btn-primary btn-sm" disabled={!preview.matched.length} onClick={() => { applyRows(preview); setPaste(null); }}>
                Điền vào bảng
              </button>
            </div>
          )}
        </div>
      )}

      {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}

      <div className="table-scroll sp-scroll" ref={tableRef}>
        <table className="roster-table sp-table">
          <thead>
            <tr><th className="sp-roll">STT</th><th>Họ và tên</th><th className="sp-birth">Ngày sinh</th><th>Chỗ ở hiện nay</th></tr>
          </thead>
          <tbody>
            {shown.map((s, r) => {
              const p = get(s.id);
              const changed = !same(p, saved[s.id] ?? EMPTY_PROFILE);
              const cell = (c: number, col: Col, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
                <input data-cell={`${r}-${c}`} value={p[col]} onChange={(e) => set(s.id, col, e.target.value)}
                  onKeyDown={(e) => onKey(e, r, c)} onPaste={(e) => onPasteCell(e, r, c)} {...extra} />
              );
              return (
                <tr key={s.id} className={changed ? 'is-changed' : undefined}>
                  <td className="sp-roll">{cell(0, 'roll', { inputMode: 'numeric', maxLength: 2, placeholder: String(r + 1), 'aria-label': `STT của ${s.name}`, 'aria-invalid': !isRollOk(p.roll) })}</td>
                  <th scope="row">{s.name}</th>
                  <td className="sp-birth">{cell(1, 'birth', { inputMode: 'numeric', maxLength: 10, placeholder: 'dd/mm/yyyy', 'aria-label': `Ngày sinh của ${s.name}`, 'aria-invalid': !isBirthOk(p.birth),
                    onBlur: () => { const v = parseBirth(p.birth); if (v && v !== p.birth) set(s.id, 'birth', v); } })}</td>
                  <td className="sp-addr">{cell(2, 'address', { maxLength: 200, placeholder: 'Số nhà, đường, thôn…', 'aria-label': `Chỗ ở của ${s.name}` })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="dash-muted sp-hint">Mẹo: chép <b>một cột</b> (ví dụ cả cột Ngày sinh) trong Excel rồi dán vào ô của em đầu tiên — các ô bên dưới tự điền. Enter để xuống dòng.</p>

      {dirty.length > 0 && (
        <div className="sp-save" role="region" aria-label="Lưu thay đổi">
          <span><b>{dirty.length}</b> em có thay đổi chưa lưu{bad.length ? ` · ${bad.length} ô chưa đúng` : ''}</span>
          <button type="button" className="mini-btn" onClick={() => { setDraft(saved); setMsg(null); }} disabled={busy}><Undo2 aria-hidden="true" /> Bỏ thay đổi</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang lưu…' : 'Lưu'}</button>
        </div>
      )}
    </div>
  );
}
