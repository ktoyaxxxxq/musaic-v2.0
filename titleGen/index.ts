// ============================================================================
// TRACK TITLE GENERATOR v3
// - each title is 100% Russian OR 100% English (never mixed)
// - language: ~60% RU / 40% EN by default, adapts to the artist's catalog,
//   but the "other" language never drops below ~12%
// - optional manual language choice (Auto / RU / EN), remembered in localStorage
// - realistic length mix: one word (most often) / two-three words / sentence (rare)
// - realistic casing mix: as written / lowercase / UPPERCASE / Sentence case
// - anti-repeat: avoids exact duplicates AND reusing the same brand/word too often
// ============================================================================
import type { SimLanguageMix } from '../types';
import type { LangBank, Pattern, ThemeId } from './types';
import { EN_BANK } from './banksEn';
import { RU_BANK } from './banksRu';
import { RU_EXTRA, EN_EXTRA, mergeBank } from './banksExtra';

export type { ThemeId } from './types';

export type TitleMood =
  | 'all' | 'fashion' | 'absurd' | 'conceptual' | 'sad' | 'rap' | 'trap' | 'status'
  | 'relations' | 'body_dark' | 'vibe' | 'numbers' | 'cars_weapons' | 'mystic' | 'aesthetics';

export const TITLE_MOOD_OPTIONS: Array<{ id: TitleMood; emoji: string; label: string; name: string }> = [
  { id: 'all', emoji: '🎲', name: 'Микс', label: '🎲 Микс' },
  { id: 'status', emoji: '💰', name: 'Деньги / слава', label: '💰 Деньги' },
  { id: 'relations', emoji: '💔', name: 'Отношения', label: '💔 Отношения' },
  { id: 'fashion', emoji: '💎', name: 'Бренды одежды', label: '💎 Фэшн' },
  { id: 'cars_weapons', emoji: '🏎', name: 'Тачки, стволы, бренды', label: '🏎 Бренды' },
  { id: 'aesthetics', emoji: '🌆', name: 'Эстетика / города', label: '🌆 Эстетика' },
  { id: 'vibe', emoji: '✨', name: 'Вайб / радость', label: '✨ Вайб' },
  { id: 'sad', emoji: '🌧', name: 'Грустный', label: '🌧 Грусть' },
  { id: 'body_dark', emoji: '🩸', name: 'Тело / тьма', label: '🩸 Тьма' },
  { id: 'mystic', emoji: '🔮', name: 'Мистика', label: '🔮 Мистика' },
  { id: 'numbers', emoji: '🔢', name: 'Цифры', label: '🔢 Цифры' },
  { id: 'rap', emoji: '🎤', name: 'Рэп', label: '🎤 Рэп' },
  { id: 'trap', emoji: '⚡', name: 'Трэп', label: '⚡ Трэп' },
  { id: 'conceptual', emoji: '🧠', name: 'Концепт', label: '🧠 Концепт' },
  { id: 'absurd', emoji: '🤡', name: 'Абсурд', label: '🤡 Абсурд' }
];

// ---------------------------------------------------------------------------
// manual language choice (optional): 'auto' = adapt to the artist
// ---------------------------------------------------------------------------
export type TitleLang = 'auto' | 'ru' | 'en';

export const TITLE_LANG_OPTIONS: Array<{ id: TitleLang; emoji: string; name: string }> = [
  { id: 'auto', emoji: '🌐', name: 'Авто' },
  { id: 'ru', emoji: '🇷🇺', name: 'Русский' },
  { id: 'en', emoji: '🇬🇧', name: 'English' }
];

const LANG_KEY = 'musaic_title_lang';

let titleLangPref: TitleLang = (() => {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
    return v === 'ru' || v === 'en' ? v : 'auto';
  } catch {
    return 'auto';
  }
})();

export function getTitleLanguage(): TitleLang {
  return titleLangPref;
}

export function setTitleLanguage(lang: TitleLang): void {
  titleLangPref = lang;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

export interface CasingWeights {
  normal: number; // as written in the bank (Title Case / natural)
  lower: number;  // всё маленькими
  upper: number;  // КАПС
  title: number;  // Только первая буква большая
}

export interface ArtistNamingProfile {
  enProb: number;          // 0..1 chance a title is fully English
  casingWeights: CasingWeights;
  shortRatio: number;      // chance of a one-word title
  phraseRatio?: number;    // chance of a long phrase (4+ words)
  themeWeights?: Partial<Record<ThemeId, number>>;
  seed?: number;           // stable per-artist signature
}

const BANKS: Record<'ru' | 'en', LangBank> = {
  ru: mergeBank(RU_BANK, RU_EXTRA),
  en: mergeBank(EN_BANK, EN_EXTRA)
};

const DEFAULT_CASING: CasingWeights = { normal: 0.4, lower: 0.28, upper: 0.16, title: 0.16 };
const DEFAULT_SHORT = 0.46;  // one word: most often
const DEFAULT_PHRASE = 0.12; // sentence: rare
const DEFAULT_EN = 0.4;      // ~60% RU / 40% EN
const MIN_OTHER_LANG = 0.12; // the other language never disappears completely

/** How often each theme shows up in "Микс" before artist adaptation. */
const BASE_THEME_WEIGHTS: Record<ThemeId, number> = {
  status: 1.45, relations: 1.45, fashion: 1.1, vibe: 1.1, sad: 0.95, aesthetics: 0.9,
  cars_weapons: 0.6, body_dark: 0.6, mystic: 0.6, numbers: 0.35, real_talk: 1.0, punch: 1.0,
  rap: 0.55, trap: 0.55, slang: 0.5, celebs: 0.45, digital: 0.3, absurd: 0.25, conceptual: 0.35
};

/** Genre -> theme multipliers. */
const GENRE_RULES: Array<[RegExp, Partial<Record<ThemeId, number>>]> = [
  [/trap|трэп|трап|drill|дрил|phonk|фонк|rage/i, { status: 1.7, cars_weapons: 1.8, trap: 2.2, body_dark: 1.4, fashion: 1.3, slang: 1.4 }],
  [/hip|хип|rap|рэп|реп/i, { rap: 1.9, status: 1.4, real_talk: 1.3, cars_weapons: 1.2, celebs: 1.3 }],
  [/pop|поп|dance|дэнс/i, { relations: 1.9, vibe: 1.7, aesthetics: 1.4, sad: 1.2, body_dark: 0.5, cars_weapons: 0.6 }],
  [/r&b|rnb|рнб|soul|соул/i, { relations: 2.1, vibe: 1.4, fashion: 1.3, aesthetics: 1.3 }],
  [/emo|эмо|rock|рок|punk|панк|alt|grunge|metal/i, { body_dark: 2.2, sad: 1.9, mystic: 1.8, relations: 1.2, status: 0.5 }],
  [/indie|инди|lo-?fi|лоуфай|bedroom/i, { conceptual: 1.8, sad: 1.6, real_talk: 1.6, absurd: 1.4, status: 0.6 }],
  [/house|хаус|techno|техно|electro|электро|edm|hyperpop|гиперпоп/i, { aesthetics: 1.7, digital: 2, numbers: 1.6, absurd: 1.5, conceptual: 1.4 }],
  [/cloud|клауд|dark|дарк|witch|goth/i, { mystic: 2.2, body_dark: 1.8, sad: 1.5, aesthetics: 1.2 }]
];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const rnd = () => Math.random();
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

function weighted<T>(items: Array<[T, number]>): T {
  let total = 0;
  for (const [, w] of items) total += Math.max(0, w);
  let roll = rnd() * total;
  for (const [v, w] of items) {
    roll -= Math.max(0, w);
    if (roll <= 0) return v;
  }
  return items[items.length - 1][0];
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** deterministic 0..1 value for (seed, key) */
function seeded(seed: number, key: string): number {
  const h = hashStr(`${seed}:${key}`);
  return (h % 10000) / 10000;
}

const CYR = /[А-яЁё]/;
const LAT = /[A-Za-z]/;

export function hasMixedScripts(s: string): boolean {
  return LAT.test(s) && CYR.test(s);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

type LenBucket = 'one' | 'two' | 'phrase';
const bucketOf = (n: number): LenBucket => (n <= 1 ? 'one' : n <= 3 ? 'two' : 'phrase');

function chooseBucket(p: ArtistNamingProfile, isAlbum: boolean): LenBucket {
  const one = clamp(p.shortRatio ?? DEFAULT_SHORT, 0.2, 0.75);
  const phrase = clamp((p.phraseRatio ?? DEFAULT_PHRASE) * (isAlbum ? 0.7 : 1), 0.04, 0.3);
  const two = Math.max(0.1, 1 - one - phrase);
  return weighted<LenBucket>([['one', one], ['two', two], ['phrase', phrase]]);
}

/** Applies one of 4 real-world casing styles. Short acronyms (AMG, G63, ЦУМ) survive Sentence case. */
function applyCasing(s: string, w: CasingWeights, bucket: LenBucket): string {
  let mode = weighted<keyof CasingWeights>([
    ['normal', w.normal], ['lower', w.lower], ['upper', w.upper], ['title', w.title]
  ]);
  // long phrases in full caps look odd, real artists rarely do it
  if (mode === 'upper' && bucket === 'phrase' && rnd() < 0.6) mode = 'lower';
  switch (mode) {
    case 'lower':
      return s.toLowerCase();
    case 'upper':
      return s.toUpperCase();
    case 'title': {
      const words = s.split(' ').map(word => {
        const isAcronym = word.length <= 5 && word === word.toUpperCase() && /\p{L}/u.test(word) && word.length > 1;
        return isAcronym ? word : word.toLowerCase();
      });
      const joined = words.join(' ');
      return joined.charAt(0).toUpperCase() + joined.slice(1);
    }
    default:
      return s;
  }
}

// ---------------------------------------------------------------------------
// anti-repeat memory
// ---------------------------------------------------------------------------
const atomUses = new Map<string, number>();
let blobCache: { set: Set<string> | null; size: number; blob: string } = { set: null, size: -1, blob: '' };

function existingBlob(set: Set<string>): string {
  if (blobCache.set !== set || blobCache.size !== set.size) {
    blobCache = { set, size: set.size, blob: ` ${Array.from(set).join(' | ')} ` };
  }
  return blobCache.blob;
}

/** How many existing titles already use this atom (brand, word, phrase). */
function countInExisting(set: Set<string>, atom: string): number {
  const a = atom.toLowerCase().trim();
  if (a.length < 3 || /^\d+$/.test(a)) return 0;
  const blob = existingBlob(set);
  let count = 0;
  let from = 0;
  while (count < 6) {
    const i = blob.indexOf(a, from);
    if (i < 0) break;
    const before = blob[i - 1] || ' ';
    const after = blob[i + a.length] || ' ';
    if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after)) count++;
    from = i + a.length;
  }
  return count;
}

function fillTemplate(tpl: string, bank: LangBank, lang: 'ru' | 'en', used: string[]): string | null {
  let failed = false;
  const out = tpl.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const list = bank.lists[key];
    if (!list || list.length === 0) {
      failed = true;
      return '';
    }
    // sample a few, keep the least used and not already in this title
    let best = '';
    let bestUses = Infinity;
    for (let i = 0; i < 3; i++) {
      const cand = pick(list);
      if (used.some(u => u.toLowerCase() === cand.toLowerCase())) continue;
      const uses = atomUses.get(`${lang}:${cand.toLowerCase()}`) ?? 0;
      if (uses < bestUses) {
        best = cand;
        bestUses = uses;
      }
    }
    if (!best) {
      failed = true;
      return '';
    }
    used.push(best);
    return best;
  });
  return failed ? null : out.replace(/\s+/g, ' ').trim();
}

function themeWeights(profile: ArtistNamingProfile, mood: TitleMood): Array<[ThemeId, number]> {
  if (mood !== 'all') return [[mood as ThemeId, 1]];
  const seed = profile.seed ?? 0;
  return (Object.keys(BASE_THEME_WEIGHTS) as ThemeId[]).map(t => {
    const learned = profile.themeWeights?.[t] ?? 1;
    // per-artist signature: 0.6x .. 1.6x, stable for the same artist
    const signature = profile.seed !== undefined ? 0.6 + seeded(seed, t) : 1;
    return [t, BASE_THEME_WEIGHTS[t] * learned * signature] as [ThemeId, number];
  });
}

function normalizeProfile(p: ArtistNamingProfile | boolean): ArtistNamingProfile {
  if (typeof p === 'boolean') {
    return { enProb: p ? 0.7 : 0.3, casingWeights: DEFAULT_CASING, shortRatio: DEFAULT_SHORT, phraseRatio: DEFAULT_PHRASE };
  }
  return {
    ...p,
    enProb: clamp(p.enProb ?? DEFAULT_EN, MIN_OTHER_LANG, 1 - MIN_OTHER_LANG),
    casingWeights: p.casingWeights ?? DEFAULT_CASING,
    shortRatio: p.shortRatio ?? DEFAULT_SHORT
  };
}

// ---------------------------------------------------------------------------
// artist analysis
// ---------------------------------------------------------------------------
let tokenThemeIndex: Map<string, Set<ThemeId>> | null = null;

function listKeysOf(patterns: Pattern[]): string[] {
  const keys = new Set<string>();
  for (const [tpl] of patterns) for (const m of tpl.matchAll(/\{(\w+)\}/g)) keys.add(m[1]);
  return Array.from(keys);
}

/** word -> themes it belongs to (built once, used to learn an artist's favourite themes) */
function getTokenThemeIndex(): Map<string, Set<ThemeId>> {
  if (tokenThemeIndex) return tokenThemeIndex;
  const idx = new Map<string, Set<ThemeId>>();
  for (const bank of [BANKS.en, BANKS.ru]) {
    for (const theme of Object.keys(bank.themes) as ThemeId[]) {
      for (const key of listKeysOf(bank.themes[theme])) {
        for (const atom of bank.lists[key] || []) {
          for (const tok of atom.toLowerCase().split(/[\s,.-]+/)) {
            if (tok.length < 4) continue;
            if (!idx.has(tok)) idx.set(tok, new Set());
            idx.get(tok)!.add(theme);
          }
        }
      }
    }
  }
  tokenThemeIndex = idx;
  return idx;
}

const profileCache = new Map<string, ArtistNamingProfile>();

export function analyzeArtistNamingStyle(artist: any, tracks: Array<{ title?: string }> = [], albums: Array<{ title?: string }> = []): ArtistNamingProfile {
  const titles = [...(tracks || []), ...(albums || [])]
    .map(x => (typeof x?.title === 'string' ? x.title.trim() : ''))
    .filter(Boolean)
    .slice(-150);
  const id = String(artist?.id ?? artist?.name ?? 'unknown');
  const cacheKey = `${id}|${titles.length}|${artist?.genre ?? ''}`;
  const cached = profileCache.get(cacheKey);
  if (cached) return cached;

  const K = 4; // smoothing strength towards defaults
  const n = titles.length;

  // language: start from ~60/40 RU/EN, then follow what the artist actually uses
  let lat = 0;
  let cyr = 0;
  for (const t of titles) {
    if (LAT.test(t)) lat++;
    else if (CYR.test(t)) cyr++;
  }
  const name = String(artist?.name ?? '');
  let prior = CYR.test(name) ? 0.28 : LAT.test(name) ? 0.46 : DEFAULT_EN;
  const country = String(artist?.country ?? '').toLowerCase();
  if (/рос|russia|^ru$|белар|казах|^by$|^kz$/.test(country)) prior -= 0.1;
  if (/usa|^us$|uk|^gb$|canada|austral|сша|англ|брит/.test(country)) prior += 0.2;
  const enProb = clamp((lat + prior * K) / (lat + cyr + K), MIN_OTHER_LANG, 1 - MIN_OTHER_LANG);

  // casing
  const c = { normal: 0, lower: 0, upper: 0, title: 0 };
  let ones = 0;
  let phrases = 0;
  for (const t of titles) {
    const hasLetters = /\p{L}/u.test(t);
    if (hasLetters && t === t.toLowerCase()) c.lower++;
    else if (hasLetters && t === t.toUpperCase()) c.upper++;
    else if (wordCount(t) > 1 && t.slice(1) === t.slice(1).toLowerCase()) c.title++;
    else c.normal++;
    const wc = wordCount(t);
    if (wc <= 1) ones++;
    else if (wc >= 4) phrases++;
  }
  const casingWeights: CasingWeights = {
    normal: (c.normal + DEFAULT_CASING.normal * K) / (n + K),
    lower: (c.lower + DEFAULT_CASING.lower * K) / (n + K),
    upper: (c.upper + DEFAULT_CASING.upper * K) / (n + K),
    title: (c.title + DEFAULT_CASING.title * K) / (n + K)
  };
  const shortRatio = (ones + DEFAULT_SHORT * K) / (n + K);
  const phraseRatio = (phrases + DEFAULT_PHRASE * K) / (n + K);

  // themes: genre + what the artist already sings about
  const themeW: Partial<Record<ThemeId, number>> = {};
  const genre = `${artist?.genre ?? ''} ${(artist as any)?.subgenre ?? ''}`;
  for (const [re, mult] of GENRE_RULES) {
    if (!re.test(genre)) continue;
    for (const [t, m] of Object.entries(mult) as Array<[ThemeId, number]>) themeW[t] = (themeW[t] ?? 1) * m;
  }
  const idx = getTokenThemeIndex();
  const hits: Partial<Record<ThemeId, number>> = {};
  for (const t of titles) {
    for (const tok of t.toLowerCase().split(/[\s,.-]+/)) {
      const themes = idx.get(tok);
      if (themes) themes.forEach(th => (hits[th] = (hits[th] ?? 0) + 1));
    }
  }
  for (const [t, h] of Object.entries(hits) as Array<[ThemeId, number]>) {
    themeW[t] = (themeW[t] ?? 1) * Math.min(2.5, 1 + h * 0.3);
  }

  const profile: ArtistNamingProfile = { enProb, casingWeights, shortRatio, phraseRatio, themeWeights: themeW, seed: hashStr(id) };
  if (profileCache.size > 2000) profileCache.clear();
  profileCache.set(cacheKey, profile);
  return profile;
}

// ---------------------------------------------------------------------------
// main entry (same signature as before)
// ---------------------------------------------------------------------------
function pickLanguage(profile: ArtistNamingProfile, languageOverride: SimLanguageMix): 'ru' | 'en' {
  // 1) explicit simulation setting wins
  if (languageOverride === 'en') return 'en';
  if (languageOverride === 'ru') return 'ru';
  // 2) manual choice in the title menu
  if (titleLangPref === 'ru' || titleLangPref === 'en') return titleLangPref;
  // 3) mix / auto
  if (languageOverride === 'mix') return rnd() < DEFAULT_EN ? 'en' : 'ru';
  return rnd() < profile.enProb ? 'en' : 'ru';
}

export function generateModernTitle(
  existingSet: Set<string>,
  isAlbum: boolean,
  profileOrEnglish: ArtistNamingProfile | boolean,
  languageOverride: SimLanguageMix = 'auto',
  moodTheme: TitleMood = 'all'
): string {
  const profile = normalizeProfile(profileOrEnglish);
  const mood: TitleMood = typeof moodTheme === 'string' ? moodTheme : 'all';

  const lang = pickLanguage(profile, languageOverride);
  const bank = BANKS[lang];
  const bucket = chooseBucket(profile, isAlbum);
  const themes = themeWeights(profile, mood);

  let best: { raw: string; used: string[] } | null = null;
  let bestScore = Infinity;

  for (let attempt = 0; attempt < 60; attempt++) {
    const theme = weighted(themes);
    const patterns = bank.themes[theme];
    if (!patterns || patterns.length === 0) continue;
    const tpl = weighted(patterns);
    const used: string[] = [];
    let raw = fillTemplate(tpl, bank, lang, used);
    if (!raw) continue;

    // rare number tail ("Racks 99", "Кэш х3")
    if (theme !== 'numbers' && wordCount(raw) <= 2 && rnd() < 0.05) raw = `${raw} ${pick(bank.sprinkle)}`;
    // album flavour
    if (isAlbum && rnd() < 0.1) raw = `${raw} ${pick(bank.albumTags)}`;

    if (hasMixedScripts(raw)) continue;
    const key = raw.toLowerCase();
    if (existingSet.has(key)) continue;

    let score = 0;
    const b = bucketOf(wordCount(raw));
    if (b !== bucket) score += attempt < 45 ? 4 : 1.5;
    for (const atom of used) {
      score += (atomUses.get(`${lang}:${atom.toLowerCase()}`) ?? 0) * 0.8;
      score += countInExisting(existingSet, atom) * 1.2;
    }
    if (score < bestScore) {
      best = { raw, used };
      bestScore = score;
    }
    if (score === 0 || (attempt > 20 && score <= 1)) break;
  }

  if (best) {
    const finalTitle = applyCasing(best.raw, profile.casingWeights, bucketOf(wordCount(best.raw)));
    if (atomUses.size > 6000) atomUses.clear();
    for (const atom of best.used) {
      const k = `${lang}:${atom.toLowerCase()}`;
      atomUses.set(k, (atomUses.get(k) ?? 0) + 1);
    }
    existingSet.add(finalTitle.toLowerCase());
    return finalTitle;
  }

  // fallback: very unlikely, keeps the old "Pt. 2" behaviour
  const base = fillTemplate('{punch}', bank, lang, []) || (lang === 'en' ? 'Untitled' : 'Без названия');
  const tags = lang === 'en' ? ['Pt 2', 'v2', 'Freestyle', 'Live', 'x2'] : ['ч. 2', 'версия 2', 'Фристайл', 'Демо', 'х2'];
  const tagged = `${base} ${pick(tags)}`;
  existingSet.add(tagged.toLowerCase());
  return tagged;
}
