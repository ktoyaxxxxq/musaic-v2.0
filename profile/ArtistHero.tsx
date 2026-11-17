// ============================================================================
// ARTIST PAGE v3
// - ArtistHeroV2: header with 13 layouts, one style for all artists or per artist,
//   fixed sizes (avatar / poster width / height) so every profile looks the same
// - HeroSettingsDrawer: settings in a side drawer (always scrolls to the end)
// - computeArtistEras + ArtistEras: smart eras of the artist with stats & awards
// - CoArtistLinks: clickable co-artists ("A, B & C")
// - setArtistAwardsSource: App passes awards here so the artist page can show them
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

// ---------------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------------
export interface HeroSettings {
  mode: 'classic' | 'poster';
  classicLayout: 'left' | 'center' | 'overlap' | 'compact';
  avatarShape: 'circle' | 'squircle' | 'rounded' | 'square' | 'arch';
  avatarSize: number;          // px, same for every artist
  avatarRing: 'none' | 'thin' | 'glow' | 'accent' | 'double';
  classicBg: 'blur' | 'banner' | 'gradient' | 'duotone' | 'solid';
  posterLayout: 'card-right' | 'card-left' | 'center-card' | 'split' | 'fullbleed' | 'name-behind' | 'glass' | 'vinyl';
  posterAspect: '3/4' | '4/5' | '1/1' | '2/3';
  posterFrame: 'shadow' | 'border' | 'polaroid' | 'none';
  cardWidth: number;           // px, same for every artist
  cardRadius: number;          // px
  posterBg: 'blur' | 'palette' | 'solid';
  focusX: number; focusY: number; zoom: number;
  tint: 'none' | 'warm' | 'cool' | 'mono' | 'palette';
  bgBlur: number; bgDim: number; vignette: number;
  heroHeight: 's' | 'm' | 'l' | 'xl';
  nameSize: number;            // px max
  nameFont: string;
  nameCase: 'as' | 'upper' | 'lower';
  nameTracking: number;        // em
  textAlign: 'left' | 'center';
}

export const DEFAULT_HERO: HeroSettings = {
  mode: 'poster', classicLayout: 'left', avatarShape: 'circle', avatarSize: 200, avatarRing: 'thin', classicBg: 'blur',
  posterLayout: 'card-right', posterAspect: '3/4', posterFrame: 'shadow', cardWidth: 290, cardRadius: 22, posterBg: 'blur',
  focusX: 50, focusY: 35, zoom: 1, tint: 'none', bgBlur: 70, bgDim: 0.45, vignette: 0.3,
  heroHeight: 'm', nameSize: 96, nameFont: '', nameCase: 'as', nameTracking: -0.035, textAlign: 'left'
};

export const HERO_PRESETS: Array<{ name: string; s: Partial<HeroSettings> }> = [
  { name: 'Минимал', s: { mode: 'classic', classicLayout: 'left', avatarShape: 'circle', avatarRing: 'thin', classicBg: 'gradient', tint: 'none', bgDim: 0.5 } },
  { name: 'Профиль', s: { mode: 'classic', classicLayout: 'overlap', classicBg: 'banner', avatarShape: 'circle', avatarRing: 'double', bgBlur: 0, bgDim: 0.25 } },
  { name: 'Дуотон', s: { mode: 'classic', classicLayout: 'center', classicBg: 'duotone', avatarShape: 'squircle', avatarRing: 'glow', textAlign: 'center' } },
  { name: 'Постер', s: { mode: 'poster', posterLayout: 'card-right', posterAspect: '3/4', posterFrame: 'shadow', posterBg: 'blur', bgBlur: 80, bgDim: 0.45 } },
  { name: 'Кино', s: { mode: 'poster', posterLayout: 'fullbleed', bgDim: 0.3, heroHeight: 'l', vignette: 0.5 } },
  { name: 'Журнал', s: { mode: 'poster', posterLayout: 'split', posterAspect: '4/5', posterFrame: 'none', tint: 'warm', nameCase: 'upper', nameTracking: -0.02 } },
  { name: 'Имя за фото', s: { mode: 'poster', posterLayout: 'name-behind', posterAspect: '3/4', posterFrame: 'shadow', nameCase: 'upper', heroHeight: 'l' } },
  { name: 'Стекло', s: { mode: 'poster', posterLayout: 'glass', posterAspect: '1/1', posterFrame: 'border', posterBg: 'palette' } },
  { name: 'Винил', s: { mode: 'poster', posterLayout: 'vinyl', posterAspect: '1/1', posterFrame: 'none', cardRadius: 6 } },
  { name: 'Полароид', s: { mode: 'poster', posterLayout: 'center-card', posterAspect: '1/1', posterFrame: 'polaroid', bgBlur: 110, bgDim: 0.6, textAlign: 'center' } }
];

const KEY_ALL = 'musaic.hero.__all';
const KEY = (id: string) => `musaic.hero.${id}`;
/** reads settings and migrates the v2.2 format (sizes were words) */
const readJson = (k: string): Partial<HeroSettings> | null => {
  try {
    const v = localStorage.getItem(k);
    if (!v) return null;
    const o: any = JSON.parse(v);
    if (typeof o.avatarSize === 'string') o.avatarSize = ({ sm: 120, md: 160, lg: 200, xl: 236 } as any)[o.avatarSize] || 200;
    if (typeof o.nameSize === 'string') o.nameSize = ({ md: 72, lg: 96, xl: 120 } as any)[o.nameSize] || 96;
    if (o.tint === 'accent') o.tint = 'palette';
    if (o.align && !o.textAlign) o.textAlign = o.align;
    return o;
  } catch { return null; }
};
const writeJson = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } };

/** scope "all" = one style for every artist, scope "artist" = own style for this artist */
export function useHeroSettings(artistId: string, base?: Partial<HeroSettings>) {
  const compute = () => {
    const own = readJson(KEY(artistId));
    const all = readJson(KEY_ALL);
    return { s: { ...DEFAULT_HERO, ...(base || {}), ...(all || {}), ...(own || {}) } as HeroSettings, scope: (own ? 'artist' : 'all') as 'artist' | 'all' };
  };
  const [st, setSt] = useState(compute);
  useEffect(() => { setSt(compute()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [artistId]);
  const update = useCallback((patch: Partial<HeroSettings>) => {
    setSt(prev => {
      const s = { ...prev.s, ...patch };
      if (prev.scope === 'artist') writeJson(KEY(artistId), s);
      else { writeJson(KEY_ALL, s); try { localStorage.removeItem(KEY(artistId)); } catch { /* */ } }
      return { ...prev, s };
    });
  }, [artistId]);
  const setScope = useCallback((scope: 'artist' | 'all') => {
    setSt(prev => {
      if (scope === 'artist') writeJson(KEY(artistId), prev.s);
      else { try { localStorage.removeItem(KEY(artistId)); } catch { /* */ } }
      const all = readJson(KEY_ALL);
      return { scope, s: scope === 'all' ? { ...DEFAULT_HERO, ...(base || {}), ...(all || {}) } as HeroSettings : prev.s };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);
  const reset = useCallback(() => {
    setSt(prev => {
      if (prev.scope === 'artist') { try { localStorage.removeItem(KEY(artistId)); } catch { /* */ } }
      else { try { localStorage.removeItem(KEY_ALL); } catch { /* */ } }
      return { scope: prev.scope, s: { ...DEFAULT_HERO, ...(base || {}) } as HeroSettings };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);
  return { s: st.s, scope: st.scope, update, setScope, reset };
}

const HEIGHT = { s: 340, m: 440, l: 540, xl: 660 };
const SHAPE: Record<HeroSettings['avatarShape'], string> = { circle: '9999px', squircle: '32%', rounded: '24px', square: '6px', arch: '9999px 9999px 18px 18px' };

const Photo: React.FC<{ src?: string; s: HeroSettings; className?: string; style?: React.CSSProperties; fb?: React.ReactNode }> = ({ src, s, className = '', style, fb }) => (
  <div className={`relative overflow-hidden bg-zinc-900 ${className}`} style={style}>
    {src && (
      <img src={src} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
        style={{ objectPosition: `${s.focusX}% ${s.focusY}%`, transform: `scale(${s.zoom})`, transformOrigin: `${s.focusX}% ${s.focusY}%`, filter: s.tint === 'mono' ? 'grayscale(1) contrast(1.05)' : undefined }} />
    )}
    {!src && fb && <div className="absolute inset-0 [&>*]:!w-full [&>*]:!h-full" style={{ filter: s.tint === 'mono' ? 'grayscale(1)' : undefined }}>{fb}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// hero
// ---------------------------------------------------------------------------
export const ArtistHeroV2: React.FC<{
  artistId: string;
  name: string;
  imageUrl?: string;
  verified?: boolean;
  subtitle?: string;
  palette?: string[];
  defaultVariant?: 'cinema' | 'poster';
  onZoom?: () => void;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ artistId, name, imageUrl, verified, subtitle, palette, defaultVariant, onZoom, fallback, children }) => {
  const base = useMemo<Partial<HeroSettings> | undefined>(() => (defaultVariant === 'cinema' ? { mode: 'poster', posterLayout: 'fullbleed' } : undefined), [defaultVariant]);
  const { s, scope, update, setScope, reset } = useHeroSettings(artistId, base);
  const [panel, setPanel] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const secRef = useRef<HTMLElement>(null);
  const c0 = palette?.[0] || '#3f3f46';
  const c1 = palette?.[1] || '#18181b';

  useEffect(() => {
    setExpanded(false);
    if (!imageUrl) return;
    const im = new Image();
    im.onload = () => im.naturalWidth && setRatio(im.naturalHeight / im.naturalWidth);
    im.src = imageUrl;
  }, [imageUrl]);

  const isPoster = s.mode === 'poster';
  const L = s.posterLayout;
  const shownName = s.nameCase === 'upper' ? name.toUpperCase() : s.nameCase === 'lower' ? name.toLowerCase() : name;
  const center = s.textAlign === 'center' || (!isPoster && s.classicLayout === 'center') || (isPoster && L === 'center-card');
  const tintBg = s.tint === 'warm' ? 'rgba(255,140,60,0.16)' : s.tint === 'cool' ? 'rgba(60,130,255,0.16)' : s.tint === 'palette' ? `${c0}40` : 'transparent';

  const Title = (
    <div className={`relative z-10 min-w-0 flex flex-col ${center ? 'items-center text-center' : 'items-start text-left'}`}>
      {verified && (
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white/90 mb-2">
          <span className="w-4 h-4 rounded-full bg-sky-500 text-[10px] text-black font-black flex items-center justify-center">✓</span>Подтверждённый исполнитель
        </div>
      )}
      <h1 className="font-black text-white leading-[0.92] break-words drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)]"
        style={{ fontFamily: s.nameFont || undefined, fontSize: `clamp(36px, 7vw, ${s.nameSize}px)`, letterSpacing: `${s.nameTracking}em` }}>
        {shownName}
      </h1>
      {subtitle && <p className="mt-3 text-sm md:text-base text-white/80 font-medium tabular-nums">{subtitle}</p>}
      {children}
    </div>
  );

  const frameCls = s.posterFrame === 'polaroid' ? 'p-3 pb-10 bg-[#f4f2ee]' : s.posterFrame === 'border' ? 'p-1.5 bg-white/10 border border-white/20 backdrop-blur-md' : '';
  const shadow = s.posterFrame === 'none' ? '' : 'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]';
  const card = (w = s.cardWidth) => (
    <motion.div layout className={`relative z-10 shrink-0 ${frameCls} ${shadow}`}
      style={{ width: `min(${w}px, 72vw)`, borderRadius: s.posterFrame === 'polaroid' ? 6 : s.cardRadius + 4 }}>
      <div onClick={onZoom} className={onZoom ? 'cursor-zoom-in' : ''}>
        <Photo src={imageUrl} fb={fallback} s={s} style={{ aspectRatio: s.posterAspect, borderRadius: s.posterFrame === 'polaroid' ? 3 : s.cardRadius }} />
      </div>
    </motion.div>
  );

  // background
  const blurBg = !imageUrl ? (fallback ? <div aria-hidden className="absolute inset-0 [&>*]:!w-full [&>*]:!h-full" style={{ filter: `blur(${s.bgBlur}px) saturate(1.15)`, transform: 'scale(1.25)' }}>{fallback}</div> : null) : (
    <img src={imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover"
      style={{ objectPosition: `${s.focusX}% ${s.focusY}%`, filter: `blur(${s.bgBlur}px) saturate(1.15) ${s.tint === 'mono' ? 'grayscale(1)' : ''}`, transform: 'scale(1.25)' }} />
  );
  let bg: React.ReactNode;
  if (isPoster && L === 'fullbleed') {
    bg = <Photo src={imageUrl} fb={fallback} s={expanded ? { ...s, focusX: 50, focusY: 50, zoom: 1 } : s} className="absolute inset-0" />;
  } else if (!isPoster && s.classicBg === 'banner') {
    bg = <div className="absolute inset-x-0 top-0 h-[62%]"><Photo src={imageUrl} fb={fallback} s={s} className="absolute inset-0" style={{ filter: s.bgBlur > 0 ? `blur(${Math.round(s.bgBlur / 8)}px)` : undefined }} /></div>;
  } else if (!isPoster && s.classicBg === 'duotone') {
    bg = <>{!imageUrl && fallback && <div className="absolute inset-0 [&>*]:!w-full [&>*]:!h-full" style={{ filter: 'grayscale(1) contrast(1.15) blur(2px)' }}>{fallback}</div>}{imageUrl && <img src={imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'grayscale(1) contrast(1.15) blur(2px)', objectPosition: `${s.focusX}% ${s.focusY}%` }} />}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c0}, ${c1})`, mixBlendMode: 'multiply' }} /></>;
  } else if ((!isPoster && s.classicBg === 'gradient') || (isPoster && s.posterBg === 'palette')) {
    bg = <div className="absolute inset-0" style={{ background: `radial-gradient(90% 120% at 15% 10%, ${c0}88 0%, transparent 60%), radial-gradient(80% 100% at 85% 30%, ${c1}66 0%, transparent 65%)` }} />;
  } else if ((!isPoster && s.classicBg === 'solid') || (isPoster && s.posterBg === 'solid')) {
    bg = <div className="absolute inset-0" style={{ background: `${c0}33` }} />;
  } else bg = blurBg;

  // body
  let body: React.ReactNode;
  if (!isPoster) {
    const px = s.classicLayout === 'compact' ? Math.round(s.avatarSize * 0.6) : s.avatarSize;
    const ring = s.avatarRing === 'thin' ? '0 0 0 1px rgba(255,255,255,0.18)'
      : s.avatarRing === 'glow' ? `0 0 0 1px rgba(255,255,255,0.15), 0 20px 70px -10px ${c0}`
      : s.avatarRing === 'accent' ? `0 0 0 3px ${c0}, 0 0 40px -6px ${c0}`
      : s.avatarRing === 'double' ? `0 0 0 4px var(--bg-color, #09090b), 0 0 0 5px rgba(255,255,255,0.35)` : 'none';
    const avatar = (
      <div onClick={onZoom} className={`shrink-0 ${onZoom ? 'cursor-zoom-in' : ''}`}>
        <Photo src={imageUrl} fb={fallback} s={s} className="shadow-2xl" style={{ width: `min(${px}px, 46vw)`, aspectRatio: '1 / 1', borderRadius: SHAPE[s.avatarShape], boxShadow: ring }} />
      </div>
    );
    body = (
      <div className={`relative z-10 flex gap-6 md:gap-8 ${s.classicLayout === 'center' ? 'flex-col items-center' : 'flex-col md:flex-row md:items-end'} ${s.classicLayout === 'overlap' ? 'pt-[22%] md:pt-[120px]' : ''}`}>
        {avatar}
        {Title}
      </div>
    );
  } else if (L === 'fullbleed') {
    body = <div className="relative z-10 flex items-end h-full">{Title}</div>;
  } else if (L === 'split') {
    body = <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end h-full">{Title}<div className="hidden md:flex justify-end">{card()}</div></div>;
  } else if (L === 'center-card') {
    body = <div className="relative z-10 flex flex-col items-center gap-6">{card(Math.round(s.cardWidth * 0.8))}{Title}</div>;
  } else if (L === 'name-behind') {
    body = (
      <div className="relative z-10 flex flex-col items-center justify-end gap-6 h-full">
        <div aria-hidden className="absolute inset-x-0 top-[8%] text-center font-black text-white/[0.12] leading-none whitespace-nowrap overflow-hidden select-none"
          style={{ fontFamily: s.nameFont || undefined, fontSize: 'clamp(80px, 18vw, 300px)', letterSpacing: '-0.05em' }}>{shownName}</div>
        {card(Math.round(s.cardWidth * 0.85))}
        <div className="text-center">{Title}</div>
      </div>
    );
  } else if (L === 'glass') {
    body = (
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-0 md:gap-0 rounded-[32px] overflow-hidden border border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-2xl max-w-4xl">
        <div className="p-4">{card(Math.round(s.cardWidth * 0.85))}</div>
        <div className="flex-1 flex items-end p-6 md:p-8">{Title}</div>
      </div>
    );
  } else if (L === 'vinyl') {
    body = (
      <div className="relative z-10 flex flex-col-reverse md:flex-row md:items-end justify-between gap-8 h-full">
        {Title}
        <div className="relative shrink-0 md:mr-[12%]">
          <div aria-hidden className="absolute top-[4%] h-[92%] aspect-square rounded-full left-[38%] shadow-2xl"
            style={{ background: `radial-gradient(circle, ${c0} 0 16%, #111 16.5% 18%, #0a0a0a 18.5% 100%), repeating-radial-gradient(circle, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)`, backgroundBlendMode: 'screen' }} />
          {card()}
        </div>
      </div>
    );
  } else {
    body = (
      <div className={`relative z-10 flex flex-col-reverse md:flex-row ${L === 'card-left' ? 'md:flex-row-reverse' : ''} md:items-end justify-between gap-8 h-full`}>
        {Title}
        {card()}
      </div>
    );
  }

  const fixedH = HEIGHT[s.heroHeight];
  const expandedH = expanded && ratio && secRef.current ? Math.min(secRef.current.offsetWidth * ratio, window.innerHeight * 1.6) : undefined;
  return (
    <section ref={secRef} className="relative overflow-hidden flex flex-col justify-end"
      style={{ minHeight: `min(${fixedH}px, 88vh)`, height: expandedH, transition: 'height .55s cubic-bezier(.22,1,.36,1)' }}>
      <div className="absolute inset-0 pointer-events-none">
        {bg}
        <div className="absolute inset-0" style={{ background: tintBg, mixBlendMode: s.tint === 'palette' ? 'soft-light' : 'normal' }} />
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${s.bgDim})` }} />
        {s.vignette > 0 && <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 50% 40%, transparent 50%, rgba(0,0,0,${s.vignette}) 100%)` }} />}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--bg-color,#09090b)] via-[var(--bg-color,#09090b)]/40 to-transparent" />
      </div>
      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-8 md:pb-10 flex-1 flex flex-col justify-end">{body}</div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {isPoster && L === 'fullbleed' && ratio && (
          <button type="button" onClick={() => setExpanded(v => !v)} className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white/80 hover:text-white">
            {expanded ? 'Свернуть' : 'Фото целиком'}
          </button>
        )}
        <button type="button" onClick={() => setPanel(true)} className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white/80 hover:text-white">
          Вид шапки
        </button>
      </div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {panel && <HeroSettingsDrawer s={s} scope={scope} setScope={setScope} update={update} reset={reset} imageUrl={imageUrl} onClose={() => setPanel(false)} />}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// settings drawer
// ---------------------------------------------------------------------------
function Seg<T extends string>({ value, options, onChange }: { value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${value === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>{l}</button>
      ))}
    </div>
  );
}
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5"><div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</div>{children}</div>
);
const Range: React.FC<{ value: number; min: number; max: number; step?: number; onChange: (v: number) => void }> = ({ value, min, max, step = 1, onChange }) => (
  <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-white" />
);
const FONTS_FOR_NAME = ["'Unbounded', sans-serif", "'Dela Gothic One', sans-serif", "'Playfair Display', serif", "'PT Serif', serif", "'Oswald', sans-serif", "'Sofia Sans Extra Condensed', sans-serif", "'Montserrat Alternates', sans-serif", "'Russo One', sans-serif", "'Inter Tight', sans-serif", "'Tenor Sans', sans-serif", "'Prata', serif"];

export const HeroSettingsDrawer: React.FC<{
  s: HeroSettings; scope: 'artist' | 'all'; setScope: (v: 'artist' | 'all') => void;
  update: (p: Partial<HeroSettings>) => void; reset: () => void; imageUrl?: string; onClose: () => void;
}> = ({ s, scope, setScope, update, reset, imageUrl, onClose }) => {
  const [tab, setTab] = useState<'look' | 'size' | 'photo' | 'bg' | 'text'>('look');
  const focusRef = useRef<HTMLDivElement>(null);
  const setFocus = (e: React.MouseEvent) => {
    const b = focusRef.current!.getBoundingClientRect();
    update({ focusX: Math.round(((e.clientX - b.left) / b.width) * 100), focusY: Math.round(((e.clientY - b.top) / b.height) * 100) });
  };
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[500]">
      <motion.div className="absolute inset-0 bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="absolute top-0 right-0 h-full w-[360px] max-w-[92vw] bg-[#0f1014]/97 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-white">Вид шапки</span>
            <div className="flex gap-3">
              <button type="button" onClick={reset} className="text-[11px] text-zinc-500 hover:text-white">Сбросить</button>
              <button type="button" onClick={onClose} className="text-[11px] font-bold text-white">Готово</button>
            </div>
          </div>
          <Seg value={scope} onChange={setScope} options={[['all', 'Для всех артистов'], ['artist', 'Только этот артист']]} />
          <p className="text-[11px] text-zinc-500 leading-snug">
            {scope === 'all' ? 'Один стиль и одинаковые размеры у всех профилей. Фокус фото тоже общий: для точной подгонки выбери «Только этот артист».' : 'Свой стиль только для этого артиста.'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-1.5">
            {HERO_PRESETS.map(p => (
              <button key={p.name} type="button" onClick={() => update(p.s)} className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] text-[11px] font-bold text-zinc-300">{p.name}</button>
            ))}
          </div>
          <Seg value={tab} onChange={setTab} options={[['look', 'Макет'], ['size', 'Размеры'], ['photo', 'Фото'], ['bg', 'Фон'], ['text', 'Имя']]} />

          {tab === 'look' && (
            <div className="space-y-3">
              <Row label="Режим"><Seg value={s.mode} onChange={v => update({ mode: v })} options={[['classic', 'Аватар'], ['poster', 'Постер']]} /></Row>
              {s.mode === 'classic' ? (
                <>
                  <Row label="Макет"><Seg value={s.classicLayout} onChange={v => update({ classicLayout: v })} options={[['left', 'Слева'], ['center', 'По центру'], ['overlap', 'На баннере'], ['compact', 'Компактно']]} /></Row>
                  <Row label="Форма"><Seg value={s.avatarShape} onChange={v => update({ avatarShape: v })} options={[['circle', 'Круг'], ['squircle', 'Сквиркл'], ['rounded', 'Скруглённый'], ['square', 'Квадрат'], ['arch', 'Арка']]} /></Row>
                  <Row label="Обводка"><Seg value={s.avatarRing} onChange={v => update({ avatarRing: v })} options={[['none', 'Нет'], ['thin', 'Тонкая'], ['double', 'Двойная'], ['glow', 'Свечение'], ['accent', 'Цвет фото']]} /></Row>
                </>
              ) : (
                <>
                  <Row label="Макет"><Seg value={s.posterLayout} onChange={v => update({ posterLayout: v })} options={[['card-right', 'Справа'], ['card-left', 'Слева'], ['center-card', 'Центр'], ['split', 'Журнал'], ['fullbleed', 'Во весь экран'], ['name-behind', 'Имя за фото'], ['glass', 'Стекло'], ['vinyl', 'Винил']]} /></Row>
                  <Row label="Пропорции"><Seg value={s.posterAspect} onChange={v => update({ posterAspect: v })} options={[['3/4', '3:4'], ['4/5', '4:5'], ['1/1', '1:1'], ['2/3', '2:3']]} /></Row>
                  <Row label="Рамка"><Seg value={s.posterFrame} onChange={v => update({ posterFrame: v })} options={[['shadow', 'Тень'], ['border', 'Стекло'], ['polaroid', 'Полароид'], ['none', 'Нет']]} /></Row>
                </>
              )}
            </div>
          )}

          {tab === 'size' && (
            <div className="space-y-3">
              <Row label="Высота шапки"><Seg value={s.heroHeight} onChange={v => update({ heroHeight: v })} options={[['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']]} /></Row>
              {s.mode === 'classic'
                ? <Row label={`Размер аватара · ${s.avatarSize}px`}><Range value={s.avatarSize} min={96} max={300} onChange={v => update({ avatarSize: v })} /></Row>
                : <>
                    <Row label={`Ширина фото · ${s.cardWidth}px`}><Range value={s.cardWidth} min={180} max={440} onChange={v => update({ cardWidth: v })} /></Row>
                    <Row label={`Скругление · ${s.cardRadius}px`}><Range value={s.cardRadius} min={0} max={48} onChange={v => update({ cardRadius: v })} /></Row>
                  </>}
              <p className="text-[11px] text-zinc-500">Размеры фиксированы, поэтому фото любого разрешения обрезаются одинаково.</p>
            </div>
          )}

          {tab === 'photo' && (
            <div className="space-y-3">
              <Row label="Точка фокуса (нажми на фото)">
                <div ref={focusRef} onClick={setFocus} className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-crosshair bg-zinc-900">
                  {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-contain" />}
                  <div className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.25)] pointer-events-none" style={{ left: `${s.focusX}%`, top: `${s.focusY}%` }} />
                </div>
              </Row>
              <Row label={`Масштаб · ${s.zoom.toFixed(2)}×`}><Range value={s.zoom} min={1} max={2} step={0.01} onChange={v => update({ zoom: v })} /></Row>
              <Row label="Тон"><Seg value={s.tint} onChange={v => update({ tint: v })} options={[['none', 'Нет'], ['warm', 'Тёплый'], ['cool', 'Холодный'], ['mono', 'Ч/Б'], ['palette', 'Цвет фото']]} /></Row>
            </div>
          )}

          {tab === 'bg' && (
            <div className="space-y-3">
              {s.mode === 'classic'
                ? <Row label="Фон"><Seg value={s.classicBg} onChange={v => update({ classicBg: v })} options={[['blur', 'Размытие'], ['banner', 'Баннер'], ['gradient', 'Градиент'], ['duotone', 'Дуотон'], ['solid', 'Ровный']]} /></Row>
                : <Row label="Фон"><Seg value={s.posterBg} onChange={v => update({ posterBg: v })} options={[['blur', 'Размытое фото'], ['palette', 'Цвета фото'], ['solid', 'Ровный']]} /></Row>}
              <Row label={`Размытие · ${s.bgBlur}px`}><Range value={s.bgBlur} min={0} max={120} onChange={v => update({ bgBlur: v })} /></Row>
              <Row label={`Затемнение · ${Math.round(s.bgDim * 100)}%`}><Range value={s.bgDim} min={0} max={0.9} step={0.01} onChange={v => update({ bgDim: v })} /></Row>
              <Row label={`Виньетка · ${Math.round(s.vignette * 100)}%`}><Range value={s.vignette} min={0} max={0.9} step={0.01} onChange={v => update({ vignette: v })} /></Row>
            </div>
          )}

          {tab === 'text' && (
            <div className="space-y-3">
              <Row label={`Размер имени · ${s.nameSize}px`}><Range value={s.nameSize} min={40} max={150} onChange={v => update({ nameSize: v })} /></Row>
              <Row label={`Межбуквенный · ${s.nameTracking.toFixed(3)}em`}><Range value={s.nameTracking} min={-0.08} max={0.12} step={0.005} onChange={v => update({ nameTracking: v })} /></Row>
              <Row label="Регистр"><Seg value={s.nameCase} onChange={v => update({ nameCase: v })} options={[['as', 'Как есть'], ['upper', 'ЗАГЛАВНЫЕ'], ['lower', 'строчные']]} /></Row>
              <Row label="Выравнивание"><Seg value={s.textAlign} onChange={v => update({ textAlign: v })} options={[['left', 'Слева'], ['center', 'По центру']]} /></Row>
              <Row label="Шрифт имени">
                <select value={s.nameFont} onChange={e => update({ nameFont: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option value="">Шрифт сайта</option>
                  {FONTS_FOR_NAME.map(f => <option key={f} value={f}>{f.split("'")[1]}</option>)}
                </select>
              </Row>
            </div>
          )}
        </div>
      </motion.aside>
    </div>
  );
};

// ---------------------------------------------------------------------------
// awards source (App -> artist page)
// ---------------------------------------------------------------------------
type AwardLike = { id: string; year: string; month?: string; periodType: 'month' | 'year'; nominationTitle: string; winner: { type: string; title: string; artistName?: string; coverUrl?: string } };
let awardsSource: AwardLike[] = [];
const awardListeners = new Set<() => void>();
export function setArtistAwardsSource(a: AwardLike[]) { awardsSource = a || []; awardListeners.forEach(f => f()); }
const useAwardsSource = () => useSyncExternalStore(cb => { awardListeners.add(cb); return () => { awardListeners.delete(cb); }; }, () => awardsSource, () => awardsSource);

const norm = (s?: string) => (s || '').toLowerCase().replace(/[«»"'`]/g, '').replace(/\s+/g, ' ').trim();
export const splitNames = (raw?: string) => (raw || '').split(/[,&/;]|\bfeat\.?|\bft\.?|\s[xх]\s|\sи\s/i).map(x => x.trim()).filter(Boolean);
/** awards won by the artist, including collabs (album with co-artist, feat) */
export function awardsOfArtist(name: string, awards: AwardLike[]) {
  const n = norm(name);
  return awards.flatMap(a => {
    const w = a.winner;
    if (w.type === 'artist') return norm(w.title) === n ? [{ award: a, collab: false }] : [];
    const names = splitNames(w.artistName).map(norm);
    if (!names.includes(n)) return [];
    return [{ award: a, collab: names.length > 1 }];
  });
}

// ---------------------------------------------------------------------------
// clickable co-artists
// ---------------------------------------------------------------------------
export const CoArtistLinks: React.FC<{
  names?: string; artists: Array<{ id: string; name: string }>; exclude?: string;
  navigateTo: (view: any, params?: any) => void; className?: string; separator?: string;
}> = ({ names, artists, exclude, navigateTo, className = '', separator = ', ' }) => {
  const list = splitNames(names).filter(n => norm(n) !== norm(exclude));
  if (!list.length) return null;
  return (
    <>
      {list.map((n, i) => {
        const found = artists.find(a => norm(a.name) === norm(n));
        return (
          <React.Fragment key={`${n}-${i}`}>
            <span className="text-zinc-500">{i === 0 ? separator : ', '}</span>
            <span onClick={e => { e.stopPropagation(); navigateTo('artist', found ? { id: found.id, artistName: found.name } : { id: `guest_${n}`, artistName: n }); }}
              className={`cursor-pointer hover:underline ${className}`} title={`Перейти к артисту ${n}`}>{n}</span>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// eras
// ---------------------------------------------------------------------------
export interface EraRelease { id: string; type: 'album' | 'track'; title: string; ts: number; plays: number; cover?: string; feat?: boolean; snippet?: boolean }
export interface ArtistEra {
  id: string; label: string; title: string; kind: 'album' | 'singles'; tags: string[];
  from: number; to: number; years: number[]; albumIds: Set<string>; trackIds: Set<string>;
  releases: EraRelease[]; plays: number; cover?: string; avgRating?: number; hue: number; genre?: string;
  top?: { id: string; title: string; plays: number };
}

const DAY = 86400000;
function parseTs(d?: string, year?: number | string): number | null {
  if (d) {
    const t = d.trim();
    let m = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(t);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    m = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/.exec(t);
    if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  }
  return year ? Date.UTC(+year, 0, 1) : null;
}
const hashHue = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const fmtTs = (ts: number) => { const d = new Date(ts); void MONTHS; return `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`; };
export const eraRange = (e: ArtistEra) => (fmtTs(e.from) === fmtTs(e.to) ? fmtTs(e.from) : `${fmtTs(e.from)} — ${fmtTs(e.to)}`);
export const eraHas = (era: ArtistEra | undefined, item: { id: string }, type: 'album' | 'track') =>
  !era ? true : type === 'album' ? era.albumIds.has(item.id) : era.trackIds.has(item.id);

export function computeArtistEras(artist: { id: string; name: string }, albums: any[], tracks: any[]): ArtistEra[] {
  const myName = norm(artist.name);
  const albumIds = new Set(albums.map(a => a.id));
  const albumItems = albums.map(a => ({ a, ts: parseTs(a.releaseDate, a.releaseYear) })).filter(x => x.ts !== null).sort((x, y) => x.ts! - y.ts!) as Array<{ a: any; ts: number }>;
  const singles = tracks.filter(t => !t.albumId || !albumIds.has(t.albumId)).map(t => ({ t, ts: parseTs(t.releaseDate) })).filter(x => x.ts !== null).sort((x, y) => x.ts! - y.ts!) as Array<{ t: any; ts: number }>;

  type Bucket = { kind: 'album' | 'singles'; album?: any; anchor: number; singles: Array<{ t: any; ts: number }> };
  const buckets: Bucket[] = albumItems.map(x => ({ kind: 'album', album: x.a, anchor: x.ts, singles: [] }));
  const orphans: Array<{ t: any; ts: number }> = [];
  for (const s of singles) {
    const next = buckets.find(b => b.anchor >= s.ts);
    const prev = [...buckets].reverse().find(b => b.anchor <= s.ts);
    if (next && next.anchor - s.ts <= 180 * DAY) next.singles.push(s);
    else if (prev && s.ts - prev.anchor <= 365 * DAY) prev.singles.push(s);
    else orphans.push(s);
  }
  let group: Bucket | null = null;
  for (const o of orphans) {
    const last = group?.singles[group.singles.length - 1];
    if (!group || !last || o.ts - last.ts > 270 * DAY) { group = { kind: 'singles', anchor: o.ts, singles: [] }; buckets.push(group); }
    group.singles.push(o);
  }

  const eras: ArtistEra[] = buckets.map((b, i) => {
    const albumTracks = b.album ? tracks.filter(t => t.albumId === b.album.id) : [];
    const rel: EraRelease[] = [
      ...(b.album ? [{ id: b.album.id, type: 'album' as const, title: b.album.title, ts: b.anchor, plays: b.album.totalPlays || albumTracks.reduce((s: number, t: any) => s + (t.plays || 0), 0), cover: b.album.coverUrl }] : []),
      ...b.singles.map(s => ({ id: s.t.id, type: 'track' as const, title: s.t.title, ts: s.ts, plays: s.t.plays || 0, cover: s.t.coverUrl, feat: norm(s.t.artistName) !== myName, snippet: !!s.t.isSnippet }))
    ].sort((x, y) => x.ts - y.ts);
    const allTracks = [...albumTracks, ...b.singles.map(s => s.t)];
    const top = [...allTracks].sort((x, y) => (y.plays || 0) - (x.plays || 0))[0];
    const ratings = [b.album, ...allTracks].map(x => x?.rating?.totalScore).filter(Boolean) as number[];
    const genres = allTracks.map(t => t.genre).concat(b.album?.genre).filter(Boolean) as string[];
    const genre = genres.sort((x, y) => genres.filter(g2 => g2 === y).length - genres.filter(g2 => g2 === x).length)[0];
    const title = b.album ? b.album.title : top?.title || 'Синглы';
    const from = rel[0]?.ts ?? b.anchor;
    const to = rel[rel.length - 1]?.ts ?? b.anchor;
    return {
      id: `era-${b.album?.id || `s${i}-${from}`}`, kind: b.kind, title, label: b.album ? `«${title}»` : `Эра «${title}»`, tags: [],
      from, to, years: [...new Set(rel.map(r => new Date(r.ts).getUTCFullYear()))],
      albumIds: new Set(b.album ? [b.album.id] : []), trackIds: new Set(allTracks.map(t => t.id)),
      releases: rel, plays: rel.reduce((s, r) => s + r.plays, 0), cover: b.album?.coverUrl || top?.coverUrl,
      avgRating: ratings.length ? Math.round(ratings.reduce((a, c) => a + c, 0) / ratings.length) : undefined,
      hue: hashHue(title), genre, top: top ? { id: top.id, title: top.title, plays: top.plays || 0 } : undefined
    };
  }).sort((x, y) => x.from - y.from);

  const peak = Math.max(0, ...eras.map(e => e.plays));
  const latest = Math.max(0, ...eras.map(e => e.to));
  eras.forEach((e, i) => {
    const prev = eras[i - 1];
    const avg = e.plays / Math.max(1, e.releases.length);
    const prevAvg = prev ? prev.plays / Math.max(1, prev.releases.length) : 0;
    if (i === 0) e.tags.push('Дебют');
    if (prev && e.from - prev.to > 365 * DAY) e.tags.push('Камбэк');
    if (prev && prevAvg > 0 && avg >= prevAvg * 2) e.tags.push('Прорыв');
    if (eras.length > 1 && e.plays === peak && peak > 0) e.tags.push('Пик');
    if (prev && e.genre && prev.genre && norm(e.genre) !== norm(prev.genre)) e.tags.push('Новое звучание');
    if (e.kind === 'singles') e.tags.push('Синглы');
    if (i === eras.length - 1 && latest - e.to < 200 * DAY && eras.length > 1) e.tags.push('Сейчас');
  });
  return eras;
}

const fmtPlays = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} млрд` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} млн` : n >= 1e3 ? `${Math.round(n / 1e3)} тыс.` : `${n}`);
const TAG_COLOR: Record<string, string> = { 'Дебют': '#60a5fa', 'Прорыв': '#34d399', 'Пик': '#fbbf24', 'Камбэк': '#f472b6', 'Новое звучание': '#a78bfa', 'Сейчас': '#ffffff', 'Синглы': '#a1a1aa' };

export const ArtistEras: React.FC<{
  eras: ArtistEra[]; selectedEraId: string; onSelect: (id: string) => void; artistName: string;
  navigateTo: (view: any, params?: any) => void; totalTracks: number;
  renderCover?: (url: string | undefined, title: string) => React.ReactNode;
}> = ({ eras, selectedEraId, onSelect, artistName, navigateTo, totalTracks, renderCover }) => {
  const awards = useAwardsSource();
  const won = useMemo(() => awardsOfArtist(artistName, awards), [artistName, awards]);
  const awardTs = (a: AwardLike) => Date.UTC(+a.year, a.periodType === 'month' ? +(a.month || 1) - 1 : 11, 28);
  if (!eras.length && !won.length) return null;
  const sel = eras.find(e => e.id === selectedEraId);
  const maxPlays = Math.max(1, ...(sel?.releases.map(r => r.plays) || [1]));
  const eraAwards = (e: ArtistEra) => won.filter(w => { const t = awardTs(w.award); return t >= e.from - 15 * DAY && t <= e.to + 60 * DAY; });
  const thumb = (url: string | undefined, title: string, hue: number, cls: string) => (
    <div className={`relative overflow-hidden shrink-0 ${cls}`} style={{ background: `linear-gradient(135deg, hsl(${hue} 35% 28%), hsl(${(hue + 40) % 360} 30% 12%))` }}>
      {renderCover ? renderCover(url, title) : url ? <img src={url} alt="" className="w-full h-full object-cover" /> : null}
    </div>
  );

  return (
    <section className="mb-12 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-md overflow-hidden">
      <div className="px-5 pt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Эры творчества</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{sel ? `${sel.label} · ${eraRange(sel)}` : `${eras.length} ${eras.length === 1 ? 'эра' : eras.length < 5 ? 'эры' : 'эр'} · нажми на эру, чтобы отфильтровать релизы`}</p>
        </div>
        <div className="flex items-center gap-2">
          {won.length > 0 && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">🏆 {won.length}{won.some(w => w.collab) ? ` · совм. ${won.filter(w => w.collab).length}` : ''}</span>}
          <button type="button" onClick={() => onSelect('all')} className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${selectedEraId === 'all' ? 'bg-white text-black border-white' : 'text-zinc-400 border-white/10 hover:text-white'}`}>
            Все эры · {totalTracks}
          </button>
        </div>
      </div>

      {eras.length > 0 && (
        <div className="px-5 pt-4">
          <div className="flex h-2 rounded-full overflow-hidden gap-[3px]">
            {eras.map(e => (
              <button key={e.id} type="button" onClick={() => onSelect(selectedEraId === e.id ? 'all' : e.id)} title={e.label}
                className="h-full transition-opacity hover:opacity-100" style={{ flexGrow: Math.max(1, e.releases.length), background: `hsl(${e.hue} 45% 55%)`, opacity: selectedEraId === 'all' || selectedEraId === e.id ? 1 : 0.25 }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto custom-scrollbar px-5 py-4 snap-x">
        {eras.map((e, i) => {
          const on = selectedEraId === e.id;
          const ea = eraAwards(e);
          return (
            <motion.button key={e.id} type="button" onClick={() => onSelect(on ? 'all' : e.id)} whileHover={{ y: -3 }}
              className={`snap-start shrink-0 w-[230px] text-left rounded-2xl p-3 border transition-colors ${on ? 'bg-white/[0.09] border-white/25' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'}`}>
              <div className="flex items-center gap-3">
                {thumb(e.cover, e.title, e.hue, 'w-12 h-12 rounded-xl')}
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Эра {i + 1}</div>
                  <div className="text-[13px] font-black text-white truncate">{e.label}</div>
                  <div className="text-[11px] text-zinc-500">{eraRange(e)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2.5 min-h-[18px]">
                {e.tags.map(t => <span key={t} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06]" style={{ color: TAG_COLOR[t] || '#d4d4d8' }}>{t}</span>)}
                {ea.length > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300">🏆 {ea.length}</span>}
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2.5 text-center">
                <div><div className="text-[13px] font-black text-white">{e.releases.length}</div><div className="text-[9px] text-zinc-500 uppercase">релизов</div></div>
                <div><div className="text-[13px] font-black text-white">{fmtPlays(e.plays)}</div><div className="text-[9px] text-zinc-500 uppercase">прослуш.</div></div>
                <div><div className="text-[13px] font-black text-white">{e.avgRating ?? '—'}</div><div className="text-[9px] text-zinc-500 uppercase">оценка</div></div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {sel && (
          <motion.div key={sel.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
            <div className="px-5 pb-5 grid md:grid-cols-[1fr_260px] gap-4">
              <div className="space-y-1">
                {sel.releases.map(r => (
                  <button key={`${r.type}-${r.id}`} type="button" onClick={() => navigateTo(r.type === 'album' ? 'album' : 'track', { id: r.id })}
                    className="w-full flex items-center gap-3 rounded-xl px-2.5 py-1.5 hover:bg-white/[0.05] text-left">
                    {thumb(r.cover, r.title, sel.hue, 'w-8 h-8 rounded-md')}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-white truncate">{r.title}
                        <span className="ml-1.5 text-[10px] font-semibold text-zinc-500">{r.type === 'album' ? 'альбом' : r.snippet ? 'сниппет' : r.feat ? 'фит' : 'сингл'} · {fmtTs(r.ts)}</span>
                      </div>
                      <div className="h-1 mt-1 rounded-full bg-white/[0.05] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(r.plays / maxPlays) * 100}%`, background: `hsl(${sel.hue} 45% 60%)` }} /></div>
                    </div>
                    <span className="text-[11px] text-zinc-400 tabular-nums">{fmtPlays(r.plays)}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3 self-start">
                {sel.top && <div><div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Главный хит эры</div><div className="text-sm font-black text-white mt-0.5">{sel.top.title}</div><div className="text-[11px] text-zinc-500">{fmtPlays(sel.top.plays)} прослушиваний</div></div>}
                {sel.genre && <div><div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Звучание</div><div className="text-sm font-bold text-white mt-0.5">{sel.genre}</div></div>}
                {eraAwards(sel).length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Награды эры</div>
                    {eraAwards(sel).map(w => <div key={w.award.id} className="text-[12px] text-amber-200">🏆 {w.award.nominationTitle} · {w.award.winner.title}{w.collab ? ' (совм.)' : ''}</div>)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
