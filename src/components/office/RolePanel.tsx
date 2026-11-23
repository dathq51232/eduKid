'use client';

// Văn phòng ảo — bảng thông tin một vị trí (dùng chung cho chế độ 3D và dạng thẻ): việc chính, quyền hạn,
// thư mục nộp, việc gần nhất, nút "Chép lệnh giao việc".
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, FileText, X } from 'lucide-react';
import type { OfficeRoleView } from '@/lib/office/roles';
import { ACCESS_LABEL, DEPT_LABEL } from '@/lib/office/labels';
import '@/styles/vpo.css';

function Recent({ role }: { role: OfficeRoleView }) {
  const r = role.recent;
  if (r.state === 'ok') {
    return (
      <p className="vpo-recent"><FileText size={16} aria-hidden="true" /> <span><b>{r.file}</b><small>{r.dir} · sửa ngày {r.date}</small></span></p>
    );
  }
  if (r.state === 'local-only') return <p className="vpo-muted">Chỉ xem được khi chạy trên máy.</p>;
  if (r.state === 'empty') return <p className="vpo-muted">Chưa có file nào trong {role.outDirs.join(', ')}.</p>;
  return <p className="vpo-muted">Vị trí này không nộp file riêng: kết quả báo thẳng trong Claude Code.</p>;
}

function CommandRow({ text }: { text: string }) {
  const [done, setDone] = useState<'ok' | 'manual' | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // thông báo tự tắt sau khoảng 2,5 giây
  const flash = (v: 'ok' | 'manual') => {
    setDone(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(null), 2500);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash('ok');
    } catch {
      // không chép được (trình duyệt chặn): bôi đen sẵn để tự bấm Ctrl+C
      box.current?.focus(); box.current?.select();
      flash('manual');
    }
  };
  return (
    <li className="vpo-cmd">
      <textarea ref={box} readOnly value={text} rows={3} aria-label="Lệnh giao việc mẫu" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="vpo-btn is-pri" onClick={copy}>
        {done === 'ok' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} Chép lệnh giao việc
      </button>
      <span className="vpo-cmd-msg" role="status">
        {done === 'ok' ? 'Đã chép, dán vào Claude Code rồi thay chỗ “…”.' : done === 'manual' ? 'Chưa chép tự động được: lệnh đã được bôi đen, bấm Ctrl+C.' : ''}
      </span>
    </li>
  );
}

export default function RolePanel({ role, onClose }: { role: OfficeRoleView; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = `vpo-panel-${role.id}`;
  useEffect(() => { ref.current?.focus(); }, [role.id]);
  return (
    <div className={`vpo-panel is-${role.dept}`} role="dialog" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
      <div className="vpo-panel-h">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={role.agent ? `/emoji/f3d/${role.icon}.webp` : '/brand/milo-sm.webp'} alt="" width={48} height={48} />
        <div>
          <small>{DEPT_LABEL[role.dept]}</small>
          <h2 id={titleId}>{role.title}</h2>
          {role.agent ? <code>{role.id}</code> : <span className="vpo-muted">Người thật (thầy / cô)</span>}
        </div>
        <button type="button" className="vpo-icon-btn" onClick={onClose} aria-label="Đóng bảng thông tin (Esc)" title="Đóng (Esc)"><X size={18} aria-hidden="true" /></button>
      </div>

      <h3>Việc chính</h3>
      <ul className="vpo-list">{role.duties.map((d) => <li key={d}>{d}</li>)}</ul>

      <h3>Quyền hạn <span className={`vpo-badge is-${role.access}`}>{ACCESS_LABEL[role.access]}</span></h3>
      <p>{role.accessText}</p>
      {role.tools.length > 0 && <p className="vpo-muted">Công cụ trong Claude Code: {role.tools.join(', ')}</p>}

      {role.outDirs.length > 0 && (
        <>
          <h3>Nộp vào</h3>
          <p>{role.outDirs.map((d) => <code key={d}>{d}/</code>)}</p>
        </>
      )}

      <h3>Việc gần nhất</h3>
      <Recent role={role} />

      <h3>Giao việc</h3>
      <ul className="vpo-cmds">{role.commands.map((c) => <CommandRow key={c} text={c} />)}</ul>
    </div>
  );
}
