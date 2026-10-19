import MiloMascot from '@/components/mascot/MiloMascot';
import type { GameId } from '@/lib/games/catalog';

const INK = '#1f2a44';

/** Hình minh họa thẻ game: cùng khung, cùng nét mực, mỗi game một màu nền nhạt */
export default function GameArt({ id }: { id: GameId }) {
  const bg = { pattern: '#e1ebff', memory: '#efe7ff', maze: '#dff3e8', robot: '#fff0cc', sudoku: '#e2f5ec', balance: '#fde8e6' }[id];
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
        {id === 'robot' && (
          <g stroke={INK} strokeLinejoin="round">
            <rect x="28" y="14" width="92" height="92" rx="8" fill="#fff" strokeWidth="3" />
            <path d="M51 14 V106 M74 14 V106 M97 14 V106 M28 37 H120 M28 60 H120 M28 83 H120" stroke="#c9d6ea" strokeWidth="1.5" />
            <path d="M86 89c-6-1-8-9-3-12 5-4 12 0 12 5 0 6-4 8-9 7z" fill="#9aa6b8" strokeWidth="2" />
            <path d="M108 18l3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1z" fill="#f5b82e" strokeWidth="2" />
            <path d="M49 79 V48 H97" stroke="#2f6fed" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 8" fill="none" />
            <MiloMascot variant="robot" x={30} y={58} size={40} />
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${136 + i * 32} 44)`}>
                <rect width="28" height="32" rx="6" fill="#f5b82e" strokeWidth="2.5" />
                <path d={i === 1 ? 'M14 24 V9 M8 15 L14 9 L20 15' : 'M6 16 H22 M16 10 L22 16 L16 22'} stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
              </g>
            ))}
          </g>
        )}
        {id === 'sudoku' && (
          <g>
            <rect x="72" y="12" width="96" height="96" rx="8" fill="#fff" stroke={INK} strokeWidth="3" />
            <path d="M96 12 V108 M144 12 V108 M72 36 H168 M72 84 H168" stroke="#c9d6ea" strokeWidth="1.5" />
            <path d="M120 12 V108 M72 60 H168" stroke={INK} strokeWidth="3" />
            {[[0, 0, '1'], [2, 0, '3'], [1, 1, '4'], [3, 2, '2'], [0, 3, '4'], [2, 3, '1']].map(([c, r, v]) => (
              <text key={`${c}${r}`} x={84 + Number(c) * 24} y={31 + Number(r) * 24} textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily="var(--font-display), sans-serif">{v}</text>
            ))}
            <rect x="122" y="38" width="20" height="20" rx="4" fill="#fff3d1" stroke="#1f4fb8" strokeWidth="2" strokeDasharray="4 3" />
          </g>
        )}
        {id === 'balance' && (
          <g stroke={INK} strokeLinejoin="round">
            <path d="M120 40 L110 100 H130 Z" fill="#8b5cf6" strokeWidth="2.5" />
            <rect x="88" y="98" width="64" height="10" rx="5" fill="#8b5cf6" strokeWidth="2.5" />
            <rect x="42" y="35" width="156" height="9" rx="4.5" fill="#2f6fed" strokeWidth="2.5" />
            <circle cx="120" cy="40" r="6" fill="#f5b82e" strokeWidth="2.5" />
            <path d="M58 44 L40 74 M58 44 L76 74 M182 44 L164 74 M182 44 L200 74" strokeWidth="1.6" fill="none" />
            <path d="M32 74 H84 L78 82 H38 Z M156 74 H208 L202 82 H162 Z" fill="#f5b82e" strokeWidth="2.5" />
            <circle cx="50" cy="62" r="11" fill="#e2483d" strokeWidth="2.5" />
            <circle cx="70" cy="62" r="11" fill="#e2483d" strokeWidth="2.5" />
            <rect x="170" y="52" width="24" height="22" rx="5" fill="#fff" stroke="#1f4fb8" strokeWidth="2.5" strokeDasharray="5 4" />
            <text x="182" y="69" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1f4fb8" stroke="none" fontFamily="var(--font-display), sans-serif">?</text>
          </g>
        )}
      </svg>
      {id !== 'robot' && (
        <MiloMascot size={40} mood={id === 'pattern' || id === 'sudoku' ? 'think' : id === 'memory' ? 'happy' : 'cheer'} className="game-art-milo" />
      )}
    </div>
  );
}
