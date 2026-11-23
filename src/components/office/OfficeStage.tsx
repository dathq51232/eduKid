'use client';

// Văn phòng ảo — chế độ 3D: nhúng sân khấu Stage3D của bài giảng 3D (theo mẫu Scene3DBox), chế độ trình chiếu
// (playScene = 0) để bấm đồ vật / ghim thì gọi onPick. three.js chỉ tải ở đây bằng import động.
// Không setState theo khung hình: vị trí ghim do engine tự đặt trên DOM.
import { useEffect, useRef, useState } from 'react';
import type { OfficeRoleView } from '@/lib/office/roles';
import { OFFICE_HOME } from '@/lib/office/labels';
import '@/styles/s3d.css';
import '@/styles/vpo.css';

export type OfficeStageApi = {
  flyTo: (cam: number[], tgt: number[]) => void;
  /** bay về góc toàn cảnh của văn phòng (OFFICE_HOME) */
  home: () => void;
  /** đặt góc nhìn tức thì, không hoạt ảnh (khi bật giảm chuyển động) */
  jump: (cam: number[], tgt: number[]) => void;
  highlight: (roleId: string | null) => void;
};

/** máy yếu: tắt bóng đổ, pixel ratio 1 */
function weakDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || (navigator.hardwareConcurrency || 8) <= 4;
}

export default function OfficeStage({ roles, onPick, onFail, apiRef }: {
  roles: OfficeRoleView[];
  onPick: (roleId: string) => void;
  onFail: () => void;
  apiRef: React.MutableRefObject<OfficeStageApi | null>;
}) {
  const el = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  // giữ hàm mới nhất mà không dựng lại sân khấu
  const pickRef = useRef(onPick); pickRef.current = onPick;
  const failRef = useRef(onFail); failRef.current = onFail;

  useEffect(() => {
    let alive = true;
    let cleanup: (() => void) | null = null;
    let unregister: (() => void) | null = null;
    void (async () => {
      try {
        const [{ Stage3D }, { hasWebGL }, scene] = await Promise.all([
          import('@/lib/lesson3d/engine'), import('@/lib/gallery/room'), import('@/lib/office/scene'),
        ]);
        if (!alive || !el.current) return;
        if (!hasWebGL()) { failRef.current(); return; }
        scene.registerOfficeAssets(roles);
        unregister = scene.unregisterOfficeAssets;
        const ids = new Set(roles.map((r) => r.id));
        const eng = new Stage3D(el.current, {
          onPick: (objId) => { const id = scene.roleOfObject(objId); if (ids.has(id)) pickRef.current(id); },
        });
        // tạo xong sân khấu là có cách dọn ngay, kể cả khi bước sau lỗi
        cleanup = () => { apiRef.current = null; eng.dispose(); unregister?.(); unregister = null; };
        eng.renderer.domElement.setAttribute('aria-hidden', 'true');
        eng.playScene = 0;
        if (weakDevice()) eng.setLite(true);
        eng.setLesson(scene.buildOfficeLesson(roles));
        const jump = (cam: number[], tgt: number[]) => {
          if (cam.length !== 3 || tgt.length !== 3) return;
          eng.camera.position.set(cam[0], cam[1], cam[2]); eng.controls.target.set(tgt[0], tgt[1], tgt[2]); eng.controls.update();
        };
        jump(OFFICE_HOME.cam, OFFICE_HOME.tgt); // góc toàn cảnh riêng của văn phòng ngay khi dựng xong
        apiRef.current = {
          flyTo: (cam, tgt) => eng.flyTo(cam, tgt),
          home: () => eng.flyTo(OFFICE_HOME.cam, OFFICE_HOME.tgt),
          jump,
          highlight: (roleId) => eng.highlight(roleId ? `${roleId}:desk` : null),
        };
        setLoading(false);
      } catch {
        // dựng lỗi giữa chừng: gỡ đồ vật office-* và giải phóng sân khấu nếu đã tạo
        if (cleanup) { cleanup(); cleanup = null; } else { unregister?.(); unregister = null; }
        if (alive) failRef.current();
      }
    })();
    return () => { alive = false; if (cleanup) cleanup(); else unregister?.(); };
  }, [roles, apiRef]);

  return (
    <div className="vpo-stage" ref={el}>
      {loading && <p className="vpo-stage-msg" role="status">Đang dựng văn phòng 3D…</p>}
    </div>
  );
}
