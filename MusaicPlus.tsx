// ============================================================================
// MUSAIC PLUS (v2.4)
// Один файл со всеми новыми функциями, чтобы не плодить файлы в репозитории:
//  1. ChartsPro          — новые чарты: Топ-100 треков, Топ-50 альбомов, Топ-100 артистов,
//                          NEW / RE / ▲▼, история позиций, «сейчас / за всё время / период»
//  2. BatchSmartTools    — генераторы из симуляции в батч-конструкторе (название, прослушивания, фиты, треклист)
//  3. ReleaseStage       — «живой» экран релиза, подстраивается под обложку и настроение (можно выключить)
//  4. ReleaseCalendarPro — календарь: вышедшие релизы, анонсы, пре-сейвы, сниппеты, слухи
//  6. ArtistAwardsButton — награды и номинации артиста
//  7. computeArtistEras  — эры с первых треков, не только от альбомов
//  8. CoverPeek          — минималистичный просмотр обложки
// ============================================================================
import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { Artist, Album, Track, AwardItem, ViewType } from './types';
import { CoverArt, resolveMedia, formatNumber } from './App';
import { setArtistAwardsSource as setHeroAwardsSource, splitNames } from './profile/ArtistHero';
import type { ArtistEra, EraRelease } from './profile/ArtistHero';
import { generateModernTitle, analyzeArtistNamingStyle } from './titleGen';
import { computeAllArtistMetrics, forecastReleasePlays, generateAlbumTracksWithFeats, getPromoStrategyConfig } from './SimulationMode';

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const DAY = 864e5;
const pad2 = (n: number) => String(n).padStart(2, '0');
const toISO = (ms: number) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; };
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const fmtDay = (ms: number) => { const d = new Date(ms); return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const fmtDayShort = (ms: number) => { const d = new Date(ms); return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`; };
export const fmtN = (n: number) => {
  const v = Math.max(0, Math.round(n || 0));
  if (v >= 1e9) return `${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace('.', ',')} млрд`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace('.', ',')} млн`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} тыс.`;
  return String(v);
};
const norm = (s?: string) => (s || '').toLowerCase().replace(/[«»"'`]/g, '').replace(/\s+/g, ' ').trim();
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const seeded = (seed: number) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/** "2024-05-17", "17.05.2024", year fallback -> UTC ms */
export function parseDayMs(d?: string, year?: number | string): number | null {
  if (d) {
    const t = d.trim();
    let m = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(t);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    m = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/.exec(t);
    if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
    m = /^(\d{4})$/.exec(t);
    if (m) return Date.UTC(+m[1], 0, 1);
  }
  return year ? Date.UTC(+year, 0, 1) : null;
}
const dayStart = (ms: number) => { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const refToMs = (ref?: string) => { const p = parseDayMs(ref); return p !== null ? p : dayStart(Date.now()); };

const lsGet = <T,>(k: string, def: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : def; } catch { return def; } };
const lsSet = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } };

type Store<T> = { get: () => T; set: (n: T) => void; sub: (f: () => void) => () => void };
function createStore<T>(initial: T): Store<T> {
  let v = initial;
  const ls = new Set<() => void>();
  return {
    get: () => v,
    set: (n: T) => { v = n; ls.forEach(f => f()); },
    sub: (f: () => void) => { ls.add(f); return () => { ls.delete(f); }; }
  };
}
function useStore<T>(s: Store<T>) { return useSyncExternalStore(s.sub, s.get, s.get); }

const Portal: React.FC<{ children: React.ReactNode; lock?: boolean }> = ({ children, lock = true }) => {
  useEffect(() => {
    if (!lock) return;
    const p = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = p; };
  }, [lock]);
  return typeof document === 'undefined' ? null : createPortal(children, document.body);
};
function useEsc(on: boolean, cb: () => void) {
  useEffect(() => {
    if (!on) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') cb(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [on, cb]);
}

/** lead artist / feat check */
const isLeadOf = (t: { artistId?: string; artistName?: string }, a: { id: string; name: string }) =>
  (t.artistId && t.artistId === a.id) || norm(t.artistName) === norm(a.name);

// global CSS for everything in this file (injected once)
const PLUS_CSS = `
.mp-cv{content-visibility:auto;contain-intrinsic-size:auto 68px}
.mp-row{transition:background-color .2s ease}
@keyframes mp-aurora{0%{transform:translate3d(-6%,-4%,0) rotate(0deg) scale(1)}50%{transform:translate3d(5%,3%,0) rotate(8deg) scale(1.08)}100%{transform:translate3d(-6%,-4%,0) rotate(0deg) scale(1)}}
@keyframes mp-rise{0%{transform:translate3d(0,0,0) scale(.6);opacity:0}12%{opacity:.9}100%{transform:translate3d(var(--dx,0px),-105vh,0) scale(1);opacity:0}}
@keyframes mp-fall{0%{transform:translate3d(0,-10vh,0);opacity:0}10%{opacity:.85}100%{transform:translate3d(var(--dx,0px),105vh,0);opacity:0}}
@keyframes mp-twinkle{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
@keyframes mp-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(var(--dx,20px),var(--dy,-30px),0)}}
@keyframes mp-pulse{0%,100%{opacity:.35}50%{opacity:.7}}
@keyframes mp-eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes mp-shine{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}
.mp-eq span{display:block;width:3px;border-radius:2px;background:currentColor;transform-origin:bottom;animation:mp-eq .9s ease-in-out infinite}
.mp-eq span:nth-child(2){animation-delay:.2s}.mp-eq span:nth-child(3){animation-delay:.4s}
@media (prefers-reduced-motion: reduce){.mp-anim,.mp-anim *{animation:none !important}}
`;
let cssInjected = false;
export function usePlusCss() {
  useEffect(() => {
    if (cssInjected || typeof document === 'undefined') return;
    cssInjected = true;
    const el = document.createElement('style');
    el.setAttribute('data-musaic-plus', '');
    el.textContent = PLUS_CSS;
    document.head.appendChild(el);
  }, []);
}

const Eq: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`mp-eq mp-anim inline-flex items-end gap-[2px] h-3.5 ${className}`}><span style={{ height: '100%' }} /><span style={{ height: '100%' }} /><span style={{ height: '100%' }} /></span>
);

// ---------------------------------------------------------------------------
// awards source (App -> artist page & awards button)
// ---------------------------------------------------------------------------
const awardsStore = createStore<AwardItem[]>([]);
/** replaces the old setArtistAwardsSource: feeds both the eras panel and the awards button */
export function setArtistAwardsSource(a: any[]) {
  setHeroAwardsSource((a || []) as any);
  awardsStore.set(((a || []) as AwardItem[]).slice());
}

// ---------------------------------------------------------------------------
// 7. ERAS v2
// - every era starts from the very first tracks (early singles join the first era)
// - eras are usually albums, but a long run of singles without an album becomes its own era
// - singles eras are named after the artist's OWN biggest track, not after a feat
// ---------------------------------------------------------------------------
const ERA_LEAD_IN = 200 * DAY;   // singles before an album belong to its era
const ERA_TAIL = 240 * DAY;      // singles after an album stay in its era
const ERA_GAP = 240 * DAY;       // gap that splits two singles runs
const hueOf = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };

export function computeArtistEras(artist: { id: string; name: string }, albums: any[], tracks: any[]): ArtistEra[] {
  const me = { id: artist.id, name: artist.name };
  const albumById = new Map<string, any>(albums.map(a => [a.id, a]));
  const albumTs = new Map<string, number>();
  albums.forEach(a => { const ts = parseDayMs(a.releaseDate, a.releaseYear); if (ts !== null) albumTs.set(a.id, ts); });

  // anchors: real albums (7+ tracks) and EPs that are not followed by an album soon
  const tracksOfAlbum = new Map<string, any[]>();
  tracks.forEach(t => { if (t.albumId && albumById.has(t.albumId)) { const l = tracksOfAlbum.get(t.albumId) || []; l.push(t); tracksOfAlbum.set(t.albumId, l); } });
  const datedAlbums = albums.filter(a => albumTs.has(a.id)).sort((x, y) => albumTs.get(x.id)! - albumTs.get(y.id)!);
  const isBig = (a: any) => (tracksOfAlbum.get(a.id)?.length || 0) >= 7 || (tracksOfAlbum.get(a.id)?.length || 0) === 0;
  const anchors = datedAlbums.filter((a, i) => {
    if (isBig(a)) return true;
    const ts = albumTs.get(a.id)!;
    return !datedAlbums.slice(i + 1).some(b => isBig(b) && albumTs.get(b.id)! - ts <= 240 * DAY);
  });
  const smallAlbums = datedAlbums.filter(a => !anchors.includes(a));

  type Bucket = { kind: 'album' | 'singles'; album?: any; anchor: number; albums: any[]; items: Array<{ t: any; ts: number }> };
  const buckets: Bucket[] = anchors.map(a => ({ kind: 'album', album: a, anchor: albumTs.get(a.id)!, albums: [a], items: [] }));

  // loose items: singles, feats, snippets, tracks of EPs that are not anchors (EP counts as a release in an era)
  const loose: Array<{ t: any; ts: number; ep?: any }> = [];
  const undated: any[] = [];
  tracks.forEach(t => {
    if (t.albumId && albumById.has(t.albumId) && anchors.some(a => a.id === t.albumId)) return; // album track
    const ts = parseDayMs(t.releaseDate) ?? (t.albumId ? albumTs.get(t.albumId) ?? null : null);
    if (ts === null) { undated.push(t); return; }
    loose.push({ t, ts });
  });
  loose.sort((a, b) => a.ts - b.ts);

  const orphans: Array<{ t: any; ts: number }> = [];
  for (const s of loose) {
    const next = buckets.find(b => b.anchor >= s.ts);
    const prev = [...buckets].reverse().find(b => b.anchor <= s.ts);
    if (next && next.anchor - s.ts <= ERA_LEAD_IN) next.items.push(s);
    else if (prev && s.ts - prev.anchor <= ERA_TAIL) prev.items.push(s);
    else orphans.push(s);
  }
  // group orphans by time
  const groups: Array<Array<{ t: any; ts: number }>> = [];
  orphans.forEach(o => {
    const g = groups[groups.length - 1];
    if (!g || o.ts - g[g.length - 1].ts > ERA_GAP) groups.push([o]); else g.push(o);
  });
  const ownCount = (g: Array<{ t: any }>) => g.filter(x => isLeadOf(x.t, me) && !x.t.isSnippet).length;
  for (const g of groups) {
    const own = ownCount(g);
    const span = g[g.length - 1].ts - g[0].ts;
    const hasHit = g.some(x => isLeadOf(x.t, me) && (x.t.plays || 0) > 0) && own >= 2 && span > 90 * DAY;
    // a singles run becomes an era only when it is a real run (not too often)
    if (own >= 3 || hasHit || buckets.length === 0) {
      buckets.push({ kind: 'singles', anchor: g[0].ts, albums: [], items: g });
    } else {
      // merge into the closest era (earliest tracks go to the first era)
      let best: Bucket | null = null; let bestD = Infinity;
      buckets.forEach(b => {
        const from = Math.min(b.anchor, ...b.items.map(i => i.ts));
        const to = Math.max(b.anchor, ...b.items.map(i => i.ts));
        const d = g[0].ts < from ? from - g[g.length - 1].ts : g[0].ts - to;
        if (d < bestD) { bestD = d; best = b; }
      });
      if (best) (best as Bucket).items.push(...g); else buckets.push({ kind: 'singles', anchor: g[0].ts, albums: [], items: g });
    }
  }
  if (!buckets.length && undated.length) buckets.push({ kind: 'singles', anchor: 0, albums: [], items: [] });
  buckets.sort((a, b) => Math.min(a.anchor, ...a.items.map(i => i.ts)) - Math.min(b.anchor, ...b.items.map(i => i.ts)));
  // undated singles go to the first era, small EPs attach to their era via their tracks
  if (undated.length && buckets[0]) buckets[0].items.push(...undated.map(t => ({ t, ts: buckets[0].anchor || 0 })));
  smallAlbums.forEach(ep => {
    const ts = albumTs.get(ep.id)!;
    const b = buckets.find(x => x.items.some(i => i.t.albumId === ep.id)) || buckets.reduce<Bucket | null>((acc, x) => (!acc || Math.abs(x.anchor - ts) < Math.abs(acc.anchor - ts) ? x : acc), null);
    if (b) b.albums.push(ep);
  });

  const eras: ArtistEra[] = buckets.map((b, i) => {
    const albumTracks = b.album ? tracksOfAlbum.get(b.album.id) || [] : [];
    const epReleases: EraRelease[] = b.albums.filter(a => a !== b.album).map(a => ({
      id: a.id, type: 'album' as const, title: a.title, ts: albumTs.get(a.id) || b.anchor,
      plays: a.totalPlays || (tracksOfAlbum.get(a.id) || []).reduce((s: number, t: any) => s + (t.plays || 0), 0), cover: a.coverUrl
    }));
    const looseTracks = b.items.filter(x => !(x.t.albumId && b.albums.some(a => a.id === x.t.albumId)));
    const rel: EraRelease[] = [
      ...(b.album ? [{ id: b.album.id, type: 'album' as const, title: b.album.title, ts: b.anchor, plays: b.album.totalPlays || albumTracks.reduce((s: number, t: any) => s + (t.plays || 0), 0), cover: b.album.coverUrl }] : []),
      ...epReleases,
      ...looseTracks.map(s => ({ id: s.t.id, type: 'track' as const, title: s.t.title, ts: s.ts, plays: s.t.plays || 0, cover: s.t.coverUrl, feat: !isLeadOf(s.t, me), snippet: !!s.t.isSnippet }))
    ].sort((x, y) => x.ts - y.ts);
    const allTracks = [...albumTracks, ...b.items.map(s => s.t)];
    const own = allTracks.filter(t => isLeadOf(t, me) && !t.isSnippet).sort((x, y) => (y.plays || 0) - (x.plays || 0));
    const top = own[0] || [...allTracks].sort((x, y) => (y.plays || 0) - (x.plays || 0))[0];
    const ratings = [b.album, ...allTracks].map(x => x?.rating?.totalScore).filter(Boolean) as number[];
    const genres = allTracks.map(t => t.genre).concat(b.album?.genre).filter(Boolean) as string[];
    const gCount = new Map<string, number>(); genres.forEach(g => gCount.set(g, (gCount.get(g) || 0) + 1));
    const genre = [...gCount.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
    // EP-only era is named after the EP
    const epName = !b.album && b.albums.length ? b.albums[0].title : '';
    const title = b.album ? b.album.title : epName || (own[0]?.title) || top?.title || 'Синглы';
    const label = b.album ? `«${title}»` : own.length || epName ? `Эра «${title}»` : 'Эра фитов';
    const dated = rel.filter(r => r.ts > 0);
    const from = dated[0]?.ts ?? b.anchor;
    const to = dated[dated.length - 1]?.ts ?? b.anchor;
    return {
      id: `era-${b.album?.id || `s${i}-${from}`}`, kind: b.kind, title, label, tags: [],
      from, to, years: [...new Set(dated.map(r => new Date(r.ts).getUTCFullYear()))],
      albumIds: new Set(b.albums.map(a => a.id)), trackIds: new Set(allTracks.map(t => t.id)),
      releases: rel, plays: rel.reduce((s, r) => s + r.plays, 0) || allTracks.reduce((s, t) => s + (t.plays || 0), 0),
      cover: b.album?.coverUrl || b.albums[0]?.coverUrl || top?.coverUrl,
      avgRating: ratings.length ? Math.round(ratings.reduce((a, c) => a + c, 0) / ratings.length) : undefined,
      hue: hueOf(title), genre, top: top ? { id: top.id, title: top.title, plays: top.plays || 0 } : undefined
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
    if (i === eras.length - 1 && eras.length > 1 && latest - e.to < 200 * DAY) e.tags.push('Сейчас');
  });
  return eras;
}

// ---------------------------------------------------------------------------
// 8. COVER PEEK — minimal big cover viewer (same props as the old ArtworkLightbox)
// ---------------------------------------------------------------------------
export const CoverPeek: React.FC<{
  media: { url: string; title: string; subtitle?: string; type?: string } | null;
  onClose: () => void;
  onPlay?: () => void;
  ambientPalette?: [string, string, string, string];
}> = ({ media, onClose, ambientPalette }) => {
  usePlusCss();
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState('50% 50%');
  const [failed, setFailed] = useState(false);
  useEffect(() => { setZoom(1); setFailed(false); }, [media?.url]);
  const close = useCallback(() => onClose(), [onClose]);
  useEsc(!!media, close);
  const isArtist = /артист|исполн|artist/i.test(media?.type || '');
  const src = media ? resolveMedia(media.url, { title: media.title, isArtist }) : '';
  const glow = ambientPalette?.[0] || 'rgba(255,255,255,0.12)';
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom === 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const onWheel = (e: React.WheelEvent) => setZoom(z => clamp(+(z - e.deltaY * 0.0015).toFixed(2), 1, 3));
  return (
    <AnimatePresence>
      {media && (
        <Portal key="peek">
          <motion.div key="peek" className="fixed inset-0 z-[1200] flex flex-col items-center justify-center select-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
            onClick={close} onWheel={onWheel}>
            <div className="absolute inset-0 bg-black/90" />
            {src && !failed && <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[90px] scale-125 pointer-events-none" />}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(60% 60% at 50% 45%, ${glow}33 0%, transparent 70%)` }} />
            <button type="button" onClick={close} title="Закрыть (Esc)"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/70 hover:text-white text-xl leading-none transition-colors">×</button>
            <motion.div
              initial={{ scale: 0.9, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className={`relative overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] ${isArtist ? 'rounded-[28px]' : 'rounded-2xl'} ${zoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={e => { e.stopPropagation(); setZoom(z => (z > 1 ? 1 : 2)); setOrigin('50% 50%'); }}
              onMouseMove={onMove}
            >
              {src && !failed ? (
                <img src={src} alt={media.title} draggable={false} onError={() => setFailed(true)}
                  className="block max-w-[92vw] max-h-[82vh] object-contain transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${zoom})`, transformOrigin: origin, minWidth: 'min(420px, 80vw)' }} />
              ) : (
                <CoverArt url={media.url} title={media.title} isArtist={isArtist} className="w-[min(82vh,92vw)] h-[min(82vh,92vw)]" innerClassName="w-full h-full object-cover" />
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="relative mt-4 px-6 text-center max-w-[92vw] pointer-events-none">
              <div className="text-[15px] font-black text-white truncate">{media.title}</div>
              <div className="text-[12px] text-white/50 truncate">{[media.type, media.subtitle].filter(Boolean).join(' · ')}</div>
            </motion.div>
          </motion.div>
        </Portal>
      )}
    </AnimatePresence>
  );
};

// ---------------------------------------------------------------------------
// 1. CHARTS PRO
// Модель: у каждого релиза есть кривая накопления прослушиваний (быстрый старт + длинный хвост).
// По ней считаются прослушивания на любую дату -> недельные прослушивания -> недельный чарт.
// Так у каждого трека появляется настоящая история: дебют, пик, недели в чарте, NEW / RE / ▲▼.
// ---------------------------------------------------------------------------
type ChartKind = 'tracks' | 'albums' | 'artists';
type ChartMode = 'now' | 'all' | 'period';
const LIMIT: Record<ChartKind, number> = { tracks: 100, albums: 50, artists: 100 };
const HISTORY_WEEKS = 52;

interface ChartEnt {
  id: string; title: string; sub: string; cover?: string; releaseMs: number; total: number; tau: number; cNow: number;
  isArtist?: boolean; ref: any; credits?: Array<[string, number]>; explicit?: boolean;
}
const curve = (age: number, tau: number) => (age <= 0 ? 0 : 0.8 * (1 - Math.exp(-age / tau)) + 0.2 * Math.min(1, age / 1460));
const playsAt = (e: ChartEnt, T: number) => {
  if (e.cNow <= 0) return 0;
  const age = (T - e.releaseMs) / DAY;
  return age <= 0 ? 0 : (e.total * curve(age, e.tau)) / e.cNow;
};
const weeklyAt = (e: ChartEnt, T: number) => playsAt(e, T) - playsAt(e, T - 7 * DAY);

function trackTau(t: any) {
  let tau = 34;
  const spec = getPromoStrategyConfig(t.promoStrategy);
  if (spec && typeof spec.longevityMult === 'number') tau *= clamp(spec.longevityMult, 0.5, 2);
  if (typeof t.releaseHype === 'number' && !isNaN(t.releaseHype)) tau *= 1.15 - clamp(t.releaseHype, 10, 99) / 330;
  const sc = t.rating?.totalScore;
  if (sc) tau *= sc >= 75 ? 1.3 : sc >= 62 ? 1.1 : 0.92;
  return tau;
}

interface ChartRow { e: ChartEnt; v: number }
interface ChartInfo { rank?: number; last?: number; peak?: number; weeksOn: number; weeksAtOne: number; status: 'new' | 're' | 'up' | 'down' | 'same' | 'none'; delta: number; debutWeek?: number; debutRank?: number }

function buildEntities(artists: Artist[], albums: Album[], tracks: Track[], nowRef: number) {
  const albumById = new Map(albums.map(a => [a.id, a]));
  const artistByName = new Map<string, Artist>(); artists.forEach(a => artistByName.set(norm(a.name), a));
  const artistIds = new Set(artists.map(a => a.id));
  const albumTrackSum = new Map<string, number>();
  tracks.forEach(t => { if (t.albumId && !t.isSnippet) albumTrackSum.set(t.albumId, (albumTrackSum.get(t.albumId) || 0) + (t.plays || 0)); });

  const trackEnts: ChartEnt[] = [];
  for (const t of tracks) {
    if (t.isSnippet) continue;
    const al = t.albumId ? albumById.get(t.albumId) : undefined;
    const rel = parseDayMs(t.releaseDate) ?? (al ? parseDayMs(al.releaseDate, al.releaseYear) : null);
    if (rel === null || !(t.plays > 0)) continue;
    const tau = trackTau(t);
    const credits: Array<[string, number]> = [];
    const lead = (t.artistId && artistIds.has(t.artistId)) ? t.artistId : artistByName.get(norm(t.artistName))?.id;
    if (lead) credits.push([lead, 1]);
    splitNames(t.featuredArtist).forEach(n => { const a = artistByName.get(norm(n)); if (a && a.id !== lead) credits.push([a.id, 0.35]); });
    trackEnts.push({
      id: t.id, title: t.title, sub: t.featuredArtist ? `${t.artistName} feat. ${t.featuredArtist}` : t.artistName,
      cover: t.coverUrl || al?.coverUrl, releaseMs: rel, total: t.plays, tau, cNow: curve((nowRef - rel) / DAY, tau), ref: t, credits, explicit: t.isExplicit
    });
  }
  const albumEnts: ChartEnt[] = [];
  for (const a of albums) {
    const rel = parseDayMs(a.releaseDate, a.releaseYear);
    const total = a.totalPlays || albumTrackSum.get(a.id) || 0;
    if (rel === null || total <= 0) continue;
    const sc = a.rating?.totalScore;
    const tau = 50 * (sc ? (sc >= 75 ? 1.3 : sc >= 62 ? 1.1 : 0.95) : 1);
    albumEnts.push({ id: a.id, title: a.title, sub: a.coArtist ? `${a.artistName} & ${a.coArtist}` : a.artistName, cover: a.coverUrl, releaseMs: rel, total, tau, cNow: curve((nowRef - rel) / DAY, tau), ref: a });
  }
  const artistEnts: ChartEnt[] = artists.map(a => ({ id: a.id, title: a.name, sub: a.genre || '', cover: a.imageUrl, releaseMs: 0, total: a.followers || 0, tau: 1, cNow: 1, isArtist: true, ref: a }));
  return { trackEnts, albumEnts, artistEnts, artistById: new Map(artists.map(a => [a.id, a])) };
}

type Ents = ReturnType<typeof buildEntities>;
function rankChart(ents: Ents, kind: ChartKind, mode: ChartMode, T: number, A = 0, limit = LIMIT[kind]): ChartRow[] {
  const val = (e: ChartEnt) => (mode === 'now' ? weeklyAt(e, T) : mode === 'all' ? playsAt(e, T) : playsAt(e, T) - playsAt(e, A));
  let rows: ChartRow[] = [];
  if (kind === 'artists') {
    const sum = new Map<string, number>();
    for (const e of ents.trackEnts) {
      if (e.releaseMs > T) continue;
      const v = val(e);
      if (v <= 0) continue;
      e.credits!.forEach(([id, w]) => sum.set(id, (sum.get(id) || 0) + v * w));
    }
    for (const e of ents.artistEnts) {
      const base = sum.get(e.id) || 0;
      if (base <= 0) continue;
      const fol = e.ref.followers || 0;
      const v = base + fol * (mode === 'now' ? 0.004 : mode === 'all' ? 1.5 : 0.05);
      rows.push({ e, v });
    }
  } else {
    const list = kind === 'tracks' ? ents.trackEnts : ents.albumEnts;
    for (const e of list) {
      if (e.releaseMs > T) continue;
      const v = val(e);
      if (v > 0.5) rows.push({ e, v });
    }
  }
  rows.sort((a, b) => b.v - a.v || b.e.total - a.e.total);
  if (rows.length > limit) rows = rows.slice(0, limit);
  return rows;
}

function useChartHistory(ents: Ents, kind: ChartKind, T: number) {
  const dEnts = useDeferredValue(ents);
  const dT = useDeferredValue(T);
  const dKind = useDeferredValue(kind);
  return useMemo(() => {
    const weeks: Array<Map<string, number>> = [];
    for (let k = 0; k < HISTORY_WEEKS; k++) {
      const m = new Map<string, number>();
      rankChart(dEnts, dKind, 'now', dT - k * 7 * DAY).forEach((r, i) => m.set(r.e.id, i + 1));
      weeks.push(m);
      if (k > 3 && m.size === 0) break; // nothing older
    }
    return { weeks, T: dT, kind: dKind, ents: dEnts };
  }, [dEnts, dKind, dT]);
}

function infoFrom(weeks: Array<Map<string, number>>, id: string): ChartInfo {
  const rank = weeks[0]?.get(id);
  const last = weeks[1]?.get(id);
  let peak: number | undefined; let weeksOn = 0; let weeksAtOne = 0; let debutWeek: number | undefined; let debutRank: number | undefined;
  weeks.forEach((w, k) => {
    const r = w.get(id);
    if (r === undefined) return;
    weeksOn++;
    if (r === 1) weeksAtOne++;
    if (peak === undefined || r < peak) peak = r;
    debutWeek = k; debutRank = r;
  });
  let status: ChartInfo['status'] = 'none';
  if (rank !== undefined) {
    if (last === undefined) status = weeks.slice(2).some(w => w.has(id)) ? 're' : 'new';
    else status = last > rank ? 'up' : last < rank ? 'down' : 'same';
  }
  return { rank, last, peak, weeksOn, weeksAtOne, status, delta: last !== undefined && rank !== undefined ? last - rank : 0, debutWeek, debutRank };
}

const MoveBadge: React.FC<{ info?: ChartInfo; big?: boolean }> = memo(({ info, big }) => {
  if (!info || info.status === 'none') return <span className="text-[10px] text-zinc-600 font-bold">—</span>;
  const base = `inline-flex items-center justify-center rounded-md font-black tabular-nums ${big ? 'text-[11px] px-2 py-0.5' : 'text-[10px] px-1.5 py-[1px]'}`;
  if (info.status === 'new') return <span className={`${base} bg-emerald-400 text-black tracking-wider`}>NEW</span>;
  if (info.status === 're') return <span className={`${base} bg-sky-400/90 text-black tracking-wider`}>RE</span>;
  if (info.status === 'up') return <span className={`${base} text-emerald-300 bg-emerald-400/10`}>▲ {info.delta}</span>;
  if (info.status === 'down') return <span className={`${base} text-rose-300 bg-rose-400/10`}>▼ {-info.delta}</span>;
  return <span className={`${base} text-zinc-400 bg-white/[0.04]`}>=</span>;
});

/** small rank sparkline for the last weeks (1 = top) */
const RankSpark: React.FC<{ weeks: Array<Map<string, number>>; id: string; limit: number; n?: number }> = memo(({ weeks, id, limit, n = 10 }) => {
  const pts = weeks.slice(0, n).map(w => w.get(id)).reverse();
  if (pts.filter(p => p !== undefined).length < 2) return null;
  const W = 64, H = 20;
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (r: number) => ((r - 1) / Math.max(1, limit - 1)) * (H - 4) + 2;
  let d = ''; let pen = false;
  pts.forEach((r, i) => { if (r === undefined) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(r).toFixed(1)} `; pen = true; });
  return <svg width={W} height={H} className="shrink-0 opacity-70"><path d={d} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>;
});

const Seg2 = <T extends string,>({ value, options, onChange, size = 'md' }: { value: T; options: Array<[T, React.ReactNode]>; onChange: (v: T) => void; size?: 'sm' | 'md' }) => (
  <div className="relative flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
    {options.map(([v, l]) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        className={`relative z-10 ${size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs md:text-[13px]'} font-bold rounded-xl transition-colors ${value === v ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
        {value === v && <motion.span layoutId={`seg-${options.map(o => o[0]).join('')}`} className="absolute inset-0 -z-10 rounded-xl bg-white" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
        {l}
      </button>
    ))}
  </div>
);

interface ChartsProps {
  artists: Artist[]; albums: Album[]; tracks: Track[];
  navigateTo: (view: ViewType, params?: any) => void;
  onPlayTrack: (t: Track) => void;
  toggleLikeTrack?: (id: string) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string; isPlaying?: boolean;
  followedArtistIds?: string[]; toggleFollowArtist?: (id: string) => void;
  referenceDate?: string;
  onMoreOptionsClick?: (item: any) => void;
}

export const ChartsPro: React.FC<ChartsProps> = ({ artists, albums, tracks, navigateTo, onPlayTrack, openLightbox, currentTrackId, isPlaying, referenceDate, onMoreOptionsClick, followedArtistIds = [], toggleFollowArtist }) => {
  usePlusCss();
  const nowRef = useMemo(() => refToMs(referenceDate), [referenceDate]);
  const [kind, setKindRaw] = useState<ChartKind>(() => lsGet<ChartKind>('musaic.charts.kind', 'tracks'));
  const setKind = (k: ChartKind) => { setKindRaw(k); lsSet('musaic.charts.kind', k); };
  const [mode, setMode] = useState<ChartMode>('now');
  const [chartDate, setChartDate] = useState<string>('');
  const [preset, setPreset] = useState<'30' | '90' | '365' | 'year' | 'custom'>('30');
  const [pYear, setPYear] = useState<number>(() => new Date(nowRef).getUTCFullYear());
  const [cFrom, setCFrom] = useState('');
  const [cTo, setCTo] = useState('');
  const [historyId, setHistoryId] = useState<string | null>(null);

  const ents = useMemo(() => buildEntities(artists, albums, tracks, nowRef), [artists, albums, tracks, nowRef]);
  const minMs = useMemo(() => {
    let m = Infinity; ents.trackEnts.forEach(e => { if (e.releaseMs < m) m = e.releaseMs; }); ents.albumEnts.forEach(e => { if (e.releaseMs < m) m = e.releaseMs; });
    return Number.isFinite(m) ? m : nowRef - 365 * DAY;
  }, [ents, nowRef]);
  const years = useMemo(() => { const out: number[] = []; for (let y = new Date(nowRef).getUTCFullYear(); y >= new Date(minMs).getUTCFullYear() && out.length < 12; y--) out.push(y); return out; }, [minMs, nowRef]);

  const T = useMemo(() => { const p = chartDate ? parseDayMs(chartDate) : null; return p !== null ? Math.min(p, nowRef) : nowRef; }, [chartDate, nowRef]);
  const [A, B] = useMemo<[number, number]>(() => {
    if (preset === 'year') return [Date.UTC(pYear, 0, 1) - DAY, Math.min(nowRef, Date.UTC(pYear, 11, 31))];
    if (preset === 'custom') {
      const f = parseDayMs(cFrom) ?? nowRef - 30 * DAY; const t = parseDayMs(cTo) ?? nowRef;
      return [Math.min(f, t), Math.min(nowRef, Math.max(f, t))];
    }
    return [nowRef - +preset * DAY, nowRef];
  }, [preset, pYear, cFrom, cTo, nowRef]);

  const rows = useMemo(() => (mode === 'period' ? rankChart(ents, kind, 'period', B, A) : rankChart(ents, kind, mode, T)), [ents, kind, mode, T, A, B]);
  const hist = useChartHistory(ents, kind, T);
  const histFresh = hist.kind === kind && hist.T === T && hist.ents === ents;
  const info = useCallback((id: string) => (histFresh ? infoFrom(hist.weeks, id) : undefined), [hist, histFresh]);

  // extra data for the artists chart
  const trackTop = useMemo(() => (kind === 'artists' ? rankChart(ents, 'tracks', mode === 'period' ? 'period' : mode, mode === 'period' ? B : T, A) : []), [ents, kind, mode, T, A, B]);
  const artistExtras = useMemo(() => {
    const m = new Map<string, { entries: number; hit?: ChartRow; hitRank?: number }>();
    trackTop.forEach((r, i) => r.e.credits!.forEach(([id]) => {
      const x = m.get(id) || { entries: 0 };
      x.entries++; if (!x.hit) { x.hit = r; x.hitRank = i + 1; }
      m.set(id, x);
    }));
    return m;
  }, [trackTop]);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    if (mode !== 'now' || !histFresh) {
      const total = rows.reduce((s, r) => s + r.v, 0);
      const byArtist = new Map<string, number>();
      if (kind !== 'artists') rows.forEach(r => { const k = (r.e.ref.artistName || '').trim(); if (k) byArtist.set(k, (byArtist.get(k) || 0) + 1); });
      const most = [...byArtist.entries()].sort((a, b) => b[1] - a[1])[0];
      return { kind: 'sum' as const, leader: rows[0], total, most };
    }
    const infos = rows.map((r, i) => ({ r, i: infoFrom(hist.weeks, r.e.id), rank: i + 1 }));
    const debut = infos.filter(x => x.i.status === 'new')[0];
    const climber = [...infos].filter(x => x.i.status === 'up').sort((a, b) => b.i.delta - a.i.delta)[0];
    return { kind: 'week' as const, leader: rows[0], leaderInfo: infos[0].i, debut, climber, newCount: infos.filter(x => x.i.status === 'new').length };
  }, [rows, mode, hist, histFresh, kind]);

  const shiftWeek = (k: number) => {
    const next = T + k * 7 * DAY;
    if (next >= nowRef) setChartDate(''); else setChartDate(toISO(Math.max(minMs, next)));
  };
  const valueLabel = mode === 'now' ? 'за неделю' : mode === 'all' ? 'всего' : 'за период';
  const periodLabel = mode === 'now' ? `Неделя ${fmtDayShort(T - 6 * DAY)} – ${fmtDay(T)}` : mode === 'all' ? `На ${fmtDay(T)}` : `${fmtDay(A + DAY)} – ${fmtDay(B)}`;
  const limit = LIMIT[kind];
  const playTrackOf = (e: ChartEnt) => {
    if (kind === 'tracks') onPlayTrack(e.ref);
    else if (kind === 'albums') { const t = tracks.find(x => x.albumId === e.id && !x.isSnippet); if (t) onPlayTrack(t); }
    else { const t = trackTop.find(r => r.e.credits!.some(([id]) => id === e.id))?.e.ref || tracks.filter(x => x.artistId === e.id).sort((a, b) => b.plays - a.plays)[0]; if (t) onPlayTrack(t); }
  };
  const openItem = (e: ChartEnt) => {
    if (kind === 'tracks') navigateTo('track', { id: e.id });
    else if (kind === 'albums') navigateTo('album', { id: e.id });
    else navigateTo('artist', { id: e.id, artistName: e.title });
  };
  const openArtistByName = (name?: string) => {
    if (!name) return;
    const a = artists.find(x => norm(x.name) === norm(name));
    navigateTo('artist', a ? { id: a.id, artistName: a.name } : { id: `guest_${name}`, artistName: name });
  };
  const zoom = (e: ChartEnt) => openLightbox({ url: e.cover, title: e.title, subtitle: e.isArtist ? undefined : e.sub, type: kind === 'tracks' ? 'Трек' : kind === 'albums' ? 'Альбом' : 'Артист' });
  const histRow = historyId ? (rows.find(r => r.e.id === historyId)?.e || (kind === 'tracks' ? ents.trackEnts : kind === 'albums' ? ents.albumEnts : ents.artistEnts).find(e => e.id === historyId)) : undefined;

  return (
    <div className="min-h-full pb-28">
      {/* header */}
      <div className="relative overflow-hidden px-6 md:px-8 pt-10 pb-8">
        <div className="absolute inset-0 pointer-events-none">
          {rows[0]?.e.cover && <img src={resolveMedia(rows[0].e.cover, { title: rows[0].e.title, isArtist: kind === 'artists' })} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 blur-[90px] scale-125" />}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-color)]/40 to-[var(--bg-color)]" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-2">Musaic Charts</div>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
                {kind === 'tracks' ? 'Топ-100 треков' : kind === 'albums' ? 'Топ-50 альбомов' : 'Топ-100 артистов'}
              </h1>
              <div className="mt-3 text-sm text-zinc-400 font-semibold">{periodLabel}</div>
            </div>
            <Seg2 value={kind} onChange={setKind} options={[['tracks', 'Треки'], ['albums', 'Альбомы'], ['artists', 'Артисты']]} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Seg2 size="sm" value={mode} onChange={setMode} options={[['now', 'Сейчас'], ['all', 'За всё время'], ['period', 'Период']]} />
            {mode !== 'period' ? (
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                <button type="button" onClick={() => shiftWeek(-1)} className="w-8 h-8 rounded-xl text-zinc-300 hover:bg-white/10" title="Неделей раньше">‹</button>
                <input type="date" value={chartDate || toISO(nowRef)} min={toISO(minMs)} max={toISO(nowRef)} onChange={e => setChartDate(e.target.value >= toISO(nowRef) ? '' : e.target.value)}
                  className="bg-transparent text-[12px] font-bold text-white outline-none px-1 [color-scheme:dark]" />
                <button type="button" onClick={() => shiftWeek(1)} disabled={!chartDate} className="w-8 h-8 rounded-xl text-zinc-300 hover:bg-white/10 disabled:opacity-30" title="Неделей позже">›</button>
                {chartDate && <button type="button" onClick={() => setChartDate('')} className="px-2.5 h-8 rounded-xl text-[11px] font-black text-black bg-white">Сейчас</button>}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                {([['30', '30 дней'], ['90', '3 месяца'], ['365', '12 месяцев'], ['year', 'Год'], ['custom', 'Свой']] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setPreset(v)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${preset === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>{l}</button>
                ))}
                {preset === 'year' && (
                  <select value={pYear} onChange={e => setPYear(+e.target.value)} className="bg-black/40 text-[12px] font-bold text-white rounded-lg px-2 py-1 outline-none">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
                {preset === 'custom' && (
                  <>
                    <input type="date" value={cFrom} max={toISO(nowRef)} onChange={e => setCFrom(e.target.value)} className="bg-black/40 rounded-lg px-2 py-1 text-[12px] text-white outline-none [color-scheme:dark]" />
                    <span className="text-zinc-500 text-xs">—</span>
                    <input type="date" value={cTo} max={toISO(nowRef)} onChange={e => setCTo(e.target.value)} className="bg-black/40 rounded-lg px-2 py-1 text-[12px] text-white outline-none [color-scheme:dark]" />
                  </>
                )}
              </div>
            )}
          </div>

          {/* stats strip: four calm tiles */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {stats.kind === 'week' ? (
                <>
                  <StatTile label="№1 недели" title={stats.leader.e.title} sub={stats.leaderInfo.weeksAtOne > 1 ? `${stats.leaderInfo.weeksAtOne}-я неделя на вершине` : 'Первая неделя на вершине'} cover={stats.leader.e.cover} round={kind === 'artists'} accent="#fbbf24" onClick={() => setHistoryId(stats.leader.e.id)} />
                  <StatTile label="Лучший дебют" title={stats.debut ? stats.debut.r.e.title : '—'} sub={stats.debut ? `Дебют на #${stats.debut.rank}` : 'Новичков нет'} cover={stats.debut?.r.e.cover} round={kind === 'artists'} accent="#34d399" onClick={stats.debut ? () => setHistoryId(stats.debut!.r.e.id) : undefined} />
                  <StatTile label="Взлёт недели" title={stats.climber ? stats.climber.r.e.title : '—'} sub={stats.climber ? `▲ ${stats.climber.i.delta} · #${stats.climber.i.last} → #${stats.climber.rank}` : 'Без резких взлётов'} cover={stats.climber?.r.e.cover} round={kind === 'artists'} accent="#60a5fa" onClick={stats.climber ? () => setHistoryId(stats.climber!.r.e.id) : undefined} />
                  <StatTile label="Новинок в чарте" title={String(stats.newCount)} sub={`из ${rows.length} позиций`} big />
                </>
              ) : (
                <>
                  <StatTile label={mode === 'all' ? 'Лидер всех времён' : 'Лидер периода'} title={stats.leader.e.title} sub={`${fmtN(stats.leader.v)} ${valueLabel}`} cover={stats.leader.e.cover} round={kind === 'artists'} accent="#fbbf24" onClick={() => setHistoryId(stats.leader.e.id)} />
                  <StatTile label={`Сумма топ-${limit}`} title={fmtN(stats.total)} sub="прослушиваний" big />
                  <StatTile label="Чаще всех в чарте" title={stats.most ? stats.most[0] : '—'} sub={stats.most ? `${stats.most[1]} позиций` : 'Для артистов не считается'} />
                  <StatTile label="Позиций" title={String(rows.length)} sub={`максимум ${limit}`} big />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-8">
        {rows.length === 0 && <div className="py-24 text-center text-zinc-500 text-sm">На эту дату чарт пуст: релизов ещё нет.</div>}

        {/* artists: podium */}
        {kind === 'artists' && rows.length >= 3 && (
          <div className="grid grid-cols-3 gap-2.5 md:gap-4 mb-6">
            {[1, 0, 2].map(i => {
              const r = rows[i]; const ex = artistExtras.get(r.e.id); const inf = info(r.e.id);
              return (
                <motion.button key={r.e.id} type="button" onClick={() => openItem(r.e)} whileHover={{ y: -4 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`relative overflow-hidden rounded-3xl text-left border border-white/[0.08] bg-white/[0.03] ${i === 0 ? 'md:-mt-4' : 'md:mt-4'}`}>
                  <div className="aspect-[4/5] relative">
                    <CoverArt url={r.e.cover} title={r.e.title} isArtist className="absolute inset-0 w-full h-full" innerClassName="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className={`absolute top-3 left-3 w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center font-black text-black text-sm md:text-lg ${i === 0 ? 'bg-amber-300' : i === 1 ? 'bg-zinc-200' : 'bg-orange-300'}`}>{i + 1}</div>
                    <div className="absolute top-3 right-3"><MoveBadge info={inf} big /></div>
                    <div className="absolute bottom-0 inset-x-0 p-3 md:p-4">
                      {i === 0 && <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 mb-1">{mode === 'now' ? 'Артист недели' : 'Артист №1'}</div>}
                      <div className="text-sm md:text-2xl font-black text-white leading-tight truncate">{r.e.title}</div>
                      <div className="text-[10px] md:text-xs text-white/60 mt-0.5 truncate">{fmtN(r.e.ref.followers || 0)} слушателей{ex ? ` · ${ex.entries} в топ-100` : ''}</div>
                      {ex?.hit && <div className="hidden md:block text-[11px] text-white/80 mt-1 truncate">Главный хит: {ex.hit.e.title} · #{ex.hitRank}</div>}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
          <div className="hidden md:grid grid-cols-[64px_56px_1fr_110px_120px_120px] gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/[0.05]">
            <span className="text-center">#</span><span>Динамика</span><span>{kind === 'tracks' ? 'Трек' : kind === 'albums' ? 'Альбом' : 'Артист'}</span><span className="text-center">Пик · недель</span><span className="text-center">Тренд</span><span className="text-right">{valueLabel}</span>
          </div>
          {rows.map((r, i) => (kind === 'artists' && i < 3 ? null : (
            <ChartRowView key={r.e.id} rank={i + 1} row={r} kind={kind} info={info(r.e.id)} weeks={histFresh ? hist.weeks : undefined} limit={limit}
              extra={kind === 'artists' ? artistExtras.get(r.e.id) : undefined}
              playing={!!isPlaying && (kind === 'tracks' ? currentTrackId === r.e.id : false)}
              followed={kind === 'artists' && followedArtistIds.includes(r.e.id)}
              onFollow={kind === 'artists' && toggleFollowArtist ? () => toggleFollowArtist(r.e.id) : undefined}
              onOpen={() => openItem(r.e)} onArtist={openArtistByName} onPlay={() => playTrackOf(r.e)} onZoom={() => zoom(r.e)}
              onHistory={() => setHistoryId(r.e.id)} onMore={onMoreOptionsClick && kind === 'tracks' ? () => onMoreOptionsClick(r.e.ref) : undefined} />
          )))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-4 px-2 leading-relaxed">
          Чарт считается по недельным прослушиваниям: у каждого релиза быстрый старт и длинный хвост, промо и хайп влияют на долготу жизни.
          Нажми на строку, чтобы открыть историю позиций.
        </p>
      </div>

      <AnimatePresence>
        {histRow && (
          <ChartHistoryModal key="hist" e={histRow} kind={kind} weeks={hist.weeks} T={hist.T} limit={limit}
            onClose={() => setHistoryId(null)} onOpen={() => { setHistoryId(null); openItem(histRow); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatTile: React.FC<{ label: string; title: string; sub?: string; cover?: string; round?: boolean; accent?: string; big?: boolean; onClick?: () => void }> = ({ label, title, sub, cover, round, accent, big, onClick }) => (
  <button type="button" onClick={onClick} disabled={!onClick}
    className="relative overflow-hidden text-left rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] disabled:hover:bg-white/[0.04] border border-white/[0.07] p-3 flex items-center gap-3 transition-colors">
    {cover !== undefined && (
      <div className={`w-11 h-11 shrink-0 overflow-hidden bg-zinc-800 ${round ? 'rounded-full' : 'rounded-xl'}`}>
        <CoverArt url={cover} title={title} isArtist={round} className="w-full h-full" innerClassName="w-full h-full object-cover" />
      </div>
    )}
    <div className="min-w-0">
      <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent || '#71717a' }}>{label}</div>
      <div className={`${big ? 'text-2xl' : 'text-[13px]'} font-black text-white truncate leading-tight mt-0.5`}>{title}</div>
      {sub && <div className="text-[11px] text-zinc-500 truncate">{sub}</div>}
    </div>
  </button>
);

const ChartRowView: React.FC<{
  rank: number; row: ChartRow; kind: ChartKind; info?: ChartInfo; weeks?: Array<Map<string, number>>; limit: number;
  extra?: { entries: number; hit?: ChartRow; hitRank?: number }; playing: boolean; followed?: boolean; onFollow?: () => void;
  onOpen: () => void; onArtist: (name?: string) => void; onPlay: () => void; onZoom: () => void; onHistory: () => void; onMore?: () => void;
}> = memo(({ rank, row, kind, info, weeks, limit, extra, playing, followed, onFollow, onOpen, onArtist, onPlay, onZoom, onHistory, onMore }) => {
  const e = row.e;
  const top10 = rank <= 10;
  const leadName: string | undefined = kind === 'artists' ? undefined : e.ref.artistName;
  return (
    <div onClick={onHistory}
      className={`mp-cv mp-row group grid grid-cols-[40px_1fr_auto] md:grid-cols-[64px_56px_1fr_110px_120px_120px] items-center gap-2 md:gap-3 px-3 md:px-4 py-2 border-b border-white/[0.035] last:border-b-0 hover:bg-white/[0.045] cursor-pointer ${playing ? 'bg-white/[0.06]' : ''}`}>
      <div className="flex flex-col items-center justify-center">
        <span className={`tabular-nums font-black leading-none ${rank === 1 ? 'text-3xl text-amber-300' : top10 ? 'text-2xl text-white' : 'text-lg text-zinc-400'}`}>{rank}</span>
        <span className="md:hidden mt-1"><MoveBadge info={info} /></span>
      </div>
      <div className="hidden md:flex justify-start"><MoveBadge info={info} big /></div>
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0" onClick={ev => { ev.stopPropagation(); onZoom(); }}>
          <CoverArt url={e.cover} title={e.title} isArtist={kind === 'artists'}
            className={`w-11 h-11 md:w-12 md:h-12 overflow-hidden bg-zinc-800 cursor-zoom-in ${kind === 'artists' ? 'rounded-full' : 'rounded-lg'}`} innerClassName="w-full h-full object-cover" />
          <button type="button" onClick={ev => { ev.stopPropagation(); onPlay(); }} title="Слушать"
            className={`absolute inset-0 flex items-center justify-center bg-black/55 text-white transition-opacity ${kind === 'artists' ? 'rounded-full' : 'rounded-lg'} ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {playing ? <Eq /> : <span className="text-sm">▶</span>}
          </button>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span onClick={ev => { ev.stopPropagation(); onOpen(); }} className={`truncate font-bold hover:underline ${playing ? 'theme-accent' : 'text-white'} ${top10 ? 'text-[15px]' : 'text-[14px]'}`}>{e.title}</span>
            {e.explicit && <span className="shrink-0 text-[9px] font-black px-1 rounded bg-white/15 text-zinc-300">E</span>}
            {info?.peak === rank && info.weeksOn > 1 && info.status !== 'same' && <span className="shrink-0 text-[9px] font-black px-1.5 rounded bg-amber-400/15 text-amber-300">ПИК</span>}
            {info && info.weeksAtOne > 0 && rank !== 1 && <span className="hidden sm:inline shrink-0 text-[9px] font-black px-1.5 rounded bg-white/[0.07] text-zinc-300" title="Недель на №1">👑 {info.weeksAtOne}</span>}
          </div>
          <div className="text-[12px] text-zinc-500 truncate">
            {kind === 'artists' ? (
              <>{fmtN(e.ref.followers || 0)} слушателей{extra ? ` · ${extra.entries} в топ-100` : ''}{extra?.hit ? ` · хит: ${extra.hit.e.title}` : ''}</>
            ) : (
              <span onClick={ev => { ev.stopPropagation(); onArtist(leadName); }} className="hover:text-white hover:underline">{e.sub}</span>
            )}
          </div>
        </div>
      </div>
      <div className="hidden md:flex flex-col items-center text-[12px] tabular-nums">
        <span className="font-black text-white">{info?.peak ? `#${info.peak}` : '—'}</span>
        <span className="text-[10px] text-zinc-500">{info?.weeksOn ? `${info.weeksOn} нед.` : 'вне чарта'}</span>
      </div>
      <div className="hidden md:flex justify-center text-zinc-300">{weeks && <RankSpark weeks={weeks} id={e.id} limit={limit} />}</div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-right">
          <div className="text-[13px] font-black text-white tabular-nums">{fmtN(row.v)}</div>
          <div className="text-[10px] text-zinc-600 md:hidden">{info?.weeksOn ? `${info.weeksOn} нед. · пик #${info.peak}` : ''}</div>
        </div>
        {onFollow && (
          <button type="button" onClick={ev => { ev.stopPropagation(); onFollow(); }} className={`hidden sm:block text-[10px] font-black px-2 py-1 rounded-full border ${followed ? 'bg-white text-black border-white' : 'border-white/15 text-zinc-300 hover:text-white'}`}>{followed ? '✓' : '+'}</button>
        )}
        {onMore && <button type="button" onClick={ev => { ev.stopPropagation(); onMore(); }} className="w-7 h-7 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">⋯</button>}
      </div>
    </div>
  );
});

const ChartHistoryModal: React.FC<{ e: ChartEnt; kind: ChartKind; weeks: Array<Map<string, number>>; T: number; limit: number; onClose: () => void; onOpen: () => void }> = ({ e, kind, weeks, T, limit, onClose, onOpen }) => {
  useEsc(true, onClose);
  const inf = infoFrom(weeks, e.id);
  const pts = weeks.map((w, k) => ({ k, r: w.get(e.id), units: e.isArtist ? 0 : weeklyAt(e, T - k * 7 * DAY) })).reverse(); // oldest -> newest
  const firstIdx = pts.findIndex(p => p.r !== undefined);
  const view = firstIdx > 0 ? pts.slice(Math.max(0, firstIdx - 2)) : pts;
  const W = 640, H = 220, P = 28;
  const x = (i: number) => P + (i / Math.max(1, view.length - 1)) * (W - P * 2);
  const y = (r: number) => P + ((r - 1) / Math.max(1, limit - 1)) * (H - P * 2);
  let d = ''; let pen = false;
  view.forEach((p, i) => { if (p.r === undefined) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.r).toFixed(1)} `; pen = true; });
  const [hover, setHover] = useState<number | null>(null);
  const hp = hover !== null ? view[hover] : null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#0e0f13]">
          <div className="relative overflow-hidden">
            {e.cover && <img src={resolveMedia(e.cover, { title: e.title, isArtist: e.isArtist })} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-3xl scale-125" />}
            <div className="relative p-5 sm:p-6 flex items-center gap-4">
              <CoverArt url={e.cover} title={e.title} isArtist={e.isArtist} className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden shadow-2xl ${e.isArtist ? 'rounded-full' : 'rounded-2xl'}`} innerClassName="w-full h-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">История в чарте</div>
                <div className="text-xl sm:text-3xl font-black text-white truncate">{e.title}</div>
                {!e.isArtist && <div className="text-sm text-zinc-400 truncate">{e.sub}</div>}
              </div>
              <button type="button" onClick={onClose} className="self-start w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/70 text-xl">×</button>
            </div>
          </div>
          <div className="px-5 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ['Сейчас', inf.rank ? `#${inf.rank}` : 'вне чарта', inf.status === 'new' ? 'дебют недели' : inf.status === 're' ? 'возвращение' : inf.delta ? `${inf.delta > 0 ? '▲' : '▼'} ${Math.abs(inf.delta)}` : ''],
              ['Пик', inf.peak ? `#${inf.peak}` : '—', inf.weeksAtOne ? `${inf.weeksAtOne} нед. на №1` : ''],
              ['Недель в чарте', String(inf.weeksOn), `за последний год`],
              ['Дебют', inf.debutRank ? `#${inf.debutRank}` : '—', inf.debutWeek !== undefined ? fmtDay(T - inf.debutWeek * 7 * DAY) : '']
            ].map(([l, v, s]) => (
              <div key={l} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{l}</div>
                <div className="text-xl font-black text-white tabular-nums">{v}</div>
                <div className="text-[11px] text-zinc-500 truncate">{s || '\u00a0'}</div>
              </div>
            ))}
          </div>
          <div className="px-3 sm:px-6 pt-5">
            {inf.weeksOn === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">За последний год релиз не попадал в топ-{limit}.</div>
            ) : (
              <div className="relative">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
                  {[1, Math.ceil(limit / 4), Math.ceil(limit / 2), limit].map(r => (
                    <g key={r}><line x1={P} x2={W - P} y1={y(r)} y2={y(r)} stroke="rgba(255,255,255,0.06)" /><text x={4} y={y(r) + 3} fontSize={9} fill="#71717a">#{r}</text></g>
                  ))}
                  <motion.path d={d} fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
                  {view.map((p, i) => p.r !== undefined && (
                    <circle key={i} cx={x(i)} cy={y(p.r)} r={hover === i ? 5 : p.r === inf.peak ? 4 : 2.4} fill={p.r === 1 ? '#fbbf24' : p.r === inf.peak ? '#fbbf24' : 'white'} />
                  ))}
                  {view.map((_, i) => (
                    <rect key={`h${i}`} x={x(i) - (W - P * 2) / view.length / 2} y={0} width={(W - P * 2) / view.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
                  ))}
                </svg>
                <div className="h-6 text-center text-[12px] text-zinc-300 tabular-nums">
                  {hp ? <>Неделя до {fmtDay(T - hp.k * 7 * DAY)} · {hp.r ? <b className="text-white">#{hp.r}</b> : 'вне чарта'}{hp.units > 0 ? ` · ${fmtN(hp.units)} прослушиваний` : ''}</> : <span className="text-zinc-600">Наведи на график, чтобы увидеть неделю</span>}
                </div>
              </div>
            )}
          </div>
          <div className="px-5 sm:px-6 pb-6 pt-3">
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2">
              {pts.slice(-16).reverse().map(p => (
                <div key={p.k} className={`shrink-0 rounded-xl px-2.5 py-1.5 text-center ${p.r ? 'bg-white/[0.06]' : 'bg-white/[0.02]'}`}>
                  <div className="text-[10px] text-zinc-500">{fmtDayShort(T - p.k * 7 * DAY)}</div>
                  <div className={`text-[13px] font-black tabular-nums ${p.r === 1 ? 'text-amber-300' : p.r ? 'text-white' : 'text-zinc-600'}`}>{p.r ? `#${p.r}` : '—'}</div>
                </div>
              ))}
            </div>
            <button type="button" onClick={onOpen} className="mt-3 w-full py-3 rounded-2xl bg-white text-black text-sm font-black">
              Открыть {kind === 'tracks' ? 'трек' : kind === 'albums' ? 'альбом' : 'артиста'}
            </button>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
};

// ---------------------------------------------------------------------------
// 3. RELEASE STAGE — the whole release page adapts to the cover and the mood
// Turn on/off with the «Атмосфера» chip on the page (remembered).
// ---------------------------------------------------------------------------
type StageMood = 'night' | 'fire' | 'ice' | 'love' | 'dark' | 'bright' | 'haze' | 'rain';
const MOOD_LABEL: Record<StageMood, string> = { night: 'Ночь', fire: 'Огонь', ice: 'Холод', love: 'Нежность', dark: 'Тьма', bright: 'Свет', haze: 'Дымка', rain: 'Дождь' };
const stageStore = createStore<'on' | 'off'>(typeof localStorage !== 'undefined' ? (localStorage.getItem('musaic.stage') === 'off' ? 'off' : 'on') : 'on');
const setStage = (v: 'on' | 'off') => { try { localStorage.setItem('musaic.stage', v); } catch { /* */ } stageStore.set(v); };

interface PaletteInfo { colors: string[]; lum: number; sat: number }
const paletteCache = new Map<string, PaletteInfo>();
function readPalette(src: string): Promise<PaletteInfo | null> {
  if (paletteCache.has(src)) return Promise.resolve(paletteCache.get(src)!);
  return new Promise(res => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = 28; c.height = 28;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, 28, 28);
        const data = ctx.getImageData(0, 0, 28, 28).data;
        const buckets = new Map<number, { r: number; g: number; b: number; w: number }>();
        let lumSum = 0, satSum = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          const l = (mx + mn) / 510; const s = mx === mn ? 0 : (mx - mn) / (255 - Math.abs(mx + mn - 255) || 1);
          lumSum += l; satSum += s; n++;
          let h = 0;
          if (mx !== mn) { const dd = mx - mn; h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h = (h * 60 + 360) % 360; }
          const key = s < 0.12 ? 1000 + Math.round(l * 4) : Math.round(h / 30);
          const w = 0.25 + s * 1.6 + (l > 0.15 && l < 0.85 ? 0.5 : 0);
          const bk = buckets.get(key) || { r: 0, g: 0, b: 0, w: 0 };
          bk.r += r * w; bk.g += g * w; bk.b += b * w; bk.w += w; buckets.set(key, bk);
        }
        const colors = [...buckets.values()].sort((a, b) => b.w - a.w).slice(0, 4)
          .map(bk => `rgb(${Math.round(bk.r / bk.w)}, ${Math.round(bk.g / bk.w)}, ${Math.round(bk.b / bk.w)})`);
        const out = { colors: colors.length ? colors : ['rgb(99,102,241)'], lum: lumSum / n, sat: satSum / n };
        paletteCache.set(src, out); res(out);
      } catch { res(null); }
    };
    img.onerror = () => res(null);
    img.src = src;
  });
}
const has = (s: string, words: string[]) => words.some(w => s.includes(w));
function detectMood(title: string, genre: string, pal: PaletteInfo | null): StageMood {
  const t = norm(title); const g = norm(genre);
  if (has(t, ['ноч', 'night', 'луна', 'moon', 'звезд', 'star', 'космос', 'space', 'midnight', 'полноч'])) return 'night';
  if (has(t, ['огон', 'огн', 'fire', 'flame', 'пламя', 'жар', 'heat', 'burn', 'горю', 'пожар', 'inferno'])) return 'fire';
  if (has(t, ['лёд', 'лед', 'ice', 'snow', 'снег', 'зим', 'winter', 'холод', 'cold', 'frost', 'мороз', 'freeze'])) return 'ice';
  if (has(t, ['дожд', 'rain', 'слез', 'tears', 'storm', 'гроз', 'ливень'])) return 'rain';
  if (has(t, ['love', 'любов', 'люблю', 'сердц', 'heart', 'kiss', 'поцел', 'baby', 'малыш', 'детка'])) return 'love';
  if (has(g, ['phonk', 'фонк', 'drill', 'дрилл', 'horrorcore', 'metal', 'industrial', 'dark', 'hardstyle'])) return 'dark';
  if (has(g, ['pop', 'поп', 'dance', 'house', 'edm', 'hyperpop', 'disco', 'k-pop', 'funk'])) return pal && pal.lum < 0.22 ? 'night' : 'bright';
  if (has(g, ['lo-fi', 'lofi', 'indie', 'инди', 'ambient', 'r&b', 'rnb', 'soul', 'emo', 'эмо'])) return 'haze';
  if (pal) { if (pal.lum < 0.18) return 'dark'; if (pal.lum > 0.62 && pal.sat > 0.3) return 'bright'; }
  return 'haze';
}

const Particles: React.FC<{ mood: StageMood; color: string }> = memo(({ mood, color }) => {
  const parts = useMemo(() => {
    const r = seeded(hashStr(mood + color));
    const n = mood === 'night' ? 36 : mood === 'ice' || mood === 'rain' ? 26 : mood === 'fire' ? 22 : mood === 'love' || mood === 'bright' ? 9 : mood === 'haze' ? 6 : 0;
    return Array.from({ length: n }, (_, i) => ({ i, x: r() * 100, y: r() * 100, s: r(), d: r() }));
  }, [mood, color]);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {parts.map(p => {
        if (mood === 'night') return <span key={p.i} className="absolute rounded-full bg-white" style={{ left: `${p.x}%`, top: `${p.y * 70}%`, width: 1 + p.s * 2.2, height: 1 + p.s * 2.2, animation: `mp-twinkle ${2.5 + p.d * 4}s ease-in-out ${-p.d * 6}s infinite`, boxShadow: '0 0 6px rgba(255,255,255,.8)' }} />;
        if (mood === 'fire') return <span key={p.i} className="absolute bottom-0 rounded-full" style={{ left: `${p.x}%`, width: 2 + p.s * 4, height: 2 + p.s * 4, background: p.s > 0.5 ? '#ffb347' : color, filter: 'blur(.5px)', boxShadow: `0 0 10px ${color}`, ['--dx' as any]: `${(p.d - 0.5) * 120}px`, animation: `mp-rise ${7 + p.d * 8}s linear ${-p.s * 12}s infinite` }} />;
        if (mood === 'ice') return <span key={p.i} className="absolute top-0 rounded-full bg-white/80" style={{ left: `${p.x}%`, width: 2 + p.s * 3, height: 2 + p.s * 3, filter: 'blur(.6px)', ['--dx' as any]: `${(p.d - 0.5) * 160}px`, animation: `mp-fall ${10 + p.d * 10}s linear ${-p.s * 18}s infinite` }} />;
        if (mood === 'rain') return <span key={p.i} className="absolute top-0" style={{ left: `${p.x}%`, width: 1, height: 26 + p.s * 30, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,.35))', ['--dx' as any]: `-40px`, animation: `mp-fall ${1.6 + p.d * 1.4}s linear ${-p.s * 3}s infinite` }} />;
        // love / bright / haze: soft bokeh
        return <span key={p.i} className="absolute rounded-full" style={{ left: `${p.x}%`, top: `${p.y * 80}%`, width: 60 + p.s * 160, height: 60 + p.s * 160, background: `radial-gradient(circle, ${mood === 'love' ? '#ff8fb1' : color} 0%, transparent 70%)`, opacity: mood === 'haze' ? 0.18 : 0.28, filter: 'blur(10px)', ['--dx' as any]: `${(p.d - 0.5) * 80}px`, ['--dy' as any]: `${(p.s - 0.5) * 80}px`, animation: `mp-float ${12 + p.d * 10}s ease-in-out ${-p.s * 10}s infinite` }} />;
      })}
    </div>
  );
});

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>\")";

export const ReleaseStage: React.FC<{
  kind: 'track' | 'album'; id: string; cover?: string; title: string; artistName?: string; genre?: string;
  releaseDate?: string; plays?: number; referenceDate?: string;
}> = ({ kind, id, cover, title, artistName, genre, releaseDate, plays = 0, referenceDate }) => {
  usePlusCss();
  const on = useStore(stageStore) === 'on';
  const src = resolveMedia(cover, { id, title, artistName });
  const [pal, setPal] = useState<PaletteInfo | null>(() => (src ? paletteCache.get(src) || null : null));
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    if (!src) { setPal(null); return; }
    readPalette(src).then(p => { if (alive) setPal(p); });
    return () => { alive = false; };
  }, [src]);
  const mood = useMemo(() => detectMood(title, genre || '', pal), [title, genre, pal]);
  const c0 = pal?.colors[0] || `hsl(${hueOf(title)} 55% 45%)`;
  const c1 = pal?.colors[1] || `hsl(${(hueOf(title) + 50) % 360} 50% 30%)`;
  const c2 = pal?.colors[2] || c1;

  // page accent = cover colour (buttons, links on the page follow the release)
  useEffect(() => {
    const host = hostRef.current?.parentElement;
    if (!host) return;
    if (!on) return;
    const had = host.classList.contains('page-accent-scope');
    const prev = host.style.getPropertyValue('--page-accent');
    host.classList.add('page-accent-scope');
    host.style.setProperty('--page-accent', c0);
    return () => { if (!had) host.classList.remove('page-accent-scope'); if (prev) host.style.setProperty('--page-accent', prev); else host.style.removeProperty('--page-accent'); };
  }, [on, c0]);

  const age = useMemo(() => { const r = parseDayMs(releaseDate); return r === null ? null : Math.floor((refToMs(referenceDate) - r) / DAY); }, [releaseDate, referenceDate]);
  const tag = age !== null && age >= 0 && age <= 14 ? (age === 0 ? 'Вышел сегодня' : `Новый релиз · ${age} дн.`) : age !== null && age < 0 ? `Выйдет через ${-age} дн.` : null;
  const milestone = plays >= 1e9 ? '💎 Миллиард' : plays >= 5e8 ? '500M+' : plays >= 1e8 ? '100M+' : plays >= 5e7 ? '50M+' : plays >= 1e7 ? '10M+' : null;
  const dim = pal ? clamp(0.35 + (pal.lum - 0.4) * 0.6, 0.25, 0.6) : 0.45;

  return (
    <div ref={hostRef} className="contents">
      {on && (
        <div aria-hidden className="mp-anim absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
          <div className="sticky top-0 h-[100vh] w-full overflow-hidden">
            {src && <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.35] blur-[80px] opacity-55" />}
            <div className="absolute -inset-[20%]" style={{ background: `radial-gradient(40% 45% at 25% 30%, ${c0} 0%, transparent 70%), radial-gradient(45% 50% at 78% 25%, ${c1} 0%, transparent 70%), radial-gradient(50% 40% at 55% 85%, ${c2} 0%, transparent 70%)`, opacity: mood === 'dark' ? 0.35 : 0.55, animation: 'mp-aurora 26s ease-in-out infinite', filter: 'blur(30px)' }} />
            <Particles mood={mood} color={c0} />
            {mood === 'dark' && <div className="absolute inset-0 mix-blend-overlay opacity-40" style={{ backgroundImage: GRAIN, animation: 'mp-pulse 6s ease-in-out infinite' }} />}
            {mood === 'night' && <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,8,25,.55), transparent 60%)' }} />}
            <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim})` }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 30%, transparent 45%, rgba(0,0,0,.55) 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--bg-color,#09090b)] to-transparent" />
          </div>
        </div>
      )}
      <div className="absolute top-3 right-3 md:top-4 md:right-6 z-30 flex items-center gap-1.5">
        {on && tag && <span className="hidden sm:inline px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-black" style={{ background: c0 }}>{tag}</span>}
        {on && milestone && <span className="hidden sm:inline px-2.5 py-1 rounded-full text-[10px] font-black bg-black/40 backdrop-blur-md border border-white/15 text-white">{milestone}</span>}
        <button type="button" onClick={() => setStage(on ? 'off' : 'on')} title={on ? 'Выключить атмосферу релиза' : 'Включить атмосферу релиза'}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border transition-colors ${on ? 'bg-white/[0.12] border-white/20 text-white' : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'}`}>
          ✦ {on ? `${MOOD_LABEL[mood]} · ${kind === 'album' ? 'альбом' : 'трек'}` : 'Атмосфера'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. ARTIST AWARDS — minimal button on the profile + beautiful awards modal
// ---------------------------------------------------------------------------
const MAJOR_KEYS = ['artist_of_year', 'album_of_year', 'track_of_year', 'artist_of_month'];
const MONTH_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const periodOf = (a: AwardItem) => (a.periodType === 'year' ? `${a.year} год` : `${MONTHS_FULL[+(a.month || 1) - 1]} ${a.year}`);
const awardSortTs = (a: AwardItem) => Date.UTC(+a.year, a.periodType === 'year' ? 11 : +(a.month || 1) - 1, a.periodType === 'year' ? 31 : 28);

function artistMatches(name: string, title?: string, artistName?: string) {
  const n = norm(name);
  if (norm(title) === n) return true;
  return splitNames(artistName).map(norm).includes(n);
}

export const ArtistAwardsButton: React.FC<{
  artist: { id: string; name: string; imageUrl?: string };
  tracks: Track[];
  navigateTo: (view: ViewType, params?: any) => void;
}> = ({ artist, tracks, navigateTo }) => {
  usePlusCss();
  const awards = useStore(awardsStore);
  const [open, setOpen] = useState(false);
  const data = useMemo(() => {
    const won: AwardItem[] = []; const noms: Array<{ a: AwardItem; place: number; pct?: number; title: string }> = [];
    for (const a of awards) {
      const w = a.winner;
      const isWin = w.type === 'artist' ? norm(w.title) === norm(artist.name) : artistMatches(artist.name, undefined, w.artistName);
      if (isWin) { won.push(a); continue; }
      const list = [...(a.nominees || [])].sort((x, y) => (y.votesPercent || 0) - (x.votesPercent || 0));
      const idx = list.findIndex(nm => (nm.type === 'artist' || !nm.artistName) ? norm(nm.title) === norm(artist.name) : artistMatches(artist.name, undefined, nm.artistName));
      if (idx >= 0) noms.push({ a, place: idx + 1, pct: list[idx].votesPercent, title: list[idx].title });
    }
    won.sort((x, y) => awardSortTs(y) - awardSortTs(x));
    noms.sort((x, y) => awardSortTs(y.a) - awardSortTs(x.a));
    const major = won.filter(a => a.periodType === 'year' || MAJOR_KEYS.includes(a.nominationKey));
    const minor = won.filter(a => !major.includes(a));
    const mine = tracks.filter(t => isLeadOf(t, artist) && t.peakChartPosition && t.peakChartPosition > 0);
    const no1 = mine.filter(t => t.peakChartPosition === 1).length;
    const top10 = mine.filter(t => (t.peakChartPosition || 99) <= 10).length;
    return { won, major, minor, noms, no1, top10 };
  }, [awards, artist.id, artist.name, tracks]);

  if (!data.won.length && !data.noms.length && !data.top10) return null;
  return (
    <>
      <motion.button type="button" onClick={() => setOpen(true)} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
        className="group mb-6 inline-flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors">
        <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-black shadow-[0_0_24px_-4px_rgba(251,191,36,.7)]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
        </span>
        <span className="text-[13px] font-black text-white">Награды</span>
        <span className="text-[12px] text-zinc-400 tabular-nums">
          {data.won.length > 0 && <>🏆 {data.won.length}</>}{data.major.length > 0 && <> · главных {data.major.length}</>}{data.noms.length > 0 && <> · номинаций {data.noms.length}</>}
        </span>
        <span className="text-zinc-500 group-hover:text-white transition-colors">→</span>
      </motion.button>
      <AnimatePresence>{open && <AwardsModal key="aw" artist={artist} data={data} onClose={() => setOpen(false)} navigateTo={navigateTo} />}</AnimatePresence>
    </>
  );
};

const AwardsModal: React.FC<{ artist: { id: string; name: string; imageUrl?: string }; data: any; onClose: () => void; navigateTo: (v: ViewType, p?: any) => void }> = ({ artist, data, onClose, navigateTo }) => {
  useEsc(true, onClose);
  const [tab, setTab] = useState<'wins' | 'noms'>(data.won.length ? 'wins' : 'noms');
  const byYear = useMemo(() => {
    const m = new Map<string, AwardItem[]>();
    (data.minor as AwardItem[]).forEach(a => m.set(a.year, [...(m.get(a.year) || []), a]));
    return [...m.entries()].sort((a, b) => +b[0] - +a[0]);
  }, [data]);
  const openWinner = (a: AwardItem) => {
    if (a.winner.type === 'artist') return;
    if (a.winner.id) { onClose(); navigateTo(a.winner.type === 'album' ? 'album' : 'track', { id: a.winner.id }); }
  };
  return (
    <Portal>
      <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-6">
        <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#0d0d10]">
          <div className="relative overflow-hidden px-6 pt-7 pb-5">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(70% 90% at 50% 0%, rgba(251,191,36,.22), transparent 70%)' }} />
            <div className="relative flex items-center gap-4">
              <CoverArt url={artist.imageUrl} title={artist.name} isArtist className="w-16 h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-amber-300/40" innerClassName="w-full h-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">Зал славы</div>
                <div className="text-2xl sm:text-3xl font-black text-white truncate">{artist.name}</div>
                <div className="text-[12px] text-zinc-400 mt-0.5 tabular-nums">
                  {data.won.length} наград · {data.noms.length} номинаций{data.no1 ? ` · ${data.no1} хит(ов) №1` : ''}{data.top10 ? ` · ${data.top10} в топ-10` : ''}
                </div>
              </div>
              <button type="button" onClick={onClose} className="self-start w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/70 text-xl">×</button>
            </div>
            <div className="relative mt-5"><Seg2 size="sm" value={tab} onChange={setTab} options={[['wins', `Победы · ${data.won.length}`], ['noms', `Номинации · ${data.noms.length}`]]} /></div>
          </div>

          {tab === 'wins' ? (
            <div className="px-6 pb-7 space-y-6">
              {data.major.length > 0 && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Главные награды</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(data.major as AwardItem[]).map((a, i) => (
                      <motion.button key={a.id} type="button" onClick={() => openWinner(a)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="relative overflow-hidden text-left rounded-3xl p-4 border border-amber-300/25 bg-gradient-to-br from-amber-300/[0.14] via-amber-500/[0.05] to-transparent">
                        <span className="absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent mp-anim" style={{ animation: `mp-shine 4.5s ease-in-out ${i * 0.6}s infinite` }} />
                        <div className="relative flex items-center gap-3">
                          <CoverArt url={a.winner.coverUrl} title={a.winner.title} isArtist={a.winner.type === 'artist'} className={`w-16 h-16 shrink-0 overflow-hidden ${a.winner.type === 'artist' ? 'rounded-full' : 'rounded-2xl'}`} innerClassName="w-full h-full object-cover" />
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">🏆 {a.nominationTitle}</div>
                            <div className="text-[15px] font-black text-white truncate">{a.winner.title}</div>
                            <div className="text-[11px] text-amber-100/60">{periodOf(a)}</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {byYear.map(([year, list]) => (
                <div key={year}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{year}</div>
                  <div className="space-y-1.5">
                    {list.map(a => (
                      <button key={a.id} type="button" onClick={() => openWinner(a)} className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-left">
                        <CoverArt url={a.winner.coverUrl} title={a.winner.title} isArtist={a.winner.type === 'artist'} className={`w-10 h-10 shrink-0 overflow-hidden ${a.winner.type === 'artist' ? 'rounded-full' : 'rounded-lg'}`} innerClassName="w-full h-full object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-white truncate">{a.nominationTitle}</div>
                          <div className="text-[11px] text-zinc-500 truncate">{a.winner.title} · {a.periodType === 'month' ? `${MONTH_GEN[+(a.month || 1) - 1]}` : 'итоги года'}</div>
                        </div>
                        <span className="text-amber-300 text-sm">🏆</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!data.won.length && <div className="py-10 text-center text-sm text-zinc-500">Побед пока нет, но номинации уже есть.</div>}
            </div>
          ) : (
            <div className="px-6 pb-7 space-y-1.5">
              {(data.noms as Array<{ a: AwardItem; place: number; pct?: number; title: string }>).map(n => (
                <div key={n.a.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-white/[0.03] border border-white/[0.05]">
                  <span className={`w-10 h-10 shrink-0 rounded-xl flex flex-col items-center justify-center font-black ${n.place === 2 ? 'bg-zinc-200 text-black' : n.place === 3 ? 'bg-orange-300 text-black' : n.place <= 5 ? 'bg-white/[0.1] text-white' : 'bg-white/[0.04] text-zinc-400'}`}>
                    <span className="text-[13px] leading-none">{n.place}</span><span className="text-[8px] uppercase leading-none mt-0.5">место</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-white truncate">{n.a.nominationTitle}</div>
                    <div className="text-[11px] text-zinc-500 truncate">{n.title} · {periodOf(n.a)} · победил {n.a.winner.title}</div>
                  </div>
                  {n.place <= 5 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300">топ-5</span>}
                  {typeof n.pct === 'number' && <span className="text-[12px] font-bold text-zinc-300 tabular-nums w-12 text-right">{n.pct}%</span>}
                </div>
              ))}
              {!data.noms.length && <div className="py-10 text-center text-sm text-zinc-500">Номинаций без победы нет.</div>}
            </div>
          )}
        </motion.div>
      </div>
    </Portal>
  );
};

// ---------------------------------------------------------------------------
// shared generators (simulation logic reused outside the simulation)
// ---------------------------------------------------------------------------
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
function metricsFor(artist: Artist, artists: Artist[], tracks: Track[], albums: Album[], dateIso: string) {
  try { return computeAllArtistMetrics([artist], tracks, albums, dateIso)[0] || null; } catch { return null; }
}
function smartTitle(artist: Artist | undefined, tracks: Track[], albums: Album[], isAlbum: boolean): string {
  const existing = new Set<string>(tracks.map(t => t.title.toLowerCase()));
  albums.forEach(a => existing.add(a.title.toLowerCase()));
  let profile: any = false;
  if (artist) {
    try {
      const mine = tracks.filter(t => isLeadOf(t, artist));
      const myAlb = albums.filter(a => a.artistId === artist.id || norm(a.artistName) === norm(artist.name));
      profile = analyzeArtistNamingStyle(artist, mine, myAlb);
    } catch { profile = false; }
  }
  try { return generateModernTitle(existing, isAlbum, profile); } catch { return isAlbum ? 'Новый альбом' : 'Новый трек'; }
}
/** realistic plays for an artist; ageDays > 0 adds the growth a released track already had */
function smartPlays(artist: Artist, artists: Artist[], tracks: Track[], albums: Album[], dateIso: string, itemType: 'track' | 'album' | 'snippet', opts: { feat?: Artist | null; albumTracks?: number; ageDays?: number } = {}) {
  const m = metricsFor(artist, artists, tracks, albums, dateIso);
  const quality = clamp(Math.round((m?.avgQuality || 68) + rnd(-7, 11)), 55, 90);
  let plays = 0;
  try {
    plays = forecastReleasePlays({
      artist, featArtist: opts.feat || null, allArtists: artists, itemType, qualityScore: quality, hype: m?.hype ?? artist.hype ?? 55,
      hasWarmup: !!m?.activeSnippet, albumTracksCount: opts.albumTracks, hitsCount: m?.topHitsCount, catalogAvgPlays: m?.catalogAvgPlays
    });
  } catch { plays = Math.round((artist.followers || 300000) * rnd(0.4, 1.6)); }
  const age = opts.ageDays || 0;
  if (age > 0) plays = Math.round(plays * clamp(1 + Math.log10(1 + age / 7) * 1.4, 1, 6));
  return { plays: Math.max(1000, Math.round(plays)), m, quality };
}
function suggestFeat(artist: Artist, artists: Artist[], m: any): Artist | null {
  const recent = new Set<string>((m?.recentCollabPartners || []).map((x: string) => norm(x)));
  const fol = artist.followers || 1;
  const pool = artists.filter(a => a.id !== artist.id && (a.followers || 0) > 0)
    .map(a => {
      const ratio = (a.followers || 1) / fol;
      let score = -Math.abs(Math.log(ratio)) * 1.2 + (norm(a.genre) === norm(artist.genre) ? 1.5 : 0) + (recent.has(norm(a.name)) ? 0.8 : 0) + Math.random() * 1.4;
      if (ratio > 6) score -= 2;
      return { a, score };
    }).sort((x, y) => y.score - x.score).slice(0, 6);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)].a : null;
}
async function shrinkImage(file: File, size = 512): Promise<string> {
  const data = await new Promise<string>(res => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(file); });
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = size; c.height = size;
      const ctx = c.getContext('2d')!; const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => res(data);
    img.src = data;
  });
}
const randDuration = () => `${2 + Math.floor(Math.random() * 2)}:${pad2(Math.floor(Math.random() * 60))}`;

// ---------------------------------------------------------------------------
// 2. BATCH SMART TOOLS — the simulation's generators inside the batch builder
// ---------------------------------------------------------------------------
export const BatchSmartTools: React.FC<{
  mode: 'track' | 'album' | 'snippet';
  artistId?: string;
  artists: Artist[]; tracks: Track[]; albums: Album[];
  dateIso?: string;
  onTitle: (v: string) => void;
  onPlays?: (v: string) => void;
  onDuration?: (v: string) => void;
  onFeat?: (v: string) => void;
  onAlbumTracks?: (list: Array<{ id: string; title: string; duration: string; plays: number; featuredArtist?: string }>) => void;
}> = ({ mode, artistId, artists, tracks, albums, dateIso, onTitle, onPlays, onDuration, onFeat, onAlbumTracks }) => {
  const artist = artists.find(a => a.id === artistId);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const date = dateIso && /^\d{4}-\d{2}-\d{2}$/.test(dateIso) ? dateIso : toISO(Date.now());
  const isAlbum = mode === 'album';
  const genTitles = () => {
    const list = Array.from({ length: 4 }, () => smartTitle(artist, tracks, albums, isAlbum));
    setIdeas([...new Set(list)]);
    onTitle(list[0]);
  };
  const genPlays = (feat?: Artist | null) => {
    if (!artist) return;
    const r = smartPlays(artist, artists, tracks, albums, date, mode, { feat, albumTracks: isAlbum ? 12 : undefined });
    if (onPlays && !isAlbum) onPlays(formatNumber(r.plays));
    setNote(`Хайп ${r.m?.hype ?? '—'} · ср. на трек ${fmtN(r.m?.catalogAvgPlays || 0)} · оценка ${r.quality}/90 → прогноз ${fmtN(r.plays)}`);
    return r;
  };
  const genFeat = () => {
    if (!artist || !onFeat) return;
    const f = suggestFeat(artist, artists, metricsFor(artist, artists, tracks, albums, date));
    if (f) { onFeat(f.name); genPlays(f); }
  };
  const genTracklist = () => {
    if (!artist || !onAlbumTracks) return;
    const r = smartPlays(artist, artists, tracks, albums, date, 'album', { albumTracks: 12 });
    const count = Math.round(rnd(9, 15));
    try {
      const existing = new Set<string>(tracks.map(t => t.title.toLowerCase()));
      const list = generateAlbumTracksWithFeats({ artist, allArtists: artists, count, estimatedAlbumPlays: r.plays, existingTitles: existing, namingProfile: r.m?.namingProfile || false });
      onAlbumTracks(list.map(t => ({ id: t.id || uid('st'), title: t.title, duration: t.duration || randDuration(), plays: t.plays || 0, featuredArtist: t.featuredArtist })));
      setNote(`Треклист: ${list.length} треков · ${list.filter(t => t.featuredArtist).length} фитов · ~${fmtN(list.reduce((s, t) => s + (t.plays || 0), 0))}`);
    } catch { setNote('Не удалось собрать треклист для этого артиста'); }
  };
  const genAll = () => {
    genTitles();
    if (isAlbum) genTracklist();
    else {
      const f = artist && onFeat && Math.random() < 0.35 ? suggestFeat(artist, artists, null) : null;
      if (f && onFeat) onFeat(f.name);
      genPlays(f);
      onDuration && onDuration(randDuration());
    }
  };
  const btn = 'px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-[11px] font-bold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-2.5 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-1">Генератор</span>
        <button type="button" className={btn} onClick={genTitles}>✨ Название</button>
        {!isAlbum && <button type="button" className={btn} disabled={!artist} onClick={() => genPlays()}>🎯 Прослушивания</button>}
        {!isAlbum && onFeat && <button type="button" className={btn} disabled={!artist} onClick={genFeat}>👥 Фит</button>}
        {isAlbum && onAlbumTracks && <button type="button" className={btn} disabled={!artist} onClick={genTracklist}>💿 Треклист</button>}
        <button type="button" className={`${btn} !bg-white !text-black`} onClick={genAll}>🎲 Всё сразу</button>
      </div>
      {ideas.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {ideas.map(t => <button key={t} type="button" onClick={() => onTitle(t)} className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[11px] text-zinc-200">{t}</button>)}
        </div>
      )}
      <div className="text-[10px] text-zinc-500 leading-snug">{note || (artist ? `Учитывает слушателей, хайп и стиль названий ${artist.name}` : 'Выбери исполнителя из списка, чтобы прогноз был по нему')}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. RELEASE CALENDAR PRO
// ---------------------------------------------------------------------------
export interface Announcement {
  id: string; title: string; artistName: string; artistId?: string;
  type: 'single' | 'ep' | 'album' | 'snippet' | 'clip'; date: string; time?: string;
  coverUrl?: string; note?: string; presaves: number; released?: boolean; createdAt: number; featuredArtist?: string; fromRumor?: boolean;
}
interface Rumor { id: string; artistId: string; artistName: string; text: string; type: Announcement['type']; conf: number; from: string; to: string; feat?: string; title?: string }
const ANN_LS = 'musaic.announcements';
const RUMOR_LS = 'musaic.rumors.v1';
const TYPE_RU: Record<string, string> = { single: 'Сингл', ep: 'EP', album: 'Альбом', snippet: 'Сниппет', clip: 'Клип' };

function presavesOf(a: Announcement, artist?: Artist, now = Date.now()) {
  const fol = artist?.followers || 50_000;
  const daysOut = (new Date(`${a.date}T${a.time || '00:00'}`).getTime() - a.createdAt) / DAY;
  const passed = clamp((now - a.createdAt) / Math.max(1, daysOut * DAY), 0, 1);
  const k = a.type === 'album' ? 0.03 : a.type === 'ep' ? 0.02 : a.type === 'snippet' ? 0.006 : 0.012;
  return Math.round(fol * k * (0.15 + 0.85 * Math.pow(passed, 1.6))) + (a.presaves || 0);
}
function leftStr(target: number, now: number) {
  const d = Math.max(0, target - now);
  const days = Math.floor(d / DAY), h = Math.floor((d % DAY) / 36e5), m = Math.floor((d % 36e5) / 6e4), s = Math.floor((d % 6e4) / 1e3);
  return days > 0 ? `${days} д ${h} ч` : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function genRumors(artists: Artist[], tracks: Track[], albums: Album[], today: string, seed: number, skip: Set<string>): Rumor[] {
  const pool = [...artists].sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 160);
  let metrics: any[] = [];
  try { metrics = computeAllArtistMetrics(pool, tracks, albums, today); } catch { metrics = []; }
  const r = seeded(seed * 7919 + 13);
  const t0 = refToMs(today);
  const win = (a: number, b: number) => [toISO(t0 + a * DAY), toISO(t0 + b * DAY)] as const;
  const out: Rumor[] = [];
  const push = (x: Omit<Rumor, 'id'>) => { const id = `r${hashStr(`${x.type}|${x.artistId}|${x.text}`)}`; if (!skip.has(id)) out.push({ ...x, id }); };
  for (const m of metrics) {
    const a: Artist = m.artist; const hype = m.hype || 0;
    const roll = r();
    if ((m.daysSinceAlbum === null ? m.tracksCount >= 6 : m.daysSinceAlbum >= 300) && hype >= 55 && roll < 0.55) {
      const [f, t] = win(21, 120); push({ artistId: a.id, artistName: a.name, type: 'album', conf: Math.round(clamp(35 + hype / 2 + r() * 10, 30, 92)), from: f, to: t, text: `${a.name} заканчивает новый альбом${m.daysSinceAlbum ? `: без альбома уже ${m.daysSinceAlbum} дн.` : ''}` });
    } else if (m.activeSnippet && roll < 0.8) {
      const [f, t] = win(3, 30); push({ artistId: a.id, artistName: a.name, type: 'single', title: m.activeSnippet.title, conf: Math.round(clamp(60 + r() * 30, 50, 95)), from: f, to: t, text: `Полная версия сниппета «${m.activeSnippet.title}» может выйти совсем скоро` });
    } else if (m.daysSilent >= 150 && hype >= 40 && roll < 0.5) {
      const [f, t] = win(7, 60); push({ artistId: a.id, artistName: a.name, type: 'single', conf: Math.round(clamp(30 + hype / 2.5 + r() * 15, 25, 85)), from: f, to: t, text: `${a.name} готовит возвращение после ${m.daysSilent} дней тишины` });
    } else if (hype >= 80 && m.daysSilent < 30 && roll < 0.35) {
      const [f, t] = win(1, 14); push({ artistId: a.id, artistName: a.name, type: 'snippet', conf: Math.round(clamp(45 + r() * 35, 40, 90)), from: f, to: t, text: `${a.name} не сбавляет темп: в сети засветился новый кусок трека` });
    }
  }
  // collab rumors
  const hot = metrics.filter(m => (m.hype || 0) >= 50);
  for (let i = 0; i < 3 && hot.length > 1; i++) {
    const a = hot[Math.floor(r() * hot.length)]; const cand = hot.filter(x => x !== a && norm(x.artist.genre) === norm(a.artist.genre));
    const b = cand[Math.floor(r() * cand.length)] || hot.find(x => x !== a);
    if (!b) break;
    const [f, t] = win(10, 75);
    push({ artistId: a.artist.id, artistName: a.artist.name, feat: b.artist.name, type: 'single', conf: Math.round(clamp(25 + r() * 50, 20, 80)), from: f, to: t, text: `Инсайдеры: ${a.artist.name} и ${b.artist.name} записали совместный трек` });
  }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.slice(0, 6);
}

type CalKind = 'single' | 'album' | 'ep' | 'snippet' | 'clip';
interface CalItem { key: string; title: string; artist: string; date: string; time?: string; cover?: string; kind: CalKind; source: 'catalog' | 'ann'; refId?: string; refType?: 'track' | 'album'; ann?: Announcement }
const DOT: Record<string, string> = { catalog: 'bg-emerald-400', ann: 'bg-amber-400', snippet: 'bg-sky-400' };

export const ReleaseCalendarPro: React.FC<{
  artists: Artist[]; tracks: Track[]; albums: Album[];
  todayIso?: string;
  onRelease?: (a: Announcement) => void;
  onAddTrack?: (t: Track) => void;
  onAddAlbum?: (a: Album, tracks: Track[]) => void;
  onOpen?: (type: 'track' | 'album', id: string) => void;
}> = props => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Календарь релизов"
        className="p-2 rounded-full bg-zinc-900/75 hover:bg-zinc-800/90 border border-white/10 hover:border-white/25 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
      </button>
      <AnimatePresence>{open && <CalendarModal key="cal" {...props} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
};

const CalendarModal: React.FC<React.ComponentProps<typeof ReleaseCalendarPro> & { onClose: () => void }> = ({ artists, tracks, albums, todayIso, onRelease, onAddTrack, onAddAlbum, onOpen, onClose }) => {
  usePlusCss();
  useEsc(true, onClose);
  const today = todayIso && /^\d{4}-\d{2}-\d{2}/.test(todayIso) ? todayIso.slice(0, 10) : toISO(Date.now());
  const [ann, setAnn] = useState<Announcement[]>(() => lsGet<Announcement[]>(ANN_LS, []));
  useEffect(() => lsSet(ANN_LS, ann), [ann]);
  const [rs, setRs] = useState(() => lsGet<{ seed: number; skip: string[] }>(RUMOR_LS, { seed: 1, skip: [] }));
  useEffect(() => lsSet(RUMOR_LS, rs), [rs]);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selDay, setSelDay] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'out' | 'soon' | 'snippet' | 'ann'>('all');
  const [form, setForm] = useState<any | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const artistOf = useCallback((name: string) => artists.find(a => norm(a.name) === norm(name)), [artists]);

  const items = useMemo<CalItem[]>(() => {
    const albumById = new Map(albums.map(a => [a.id, a]));
    const albumCount = new Map<string, number>();
    tracks.forEach(t => { if (t.albumId) albumCount.set(t.albumId, (albumCount.get(t.albumId) || 0) + 1); });
    const out: CalItem[] = ann.map(a => ({ key: a.id, title: a.title, artist: a.artistName, date: a.date, time: a.time, cover: a.coverUrl, kind: a.type, source: 'ann', ann: a }));
    for (const t of tracks) {
      const ms = parseDayMs(t.releaseDate); if (ms === null) continue;
      const inAlbum = t.albumId && t.albumId !== 'single' && albumById.has(t.albumId);
      if (inAlbum && !t.isSnippet) continue;
      out.push({ key: `t-${t.id}`, title: t.title, artist: t.featuredArtist ? `${t.artistName} feat. ${t.featuredArtist}` : t.artistName, date: toISO(ms), cover: t.coverUrl, kind: t.isSnippet ? 'snippet' : 'single', source: 'catalog', refId: t.id, refType: 'track' });
    }
    for (const a of albums) {
      const ms = parseDayMs(a.releaseDate); if (ms === null) continue;
      out.push({ key: `a-${a.id}`, title: a.title, artist: a.artistName, date: toISO(ms), cover: a.coverUrl, kind: (albumCount.get(a.id) || 99) <= 6 ? 'ep' : 'album', source: 'catalog', refId: a.id, refType: 'album' });
    }
    return out.sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')));
  }, [ann, tracks, albums]);

  const pass = useCallback((i: CalItem) => {
    if (filter === 'out') return i.date <= today && i.source === 'catalog';
    if (filter === 'soon') return i.date > today || (i.source === 'ann' && !i.ann?.released);
    if (filter === 'snippet') return i.kind === 'snippet';
    if (filter === 'ann') return i.source === 'ann';
    return true;
  }, [filter, today]);
  const byDay = useMemo(() => { const m = new Map<string, CalItem[]>(); items.forEach(i => { if (!pass(i)) return; const l = m.get(i.date) || []; l.push(i); m.set(i.date, l); }); return m; }, [items, pass]);
  const upcoming = useMemo(() => items.filter(i => pass(i) && (i.date > today || (i.source === 'ann' && !i.ann?.released))).slice(0, 14), [items, pass, today]);
  const recent = useMemo(() => items.filter(i => pass(i) && i.source === 'catalog' && i.date <= today).slice(-10).reverse(), [items, pass, today]);
  const rumors = useMemo(() => genRumors(artists, tracks, albums, today, rs.seed, new Set(rs.skip)), [artists, tracks, albums, today, rs]);

  const [y, m] = month.split('-').map(Number);
  const startPad = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: Array<string | null> = [...Array(startPad).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${month}-${pad2(i + 1)}`)];
  const shift = (k: number) => { const d = new Date(Date.UTC(y, m - 1 + k, 1)); setMonth(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`); setSelDay(null); };
  const monthCount = useMemo(() => { let n = 0; byDay.forEach((l, d) => { if (d.startsWith(month)) n += l.length; }); return n; }, [byDay, month]);

  const confirmRumor = (r: Rumor) => {
    const art = artists.find(a => a.id === r.artistId);
    const dFrom = refToMs(r.from), dTo = refToMs(r.to);
    const date = toISO(dFrom + Math.random() * Math.max(DAY, dTo - dFrom));
    const entry: Announcement = { id: uid('ann'), title: r.title || smartTitle(art, tracks, albums, r.type === 'album' || r.type === 'ep'), artistName: r.artistName, artistId: r.artistId, type: r.type, date, presaves: 0, createdAt: Date.now(), featuredArtist: r.feat, note: r.feat ? `feat. ${r.feat}` : 'Слух подтвердился', fromRumor: true };
    setAnn(p => [...p, entry]);
    setRs(p => ({ ...p, skip: [...p.skip, r.id].slice(-400) }));
  };
  const dismissRumor = (r: Rumor) => setRs(p => ({ ...p, skip: [...p.skip, r.id].slice(-400) }));

  const releaseAnn = (a: Announcement) => {
    const art = artistOf(a.artistName);
    if ((a.type === 'album' || a.type === 'ep') && onAddAlbum && art) {
      const count = a.type === 'ep' ? Math.round(rnd(4, 6)) : Math.round(rnd(10, 15));
      const est = smartPlays(art, artists, tracks, albums, a.date, 'album', { albumTracks: count });
      let list: any[] = [];
      try { list = generateAlbumTracksWithFeats({ artist: art, allArtists: artists, count, estimatedAlbumPlays: est.plays, existingTitles: new Set(tracks.map(t => t.title.toLowerCase())), namingProfile: est.m?.namingProfile || false }); } catch { list = []; }
      const albumId = uid('alb');
      const album: Album = { id: albumId, title: a.title, artistId: art.id, artistName: art.name, coverUrl: a.coverUrl || '', releaseYear: +a.date.slice(0, 4), releaseDate: a.date, genre: art.genre || '', isLiked: false, totalPlays: list.reduce((s, t) => s + (t.plays || 0), 0) || est.plays };
      const ts: Track[] = list.map(t => ({ id: uid('trk'), title: t.title, artistId: art.id, artistName: art.name, albumId, albumTitle: a.title, duration: t.duration || randDuration(), plays: t.plays || 0, likes: Math.round((t.plays || 0) * 0.03), isLiked: false, releaseDate: a.date, coverUrl: a.coverUrl || '', featuredArtist: t.featuredArtist, isExplicit: t.isExplicit, genre: art.genre }));
      onAddAlbum(album, ts);
    } else if (onRelease) onRelease(a);
    setAnn(p => p.map(x => (x.id === a.id ? { ...x, released: true } : x)));
  };

  const list = selDay ? byDay.get(selDay) || [] : null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[450] flex items-center justify-center p-2 sm:p-6">
        <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.985 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-6xl h-[92vh] flex flex-col rounded-[28px] border border-white/10 bg-[#0e0f13] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-black text-white">Календарь релизов</div>
              <div className="text-[11px] text-zinc-500">Вышедшие релизы, анонсы, пре-сейвы, сниппеты и слухи</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {([['all', 'Всё'], ['out', 'Вышло'], ['soon', 'Скоро'], ['snippet', 'Сниппеты'], ['ann', 'Анонсы']] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setFilter(v)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${filter === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>{l}</button>
                ))}
              </div>
              <button type="button" onClick={() => setForm({ mode: onAddTrack ? 'past' : 'announce', type: 'single', date: selDay || today, artistName: '' })} className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-black">+ Добавить</button>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white text-lg">×</button>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid md:grid-cols-[1.15fr_1fr]">
            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => shift(-1)} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-300">‹</button>
                <div className="text-center">
                  <div className="text-sm font-black text-white">{MONTHS_FULL[m - 1]} {y}</div>
                  <div className="text-[10px] text-zinc-500">{monthCount} событий{month !== today.slice(0, 7) && <> · <button type="button" className="underline hover:text-white" onClick={() => { setMonth(today.slice(0, 7)); setSelDay(null); }}>сегодня</button></>}</div>
                </div>
                <button type="button" onClick={() => shift(1)} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-300">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-600 uppercase mb-1">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <div key={d}>{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (!d) return <div key={`p${i}`} />;
                  const its = byDay.get(d) || [];
                  const isSel = selDay === d; const isToday = d === today; const past = d < today;
                  const cover = its.find(x => x.cover)?.cover;
                  return (
                    <button key={d} type="button" onClick={() => setSelDay(isSel ? null : d)}
                      className={`relative aspect-square rounded-xl text-[12px] font-bold overflow-hidden transition-all ${isSel ? 'ring-2 ring-white scale-[1.03]' : ''} ${isToday ? 'bg-white text-black' : past ? 'bg-white/[0.02] text-zinc-500 hover:bg-white/[0.06]' : 'bg-white/[0.04] text-zinc-200 hover:bg-white/[0.09]'}`}>
                      {cover && !isToday && <CoverArt url={cover} title="" className={`absolute inset-0 w-full h-full ${past ? 'opacity-25' : 'opacity-45'}`} innerClassName="w-full h-full object-cover" />}
                      <span className="relative drop-shadow">{+d.slice(8)}</span>
                      {its.length > 1 && <span className="absolute top-1 right-1 text-[9px] font-black px-1 rounded bg-black/60 text-white">{its.length}</span>}
                      {its.length > 0 && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">{its.slice(0, 3).map(x => <span key={x.key} className={`w-1 h-1 rounded-full ${x.kind === 'snippet' ? DOT.snippet : DOT[x.source]}`} />)}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-3 text-[10px] text-zinc-500"><span><span className="text-emerald-400">●</span> релиз</span><span><span className="text-amber-400">●</span> анонс</span><span><span className="text-sky-400">●</span> сниппет</span></div>

              {!selDay && recent.length > 0 && (
                <div className="mt-6">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Недавно вышло</div>
                  <div className="flex gap-2.5 overflow-x-auto custom-scrollbar pb-1">
                    {recent.map(r => (
                      <button key={r.key} type="button" onClick={() => r.refId && onOpen && (onClose(), onOpen(r.refType!, r.refId))} className="shrink-0 w-24 text-left">
                        <CoverArt url={r.cover} title={r.title} className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-800" innerClassName="w-full h-full object-cover" />
                        <div className="text-[11px] font-bold text-white truncate mt-1">{r.title}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{TYPE_RU[r.kind]} · {fmtDayShort(refToMs(r.date))}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-5">
              {list ? (
                <CalSection title={fmtDay(refToMs(selDay!))} items={list} empty="В этот день ничего. Нажми «+ Добавить»." now={now} today={today} artistOf={artistOf} setAnn={setAnn} setForm={setForm} onReleaseAnn={releaseAnn} onOpen={onOpen ? (t, id) => { onClose(); onOpen(t, id); } : undefined} />
              ) : (
                <>
                  <CalSection title="Скоро" items={upcoming} empty="Пока ничего не запланировано." now={now} today={today} artistOf={artistOf} setAnn={setAnn} setForm={setForm} onReleaseAnn={releaseAnn} onOpen={onOpen ? (t, id) => { onClose(); onOpen(t, id); } : undefined} />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Слухи индустрии</div>
                      <button type="button" onClick={() => setRs(p => ({ ...p, seed: p.seed + 1 }))} className="text-[11px] font-bold text-zinc-400 hover:text-white">🎲 Новые слухи</button>
                    </div>
                    {rumors.length === 0 && <div className="text-xs text-zinc-500 py-4">Тихо. Слухи появятся, когда у артистов вырастет хайп или затянется пауза.</div>}
                    <div className="space-y-1.5">
                      {rumors.map(r => {
                        const art = artists.find(a => a.id === r.artistId);
                        return (
                          <motion.div key={r.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-500/[0.07] to-transparent border border-white/[0.06] p-3">
                            <CoverArt url={art?.imageUrl} title={r.artistName} isArtist className="w-11 h-11 rounded-full overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] font-bold text-white leading-snug">{r.text}</div>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-zinc-500">{TYPE_RU[r.type]} · {fmtDayShort(refToMs(r.from))} – {fmtDayShort(refToMs(r.to))}</span>
                                <span className="text-[10px] font-bold text-fuchsia-300">вероятность {r.conf}%</span>
                                <button type="button" onClick={() => confirmRumor(r)} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-black">Подтвердить → анонс</button>
                                <button type="button" onClick={() => dismissRumor(r)} className="text-[10px] text-zinc-500 hover:text-white">фейк</button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <AnimatePresence>
            {form && <CalForm key="form" form={form} setForm={setForm} artists={artists} tracks={tracks} albums={albums} today={today}
              canPast={!!onAddTrack} onSaveAnn={a => setAnn(p => [...p.filter(x => x.id !== a.id), a])}
              onAddTrack={onAddTrack} onAddAlbum={onAddAlbum} />}
          </AnimatePresence>
        </motion.div>
      </div>
    </Portal>
  );
};

const CalSection: React.FC<{
  title: string; items: CalItem[]; empty: string; now: number; today: string; artistOf: (n: string) => Artist | undefined;
  setAnn: React.Dispatch<React.SetStateAction<Announcement[]>>; setForm: (f: any) => void; onReleaseAnn: (a: Announcement) => void; onOpen?: (t: 'track' | 'album', id: string) => void;
}> = ({ title, items, empty, now, today, artistOf, setAnn, setForm, onReleaseAnn, onOpen }) => (
  <div>
    <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">{title}</div>
    {items.length === 0 && <div className="text-xs text-zinc-500 py-6 text-center">{empty}</div>}
    <div className="space-y-1.5">
      {items.map(it => {
        const target = new Date(`${it.date}T${it.time || '00:00'}`).getTime();
        const isPast = it.date < today || target <= now;
        const a = it.ann;
        return (
          <motion.div key={it.key} layout className="flex gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-2.5">
            <button type="button" onClick={() => it.refId && onOpen && onOpen(it.refType!, it.refId)} className="shrink-0">
              <CoverArt url={it.cover} title={it.title} className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800" innerClassName="w-full h-full object-cover" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${it.kind === 'snippet' ? 'bg-sky-400/15 text-sky-300' : a ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'}`}>{TYPE_RU[it.kind] || it.kind}{a ? ' · анонс' : ''}</span>
                <span className="text-[10px] text-zinc-500">{fmtDay(refToMs(it.date))}{it.time ? ` · ${it.time}` : ''}</span>
              </div>
              <div className="text-[14px] font-black text-white truncate mt-0.5">{it.title}</div>
              <div className="text-[11px] text-zinc-400 truncate">{it.artist}{a?.note ? ` · ${a.note}` : ''}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {!isPast ? <span className="text-[11px] font-black text-emerald-300 tabular-nums">через {leftStr(target, now)}</span>
                  : <span className="text-[11px] font-bold text-zinc-500">{a ? (a.released ? 'вышел' : 'дата наступила') : 'вышел'}</span>}
                {a && (
                  <>
                    <button type="button" onClick={() => setAnn(p => p.map(x => (x.id === a.id ? { ...x, presaves: x.presaves + 1 } : x)))} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200">♥ пре-сейв · {formatNumber(presavesOf(a, artistOf(a.artistName), now))}</button>
                    <button type="button" onClick={() => setForm({ mode: 'announce', ...a })} className="text-[10px] text-zinc-500 hover:text-white">изм.</button>
                    <button type="button" onClick={() => setAnn(p => p.filter(x => x.id !== a.id))} className="text-[10px] text-zinc-600 hover:text-rose-400">удалить</button>
                    {isPast && !a.released && a.type !== 'clip' && <button type="button" onClick={() => onReleaseAnn(a)} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-black">Выпустить</button>}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

const CalForm: React.FC<{
  form: any; setForm: (f: any) => void; artists: Artist[]; tracks: Track[]; albums: Album[]; today: string; canPast: boolean;
  onSaveAnn: (a: Announcement) => void; onAddTrack?: (t: Track) => void; onAddAlbum?: (a: Album, t: Track[]) => void;
}> = ({ form, setForm, artists, tracks, albums, today, canPast, onSaveAnn, onAddTrack, onAddAlbum }) => {
  const art = artists.find(a => norm(a.name) === norm(form.artistName));
  const set = (p: any) => setForm({ ...form, ...p });
  const isAlbum = form.type === 'album' || form.type === 'ep';
  const [hint, setHint] = useState('');
  const genTitle = () => set({ title: smartTitle(art, tracks, albums, isAlbum) });
  const genPlays = () => {
    if (!art) { setHint('Выбери артиста из базы для прогноза'); return; }
    const age = Math.max(0, Math.floor((refToMs(today) - refToMs(form.date || today)) / DAY));
    const r = smartPlays(art, artists, tracks, albums, form.date || today, isAlbum ? 'album' : 'track', { ageDays: age });
    set({ plays: formatNumber(r.plays) });
    setHint(`Хайп ${r.m?.hype ?? '—'} · релизу ${age} дн. → ${fmtN(r.plays)}`);
  };
  const genTracklist = () => {
    if (!art) { setHint('Выбери артиста из базы'); return; }
    const count = form.type === 'ep' ? Math.round(rnd(4, 6)) : Math.round(rnd(10, 14));
    const est = smartPlays(art, artists, tracks, albums, form.date || today, 'album', { albumTracks: count });
    try {
      const list = generateAlbumTracksWithFeats({ artist: art, allArtists: artists, count, estimatedAlbumPlays: est.plays, existingTitles: new Set(tracks.map(t => t.title.toLowerCase())), namingProfile: est.m?.namingProfile || false });
      set({ tracklist: list.map(t => (t.featuredArtist ? `${t.title} (feat. ${t.featuredArtist})` : t.title)).join('\n') });
    } catch { setHint('Не получилось сгенерировать'); }
  };
  const save = () => {
    if (!form.title?.trim() || !form.date) return;
    const name = (form.artistName || '').trim() || 'Без артиста';
    const artistId = art?.id || `guest_${name}`;
    const plays = Math.max(0, parseInt(String(form.plays || '0').replace(/\D/g, ''), 10) || 0);
    if (form.mode === 'announce') {
      onSaveAnn({ id: form.id || uid('ann'), title: form.title.trim(), artistName: name, artistId: art?.id, type: form.type || 'single', date: form.date, time: form.time || undefined, coverUrl: form.coverUrl, note: form.note?.trim() || undefined, presaves: form.presaves || 0, released: form.released, createdAt: form.createdAt || Date.now(), featuredArtist: form.featuredArtist });
    } else if (form.mode === 'snippet' && onAddTrack) {
      onAddTrack({ id: uid('snip'), title: form.title.trim(), artistId, artistName: art?.name || name, albumId: 'single', albumTitle: 'Single', duration: '0:45', plays: plays || Math.round((art?.followers || 100000) * rnd(0.02, 0.08)), likes: 0, isLiked: false, releaseDate: form.date, coverUrl: form.coverUrl || '', isSnippet: true, snippetTeaser: form.note?.trim() || undefined, genre: art?.genre } as Track);
    } else if (form.mode === 'past') {
      if (isAlbum && onAddAlbum) {
        const lines: string[] = String(form.tracklist || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
        const total = plays || (art ? smartPlays(art, artists, tracks, albums, form.date, 'album', { ageDays: Math.max(0, (refToMs(today) - refToMs(form.date)) / DAY) }).plays : 1_000_000);
        const albumId = uid('alb');
        const w = lines.map((_, i) => 1 / Math.pow(i + 1.6, 0.55) * rnd(0.7, 1.3)); const ws = w.reduce((a, b) => a + b, 0) || 1;
        const ts: Track[] = lines.map((l, i) => {
          const fm = /\((?:feat\.?|ft\.?)\s*([^)]+)\)\s*$/i.exec(l);
          return { id: uid('trk'), title: fm ? l.slice(0, fm.index).trim() : l, artistId, artistName: art?.name || name, albumId, albumTitle: form.title.trim(), duration: randDuration(), plays: Math.round(total * w[i] / ws), likes: Math.round(total * w[i] / ws * 0.03), isLiked: false, releaseDate: form.date, coverUrl: form.coverUrl || '', featuredArtist: fm ? fm[1].trim() : undefined, genre: art?.genre } as Track;
        });
        onAddAlbum({ id: albumId, title: form.title.trim(), artistId, artistName: art?.name || name, coverUrl: form.coverUrl || '', releaseYear: +form.date.slice(0, 4), releaseDate: form.date, genre: art?.genre || '', isLiked: false, totalPlays: total } as Album, ts);
      } else if (onAddTrack) {
        const p = plays || (art ? smartPlays(art, artists, tracks, albums, form.date, 'track', { ageDays: Math.max(0, (refToMs(today) - refToMs(form.date)) / DAY) }).plays : 100000);
        onAddTrack({ id: uid('trk'), title: form.title.trim(), artistId, artistName: art?.name || name, albumId: 'single', albumTitle: 'Single', duration: randDuration(), plays: p, likes: Math.round(p * 0.03), isLiked: false, releaseDate: form.date, coverUrl: form.coverUrl || '', featuredArtist: form.featuredArtist?.trim() || undefined, genre: art?.genre } as Track);
      }
    }
    setForm(null);
  };
  const inp = 'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30';
  const types: Array<[string, string]> = form.mode === 'snippet' ? [] : form.mode === 'past' ? [['single', 'Сингл'], ['ep', 'EP'], ['album', 'Альбом']] : [['single', 'Сингл'], ['ep', 'EP'], ['album', 'Альбом'], ['snippet', 'Сниппет'], ['clip', 'Клип']];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center p-3">
      <motion.div initial={{ y: 14, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-lg max-h-[86vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/10 bg-[#121318] p-5 space-y-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04]">
          {([['past', 'Вышедший релиз'], ['announce', 'Анонс / пре-сейв'], ['snippet', 'Сниппет']] as const).filter(([v]) => v === 'announce' || canPast).map(([v, l]) => (
            <button key={v} type="button" onClick={() => set({ mode: v, type: v === 'snippet' ? 'snippet' : form.type === 'snippet' || form.type === 'clip' ? 'single' : form.type })} className={`flex-1 py-1.5 rounded-lg text-[11px] font-black ${form.mode === v ? 'bg-white text-black' : 'text-zinc-400'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input placeholder="Название" value={form.title || ''} onChange={e => set({ title: e.target.value })} className={inp} />
          <button type="button" onClick={genTitle} title="Название в стиле артиста" className="px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-sm">✨</button>
        </div>
        <input list="mp-cal-artists" placeholder="Исполнитель" value={form.artistName || ''} onChange={e => set({ artistName: e.target.value })} className={inp} />
        <datalist id="mp-cal-artists">{artists.slice(0, 400).map(a => <option key={a.id} value={a.name} />)}</datalist>
        {types.length > 0 && (
          <div className="flex flex-wrap gap-1">{types.map(([t, l]) => <button key={t} type="button" onClick={() => set({ type: t })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${form.type === t ? 'bg-white text-black' : 'bg-white/[0.05] text-zinc-400'}`}>{l}</button>)}</div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={form.date || ''} max={form.mode === 'past' ? today : undefined} onChange={e => set({ date: e.target.value })} className={`${inp} [color-scheme:dark]`} />
          {form.mode === 'announce'
            ? <input type="time" value={form.time || ''} onChange={e => set({ time: e.target.value })} className={`${inp} [color-scheme:dark]`} />
            : <div className="flex gap-1"><input placeholder="Прослушивания" value={form.plays || ''} onChange={e => set({ plays: e.target.value })} className={inp} /><button type="button" onClick={genPlays} title="Реалистично по артисту" className="px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-sm">🎯</button></div>}
        </div>
        {form.mode !== 'snippet' && !isAlbum && <input placeholder="Фит (необязательно)" value={form.featuredArtist || ''} onChange={e => set({ featuredArtist: e.target.value })} className={inp} />}
        {form.mode === 'past' && isAlbum && (
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span className="text-[11px] text-zinc-500">Треклист: по строке на трек, фит как «(feat. Имя)»</span><button type="button" onClick={genTracklist} className="text-[11px] font-bold text-zinc-300 hover:text-white">🎲 Сгенерировать</button></div>
            <textarea rows={6} value={form.tracklist || ''} onChange={e => set({ tracklist: e.target.value })} className={`${inp} font-mono text-[12px]`} />
          </div>
        )}
        <input placeholder={form.mode === 'snippet' ? 'Тизер сниппета' : 'Заметка (тизер, клип, фит...)'} value={form.note || ''} onChange={e => set({ note: e.target.value })} className={inp} />
        <label className="flex items-center gap-3 text-xs text-zinc-400 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden">{form.coverUrl && <img src={form.coverUrl} alt="" className="w-full h-full object-cover" />}</div>
          <span>Обложка (необязательно)</span>
          <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) set({ coverUrl: await shrinkImage(f) }); }} />
        </label>
        {hint && <div className="text-[11px] text-zinc-500">{hint}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setForm(null)} className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white">Отмена</button>
          <button type="button" onClick={save} disabled={!form.title?.trim() || !form.date || (form.mode === 'past' && isAlbum && !String(form.tracklist || '').trim())} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black disabled:opacity-30">
            {form.mode === 'announce' ? 'Сохранить анонс' : 'Добавить в каталог'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
