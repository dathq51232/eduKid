// Icon phẳng của trang chủ giáo viên — vẽ lại bằng SVG theo ảnh mẫu dashboard (nét ở mọi cỡ, mọi màn hình).
// Mỗi icon là một hàm nhận size (px). Màu cố định theo ảnh mẫu; icon trong vòng tròn tự vẽ vòng tròn nền.
import type { ReactElement } from 'react';

type P = { size: number; className?: string };
const svg = (size: number, className: string | undefined, body: ReactElement, vb = 48) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} className={`dash-ic${className ? ` ${className}` : ''}`} aria-hidden="true" focusable="false">{body}</svg>
);

/* ---------- vòng tròn số liệu (4 ô đầu trang) ---------- */
const People = ({ c }: { c: string }) => (
  <g fill={c}>
    <circle cx="19" cy="18.5" r="5.6" /><circle cx="31" cy="17.5" r="4.6" />
    <path d="M9.5 33.5c0-5.6 4.3-9.4 9.5-9.4s9.5 3.8 9.5 9.4c0 1.2-.9 2-2 2H11.5c-1.1 0-2-.8-2-2Z" />
    <path d="M29.8 35.5h7.2c1 0 1.8-.8 1.8-1.8 0-4.8-3.4-8.3-7.8-8.3-1.6 0-3 .4-4.2 1.2 2 1.9 3.2 4.6 3.2 7.6 0 .5-.1.9-.2 1.3Z" />
  </g>
);
export const StatUsers = ({ size, className }: P) => svg(size, className, <><circle cx="24" cy="24" r="24" fill="#dce8ff" /><People c="#2f6bea" /></>);
export const StatBook = ({ size, className }: P) => svg(size, className, <>
  <circle cx="24" cy="24" r="24" fill="#d6f3e0" />
  <path fill="#22a35a" d="M23 15.4c-3-1.8-6.7-2.5-10.4-2.2-.9.1-1.6.9-1.6 1.8v17.4c0 1 .9 1.8 1.9 1.7 3.5-.3 6.9.4 9.7 2.1.2.1.4.2.4-.1V15.6Zm2 0v20.7c0 .3.2.2.4.1 2.8-1.7 6.2-2.4 9.7-2.1 1 .1 1.9-.7 1.9-1.7V15c0-.9-.7-1.7-1.6-1.8-3.7-.3-7.4.4-10.4 2.2Z" />
</>);
export const StatCal = ({ size, className }: P) => svg(size, className, <>
  <circle cx="24" cy="24" r="24" fill="#ffe0e1" />
  <g fill="none" stroke="#e5484d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="13" y="15" width="22" height="20" rx="3.5" /><path d="M13 21.5h22M19 12.5v5M29 12.5v5" />
  </g>
</>);
export const StatCheck = ({ size, className }: P) => svg(size, className, <>
  <circle cx="24" cy="24" r="24" fill="#ece3ff" />
  <rect x="13.5" y="13" width="21" height="22" rx="4" fill="#8b5cf6" />
  <path d="m18.5 19.5 3.6 3.4 7.4-6.4M18.5 26.5l3.6 3.4 7.4-6.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
</>);

/* ---------- icon tiêu đề khối ---------- */
export const HTodo = ({ size, className }: P) => svg(size, className, <g fill="none" stroke="#f59e0b" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
  <rect x="10" y="9" width="28" height="33" rx="5" fill="#fff4d6" /><rect x="17" y="5.5" width="14" height="7.5" rx="2.5" fill="#fff" /><path d="M17 23h14M17 31h9" />
</g>);
export const HWeek = ({ size, className }: P) => svg(size, className, <g>
  <rect x="7" y="10" width="34" height="31" rx="6" fill="#e3edff" stroke="#2f6bea" strokeWidth="3.4" />
  <path d="M7 18.5h34" stroke="#2f6bea" strokeWidth="3.4" /><path d="M16 6.5v7M32 6.5v7" stroke="#2f6bea" strokeWidth="3.4" strokeLinecap="round" />
  <g fill="#2f6bea"><rect x="14" y="24" width="5" height="4.5" rx="1.2" /><rect x="21.5" y="24" width="5" height="4.5" rx="1.2" /><rect x="29" y="24" width="5" height="4.5" rx="1.2" /><rect x="14" y="31" width="5" height="4.5" rx="1.2" /><rect x="21.5" y="31" width="5" height="4.5" rx="1.2" /></g>
</g>);
export const HClass = ({ size, className }: P) => svg(size, className, <People c="#3b82f6" />, 48);
export const HTools = ({ size, className }: P) => svg(size, className, <g>
  <path fill="#7aa7f7" d="m24 30.5 15.2-7.2 2.6 1.3c1.1.5 1.1 2.1 0 2.6L25.7 34.8c-1.1.5-2.3.5-3.4 0L6.2 27.2c-1.1-.5-1.1-2.1 0-2.6l2.6-1.3L24 30.5Z" />
  <path fill="#4f86f0" d="m24 38 15.2-7.2 2.6 1.3c1.1.5 1.1 2.1 0 2.6L25.7 42.3c-1.1.5-2.3.5-3.4 0L6.2 34.7c-1.1-.5-1.1-2.1 0-2.6l2.6-1.3L24 38Z" opacity=".9" />
  <path fill="#2f6bea" d="M22.3 6.2c1.1-.5 2.3-.5 3.4 0l16.1 7.6c1.1.5 1.1 2.1 0 2.6L25.7 24c-1.1.5-2.3.5-3.4 0L6.2 16.4c-1.1-.5-1.1-2.1 0-2.6l16.1-7.6Z" />
</g>);
export const HMine = ({ size, className }: P) => svg(size, className, <g>
  <circle cx="24" cy="24" r="20" fill="#f59e0b" /><circle cx="24" cy="19.5" r="6.5" fill="#fff" />
  <path fill="#fff" d="M12.5 35.5c2.4-4.6 6.6-7.2 11.5-7.2s9.1 2.6 11.5 7.2A19.9 19.9 0 0 1 24 44a19.9 19.9 0 0 1-11.5-8.5Z" />
</g>);

/* ---------- 6 ô công cụ ---------- */
export const TLesson = ({ size, className }: P) => svg(size, className, <g>
  <rect x="5" y="8" width="38" height="27" rx="5" fill="#1f7ae0" /><path fill="#fff" d="M21 15.5v12.8c0 .9 1 1.4 1.7.9l9.3-6.4c.6-.4.6-1.3 0-1.7l-9.3-6.4c-.7-.5-1.7 0-1.7.8Z" />
  <rect x="10" y="38.5" width="28" height="3.6" rx="1.8" fill="#1f7ae0" />
</g>);
export const TPlan = ({ size, className }: P) => svg(size, className, <g>
  <rect x="9" y="8" width="30" height="35" rx="5" fill="#f5a524" /><rect x="13" y="12" width="22" height="27" rx="3" fill="#fff3d0" />
  <rect x="17" y="4.5" width="14" height="8" rx="3" fill="#e08a00" />
  <path d="M18 21h12M18 27h12M18 33h8" stroke="#f5a524" strokeWidth="3" strokeLinecap="round" />
</g>);
export const TBank = ({ size, className }: P) => svg(size, className, <g>
  <path fill="#7c4ddb" d="M8 33v5c0 3.3 7.2 6 16 6s16-2.7 16-6v-5c0 3.3-7.2 6-16 6s-16-2.7-16-6Z" />
  <path fill="#8b5cf6" d="M8 21.5V30c0 3.3 7.2 6 16 6s16-2.7 16-6v-8.5c0 3.3-7.2 6-16 6s-16-2.7-16-6Z" />
  <ellipse cx="24" cy="13" rx="16" ry="6" fill="#b394ff" /><path fill="#9d74fb" d="M8 13v6c0 3.3 7.2 6 16 6s16-2.7 16-6v-6c0 3.3-7.2 6-16 6S8 16.3 8 13Z" />
</g>);
export const TMedia = ({ size, className }: P) => svg(size, className, <g>
  <rect x="5" y="8" width="38" height="32" rx="5" fill="#22a35a" /><rect x="9" y="12" width="30" height="24" rx="2.5" fill="#fff" />
  <circle cx="31" cy="18.5" r="3.2" fill="#22a35a" /><path fill="#22a35a" d="m9 33 8.5-9.5c.8-.9 2.2-.9 3 0L27 31l3.3-3.4c.8-.8 2-.8 2.8 0L39 33.5V36H9v-3Z" />
</g>);
export const TGame = ({ size, className }: P) => svg(size, className, <g>
  <path fill="#ec4899" d="M14.5 12h19c5.7 0 9.6 4.8 10 10.8l.5 7.7c.3 4.6-4.5 7.5-8.2 4.8l-4.4-3.3H16.6l-4.4 3.3C8.5 38 3.7 35.1 4 30.5l.5-7.7c.4-6 4.3-10.8 10-10.8Z" />
  <path d="M15.5 18.5v8M11.5 22.5h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  <g fill="#fff"><circle cx="32" cy="19.5" r="2.1" /><circle cx="36" cy="23.5" r="2.1" /><circle cx="28" cy="23.5" r="2.1" /><circle cx="32" cy="27.5" r="2.1" /></g>
</g>);
export const TAi = ({ size, className }: P) => svg(size, className, <g fill="#f59e0b">
  <path d="M20 8c.6 0 1.1.4 1.3 1l2 6.7c.5 1.7 1.8 3 3.5 3.5l6.7 2c1.3.4 1.3 2.2 0 2.6l-6.7 2c-1.7.5-3 1.8-3.5 3.5l-2 6.7c-.4 1.3-2.2 1.3-2.6 0l-2-6.7c-.5-1.7-1.8-3-3.5-3.5l-6.7-2c-1.3-.4-1.3-2.2 0-2.6l6.7-2c1.7-.5 3-1.8 3.5-3.5l2-6.7c.2-.6.7-1 1.3-1Z" />
  <path d="M37 4.5c.3 0 .5.2.6.5l.8 2.6c.2.6.7 1.1 1.3 1.3l2.6.8c.6.2.6.9 0 1.1l-2.6.8c-.6.2-1.1.7-1.3 1.3l-.8 2.6c-.2.6-.9.6-1.1 0l-.8-2.6c-.2-.6-.7-1.1-1.3-1.3l-2.6-.8c-.6-.2-.6-.9 0-1.1l2.6-.8c.6-.2 1.1-.7 1.3-1.3l.8-2.6c.1-.3.3-.5.5-.5ZM36 31c.3 0 .5.2.6.5l.6 2c.2.5.6.9 1.1 1.1l2 .6c.5.2.5.9 0 1.1l-2 .6c-.5.2-.9.6-1.1 1.1l-.6 2c-.2.5-.9.5-1.1 0l-.6-2c-.2-.5-.6-.9-1.1-1.1l-2-.6c-.5-.2-.5-.9 0-1.1l2-.6c.5-.2.9-.6 1.1-1.1l.6-2c.1-.3.3-.5.5-.5Z" />
</g>);

/* ---------- Không gian cá nhân ---------- */
export const MEnglish = ({ size, className }: P) => svg(size, className, <g>
  <path fill="#f97316" d="M22.6 9.4c.9-.4 1.9-.4 2.8 0l17.3 7.7c1.2.5 1.2 2.2 0 2.7L25.4 27.6c-.9.4-1.9.4-2.8 0L5.3 19.8c-1.2-.5-1.2-2.2 0-2.7l17.3-7.7Z" />
  <path fill="#ea6a0c" d="M12 24.2v8.3c0 3.6 5.4 6.5 12 6.5s12-2.9 12-6.5v-8.3l-9.4 4.2c-1.7.7-3.5.7-5.2 0L12 24.2Z" />
  <path d="M42 19v9" stroke="#ea6a0c" strokeWidth="2.6" strokeLinecap="round" />
</g>);
export const MMoney = ({ size, className }: P) => svg(size, className, <g fill="none" stroke="#22a35a" strokeWidth="3.2" strokeLinejoin="round">
  <path d="M9 15.5 31.5 9c1.8-.5 3.5.8 3.5 2.6V15" strokeLinecap="round" />
  <rect x="7" y="15" width="34" height="25" rx="5" fill="#e3f7ea" /><path d="M41 23h-8.5a4.5 4.5 0 0 0 0 9H41" fill="#fff" /><circle cx="33" cy="27.5" r="1.6" fill="#22a35a" stroke="none" />
</g>);

export const DASH_SVG = {
  'stat-users': StatUsers, 'stat-book': StatBook, 'stat-cal': StatCal, 'stat-check': StatCheck,
  'h-todo': HTodo, 'h-week': HWeek, 'h-class': HClass, 'h-tools': HTools, 'h-mine': HMine,
  't-lesson': TLesson, 't-plan': TPlan, 't-bank': TBank, 't-media': TMedia, 't-game': TGame, 't-ai': TAi,
  'm-english': MEnglish, 'm-money': MMoney,
} as const;
