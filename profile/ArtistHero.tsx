// ============================================================================
// ARTIST HERO v2 — profile header with per-artist settings
// - two modes: "classic" (avatar) and "poster" (photo card), each with variants
// - every photo is normalised: fixed hero height, fixed aspect frames,
//   focus point + zoom, so different resolutions look the same
// - settings are stored per artist in localStorage (musaic.hero.<artistId>)
// ============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface HeroSettings {
  mode: 'classic' | 'poster';
  avatarShape: 'circle' | 'squircle' | 'rounded' | 'square';
  avatarSize: 'sm' | 'md' | 'lg' | 'xl';
  avatarRing: 'none' | 'thin' | 'glow' | 'accent';
  classicBg: 'blur' | 'banner' | 'gradient' | 'solid';
  align: 'left' | 'center';
  posterLayout: 'card-right' | 'card-left' | 'center-card' | 'split' | 'fullbleed';
  posterAspect: '3/4' | '4/5' | '1/1' | '2/3';
  posterFrame: 'shadow' | 'border' | 'polaroid' | 'none';
  focusX: number;   // 0..100
  focusY: number;   // 0..100
  zoom: number;     // 1..2
  bgBlur: number;   // 20..120 px
  bgDim: number;    // 0..0.9
  tint: 'none' | 'warm' | 'cool' | 'mono' | 'accent';
  nameSize: 'md' | 'lg' | 'xl';
  nameFont: string; // '' = site font
}

export const DEFAULT_HERO: HeroSettings = {
  mode: 'poster', avatarShape: 'circle', avatarSize: 'lg', avatarRing: 'thin', classicBg: 'blur', align: 'left',
  posterLayout: 'card-right', posterAspect: '3/4', posterFrame: 'shadow',
  focusX: 50, focusY: 35, zoom: 1, bgBlur: 70, bgDim: 0.45, tint: 'none', nameSize: 'xl', nameFont: ''
};

export const HERO_PRESETS: Array<{ name: string; s: Partial<HeroSettings> }> = [
  { name: 'Минимал', s: { mode: 'classic', avatarShape: 'circle', avatarRing: 'thin', classicBg: 'gradient', align: 'left', tint: 'none', bgDim: 0.5 } },
  { name: 'Баннер', s: { mode: 'classic', classicBg: 'banner', avatarShape: 'circle', avatarRing: 'glow', bgDim: 0.55, bgBlur: 20 } },
  { name: 'Постер', s: { mode: 'poster', posterLayout: 'card-right', posterAspect: '3/4', posterFrame: 'shadow', bgBlur: 80, bgDim: 0.45 } },
  { name: 'Кино', s: { mode: 'poster', posterLayout: 'fullbleed', bgDim: 0.35, tint: 'mono', nameSize: 'xl' } },
  { name: 'Журнал', s: { mode: 'poster', posterLayout: 'split', posterAspect: '4/5', posterFrame: 'none', tint: 'warm' } },
  { name: 'Полароид', s: { mode: 'poster', posterLayout: 'center-card', posterAspect: '1/1', posterFrame: 'polaroid', bgBlur: 110, bgDim: 0.6 } }
];

const KEY = (id: string) => `musaic.hero.${id}`;
export function useHeroSettings(artistId: string, base?: Partial<HeroSettings>) {
  const read = () => {
    try { return { ...DEFAULT_HERO, ...(base || {}), ...(JSON.parse(localStorage.getItem(KEY(artistId)) || '{}') as Partial<HeroSettings>) }; }
    catch { return DEFAULT_HERO; }
  };
  const [s, setS] = useState<HeroSettings>(read);
  useEffect(() => { setS(read()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [artistId]);
  const update = useCallback((patch: Partial<HeroSettings>) => {
    setS(prev => { const next = { ...prev, ...patch }; try { localStorage.setItem(KEY(artistId), JSON.stringify(next)); } catch { /* quota */ } return next; });
  }, [artistId]);
  const reset = useCallback(() => { try { localStorage.removeItem(KEY(artistId)); } catch { /* */ } setS({ ...DEFAULT_HERO, ...(base || {}) }); }, [artistId, base]);
  return [s, update, reset] as const;
}

const TINTS: Record<HeroSettings['tint'], string> = {
  none: 'transparent', warm: 'rgba(255,140,60,0.18)', cool: 'rgba(60,130,255,0.18)', mono: 'rgba(0,0,0,0)', accent: 'var(--accent-color, #10b981)'
};

const AVATAR_PX = { sm: 120, md: 160, lg: 200, xl: 236 };
const SHAPE = { circle: '9999px', squircle: '32%', rounded: '24px', square: '6px' };
const NAME = { md: 'text-4xl md:text-6xl', lg: 'text-5xl md:text-7xl', xl: 'text-6xl md:text-8xl' };

const Photo: React.FC<{ src?: string; s: HeroSettings; className?: string; style?: React.CSSProperties }> = ({ src, s, className = '', style }) => (
  <div className={`relative overflow-hidden bg-zinc-900 ${className}`} style={style}>
    {src && (
      <img src={src} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
        style={{ objectPosition: `${s.focusX}% ${s.focusY}%`, transform: `scale(${s.zoom})`, transformOrigin: `${s.focusX}% ${s.focusY}%`, filter: s.tint === 'mono' ? 'grayscale(1) contrast(1.05)' : undefined }} />
    )}
  </div>
);

export const ArtistHeroV2: React.FC<{
  artistId: string;
  palette?: string[];      // cover colours from App (headerPalette)
  defaultVariant?: 'cinema' | 'poster'; // old global setting, used until the artist has own settings
  onZoom?: () => void;
  name: string;
  imageUrl?: string;   // already resolved (resolveMedia)
  verified?: boolean;
  subtitle?: string;   // "21,0 млн слушателей за месяц · Рэп"
  children?: React.ReactNode; // extra content under the name
}> = ({ artistId, name, imageUrl, verified, subtitle, children, palette, defaultVariant, onZoom }) => {
  const [s, update, reset] = useHeroSettings(artistId, defaultVariant === 'cinema' ? { mode: 'poster', posterLayout: 'fullbleed' } : undefined);
  const c0 = palette?.[0] || 'var(--accent-color, #10b981)';
  const [panel, setPanel] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const secRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setExpanded(false);
    if (!imageUrl) return;
    const im = new Image();
    im.onload = () => im.naturalWidth && setRatio(im.naturalHeight / im.naturalWidth);
    im.src = imageUrl;
  }, [imageUrl]);
  const isPoster = s.mode === 'poster';
  const nameStyle: React.CSSProperties = { fontFamily: s.nameFont || undefined };

  const Bg = (
    <>
      {(isPoster || s.classicBg === 'blur' || s.classicBg === 'banner') && imageUrl && (
        <img src={imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: `${s.focusX}% ${s.focusY}%`,
            filter: `${(isPoster && s.posterLayout === 'fullbleed') || s.classicBg === 'banner' ? `blur(${Math.round(s.bgBlur / 6)}px)` : `blur(${s.bgBlur}px)`} saturate(1.15) ${s.tint === 'mono' ? 'grayscale(1)' : ''}`,
            transform: 'scale(1.25)'
          }} />
      )}
      {!isPoster && s.classicBg === 'gradient' && <div className="absolute inset-0" style={{ background: `radial-gradient(120% 120% at 15% 0%, color-mix(in srgb, ${c0} 40%, transparent), transparent 60%)` }} />}
      <div className="absolute inset-0" style={{ background: TINTS[s.tint], mixBlendMode: s.tint === 'accent' ? 'soft-light' : 'normal', opacity: s.tint === 'accent' ? 0.5 : 1 }} />
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${s.bgDim})` }} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--bg-color,#09090b)] via-[var(--bg-color,#09090b)]/40 to-transparent" />
    </>
  );

  const Title = (
    <div className={`relative z-10 min-w-0 ${s.align === 'center' && !isPoster ? 'text-center items-center' : ''} flex flex-col`}>
      {verified && <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white/90 mb-2"><span className="w-4 h-4 rounded-full bg-sky-500 text-[10px] flex items-center justify-center">✓</span>Подтверждённый исполнитель</div>}
      <h1 className={`${NAME[s.nameSize]} font-black tracking-tighter text-white leading-[0.9] break-words drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)]`} style={nameStyle}>{name}</h1>
      {subtitle && <p className="mt-3 text-sm md:text-base text-white/75 font-medium">{subtitle}</p>}
      {children}
    </div>
  );

  const frame = s.posterFrame === 'polaroid' ? 'p-3 pb-10 bg-[#f4f2ee] rounded-md'
    : s.posterFrame === 'border' ? 'p-1.5 bg-white/10 border border-white/20 rounded-[26px]' : '';
  const shadow = s.posterFrame === 'none' ? '' : 'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]';
  const card = (w: string) => (
    <motion.div layout className={`relative z-10 shrink-0 ${frame} ${shadow}`} style={{ width: w }}>
      <div onClick={onZoom} className={onZoom ? 'cursor-zoom-in' : ''}>
        <Photo src={imageUrl} s={s} className={s.posterFrame === 'polaroid' ? 'rounded-sm' : 'rounded-[22px]'} style={{ aspectRatio: s.posterAspect }} />
      </div>
    </motion.div>
  );

  let body: React.ReactNode;
  if (!isPoster) {
    const px = AVATAR_PX[s.avatarSize];
    const ring = s.avatarRing === 'thin' ? '0 0 0 1px rgba(255,255,255,0.18)' : s.avatarRing === 'glow' ? '0 0 0 1px rgba(255,255,255,0.15), 0 20px 70px -10px rgba(255,255,255,0.25)'
      : s.avatarRing === 'accent' ? `0 0 0 3px ${c0}, 0 0 40px -6px ${c0}` : 'none';
    body = (
      <div className={`relative z-10 flex ${s.align === 'center' ? 'flex-col items-center text-center' : 'flex-col md:flex-row md:items-end'} gap-6 md:gap-8`}>
        <div onClick={onZoom} className={`shrink-0 ${onZoom ? 'cursor-zoom-in' : ''}`}>
          <Photo src={imageUrl} s={s} className="shadow-2xl" style={{ width: px, height: px, borderRadius: SHAPE[s.avatarShape], boxShadow: ring }} />
        </div>
        {Title}
      </div>
    );
  } else if (s.posterLayout === 'fullbleed') {
    body = <div className="relative z-10 flex items-end h-full">{Title}</div>;
  } else if (s.posterLayout === 'split') {
    body = (
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end h-full">
        {Title}
        <div className="hidden md:flex justify-end">{card('min(340px, 100%)')}</div>
      </div>
    );
  } else if (s.posterLayout === 'center-card') {
    body = (
      <div className="relative z-10 flex flex-col items-center text-center gap-6">
        {card('min(240px, 60vw)')}
        <div className="[&_h1]:text-center">{Title}</div>
      </div>
    );
  } else {
    body = (
      <div className={`relative z-10 flex flex-col-reverse md:flex-row ${s.posterLayout === 'card-left' ? 'md:flex-row-reverse' : ''} md:items-end justify-between gap-8 h-full`}>
        {Title}
        {card('min(300px, 70vw)')}
      </div>
    );
  }

  return (
    <section ref={secRef} className={`relative overflow-hidden ${isPoster ? 'min-h-[440px] md:min-h-[520px]' : 'min-h-[340px] md:min-h-[400px]'} flex flex-col justify-end`}
      style={{ height: expanded && ratio && secRef.current ? Math.min(secRef.current.offsetWidth * ratio, window.innerHeight * 1.6) : undefined, transition: 'height .55s cubic-bezier(.22,1,.36,1)' }}>
      {isPoster && s.posterLayout === 'fullbleed' ? (
        <>
          <Photo src={imageUrl} s={expanded ? { ...s, focusX: 50, focusY: 50, zoom: 1 } : s} className="absolute inset-0" />
          <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${s.bgDim})` }} />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[var(--bg-color,#09090b)] to-transparent" />
        </>
      ) : Bg}
      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-8 md:pb-10 h-full">{body}</div>

      {isPoster && s.posterLayout === 'fullbleed' && ratio && (
        <button type="button" onClick={() => setExpanded(v => !v)}
          className="absolute top-4 right-[118px] z-20 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white/80 hover:text-white transition-colors">
          {expanded ? 'Свернуть' : 'Фото целиком'}
        </button>
      )}
      <button type="button" onClick={() => setPanel(p => !p)}
        className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white/80 hover:text-white transition-colors">
        Вид шапки
      </button>
      <AnimatePresence>
        {panel && <HeroSettingsPanel s={s} update={update} reset={reset} imageUrl={imageUrl} onClose={() => setPanel(false)} />}
      </AnimatePresence>
    </section>
  );
};

// ---------------------------------------------------------------------------
// settings panel
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

export const HeroSettingsPanel: React.FC<{
  s: HeroSettings; update: (p: Partial<HeroSettings>) => void; reset: () => void; imageUrl?: string; onClose: () => void;
}> = ({ s, update, reset, imageUrl, onClose }) => {
  const [tab, setTab] = useState<'look' | 'photo' | 'bg'>('look');
  const focusRef = useRef<HTMLDivElement>(null);
  const setFocus = (e: React.MouseEvent) => {
    const b = focusRef.current!.getBoundingClientRect();
    update({ focusX: Math.round(((e.clientX - b.left) / b.width) * 100), focusY: Math.round(((e.clientY - b.top) / b.height) * 100) });
  };
  return (
    <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.18 }}
      className="absolute top-14 right-4 z-30 w-[320px] max-h-[70vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/10 bg-[#0f1014]/95 backdrop-blur-2xl p-4 space-y-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-white">Вид шапки</span>
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="text-[11px] text-zinc-500 hover:text-white">Сбросить</button>
          <button type="button" onClick={onClose} className="text-[11px] text-zinc-400 hover:text-white">Готово</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {HERO_PRESETS.map(p => (
          <button key={p.name} type="button" onClick={() => update(p.s)} className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] text-[11px] font-bold text-zinc-300">{p.name}</button>
        ))}
      </div>
      <Seg value={tab} onChange={setTab} options={[['look', 'Макет'], ['photo', 'Фото'], ['bg', 'Фон']]} />

      {tab === 'look' && (
        <div className="space-y-3">
          <Row label="Режим"><Seg value={s.mode} onChange={v => update({ mode: v })} options={[['classic', 'Аватар'], ['poster', 'Постер']]} /></Row>
          {s.mode === 'classic' ? (
            <>
              <Row label="Форма"><Seg value={s.avatarShape} onChange={v => update({ avatarShape: v })} options={[['circle', 'Круг'], ['squircle', 'Сквиркл'], ['rounded', 'Скруглённый'], ['square', 'Квадрат']]} /></Row>
              <Row label="Размер"><Seg value={s.avatarSize} onChange={v => update({ avatarSize: v })} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL']]} /></Row>
              <Row label="Обводка"><Seg value={s.avatarRing} onChange={v => update({ avatarRing: v })} options={[['none', 'Нет'], ['thin', 'Тонкая'], ['glow', 'Свечение'], ['accent', 'Акцент']]} /></Row>
              <Row label="Выравнивание"><Seg value={s.align} onChange={v => update({ align: v })} options={[['left', 'Слева'], ['center', 'По центру']]} /></Row>
            </>
          ) : (
            <>
              <Row label="Макет"><Seg value={s.posterLayout} onChange={v => update({ posterLayout: v })} options={[['card-right', 'Справа'], ['card-left', 'Слева'], ['center-card', 'Центр'], ['split', 'Журнал'], ['fullbleed', 'Во весь экран']]} /></Row>
              <Row label="Пропорции"><Seg value={s.posterAspect} onChange={v => update({ posterAspect: v })} options={[['3/4', '3:4'], ['4/5', '4:5'], ['1/1', '1:1'], ['2/3', '2:3']]} /></Row>
              <Row label="Рамка"><Seg value={s.posterFrame} onChange={v => update({ posterFrame: v })} options={[['shadow', 'Тень'], ['border', 'Стекло'], ['polaroid', 'Полароид'], ['none', 'Нет']]} /></Row>
            </>
          )}
          <Row label="Размер имени"><Seg value={s.nameSize} onChange={v => update({ nameSize: v })} options={[['md', 'M'], ['lg', 'L'], ['xl', 'XL']]} /></Row>
          <Row label="Шрифт имени">
            <select value={s.nameFont} onChange={e => update({ nameFont: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
              <option value="">Шрифт сайта</option>
              {["'Unbounded', sans-serif", "'Dela Gothic One', sans-serif", "'Playfair Display', serif", "'Cormorant Garamond', serif", "'Oswald', sans-serif", "'Sofia Sans Extra Condensed', sans-serif", "'Montserrat Alternates', sans-serif", "'Russo One', sans-serif", "'Inter Tight', sans-serif"].map(f => (
                <option key={f} value={f}>{f.split("'")[1]}</option>
              ))}
            </select>
          </Row>
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
          <Row label="Тон"><Seg value={s.tint} onChange={v => update({ tint: v })} options={[['none', 'Нет'], ['warm', 'Тёплый'], ['cool', 'Холодный'], ['mono', 'Ч/Б'], ['accent', 'Акцент']]} /></Row>
        </div>
      )}

      {tab === 'bg' && (
        <div className="space-y-3">
          {s.mode === 'classic' && <Row label="Фон"><Seg value={s.classicBg} onChange={v => update({ classicBg: v })} options={[['blur', 'Размытие'], ['banner', 'Баннер'], ['gradient', 'Градиент'], ['solid', 'Без фона']]} /></Row>}
          <Row label={`Размытие · ${s.bgBlur}px`}><Range value={s.bgBlur} min={20} max={120} onChange={v => update({ bgBlur: v })} /></Row>
          <Row label={`Затемнение · ${Math.round(s.bgDim * 100)}%`}><Range value={s.bgDim} min={0} max={0.9} step={0.01} onChange={v => update({ bgDim: v })} /></Row>
        </div>
      )}
    </motion.div>
  );
};
