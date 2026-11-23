'use client';

// Văn phòng ảo: bản đồ trực quan các trợ lý AI của Phòng CNTT / Phòng Marketing + chỗ chép lệnh giao việc.
// Hai chế độ: 3D (Stage3D, tải lười) và dạng thẻ 2D. React chỉ giữ state khi người dùng bấm (không theo khung hình).
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Home, Info, LayoutGrid } from 'lucide-react';
import OfficeGrid from './OfficeGrid';
import RolePanel from './RolePanel';
import type { OfficeStageApi } from './OfficeStage';
import type { OfficeRoleView } from '@/lib/office/roles';
import { OFFICE_HOME as HOME } from '@/lib/office/labels';
import '@/styles/vpo.css';

const OfficeStage = dynamic(() => import('./OfficeStage'), { ssr: false, loading: () => <div className="vpo-stage"><p className="vpo-stage-msg">Đang tải văn phòng 3D…</p></div> });

type Mode = '3d' | 'grid';
const MODE_KEY = 'edukid:van-phong-mode';
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function VirtualOffice({ roles }: { roles: OfficeRoleView[] }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [noGL, setNoGL] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const api = useRef<OfficeStageApi | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const homeBtn = useRef<HTMLButtonElement>(null);
  const role = roles.find((r) => r.id === selected) ?? null;

  // chọn chế độ lúc mở trang: lựa chọn đã lưu > màn hình hẹp (< 720 px) thì dạng thẻ > 3D
  useEffect(() => {
    let m: Mode = window.innerWidth < 720 ? 'grid' : '3d';
    try { const s = localStorage.getItem(MODE_KEY); if (s === '3d' || s === 'grid') m = s; } catch { /* bỏ qua */ }
    setMode(m);
  }, []);
  const pick = (m: Mode, from?: HTMLElement | null) => {
    setMode(m); setSelected(null); opener.current = null;
    try { localStorage.setItem(MODE_KEY, m); } catch { /* bỏ qua */ }
    // bảng đang mở thì đóng lại: giữ focus ở nút chế độ vừa bấm
    if (from) requestAnimationFrame(() => from.focus());
  };
  /** bay camera; bật giảm chuyển động thì đặt góc nhìn tức thì */
  const goCam = (cam: number[], tgt: number[]) => { if (reducedMotion()) api.current?.jump(cam, tgt); else api.current?.flyTo(cam, tgt); };
  const goHome = () => { if (reducedMotion()) api.current?.jump(HOME.cam, HOME.tgt); else api.current?.home(); };

  const open = useCallback((id: string, from?: HTMLElement | null) => {
    const r = roles.find((x) => x.id === id); if (!r) return;
    const act = document.activeElement as HTMLElement | null;
    opener.current = from ?? (act && act !== document.body ? act : null);
    setSelected(id);
    api.current?.highlight(id);
    goCam(r.cam, r.tgt);
  }, [roles]);

  const close = useCallback(() => {
    const r = roles.find((x) => x.id === selected);
    setSelected(null);
    api.current?.highlight(null);
    goHome();
    // trả focus về chỗ đã bấm; ghim 3D có thể đã được dựng lại (mô hình vừa tải) thì tìm ghim cùng tên
    const prev = opener.current; opener.current = null;
    requestAnimationFrame(() => {
      if (prev?.isConnected) { prev.focus(); return; }
      const pin = r ? [...document.querySelectorAll<HTMLButtonElement>('.vpo-stage .s3d-pin')].find((b) => b.querySelector('i')?.textContent === r.short) : null;
      (pin ?? homeBtn.current)?.focus();
    });
  }, [roles, selected]);

  const toHome = () => { if (selected) { close(); return; } goHome(); };

  // Esc: đóng bảng và về toàn cảnh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // lớp khác (chuông thông báo, menu…) đã xử lý Esc thì thôi: chỉ đóng lớp trên cùng
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (selected) { e.preventDefault(); close(); } else if (mode === '3d') goHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, mode, close]);

  const failed = useCallback(() => { setNoGL(true); setMode('grid'); }, []);
  const showList = () => {
    pick('grid');
    requestAnimationFrame(() => document.getElementById('vpo-danh-sach')?.focus());
  };

  return (
    <div className="adm-stack vpo">
      <a href="#vpo-danh-sach" className="vpo-skip" onClick={(e) => { e.preventDefault(); showList(); }}>Xem dạng danh sách</a>
      <div className="adm-head">
        <div>
          <h1>Văn phòng ảo</h1>
          <p>Bàn Trưởng phòng, Phòng CNTT và Phòng Marketing. Bấm vào một bàn để xem việc, quyền hạn và chép lệnh giao việc.</p>
        </div>
        <div className="vpo-tools">
          <div className="vpo-seg" role="group" aria-label="Cách xem">
            <button type="button" aria-pressed={mode === '3d'} onClick={(e) => pick('3d', e.currentTarget)} disabled={noGL}><Box size={16} aria-hidden="true" /> 3D</button>
            <button type="button" aria-pressed={mode === 'grid'} onClick={(e) => pick('grid', e.currentTarget)}><LayoutGrid size={16} aria-hidden="true" /> Dạng thẻ</button>
          </div>
          {mode === '3d' && <button type="button" className="vpo-btn" ref={homeBtn} onClick={toHome}><Home size={16} aria-hidden="true" /> Toàn cảnh</button>}
        </div>
      </div>

      <p className="vpo-note"><Info size={16} aria-hidden="true" /> Các trợ lý AI chạy trong Claude Code trên máy Trưởng phòng. Trang này không chạy agent, chỉ để xem và chép lệnh giao việc.</p>
      {noGL && <p className="adm-alert is-info" role="status">Máy này chưa xem được văn phòng 3D, đang hiện dạng thẻ.</p>}

      <div className={`vpo-body${role ? ' is-open' : ''}${mode === '3d' ? ' is-3d' : ''}`}>
        <div className="vpo-main">
          {mode === '3d' && <OfficeStage roles={roles} onPick={open} onFail={failed} apiRef={api} />}
          {mode === 'grid' && <OfficeGrid roles={roles} selected={selected} onOpen={open} />}
          {mode === '3d' && <p className="vpo-hint">Kéo để xoay, cuộn hoặc chụm hai ngón để phóng to. Phím Tab đi qua các ghim, Esc về toàn cảnh.</p>}
        </div>
        {role && <RolePanel role={role} onClose={close} />}
      </div>
    </div>
  );
}
