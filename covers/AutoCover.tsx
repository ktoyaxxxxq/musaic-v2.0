// ============================================================================
// AUTO COVER v3: minimal generated artwork for releases without a cover
// - deterministic: same title = same cover, different titles = different covers
// - text is measured per font and always fits: words are never cut in the middle,
//   lines are balanced, hyphenated words may break after the hyphen
// - mostly neutral / muted colours, bright ones are rare
// - ~7% covers without text: just a gradient or a flat colour, no shapes
// ============================================================================
import React from 'react';

export interface AutoCoverProps { title?: string; albumTitle?: string; isArtist?: boolean; innerClassName?: string }

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
function weighted<T>(r: () => number, items: Array<[T, number]>): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of items) { x -= w; if (x <= 0) return v; }
  return items[items.length - 1][0];
}

type Palette = { bg: string; fg: string; glow?: string };
const g = (deg: number, a: string, b: string) => `linear-gradient(${deg}deg, ${a} 0%, ${b} 100%)`;
const r2 = (x: number, y: number, a: string, b: string) => `radial-gradient(130% 110% at ${x}% ${y}%, ${a} 0%, ${b} 75%)`;

const NEUTRAL: Palette[] = [
  { bg: g(160, '#0b0b0d', '#18181c'), fg: '#ececef', glow: '#3a3a42' },
  { bg: g(200, '#0e1013', '#050506'), fg: '#d4d4d8', glow: '#2b2f36' },
  { bg: r2(30, 20, '#1d1d22', '#070708'), fg: '#f4f4f5', glow: '#44444c' },
  { bg: g(135, '#14110f', '#070606'), fg: '#e9e1d8', glow: '#3d332c' },
  { bg: g(180, '#10141a', '#0a0b0d'), fg: '#c3cbd5', glow: '#28323e' },
  { bg: r2(70, 80, '#1a1b20', '#09090b'), fg: '#b4b4bb' },
  { bg: g(150, '#1b1b1d', '#0c0c0d'), fg: '#f1efe9' },
  { bg: g(170, '#161a17', '#080a09'), fg: '#d9e2db', glow: '#2b3a30' },
  { bg: g(190, '#1a1714', '#0b0a09'), fg: '#efe6da' },
  { bg: r2(50, 30, '#22252b', '#0c0d10'), fg: '#e3e7ee' }
];
// deep but calm colours (like "Dope Club" indigo, wine, teal, amber-brown)
const MUTED: Palette[] = [
  { bg: g(150, '#2d2a6e', '#14133a'), fg: '#e4e3ff', glow: '#5b57c9' },
  { bg: g(160, '#5a1a1f', '#220a0c'), fg: '#ffe7e3', glow: '#8f3036' },
  { bg: g(170, '#0d3b44', '#061c21'), fg: '#d6f4f7', glow: '#1f6f7c' },
  { bg: g(155, '#6b4512', '#2a1a06'), fg: '#fbecd0', glow: '#a36a1f' },
  { bg: g(140, '#22402f', '#0c1a12'), fg: '#dff1e5', glow: '#3d6e51' },
  { bg: g(165, '#3d2648', '#170e1c'), fg: '#f1e4f6', glow: '#6b4880' },
  { bg: g(145, '#1f3354', '#0b1424'), fg: '#dfe9fa', glow: '#3c5f95' },
  { bg: g(175, '#4a2c22', '#1c100c'), fg: '#f7e4da', glow: '#7a4a39' },
  { bg: g(150, '#3a3f22', '#16180c'), fg: '#eef0d9' },
  { bg: g(160, '#33424d', '#141b20'), fg: '#e4edf2' },
  { bg: r2(30, 25, '#3a3470', '#121026'), fg: '#ebe9ff' },
  { bg: r2(70, 30, '#5b2330', '#1b0a0e'), fg: '#ffe6ea' }
];
const BRIGHT: Palette[] = [
  { bg: g(150, '#3b0d4f', '#120617'), fg: '#f3e8ff' },
  { bg: g(160, '#9a3412', '#2b1405'), fg: '#ffedd5' },
  { bg: r2(50, 40, '#9d174d', '#2a0515'), fg: '#ffe4f1' },
  { bg: g(180, '#1d4ed8', '#0c1a3a'), fg: '#e0edff' },
  { bg: g(160, '#047857', '#022c22'), fg: '#d1fae5' }
];
const LIGHT: Palette[] = [
  { bg: g(160, '#f4f1ea', '#e4ded2'), fg: '#1c1917' },
  { bg: g(180, '#eef2f7', '#d9e1ec'), fg: '#0f172a' },
  { bg: g(150, '#efe7e1', '#dfd2c8'), fg: '#2b1d16' },
  { bg: g(150, '#e6efe8', '#d2e2d6'), fg: '#13281b' },
  { bg: '#e9e4da', fg: '#111111' }
];
const SOLID: Palette[] = [
  { bg: '#0c0c0e', fg: '#f4f4f5' }, { bg: '#151515', fg: '#e7e5e4' }, { bg: '#1e2333', fg: '#e3e8f5' },
  { bg: '#3a1416', fg: '#fde8e6' }, { bg: '#16302f', fg: '#ddf3f1' }, { bg: '#2b2560', fg: '#e8e6ff' },
  { bg: '#e8e3d9', fg: '#141414' }, { bg: '#5c3d12', fg: '#fbefd9' }
];

// cw = average glyph width in em (used to fit the text)
type FontStyle = { family: string; weight: number; italic?: boolean; tracking: number; transform?: 'upper' | 'lower'; cw: number };
const FONTS: FontStyle[] = [
  { family: "'Playfair Display', serif", weight: 500, italic: true, tracking: -0.01, cw: 0.5 },
  { family: "'PT Serif', serif", weight: 400, italic: true, tracking: -0.01, cw: 0.5 },
  { family: "'Cormorant Garamond', serif", weight: 600, italic: true, tracking: 0, cw: 0.44 },
  { family: "'Prata', serif", weight: 400, tracking: -0.01, cw: 0.6 },
  { family: "'Yeseva One', serif", weight: 400, tracking: -0.01, cw: 0.58 },
  { family: "'Unbounded', sans-serif", weight: 800, tracking: -0.04, cw: 0.78 },
  { family: "'Dela Gothic One', sans-serif", weight: 400, tracking: -0.02, cw: 0.76 },
  { family: "'Russo One', sans-serif", weight: 400, tracking: 0, transform: 'upper', cw: 0.66 },
  { family: "'Oswald', sans-serif", weight: 600, tracking: 0.01, transform: 'upper', cw: 0.46 },
  { family: "'Sofia Sans Extra Condensed', sans-serif", weight: 800, tracking: 0, transform: 'upper', cw: 0.36 },
  { family: "'Inter Tight', sans-serif", weight: 800, tracking: -0.05, cw: 0.56 },
  { family: "'Geologica', sans-serif", weight: 300, tracking: -0.02, transform: 'lower', cw: 0.56 },
  { family: "'Onest', sans-serif", weight: 600, tracking: -0.03, transform: 'lower', cw: 0.56 },
  { family: "'Montserrat Alternates', sans-serif", weight: 700, tracking: -0.03, cw: 0.66 },
  { family: "'Tenor Sans', sans-serif", weight: 400, tracking: 0.1, transform: 'upper', cw: 0.62 },
  { family: "'Commissioner', sans-serif", weight: 300, tracking: -0.02, cw: 0.55 },
  { family: "'JetBrains Mono', monospace", weight: 500, tracking: -0.02, transform: 'lower', cw: 0.6 },
  { family: "'Caveat', cursive", weight: 700, tracking: 0, cw: 0.42 },
  { family: "'Marck Script', cursive", weight: 400, tracking: 0, cw: 0.46 }
];

type Layout = 'center' | 'bottomLeft' | 'topLeft' | 'big' | 'stack' | 'ruled' | 'none';
const LAYOUTS: Array<[Layout, number]> = [['center', 26], ['bottomLeft', 20], ['topLeft', 11], ['big', 13], ['stack', 11], ['ruled', 6], ['none', 7]];

/** splits words into k lines with the shortest longest line (hyphens are break points too). */
function balance(tokens: string[], k: number): string[] {
  const n = tokens.length;
  if (k <= 1 || n <= 1) return [tokens.join(' ').replace(/- /g, '-')];
  let best: string[] = [];
  let bestLen = Infinity;
  const rec = (start: number, left: number, acc: string[]) => {
    if (left === 1) {
      const line = tokens.slice(start).join(' ').replace(/- /g, '-');
      const lines = [...acc, line];
      const m = Math.max(...lines.map(l => l.length));
      if (m < bestLen) { bestLen = m; best = lines; }
      return;
    }
    for (let i = start + 1; i <= n - left + 1; i++) rec(i, left - 1, [...acc, tokens.slice(start, i).join(' ').replace(/- /g, '-')]);
  };
  rec(0, Math.min(k, n), []);
  return best;
}
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean).flatMap(w => {
    const parts = w.split(/(?<=-)/); // "Паи-гангстер" -> ["Паи-", "гангстер"]
    return parts.length > 1 && parts.every(p => p.length >= 3) ? parts : [w];
  });
}
/** picks the line count that gives the biggest text that still fits the box (in cqw). */
function fit(text: string, f: FontStyle, upper: boolean, width: number, height: number, maxSize: number, maxLines = 4) {
  const tokens = tokenize(text).slice(0, 12);
  const cw = (f.cw + Math.max(0, f.tracking)) * (upper ? 1.12 : 1);
  let best: { lines: string[]; size: number } | null = null;
  for (let k = 1; k <= Math.max(1, Math.min(maxLines, tokens.length)); k++) {
    const lines = balance(tokens.length ? tokens : [text], k);
    const longest = Math.max(...lines.map(l => l.length), 1);
    const size = Math.min(maxSize, width / (longest * cw), height / (k * 1.02));
    if (!best || size > best.size * 1.15) best = { lines, size };
  }
  return best!;
}

export const AutoCover: React.FC<AutoCoverProps> = React.memo(({ title = '', albumTitle = '', isArtist = false, innerClassName = '' }) => {
  const text = (albumTitle || title || (isArtist ? 'Артист' : 'Музыка')).trim();
  const r = rng(hash(text.toLowerCase()));
  const tone = weighted(r, [['neutral', 42], ['muted', 33], ['solid', 8], ['light', 9], ['bright', 8]] as Array<[string, number]>);
  const pal = pick(r, tone === 'neutral' ? NEUTRAL : tone === 'muted' ? MUTED : tone === 'solid' ? SOLID : tone === 'light' ? LIGHT : BRIGHT);
  const layout: Layout = isArtist ? 'center' : weighted(r, LAYOUTS);
  const font = pick(r, FONTS);
  const glow = layout !== 'none' && pal.glow && tone !== 'solid' && r() < 0.3;
  const gx = 20 + r() * 60, gy = 20 + r() * 60;

  const upper = font.transform === 'upper';
  const shown = upper ? text.toUpperCase() : font.transform === 'lower' ? text.toLowerCase() : text;
  const pad = 9;
  const W = 100 - pad * 2;
  const base: React.CSSProperties = {
    fontFamily: font.family, fontWeight: font.weight, fontStyle: font.italic ? 'italic' : 'normal',
    letterSpacing: `${font.tracking}em`, color: pal.fg, lineHeight: 1, margin: 0, whiteSpace: 'nowrap'
  };
  const Lines: React.FC<{ lines: string[]; size: number; align: 'left' | 'center' }> = ({ lines, size, align }) => (
    <p style={{ ...base, fontSize: `${size}cqw`, textAlign: align }}>
      {lines.map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}
    </p>
  );

  let content: React.ReactNode = null;
  if (layout === 'center') {
    const t = fit(shown, font, upper, W, 70, 17, 3);
    content = <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `${pad}cqw` }}><Lines lines={t.lines} size={t.size} align="center" /></div>;
  } else if (layout === 'bottomLeft' || layout === 'topLeft') {
    const t = fit(shown, font, upper, W, 55, 18, 3);
    content = <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: layout === 'bottomLeft' ? 'flex-end' : 'flex-start', padding: `${pad}cqw` }}><Lines lines={t.lines} size={t.size} align="left" /></div>;
  } else if (layout === 'big') {
    const t = fit(shown, font, upper, 100 - 12, 86, 40, 2);
    content = <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6cqw' }}><Lines lines={t.lines} size={t.size} align="center" /></div>;
  } else if (layout === 'stack') {
    const words = tokenize(shown).slice(0, 5);
    const t = fit(words.join(' '), font, upper, W, 76, 20, Math.min(5, words.length));
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${pad}cqw` }}>
        {t.lines.map((l, i) => <p key={i} style={{ ...base, fontSize: `${t.size}cqw`, opacity: i === 0 ? 1 : 0.5 + 0.5 * (1 - i / t.lines.length) }}>{l}</p>)}
      </div>
    );
  } else if (layout === 'ruled') {
    const t = fit(shown, font, upper, W, 50, 15, 2);
    content = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${pad}cqw` }}>
        <Lines lines={t.lines} size={t.size} align="left" />
        <div style={{ height: '0.35cqw', width: '100%', background: pal.fg, opacity: 0.3 }} />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden select-none ${innerClassName}`} style={{ background: pal.bg, containerType: 'inline-size' } as React.CSSProperties} aria-label={text}>
      {glow && <div style={{ position: 'absolute', left: `${gx}%`, top: `${gy}%`, width: '75cqw', height: '75cqw', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: `radial-gradient(circle, ${pal.glow}55 0%, transparent 65%)`, filter: 'blur(5cqw)' }} />}
      {content}
    </div>
  );
});

export default AutoCover;
