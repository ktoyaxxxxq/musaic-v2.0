// ============================================================================
// MUSAIC LAB (v2.5) — one module for the new tools, so the folder stays small
//  1. Listen engine: settings for plays generation, growth, catalog, charts,
//     monthly listeners and hype (+ groups of artists, presets, resets)
//  2. Smart track duration (feats make tracks longer, sometimes not)
//  3. Auto-save guards: persistent storage, rolling auto-backups, flush on close
//  4. Export helpers: simulation → regular DB (light / full / media), compact
//     simulation snapshot with deduplicated images
//  5. Release stats modal (click on plays of an album / track)
//  6. Release header settings (album page) + drawer
//  7. Simulation digest pro («Итоги и слоты») + week buzz strip (rumors, teasers)
//  8. Feat picker (several artists) for the track editor
// ============================================================================
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { Artist, Album, Track, AwardItem, SimState, SimWeekDigest } from './types';
import { CoverArt, resolveMedia, dbGet, dbSet, dbGetAllMedia, dbPutMediaBatch, loadMediaCache, formatNumber, mediaCache, notifyMediaUpdated } from './App';
import { RELEASE_PROMO_LABELS } from './SimulationMode';
import { loadConfirmed } from './SocialFeed';
import type { MediaItem } from './App';

// ---------------------------------------------------------------------------
// small shared helpers
// ---------------------------------------------------------------------------
const DAY = 864e5;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lsGet = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const lsSet = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } };
const norm = (s?: string) => (s || '').toLowerCase().replace(/[«»"'`]/g, '').replace(/\s+/g, ' ').trim();
const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const seeded = (seed: number) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const msOf = (iso?: string) => { if (!iso) return NaN; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
const fmtDate = (iso?: string) => (iso && iso.length >= 10 ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '—');
export const fmtC = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace('.', ',')} млрд`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',')} млн`;
  if (a >= 1e4) return `${Math.round(n / 1e3)} тыс.`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1).replace('.', ',')} тыс.`;
  return String(Math.round(n));
};
const splitNames = (raw?: string) => (raw || '').split(/[,&/;]|\bfeat\.?|\bft\.?|\s[xх]\s|\sи\s/i).map(x => x.trim()).filter(Boolean);

type Store<T> = { get: () => T; set: (n: T) => void; sub: (f: () => void) => () => void };
function createStore<T>(initial: T): Store<T> {
  let v = initial; const ls = new Set<() => void>();
  return { get: () => v, set: n => { v = n; ls.forEach(f => f()); }, sub: f => { ls.add(f); return () => { ls.delete(f); }; } };
}
const useStore = <T,>(s: Store<T>) => useSyncExternalStore(s.sub, s.get, s.get);

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => (typeof document === 'undefined' ? null : createPortal(children, document.body));
function useEsc(on: boolean, cb: () => void) {
  useEffect(() => {
    if (!on) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); cb(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [on, cb]);
}

export function Seg<T extends string>({ value, options, onChange, small }: { value: T; options: Array<[T, React.ReactNode]>; onChange: (v: T) => void; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`${small ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11px]'} rounded-lg font-bold transition-colors ${value === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>{l}</button>
      ))}
    </div>
  );
}
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: React.ReactNode; hint?: string }> = ({ on, onChange, label, hint }) => (
  <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 text-left">
    <span className="min-w-0"><span className="block text-[12px] font-semibold text-zinc-200">{label}</span>{hint && <span className="block text-[10.5px] text-zinc-500 leading-snug">{hint}</span>}</span>
    <span className={`shrink-0 w-8 h-[18px] rounded-full p-0.5 transition-colors ${on ? 'theme-bg-accent' : 'bg-white/10'}`}><span className={`block w-[14px] h-[14px] rounded-full bg-white transition-transform ${on ? 'translate-x-[14px]' : ''}`} /></span>
  </button>
);

/** slider for a multiplier: shows ×1.25 / −20 %, double click resets */
const MultSlider: React.FC<{ label: string; hint?: string; value: number; def?: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; unit?: 'x' | 'pct' | 'raw' }> = memo(({ label, hint, value, def = 1, min = 0.2, max = 3, step = 0.01, onChange, unit = 'x' }) => {
  const changed = Math.abs(value - def) > 1e-6;
  const shown = unit === 'raw' ? value.toFixed(2) : unit === 'pct' ? `${Math.round(value * 100)}%` : `×${value.toFixed(2)}`;
  const delta = unit === 'x' && changed ? `${value > def ? '+' : '−'}${Math.round(Math.abs(value / def - 1) * 100)}%` : '';
  const pct = ((value - min) / (max - min)) * 100;
  const defPct = ((def - min) / (max - min)) * 100;
  return (
    <div className="group/ms" onDoubleClick={() => onChange(def)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold text-zinc-200 truncate">{label}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          {delta && <span className={`text-[10px] font-bold ${value > def ? 'text-emerald-400' : 'text-rose-400'}`}>{delta}</span>}
          <span className={`text-[11px] font-mono font-bold tabular-nums ${changed ? 'text-white' : 'text-zinc-500'}`}>{shown}</span>
          {changed && <button type="button" title="Вернуть" onClick={() => onChange(def)} className="text-[11px] text-zinc-500 hover:text-white">↺</button>}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/[0.07]" />
        <div className="absolute h-1 rounded-full theme-bg-accent opacity-70" style={{ left: `${Math.min(pct, defPct)}%`, width: `${Math.abs(pct - defPct)}%` }} />
        <div className="absolute w-px h-2.5 bg-white/30" style={{ left: `${defPct}%` }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="relative w-full accent-white opacity-90 cursor-pointer" />
      </div>
      {hint && <div className="text-[10.5px] text-zinc-500 leading-snug -mt-0.5">{hint}</div>}
    </div>
  );
});

// ============================================================================
// 1. LISTEN ENGINE
// ============================================================================
export interface ListenParams {
  debutMult: number; singleMult: number; albumMult: number; snippetMult: number; featMult: number;
  variance: number; viralChance: number; manualMult: number;
  growthMult: number; growthEarly: number; growthMid: number; growthLate: number; sleeperMult: number;
  catGrowth: number; catFresh: number; catMid: number; catOld: number; catSleeper: number;
  chartNew: number; chartLong: number; chartArtist: number;
  lisGain: number; lisLoss: number; lisDrift: number; lisCap: number;
  hypeGain: number; hypeLoss: number;
}
export const DEFAULT_LISTEN: ListenParams = {
  debutMult: 1, singleMult: 1, albumMult: 1, snippetMult: 1, featMult: 1, variance: 1, viralChance: 1, manualMult: 1,
  growthMult: 1, growthEarly: 1, growthMid: 1, growthLate: 1, sleeperMult: 1,
  catGrowth: 1, catFresh: 1, catMid: 1, catOld: 1, catSleeper: 1,
  chartNew: 1, chartLong: 1, chartArtist: 1,
  lisGain: 1, lisLoss: 1, lisDrift: 0, lisCap: 1, hypeGain: 1, hypeLoss: 1
};
type PK = keyof ListenParams;
/** additive keys (others multiply) */
const ADDITIVE: PK[] = ['lisDrift'];

interface ParamMeta { k: PK; label: string; hint: string; min: number; max: number; unit?: 'x' | 'raw' }
const PARAM_GROUPS: Array<{ id: string; title: string; icon: string; sub: string; items: ParamMeta[] }> = [
  {
    id: 'debut', title: 'Дебют', icon: '🚀', sub: 'Сколько прослушиваний релиз получает на старте: автопилот, полуавтомат, ручной батч, идеи, ручное создание',
    items: [
      { k: 'debutMult', label: 'Общий масштаб дебюта', hint: 'Умножает стартовые прослушивания всех релизов', min: 0.3, max: 3 },
      { k: 'singleMult', label: 'Синглы', hint: 'Только треки-синглы', min: 0.3, max: 3 },
      { k: 'albumMult', label: 'Альбомы и EP', hint: 'Сумма по альбому на старте', min: 0.3, max: 3 },
      { k: 'snippetMult', label: 'Сниппеты', hint: 'Отрывки и тизеры', min: 0.2, max: 3 },
      { k: 'featMult', label: 'Бонус за фит', hint: 'Дополнительно для релизов с гостями', min: 0.5, max: 2.5 },
      { k: 'variance', label: 'Разброс (рандом)', hint: '0 — всегда прогноз, 1 — как сейчас, 2 — очень непредсказуемо', min: 0, max: 2.5, unit: 'raw' },
      { k: 'viralChance', label: 'Шанс вирусного взрыва', hint: 'Как часто релиз внезапно выстреливает', min: 0, max: 4 },
      { k: 'manualMult', label: 'Ручное создание (вне симуляции)', hint: 'Кнопка «Рандом» прослушиваний в студии и редакторе', min: 0.3, max: 3 }
    ]
  },
  {
    id: 'growth', title: 'Рост новых', icon: '📈', sub: 'Как быстро и как долго набирают релизы, вышедшие в симуляции',
    items: [
      { k: 'growthMult', label: 'Общий рост за неделю', hint: 'Все недельные приросты новых релизов', min: 0.2, max: 3 },
      { k: 'growthEarly', label: 'Первые 2 недели', hint: 'Скорость разгона сразу после выхода', min: 0.2, max: 3 },
      { k: 'growthMid', label: '3–8 неделя', hint: 'Середина жизни релиза', min: 0.2, max: 3 },
      { k: 'growthLate', label: 'После 2 месяцев', hint: 'Длинный хвост: «вечнозелёные» треки', min: 0.1, max: 3 },
      { k: 'sleeperMult', label: 'Шанс «спящего хита»', hint: 'Старый трек внезапно начинает расти', min: 0, max: 4 }
    ]
  },
  {
    id: 'catalog', title: 'Каталог', icon: '🗂', sub: 'Треки, которые уже были в исходной базе. У них большие цифры, поэтому растут медленнее',
    items: [
      { k: 'catGrowth', label: 'Общий рост каталога', hint: 'Все треки исходной базы', min: 0, max: 3 },
      { k: 'catFresh', label: 'Свежие (до 4 месяцев)', hint: 'Недавно вышедшие треки базы', min: 0, max: 3 },
      { k: 'catMid', label: 'Средние (4–12 месяцев)', hint: '', min: 0, max: 3 },
      { k: 'catOld', label: 'Старые (больше года)', hint: 'Классика каталога', min: 0, max: 3 },
      { k: 'catSleeper', label: 'Возвращения старых хитов', hint: 'Шанс, что старый трек снова «оживёт»', min: 0, max: 4 }
    ]
  },
  {
    id: 'charts', title: 'Чарты', icon: '🏆', sub: 'Как легко попасть в чарт и как долго в нём держаться',
    items: [
      { k: 'chartNew', label: 'Вес новинок (до 3 недель)', hint: 'Больше — новые релизы чаще влетают высоко', min: 0.3, max: 3 },
      { k: 'chartLong', label: 'Вес старых (после 3 месяцев)', hint: 'Больше — хиты дольше держатся в чарте', min: 0.2, max: 3 },
      { k: 'chartArtist', label: 'Чартовый вес артиста', hint: 'Полезно для групп: «звёзды» / «андеграунд»', min: 0.3, max: 3 }
    ]
  },
  {
    id: 'listeners', title: 'Слушатели и хайп', icon: '👥', sub: 'Как меняются месячные слушатели и хайп артистов каждую неделю',
    items: [
      { k: 'lisGain', label: 'Рост слушателей', hint: 'После релизов, фитов, чартов', min: 0, max: 3 },
      { k: 'lisLoss', label: 'Спад слушателей', hint: 'Когда артист долго молчит', min: 0, max: 3 },
      { k: 'lisDrift', label: 'Случайные колебания', hint: '0 — нет, 1 — лёгкие ±, 3 — сильные', min: 0, max: 3, unit: 'raw' },
      { k: 'lisCap', label: 'Предел изменения за неделю', hint: 'Максимальный скачок вверх и вниз', min: 0.3, max: 3 },
      { k: 'hypeGain', label: 'Рост хайпа', hint: '', min: 0, max: 3 },
      { k: 'hypeLoss', label: 'Спад хайпа', hint: '', min: 0, max: 3 }
    ]
  }
];

export interface ListenRule {
  id: string; name: string; enabled: boolean; color: string;
  mode: 'all' | 'pick' | 'filter';
  artistIds: string[];
  lisMin?: number; lisMax?: number; avgMin?: number; avgMax?: number; chartTop?: number;
  hypeMin?: number; hypeMax?: number; genre?: string; verified?: 'any' | 'yes' | 'no'; rising?: boolean;
  p: Partial<ListenParams>;
}
export interface ListenEngineState { v: 1; enabled: boolean; preset: string; base: ListenParams; rules: ListenRule[] }
const ENGINE_LS = 'musaic.listenEngine.v1';
const DEFAULT_ENGINE: ListenEngineState = { v: 1, enabled: true, preset: 'now', base: { ...DEFAULT_LISTEN }, rules: [] };
const loadEngine = (): ListenEngineState => {
  const s = lsGet<Partial<ListenEngineState>>(ENGINE_LS, {});
  return { ...DEFAULT_ENGINE, ...s, base: { ...DEFAULT_LISTEN, ...(s.base || {}) }, rules: Array.isArray(s.rules) ? s.rules : [] };
};
const engineStore = createStore<ListenEngineState>(typeof localStorage !== 'undefined' ? loadEngine() : DEFAULT_ENGINE);
let engineVersion = 1;
export const setEngine = (n: ListenEngineState) => { engineVersion++; engineCache.clear(); lsSet(ENGINE_LS, n); engineStore.set(n); };
export const useEngine = () => useStore(engineStore);

export const LISTEN_PRESETS: Array<{ id: string; name: string; emoji: string; text: string; p: Partial<ListenParams> }> = [
  { id: 'now', name: 'Как сейчас', emoji: '⚖️', text: 'Исходные формулы без изменений', p: {} },
  { id: 'real', name: 'Реализм', emoji: '🎯', text: 'Чуть меньше рандома, ровнее рост, каталог спокойнее', p: { variance: 0.8, viralChance: 0.85, growthLate: 0.9, catGrowth: 0.9, lisDrift: 0.4 } },
  { id: 'soft', name: 'Мягкий рост', emoji: '🌱', text: 'Дебюты как обычно, неделя к неделе — плавнее', p: { growthMult: 0.85, growthEarly: 0.9, sleeperMult: 0.8, lisGain: 0.9 } },
  { id: 'boom', name: 'Стриминг-бум', emoji: '💥', text: 'Все цифры немного выше: +15–25 %', p: { debutMult: 1.18, growthMult: 1.2, catGrowth: 1.1, lisGain: 1.15 } },
  { id: 'cold', name: 'Холодный рынок', emoji: '🧊', text: 'Дебюты и рост скромнее, слушатели падают быстрее', p: { debutMult: 0.88, growthMult: 0.85, lisGain: 0.85, lisLoss: 1.2 } },
  { id: 'viral', name: 'Вирусная эра', emoji: '📱', text: 'Больше взрывов и «спящих хитов», выше разброс', p: { variance: 1.3, viralChance: 1.8, sleeperMult: 1.6, chartNew: 1.12 } },
  { id: 'calm-cat', name: 'Каталог спит', emoji: '😴', text: 'Старые треки базы почти не растут', p: { catGrowth: 0.6, catOld: 0.7, catSleeper: 0.6 } },
  { id: 'nostalgia', name: 'Ностальгия', emoji: '📼', text: 'Классика каталога растёт чуть быстрее, чаще возвращения', p: { catOld: 1.35, catSleeper: 1.7, chartLong: 1.15 } },
  { id: 'fresh-face', name: 'Эра новичков', emoji: '✨', text: 'Новинки сильнее в чарте, рост слушателей выше', p: { chartNew: 1.2, growthEarly: 1.15, lisGain: 1.15, hypeGain: 1.15 } },
  { id: 'stars', name: 'Звёзды правят', emoji: '👑', text: 'Хиты дольше держатся, новинкам сложнее', p: { chartNew: 0.88, chartLong: 1.2, growthLate: 1.1 } },
  { id: 'fast-charts', name: 'Быстрые чарты', emoji: '⚡️', text: 'Резкие дебюты, быстрое выпадение', p: { chartNew: 1.25, chartLong: 0.82, growthEarly: 1.2, growthLate: 0.85 } },
  { id: 'stable', name: 'Стабильные слушатели', emoji: '🪨', text: 'Слушатели меняются медленно', p: { lisGain: 0.7, lisLoss: 0.6, lisCap: 0.7, lisDrift: 0 } },
  { id: 'volatile', name: 'Живые слушатели', emoji: '🌊', text: 'Слушатели заметно колеблются каждую неделю', p: { lisGain: 1.2, lisLoss: 1.15, lisDrift: 1.2, lisCap: 1.25 } },
  { id: 'feats', name: 'Сила фитов', emoji: '🤝', text: 'Совместные релизы заметно сильнее', p: { featMult: 1.3, lisGain: 1.05 } }
];

// --- catalog stats used for groups (filled by the simulation and by App) ---
interface ArtStat { id: string; name: string; followers: number; hype: number; genre: string; verified: boolean; rising: boolean; avg: number; best: number }
let statMap = new Map<string, ArtStat>();
let statSrc: { a?: unknown; t?: unknown } = {};
export function engineSetCatalog(artists: Artist[], tracks: Track[]) {
  if (statSrc.a === artists && statSrc.t === tracks) return;
  statSrc = { a: artists, t: tracks };
  const acc = new Map<string, { s: number; n: number; best: number }>();
  for (const t of tracks) {
    if (!t || t.isSnippet) continue;
    const x = acc.get(t.artistId) || { s: 0, n: 0, best: 999 };
    x.s += t.plays || 0; x.n++;
    const pos = t.previousChartPosition || 0;
    if (pos > 0 && pos < x.best) x.best = pos;
    acc.set(t.artistId, x);
  }
  const m = new Map<string, ArtStat>();
  for (const a of artists) {
    const x = acc.get(a.id);
    m.set(a.id, { id: a.id, name: a.name, followers: a.followers || 0, hype: a.hype ?? 50, genre: a.genre || '', verified: Boolean(a.verified), rising: Boolean(a.isRisingStar), avg: x && x.n ? x.s / x.n : 0, best: x ? x.best : 999 });
  }
  statMap = m; engineVersion++; engineCache.clear();
}
const ruleMatches = (r: ListenRule, a: ArtStat): boolean => {
  if (!r.enabled) return false;
  if (r.mode === 'all') return true;
  if (r.mode === 'pick') return r.artistIds.includes(a.id);
  if (typeof r.lisMin === 'number' && a.followers < r.lisMin) return false;
  if (typeof r.lisMax === 'number' && r.lisMax > 0 && a.followers > r.lisMax) return false;
  if (typeof r.avgMin === 'number' && a.avg < r.avgMin) return false;
  if (typeof r.avgMax === 'number' && r.avgMax > 0 && a.avg > r.avgMax) return false;
  if (typeof r.chartTop === 'number' && r.chartTop > 0 && a.best > r.chartTop) return false;
  if (typeof r.hypeMin === 'number' && a.hype < r.hypeMin) return false;
  if (typeof r.hypeMax === 'number' && r.hypeMax > 0 && a.hype > r.hypeMax) return false;
  if (r.genre && !norm(a.genre).includes(norm(r.genre))) return false;
  if (r.verified === 'yes' && !a.verified) return false;
  if (r.verified === 'no' && a.verified) return false;
  if (r.rising && !a.rising) return false;
  return true;
};
const engineCache = new Map<string, ListenParams>();
type ArtistLike = { id?: string; name?: string; followers?: number; hype?: number; genre?: string; verified?: boolean; isRisingStar?: boolean } | null | undefined;
const statOf = (a: ArtistLike): ArtStat => {
  const s = a?.id ? statMap.get(a.id) : undefined;
  return {
    id: a?.id || '', name: a?.name || s?.name || '', followers: a?.followers ?? s?.followers ?? 0, hype: a?.hype ?? s?.hype ?? 50,
    genre: a?.genre || s?.genre || '', verified: a?.verified ?? s?.verified ?? false, rising: a?.isRisingStar ?? s?.rising ?? false, avg: s?.avg || 0, best: s?.best || 999
  };
};
export function engineParamsFor(a: ArtistLike): ListenParams {
  const st = engineStore.get();
  if (!st.enabled) return DEFAULT_LISTEN;
  const key = a?.id ? `${a.id}|${a.followers || 0}|${a.hype ?? ''}` : `anon|${a?.followers || 0}`;
  const hit = engineCache.get(key);
  if (hit) return hit;
  const s = statOf(a);
  const out: ListenParams = { ...st.base };
  for (const r of st.rules) {
    if (!ruleMatches(r, s)) continue;
    (Object.keys(r.p) as PK[]).forEach(k => {
      const v = r.p[k];
      if (typeof v !== 'number' || isNaN(v)) return;
      out[k] = ADDITIVE.includes(k) ? out[k] + v : out[k] * v;
    });
  }
  if (engineCache.size > 4000) engineCache.clear();
  engineCache.set(key, out);
  return out;
}
export const engineActive = () => engineStore.get().enabled;

/** called by forecastReleasePlays (all plays generators go through it) */
export function engineDebut(raw: number, det: number, o: { artist: ArtistLike; itemType: 'track' | 'album' | 'snippet'; hasFeat: boolean; deterministic?: boolean }): number {
  const P = engineParamsFor(o.artist);
  let v = det + (raw - det) * P.variance;
  if (!o.deterministic) {
    if (P.viralChance > 1 && Math.random() < 0.05 * (P.viralChance - 1)) v *= rnd(1.6, 2.5);
    else if (P.viralChance < 1 && raw > det * 1.6 && Math.random() < 1 - P.viralChance) v = det * rnd(1.0, 1.35);
  }
  v *= P.debutMult * (o.itemType === 'album' ? P.albumMult : o.itemType === 'snippet' ? P.snippetMult : P.singleMult) * (o.hasFeat ? P.featMult : 1);
  return Math.round(Math.max(1200, v));
}
/** weekly growth of one track */
export function engineGrowth(delta: number, o: { artist: ArtistLike; ageDays: number; catalog: boolean }): number {
  const P = engineParamsFor(o.artist);
  const m = o.catalog
    ? P.catGrowth * (o.ageDays <= 120 ? P.catFresh : o.ageDays <= 365 ? P.catMid : P.catOld)
    : P.growthMult * (o.ageDays <= 14 ? P.growthEarly : o.ageDays <= 60 ? P.growthMid : P.growthLate);
  return Math.max(0, Math.round(delta * m));
}
export const engineSleeper = (a: ArtistLike, catalog: boolean) => { const P = engineParamsFor(a); return catalog ? P.catSleeper : P.sleeperMult; };
export function engineChart(artistId: string | undefined, diffDays: number): number {
  const P = engineParamsFor(artistId ? { id: artistId } : null);
  return P.chartArtist * (diffDays <= 21 ? P.chartNew : diffDays > 90 ? P.chartLong : 1);
}
export function engineListeners(pct: number, a: ArtistLike, step: number): number {
  const P = engineParamsFor(a);
  let p = pct > 0 ? pct * P.lisGain : pct * P.lisLoss;
  if (P.lisDrift > 0) p += (Math.random() * 2 - 1) * P.lisDrift * 0.0045;
  return clamp(p * step, -0.04 * P.lisCap, 0.085 * P.lisCap);
}
export const engineHype = (delta: number, a: ArtistLike) => { const P = engineParamsFor(a); return delta * (delta > 0 ? P.hypeGain : P.hypeLoss); };
/** «Рандом» plays outside the simulation */
export function engineManualPlays(formatted: string, followers?: number, isAlbum = false): string {
  const st = engineStore.get();
  if (!st.enabled) return formatted;
  const n = parseInt(String(formatted).replace(/\D/g, ''), 10) || 0;
  const P = engineParamsFor({ followers });
  const v = Math.round(n * P.manualMult * P.debutMult * (isAlbum ? P.albumMult : P.singleMult));
  return v === n ? formatted : formatNumber(v);
}

// --- monthly listeners estimator (replaces the old profile script) ---
export interface ListenerEstimate { value: number; basis: string; monthlyStreams: number; raw: number }
export function estimateMonthlyListeners(artist: { id?: string; name: string; followers?: number; verified?: boolean; hype?: number }, tracks: Track[], _albums: Album[], refIso?: string, keep = 0.45): ListenerEstimate {
  const now = refIso ? msOf(refIso) || Date.now() : Date.now();
  const nm = norm(artist.name);
  const mine = tracks.filter(t => !t.isSnippet && ((artist.id && t.artistId === artist.id) || norm(t.artistName) === nm));
  const asGuest = tracks.filter(t => !t.isSnippet && t.artistId !== artist.id && splitNames(t.featuredArtist).some(n => norm(n) === nm));
  const share = (t: Track) => {
    const age = Math.max(1, (now - (msOf(t.releaseDate) || now - 400 * DAY)) / DAY);
    // share of all-time plays that happened in the last 30 days
    return age <= 30 ? 0.55 : age <= 90 ? 0.24 : age <= 180 ? 0.12 : age <= 365 ? 0.07 : age <= 730 ? 0.035 : 0.02;
  };
  let monthly = 0;
  for (const t of mine) monthly += (t.plays || 0) * share(t);
  for (const t of asGuest) monthly += (t.plays || 0) * share(t) * 0.35;
  const top = Math.max(0, ...mine.map(t => t.plays || 0));
  // catalog-heavy artists keep listeners even when silent
  monthly = Math.max(monthly, top * 0.018);
  const perListener = 3.4 + clamp((artist.hype ?? 50) / 100, 0, 1) * 1.6; // fans of hyped artists replay more
  let est = monthly / perListener;
  if (artist.verified) est *= 1.08;
  if (!mine.length && !asGuest.length) est = artist.followers || 120_000;
  est = Math.max(8_000, est);
  const cur = artist.followers || 0;
  let value = est;
  if (cur > 0) {
    value = Math.exp((1 - keep) * Math.log(est) + keep * Math.log(cur));
    value = clamp(value, cur * 0.4, cur * 2.6);
  }
  const round = (v: number) => (v >= 1e6 ? Math.round(v / 1e4) * 1e4 : v >= 1e5 ? Math.round(v / 1e3) * 1e3 : Math.round(v / 100) * 100);
  const basis = mine.length
    ? `${mine.length} тр. · ≈ ${fmtC(monthly)} стримов за 30 дней${asGuest.length ? ` · ${asGuest.length} фит.` : ''}`
    : asGuest.length ? `Только фиты (${asGuest.length})` : 'Нет треков: оставлено текущее значение';
  return { value: round(value), basis, monthlyStreams: Math.round(monthly), raw: round(est) };
}

// ---------------------------------------------------------------------------
// 1b. LISTEN ENGINE — UI
// ---------------------------------------------------------------------------
const RULE_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee', '#fb923c'];
const uidL = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const ALL_PARAMS: ParamMeta[] = PARAM_GROUPS.flatMap(g => g.items);
const PARAM_BY_KEY = new Map(ALL_PARAMS.map(p => [p.k, p]));
const RULE_TEMPLATES: Array<{ name: string; r: Partial<ListenRule> }> = [
  { name: 'Звёзды · 8М+', r: { mode: 'filter', lisMin: 8_000_000, p: { growthLate: 1.1, lisLoss: 0.8 } } },
  { name: 'Средние · 300к–2.5М', r: { mode: 'filter', lisMin: 300_000, lisMax: 2_500_000, p: {} } },
  { name: 'Новички · до 300к', r: { mode: 'filter', lisMax: 300_000, p: { viralChance: 1.3, lisGain: 1.2 } } },
  { name: 'Топ-20 чарта', r: { mode: 'filter', chartTop: 20, p: { chartArtist: 1.08 } } },
  { name: 'Высокий хайп 75+', r: { mode: 'filter', hypeMin: 75, p: { debutMult: 1.08 } } },
  { name: 'Свои артисты', r: { mode: 'pick', p: {} } }
];
const LIS_CHIPS: Array<[string, number | undefined, number | undefined]> = [['до 300к', undefined, 300_000], ['300к–2.5М', 300_000, 2_500_000], ['2.5М–8М', 2_500_000, 8_000_000], ['8М+', 8_000_000, undefined]];
const numIn = 'w-full h-8 px-2.5 rounded-lg bg-black/40 border border-white/10 text-[12px] text-white outline-none focus:border-white/25 tabular-nums';
const parseN = (s: string): number | undefined => { const t = s.trim().toLowerCase().replace(',', '.'); if (!t) return undefined; const m = /^([\d.]+)\s*(к|k|тыс|м|m|млн)?/.exec(t); if (!m) return undefined; let v = parseFloat(m[1]); if (m[2] && /к|k|тыс/.test(m[2])) v *= 1e3; if (m[2] && /м|m|млн/.test(m[2])) v *= 1e6; return Math.round(v); };
const NumField: React.FC<{ label: string; value?: number; onChange: (v?: number) => void; ph?: string }> = ({ label, value, onChange, ph }) => {
  const [txt, setTxt] = useState(value ? fmtC(value) : '');
  useEffect(() => { setTxt(value ? fmtC(value) : ''); }, [value]);
  return (
    <label className="block min-w-0"><span className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">{label}</span>
      <input value={txt} placeholder={ph || 'любое'} onChange={e => setTxt(e.target.value)} onBlur={() => onChange(parseN(txt))} onKeyDown={e => e.key === 'Enter' && onChange(parseN(txt))} className={numIn} />
    </label>
  );
};

function curve(P: ListenParams, catalog: boolean, weeks = 16) {
  const rates = [0.085, 0.06, 0.039, 0.039, 0.021, 0.021, 0.021, 0.021, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.0046, 0.0046];
  let p = 1; const out = [1];
  for (let w = 0; w < weeks; w++) {
    const age = (catalog ? 200 : 0) + (w + 1) * 7;
    const damp = catalog ? (age <= 120 ? 0.24 : age <= 365 ? 0.16 : 0.09) : 1;
    const rate = catalog ? 0.0046 * 3 : rates[w] || 0.0046;
    let d = Math.min(p, 5.2) * rate * damp;
    d *= catalog ? P.catGrowth * (age <= 120 ? P.catFresh : age <= 365 ? P.catMid : P.catOld) : P.growthMult * (age <= 14 ? P.growthEarly : age <= 60 ? P.growthMid : P.growthLate);
    p += d; out.push(p);
  }
  return out;
}
const CurvePreview: React.FC<{ P: ListenParams; catalog?: boolean }> = ({ P, catalog = false }) => {
  const a = curve(DEFAULT_LISTEN, catalog), b = curve(P, catalog);
  const max = Math.max(...a, ...b), min = 1;
  const W = 320, H = 92;
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${(i / (arr.length - 1)) * W},${H - ((v - min) / Math.max(1e-6, max - min)) * (H - 8) - 4}`).join(' ');
  const gain = (b[b.length - 1] - 1) / Math.max(1e-6, a[a.length - 1] - 1);
  return (
    <div className="rounded-2xl bg-black/30 border border-white/[0.06] p-3">
      <div className="flex items-center justify-between text-[10.5px] text-zinc-500 mb-1.5">
        <span>{catalog ? 'Трек базы (≈ 7 месяцев), 16 недель' : 'Новый релиз, первые 16 недель'}</span>
        <span className={`font-bold ${gain >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>прирост ×{gain.toFixed(2)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[92px]">
        <path d={path(a)} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
        <motion.path d={path(b)} fill="none" stroke="var(--accent-color, #fff)" strokeWidth="2.2" strokeLinecap="round" initial={false} animate={{ d: path(b) }} transition={{ duration: 0.35 }} />
      </svg>
      <div className="flex gap-3 text-[10px] text-zinc-500"><span>┄ как сейчас</span><span className="theme-accent">— с настройками</span></div>
    </div>
  );
};

export const ListenEngineModal: React.FC<{
  artists: Artist[]; tracks: Track[]; albums: Album[]; refIso?: string; onClose: () => void;
  onApplyListeners?: (map: Record<string, number>) => void;
}> = ({ artists, tracks, albums, refIso, onClose, onApplyListeners }) => {
  useEsc(true, onClose);
  const st = useEngine();
  const [tab, setTab] = useState<string>('presets');
  const [selRule, setSelRule] = useState<string | null>(st.rules[0]?.id || null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);
  const changedCount = (Object.keys(DEFAULT_LISTEN) as PK[]).filter(k => Math.abs(st.base[k] - DEFAULT_LISTEN[k]) > 1e-6).length;
  const setBase = (k: PK, v: number) => setEngine({ ...st, preset: 'custom', base: { ...st.base, [k]: v } });
  const resetGroup = (ids: PK[]) => { const b = { ...st.base }; ids.forEach(k => { b[k] = DEFAULT_LISTEN[k]; }); setEngine({ ...st, base: b }); setToast('Раздел возвращён к исходным значениям'); };
  const resetAll = () => { setEngine({ ...DEFAULT_ENGINE, rules: st.rules.map(r => ({ ...r, enabled: false })) }); setToast('Все настройки как сейчас · группы выключены'); };
  const applyPreset = (id: string) => { const p = LISTEN_PRESETS.find(x => x.id === id); if (!p) return; setEngine({ ...st, preset: id, base: { ...DEFAULT_LISTEN, ...p.p } }); setToast(`Пресет «${p.name}»`); };
  const stats = useMemo(() => { engineSetCatalog(artists, tracks); return artists.map(a => statOf(a)); }, [artists, tracks]);
  const matchCount = (r: ListenRule) => stats.filter(s => ruleMatches({ ...r, enabled: true }, s)).length;
  const updRule = (id: string, patch: Partial<ListenRule>) => setEngine({ ...st, rules: st.rules.map(r => (r.id === id ? { ...r, ...patch } : r)) });
  const addRule = (tpl?: Partial<ListenRule>, name?: string) => {
    const r: ListenRule = { color: RULE_COLORS[st.rules.length % RULE_COLORS.length], mode: 'filter', artistIds: [], p: {}, ...(tpl || {}), id: uidL('rule'), name: name || `Группа ${st.rules.length + 1}`, enabled: true } as ListenRule;
    setEngine({ ...st, rules: [...st.rules, r] }); setSelRule(r.id); setTab('groups');
  };
  const nav: Array<[string, string, string]> = [['presets', '🎛', 'Пресеты'], ...PARAM_GROUPS.map(g => [g.id, g.icon, g.title] as [string, string, string]), ['groups', '🧩', 'Группы артистов'], ['auto', '🪄', 'Авто-слушатели']];
  const group = PARAM_GROUPS.find(g => g.id === tab);
  const rule = st.rules.find(r => r.id === selRule) || null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 md:p-6">
        <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="relative w-full max-w-5xl h-[88vh] rounded-[28px] bg-[#0e0f13]/97 border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          <div className="absolute inset-x-0 top-0 h-40 pointer-events-none opacity-[0.16]" style={{ background: 'radial-gradient(60% 100% at 20% 0%, var(--accent-color), transparent 70%)' }} />
          <div className="relative px-5 md:px-6 py-4 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-black text-white tracking-tight">Движок прослушиваний</h2>
              <p className="text-[11.5px] text-zinc-400">Дебюты, рост, каталог, чарты и слушатели · влияет на автопилот, полуавтомат, ручной батч и ручное создание</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums ${changedCount || st.rules.some(r => r.enabled) ? 'bg-white/[0.08] text-white' : 'bg-white/[0.04] text-zinc-500'}`}>
                {changedCount} изм. · {st.rules.filter(r => r.enabled).length} групп
              </span>
              <button type="button" onClick={() => setEngine({ ...st, enabled: !st.enabled })} className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-colors ${st.enabled ? 'theme-bg-accent text-black' : 'bg-white/[0.06] text-zinc-300'}`}>{st.enabled ? 'Включён' : 'Выключен'}</button>
              <button type="button" onClick={resetAll} className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300">↺ Всё как сейчас</button>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white text-lg">×</button>
            </div>
          </div>

          <div className="relative flex-1 min-h-0 flex flex-col md:flex-row">
            <nav className="md:w-52 shrink-0 p-2 md:p-3 border-b md:border-b-0 md:border-r border-white/[0.06] flex md:flex-col gap-1 overflow-x-auto custom-scrollbar">
              {nav.map(([id, ic, l]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`relative shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-left transition-colors ${tab === id ? 'text-black' : 'text-zinc-300 hover:bg-white/[0.05]'}`}>
                  {tab === id && <motion.span layoutId="le-nav" className="absolute inset-0 rounded-xl bg-white" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                  <span className="relative">{ic}</span><span className="relative whitespace-nowrap">{l}</span>
                </button>
              ))}
              <div className="hidden md:block mt-auto p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[10.5px] text-zinc-500 leading-snug">Двойной клик по ползунку — вернуть значение. ×1.00 = как сейчас.</div>
            </nav>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                  {tab === 'presets' && (
                    <div className="space-y-4">
                      <p className="text-[12px] text-zinc-400">Пресеты не уходят далеко от текущих формул: обычно ±10–35 %. После пресета можно донастроить любые ползунки.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {LISTEN_PRESETS.map(p => (
                          <motion.button key={p.id} type="button" whileHover={{ y: -2 }} onClick={() => applyPreset(p.id)}
                            className={`text-left rounded-2xl p-3.5 border transition-colors ${st.preset === p.id ? 'bg-white/[0.1] border-white/30' : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]'}`}>
                            <div className="flex items-center gap-2"><span className="text-lg">{p.emoji}</span><span className="text-[13px] font-black text-white">{p.name}</span>{st.preset === p.id && <span className="ml-auto text-[10px] font-black theme-accent">активен</span>}</div>
                            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{p.text}</div>
                            <div className="flex flex-wrap gap-1 mt-2">{(Object.keys(p.p) as PK[]).slice(0, 4).map(k => <span key={k} className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">{PARAM_BY_KEY.get(k)?.label.split(' (')[0]} {ADDITIVE.includes(k) ? `+${p.p[k]}` : `×${p.p[k]}`}</span>)}</div>
                          </motion.button>
                        ))}
                      </div>
                      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
                        <div className="text-[12px] font-bold text-white">Быстрые группы</div>
                        <div className="flex flex-wrap gap-1.5">{RULE_TEMPLATES.map(t => <button key={t.name} type="button" onClick={() => addRule(t.r, t.name)} className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-semibold text-zinc-200">+ {t.name}</button>)}</div>
                      </div>
                    </div>
                  )}

                  {group && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-[12px] text-zinc-400 max-w-xl">{group.sub}</p>
                        <button type="button" onClick={() => resetGroup(group.items.map(i => i.k))} className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-bold text-zinc-300">↺ Сбросить раздел</button>
                      </div>
                      {(group.id === 'growth' || group.id === 'catalog') && <CurvePreview P={st.base} catalog={group.id === 'catalog'} />}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                        {group.items.map(it => <MultSlider key={it.k} label={it.label} hint={it.hint} value={st.base[it.k]} def={DEFAULT_LISTEN[it.k]} min={it.min} max={it.max} unit={it.unit} onChange={v => setBase(it.k, v)} />)}
                      </div>
                      {group.id === 'listeners' && <button type="button" onClick={() => setTab('auto')} className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[12px] font-bold text-white">🪄 Автоматически определить месячных слушателей →</button>}
                    </div>
                  )}

                  {tab === 'groups' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-4">
                      <div className="space-y-1.5">
                        {st.rules.map(r => (
                          <button key={r.id} type="button" onClick={() => setSelRule(r.id)} className={`w-full text-left rounded-xl px-3 py-2 border transition-colors ${selRule === r.id ? 'bg-white/[0.09] border-white/20' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'}`}>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color, opacity: r.enabled ? 1 : 0.3 }} /><span className={`text-[12.5px] font-bold truncate ${r.enabled ? 'text-white' : 'text-zinc-500'}`}>{r.name}</span></div>
                            <div className="text-[10.5px] text-zinc-500 mt-0.5">{matchCount(r)} арт. · {Object.keys(r.p).length} парам.{r.enabled ? '' : ' · выкл.'}</div>
                          </button>
                        ))}
                        <button type="button" onClick={() => addRule()} className="w-full rounded-xl px-3 py-2 border border-dashed border-white/15 text-[12px] font-bold text-zinc-300 hover:text-white">+ Новая группа</button>
                        <div className="flex flex-wrap gap-1 pt-1">{RULE_TEMPLATES.map(t => <button key={t.name} type="button" onClick={() => addRule(t.r, t.name)} className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] text-[10px] text-zinc-400">{t.name}</button>)}</div>
                        <p className="text-[10.5px] text-zinc-500 leading-snug pt-1">Если артист попадает в несколько групп, их множители перемножаются поверх общих настроек.</p>
                      </div>
                      {rule ? <RuleEditor key={rule.id} rule={rule} artists={artists} stats={stats} count={matchCount(rule)} onChange={p => updRule(rule.id, p)}
                        onDelete={() => { setEngine({ ...st, rules: st.rules.filter(r => r.id !== rule.id) }); setSelRule(null); }}
                        onDuplicate={() => addRule({ ...rule, p: { ...rule.p }, artistIds: [...rule.artistIds] }, `${rule.name} (копия)`)} />
                        : <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-[12px] text-zinc-500">Создай группу: конкретные артисты, диапазон слушателей, прослушиваний, место в чарте, хайп или жанр. И задай для неё свои множители.</div>}
                    </div>
                  )}

                  {tab === 'auto' && <AutoListeners artists={artists} tracks={tracks} albums={albums} refIso={refIso} onApply={onApplyListeners} onToast={setToast} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-white text-black text-[12px] font-bold shadow-xl">{toast}</motion.div>}</AnimatePresence>
        </motion.div>
      </div>
    </Portal>
  );
};

const RuleEditor: React.FC<{ rule: ListenRule; artists: Artist[]; stats: ArtStat[]; count: number; onChange: (p: Partial<ListenRule>) => void; onDelete: () => void; onDuplicate: () => void }> = ({ rule, artists, stats, count, onChange, onDelete, onDuplicate }) => {
  const [q, setQ] = useState('');
  const [addKey, setAddKey] = useState<string>('');
  const list = useMemo(() => {
    const n = norm(q);
    return [...artists].filter(a => !n || norm(a.name).includes(n)).sort((a, b) => Number(rule.artistIds.includes(b.id)) - Number(rule.artistIds.includes(a.id)) || (b.followers || 0) - (a.followers || 0)).slice(0, 60);
  }, [artists, q, rule.artistIds]);
  const preview = useMemo(() => stats.filter(s => ruleMatches({ ...rule, enabled: true }, s)).sort((a, b) => b.followers - a.followers).slice(0, 12), [stats, rule]);
  const keys = Object.keys(rule.p) as PK[];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">{RULE_COLORS.map(c => <button key={c} type="button" onClick={() => onChange({ color: c })} className={`w-4 h-4 rounded-full ${rule.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e0f13]' : ''}`} style={{ background: c }} />)}</div>
        <input value={rule.name} onChange={e => onChange({ name: e.target.value })} className="flex-1 min-w-[140px] h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-[13px] font-bold text-white outline-none" />
        <button type="button" onClick={() => onChange({ enabled: !rule.enabled })} className={`px-3 h-9 rounded-xl text-[11px] font-black ${rule.enabled ? 'theme-bg-accent text-black' : 'bg-white/[0.06] text-zinc-300'}`}>{rule.enabled ? 'Включена' : 'Выключена'}</button>
        <button type="button" onClick={onDuplicate} className="px-3 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-bold text-zinc-300">Копия</button>
        <button type="button" onClick={onDelete} className="px-3 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-bold text-rose-300">Удалить</button>
      </div>
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2"><span className="text-[12px] font-bold text-white">Кто входит в группу</span><span className="text-[11px] font-bold theme-accent tabular-nums">{count} артистов</span></div>
        <Seg value={rule.mode} onChange={v => onChange({ mode: v })} options={[['all', 'Все артисты'], ['pick', 'Выбрать вручную'], ['filter', 'По условиям']]} />
        {rule.mode === 'pick' && (
          <div className="space-y-2">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск артиста…" className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-[12px] text-white outline-none" />
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto custom-scrollbar">
              {list.map(a => { const on = rule.artistIds.includes(a.id); return (
                <button key={a.id} type="button" onClick={() => onChange({ artistIds: on ? rule.artistIds.filter(x => x !== a.id) : [...rule.artistIds, a.id] })}
                  className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${on ? 'bg-white text-black' : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]'}`}>
                  <CoverArt url={a.imageUrl} title={a.name} isArtist className="w-5 h-5 rounded-full overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />{a.name}<span className="opacity-50 tabular-nums">{fmtC(a.followers || 0)}</span>
                </button>); })}
            </div>
            {rule.artistIds.length > 0 && <button type="button" onClick={() => onChange({ artistIds: [] })} className="text-[11px] text-zinc-500 hover:text-white">Снять всех ({rule.artistIds.length})</button>}
          </div>
        )}
        {rule.mode === 'filter' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">{LIS_CHIPS.map(([l, a, b]) => <button key={l} type="button" onClick={() => onChange({ lisMin: a, lisMax: b })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${rule.lisMin === a && rule.lisMax === b ? 'bg-white text-black' : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]'}`}>{l}</button>)}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <NumField label="Слушатели от" value={rule.lisMin} onChange={v => onChange({ lisMin: v })} />
              <NumField label="Слушатели до" value={rule.lisMax} onChange={v => onChange({ lisMax: v })} />
              <NumField label="Ср. прослуш. от" value={rule.avgMin} onChange={v => onChange({ avgMin: v })} />
              <NumField label="Ср. прослуш. до" value={rule.avgMax} onChange={v => onChange({ avgMax: v })} />
              <NumField label="Хайп от" value={rule.hypeMin} onChange={v => onChange({ hypeMin: v })} ph="0" />
              <NumField label="Хайп до" value={rule.hypeMax} onChange={v => onChange({ hypeMax: v })} ph="99" />
              <label className="block col-span-2"><span className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Жанр содержит</span><input value={rule.genre || ''} onChange={e => onChange({ genre: e.target.value || undefined })} placeholder="рэп, поп, рок…" className={numIn} /></label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div><div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Есть трек в чарте</div><Seg small value={String(rule.chartTop || 0)} onChange={v => onChange({ chartTop: +v || undefined })} options={[['0', 'не важно'], ['10', 'топ-10'], ['20', 'топ-20'], ['50', 'топ-50'], ['100', 'топ-100']]} /></div>
              <div><div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Галочка</div><Seg small value={rule.verified || 'any'} onChange={v => onChange({ verified: v as any })} options={[['any', 'любые'], ['yes', 'с галочкой'], ['no', 'без']]} /></div>
              <div className="w-44"><Toggle on={Boolean(rule.rising)} onChange={v => onChange({ rising: v || undefined })} label="Только восходящие" /></div>
            </div>
          </div>
        )}
        {preview.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{preview.map(s => <span key={s.id} className="text-[10.5px] px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400">{s.name} · {fmtC(s.followers)}</span>)}{count > preview.length && <span className="text-[10.5px] text-zinc-500">и ещё {count - preview.length}</span>}</div>}
      </div>
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] font-bold text-white">Параметры группы</span>
          <div className="flex items-center gap-2">
            <select value={addKey} onChange={e => { const k = e.target.value as PK; if (k) onChange({ p: { ...rule.p, [k]: ADDITIVE.includes(k) ? 0.5 : 1.15 } }); setAddKey(''); }} className="h-8 px-2 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white outline-none">
              <option value="" className="bg-zinc-950">+ Добавить параметр</option>
              {PARAM_GROUPS.map(g => <optgroup key={g.id} label={g.title} className="bg-zinc-950">{g.items.filter(i => !(i.k in rule.p)).map(i => <option key={i.k} value={i.k} className="bg-zinc-950">{i.label}</option>)}</optgroup>)}
            </select>
            {keys.length > 0 && <button type="button" onClick={() => onChange({ p: {} })} className="text-[11px] text-zinc-500 hover:text-white">↺ очистить</button>}
          </div>
        </div>
        {keys.length === 0 && <div className="text-[11.5px] text-zinc-500">Пока без параметров: группа ничего не меняет. Добавь, например, «Общий масштаб дебюта» или «Рост слушателей».</div>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
          {keys.map(k => { const m = PARAM_BY_KEY.get(k)!; const add = ADDITIVE.includes(k); return (
            <div key={k} className="relative pr-6">
              <MultSlider label={m.label} value={rule.p[k] as number} def={add ? 0 : 1} min={add ? 0 : m.min} max={m.max} unit={add ? 'raw' : 'x'} onChange={v => onChange({ p: { ...rule.p, [k]: v } })} />
              <button type="button" onClick={() => { const p = { ...rule.p }; delete p[k]; onChange({ p }); }} className="absolute right-0 top-0 text-zinc-500 hover:text-rose-400 text-sm" title="Убрать">×</button>
            </div>); })}
        </div>
      </div>
    </div>
  );
};

const LIS_BACKUP = 'musaic.engine.lisBackup';
const AutoListeners: React.FC<{ artists: Artist[]; tracks: Track[]; albums: Album[]; refIso?: string; onApply?: (m: Record<string, number>) => void; onToast: (s: string) => void }> = ({ artists, tracks, albums, refIso, onApply, onToast }) => {
  const [keep, setKeep] = useState(0.45);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [backup, setBackup] = useState<Record<string, number> | null>(() => lsGet<Record<string, number> | null>(LIS_BACKUP, null));
  const rows = useMemo(() => artists.map(a => ({ a, e: estimateMonthlyListeners(a, tracks, albums, refIso, keep) }))
    .map(x => ({ ...x, d: (x.e.value - (x.a.followers || 0)) / Math.max(1, x.a.followers || 1) }))
    .sort((x, y) => (y.a.followers || 0) - (x.a.followers || 0)), [artists, tracks, albums, refIso, keep]);
  const shown = rows.filter(r => !q || norm(r.a.name).includes(norm(q)));
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const apply = (ids: string[]) => {
    if (!onApply || !ids.length) return;
    const old: Record<string, number> = {}; const map: Record<string, number> = {};
    rows.forEach(r => { if (ids.includes(r.a.id)) { old[r.a.id] = r.a.followers || 0; map[r.a.id] = r.e.value; } });
    lsSet(LIS_BACKUP, old); setBackup(old); onApply(map); onToast(`Слушатели обновлены у ${ids.length} артистов`); setSel(new Set());
  };
  const undo = () => { if (!backup || !onApply) return; onApply(backup); lsSet(LIS_BACKUP, null); setBackup(null); onToast('Возвращены прежние слушатели'); };
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-zinc-400 max-w-2xl">Оценка по реальным данным: свежие прослушивания за ~30 дней (новые релизы весят больше), фиты, размер каталога и хайп. Ползунок «похожесть» не даёт цифрам улетать далеко от текущих.</p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <MultSlider label="Похожесть на текущие значения" hint="0 — только расчёт, 0.9 — почти без изменений" value={keep} def={0.45} min={0} max={0.9} unit="raw" onChange={setKeep} />
        <div className="flex flex-wrap gap-2">
          {!onApply && <span className="text-[11px] text-amber-300">Применение доступно из пульта симуляции и студии</span>}
          <button type="button" disabled={!onApply || !sel.size} onClick={() => apply([...sel])} className="px-3.5 h-9 rounded-xl theme-bg-accent text-black text-[12px] font-black disabled:opacity-30">Применить к выбранным · {sel.size}</button>
          <button type="button" disabled={!onApply} onClick={() => apply(rows.map(r => r.a.id))} className="px-3.5 h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-[12px] font-bold text-white disabled:opacity-30">Ко всем</button>
          {backup && <button type="button" onClick={undo} className="px-3.5 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[12px] font-bold text-amber-300">↺ Вернуть как было</button>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск…" className="flex-1 h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-[12px] text-white outline-none" />
        <button type="button" onClick={() => setSel(new Set(shown.map(r => r.a.id)))} className="px-3 h-9 rounded-xl bg-white/[0.05] text-[11px] font-bold text-zinc-300">Выбрать все</button>
        <button type="button" onClick={() => setSel(new Set())} className="px-3 h-9 rounded-xl bg-white/[0.05] text-[11px] font-bold text-zinc-300">Снять</button>
      </div>
      <div className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
        {shown.slice(0, 200).map(({ a, e, d }) => (
          <button key={a.id} type="button" onClick={() => toggle(a.id)} className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${sel.has(a.id) ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'}`}>
            <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 ${sel.has(a.id) ? 'bg-white text-black border-white' : 'border-white/20'}`}>{sel.has(a.id) ? '✓' : ''}</span>
            <CoverArt url={a.imageUrl} title={a.name} isArtist className="w-8 h-8 rounded-full overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
            <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-bold text-white truncate">{a.name}</span><span className="block text-[10.5px] text-zinc-500 truncate">{e.basis}</span></span>
            <span className="text-right shrink-0 tabular-nums"><span className="block text-[11px] text-zinc-500">{fmtC(a.followers || 0)} →</span><span className="block text-[13px] font-black text-white">{fmtC(e.value)}</span></span>
            <span className={`w-14 text-right text-[11px] font-bold tabular-nums ${Math.abs(d) < 0.03 ? 'text-zinc-500' : d > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{d > 0 ? '+' : ''}{Math.round(d * 100)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ListenEngineButton: React.FC<{ artists: Artist[]; tracks: Track[]; albums: Album[]; refIso?: string; onApplyListeners?: (m: Record<string, number>) => void; className?: string; label?: string }> = ({ className, label = 'Движок прослушиваний', ...p }) => {
  const [open, setOpen] = useState(false);
  const st = useEngine();
  const dirty = st.enabled && (st.preset !== 'now' || st.rules.some(r => r.enabled) || (Object.keys(DEFAULT_LISTEN) as PK[]).some(k => st.base[k] !== DEFAULT_LISTEN[k]));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Настройки генерации прослушиваний, роста, чартов и слушателей"
        className={className || 'px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border border-white/15 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 inline-flex items-center gap-1.5'}>
        <span className={`w-1.5 h-1.5 rounded-full ${dirty ? 'bg-emerald-400' : 'bg-zinc-500'}`} />{label}
      </button>
      <AnimatePresence>{open && <ListenEngineModal key="le" {...p} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
};


// ============================================================================
// 2. SMART DURATION — mostly 2–3 min, feats a bit longer, big feats can go over 4:00
// ============================================================================
export function smartDuration(feat?: string | number, opts: { snippet?: boolean } = {}): string {
  if (opts.snippet) { const s = Math.round(rnd(22, 48)); return `0:${String(s).padStart(2, '0')}`; }
  const n = typeof feat === 'number' ? feat : splitNames(feat).length;
  const roll = Math.random();
  // base: a gentle bell around ~2:35, sometimes short, sometimes long
  let sec = roll < 0.1 ? rnd(62, 112) : roll < 0.8 ? 150 + (Math.random() + Math.random() + Math.random() - 1.5) * 34 : rnd(178, 236);
  if (n > 0) {
    const tiny = Math.random() < 0.22; // guests with a short verse
    for (let i = 0; i < n; i++) sec += tiny ? rnd(4, 14) : rnd(12, 34) * (i === 0 ? 1 : 0.8);
  }
  const cap = n >= 3 ? 380 : n === 2 ? 290 : 245;
  sec = clamp(Math.round(sec), 60, cap);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// ============================================================================
// 3. AUTO-SAVE GUARDS
// ============================================================================
let persistAsked = false;
/** asks the browser to never evict our IndexedDB (covers live there) */
export async function requestPersistentStorage(): Promise<boolean> {
  if (persistAsked) return true;
  persistAsked = true;
  try {
    const nav: any = navigator;
    if (!nav.storage?.persist) return false;
    if (await nav.storage.persisted?.()) return true;
    return Boolean(await nav.storage.persist());
  } catch { return false; }
}
type BackupKind = 'master' | 'sim';
interface BackupMeta { slot: number; at: number; artists: number; albums: number; tracks: number; week?: number; date?: string }
const BK_META = 'musaic.autobackup.meta';
const BK_EVERY = 8 * 60 * 1000;
const BK_SLOTS = 3;
const bkKey = (k: BackupKind, slot: number) => `musaic_autobackup_${k}_${slot}`;
export const listAutoBackups = (): Record<BackupKind, BackupMeta[]> => ({ master: [], sim: [], ...lsGet<Partial<Record<BackupKind, BackupMeta[]>>>(BK_META, {}) });
const lastBackupAt: Record<BackupKind, number> = { master: 0, sim: 0 };
/** keeps the last 3 copies of the DB / simulation in IndexedDB (at most every 8 min) */
export function maybeAutoBackup(kind: BackupKind, payload: any, force = false) {
  if (!payload || !Array.isArray(payload.tracks) || payload.tracks.length === 0) return;
  const now = Date.now();
  const meta = listAutoBackups();
  const list = meta[kind] || [];
  const newest = list.reduce((m, x) => Math.max(m, x.at), lastBackupAt[kind]);
  if (!force && now - newest < BK_EVERY) return;
  lastBackupAt[kind] = now;
  const slot = list.length < BK_SLOTS ? list.length : [...list].sort((a, b) => a.at - b.at)[0].slot;
  const entry: BackupMeta = { slot, at: now, artists: payload.artists?.length || 0, albums: payload.albums?.length || 0, tracks: payload.tracks.length, week: payload.weekNumber, date: payload.currentDate };
  const run = () => dbSet(bkKey(kind, slot), payload).then(() => {
    const m = listAutoBackups();
    m[kind] = [...(m[kind] || []).filter(x => x.slot !== slot), entry].sort((a, b) => b.at - a.at);
    lsSet(BK_META, m);
  }).catch(() => { /* */ });
  const ric: any = (window as any).requestIdleCallback;
  if (ric) ric(run, { timeout: 4000 }); else setTimeout(run, 1200);
}
export const readAutoBackup = (kind: BackupKind, slot: number) => dbGet(bkKey(kind, slot));

/** writes the latest state right away when the tab is hidden / closed (no lost last edit) */
export function useFlushOnHide(getWrites: () => Array<[string, any]>) {
  const ref = useRef(getWrites);
  ref.current = getWrites;
  useEffect(() => {
    const flush = () => { try { ref.current().forEach(([k, v]) => { if (v !== undefined) dbSet(k, v).catch(() => { /* */ }); }); } catch { /* */ } };
    const vis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', vis); };
  }, []);
}

const timeAgo = (ms: number) => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? 'только что' : m < 60 ? `${m} мин назад` : m < 1440 ? `${Math.round(m / 60)} ч назад` : `${Math.round(m / 1440)} дн. назад`; };
export const AutoBackupPanel: React.FC<{ kind?: BackupKind | 'both'; onRestore: (kind: BackupKind, data: any) => void; compact?: boolean }> = ({ kind = 'both', onRestore, compact }) => {
  const [meta, setMeta] = useState(listAutoBackups);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { const t = setInterval(() => setMeta(listAutoBackups()), 30000); return () => clearInterval(t); }, []);
  const kinds: BackupKind[] = kind === 'both' ? ['master', 'sim'] : [kind];
  const rows = kinds.flatMap(k => (meta[k] || []).map(m => ({ k, m })));
  return (
    <div className={`rounded-2xl bg-white/[0.03] border border-white/[0.07] ${compact ? 'p-3' : 'p-4'} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-white">Автокопии</span>
        <span className="text-[10.5px] text-zinc-500">каждые ~8 мин · последние {BK_SLOTS}</span>
      </div>
      {rows.length === 0 && <div className="text-[11px] text-zinc-500">Пока нет: копия появится после первых изменений.</div>}
      {rows.map(({ k, m }) => (
        <div key={`${k}-${m.slot}`} className="flex items-center gap-2 text-[11.5px]">
          <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-black ${k === 'sim' ? 'bg-violet-400/15 text-violet-300' : 'bg-emerald-400/15 text-emerald-300'}`}>{k === 'sim' ? 'СИМ' : 'БАЗА'}</span>
          <span className="text-zinc-300 tabular-nums">{timeAgo(m.at)}</span>
          <span className="text-zinc-500 truncate tabular-nums">{m.artists} арт · {m.tracks} тр{m.week ? ` · нед. ${m.week}` : ''}</span>
          <button type="button" disabled={busy !== null} onClick={async () => { setBusy(`${k}${m.slot}`); const d = await readAutoBackup(k, m.slot).catch(() => null); setBusy(null); if (d) onRestore(k, d); }}
            className="ml-auto px-2 py-0.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[10.5px] font-bold text-white disabled:opacity-40">{busy === `${k}${m.slot}` ? '…' : 'Восстановить'}</button>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// 4. EXPORT HELPERS
// ============================================================================
export function downloadJson(obj: unknown, filename: string, pretty = false): number {
  const str = JSON.stringify(obj, null, pretty ? 2 : undefined);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return Math.round(str.length / 1024);
}
interface Catalog { artists: Artist[]; albums: Album[]; tracks: Track[] }
/** moves embedded data:image covers into the media store (deduplicated) and returns idb: refs */
export async function offloadInlineImages<T extends Catalog>(c: T): Promise<{ data: T; media: MediaItem[] }> {
  const made = new Map<string, MediaItem>();
  const conv = (url: string | undefined, meta: Partial<MediaItem>): string | undefined => {
    if (!url || !url.startsWith('data:image/')) return url;
    const id = `media_x_${hashStr(url.slice(0, 2000) + url.length + url.slice(-500)).toString(36)}`;
    if (!made.has(id)) made.set(id, { id, dataUrl: url, timestamp: Date.now(), ...meta } as MediaItem);
    return `idb:${id}`;
  };
  const data = {
    ...c,
    artists: c.artists.map(a => (a.imageUrl?.startsWith('data:image/') ? { ...a, imageUrl: conv(a.imageUrl, { type: 'artist', artistId: a.id, title: a.name })! } : a)),
    albums: c.albums.map(a => (a.coverUrl?.startsWith('data:image/') ? { ...a, coverUrl: conv(a.coverUrl, { type: 'album', albumId: a.id, title: a.title, artistName: a.artistName })! } : a)),
    tracks: c.tracks.map(t => (t.coverUrl?.startsWith('data:image/') ? { ...t, coverUrl: conv(t.coverUrl, { type: 'track', trackId: t.id, title: t.title, artistName: t.artistName }) } : t))
  } as T;
  const media = [...made.values()];
  if (media.length) {
    try { await dbPutMediaBatch(media); media.forEach(m => mediaCache.set(m.id, m.dataUrl)); notifyMediaUpdated(); } catch { /* */ }
  }
  return { data, media };
}
/** stores data:image urls in the media store once and returns url → idb: ref (keeps the saved simulation light and fast) */
export async function offloadDataUrls(urls: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>(); const media: MediaItem[] = [];
  for (const url of urls) {
    if (!url || !url.startsWith('data:image/') || out.has(url)) continue;
    const id = `media_x_${hashStr(url.slice(0, 2000) + url.length + url.slice(-500)).toString(36)}`;
    out.set(url, `idb:${id}`);
    media.push({ id, dataUrl: url, timestamp: Date.now() } as MediaItem);
  }
  if (media.length) { await dbPutMediaBatch(media); media.forEach(m => mediaCache.set(m.id, m.dataUrl)); notifyMediaUpdated(); }
  return out;
}
const refIds = (c: Catalog) => {
  const s = new Set<string>();
  const add = (u?: string) => { if (u && u.startsWith('idb:')) s.add(u.slice(4)); };
  c.artists.forEach(a => add(a.imageUrl)); c.albums.forEach(a => add(a.coverUrl)); c.tracks.forEach(t => add(t.coverUrl));
  return s;
};
/** media used by this catalog only (by reference or by entity id) — keeps backups small */
export async function collectUsedMedia(c: Catalog, extra: MediaItem[] = []): Promise<MediaItem[]> {
  const all = await dbGetAllMedia().catch(() => [] as MediaItem[]);
  const ids = refIds(c);
  const alb = new Set(c.albums.map(a => String(a.id))), art = new Set(c.artists.map(a => String(a.id))), trk = new Set(c.tracks.map(t => String(t.id)));
  const out = new Map<string, MediaItem>();
  for (const m of [...all, ...extra]) {
    if (ids.has(m.id) || (m.albumId && alb.has(String(m.albumId))) || (m.artistId && art.has(String(m.artistId))) || (m.trackId && trk.has(String(m.trackId)))) out.set(m.id, m);
  }
  return [...out.values()];
}
export type CatalogExportMode = 'light' | 'full' | 'media';
/** same formats as «Настройки → База данных» (lightweight_catalog / full_backup / media_pack) */
export async function exportCatalogFile(src: Catalog & { theme?: any; followedArtistIds?: string[]; label?: string }, mode: CatalogExportMode): Promise<string> {
  const day = new Date().toISOString().split('T')[0];
  const tag = src.label ? `_${src.label}` : '';
  const { data, media: fresh } = await offloadInlineImages({ artists: src.artists, albums: src.albums, tracks: src.tracks });
  if (mode === 'media') {
    const media = await collectUsedMedia(data, fresh);
    const kb = downloadJson({ version: 2, type: 'media_pack', exportedAt: new Date().toISOString(), description: 'Musaic Media Pack', mediaCount: media.length, media }, `musaic_media_pack${tag}_${day}.json`);
    return `Фото экспортированы: ${media.length} шт., ~${kb} КБ`;
  }
  const tracks = mode === 'light' ? data.tracks.map(t => (t.albumId && t.albumId !== 'single' && t.coverUrl?.startsWith('idb:') ? { ...t, coverUrl: '' } : t)) : data.tracks;
  const base = { version: 2, exportedAt: new Date().toISOString(), artists: data.artists, albums: data.albums, tracks, theme: src.theme, followedArtistIds: src.followedArtistIds || [] };
  if (mode === 'light') {
    const kb = downloadJson({ ...base, type: 'lightweight_catalog', description: 'Musaic Lightweight Catalog (Metadata without heavy embedded base64 images)', itemCounts: { artists: data.artists.length, albums: data.albums.length, tracks: tracks.length } }, `musaic_catalog_light${tag}_${day}.json`);
    return `Лёгкая база экспортирована (~${kb} КБ)`;
  }
  const media = await collectUsedMedia(data, fresh);
  const kb = downloadJson({ ...base, type: 'full_backup', description: 'Musaic Full Backup (Catalog + only the photos it uses)', itemCounts: { artists: data.artists.length, albums: data.albums.length, tracks: tracks.length, media: media.length }, media }, `musaic_full_backup${tag}_${day}.json`);
  return `Полная база экспортирована: ${media.length} фото, ~${kb} КБ`;
}
/** compact simulation snapshot (no undo stack, images deduplicated) */
export async function exportSimSnapshot(sim: SimState, withMedia: boolean): Promise<string> {
  const { undoStack: _u, ...rest } = sim;
  const { data, media: fresh } = await offloadInlineImages({ artists: sim.artists, albums: sim.albums, tracks: sim.tracks });
  const state = { ...rest, ...data, isActive: false, undoStack: [] };
  const media = withMedia ? await collectUsedMedia(data, fresh) : [];
  const kb = downloadJson({ type: 'musaic_simulation_snapshot', version: 3, exportedAt: new Date().toISOString(), state, ...(withMedia ? { media } : {}) }, `musaic_sim_${sim.currentDate}_w${sim.weekNumber}${withMedia ? '_full' : ''}.json`);
  return `Снимок симуляции сохранён (~${kb} КБ${withMedia ? `, ${media.length} фото` : ''})`;
}
/** stores media from an imported snapshot / backup */
export async function importMediaFromFile(parsed: any): Promise<number> {
  const media: MediaItem[] = Array.isArray(parsed?.media) ? parsed.media.filter((m: any) => m && m.id && m.dataUrl) : [];
  if (!media.length) return 0;
  try { await dbPutMediaBatch(media); await loadMediaCache(); } catch { /* */ }
  return media.length;
}


// ============================================================================
// 5. RELEASE STATS — opens from the plays number on album / track pages
// ============================================================================
const awardsLab = createStore<AwardItem[]>([]);
export const setLabAwards = (a: AwardItem[]) => { if (awardsLab.get() !== a) awardsLab.set(a || []); };

const AreaChart: React.FC<{ pts: number[]; labels: string[]; fmt?: (n: number) => string; h?: number; invert?: boolean; color?: string; marks?: Array<{ i: number; label: string }> }> = memo(({ pts, labels, fmt = fmtC, h = 150, invert = false, color = 'var(--accent-color, #fff)', marks = [] }) => {
  const [hover, setHover] = useState<number | null>(null);
  const gid = useMemo(() => `ac${Math.random().toString(36).slice(2, 7)}`, []);
  const W = 600;
  if (pts.length < 2) return <div className="h-24 flex items-center justify-center text-[11px] text-zinc-500">Мало данных для графика</div>;
  const valid = pts.filter(v => v > 0);
  const max = Math.max(...valid, 1), min = invert ? Math.min(...valid, max) : 0;
  const y = (v: number) => { if (v <= 0) return h - 2; const t = (v - min) / Math.max(1e-9, max - min); return invert ? 8 + t * (h - 18) : h - 4 - t * (h - 14); };
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}
        onMouseMove={e => { const b = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); setHover(clamp(Math.round(((e.clientX - b.left) / b.width) * (pts.length - 1)), 0, pts.length - 1)); }}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {!invert && <path d={`${line} L${W},${h} L0,${h} Z`} fill={`url(#${gid})`} />}
        <motion.path d={line} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
        {marks.map(m => <line key={m.i} x1={x(m.i)} x2={x(m.i)} y1={0} y2={h} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke="rgba(255,255,255,0.35)" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hover !== null && (
        <div className="absolute top-1 pointer-events-none px-2 py-1 rounded-lg bg-black/80 border border-white/10 text-[10.5px] text-white tabular-nums whitespace-nowrap" style={{ left: `${(hover / (pts.length - 1)) * 100}%`, transform: `translateX(${hover > pts.length * 0.6 ? '-105%' : '5%'})` }}>
          <span className="text-zinc-400">{labels[hover]}</span> · <b>{pts[hover] > 0 ? (invert ? `#${pts[hover]}` : fmt(pts[hover])) : 'вне чарта'}</b>
        </div>
      )}
      <div className="flex justify-between text-[9.5px] text-zinc-600 mt-1"><span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]}</span></div>
    </div>
  );
});

const Kpi: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }> = ({ label, value, sub, accent }) => (
  <div className={`rounded-2xl p-3 border ${accent ? 'bg-white/[0.07] border-white/15' : 'bg-white/[0.03] border-white/[0.06]'}`}>
    <div className="text-[9.5px] uppercase tracking-widest text-zinc-500 font-bold">{label}</div>
    <div className="text-[17px] font-black text-white tabular-nums mt-0.5 leading-tight">{value}</div>
    {sub && <div className="text-[10.5px] text-zinc-500 mt-0.5 leading-snug">{sub}</div>}
  </div>
);

const lifeCurve = (t: number, tau: number) => (t <= 0 ? 0 : 0.8 * (1 - Math.exp(-t / tau)) + 0.2 * Math.min(1, t / 1460));
export interface ReleaseStatsProps {
  kind: 'track' | 'album'; track?: Track | null; album?: Album | null;
  tracks: Track[]; albums: Album[]; artists: Artist[]; refIso?: string;
  navigateTo?: (v: any, p?: any) => void; onClose: () => void;
}
export const ReleaseStatsModal: React.FC<ReleaseStatsProps> = ({ kind, track, album, tracks, albums, artists, refIso, navigateTo, onClose }) => {
  useEsc(true, onClose);
  const awards = useStore(awardsLab);
  const [mode, setMode] = useState<'total' | 'week'>('total');
  const it: any = kind === 'album' ? album : track;
  const data = useMemo(() => {
    if (!it) return null;
    const now = refIso ? msOf(refIso) || Date.now() : Date.now();
    const relIso = it.releaseDate || (it.releaseYear ? `${it.releaseYear}-01-01` : '');
    const rel = msOf(relIso);
    const age = isNaN(rel) ? 365 : Math.round((now - rel) / DAY);
    const albumTracks: Track[] = kind === 'album' ? tracks.filter(t => t.albumId === it.id && !t.isSnippet) : [];
    const plays: number = kind === 'album' ? (albumTracks.reduce((s, t) => s + (t.plays || 0), 0) || it.totalPlays || 0) : it.plays || 0;
    const tau = kind === 'album' ? 55 : it.isSnippet ? 20 : 38;
    const N = 26;
    const span = Math.max(7, age);
    const total: number[] = []; const labels: string[] = [];
    for (let i = 0; i < N; i++) { const t = (span * (i + 1)) / N; total.push(Math.round(plays * lifeCurve(t, tau) / Math.max(1e-9, lifeCurve(span, tau)))); labels.push(fmtDate(isoDay(rel + t * DAY)).slice(0, 5) + (span > 330 ? `.${isoDay(rel + t * DAY).slice(2, 4)}` : '')); }
    const weekly = total.map((v, i) => Math.max(0, v - (i ? total[i - 1] : 0)));
    const artist = artists.find(a => a.id === it.artistId) || artists.find(a => norm(a.name) === norm(it.artistName));
    const same = kind === 'album'
      ? albums.filter(a => a.artistId === it.artistId || norm(a.artistName) === norm(it.artistName)).map(a => ({ id: a.id, p: a.totalPlays || tracks.filter(t => t.albumId === a.id).reduce((s, t) => s + (t.plays || 0), 0) }))
      : tracks.filter(t => !t.isSnippet && (t.artistId === it.artistId || norm(t.artistName) === norm(it.artistName))).map(t => ({ id: t.id, p: t.plays || 0 }));
    same.sort((a, b) => b.p - a.p);
    const rank = same.findIndex(x => x.id === it.id) + 1;
    const avg = same.length ? same.reduce((s, x) => s + x.p, 0) / same.length : 0;
    const artistTotal = tracks.filter(t => !t.isSnippet && (t.artistId === it.artistId || norm(t.artistName) === norm(it.artistName))).reduce((s, t) => s + (t.plays || 0), 0);
    const hist: number[] = Array.isArray(it.chartHistory) ? it.chartHistory.slice(-30) : [];
    const won = awards.filter(a => norm(a.winner?.title) === norm(it.title) && (!a.winner?.artistName || norm(a.winner.artistName).includes(norm(it.artistName)) || norm(it.artistName).includes(norm(a.winner.artistName))));
    const nominated = awards.filter(a => !won.includes(a) && (a.nominees || []).some(n => norm(n.title) === norm(it.title)));
    const hype = typeof it.releaseHype === 'number' ? it.releaseHype : artist?.hype;
    const promo = it.promoStrategy ? (RELEASE_PROMO_LABELS as any)[it.promoStrategy] : null;
    const likes = kind === 'track' ? it.likes || 0 : albumTracks.reduce((s, t) => s + (t.likes || 0), 0);
    const likeRate = plays ? likes / plays : 0;
    const perf = avg ? plays / avg : 1;
    const score = it.rating?.totalScore ? Math.round((it.rating.totalScore / 90) * 100) : null;
    const mood = perf >= 1.8 ? ['🔥', 'Слушатели в восторге', 'Релиз заметно сильнее обычного уровня артиста'] : perf >= 1.15 ? ['💚', 'Тёплый приём', 'Чуть выше средних цифр артиста'] : perf >= 0.75 ? ['🙂', 'Ровно', 'В пределах обычного для артиста'] : ['🥶', 'Прохладно', 'Ниже привычных цифр артиста'];
    return { age, rel, relIso, plays, total, weekly, labels, artist, rank, sameN: same.length, avg, artistTotal, hist, won, nominated, hype, promo, likes, likeRate, perf, score, mood, albumTracks };
  }, [it, kind, tracks, albums, artists, awards, refIso]);
  if (!it || !data) return null;
  const d = data;
  const peak = it.peakChartPosition || (d.hist.filter(x => x > 0).length ? Math.min(...d.hist.filter(x => x > 0)) : undefined);
  const now = it.previousChartPosition;
  const typeLabel = kind === 'album' ? (d.albumTracks.length > 0 && d.albumTracks.length <= 7 ? 'EP' : 'Альбом') : it.isSnippet ? 'Сниппет' : it.albumId && it.albumId !== 'single' ? 'Трек альбома' : 'Сингл';
  const go = (v: string, p: any) => { if (navigateTo) { onClose(); navigateTo(v, p); } };
  return (
    <Portal>
      <div className="fixed inset-0 z-[620] flex items-center justify-center p-3 md:p-6">
        <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ type: 'spring', stiffness: 330, damping: 32 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[28px] bg-[#0e0f13]/97 border border-white/10 shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-56 overflow-hidden pointer-events-none">
            {resolveMedia(it.coverUrl, { id: it.id, title: it.title, artistName: it.artistName }) && <img src={resolveMedia(it.coverUrl, { id: it.id, title: it.title, artistName: it.artistName })} alt="" className="w-full h-full object-cover blur-[70px] scale-125 opacity-40" />}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0e0f13]" />
          </div>
          <div className="relative p-5 md:p-7 space-y-5">
            <div className="flex items-start gap-4">
              <CoverArt url={it.coverUrl} title={it.title} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-2xl shrink-0" innerClassName="w-full h-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Статистика · {typeLabel}</div>
                <h2 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight truncate">{it.title}</h2>
                <button type="button" onClick={() => d.artist && go('artist', { id: d.artist.id, artistName: d.artist.name })} className="text-[13px] font-bold text-zinc-300 hover:text-white hover:underline">{it.artistName}{it.featuredArtist ? ` feat. ${it.featuredArtist}` : it.coArtist ? ` & ${it.coArtist}` : ''}</button>
                <div className="flex flex-wrap gap-1.5 mt-2 text-[10.5px]">
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.07] text-zinc-200">{fmtDate(d.relIso)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.07] text-zinc-200">{d.age < 0 ? `выйдет через ${-d.age} дн.` : d.age === 0 ? 'вышел сегодня' : `${d.age} дн. с выхода`}</span>
                  {it.genre && <span className="px-2 py-0.5 rounded-full bg-white/[0.07] text-zinc-200">{it.genre}</span>}
                  {d.promo && <span className="px-2 py-0.5 rounded-full bg-violet-400/15 text-violet-200">{d.promo.icon || '📣'} {d.promo.shortLabel || d.promo.label}</span>}
                  {it.simGenerated && <span className="px-2 py-0.5 rounded-full bg-sky-400/15 text-sky-200">симуляция</span>}
                </div>
              </div>
              <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-black/30 hover:bg-white/10 text-zinc-300 hover:text-white text-lg shrink-0">×</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Kpi accent label="Прослушивания" value={fmtC(d.plays)} sub={d.plays.toLocaleString('ru-RU')} />
              <Kpi label="В чарте" value={now ? `#${now}` : '—'} sub={peak ? `пик #${peak}${it.weeksOnChart ? ` · ${it.weeksOnChart} нед.` : ''}` : 'не попадал'} />
              <Kpi label="Хайп релиза" value={typeof d.hype === 'number' ? Math.round(d.hype) : '—'} sub={typeof d.hype === 'number' ? (d.hype >= 80 ? 'очень горячо' : d.hype >= 60 ? 'обсуждают' : d.hype >= 40 ? 'спокойно' : 'тихо') : ''} />
              <Kpi label="Оценка" value={d.score !== null ? d.score : '—'} sub={it.rating?.totalScore ? `${it.rating.totalScore}/90` : 'без оценки'} />
              <Kpi label={kind === 'album' ? 'Лайки треков' : 'Лайки'} value={fmtC(d.likes)} sub={d.plays ? `${(d.likeRate * 100).toFixed(1)}% от прослушиваний` : ''} />
              <Kpi label="Место у артиста" value={d.rank ? `${d.rank} из ${d.sameN}` : '—'} sub={d.avg ? `${d.perf >= 1 ? '+' : ''}${Math.round((d.perf - 1) * 100)}% к среднему` : ''} />
              <Kpi label="Доля каталога" value={d.artistTotal ? `${Math.min(100, (d.plays / d.artistTotal) * 100).toFixed(1)}%` : '—'} sub={d.artist ? `${fmtC(d.artist.followers || 0)} слушателей` : ''} />
              <Kpi label="Реакция" value={<span>{d.mood[0]} <span className="text-[13px]">{d.mood[1]}</span></span>} sub={d.mood[2]} />
            </div>

            <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-2">
                <div><div className="text-[13px] font-black text-white">Прослушивания со временем</div><div className="text-[10.5px] text-zinc-500">Модель набора: быстрый старт и долгий хвост</div></div>
                <Seg small value={mode} onChange={setMode} options={[['total', 'Всего'], ['week', 'За период']]} />
              </div>
              {d.age <= 0 ? <div className="h-24 flex items-center justify-center text-[12px] text-zinc-500">Релиз ещё не вышел</div> : <AreaChart pts={mode === 'total' ? d.total : d.weekly} labels={d.labels} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="text-[13px] font-black text-white mb-2">История в чарте</div>
                {d.hist.some(x => x > 0) ? <AreaChart invert h={120} pts={d.hist} labels={d.hist.map((_, i) => `нед. ${i + 1}`)} color="#fbbf24" /> : <div className="text-[11.5px] text-zinc-500 py-6 text-center">{peak ? `Пик #${peak}. Подробной истории нет.` : 'В чарт пока не попадал.'}</div>}
              </div>
              <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
                <div className="text-[13px] font-black text-white">Номинации и награды</div>
                {d.won.length === 0 && d.nominated.length === 0 && !(it.rating?.nominations || []).length && <div className="text-[11.5px] text-zinc-500 py-4">Пока без наград и номинаций.</div>}
                {d.won.map(a => <div key={a.id} className="flex items-center gap-2 text-[12px]"><span>🏆</span><span className="text-amber-200 font-bold">{a.nominationTitle}</span><span className="text-zinc-500">{a.periodType === 'year' ? a.year : `${a.month}.${a.year}`}</span></div>)}
                {d.nominated.map(a => <div key={a.id} className="flex items-center gap-2 text-[12px]"><span>🎖</span><span className="text-zinc-200">{a.nominationTitle}</span><span className="text-zinc-500">номинация</span></div>)}
                {(it.rating?.nominations || []).length > 0 && <div className="flex flex-wrap gap-1 pt-1">{it.rating.nominations.map((n: string) => <span key={n} className="text-[10.5px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-200">{n}</span>)}</div>}
                {it.rating && <div className="grid grid-cols-5 gap-1 pt-2">{(['rhymes', 'structure', 'style', 'charisma', 'vibe'] as const).map(k => (
                  <div key={k} className="text-center"><div className="h-12 rounded-lg bg-white/[0.04] relative overflow-hidden"><motion.div className="absolute bottom-0 inset-x-0 theme-bg-accent opacity-70" initial={{ height: 0 }} animate={{ height: `${((it.rating[k] || 0) / 10) * 100}%` }} transition={{ duration: 0.6 }} /></div><div className="text-[9px] text-zinc-500 mt-1">{({ rhymes: 'рифмы', structure: 'структ.', style: 'стиль', charisma: 'харизма', vibe: 'вайб' } as any)[k]}</div></div>))}</div>}
              </div>
            </div>

            {kind === 'album' && d.albumTracks.length > 0 && (
              <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="text-[13px] font-black text-white mb-2">Треки альбома</div>
                <div className="space-y-1">
                  {[...d.albumTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).map((t, i, arr) => (
                    <button key={t.id} type="button" onClick={() => go('track', { id: t.id })} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] text-left">
                      <span className="w-5 text-[11px] text-zinc-500 tabular-nums">{i + 1}</span>
                      <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-bold text-white truncate">{t.title}{t.featuredArtist ? <span className="text-zinc-500 font-medium"> feat. {t.featuredArtist}</span> : null}</span>
                        <span className="block h-1 mt-1 rounded-full bg-white/[0.05] overflow-hidden"><motion.span className="block h-full rounded-full theme-bg-accent" initial={{ width: 0 }} animate={{ width: `${((t.plays || 0) / Math.max(1, arr[0].plays || 1)) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.02 }} /></span></span>
                      <span className="text-[11px] text-zinc-400 tabular-nums w-16 text-right">{fmtC(t.plays || 0)}</span>
                      <span className="text-[10px] text-zinc-600 tabular-nums w-10 text-right">{d.plays ? `${(((t.plays || 0) / d.plays) * 100).toFixed(0)}%` : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Portal>
  );
};

/** wraps the plays number: click → stats */
export const PlaysStatButton: React.FC<Omit<ReleaseStatsProps, 'onClose'> & { children: React.ReactNode; className?: string }> = ({ children, className = '', ...p }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(true); }} title="Статистика релиза"
        className={`inline-flex items-center gap-1 rounded-md hover:underline decoration-dotted underline-offset-4 cursor-pointer ${className}`}>
        {children}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="opacity-60"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
      </button>
      <AnimatePresence>{open && <ReleaseStatsModal key="rs" {...p} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
};


// ============================================================================
// 6. RELEASE HEADER SETTINGS (album page) — small button next to «Атмосфера»
// ============================================================================
export interface RelHero {
  layout: 'original' | 'big' | 'center' | 'poster' | 'split' | 'compact';
  coverSize: number; coverRadius: number; coverShadow: 'soft' | 'deep' | 'glow' | 'none'; coverFrame: 'none' | 'border' | 'vinyl' | 'polaroid';
  bg: 'cover' | 'palette' | 'solid' | 'custom' | 'none'; c1: string; c2: string; bgBlur: number; bgDim: number;
  height: 's' | 'm' | 'l' | 'xl'; titleSize: number; titleCase: 'as' | 'upper' | 'lower'; titleFont: string; titleTracking: number;
  artist: 'link' | 'chip' | 'big' | 'hidden'; align: 'left' | 'center'; grain: boolean; tilt: boolean;
}
export const DEFAULT_REL_HERO: RelHero = {
  layout: 'original', coverSize: 320, coverRadius: 18, coverShadow: 'deep', coverFrame: 'none', bg: 'cover', c1: '#1e1b4b', c2: '#0a0a0f', bgBlur: 80, bgDim: 0.35,
  height: 'm', titleSize: 84, titleCase: 'as', titleFont: '', titleTracking: -0.035, artist: 'chip', align: 'left', grain: false, tilt: true
};
const REL_PRESETS: Array<{ name: string; s: Partial<RelHero> }> = [
  { name: 'Как было', s: { layout: 'original' } },
  { name: 'Большая обложка', s: { layout: 'big', coverSize: 360, coverShadow: 'deep', bg: 'cover', artist: 'chip', height: 'l' } },
  { name: 'По центру', s: { layout: 'center', coverSize: 300, align: 'center', artist: 'big', bg: 'palette' } },
  { name: 'Постер', s: { layout: 'poster', height: 'xl', bgDim: 0.3, artist: 'big', titleSize: 110 } },
  { name: 'Журнал', s: { layout: 'split', coverSize: 380, coverShadow: 'soft', titleCase: 'upper', titleTracking: -0.02, bg: 'solid' } },
  { name: 'Компакт', s: { layout: 'compact', coverSize: 180, height: 's', titleSize: 56, artist: 'link' } },
  { name: 'Винил', s: { layout: 'big', coverFrame: 'vinyl', coverRadius: 6, coverSize: 320 } },
  { name: 'Полароид', s: { layout: 'center', coverFrame: 'polaroid', coverRadius: 4, bgBlur: 110, bgDim: 0.55, align: 'center' } },
  { name: 'Неон', s: { layout: 'big', bg: 'custom', c1: '#3b0764', c2: '#020617', coverShadow: 'glow', grain: true } }
];
const RH_ALL = 'musaic.relhero.__all';
const RH_KEY = (id: string) => `musaic.relhero.${id}`;
const rhStore = createStore(0);
const bumpRh = () => rhStore.set(rhStore.get() + 1);
export function useReleaseHero(id: string) {
  const v = useStore(rhStore);
  const own = useMemo(() => lsGet<Partial<RelHero> | null>(RH_KEY(id), null), [id, v]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = useMemo(() => lsGet<Partial<RelHero> | null>(RH_ALL, null), [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const s: RelHero = { ...DEFAULT_REL_HERO, ...(all || {}), ...(own || {}) };
  const scope: 'all' | 'release' = own ? 'release' : 'all';
  const update = (p: Partial<RelHero>) => { if (scope === 'release') lsSet(RH_KEY(id), { ...s, ...p }); else lsSet(RH_ALL, { ...s, ...p }); bumpRh(); };
  const setScope = (sc: 'all' | 'release') => { if (sc === 'release') lsSet(RH_KEY(id), s); else { try { localStorage.removeItem(RH_KEY(id)); } catch { /* */ } } bumpRh(); };
  const reset = () => { try { localStorage.removeItem(scope === 'release' ? RH_KEY(id) : RH_ALL); } catch { /* */ } bumpRh(); };
  return { s, scope, update, setScope, reset };
}
export const openReleaseHeroSettings = (id: string) => window.dispatchEvent(new CustomEvent('musaic-relhero', { detail: id }));
const HERO_H = { s: 300, m: 400, l: 500, xl: 620 };
const TITLE_FONTS = ["'Unbounded', sans-serif", "'Dela Gothic One', sans-serif", "'Playfair Display', serif", "'Prata', serif", "'Oswald', sans-serif", "'Sofia Sans Extra Condensed', sans-serif", "'Russo One', sans-serif", "'Inter Tight', sans-serif", "'Tenor Sans', sans-serif", "'Montserrat Alternates', sans-serif"];

export const ReleaseHeroHeader: React.FC<{
  id: string; cover?: string; title: string; kindLabel: string; artistName: string; artist?: Artist | null;
  palette?: string[]; artistLine?: React.ReactNode; meta?: React.ReactNode; badges?: React.ReactNode;
  onZoom?: () => void; onArtist?: () => void; legacy: React.ReactNode;
}> = ({ id, cover, title, kindLabel, artistName, artist, palette, artistLine, meta, badges, onZoom, onArtist, legacy }) => {
  const { s, scope, update, setScope, reset } = useReleaseHero(id);
  const [panel, setPanel] = useState(false);
  useEffect(() => { const f = (e: Event) => { const d = (e as CustomEvent).detail; if (!d || d === id) setPanel(true); }; window.addEventListener('musaic-relhero', f); return () => window.removeEventListener('musaic-relhero', f); }, [id]);
  const drawer = <AnimatePresence>{panel && <RelHeroDrawer key="rhd" s={s} scope={scope} setScope={setScope} update={update} reset={reset} onClose={() => setPanel(false)} />}</AnimatePresence>;
  if (s.layout === 'original') return <>{legacy}<Portal>{drawer}</Portal></>;
  const c0 = palette?.[0] || '#3f3f46', c1 = palette?.[1] || '#18181b';
  const src = resolveMedia(cover, { id, title, artistName });
  const center = s.align === 'center' || s.layout === 'center';
  const shownTitle = s.titleCase === 'upper' ? title.toUpperCase() : s.titleCase === 'lower' ? title.toLowerCase() : title;
  const shadow = s.coverShadow === 'none' ? 'none' : s.coverShadow === 'soft' ? '0 18px 50px -12px rgba(0,0,0,0.6)' : s.coverShadow === 'glow' ? `0 30px 90px -10px ${c0}, 0 0 0 1px rgba(255,255,255,0.08)` : '0 30px 80px -18px rgba(0,0,0,0.9)';
  const size = s.layout === 'compact' ? Math.min(s.coverSize, 220) : s.coverSize;
  const coverEl = (
    <motion.div layout whileHover={s.tilt ? { rotate: -1.2, scale: 1.015 } : undefined} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`relative shrink-0 ${s.coverFrame === 'polaroid' ? 'p-3 pb-10 bg-[#f4f2ee]' : s.coverFrame === 'border' ? 'p-1.5 bg-white/10 border border-white/20 backdrop-blur-md' : ''}`}
      style={{ width: `min(${size}px, 72vw)`, borderRadius: s.coverFrame === 'polaroid' ? 6 : s.coverRadius + (s.coverFrame === 'border' ? 6 : 0), boxShadow: shadow }}>
      {s.coverFrame === 'vinyl' && <div aria-hidden className="absolute top-[4%] h-[92%] aspect-square rounded-full left-[34%] -z-0" style={{ background: `radial-gradient(circle, ${c0} 0 15%, #111 15.5% 17%, #0a0a0a 17.5% 100%)`, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} />}
      <CoverArt url={cover} title={title} onZoom={onZoom} className="relative w-full aspect-square overflow-hidden bg-zinc-800" innerClassName="w-full h-full object-cover" />
    </motion.div>
  );
  const artistEl = s.artist === 'hidden' ? null : s.artist === 'link' ? (
    <div className="text-[14px] text-zinc-200"><span onClick={onArtist} className="font-bold text-white hover:underline cursor-pointer">{artistName}</span>{artistLine}</div>
  ) : (
    <div className={`flex items-center gap-2.5 ${center ? 'justify-center' : ''}`}>
      <span onClick={onArtist} className={`inline-flex items-center gap-2 cursor-pointer rounded-full bg-black/25 hover:bg-black/40 border border-white/10 backdrop-blur-md transition-colors ${s.artist === 'big' ? 'pl-1 pr-4 py-1' : 'pl-0.5 pr-3 py-0.5'}`}>
        <CoverArt url={artist?.imageUrl} title={artistName} isArtist className={`${s.artist === 'big' ? 'w-10 h-10' : 'w-7 h-7'} rounded-full overflow-hidden`} innerClassName="w-full h-full object-cover" />
        <span className={`${s.artist === 'big' ? 'text-[16px]' : 'text-[13px]'} font-black text-white`}>{artistName}</span>
        {artist?.verified && <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-[8px] text-black font-black flex items-center justify-center">✓</span>}
      </span>
      {artistLine && <span className="text-[13px] text-zinc-300">{artistLine}</span>}
    </div>
  );
  const info = (
    <div className={`relative z-10 min-w-0 flex-1 flex flex-col gap-3 ${center ? 'items-center text-center' : 'items-start text-left'}`}>
      <span className="text-[11px] font-bold text-white/80 uppercase tracking-[0.2em]">{kindLabel}</span>
      <h1 className="font-black text-white break-words drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)]"
        style={{ fontFamily: s.titleFont || undefined, fontSize: `clamp(30px, 6vw, ${s.layout === 'compact' ? Math.min(s.titleSize, 64) : s.titleSize}px)`, letterSpacing: `${s.titleTracking}em`, lineHeight: 1 }}>{shownTitle}</h1>
      {badges && <div className="flex items-center gap-3">{badges}</div>}
      {artistEl}
      {meta && <div className={`flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm text-zinc-300 ${center ? 'justify-center' : ''}`}>{meta}</div>}
    </div>
  );
  let bg: React.ReactNode = null;
  if (s.layout === 'poster' && src) bg = <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />;
  else if (s.bg === 'cover' && src) bg = <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover scale-125" style={{ filter: `blur(${s.bgBlur}px) saturate(1.15)` }} />;
  else if (s.bg === 'palette' || (s.bg === 'cover' && !src)) bg = <div className="absolute inset-0" style={{ background: `radial-gradient(90% 120% at 15% 10%, ${c0}aa 0%, transparent 60%), radial-gradient(80% 100% at 85% 30%, ${c1}88 0%, transparent 65%)` }} />;
  else if (s.bg === 'solid') bg = <div className="absolute inset-0" style={{ background: `${c0}40` }} />;
  else if (s.bg === 'custom') bg = <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${s.c1}, ${s.c2})` }} />;
  let body: React.ReactNode;
  if (s.layout === 'center') body = <div className="flex flex-col items-center gap-7">{coverEl}{info}</div>;
  else if (s.layout === 'poster') body = <div className="flex items-end h-full">{info}</div>;
  else if (s.layout === 'split') body = <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-8 items-end">{info}<div className="flex justify-center md:justify-end">{coverEl}</div></div>;
  else body = <div className={`flex flex-col sm:flex-row ${center ? 'items-center' : 'items-center sm:items-end'} gap-6 md:gap-9`}>{coverEl}{info}</div>;
  return (
    <section className="relative overflow-hidden flex flex-col justify-end" style={{ minHeight: `min(${HERO_H[s.height]}px, 90vh)` }}>
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence mode="wait"><motion.div key={`${s.layout}-${s.bg}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{bg}</motion.div></AnimatePresence>
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${s.layout === 'poster' ? Math.max(0.15, s.bgDim) : s.bgDim})` }} />
        {s.grain && <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--bg-color,#09090b)] via-[var(--bg-color,#09090b)]/40 to-transparent" />
      </div>
      <motion.div layout className="relative w-full max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-8 md:pb-10">{body}</motion.div>
      <Portal>{drawer}</Portal>
    </section>
  );
};

const RRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <div className="space-y-1.5"><div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</div>{children}</div>;
const RRange: React.FC<{ value: number; min: number; max: number; step?: number; onChange: (v: number) => void }> = ({ value, min, max, step = 1, onChange }) => <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-white" />;
const RelHeroDrawer: React.FC<{ s: RelHero; scope: 'all' | 'release'; setScope: (v: 'all' | 'release') => void; update: (p: Partial<RelHero>) => void; reset: () => void; onClose: () => void }> = ({ s, scope, setScope, update, reset, onClose }) => {
  const [tab, setTab] = useState<'look' | 'cover' | 'bg' | 'text'>('look');
  useEsc(true, onClose);
  return (
    <div className="fixed inset-0 z-[560]">
      <motion.div className="absolute inset-0 bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="absolute top-0 right-0 h-full w-[360px] max-w-[92vw] bg-[#0f1014]/97 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between"><span className="text-base font-black text-white">Шапка релиза</span>
            <div className="flex gap-3"><button type="button" onClick={reset} className="text-[11px] text-zinc-500 hover:text-white">Сбросить</button><button type="button" onClick={onClose} className="text-[11px] font-bold text-white">Готово</button></div></div>
          <Seg value={scope} onChange={setScope} options={[['all', 'Для всех релизов'], ['release', 'Только этот']]} />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-1.5">{REL_PRESETS.map(p => <button key={p.name} type="button" onClick={() => update(p.name === 'Как было' ? { layout: 'original' } : { ...DEFAULT_REL_HERO, ...p.s })} className={`py-2 rounded-xl border text-[10.5px] font-bold ${(p.s.layout === s.layout && p.name === 'Как было') ? 'bg-white text-black border-white' : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.06] text-zinc-300'}`}>{p.name}</button>)}</div>
          <Seg value={tab} onChange={setTab} options={[['look', 'Макет'], ['cover', 'Обложка'], ['bg', 'Фон'], ['text', 'Текст']]} />
          {tab === 'look' && <div className="space-y-3">
            <RRow label="Макет"><Seg value={s.layout} onChange={v => update({ layout: v })} options={[['original', 'Как было'], ['big', 'Большая'], ['center', 'Центр'], ['poster', 'Постер'], ['split', 'Журнал'], ['compact', 'Компакт']]} /></RRow>
            <RRow label="Высота"><Seg value={s.height} onChange={v => update({ height: v })} options={[['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']]} /></RRow>
            <RRow label="Артист"><Seg value={s.artist} onChange={v => update({ artist: v })} options={[['chip', 'С фото'], ['big', 'Крупно'], ['link', 'Ссылкой'], ['hidden', 'Скрыть']]} /></RRow>
            <RRow label="Выравнивание"><Seg value={s.align} onChange={v => update({ align: v })} options={[['left', 'Слева'], ['center', 'По центру']]} /></RRow>
            {s.layout === 'original' && <p className="text-[11px] text-zinc-500">«Как было» — исходная шапка. Выбери другой макет, чтобы включить настройки.</p>}
          </div>}
          {tab === 'cover' && <div className="space-y-3">
            <RRow label={`Размер · ${s.coverSize}px`}><RRange value={s.coverSize} min={160} max={460} onChange={v => update({ coverSize: v })} /></RRow>
            <RRow label={`Скругление · ${s.coverRadius}px`}><RRange value={s.coverRadius} min={0} max={48} onChange={v => update({ coverRadius: v })} /></RRow>
            <RRow label="Тень"><Seg value={s.coverShadow} onChange={v => update({ coverShadow: v })} options={[['soft', 'Мягкая'], ['deep', 'Глубокая'], ['glow', 'Свечение'], ['none', 'Нет']]} /></RRow>
            <RRow label="Рамка"><Seg value={s.coverFrame} onChange={v => update({ coverFrame: v })} options={[['none', 'Нет'], ['border', 'Стекло'], ['vinyl', 'Винил'], ['polaroid', 'Полароид']]} /></RRow>
            <Toggle on={s.tilt} onChange={v => update({ tilt: v })} label="Живая обложка" hint="Лёгкий наклон при наведении" />
          </div>}
          {tab === 'bg' && <div className="space-y-3">
            <RRow label="Фон"><Seg value={s.bg} onChange={v => update({ bg: v })} options={[['cover', 'Размытая обложка'], ['palette', 'Цвета обложки'], ['solid', 'Ровный'], ['custom', 'Свои цвета'], ['none', 'Нет']]} /></RRow>
            {s.bg === 'custom' && <div className="flex items-center gap-3"><input type="color" value={s.c1} onChange={e => update({ c1: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent" /><input type="color" value={s.c2} onChange={e => update({ c2: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent" /><div className="flex-1 h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${s.c1}, ${s.c2})` }} /></div>}
            <RRow label={`Размытие · ${s.bgBlur}px`}><RRange value={s.bgBlur} min={0} max={140} onChange={v => update({ bgBlur: v })} /></RRow>
            <RRow label={`Затемнение · ${Math.round(s.bgDim * 100)}%`}><RRange value={s.bgDim} min={0} max={0.9} step={0.01} onChange={v => update({ bgDim: v })} /></RRow>
            <Toggle on={s.grain} onChange={v => update({ grain: v })} label="Плёночное зерно" />
          </div>}
          {tab === 'text' && <div className="space-y-3">
            <RRow label={`Размер названия · ${s.titleSize}px`}><RRange value={s.titleSize} min={36} max={150} onChange={v => update({ titleSize: v })} /></RRow>
            <RRow label={`Межбуквенный · ${s.titleTracking.toFixed(3)}em`}><RRange value={s.titleTracking} min={-0.08} max={0.12} step={0.005} onChange={v => update({ titleTracking: v })} /></RRow>
            <RRow label="Регистр"><Seg value={s.titleCase} onChange={v => update({ titleCase: v })} options={[['as', 'Как есть'], ['upper', 'ЗАГЛАВНЫЕ'], ['lower', 'строчные']]} /></RRow>
            <RRow label="Шрифт"><select value={s.titleFont} onChange={e => update({ titleFont: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"><option value="">Шрифт сайта</option>{TITLE_FONTS.map(f => <option key={f} value={f}>{f.split("'")[1]}</option>)}</select></RRow>
          </div>}
        </div>
      </motion.aside>
    </div>
  );
};


// ============================================================================
// 7. SIMULATION DIGEST PRO + WEEK BUZZ
// ============================================================================
const FAN_POS = ['это лучшее, что выходило на этой неделе', 'на репите с утра', 'обложка + звук = 10/10', 'не ожидал такого уровня', 'припев засел в голове', 'это будет хит, запомните', 'фит просто разнёс', 'слушаю третий раз подряд'];
const FAN_MID = ['нормально, но ждал большего', 'пара треков хорошие, остальное проходняк', 'звучит как прошлый релиз', 'надо переслушать', 'бит топ, текст средний', 'на любителя'];
const FAN_NEG = ['что это было', 'скипнул на втором куплете', 'раньше было лучше', 'пиар больше, чем музыка', 'не моё совсем', 'ну такое…'];
const NICKS = ['lera_vibes', 'tima.808', 'dasha_sad', 'kirill02', 'alya_luv', 'nikita.wav', 'sonya_night', 'egor777', 'vika_fan', 'max.beats'];
const typeRu = (t: string, n?: number) => (t === 'album' ? (n && n <= 7 ? 'EP' : 'Альбом') : t === 'snippet' ? 'Сниппет' : 'Сингл');

export const SimDigestPro: React.FC<{
  simState: SimState; expanded?: boolean; onExpand?: () => void; onClose?: () => void;
  onOpenRelease?: (t: 'track' | 'album' | 'snippet', id: string, week?: number) => void; onOpenArtist?: (id: string) => void; onShowAllDrops?: (week?: number) => void;
}> = ({ simState, expanded = false, onExpand, onClose, onOpenRelease, onOpenArtist, onShowAllDrops }) => {
  const history = useMemo<SimWeekDigest[]>(() => { const h = simState.digestHistory && simState.digestHistory.length ? simState.digestHistory : simState.lastDigest ? [simState.lastDigest] : []; return [...h].sort((a, b) => a.weekNumber - b.weekNumber); }, [simState.digestHistory, simState.lastDigest]);
  const [week, setWeek] = useState<number | null>(null);
  const dg = history.find(x => x.weekNumber === week) || history[history.length - 1];
  const [rumors, setRumors] = useState<any[]>([]);
  useEffect(() => { setRumors(loadConfirmed()); const f = () => setRumors(loadConfirmed()); window.addEventListener('musaic-confirmed', f); return () => window.removeEventListener('musaic-confirmed', f); }, [simState.currentDate]);
  const calc = useMemo(() => {
    if (!dg) return null;
    const drops = [...(dg.weeklyDrops || [])].sort((a, b) => b.plays - a.plays);
    const full = drops.filter(d => d.itemType !== 'snippet');
    const debutSum = full.reduce((s, d) => s + d.plays, 0);
    const median = full.length ? full[Math.floor(full.length / 2)].plays : 0;
    const genres = new Map<string, number>(); full.forEach(d => { const g = (d.genre || 'Другое').split(/[\/,]/)[0].trim(); genres.set(g, (genres.get(g) || 0) + 1); });
    const gSorted = [...genres.entries()].sort((a, b) => b[1] - a[1]);
    const net = dg.topListenersGainers.reduce((s, g) => s + g.delta, 0) + dg.topListenersLosers.reduce((s, g) => s + g.delta, 0);
    const chart = simState.tracks.filter(t => !t.isSnippet && (t.previousChartPosition || 0) > 0 && (t.releaseDate || '') <= simState.currentDate).sort((a, b) => (a.previousChartPosition || 999) - (b.previousChartPosition || 999)).slice(0, expanded ? 20 : 10);
    const trend = history.slice(-16).map(h => ({ w: h.weekNumber, n: h.newReleasesCount, p: (h.weeklyDrops || []).filter(d => d.itemType !== 'snippet').reduce((s, d) => s + d.plays, 0) }));
    const end = isoDay(msOf(simState.currentDate) + 21 * DAY);
    const upcoming = [
      ...simState.tracks.filter(t => (t.releaseDate || '') > simState.currentDate && (t.releaseDate || '') <= end).map(t => ({ k: 'trk' + t.id, title: t.title, artist: t.artistName, date: t.releaseDate!, kind: t.isSnippet ? 'Сниппет' : 'Трек', cover: t.coverUrl })),
      ...simState.albums.filter(a => (a.releaseDate || '') > simState.currentDate && (a.releaseDate || '') <= end).map(a => ({ k: 'alb' + a.id, title: a.title, artist: a.artistName, date: a.releaseDate, kind: 'Альбом', cover: a.coverUrl }))
    ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
    const rum = rumors.filter(r => !r.used && r.date >= isoDay(msOf(simState.currentDate) - 3 * DAY) && r.date <= end).slice(0, 6);
    const voices = full.slice(0, 3).map(d => {
      const r = seeded(hashStr(d.id));
      const perf = median ? d.plays / median : 1;
      const bank = perf >= 1.4 ? FAN_POS : perf >= 0.7 ? (r() < 0.55 ? FAN_POS : FAN_MID) : (r() < 0.5 ? FAN_MID : FAN_NEG);
      return { d, lines: [0, 1].map(i => ({ who: NICKS[Math.floor(r() * NICKS.length)], text: bank[Math.floor(r() * bank.length)], likes: Math.round(40 + r() * 900 * (1 + i)) })) };
    });
    return { drops, full, debutSum, median, gSorted, net, chart, trend, upcoming, rum, voices, feats: drops.filter(d => d.featuredArtist).length, albums: drops.filter(d => d.itemType === 'album').length };
  }, [dg, simState.tracks, simState.albums, simState.currentDate, history, rumors, expanded]);
  if (!dg || !calc) return <div className="p-6 rounded-2xl bg-zinc-900/65 border border-white/12 text-xs text-zinc-300">Промотайте хотя бы одну неделю, чтобы увидеть итоги: релизы, чарты, рост и спад слушателей.</div>;
  const c = calc;
  const maxTrend = Math.max(1, ...c.trend.map(t => t.p));
  const maxLis = Math.max(1, ...dg.topListenersGainers.map(g => Math.abs(g.delta)), ...dg.topListenersLosers.map(g => Math.abs(g.delta)));
  const open = (t: any, id: string) => onOpenRelease && onOpenRelease(t, id, dg.weekNumber);
  const card = 'rounded-2xl bg-zinc-900/70 border border-white/[0.09] p-4';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold text-white">Итоги недели {dg.weekNumber}</h3>
          <p className="text-[11px] text-zinc-400 tabular-nums">{fmtDate(dg.fromDate)} → {fmtDate(dg.toDate)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {onShowAllDrops && <button type="button" onClick={() => onShowAllDrops(dg.weekNumber)} className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-bold text-white">Все релизы</button>}
          {!expanded && onExpand && <button type="button" onClick={onExpand} className="px-2.5 py-1.5 rounded-xl theme-bg-accent text-black text-[11px] font-black">⤢ Развернуть</button>}
          {expanded && onClose && <button type="button" onClick={onClose} className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-bold text-white">Свернуть</button>}
        </div>
      </div>
      {history.length > 1 && (
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
          {history.slice(-24).map(h => <button key={h.weekNumber} type="button" onClick={() => setWeek(h.weekNumber)} className={`shrink-0 px-2 py-1 rounded-lg text-[10.5px] font-bold tabular-nums transition-colors ${h.weekNumber === dg.weekNumber ? 'bg-white text-black' : 'bg-white/[0.04] text-zinc-400 hover:text-white'}`}>Н{h.weekNumber}</button>)}
        </div>
      )}
      <div className={`grid gap-2 ${expanded ? 'grid-cols-2 md:grid-cols-4 xl:grid-cols-8' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <Kpi accent label="Релизов" value={dg.newReleasesCount} sub={`${c.albums} альб. · ${dg.newSnippetsCount} снип.`} />
        <Kpi label="Дебюты, сумма" value={fmtC(c.debutSum)} sub={c.full.length ? `в среднем ${fmtC(c.debutSum / c.full.length)}` : ''} />
        <Kpi label="Фиты" value={c.feats} sub={c.drops.length ? `${Math.round((c.feats / c.drops.length) * 100)}% релизов` : ''} />
        <Kpi label="Слушатели (топы)" value={<span className={c.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{c.net >= 0 ? '+' : ''}{fmtC(c.net)}</span>} sub="рост минус спад" />
        {expanded && <>
          <Kpi label="Медиана дебюта" value={fmtC(c.median)} />
          <Kpi label="Артистов" value={simState.artists.length} sub={`${new Set(c.drops.map(d => d.artistName)).size} выпустили`} />
          <Kpi label="Треков в базе" value={simState.tracks.length} sub={`${simState.albums.length} альбомов`} />
          <Kpi label="Неделя" value={simState.weekNumber} sub={fmtDate(simState.currentDate)} />
        </>}
      </div>
      {c.trend.length > 1 && (
        <div className={card}>
          <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-bold text-white">Динамика по неделям</span><span className="text-[10.5px] text-zinc-500">высота — прослушивания дебютов · цифра — релизы</span></div>
          <div className="flex items-end gap-1 h-20">
            {c.trend.map(t => (
              <button key={t.w} type="button" onClick={() => setWeek(t.w)} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 h-full group">
                <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(4, (t.p / maxTrend) * 100)}%` }} transition={{ duration: 0.5 }} className={`w-full rounded-md ${t.w === dg.weekNumber ? 'theme-bg-accent' : 'bg-white/15 group-hover:bg-white/30'}`} />
                <span className="text-[9px] text-zinc-500 tabular-nums">{t.n}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={`grid gap-3 ${expanded ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={`${card} ${expanded ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-bold text-white">Главные релизы недели</span><span className="text-[10.5px] text-zinc-500">{c.drops.length} всего</span></div>
          <div className="space-y-1">
            {c.drops.slice(0, expanded ? 20 : 6).map((d, i) => {
              const perf = c.median ? d.plays / c.median : 1;
              const tag = d.itemType === 'snippet' ? ['👀', 'тизер'] : i === 0 ? ['👑', 'дебют №1'] : perf >= 1.8 ? ['🔥', 'хит'] : perf >= 1.1 ? ['💚', 'зашёл'] : perf >= 0.6 ? ['🙂', 'ровно'] : ['🥶', 'тихо'];
              return (
                <motion.button key={d.id} type="button" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} onClick={() => open(d.itemType, d.id)} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[0.05] text-left">
                  <span className="w-5 text-[11px] text-zinc-500 tabular-nums text-right">{i + 1}</span>
                  <CoverArt url={d.coverUrl} title={d.title} className="w-10 h-10 rounded-lg overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
                  <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-bold text-white truncate">{d.title}</span><span className="block text-[11px] text-zinc-400 truncate">{d.artistName}{d.featuredArtist ? ` feat. ${d.featuredArtist}` : ''} · {typeRu(d.itemType, d.trackCount)}</span></span>
                  <span className="hidden sm:inline text-[10.5px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 shrink-0">{tag[0]} {tag[1]}</span>
                  <span className="text-[12px] font-bold text-white tabular-nums w-16 text-right shrink-0">{fmtC(d.plays)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className={card}>
          <div className="text-[12px] font-bold text-white mb-2">Чарт сейчас</div>
          <div className="space-y-0.5">
            {c.chart.map(t => {
              const h = (t.chartHistory || []).filter(x => typeof x === 'number');
              const prev = h.length >= 2 ? h[h.length - 2] : 0;
              const pos = t.previousChartPosition || 0;
              const mv = !prev ? 'new' : prev - pos;
              return (
                <button key={t.id} type="button" onClick={() => open('track', t.id)} className="w-full flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-white/[0.05] text-left">
                  <span className="w-5 text-[12px] font-black text-white tabular-nums text-right">{pos}</span>
                  <span className={`w-7 text-[9.5px] font-black text-center ${mv === 'new' ? 'text-sky-300' : (mv as number) > 0 ? 'text-emerald-400' : (mv as number) < 0 ? 'text-rose-400' : 'text-zinc-600'}`}>{mv === 'new' ? 'NEW' : (mv as number) > 0 ? `▲${mv}` : (mv as number) < 0 ? `▼${-(mv as number)}` : '—'}</span>
                  <CoverArt url={t.coverUrl} title={t.title} className="w-7 h-7 rounded-md overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
                  <span className="min-w-0 flex-1"><span className="block text-[11.5px] font-bold text-white truncate">{t.title}</span><span className="block text-[10px] text-zinc-500 truncate">{t.artistName}</span></span>
                </button>
              );
            })}
            {c.chart.length === 0 && <div className="text-[11px] text-zinc-500 py-3">Чарт ещё не сформирован</div>}
          </div>
          {dg.biggestClimber && <div className="mt-2 pt-2 border-t border-white/[0.06] text-[11px] text-zinc-300">🚀 Взлёт недели: <b className="text-white">{dg.biggestClimber.artistName} — {dg.biggestClimber.title}</b> <span className="text-emerald-400">+{dg.biggestClimber.delta}</span></div>}
        </div>
      </div>
      <div className={`grid gap-3 ${expanded ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {(['gain', 'loss'] as const).map(kind => {
          const list = kind === 'gain' ? dg.topListenersGainers : dg.topListenersLosers;
          return (
            <div key={kind} className={card}>
              <div className={`text-[12px] font-bold mb-2 ${kind === 'gain' ? 'text-emerald-400' : 'text-rose-400'}`}>{kind === 'gain' ? 'Рост слушателей' : 'Спад слушателей'}</div>
              {list.length === 0 && <div className="text-[11px] text-zinc-500">{kind === 'gain' ? 'Нет значимого роста' : 'Без заметных падений'}</div>}
              <div className="space-y-1.5">
                {list.map(g => (
                  <button key={g.artistId} type="button" onClick={() => onOpenArtist && onOpenArtist(g.artistId)} className="w-full text-left">
                    <div className="flex items-center justify-between text-[11.5px] tabular-nums"><span className="text-zinc-200 truncate">{g.name}</span><span className={kind === 'gain' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{g.delta > 0 ? '+' : ''}{fmtC(g.delta)}</span></div>
                    <div className="h-1 rounded-full bg-white/[0.05] mt-0.5 overflow-hidden"><motion.div className={`h-full rounded-full ${kind === 'gain' ? 'bg-emerald-400/80' : 'bg-rose-400/80'}`} initial={{ width: 0 }} animate={{ width: `${(Math.abs(g.delta) / maxLis) * 100}%` }} transition={{ duration: 0.5 }} /></div>
                    <div className="text-[9.5px] text-zinc-600 tabular-nums">теперь {fmtC(g.newFollowers)}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <div className={`${card} ${expanded ? '' : 'sm:col-span-2'}`}>
          <div className="text-[12px] font-bold text-white mb-2">Жанры недели</div>
          {c.gSorted.length === 0 ? <div className="text-[11px] text-zinc-500">—</div> : <>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px]">{c.gSorted.map(([g, n], i) => <div key={g} title={`${g}: ${n}`} style={{ flexGrow: n, background: RULE_COLORS[i % RULE_COLORS.length] }} />)}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">{c.gSorted.slice(0, 8).map(([g, n], i) => <span key={g} className="text-[10.5px] text-zinc-400"><span style={{ color: RULE_COLORS[i % RULE_COLORS.length] }}>●</span> {g} · {n}</span>)}</div>
          </>}
        </div>
      </div>
      <div className={`grid gap-3 ${expanded ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div className={card}>
          <div className="text-[12px] font-bold text-white mb-2">Что говорят люди</div>
          {c.voices.length === 0 && <div className="text-[11px] text-zinc-500">Нет релизов — нечего обсуждать</div>}
          <div className="space-y-2.5">
            {c.voices.map(v => (
              <div key={v.d.id} className="rounded-xl bg-black/25 border border-white/[0.05] p-2.5">
                <div className="text-[11px] font-bold text-white truncate mb-1">«{v.d.title}» · {v.d.artistName}</div>
                {v.lines.map((l, i) => <div key={i} className="flex items-start gap-2 text-[11.5px]"><span className="text-zinc-500 shrink-0">@{l.who}</span><span className="text-zinc-200 flex-1">{l.text}</span><span className="text-zinc-600 tabular-nums shrink-0">♥ {l.likes}</span></div>)}
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <div className="text-[12px] font-bold text-white mb-2">Слухи, тизеры и инфоповоды</div>
          <div className="space-y-1.5">
            {c.rum.map(r => <div key={r.id} className="flex items-center gap-2 text-[11.5px]"><span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black bg-violet-400/15 text-violet-300">СЛУХ</span><span className="text-zinc-200 truncate flex-1">{r.artistName} — {r.title || ({ single: 'сингл', ep: 'EP', album: 'альбом', snippet: 'сниппет' } as any)[r.kind]}</span><span className="text-zinc-500 tabular-nums shrink-0">{fmtDate(r.date).slice(0, 5)}</span></div>)}
            {c.upcoming.map(u => <div key={u.k} className="flex items-center gap-2 text-[11.5px]"><span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black bg-amber-400/15 text-amber-300">СКОРО</span><span className="text-zinc-200 truncate flex-1">{u.artist} — {u.title} <span className="text-zinc-500">· {u.kind}</span></span><span className="text-zinc-500 tabular-nums shrink-0">{fmtDate(u.date).slice(0, 5)}</span></div>)}
            {c.drops.filter(d => d.itemType === 'snippet').slice(0, 4).map(d => <div key={d.id} className="flex items-center gap-2 text-[11.5px]"><span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black bg-sky-400/15 text-sky-300">ТИЗЕР</span><span className="text-zinc-200 truncate flex-1">{d.artistName} — {d.title}</span><span className="text-zinc-500 tabular-nums shrink-0">{fmtC(d.plays)}</span></div>)}
            {dg.highlights.slice(0, expanded ? 12 : 4).map((h, i) => <div key={i} className="flex items-start gap-2 text-[11.5px]"><span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black bg-white/[0.07] text-zinc-300 shrink-0">ИНФО</span><span className="text-zinc-300">{h}</span></div>)}
            {c.rum.length + c.upcoming.length + dg.highlights.length === 0 && <div className="text-[11px] text-zinc-500">Тихая неделя</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

/** fullscreen wrapper for the digest */
export const SimDigestFullscreen: React.FC<React.ComponentProps<typeof SimDigestPro> & { onClose: () => void }> = props => {
  useEsc(true, props.onClose);
  return (
    <Portal>
      <div className="fixed inset-0 z-[640] flex items-center justify-center p-3 md:p-6">
        <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={props.onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-[28px] bg-[#0d0e12]/97 border border-white/10 shadow-2xl p-5 md:p-7">
          <SimDigestPro {...props} expanded />
        </motion.div>
      </div>
    </Portal>
  );
};

/** compact strip for manual batch / semi-auto: rumors, teasers and drops of this week */
export const WeekBuzzStrip: React.FC<{ simState: SimState; rumors: Array<{ id: string; artistName: string; kind: string; date: string; title?: string; feat?: string; source?: string; used?: string }>; onUse?: (id: string) => void }> = memo(({ simState, rumors, onUse }) => {
  const items = useMemo(() => {
    const now = msOf(simState.currentDate);
    const end = isoDay(now + 7 * DAY), from = isoDay(now - 3 * DAY), recent = isoDay(now - 14 * DAY);
    const out: Array<{ k: string; tag: string; cls: string; text: string; date?: string; rid?: string }> = [];
    rumors.filter(r => !r.used && r.date >= from && r.date <= end).forEach(r => out.push({ k: `r${r.id}`, tag: 'Слух', cls: 'bg-violet-400/15 text-violet-200 border-violet-400/25', text: `${r.artistName} · ${r.title ? `«${r.title}»` : ({ single: 'сингл', ep: 'EP', album: 'альбом', snippet: 'сниппет' } as any)[r.kind] || r.kind}${r.feat ? ` ft. ${r.feat}` : ''}`, date: r.date, rid: r.id }));
    simState.tracks.filter(t => (t.releaseDate || '') > simState.currentDate && (t.releaseDate || '') <= end).slice(0, 6).forEach(t => out.push({ k: `s${t.id}`, tag: t.isSnippet ? 'Тизер' : 'Анонс', cls: 'bg-amber-400/15 text-amber-200 border-amber-400/25', text: `${t.artistName} · «${t.title}»`, date: t.releaseDate }));
    simState.albums.filter(a => (a.releaseDate || '') > simState.currentDate && (a.releaseDate || '') <= end).slice(0, 4).forEach(a => out.push({ k: `a${a.id}`, tag: 'Альбом', cls: 'bg-amber-400/15 text-amber-200 border-amber-400/25', text: `${a.artistName} · «${a.title}»`, date: a.releaseDate }));
    simState.tracks.filter(t => t.isSnippet && (t.releaseDate || '') >= recent && (t.releaseDate || '') <= simState.currentDate).slice(-6).forEach(t => out.push({ k: `t${t.id}`, tag: 'Сниппет', cls: 'bg-sky-400/15 text-sky-200 border-sky-400/25', text: `${t.artistName} · «${t.title}»${t.snippetTeaser ? ` — ${t.snippetTeaser.slice(0, 40)}` : ''}`, date: t.releaseDate }));
    return out;
  }, [simState.currentDate, simState.tracks, simState.albums, rumors]);
  if (!items.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-3 rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/[0.09] via-white/[0.02] to-transparent px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="relative flex w-2 h-2 shrink-0"><span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-60" /><span className="relative w-2 h-2 rounded-full bg-violet-400" /></span>
        <span className="text-[11px] font-black text-white whitespace-nowrap">На этой неделе</span>
        <span className="text-[10.5px] text-zinc-500 whitespace-nowrap">к пятнице · {items.length}</span>
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar py-0.5 min-w-0">
          {items.map(it => (
            <button key={it.k} type="button" disabled={!it.rid || !onUse} onClick={() => it.rid && onUse && onUse(it.rid)} title={it.rid && onUse ? 'Добавить этот слух в релизы недели' : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] ${it.cls} ${it.rid && onUse ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}`}>
              <b className="uppercase tracking-wide text-[9px]">{it.tag}</b><span className="max-w-[220px] truncate">{it.text}</span>{it.date && <span className="opacity-60 tabular-nums">{fmtDate(it.date).slice(0, 5)}</span>}{it.rid && onUse && <span className="opacity-70">＋</span>}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});


// ============================================================================
// 8. FEAT PICKER — several guests, search by name, custom names
// ============================================================================
export const FeatPicker: React.FC<{ value: string; onChange: (v: string) => void; artists: Artist[]; mainArtistName?: string; placeholder?: string }> = ({ value, onChange, artists, mainArtistName, placeholder = 'Добавить гостя…' }) => {
  const names = splitNames(value);
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const main = artists.find(a => norm(a.name) === norm(mainArtistName));
  const sugg = useMemo(() => {
    const n = norm(q);
    const taken = new Set([...names.map(norm), norm(mainArtistName)]);
    const pool = artists.filter(a => !taken.has(norm(a.name)));
    if (!n) {
      const f = main?.followers || 0;
      return pool.filter(a => norm(a.genre) === norm(main?.genre) || !f || Math.abs(Math.log10((a.followers || 1) / Math.max(1, f))) < 0.6).sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 8);
    }
    return pool.filter(a => norm(a.name).includes(n)).sort((a, b) => Number(norm(b.name).startsWith(n)) - Number(norm(a.name).startsWith(n)) || (b.followers || 0) - (a.followers || 0)).slice(0, 8);
  }, [q, artists, value, mainArtistName]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = (nm: string) => { const t = nm.trim(); if (!t || names.some(x => norm(x) === norm(t))) return; onChange([...names, t].join(', ')); setQ(''); };
  const remove = (i: number) => onChange(names.filter((_, j) => j !== i).join(', '));
  const random = () => { const pool = sugg.length ? sugg : artists.filter(a => norm(a.name) !== norm(mainArtistName)); if (pool.length) add(pool[Math.floor(Math.random() * pool.length)].name); };
  return (
    <div className="relative">
      <div className="min-h-[40px] w-full flex flex-wrap items-center gap-1.5 bg-black/40 border border-white/10 focus-within:border-white/25 rounded-xl px-2 py-1.5">
        <AnimatePresence initial={false}>
          {names.map((nm, i) => { const a = artists.find(x => norm(x.name) === norm(nm)); return (
            <motion.span key={nm} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} className="inline-flex items-center gap-1.5 pl-0.5 pr-1.5 py-0.5 rounded-full bg-white/[0.08] text-[11.5px] font-semibold text-white">
              <CoverArt url={a?.imageUrl} title={nm} isArtist className="w-5 h-5 rounded-full overflow-hidden" innerClassName="w-full h-full object-cover" />{nm}
              <button type="button" onClick={() => remove(i)} className="text-zinc-400 hover:text-rose-300 text-xs leading-none">×</button>
            </motion.span>); })}
        </AnimatePresence>
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(sugg[0] && norm(sugg[0].name).startsWith(norm(q)) ? sugg[0].name : q); } else if (e.key === 'Backspace' && !q && names.length) remove(names.length - 1); }}
          placeholder={names.length ? '' : placeholder} className="flex-1 min-w-[90px] bg-transparent text-xs md:text-sm text-white outline-none py-0.5" />
        <button type="button" onClick={random} title="Подобрать похожего по жанру и масштабу" className="text-[11px] text-zinc-400 hover:text-white px-1">🎲</button>
      </div>
      <AnimatePresence>
        {focus && (sugg.length > 0 || q.trim()) && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-30 left-0 right-0 mt-1 rounded-xl bg-[#14151a] border border-white/10 shadow-2xl p-1 max-h-60 overflow-y-auto custom-scrollbar">
            {!q && <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Похожие по жанру и масштабу</div>}
            {sugg.map(a => (
              <button key={a.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => add(a.name)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-left">
                <CoverArt url={a.imageUrl} title={a.name} isArtist className="w-7 h-7 rounded-full overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
                <span className="min-w-0 flex-1"><span className="block text-[12px] font-bold text-white truncate">{a.name}</span><span className="block text-[10px] text-zinc-500 truncate">{a.genre || '—'} · {fmtC(a.followers || 0)}</span></span>
              </button>
            ))}
            {q.trim() && !sugg.some(a => norm(a.name) === norm(q)) && <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => add(q)} className="w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-left text-[12px] text-zinc-300">+ Добавить «{q.trim()}» (не из базы)</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** generated cover marker: the cover is removed on purpose → always show the auto cover */
export const AUTO_COVER = 'auto:gen';

