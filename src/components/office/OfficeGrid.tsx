'use client';

// Văn phòng ảo — dạng thẻ 2D (điện thoại, máy không có WebGL, người dùng bàn phím / trình đọc màn hình). Không tải three.js.
import MiloMascot from '@/components/mascot/MiloMascot';
import type { OfficeRoleView } from '@/lib/office/roles';
import { ACCESS_LABEL, DEPT_LABEL, type OfficeDept } from '@/lib/office/labels';
import '@/styles/vpo.css';

const GROUPS: OfficeDept[] = ['lanh-dao', 'cntt', 'marketing'];

export default function OfficeGrid({ roles, selected, onOpen }: {
  roles: OfficeRoleView[];
  selected: string | null;
  onOpen: (id: string, from: HTMLElement) => void;
}) {
  return (
    <div className="vpo-grid-wrap" id="vpo-danh-sach" tabIndex={-1}>
      {GROUPS.map((g) => {
        const list = roles.filter((r) => r.dept === g);
        if (!list.length) return null;
        return (
          <section key={g} className={`vpo-group is-${g}`} aria-labelledby={`vpo-g-${g}`}>
            <h2 id={`vpo-g-${g}`}>{DEPT_LABEL[g]}</h2>
            <ul className="vpo-grid">
              {list.map((r) => (
                <li key={r.id}>
                  <button type="button" className="vpo-card" aria-pressed={selected === r.id} onClick={(e) => onOpen(r.id, e.currentTarget)}>
                    {r.agent
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={`/emoji/f3d/${r.icon}.webp`} alt="" width={44} height={44} loading="lazy" />
                      : <MiloMascot size={44} />}
                    <span className="vpo-card-t">
                      <b>{r.title}</b>
                      <small>{r.agent ? r.id : 'Người thật (thầy / cô)'}</small>
                    </span>
                    <span className={`vpo-badge is-${r.access}`}>{ACCESS_LABEL[r.access]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
