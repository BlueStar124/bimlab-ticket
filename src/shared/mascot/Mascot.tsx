// Bim, the BIMLab mascot: a beaver (nature's construction engineer) in the BIMLab uniform: a navy apron
// with the three-bar mark from the BIMLab logo and a pencil in the pocket, and a site hard hat with the
// navy band and the same mark. Drawn in SVG and animated with CSS only (mascot.css), so it adds no script weight.
// Moods change the arms, eyes and mouth; motion stops under prefers-reduced-motion. The pupils follow the
// CSS variables --look-x / --look-y (SVG units) when a parent sets them.
import './mascot.css';

export type MascotMood = 'idle' | 'walk' | 'wave' | 'happy' | 'think';

interface Props {
  mood?: MascotMood;
  size?: number;
  /** Accessible name; pass an empty string when the mascot is purely decorative next to text. */
  label?: string;
  /** `head` frames just the face and hat, for avatars. */
  crop?: 'full' | 'head';
  className?: string;
}

/** The three stacked bars of the BIMLab logo, light to deep blue. */
function BimlabMark({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className="mascot-mark">
      <rect x="0" y="0" width="22" height="4.2" rx="2.1" className="mascot-mark-1" />
      <rect x="0" y="6" width="16" height="4.2" rx="2.1" className="mascot-mark-2" />
      <rect x="0" y="12" width="22" height="4.2" rx="2.1" className="mascot-mark-3" />
    </g>
  );
}

/** BIMLab apron: straps, bib with the logo mark, and a pocket holding an architect's pencil. */
function Apron() {
  return (
    <g className="mascot-apron">
      <path className="mascot-strap" d="M50.5 71.5L45 66M69.5 71.5L75 66" />
      <path className="mascot-apron-cloth" d="M49 70h22v9q9 2.5 9 12.5v14q0 7-7 7h-26q-7 0-7-7v-14q0-10 9-12.5z" />
      {/* Below the chin (the head covers the top of the bib), left of the pencil. */}
      <BimlabMark x={51.5} y={80} scale={0.5} />
      {/* Pencil first so the pocket covers its lower end. */}
      <g className="mascot-pencil">
        <rect x="63.5" y="88" width="3.4" height="11" rx="0.8" transform="rotate(14 65 94)" />
        <path d="M64.1 87.9l1.8-3.6 1.6 3.9z" transform="rotate(14 65 94)" />
      </g>
      <rect className="mascot-pocket" x="51" y="95" width="18" height="9" rx="2.5" />
    </g>
  );
}

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy') {
    // Closed, smiling eyes.
    return (
      <g className="mascot-line" strokeWidth="2.6">
        <path d="M45 47q4.5-5 9 0" />
        <path d="M66 47q4.5-5 9 0" />
      </g>
    );
  }
  const look = mood === 'think' ? { dx: -1.6, dy: -1.8 } : { dx: 0, dy: 0 };
  return (
    <g className="mascot-eyes">
      <g className="mascot-look">
        {[49.5, 70.5].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={46} r={4.4} className="mascot-ink" />
            <circle cx={cx + 1.3 + look.dx} cy={44.6 + look.dy} r={1.4} fill="#fff" />
          </g>
        ))}
      </g>
    </g>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'think') return <path className="mascot-line" d="M55 67.5q5-1.5 10 0" />;
  if (mood === 'happy') return <path className="mascot-ink" d="M53 64.5q7 8 14 0z" />;
  return <path className="mascot-line" d="M54.5 64.5q2.75 3 5.5 0q2.75 3 5.5 0" />;
}

function Arms({ mood }: { mood: MascotMood }) {
  const leftDown = <ellipse cx="38" cy="86" rx="6" ry="11" transform="rotate(18 38 86)" className="mascot-fur" />;
  const rightDown = <ellipse cx="82" cy="86" rx="6" ry="11" transform="rotate(-18 82 86)" className="mascot-fur" />;
  if (mood === 'wave') {
    return (
      <>
        {leftDown}
        <g className="mascot-wave">
          <ellipse cx="88" cy="66" rx="6" ry="12" transform="rotate(28 88 66)" className="mascot-fur" />
          <circle cx="92.5" cy="56.5" r="5.5" className="mascot-fur" />
        </g>
      </>
    );
  }
  if (mood === 'happy') {
    return (
      <g className="mascot-cheer">
        <ellipse cx="32" cy="66" rx="6" ry="12" transform="rotate(-32 32 66)" className="mascot-fur" />
        <ellipse cx="88" cy="66" rx="6" ry="12" transform="rotate(32 88 66)" className="mascot-fur" />
      </g>
    );
  }
  if (mood === 'think') {
    // Paw at the chin.
    return (
      <>
        {leftDown}
        <ellipse cx="74" cy="76" rx="6" ry="11" transform="rotate(-62 74 76)" className="mascot-fur" />
        <circle cx="66" cy="72" r="5.5" className="mascot-fur" />
      </>
    );
  }
  if (mood === 'walk') {
    return (
      <>
        <g className="mascot-swing-l">{leftDown}</g>
        <g className="mascot-swing-r">{rightDown}</g>
      </>
    );
  }
  return (
    <>
      {leftDown}
      {rightDown}
    </>
  );
}

const VIEW = { full: { box: '0 0 120 124', ratio: 124 / 120 }, head: { box: '26 10 68 68', ratio: 1 } };

export function Mascot({ mood = 'idle', size = 96, label = 'Bim, linh vật hải ly của BIMLab', crop = 'full', className }: Props) {
  const decorative = label === '';
  const view = VIEW[crop];
  // Mood classes use their own prefix: part classes such as .mascot-wave (the waving arm) must not match the root.
  return (
    <svg
      className={`mascot mood-${mood}${crop === 'head' ? ' mascot-cropped' : ''}${className ? ` ${className}` : ''}`}
      viewBox={view.box}
      width={size}
      height={size * view.ratio}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <g className="mascot-body">
        {/* Tail: the flat, cross-hatched paddle behind the body. */}
        <g className="mascot-tail">
          <ellipse cx="91" cy="100" rx="12" ry="21" transform="rotate(52 91 100)" className="mascot-tailfill" />
          <path className="mascot-hatch" d="M80 92l18 16M86 88l16 14M78 100l14 12M84 112l14-22M78 106l12-18" />
        </g>
        {/* Body and belly. */}
        <ellipse cx="60" cy="90" rx="27" ry="25" className="mascot-fur" />
        <ellipse cx="60" cy="95" rx="17" ry="16" className="mascot-belly" />
        <Apron />
        {/* Feet. */}
        <ellipse cx="47" cy="114" rx="9" ry="5" className="mascot-dark mascot-foot-l" />
        <ellipse cx="73" cy="114" rx="9" ry="5" className="mascot-dark mascot-foot-r" />
        <Arms mood={mood} />
        {/* Head. */}
        <circle cx="38" cy="33" r="6.5" className="mascot-fur" />
        <circle cx="82" cy="33" r="6.5" className="mascot-fur" />
        <circle cx="60" cy="50" r="27" className="mascot-fur" />
        <ellipse cx="60" cy="61" rx="15" ry="11" className="mascot-belly" />
        <ellipse cx="44" cy="58" rx="4.5" ry="3" className="mascot-cheek" />
        <ellipse cx="76" cy="58" rx="4.5" ry="3" className="mascot-cheek" />
        <Eyes mood={mood} />
        <ellipse cx="60" cy="55.5" rx="5.6" ry="3.8" className="mascot-ink" />
        <Mouth mood={mood} />
        {/* Two big front teeth. */}
        <g className="mascot-teeth">
          <rect x="55.6" y={mood === 'happy' ? 64.5 : 66} width="4.2" height="6" rx="1" />
          <rect x="60.2" y={mood === 'happy' ? 64.5 : 66} width="4.2" height="6" rx="1" />
        </g>
        {/* Site hard hat with the BIMLab navy band. */}
        <g className="mascot-hat">
          <path className="mascot-hatfill" d="M35 37c0-14 11-22 25-22s25 8 25 22z" />
          <path className="mascot-band" d="M35.4 33.5h49.2v3.5h-49.2z" />
          <rect x="29" y="36" width="62" height="6" rx="3" className="mascot-hatfill" />
          <path className="mascot-ridge" d="M60 15.5v8" />
          <BimlabMark x={53} y={24.5} scale={0.55} />
        </g>
      </g>
      {mood === 'think' && (
        <g className="mascot-bubble">
          <circle cx="98" cy="30" r="2" className="mascot-dot" />
          <circle cx="104" cy="21" r="3" className="mascot-dot" />
          <text x="108" y="14" className="mascot-q">
            ?
          </text>
        </g>
      )}
    </svg>
  );
}
