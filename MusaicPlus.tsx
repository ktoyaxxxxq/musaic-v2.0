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
import { recomputeAward } from './awards/awardEngine';
import { computeAllArtistMetrics, forecastReleasePlays, generateAlbumTracksWithFeats, getPromoStrategyConfig, computeFanExpectation } from './SimulationMode';
import { smartDuration, openReleaseHeroSettings } from './MusaicLab';

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const DAY = 864e5;
const pad2 = (n: number) => String(n).padStart(2, '0');
const toISO = (ms: number) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; };
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const fmtDay = (ms: number) => { const d = new Date(ms); return `${pad2(d.getUTCDate())}-${pad2(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`; };
const fmtDayShort = (ms: number) => { const d = new Date(ms); return `${pad2(d.getUTCDate())}-${pad2(d.getUTCMonth() + 1)}`; };
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
@keyframes mp-aurora2{0%{transform:translate3d(6%,4%,0) rotate(0deg) scale(1.05)}50%{transform:translate3d(-5%,-2%,0) rotate(-10deg) scale(.96)}100%{transform:translate3d(6%,4%,0) rotate(0deg) scale(1.05)}}
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
                isArtist ? (
                  <img src={src} alt={media.title} draggable={false} onError={() => setFailed(true)}
                    className="block max-w-[92vw] max-h-[82vh] w-auto h-auto transition-transform duration-300 ease-out"
                    style={{ transform: `scale(${zoom})`, transformOrigin: origin }} />
                ) : (
                  <div className="w-[min(80vh,92vw)] aspect-square">
                    <img src={src} alt={media.title} draggable={false} onError={() => setFailed(true)}
                      className="block w-full h-full object-cover transition-transform duration-300 ease-out"
                      style={{ transform: `scale(${zoom})`, transformOrigin: origin }} />
                  </div>
                )
              ) : (
                <CoverArt url={media.url} title={media.title} isArtist={isArtist} className="w-[min(80vh,92vw)] aspect-square" innerClassName="w-full h-full object-cover" />
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
              <div className="flex items-center gap-2.5 mb-2"><div className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">Musaic Charts</div><RecordsButton artists={artists} albums={albums} tracks={tracks} navigateTo={navigateTo} /></div>
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
              <ArtistLinks lead={e.ref.artistName} extra={kind === 'tracks' ? e.ref.featuredArtist : e.ref.coArtist} sep={kind === 'tracks' ? ' feat. ' : ' & '} onArtist={onArtist} />
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

/** every artist name is its own link: lead, feat and co-artists */
const ArtistLinks: React.FC<{ lead?: string; extra?: string; sep: string; onArtist: (name?: string) => void }> = ({ lead, extra, sep, onArtist }) => {
  const leads = splitNames(lead); const feats = splitNames(extra).filter(n => !leads.some(l => norm(l) === norm(n)));
  const link = (n: string, i: number) => (
    <span key={`${n}-${i}`} onClick={ev => { ev.stopPropagation(); onArtist(n); }} className="hover:text-white hover:underline cursor-pointer">{n}</span>
  );
  return (
    <>
      {leads.map((n, i) => <React.Fragment key={`l${i}`}>{i > 0 && ', '}{link(n, i)}</React.Fragment>)}
      {feats.length > 0 && <span className="text-zinc-600">{sep}</span>}
      {feats.map((n, i) => <React.Fragment key={`f${i}`}>{i > 0 && ', '}{link(n, i + 100)}</React.Fragment>)}
    </>
  );
};

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
const stageArtistStore = createStore<'on' | 'off'>(typeof localStorage !== 'undefined' ? (localStorage.getItem('musaic.stage.artist') === 'off' ? 'off' : 'on') : 'on');
const setStage = (v: 'on' | 'off', artist = false) => { try { localStorage.setItem(artist ? 'musaic.stage.artist' : 'musaic.stage', v); } catch { /* */ } (artist ? stageArtistStore : stageStore).set(v); };

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

const STAGE_MASK = 'linear-gradient(to bottom, #000 0%, #000 34%, rgba(0,0,0,.86) 48%, rgba(0,0,0,.6) 62%, rgba(0,0,0,.32) 76%, rgba(0,0,0,.12) 88%, transparent 100%)';
export const ReleaseStage: React.FC<{
  kind: 'track' | 'album' | 'artist'; id: string; cover?: string; title: string; artistName?: string; genre?: string;
  releaseDate?: string; plays?: number; referenceDate?: string;
}> = ({ kind, id, cover, title, artistName, genre, releaseDate, plays = 0, referenceDate }) => {
  usePlusCss();
  const isArtistPage = kind === 'artist';
  const on = useStore(isArtistPage ? stageArtistStore : stageStore) === 'on';
  const src = resolveMedia(cover, isArtistPage ? { title, isArtist: true } : { id, title, artistName });
  const [pal, setPal] = useState<PaletteInfo | null>(() => (src ? paletteCache.get(src) || null : null));
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    setReady(false);
    const t = setTimeout(() => alive && setReady(true), 420); // never wait forever
    if (!src) { setPal(null); setReady(true); return () => { alive = false; clearTimeout(t); }; }
    readPalette(src).then(p => { if (alive) { setPal(p); setReady(true); } });
    return () => { alive = false; clearTimeout(t); };
  }, [src]);
  const mood = useMemo(() => detectMood(isArtistPage ? '' : title, genre || '', pal), [title, genre, pal, isArtistPage]);
  const c0 = pal?.colors[0] || `hsl(${hueOf(title)} 55% 45%)`;
  const c1 = pal?.colors[1] || `hsl(${(hueOf(title) + 50) % 360} 50% 30%)`;
  const c2 = pal?.colors[2] || c1;
  const c3 = pal?.colors[3] || c0;

  // page accent = cover colour (buttons and links on the page follow the release)
  useEffect(() => {
    const host = hostRef.current?.parentElement;
    if (!host || !on) return;
    const had = host.classList.contains('page-accent-scope');
    const prev = host.style.getPropertyValue('--page-accent');
    host.classList.add('page-accent-scope');
    host.style.setProperty('--page-accent', c0);
    return () => { if (!had) host.classList.remove('page-accent-scope'); if (prev) host.style.setProperty('--page-accent', prev); else host.style.removeProperty('--page-accent'); };
  }, [on, c0]);

  const age = useMemo(() => { const r = parseDayMs(releaseDate); return r === null ? null : Math.floor((refToMs(referenceDate) - r) / DAY); }, [releaseDate, referenceDate]);
  const tag = isArtistPage ? null : age !== null && age >= 0 && age <= 14 ? (age === 0 ? 'Вышел сегодня' : `Новый релиз · ${age} дн.`) : age !== null && age < 0 ? `Выйдет через ${-age} дн.` : null;
  const milestone = isArtistPage ? null : plays >= 1e9 ? '💎 Миллиард' : plays >= 5e8 ? '500M+' : plays >= 1e8 ? '100M+' : plays >= 5e7 ? '50M+' : plays >= 1e7 ? '10M+' : null;
  const dim = pal ? clamp(0.3 + (pal.lum - 0.4) * 0.55, 0.22, 0.55) : 0.42;
  const strength = isArtistPage ? 0.8 : 1;

  return (
    <div ref={hostRef} className="contents">
      {on && (
        <div aria-hidden className="mp-anim absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
          <div className="sticky top-0 w-full overflow-hidden h-[min(100vh,100%)]"
            style={{ opacity: ready ? strength : 0, transition: 'opacity 1.1s cubic-bezier(.22,1,.36,1)', maskImage: STAGE_MASK, WebkitMaskImage: STAGE_MASK }}>
            {src && <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.4] blur-[90px] opacity-50" style={{ transform: 'translateZ(0) scale(1.4)' }} />}
            <div className="absolute -inset-[25%]" style={{ background: `radial-gradient(38% 42% at 24% 28%, ${c0} 0%, transparent 72%), radial-gradient(42% 46% at 78% 22%, ${c1} 0%, transparent 72%), radial-gradient(48% 40% at 52% 82%, ${c2} 0%, transparent 72%)`, opacity: mood === 'dark' ? 0.32 : 0.5, animation: 'mp-aurora 32s ease-in-out infinite', filter: 'blur(40px)', willChange: 'transform' }} />
            <div className="absolute -inset-[25%]" style={{ background: `radial-gradient(30% 36% at 70% 60%, ${c3} 0%, transparent 70%), radial-gradient(34% 30% at 18% 70%, ${c1} 0%, transparent 70%)`, opacity: 0.28, mixBlendMode: 'screen', animation: 'mp-aurora2 44s ease-in-out infinite', filter: 'blur(50px)', willChange: 'transform' }} />
            <Particles mood={mood} color={c0} />
            <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: GRAIN, opacity: mood === 'dark' ? 0.4 : 0.07, animation: mood === 'dark' ? 'mp-pulse 6s ease-in-out infinite' : undefined }} />
            {mood === 'night' && <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,8,25,.5), transparent 65%)' }} />}
            <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim})` }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 95% at 50% 25%, transparent 45%, rgba(0,0,0,.5) 100%)' }} />
          </div>
        </div>
      )}
      <div className={`absolute z-30 flex items-center gap-1.5 ${isArtistPage ? 'top-4 left-4 md:left-6' : 'top-3 right-3 md:top-4 md:right-6'}`}>
        {on && tag && <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider text-black" style={{ background: c0 }}>{tag}</span>}
        {on && milestone && <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[9.5px] font-black bg-black/40 backdrop-blur-md border border-white/15 text-white">{milestone}</span>}
        <button type="button" onClick={() => setStage(on ? 'off' : 'on', isArtistPage)} title={on ? 'Выключить атмосферу' : 'Включить атмосферу'}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border transition-colors ${on ? 'bg-white/[0.12] border-white/20 text-white' : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'}`}>
          ✦ {on ? `${MOOD_LABEL[mood]} · ${isArtistPage ? 'артист' : kind === 'album' ? 'альбом' : 'трек'}` : 'Атмосфера'}
        </button>
        {kind === 'album' && (
          <button type="button" onClick={() => openReleaseHeroSettings(id)} title="Настройки шапки альбома"
            className="px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.12] transition-colors">
            ◐ Шапка
          </button>
        )}
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
  albums?: Album[];
  artists?: Artist[];
  navigateTo: (view: ViewType, params?: any) => void;
}> = ({ artist, tracks, albums, artists, navigateTo }) => {
  usePlusCss();
  const stored = useStore(awardsStore);
  const dStored = useDeferredValue(stored);
  // live: nominees & votes recomputed from the current catalog (same as the awards page)
  const awards = useMemo(() => (albums && artists ? dStored.map(a => { try { return recomputeAward(a as any, { artists, albums, tracks }, dStored) as AwardItem; } catch { return a; } }) : dStored), [dStored, albums, artists, tracks]);
  const [open, setOpen] = useState(false);
  const data = useMemo(() => {
    const won: AwardItem[] = []; const noms: Array<{ a: AwardItem; place: number; pct?: number; title: string }> = [];
    for (const a of awards) {
      const w = a.winner;
      const isWin = w.type === 'artist' ? norm(w.title) === norm(artist.name) : artistMatches(artist.name, undefined, w.artistName);
      if (isWin) { won.push(a); continue; }
      const isWinnerRow = (nm: any) => norm(nm.title) === norm(w.title) && (w.type === 'artist' || !w.artistName || !nm.artistName || norm(nm.artistName) === norm(w.artistName));
      const list = [...(a.nominees || [])].filter(nm => !isWinnerRow(nm)).sort((x, y) => (y.votesPercent || 0) - (x.votesPercent || 0));
      const idx = list.findIndex(nm => (nm.type === 'artist' || !nm.artistName) ? norm(nm.title) === norm(artist.name) : artistMatches(artist.name, undefined, nm.artistName));
      if (idx >= 0) noms.push({ a, place: idx + 2, pct: list[idx].votesPercent, title: list[idx].title }); // 1st = the winner
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
        className="group inline-flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors">
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
                    <span className="text-[13px] leading-none">#{n.place}</span><span className="text-[7px] uppercase leading-none mt-0.5">по голосам</span>
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
const randDuration = () => smartDuration();

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

const RUMOR_SRC = ['Инсайдер', 'Телеграм-канал «Кухня рэпа»', 'Фанаты заметили', 'Источник в лейбле', 'Звукорежиссёр проговорился', 'По данным «Пульса»', 'Слух из закрытого чата', 'В сторис мелькнуло', 'Дистрибьютор слил', 'Говорят на студиях', 'Анонимный аккаунт', 'Таблоиды пишут'];
function genRumors(artists: Artist[], tracks: Track[], albums: Album[], today: string, seed: number, skip: Set<string>, target?: string | null): Rumor[] {
  const pool = [...artists].sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 160);
  let metrics: any[] = [];
  try { metrics = computeAllArtistMetrics(pool, tracks, albums, today); } catch { metrics = []; }
  const r = seeded(seed * 7919 + 13 + (target ? hashStr(target) % 7919 : 0));
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const t0 = refToMs(today);
  const tMs = target ? refToMs(target) : null;
  const win = (a: number, b: number) => (tMs !== null ? [toISO(tMs), toISO(tMs)] : [toISO(t0 + a * DAY), toISO(t0 + b * DAY)]) as [string, string];
  const out: Rumor[] = [];
  const push = (x: Omit<Rumor, 'id'>) => { const id = `r${hashStr(`${x.type}|${x.artistId}|${x.text}|${target || ''}`)}`; if (!skip.has(id)) out.push({ ...x, text: `${pick(RUMOR_SRC)}: ${x.text}`, id }); };
  const conf = (base: number, spread: number) => Math.round(clamp(base + r() * spread, 12, 96));
  for (const m of metrics) {
    const a: Artist = m.artist; const hype = m.hype || 0; const roll = r();
    const alb = albums.filter(x => x.artistId === a.id || norm(x.artistName) === norm(a.name)).sort((x, y) => (parseDayMs(y.releaseDate, y.releaseYear) || 0) - (parseDayMs(x.releaseDate, x.releaseYear) || 0))[0];
    if ((m.daysSinceAlbum === null ? m.tracksCount >= 6 : m.daysSinceAlbum >= 280) && hype >= 50 && roll < 0.5) {
      const [f, t] = win(21, 120);
      push({ artistId: a.id, artistName: a.name, type: 'album', conf: conf(35 + hype / 2, 10), from: f, to: t, text: pick([
        `${a.name} заканчивает новый альбом${m.daysSinceAlbum ? `: без альбома уже ${m.daysSinceAlbum} дн.` : ''}`,
        `в сеть утёк возможный треклист нового альбома ${a.name}`, `${a.name} забронировал студию на месяц — похоже, это альбом`,
        `на обложке нового альбома ${a.name} будет детское фото`, `${a.name} сводит альбом с новым звукорежиссёром`]) });
    } else if (m.activeSnippet && roll < 0.8) {
      const [f, t] = win(3, 30); push({ artistId: a.id, artistName: a.name, type: 'single', title: m.activeSnippet.title, conf: conf(60, 30), from: f, to: t, text: pick([`полная версия «${m.activeSnippet.title}» может выйти совсем скоро`, `«${m.activeSnippet.title}» уже на модерации у площадок`, `пресейв «${m.activeSnippet.title}» откроют на днях`]) });
    } else if (m.daysSilent >= 120 && hype >= 35 && roll < 0.5) {
      const [f, t] = win(7, 60); push({ artistId: a.id, artistName: a.name, type: 'single', conf: conf(30 + hype / 2.5, 15), from: f, to: t, text: pick([`${a.name} готовит возвращение после ${m.daysSilent} дней тишины`, `${a.name} удалил все посты — классический знак камбэка`, `${a.name} сменил аватарку и описание: дроп близко`]) });
    } else if (m.daysSilent <= 40 && m.tracksCount >= 5 && roll < 0.35) {
      const [f, t] = win(2, 21); push({ artistId: a.id, artistName: a.name, type: r() < 0.5 ? 'snippet' : 'single', conf: conf(45, 35), from: f, to: t, text: pick([`${a.name} не сбавляет темп: следующий трек уже готов`, `у ${a.name} в запасе ещё три готовых сингла`, `${a.name} выпускает по треку в месяц и не собирается останавливаться`]) });
    } else if (hype >= 78 && roll < 0.4) {
      const [f, t] = win(3, 25); push({ artistId: a.id, artistName: a.name, type: 'clip', conf: conf(40, 40), from: f, to: t, text: pick([`${a.name} снимает клип с большим бюджетом`, `съёмочную группу ${a.name} видели в заброшенном аэропорту`, `${a.name} готовит клип-короткометражку`]) });
    } else if (alb && roll < 0.12) {
      const [f, t] = win(14, 70); push({ artistId: a.id, artistName: a.name, type: 'ep', title: `${alb.title} (Deluxe)`, conf: conf(25, 45), from: f, to: t, text: `«${alb.title}» получит делюкс-версию с неизданным` });
    } else if (roll > 0.965) {
      const [f, t] = win(1, 10); push({ artistId: a.id, artistName: a.name, type: 'single', conf: conf(15, 35), from: f, to: t, text: pick([`${a.name} записал ответ на чужой дисс`, `${a.name} готовит трек-сюрприз без анонса`, `${a.name} перепел старый хит в новом стиле`]) });
    }
  }
  // collab rumors
  const hot = metrics.filter(m => (m.hype || 0) >= 45);
  for (let i = 0; i < 4 && hot.length > 1; i++) {
    const a = hot[Math.floor(r() * hot.length)]; const cand = hot.filter(x => x !== a && norm(x.artist.genre) === norm(a.artist.genre));
    const b = cand[Math.floor(r() * cand.length)] || hot.find(x => x !== a);
    if (!b) break;
    const [f, t] = win(10, 75);
    push({ artistId: a.artist.id, artistName: a.artist.name, feat: b.artist.name, type: r() < 0.15 ? 'ep' : 'single', conf: conf(20, 55), from: f, to: t, text: pick([
      `${a.artist.name} и ${b.artist.name} записали совместный трек`, `${a.artist.name} и ${b.artist.name} замечены в одной студии`, `${b.artist.name} подписался на ${a.artist.name} — фанаты ждут фит`,
      `${a.artist.name} × ${b.artist.name}: совместный EP уже сведён`, `${a.artist.name} и ${b.artist.name} помирились — и, говорят, не просто так`]) });
  }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.slice(0, target ? 7 : 6);
}

type CalKind = 'single' | 'album' | 'ep' | 'snippet' | 'clip';
interface CalItem { key: string; title: string; artist: string; date: string; time?: string; cover?: string; teaser?: string; kind: CalKind; source: 'catalog' | 'ann'; refId?: string; refType?: 'track' | 'album'; ann?: Announcement }
const DOT: Record<string, string> = { catalog: 'bg-emerald-400', ann: 'bg-amber-400', snippet: 'bg-sky-400' };

export const ReleaseCalendarPro: React.FC<{
  artists: Artist[]; tracks: Track[]; albums: Album[];
  todayIso?: string;
  onRelease?: (a: Announcement) => void;
  onAddTrack?: (t: Track) => void;
  onAddAlbum?: (a: Album, tracks: Track[]) => void;
  onOpen?: (type: 'track' | 'album', id: string) => void;
  onOpenArtist?: (name: string) => void;
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

const CalendarModal: React.FC<React.ComponentProps<typeof ReleaseCalendarPro> & { onClose: () => void }> = ({ artists, tracks, albums, todayIso, onRelease, onAddTrack, onAddAlbum, onOpen, onOpenArtist, onClose }) => {
  usePlusCss();
  const playsMap = useMemo(() => { const m = new Map<string, number>(); tracks.forEach(t => m.set(`t-${t.id}`, t.plays || 0)); albums.forEach(a => m.set(`a-${a.id}`, a.totalPlays || 0)); return m; }, [tracks, albums]);
  const openArtistByName = onOpenArtist ? (name: string) => { onClose(); onOpenArtist(name); } : undefined;
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
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);
  const onSaved = useCallback((date: string, text: string) => { setMonth(date.slice(0, 7)); setSelDay(date); setFilter('all'); setToast(text); }, []);
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
      out.push({ key: `t-${t.id}`, title: t.title, artist: t.featuredArtist ? `${t.artistName} feat. ${t.featuredArtist}` : t.artistName, date: toISO(ms), cover: t.coverUrl, teaser: t.snippetTeaser, kind: t.isSnippet ? 'snippet' : 'single', source: 'catalog', refId: t.id, refType: 'track' });
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
  const rumors = useMemo(() => genRumors(artists, tracks, albums, today, rs.seed, new Set(rs.skip), selDay), [artists, tracks, albums, today, rs, selDay]);

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
                  const KW: Record<string, number> = { album: 4, ep: 3, single: 2, snippet: 1, clip: 0 };
                  const main = [...its].sort((a, b) => (KW[b.kind] || 0) - (KW[a.kind] || 0) || (playsMap.get(b.key) || 0) - (playsMap.get(a.key) || 0) || Number(Boolean(b.cover)) - Number(Boolean(a.cover)))[0];
                  return (
                    <button key={d} type="button" onClick={() => setSelDay(isSel ? null : d)}
                      className={`relative aspect-square rounded-xl text-[12px] font-bold overflow-hidden transition-all ${isSel ? 'ring-2 ring-white scale-[1.03]' : ''} ${isToday ? 'bg-white text-black' : past ? 'bg-white/[0.02] text-zinc-500 hover:bg-white/[0.06]' : 'bg-white/[0.04] text-zinc-200 hover:bg-white/[0.09]'}`}>
                      {main && !isToday && <CoverArt url={main.cover} title={main.title} className={`absolute inset-0 w-full h-full transition-opacity ${past ? 'opacity-30' : 'opacity-50'}`} innerClassName="w-full h-full object-cover" />}
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
                <>
                  <CalSection title={fmtDay(refToMs(selDay!))} items={list} empty="В этот день ничего. Нажми «+ Добавить»." now={now} today={today} artistOf={artistOf} setAnn={setAnn} setForm={setForm} onReleaseAnn={releaseAnn} onArtist={openArtistByName} onOpen={onOpen ? (t, id) => { onClose(); onOpen(t, id); } : undefined} />
                  <IdeaDeck target={selDay} artists={artists} tracks={tracks} albums={albums} today={today}
                    onEdit={i => setForm({ mode: i.kind === 'snippet' ? (onAddTrack ? 'snippet' : 'announce') : 'announce', type: i.kind, artistName: i.artist.name, title: i.title, date: i.date, featuredArtist: i.feat || '', note: i.teaser })}
                    onAccept={i => {
                      if (i.kind === 'snippet' && onAddTrack) {
                        onAddTrack({ id: uid('snip'), title: i.title, artistId: i.artist.id, artistName: i.artist.name, albumId: 'single', albumTitle: 'Single', duration: '0:45', plays: Math.round((i.artist.followers || 100000) * rnd(0.02, 0.07)), likes: 0, isLiked: false, releaseDate: i.date, coverUrl: '', isSnippet: true, snippetTeaser: i.teaser, featuredArtist: i.feat, genre: i.artist.genre } as Track);
                        onSaved(i.date, `Сниппет «${i.title}» добавлен с тизером`);
                      } else {
                        setAnn(p => [...p, { id: uid('ann'), title: i.title, artistName: i.artist.name, artistId: i.artist.id, type: i.kind === 'snippet' ? 'snippet' : i.kind, date: i.date, note: i.teaser, presaves: 0, createdAt: Date.now(), featuredArtist: i.feat }]);
                        onSaved(i.date, `Анонс «${i.title}» добавлен`);
                      }
                    }} />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{selDay ? `Слухи на ${fmtDay(refToMs(selDay))}` : 'Слухи индустрии'}</div>
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
              ) : (
                <>
                  <IdeaDeck artists={artists} tracks={tracks} albums={albums} today={today}
                    onEdit={i => setForm({ mode: i.kind === 'snippet' ? (onAddTrack ? 'snippet' : 'announce') : 'announce', type: i.kind, artistName: i.artist.name, title: i.title, date: i.date, featuredArtist: i.feat || '', note: i.teaser })}
                    onAccept={i => {
                      if (i.kind === 'snippet' && onAddTrack) {
                        onAddTrack({ id: uid('snip'), title: i.title, artistId: i.artist.id, artistName: i.artist.name, albumId: 'single', albumTitle: 'Single', duration: '0:45', plays: Math.round((i.artist.followers || 100000) * rnd(0.02, 0.07)), likes: 0, isLiked: false, releaseDate: i.date, coverUrl: '', isSnippet: true, snippetTeaser: i.teaser, featuredArtist: i.feat, genre: i.artist.genre } as Track);
                        onSaved(i.date, `Сниппет «${i.title}» добавлен с тизером`);
                      } else {
                        setAnn(p => [...p, { id: uid('ann'), title: i.title, artistName: i.artist.name, artistId: i.artist.id, type: i.kind === 'snippet' ? 'snippet' : i.kind, date: i.date, note: i.teaser, presaves: 0, createdAt: Date.now(), featuredArtist: i.feat }]);
                        onSaved(i.date, `Анонс «${i.title}» добавлен`);
                      }
                    }} />
                  <CalSection title="Скоро" items={upcoming} empty="Пока ничего не запланировано." now={now} today={today} artistOf={artistOf} setAnn={setAnn} setForm={setForm} onReleaseAnn={releaseAnn} onArtist={openArtistByName} onOpen={onOpen ? (t, id) => { onClose(); onOpen(t, id); } : undefined} />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{selDay ? `Слухи на ${fmtDay(refToMs(selDay))}` : 'Слухи индустрии'}</div>
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
              onAddTrack={onAddTrack} onAddAlbum={onAddAlbum} onSaved={onSaved} />}
          </AnimatePresence>
          <AnimatePresence>
            {toast && (
              <motion.div key={toast} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-2xl bg-white text-black text-xs font-black shadow-2xl">✓ {toast}</motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Portal>
  );
};

const CalSection: React.FC<{
  title: string; items: CalItem[]; empty: string; now: number; today: string; artistOf: (n: string) => Artist | undefined;
  setAnn: React.Dispatch<React.SetStateAction<Announcement[]>>; setForm: (f: any) => void; onReleaseAnn: (a: Announcement) => void; onOpen?: (t: 'track' | 'album', id: string) => void;
  onArtist?: (name: string) => void;
}> = ({ title, items, empty, now, today, artistOf, setAnn, setForm, onReleaseAnn, onOpen, onArtist }) => (
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
              <div className="text-[14px] font-black text-white truncate mt-0.5">
                {it.refId && onOpen ? <span onClick={() => onOpen(it.refType!, it.refId!)} className="cursor-pointer hover:underline" title="Открыть релиз">{it.title}</span> : it.title}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {splitNames(it.artist).map((nm, i) => (
                  <React.Fragment key={`${nm}-${i}`}>
                    {i > 0 && <span className="text-zinc-600">{i === 1 && /feat\./i.test(it.artist) ? ' feat. ' : ', '}</span>}
                    {onArtist ? <span onClick={() => onArtist(nm)} className="cursor-pointer hover:text-white hover:underline" title={`Открыть артиста ${nm}`}>{nm}</span> : nm}
                  </React.Fragment>
                ))}
              </div>
              {(a?.note || it.teaser) && <div className="text-[11px] text-zinc-300/80 italic line-clamp-2 mt-0.5">«{a?.note || it.teaser}»</div>}
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

// ---- artist picker: search with avatars, keyboard, popular first ----
const ArtistPicker: React.FC<{ value: string; onChange: (name: string) => void; artists: Artist[]; placeholder: string; exclude?: string }> = ({ value, onChange, artists, placeholder, exclude }) => {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const q = norm(value);
  const list = useMemo(() => {
    const ok = (a: Artist) => !exclude || norm(a.name) !== norm(exclude);
    const byFans = (x: Artist, y: Artist) => (y.followers || 0) - (x.followers || 0);
    if (!q) return artists.filter(ok).sort(byFans).slice(0, 8);
    const starts: Artist[] = [], incl: Artist[] = [];
    for (const a of artists) { if (!ok(a)) continue; const n = norm(a.name); if (n.startsWith(q)) starts.push(a); else if (n.includes(q)) incl.push(a); }
    return [...starts.sort(byFans), ...incl.sort(byFans)].slice(0, 8);
  }, [artists, q, exclude]);
  useEffect(() => { setHi(0); }, [q]);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const exact = artists.find(a => norm(a.name) === q);
  const pick = (a: Artist) => { onChange(a.name); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi(h => Math.min(list.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter' && open && list[hi]) { e.preventDefault(); pick(list[hi]); }
    else if (e.key === 'Escape' && open) { e.nativeEvent.stopPropagation(); setOpen(false); }
  };
  const showList = open && list.length > 0 && !(exact && list.length === 1 && norm(list[0].name) === q);
  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 bg-black/40 border border-white/10 focus-within:border-white/30 rounded-xl pl-2 pr-1.5 py-1.5 transition-colors">
        {exact ? <CoverArt url={exact.imageUrl} title={exact.name} isArtist className="w-7 h-7 rounded-full overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
          : <span className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[12px] text-zinc-500 shrink-0">@</span>}
        <input value={value} placeholder={placeholder} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none py-0.5 placeholder:text-zinc-500" />
        {exact && <span className="hidden sm:inline text-[10px] text-zinc-500 shrink-0">{fmtN(exact.followers || 0)} слуш.</span>}
        {value && <button type="button" onClick={() => { onChange(''); setOpen(true); }} className="w-6 h-6 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 shrink-0">×</button>}
      </div>
      <AnimatePresence>
        {showList && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}
            className="absolute z-40 left-0 right-0 mt-1 rounded-2xl border border-white/10 bg-[#17181e] shadow-[0_20px_60px_rgba(0,0,0,.6)] p-1 max-h-72 overflow-y-auto custom-scrollbar">
            {!q && <div className="px-2.5 pt-1.5 pb-1 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Популярные</div>}
            {list.map((a, i) => (
              <button type="button" key={a.id} onMouseDown={e => { e.preventDefault(); pick(a); }} onMouseEnter={() => setHi(i)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${hi === i ? 'bg-white/[0.08]' : ''}`}>
                <CoverArt url={a.imageUrl} title={a.name} isArtist className="w-8 h-8 rounded-full overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-white truncate">{a.name}</span>
                  <span className="block text-[10px] text-zinc-500 truncate">{fmtN(a.followers || 0)} слушателей{a.genre ? ` · ${a.genre}` : ''}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---- smart ideas v2: many flavours, steady droppers too, can target a chosen day ----
type IdeaKind = 'snippet' | 'single' | 'ep' | 'album' | 'clip';
type IdeaFlavor = 'full' | 'albumDue' | 'comeback' | 'steady' | 'hype' | 'deluxe' | 'anniversary' | 'feat' | 'remix' | 'acoustic' | 'surprise' | 'season' | 'studio' | 'live' | 'birthday';
interface Idea { id: string; kind: IdeaKind; flavor?: IdeaFlavor; artist: Artist; title: string; date: string; teaser: string; reason: string; feat?: string; score: number }
const IDEAS_LS = 'musaic.ideas.v1';
const T_MOODS = ['тёмный и медленный', 'летний вайб', 'жёсткий бит и злые панчи', 'грустно, но красиво', 'клубный разгон', 'очень личный текст', 'новое звучание', 'возвращение к корням', 'мелодия, которая не отпускает', 'ночной вайб', 'гитара и шёпот', 'безумный бит-свитч', 'ностальгия по нулевым', 'холодный трэп', 'танцевальный, но с надрывом', 'минимализм и голос'];
const T_HOOKS = ['Фанаты уже разбирают строчки', 'Комменты в огне', 'Похоже на будущий хит', 'Звучит как заявка на чарт', 'Вайб узнаётся с первых секунд', 'Пресейв уже открыт', 'В сети спорят, кто на фите', 'Это совсем другой {a}', 'Звук уже растащили на видео', 'Кажется, это лучший куплет года', 'Фанбаза в шоке', 'Таймер уже тикает'];
const TEASE: Record<IdeaFlavor, string[]> = {
  full: ['Полная версия «{t}» выходит {when}. Сниппет сделал своё дело', '«{t}» целиком — {when}. {hook}', 'Тот самый сниппет «{t}» наконец выходит {when}'],
  albumDue: ['{a} анонсировал альбом «{t}». Релиз {when}', 'Альбом «{t}»: {mood}. {hook}', '{a}: «{t}» — самый личный релиз. Выходит {when}', 'Обратный отсчёт: альбом {a} «{t}» {when}', 'EP «{t}» от {a} выйдет {when}'],
  comeback: ['{a} возвращается после {days} дн. тишины: «{t}» {when}', 'Тишина закончилась. {a} — «{t}», {when}', '{days} дней без релизов — и вот «{t}»{f}'],
  steady: ['{a} не сбавляет темп: «{t}»{f} {when}', 'Новый {kind} {a} каждую пару недель — «{t}» {when}', '{a} в форме: ещё один дроп «{t}» {when}', 'Стабильность — признак мастерства. «{t}» {when}'],
  hype: ['Пока хайп на пике: {a} готовит «{t}». {hook}', '{a} на волне — «{t}» {when}', 'Хайп {a} конвертируется в «{t}». {mood}'],
  deluxe: ['Делюкс «{t}»: +4 новых трека. {when}', '{a} расширяет «{alb}» — делюкс {when}', '«{t}»: неизданное и бонусы. {hook}'],
  anniversary: ['{n} лет «{alb}»: {a} готовит юбилейный клип', 'Годовщина «{alb}» — сюрприз от {a} {when}', 'В честь годовщины «{alb}»: «{t}» {when}'],
  feat: ['{a} и {f}: «{t}» {when}', 'Коллаб, которого ждали: {a} × {f} — «{t}»', 'В сторис {a} и {f} в одной студии. {hook}'],
  remix: ['Ремикс на «{top}» — {when}. {mood}', '«{t}»: {a} перевернул свой хит', '{a} отдал «{top}» на ремикс. {hook}'],
  acoustic: ['«{t}»: тот же хит, только гитара и голос', 'Акустика от {a} {when}. {mood}', '{a} показал «{top}» без бита. {hook}'],
  surprise: ['Без анонса: {a} просто выложит «{t}» {when}', 'Сюрприз-дроп от {a}. {hook}', 'Никто не ждал: «{t}»{f} уже {when}'],
  season: ['{season} от {a}: «{t}» {when}', 'Трек под {seasonTo} — «{t}». {mood}', '{a} закрывает {season2} релизом «{t}»'],
  studio: ['{a} засветился в студии: «{t}» — {mood}', 'Из студии {a}: 30 секунд «{t}». {hook}', '{a} тизерит «{t}» прямо из студии'],
  live: ['Live-сессия «{top}» от {a} {when}', '{a} записал живую версию «{top}». {hook}', 'Клип-концерт {a}: «{t}» {when}'],
  birthday: ['На свой день рождения {a} дарит фанатам «{t}»', 'Подарок от {a}: «{t}» {when}']
};
function whenPhrase(dateMs: number, todayMs: number) {
  const d = Math.round((dateMs - todayMs) / DAY);
  if (d === 0) return 'сегодня';
  if (d === 1) return 'завтра';
  if (d < 0) return fmtDayShort(dateMs);
  if (new Date(dateMs).getUTCDay() === 5 && d <= 7) return 'в эту пятницу';
  if (d <= 6) return 'на этой неделе';
  return fmtDayShort(dateMs);
}
const SEASONS = (month: number) => month >= 5 && month <= 7 ? ['Летний трек', 'жару', 'лето'] : month === 11 || month <= 1 ? ['Зимний релиз', 'снег и огни', 'год'] : month >= 8 && month <= 10 ? ['Осенний вайб', 'дождь за окном', 'осень'] : ['Весенний релиз', 'первое тепло', 'весну'];
function makeTeaser(flavor: IdeaFlavor, kind: IdeaKind, title: string, artist: string, feat: string | undefined, dateMs: number, todayMs: number, r: () => number, extra: { days?: number; alb?: string; top?: string; n?: number } = {}) {
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const [season, seasonTo, season2] = SEASONS(new Date(dateMs).getUTCMonth());
  return pick(TEASE[flavor] || TEASE.steady).replace('{hook}', pick(T_HOOKS)).replace('{mood}', pick(T_MOODS)).replace(/\{a\}/g, artist).replace(/\{t\}/g, title)
    .replace(/\{f\}/g, feat ? (flavor === 'feat' ? feat : ` и ${feat}`) : '').replace('{when}', whenPhrase(dateMs, todayMs)).replace('{days}', String(extra.days ?? ''))
    .replace(/\{alb\}/g, extra.alb || title).replace(/\{top\}/g, extra.top || title).replace('{n}', String(extra.n ?? 1)).replace('{kind}', kind === 'snippet' ? 'тизер' : 'трек')
    .replace('{season}', season).replace('{seasonTo}', seasonTo).replace('{season2}', season2).replace(/\{hook\}/g, pick(T_HOOKS));
}
function nextFriday(fromMs: number, minDays: number) { let d = fromMs + minDays * DAY; for (let i = 0; i < 7 && new Date(d).getUTCDay() !== 5; i++) d += DAY; return d; }

function genIdeas(artists: Artist[], tracks: Track[], albums: Album[], today: string, seed: number, skip: Set<string>, target?: string | null): Idea[] {
  const pool = [...artists].sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 160);
  let metrics: any[] = [];
  try { metrics = computeAllArtistMetrics(pool, tracks, albums, today); } catch { metrics = []; }
  const r = seeded(seed * 104729 + 31 + (target ? hashStr(target) % 9973 : 0));
  const t0 = refToMs(today);
  const tMs = target ? refToMs(target) : null;
  const month = new Date(tMs ?? t0).getUTCMonth();
  const cands: Array<{ m: any; kind: IdeaKind; flavor: IdeaFlavor; score: number; reason: string; title?: string; alb?: string; top?: string; n?: number; feat?: boolean }> = [];
  for (const m of metrics) {
    const art: Artist = m.artist;
    let exp = { score: m.hype, what: 'новый сингл', label: '' } as any;
    try { exp = computeFanExpectation(m); } catch { /* */ }
    const mine = tracks.filter(t => !t.isSnippet && (t.artistId === art.id || norm(t.artistName) === norm(art.name)));
    const top = [...mine].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0];
    const myAlbums = albums.filter(a => a.artistId === art.id || norm(a.artistName) === norm(art.name)).sort((a, b) => (parseDayMs(b.releaseDate, b.releaseYear) || 0) - (parseDayMs(a.releaseDate, a.releaseYear) || 0));
    const lastAlb = myAlbums[0]; const lastAlbAge = lastAlb ? (t0 - (parseDayMs(lastAlb.releaseDate, lastAlb.releaseYear) || t0)) / DAY : null;
    const opts: Array<[number, Omit<(typeof cands)[number], 'm' | 'score'>]> = [];
    if (m.activeSnippet) opts.push([3.2, { kind: 'single', flavor: 'full', reason: `Сниппет «${m.activeSnippet.title}» прогрет, пора полную версию`, title: m.activeSnippet.title }]);
    if (exp.what === 'альбом' && m.hype >= 45) opts.push([2.4, { kind: !m.hasReleasedAlbum && m.tracksCount < 8 ? 'ep' : r() < 0.6 ? 'album' : 'ep', flavor: 'albumDue', reason: `Без альбома ${m.daysSinceAlbum ?? 'давно'} дн. · ожидание ${exp.score}` }]);
    if (m.daysSilent >= 60) opts.push([2.1, { kind: r() < 0.4 ? 'snippet' : 'single', flavor: 'comeback', reason: `Тишина ${m.daysSilent} дн. · ${exp.label || 'ждут'}` }]);
    if (m.daysSilent >= 5 && m.daysSilent <= 45 && m.tracksCount >= 5) opts.push([2.3, { kind: r() < 0.45 ? 'snippet' : 'single', flavor: 'steady', reason: `Стабильно дропает · пауза ${m.daysSilent} дн.` }]);
    if (m.hype >= 72) opts.push([1.8, { kind: r() < 0.45 ? 'clip' : 'snippet', flavor: 'hype', reason: `Хайп ${m.hype}: самое время подогреть` }]);
    if (lastAlb && lastAlbAge !== null && lastAlbAge >= 45 && lastAlbAge <= 300) opts.push([0.9, { kind: 'ep', flavor: 'deluxe', reason: `«${lastAlb.title}» ещё на слуху`, title: `${lastAlb.title} (Deluxe)`, alb: lastAlb.title }]);
    if (lastAlb && lastAlbAge !== null && lastAlbAge >= 340) opts.push([0.7, { kind: r() < 0.5 ? 'clip' : 'single', flavor: 'anniversary', reason: `Годовщина «${lastAlb.title}»`, alb: lastAlb.title, n: Math.max(1, Math.round(lastAlbAge / 365)) }]);
    opts.push([1.2, { kind: r() < 0.5 ? 'snippet' : 'single', flavor: 'feat', reason: 'Логичный коллаб по жанру и аудитории', feat: true }]);
    if (top && (top.plays || 0) > 200_000) {
      opts.push([0.8, { kind: 'single', flavor: 'remix', reason: `«${top.title}» всё ещё крутят`, title: `${top.title} (Remix)`, top: top.title }]);
      opts.push([0.55, { kind: r() < 0.5 ? 'single' : 'clip', flavor: 'acoustic', reason: 'Хит в новом свете', title: `${top.title} (Acoustic)`, top: top.title }]);
      opts.push([0.5, { kind: 'clip', flavor: 'live', reason: 'Живая версия хита', title: `${top.title} — Live`, top: top.title }]);
    }
    opts.push([0.6, { kind: 'single', flavor: 'surprise', reason: 'Неожиданный дроп без анонса' }]);
    opts.push([0.6, { kind: 'single', flavor: 'season', reason: 'Сезонный релиз' }]);
    opts.push([0.7, { kind: 'snippet', flavor: 'studio', reason: 'Кусок из студии, чтобы напомнить о себе' }]);
    if (r() < 0.04) opts.push([2, { kind: 'single', flavor: 'birthday', reason: 'Подарок фанатам' }]);
    const total = opts.reduce((s, o) => s + o[0], 0);
    let x = r() * total; let chosen = opts[0];
    for (const o of opts) { x -= o[0]; if (x <= 0) { chosen = o; break; } }
    if (!chosen) continue;
    cands.push({ m, ...chosen[1], score: (exp.score || 40) + chosen[0] * 6 + r() * 30 });
  }
  cands.sort((a, b) => b.score - a.score);
  const out: Idea[] = []; const perFlavor = new Map<string, number>();
  const limit = target ? 8 : 7;
  for (const c of cands) {
    if (out.length >= limit) break;
    if ((perFlavor.get(c.flavor) || 0) >= 2) continue;
    const art: Artist = c.m.artist;
    const id = `i${hashStr(`${art.id}|${c.flavor}|${c.kind}|${seed}|${target || ''}`)}`;
    if (skip.has(id)) continue;
    const isBig = c.kind === 'album' || c.kind === 'ep';
    const title = c.title || smartTitle(art, tracks, albums, isBig);
    const dateMs = tMs !== null ? tMs : c.kind === 'snippet' ? t0 + Math.round(1 + r() * 5) * DAY : c.kind === 'clip' ? t0 + Math.round(3 + r() * 7) * DAY
      : c.kind === 'single' ? nextFriday(t0, Math.round(4 + r() * 10)) : c.kind === 'ep' ? nextFriday(t0, Math.round(14 + r() * 20)) : nextFriday(t0, Math.round(21 + r() * 40));
    const feat = c.feat || ((c.kind === 'single' || c.kind === 'snippet') && r() < 0.22) ? suggestFeat(art, artists, c.m)?.name : undefined;
    if (c.flavor === 'feat' && !feat) continue;
    perFlavor.set(c.flavor, (perFlavor.get(c.flavor) || 0) + 1);
    out.push({ id, kind: c.kind, flavor: c.flavor, artist: art, title, date: toISO(dateMs), feat, reason: c.reason, score: c.score,
      teaser: makeTeaser(c.flavor, c.kind, title, art.name, feat, dateMs, t0, r, { days: c.m.daysSilent, alb: c.alb, top: c.top, n: c.n }) });
  }
  return out;
}

const KIND_RU: Record<IdeaKind, string> = { snippet: 'Сниппет', single: 'Сингл', ep: 'EP', album: 'Альбом', clip: 'Клип' };
const IdeaDeck: React.FC<{ artists: Artist[]; tracks: Track[]; albums: Album[]; today: string; target?: string | null; onAccept: (i: Idea) => void; onEdit: (i: Idea) => void }> = ({ artists, tracks, albums, today, target, onAccept, onEdit }) => {
  const [st, setSt] = useState(() => lsGet<{ seed: number; skip: string[] }>(IDEAS_LS, { seed: 1, skip: [] }));
  useEffect(() => lsSet(IDEAS_LS, st), [st]);
  const ideas = useMemo(() => genIdeas(artists, tracks, albums, today, st.seed, new Set(st.skip), target), [artists, tracks, albums, today, st, target]);
  const drop = (id: string) => setSt(p => ({ ...p, skip: [...p.skip, id].slice(-500) }));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{target ? `Идеи на ${fmtDay(refToMs(target))}` : 'Умные идеи'}</div>
        <button type="button" onClick={() => setSt(p => ({ ...p, seed: p.seed + 1 }))} className="text-[11px] font-bold text-zinc-400 hover:text-white">🎲 Ещё варианты</button>
      </div>
      {ideas.length === 0 && <div className="text-xs text-zinc-500 py-3">Идей пока нет. Нажми «Ещё варианты».</div>}
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {ideas.map(i => (
            <motion.div key={i.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}
              className="flex gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/[0.07] to-transparent border border-white/[0.06] p-3">
              <CoverArt url={i.artist.imageUrl} title={i.artist.name} isArtist className="w-11 h-11 rounded-full overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-200">{KIND_RU[i.kind]}</span>
                  <span className="text-[10px] text-zinc-500">{fmtDayShort(refToMs(i.date))} · {i.reason}</span>
                </div>
                <div className="text-[12.5px] font-bold text-white leading-snug mt-1">{i.teaser}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button type="button" onClick={() => { onAccept(i); drop(i.id); }} className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-black">Принять</button>
                  <button type="button" onClick={() => onEdit(i)} className="text-[10px] font-bold text-zinc-400 hover:text-white">изменить</button>
                  <button type="button" onClick={() => drop(i.id)} className="text-[10px] text-zinc-600 hover:text-rose-400">отклонить</button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CalForm: React.FC<{
  form: any; setForm: (f: any) => void; artists: Artist[]; tracks: Track[]; albums: Album[]; today: string; canPast: boolean;
  onSaveAnn: (a: Announcement) => void; onAddTrack?: (t: Track) => void; onAddAlbum?: (a: Album, t: Track[]) => void; onSaved: (date: string, text: string) => void;
}> = ({ form, setForm, artists, tracks, albums, today, canPast, onSaveAnn, onAddTrack, onAddAlbum, onSaved }) => {
  const art = artists.find(a => norm(a.name) === norm(form.artistName));
  const set = (p: any) => setForm({ ...form, ...p });
  const isAlbum = form.type === 'album' || form.type === 'ep';
  const [hint, setHint] = useState('');
  const t0 = refToMs(today);
  const genTitle = () => set({ title: smartTitle(art, tracks, albums, isAlbum) });
  const genTeaser = () => {
    const kind: IdeaKind = form.mode === 'snippet' ? 'snippet' : (form.type as IdeaKind) || 'single';
    set({ note: makeTeaser(kind, form.title || 'новый трек', art?.name || form.artistName || 'Артист', form.featuredArtist || undefined, refToMs(form.date || today), t0, Math.random) });
  };
  const genPlays = () => {
    if (!art) { setHint('Выбери артиста из базы для прогноза'); return; }
    const age = Math.max(0, Math.floor((t0 - refToMs(form.date || today)) / DAY));
    const r = smartPlays(art, artists, tracks, albums, form.date || today, isAlbum ? 'album' : 'track', { ageDays: age });
    set({ plays: formatNumber(r.plays) });
    setHint(`Хайп ${r.m?.hype ?? '—'} · релизу ${age} дн. → ${fmtN(r.plays)}`);
  };
  const genTracklist = (base = form) => {
    const a = artists.find(x => norm(x.name) === norm(base.artistName));
    if (!a) { setHint('Выбери артиста из базы'); return base; }
    const count = base.type === 'ep' ? Math.round(rnd(4, 6)) : Math.round(rnd(10, 14));
    const est = smartPlays(a, artists, tracks, albums, base.date || today, 'album', { albumTracks: count });
    try {
      const list = generateAlbumTracksWithFeats({ artist: a, allArtists: artists, count, estimatedAlbumPlays: est.plays, existingTitles: new Set(tracks.map(t => t.title.toLowerCase())), namingProfile: est.m?.namingProfile || false });
      return { ...base, tracklist: list.map(t => (t.featuredArtist ? `${t.title} (feat. ${t.featuredArtist})` : t.title)).join('\n') };
    } catch { setHint('Не получилось сгенерировать'); return base; }
  };
  /** random, but logical: who, what and when follows the artists' state */
  const randomLogical = () => {
    if (form.mode === 'past') {
      const pool = [...artists].sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 60);
      const a = pool[Math.floor(Math.pow(Math.random(), 1.6) * pool.length)];
      if (!a) return;
      const type = Math.random() < 0.72 ? 'single' : Math.random() < 0.5 ? 'ep' : 'album';
      const date = toISO(t0 - Math.round(rnd(7, 540)) * DAY);
      const age = Math.max(0, (t0 - refToMs(date)) / DAY);
      const feat = type === 'single' && Math.random() < 0.3 ? suggestFeat(a, artists, null)?.name : undefined;
      const r = smartPlays(a, artists, tracks, albums, date, type === 'single' ? 'track' : 'album', { ageDays: age });
      let next: any = { ...form, artistName: a.name, type, date, featuredArtist: feat || '', title: smartTitle(a, tracks, albums, type !== 'single'), plays: formatNumber(r.plays) };
      if (type !== 'single') next = genTracklist(next);
      setForm(next); setHint(`Случайно, но по логике: ${a.name} · ${KIND_RU[type as IdeaKind]} · ${fmtDay(refToMs(date))}`);
      return;
    }
    const ideas = genIdeas(artists, tracks, albums, today, Math.floor(Math.random() * 1e6), new Set());
    const i = ideas.filter(x => (form.mode === 'snippet' ? x.kind === 'snippet' : x.kind !== 'snippet'))[0] || ideas[0];
    if (!i) { setHint('Не хватает данных для идеи'); return; }
    setForm({ ...form, artistName: i.artist.name, title: i.title, date: i.date, type: form.mode === 'snippet' ? 'snippet' : i.kind === 'snippet' ? 'single' : i.kind, featuredArtist: i.feat || '', note: i.teaser });
    setHint(i.reason);
  };
  const save = () => {
    if (!form.title?.trim() || !form.date) return;
    const name = (form.artistName || '').trim() || 'Без артиста';
    const artistId = art?.id || `guest_${name}`;
    const plays = Math.max(0, parseInt(String(form.plays || '0').replace(/\D/g, ''), 10) || 0);
    const title = form.title.trim();
    if (form.mode === 'announce') {
      onSaveAnn({ id: form.id || uid('ann'), title, artistName: art?.name || name, artistId: art?.id, type: form.type || 'single', date: form.date, time: form.time || undefined, coverUrl: form.coverUrl, note: form.note?.trim() || undefined, presaves: form.presaves || 0, released: form.released, createdAt: form.createdAt || Date.now(), featuredArtist: form.featuredArtist?.trim() || undefined });
      onSaved(form.date, `Анонс «${title}» сохранён`);
    } else if (form.mode === 'snippet' && onAddTrack) {
      const fol = art?.followers || 100000;
      onAddTrack({ id: uid('snip'), title, artistId, artistName: art?.name || name, albumId: 'single', albumTitle: 'Single', duration: '0:45', plays: plays || Math.round(fol * rnd(0.02, 0.07)), likes: 0, isLiked: false, releaseDate: form.date, coverUrl: form.coverUrl || '', isSnippet: true, snippetTeaser: form.note?.trim() || undefined, featuredArtist: form.featuredArtist?.trim() || undefined, genre: art?.genre } as Track);
      onSaved(form.date, `Сниппет «${title}» добавлен${form.note?.trim() ? ' с тизером' : ''}`);
    } else if (form.mode === 'past') {
      const ageDays = Math.max(0, (t0 - refToMs(form.date)) / DAY);
      if (isAlbum && onAddAlbum) {
        const lines: string[] = String(form.tracklist || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
        const total = plays || (art ? smartPlays(art, artists, tracks, albums, form.date, 'album', { ageDays }).plays : 1_000_000);
        const albumId = uid('alb');
        const w = lines.map((_, i) => (1 / Math.pow(i + 1.6, 0.55)) * rnd(0.7, 1.3)); const ws = w.reduce((x, y) => x + y, 0) || 1;
        const ts: Track[] = lines.map((l, i) => {
          const fm = /\((?:feat\.?|ft\.?)\s*([^)]+)\)\s*$/i.exec(l);
          const p = Math.round((total * w[i]) / ws);
          return { id: uid('trk'), title: fm ? l.slice(0, fm.index).trim() : l, artistId, artistName: art?.name || name, albumId, albumTitle: title, duration: randDuration(), plays: p, likes: Math.round(p * 0.03), isLiked: false, releaseDate: form.date, coverUrl: form.coverUrl || '', featuredArtist: fm ? fm[1].trim() : undefined, genre: art?.genre } as Track;
        });
        onAddAlbum({ id: albumId, title, artistId, artistName: art?.name || name, coverUrl: form.coverUrl || '', releaseYear: +form.date.slice(0, 4), releaseDate: form.date, genre: art?.genre || '', isLiked: false, totalPlays: total } as Album, ts);
        onSaved(form.date, `${form.type === 'ep' ? 'EP' : 'Альбом'} «${title}» добавлен · ${ts.length} треков`);
      } else if (onAddTrack) {
        const p = plays || (art ? smartPlays(art, artists, tracks, albums, form.date, 'track', { ageDays }).plays : 100000);
        onAddTrack({ id: uid('trk'), title, artistId, artistName: art?.name || name, albumId: 'single', albumTitle: 'Single', duration: randDuration(), plays: p, likes: Math.round(p * 0.03), isLiked: false, releaseDate: form.date, coverUrl: form.coverUrl || '', featuredArtist: form.featuredArtist?.trim() || undefined, genre: art?.genre } as Track);
        onSaved(form.date, `Сингл «${title}» добавлен в каталог`);
      }
    }
    setForm(null);
  };
  const inp = 'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30';
  const mini = 'px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-sm shrink-0';
  const types: Array<[string, string]> = form.mode === 'snippet' ? [] : form.mode === 'past' ? [['single', 'Сингл'], ['ep', 'EP'], ['album', 'Альбом']] : [['single', 'Сингл'], ['ep', 'EP'], ['album', 'Альбом'], ['snippet', 'Сниппет'], ['clip', 'Клип']];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3" onMouseDown={e => { if (e.target === e.currentTarget) setForm(null); }}>
      <motion.div initial={{ y: 14, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} className="w-full max-w-lg max-h-[86vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/10 bg-[#121318] p-5 space-y-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04]">
          {([['past', 'Вышедший релиз'], ['announce', 'Анонс / пре-сейв'], ['snippet', 'Сниппет']] as const).filter(([v]) => v === 'announce' || canPast).map(([v, l]) => (
            <button key={v} type="button" onClick={() => set({ mode: v, type: v === 'snippet' ? 'snippet' : form.type === 'snippet' || form.type === 'clip' ? 'single' : form.type })} className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-colors ${form.mode === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>
        <button type="button" onClick={randomLogical} className="w-full py-2 rounded-xl border border-dashed border-white/15 hover:border-white/30 text-[12px] font-bold text-zinc-300 hover:text-white transition-colors">🎲 Случайно, но логично</button>
        <ArtistPicker value={form.artistName || ''} onChange={v => set({ artistName: v })} artists={artists} placeholder="Исполнитель: начни вводить имя" />
        <div className="flex gap-2">
          <input placeholder="Название" value={form.title || ''} onChange={e => set({ title: e.target.value })} className={inp} />
          <button type="button" onClick={genTitle} title="Название в стиле артиста" className={mini}>✨</button>
        </div>
        {types.length > 0 && (
          <div className="flex flex-wrap gap-1">{types.map(([t, l]) => <button key={t} type="button" onClick={() => set({ type: t })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${form.type === t ? 'bg-white text-black' : 'bg-white/[0.05] text-zinc-400'}`}>{l}</button>)}</div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={form.date || ''} max={form.mode === 'past' ? today : undefined} onChange={e => set({ date: e.target.value })} className={`${inp} [color-scheme:dark]`} />
          {form.mode === 'announce'
            ? <input type="time" value={form.time || ''} onChange={e => set({ time: e.target.value })} className={`${inp} [color-scheme:dark]`} />
            : <div className="flex gap-1"><input placeholder="Прослушивания" value={form.plays || ''} onChange={e => set({ plays: e.target.value })} className={inp} /><button type="button" onClick={genPlays} title="Реалистично по артисту" className={mini}>🎯</button></div>}
        </div>
        {!isAlbum && <ArtistPicker value={form.featuredArtist || ''} onChange={v => set({ featuredArtist: v })} artists={artists} exclude={form.artistName} placeholder="Фит (необязательно)" />}
        {form.mode === 'past' && isAlbum && (
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span className="text-[11px] text-zinc-500">Треклист: по строке на трек, фит как «(feat. Имя)»</span><button type="button" onClick={() => setForm(genTracklist())} className="text-[11px] font-bold text-zinc-300 hover:text-white">🎲 Сгенерировать</button></div>
            <textarea rows={6} value={form.tracklist || ''} onChange={e => set({ tracklist: e.target.value })} className={`${inp} font-mono text-[12px]`} />
          </div>
        )}
        {form.mode !== 'past' && (
          <div className="flex gap-2">
            <textarea rows={2} placeholder={form.mode === 'snippet' ? 'Тизер: текст под сниппетом' : 'Тизер анонса или заметка'} value={form.note || ''} onChange={e => set({ note: e.target.value })} className={`${inp} resize-none`} />
            <button type="button" onClick={genTeaser} title="Сгенерировать тизер" className={mini}>🎲</button>
          </div>
        )}
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

// ---------------------------------------------------------------------------
// 5. SCORE RING — prettier rating circles (same sizes and props as the old ScoreBadge)
// ---------------------------------------------------------------------------
const scoreTier = (sc: number) =>
  sc >= 90 ? { c1: '#fde68a', c2: '#fbbf24', label: 'Шедевр' } : sc >= 80 ? { c1: '#e9d5ff', c2: '#c084fc', label: 'Выдающийся' }
    : sc >= 70 ? { c1: '#bfdbfe', c2: '#60a5fa', label: 'Сильный' } : sc >= 60 ? { c1: '#a5f3fc', c2: '#22d3ee', label: 'Хороший' }
      : sc >= 50 ? { c1: '#a7f3d0', c2: '#34d399', label: 'Средний' } : { c1: '#e4e4e7', c2: '#a1a1aa', label: 'Слабый' };
const CRIT: Array<[string, string]> = [['rhymes', 'Рифмы'], ['structure', 'Структура'], ['style', 'Стиль'], ['charisma', 'Харизма'], ['vibe', 'Вайб']];
const RING: Record<string, { s: number; w: number; f: number }> = { sm: { s: 30, w: 1.8, f: 11 }, md: { s: 40, w: 2, f: 13 }, lg: { s: 50, w: 2.3, f: 16 } };

export const ScoreRing: React.FC<{ rating?: any; size?: 'sm' | 'md' | 'lg'; showDetailsOnHover?: boolean; className?: string }> = memo(({ rating, size = 'md', showDetailsOnHover = true, className = '' }) => {
  const gid = React.useId().replace(/:/g, '');
  const ref = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const sc = typeof rating?.totalScore === 'number' ? Math.round(rating.totalScore) : null;
  if (sc === null) return null;
  const { s, w, f } = RING[size] || RING.md;
  const t = scoreTier(sc);
  const r = (s - w) / 2; const C = 2 * Math.PI * r; const pct = clamp(sc / 90, 0, 1);
  const show = () => { if (!showDetailsOnHover || !ref.current) return; const b = ref.current.getBoundingClientRect(); setTip({ x: b.left + b.width / 2, y: b.bottom + 8 }); };
  const hasCrit = CRIT.some(([k]) => typeof rating?.[k] === 'number');
  return (
    <span ref={ref} className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`} style={{ width: s, height: s }} onMouseEnter={show} onMouseLeave={() => setTip(null)}>
      <svg width={s} height={s} className="absolute inset-0 -rotate-90">
        <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={t.c1} /><stop offset="100%" stopColor={t.c2} /></linearGradient></defs>
        <circle cx={s / 2} cy={s / 2} r={r} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.07)" strokeWidth={w} />
        <motion.circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={w} strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct) }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="relative font-semibold tabular-nums leading-none tracking-tight" style={{ fontSize: f, color: t.c1 }}>{sc}</span>
      {tip && typeof document !== 'undefined' && createPortal(
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="fixed z-[2000] -translate-x-1/2 w-56 rounded-2xl border border-white/10 bg-[#141519]/95 backdrop-blur-xl p-3 shadow-2xl pointer-events-none"
          style={{ left: tip.x, top: tip.y }}>
          <div className="flex items-baseline justify-between"><span className="text-[11px] font-black uppercase tracking-widest" style={{ color: t.c1 }}>{t.label}</span><span className="text-[13px] font-black text-white tabular-nums">{sc}<span className="text-zinc-500 text-[11px]">/90</span></span></div>
          {hasCrit && <div className="mt-2 space-y-1">{CRIT.filter(([k]) => typeof rating?.[k] === 'number').map(([k, l]) => (
            <div key={k} className="flex items-center gap-2 text-[11px]"><span className="w-16 text-zinc-400">{l}</span><span className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${rating[k] * 10}%`, background: `linear-gradient(90deg, ${t.c1}, ${t.c2})` }} /></span><span className="w-5 text-right font-bold text-white tabular-nums">{rating[k]}</span></div>
          ))}</div>}
          {rating?.nominations?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{rating.nominations.slice(0, 4).map((n: string) => <span key={n} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300">🏆 {n}</span>)}</div>}
        </motion.div>, document.body)}
    </span>
  );
});

// ---------------------------------------------------------------------------
// 7. REVIEWS & METASCORE v3 — critics with their own taste, real competition
// Depends on: your rating (main), plays vs the artist's usual level, the wait
// since the previous release, feats, tracklist, genre, artist's track record,
// chart peak + a pinch of random. 95+ is very rare, perfect 100 almost never.
// ---------------------------------------------------------------------------
type CritKey = 'rhymes' | 'structure' | 'style' | 'charisma' | 'vibe';
interface Outlet { n: string; scale: '100' | '10' | '5' | 'abc'; bias: number; sd: number; likes: CritKey[]; pop: number; under: number; longHate: number; featLove: number; tone: 'warm' | 'cold' | 'ironic' | 'poetic' | 'data' }
const OUTLETS: Outlet[] = [
  { n: 'Звук.Журнал', scale: '100', bias: 0, sd: 6, likes: ['structure', 'style'], pop: 0, under: 0, longHate: 1, featLove: 0, tone: 'warm' },
  { n: 'Пульс', scale: '10', bias: -3, sd: 7, likes: ['vibe'], pop: 1, under: 0, longHate: 0, featLove: 1, tone: 'warm' },
  { n: 'Рэп-Обзор', scale: '100', bias: 2, sd: 6, likes: ['rhymes', 'charisma'], pop: 0, under: 1, longHate: 0, featLove: 1, tone: 'ironic' },
  { n: 'Сабвуфер', scale: '5', bias: -1, sd: 8, likes: ['vibe', 'style'], pop: 0, under: 0, longHate: 1, featLove: 0, tone: 'warm' },
  { n: 'Волна', scale: '10', bias: 1, sd: 6, likes: ['vibe', 'charisma'], pop: 1, under: 0, longHate: 0, featLove: 1, tone: 'poetic' },
  { n: 'NOISE', scale: '100', bias: -7, sd: 9, likes: ['structure'], pop: -2, under: 2, longHate: 2, featLove: -1, tone: 'cold' },
  { n: 'Бит & Слово', scale: '10', bias: 0, sd: 6, likes: ['rhymes', 'structure'], pop: 0, under: 1, longHate: 1, featLove: 0, tone: 'poetic' },
  { n: 'Ночной эфир', scale: '5', bias: 2, sd: 7, likes: ['vibe'], pop: 0, under: 0, longHate: 0, featLove: 0, tone: 'poetic' },
  { n: 'Чарт-Аналитика', scale: '100', bias: -1, sd: 5, likes: ['charisma'], pop: 2, under: -1, longHate: 0, featLove: 1, tone: 'data' },
  { n: 'Андеграунд Сейчас', scale: 'abc', bias: -2, sd: 9, likes: ['style', 'rhymes'], pop: -2, under: 2, longHate: 1, featLove: -1, tone: 'ironic' },
  { n: 'Громко', scale: '10', bias: 1, sd: 7, likes: ['charisma', 'vibe'], pop: 2, under: -1, longHate: 0, featLove: 2, tone: 'warm' },
  { n: 'Плейлист Недели', scale: '5', bias: 3, sd: 6, likes: ['vibe'], pop: 1, under: 0, longHate: 1, featLove: 1, tone: 'warm' },
  { n: 'Тихий Критик', scale: '100', bias: -4, sd: 6, likes: ['structure', 'rhymes'], pop: -1, under: 1, longHate: 2, featLove: -1, tone: 'cold' },
  { n: 'Хайп-Радар', scale: '10', bias: 0, sd: 10, likes: ['charisma'], pop: 2, under: -1, longHate: 0, featLove: 2, tone: 'ironic' }
];
const CRIT_RU: Record<string, string> = { rhymes: 'рифмы', structure: 'структура', style: 'стиль', charisma: 'харизма', vibe: 'вайб' };
const CRIT_GOOD: Record<CritKey, string[]> = {
  rhymes: ['панчи цепляют с первого прослушивания', 'рифмы плотные и неочевидные', 'тексты хочется разбирать на цитаты', 'игра слов здесь на уровень выше среднего'],
  structure: ['всё выстроено как цельная история', 'драматургия продумана до мелочей', 'ни одного лишнего перехода', 'порядок треков работает на общий сюжет'],
  style: ['звучание узнаётся с первых секунд', 'продакшн смелый и свежий', 'стилистически это шаг вперёд', 'саунд хочется разбирать на детали'],
  charisma: ['подача держит внимание даже в слабых местах', 'харизма вытаскивает любой бит', 'голос и интонации здесь главный инструмент', 'уверенность чувствуется в каждом куплете'],
  vibe: ['атмосфера затягивает с головой', 'настроение выдержано от начала до конца', 'это музыка, которую чувствуешь', 'вайб здесь сильнее любых слов']
};
const CRIT_BAD: Record<CritKey, string[]> = {
  rhymes: ['тексты местами проваливаются в банальность', 'рифмы слишком предсказуемы', 'панчей мало, проходных строк много'],
  structure: ['альбому не хватает формы', 'треки будто собраны из разных сессий', 'середина рассыпается'],
  style: ['звук слишком похож на всё вокруг', 'продакшн безопасный до скуки', 'стилистически топчется на месте'],
  charisma: ['подаче не хватает огня', 'исполнение звучит вяло', 'местами кажется, что артист сам себе не верит'],
  vibe: ['настроение скачет без причины', 'атмосфера не успевает сложиться', 'вайб теряется к середине']
};
const GENRE_WORDS: Array<[RegExp, string[]]> = [
  [/trap|трэп|drill|дрилл/i, ['808 гудят как надо', 'хай-хэты нарезаны филигранно', 'бас бьёт в грудь', 'это трэп без скидок']],
  [/phonk|фонк/i, ['коубелл и грязь на своём месте', 'дрифтовый саунд узнаётся сразу', 'тёмный фонк в лучшем виде']],
  [/pop|поп/i, ['припевы залипают намертво', 'хуки сделаны под радио и TikTok', 'поп, который не стыдно любить']],
  [/rock|рок|punk|панк/i, ['гитары звучат живо', 'энергия как на концерте', 'драйв не отпускает']],
  [/r&b|rnb|соул|soul/i, ['вокальные партии бархатные', 'грув мягкий и тёплый', 'чувственность без перебора']],
  [/electro|house|techno|электрон|хаус/i, ['клубный пульс не сбивается', 'синтезаторы переливаются', 'танцпол оценит']],
  [/indie|инди|alt|альт/i, ['звук тёплый и немного ломаный', 'инди-шарм на месте', 'камерно, но очень лично']],
  [/rap|рэп|hip|хип/i, ['биты качают', 'флоу меняется как надо', 'олдскульная школа чувствуется']]
];
const RV3 = {
  open: {
    s: ['«{t}» — релиз, который будут цитировать годами.', 'Это вершина {a}. Без оговорок.', 'Редкий случай: каждая секунда «{t}» на своём месте.', '{a} выпустил работу, с которой теперь будут сравнивать всех.', 'После «{t}» планка жанра сдвинулась.'],
    hi: ['«{t}» держит планку от первой до последней секунды.', 'Тот случай, когда хайп оправдан.', '{a} нашёл баланс между хитом и высказыванием.', '«{t}» звучит увереннее, чем всё, что выходило в жанре за месяц.', '«{t}» — самый цельный релиз {a} на сегодня.', '{a} звучит уверенно как никогда.', 'Редкий случай, когда {kind} слушается от начала до конца.', 'На «{t}» {a} наконец нашёл своё звучание.', 'Это тот релиз, который вспомнят в итогах года.', '{a} не просто вернулся — он задал тон.', '«{t}» звучит дорого, смело и очень по-своему.'],
    mid: ['Хорошо, но на повтор не просится.', '«{t}» — аккуратная работа без риска.', '{a} снова делает то, что умеет. Не больше.', 'Половина «{t}» — вау, половина — фон.', '«{t}» держится на нескольких сильных моментах.', 'Добротный {kind} без больших сюрпризов.', '{a} играет на своём поле: уверенно, но предсказуемо.', 'Хорошие идеи соседствуют с проходными местами.', 'Ровный релиз, которому не хватает одного смелого шага.', '«{t}» приятно слушать, но сложно запомнить целиком.', 'Крепкий середняк — с потенциалом на большее.'],
    lo: ['Идей меньше, чем минут.', '«{t}» больше похож на обязательство перед лейблом.', 'Звук есть, мысли нет.', '«{t}» звучит как черновик большого релиза.', 'Слишком много самоповторов.', '{a} явно торопился.', 'Пара удачных моментов тонет в однообразии.', 'Звучит устало, будто на автопилоте.', 'От {a} ждали большего — и это чувствуется.'],
    x: ['«{t}» — самый слабый момент в карьере {a}.', 'Сложно найти, за что зацепиться.', 'Это провал, и он громкий.', 'Ощущение, что «{t}» вышел по ошибке.']
  },
  wait: {
    longHi: ['{a} молчал {wait} — и пауза окупилась.', 'Ожидание в {wait} оправдано полностью.', 'Фанаты ждали {wait}, и это стоило каждого дня.'],
    longLo: ['После {wait} тишины хотелось большего.', 'Ждали {wait} — получили набросок.', 'Пауза в {wait} подняла ожидания, до которых релиз не дотянулся.'],
    fast: ['{a} выпускает музыку без пауз — и это начинает утомлять.', 'Новый релиз через {wait} после прошлого: темп впечатляет, глубина — нет.', 'Скорость {a} пугает: {wait} между релизами, а качество держится.'],
    debut: ['Для первого серьёзного релиза — очень уверенно.', 'Дебют, который сложно проигнорировать.', 'Первый большой шаг — и сразу заметный.']
  },
  plays: {
    up: ['Цифры говорят сами за себя: {plays} прослушиваний.', 'Слушатели проголосовали рублём и временем: {plays}.', 'Аудитория приняла релиз даже теплее критиков.'],
    down: ['Релиз прошёл тише, чем привыкли поклонники.', 'Цифры скромнее обычного: {plays}.', 'Публика пока не распробовала.'],
    chart: ['Пик в чарте — №{peak}, и это заслуженно.', 'Чарт подтвердил: №{peak} на пике.']
  },
  top: ['Главный момент — «{top}».', '«{top}» — то, ради чего стоит включить релиз.', 'Лучше всего работает «{top}».', 'Трек-магнит здесь «{top}».', '«{top}» уже звучит как будущий хит.'],
  weak: ['«{weak}» явно лишний.', 'Провисает разве что «{weak}».', '«{weak}» можно было оставить в черновиках.'],
  opener: ['Открывающий «{first}» сразу задаёт планку.', 'Старт с «{first}» — сильное решение.'],
  closer: ['Финальный «{last}» закрывает историю красиво.', '«{last}» в конце оставляет послевкусие.'],
  feats: {
    good: ['Гости ({feats}) звучат органично.', 'Фиты с {feats} добавляют красок.', 'Лучший куплет, возможно, у {guest}.', '{guest} на фите — точное попадание.'],
    bad: ['Гости ({feats}) местами перетягивают одеяло.', 'Даже {feats} не спасают середину.', '{guest} на фите звучит чужеродно.'],
    many: ['Гостей так много, что сам {a} теряется.', 'Список фитов длиннее, чем хотелось бы.']
  },
  inAlb: { hi: ['Один из лучших треков «{alb}».', 'В контексте «{alb}» трек раскрывается ещё сильнее.', 'Если слушать «{alb}» выборочно — начинать с него.', 'Сердце альбома «{alb}».'], mid: ['Крепкий, но не главный трек «{alb}».', 'Внутри «{alb}» он скорее связка, чем вершина.', 'На фоне «{alb}» звучит ровно.'], lo: ['На фоне остального «{alb}» заметно проседает.', 'Самое слабое звено «{alb}».', 'Без него «{alb}» был бы плотнее.'] },
  long: ['{n} треков — многовато, середина проседает.', 'Хронометраж можно было смело урезать.'],
  short: ['{n} треков пролетают на одном дыхании.', 'Коротко, плотно, без воды.'],
  single: ['Для сингла — очень ёмкое высказывание.', 'Три минуты, которые хочется поставить на повтор.', 'Сингл, который работает и в наушниках, и в колонке.'],
  prev: { hi: ['После «{prev}» это заметный шаг вперёд.', 'Рядом с «{prev}» новый релиз звучит взрослее.'], mid: ['Продолжает линию «{prev}», не больше и не меньше.'], lo: ['До уровня «{prev}» не дотягивает.', '«{prev}» был смелее.'] },
  career: { hi: ['Планка {a} традиционно высокая — и она взята.'], lo: ['Для артиста с таким каталогом — шаг назад.'] },
  pop: { big: ['Масштаб {a} обязывает, и критики смотрят строже.', 'Когда у тебя {fol} слушателей, каждая ошибка заметнее.'], small: ['Для артиста с {fol} слушателей — это заявка на большее.', 'Слишком хорошо, чтобы оставаться в тени.'] },
  tone: {
    cold: ['Без эмоций: факт есть факт.', 'Мы не впечатлены так просто.'],
    ironic: ['Ну что, комменты, ваш выход.', 'Мем-потенциал — отдельная оценка.'],
    poetic: ['Это музыка для ночной дороги.', 'Звучит как воспоминание, которого не было.'],
    data: ['По удержанию слушателей — выше медианы жанра.', 'Скипов меньше, чем у прошлых работ.'],
    warm: ['Видно, сколько сил в это вложено.', 'Сделано с любовью к деталям.']
  },
  close: { s: ['Классика с первого дня.', 'Must listen. Без вариантов.', 'Претендент на всё сразу.'], hi: ['Must listen.', 'Один из релизов года.', 'Слушать целиком и на громкости.'], mid: ['Стоит послушать хотя бы ради «{top}».', 'Фанатам точно зайдёт.', 'Хорошо, но не событие.'], lo: ['Можно пропустить.', 'Ждём реванша.'], x: ['Не рекомендуем.', 'Лучше переслушать «{prev}».', 'Мимо.'] }
};
const metaColor = (m: number) => (m >= 75 ? '#22c55e' : m >= 50 ? '#facc15' : '#ef4444');
const plural = (n: number, a: string, b: string, c: string) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
const waitStr = (d: number) => d >= 365 ? `${Math.round(d / 365 * 10) / 10} ${d >= 730 ? 'года' : 'год'}`.replace('.', ',') : d >= 60 ? `${Math.round(d / 30)} ${plural(Math.round(d / 30), 'месяц', 'месяца', 'месяцев')}` : `${d} ${plural(d, 'день', 'дня', 'дней')}`;
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const ABC = ['D', 'C−', 'C', 'C+', 'B−', 'B', 'B+', 'A−', 'A', 'A+'];

interface ReviewCtx { album: Album; at: Track[]; prev?: { title: string; score?: number }; followers: number; seed: number; waitDays: number | null; perf: number; artistAvg: number | null; single: boolean; plays: number; anchor?: number; shift?: number; parent?: string; rank?: string }
function genReviews(c: ReviewCtx) {
  const { album, at, prev, followers, seed, waitDays, perf, artistAvg, single, plays } = c;
  const r = seeded(hashStr(album.id) + seed * 7777 + 17);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const gauss = () => (r() + r() + r() + r() - 2) / 0.58; // ~N(0,1)
  const rating: any = album.rating;
  const sorted = [...at].sort((a, b) => (b.plays || 0) - (a.plays || 0));
  const top = sorted[0]?.title || album.title;
  const weak = sorted.length >= 5 ? sorted[sorted.length - 1].title : '';
  const first = at[0]?.title || '', last = at.length > 3 ? at[at.length - 1].title : '';
  const guests = [...new Set(at.flatMap(t => splitNames(t.featuredArtist)))];
  const feats = guests.slice(0, 2).join(' и ');
  const crit = (Object.keys(CRIT_RU) as CritKey[]).filter(k => typeof rating?.[k] === 'number').map(k => [k, rating[k]] as [CritKey, number]).sort((a, b) => b[1] - a[1]);
  const words = GENRE_WORDS.find(([re]) => re.test(album.genre || ''))?.[1] || [];
  // --- hidden "true quality" the critics react to ---
  let q = rating?.totalScore ? (rating.totalScore / 90) * 100 : 60 + clamp(Math.log2(Math.max(0.05, perf)) * 7, -16, 16) + (typeof album.intrinsicQuality === 'number' ? (album.intrinsicQuality - 50) * 0.25 : 0);
  if (artistAvg !== null && rating?.totalScore) q += clamp((artistAvg - 60) * 0.06, -2, 2);
  if (waitDays !== null && waitDays > 300 && q < 80) q -= 3;          // long wait raises the bar
  if (waitDays !== null && waitDays < 25 && !single) q -= 2;          // rushed
  if (guests.length > 5) q -= 2;
  // v2.5: an album is close to the average of its rated tracks (± its own cohesion)
  const ratedT = at.filter(t => t.rating?.totalScore).map(t => (t.rating!.totalScore / 90) * 100);
  if (!single && ratedT.length >= 2) q = q * 0.55 + (ratedT.reduce((x, y) => x + y, 0) / ratedT.length + (r() - 0.5) * 10) * 0.45;
  // v2.5: less predictable reception; big numbers / a strong artist raise the chance of praise
  const swR = seeded(hashStr(album.id + '|swing') + seed * 131);
  const g2 = () => (swR() + swR() + swR() + swR() - 2) / 0.58;
  let swing = g2() * (single ? 7.5 : 5.5);
  if (swR() < 0.12) swing += (swR() < 0.5 ? -1 : 1) * (7 + swR() * 9); // over- / underrated
  const hot = clamp(Math.log2(Math.max(0.2, perf)) * 2.2, -4, 6) + clamp(Math.log10(Math.max(1, plays)) - 6.3, -1.5, 2.5) * 2 + (artistAvg !== null ? clamp((artistAvg - 62) * 0.12, -3, 4) : 0);
  q += rating?.totalScore ? swing * 0.55 + hot * 0.4 : swing + hot;
  q = clamp(q, 10, 100);
  const critScore = typeof c.anchor === 'number' ? c.anchor + (c.shift || 0) : 38 + (q - 38) * 0.88; // a track of an album follows the album
  const nRev = clamp(Math.round((single ? 2 : 3) + Math.log10(followers + 10) - 4.2 + Math.log10(Math.max(1, plays)) / 3.2 + r() * 1.6), single ? 3 : 4, single ? 5 : 7);
  const outlets = [...OUTLETS].sort(() => r() - 0.5).slice(0, nRev);
  const fill = (x: string, o: Outlet) => x.replace(/\{t\}/g, album.title).replace(/\{a\}/g, album.artistName).replace(/\{top\}/g, top).replace(/\{weak\}/g, weak)
    .replace(/\{first\}/g, first).replace(/\{last\}/g, last).replace(/\{feats\}/g, feats).replace(/\{guest\}/g, guests[Math.floor(r() * Math.max(1, guests.length))] || feats)
    .replace(/\{n\}/g, String(at.length)).replace(/\{prev\}/g, prev?.title || album.title).replace(/\{wait\}/g, waitDays ? waitStr(waitDays) : '')
    .replace(/\{plays\}/g, fmtN(plays)).replace(/\{peak\}/g, String(album.peakChartPosition || (at[0] as any)?.peakChartPosition || '')).replace(/\{fol\}/g, fmtN(followers))
    .replace(/\{kind\}/g, single ? 'трек' : at.length <= 7 ? 'EP' : 'альбом').replace(/\{alb\}/g, c.parent || '');
  const usedGlobal = new Set<string>();
  const once = (arr: string[]) => { const free = arr.filter(x => !usedGlobal.has(x)); const v = pick(free.length ? free : arr); usedGlobal.add(v); return v; };
  const reviews = outlets.map(o => {
    let sc = critScore + o.bias + gauss() * o.sd * 1.2;
    o.likes.forEach(k => { if (typeof rating?.[k] === 'number') sc += (rating[k] - 6.5) * 1.1; });
    sc += o.pop * clamp(Math.log10(Math.max(1, followers)) - 5.5, -1.5, 1.5) * 2 - o.under * clamp(Math.log10(Math.max(1, followers)) - 5.5, -1.5, 1.5) * 1.5;
    if (!single && at.length >= 16) sc -= o.longHate * 2.5;
    if (guests.length) sc += o.featLove * (guests.length <= 3 ? 1.5 : -1);
    if (r() < 0.085) sc += (r() < 0.5 ? -1 : 1) * (10 + r() * 12);       // contrarian take
    if (sc > 93 && !(q >= 94 && r() < 0.45)) sc = 89 + r() * 4;          // 95+ is earned, not given
    sc = Math.round(clamp(sc, 12, 100));
    const band = sc >= 92 ? 's' : sc >= 75 ? 'hi' : sc >= 55 ? 'mid' : sc >= 35 ? 'lo' : 'x';
    const good = band === 's' || band === 'hi';
    const pool: string[] = [];
    pool.push(once(RV3.top));
    if (weak && !good) pool.push(once(RV3.weak));
    if (first && r() < 0.35) pool.push(once(RV3.opener));
    if (last && good && r() < 0.35) pool.push(once(RV3.closer));
    if (guests.length > 4) pool.push(once(RV3.feats.many)); else if (guests.length) pool.push(once(good || band === 'mid' ? RV3.feats.good : RV3.feats.bad));
    if (waitDays === null && !prev) pool.push(once(RV3.wait.debut));
    else if (waitDays !== null && waitDays >= 270) pool.push(once(good ? RV3.wait.longHi : RV3.wait.longLo));
    else if (waitDays !== null && waitDays <= 35) pool.push(once(RV3.wait.fast));
    if (perf >= 1.7) pool.push(once(RV3.plays.up)); else if (perf <= 0.55) pool.push(once(RV3.plays.down));
    const peak = album.peakChartPosition || (at[0] as any)?.peakChartPosition;
    if (peak && peak <= 10) pool.push(once(RV3.plays.chart));
    if (c.parent) pool.push(once(good ? RV3.inAlb.hi : band === 'mid' ? RV3.inAlb.mid : RV3.inAlb.lo));
    if (single && !c.parent) pool.push(once(RV3.single)); else if (at.length >= 15) pool.push(once(RV3.long)); else if (at.length > 0 && at.length <= 8) pool.push(once(RV3.short));
    if (crit.length > 1) {
      const liked = o.likes.find(k => crit.some(([ck, v]) => ck === k && v >= 7)) || crit[0][0];
      pool.push(`${o.likes.includes(liked) ? 'Для нас главное: ' : 'Сильнее всего здесь: '}${pick(CRIT_GOOD[liked])}.`);
      if (!good) pool.push(`Слабое место — ${CRIT_RU[crit[crit.length - 1][0]]}: ${pick(CRIT_BAD[crit[crit.length - 1][0]])}.`);
    } else pool.push(`${cap(pick((good ? CRIT_GOOD : CRIT_BAD)[o.likes[0]]))}.`);
    if (words.length && r() < 0.6) pool.push(`${cap(pick(words))}.`);
    if (prev && r() < 0.6) pool.push(once(RV3.prev[good ? 'hi' : band === 'mid' ? 'mid' : 'lo']));
    if (artistAvg !== null && r() < 0.3) pool.push(once(artistAvg >= 65 && good ? RV3.career.hi : RV3.career.lo));
    if (r() < 0.35) pool.push(once(followers >= 3_000_000 ? RV3.pop.big : followers <= 300_000 ? RV3.pop.small : RV3.tone[o.tone]));
    if (r() < 0.3) pool.push(pick(RV3.tone[o.tone]));
    const body: string[] = [];
    const k = single ? 1 + Math.round(r()) : 2 + Math.round(r());
    for (let i = 0; i < k && pool.length; i++) body.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    const parts = [once(RV3.open[band]), ...body, once(RV3.close[band])];
    const shown = o.scale === '100' ? String(sc) : o.scale === '10' ? (sc / 10).toFixed(1) : o.scale === 'abc' ? ABC[clamp(Math.floor((sc - 20) / 8), 0, 9)]
      : '★'.repeat(clamp(Math.round(sc / 20), 1, 5)) + '☆'.repeat(5 - clamp(Math.round(sc / 20), 1, 5));
    const tag = sc >= 92 ? 'Шедевр' : sc >= 86 && r() < 0.6 ? 'Выбор редакции' : sc >= 80 && r() < 0.35 ? 'Лучшее новое' : sc < 35 ? 'Разочарование' : '';
    return { outlet: o.n, sc, shown, tag, text: parts.map(x => fill(x, o)).join(' ') };
  });
  const meta = Math.round(reviews.reduce((x, y) => x + y.sc, 0) / reviews.length);
  const pos = reviews.filter(x => x.sc >= 75).length, neg = reviews.filter(x => x.sc < 50).length;
  const consensus = meta >= 90 ? 'Всеобщее признание' : meta >= 80 ? 'Признание критиков' : meta >= 70 ? 'В целом положительные отзывы' : meta >= 55 ? 'Смешанные или средние отзывы' : meta >= 40 ? 'В целом негативные отзывы' : 'Разгромные отзывы';
  const spread = Math.max(...reviews.map(x => x.sc)) - Math.min(...reviews.map(x => x.sc));
  const note = spread >= 30 ? 'Критики разошлись во мнениях' : spread <= 8 ? 'Редкое единодушие' : '';
  return { reviews: reviews.sort((a, b) => b.sc - a.sc), meta, pos, neg, mixed: reviews.length - pos - neg, consensus, note };
}

const RvIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></svg>);

function reviewCtx(album: Album, single: Track | undefined, tracks: Track[], albums: Album[], artists: Artist[], seed: number): ReviewCtx {
  const at = single ? [single] : tracks.filter(t => t.albumId === album.id);
  const ts = parseDayMs(album.releaseDate, album.releaseYear) || 0;
  const mine = (x: { artistId?: string; artistName?: string }) => x.artistId === album.artistId || norm(x.artistName) === norm(album.artistName);
  const prevAlb = albums.filter(a => a.id !== album.id && mine(a) && (parseDayMs(a.releaseDate, a.releaseYear) || 0) < ts)
    .sort((a, b) => (parseDayMs(b.releaseDate, b.releaseYear) || 0) - (parseDayMs(a.releaseDate, a.releaseYear) || 0))[0];
  const prevTracks = tracks.filter(t => !t.isSnippet && mine(t) && t.albumId !== album.id && t.id !== single?.id && (parseDayMs(t.releaseDate) || 0) < ts);
  const lastTs = Math.max(prevAlb ? parseDayMs(prevAlb.releaseDate, prevAlb.releaseYear) || 0 : 0, ...prevTracks.map(t => parseDayMs(t.releaseDate) || 0), 0);
  const waitDays = lastTs > 0 && ts > 0 ? Math.max(1, Math.round((ts - lastTs) / DAY)) : null;
  const plays = at.reduce((x, t) => x + (t.plays || 0), 0) || album.totalPlays || 0;
  const usual = single ? (prevTracks.length ? prevTracks.reduce((x, t) => x + (t.plays || 0), 0) / prevTracks.length : 0)
    : (prevAlb?.totalPlays || (prevTracks.length ? prevTracks.reduce((x, t) => x + (t.plays || 0), 0) / prevTracks.length * Math.max(4, at.length) * 0.55 : 0));
  const fol = artists.find(a => a.id === album.artistId)?.followers || 300000;
  const perf = usual > 0 ? plays / usual : plays / Math.max(1, fol * (single ? 0.9 : 6));
  const rated = [...albums.filter(a => mine(a) && a.id !== album.id && a.rating?.totalScore), ...prevTracks.filter(t => t.rating?.totalScore)].map((x: any) => (x.rating.totalScore / 90) * 100);
  const artistAvg = rated.length ? rated.reduce((x, y) => x + y, 0) / rated.length : null;
  const prev = prevAlb ? { title: prevAlb.title } : prevTracks.length ? { title: [...prevTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0].title } : undefined;
  return { album, at, prev, followers: fol, seed, waitDays, perf, artistAvg, single: Boolean(single), plays };
}

export const AlbumReviewsButton: React.FC<{ album: Album; tracks: Track[]; albums: Album[]; artists: Artist[]; single?: Track }> = ({ album, tracks, albums, artists, single }) => {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState(() => lsGet<number>(`musaic.reviews.${album.id}`, 0));
  useEffect(() => { setSeed(lsGet<number>(`musaic.reviews.${album.id}`, 0)); }, [album.id]);
  const data = useMemo(() => {
    const ctx = reviewCtx(album, single, tracks, albums, artists, seed);
    const parent = single && single.albumId && single.albumId !== 'single' ? albums.find(a => a.id === single.albumId) : undefined;
    if (parent) {
      const pData = genReviews(reviewCtx(parent, undefined, tracks, albums, artists, lsGet<number>(`musaic.reviews.${parent.id}`, 0)));
      const sib = tracks.filter(t => t.albumId === parent.id && !t.isSnippet);
      const avg = sib.length ? sib.reduce((x, t) => x + (t.plays || 0), 0) / sib.length : single!.plays || 1;
      const share = (single!.plays || 1) / Math.max(1, avg);
      const own = single!.rating?.totalScore ? (single!.rating.totalScore / 90) * 100 : null;
      const tr = seeded(hashStr(single!.id + '|trk') + seed * 977);
      const w = -0.4 + tr() * 1.8; // sometimes the most played track is loved more, sometimes less
      const standout = tr() < 0.14 ? (tr() < 0.55 ? 1 : -1) * (5 + tr() * 8) : 0;
      const shift = clamp(Math.log2(share) * 3.2 * w, -8, 8) + (tr() - 0.5) * 7 + standout + (own !== null ? clamp((own - pData.meta) * 0.35, -8, 8) : 0);
      return genReviews({ ...ctx, anchor: pData.meta, shift, parent: parent.title });
    }
    return genReviews(ctx);
  }, [album, tracks, albums, artists, seed, single]);
  const reroll = () => { const n = seed + 1; setSeed(n); lsSet(`musaic.reviews.${album.id}`, n); };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Рецензии критиков"
        className="h-9 inline-flex items-center gap-2 px-3.5 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95">
        <RvIcon />
        <span>Рецензии</span>
        <span className="text-[11px] font-black tabular-nums" style={{ color: metaColor(data.meta) }}>{data.meta}</span>
      </button>
      <AnimatePresence>
        {open && (
          <Portal key="rv">
            <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-6">
              <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#0e0f13]">
                <div className="relative overflow-hidden p-6">
                  <img src={resolveMedia(album.coverUrl, { id: album.id, title: album.title, artistName: album.artistName })} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 blur-3xl scale-125" />
                  <div className="relative flex items-center gap-4">
                    <CoverArt url={album.coverUrl} title={album.title} className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-2xl" innerClassName="w-full h-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Рецензии · {single ? 'сингл' : 'релиз'}</div>
                      <div className="text-2xl font-black text-white truncate">{album.title}</div>
                      <div className="text-sm text-zinc-400 truncate">{album.artistName}</div>
                    </div>
                    <button type="button" onClick={() => setOpen(false)} className="self-start w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/70 text-xl">×</button>
                  </div>
                  <div className="relative mt-5 flex items-center gap-4">
                    <motion.div key={`m${seed}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-3xl font-black text-black tabular-nums shadow-lg" style={{ background: metaColor(data.meta) }}>{data.meta}</motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-black text-white">{data.consensus}</div>
                      <div className="text-[12px] text-zinc-400">Метаскор на основе {data.reviews.length} рецензий{data.note ? ` · ${data.note}` : ''}</div>
                      <div className="mt-2 flex h-1.5 rounded-full overflow-hidden gap-[2px]">
                        <span style={{ flexGrow: data.pos || 0.001, background: '#22c55e' }} /><span style={{ flexGrow: data.mixed || 0.001, background: '#facc15' }} /><span style={{ flexGrow: data.neg || 0.001, background: '#ef4444' }} />
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-500">{data.pos} хвалят · {data.mixed} средне · {data.neg} ругают</div>
                    </div>
                    {album.rating && <div className="text-center"><ScoreRing rating={album.rating} size="lg" showDetailsOnHover={false} /><div className="text-[9px] text-zinc-500 uppercase mt-1">твоя</div></div>}
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-2">
                  {data.reviews.map((rv, i) => (
                    <motion.div key={`${seed}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-black text-white flex items-center gap-2">{rv.outlet}{rv.tag && <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ color: metaColor(rv.sc), background: `${metaColor(rv.sc)}14` }}>{rv.tag}</span>}</span>
                        <span className="text-[12px] font-black tabular-nums px-2 py-0.5 rounded-lg" style={{ color: metaColor(rv.sc), background: `${metaColor(rv.sc)}1a` }}>{rv.shown}</span>
                      </div>
                      <p className="text-[12.5px] text-zinc-300 leading-relaxed mt-1.5">{rv.text}</p>
                    </motion.div>
                  ))}
                  <button type="button" onClick={reroll} className="w-full py-2.5 rounded-2xl text-[12px] font-bold text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/20 transition-colors">🎲 Другие рецензии</button>
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
};

/** Same reviews for a single track (track page) */
export const TrackReviewsButton: React.FC<{ track: Track; tracks: Track[]; albums: Album[]; artists: Artist[] }> = ({ track, tracks, albums, artists }) => {
  const pseudo = useMemo(() => ({
    id: `trk-${track.id}`, title: track.title, artistId: track.artistId, artistName: track.artistName, coverUrl: track.coverUrl || '',
    releaseYear: +(track.releaseDate || '').slice(0, 4) || new Date().getFullYear(), releaseDate: track.releaseDate, genre: track.genre || '', isLiked: false,
    rating: track.rating, totalPlays: track.plays, peakChartPosition: track.peakChartPosition, intrinsicQuality: track.intrinsicQuality
  } as Album), [track]);
  return <AlbumReviewsButton album={pseudo} tracks={tracks} albums={albums} artists={artists} single={track} />;
};

// ---------------------------------------------------------------------------
// 8. WEEKLY NEWS FEED — music-public style headlines for the «События» page
// ---------------------------------------------------------------------------
type NewsCat = 'charts' | 'releases' | 'buzz' | 'awards';
interface NewsItem { id: string; cat: NewsCat; emoji: string; kicker: string; color: string; title: string; sub?: string; cover?: string; round?: boolean; go?: () => void; w: number }
const NEWS_FILTERS: Array<[NewsCat | 'all', string]> = [['all', 'Всё'], ['charts', 'Чарты'], ['releases', 'Релизы'], ['buzz', 'Слухи и анонсы'], ['awards', 'Премии']];

export const WeeklyNewsFeed: React.FC<{
  artists: Artist[]; albums: Album[]; tracks: Track[]; awards?: AwardItem[]; referenceDate?: string;
  navigateTo: (view: ViewType, params?: any) => void;
}> = ({ artists, albums, tracks, awards = [], referenceDate, navigateTo }) => {
  usePlusCss();
  const nowRef = useMemo(() => refToMs(referenceDate), [referenceDate]);
  const [off, setOff] = useState(0);
  const [filter, setFilter] = useState<NewsCat | 'all'>('all');
  const T = nowRef - off * 7 * DAY; const A = T - 7 * DAY;
  const ents = useMemo(() => buildEntities(artists, albums, tracks, nowRef), [artists, albums, tracks, nowRef]);
  const news = useMemo<NewsItem[]>(() => {
    const out: NewsItem[] = [];
    const goT = (id: string) => () => navigateTo('track', { id });
    const goA = (id: string) => () => navigateTo('album', { id });
    const weeks = Array.from({ length: 10 }, (_, k) => rankChart(ents, 'tracks', 'now', T - k * 7 * DAY));
    const maps = weeks.map(w => new Map(w.map((r, i) => [r.e.id, i + 1])));
    const cur = weeks[0]; const prevMap = maps[1];
    if (cur[0]) {
      const e = cur[0].e; let streak = 0; for (const m of maps) { if (m.get(e.id) === 1) streak++; else break; }
      out.push({ id: `n1-${e.id}`, cat: 'charts', emoji: '🥇', kicker: '№1 недели', color: '#fbbf24', w: 100, cover: e.cover, go: goT(e.id),
        title: streak > 1 ? `«${e.title}» держится на вершине уже ${streak}-ю неделю` : prevMap.get(e.id) ? `«${e.title}» поднимается на №1` : `«${e.title}» дебютирует сразу на №1`, sub: `${e.sub} · ${fmtN(cur[0].v)} прослушиваний за неделю` });
    }
    const debuts = cur.map((r, i) => ({ r, rank: i + 1 })).filter(x => !prevMap.has(x.r.e.id) && !maps.slice(2).some(m => m.has(x.r.e.id)) && x.rank > 1 && x.rank <= 30).slice(0, 3);
    debuts.forEach((d, i) => out.push({ id: `deb-${d.r.e.id}`, cat: 'charts', emoji: '🔥', kicker: 'Дебют', color: '#34d399', w: 80 - i * 6 - d.rank / 2, cover: d.r.e.cover, go: goT(d.r.e.id),
      title: `${d.r.e.ref.artistName} врывается в чарт: «${d.r.e.title}» стартует с #${d.rank}`, sub: d.r.e.ref.featuredArtist ? `feat. ${d.r.e.ref.featuredArtist}` : undefined }));
    const moves = cur.map((r, i) => ({ r, rank: i + 1, last: prevMap.get(r.e.id) })).filter(x => x.last !== undefined) as Array<{ r: ChartRow; rank: number; last: number }>;
    const up = [...moves].sort((a, b) => (b.last - b.rank) - (a.last - a.rank))[0];
    if (up && up.last - up.rank >= 5) out.push({ id: `up-${up.r.e.id}`, cat: 'charts', emoji: '🚀', kicker: 'Взлёт', color: '#60a5fa', w: 70, cover: up.r.e.cover, go: goT(up.r.e.id), title: `«${up.r.e.title}» взлетает на ${up.last - up.rank} позиций, до #${up.rank}`, sub: up.r.e.sub });
    const fall = weeks[1].slice(0, 10).find(r => { const now = maps[0].get(r.e.id); return now === undefined || now > 20; });
    if (fall) out.push({ id: `fall-${fall.e.id}`, cat: 'charts', emoji: '📉', kicker: 'Падение', color: '#f87171', w: 40, cover: fall.e.cover, go: goT(fall.e.id), title: `«${fall.e.title}» вылетает из десятки`, sub: maps[0].get(fall.e.id) ? `теперь #${maps[0].get(fall.e.id)}` : 'и покидает топ-100' });
    // artist of the week
    const credits = new Map<string, number>(); cur.forEach(r => r.e.credits!.forEach(([id]) => credits.set(id, (credits.get(id) || 0) + 1)));
    const art = rankChart(ents, 'artists', 'now', T)[0];
    if (art) out.push({ id: `art-${art.e.id}`, cat: 'charts', emoji: '👑', kicker: 'Артист недели', color: '#f472b6', w: 75, cover: art.e.cover, round: true, go: () => navigateTo('artist', { id: art.e.id, artistName: art.e.title }),
      title: `${art.e.title} — артист недели`, sub: `${credits.get(art.e.id) || 0} треков в топ-100 · ${fmtN(art.e.ref.followers || 0)} слушателей` });
    const alb = rankChart(ents, 'albums', 'now', T)[0]; const albPrev = rankChart(ents, 'albums', 'now', A)[0];
    if (alb) out.push({ id: `alb-${alb.e.id}`, cat: 'charts', emoji: '💿', kicker: 'Альбомный чарт', color: '#a78bfa', w: 60, cover: alb.e.cover, go: goA(alb.e.id),
      title: albPrev?.e.id === alb.e.id ? `«${alb.e.title}» снова лучший альбом недели` : `«${alb.e.title}» возглавляет альбомный чарт`, sub: alb.e.sub });
    // records
    const marks: Array<[number, string]> = [[1e9, 'миллиард'], [5e8, '500 миллионов'], [1e8, '100 миллионов']];
    ents.trackEnts.forEach(e => { for (const [x, l] of marks) { if (playsAt(e, T) >= x && playsAt(e, A) < x) { out.push({ id: `rec-${e.id}-${x}`, cat: 'charts', emoji: '🏆', kicker: 'Рекорд', color: '#fde047', w: 55 + Math.log10(x), cover: e.cover, go: goT(e.id), title: `«${e.title}» пробивает отметку в ${l} прослушиваний`, sub: e.sub }); break; } } });
    // releases of the week
    const inWeek = (ms: number | null) => ms !== null && ms > A && ms <= T;
    albums.filter(a => inWeek(parseDayMs(a.releaseDate))).sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0)).slice(0, 4).forEach((a, i) => {
      const n = tracks.filter(t => t.albumId === a.id).length;
      out.push({ id: `ra-${a.id}`, cat: 'releases', emoji: '💿', kicker: n && n <= 6 ? 'Новый EP' : 'Новый альбом', color: '#a78bfa', w: 65 - i * 5, cover: a.coverUrl, go: goA(a.id), title: `${a.artistName} выпустил ${n && n <= 6 ? 'EP' : 'альбом'} «${a.title}»`, sub: n ? `${n} треков` : undefined });
    });
    const albumIds = new Set(albums.map(a => a.id));
    const weekTracks = tracks.filter(t => inWeek(parseDayMs(t.releaseDate)) && !(t.albumId && albumIds.has(t.albumId) && !t.isSnippet));
    weekTracks.filter(t => !t.isSnippet).sort((a, b) => b.plays - a.plays).slice(0, 4).forEach((t, i) => out.push({ id: `rt-${t.id}`, cat: 'releases', emoji: '🎤', kicker: 'Новый трек', color: '#e5e7eb', w: 50 - i * 4, cover: t.coverUrl, go: goT(t.id), title: `${t.artistName}${t.featuredArtist ? ` feat. ${t.featuredArtist}` : ''} — «${t.title}»`, sub: `${fmtN(t.plays)} прослушиваний` }));
    weekTracks.filter(t => t.isSnippet).slice(0, 3).forEach((t, i) => out.push({ id: `rs-${t.id}`, cat: 'buzz', emoji: '✂️', kicker: 'Сниппет', color: '#38bdf8', w: 45 - i * 3, cover: t.coverUrl, go: goT(t.id), title: `${t.artistName} показал сниппет «${t.title}»`, sub: t.snippetTeaser }));
    // announcements & rumors
    const anns = lsGet<Announcement[]>(ANN_LS, []).filter(a => { const ms = refToMs(a.date); return ms > T && ms <= T + 21 * DAY && !a.released; }).slice(0, 3);
    anns.forEach((a, i) => out.push({ id: `an-${a.id}`, cat: 'buzz', emoji: '📣', kicker: 'Анонс', color: '#fbbf24', w: 42 - i * 3, cover: a.coverUrl, title: `${a.artistName}: «${a.title}» выйдет ${whenPhrase(refToMs(a.date), T)}`, sub: a.note }));
    if (off === 0) genRumors(artists, tracks, albums, toISO(T), Math.floor(T / (7 * DAY)), new Set()).slice(0, 2).forEach((r, i) => out.push({ id: `rum-${r.id}`, cat: 'buzz', emoji: '👀', kicker: 'Слухи', color: '#e879f9', w: 35 - i * 3, cover: artists.find(a => a.id === r.artistId)?.imageUrl, round: true, title: r.text, sub: `вероятность ${r.conf}%` }));
    // awards of the month at the end of the month
    const d = new Date(T); const month = pad2(d.getUTCMonth() + 1); const year = String(d.getUTCFullYear());
    const lastWeek = new Date(T + 7 * DAY).getUTCMonth() !== d.getUTCMonth();
    if (lastWeek) awards.filter(a => a.periodType === 'month' && a.year === year && a.month === month).slice(0, 3).forEach((a, i) => out.push({ id: `aw-${a.id}`, cat: 'awards', emoji: '🏅', kicker: a.nominationTitle, color: '#fbbf24', w: 58 - i * 4, cover: a.winner.coverUrl, round: a.winner.type === 'artist', title: `${a.winner.title}${a.winner.artistName && a.winner.type !== 'artist' ? ` (${a.winner.artistName})` : ''} забирает «${a.nominationTitle}»` }));
    return out.sort((a, b) => b.w - a.w);
  }, [ents, T, A, off, artists, albums, tracks, awards, navigateTo]);
  const shown = filter === 'all' ? news : news.filter(n => n.cat === filter);
  const hero = shown[0]; const rest = shown.slice(1, 15);
  if (!news.length && off === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">Musaic Weekly</div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Неделя в музыке</h2>
          <div className="text-[12px] text-zinc-500 mt-0.5">{fmtDayShort(A + DAY)} – {fmtDay(T)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            {NEWS_FILTERS.map(([v, l]) => <button key={v} type="button" onClick={() => setFilter(v)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${filter === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>{l}</button>)}
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button type="button" onClick={() => setOff(o => o + 1)} className="w-7 h-7 rounded-lg text-zinc-300 hover:bg-white/10" title="Прошлая неделя">‹</button>
            <button type="button" onClick={() => setOff(0)} disabled={off === 0} className="px-2 h-7 rounded-lg text-[11px] font-bold text-zinc-300 disabled:opacity-40">{off === 0 ? 'Эта неделя' : `${off} нед. назад`}</button>
            <button type="button" onClick={() => setOff(o => Math.max(0, o - 1))} disabled={off === 0} className="w-7 h-7 rounded-lg text-zinc-300 hover:bg-white/10 disabled:opacity-30" title="Следующая неделя">›</button>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${off}-${filter}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          {!hero && <div className="py-12 text-center text-sm text-zinc-500 rounded-3xl border border-white/[0.06]">На этой неделе в этой рубрике тихо.</div>}
          {hero && (
            <motion.button type="button" onClick={hero.go} whileHover={{ y: -2 }} className="relative w-full overflow-hidden text-left rounded-3xl border border-white/[0.08] min-h-[180px] p-6 flex items-end">
              <div className="absolute inset-0">
                {hero.cover && <CoverArt url={hero.cover} title={hero.title} isArtist={hero.round} className="absolute inset-0 w-full h-full scale-125 blur-2xl opacity-60" innerClassName="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
              </div>
              <div className="relative flex items-end gap-5 w-full">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-black" style={{ background: hero.color }}>{hero.emoji} {hero.kicker}</span>
                  <div className="mt-3 text-xl md:text-3xl font-black text-white leading-tight">{hero.title}</div>
                  {hero.sub && <div className="mt-1.5 text-[13px] text-white/60">{hero.sub}</div>}
                </div>
                {hero.cover && <CoverArt url={hero.cover} title={hero.title} isArtist={hero.round} className={`hidden sm:block w-32 h-32 shrink-0 overflow-hidden shadow-2xl ${hero.round ? 'rounded-full' : 'rounded-2xl'}`} innerClassName="w-full h-full object-cover" />}
              </div>
            </motion.button>
          )}
          {rest.length > 0 && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {rest.map((n, i) => (
                <motion.button key={n.id} type="button" onClick={n.go} disabled={!n.go} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.3 }}
                  className="mp-row group flex items-center gap-3 text-left rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] disabled:hover:bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: n.color }}>{n.emoji} {n.kicker}</span>
                    <div className="text-[13.5px] font-bold text-white leading-snug mt-0.5 line-clamp-2">{n.title}</div>
                    {n.sub && <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{n.sub}</div>}
                  </div>
                  {n.cover !== undefined && <CoverArt url={n.cover} title={n.title} isArtist={n.round} className={`w-14 h-14 shrink-0 overflow-hidden ${n.round ? 'rounded-full' : 'rounded-xl'}`} innerClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 9. ARTIST PORTFOLIO — quiet button on the profile, full career dossier
// listeners history is estimated from releases & current audience when no real data
// ---------------------------------------------------------------------------
const MiniArea: React.FC<{ pts: number[]; labels: string[]; color: string; marks?: number[]; h?: number }> = ({ pts, labels, color, marks = [], h = 140 }) => {
  const W = 640; const max = Math.max(1, ...pts); const min = Math.min(...pts) * 0.85;
  const x = (i: number) => (pts.length < 2 ? 0 : (i / (pts.length - 1)) * W);
  const y = (v: number) => h - 8 - ((v - min) / Math.max(1, max - min)) * (h - 24);
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const gid = React.useId().replace(/:/g, '');
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${h}`} className="w-full" style={{ height: h }} preserveAspectRatio="none"
        onMouseMove={e => { const b = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); setHov(clamp(Math.round(((e.clientX - b.left) / b.width) * (pts.length - 1)), 0, pts.length - 1)); }} onMouseLeave={() => setHov(null)}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <path d={`${line} L${W},${h} L0,${h} Z`} fill={`url(#${gid})`} />
        <motion.path d={line} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
        {marks.map(i => <line key={i} x1={x(i)} x2={x(i)} y1={8} y2={h} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
        {hov !== null && <line x1={x(hov)} x2={x(hov)} y1={0} y2={h} stroke="rgba(255,255,255,0.35)" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hov !== null && <div className="absolute top-0 px-2 py-1 rounded-lg bg-black/80 text-[11px] text-white pointer-events-none whitespace-nowrap -translate-x-1/2" style={{ left: `${(hov / Math.max(1, pts.length - 1)) * 100}%` }}>{labels[hov]} · <b>{fmtN(pts[hov])}</b></div>}
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1"><span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]}</span></div>
    </div>
  );
};

export const ArtistPortfolioButton: React.FC<{ artist: Artist; tracks: Track[]; albums: Album[]; navigateTo?: (v: ViewType, p?: any) => void }> = ({ artist, tracks, albums, navigateTo }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Портфолио и статистика"
        className="h-9 inline-flex items-center gap-1.5 px-3 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
        <span>Статистика</span>
      </button>
      <AnimatePresence>{open && <PortfolioModal key="pf" artist={artist} tracks={tracks} albums={albums} navigateTo={navigateTo} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
};

const PortfolioModal: React.FC<{ artist: Artist; tracks: Track[]; albums: Album[]; navigateTo?: (v: ViewType, p?: any) => void; onClose: () => void }> = ({ artist, tracks, albums, navigateTo, onClose }) => {
  useEsc(true, onClose);
  const awards = useStore(awardsStore);
  const d = useMemo(() => {
    const mineT = tracks.filter(t => isLeadOf(t, artist));
    const featT = tracks.filter(t => !isLeadOf(t, artist) && splitNames(t.featuredArtist).map(norm).includes(norm(artist.name)));
    const mineA = albums.filter(a => a.artistId === artist.id || norm(a.artistName) === norm(artist.name));
    const real = mineT.filter(t => !t.isSnippet);
    const dated = [...real.map(t => ({ ms: parseDayMs(t.releaseDate), plays: t.plays || 0, title: t.title, album: t.albumId && t.albumId !== 'single' })), ...mineA.map(a => ({ ms: parseDayMs(a.releaseDate, a.releaseYear), plays: a.totalPlays || 0, title: a.title, album: true }))].filter(x => x.ms !== null) as Array<{ ms: number; plays: number; title: string; album: boolean }>;
    dated.sort((a, b) => a.ms - b.ms);
    const nowMs = dayStart(Date.now());
    const first = dated[0]?.ms ?? nowMs - 365 * DAY;
    const lastMs = Math.max(nowMs, dated[dated.length - 1]?.ms ?? nowMs);
    const totalPlays = real.reduce((s, t) => s + (t.plays || 0), 0);
    // --- monthly listeners history (estimated, deterministic per artist) ---
    const r = seeded(hashStr(artist.id) + 7);
    const months: number[] = []; for (let m = Date.UTC(new Date(first).getUTCFullYear(), new Date(first).getUTCMonth(), 1); m <= lastMs; m = Date.UTC(new Date(m).getUTCFullYear(), new Date(m).getUTCMonth() + 1, 1)) months.push(m);
    if (months.length < 2) months.unshift(Date.UTC(new Date(lastMs).getUTCFullYear(), new Date(lastMs).getUTCMonth() - 1, 1));
    const relByMonth = new Map<number, number>();
    dated.forEach(x => { const k = Date.UTC(new Date(x.ms).getUTCFullYear(), new Date(x.ms).getUTCMonth(), 1); relByMonth.set(k, (relByMonth.get(k) || 0) + x.plays * (x.album ? 0.6 : 1)); });
    const maxRel = Math.max(1, ...relByMonth.values());
    const trendKind = r(); // 0..1: steady riser / rollercoaster / peaked earlier
    let base = 1, boost = 0; const raw: number[] = [];
    months.forEach((m, i) => {
      const t = i / Math.max(1, months.length - 1);
      const drift = trendKind < 0.5 ? 0.03 : trendKind < 0.8 ? 0.025 * Math.sin(i / 3.2) + 0.008 : (t < 0.6 ? 0.045 : -0.02);
      base = Math.max(0.1, base * (1 + drift + (r() - 0.5) * 0.07));
      boost = boost * 0.62 + ((relByMonth.get(m) || 0) / maxRel) * (0.35 + r() * 0.4);
      raw.push(base * (1 + boost));
    });
    const scale = (artist.followers || 100_000) / raw[raw.length - 1];
    const listeners = raw.map(v => Math.round(v * scale));
    const labels = months.map(m => `${pad2(new Date(m).getUTCMonth() + 1)}-${new Date(m).getUTCFullYear()}`);
    const marks = months.map((m, i) => (relByMonth.has(m) && mineA.some(a => { const ms = parseDayMs(a.releaseDate, a.releaseYear); return ms !== null && Date.UTC(new Date(ms).getUTCFullYear(), new Date(ms).getUTCMonth(), 1) === m; }) ? i : -1)).filter(i => i >= 0);
    const avgL = Math.round(listeners.reduce((s, v) => s + v, 0) / listeners.length);
    const peakI = listeners.indexOf(Math.max(...listeners));
    const yearAgo = listeners[Math.max(0, listeners.length - 13)];
    // --- chart ---
    const charted = real.filter(t => t.peakChartPosition && t.peakChartPosition > 0);
    const weeks = charted.reduce((s, t) => s + (t.weeksOnChart || (t.chartHistory?.length ?? 1)), 0);
    const bestPeak = charted.length ? Math.min(...charted.map(t => t.peakChartPosition!)) : null;
    const chartTop = [...charted].sort((a, b) => (a.peakChartPosition! - b.peakChartPosition!) || ((b.weeksOnChart || 0) - (a.weeksOnChart || 0))).slice(0, 6);
    // --- yearly output ---
    const years = new Map<number, { plays: number; n: number; albums: number }>();
    dated.forEach(x => { const y = new Date(x.ms).getUTCFullYear(); const e = years.get(y) || { plays: 0, n: 0, albums: 0 }; e.plays += x.plays; e.n++; if (x.album) e.albums++; years.set(y, e); });
    const yearRows = [...years.entries()].sort((a, b) => a[0] - b[0]);
    // --- cadence ---
    const relTs = [...new Set(dated.map(x => x.ms))].sort((a, b) => a - b);
    const gaps = relTs.slice(1).map((t, i) => (t - relTs[i]) / DAY);
    const avgGap = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : null;
    const maxGap = gaps.length ? Math.round(Math.max(...gaps)) : null;
    const silent = relTs.length ? Math.max(0, Math.round((nowMs - relTs[relTs.length - 1]) / DAY)) : null;
    // --- collaborators ---
    const co = new Map<string, number>();
    real.forEach(t => splitNames(t.featuredArtist).forEach(n => co.set(n, (co.get(n) || 0) + 1)));
    featT.forEach(t => co.set(t.artistName, (co.get(t.artistName) || 0) + 1));
    const collabs = [...co.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const top = [...real].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);
    const rated = [...real, ...mineA].filter((x: any) => x.rating?.totalScore);
    const avgScore = rated.length ? Math.round(rated.reduce((s, x: any) => s + x.rating.totalScore, 0) / rated.length) : null;
    const wins = awards.filter(a => (a.winner.type === 'artist' ? norm(a.winner.title) === norm(artist.name) : splitNames(a.winner.artistName).map(norm).includes(norm(artist.name)))).length;
    return { mineT: real, mineA, featT, first, totalPlays, listeners, labels, marks, avgL, peakI, yearAgo, weeks, bestPeak, chartTop, charted, yearRows, avgGap, maxGap, silent, collabs, top, avgScore, wins, no1: charted.filter(t => t.peakChartPosition === 1).length, top10: charted.filter(t => t.peakChartPosition! <= 10).length };
  }, [artist, tracks, albums, awards]);
  const growth = d.yearAgo ? Math.round(((d.listeners[d.listeners.length - 1] - d.yearAgo) / Math.max(1, d.yearAgo)) * 100) : 0;
  const yearsIn = Math.max(0, (Date.now() - d.first) / (365 * DAY));
  const maxYear = Math.max(1, ...d.yearRows.map(([, v]) => v.plays));
  const K = ({ v, l, s }: { v: React.ReactNode; l: string; s?: React.ReactNode }) => (
    <div className="rounded-2xl bg-white/[0.035] border border-white/[0.05] px-3.5 py-3 min-w-0"><div className="text-lg sm:text-xl font-black text-white tabular-nums truncate">{v}</div><div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mt-0.5">{l}</div>{s && <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{s}</div>}</div>
  );
  const go = (v: ViewType, id: string) => { if (!navigateTo) return; onClose(); navigateTo(v, { id }); };
  return (
    <Portal>
      <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-6">
        <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto custom-scrollbar rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#0c0c0f]">
          <div className="relative overflow-hidden px-6 pt-7 pb-5">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(70% 100% at 20% 0%, color-mix(in srgb, var(--accent-color) 22%, transparent), transparent 70%)' }} />
            <div className="relative flex items-center gap-4">
              <CoverArt url={artist.imageUrl} title={artist.name} isArtist className="w-20 h-20 rounded-full overflow-hidden shrink-0 ring-1 ring-white/15" innerClassName="w-full h-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Портфолио</div>
                <div className="text-2xl sm:text-4xl font-black text-white truncate tracking-tight">{artist.name}</div>
                <div className="text-[12px] text-zinc-400 mt-0.5">{artist.genre || 'Артист'}{artist.country ? ` · ${artist.country}` : ''} · на сцене с {fmtDay(d.first)}{yearsIn >= 1 ? ` (${yearsIn.toFixed(1).replace('.', ',')} г.)` : ''}</div>
              </div>
              <button type="button" onClick={onClose} className="self-start w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/70 text-xl">×</button>
            </div>
          </div>
          <div className="px-6 pb-7 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <K v={fmtN(artist.followers || 0)} l="Слушателей сейчас" s={`${growth >= 0 ? '+' : ''}${growth}% за год`} />
              <K v={fmtN(d.avgL)} l="Среднее в месяц" s={`пик ${fmtN(d.listeners[d.peakI])} · ${d.labels[d.peakI]}`} />
              <K v={fmtN(d.totalPlays)} l="Прослушиваний" s={`${d.mineT.length} треков · ${d.mineA.length} альб./EP`} />
              <K v={d.bestPeak ? `№${d.bestPeak}` : '—'} l="Лучшая позиция" s={`${d.weeks} нед. в чарте · №1 × ${d.no1} · топ-10 × ${d.top10}`} />
            </div>
            <section>
              <div className="flex items-baseline justify-between mb-2"><h4 className="text-sm font-black text-white">Динамика слушателей</h4><span className="text-[10px] text-zinc-500">оценка по релизам и аудитории · пунктир — альбомы</span></div>
              <div className="rounded-2xl bg-white/[0.025] border border-white/[0.05] p-3"><MiniArea pts={d.listeners} labels={d.labels} color="var(--accent-color)" marks={d.marks} /></div>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <section>
                <h4 className="text-sm font-black text-white mb-2">По годам</h4>
                <div className="space-y-1.5">
                  {d.yearRows.length === 0 && <div className="text-xs text-zinc-500">Нет датированных релизов</div>}
                  {d.yearRows.map(([y, v], i) => (
                    <div key={y} className="flex items-center gap-3 text-[12px]">
                      <span className="w-10 text-zinc-400 tabular-nums">{y}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: 'var(--accent-color)' }} initial={{ width: 0 }} animate={{ width: `${(v.plays / maxYear) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.6 }} /></div>
                      <span className="w-28 text-right text-zinc-300 tabular-nums">{fmtN(v.plays)} · {v.n} рел.</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <K v={d.avgGap !== null ? `${d.avgGap} дн.` : '—'} l="Между релизами" />
                  <K v={d.maxGap !== null ? `${d.maxGap} дн.` : '—'} l="Самая длинная пауза" />
                  <K v={d.silent !== null ? `${d.silent} дн.` : '—'} l="С последнего" />
                </div>
              </section>
              <section>
                <h4 className="text-sm font-black text-white mb-2">История в чарте</h4>
                {d.chartTop.length === 0 && <div className="text-xs text-zinc-500">Пока без попаданий в чарт</div>}
                <div className="space-y-1.5">
                  {d.chartTop.map(t => (
                    <button key={t.id} type="button" onClick={() => go('track', t.id)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] text-left">
                      <span className="w-9 text-center text-[13px] font-black tabular-nums" style={{ color: t.peakChartPosition === 1 ? '#fbbf24' : '#fff' }}>№{t.peakChartPosition}</span>
                      <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-white truncate">{t.title}</span><span className="block text-[10px] text-zinc-500">{t.weeksOnChart || t.chartHistory?.length || 1} нед. · {fmtN(t.plays || 0)}</span></span>
                      {t.chartHistory && t.chartHistory.length > 1 && (
                        <svg width="70" height="22" viewBox="0 0 70 22"><polyline fill="none" stroke="var(--accent-color)" strokeWidth="1.6" points={t.chartHistory.slice(-14).map((p, i, arr) => `${(i / Math.max(1, arr.length - 1)) * 68 + 1},${1 + (Math.min(100, p) / 100) * 20}`).join(' ')} /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <section>
                <h4 className="text-sm font-black text-white mb-2">Главные треки</h4>
                <div className="space-y-1">
                  {d.top.map((t, i) => (
                    <button key={t.id} type="button" onClick={() => go('track', t.id)} className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/[0.04] text-left">
                      <span className="w-4 text-[11px] text-zinc-600 font-black">{i + 1}</span>
                      <CoverArt url={t.coverUrl} title={t.title} className="w-9 h-9 rounded-lg overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
                      <span className="min-w-0 flex-1 text-[13px] font-bold text-white truncate">{t.title}</span>
                      <span className="text-[11px] text-zinc-400 tabular-nums">{d.totalPlays ? Math.round(((t.plays || 0) / d.totalPlays) * 100) : 0}%</span>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-sm font-black text-white mb-2">Коллаборации и награды</h4>
                <div className="flex flex-wrap gap-1.5">
                  {d.collabs.length === 0 && <span className="text-xs text-zinc-500">Без фитов</span>}
                  {d.collabs.map(([n, c]) => <span key={n} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] text-zinc-200">{n} <span className="text-zinc-500">× {c}</span></span>)}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <K v={d.wins} l="Наград" />
                  <K v={d.featT.length} l="Гостевых фитов" />
                  <K v={d.avgScore !== null ? d.avgScore : '—'} l="Средняя оценка" />
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
};

// ---------------------------------------------------------------------------
// 10. RECORDS — small button on the charts page, all-time records in one sheet
// chartHistory = last 16 weekly ranks (newest last); weeksOnChart & peak are all-time
// ---------------------------------------------------------------------------
type RecRow = { key: string; title: string; holder: string; sub?: string; value: string; cover?: string; isArtist?: boolean; go?: { v: ViewType; id: string }; others: Array<{ name: string; value: string }> };
export const RecordsButton: React.FC<{ artists: Artist[]; albums: Album[]; tracks: Track[]; navigateTo: (v: ViewType, p?: any) => void }> = props => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Рекорды чарта"
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /></svg>Рекорды
      </button>
      <AnimatePresence>{open && <RecordsModal key="rec" {...props} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
};
const RecordsModal: React.FC<{ artists: Artist[]; albums: Album[]; tracks: Track[]; navigateTo: (v: ViewType, p?: any) => void; onClose: () => void }> = ({ artists, albums, tracks, navigateTo, onClose }) => {
  useEsc(true, onClose);
  const awards = useStore(awardsStore);
  const rows = useMemo<RecRow[]>(() => {
    const real = tracks.filter(t => !t.isSnippet);
    const artOf = (name: string) => artists.find(a => norm(a.name) === norm(name));
    const mk = <T,>(key: string, title: string, list: T[], val: (x: T) => number, show: (x: T) => string, meta: (x: T) => { holder: string; sub?: string; cover?: string; isArtist?: boolean; go?: { v: ViewType; id: string } }, asc = false): RecRow | null => {
      const l = list.filter(x => Number.isFinite(val(x)) && val(x) > 0).sort((a, b) => (asc ? val(a) - val(b) : val(b) - val(a)));
      if (!l.length) return null;
      return { key, title, value: show(l[0]), ...meta(l[0]), others: l.slice(1, 4).map(x => ({ name: meta(x).holder, value: show(x) })) };
    };
    const tMeta = (t: Track) => ({ holder: t.title, sub: t.artistName, cover: t.coverUrl, go: { v: 'track' as ViewType, id: t.id } });
    const no1 = (t: Track) => (t.chartHistory || []).filter(p => p === 1).length;
    const debut = (t: Track) => (t.chartHistory && t.chartHistory.length > 0 && t.chartHistory.length < 16 && t.chartHistory[0] <= 100 ? t.chartHistory[0] : 0);
    const jump = (t: Track) => { const h = t.chartHistory || []; let best = 0; for (let i = 1; i < h.length; i++) if (h[i] <= 100) best = Math.max(best, Math.min(h[i - 1], 101) - h[i]); return best; };
    const toTop = (t: Track) => { const h = t.chartHistory || []; const f = h.findIndex(p => p <= 100); const one = h.indexOf(1); return f >= 0 && one >= f ? one - f + 1 : 0; };
    // artists: max simultaneous tracks in top-100 across the last 16 weeks
    const simul = new Map<string, number>(); const no1A = new Map<string, number>(); const top10A = new Map<string, number>(); const playsA = new Map<string, number>(); const featA = new Map<string, number>();
    for (let k = 0; k < 16; k++) {
      const cnt = new Map<string, number>();
      for (const t of real) { const h = t.chartHistory || []; const p = h[h.length - 1 - k]; if (p && p <= 100) cnt.set(t.artistName, (cnt.get(t.artistName) || 0) + 1); }
      cnt.forEach((v, n) => simul.set(n, Math.max(simul.get(n) || 0, v)));
    }
    for (const t of real) {
      playsA.set(t.artistName, (playsA.get(t.artistName) || 0) + (t.plays || 0));
      if (t.peakChartPosition === 1) no1A.set(t.artistName, (no1A.get(t.artistName) || 0) + 1);
      if ((t.peakChartPosition || 999) <= 10) top10A.set(t.artistName, (top10A.get(t.artistName) || 0) + 1);
      splitNames(t.featuredArtist).forEach(n => featA.set(n, (featA.get(n) || 0) + 1));
    }
    const winsA = new Map<string, number>();
    awards.forEach(a => (a.winner.type === 'artist' ? [a.winner.title] : splitNames(a.winner.artistName)).forEach(n => winsA.set(n, (winsA.get(n) || 0) + 1)));
    const aMeta = (e: [string, number]) => { const a = artOf(e[0]); return { holder: e[0], cover: a?.imageUrl, isArtist: true, go: a ? { v: 'artist' as ViewType, id: a.id } : undefined }; };
    const ents = (m: Map<string, number>) => [...m.entries()];
    const plural = (n: number, a: string, b: string, c: string) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
    const wk = (n: number) => `${n} ${plural(n, 'неделя', 'недели', 'недель')}`;
    const revived = real.filter(t => (t as any).revivalAt);
    return [
      mk('no1', 'Дольше всех на №1', real, no1, t => wk(no1(t)), tMeta),
      mk('weeks', 'Больше всего недель в чарте', real, t => t.weeksOnChart || 0, t => wk(t.weeksOnChart || 0), tMeta),
      mk('debut', 'Самый высокий дебют', real, debut, t => `№${debut(t)}`, tMeta, true),
      mk('jump', 'Самый быстрый взлёт за неделю', real, jump, t => `+${jump(t)} поз.`, tMeta),
      mk('totop', 'Быстрее всех до №1', real, toTop, t => wk(toTop(t)), tMeta, true),
      mk('simul', 'Больше всего треков в Топ-100 одновременно', ents(simul), e => e[1], e => `${e[1]} ${plural(e[1], 'трек', 'трека', 'треков')}`, aMeta),
      mk('no1a', 'Больше всего хитов №1', ents(no1A), e => e[1], e => `${e[1]} × №1`, aMeta),
      mk('top10a', 'Больше всего треков в топ-10', ents(top10A), e => e[1], e => `${e[1]}`, aMeta),
      mk('plays', 'Самый прослушиваемый трек', real, t => t.plays || 0, t => fmtN(t.plays || 0), tMeta),
      mk('album', 'Самый прослушиваемый альбом', albums, a => a.totalPlays || 0, a => fmtN(a.totalPlays || 0), a => ({ holder: a.title, sub: a.artistName, cover: a.coverUrl, go: { v: 'album' as ViewType, id: a.id } })),
      mk('playsA', 'Больше всего прослушиваний у артиста', ents(playsA), e => e[1], e => fmtN(e[1]), aMeta),
      mk('listeners', 'Больше всего слушателей', artists, a => a.followers || 0, a => fmtN(a.followers || 0), a => ({ holder: a.name, cover: a.imageUrl, isArtist: true, go: { v: 'artist' as ViewType, id: a.id } })),
      mk('feat', 'Самый востребованный гость', ents(featA), e => e[1], e => `${e[1]} ${plural(e[1], 'фит', 'фита', 'фитов')}`, aMeta),
      mk('awards', 'Больше всего наград', ents(winsA), e => e[1], e => `${e[1]} 🏆`, aMeta),
      mk('revival', 'Камбэк из каталога', revived, t => (t as any).revivalPower || 1, t => `вернулся ${(t as any).revivalAt ? fmtDay(parseDayMs((t as any).revivalAt) || 0) : ''}`, tMeta)
    ].filter(Boolean) as RecRow[];
  }, [artists, albums, tracks, awards]);
  return (
    <Portal>
      <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-6">
        <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#0c0c0f]">
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 sticky top-0 bg-[#0c0c0f]/90 backdrop-blur-xl z-10">
            <div><div className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Musaic Charts</div><div className="text-2xl sm:text-3xl font-black text-white tracking-tight">Рекорды</div><div className="text-[11px] text-zinc-500 mt-0.5">История позиций — за последние 16 недель, недели и пики — за всё время</div></div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/70 text-xl">×</button>
          </div>
          <div className="px-6 pb-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rows.length === 0 && <div className="text-sm text-zinc-500 py-10">Рекордов пока нет: нужна история чарта.</div>}
            {rows.map((r, i) => (
              <motion.button key={r.key} type="button" disabled={!r.go} onClick={() => { if (r.go) { onClose(); navigateTo(r.go.v, { id: r.go.id }); } }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="text-left rounded-2xl p-3.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{r.title}</div>
                <div className="mt-2 flex items-center gap-3">
                  <CoverArt url={r.cover} title={r.holder} isArtist={r.isArtist} className={`w-11 h-11 ${r.isArtist ? 'rounded-full' : 'rounded-xl'} overflow-hidden shrink-0`} innerClassName="w-full h-full object-cover" />
                  <div className="min-w-0 flex-1"><div className="text-[14px] font-bold text-white truncate">{r.holder}</div>{r.sub && <div className="text-[11px] text-zinc-500 truncate">{r.sub}</div>}</div>
                  <div className="text-[15px] font-black tabular-nums shrink-0" style={{ color: 'var(--accent-color)' }}>{r.value}</div>
                </div>
                {r.others.length > 0 && <div className="mt-2 pt-2 border-t border-white/[0.05] space-y-0.5">{r.others.map((o, k) => <div key={k} className="flex justify-between text-[11px] text-zinc-500"><span className="truncate pr-2">{k + 2}. {o.name}</span><span className="tabular-nums shrink-0">{o.value}</span></div>)}</div>}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </Portal>
  );
};
