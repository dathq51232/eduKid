// Chỉ chạy trên máy chủ (layout): đổi khung ngày của từng mùa ra khoảng dương lịch cụ thể cho vài năm,
// rồi tạo đoạn script nhỏ gắn data-season lên <html> trước khi trang hiện (không nháy, không gọi mạng).
import 'server-only';
import { lunarToSolar } from '@/lib/utils/lunar';
import { SEASONS, SEASON_IDS, type SeasonWindow } from '@/lib/seasons';

/** [id, bắt đầu yyyymmdd, kết thúc yyyymmdd, priority] */
type Range = [string, number, number, number];

const num = (d: number, m: number, y: number) => y * 10000 + m * 100 + d;

function rangeOf(w: SeasonWindow, year: number): [number, number] | null {
  const wraps = w.to[1] < w.from[1] || (w.to[1] === w.from[1] && w.to[0] < w.from[0]);
  if (!w.lunar) {
    // năm `year` là năm KẾT THÚC khi khung vắt qua năm mới
    const fy = wraps ? year - 1 : year;
    return [num(w.from[0], w.from[1], fy), num(w.to[0], w.to[1], year)];
  }
  const a = lunarToSolar(w.from[0], w.from[1], wraps ? year - 1 : year);
  const b = lunarToSolar(w.to[0], w.to[1], year);
  if (!a || !b) return null;
  return [num(a[0], a[1], a[2]), num(b[0], b[1], b[2])];
}

export function seasonRanges(fromYear: number, toYear: number): Range[] {
  const out: Range[] = [];
  for (const s of SEASONS) {
    for (let y = fromYear; y <= toYear; y++) {
      const r = rangeOf(s.window, y);
      if (r) out.push([s.id, r[0], r[1], s.priority]);
    }
  }
  return out;
}

/** Script gắn mùa. Trang dựng tĩnh lúc build vẫn đúng vì có sẵn khoảng ngày của nhiều năm. */
export function seasonScript(): string {
  const y = new Date().getFullYear();
  const ranges = seasonRanges(y - 1, y + 4);
  const force = (process.env.NEXT_PUBLIC_SEASON ?? '').trim();
  return `(function(){try{var d=document.documentElement,R=${JSON.stringify(ranges)},I=${JSON.stringify(SEASON_IDS)},F=${JSON.stringify(force)};
if(F==='off')return;var id=null,s=null;
try{var q=new URLSearchParams(location.search).get('mua');if(q){if(q==='auto')sessionStorage.removeItem('educhain-mua');else sessionStorage.setItem('educhain-mua',q)}s=sessionStorage.getItem('educhain-mua')}catch(e){}
if(s){if(I.indexOf(s)>=0)id=s;else if(s==='off')return}
if(!id&&I.indexOf(F)>=0)id=F;
if(!id){var t=new Date(),n=t.getFullYear()*10000+(t.getMonth()+1)*100+t.getDate(),p=-1;for(var i=0;i<R.length;i++){var r=R[i];if(n>=r[1]&&n<=r[2]&&r[3]>p){id=r[0];p=r[3]}}}
if(!id)return;d.setAttribute('data-season',id);
try{var v=localStorage.getItem('educhain-season-fx');if(v==='off'||(v!=='on'&&matchMedia('(prefers-reduced-motion: reduce)').matches))d.setAttribute('data-season-fx','off')}catch(e){}
}catch(e){}})();`;
}
