// ============================================================================
// AUTO COVER v2 — minimal generated artwork for releases without a cover
// Drop-in replacement for PlaceholderArt in App.tsx (same props).
// - deterministic: same title -> same cover; different titles -> different
//   cover (seed mixes title + layout + palette + font + accents)
// - the title is always big and readable, never a tiny caption in a corner
// - ~45% dark neutral, ~35% colour, ~12% light / pastel, ~8% without text
// ============================================================================
import React from 'react';

export interface AutoCoverProps {
  title?: string;
  albumTitle?: string;
  isArtist?: boolean;
  innerClassName?: string;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];

// [background css, text colour, accent]
type Palette = { bg: string; fg: string; accent: string; light?: boolean };
const DARK: Palette[] = [
  { bg: 'linear-gradient(160deg,#0b0b0d 0%,#16161a 100%)', fg: '#e9e9ec', accent: '#3a3a42' },
  { bg: 'linear-gradient(200deg,#0d0f12 0%,#050506 100%)', fg: '#d4d4d8', accent: '#2a2d33' },
  { bg: 'radial-gradient(120% 90% at 30% 20%,#1c1c21 0%,#070708 70%)', fg: '#f4f4f5', accent: '#44444c' },
  { bg: 'linear-gradient(135deg,#120f0d 0%,#060505 100%)', fg: '#e7dfd6', accent: '#3b302a' },
  { bg: 'linear-gradient(180deg,#0e1115 0%,#0a0b0d 100%)', fg: '#b9c2cc', accent: '#26303b' },
  { bg: 'radial-gradient(100% 100% at 70% 80%,#191a1f 0%,#08080a 75%)', fg: '#a1a1aa', accent: '#33343b' }
];
const COLOR: Palette[] = [
  { bg: 'linear-gradient(150deg,#1a0b2e 0%,#3b0d4f 55%,#0b0614 100%)', fg: '#f3e8ff', accent: '#a855f7' },
  { bg: 'linear-gradient(160deg,#04212b 0%,#0b4a5a 60%,#03141a 100%)', fg: '#d6f7ff', accent: '#22d3ee' },
  { bg: 'linear-gradient(140deg,#2a0a0a 0%,#7f1d1d 60%,#140404 100%)', fg: '#ffe4e4', accent: '#f87171' },
  { bg: 'linear-gradient(170deg,#06190f 0%,#14532d 60%,#030c07 100%)', fg: '#dcfce7', accent: '#4ade80' },
  { bg: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#0b0a24 100%)', fg: '#e0e7ff', accent: '#818cf8' },
  { bg: 'linear-gradient(160deg,#2b1405 0%,#9a3412 65%,#160902 100%)', fg: '#ffedd5', accent: '#fb923c' },
  { bg: 'radial-gradient(90% 90% at 50% 40%,#be185d 0%,#4a0624 60%,#12010a 100%)', fg: '#ffe4f1', accent: '#f472b6' },
  { bg: 'linear-gradient(180deg,#0c1a3a 0%,#1d4ed8 70%,#0a1430 100%)', fg: '#e0edff', accent: '#93c5fd' },
  { bg: 'radial-gradient(80% 80% at 30% 70%,#065f46 0%,#022c22 70%)', fg: '#d1fae5', accent: '#34d399' },
  { bg: 'linear-gradient(200deg,#3f2a00 0%,#a16207 60%,#1c1300 100%)', fg: '#fef9c3', accent: '#facc15' },
  { bg: 'linear-gradient(135deg,#4c0519 0%,#1e1b4b 100%)', fg: '#fde2ea', accent: '#fb7185' },
  { bg: 'linear-gradient(160deg,#083344 0%,#4c1d95 100%)', fg: '#e9e6ff', accent: '#67e8f9' }
];
const LIGHT: Palette[] = [
  { bg: 'linear-gradient(160deg,#f4f1ea 0%,#e4ded2 100%)', fg: '#1c1917', accent: '#a8a29e', light: true },
  { bg: 'linear-gradient(180deg,#eef2f7 0%,#d9e1ec 100%)', fg: '#0f172a', accent: '#94a3b8', light: true },
  { bg: 'linear-gradient(150deg,#fde7ef 0%,#f6d0de 100%)', fg: '#4a0d24', accent: '#e8a1bb', light: true },
  { bg: 'linear-gradient(150deg,#e6f4ea 0%,#cfe9d7 100%)', fg: '#0f2e1c', accent: '#86c49d', light: true },
  { bg: '#e9e4da', fg: '#111111', accent: '#c9c1b2', light: true }
];

// font, weight, italic, tracking (em), case transform
type FontStyle = { family: string; weight: number; italic?: boolean; tracking: number; transform?: 'upper' | 'lower' };
const FONTS: FontStyle[] = [
  { family: "'Playfair Display', serif", weight: 500, italic: true, tracking: -0.01 },
  { family: "'Cormorant Garamond', serif", weight: 500, italic: true, tracking: 0 },
  { family: "'PT Serif', serif", weight: 400, italic: true, tracking: -0.01 },
  { family: "'Lora', serif", weight: 500, italic: true, tracking: -0.01 },
  { family: "'Prata', serif", weight: 400, tracking: -0.01 },
  { family: "'Unbounded', sans-serif", weight: 800, tracking: -0.04 },
  { family: "'Dela Gothic One', sans-serif", weight: 400, tracking: -0.02 },
  { family: "'Russo One', sans-serif", weight: 400, tracking: 0, transform: 'upper' },
  { family: "'Oswald', sans-serif", weight: 600, tracking: 0.01, transform: 'upper' },
  { family: "'Inter Tight', sans-serif", weight: 800, tracking: -0.05 },
  { family: "'Geologica', sans-serif", weight: 300, tracking: -0.02, transform: 'lower' },
  { family: "'Onest', sans-serif", weight: 600, tracking: -0.03, transform: 'lower' },
  { family: "'Montserrat Alternates', sans-serif", weight: 700, tracking: -0.03 },
  { family: "'Tenor Sans', sans-serif", weight: 400, tracking: 0.12, transform: 'upper' },
  { family: "'Poiret One', sans-serif", weight: 400, tracking: 0.04 },
  { family: "'Yeseva One', serif", weight: 400, tracking: -0.01 },
  { family: "'Rubik Mono One', sans-serif", weight: 400, tracking: -0.02, transform: 'upper' },
  { family: "'JetBrains Mono', monospace", weight: 500, tracking: -0.02, transform: 'lower' },
  { family: "'Caveat', cursive", weight: 700, tracking: 0 },
  { family: "'Marck Script', cursive", weight: 400, tracking: 0 }
];

type Layout = 'center' | 'bottomLeft' | 'topLeft' | 'giant' | 'stack' | 'outline' | 'ruled' | 'framed' | 'none';
const LAYOUTS: Array<[Layout, number]> = [
  ['center', 22], ['bottomLeft', 16], ['topLeft', 10], ['giant', 12], ['stack', 10],
  ['outline', 7], ['ruled', 8], ['framed', 7], ['none', 8]
];
function weighted<T>(r: () => number, items: Array<[T, number]>): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of items) { x -= w; if (x <= 0) return v; }
  return items[items.length - 1][0];
}

function splitLines(text: string, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1 || text.length <= 9) return [text];
  const lines: string[] = [];
  const per = Math.ceil(words.length / Math.min(maxLines, words.length));
  for (let i = 0; i < words.length; i += per) lines.push(words.slice(i, i + per).join(' '));
  return lines;
}
/** font-size in cqw so the longest line fills the cover nicely (never tiny). */
function fitSize(lines: string[], base: number, min: number, max: number) {
  const longest = Math.max(...lines.map(l => l.length), 1);
  return Math.max(min, Math.min(max, base / longest));
}

export const AutoCover: React.FC<AutoCoverProps> = React.memo(({ title = '', albumTitle = '', isArtist = false, innerClassName = '' }) => {
  const text = (albumTitle || title || (isArtist ? 'Артист' : 'Музыка')).trim();
  const seed = hash(text.toLowerCase());
  const r = rng(seed);

  const tone = r();
  const pal = tone < 0.45 ? pick(r, DARK) : tone < 0.8 ? pick(r, COLOR) : tone < 0.92 ? pick(r, LIGHT) : pick(r, COLOR);
  let layout = weighted(r, LAYOUTS);
  if (isArtist) layout = 'center';
  const font = pick(r, FONTS);
  const orb = r() < 0.35; // one soft light spot, nothing else
  const orbX = 15 + r() * 70, orbY = 15 + r() * 70;

  const shown = font.transform === 'upper' ? text.toUpperCase() : font.transform === 'lower' ? text.toLowerCase() : text;
  const baseStyle: React.CSSProperties = {
    fontFamily: font.family, fontWeight: font.weight, fontStyle: font.italic ? 'italic' : 'normal',
    letterSpacing: `${font.tracking}em`, color: pal.fg, lineHeight: 0.95, margin: 0, wordBreak: 'break-word'
  };

  let content: React.ReactNode = null;
  const pad = '9cqw';
  if (layout === 'center' || layout === 'framed') {
    const lines = splitLines(shown, 3);
    const size = fitSize(lines, 120, 9, 17);
    content = (
      <div style={{ position: 'absolute', inset: layout === 'framed' ? '8cqw' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: pad, border: layout === 'framed' ? `0.5cqw solid ${pal.fg}33` : undefined, borderRadius: layout === 'framed' ? '2cqw' : undefined }}>
        <p style={{ ...baseStyle, fontSize: `${size}cqw` }}>{lines.map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</p>
      </div>
    );
  } else if (layout === 'bottomLeft' || layout === 'topLeft') {
    const lines = splitLines(shown, 3);
    const size = fitSize(lines, 140, 11, 20);
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: layout === 'bottomLeft' ? 'flex-end' : 'flex-start', padding: pad }}>
        <p style={{ ...baseStyle, fontSize: `${size}cqw`, textAlign: 'left' }}>{lines.map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</p>
      </div>
    );
  } else if (layout === 'giant') {
    const word = shown.split(/\s+/)[0] || shown;
    const size = Math.max(22, Math.min(48, 150 / Math.max(word.length, 1)));
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <p style={{ ...baseStyle, fontSize: `${size}cqw`, whiteSpace: 'nowrap', lineHeight: 0.8 }}>{shown.length > word.length + 12 ? word : shown}</p>
      </div>
    );
  } else if (layout === 'stack') {
    const words = shown.split(/\s+/).filter(Boolean).slice(0, 5);
    const size = fitSize(words, 90, 10, 22);
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: pad }}>
        {words.map((w, i) => <p key={i} style={{ ...baseStyle, fontSize: `${size}cqw`, opacity: i === 0 ? 1 : 0.55 + 0.45 * (1 - i / words.length) }}>{w}</p>)}
      </div>
    );
  } else if (layout === 'outline') {
    const lines = splitLines(shown, 2);
    const size = fitSize(lines, 120, 12, 22);
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: pad }}>
        <p style={{ ...baseStyle, fontSize: `${size}cqw`, color: 'transparent', WebkitTextStroke: `0.35cqw ${pal.fg}` } as React.CSSProperties}>{lines.map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</p>
      </div>
    );
  } else if (layout === 'ruled') {
    const lines = splitLines(shown, 2);
    const size = fitSize(lines, 110, 10, 16);
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: pad }}>
        <p style={{ ...baseStyle, fontSize: `${size}cqw` }}>{lines.map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</p>
        <div style={{ height: '0.4cqw', width: '100%', background: pal.fg, opacity: 0.35 }} />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden select-none ${innerClassName}`} style={{ background: pal.bg, containerType: 'inline-size' } as React.CSSProperties} aria-label={text}>
      {orb && (
        <div style={{ position: 'absolute', left: `${orbX}%`, top: `${orbY}%`, width: '70cqw', height: '70cqw', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: `radial-gradient(circle, ${pal.accent}${pal.light ? '55' : '40'} 0%, transparent 65%)`, filter: 'blur(4cqw)' }} />
      )}
      {layout === 'none' && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: `${38 + r() * 30}cqw`, height: `${38 + r() * 30}cqw`, transform: 'translate(-50%,-50%)', borderRadius: r() < 0.5 ? '50%' : '6cqw', background: `linear-gradient(${Math.floor(r() * 360)}deg, ${pal.accent}, transparent)`, opacity: 0.8 }} />
      )}
      {content}
    </div>
  );
});

export default AutoCover;
