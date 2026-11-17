// ============================================================================
// AWARD ENGINE v2
// - nominations are ranked strictly inside the selected period (month or year)
// - every nomination has its own logic (artist, album, track, alt track, feat,
//   freshman, cover) + user rating & user nominations give a boost
// - top-10 for every award, deterministic "realistic" votes that are recomputed
//   from the data (change data -> votes change, same data -> same votes)
// - a winner chosen by the user is never replaced (only nominees/votes refresh)
// - sync returns an undo package (restore + remove)
// ============================================================================
import type { Artist, Album, Track, AwardItem, AwardNominee, RatingData } from '../types';

export interface AwardCatalog { artists: Artist[]; albums: Album[]; tracks: Track[] }
export interface AwardPeriod { year: string; month?: string } // month: '01'..'12', none = whole year
export type NomKind = 'artist' | 'album' | 'track' | 'alt_track' | 'feature' | 'freshman' | 'cover';
export type NomTarget = 'artist' | 'album' | 'track';

export interface EngineNominee extends AwardNominee {
  id?: string;
  type?: NomTarget | 'custom';
  inPeriod?: boolean;
  reason?: string;
  score?: number;
}
export interface EngineAward extends AwardItem {
  source?: 'auto' | 'manual';          // auto = made by the script, manual = user chose the winner
  nomineesMode?: 'auto' | 'manual';    // manual = user picked the top-10 himself
  nominees?: EngineNominee[];
}
export interface RankedCandidate {
  id: string;
  type: NomTarget;
  title: string;
  artistName?: string;
  coverUrl?: string;
  score: number;
  plays: number;
  inPeriod: boolean;
  reason?: string;
}

const KIND_META: Record<NomKind, { target: NomTarget; month: string; year: string; idPart: string }> = {
  artist: { target: 'artist', month: 'Артист месяца', year: 'Артист года', idPart: 'artist' },
  album: { target: 'album', month: 'Альбом месяца', year: 'Альбом года', idPart: 'album' },
  track: { target: 'track', month: 'Трек месяца', year: 'Трек года', idPart: 'track' },
  alt_track: { target: 'track', month: 'Трек месяца (Альтернатива)', year: 'Трек альтернатива года', idPart: 'alt-track' },
  feature: { target: 'track', month: 'Фит месяца', year: 'Фит года', idPart: 'feature' },
  freshman: { target: 'artist', month: 'Фрешмен месяца', year: 'Фрешмен года', idPart: 'freshman' },
  cover: { target: 'album', month: 'Обложка месяца', year: 'Обложка года', idPart: 'cover' }
};
export const KIND_ORDER: NomKind[] = ['artist', 'album', 'track', 'alt_track', 'feature', 'freshman', 'cover'];

export function nominationDefs(periodType: 'month' | 'year') {
  return KIND_ORDER.map(kind => ({
    key: `${kind}_of_${periodType}`,
    kind,
    title: KIND_META[kind][periodType],
    target: KIND_META[kind].target
  }));
}
export function kindOfKey(key: string): NomKind | null {
  const m = /^(.+)_of_(month|year)$/.exec(key || '');
  return m && m[1] in KIND_META ? (m[1] as NomKind) : null;
}
export function targetOfKey(key: string): NomTarget {
  const k = kindOfKey(key);
  return k ? KIND_META[k].target : 'track';
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const norm = (s?: string) => (s || '').toLowerCase().replace(/[«»"'`]/g, '').replace(/\s+/g, ' ').trim();
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pw = (x: number) => Math.pow(Math.max(0, x) + 1, 0.92);
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seedKey: string) {
  let a = hashStr(seedKey) || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
}
function parseYM(s?: string): { y: number; m: number } | null {
  if (!s) return null;
  const t = s.trim();
  let r = /^(\d{4})[-./](\d{1,2})/.exec(t);
  if (r) return { y: +r[1], m: +r[2] };
  r = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/.exec(t);
  if (r) return { y: +r[3], m: +r[2] };
  return null;
}
const ratingBoost = (r?: RatingData) => (r?.totalScore ? 1 + 0.45 * Math.pow(r.totalScore / 90, 2) : 1);
const NOM_WORDS: Record<NomKind, RegExp> = {
  artist: /артист/i, album: /альбом|ep|микстейп/i, track: /трек|хит/i, alt_track: /альтернатив/i,
  feature: /фит|feat/i, freshman: /фрешмен|дебют|открыти|новичок/i, cover: /обложк/i
};
const userNomBoost = (r: RatingData | undefined, kind: NomKind) =>
  r?.nominations?.some(n => NOM_WORDS[kind].test(n)) ? 1.25 : 1;
const ALT_GENRE = /indie|инди|rock|рок|grunge|гранж|emo|эмо|punk|панк|alt|альт|hyper|хайпер|электро|electro|lo-?fi|атмос|atmos|shoegaze|experimental|экспер|cloud|клауд/i;
const VALUE_BOOST: Record<string, number> = { silver: 1.03, gold: 1.06, emerald: 1.09, sapphire: 1.12, ruby: 1.16 };
const hasRealCover = (u?: string) => Boolean(u && !u.includes('picsum.photos'));
export function splitFeats(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/[,&/;]|\bfeat\.?|\bft\.?|\s[xх]\s/i).map(s => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// catalog index (cached per catalog arrays)
// ---------------------------------------------------------------------------
interface TI { t: Track; key: string; y?: number; ord?: number; plays: number; feats: string[] }
interface AI { a: Album; key: string; y?: number; ord?: number; plays: number; trackCount: number }
interface Index {
  tracks: TI[]; albums: AI[];
  artistByKey: Map<string, Artist>; nameToKey: Map<string, string>;
  trackP50: number; followersP85: number;
}
const indexCache = new WeakMap<object, { albums: object; artists: object; idx: Index }>();

function buildIndex(c: AwardCatalog): Index {
  const hit = indexCache.get(c.tracks);
  if (hit && hit.albums === c.albums && hit.artists === c.artists) return hit.idx;
  const artistByKey = new Map<string, Artist>();
  const nameToKey = new Map<string, string>();
  for (const a of c.artists) { artistByKey.set(String(a.id), a); nameToKey.set(norm(a.name), String(a.id)); }
  const keyOf = (id?: string, name?: string) =>
    (id && artistByKey.has(String(id)) ? String(id) : nameToKey.get(norm(name))) || `name:${norm(name)}`;

  const albumTrackPlays = new Map<string, number>();
  const albumTrackCount = new Map<string, number>();
  for (const t of c.tracks) {
    if (!t.albumId) continue;
    albumTrackPlays.set(t.albumId, (albumTrackPlays.get(t.albumId) || 0) + (t.plays || 0));
    albumTrackCount.set(t.albumId, (albumTrackCount.get(t.albumId) || 0) + 1);
  }
  const tracks: TI[] = c.tracks.map(t => {
    const d = parseYM(t.releaseDate);
    return { t, key: keyOf(t.artistId, t.artistName), y: d?.y, ord: d ? d.y * 12 + d.m - 1 : undefined, plays: t.plays || 0, feats: splitFeats(t.featuredArtist) };
  });
  const albums: AI[] = c.albums.map(a => {
    const d = parseYM(a.releaseDate);
    const y = d?.y ?? (a.releaseYear || undefined);
    return {
      a, key: keyOf(a.artistId, a.artistName), y, ord: d ? d.y * 12 + d.m - 1 : undefined,
      plays: a.totalPlays || albumTrackPlays.get(a.id) || 0, trackCount: albumTrackCount.get(a.id) || 0
    };
  });
  const idx: Index = {
    tracks, albums, artistByKey, nameToKey,
    trackP50: percentile(tracks.map(x => x.plays), 0.5),
    followersP85: percentile(c.artists.map(a => a.followers || 0), 0.85)
  };
  indexCache.set(c.tracks, { albums: c.albums, artists: c.artists, idx });
  return idx;
}

function periodBounds(p: AwardPeriod) {
  const y = +p.year;
  if (p.month) { const o = y * 12 + (+p.month - 1); return { start: o, end: o, mid: o }; }
  return { start: y * 12, end: y * 12 + 11, mid: y * 12 + 5.5 };
}
function inPeriod(x: { y?: number; ord?: number }, p: AwardPeriod): boolean {
  if (p.month) return x.ord !== undefined && x.ord === +p.year * 12 + (+p.month - 1);
  return x.y === +p.year;
}
const ordOf = (x: { y?: number; ord?: number }) => x.ord ?? (x.y !== undefined ? x.y * 12 : undefined);

// ---------------------------------------------------------------------------
// ranking per nomination
// ---------------------------------------------------------------------------
const trackCand = (x: TI, score: number, inP = true, reason?: string, feat = false): RankedCandidate => ({
  id: x.t.id, type: 'track', title: x.t.title,
  artistName: feat && x.t.featuredArtist ? `${x.t.artistName} feat. ${x.t.featuredArtist}` : x.t.artistName,
  coverUrl: x.t.coverUrl, score, plays: x.plays, inPeriod: inP, reason
});
const albumCand = (x: AI, score: number, inP = true, reason?: string): RankedCandidate => ({
  id: x.a.id, type: 'album', title: x.a.title, artistName: x.a.artistName, coverUrl: x.a.coverUrl,
  score, plays: x.plays, inPeriod: inP, reason
});

interface Agg { plays: number; releases: number; rSum: number; rN: number; peak: number }
function artistAggregates(idx: Index, p: AwardPeriod): Map<string, Agg> {
  const agg = new Map<string, Agg>();
  const get = (k: string) => {
    let v = agg.get(k);
    if (!v) { v = { plays: 0, releases: 0, rSum: 0, rN: 0, peak: 0 }; agg.set(k, v); }
    return v;
  };
  const albumsInP = new Set<string>();
  for (const x of idx.albums) {
    if (!inPeriod(x, p)) continue;
    albumsInP.add(x.a.id);
    const v = get(x.key);
    v.plays += x.plays; v.releases++;
    if (x.a.rating?.totalScore) { v.rSum += x.a.rating.totalScore; v.rN++; }
  }
  for (const x of idx.tracks) {
    if (!inPeriod(x, p) || x.t.isSnippet) continue;
    const v = get(x.key);
    if (!(x.t.albumId && albumsInP.has(x.t.albumId))) { v.plays += x.plays; v.releases++; }
    v.peak = Math.max(v.peak, x.plays);
    if (x.t.rating?.totalScore) { v.rSum += x.t.rating.totalScore; v.rN++; }
    for (const f of x.feats) {
      const fk = idx.nameToKey.get(norm(f));
      if (fk && fk !== x.key) get(fk).plays += x.plays * 0.35;
    }
  }
  return agg;
}
function artistScore(a: Artist | undefined, v: Agg): number {
  const avgR = v.rN ? v.rSum / v.rN / 90 : 0;
  const fol = a?.followers || 0;
  return pw(v.plays) * (1 + 0.05 * Math.min(v.releases, 6)) * (1 + 0.15 * avgR) * (1 + 0.04 * Math.log10(1 + fol / 1e5));
}
const artistCand = (key: string, a: Artist | undefined, score: number, plays: number, sub: string, inP = true, reason?: string): RankedCandidate => ({
  id: a ? String(a.id) : key, type: 'artist', title: a?.name || key.replace(/^name:/, ''),
  artistName: sub, coverUrl: a?.imageUrl, score, plays, inPeriod: inP, reason
});

function previousFreshmen(awards: AwardItem[] | undefined, idx: Index, p: AwardPeriod): Set<string> {
  const out = new Set<string>();
  for (const aw of awards || []) {
    if (aw.nominationKey !== 'freshman_of_year' || +aw.year >= +p.year) continue;
    const k = aw.winner.id && idx.artistByKey.has(aw.winner.id) ? aw.winner.id : idx.nameToKey.get(norm(aw.winner.title));
    if (k) out.add(k);
  }
  return out;
}

export function rankNomination(key: string, period: AwardPeriod, catalog: AwardCatalog, awards?: AwardItem[]): RankedCandidate[] {
  const kind = kindOfKey(key);
  if (!kind) return [];
  const idx = buildIndex(catalog);
  const annual = !period.month;
  const tracksIn = idx.tracks.filter(x => inPeriod(x, period) && !x.t.isSnippet);
  let out: RankedCandidate[] = [];

  if (kind === 'track') {
    out = tracksIn.map(x => trackCand(x, pw(x.plays) * ratingBoost(x.t.rating) * userNomBoost(x.t.rating, 'track')));
  } else if (kind === 'feature') {
    out = tracksIn.filter(x => x.feats.length > 0)
      .map(x => trackCand(x, pw(x.plays) * ratingBoost(x.t.rating) * userNomBoost(x.t.rating, 'feature') * (1 + 0.06 * Math.min(3, x.feats.length)), true, undefined, true));
  } else if (kind === 'alt_track') {
    const top = [...tracksIn].sort((a, b) => b.plays - a.plays)[0];
    const fol = tracksIn.map(x => idx.artistByKey.get(x.key)?.followers || 0);
    const medianFol = percentile(fol, 0.5);
    out = tracksIn.filter(x => x !== top).flatMap(x => {
      const art = idx.artistByKey.get(x.key);
      const alt = ALT_GENRE.test(`${x.t.genre || ''} ${art?.genre || ''}`);
      const small = (art?.followers || 0) <= medianFol;
      if (!alt && !small) return [];
      const s = pw(x.plays) * ratingBoost(x.t.rating) * userNomBoost(x.t.rating, 'alt_track') * (alt ? 1.15 : 1);
      return [trackCand(x, s, true, alt ? 'Альтернативное звучание' : 'Андерграунд')];
    });
  } else if (kind === 'album') {
    out = idx.albums.filter(x => inPeriod(x, period)).map(x => {
      const fmt = x.trackCount && x.trackCount <= 3 ? 0.75 : x.trackCount && x.trackCount <= 7 ? 0.9 : 1;
      const s = pw(x.plays) * ratingBoost(x.a.rating) * userNomBoost(x.a.rating, 'album') * (VALUE_BOOST[x.a.albumValue?.categoryKey || ''] || 1) * fmt;
      return albumCand(x, s, true, x.trackCount && x.trackCount <= 7 ? 'EP' : undefined);
    });
  } else if (kind === 'cover') {
    const items = [
      ...idx.albums.filter(x => inPeriod(x, period) && hasRealCover(x.a.coverUrl)).map(x => ({ c: albumCand(x, 0), r: x.a.rating, plays: x.plays })),
      ...tracksIn.filter(x => (!x.t.albumId || x.t.albumId === 'single') && hasRealCover(x.t.coverUrl)).map(x => ({ c: trackCand(x, 0), r: x.t.rating, plays: x.plays }))
    ];
    const byPlays = [...items].sort((a, b) => a.plays - b.plays);
    out = items.map(it => {
      const popRank = items.length > 1 ? byPlays.indexOf(it) / (items.length - 1) : 1;
      const style = it.r?.style ? it.r.style / 10 : it.r?.totalScore ? it.r.totalScore / 90 : 0.5;
      const taste = rng(`cover:${it.c.id}`)();
      const s = (0.5 * popRank + 0.3 * style + 0.2 * taste) * userNomBoost(it.r, 'cover') * 1e6;
      return { ...it.c, score: s };
    });
  } else {
    // artist / freshman
    const agg = artistAggregates(idx, period);
    const sub = (fr: boolean) => fr ? (annual ? 'Открытие года' : 'Новичок месяца') : (annual ? 'Исполнитель года' : 'Исполнитель месяца');
    if (kind === 'artist') {
      agg.forEach((v, k) => { if (v.plays > 0) out.push(artistCand(k, idx.artistByKey.get(k), artistScore(idx.artistByKey.get(k), v), v.plays, sub(false))); });
    } else {
      const { start } = periodBounds(period);
      const prior = new Map<string, { first?: number; peak: number }>();
      const note = (k: string, o: number | undefined, plays: number, isTrack: boolean) => {
        if (o === undefined) return;
        const st = prior.get(k) || { peak: 0 };
        st.first = st.first === undefined ? o : Math.min(st.first, o);
        if (o < start && isTrack) st.peak = Math.max(st.peak, plays);
        prior.set(k, st);
      };
      idx.tracks.forEach(x => note(x.key, ordOf(x), x.plays, true));
      idx.albums.forEach(x => note(x.key, ordOf(x), x.plays, false));
      const banned = previousFreshmen(awards, idx, period);
      agg.forEach((v, k) => {
        if (v.plays <= 0 || banned.has(k)) return;
        const a = idx.artistByKey.get(k);
        const st = prior.get(k);
        const hadBefore = st?.first !== undefined && st.first < start;
        let boost = 0; let reason = '';
        if (!hadBefore) { boost = 1.4; reason = 'Дебют в этом периоде'; }
        else if ((st!.first as number) >= start - 12) { boost = 1.2; reason = 'Первый релиз меньше года назад'; }
        else if (st!.peak < idx.trackP50 && v.peak > st!.peak * 2) { boost = 1.1; reason = 'Прорыв: раньше треки были малоизвестны'; }
        if (!boost) return;
        const fol = a?.followers || 0;
        if (hadBefore && fol > idx.followersP85) return; // already a star
        const fame = 1 / (1 + 0.25 * Math.log10(1 + fol / 1e5)); // newcomers with a smaller audience get a chance
        out.push(artistCand(k, a, artistScore(a, v) * boost * fame, v.plays, sub(true), true, reason));
      });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Tops up a list to `size` with the closest releases outside the period (marked inPeriod=false). */
function fillUp(list: RankedCandidate[], key: string, period: AwardPeriod, catalog: AwardCatalog, size: number): RankedCandidate[] {
  if (list.length >= size) return list.slice(0, size);
  const kind = kindOfKey(key)!;
  const idx = buildIndex(catalog);
  const have = new Set(list.map(c => `${c.type}:${c.id}`));
  const { mid } = periodBounds(period);
  const base = (list[list.length - 1]?.score || 1) * 0.6;
  const dist = (x: { y?: number; ord?: number }) => { const o = ordOf(x); return o === undefined ? 999 : Math.abs(o - mid); };
  let pool: RankedCandidate[] = [];
  const target = KIND_META[kind].target;
  if (target === 'artist') {
    pool = [...idx.artistByKey.values()].sort((a, b) => (b.followers || 0) - (a.followers || 0))
      .map(a => artistCand(String(a.id), a, 0, a.followers || 0, 'Номинант', false, 'Вне периода'));
  } else if (target === 'album') {
    pool = idx.albums.filter(x => kind !== 'cover' || hasRealCover(x.a.coverUrl))
      .sort((a, b) => dist(a) - dist(b) || b.plays - a.plays).map(x => albumCand(x, 0, false, 'Вне периода'));
  } else {
    pool = idx.tracks.filter(x => !x.t.isSnippet && (kind !== 'feature' || x.feats.length > 0))
      .sort((a, b) => dist(a) - dist(b) || b.plays - a.plays).map(x => trackCand(x, 0, false, 'Вне периода', kind === 'feature'));
  }
  const out = [...list];
  for (const c of pool) {
    if (out.length >= size) break;
    if (have.has(`${c.type}:${c.id}`)) continue;
    have.add(`${c.type}:${c.id}`);
    out.push({ ...c, score: base * Math.pow(0.95, out.length - list.length) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// votes
// ---------------------------------------------------------------------------
function largestRemainder(shares: number[], total: number): number[] {
  const raw = shares.map(s => s * total);
  const res = raw.map(Math.floor);
  let left = total - res.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as [number, number]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0 && k < order.length; k++, left--) res[order[k][1]]++;
  for (let i = 0; i < res.length; i++) {
    if (res[i] >= 1) continue;
    const j = res.indexOf(Math.max(...res));
    if (res[j] > 1) { res[j]--; res[i] = 1; }
  }
  return res;
}

/** weights[0] is the winner. Returns realistic, deterministic percents and vote counts. */
export function computeVotes(weights: number[], seedKey: string, annual: boolean, popularity: number) {
  if (!weights.length) return [];
  const r = rng(seedKey);
  const w = weights.map(x => Math.pow(Math.max(x, 1e-6), 0.8) * (0.88 + 0.24 * r()));
  const maxOther = w.length > 1 ? Math.max(...w.slice(1)) : 0;
  if (w.length > 1 && w[0] <= maxOther) w[0] = maxOther * (1.03 + 0.08 * r());
  const sum = w.reduce((a, b) => a + b, 0);
  const shares = w.map(x => x / sum);
  const total = Math.round(clamp(Math.sqrt(Math.max(1, popularity)) * 55, 18_000, 20_000_000) * (annual ? 2.6 : 1) * (0.9 + 0.2 * r()));
  const pct = largestRemainder(shares, 100);
  if (pct.length > 1) {
    const j = pct.indexOf(Math.max(...pct.slice(1)), 1);
    if (pct[0] <= pct[j]) { pct[0]++; pct[j]--; }
  }
  return shares.map((s, i) => ({ percent: pct[i], votesCount: Math.round(s * total) }));
}

// ---------------------------------------------------------------------------
// award building
// ---------------------------------------------------------------------------
const AUTO_ID = /^award-\d{4}-(\d{2}|annual)-(artist|album|track|alt-track|feature|freshman|cover)$/;
export const isAutoAward = (a: EngineAward) => a.source === 'auto' || (a.source === undefined && AUTO_ID.test(a.id));

function sameItem(c: { id?: string; title: string; artistName?: string; type?: string }, w: { id?: string; title: string; artistName?: string }, target: NomTarget): boolean {
  if (w.id && c.id && String(c.id) === String(w.id)) return true;
  if (norm(c.title) !== norm(w.title)) return false;
  if (target === 'artist' || !w.artistName || !c.artistName) return true;
  const a = norm(c.artistName).split(' feat')[0];
  const b = norm(w.artistName).split(' feat')[0];
  return a === b || a.includes(b) || b.includes(a);
}

export interface BuildOptions {
  existing?: EngineAward;
  awards?: AwardItem[];
  size?: number;          // default 10
  keepWinner?: boolean;   // default: keep it when the existing award is not auto
}

export function buildAward(key: string, period: AwardPeriod, catalog: AwardCatalog, opts: BuildOptions = {}): EngineAward | null {
  const kind = kindOfKey(key);
  if (!kind) return null;
  const size = opts.size ?? 10;
  const target = KIND_META[kind].target;
  const annual = !period.month;
  const ex = opts.existing;
  const keep = ex ? (opts.keepWinner ?? !isAutoAward(ex)) : false;
  const ranked = rankNomination(key, period, catalog, opts.awards);
  if (!ranked.length && !keep) return null;

  const manual = ex?.nomineesMode === 'manual' && (ex.nominees?.length || 0) > 0;
  let list: RankedCandidate[];
  if (manual) {
    list = ex!.nominees!.map((n, i) => {
      const hit = ranked.find(c => sameItem(c, n, target));
      return hit ? { ...hit } : {
        id: n.id || `custom-${i}`, type: (n.type as NomTarget) || target, title: n.title, artistName: n.artistName,
        coverUrl: n.coverUrl, score: 0, plays: 0, inPeriod: true
      };
    });
  } else {
    list = fillUp(ranked, key, period, catalog, size);
  }

  if (keep && ex) {
    const w = ex.winner;
    const i = list.findIndex(c => sameItem(c, w, target));
    const winC: RankedCandidate = i >= 0 ? list.splice(i, 1)[0] : {
      id: w.id || `custom-winner`, type: (w.type === 'custom' ? target : w.type) as NomTarget, title: w.title,
      artistName: w.artistName, coverUrl: w.coverUrl, score: 0, plays: 0, inPeriod: true
    };
    list.unshift(winC);
  }
  list = list.slice(0, size);
  const top = Math.max(1, ...list.map(c => c.score));
  list.forEach((c, i) => { if (!(c.score > 0)) c.score = top * Math.pow(0.82, i + 1); });
  if (!manual) {
    const [first, ...rest] = list;
    list = keep ? [first, ...rest.sort((a, b) => b.score - a.score)] : [...list].sort((a, b) => b.score - a.score);
  }

  const seed = `${key}|${period.year}|${period.month || ''}|${list.map(c => `${c.id}:${Math.round(c.score)}`).join(',')}`;
  const popularity = list.reduce((s, c) => s + (c.plays || 0), 0);
  const votes = computeVotes(list.map(c => c.score), seed, annual, popularity);
  const nominees: EngineNominee[] = list.map((c, i) => ({
    id: c.id, type: c.type, title: c.title, artistName: c.artistName, coverUrl: c.coverUrl,
    votesPercent: votes[i].percent, votesCount: votes[i].votesCount, inPeriod: c.inPeriod, reason: c.reason, score: c.score
  }));
  if (!manual && nominees.length > 2) {
    const [w0, ...others] = nominees;
    others.sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
    nominees.splice(0, nominees.length, w0, ...others);
  }

  const lead = list[0];
  const winner: AwardItem['winner'] = keep && ex
    ? { ...ex.winner, coverUrl: ex.winner.coverUrl || lead?.coverUrl }
    : { id: lead.id, type: lead.type, title: lead.title, artistName: lead.artistName, coverUrl: lead.coverUrl };

  return {
    ...(ex || {}),
    id: ex?.id || `award-${period.year}-${period.month || 'annual'}-${KIND_META[kind].idPart}`,
    year: period.year,
    month: period.month,
    periodType: annual ? 'year' : 'month',
    nominationKey: key,
    nominationTitle: ex?.nominationTitle || KIND_META[kind][annual ? 'year' : 'month'],
    winner,
    nominees,
    awardedAt: ex?.awardedAt || (annual ? `${period.year}-12-31` : `${period.year}-${period.month}-28`),
    source: keep ? (ex?.source === 'auto' ? 'manual' : ex?.source || 'manual') : 'auto',
    nomineesMode: manual ? 'manual' : 'auto'
  };
}

/** Live top-10 for an existing award. Never changes the winner the user has. */
export function recomputeAward(award: EngineAward, catalog: AwardCatalog, awards?: AwardItem[]): EngineAward {
  const period: AwardPeriod = { year: award.year, month: award.periodType === 'month' ? award.month : undefined };
  return buildAward(award.nominationKey, period, catalog, { existing: award, awards, keepWinner: true }) || award;
}

// ---------------------------------------------------------------------------
// sync for the selected page (with undo)
// ---------------------------------------------------------------------------
export function periodsForSelection(year: string, selected: string, catalog: AwardCatalog): AwardPeriod[] {
  if (selected === 'year_review') return [{ year }];
  if (selected !== 'all_months') return [{ year, month: selected }];
  const idx = buildIndex(catalog);
  const months = new Set<string>();
  for (const x of [...idx.tracks, ...idx.albums]) {
    if (x.ord !== undefined && Math.floor(x.ord / 12) === +year) months.add(String((x.ord % 12) + 1).padStart(2, '0'));
  }
  return [...months].sort().map(month => ({ year, month }));
}

export interface SyncResult {
  upserts: EngineAward[];
  undo: { restore: AwardItem[]; remove: string[] };
  summary: { created: number; updated: number; keptWinners: number };
}

export function syncAwards(periods: AwardPeriod[], catalog: AwardCatalog, awards: AwardItem[], size = 10): SyncResult {
  const res: SyncResult = { upserts: [], undo: { restore: [], remove: [] }, summary: { created: 0, updated: 0, keptWinners: 0 } };
  for (const p of periods) {
    const pt = p.month ? 'month' : 'year';
    for (const def of nominationDefs(pt)) {
      const ex = awards.find(a => a.year === p.year && a.periodType === pt && (pt === 'year' || a.month === p.month) && a.nominationKey === def.key) as EngineAward | undefined;
      const built = buildAward(def.key, p, catalog, { existing: ex, awards, size });
      if (!built) continue;
      res.upserts.push(built);
      if (ex) {
        res.undo.restore.push(ex);
        if (isAutoAward(ex)) res.summary.updated++; else res.summary.keptWinners++;
      } else {
        res.undo.remove.push(built.id);
        res.summary.created++;
      }
    }
  }
  return res;
}
