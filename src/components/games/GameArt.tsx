import MiloMascot from '@/components/mascot/MiloMascot';
import type { GameId } from '@/lib/games/catalog';

const INK = '#1f2a44';

/** Hình minh họa thẻ game: cùng khung, cùng nét mực, mỗi game một màu nền nhạt */
export default function GameArt({ id }: { id: GameId }) {
  const bg = id === 'pattern' ? '#e1ebff' : id === 'memory' ? '#efe7ff' : '#dff3e8';
  return (
    <div className="game-art" style={{ background: bg }} aria-hidden="true">
      <svg viewBox="0 0 240 120" className="game-art-scene" focusable="false">
        {id === 'pattern' && (
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <circle cx="40" cy="60" r="16" fill="#e2483d" />
            <rect x="70" y="44" width="32" height="32" rx="5" fill="#2f6fed" />
            <circle cx="132" cy="60" r="16" fill="#e2483d" />
            <rect x="162" y="40" width="44" height="40" rx="8" fill="#fff" strokeDasharray="6 5" />
            <text x="184" y="70" textAnchor="middle" fontSize="28" fontWeight="800" fill={INK} stroke="none" fontFamily="var(--font-display), sans-serif">?</text>
          </g>
        )}
        {id === 'memory' && (
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <rect x="34" y="26" width="44" height="64" rx="8" fill="#8b5cf6" />
            <path d="M46 48 h20 M46 58 h20 M46 68 h20" stroke="#c9b5ff" strokeWidth="3" />
            <rect x="98" y="26" width="44" height="64" rx="8" fill="#fff" />
            <path d="M120 44l4.6 9.6 10.4 1.4-7.6 7.2 1.9 10.4L120 67.6l-9.3 5 1.9-10.4L105 55l10.4-1.4L120 44z" fill="#f5b82e" strokeWidth="2.5" />
            <rect x="162" y="26" width="44" height="64" rx="8" fill="#fff" transform="rotate(8 184 58)" />
            <path d="M184 44l4.6 9.6 10.4 1.4-7.6 7.2 1.9 10.4L184 67.6l-9.3 5 1.9-10.4L169 55l10.4-1.4L184 44z" fill="#f5b82e" strokeWidth="2.5" transform="rotate(8 184 58)" />
          </g>
        )}
        {id === 'maze' && (
          <g>
            <rect x="30" y="14" width="180" height="92" rx="8" fill="#fff" stroke={INK} strokeWidth="3" />
            <path d="M30 44 H90 M120 14 V74 M60 74 H150 M180 44 V106 M150 44 H180" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M196 80l3.6 7.4 8 1.1-5.8 5.6 1.4 8L196 98.3l-7.2 3.8 1.4-8-5.8-5.6 8-1.1L196 80z" fill="#f5b82e" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          </g>
        )}
      </svg>
      <MiloMascot size={40} mood={id === 'pattern' ? 'think' : id === 'memory' ? 'happy' : 'cheer'} className="game-art-milo" />
    </div>
  );
}
