import React, { useState, useMemo, useEffect, useCallback, useDeferredValue, memo, useRef } from 'react';
import { generateModernTitle, analyzeArtistNamingStyle } from './titleGen';
import type { TitleMood, ArtistNamingProfile } from './titleGen';
import { TitleMoodPicker } from './TitleMoodPicker';
export type { TitleMood } from './titleGen';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { engineDebut, engineGrowth, engineSleeper, engineChart, engineListeners, engineHype, engineSetCatalog, engineActive, smartDuration, WeekBuzzStrip, SimDigestPro, SimDigestFullscreen, ListenEngineButton, AutoBackupPanel } from './MusaicLab';
import {
  Play,
  FastForward,
  RotateCcw,
  Save,
  Download,
  Upload,
  LogOut,
  Sliders,
  Flame,
  Check,
  Plus,
  Trash2,
  X,
  Disc,
  RefreshCw,
  ShieldCheck,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileUp,
  FileText,
  Dices,
  Radar,
  Pencil,
  ArrowUpRight,
  Trophy,
  BarChart3,
  ExternalLink,
  Sparkles,
  Users,
  Eye,
  UserPlus,
  Image as ImageIcon,
  Clock,
  Zap,
  ArrowRight,
  List
} from 'lucide-react';
import {
  Artist,
  Album,
  Track,
  AwardItem,
  ReleasePromoStrategy,
  SimState,
  SimSaveSlot,
  SimProposal,
  SimAlbumTrack,
  SimWeekDigest,
  SimFuturePolicy,
  SimIntensity,
  SimModeType,
  SimWeekEvent,
  SimLanguageMix,
  SimFormatFocus,
  SimCollabRate,
  SimTierFocus,
  SimViralityLevel,
  SimHypeRange,
  SimAutopilotConfig,
  SimWeeklyDropSummary
} from './types';
import {
  CoverArt,
  saveMediaItem,
  fileToBase64,
  getRandomDuration,
  formatNumber,
  parseFormattedNumber,
  TextTracklistParserModal,
  GENRE_CATALOG
} from './App';
import { CoverEditorModal } from './CoverEditorModal';
import { loadConfirmed, saveConfirmed, type ConfirmedRumor } from './SocialFeed';

// ============================================================================
// DEFAULT AUTOPILOT CONFIG
// ============================================================================

export const DEFAULT_AUTOPILOT_CONFIG: SimAutopilotConfig = {
  intensity: 'balanced',
  weekEvent: 'normal',
  languageMix: 'auto',
  formatFocus: 'auto',
  collabRate: 'balanced',
  allowSurpriseCollabs: true,
  tierFocus: 'all',
  virality: 'balanced',
  enablePromoWaves: true,
  weeksCount: 1,
  singlesCount: null,
  epsCount: null,
  albumsCount: null,
  snippetsCount: null,
  preferredArtistIds: [],
  hypeRange: 'any'
};

export function splitFeaturedList(raw?: string, excludeName?: string): string[] {
  if (!raw || !raw.trim()) return [];
  const excl = excludeName ? excludeName.trim().toLowerCase() : '';
  const seen = new Set<string>();
  const out: string[] = [];
  raw
    .split(/[,&/;]|\bfeat\.?|\bft\.?/i)
    .map(s => s.replace(/^[()[\]\s]+|[()[\]\s]+$/g, '').trim())
    .filter(Boolean)
    .forEach(name => {
      const lower = name.toLowerCase();
      if (lower && lower !== excl && !seen.has(lower)) {
        seen.add(lower);
        out.push(name);
      }
    });
  return out;
}

export function appendFeaturedName(current: string | undefined, nextName: string): string {
  const existing = splitFeaturedList(current);
  const cleanNext = nextName.trim();
  if (!cleanNext) return existing.join(', ');
  if (existing.some(n => n.toLowerCase() === cleanNext.toLowerCase())) {
    return existing.join(', ');
  }
  return [...existing, cleanNext].join(', ');
}

// ============================================================================
// DATE & UTILITY HELPERS
// ============================================================================

export function addDaysISO(isoDate: string, days: number): string {
  const parts = (isoDate || '2026-01-01').split('-').map(Number);
  const d = new Date(Date.UTC(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDaysISO(fromISO: string, toISO: string): number {
  const f = new Date(fromISO || '2026-01-01').getTime();
  const t = new Date(toISO || '2026-01-01').getTime();
  if (isNaN(f) || isNaN(t)) return 0;
  return Math.round((t - f) / 86400000);
}

// Global music industry release day: Friday (пятница) for synchronized drops
export function getDropFriday(fromDate: string, toDate: string): string {
  const start = new Date(fromDate + 'T12:00:00Z');
  const end = new Date(toDate + 'T12:00:00Z');
  let curr = new Date(start);
  let fridayISO: string | null = null;
  while (curr <= end) {
    if (curr.getUTCDay() === 5) {
      fridayISO = curr.toISOString().slice(0, 10);
      break;
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  if (fridayISO) return fridayISO;
  const d = new Date(toDate + 'T12:00:00Z');
  const day = d.getUTCDay();
  const diff = (5 - day + 7) % 7;
  d.setUTCDate(d.getUTCDate() + (diff === 0 ? 0 : diff));
  return d.toISOString().slice(0, 10);
}

// Realistic album track count: 7-23 (weighted towards 10-15 standard, rarely up to 25)
export function getRandomAlbumTrackCount(): number {
  const roll = Math.random();
  if (roll < 0.15) {
    return randInt(7, 9); // Short LP
  } else if (roll < 0.70) {
    return randInt(10, 15); // Standard LP
  } else if (roll < 0.94) {
    return randInt(16, 22); // Long LP / Deluxe
  } else {
    return randInt(23, 25); // Mega / Extended double LP (rare)
  }
}

export function formatSimDate(isoDate: string): string {
  if (!isoDate) return '—';
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  void months;
  return `${String(parseInt(d, 10)).padStart(2, '0')}-${String(parseInt(m, 10)).padStart(2, '0')}-${y}`;
}

function formatCompact(num: number): string {
  const n = Math.round(num || 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')} млн`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)} тыс.`;
  return `${sign}${abs.toLocaleString('ru-RU')}`;
}

function formatListeners(num: number): string {
  if (isNaN(num) || !num) return '0 слушателей за месяц';
  if (num >= 1000000) {
    const millions = (num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
    return `${millions} млн слушателей за месяц`;
  }
  return `${num.toLocaleString('ru-RU')} слушателей за месяц`;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

let _simIdSeq = 0;
function makeId(prefix = 'sim'): string {
  _simIdSeq = (_simIdSeq + 1) % 100000;
  return `${prefix}_${Date.now().toString(36)}_${_simIdSeq.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function getPopularityScale(followers: number): number {
  if (followers >= 15_000_000) return 1.75;
  if (followers >= 5_000_000) return 1.48;
  if (followers >= 3_000_000) return 1.36;
  if (followers >= 1_000_000) return 1.24;
  return 1.08;
}

function getCompressedReach(audience: number, hitsCount = 0, catalogAvgPlays = 0): number {
  const safeAudience = Math.max(60_000, audience || 350_000);
  const hitsAudienceBoost =
    hitsCount > 0 ? Math.min(2_800_000, Math.round(Math.pow(hitsCount, 0.75) * 420_000)) : 0;
  const catalogImpliedAudience = catalogAvgPlays > 0 ? Math.round(catalogAvgPlays * 0.72) : 0;

  let baseAudience = safeAudience;
  if (catalogImpliedAudience > 0) {
    if (catalogImpliedAudience > safeAudience) {
      // Monthly listeners missing or outdated: trust recent catalog performance
      baseAudience = Math.round(safeAudience * 0.25 + catalogImpliedAudience * 0.82);
    } else {
      // Blend monthly listeners with recent catalog momentum
      baseAudience = Math.round(safeAudience * 0.70 + catalogImpliedAudience * 0.30);
    }
  }

  const effectiveAudience = Math.max(baseAudience, safeAudience * 0.68 + hitsAudienceBoost);
  const m = Math.max(0.05, effectiveAudience / 1_000_000);
  const reachM = 0.75 + Math.pow(m, 0.40) * 1.65;
  return Math.round(reachM * 1_000_000);
}

// ============================================================================
// CATALOG-ANALYZING CONTEMPORARY TITLE GENERATOR (PURE RU OR PURE EN — NO MIX)
// ============================================================================

// ArtistNamingProfile now lives in ./titleGen

// Pure Russian & pure English pools — ZERO cross-script characters inside a single entry!
const ONE_WORD_PUNCH_RU = [
  'Кобальт', 'Шёлк', 'Импульс', 'Мираж', 'Турбина', 'Седатив', 'Револьвер',
  'Карантин', 'Фантом', 'Дефицит', 'Силуэт', 'Рикошет', 'Контур', 'Фрагмент',
  'Эйфория', 'Компас', 'Кислород', 'Маятник', 'Орион', 'Вольтаж', 'Синдикат',
  'Бархат', 'Гравитация', 'Лабиринт', 'Спутник', 'Резонанс', 'Триггер', 'Платина'
];

const ONE_WORD_PUNCH_EN = [
  'Kerosene', 'Velvet', 'Mirage', 'Ricochet', 'Voltage', 'Monolith', 'Static',
  'Solstice', 'Vortex', 'Cyanide', 'Phantom', 'Parallax', 'Catalyst', 'Obsidian',
  'Vertigo', 'Mercury', 'Telemetry', 'Cascade', 'Kinetic', 'Silencer', 'Blueprint',
  'Pendulum', 'Silhouette', 'Valhalla', 'Frequency', 'Ozone', 'Overcast', 'Headline'
];

const BRANDS_LUXURY_RU = [
  'Гелик', 'Майбах', 'Порш', 'Картье', 'Беркин', 'ЦУМ', 'Ролекс', 'Прада',
  'Баленсиага', 'Рик Оуэнс', 'Мазерати', 'Патек', 'Боттега', 'Феррари', 'АМГ'
];

const BRANDS_LUXURY_EN = [
  'Balenciaga', 'Chrome Hearts', 'Rick Owens', 'Maison Margiela', 'Bottega',
  'Cartier', 'Patek', 'Porsche 911', 'G63', 'Maybach', 'Moncler', 'AMIRI',
  'Vetements', 'Birkin', 'Loro Piana', 'Miu Miu', 'Rolls-Royce', 'Prada',
  'Tiffany', 'Rimowa', 'Bentley', 'Rolex', 'Ferrari', 'Saint Laurent', 'Arc\'teryx'
];

const CELEBS_CINEMA_RU = [
  'Тарантино', 'Тайсон', 'Месси', 'Ален Делон', 'Брюс Уэйн', 'Скарфейс',
  'Кобейн', 'Джокер', 'Нео', 'Джордан', 'Джеймс Бонд', 'Матрица', 'Готэм',
  'Тони Монтана', 'Скорсезе', 'Кубрик', 'Сенна', 'Пачино', 'Гэтсби', 'Роршах'
];

const CELEBS_CINEMA_EN = [
  'Tarantino', 'Cobain', 'Bowie', 'Al Pacino', 'Scarface', 'Bruce Wayne',
  'Gotham', 'Keanu', 'Matrix', 'Kill Bill', 'Monroe', 'Messi', 'Jordan',
  'Pulp Fiction', 'Miami Vice', 'Don Corleone', 'Blade Runner', 'Tyson',
  'Gatsby', 'Kobe', 'DiCaprio', 'Coppola', 'Frank Ocean', 'Ayrton Senna', 'Kubrick'
];

const SLANG_NIGHTLIFE_RU = [
  'Банкролл', 'Флекс', 'Свага', 'Дрип', 'Аура', 'Глитч', 'Кэш', 'Вне сети',
  'Ночной тариф', 'Фейсконтроль', 'Афтерпати', 'Чек-ин', 'Прайм', 'Демо',
  'Без лимита', 'Овердрайв', 'Режим тишины', 'Фристайл', 'Трафик',
  'Бэкстейдж', 'Прайм-тайм', 'Не в фокусе', 'На повторе', 'Чёрная карта', 'Скрытый режим'
];

const SLANG_NIGHTLIFE_EN = [
  'No Cap', 'Lowkey', 'Highkey', 'Drip', 'Aura', 'Glitch', 'Flex', 'Ghosting',
  'Backstage', 'Afterparty', 'Check-in', 'Overdose', 'Side Quest', 'Main Character',
  'Bankroll', 'Motion', 'Pressure', 'Switch Up', 'Double Cup', 'Cash Out',
  'Off Grid', 'No Signal', 'Prime Time', 'Heavy Rotation', 'On Sight', 'Deadstock', 'VIP Only'
];

const CITIES_PLACES_RU = [
  'Москва-Сити', 'Арбат', 'Сочи', 'Питер', 'Милан', 'Токио', 'Париж',
  'Дубай', 'Бали', 'Монако', 'Берлин', 'Майами', 'Лос-Анджелес',
  'Третье кольцо', 'Шереметьево-2', 'Ордынка', 'Рублёвка', 'Курская', 'Сити'
];

const CITIES_PLACES_EN = [
  'Milano', 'Tokyo', 'Paris', 'SoHo', 'Calabasas', 'Ibiza', 'Tulum', 'Berlin',
  'Monaco', 'Dubai', 'Miami', 'London', 'Beverly Hills', 'Zurich', 'Seoul',
  'Las Vegas', 'Shibuya', 'Sunset Blvd', 'Terminal 4', 'Chelsea Hotel'
];

const REAL_TALK_RU = [
  'не бери трубку', 'удалю твой номер', 'слишком громко', 'холодный кофе', 'чужие окна',
  'опять проспал', 'без фильтров', 'мокрые кроссы', 'не в ресурсе', 'прости за вчера',
  'завтра улечу', 'почти забыл', 'другой район', 'два процента', 'после трёх',
  'не по пути', 'последний рейс', 'ты в сети', 'пишу и стираю', 'на автопилоте',
  'сам по себе', 'не для всех', 'мимо кассы', 'как обычно', 'поздно менять',
  'бизнес-класс', 'окна в пол', 'на заднем сиденье', 'никто не узнает', 'меньше слов',
  'не звони бывшим', 'до утра не сплю', 'всё по плану', 'сменил пароли', 'пустой балкон',
  'платный въезд', 'чёрный список', 'новая симка', 'такси до центра', 'выключи звук',
  'скинь геолокацию', 'два пропущенных', 'увидимся в пятницу', 'сохрани в черновиках',
  'ключи на столе', 'вышел на следующей', 'не для записи', 'сбросил вызов', 'пустой лифт'
];

const REAL_TALK_EN = [
  'missed call', 'read receipts', 'left on read', 'wrong number', 'late checkout',
  'flight mode', 'do not disturb', 'hotel lobby', 'bad timing', 'out of pocket',
  'no service', 'too fast', 'still up', 'different league', 'private jet',
  'tinted windows', 'cash only', 'no witnesses', 'change my number', 'same old story',
  'first class', 'ghost town', 'cold brew', 'backseat', 'last flight', 'burner phone',
  'rent free', 'off the radar', 'zero tolerance', 'midnight call', 'speed dial',
  'wrong exit', 'save the draft', 'two missed calls', 'see you friday', 'noise complaint',
  'elevator music', 'off the clock', 'no receipt', 'voice memo', 'spare key', 'exit only'
];

const DIGITAL_SOUND_RU = [
  'Дорожка 04', 'Таймкод 02:18', 'Перегруз', 'Сырая демка', 'Архив_09', 'Код 404',
  'Сигнал потерян', 'Автотюн в ноль', 'Сабвуфер', 'Белый шум', 'Трекинг', 'Микстейп 25'
];

const DIGITAL_SOUND_EN = [
  'Track 11', 'Tape_09', 'Error 404', 'Clipped Master', 'Raw Stem', 'Vinyl Crackle',
  '808 Therapy', 'Aux Cord', 'B-Side', 'Subwoofer', 'White Noise', 'Mono Mix', 'Freq 432'
];

const COMBO_ADJ_RU = [
  'Холодный', 'Чёрный', 'Последний', 'Двойной', 'Пятый', 'Закрытый', 'Тонкий',
  'Ночной', 'Матовый', 'Серый', 'Быстрый', 'Тихий', 'Дальний', 'Чистый', 'Пустой'
];
const COMBO_NOUN_RU = [
  'курс', 'рейс', 'чек', 'этаж', 'кадр', 'маршрут', 'вызов', 'билет',
  'рубеж', 'круг', 'счёт', 'звонок', 'пароль', 'выбор', 'предел', 'лифт'
];

const COMBO_ADJ_EN = [
  'Cold', 'Matte', 'Quiet', 'Double', 'Late', 'Glass', 'Heavy', 'Clean',
  'Private', 'Second', 'Silver', 'High', 'Blind', 'Static', 'Broken', 'Hollow'
];
const COMBO_NOUN_EN = [
  'Shoulder', 'Circuit', 'Frame', 'Route', 'Stakes', 'Ceiling', 'Crown', 'Receipt',
  'Check', 'Season', 'Signal', 'Horizon', 'Channel', 'Exit', 'Tribute', 'Currency'
];

const ALBUM_TITLES_RU = [
  'Прайм-тайм', 'Личный архив', 'Без сценария', 'Чёрный список', 'Новая эра',
  'Афтерпати', 'Трасса М11', 'Ночной Дневник', 'Кэш и Карма', 'Вне доступа',
  'Глава третья', 'Сезон охоты', 'Частный борт', 'Не для прессы', 'Детокс',
  'Громче всех', 'Бизнес-зал', 'Код 404', 'Поздний выезд', 'Хроника 25',
  'Обратный билет', 'Вторая смена', 'Точка невозврата', 'Сигналы города', 'Тихий океан'
];

const ALBUM_TITLES_EN = [
  'PRIME ERA', 'NO DAYS OFF', 'LATE CHECKOUT', 'PRIVATE JET', 'ARCHIVE 25',
  'CHROME SEASON', 'AFTERHOURS', 'BLACK CARD', 'LOST TAPES', 'GOTHAM NIGHTS',
  'OUT OF SERVICE', 'OVERDRIVE', 'MAIN CHARACTER', 'DEADSTOCK', 'BURNER PHONE',
  'FLIGHT MODE', 'NO SIGNAL', 'VIP ONLY', 'HOTEL LOBBY', 'DELUXE EDITION',
  'SECOND NATURE', 'GLASS HOUSE', 'COLD SHOULDER', 'ZERO TOLERANCE', 'NIGHT SHIFT'
];

const SNIPPET_TEASERS = [
  'Короткий отрывок с ночной студийной сессии — плотный бас и цепляющий припев.',
  'Артист показал демо-фрагмент нового звука в соцсетях — фанаты ждут дату выхода.',
  'Тизер грядущего релиза: смена флоу и атмосферный продакшн.',
  'Эксклюзивное превью с закрытого прослушивания — потенциальный хит чартов.',
  'Кусочек куплета без анонса — аудитория активно строит теории о возможном фите.'
];

// TitleMood now lives in ./titleGen (re-exported at the top of this file)

const ABSURD_RU = ['Утка в кроссовках', 'Сломанный утюг', 'Медведь на рейве', 'Пластиковый дождь', 'Космический бомж', 'Сырный замок', 'Летающий тапочек', 'Зелёный слон'];
const ABSURD_EN = ['Plastic Duck', 'Broken Toaster', 'Raving Bear', 'Cosmic Hobo', 'Cheese Castle', 'Flying Slipper', 'Neon Garbage'];

const CONCEPTUAL_RU = ['Манифест 01', 'Метафизика', 'Теория струн', 'Абстрактный ноль', 'Пост-ирония', 'Институциональный кризис', 'Деконструкция'];
const CONCEPTUAL_EN = ['Manifesto 01', 'Metaphysics', 'String Theory', 'Abstract Zero', 'Post Irony', 'Institutional Crisis', 'Deconstruction'];

const RAP_RU = ['Прайм рэп', 'Уличный стиль', 'Флоу 99', 'Четыре четверти', 'Бит и бас', 'Чистый рэп', 'Рифмы и панчи'];
const RAP_EN = ['Prime Rap', 'Street Flow', 'Four Quarters', 'Beat & Bass', 'Pure Rap', 'Rhymes & Punches', 'Ghetto Gospel'];

const TRAP_RU = ['Трэп дом', 'Грязный бас', 'Дрифт', 'Уличный свет', 'Москит', 'Ганг', 'Джамп', 'Флекс'];
const TRAP_EN = ['Trap House', 'Dirty Bass', 'Drift Mode', 'Street Lights', 'Mosquito', 'Gang Shit', 'Jump Out', 'Flex Season'];

const SAD_RU = ['Грустный день', 'Дождь на щеках', 'Пустота', 'Холодный ветер', 'Одиночество', 'Слёзы под дождём', 'Обида'];
const SAD_EN = ['Sad Day', 'Rain On My Face', 'Empty Room', 'Cold Wind', 'Loneliness', 'Tears In Rain', 'Heartache'];


const FASHION_LUXURY_RU = [
  'Маржела', 'Рик Оуэнс', 'Хром Хартс', 'Баленсиага', 'Боттега', 'Ветеман', 'Майбах', 'Картье', 'Порш', 'ЦУМ', 'Прада',
  'Баленсиага ботинки', 'Очки Боттега', 'Ле Парфюм', 'Рик Оуэнс куртка', 'Диор', 'ИфСиксВасНайн', 'Кристиан Поэлл', 'Номер Найн'
];

const FASHION_LUXURY_EN = [
  'IfSixWasNine', 'Margiela', 'Dior', 'Christian Poell', 'Number Nine', 'Balenciaga Boots', 'Maison Margiela Type',
  'Bottega Veneta Glasses', 'Le Parfume On Me', 'Rick Owens', 'Chrome Hearts', 'Vetements', 'Y/Project',
  'Junya Watanabe', 'Ann Demeulemeester', 'Loro Piana', 'Moncler', 'Arc\'teryx', 'Rick Owens Geobasket'
];

const STATUS_MONEY_RU = [
  'Деньги', 'Кэш', 'Рэкс', 'Свага', 'Дорого', 'Дорогой', 'Большой', 'Сука', 'Сучка', 'Тачки',
  'Миллионы', 'Банк', 'Золото', 'Цепи', 'Бриллианты', 'Большие деньги', 'Крупный кэш', 'Рэки', 'Кэш аут'
];

const STATUS_MONEY_EN = [
  'Racks', 'Money', 'Cash', 'Swag', 'Rich', 'Big', 'Benz', 'Rolls', 'Stacks', 'Chains', 'Drip',
  'Millions', 'Bank', 'Gold', 'Ice', 'Platinum', 'Big Money', 'Cash Out', 'Rich Forever', 'Heavy Racks'
];

const RELATIONS_RU = [
  'Токсик', 'Обида', 'Люблю', 'Любовь', 'Не люблю', 'Слёзы', 'Ревность', 'Похуй', 'Боль',
  'Не пара', 'Вместе', 'Верность', 'Холод', 'Равнодушие', 'Драма', 'Без любви', 'Ревную', 'Прости'
];

const RELATIONS_EN = [
  'Toxic', 'Jealous', 'Hate', 'Broken', 'Stay With Me', 'Fance', 'Tears', 'Lie', 'Ghost', 'Alone',
  'Drama', 'Miss U', 'Bad Love', 'No Love', 'Heartbreak', 'Stay', 'Fake Love', 'Cold Heart'
];

const VIBE_MOOD_RU = [
  'Грусть', 'Счастье', 'Слёзы', 'Смешной', 'Тёмный', 'Чилл', 'Агрессивный', 'Ностальгия', 'Медленно', 'Холодно', 'Вайб'
];

const VIBE_MOOD_EN = [
  'Sad', 'Happy', 'Tears', 'Funny', 'Dark', 'Chill', 'Aggressive', 'Nostalgic', 'Blue Hour', 'Slow Motion', 'Vibe'
];

const NUMBERS_TITLES_RU = [
  'Пять', 'Семь', 'Восемь раз', 'Седьмая попытка', 'Три ночи', 'Ноль', 'Один', 'Второй шанс', 'Пятый элемент', 'Восьмой день'
];

const NUMBERS_TITLES_EN = [
  'Seven', 'Five', 'Le Four', '3AM', '24/7', 'Seven Days', 'Five Times', '999', 'Zero', 'One More', 'Eight Times', '7th Attempt'
];

const CARS_WEAPONS_ICONS_RU = [
  'АМГ', 'Бэнтли', 'Мерседес', 'Гелик', 'Эскалейд', 'Порше', 'Майбах', 'Глок19', 'Калаш', 'М4А1', 'Узи',
  'Онлифанс', 'Кока Кола', 'Рэдиссон', 'ЭйрБиЭнБи', 'Шато Мармон', 'Ритц', 'Моэт', 'Дом Периньон', 'Мальборо', 'Картье'
];

const CARS_WEAPONS_ICONS_EN = [
  'AMG', 'Bentley', 'Mercedes', 'G63', 'Escalade', 'Porsche', 'Maybach', 'Glock19', 'Kalash', 'M4A1', 'Uzi',
  'OnlyFans', 'Coca Cola', 'Reddison', 'AirBNB', 'Chateau Marmont', 'Ritz', 'Moet', 'Dom Perignon', 'Marlboro', 'Cartier'
];

const BODY_DARK_RU = [
  'Дырка', 'Передоз', 'Гной', 'Таблетки', 'Кровь', 'Монстр', 'Тень', 'Призрак', 'Кости', 'Иголки',
  'Шрамы', 'Боль', 'Убийство', 'Страх', 'Вампир', 'Патология', 'Психоз'
];

const BODY_DARK_EN = [
  'Shit', 'Ugly', 'Fuck', 'Pain', 'Blood', 'Kill', 'Idols', 'Monster', 'Vampire', 'Overdose',
  'Broken', 'Scars', 'Needles', 'Bones', 'Shadow', 'Ghost', 'Fear', 'Psychosis'
];

const MYSTIC_LONG_RU = [
  'Демон внутри моей тени', 'Ангел плачет на закате', 'Пустота внутри моих карманов',
  'Падаю в тёмный океан без дна', 'Я построил себя заново из пепла', 'Святой среди грешников', 'Призраки ночного города'
];

const MYSTIC_LONG_EN = [
  'Im a rascal surfer in a ocean of blood', 'You broke me down I built myself up',
  'AW02 angel cry', 'Demon inside my shadow', 'Walking through the valley of chrome',
  'No soul left in the system', 'Ghosts in the machine'
];

const FASHION_AESTHETICS_RU = [
  'Париж', 'Токио', 'Милан', 'Берлин', '4 утра', 'Полночь', 'Закат', 'Подиум', 'Бархат', 'Шёлк', 'Хром', 'Неон', 'Арбат'
];

const FASHION_AESTHETICS_EN = [
  'Paris', 'Tokyo', 'Milan', 'Berlin', '4AM', 'Midnight', 'Sunset', 'Runway', 'Velvet', 'Silk', 'Chrome', 'Neon', 'Shibuya', 'SoHo'
];

function hasMixedScripts(s: string): boolean {
  return /[a-zA-Z]/.test(s) && /[а-яА-ЯёЁ]/.test(s);
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildDynamicPatternTitle(lang: 'ru' | 'en', isAlbum: boolean): string {
  if (lang === 'en') {
    const adj = pickFrom(COMBO_ADJ_EN);
    const noun = pickFrom(COMBO_NOUN_EN);
    return Math.random() < 0.5 ? noun : `${adj} ${noun}`;
  } else {
    const adj = pickFrom(COMBO_ADJ_RU);
    const noun = pickFrom(COMBO_NOUN_RU);
    return Math.random() < 0.5 ? noun : `${adj} ${noun}`;
  }
}

function applyNaturalCasing(str: string, casingWeights: { normal: number; lower: number; upper: number; title: number }, skipRandom = false): string {
  if (!str) return '';
  const roll = Math.random();
  if (skipRandom || roll < casingWeights.normal) return str;
  if (roll < casingWeights.normal + casingWeights.lower) return str.toLowerCase();
  if (roll < casingWeights.normal + casingWeights.lower + casingWeights.upper) return str.toUpperCase();
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// analyzeArtistNamingStyle / generateModernTitle now live in ./titleGen (v2 generator)

// ============================================================================
// FAST O(N + M) CATALOG INDEX & ANALYTICS ENGINE
// ============================================================================

export interface ArtistTierInfo {
  id: string;
  label: string;
  shortLabel: string;
  badgeClass: string;
}

export function getArtistFollowerTier(followers: number | undefined | null): ArtistTierInfo {
  const f = Math.max(0, typeof followers === 'number' && !isNaN(followers) ? followers : 0);
  if (f >= 15_000_000) {
    return {
      id: 'superstar',
      label: 'Мировая суперзвезда (15M+)',
      shortLabel: 'Суперзвезда',
      badgeClass: 'text-amber-200 bg-amber-500/15 border-amber-400/30'
    };
  }
  if (f >= 8_000_000) {
    return {
      id: 'mega',
      label: 'Мега-топ артист (8M–15M)',
      shortLabel: 'Мега-топ',
      badgeClass: 'text-amber-300 bg-amber-500/10 border-amber-400/25'
    };
  }
  if (f >= 5_000_000) {
    return {
      id: 'stadium',
      label: 'Звезда первой величины (5M–8M)',
      shortLabel: 'Хитмейкер',
      badgeClass: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-400/25'
    };
  }
  if (f >= 2_500_000) {
    return {
      id: 'large',
      label: 'Крупный артист (2.5M–5M)',
      shortLabel: 'Крупный',
      badgeClass: 'text-violet-300 bg-violet-500/10 border-violet-400/25'
    };
  }
  if (f >= 1_200_000) {
    return {
      id: 'established',
      label: 'Популярный артист (1.2M–2.5M)',
      shortLabel: 'Популярный',
      badgeClass: 'text-blue-300 bg-blue-500/10 border-blue-400/25'
    };
  }
  if (f >= 500_000) {
    return {
      id: 'mid',
      label: 'Крепкий средний уровень (500к–1.2M)',
      shortLabel: 'Крепкий мидл',
      badgeClass: 'text-sky-300 bg-sky-500/10 border-sky-400/25'
    };
  }
  if (f >= 200_000) {
    return {
      id: 'rising',
      label: 'Растущее имя (200к–500к)',
      shortLabel: 'На подъёме',
      badgeClass: 'text-teal-300 bg-teal-500/10 border-teal-400/25'
    };
  }
  if (f >= 75_000) {
    return {
      id: 'freshman',
      label: 'Фрешмен / Прорыв (75к–200к)',
      shortLabel: 'Фрешмен',
      badgeClass: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/25'
    };
  }
  if (f >= 15_000) {
    return {
      id: 'indie',
      label: 'Андерграунд / Инди (15к–75к)',
      shortLabel: 'Андерграунд',
      badgeClass: 'text-zinc-300 bg-zinc-800 border-white/10'
    };
  }
  if (f > 0) {
    return {
      id: 'emerging',
      label: 'Начинающий артист (до 15к)',
      shortLabel: 'Новичок',
      badgeClass: 'text-zinc-400 bg-zinc-900 border-white/10'
    };
  }
  return {
    id: 'dormant',
    label: 'Без аудитории (0 слушателей)',
    shortLabel: 'Без аудитории',
    badgeClass: 'text-zinc-500 bg-zinc-900/60 border-white/5'
  };
}

export interface ArtistSimMetrics {
  artist: Artist;
  hype: number;
  organicHype?: number;
  hypeParts?: Array<[string, number]>;
  lastDropDate: string | null;
  lastAlbumDate: string | null;
  lastFeatDate: string | null;
  daysSilent: number;
  daysSilentOverall: number;
  daysSinceFeat: number | null;
  daysSinceAlbum: number | null;
  hasReleasedAlbum: boolean;
  recentCollabPartners: string[];
  activeSnippet: Track | null;
  avgQuality: number;
  topHitsCount: number;
  catalogAvgPlays: number;
  totalPlays: number;
  tracksCount: number;
  albumsCount: number;
  predictedTrackPlays: number;
  predictedAlbumPlays: number;
  readinessScore: number;
  fanExpectation: string;
  dropReasons: string[];
  recommendedFormat: string;
  tier: 'mega' | 'large' | 'mid' | 'rising';
  tierInfo: ArtistTierInfo;
  namingProfile: ArtistNamingProfile;
}

interface CatalogIndex {
  tracksByArtist: Map<string, Track[]>;
  albumsByArtist: Map<string, Album[]>;
  featTracksByArtistName: Map<string, Track[]>;
  coAlbumsByArtistName: Map<string, Album[]>;
  albumById: Map<string, Album>;
}

function buildCatalogIndex(tracks: Track[], albums: Album[], currentDate: string): CatalogIndex {
  const tracksByArtist = new Map<string, Track[]>();
  const albumsByArtist = new Map<string, Album[]>();
  const featTracksByArtistName = new Map<string, Track[]>();
  const coAlbumsByArtistName = new Map<string, Album[]>();
  const albumById = new Map<string, Album>();

  const pushTrack = (key: string, t: Track) => {
    if (!key) return;
    let arr = tracksByArtist.get(key);
    if (!arr) {
      arr = [];
      tracksByArtist.set(key, arr);
    }
    arr.push(t);
  };

  const pushAlbum = (key: string, al: Album) => {
    if (!key) return;
    let arr = albumsByArtist.get(key);
    if (!arr) {
      arr = [];
      albumsByArtist.set(key, arr);
    }
    arr.push(al);
  };

  const pushFeatTrack = (key: string, t: Track) => {
    if (!key) return;
    let arr = featTracksByArtistName.get(key);
    if (!arr) {
      arr = [];
      featTracksByArtistName.set(key, arr);
    }
    arr.push(t);
  };

  const pushCoAlbum = (key: string, al: Album) => {
    if (!key) return;
    let arr = coAlbumsByArtistName.get(key);
    if (!arr) {
      arr = [];
      coAlbumsByArtistName.set(key, arr);
    }
    arr.push(al);
  };

  for (let i = 0; i < albums.length; i++) {
    const al = albums[i];
    const rel = al.releaseDate || `${al.releaseYear || 2020}-01-01`;
    if (rel > currentDate) continue;
    albumById.set(al.id, al);
    if (al.artistId) pushAlbum(`id:${al.artistId}`, al);
    if (al.artistName) pushAlbum(`nm:${al.artistName.toLowerCase().trim()}`, al);
    if (al.coArtist) {
      splitFeaturedList(al.coArtist, al.artistName).forEach(nm => {
        pushCoAlbum(nm.toLowerCase().trim(), al);
      });
    }
  }

  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    if ((t.releaseDate || '1900-01-01') > currentDate) continue;
    if (t.artistId) pushTrack(`id:${t.artistId}`, t);
    if (t.artistName) pushTrack(`nm:${t.artistName.toLowerCase().trim()}`, t);
    if (t.featuredArtist) {
      splitFeaturedList(t.featuredArtist, t.artistName).forEach(nm => {
        pushFeatTrack(nm.toLowerCase().trim(), t);
      });
    }
  }

  return { tracksByArtist, albumsByArtist, featTracksByArtistName, coAlbumsByArtistName, albumById };
}

function getArtistBucketFromIndex(artist: Artist, index: CatalogIndex) {
  const lowerName = artist.name.toLowerCase().trim();
  const byIdT = index.tracksByArtist.get(`id:${artist.id}`) || [];
  const byNmT = index.tracksByArtist.get(`nm:${lowerName}`) || [];
  const myTracks = byIdT.length >= byNmT.length ? byIdT : byNmT;

  const byIdA = index.albumsByArtist.get(`id:${artist.id}`) || [];
  const byNmA = index.albumsByArtist.get(`nm:${lowerName}`) || [];
  const primaryAlbums = byIdA.length >= byNmA.length ? byIdA : byNmA;
  const coAlbums = index.coAlbumsByArtistName.get(lowerName) || [];
  const myAlbums = coAlbums.length > 0 ? [...primaryAlbums, ...coAlbums] : primaryAlbums;

  const myFeatTracks = index.featTracksByArtistName.get(lowerName) || [];

  return { myTracks, myAlbums, myFeatTracks, albumById: index.albumById };
}

function computeArtistMetricsFast(
  artist: Artist,
  myTracks: Track[],
  myAlbums: Album[],
  currentDate: string,
  myFeatTracks: Track[] = [],
  albumById?: Map<string, Album>
): ArtistSimMetrics {
  const followers = Math.max(25_000, artist.followers || 200_000);

  let lastDropDate: string | null = null;
  let lastAlbumDate: string | null = null;
  let lastFeatDate: string | null = null;
  let activeSnippet: Track | null = null;
  let scoreSum = 0;
  let scoreCnt = 0;
  let topHitsCount = 0;

  let playsSum = 0;
  let playsCnt = 0;
  const albumTrackSums = new Map<string, { sum: number; count: number }>();
  const releasedNonSnippets: Track[] = [];
  const collabNamesSet = new Set<string>();

  for (let i = 0; i < myTracks.length; i++) {
    const t = myTracks[i];
    if (t.releaseDate && (!lastDropDate || t.releaseDate > lastDropDate)) {
      lastDropDate = t.releaseDate;
    }
    if (t.featuredArtist) {
      splitFeaturedList(t.featuredArtist, artist.name).forEach(nm => collabNamesSet.add(nm.toLowerCase()));
    }
    if (t.albumId && t.albumId !== 'single' && albumById) {
      const linkedAlbum = albumById.get(t.albumId);
      if (linkedAlbum) {
        const linkedRel = linkedAlbum.releaseDate || `${linkedAlbum.releaseYear || 2020}-01-01`;
        if (linkedRel <= currentDate && (!lastAlbumDate || linkedRel > lastAlbumDate)) {
          lastAlbumDate = linkedRel;
        }
      }
    }
    if (t.isSnippet && t.releaseDate) {
      const age = diffDaysISO(t.releaseDate, currentDate);
      if (age >= 0 && age <= 28) activeSnippet = t;
    }
    const s = t.rating?.totalScore ?? t.intrinsicQuality;
    if (s) {
      scoreSum += s;
      scoreCnt++;
    }
    if (!t.isSnippet) {
      const p = t.plays || 0;
      if (p >= Math.min(5_000_000, Math.max(2_500_000, followers * 0.8)) || (t.rating?.totalScore || 0) >= 74) {
        topHitsCount++;
      }
      if (p > 0) {
        playsSum += p;
        playsCnt++;
        releasedNonSnippets.push(t);
        if (t.albumId && t.albumId !== 'single') {
          const prev = albumTrackSums.get(t.albumId) || { sum: 0, count: 0 };
          prev.sum += p;
          prev.count += 1;
          albumTrackSums.set(t.albumId, prev);
        }
      }
    }
  }

  for (let i = 0; i < myAlbums.length; i++) {
    const al = myAlbums[i];
    const rel = al.releaseDate || `${al.releaseYear || 2020}-01-01`;
    if (rel > currentDate) continue;
    if (!lastDropDate || rel > lastDropDate) lastDropDate = rel;
    if (!lastAlbumDate || rel > lastAlbumDate) lastAlbumDate = rel;
    if (al.coArtist) {
      splitFeaturedList(al.coArtist, artist.name).forEach(nm => collabNamesSet.add(nm.toLowerCase()));
    }
    if (al.rating?.totalScore) {
      scoreSum += al.rating.totalScore;
      scoreCnt++;
    }
  }

  for (let i = 0; i < myFeatTracks.length; i++) {
    const ft = myFeatTracks[i];
    if (ft.releaseDate && ft.releaseDate <= currentDate) {
      if (!lastFeatDate || ft.releaseDate > lastFeatDate) lastFeatDate = ft.releaseDate;
    }
    if (ft.artistName) collabNamesSet.add(ft.artistName.toLowerCase().trim());
  }

  // Recent tracks average (latest up to 5 tracks)
  let recentTrackAvg = 0;
  if (releasedNonSnippets.length > 0) {
    const sortedRecent =
      releasedNonSnippets.length <= 5
        ? releasedNonSnippets
        : [...releasedNonSnippets].sort((a, b) => (b.releaseDate || '1900-01-01').localeCompare(a.releaseDate || '1900-01-01')).slice(0, 5);
    recentTrackAvg = sortedRecent.reduce((acc, t) => acc + (t.plays || 0), 0) / sortedRecent.length;
  }

  // Recent albums per-track average (latest up to 2 albums)
  let recentAlbumPerTrackAvg = 0;
  if (myAlbums.length > 0) {
    const sortedAlbums = [...myAlbums]
      .sort((a, b) => {
        const da = a.releaseDate || `${a.releaseYear || 2020}-01-01`;
        const db = b.releaseDate || `${b.releaseYear || 2020}-01-01`;
        return db.localeCompare(da);
      })
      .slice(0, 2);
    let albUnitSum = 0;
    let albUnitCnt = 0;
    for (const al of sortedAlbums) {
      const trStats = albumTrackSums.get(al.id);
      if (trStats && trStats.count > 0) {
        albUnitSum += trStats.sum / trStats.count;
        albUnitCnt++;
      } else if (al.totalPlays && al.totalPlays > 0) {
        albUnitSum += al.totalPlays / 11;
        albUnitCnt++;
      }
    }
    if (albUnitCnt > 0) recentAlbumPerTrackAvg = albUnitSum / albUnitCnt;
  }

  const overallTrackAvg = playsCnt > 0 ? playsSum / playsCnt : 0;

  let weightedCatalogSum = 0;
  let weightedCatalogWeight = 0;
  if (recentTrackAvg > 0) {
    weightedCatalogSum += recentTrackAvg * 0.50;
    weightedCatalogWeight += 0.50;
  }
  if (recentAlbumPerTrackAvg > 0) {
    weightedCatalogSum += recentAlbumPerTrackAvg * 1.25 * 0.25;
    weightedCatalogWeight += 0.25;
  }
  if (overallTrackAvg > 0) {
    weightedCatalogSum += overallTrackAvg * 0.25;
    weightedCatalogWeight += 0.25;
  }
  const catalogAvgPlays = weightedCatalogWeight > 0 ? Math.round(weightedCatalogSum / weightedCatalogWeight) : 0;

  // Tier is strictly calculated from actual monthly listeners (artist.followers) as requested by user
  const realFollowers = typeof artist.followers === 'number' && !isNaN(artist.followers) ? Math.max(0, artist.followers) : 0;
  const tierInfo = getArtistFollowerTier(realFollowers);
  const tier: ArtistSimMetrics['tier'] =
    realFollowers >= 8_000_000
      ? 'mega'
      : realFollowers >= 2_500_000
        ? 'large'
        : realFollowers >= 300_000
          ? 'mid'
          : 'rising';

  const daysSilent = lastDropDate ? Math.max(0, diffDaysISO(lastDropDate, currentDate)) : 95;
  const daysSinceFeat = lastFeatDate ? Math.max(0, diffDaysISO(lastFeatDate, currentDate)) : null;
  const daysSilentOverall =
    daysSinceFeat !== null ? Math.min(daysSilent, daysSinceFeat) : daysSilent;
  const daysSinceAlbum = lastAlbumDate ? Math.max(0, diffDaysISO(lastAlbumDate, currentDate)) : null;
  const hasReleasedAlbum = myAlbums.length > 0 || lastAlbumDate !== null;
  const avgQuality = scoreCnt > 0 ? Math.round(scoreSum / scoreCnt) : 68;

  // --- Hype v2: organic buzz from real events + your manual bias (± on the radar) ---
  // Hype only shapes the start of a release a little; plays still come mostly from audience, quality and hits.
  const hypeParts: Array<[string, number]> = [];
  const addPart = (label: string, v: number) => { const r = Math.round(v); if (r !== 0) hypeParts.push([label, r]); return v; };
  let organic = 14;
  organic += addPart('Размер аудитории', Math.min(30, Math.log10(Math.max(1000, realFollowers)) * 4.4 - 8));
  if (artist.isRisingStar) organic += addPart('Восходящая звезда', 9);
  if (artist.verified) organic += addPart('Подтверждённый артист', 2);
  // fresh drop: strong buzz that fades smoothly
  if (lastDropDate) organic += addPart('Свежий релиз', 17 * Math.exp(-daysSilent / 26));
  // long silence: buzz cools down (fans may still wait, see expectation on the radar)
  if (daysSilent > 110) organic += addPart('Долгая тишина', -Math.min(15, (daysSilent - 110) / 18));
  // momentum: how the last 45 days performed vs the usual level of the artist
  let recentPlays = 0; let recentCount = 0;
  for (let i = 0; i < myTracks.length; i++) {
    const t = myTracks[i];
    if (!t.releaseDate || t.isSnippet) continue;
    const d = diffDaysISO(t.releaseDate, currentDate);
    if (d >= 0 && d <= 45) { recentPlays += t.plays || 0; recentCount++; }
  }
  if (recentCount > 0 && catalogAvgPlays > 0) {
    const ratio = recentPlays / recentCount / catalogAvgPlays;
    organic += addPart(ratio >= 1 ? 'Релизы заходят лучше обычного' : 'Релизы ниже обычного', clamp(Math.log2(Math.max(0.25, ratio)) * 7, -8, 14));
  }
  if (activeSnippet) {
    const sAge = activeSnippet.releaseDate ? Math.max(0, diffDaysISO(activeSnippet.releaseDate, currentDate)) : 0;
    organic += addPart('Прогрев сниппетом', 10 * Math.exp(-sAge / 40));
  }
  if (daysSinceFeat !== null && daysSinceFeat <= 30) organic += addPart('Свежий фит', 5 * (1 - daysSinceFeat / 30));
  if (daysSinceAlbum !== null && daysSinceAlbum <= 35) organic += addPart('Неделя альбома', 9 * (1 - daysSinceAlbum / 35));
  if (avgQuality >= 78) organic += addPart('Высокие оценки', 6);
  else if (avgQuality >= 68) organic += addPart('Хорошие оценки', 3);
  else if (avgQuality < 55) organic += addPart('Слабые оценки', -4);
  if (topHitsCount > 0) organic += addPart('Хиты в каталоге', Math.min(8, Math.sqrt(topHitsCount) * 2.2));
  const organicHype = clamp(Math.round(organic), 8, 96);
  let hype: number;
  if (typeof artist.hype === 'number' && !isNaN(artist.hype)) {
    // manual bias is strong, but real events still move the hype
    hype = clamp(Math.round(artist.hype * 0.7 + organicHype * 0.3), 5, 99);
    hypeParts.push(['Ручная настройка', Math.round((artist.hype - organicHype) * 0.7)]);
  } else {
    hype = organicHype;
  }

  const compressedReach = getCompressedReach(realFollowers, topHitsCount, catalogAvgPlays);
  const qualityMult = 0.84 + ((avgQuality - 50) / 45) * 0.36;
  const hypeMult = 0.90 + (hype / 100) * 0.22;
  const warmupMult = activeSnippet ? 1.18 : 1.0;

  // Grounded Week-1 debut estimate matching forecastReleasePlays sublinear scaling
  const predictedTrackPlays = Math.round(
    Math.max(550_000, compressedReach * qualityMult * hypeMult * warmupMult)
  );
  const predictedAlbumPlays = Math.round(
    Math.max(5_200_000, compressedReach * 0.90 * Math.pow(12, 0.85) * qualityMult * hypeMult * warmupMult)
  );

  const tierPenalty = tier === 'mega' ? -22 : tier === 'large' ? -11 : tier === 'mid' ? 0 : 10;
  const cooldownPenalty =
    tier === 'mega' && daysSilent < 35 && !activeSnippet
      ? -32
      : tier === 'large' && daysSilent < 24 && !activeSnippet
        ? -20
        : 0;

  const rawReadiness =
    Math.min(100, daysSilent) * 0.62 +
    hype * 0.34 +
    (activeSnippet ? 28 : 0) +
    (artist.isRisingStar ? 10 : 0) +
    tierPenalty +
    cooldownPenalty;
  const readinessScore = clamp(Math.round(rawReadiness), 8, 99);

  // Realistic fan expectations anchored to TRUE album date (null-safe, zero fake 400d!)
  let fanExpectation = 'Стабильный сольный сингл';
  if (activeSnippet) {
    fanExpectation = `Ждут полный релиз сниппета «${activeSnippet.title}»`;
  } else if (daysSinceAlbum === null) {
    if (releasedNonSnippets.length >= 4 && daysSilent >= 35) {
      fanExpectation = 'У артиста ещё не было альбома — аудитория созрела для дебютного альбома или EP';
    } else {
      fanExpectation = 'Старт дискографии — лучше закрепить внимание серией синглов или ярким фитом';
    }
  } else if (daysSinceAlbum < 180) {
    if (daysSilent <= 18) {
      fanExpectation = 'Альбом ещё свежий — уместны клип, ремикс или короткий сниппет';
    } else if (daysSilent >= 55) {
      fanExpectation = 'После прошлого альбома прошло немного времени — логичнее сингл или EP';
    } else {
      fanExpectation = 'Фанаты пока не ждут новый альбом — лучше свежий сингл или фит';
    }
  } else if (daysSinceAlbum < 260) {
    if (daysSilent >= 75) {
      fanExpectation = 'Долгая пауза — можно вернуться с громким синглом или компактным EP';
    } else {
      fanExpectation = hype >= 74 ? 'Удачный момент для сильного сингла или гостевого фита' : 'Подходящее окно для нового трека';
    }
  } else if (daysSinceAlbum >= 340 && daysSilent >= 45) {
    fanExpectation = `Прошло ${daysSinceAlbum} дн. без пластинки — аудитория ждёт большой альбом`;
  } else if (daysSilent >= 90) {
    fanExpectation = 'Долгая тишина — высокий запрос на крупный релиз или альбом';
  } else if (daysSilent <= 16 && hype >= 70) {
    fanExpectation = 'Недавно был релиз — лучше выпустить сниппет или гостевой фит';
  } else if (tier === 'rising' || artist.isRisingStar) {
    fanExpectation = 'На волне роста — ждут яркий сингл или коллаборацию';
  } else if (hype >= 80) {
    fanExpectation = 'Пик внимания — сингл с фитом быстро залетит в топ чарта';
  }

  const namingProfile = analyzeArtistNamingStyle(artist, myTracks, myAlbums);

  const dropReasons: string[] = [];
  if (activeSnippet) {
    dropReasons.push(`Есть активный сниппет «${activeSnippet.title}» — аудитория ждёт полную версию`);
  }
  if (daysSinceAlbum === null) {
    if (releasedNonSnippets.length >= 4) {
      dropReasons.push('Альбомов в базе ещё не было — накоплено достаточно треков для дебютной пластинки');
    } else {
      dropReasons.push('Пока только первые синглы — самое время раскачивать охват новыми треками');
    }
  } else if (daysSinceAlbum >= 300) {
    dropReasons.push(`Без альбома уже ${daysSinceAlbum} дн. — накоплен высокий спрос на крупный релиз`);
  } else if (daysSinceAlbum >= 180) {
    dropReasons.push(`${daysSinceAlbum} дн. с прошлого альбома — окно для EP или мощного сингла`);
  } else if (daysSinceAlbum < 120) {
    dropReasons.push(`Свежий альбом (${daysSinceAlbum} дн. назад) — лучше поддерживать интерес синглами`);
  }

  if (daysSilent >= 60) {
    if (daysSilentOverall < daysSilent - 5) {
      dropReasons.push(
        `Без сольного релиза ${daysSilent} дн., но ${daysSilentOverall} дн. назад был гостевой фит — аудитория тёплая для своего дропа`
      );
    } else {
      dropReasons.push(`Длительная пауза ${daysSilent} дн. вообще без дропов — камбэк соберёт повышенное внимание`);
    }
  } else if (daysSilent <= 14) {
    dropReasons.push(`Недавний свой релиз (${daysSilent} дн. назад) — высокий импульс, но сингл может конкурировать с прошлым`);
  }

  if (hype >= 78) {
    dropReasons.push(`Высокий текущий хайп (${hype}/100) — благоприятный момент для максимизации дебюта`);
  } else if (hype < 45 && !activeSnippet) {
    dropReasons.push(`Низкий хайп (${hype}/100) — стоит разогреть публику сниппетом или сильным фитом`);
  }

  if (topHitsCount >= 3) {
    dropReasons.push(`Сильная база хитов (${topHitsCount}) обеспечивает высокий органический охват`);
  } else if (tier === 'rising' || artist.isRisingStar) {
    dropReasons.push('Растущая фан-база — регулярные синглы и удачный фит быстро ускорят рост');
  }

  if (dropReasons.length === 0) {
    dropReasons.push('Ровный рабочий цикл без перегрева — комфортный момент для нового трека');
  }

  let recommendedFormat = 'Сольный сингл';
  if (activeSnippet) recommendedFormat = 'Полный релиз сниппета';
  else if (daysSinceAlbum === null && releasedNonSnippets.length >= 4 && daysSilent >= 35) recommendedFormat = 'Дебютный альбом / EP';
  else if (daysSinceAlbum !== null && daysSinceAlbum >= 300 && daysSilent >= 35) recommendedFormat = 'Большой альбом';
  else if (daysSinceAlbum !== null && daysSinceAlbum >= 190 && daysSilent >= 45) recommendedFormat = 'EP или сильный сингл';
  else if (daysSilent <= 16) recommendedFormat = 'Сниппет-прогрев или гостевой фит';
  else if (hype < 52) recommendedFormat = 'Сингл с фитом / Сниппет';
  else if (hype >= 78) recommendedFormat = 'Громкий сингл / Коллаб';

  return {
    artist,
    hype,
    organicHype,
    hypeParts,
    lastDropDate,
    lastAlbumDate,
    lastFeatDate,
    daysSilent,
    daysSilentOverall,
    daysSinceFeat,
    daysSinceAlbum,
    hasReleasedAlbum,
    recentCollabPartners: Array.from(collabNamesSet),
    activeSnippet,
    avgQuality,
    topHitsCount,
    catalogAvgPlays,
    totalPlays: Math.round(playsSum),
    tracksCount: releasedNonSnippets.length,
    albumsCount: myAlbums.length,
    predictedTrackPlays,
    predictedAlbumPlays,
    readinessScore,
    fanExpectation,
    dropReasons: dropReasons.slice(0, 3),
    recommendedFormat,
    tier,
    tierInfo,
    namingProfile
  };
}

export function computeAllArtistMetrics(
  artists: Artist[],
  tracks: Track[],
  albums: Album[],
  currentDate: string
): ArtistSimMetrics[] {
  const index = buildCatalogIndex(tracks, albums, currentDate);
  return artists.map(art => {
    const { myTracks, myAlbums, myFeatTracks, albumById } = getArtistBucketFromIndex(art, index);
    return computeArtistMetricsFast(art, myTracks, myAlbums, currentDate, myFeatTracks, albumById);
  });
}

export interface PromoStrategySpec {
  label: string;
  shortLabel: string;
  hint: string;
  startMult: number;
  growthMult: number;
  longevityMult: number;
  viralBonus: number;
  hypeDelta: number;
}

export const RELEASE_PROMO_LABELS: Record<ReleasePromoStrategy, PromoStrategySpec> = {
  quiet: {
    label: 'Тихий / Андерграунд',
    shortLabel: 'Тихий',
    hint: 'Сдержанный старт, но долгий органический хвост в чартах',
    startMult: 0.86,
    growthMult: 1.18,
    longevityMult: 1.24,
    viralBonus: 0,
    hypeDelta: -2
  },
  warmup: {
    label: 'Прогрев / Тизеры',
    shortLabel: 'Прогрев',
    hint: 'Плавный разогрев аудитории перед дропом и ровная поддержка',
    startMult: 1.14,
    growthMult: 1.12,
    longevityMult: 1.12,
    viralBonus: 0.015,
    hypeDelta: 3
  },
  playlist_push: {
    label: 'Плейлисты и редакции',
    shortLabel: 'Плейлисты',
    hint: 'Фокус на главных витринах и редакторских подборках',
    startMult: 1.22,
    growthMult: 1.16,
    longevityMult: 1.16,
    viralBonus: 0.02,
    hypeDelta: 4
  },
  tiktok_trend: {
    label: 'TikTok-челлендж',
    shortLabel: 'TikTok',
    hint: 'Высокий шанс на вирусный звук и взрывной прирост молодых слушателей',
    startMult: 1.18,
    growthMult: 1.24,
    longevityMult: 1.20,
    viralBonus: 0.095,
    hypeDelta: 6
  },
  viral_push: {
    label: 'Вирусный пуш',
    shortLabel: 'Вирусный',
    hint: 'Агрессивный разгон в соцсетях и повышенный шанс на большой хит',
    startMult: 1.28,
    growthMult: 1.24,
    longevityMult: 1.26,
    viralBonus: 0.08,
    hypeDelta: 6
  },
  feature_event: {
    label: 'Ивент-коллаборация',
    shortLabel: 'Ивент-фит',
    hint: 'Крупный кроссовер фан-баз и активное обсуждение в медиа',
    startMult: 1.26,
    growthMult: 1.18,
    longevityMult: 1.18,
    viralBonus: 0.04,
    hypeDelta: 5
  },
  scandal_pr: {
    label: 'Скандал / Чёрный PR',
    shortLabel: 'Скандал PR',
    hint: 'Мощный хайп на первой неделе, но более быстрый спад вдолгую',
    startMult: 1.36,
    growthMult: 0.94,
    longevityMult: 0.96,
    viralBonus: 0.065,
    hypeDelta: 7
  },
  radio_tour: {
    label: 'Радио и турне',
    shortLabel: 'Радио-тур',
    hint: 'Ровный старт и максимальная выносливость трека в чарте на месяцы',
    startMult: 1.12,
    growthMult: 1.26,
    longevityMult: 1.34,
    viralBonus: 0.01,
    hypeDelta: 3
  },
  deluxe_wave: {
    label: 'Делюкс-волна',
    shortLabel: 'Делюкс',
    hint: 'Вторая волна внимания, подтягивающая прослушивания всего каталога',
    startMult: 1.30,
    growthMult: 1.20,
    longevityMult: 1.25,
    viralBonus: 0.03,
    hypeDelta: 5
  },
  mega_campaign: {
    label: 'Мега-кампания',
    shortLabel: 'Мега-кампания',
    hint: 'Максимальный мировой охват, наружная реклама и лидерство в топе',
    startMult: 1.44,
    growthMult: 1.32,
    longevityMult: 1.36,
    viralBonus: 0.055,
    hypeDelta: 10
  }
};

export function getPromoStrategyConfig(strategy?: ReleasePromoStrategy): PromoStrategySpec | null {
  return strategy && RELEASE_PROMO_LABELS[strategy] ? RELEASE_PROMO_LABELS[strategy] : null;
}

export function getReleaseHypeMultiplier(releaseHype?: number): number {
  if (typeof releaseHype !== 'number' || isNaN(releaseHype)) return 1.0;
  // Strictly monotonic curve centered at 50 = 1.00x (10 -> 0.65x, 50 -> 1.01x, 99 -> 1.45x)
  const clamped = clamp(releaseHype, 10, 99);
  return 0.65 + ((clamped - 10) / 89) * 0.80;
}

export const ReleaseHypeControl: React.FC<{
  promoStrategy?: ReleasePromoStrategy;
  releaseHype?: number;
  defaultHype?: number;
  onChange: (strategy: ReleasePromoStrategy | undefined, releaseHype: number | undefined) => void;
  compact?: boolean;
}> = ({ promoStrategy, releaseHype, defaultHype = 70, onChange, compact = false }) => {
  const [open, setOpen] = useState(false);
  const activeStrat = getPromoStrategyConfig(promoStrategy);
  const hasCustom = Boolean(activeStrat || typeof releaseHype === 'number');

  const summaryParts: string[] = [];
  if (activeStrat) summaryParts.push(activeStrat.shortLabel);
  if (typeof releaseHype === 'number') summaryParts.push(`Хайп ${releaseHype}`);
  const summaryLabel = summaryParts.length > 0 ? summaryParts.join(' · ') : 'Стандарт (опц.)';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
            hasCustom
              ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 hover:bg-amber-500/20'
              : 'bg-black/45 border-white/12 text-zinc-200 hover:border-white/25 hover:text-white'
          } ${compact ? '' : 'w-full'}`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 theme-accent shrink-0" />
            <span className="truncate">
              Уровень хайпа и тип промо: <strong className="text-white">{summaryLabel}</strong>
            </span>
          </span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="p-3.5 rounded-2xl bg-zinc-950/95 border border-white/15 space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-white">Тип хайпа и промо-стратегия</p>
              <p className="text-[11px] text-zinc-400">
                Плавное влияние на старт, виральность и срок жизни трека в чарте
              </p>
            </div>
            {hasCustom && (
              <button
                type="button"
                onClick={() => onChange(undefined, undefined)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Сбросить к стандарту
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChange(undefined, releaseHype)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                !promoStrategy
                  ? 'theme-bg-accent text-black border-transparent font-bold'
                  : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              Стандарт
            </button>
            {(Object.keys(RELEASE_PROMO_LABELS) as ReleasePromoStrategy[]).map(key => {
              const info = RELEASE_PROMO_LABELS[key];
              return (
                <button
                  key={key}
                  type="button"
                  title={info.hint}
                  onClick={() => onChange(key, releaseHype)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                    promoStrategy === key
                      ? 'theme-bg-accent text-black border-transparent font-bold'
                      : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  {info.label}
                </button>
              );
            })}
          </div>

          {activeStrat && (
            <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-1.5">
              {activeStrat.hint} (Старт ×{activeStrat.startMult.toFixed(2)} · Рост ×{activeStrat.growthMult.toFixed(2)})
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/[0.08]">
            <label className="flex items-center gap-2 text-xs text-zinc-200 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={typeof releaseHype === 'number'}
                onChange={e => onChange(promoStrategy, e.target.checked ? clamp(defaultHype, 15, 99) : undefined)}
                className="rounded accent-emerald-500"
              />
              <span>Точный уровень хайпа релиза</span>
            </label>
            {typeof releaseHype === 'number' && (
              <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
                <input
                  type="range"
                  min={10}
                  max={99}
                  value={releaseHype}
                  onChange={e => onChange(promoStrategy, Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-white w-20 text-right tabular-nums">
                  {releaseHype} (×{getReleaseHypeMultiplier(releaseHype).toFixed(2)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function forecastReleasePlaysCore(params: {
  artist: Artist;
  featArtist?: Artist | null;
  featuredNames?: string;
  allArtists?: Artist[];
  itemType: 'track' | 'album' | 'snippet';
  qualityScore: number;
  hype: number;
  hasWarmup: boolean;
  promoBoost?: boolean;
  promoStrategy?: ReleasePromoStrategy;
  releaseHype?: number;
  albumTracksCount?: number;
  virality?: SimViralityLevel;
  hitsCount?: number;
  catalogAvgPlays?: number;
  deterministic?: boolean;
}): number {
  const {
    artist,
    featArtist,
    featuredNames,
    allArtists = [],
    itemType,
    qualityScore,
    hype,
    hasWarmup,
    promoBoost = false,
    promoStrategy,
    releaseHype,
    albumTracksCount = 12,
    virality = 'balanced',
    hitsCount = 0,
    catalogAvgPlays = 0,
    deterministic = false
  } = params;

  const baseFollowers = Math.max(80_000, artist.followers || 450_000);
  const stratSpec = getPromoStrategyConfig(promoStrategy);
  const relHypeMult = getReleaseHypeMultiplier(releaseHype);
  const stratStartMult = stratSpec ? stratSpec.startMult : 1.0;

  if (itemType === 'snippet') {
    const snippetReach = getCompressedReach(baseFollowers, hitsCount, catalogAvgPlays);
    const randMult = deterministic ? 0.17 : randRange(0.10, 0.24);
    const tail = deterministic ? 1200 : randInt(237, 6819);
    return Math.round(Math.max(120_000, snippetReach * randMult * stratStartMult * relHypeMult + tail));
  }

  let featBoost = 0;
  if (featArtist) {
    const f = featArtist.followers || 400_000;
    const synergy = deterministic ? 0.62 : Math.random() < 0.80 ? randRange(0.45, 0.85) : randRange(0.22, 0.35);
    featBoost += Math.min(Math.max(800_000, baseFollowers * 0.70), f * synergy * 0.55);
  } else if (featuredNames) {
    const names = splitFeaturedList(featuredNames, artist.name);
    names.slice(0, 3).forEach((nm, idx) => {
      const found = allArtists.find(a => a.name.toLowerCase() === nm.toLowerCase());
      const f = found?.followers || 400_000;
      const synergy = deterministic ? (idx === 0 ? 0.55 : 0.30) : Math.random() < 0.80 ? (idx === 0 ? 0.55 : 0.32) : 0.22;
      featBoost += Math.min(Math.max(700_000, baseFollowers * 0.55), f * synergy * 0.50);
    });
  }

  const compressedReach = getCompressedReach(baseFollowers + featBoost, hitsCount, catalogAvgPlays);

  const qNorm = clamp((qualityScore - 40) / 55, 0.10, 1.15);
  const qualityFactor = 0.80 + qNorm * 0.44;
  // Keep artist hype gentle so monthly listeners, catalog and quality stay primary
  const hypeFactor = 0.90 + (clamp(hype, 0, 100) / 100) * 0.22;
  const hitsMult = 1.0 + Math.min(0.16, Math.sqrt(Math.max(0, hitsCount)) * 0.04);
  const warmupFactor = hasWarmup ? (deterministic ? 1.18 : randRange(1.12, 1.25)) : 1.0;
  const promoFactor = promoBoost ? (deterministic ? 1.17 : randRange(1.10, 1.24)) : 1.0;

  // Consistent smooth cap ceiling without jump discontinuity when custom hype is enabled
  const baseDet = Math.min(2.25, qualityFactor * hypeFactor * hitsMult * warmupFactor * promoFactor);
  const detFactor = baseDet * stratStartMult * relHypeMult;

  if (itemType === 'album') {
    const extraViral = stratSpec ? stratSpec.viralBonus : 0;
    const albumViralChance = (virality === 'viral' ? 0.14 : virality === 'stable' ? 0.025 : 0.06) + extraViral;
    const viralRoll = deterministic ? 0.50 : Math.random();
    const albumRandomFactor = deterministic
      ? 1.06
      : viralRoll < albumViralChance
        ? randRange(1.45, virality === 'viral' || extraViral >= 0.07 ? 2.15 : 1.80)
        : viralRoll < 0.20
          ? randRange(0.68, 0.88)
          : randRange(0.84, 1.38);

    const safeTracks = Math.max(3, albumTracksCount);
    const trackCountScale = Math.pow(safeTracks, 0.85);
    const perTrackUnit = compressedReach * (deterministic ? 0.91 : randRange(0.76, 1.06));
    const tail = deterministic ? 8500 : randInt(1713, 29471);
    const albumPlays = Math.round(perTrackUnit * trackCountScale * detFactor * albumRandomFactor + tail);
    const albumFloor = Math.round(safeTracks * (deterministic ? 640_000 : randRange(520_000, 820_000)) + (deterministic ? 3500 : randInt(417, 11913)));
    return Math.max(albumFloor, albumPlays);
  }

  const extraViral = stratSpec ? stratSpec.viralBonus : 0;
  const viralChance = (virality === 'viral' ? 0.16 : virality === 'stable' ? 0.03 : 0.07) + extraViral;
  const viralRoll = deterministic ? 0.50 : Math.random();
  const randomFactor = deterministic
    ? 1.12
    : viralRoll < viralChance
      ? randRange(2.05, virality === 'viral' || extraViral >= 0.07 ? 3.35 : 2.80)
      : viralRoll < 0.22
        ? randRange(0.58, 0.85)
        : randRange(0.80, 1.58);

  const singleRatio = deterministic ? 1.05 : randRange(0.85, 1.25);
  const tail = deterministic ? 4200 : randInt(237, 14843);
  const singlePlays = Math.round(compressedReach * detFactor * randomFactor * singleRatio + tail);
  const singleFloor = Math.round((deterministic ? 680_000 : randRange(520_000, 880_000)) + (deterministic ? 2400 : randInt(213, 8917)));
  return Math.max(singleFloor, singlePlays);
}

/** every plays generator goes through here: the listen engine adjusts the result */
export function forecastReleasePlays(params: Parameters<typeof forecastReleasePlaysCore>[0]): number {
  const raw = forecastReleasePlaysCore(params);
  if (!engineActive()) return raw;
  const det = params.deterministic ? raw : forecastReleasePlaysCore({ ...params, deterministic: true });
  return engineDebut(raw, det, { artist: params.artist, itemType: params.itemType, hasFeat: Boolean(params.featArtist || params.featuredNames), deterministic: params.deterministic });
}

// ============================================================================
// COLLAB & ALBUM TRACKLIST GENERATOR (TIER-AWARE — RARE TOP+NO-NAME FEATS)
// ============================================================================

function pickFeaturedArtistSmart(
  mainArtist: Artist,
  allArtists: Artist[],
  excludeIds: Set<string>,
  allowSurprise = true,
  audienceMap?: Map<string, number>
): { artist: Artist; isSurprise: boolean } | null {
  const pool = allArtists.filter(a => a.id !== mainArtist.id && !excludeIds.has(a.id));
  if (pool.length === 0) return null;

  const getAud = (a: Artist) => Math.max(50_000, audienceMap?.get(a.id) ?? a.followers ?? 200_000);
  const mainF = getAud(mainArtist);
  const isTopArtist = mainF >= 2_500_000;
  const isMegaArtist = mainF >= 8_000_000;

  const sameGenre = pool.filter(
    other => other.genre && mainArtist.genre && other.genre.toLowerCase() === mainArtist.genre.toLowerCase()
  );

  const roll = Math.random();

  // Top/Large artists almost exclusively collab with peers or established stars (~96%), very rarely co-signing unknowns (~4%)
  if (isTopArtist) {
    const peerFloor = isMegaArtist ? 2_200_000 : 900_000;
    if (!allowSurprise || roll < 0.80) {
      const peerPool = (sameGenre.length > 0 ? sameGenre : pool).filter(o => {
        const of = getAud(o);
        const ratio = of / mainF;
        return of >= peerFloor && ratio >= 0.35 && ratio <= 3.2;
      });
      const fallbackEstablished = pool.filter(o => getAud(o) >= peerFloor);
      const finalPool = peerPool.length > 0 ? peerPool : fallbackEstablished.length > 0 ? fallbackEstablished : pool;
      return { artist: finalPool[randInt(0, finalPool.length - 1)], isSurprise: false };
    }

    if (roll < 0.96) {
      // Cross-genre / established star collab
      const crossEstablished = pool.filter(o => {
        const of = getAud(o);
        return of >= Math.max(1_200_000, mainF * 0.25) && o.genre?.toLowerCase() !== mainArtist.genre?.toLowerCase();
      });
      const establishedPool = crossEstablished.length > 0 ? crossEstablished : pool.filter(o => getAud(o) >= 1_200_000);
      if (establishedPool.length > 0) {
        return { artist: establishedPool[randInt(0, establishedPool.length - 1)], isSurprise: true };
      }
    }

    // Ultra-rare rising underdog co-sign (~4% max)
    const risingPool = pool.filter(o => getAud(o) >= 300_000 && getAud(o) < peerFloor);
    const chosen = risingPool.length > 0 ? risingPool[randInt(0, risingPool.length - 1)] : pool[randInt(0, pool.length - 1)];
    return { artist: chosen, isSurprise: true };
  }

  // Mid & Rising artists
  if (!allowSurprise || roll < 0.74) {
    const peerPool = (sameGenre.length > 0 ? sameGenre : pool).filter(o => {
      const ratio = getAud(o) / mainF;
      return ratio >= 0.30 && ratio <= 3.2;
    });
    const finalPool = peerPool.length > 0 ? peerPool : sameGenre.length > 0 ? sameGenre : pool;
    return { artist: finalPool[randInt(0, finalPool.length - 1)], isSurprise: false };
  }

  if (roll < 0.94) {
    const surprisePool = pool.filter(o => {
      const ratio = getAud(o) / mainF;
      return (ratio >= 0.35 && ratio <= 4.5) || o.genre?.toLowerCase() !== mainArtist.genre?.toLowerCase();
    });
    const finalPool = surprisePool.length > 0 ? surprisePool : pool;
    return { artist: finalPool[randInt(0, finalPool.length - 1)], isSurprise: true };
  }

  const bigBreakPool = pool.filter(o => getAud(o) >= 2_500_000);
  if (bigBreakPool.length > 0) {
    return { artist: bigBreakPool[randInt(0, bigBreakPool.length - 1)], isSurprise: true };
  }
  return { artist: pool[randInt(0, pool.length - 1)], isSurprise: true };
}

export function generateAlbumTracksWithFeats(params: {
  artist: Artist;
  allArtists: Artist[];
  count: number;
  estimatedAlbumPlays: number;
  existingTitles: Set<string>;
  namingProfile: ArtistNamingProfile | boolean;
  languageOverride?: SimLanguageMix;
  coArtist?: string;
  collabRate?: SimCollabRate;
  allowSurpriseCollabs?: boolean;
  audienceMap?: Map<string, number>;
}): SimAlbumTrack[] {
  const {
    artist,
    allArtists,
    count,
    estimatedAlbumPlays,
    existingTitles,
    namingProfile,
    languageOverride = 'auto',
    coArtist,
    collabRate = 'balanced',
    allowSurpriseCollabs = true,
    audienceMap
  } = params;
  const safeCount = Math.max(3, count);
  const targetAlbumTotal = Math.max(safeCount * 480_000, Math.round(estimatedAlbumPlays * randRange(0.95, 1.05)));

  let maxFeats = safeCount >= 14 ? randInt(3, 6) : safeCount >= 9 ? randInt(2, 4) : randInt(1, 2);
  if (collabRate === 'low') maxFeats = Math.min(maxFeats, 1);
  if (collabRate === 'high') maxFeats = Math.min(safeCount - 1, maxFeats + 2);

  const featTrackIndices = new Set<number>();
  if (allArtists.length > 1 && maxFeats > 0) {
    let guard = 0;
    while (featTrackIndices.size < maxFeats && guard < 32) {
      featTrackIndices.add(randInt(0, safeCount - 1));
      guard++;
    }
  }

  // Varied album internal dynamics so every album has a distinct streaming curve
  const curveStyles = ['front_heavy', 'hit_driven', 'consistent', 'sleeper_late'] as const;
  const curveStyle = curveStyles[randInt(0, curveStyles.length - 1)];

  const leadRoll = Math.random();
  const leadIdx =
    curveStyle === 'sleeper_late'
      ? randInt(Math.floor(safeCount / 2), safeCount - 1)
      : leadRoll < 0.45
        ? 0
        : leadRoll < 0.70 && safeCount > 1
          ? 1
          : leadRoll < 0.90 && safeCount > 2
            ? 2
            : randInt(0, safeCount - 1);

  let secondIdx = randInt(0, Math.min(safeCount - 1, Math.max(2, Math.floor(safeCount * 0.65))));
  if (secondIdx === leadIdx && safeCount > 1) {
    secondIdx = (leadIdx + 1) % safeCount;
  }

  const sleeperIndices = new Set<number>();
  const sleeperTargetCount = Math.random() < 0.65 ? randInt(1, 2) : 0;
  for (let s = 0; s < sleeperTargetCount * 3 && sleeperIndices.size < sleeperTargetCount; s++) {
    const idx = randInt(0, safeCount - 1);
    if (idx !== leadIdx && idx !== secondIdx) sleeperIndices.add(idx);
  }

  const usedFeatIds = new Set<string>();
  const drafts: Array<{
    title: string;
    duration: string;
    rawWeight: number;
    featuredArtist?: string;
    isExplicit: boolean;
    isSurpriseFeat: boolean;
  }> = [];

  for (let i = 0; i < safeCount; i++) {
    const title = generateModernTitle(existingTitles, false, namingProfile, languageOverride);

    let trackRoleMult = 1.0;
    const posRatio = safeCount > 1 ? i / (safeCount - 1) : 0;

    if (i === leadIdx) {
      trackRoleMult = curveStyle === 'hit_driven' ? randRange(2.6, 3.8) : curveStyle === 'consistent' ? randRange(1.5, 2.1) : randRange(2.0, 3.1);
    } else if (i === secondIdx) {
      trackRoleMult = curveStyle === 'consistent' ? randRange(1.25, 1.75) : randRange(1.5, 2.35);
    } else if (sleeperIndices.has(i)) {
      trackRoleMult = randRange(1.45, 2.45);
    } else if (curveStyle === 'front_heavy') {
      trackRoleMult = randRange(0.95 - posRatio * 0.35, 1.25 - posRatio * 0.30);
    } else if (curveStyle === 'hit_driven') {
      trackRoleMult = randRange(0.45, 0.88);
    } else if (curveStyle === 'sleeper_late') {
      trackRoleMult = randRange(0.65 + posRatio * 0.22, 1.05 + posRatio * 0.25);
    } else {
      trackRoleMult = randRange(0.75, 1.30);
    }

    let featuredArtist: string | undefined;
    let isSurpriseFeat = false;

    if (featTrackIndices.has(i)) {
      const picked = pickFeaturedArtistSmart(artist, allArtists, usedFeatIds, allowSurpriseCollabs, audienceMap);
      if (picked) {
        usedFeatIds.add(picked.artist.id);
        featuredArtist = picked.artist.name;
        isSurpriseFeat = picked.isSurprise;
      }
    } else if (coArtist && i === 0) {
      featuredArtist = coArtist;
    }

    let featMult = 1.0;
    if (featuredArtist) {
      featMult = Math.random() < 0.78 ? randRange(1.22, 1.65) : randRange(0.95, 1.12);
    }

    const rawWeight = Math.max(0.32, trackRoleMult * featMult * randRange(0.84, 1.18));
    drafts.push({
      title,
      duration: smartDuration(featuredArtist),
      rawWeight,
      featuredArtist,
      isExplicit: Math.random() < 0.45,
      isSurpriseFeat
    });
  }

  const totalWeight = drafts.reduce((sum, d) => sum + d.rawWeight, 0) || 1;
  return drafts.map(d => {
    const share = (targetAlbumTotal * d.rawWeight) / totalWeight;
    const trackFloor = Math.round(randRange(380_000, 680_000) + randInt(117, 6893));
    const plays = Math.max(trackFloor, Math.round(share + randInt(-4500, 4500)));
    return {
      id: makeId('albtrk'),
      title: d.title,
      duration: d.duration,
      plays,
      featuredArtist: d.featuredArtist,
      isExplicit: d.isExplicit,
      isSurpriseFeat: d.isSurpriseFeat
    };
  });
}

// ============================================================================
// SNAPSHOT CREATION & WEEKLY SIMULATION STEP
// ============================================================================

export function computeInitialSimSnapshot(
  masterArtists: Artist[],
  masterAlbums: Album[],
  masterTracks: Track[],
  masterAwards: AwardItem[],
  startDate: string,
  futurePolicy: SimFuturePolicy
): SimState {
  const metrics = computeAllArtistMetrics(masterArtists, masterTracks, masterAlbums, startDate);
  const hypeMap = new Map(metrics.map(m => [m.artist.id, m.hype]));

  const cloneArtists: Artist[] = masterArtists.map(a => ({
    ...a,
    hype: hypeMap.get(a.id) ?? 55
  }));

  const cloneAlbums: Album[] = (
    futurePolicy === 'hidden'
      ? masterAlbums.filter(al => (al.releaseDate || `${al.releaseYear || 2020}-01-01`) <= startDate)
      : masterAlbums
  ).map(al => ({
    ...al,
    chartHistory: al.chartHistory ? [...al.chartHistory] : undefined
  }));

  const cloneTracks: Track[] = (
    futurePolicy === 'hidden'
      ? masterTracks.filter(t => (t.releaseDate || '1900-01-01') <= startDate)
      : masterTracks
  ).map(t => ({
    ...t,
    chartHistory: t.chartHistory ? [...t.chartHistory] : undefined
  }));

  const startYear = startDate.slice(0, 4);
  const startMonth = startDate.slice(5, 7);
  const cloneAwards: AwardItem[] = masterAwards.filter(aw => {
    if (aw.year < startYear) return true;
    if (aw.year > startYear) return false;
    if (aw.periodType === 'year') return false;
    return (aw.month || '12') <= startMonth;
  });

  return {
    isActive: true,
    startDate,
    currentDate: startDate,
    weekNumber: 0,
    futurePolicy,
    artists: cloneArtists,
    albums: cloneAlbums,
    tracks: cloneTracks,
    awards: cloneAwards,
    digestHistory: [],
    undoStack: []
  };
}

export function generateWeekProposals(
  artists: Artist[],
  albums: Album[],
  tracks: Track[],
  currentDate: string,
  configOrIntensity: Partial<SimAutopilotConfig> | SimIntensity = 'balanced',
  legacyWeekEvent: SimWeekEvent = 'normal'
): SimProposal[] {
  if (artists.length === 0) return [];

  const cfg: SimAutopilotConfig =
    typeof configOrIntensity === 'string'
      ? { ...DEFAULT_AUTOPILOT_CONFIG, intensity: configOrIntensity, weekEvent: legacyWeekEvent }
      : { ...DEFAULT_AUTOPILOT_CONFIG, ...configOrIntensity };

  const existingTitles = new Set<string>([
    ...tracks.map(t => t.title.toLowerCase()),
    ...albums.map(a => a.title.toLowerCase())
  ]);

  const index = buildCatalogIndex(tracks, albums, currentDate);
  const metricsList = artists.map(art => {
    const { myTracks, myAlbums, myFeatTracks, albumById } = getArtistBucketFromIndex(art, index);
    return computeArtistMetricsFast(art, myTracks, myAlbums, currentDate, myFeatTracks, albumById);
  });
  const audienceMap = new Map<string, number>();
  metricsList.forEach(m => {
    audienceMap.set(m.artist.id, Math.max(m.artist.followers || 200_000, Math.round(m.catalogAvgPlays * 0.72)));
  });

  const preferredSet = new Set(cfg.preferredArtistIds || []);
  const hypeFilter = cfg.hypeRange || 'any';

  // Weight artists by focus, hype filter, preferred list, and realistic album cycle
  const scored = metricsList
    .map(m => {
      let focusBonus = 0;
      if (preferredSet.has(m.artist.id)) focusBonus += 250; // Preferred authors guaranteed top slots
      if (cfg.tierFocus === 'stars' && (m.tier === 'mega' || m.tier === 'large')) focusBonus += 28;
      else if (cfg.tierFocus === 'rising' && (m.tier === 'rising' || m.artist.isRisingStar)) focusBonus += 32;
      else if (cfg.tierFocus === 'comeback' && m.daysSilent >= 40) focusBonus += 34;

      if (cfg.weekEvent === 'underground_wave' && (m.tier === 'rising' || m.tier === 'mid')) focusBonus += 20;
      if (cfg.weekEvent === 'hot_drops' && (m.tier === 'mega' || m.tier === 'large')) focusBonus += 18;

      if (hypeFilter === 'low') focusBonus += m.hype < 50 ? 45 : -35;
      else if (hypeFilter === 'mid') focusBonus += m.hype >= 50 && m.hype <= 75 ? 45 : -30;
      else if (hypeFilter === 'high') focusBonus += m.hype >= 75 ? 45 : -35;

      return {
        metrics: m,
        isPreferred: preferredSet.has(m.artist.id),
        rollScore: m.readinessScore + focusBonus + steadyDropperBonus(m) + randRange(0, 22)
      };
    })
    .sort((a, b) => b.rollScore - a.rollScore);

  const hasExplicitCounts =
    cfg.singlesCount != null ||
    cfg.epsCount != null ||
    cfg.albumsCount != null ||
    cfg.snippetsCount != null;

  const buildProposalForArtist = (
    m: ArtistSimMetrics,
    forcedFormat: 'single' | 'ep' | 'album' | 'snippet' | null,
    selected: boolean
  ): SimProposal => {
    const art = m.artist;
    const hasWarmup = Boolean(m.activeSnippet);

    let releaseFormat: 'single' | 'ep' | 'album' | 'snippet' = forcedFormat || 'single';
    const albumGap = m.daysSinceAlbum ?? (m.tracksCount >= 4 ? 260 : 150);
    if (!forcedFormat) {
      const roll = Math.random();
      if (cfg.formatFocus === 'singles') {
        releaseFormat =
          !hasWarmup && roll < 0.14
            ? 'snippet'
            : roll > 0.92 && albumGap >= 260
              ? 'album'
              : roll > 0.84 && albumGap >= 140
                ? 'ep'
                : 'single';
      } else if (cfg.formatFocus === 'albums') {
        if (albumGap >= 230 && roll < 0.45) releaseFormat = 'album';
        else if (albumGap >= 120 && roll < 0.70) releaseFormat = 'ep';
        else releaseFormat = !hasWarmup && roll < 0.82 ? 'snippet' : 'single';
      } else if (cfg.formatFocus === 'snippets') {
        releaseFormat = roll < 0.62 ? 'snippet' : roll < 0.88 ? 'single' : 'ep';
      } else {
        // Organic realistic cadence: albums only common after 260+ days (rare ~6% surprise)
        const canLikelyAlbum =
          albumGap >= 270 ||
          (albumGap >= 190 && (hasWarmup || Math.random() < 0.25)) ||
          Math.random() < 0.06;
        if (!hasWarmup && m.daysSilent < 22 && roll < 0.42) {
          releaseFormat = 'snippet';
        } else if (canLikelyAlbum && (m.daysSilent >= 50 || hasWarmup) && roll < 0.30) {
          releaseFormat = albumGap >= 240 ? 'album' : 'ep';
        } else if (albumGap >= 130 && m.daysSilent >= 35 && roll < 0.18) {
          releaseFormat = 'ep';
        } else if (!hasWarmup && roll < 0.20) {
          releaseFormat = 'snippet';
        }
      }
    }

    const itemType: 'track' | 'album' | 'snippet' =
      releaseFormat === 'snippet' ? 'snippet' : releaseFormat === 'ep' || releaseFormat === 'album' ? 'album' : 'track';

    let collabThreshold = cfg.collabRate === 'low' ? 0.12 : cfg.collabRate === 'high' ? 0.60 : 0.32;
    if (cfg.weekEvent === 'collab_fest') collabThreshold = Math.max(collabThreshold, 0.62);
    if (itemType === 'snippet') collabThreshold *= 0.55;

    let featArtist: Artist | undefined;
    let isSurpriseCollab = false;
    if (artists.length > 1 && itemType !== 'album' && Math.random() < collabThreshold) {
      const picked = pickFeaturedArtistSmart(art, artists, new Set(), cfg.allowSurpriseCollabs, audienceMap);
      if (picked) {
        featArtist = picked.artist;
        isSurpriseCollab = picked.isSurprise;
      }
    }

    const qualityScore = clamp(Math.round(m.avgQuality + randInt(-9, 13)), 55, 90);
    const albumTracksCount =
      releaseFormat === 'ep' ? randInt(3, 6) : releaseFormat === 'album' ? getRandomAlbumTrackCount() : undefined;
    const title = generateModernTitle(existingTitles, itemType === 'album', m.namingProfile, cfg.languageMix);

    const promoBoost =
      cfg.enablePromoWaves &&
      ((cfg.weekEvent === 'hot_drops' && Math.random() < 0.50) || (itemType !== 'snippet' && Math.random() < 0.18));

    const estimatedPlays = forecastReleasePlays({
      artist: art,
      featArtist,
      allArtists: artists,
      itemType,
      qualityScore,
      hype: m.hype,
      hasWarmup,
      promoBoost,
      albumTracksCount,
      virality: cfg.virality,
      hitsCount: m.topHitsCount,
      catalogAvgPlays: m.catalogAvgPlays
    });

    const albumTracks =
      itemType === 'album' && albumTracksCount
        ? generateAlbumTracksWithFeats({
            artist: art,
            allArtists: artists,
            count: albumTracksCount,
            estimatedAlbumPlays: estimatedPlays,
            existingTitles,
            namingProfile: m.namingProfile,
            languageOverride: cfg.languageMix,
            collabRate: cfg.collabRate,
            allowSurpriseCollabs: cfg.allowSurpriseCollabs,
            audienceMap
          })
        : undefined;

    const albumActualTotal = albumTracks
      ? albumTracks.reduce((sum, tr) => sum + (tr.plays || 0), 0)
      : estimatedPlays;

    const reasons: string[] = [];
    if (preferredSet.has(art.id)) reasons.push('Выбранный автор');
    if (hasWarmup) reasons.push('Прогрев сниппетом');
    else if (m.daysSilent >= 45) reasons.push(`Не дропал ${m.daysSilent} дн.`);
    else if (m.daysSilent >= 14) reasons.push(`${m.daysSilent} дн. паузы`);
    else reasons.push('На волне активности');

    if (featArtist) {
      reasons.push(isSurpriseCollab ? `Неожиданный фит с ${featArtist.name}` : `Фит с ${featArtist.name}`);
    }
    if (releaseFormat === 'ep' && albumTracks) {
      reasons.push(`EP · ${albumTracks.length} треков`);
    } else if (itemType === 'album' && albumTracks) {
      const featsOnAlbum = albumTracks.filter(x => x.featuredArtist).length;
      reasons.push(`Альбом · ${albumTracks.length} тр.${featsOnAlbum > 0 ? ` (${featsOnAlbum} фит.)` : ''}`);
    } else if (itemType === 'snippet') {
      reasons.push('Подогрев интереса');
    }

    return {
      id: makeId('prop'),
      selected,
      itemType,
      releaseFormat,
      artistId: art.id,
      artistName: art.name,
      featuredArtist: featArtist?.name,
      title,
      coverUrl: '',
      duration: itemType === 'snippet' ? `0:${randInt(24, 46)}` : getRandomDuration(),
      isExplicit: Math.random() < 0.45,
      promoBoost,
      albumTracksCount,
      albumTracks,
      albumTrackTitles: albumTracks?.map(x => x.title),
      genre: art.genre || 'Hip-Hop / Pop',
      snippetTeaser: itemType === 'snippet' ? SNIPPET_TEASERS[randInt(0, SNIPPET_TEASERS.length - 1)] : undefined,
      estimatedPlays: albumActualTotal,
      qualityScore,
      artistHype: m.hype,
      daysSilent: m.daysSilent,
      hasWarmupBoost: hasWarmup,
      reason: reasons.join(' · ')
    };
  };

  if (hasExplicitCounts) {
    const queueFormats: Array<'single' | 'ep' | 'album' | 'snippet'> = [];
    const pushN = (fmt: 'single' | 'ep' | 'album' | 'snippet', count?: number | null) => {
      const n = Math.max(0, Math.min(12, count ?? 0));
      for (let k = 0; k < n; k++) queueFormats.push(fmt);
    };
    pushN('album', cfg.albumsCount);
    pushN('ep', cfg.epsCount);
    pushN('single', cfg.singlesCount);
    pushN('snippet', cfg.snippetsCount);

    const proposals: SimProposal[] = [];
    let artistCursor = 0;

    // Assign preferred artists first, then next highest ranked matching artists
    for (let i = 0; i < queueFormats.length; i++) {
      const m = scored[artistCursor % scored.length].metrics;
      artistCursor++;
      proposals.push(buildProposalForArtist(m, queueFormats[i], true));
    }

    // Add 4 extra optional reserve candidates so Semi-Auto always feels alive
    const extraCount = Math.min(4, Math.max(0, scored.length - proposals.length));
    for (let j = 0; j < extraCount; j++) {
      const m = scored[(artistCursor + j) % scored.length].metrics;
      proposals.push(buildProposalForArtist(m, null, false));
    }

    return proposals;
  }

  const candidateCount = Math.min(scored.length, Math.max(18, preferredSet.size + 10));
  let defaultSelectedLimit =
    cfg.intensity === 'calm' ? 3 : cfg.intensity === 'active' ? 7 : cfg.intensity === 'mega' ? 10 : 5;
  if (cfg.weekEvent === 'hot_drops') defaultSelectedLimit += 2;
  if (cfg.weekEvent === 'quiet_week') defaultSelectedLimit = Math.max(2, defaultSelectedLimit - 2);
  if (preferredSet.size > defaultSelectedLimit) defaultSelectedLimit = Math.min(candidateCount, preferredSet.size + 1);

  const proposals: SimProposal[] = [];
  for (let i = 0; i < candidateCount; i++) {
    const entry = scored[i];
    proposals.push(buildProposalForArtist(entry.metrics, null, entry.isPreferred || i < defaultSelectedLimit));
  }

  return proposals;
}

export interface ManualSimItem {
  id: string;
  itemType: 'track' | 'album' | 'snippet';
  artistId: string;
  artistName: string;
  featuredArtist?: string;
  coArtist?: string;
  title: string;
  coverUrl?: string;
  duration?: string;
  isExplicit?: boolean;
  genre?: string;
  plays?: number;
  albumTracksCount?: number;
  albumTracks?: SimAlbumTrack[];
  snippetTeaser?: string;
  promoStrategy?: ReleasePromoStrategy;
  releaseHype?: number;
}

// Match ChartsView formula 1:1 so chart history aligns with what user sees on Charts screen
/** artists who drop steadily also get a chance, not only the long-silent ones */
function steadyDropperBonus(m: ArtistSimMetrics): number {
  const tc = (m as any).tracksCount || 0;
  if (m.daysSilent >= 5 && m.daysSilent <= 42 && tc >= 5) return randRange(4, 22);
  if (m.daysSilent > 42 && m.daysSilent <= 90 && tc >= 3) return randRange(0, 10);
  return 0;
}

// ---------------------------------------------------------------------------
// Catalog revivals: sometimes an old track suddenly flies back into the chart
// ---------------------------------------------------------------------------
const REVIVAL_REASONS = [
  'завирусился в TikTok', 'прозвучал в популярном сериале', 'годовщина релиза — фанаты устроили флешмоб', 'новый релиз артиста подтянул каталог',
  'стал мемом недели', 'вирусный кавер вернул интерес к оригиналу', 'ремикс диджея разогнал оригинал', 'стример включил его на многотысячной трансляции',
  'звучит в рекламе крупного бренда', 'ушёл в спортивные хайлайты', 'попал в редакционный плейлист', 'просто так — алгоритмы решили',
  'всплыл в тренде «звук из детства»', 'после громкого интервью артиста', 'его перепели на шоу талантов', 'стал саундтреком вирусного видео'
];
function applyCatalogRevivals(list: Track[], toDate: string): string | null {
  const nowMs = new Date(toDate).getTime();
  const roll = Math.random();
  if (roll > 0.24) return null; // ~1 week of 4-5
  const cands = list.map((t, i) => ({ t, i })).filter(({ t }) => {
    if (t.isSnippet || !t.releaseDate || t.releaseDate > toDate) return false;
    const age = (nowMs - new Date(t.releaseDate).getTime()) / 86400000;
    const last = (t as any).revivalAt ? (nowMs - new Date((t as any).revivalAt).getTime()) / 86400000 : 9999;
    return age >= 150 && last > 120 && (t.plays || 0) > 20_000;
  });
  if (!cands.length) return null;
  const weights = cands.map(({ t }) => Math.sqrt(t.plays || 1) * (0.4 + Math.random()));
  let x = Math.random() * weights.reduce((a, b) => a + b, 0);
  let k = 0; while (k < cands.length - 1 && (x -= weights[k]) > 0) k++;
  const { t, i } = cands[k];
  const big = Math.random();
  const power = big < 0.12 ? randRange(28, 48) : big < 0.4 ? randRange(14, 26) : randRange(6, 13);
  const reason = REVIVAL_REASONS[randInt(0, REVIVAL_REASONS.length - 1)];
  const boost = Math.round((t.plays || 0) * randRange(0.015, 0.06) * (power / 14));
  list[i] = { ...t, plays: (t.plays || 0) + boost, likes: (t.likes || 0) + Math.round(boost * 0.04), ...({ revivalAt: toDate, revivalPower: power, revivalReason: reason } as any) };
  return `Камбэк из каталога: ${t.artistName} — «${t.title}» ${reason}`;
}

function rankTracksForChart(tracks: Track[], dateStr: string): Track[] {
  const nowMs = new Date(dateStr).getTime();
  return tracks
    .filter(t => !t.isSnippet && (t.releaseDate || '1900-01-01') <= dateStr)
    .map(t => {
      const relTime = t.releaseDate ? new Date(t.releaseDate).getTime() : nowMs - 30 * 86400000;
      const diffDays = Math.max(1, Math.floor((nowMs - relTime) / 86400000));
      let recencyBoost = 1.0;
      if (diffDays <= 7) recencyBoost = 14.5;
      else if (diffDays <= 21) recencyBoost = 10.5;
      else if (diffDays <= 45) recencyBoost = 7.4;
      else if (diffDays <= 90) recencyBoost = 5.0;
      else if (diffDays <= 180) recencyBoost = 3.1;
      else if (diffDays <= 365) recencyBoost = 1.85;
      else if (diffDays <= 730) recencyBoost = 0.65;
      else recencyBoost = 0.18;

      const stratCfg = getPromoStrategyConfig(t.promoStrategy);
      let longevityMult = stratCfg ? (t.promoStrategy === 'quiet' && diffDays <= 21 ? 1.0 : stratCfg.longevityMult) : 1.0;
      if (typeof t.releaseHype === 'number' && !isNaN(t.releaseHype)) {
        longevityMult *= 0.88 + clamp(t.releaseHype, 10, 99) / 380;
      }

      const rvAt = (t as any).revivalAt as string | undefined;
      const rvLeft = rvAt && diffDays > 120 ? Math.max(0, 1 - Math.max(0, (nowMs - new Date(rvAt).getTime()) / 86400000) / 35) : 0;
      const revivalMult = rvLeft > 0 ? 1 + ((t as any).revivalPower || 10) * rvLeft : 1;
      const hotScore = Math.round(((t.plays || 0) * recencyBoost * longevityMult * revivalMult * engineChart(t.artistId, diffDays) * 12) / Math.pow(diffDays + 5, 0.66));
      return { track: t, hotScore };
    })
    .sort((a, b) => b.hotScore - a.hotScore)
    .map(x => x.track);
}

function rankAlbumsForChart(albums: Album[], tracks: Track[], dateStr: string): Album[] {
  const nowMs = new Date(dateStr).getTime();
  const trackStats = new Map<string, { sum: number; count: number }>();
  tracks.forEach(t => {
    if (t.isSnippet || (t.releaseDate || '1900-01-01') > dateStr) return;
    if (t.albumId && t.albumId !== 'single') {
      const prev = trackStats.get(t.albumId) || { sum: 0, count: 0 };
      prev.sum += t.plays || 0;
      prev.count += 1;
      trackStats.set(t.albumId, prev);
    }
  });

  return albums
    .filter(al => (al.releaseDate || `${al.releaseYear || 2020}-01-01`) <= dateStr)
    .map(al => {
      const stats = trackStats.get(al.id);
      const albumTotalPlays = stats && stats.sum > 0 ? stats.sum : al.totalPlays || 0;
      const trackCount = stats && stats.count > 0 ? stats.count : 8;
      const avgPerTrack = albumTotalPlays / trackCount;
      const fairPlays = Math.round(albumTotalPlays * 0.6 + avgPerTrack * 5 * 0.4);
      const relTime = al.releaseDate ? new Date(al.releaseDate).getTime() : nowMs - 45 * 86400000;
      const diffDays = Math.max(1, Math.floor((nowMs - relTime) / 86400000));
      let recencyBoost = 1.0;
      if (diffDays <= 14) recencyBoost = 12.0;
      else if (diffDays <= 30) recencyBoost = 7.0;
      else if (diffDays <= 90) recencyBoost = 3.5;
      else if (diffDays <= 180) recencyBoost = 1.8;
      else if (diffDays <= 365) recencyBoost = 1.0;
      else recencyBoost = 0.3;
      const hotScore = Math.round((fairPlays * recencyBoost * 12) / Math.pow(diffDays + 6, 0.65));
      return { album: al, hotScore };
    })
    .sort((a, b) => b.hotScore - a.hotScore)
    .map(x => x.album);
}

export function advanceSimulationStep(params: {
  simState: SimState;
  proposals?: SimProposal[];
  manualItems?: ManualSimItem[];
  advanceDays?: number;
  virality?: SimViralityLevel;
}): SimState {
  const { simState, proposals = [], manualItems = [], advanceDays = 7, virality = 'balanced' } = params;
  const fromDate = simState.currentDate;
  const toDate = addDaysISO(fromDate, advanceDays);
  const nextWeek = simState.weekNumber + Math.max(1, Math.round(advanceDays / 7));
  const stepFactor = Math.max(0.15, advanceDays / 7);

  // 1. Save undo snapshot (keep last 5 to keep IndexedDB fast & lean)
  const undoEntry = {
    weekNumber: simState.weekNumber,
    currentDate: simState.currentDate,
    artists: simState.artists,
    albums: simState.albums,
    tracks: simState.tracks,
    awards: simState.awards,
    digest: simState.lastDigest
  };
  const nextUndoStack = [undoEntry, ...simState.undoStack].slice(0, 2);

  // 2. Capture pre-step chart ranks
  const prevTrackRanks = new Map<string, number>();
  rankTracksForChart(simState.tracks, fromDate).forEach((t, idx) => {
    prevTrackRanks.set(t.id, idx + 1);
  });
  const prevAlbumRanks = new Map<string, number>();
  rankAlbumsForChart(simState.albums, simState.tracks, fromDate).forEach((al, idx) => {
    prevAlbumRanks.set(al.id, idx + 1);
  });

  // 3. Build new releases
  const artistMap = new Map<string, Artist>();
  simState.artists.forEach(a => artistMap.set(a.id, { ...a }));

  engineSetCatalog(simState.artists, simState.tracks);
  const newTracks: Track[] = [];
  const newAlbums: Album[] = [];
  const weeklyDropsSummary: SimWeeklyDropSummary[] = [];
  const existingTitles = new Set<string>([
    ...simState.tracks.map(t => t.title.toLowerCase()),
    ...simState.albums.map(a => a.title.toLowerCase())
  ]);

  const preIndex = buildCatalogIndex(simState.tracks, simState.albums, fromDate);

  // Single synchronized IRL global release day: Friday (пятница) for all drops of this simulated week!
  const weekDropDate = getDropFriday(fromDate, toDate);

  const combinedNew: Array<SimProposal & { isManual?: boolean }> = [
    ...proposals.filter(p => p.selected).map(p => ({ ...p, isManual: false })),
    ...manualItems.map(m => {
      const art = artistMap.get(m.artistId) || simState.artists[0];
      const bucket = art
        ? getArtistBucketFromIndex(art, preIndex)
        : { myTracks: [], myAlbums: [], myFeatTracks: [], albumById: preIndex.albumById };
      const metrics = art
        ? computeArtistMetricsFast(art, bucket.myTracks, bucket.myAlbums, fromDate, bucket.myFeatTracks, bucket.albumById)
        : null;
      const feat = m.featuredArtist
        ? simState.artists.find(a => a.name.toLowerCase() === m.featuredArtist!.toLowerCase())
        : undefined;
      const q = metrics ? clamp(Math.round(metrics.avgQuality + randInt(-4, 10)), 58, 90) : 72;

      const est =
        m.plays && m.plays > 0
          ? m.plays
          : art
              ? forecastReleasePlays({
                  artist: art,
                  featArtist: feat,
                  featuredNames: m.featuredArtist,
                  allArtists: simState.artists,
                  itemType: m.itemType,
                  qualityScore: q,
                  hype: metrics?.hype || 55,
                  hasWarmup: Boolean(metrics?.activeSnippet),
                  promoStrategy: m.promoStrategy,
                  releaseHype: m.releaseHype,
                  albumTracksCount: m.albumTracks?.length || m.albumTracksCount || 10,
                  virality,
                  hitsCount: metrics?.topHitsCount || 0,
                  catalogAvgPlays: metrics?.catalogAvgPlays || 0
                })
              : 350_000;

      return {
        id: m.id,
        selected: true,
        itemType: m.itemType,
        artistId: art?.id || m.artistId,
        artistName: art?.name || m.artistName,
        featuredArtist: m.featuredArtist,
        coArtist: m.coArtist,
        title: m.title.trim() || generateModernTitle(existingTitles, m.itemType === 'album', metrics?.namingProfile || false),
        coverUrl: m.coverUrl || '',
        duration: m.duration,
        isExplicit: m.isExplicit,
        promoStrategy: m.promoStrategy,
        releaseHype: m.releaseHype,
        albumTracksCount: m.albumTracks?.length || m.albumTracksCount || 10,
        albumTracks: m.albumTracks,
        genre: m.genre || art?.genre || 'Hip-Hop / Pop',
        snippetTeaser: m.snippetTeaser,
        estimatedPlays: est,
        qualityScore: q,
        artistHype: metrics?.hype || 55,
        daysSilent: metrics?.daysSilent || 14,
        hasWarmupBoost: Boolean(metrics?.activeSnippet),
        reason: 'Ручной выпуск',
        isManual: true
      };
    })
  ];

  const droppedByArtistId = new Set<string>();
  const snippetByArtistId = new Set<string>();
  const collabByArtistId = new Set<string>();
  const extraPromoHypeByArtistId = new Map<string, number>();
  const artistByLowerName = new Map<string, Artist>();
  simState.artists.forEach(a => artistByLowerName.set(a.name.toLowerCase().trim(), a));

  const creditFeaturedArtists = (rawFeat?: string) => {
    if (!rawFeat) return;
    splitFeaturedList(rawFeat).forEach(nm => {
      const guest = artistByLowerName.get(nm.toLowerCase());
      if (guest) collabByArtistId.add(guest.id);
    });
  };

  combinedNew.forEach((item) => {
    // Every release in this simulated week drops synchronously on Friday!
    const relDate = weekDropDate;
    const art = artistMap.get(item.artistId);
    const bucket = art ? getArtistBucketFromIndex(art, preIndex) : { myTracks: [], myAlbums: [] };
    const namingProf = art ? analyzeArtistNamingStyle(art, bucket.myTracks, bucket.myAlbums) : false;

    const releaseCover = item.coverUrl || '';

    if (item.promoStrategy || typeof item.releaseHype === 'number') {
      const stratCfg = getPromoStrategyConfig(item.promoStrategy);
      let bonus = stratCfg ? stratCfg.hypeDelta : 0;
      if (typeof item.releaseHype === 'number' && item.releaseHype >= 75) bonus += 4;
      else if (typeof item.releaseHype === 'number' && item.releaseHype <= 35) bonus -= 2;
      extraPromoHypeByArtistId.set(item.artistId, (extraPromoHypeByArtistId.get(item.artistId) || 0) + bonus);
    }

    if (item.itemType === 'snippet') {
      snippetByArtistId.add(item.artistId);
      const snippetId = makeId('trk');
      const snippetPlays = Math.max(18_000, Math.round(item.estimatedPlays));

      newTracks.push({
        id: snippetId,
        title: item.title,
        artistId: item.artistId,
        artistName: item.artistName,
        albumId: 'single',
        albumTitle: 'Сниппет',
        duration: item.duration || `0:${randInt(24, 46)}`,
        plays: snippetPlays,
        likes: Math.round(snippetPlays * 0.08),
        isLiked: false,
        releaseDate: relDate,
        coverUrl: releaseCover,
        featuredArtist: item.featuredArtist,
        isExplicit: item.isExplicit,
        genre: item.genre,
        isSnippet: true,
        snippetTeaser: item.snippetTeaser || SNIPPET_TEASERS[randInt(0, SNIPPET_TEASERS.length - 1)],
        intrinsicQuality: item.qualityScore,
        simGenerated: true,
        promoStrategy: item.promoStrategy,
        releaseHype: item.releaseHype
      });

      weeklyDropsSummary.push({
        id: snippetId,
        title: item.title,
        artistName: item.artistName,
        featuredArtist: item.featuredArtist,
        itemType: 'snippet',
        plays: snippetPlays,
        coverUrl: releaseCover,
        genre: item.genre
      });
      return;
    }

    droppedByArtistId.add(item.artistId);
    creditFeaturedArtists(item.featuredArtist);
    creditFeaturedArtists(item.coArtist);

    if (item.itemType === 'album') {
      const albId = makeId('alb');
      const albumTracksList: SimAlbumTrack[] =
        item.albumTracks && item.albumTracks.length > 0
          ? item.albumTracks
          : generateAlbumTracksWithFeats({
              artist: art || simState.artists[0],
              allArtists: simState.artists,
              count: Math.max(3, item.albumTracksCount || item.albumTrackTitles?.length || 10),
              estimatedAlbumPlays: item.estimatedPlays,
              existingTitles,
              namingProfile: namingProf,
              coArtist: item.coArtist || item.featuredArtist
            });

      let albTotal = 0;
      const perTrackFallback = Math.max(35_000, Math.round(item.estimatedPlays / Math.max(1, albumTracksList.length)));

      albumTracksList.forEach((tr, tIdx) => {
        const weight = tIdx === 0 ? 1.45 : tIdx <= 2 ? 1.20 : randRange(0.75, 1.05);
        const plays = tr.plays && tr.plays > 0 ? Math.round(tr.plays) : Math.round(perTrackFallback * weight);
        albTotal += plays;

        creditFeaturedArtists(tr.featuredArtist);

        newTracks.push({
          id: makeId('trk'),
          title: tr.title,
          artistId: item.artistId,
          artistName: item.artistName,
          albumId: albId,
          albumTitle: item.title,
          duration: tr.duration || getRandomDuration(),
          plays,
          likes: Math.round(plays * randRange(0.045, 0.085)),
          isLiked: false,
          releaseDate: relDate,
          coverUrl: releaseCover,
          featuredArtist: tr.featuredArtist || (tIdx === 1 && item.featuredArtist ? item.featuredArtist : undefined),
          isExplicit: tr.isExplicit ?? item.isExplicit,
          genre: item.genre,
          intrinsicQuality: clamp(item.qualityScore + randInt(-5, 5), 50, 90),
          simGenerated: true,
          promoStrategy: item.promoStrategy,
          releaseHype: item.releaseHype
        });
      });

      newAlbums.push({
        id: albId,
        title: item.title,
        artistId: item.artistId,
        artistName: item.artistName,
        coverUrl: releaseCover,
        releaseYear: parseInt(relDate.slice(0, 4), 10) || 2026,
        releaseDate: relDate,
        genre: item.genre,
        coArtist: item.coArtist,
        isLiked: false,
        totalPlays: albTotal,
        intrinsicQuality: item.qualityScore,
        simGenerated: true,
        promoStrategy: item.promoStrategy,
        releaseHype: item.releaseHype
      });

      weeklyDropsSummary.push({
        id: albId,
        title: item.title,
        artistName: item.artistName,
        featuredArtist: item.featuredArtist || item.coArtist,
        itemType: 'album',
        plays: albTotal,
        coverUrl: releaseCover,
        genre: item.genre,
        trackCount: albumTracksList.length
      });
    } else {
      const trkId = makeId('trk');
      const plays = Math.max(65_000, Math.round(item.estimatedPlays));

      newTracks.push({
        id: trkId,
        title: item.title,
        artistId: item.artistId,
        artistName: item.artistName,
        albumId: 'single',
        albumTitle: 'Single',
        duration: item.duration || getRandomDuration(),
        plays,
        likes: Math.round(plays * randRange(0.05, 0.09)),
        isLiked: false,
        releaseDate: relDate,
        coverUrl: releaseCover,
        featuredArtist: item.featuredArtist,
        isExplicit: item.isExplicit,
        genre: item.genre,
        intrinsicQuality: item.qualityScore,
        simGenerated: true,
        promoStrategy: item.promoStrategy,
        releaseHype: item.releaseHype
      });

      weeklyDropsSummary.push({
        id: trkId,
        title: item.title,
        artistName: item.artistName,
        featuredArtist: item.featuredArtist,
        itemType: 'track',
        plays,
        coverUrl: releaseCover,
        genre: item.genre
      });
    }
  });

  // 4. Slow, steady post-release growth (higher upfront debuts, slower weekly accumulation)
  const newTrackIds = new Set(newTracks.map(t => t.id));
  const artistAvgCatalogMap = new Map<string, number>();
  const artistAvgAccum = new Map<string, { sum: number; cnt: number }>();
  simState.tracks.forEach(tr => {
    if (!tr.isSnippet && (tr.plays || 0) > 0 && (tr.releaseDate || '1900-01-01') <= toDate) {
      const prev = artistAvgAccum.get(tr.artistId) || { sum: 0, cnt: 0 };
      prev.sum += tr.plays || 0;
      prev.cnt += 1;
      artistAvgAccum.set(tr.artistId, prev);
    }
  });
  artistAvgAccum.forEach((v, k) => {
    if (v.cnt > 0) artistAvgCatalogMap.set(k, Math.round(v.sum / v.cnt));
  });

  const sleeperChance = virality === 'viral' ? 0.040 : virality === 'stable' ? 0.008 : 0.016;
  const updatedTracksPreChart: Track[] = [...simState.tracks, ...newTracks].map(t => {
    if (newTrackIds.has(t.id)) return t;
    const rel = t.releaseDate || '1900-01-01';
    if (rel > toDate) return t;

    const ageDays = Math.max(1, diffDaysISO(rel, toDate));
    const art = artistMap.get(t.artistId);
    const baseFollowers = Math.max(30_000, art?.followers || 220_000);
    const artistCatalogAvg = artistAvgCatalogMap.get(t.artistId) || 0;
    const artistHype = art?.hype ?? 50;
    const quality = t.rating?.totalScore ?? t.intrinsicQuality ?? 68;

    const qualityBoost = 0.78 + clamp((quality - 45) / 45, 0.1, 1.1) * 0.50;
    const hypeBoost = 0.93 + (artistHype / 100) * 0.14;
    const stratCfg = getPromoStrategyConfig(t.promoStrategy);
    const promoSleeperBoost =
      t.promoStrategy === 'viral_push' || t.promoStrategy === 'tiktok_trend'
        ? 2.4
        : t.promoStrategy === 'quiet' && ageDays > 21
          ? 2.1
          : stratCfg && stratCfg.viralBonus > 0.03
            ? 1.5
            : 1.0;
    const isSleeperHit =
      !t.isSnippet && ageDays > 28 && ageDays <= 270 && Math.random() < sleeperChance * promoSleeperBoost * engineSleeper(art, !t.simGenerated);
    const randomMult = isSleeperHit ? randRange(1.55, 2.25) : randRange(0.86, 1.14);

    // Slower weekly growth ceiling anchored to sublinear reach + catalog averages
    const weeklyCompressedReach = getCompressedReach(baseFollowers, 0, artistCatalogAvg);
    const strategyGrowthMult = stratCfg
      ? t.promoStrategy === 'quiet' && ageDays <= 21
        ? 0.94
        : stratCfg.growthMult
      : 1.0;
    const relHypeGrowthMult =
      typeof t.releaseHype === 'number' && !isNaN(t.releaseHype)
        ? 0.82 + (clamp(t.releaseHype, 10, 99) / 100) * 0.42
        : 1.0;

    const tierWeeklyCeiling = Math.round(
      Math.max(30_000, weeklyCompressedReach * 0.068 * qualityBoost * hypeBoost * strategyGrowthMult * relHypeGrowthMult)
    );

    let ageDecayRate = 0.0012;
    if (ageDays <= 7) ageDecayRate = 0.085;
    else if (ageDays <= 14) ageDecayRate = 0.060;
    else if (ageDays <= 30) ageDecayRate = 0.039;
    else if (ageDays <= 60) ageDecayRate = 0.021;
    else if (ageDays <= 120) ageDecayRate = 0.010;
    else if (ageDays <= 210) ageDecayRate = 0.0046;
    else if (ageDays <= 365) ageDecayRate = 0.0022;
    else ageDecayRate = 0.0010;

    // Pre-existing DB tracks were created with upfront streams already accounted for
    const catalogDamping = t.simGenerated ? 1.0 : ageDays <= 30 ? 0.24 : ageDays <= 120 ? 0.16 : 0.09;
    if (t.isSnippet) ageDecayRate *= 0.20;

    // Anchor percentage growth to a bounded base so high upfront totals grow gradually
    const effectiveBase = Math.min(t.plays || 120_000, tierWeeklyCeiling * 5.2);
    const rawDelta = Math.round(
      effectiveBase * ageDecayRate * catalogDamping * qualityBoost * hypeBoost * randomMult * stepFactor
    );
    const hardCap = Math.round(tierWeeklyCeiling * (t.simGenerated ? 0.88 : 0.38) * (isSleeperHit ? 1.60 : 1.0) * stepFactor);
    const deltaPlays = engineGrowth(clamp(rawDelta, Math.round(350 * stepFactor), Math.max(1_600, hardCap)), { artist: art, ageDays, catalog: !t.simGenerated });

    const nextPlays = (t.plays || 0) + deltaPlays;
    const nextLikes = (t.likes || 0) + Math.round(deltaPlays * randRange(0.03, 0.06));

    return {
      ...t,
      plays: nextPlays,
      likes: nextLikes
    };
  });

  // 5. Recompute album totalPlays & update chart positions
  const albumPlaySums = new Map<string, number>();
  updatedTracksPreChart.forEach(t => {
    if (!t.isSnippet && (t.releaseDate || '1900-01-01') <= toDate && t.albumId && t.albumId !== 'single') {
      albumPlaySums.set(t.albumId, (albumPlaySums.get(t.albumId) || 0) + (t.plays || 0));
    }
  });

  const allAlbumsPreChart: Album[] = [...simState.albums, ...newAlbums].map(al => {
    const sum = albumPlaySums.get(al.id);
    return sum && sum > 0 ? { ...al, totalPlays: sum } : al;
  });

  const revivalNote = applyCatalogRevivals(updatedTracksPreChart, toDate);
  const newRankedTracks = rankTracksForChart(updatedTracksPreChart, toDate);
  const newTrackRankMap = new Map<string, number>();
  const top50CountByArtist = new Map<string, number>();
  const top15ArtistIds = new Set<string>();
  const top3ArtistIds = new Set<string>();

  newRankedTracks.forEach((t, idx) => {
    const rank = idx + 1;
    newTrackRankMap.set(t.id, rank);
    if (rank <= 50) {
      top50CountByArtist.set(t.artistId, (top50CountByArtist.get(t.artistId) || 0) + 1);
    }
    if (rank <= 15) top15ArtistIds.add(t.artistId);
    if (rank <= 3) top3ArtistIds.add(t.artistId);
  });

  let biggestClimber: SimWeekDigest['biggestClimber'];
  let bestClimbDelta = 0;

  const finalTracks: Track[] = updatedTracksPreChart.map(t => {
    const rank = newTrackRankMap.get(t.id);
    if (!rank) return t;
    const prevRank = prevTrackRanks.get(t.id);
    if (prevRank && prevRank - rank > bestClimbDelta && !newTrackIds.has(t.id)) {
      bestClimbDelta = prevRank - rank;
      biggestClimber = {
        id: t.id,
        title: t.title,
        artistName: t.artistName,
        fromRank: prevRank,
        toRank: rank,
        delta: prevRank - rank
      };
    }
    const prevWeeks = t.weeksOnChart || (prevRank ? 1 : 0);
    const weeksOnChart = rank <= 60 ? prevWeeks + 1 : t.weeksOnChart;
    const peakChartPosition = t.peakChartPosition ? Math.min(t.peakChartPosition, rank) : rank;
    const history = [...(t.chartHistory || []), rank].slice(-16);

    return {
      ...t,
      previousChartPosition: prevRank,
      weeksOnChart,
      peakChartPosition,
      chartHistory: history
    };
  });

  const newRankedAlbums = rankAlbumsForChart(allAlbumsPreChart, finalTracks, toDate);
  const newAlbumRankMap = new Map<string, number>();
  newRankedAlbums.forEach((al, idx) => newAlbumRankMap.set(al.id, idx + 1));

  const finalAlbums: Album[] = allAlbumsPreChart.map(al => {
    const rank = newAlbumRankMap.get(al.id);
    if (!rank) return al;
    const prevRank = prevAlbumRanks.get(al.id);
    const prevWeeks = al.weeksOnChart || (prevRank ? 1 : 0);
    const weeksOnChart = rank <= 40 ? prevWeeks + 1 : al.weeksOnChart;
    const peakChartPosition = al.peakChartPosition ? Math.min(al.peakChartPosition, rank) : rank;
    const history = [...(al.chartHistory || []), rank].slice(-16);

    return {
      ...al,
      previousChartPosition: prevRank,
      weeksOnChart,
      peakChartPosition,
      chartHistory: history
    };
  });

  // 6. Gentle, realistic Listener Evolution & Catalog-Cushioned Decay
  const postIndex = buildCatalogIndex(finalTracks, finalAlbums, toDate);
  const listenerChanges: Array<{ artistId: string; name: string; delta: number; newFollowers: number }> = [];

  const finalArtists: Artist[] = simState.artists.map(art => {
    const baseFollowers = Math.max(25_000, art.followers || 100_000);
    const bucket = getArtistBucketFromIndex(art, postIndex);
    const metrics = computeArtistMetricsFast(art, bucket.myTracks, bucket.myAlbums, toDate);
    const currentHype = art.hype ?? metrics.hype;

    const scaleDamping =
      baseFollowers >= 20_000_000
        ? 0.28
        : baseFollowers >= 8_000_000
          ? 0.42
          : baseFollowers >= 2_500_000
            ? 0.65
            : 1.0;

    const inTop50 = top50CountByArtist.get(art.id) || 0;
    const decayCushion = clamp(1 - inTop50 * 0.22 - metrics.topHitsCount * 0.14, 0.10, 1.0);

    let pctChange = 0;
    let hypeDelta = extraPromoHypeByArtistId.get(art.id) || 0;

    if (droppedByArtistId.has(art.id)) {
      pctChange += randRange(0.012, 0.036) * scaleDamping;
      hypeDelta += randInt(6, 13);
    }
    if (collabByArtistId.has(art.id)) {
      pctChange += randRange(0.008, 0.022) * scaleDamping;
      hypeDelta += randInt(3, 8);
    }
    if (snippetByArtistId.has(art.id)) {
      pctChange += randRange(0.002, 0.009) * scaleDamping;
      hypeDelta += randInt(4, 9);
    }
    if (top3ArtistIds.has(art.id)) {
      pctChange += randRange(0.008, 0.022) * scaleDamping;
      hypeDelta += randInt(3, 6);
    } else if (top15ArtistIds.has(art.id) || inTop50 >= 2) {
      pctChange += randRange(0.003, 0.011) * scaleDamping;
      hypeDelta += randInt(1, 3);
    }

    if (!droppedByArtistId.has(art.id) && !snippetByArtistId.has(art.id) && !top15ArtistIds.has(art.id)) {
      if (metrics.daysSilent > 55) {
        pctChange -= randRange(0.003, 0.012) * scaleDamping * decayCushion;
        hypeDelta -= Math.max(1, Math.round(randInt(2, 5) * (0.5 + decayCushion * 0.5)));
      } else if (metrics.daysSilent > 28) {
        pctChange -= randRange(0.001, 0.005) * scaleDamping * decayCushion;
        hypeDelta -= 1;
      }
    }

    const scaledPct = engineListeners(pctChange, art, stepFactor);
    const delta = Math.round(baseFollowers * scaledPct);
    const nextFollowers = Math.max(15_000, baseFollowers + delta);
    const nextHype = clamp(Math.round(currentHype + engineHype(hypeDelta, art) * Math.min(1.5, stepFactor)), 8, 99);

    listenerChanges.push({
      artistId: art.id,
      name: art.name,
      delta,
      newFollowers: nextFollowers
    });

    return {
      ...art,
      followers: nextFollowers,
      hype: nextHype,
      isRisingStar: nextHype >= 80 ? true : nextHype <= 40 ? false : art.isRisingStar
    };
  });

  // 7. Build Digest Summary
  const topNewTrack = [...newTracks]
    .filter(t => !t.isSnippet)
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))[0];

  const topDebut: SimWeekDigest['topDebut'] = topNewTrack
    ? {
        id: topNewTrack.id,
        title: topNewTrack.albumId !== 'single' ? topNewTrack.albumTitle : topNewTrack.title,
        artistName: topNewTrack.artistName,
        plays: topNewTrack.plays,
        type: topNewTrack.albumId !== 'single' ? 'album' : 'track',
        coverUrl: topNewTrack.coverUrl
      }
    : undefined;

  const gainers = [...listenerChanges].filter(x => x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 4);
  const losers = [...listenerChanges].filter(x => x.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 4);

  const highlights: string[] = [];
  if (revivalNote) highlights.push(revivalNote);
  const realDropsCount = newAlbums.length + newTracks.filter(t => !t.isSnippet && t.albumId === 'single').length;
  const snippetsCount = newTracks.filter(t => t.isSnippet).length;

  if (topDebut) {
    highlights.push(`Главная премьера: ${topDebut.artistName} — «${topDebut.title}» (${formatCompact(topDebut.plays)} просл.)`);
  }
  if (newRankedTracks[0]) {
    const leader = newRankedTracks[0];
    highlights.push(`Лидер чарта недели: ${leader.artistName} — «${leader.title}»`);
  }
  if (biggestClimber) {
    highlights.push(`Рывок недели: «${biggestClimber.title}» поднялся на +${biggestClimber.delta} поз. (#${biggestClimber.toRank})`);
  }
  if (snippetsCount > 0) {
    highlights.push(`Новых сниппетов и прогревов: ${snippetsCount}`);
  }

  const digest: SimWeekDigest = {
    weekNumber: nextWeek,
    fromDate,
    toDate,
    newReleasesCount: realDropsCount,
    newSnippetsCount: snippetsCount,
    topDebut,
    biggestClimber,
    topListenersGainers: gainers,
    topListenersLosers: losers,
    highlights,
    weeklyDrops: weeklyDropsSummary
  };

  const prevHistory = Array.isArray(simState.digestHistory)
    ? simState.digestHistory
    : simState.lastDigest
      ? [simState.lastDigest]
      : [];
  const nextDigestHistory = [
    digest,
    ...prevHistory.filter(d => d.weekNumber !== digest.weekNumber)
  ].slice(0, 120);

  return {
    ...simState,
    currentDate: toDate,
    weekNumber: nextWeek,
    artists: finalArtists,
    albums: finalAlbums,
    tracks: finalTracks,
    lastDigest: digest,
    digestHistory: nextDigestHistory,
    undoStack: nextUndoStack
  };
}

// ============================================================================
// SIMULATION TOP CONTROL BAR (COLLAPSIBLE & RESPONSIVE)
// ============================================================================

export const SimControlBar: React.FC<{
  simState: SimState;
  isHidden?: boolean;
  onToggleHide?: () => void;
  onQuickStep: (days: number) => void;
  onOpenConsole: (initialTab?: SimModeType | 'radar' | 'digest') => void;
  onUndoStep: () => void;
  onExitSim: () => void;
}> = memo(({ simState, isHidden = false, onToggleHide, onQuickStep, onOpenConsole, onUndoStep, onExitSim }) => {
  if (isHidden) {
    return (
      <div className="fixed top-[4.25rem] right-4 md:right-7 z-40">
        <button
          type="button"
          onClick={onToggleHide}
          className="px-3 py-1.5 rounded-xl bg-zinc-950/95 hover:bg-zinc-900 border border-white/15 hover:border-white/30 text-xs font-semibold text-zinc-200 shadow-2xl flex items-center gap-2 transition-colors cursor-pointer"
          title="Показать верхнюю панель симуляции"
        >
          <FastForward className="w-3.5 h-3.5 theme-accent" />
          <span className="font-mono tabular-nums">{formatSimDate(simState.currentDate)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-white/[0.08] bg-zinc-950/92 px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-30 min-w-0">
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full theme-bg-accent shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 whitespace-nowrap">
            Симуляция
          </span>
        </div>
        <span className="text-zinc-600" aria-hidden="true">·</span>
        <span className="text-xs md:text-sm font-bold text-white font-mono tabular-nums whitespace-nowrap">
          {formatSimDate(simState.currentDate)}
        </span>
        <span className="text-xs text-zinc-400 font-medium tabular-nums whitespace-nowrap">
          Неделя {simState.weekNumber}
        </span>
        {simState.lastDigest && (
          <span className="hidden xl:inline text-xs text-zinc-500 truncate max-w-[300px]">
            · {simState.lastDigest.newReleasesCount} рел. / {simState.lastDigest.newSnippetsCount} снип.
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={() => onQuickStep(1)}
          className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] border border-white/10 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
          title="Промотать 1 день вперёд"
        >
          +1 дн.
        </button>
        <button
          type="button"
          onClick={() => onQuickStep(7)}
          className="px-3 py-1.5 rounded-xl theme-bg-accent text-black text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shadow-lg"
          title="Автоматически просимулировать следующую неделю"
        >
          <FastForward className="w-3.5 h-3.5 fill-black" />
          <span>+1 неделя</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenConsole('semi')}
          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Sliders className="w-3.5 h-3.5 theme-accent" />
          <span>Пульт недели</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenConsole('radar')}
          className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          title="Радар готовности и хайпа артистов"
        >
          <Radar className="w-3.5 h-3.5" />
          <span>Радар</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenConsole('digest')}
          className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          title="Слоты сохранения и итоги недели"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Слоты</span>
        </button>
        {simState.undoStack.length > 0 && (
          <button
            type="button"
            onClick={onUndoStep}
            className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Откатить последний шаг"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onExitSim}
          className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-300 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
          title="Выйти из симуляции и вернуться к обычной базе"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Выйти</span>
        </button>

        {onToggleHide && (
          <button
            type="button"
            onClick={onToggleHide}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Скрыть верхнюю панель симуляции"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// SEARCHABLE ARTIST PICKER MODAL (FAST, ZERO-LAG FOR LARGE CATALOGS)
// ============================================================================

const SimArtistPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  artists: Artist[];
  metricsMap?: Map<string, ArtistSimMetrics>;
  onSelect: (artist: Artist) => void;
  onRequestCreateNew?: (prefillName?: string) => void;
}> = ({ isOpen, onClose, title, artists, metricsMap, onSelect, onRequestCreateNew }) => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [sortBy, setSortBy] = useState<'followers_desc' | 'followers_asc' | 'hype_desc' | 'days_desc' | 'name_asc'>('followers_desc');
  const [filterMode, setFilterMode] = useState<'all' | 'nonzero' | 'stars' | 'rising'>('all');
  const [visibleLimit, setVisibleLimit] = useState(40);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setVisibleLimit(40);
    }
  }, [isOpen]);

  useEffect(() => {
    setVisibleLimit(40);
  }, [deferredQuery, sortBy, filterMode]);

  const filteredAndSorted = useMemo(() => {
    if (!isOpen) return [];
    const q = deferredQuery.trim().toLowerCase();

    const list = artists.filter(a => {
      const f = a.followers || 0;
      if (filterMode === 'nonzero' && f <= 0) return false;
      if (filterMode === 'stars' && f < 2_500_000) return false;
      if (filterMode === 'rising' && f >= 500_000) return false;
      if (q) {
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesGenre = (a.genre || '').toLowerCase().includes(q);
        if (!matchesName && !matchesGenre) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const fA = a.followers || 0;
      const fB = b.followers || 0;
      if (sortBy === 'followers_desc') return fB - fA;
      if (sortBy === 'followers_asc') return fA - fB;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'ru-RU', { sensitivity: 'base' });
      const mA = metricsMap?.get(a.id);
      const mB = metricsMap?.get(b.id);
      if (sortBy === 'hype_desc') {
        const hA = mA?.hype ?? a.hype ?? 50;
        const hB = mB?.hype ?? b.hype ?? 50;
        return hB - hA || fB - fA;
      }
      if (sortBy === 'days_desc') {
        const dA = mA?.daysSilent ?? 30;
        const dB = mB?.daysSilent ?? 30;
        return dB - dA || fB - fA;
      }
      return fB - fA;
    });

    return list;
  }, [isOpen, artists, deferredQuery, filterMode, sortBy, metricsMap]);

  const visibleSlice = useMemo(() => {
    return filteredAndSorted.slice(0, visibleLimit);
  }, [filteredAndSorted, visibleLimit]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 160) {
      if (visibleLimit < filteredAndSorted.length) {
        setVisibleLimit(prev => Math.min(prev + 40, filteredAndSorted.length));
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-zinc-900/60">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-white truncate">{title}</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 tabular-nums">
              Найдено: {filteredAndSorted.length} артистов {visibleSlice.length < filteredAndSorted.length ? `(показано ${visibleSlice.length})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onRequestCreateNew && (
              <button
                type="button"
                onClick={() => onRequestCreateNew(query.trim() || undefined)}
                className="px-3 py-1.5 rounded-xl theme-bg-accent text-black text-xs font-extrabold flex items-center gap-1 hover:opacity-90 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Создать артиста</span>
                <span className="sm:hidden">Создать</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-zinc-950/90 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по имени или жанру..."
              className="w-full bg-zinc-900/90 border border-white/12 focus:border-white/30 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          {/* Controls: Filter and Sort */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-xl border border-white/[0.08]">
              {[
                { id: 'all', label: 'Все' },
                { id: 'nonzero', label: '>0 слуш.' },
                { id: 'stars', label: 'Звёзды (2.5M+)' },
                { id: 'rising', label: 'Новички' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id as typeof filterMode)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    filterMode === f.id
                      ? 'theme-bg-accent text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">Сортировка:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-zinc-200 outline-none cursor-pointer"
              >
                <option value="followers_desc">Слушатели (убывание)</option>
                <option value="followers_asc">Слушатели (возрастание)</option>
                <option value="hype_desc">Хайп (высокий)</option>
                <option value="days_desc">Дни без дропа (макс.)</option>
                <option value="name_asc">Имя (А–Я)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable list with progressive loading and smooth performance */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-[300px]"
        >
          {filteredAndSorted.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <p className="text-xs text-zinc-400">Артисты не найдены по выбранным параметрам</p>
              {onRequestCreateNew && (
                <button
                  type="button"
                  onClick={() => onRequestCreateNew(query.trim() || undefined)}
                  className="px-4 py-2 rounded-xl theme-bg-accent text-black text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{query.trim() ? `Создать «${query.trim()}»` : 'Создать нового артиста'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {visibleSlice.map(art => {
                const m = metricsMap?.get(art.id);
                const tier = getArtistFollowerTier(art.followers);
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      onSelect(art);
                      onClose();
                    }}
                    className="w-full px-3 py-2.5 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CoverArt
                        url={art.imageUrl}
                        title={art.name}
                        isArtist
                        className="w-10 h-10 rounded-full shrink-0 border border-white/10 group-hover:border-white/25"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:theme-accent transition-colors">
                            {art.name}
                          </p>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${tier.badgeClass}`}>
                            {tier.shortLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate tabular-nums mt-0.5">
                          {formatListeners(art.followers)}
                          {art.genre ? ` · ${art.genre}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {m ? (
                        <span className="text-[11px] font-mono text-zinc-400 tabular-nums block">
                          Хайп <strong className="text-white">{m.hype}</strong> · <span className="text-amber-300 font-bold">{m.daysSilent}д</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 tabular-nums">
                          {formatCompact(art.followers)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {visibleLimit < filteredAndSorted.length && (
                <div className="pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(prev => Math.min(prev + 50, filteredAndSorted.length))}
                    className="w-full py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Показать ещё ({filteredAndSorted.length - visibleLimit} осталось)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// CREATE ARTIST MODAL DIRECTLY IN SIMULATION WEEK (FULL STUDIO EDITOR PARITY)
// ============================================================================

const SimCreateArtistModal: React.FC<{
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (artist: Artist) => void;
  onGenerateBio?: (name: string, genre: string) => Promise<string>;
}> = ({ isOpen, initialName = '', onClose, onCreated, onGenerateBio }) => {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [followersStr, setFollowersStr] = useState('250 000');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [verified, setVerified] = useState(true);
  const [isRisingStar, setIsRisingStar] = useState(false);
  const [hype, setHype] = useState(62);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setGenre('');
      setFollowersStr('250 000');
      setCountry('');
      setBio('');
      setImageUrl('');
      setVerified(true);
      setIsRisingStar(false);
      setHype(62);
      setIsGeneratingBio(false);
      setIsCoverEditorOpen(false);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleRandomFollowers = () => {
    const val = randInt(200_000, 15_000_000);
    setFollowersStr(formatNumber(val));
  };

  const handleFillRealisticStats = () => {
    const val = randInt(35_000, 18_500_000);
    setFollowersStr(formatNumber(val));
    if (!genre) {
      const pick = GENRE_CATALOG[randInt(0, GENRE_CATALOG.length - 1)];
      if (pick) setGenre(pick.name);
    }
    if (!country) {
      const cities = ['Россия, Москва', 'Россия, Санкт-Петербург', 'США, Лос-Анджелес', 'США, Атланта', 'Великобритания, Лондон', 'Казахстан, Алматы'];
      setCountry(cities[randInt(0, cities.length - 1)]);
    }
    setHype(randInt(46, 86));
  };

  const handleGenerateBioClick = async () => {
    const cleanName = name.trim() || 'Новый артист';
    setIsGeneratingBio(true);
    try {
      if (onGenerateBio) {
        try {
          const res = await onGenerateBio(cleanName, genre.trim() || 'Хип-хоп');
          if (res && res.trim()) {
            setBio(res.trim());
            return;
          }
        } catch (err) {
          console.warn('AI bio fallback:', err);
        }
      }
      const g = genre.trim() || 'современный хип-хоп и альт-поп';
      setBio(`${cleanName} — самобытный исполнитель на стыке жанров (${g}), известный атмосферным продакшеном, узнаваемой подачей и смелыми экспериментами со звучанием.`);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    const newArtist: Artist = {
      id: makeId('art'),
      name: cleanName,
      bio: bio.trim(),
      imageUrl,
      genre: genre.trim() || 'Рэп и Хип-хоп',
      followers: parseFormattedNumber(followersStr),
      verified,
      country: country.trim() || undefined,
      isRisingStar,
      hype
    };
    onCreated(newArtist);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-zinc-900/50">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 theme-accent shrink-0" />
              <span>Создать артиста в активную неделю</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              После сохранения артист сразу появится в текущей неделе — на свой релиз, фит, в соавторы и радар
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Avatar / Media Column (Studio Parity) */}
            <div className="md:col-span-4 space-y-3">
              <label className="block w-full aspect-square max-w-[220px] mx-auto md:max-w-none bg-zinc-900 border-2 border-dashed border-white/15 hover:border-white/30 rounded-3xl overflow-hidden relative cursor-pointer group shadow-2xl flex flex-col items-center justify-center transition-all">
                {imageUrl ? (
                  <CoverArt
                    url={imageUrl}
                    title={name || 'Артист'}
                    isArtist
                    className="w-full h-full"
                    innerClassName="group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-5 text-center">
                    <ImageIcon className="w-9 h-9 text-zinc-500" />
                    <span className="text-xs font-bold text-white">Загрузить фото</span>
                    <span className="text-[11px] text-zinc-500">Аватар или обложка профиля</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                  Изменить фото
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const b64 = await fileToBase64(f);
                      const mediaId = await saveMediaItem(b64, {
                        type: 'artist',
                        artistName: name.trim() || 'Новый артист'
                      });
                      setImageUrl(mediaId);
                    }
                  }}
                />
              </label>

              <div className="flex items-center gap-2">
                <label className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5 theme-accent shrink-0" />
                  <span>Загрузить фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const b64 = await fileToBase64(f);
                        const mediaId = await saveMediaItem(b64, {
                          type: 'artist',
                          artistName: name.trim() || 'Новый артист'
                        });
                        setImageUrl(mediaId);
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setIsCoverEditorOpen(true)}
                  title="Создать фото профиля в редакторе обложек"
                  className="w-10 h-10 shrink-0 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="w-full text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer text-center"
                >
                  Сбросить фото
                </button>
              )}

              <button
                type="button"
                onClick={handleFillRealisticStats}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Dices className="w-4 h-4 theme-accent" />
                <span>Заполнить реалистичные метрики</span>
              </button>
            </div>

            {/* Right Fields Column (Studio Parity + Sim Hype) */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Имя исполнителя / Название группы</label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="Например: Kizaru, Friendly Thug..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-3 text-sm md:text-base font-bold text-white placeholder:text-zinc-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">Жанр артиста</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_CATALOG.map(g => {
                    const isSelected = genre === g.name;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenre(isSelected ? '' : g.name)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'theme-bg-accent text-black shadow-md'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Или укажите свой жанр..."
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-300">Ежемесячные слушатели</label>
                    <button
                      type="button"
                      onClick={handleRandomFollowers}
                      className="text-[11px] theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5" /> 200к–15М
                    </button>
                  </div>
                  <input
                    type="text"
                    value={followersStr}
                    onChange={e => {
                      const num = e.target.value.replace(/\D/g, '');
                      setFollowersStr(formatNumber(parseInt(num, 10) || 0));
                    }}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white outline-none tabular-nums"
                  />
                  {(() => {
                    const parsedF = parseFormattedNumber(followersStr);
                    const fTier =
                      parsedF >= 8_000_000
                        ? { name: 'Мега-топ (8М+)', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25' }
                        : parsedF >= 2_500_000
                          ? { name: 'Крупный (2.5М–8М)', cls: 'text-violet-300 bg-violet-500/10 border-violet-500/25' }
                          : parsedF >= 300_000
                            ? { name: 'Средний (300к–2.5М)', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/25' }
                            : { name: 'Новичок (до 300к)', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' };
                    return (
                      <div className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center justify-between ${fTier.cls}`}>
                        <span>Категория артиста:</span>
                        <span className="font-bold">{fTier.name}</span>
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: 'Новичок 150к', val: 150_000 },
                      { label: 'Средний 1.2М', val: 1_200_000 },
                      { label: 'Крупный 4.5М', val: 4_500_000 },
                      { label: 'Мега-топ 12М', val: 12_000_000 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFollowersStr(formatNumber(preset.val))}
                        className="px-2 py-0.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-[10px] font-semibold text-zinc-300 hover:text-white cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Страна / Локация</label>
                    <input
                      type="text"
                      placeholder="Россия, Москва..."
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white placeholder:text-zinc-500 outline-none"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-200">Стартовый хайп</label>
                      <span className="text-xs font-mono font-bold text-white tabular-nums">{hype} / 99</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={99}
                      value={hype}
                      onChange={e => setHype(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Затишье 20', val: 20 },
                        { label: 'База 45', val: 45 },
                        { label: 'Разогрев 64', val: 64 },
                        { label: 'Тренд 80', val: 80 },
                        { label: 'Пик 94', val: 94 }
                      ].map(hp => (
                        <button
                          key={hp.val}
                          type="button"
                          onClick={() => setHype(hp.val)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer transition-colors ${
                            Math.abs(hype - hp.val) <= 6
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {hp.label}
                        </button>
                      ))}
                    </div>
                    {(() => {
                      const debutPct = Math.round(((0.90 + (hype / 100) * 0.22) - 1) * 100);
                      const weeklyPct = Math.round(((0.93 + (hype / 100) * 0.14) - 1) * 100);
                      const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v}%`;
                      const hypeTierInfo =
                        hype >= 85
                          ? {
                              title: 'Пик волны (85–99)',
                              desc: 'Максимальный приоритет в Радаре и полуавто-дропах, заметный инфоповод вокруг релиза.'
                            }
                          : hype >= 70
                            ? {
                                title: 'Тренд / Горячий интерес (70–84)',
                                desc: 'Высокая готовность к дропу в Радаре и лёгкий импульс к вниманию слушателей.'
                              }
                            : hype >= 50
                              ? {
                                  title: 'Разогрев (50–69)',
                                  desc: 'Умеренный медиа-фон: артист активен в повестке, но решает качество трека.'
                                }
                              : hype >= 30
                                ? {
                                    title: 'Ровная база (30–49)',
                                    desc: 'Нейтральный старт без перекосов — цифры опираются на слушателей и прошлые хиты.'
                                  }
                                : {
                                    title: 'Затишье / Андеграунд (5–29)',
                                    desc: 'Низкий шум до выхода трека: сильный релиз или фит всё равно может выстрелить.'
                                  };
                      return (
                        <div className="pt-1 border-t border-white/[0.06] space-y-1 text-[11px] leading-snug">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-emerald-300">{hypeTierInfo.title}</span>
                            <span className="font-mono text-zinc-300 tabular-nums">
                              старт {fmtPct(debutPct)} · рост {fmtPct(weeklyPct)}
                            </span>
                          </div>
                          <p className="text-zinc-400">{hypeTierInfo.desc}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-300">Биография артиста</label>
                  <button
                    type="button"
                    onClick={handleGenerateBioClick}
                    disabled={isGeneratingBio}
                    className="text-xs font-bold theme-accent hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingBio ? 'Генерация...' : 'Сгенерировать биографию (AI)'}</span>
                  </button>
                </div>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Описание творческого пути, анонсы и факты..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-2xl p-3.5 text-xs md:text-sm font-medium text-white placeholder:text-zinc-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <label className="flex items-center gap-2.5 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={e => setVerified(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-300">Подтвержденный профиль ✓</span>
                </label>

                <label className="flex items-center gap-2.5 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={isRisingStar}
                    onChange={e => setIsRisingStar(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-300">Восходящая звезда 🔥</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] bg-zinc-900/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-5 py-2.5 rounded-xl theme-bg-accent text-black text-xs font-extrabold hover:opacity-90 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Создать и добавить в неделю</span>
          </button>
        </div>
      </form>

      <CoverEditorModal
        isOpen={isCoverEditorOpen}
        onClose={() => setIsCoverEditorOpen(false)}
        initialTitle={name.trim() || 'ARTIST'}
        initialArtist={genre.trim() || ''}
        onApplyDataUrl={async dataUrl => {
          const mediaId = await saveMediaItem(dataUrl, {
            type: 'artist',
            artistName: name.trim() || 'Новый артист'
          });
          setImageUrl(mediaId);
        }}
      />
    </div>,
    document.body
  );
};

// ============================================================================
// FULL PROPOSAL RELEASE EDITOR MODAL (IN SEMI-AUTO)
// ============================================================================

const SimProposalEditorModal: React.FC<{
  proposal: SimProposal | null;
  artists: Artist[];
  metricsMap: Map<string, ArtistSimMetrics>;
  onClose: () => void;
  onSave: (updated: SimProposal) => void;
  onCreateArtist?: (artist: Artist) => void;
  onGenerateArtistBio?: (name: string, genre: string) => Promise<string>;
}> = ({ proposal, artists, metricsMap, onClose, onSave, onCreateArtist, onGenerateArtistBio }) => {
  const [draft, setDraft] = useState<SimProposal | null>(null);
  const [pickerMode, setPickerMode] = useState<'main' | 'feat' | 'co' | 'track_feat' | null>(null);
  const [createArtistTarget, setCreateArtistTarget] = useState<{
    mode: 'main' | 'feat' | 'co' | 'track_feat';
    prefillName?: string;
  } | null>(null);
  const [isParserOpen, setIsParserOpen] = useState(false);

  const [newTrTitle, setNewTrTitle] = useState('');
  const [newTrDuration, setNewTrDuration] = useState('2:35');
  const [newTrPlays, setNewTrPlays] = useState('');
  const [newTrFeat, setNewTrFeat] = useState('');
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);

  useEffect(() => {
    if (proposal) {
      setDraft({
        ...proposal,
        albumTracks: proposal.albumTracks ? proposal.albumTracks.map(t => ({ ...t })) : []
      });
      setNewTrTitle('');
      setNewTrFeat('');
      setNewTrDuration(getRandomDuration());
      setNewTrPlays('');
    } else {
      setDraft(null);
    }
  }, [proposal]);

  if (!draft) return null;

  const currentArtist = artists.find(a => a.id === draft.artistId) || artists[0];
  const currentMetrics = currentArtist ? metricsMap.get(currentArtist.id) : undefined;

  const recalcForecast = (targetDraft: SimProposal) => {
    const art = artists.find(a => a.id === targetDraft.artistId);
    if (!art) return targetDraft.estimatedPlays;
    const feat = targetDraft.featuredArtist
      ? artists.find(a => a.name.toLowerCase() === targetDraft.featuredArtist!.toLowerCase())
      : undefined;
    return forecastReleasePlays({
      artist: art,
      featArtist: feat,
      featuredNames: targetDraft.featuredArtist,
      allArtists: artists,
      itemType: targetDraft.itemType,
      qualityScore: targetDraft.qualityScore,
      hype: targetDraft.artistHype,
      hasWarmup: targetDraft.hasWarmupBoost,
      promoBoost: targetDraft.promoBoost,
      promoStrategy: targetDraft.promoStrategy,
      releaseHype: targetDraft.releaseHype,
      albumTracksCount: targetDraft.albumTracks?.length || targetDraft.albumTracksCount || 8,
      hitsCount: currentMetrics?.topHitsCount || 0,
      catalogAvgPlays: currentMetrics?.catalogAvgPlays || 0
    });
  };

  const handleAddAlbumTrack = () => {
    if (!newTrTitle.trim()) return;
    const fallbackPlays = Math.round(
      Math.max(40_000, (draft.estimatedPlays || 600_000) / Math.max(4, draft.albumTracks?.length || 6))
    );
    const parsedPlays = parseFormattedNumber(newTrPlays) || fallbackPlays;
    const nextTrack: SimAlbumTrack = {
      id: makeId('edtrk'),
      title: newTrTitle.trim(),
      duration: newTrDuration || getRandomDuration(),
      plays: parsedPlays,
      featuredArtist: newTrFeat.trim() || undefined,
      isExplicit: draft.isExplicit
    };
    const nextList = [...(draft.albumTracks || []), nextTrack];
    const sum = nextList.reduce((acc, t) => acc + (t.plays || 0), 0);
    setDraft({
      ...draft,
      albumTracks: nextList,
      albumTracksCount: nextList.length,
      albumTrackTitles: nextList.map(x => x.title),
      estimatedPlays: sum
    });
    setNewTrTitle('');
    setNewTrFeat('');
    setNewTrDuration(getRandomDuration());
    setNewTrPlays('');
  };

  const handleUpdateAlbumTrack = (id: string, patch: Partial<SimAlbumTrack>) => {
    const nextList = (draft.albumTracks || []).map(t => (t.id === id ? { ...t, ...patch } : t));
    const sum = nextList.reduce((acc, t) => acc + (t.plays || 0), 0);
    setDraft({
      ...draft,
      albumTracks: nextList,
      albumTracksCount: nextList.length,
      albumTrackTitles: nextList.map(x => x.title),
      estimatedPlays: sum > 0 ? sum : draft.estimatedPlays
    });
  };

  const handleRemoveAlbumTrack = (id: string) => {
    const nextList = (draft.albumTracks || []).filter(t => t.id !== id);
    const sum = nextList.reduce((acc, t) => acc + (t.plays || 0), 0);
    setDraft({
      ...draft,
      albumTracks: nextList,
      albumTracksCount: nextList.length,
      albumTrackTitles: nextList.map(x => x.title),
      estimatedPlays: sum > 0 ? sum : draft.estimatedPlays
    });
  };

  const handleGenerateRandomFeatsOnAlbum = () => {
    if (!currentArtist || !draft.albumTracks) return;
    const existingSet = new Set<string>(draft.albumTracks.map(x => x.title.toLowerCase()));
    const freshList = generateAlbumTracksWithFeats({
      artist: currentArtist,
      allArtists: artists,
      count: draft.albumTracks.length || 8,
      estimatedAlbumPlays: draft.estimatedPlays,
      existingTitles: existingSet,
      namingProfile: currentMetrics?.namingProfile || /[a-zA-Z]/.test(draft.title),
      coArtist: draft.coArtist
    });
    const merged = draft.albumTracks.map((tr, idx) => ({
      ...tr,
      featuredArtist: freshList[idx]?.featuredArtist,
      isSurpriseFeat: freshList[idx]?.isSurpriseFeat
    }));
    setDraft({ ...draft, albumTracks: merged });
  };

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[calc(100vw-1.5rem)] sm:w-full max-w-4xl max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] bg-zinc-950 border border-white/12 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.02]">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-white truncate">
              Редактор релиза — {draft.artistName}
            </h3>
            <p className="text-xs text-zinc-400">
              Настройте обложку, фиты, прослушивания, качество или полный треклист альбома
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Live Cover Preview */}
            <div className="md:col-span-4 space-y-3">
              <div className="aspect-square w-full max-w-[220px] mx-auto md:max-w-none rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                <CoverArt
                  url={draft.coverUrl}
                  title={draft.title || 'Без названия'}
                  albumTitle={draft.itemType === 'album' ? draft.title : undefined}
                  className="w-full h-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-xl text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                    <FileUp className="w-3.5 h-3.5 theme-accent shrink-0" />
                    <span>Загрузить обложку</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const b64 = await fileToBase64(file);
                          const mediaId = await saveMediaItem(b64, {
                            type: draft.itemType === 'album' ? 'album' : 'track',
                            title: draft.title,
                            artistName: draft.artistName
                          });
                          setDraft(prev => (prev ? { ...prev, coverUrl: mediaId } : prev));
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCoverEditorOpen(true)}
                    title="Создать обложку в редакторе"
                    className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                {draft.coverUrl && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, coverUrl: '' })}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    × Удалить обложку (вернуть сгенерированную)
                  </button>
                )}
              </div>
              <CoverEditorModal
                isOpen={isCoverEditorOpen}
                onClose={() => setIsCoverEditorOpen(false)}
                initialTitle={draft.title}
                initialArtist={draft.artistName}
                onApplyDataUrl={async dataUrl => {
                  const mediaId = await saveMediaItem(dataUrl, {
                    type: draft.itemType === 'album' ? 'album' : 'track',
                    title: draft.title,
                    artistName: draft.artistName
                  });
                  setDraft(prev => (prev ? { ...prev, coverUrl: mediaId } : prev));
                }}
              />
            </div>

            {/* Fields */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
                  {[
                    { id: 'track', label: 'Трек' },
                    { id: 'album', label: 'Альбом' },
                    { id: 'snippet', label: 'Сниппет' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const nextType = t.id as 'track' | 'album' | 'snippet';
                        let nextTracks = draft.albumTracks;
                        if (nextType === 'album' && (!nextTracks || nextTracks.length === 0) && currentArtist) {
                          const existing = new Set<string>([draft.title.toLowerCase()]);
                          nextTracks = generateAlbumTracksWithFeats({
                            artist: currentArtist,
                            allArtists: artists,
                            count: draft.albumTracksCount || 8,
                            estimatedAlbumPlays: draft.estimatedPlays,
                            existingTitles: existing,
                            namingProfile: currentMetrics?.namingProfile || /[a-zA-Z]/.test(draft.title),
                            coArtist: draft.coArtist
                          });
                        }
                        const updated: SimProposal = {
                          ...draft,
                          itemType: nextType,
                          albumTracks: nextTracks,
                          albumTracksCount: nextType === 'album' ? nextTracks?.length || 8 : undefined
                        };
                        updated.estimatedPlays = recalcForecast(updated);
                        setDraft(updated);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        draft.itemType === t.id ? 'theme-bg-accent text-black font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.isExplicit)}
                    onChange={e => setDraft({ ...draft, isExplicit: e.target.checked })}
                    className="rounded accent-emerald-500"
                  />
                  <span>Explicit (E)</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    {draft.itemType === 'album' ? 'Название альбома' : 'Название релиза'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextTitle = generateModernTitle(
                        new Set([draft.title.toLowerCase()]),
                        draft.itemType === 'album',
                        currentMetrics?.namingProfile || false
                      );
                      setDraft({ ...draft, title: nextTitle });
                    }}
                    className="text-[11px] theme-accent font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" /> Подобрать название
                  </button>
                </div>
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => setDraft({ ...draft, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Основной артист</label>
                  <button
                    type="button"
                    onClick={() => setPickerMode('main')}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{draft.artistName}</span>
                    <span className="text-[11px] theme-accent shrink-0 ml-2">Сменить</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-400">
                      {draft.itemType === 'album' ? 'Соавтор альбома' : 'Фит (гость)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setPickerMode(draft.itemType === 'album' ? 'co' : 'feat')}
                      className="text-[11px] theme-accent font-semibold hover:underline cursor-pointer"
                    >
                      + Из базы
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.itemType === 'album' ? draft.coArtist || '' : draft.featuredArtist || ''}
                    onChange={e =>
                      draft.itemType === 'album'
                        ? setDraft({ ...draft, coArtist: e.target.value })
                        : setDraft({ ...draft, featuredArtist: e.target.value })
                    }
                    placeholder="Без гостя..."
                    className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Жанр</label>
                  <input
                    type="text"
                    value={draft.genre}
                    onChange={e => setDraft({ ...draft, genre: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Качество (50–90)</label>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5">
                    <input
                      type="range"
                      min={50}
                      max={90}
                      value={draft.qualityScore}
                      onChange={e => {
                        const q = Number(e.target.value);
                        const next = { ...draft, qualityScore: q };
                        next.estimatedPlays = recalcForecast(next);
                        setDraft(next);
                      }}
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-white w-6 text-right">{draft.qualityScore}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Прослушивания</label>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, estimatedPlays: recalcForecast(draft) })}
                      className="text-[11px] theme-accent font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Dices className="w-3 h-3" /> Пересчитать
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formatNumber(draft.estimatedPlays)}
                    onChange={e => setDraft({ ...draft, estimatedPlays: parseFormattedNumber(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...draft, promoBoost: !draft.promoBoost };
                    next.estimatedPlays = recalcForecast(next);
                    setDraft(next);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    draft.promoBoost
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                      : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Промо-кампания (+20% охват)</span>
                </button>
                {draft.itemType !== 'album' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">Длительность:</span>
                    <input
                      type="text"
                      value={draft.duration || '2:45'}
                      onChange={e => setDraft({ ...draft, duration: e.target.value })}
                      className="w-16 bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white text-center outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Compact 1-button Optional Release Strategy & Custom Hype */}
              <ReleaseHypeControl
                promoStrategy={draft.promoStrategy}
                releaseHype={draft.releaseHype}
                defaultHype={draft.artistHype || 70}
                onChange={(strategy, hypeVal) => {
                  const next = { ...draft, promoStrategy: strategy, releaseHype: hypeVal };
                  next.estimatedPlays = forecastReleasePlays({
                    artist: currentArtist || artists[0],
                    featArtist: next.featuredArtist
                      ? artists.find(a => a.name.toLowerCase() === next.featuredArtist!.toLowerCase())
                      : undefined,
                    featuredNames: next.featuredArtist,
                    allArtists: artists,
                    itemType: next.itemType,
                    qualityScore: next.qualityScore,
                    hype: next.artistHype,
                    hasWarmup: next.hasWarmupBoost,
                    promoBoost: next.promoBoost,
                    promoStrategy: next.promoStrategy,
                    releaseHype: next.releaseHype,
                    albumTracksCount: next.albumTracks?.length || next.albumTracksCount || 8,
                    hitsCount: currentMetrics?.topHitsCount || 0,
                    catalogAvgPlays: currentMetrics?.catalogAvgPlays || 0,
                    deterministic: true
                  });
                  setDraft(next);
                }}
              />

              {draft.itemType === 'snippet' && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Описание сниппета</label>
                  <textarea
                    rows={2}
                    value={draft.snippetTeaser || ''}
                    onChange={e => setDraft({ ...draft, snippetTeaser: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {draft.itemType === 'album' && (
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                    <Disc className="w-4 h-4 theme-accent" />
                    <span>Треклист альбома ({draft.albumTracks?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Редактируйте каждый трек, добавляйте фиты или загрузите весь треклист текстом
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateRandomFeatsOnAlbum}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5 theme-accent" />
                    <span>Подобрать фиты</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsParserOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Парсер треклиста</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={newTrTitle}
                  onChange={e => setNewTrTitle(e.target.value)}
                  placeholder="Название нового трека..."
                  className="sm:col-span-4 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none"
                />
                <div className="sm:col-span-3 flex gap-1">
                  <input
                    type="text"
                    value={newTrFeat}
                    onChange={e => setNewTrFeat(e.target.value)}
                    placeholder="Фит (опц.)"
                    className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerMode('track_feat')}
                    className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl text-[11px] font-bold text-zinc-200 cursor-pointer shrink-0"
                    title="Выбрать гостя из базы"
                  >
                    +
                  </button>
                </div>
                <input
                  type="text"
                  value={newTrDuration}
                  onChange={e => setNewTrDuration(e.target.value)}
                  placeholder="2:45"
                  className="sm:col-span-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white text-center outline-none"
                />
                <input
                  type="text"
                  value={newTrPlays}
                  onChange={e => setNewTrPlays(e.target.value)}
                  placeholder="Стримы"
                  className="sm:col-span-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAlbumTrack}
                  className="sm:col-span-1 py-2 px-3 rounded-xl theme-bg-accent text-black font-bold text-xs flex items-center justify-center cursor-pointer"
                  title="Добавить трек"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl bg-black/30 max-h-60 overflow-y-auto custom-scrollbar">
                {(draft.albumTracks || []).map((tr, idx) => (
                  <div key={tr.id} className="px-3 py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-mono text-zinc-500 w-5 shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={tr.title}
                      onChange={e => handleUpdateAlbumTrack(tr.id, { title: e.target.value })}
                      className="flex-1 min-w-[140px] bg-transparent border border-transparent focus:border-white/20 focus:bg-zinc-900 rounded-lg px-2 py-1 font-semibold text-white outline-none"
                    />
                    <input
                      type="text"
                      value={tr.featuredArtist || ''}
                      onChange={e => handleUpdateAlbumTrack(tr.id, { featuredArtist: e.target.value || undefined })}
                      placeholder="feat..."
                      className="w-32 bg-zinc-900/80 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-200 outline-none"
                    />
                    <input
                      type="text"
                      value={tr.duration || '2:45'}
                      onChange={e => handleUpdateAlbumTrack(tr.id, { duration: e.target.value })}
                      className="w-14 bg-zinc-900/80 border border-white/10 rounded-lg px-1.5 py-1 text-[11px] font-mono text-zinc-300 text-center outline-none"
                    />
                    <input
                      type="number"
                      value={tr.plays || 0}
                      onChange={e => handleUpdateAlbumTrack(tr.id, { plays: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-24 bg-zinc-900/80 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono text-white text-right tabular-nums outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAlbumTrack(tr.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-zinc-900/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                ...draft,
                selected: true,
                albumTracksCount: draft.itemType === 'album' ? draft.albumTracks?.length || draft.albumTracksCount : undefined,
                albumTrackTitles: draft.itemType === 'album' ? draft.albumTracks?.map(t => t.title) : undefined
              });
              onClose();
            }}
            className="px-5 py-2 rounded-xl theme-bg-accent text-black text-xs font-bold hover:opacity-90 cursor-pointer"
          >
            Применить изменения
          </button>
        </div>
      </div>

      <SimArtistPickerModal
        isOpen={Boolean(pickerMode)}
        onClose={() => setPickerMode(null)}
        title={pickerMode === 'main' ? 'Выбор основного артиста' : 'Выбор гостя / соавтора'}
        artists={artists}
        metricsMap={metricsMap}
        onRequestCreateNew={
          onCreateArtist
            ? prefillName => {
                const mode = pickerMode;
                if (!mode) return;
                setPickerMode(null);
                setCreateArtistTarget({ mode, prefillName });
              }
            : undefined
        }
        onSelect={art => {
          if (pickerMode === 'main') {
            const m = metricsMap.get(art.id);
            const next: SimProposal = {
              ...draft,
              artistId: art.id,
              artistName: art.name,
              genre: art.genre || draft.genre,
              artistHype: m?.hype ?? art.hype ?? draft.artistHype,
              daysSilent: m?.daysSilent ?? draft.daysSilent,
              hasWarmupBoost: Boolean(m?.activeSnippet)
            };
            next.estimatedPlays = recalcForecast(next);
            setDraft(next);
          } else if (pickerMode === 'feat') {
            const next = { ...draft, featuredArtist: appendFeaturedName(draft.featuredArtist, art.name) };
            next.estimatedPlays = recalcForecast(next);
            setDraft(next);
          } else if (pickerMode === 'co') {
            setDraft({ ...draft, coArtist: appendFeaturedName(draft.coArtist, art.name) });
          } else if (pickerMode === 'track_feat') {
            setNewTrFeat(prev => appendFeaturedName(prev, art.name));
          }
        }}
      />

      {createArtistTarget && (
        <SimCreateArtistModal
          isOpen={Boolean(createArtistTarget)}
          initialName={createArtistTarget.prefillName}
          onClose={() => setCreateArtistTarget(null)}
          onGenerateBio={onGenerateArtistBio}
          onCreated={art => {
            onCreateArtist?.(art);
            const mode = createArtistTarget.mode;
            if (mode === 'main') {
              const next: SimProposal = {
                ...draft,
                artistId: art.id,
                artistName: art.name,
                genre: art.genre || draft.genre,
                artistHype: art.hype ?? 62,
                daysSilent: 30,
                hasWarmupBoost: false
              };
              next.estimatedPlays = forecastReleasePlays({
                artist: art,
                allArtists: [...artists, art],
                itemType: next.itemType,
                qualityScore: next.qualityScore,
                hype: next.artistHype,
                hasWarmup: false,
                promoBoost: next.promoBoost,
                promoStrategy: next.promoStrategy,
                releaseHype: next.releaseHype,
                albumTracksCount: next.albumTracks?.length || next.albumTracksCount || 8
              });
              setDraft(next);
            } else if (mode === 'feat') {
              const next = { ...draft, featuredArtist: appendFeaturedName(draft.featuredArtist, art.name) };
              next.estimatedPlays = forecastReleasePlays({
                artist: currentArtist || artists[0],
                featArtist: art,
                featuredNames: next.featuredArtist,
                allArtists: [...artists, art],
                itemType: next.itemType,
                qualityScore: next.qualityScore,
                hype: next.artistHype,
                hasWarmup: next.hasWarmupBoost,
                promoBoost: next.promoBoost,
                promoStrategy: next.promoStrategy,
                releaseHype: next.releaseHype,
                albumTracksCount: next.albumTracks?.length || next.albumTracksCount || 8
              });
              setDraft(next);
            } else if (mode === 'co') {
              setDraft({ ...draft, coArtist: appendFeaturedName(draft.coArtist, art.name) });
            } else if (mode === 'track_feat') {
              setNewTrFeat(prev => appendFeaturedName(prev, art.name));
            }
          }}
        />
      )}

      <TextTracklistParserModal
        isOpen={isParserOpen}
        onClose={() => setIsParserOpen(false)}
        onImport={parsed => {
          const imported: SimAlbumTrack[] = parsed.map(pt => ({
            id: makeId('prstrk'),
            title: pt.title,
            featuredArtist: pt.featuredArtist,
            duration: pt.duration || getRandomDuration(),
            plays: pt.plays || Math.round((draft.estimatedPlays || 500_000) / Math.max(4, parsed.length)),
            isExplicit: draft.isExplicit
          }));
          const nextList = [...(draft.albumTracks || []), ...imported];
          const sum = nextList.reduce((acc, t) => acc + (t.plays || 0), 0);
          setDraft({
            ...draft,
            albumTracks: nextList,
            albumTracksCount: nextList.length,
            albumTrackTitles: nextList.map(t => t.title),
            estimatedPlays: sum > 0 ? sum : draft.estimatedPlays
          });
        }}
      />
    </div>,
    document.body
  );
};

// ============================================================================
// RANDOM ARTIST & IDEA STUDIO MODAL (MANUAL BATCH & SEMI-AUTO HELPER)
// ============================================================================

export type IdeaCategory = 'all' | 'hype' | 'routine' | 'album' | 'collab' | 'viral';

export interface GeneratedReleaseIdea {
  id: string;
  badge: string;
  category: 'hype' | 'routine' | 'album' | 'collab' | 'viral';
  categoryLabel: string;
  badgeClass: string;
  title: string;
  description: string;
  vibeHint: string;
  suggestedFormat: 'single' | 'ep' | 'album' | 'snippet';
  suggestedPromo: ReleasePromoStrategy;
  suggestedHype: number;
  suggestedDuration: string;
  shouldUseFeat: boolean;
}

export function buildAllCreativeIdeasForArtist(
  m: ArtistSimMetrics,
  partnerName?: string
): GeneratedReleaseIdea[] {
  const pool: GeneratedReleaseIdea[] = [];
  const art = m.artist;

  // 1. Contextual based on artist active state
  if (m.activeSnippet) {
    pool.push({
      id: 'active_snippet',
      badge: 'Закрытие прогрева',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      title: `Полный дроп сниппета «${m.activeSnippet.title}»`,
      description: `У ${art.name} уже разогрет интерес тизером — релиз полной версии заберёт накопившийся спрос и даст мощный старт в чартах.`,
      vibeHint: 'Плотный припев и акцент на виральную часть из сниппета',
      suggestedFormat: 'single',
      suggestedPromo: 'warmup',
      suggestedHype: clamp(Math.max(m.hype + 8, 74), 55, 96),
      suggestedDuration: '2:28',
      shouldUseFeat: false
    });
  }

  if (m.daysSilent >= 45) {
    pool.push({
      id: 'comeback',
      badge: 'Большой камбэк',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      title: `Возвращение после ${m.daysSilent} дн. тишины`,
      description: `Аудитория давно ждёт сольную работу. Мощный заявочный сингл или EP, чтобы триумфально вернуть позиции в топе.`,
      vibeHint: 'Уверенная, масштабная подача и кинематографичный продакшн',
      suggestedFormat: m.daysSinceAlbum === null || m.daysSinceAlbum >= 260 ? 'ep' : 'single',
      suggestedPromo: (art.followers || 0) >= 2_500_000 ? 'mega_campaign' : 'viral_push',
      suggestedHype: clamp(Math.max(m.hype + 12, 76), 60, 97),
      suggestedDuration: '2:52',
      shouldUseFeat: Math.random() < 0.4
    });
  }

  if (m.daysSinceAlbum === null || m.daysSinceAlbum >= 200) {
    const isLongWait = m.daysSinceAlbum !== null && m.daysSinceAlbum >= 280;
    pool.push({
      id: 'album_season',
      badge: isLongWait ? 'Эпоха альбома' : 'Концепт-EP',
      category: 'album',
      categoryLabel: 'Альбом',
      badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
      title: isLongWait ? `Крупная пластинка (${m.daysSinceAlbum} дн. без альбома)` : 'Цельный мини-альбом на 4–6 треков',
      description: `Идеальное окно для полноформатной истории. Внутри можно смешать сольные бэнгеры и 1–2 точечных гостевых куплета.`,
      vibeHint: 'Сквозная концепция, интро/аутро и плавные переходы между треками',
      suggestedFormat: isLongWait ? 'album' : 'ep',
      suggestedPromo: 'playlist_push',
      suggestedHype: clamp(Math.max(m.hype + 7, 72), 55, 95),
      suggestedDuration: '2:40',
      shouldUseFeat: false
    });
  }

  if (m.daysSinceAlbum !== null && m.daysSinceAlbum < 120) {
    pool.push({
      id: 'deluxe_edition',
      badge: 'Делюкс / Волна',
      category: 'album',
      categoryLabel: 'Альбом',
      badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      title: 'Делюкс-издание с новыми треками',
      description: `После недавней пластинки (${m.daysSinceAlbum} дн. назад) важно закрепить успех расширенной версией и перезапустить интерес к альбому.`,
      vibeHint: 'Продолжение звучания альбома в ещё более энергичной версии',
      suggestedFormat: 'album',
      suggestedPromo: 'deluxe_wave',
      suggestedHype: clamp(Math.max(m.hype + 8, 74), 55, 94),
      suggestedDuration: '2:31',
      shouldUseFeat: Math.random() < 0.5
    });
  }

  if (partnerName) {
    pool.push({
      id: 'collab_crossover',
      badge: 'Коллаборация',
      category: 'collab',
      categoryLabel: 'Коллаб',
      badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
      title: `Свежий кроссовер с ${partnerName}`,
      description:
        m.daysSinceFeat === null || m.daysSinceFeat >= 45
          ? `${art.name} давно не появлялся на фитах (${m.daysSinceFeat === null ? 'ещё не было' : `${m.daysSinceFeat} дн.`}) — совместка с ${partnerName} объединит фан-базы.`
          : `Двойная химия с ${partnerName} усилит охват и повысит шансы на штурм топ-1 недели.`,
      vibeHint: 'Диалог куплетов, общая энергетика и цепкий чартовый хук',
      suggestedFormat: 'single',
      suggestedPromo: 'feature_event',
      suggestedHype: clamp(Math.max(m.hype + 9, 75), 55, 96),
      suggestedDuration: '2:38',
      shouldUseFeat: true
    });
  }

  // 2. Поскучнее и рутинные (Mundane / routine industry scenarios)
  pool.push(
    {
      id: 'routine_single',
      badge: 'Дежурный сингл',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Дежурный сингл в ротацию',
      description: 'Плановый релиз для поддержания каталога в стримингах: привычный фирменный звук артиста, ровный продакшн без экстремальных экспериментов.',
      vibeHint: 'Ровный ритм, узнаваемый тембр, стандартный радио-хронометраж',
      suggestedFormat: 'single',
      suggestedPromo: 'quiet',
      suggestedHype: clamp(m.hype - 2, 30, 72),
      suggestedDuration: '2:32',
      shouldUseFeat: false
    },
    {
      id: 'routine_contract',
      badge: 'Конец контракта',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Закрытие дистрибьюторского контракта',
      description: 'Финальный релиз по текущим обязательствам перед лейблом/дистрибьютором: спокойная сольная работа перед новым этапом карьеры.',
      vibeHint: 'Сдержанный сольный трек, прямолинейный звук без лишнего лоска',
      suggestedFormat: 'single',
      suggestedPromo: 'quiet',
      suggestedHype: clamp(m.hype - 4, 28, 70),
      suggestedDuration: '2:45',
      shouldUseFeat: false
    },
    {
      id: 'routine_chill',
      badge: 'Chill-версия',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Акустическая / Chill-версия для фона',
      description: 'Спокойная гитарная или клавишная версия без тяжёлых ударных — отлично заходит в плейлисты для ночи, кофеен и учёбы.',
      vibeHint: 'Мягкий инструментал, тёплый эмбиент и акцент на текст',
      suggestedFormat: 'single',
      suggestedPromo: 'quiet',
      suggestedHype: clamp(m.hype - 5, 26, 68),
      suggestedDuration: '3:08',
      shouldUseFeat: false
    },
    {
      id: 'routine_clean_edit',
      badge: 'Clean Edit',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Радио-версия без цензуры (Clean Edit)',
      description: 'Специальная редакция для дневного эфира радиостанций и витрин: сглаженные тексты, радио-мастеринг и высокий шанс попадания в кураторские подборки.',
      vibeHint: 'Цепкий припев, чистый вокал, отсутствие нецензурных выражений',
      suggestedFormat: 'single',
      suggestedPromo: 'playlist_push',
      suggestedHype: clamp(m.hype + 2, 45, 80),
      suggestedDuration: '2:36',
      shouldUseFeat: false
    },
    {
      id: 'routine_archive',
      badge: 'Из стола',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Архивная демка из стола',
      description: 'Трек записан полтора года назад и лежал в черновиках. Фанаты просили его в соцсетях — артист довёл сведение и дропнул без громких анонсов.',
      vibeHint: 'Ностальгический сырой вайб прежнего периода творчества',
      suggestedFormat: 'single',
      suggestedPromo: 'quiet',
      suggestedHype: clamp(m.hype, 32, 74),
      suggestedDuration: '2:21',
      shouldUseFeat: false
    },
    {
      id: 'routine_bside',
      badge: 'B-Side',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'B-Side трек для ядра аудитории',
      description: 'Неформатная работа, не попавшая в концепции больших альбомов. Выпускается в подарок преданным слушателям.',
      vibeHint: 'Лиричный монолог или экспериментальный флоу без коммерческого давления',
      suggestedFormat: 'single',
      suggestedPromo: 'quiet',
      suggestedHype: clamp(m.hype - 3, 28, 72),
      suggestedDuration: '2:54',
      shouldUseFeat: false
    },
    {
      id: 'routine_jam',
      badge: 'Студийный джем',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Студийный джем на один дубль',
      description: 'Живой спонтанный тейк прямо с микрофона под случайный битмейкерский луп без многослойного продакшна.',
      vibeHint: 'Студийная атмосфера, аутентичные шумы и естественная подача',
      suggestedFormat: 'single',
      suggestedPromo: 'quiet',
      suggestedHype: clamp(m.hype - 2, 30, 72),
      suggestedDuration: '2:14',
      shouldUseFeat: false
    },
    {
      id: 'routine_season',
      badge: 'Сезонный дроп',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Сезонный фоновый трек',
      description: 'Лёгкий атмосферный релиз под текущее время года: ненавязчивый ритм для прогулок, поездок и повседневных прослушиваний.',
      vibeHint: 'Плавный грув, расслабленный вайб, легко на репит',
      suggestedFormat: 'single',
      suggestedPromo: 'playlist_push',
      suggestedHype: clamp(m.hype + 3, 40, 78),
      suggestedDuration: '2:46',
      shouldUseFeat: false
    },
    {
      id: 'routine_solo_pause',
      badge: 'Сольная зарисовка',
      category: 'routine',
      categoryLabel: 'Рутина',
      badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
      title: 'Сольный перерыв после фитов',
      description: 'После серии совместных релизов важно напомнить о своём индивидуальном почерке и выпустить чистый сольный трек.',
      vibeHint: 'Личный голос артиста, фокус на характере и тексте',
      suggestedFormat: 'single',
      suggestedPromo: 'quiet',
      suggestedHype: clamp(m.hype + 1, 38, 78),
      suggestedDuration: '2:40',
      shouldUseFeat: false
    }
  );

  // 3. Поинтереснее и громкие инфоповоды (Hype & media storms)
  pool.push(
    {
      id: 'hype_beef',
      badge: 'Громкий биф',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
      title: 'Ответный дисс-трек в разгар конфликта',
      description: 'Хлёсткий дисс с разоблачениями и прямыми выпадами. Взрывает соцсети, порождает миллионы комментариев и реакции стримеров.',
      vibeHint: 'Агрессивный 808-бас, пулемётная подача, острые панчлайны',
      suggestedFormat: 'single',
      suggestedPromo: 'scandal_pr',
      suggestedHype: clamp(Math.max(m.hype + 15, 84), 70, 99),
      suggestedDuration: '2:38',
      shouldUseFeat: false
    },
    {
      id: 'hype_midnight',
      badge: 'Внезапный дроп',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-violet-500/20 text-violet-200 border-violet-400/30',
      title: 'Сюрприз-релиз в полночь без анонса',
      description: 'Никаких предзаказов и тизеров: неожиданная премьера в 00:00 с эффектом взрывной волны в медиа.',
      vibeHint: 'Контрастное звучание, эффект неожиданности',
      suggestedFormat: 'single',
      suggestedPromo: 'mega_campaign',
      suggestedHype: clamp(Math.max(m.hype + 10, 76), 60, 98),
      suggestedDuration: '2:34',
      shouldUseFeat: false
    },
    {
      id: 'hype_leak_save',
      badge: 'Слитый трек',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      title: 'Официальный дроп слитого трека',
      description: 'Недоделанная демо-запись гуляла по соцсетям и набрала вирусную популярность. Артист оперативно доделал мастер-версию и забрал стримы себе.',
      vibeHint: 'Доработанный припев, сочный саунд и взрывной бас',
      suggestedFormat: 'single',
      suggestedPromo: 'viral_push',
      suggestedHype: clamp(Math.max(m.hype + 12, 78), 65, 97),
      suggestedDuration: '2:18',
      shouldUseFeat: false
    },
    {
      id: 'hype_ost',
      badge: 'Саундтрек / OST',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      title: 'Титульный саундтрек к блокбастеру',
      description: 'Главная музыкальная тема крупного кинопроекта или сериала: масштабная промо-кампания, ротации в трейлерах и охват новой аудитории.',
      vibeHint: 'Кинематографичные струнные, эпический размах, мощный вокал',
      suggestedFormat: 'single',
      suggestedPromo: 'mega_campaign',
      suggestedHype: clamp(Math.max(m.hype + 11, 79), 65, 98),
      suggestedDuration: '3:20',
      shouldUseFeat: false
    },
    {
      id: 'hype_fashion',
      badge: 'Фэшн-коллаб',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-pink-500/20 text-pink-200 border-pink-400/30',
      title: 'Коллаб с люксовым брендом одежды',
      description: 'Премьера приурочена к запуску капсульной коллекции и неделе моды: стильный глянец, вирусный лукбук и высокий статус.',
      vibeHint: 'Минималистичный глубокий клубный звук, эстетика хай-фэшн',
      suggestedFormat: 'single',
      suggestedPromo: 'mega_campaign',
      suggestedHype: clamp(Math.max(m.hype + 8, 74), 58, 95),
      suggestedDuration: '2:26',
      shouldUseFeat: false
    },
    {
      id: 'hype_stadium_anthem',
      badge: 'Гимн тура',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30',
      title: 'Стадионный гимн под всероссийский тур',
      description: 'Масштабный открывающий трек для стадионов: припев, который будет петь весь зал в унисон с первых аккордов.',
      vibeHint: 'Громоподобные барабаны, бэк-вокальные пачки и взрывная кульминация',
      suggestedFormat: 'single',
      suggestedPromo: 'mega_campaign',
      suggestedHype: clamp(Math.max(m.hype + 13, 80), 65, 98),
      suggestedDuration: '3:05',
      shouldUseFeat: false
    },
    {
      id: 'hype_alter_ego',
      badge: 'Смена стиля',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-red-500/20 text-red-200 border-red-400/30',
      title: 'Новое альтер-эго и смена жанра',
      description: 'Радикальный слом шаблона: неожиданный уход в рок, гиперпоп или синтивейв, делящий критиков и публику на два лагеря.',
      vibeHint: 'Живые инструменты или синты, смелый эксперимент с манерой вокала',
      suggestedFormat: 'single',
      suggestedPromo: 'scandal_pr',
      suggestedHype: clamp(Math.max(m.hype + 14, 82), 65, 99),
      suggestedDuration: '2:52',
      shouldUseFeat: false
    },
    {
      id: 'hype_orchestra',
      badge: 'Симфо-лайв',
      category: 'hype',
      categoryLabel: 'Хайп',
      badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      title: 'Монументальный лайв с симфоническим оркестром',
      description: 'Академическое переосмысление: 40 оркестровых музыкантов и хор придают треку драматический размах и статус вечной классики.',
      vibeHint: 'Живые струнные, медные духовые, эпический саунд',
      suggestedFormat: 'single',
      suggestedPromo: 'radio_tour',
      suggestedHype: clamp(Math.max(m.hype + 9, 75), 60, 96),
      suggestedDuration: '3:40',
      shouldUseFeat: false
    }
  );

  // 4. Вирусные (Viral)
  pool.push(
    {
      id: 'viral_hook',
      badge: 'TikTok-тренд',
      category: 'viral',
      categoryLabel: 'Вирус',
      badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
      title: 'Вирусный хук под короткие видео',
      description: 'Короткий трек с цепляющим дропом на 15-й секунде, заточенный под миллионы танцевальных роликов и мемов.',
      vibeHint: 'Взрывной бас, короткий хронометраж и повторяющаяся мемная фраза',
      suggestedFormat: 'single',
      suggestedPromo: 'tiktok_trend',
      suggestedHype: clamp(Math.max(m.hype + 11, 75), 55, 97),
      suggestedDuration: '1:58',
      shouldUseFeat: false
    },
    {
      id: 'viral_snippet',
      badge: 'Секретный сниппет',
      category: 'viral',
      categoryLabel: 'Вирус',
      badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
      title: 'Скрытый сниппет из студии',
      description: 'Короткий тизер нового звука в сторис или кружочках, запускающий волну обсуждений перед большим релизом.',
      vibeHint: 'Сырой студийный звук, обрывающийся на самом интересном месте',
      suggestedFormat: 'snippet',
      suggestedPromo: 'warmup',
      suggestedHype: clamp(Math.max(m.hype + 6, 70), 50, 92),
      suggestedDuration: '0:34',
      shouldUseFeat: false
    }
  );

  // 5. Альбомы и концепты (Albums & Concepts)
  pool.push(
    {
      id: 'album_manifesto',
      badge: 'Концепт-альбом',
      category: 'album',
      categoryLabel: 'Альбом',
      badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
      title: 'Концептуальный альбом-манифест',
      description: 'Цельное повествование из нескольких актов: скиты, единая сюжетная арка и продуманный звуковой мир, слушающийся на одном дыхании.',
      vibeHint: 'Глубокая сквозная концепция и переходы между треками',
      suggestedFormat: 'album',
      suggestedPromo: 'mega_campaign',
      suggestedHype: clamp(Math.max(m.hype + 10, 78), 60, 97),
      suggestedDuration: '2:40',
      shouldUseFeat: false
    },
    {
      id: 'album_ep_focus',
      badge: 'Концепт-EP',
      category: 'album',
      categoryLabel: 'Мини-альбом',
      badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
      title: 'Компактный атмосферный мини-альбом (EP)',
      description: 'Сфокусированный дроп на 4–6 треков в одном стиле без проходных мест, идеально удерживающий позиции в чартах.',
      vibeHint: 'Цельный саунд, высокое качество продакшна',
      suggestedFormat: 'ep',
      suggestedPromo: 'playlist_push',
      suggestedHype: clamp(Math.max(m.hype + 7, 73), 55, 95),
      suggestedDuration: '2:36',
      shouldUseFeat: false
    },
    {
      id: 'album_sequel',
      badge: 'Сиквел альбома',
      category: 'album',
      categoryLabel: 'Альбом',
      badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
      title: 'Вторая часть культового альбома (Часть II)',
      description: 'Прямое продолжение самой знаковой пластинки в дискографии. Огромный интерес старой и новой аудитории.',
      vibeHint: 'Отсылки к фирменному стилю в ультрасовременном звучании',
      suggestedFormat: 'album',
      suggestedPromo: 'mega_campaign',
      suggestedHype: clamp(Math.max(m.hype + 12, 80), 65, 98),
      suggestedDuration: '2:45',
      shouldUseFeat: false
    }
  );

  // 6. Коллаборации (Collaborations)
  pool.push(
    {
      id: 'collab_contrast',
      badge: 'Кроссовер жанров',
      category: 'collab',
      categoryLabel: 'Коллаб',
      badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
      title: 'Неожиданный кроссовер полярных стилей',
      description: 'Смелый союз артистов из противоположных лагерей, порождающий споры и забирающий внимание обоих сообществ.',
      vibeHint: 'Контраст тембров и органичное соединение разных школ звучания',
      suggestedFormat: 'single',
      suggestedPromo: 'feature_event',
      suggestedHype: clamp(Math.max(m.hype + 10, 77), 60, 96),
      suggestedDuration: '2:44',
      shouldUseFeat: true
    },
    {
      id: 'collab_cypher',
      badge: 'Звёздный сайфер',
      category: 'collab',
      categoryLabel: 'Коллаб',
      badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
      title: 'Командный сайфер лидеров жанра',
      description: 'Плотный обмен куплетами без перерывов от ключевых игроков сцены на одном монолитном инструментале.',
      vibeHint: 'Смена флоу, соревновательный дух и плотные панчи',
      suggestedFormat: 'single',
      suggestedPromo: 'feature_event',
      suggestedHype: clamp(Math.max(m.hype + 12, 80), 65, 98),
      suggestedDuration: '3:30',
      shouldUseFeat: true
    },
    {
      id: 'collab_producer',
      badge: 'Продюсерский хит',
      category: 'collab',
      categoryLabel: 'Коллаб',
      badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
      title: 'Супер-бэнгер от звёздного битмейкера',
      description: 'Релиз с акцентом на уникальный фирменный продакшн битмейкера, выводящий звучание трека на мировой уровень.',
      vibeHint: 'Качающий бас, запоминающийся продюсерский тег',
      suggestedFormat: 'single',
      suggestedPromo: 'playlist_push',
      suggestedHype: clamp(Math.max(m.hype + 8, 74), 55, 95),
      suggestedDuration: '2:22',
      shouldUseFeat: true
    }
  );

  return pool;
}

export function buildCreativeIdeaForArtist(
  m: ArtistSimMetrics,
  partnerName?: string,
  categoryFilter: IdeaCategory = 'all'
): GeneratedReleaseIdea {
  const all = buildAllCreativeIdeasForArtist(m, partnerName);
  const filtered = categoryFilter === 'all' ? all : all.filter(x => x.category === categoryFilter);
  const candidates = filtered.length > 0 ? filtered : all;
  return candidates[randInt(0, candidates.length - 1)];
}

const SimIdeaStudioModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  simState: SimState;
  metricsMap: Map<string, ArtistSimMetrics>;
  getArtistMetrics: (art: Artist) => ArtistSimMetrics;
  autopilot: SimAutopilotConfig;
  initialArtistId?: string;
  manualQueueCount: number;
  onAdjustArtistHype?: (artistId: string, delta: number) => void;
  onOpenArtist?: (artistId: string) => void;
  onTransferToManual: (draft: ManualSimItem) => void;
  onQueueManualItem: (item: ManualSimItem) => void;
  onAddToSemi: (proposal: SimProposal) => void;
}> = ({
  isOpen,
  onClose,
  simState,
  metricsMap,
  getArtistMetrics,
  autopilot,
  initialArtistId,
  manualQueueCount,
  onAdjustArtistHype,
  onOpenArtist,
  onTransferToManual,
  onQueueManualItem,
  onAddToSemi
}) => {
  // Selection filters (optional — works out-of-the-box with >0 listeners default)
  const [onlyNonZeroListeners, setOnlyNonZeroListeners] = useState(true);
  const [tierFilter, setTierFilter] = useState<'all' | 'superstar' | 'mega' | 'large' | 'mid' | 'rising' | 'rookie'>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [pauseFilter, setPauseFilter] = useState<'all' | '30d' | '60d' | '120d' | 'album_due' | 'snippet' | 'no_feat_45d'>('all');
  const [hypeFilter, setHypeFilter] = useState<'any' | 'low' | 'mid' | 'high'>('any');
  const [showFilters, setShowFilters] = useState(false);

  // Idea category & collection modal
  const [ideaCategory, setIdeaCategory] = useState<IdeaCategory>('all');
  const [showAllIdeasModal, setShowAllIdeasModal] = useState(false);

  // Selected artist + generated release draft state
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [releaseFormat, setReleaseFormat] = useState<'single' | 'ep' | 'album' | 'snippet'>('single');
  const [draftTitle, setDraftTitle] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [draftFeat, setDraftFeat] = useState('');
  const [draftCoArtist, setDraftCoArtist] = useState('');
  const [draftDuration, setDraftDuration] = useState('2:34');
  const [draftAlbumTracksCount, setDraftAlbumTracksCount] = useState(11);
  const [draftAlbumTracks, setDraftAlbumTracks] = useState<SimAlbumTrack[]>([]);
  const [draftPromoStrategy, setDraftPromoStrategy] = useState<ReleasePromoStrategy | undefined>(undefined);
  const [draftReleaseHype, setDraftReleaseHype] = useState<number>(72);
  const [draftPlays, setDraftPlays] = useState<number>(0);
  const [draftTeaser, setDraftTeaser] = useState('');
  const [activeIdea, setActiveIdea] = useState<GeneratedReleaseIdea | null>(null);
  const [pickerMode, setPickerMode] = useState<'artist' | 'feat' | 'co' | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [titleMood, setTitleMood] = useState<TitleMood>('all');

  const nonZeroArtists = useMemo(
    () => simState.artists.filter(a => (a.followers || 0) > 0),
    [simState.artists]
  );

  const availableGenres = useMemo(() => {
    const counts = new Map<string, number>();
    simState.artists.forEach(a => {
      if (onlyNonZeroListeners && (a.followers || 0) <= 0) return;
      const g = (a.genre || '').trim();
      if (g) counts.set(g, (counts.get(g) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(x => x[0]);
  }, [simState.artists, onlyNonZeroListeners]);

  const filteredPool = useMemo(() => {
    return simState.artists.filter(art => {
      const f = Math.max(0, typeof art.followers === 'number' && !isNaN(art.followers) ? art.followers : 0);
      if (onlyNonZeroListeners && f <= 0) return false;
      if (tierFilter === 'superstar' && f < 15_000_000) return false;
      if (tierFilter === 'mega' && (f < 8_000_000 || f >= 15_000_000)) return false;
      if (tierFilter === 'large' && (f < 2_500_000 || f >= 8_000_000)) return false;
      if (tierFilter === 'mid' && (f < 500_000 || f >= 2_500_000)) return false;
      if (tierFilter === 'rising' && (f < 75_000 || f >= 500_000)) return false;
      if (tierFilter === 'rookie' && f >= 75_000) return false;
      const m = metricsMap.get(art.id) || getArtistMetrics(art);
      if (genreFilter !== 'all' && (art.genre || '').trim() !== genreFilter) return false;
      if (hypeFilter === 'low' && m.hype >= 50) return false;
      if (hypeFilter === 'mid' && (m.hype < 50 || m.hype > 75)) return false;
      if (hypeFilter === 'high' && m.hype <= 75) return false;
      if (pauseFilter === '30d' && m.daysSilent < 30) return false;
      if (pauseFilter === '60d' && m.daysSilent < 60) return false;
      if (pauseFilter === '120d' && m.daysSilent < 120) return false;
      if (pauseFilter === 'album_due' && (m.daysSinceAlbum === null ? m.tracksCount < 4 : m.daysSinceAlbum < 240)) return false;
      if (pauseFilter === 'snippet' && !m.activeSnippet) return false;
      if (pauseFilter === 'no_feat_45d' && m.daysSinceFeat !== null && m.daysSinceFeat < 45) return false;
      return true;
    });
  }, [
    simState.artists,
    onlyNonZeroListeners,
    metricsMap,
    getArtistMetrics,
    tierFilter,
    genreFilter,
    hypeFilter,
    pauseFilter
  ]);

  const artistMap = useMemo(() => new Map(simState.artists.map(a => [a.id, a])), [simState.artists]);

  const selectedArtist = useMemo(() => {
    if (selectedArtistId && artistMap.has(selectedArtistId)) return artistMap.get(selectedArtistId)!;
    return filteredPool[0] || nonZeroArtists[0] || simState.artists[0];
  }, [selectedArtistId, artistMap, filteredPool, nonZeroArtists, simState.artists]);

  const selectedMetrics = useMemo(() => {
    if (!selectedArtist) return null;
    return metricsMap.get(selectedArtist.id) || getArtistMetrics(selectedArtist);
  }, [selectedArtist, metricsMap, getArtistMetrics]);

  // Rich per-artist release dossier (single fast scan only for the 1 active artist)
  const artistDossier = useMemo(() => {
    if (!selectedArtist) return null;
    const lowerName = selectedArtist.name.toLowerCase().trim();
    let latestOwnTrack: Track | null = null;
    let latestOwnAlbum: Album | null = null;
    let latestFeatTrack: Track | null = null;
    let topTrack: Track | null = null;

    for (let i = 0; i < simState.tracks.length; i++) {
      const t = simState.tracks[i];
      const dt = t.releaseDate || '1900-01-01';
      if (dt > simState.currentDate) continue;
      const isOwn = t.artistId === selectedArtist.id || (t.artistName || '').toLowerCase().trim() === lowerName;
      if (isOwn) {
        if (!latestOwnTrack || dt > (latestOwnTrack.releaseDate || '1900-01-01')) {
          latestOwnTrack = t;
        }
        if (!t.isSnippet && (!topTrack || (t.plays || 0) > (topTrack.plays || 0))) {
          topTrack = t;
        }
      } else if (t.featuredArtist) {
        const feats = splitFeaturedList(t.featuredArtist, t.artistName);
        if (feats.some(f => f.toLowerCase().trim() === lowerName)) {
          if (!latestFeatTrack || dt > (latestFeatTrack.releaseDate || '1900-01-01')) {
            latestFeatTrack = t;
          }
        }
      }
    }

    for (let i = 0; i < simState.albums.length; i++) {
      const al = simState.albums[i];
      const dt = al.releaseDate || `${al.releaseYear || 2020}-01-01`;
      if (dt > simState.currentDate) continue;
      const isOwn = al.artistId === selectedArtist.id || (al.artistName || '').toLowerCase().trim() === lowerName;
      if (isOwn) {
        if (!latestOwnAlbum || dt > (latestOwnAlbum.releaseDate || '1900-01-01')) {
          latestOwnAlbum = al;
        }
      }
    }

    return { latestOwnTrack, latestOwnAlbum, latestFeatTrack, topTrack };
  }, [selectedArtist, simState.tracks, simState.albums, simState.currentDate]);

  const existingTitleSet = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    simState.tracks.forEach(t => s.add(t.title.toLowerCase()));
    simState.albums.forEach(a => s.add(a.title.toLowerCase()));
    return s;
  }, [simState.tracks, simState.albums]);

  const buildFourTitleIdeas = useCallback(
    (m: ArtistSimMetrics | null, fmt: 'single' | 'ep' | 'album' | 'snippet', mood: TitleMood = titleMood) => {
      const localSet = new Set<string>(existingTitleSet);
      const isAlb = fmt === 'album' || fmt === 'ep';
      const list: string[] = [];
      for (let i = 0; i < 4; i++) {
        list.push(generateModernTitle(localSet, isAlb, m?.namingProfile ?? false, autopilot.languageMix, mood));
      }
      return list;
    },
    [existingTitleSet, autopilot.languageMix, titleMood]
  );

  const deterministicForecast = useMemo(() => {
    if (!selectedArtist) return 350_000;
    const itemType: 'track' | 'album' | 'snippet' =
      releaseFormat === 'snippet' ? 'snippet' : releaseFormat === 'ep' || releaseFormat === 'album' ? 'album' : 'track';
    return forecastReleasePlays({
      artist: selectedArtist,
      featuredNames: draftFeat || draftCoArtist,
      allArtists: nonZeroArtists.length > 0 ? nonZeroArtists : simState.artists,
      itemType,
      qualityScore: selectedMetrics?.avgQuality || 72,
      hype: selectedMetrics?.hype ?? selectedArtist.hype ?? 60,
      hasWarmup: Boolean(selectedMetrics?.activeSnippet),
      promoStrategy: draftPromoStrategy,
      releaseHype: draftReleaseHype,
      albumTracksCount: releaseFormat === 'ep' || releaseFormat === 'album' ? draftAlbumTracksCount : 1,
      virality: autopilot.virality,
      hitsCount: selectedMetrics?.topHitsCount || 0,
      catalogAvgPlays: selectedMetrics?.catalogAvgPlays || 0,
      deterministic: true
    });
  }, [
    selectedArtist,
    releaseFormat,
    draftFeat,
    draftCoArtist,
    nonZeroArtists,
    simState.artists,
    selectedMetrics,
    draftPromoStrategy,
    draftReleaseHype,
    draftAlbumTracksCount,
    autopilot.virality
  ]);

  const allIdeasForSelectedArtist = useMemo(() => {
    if (!selectedMetrics || !selectedArtist) return [];
    const partnerPool = nonZeroArtists.length > 1 ? nonZeroArtists : simState.artists;
    const pickedPartner = pickFeaturedArtistSmart(selectedArtist, partnerPool, new Set(), autopilot.allowSurpriseCollabs);
    return buildAllCreativeIdeasForArtist(selectedMetrics, pickedPartner?.artist.name);
  }, [selectedMetrics, selectedArtist, nonZeroArtists, simState.artists, autopilot.allowSurpriseCollabs]);

  const populateForArtist = useCallback(
    (art: Artist, fullRandomizeConcept: boolean) => {
      const m = metricsMap.get(art.id) || getArtistMetrics(art);
      const partnerPool = nonZeroArtists.length > 1 ? nonZeroArtists : simState.artists;
      const pickedPartner = pickFeaturedArtistSmart(art, partnerPool, new Set(), autopilot.allowSurpriseCollabs);
      const idea = buildCreativeIdeaForArtist(m, pickedPartner?.artist.name, ideaCategory);

      const fmt: 'single' | 'ep' | 'album' | 'snippet' = fullRandomizeConcept
        ? idea.suggestedFormat
        : m.activeSnippet
          ? 'single'
          : m.daysSinceAlbum !== null && m.daysSinceAlbum >= 300 && m.daysSilent >= 45
            ? 'album'
            : 'single';

      const nextCount = fmt === 'ep' ? randInt(4, 6) : fmt === 'album' ? getRandomAlbumTrackCount() : 11;
      const titles = buildFourTitleIdeas(m, fmt);
      const featName = fullRandomizeConcept && idea.shouldUseFeat && pickedPartner && fmt !== 'album' ? pickedPartner.artist.name : '';
      const nextHype = fullRandomizeConcept ? idea.suggestedHype : clamp(m.hype, 15, 99);
      const nextPromo = fullRandomizeConcept ? idea.suggestedPromo : undefined;
      const itemType: 'track' | 'album' | 'snippet' =
        fmt === 'snippet' ? 'snippet' : fmt === 'ep' || fmt === 'album' ? 'album' : 'track';

      const rolledPlays = forecastReleasePlays({
        artist: art,
        featuredNames: featName,
        allArtists: partnerPool,
        itemType,
        qualityScore: m.avgQuality,
        hype: m.hype,
        hasWarmup: Boolean(m.activeSnippet),
        promoStrategy: nextPromo,
        releaseHype: nextHype,
        albumTracksCount: fmt === 'ep' || fmt === 'album' ? nextCount : 1,
        virality: autopilot.virality,
        hitsCount: m.topHitsCount,
        catalogAvgPlays: m.catalogAvgPlays,
        deterministic: false
      });

      setSelectedArtistId(art.id);
      setReleaseFormat(fmt);
      setTitleSuggestions(titles);
      setDraftTitle(titles[0] || '');
      setDraftFeat(featName);
      setDraftCoArtist('');
      setDraftDuration(fmt === 'snippet' ? idea.suggestedDuration || '0:34' : fullRandomizeConcept ? idea.suggestedDuration : getRandomDuration());
      setDraftAlbumTracksCount(nextCount);
      setDraftAlbumTracks([]);
      setDraftPromoStrategy(nextPromo);
      setDraftReleaseHype(nextHype);
      setDraftPlays(rolledPlays);
      setDraftTeaser(fmt === 'snippet' ? SNIPPET_TEASERS[randInt(0, SNIPPET_TEASERS.length - 1)] : '');
      setActiveIdea(idea);
    },
    [metricsMap, getArtistMetrics, nonZeroArtists, simState.artists, autopilot.allowSurpriseCollabs, autopilot.virality, buildFourTitleIdeas, ideaCategory]
  );

  // Initialize whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setActionToast(null);
    const pool = filteredPool.length > 0 ? filteredPool : nonZeroArtists.length > 0 ? nonZeroArtists : simState.artists;
    if (pool.length === 0) return;
    let initial: Artist | undefined;
    if (initialArtistId) {
      const found = artistMap.get(initialArtistId);
      if (found && (!onlyNonZeroListeners || (found.followers || 0) > 0)) {
        initial = found;
      }
    }
    if (!initial) {
      initial = pool[randInt(0, pool.length - 1)];
    }
    populateForArtist(initial, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSpinRandomArtist = (randomizeConcept: boolean) => {
    const pool = filteredPool.length > 0 ? filteredPool : nonZeroArtists;
    if (pool.length === 0) return;
    const candidates = pool.length > 1 ? pool.filter(a => a.id !== selectedArtist?.id) : pool;
    const pick = candidates[randInt(0, candidates.length - 1)] || pool[0];
    populateForArtist(pick, randomizeConcept);
  };

  const handleRegenerateTitles = (mood?: TitleMood) => {
    const targetMood = typeof mood === 'string' ? mood : titleMood;
    const ideas = buildFourTitleIdeas(selectedMetrics, releaseFormat, targetMood);
    setTitleSuggestions(ideas);
    if (ideas[0]) setDraftTitle(ideas[0]);
  };

  const handleRegenerateIdeaOnly = (cat?: IdeaCategory) => {
    if (!selectedMetrics || !selectedArtist) return;
    const partnerPool = nonZeroArtists.length > 1 ? nonZeroArtists : simState.artists;
    const pickedPartner = pickFeaturedArtistSmart(selectedArtist, partnerPool, new Set(), autopilot.allowSurpriseCollabs);
    const targetCat = cat !== undefined ? cat : ideaCategory;
    const idea = buildCreativeIdeaForArtist(selectedMetrics, pickedPartner?.artist.name, targetCat);
    setActiveIdea(idea);
  };

  const handleApplyIdea = () => {
    if (!activeIdea || !selectedArtist) return;
    const fmt = activeIdea.suggestedFormat;
    const nextCount = fmt === 'ep' ? randInt(4, 6) : fmt === 'album' ? getRandomAlbumTrackCount() : draftAlbumTracksCount;
    setReleaseFormat(fmt);
    setDraftPromoStrategy(activeIdea.suggestedPromo);
    setDraftReleaseHype(activeIdea.suggestedHype);
    setDraftDuration(activeIdea.suggestedDuration);
    if (fmt === 'ep' || fmt === 'album') setDraftAlbumTracksCount(nextCount);
    if (fmt === 'snippet' && !draftTeaser) {
      setDraftTeaser(SNIPPET_TEASERS[randInt(0, SNIPPET_TEASERS.length - 1)]);
    }
    if (activeIdea.shouldUseFeat && !draftFeat && fmt !== 'album') {
      const partnerPool = nonZeroArtists.length > 1 ? nonZeroArtists : simState.artists;
      const picked = pickFeaturedArtistSmart(selectedArtist, partnerPool, new Set(), autopilot.allowSurpriseCollabs);
      if (picked) setDraftFeat(picked.artist.name);
    }
    const itemType: 'track' | 'album' | 'snippet' =
      fmt === 'snippet' ? 'snippet' : fmt === 'ep' || fmt === 'album' ? 'album' : 'track';
    const rolled = forecastReleasePlays({
      artist: selectedArtist,
      featuredNames: draftFeat,
      allArtists: nonZeroArtists,
      itemType,
      qualityScore: selectedMetrics?.avgQuality || 72,
      hype: selectedMetrics?.hype ?? 60,
      hasWarmup: Boolean(selectedMetrics?.activeSnippet),
      promoStrategy: activeIdea.suggestedPromo,
      releaseHype: activeIdea.suggestedHype,
      albumTracksCount: fmt === 'ep' || fmt === 'album' ? nextCount : 1,
      virality: autopilot.virality,
      hitsCount: selectedMetrics?.topHitsCount || 0,
      catalogAvgPlays: selectedMetrics?.catalogAvgPlays || 0,
      deterministic: false
    });
    setDraftPlays(rolled);
  };

  const handleRollFeatPartner = () => {
    if (!selectedArtist) return;
    const partnerPool = nonZeroArtists.length > 1 ? nonZeroArtists : simState.artists;
    const currentSet = new Set<string>();
    splitFeaturedList(draftFeat, selectedArtist.name).forEach(nm => {
      const f = partnerPool.find(a => a.name.toLowerCase() === nm.toLowerCase());
      if (f) currentSet.add(f.id);
    });
    const picked = pickFeaturedArtistSmart(selectedArtist, partnerPool, currentSet, autopilot.allowSurpriseCollabs);
    if (picked) {
      setDraftFeat(picked.artist.name);
    }
  };

  const handleRollPlaysScenario = (mode: 'realistic' | 'under' | 'hit' | 'viral') => {
    if (!selectedArtist) return;
    const itemType: 'track' | 'album' | 'snippet' =
      releaseFormat === 'snippet' ? 'snippet' : releaseFormat === 'ep' || releaseFormat === 'album' ? 'album' : 'track';
    const base = forecastReleasePlays({
      artist: selectedArtist,
      featuredNames: draftFeat || draftCoArtist,
      allArtists: nonZeroArtists,
      itemType,
      qualityScore: selectedMetrics?.avgQuality || 72,
      hype: selectedMetrics?.hype ?? selectedArtist.hype ?? 60,
      hasWarmup: Boolean(selectedMetrics?.activeSnippet),
      promoStrategy: draftPromoStrategy,
      releaseHype: draftReleaseHype,
      albumTracksCount: releaseFormat === 'ep' || releaseFormat === 'album' ? draftAlbumTracksCount : 1,
      virality: autopilot.virality,
      hitsCount: selectedMetrics?.topHitsCount || 0,
      catalogAvgPlays: selectedMetrics?.catalogAvgPlays || 0,
      deterministic: false
    });
    const mult =
      mode === 'under'
        ? randRange(0.58, 0.82)
        : mode === 'hit'
          ? randRange(1.28, 1.65)
          : mode === 'viral'
            ? randRange(2.05, 3.15)
            : 1.0;
    setDraftPlays(Math.max(50_000, Math.round(base * mult)));
  };

  const handleGenerateDraftTracklist = () => {
    if (!selectedArtist) return;
    const count = clamp(draftAlbumTracksCount || (releaseFormat === 'ep' ? 5 : 12), 3, 28);
    const localSet = new Set<string>(existingTitleSet);
    const generated = generateAlbumTracksWithFeats({
      artist: selectedArtist,
      allArtists: nonZeroArtists.length > 0 ? nonZeroArtists : simState.artists,
      count,
      estimatedAlbumPlays: draftPlays || deterministicForecast,
      existingTitles: localSet,
      namingProfile: selectedMetrics?.namingProfile || /[a-zA-Z]/.test(draftTitle),
      languageOverride: autopilot.languageMix,
      coArtist: draftCoArtist.trim() || undefined,
      collabRate: autopilot.collabRate,
      allowSurpriseCollabs: autopilot.allowSurpriseCollabs
    });
    const sum = generated.reduce((s, t) => s + (t.plays || 0), 0);
    setDraftAlbumTracks(generated);
    setDraftAlbumTracksCount(generated.length);
    if (sum > 0) setDraftPlays(sum);
  };

  const buildManualItemFromDraft = (): ManualSimItem | null => {
    if (!selectedArtist) return null;
    const itemType: 'track' | 'album' | 'snippet' =
      releaseFormat === 'snippet' ? 'snippet' : releaseFormat === 'ep' || releaseFormat === 'album' ? 'album' : 'track';
    const resolvedTitle =
      draftTitle.trim() ||
      generateModernTitle(new Set<string>(existingTitleSet), itemType === 'album', selectedMetrics?.namingProfile ?? false, autopilot.languageMix);
    const resolvedPlays =
      itemType === 'album' && draftAlbumTracks.length > 0
        ? draftAlbumTracks.reduce((s, t) => s + (t.plays || 0), 0)
        : draftPlays > 0
          ? draftPlays
          : deterministicForecast;

    return {
      id: makeId('idea'),
      itemType,
      artistId: selectedArtist.id,
      artistName: selectedArtist.name,
      featuredArtist: draftFeat.trim() || undefined,
      coArtist: itemType === 'album' ? draftCoArtist.trim() || undefined : undefined,
      title: resolvedTitle,
      coverUrl: '',
      duration: itemType === 'album' ? undefined : draftDuration.trim() || (itemType === 'snippet' ? '0:34' : '2:34'),
      isExplicit: false,
      genre: selectedArtist.genre || 'Hip-Hop / Pop',
      plays: resolvedPlays,
      albumTracksCount: itemType === 'album' ? (draftAlbumTracks.length > 0 ? draftAlbumTracks.length : draftAlbumTracksCount) : undefined,
      albumTracks: itemType === 'album' && draftAlbumTracks.length > 0 ? draftAlbumTracks : undefined,
      snippetTeaser: itemType === 'snippet' ? draftTeaser.trim() || undefined : undefined,
      promoStrategy: draftPromoStrategy,
      releaseHype: draftReleaseHype
    };
  };

  const buildProposalFromDraft = (): SimProposal | null => {
    const manualDraft = buildManualItemFromDraft();
    if (!manualDraft || !selectedArtist) return null;
    const m = selectedMetrics;
    return {
      id: makeId('prop'),
      selected: true,
      itemType: manualDraft.itemType,
      releaseFormat,
      artistId: manualDraft.artistId,
      artistName: manualDraft.artistName,
      featuredArtist: manualDraft.featuredArtist,
      coArtist: manualDraft.coArtist,
      title: manualDraft.title,
      coverUrl: '',
      duration: manualDraft.duration,
      isExplicit: false,
      promoBoost: Boolean(manualDraft.promoStrategy && manualDraft.promoStrategy !== 'quiet'),
      promoStrategy: manualDraft.promoStrategy,
      releaseHype: manualDraft.releaseHype,
      albumTracksCount: manualDraft.albumTracksCount,
      albumTrackTitles: manualDraft.albumTracks?.map(t => t.title),
      albumTracks: manualDraft.albumTracks,
      genre: manualDraft.genre || 'Hip-Hop / Pop',
      snippetTeaser: manualDraft.snippetTeaser,
      estimatedPlays: manualDraft.plays || deterministicForecast,
      qualityScore: m?.avgQuality || 72,
      artistHype: m?.hype ?? selectedArtist.hype ?? 60,
      daysSilent: m?.daysSilent ?? 30,
      hasWarmupBoost: Boolean(m?.activeSnippet),
      reason: activeIdea ? `Идея: ${activeIdea.badge}` : 'Создано в студии идей'
    };
  };

  if (!isOpen) return null;

  const promoKeys = Object.keys(RELEASE_PROMO_LABELS) as ReleasePromoStrategy[];
  const tierInfo = getArtistFollowerTier(selectedArtist?.followers);

  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-2.5 sm:p-5">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-[calc(100vw-1.25rem)] sm:w-full max-w-6xl max-h-[92vh] bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        {/* Top Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/10 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 theme-accent shrink-0" />
                <span>Идеи и случайный подбор</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-semibold text-zinc-300 tabular-nums">
                В пуле: {filteredPool.length} {onlyNonZeroListeners ? '(>0 слуш.)' : 'всех'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Досье по дропам и фитам, генерация идей, стримов, хайпа и мгновенный перенос в батчер
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                showFilters || tierFilter !== 'all' || genreFilter !== 'all' || pauseFilter !== 'all' || hypeFilter !== 'any' || !onlyNonZeroListeners
                  ? 'bg-amber-500/15 border-amber-400/35 text-amber-200'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Параметры</span>
            </button>
            <button
              type="button"
              disabled={filteredPool.length === 0}
              onClick={() => handleSpinRandomArtist(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-40 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Dices className="w-3.5 h-3.5 theme-accent" />
              <span>Случайный артист</span>
            </button>
            <button
              type="button"
              disabled={filteredPool.length === 0}
              onClick={() => handleSpinRandomArtist(true)}
              className="px-3.5 py-1.5 rounded-xl theme-bg-accent text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-40"
              title="Случайный артист + случайный формат, название, фит, промо и стримы"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Случайный релиз целиком</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Selection Filters */}
        {showFilters && (
          <div className="px-5 sm:px-6 py-3.5 border-b border-white/[0.08] bg-zinc-900/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyNonZeroListeners}
                  onChange={e => setOnlyNonZeroListeners(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Исключить артистов с 0 слушателей (только с аудиторией)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setOnlyNonZeroListeners(true);
                  setTierFilter('all');
                  setGenreFilter('all');
                  setPauseFilter('all');
                  setHypeFilter('any');
                }}
                className="text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Сбросить фильтры (выбирать любых)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Слушатели артиста</span>
                <select
                  value={tierFilter}
                  onChange={e => setTierFilter(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="all">Любая аудитория</option>
                  <option value="superstar">15M+ (Суперзвёзды)</option>
                  <option value="mega">8M–15M (Мега-топ)</option>
                  <option value="large">2.5M–8M (Крупные)</option>
                  <option value="mid">500k–2.5M (Популярные / Мидл)</option>
                  <option value="rising">75k–500k (На подъёме)</option>
                  <option value="rookie">До 75k (Новички / Андерграунд)</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Жанр</span>
                <select
                  value={genreFilter}
                  onChange={e => setGenreFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="all">Все жанры</option>
                  {availableGenres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Давность дропов и фитов</span>
                <select
                  value={pauseFilter}
                  onChange={e => setPauseFilter(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="all">Любая активность</option>
                  <option value="30d">30+ дн. без своего дропа</option>
                  <option value="60d">60+ дн. без своего дропа</option>
                  <option value="120d">120+ дн. (долгий камбэк)</option>
                  <option value="album_due">240+ дн. без альбома</option>
                  <option value="no_feat_45d">45+ дн. без гостевых фитов</option>
                  <option value="snippet">Есть активный сниппет</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Текущий хайп артиста</span>
                <select
                  value={hypeFilter}
                  onChange={e => setHypeFilter(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="any">Любой хайп</option>
                  <option value="low">Низкий (до 50)</option>
                  <option value="mid">Средний (50–75)</option>
                  <option value="high">Высокий (75+)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {!selectedArtist || !selectedMetrics ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm font-bold text-zinc-300">По текущим параметрам не найдено артистов</p>
              <button
                type="button"
                onClick={() => {
                  setTierFilter('all');
                  setGenreFilter('all');
                  setPauseFilter('all');
                  setHypeFilter('any');
                }}
                className="px-4 py-2 rounded-xl theme-bg-accent text-black text-xs font-bold cursor-pointer"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: ARTIST DOSSIER */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                  {/* Artist Identity */}
                  <div className="flex items-start gap-3.5">
                    <CoverArt
                      url={selectedArtist.imageUrl}
                      title={selectedArtist.name}
                      isArtist
                      className="w-16 h-16 rounded-full border-2 border-white/15 shrink-0 shadow-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {onOpenArtist ? (
                          <button
                            type="button"
                            onClick={() => onOpenArtist(selectedArtist.id)}
                            className="text-base font-extrabold text-white hover:theme-accent transition-colors flex items-center gap-1 cursor-pointer truncate"
                          >
                            <span className="truncate">{selectedArtist.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          </button>
                        ) : (
                          <h4 className="text-base font-extrabold text-white truncate">{selectedArtist.name}</h4>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${tierInfo.badgeClass}`} title={tierInfo.label}>
                          {tierInfo.shortLabel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {selectedArtist.genre || 'Жанр не указан'}
                        {selectedArtist.country ? ` · ${selectedArtist.country}` : ''}
                      </p>
                      <p className="text-xs font-bold text-emerald-300 mt-1 tabular-nums">
                        {formatListeners(selectedArtist.followers)}
                      </p>
                    </div>
                  </div>

                  {/* Quick Switch Artist Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSpinRandomArtist(false)}
                      className="flex-1 py-2 px-3 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5 theme-accent" />
                      <span>Другой случайный</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerMode('artist')}
                      className="py-2 px-3.5 rounded-2xl bg-black/45 hover:bg-black/70 border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Выбрать из списка</span>
                    </button>
                  </div>

                  {/* 4 Key Metrics Tiles */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.07]">
                      <span className="text-[11px] text-zinc-400 block">Всего стримов</span>
                      <span className="text-sm font-extrabold text-white tabular-nums mt-0.5 block">
                        {formatCompact(selectedMetrics.totalPlays)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.07]">
                      <span className="text-[11px] text-zinc-400 block">Среднее на трек</span>
                      <span className="text-sm font-extrabold text-white tabular-nums mt-0.5 block">
                        {selectedMetrics.catalogAvgPlays > 0 ? formatCompact(selectedMetrics.catalogAvgPlays) : 'Нет треков'}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.07]">
                      <span className="text-[11px] text-zinc-400 block">Дискография и хиты</span>
                      <span className="text-xs font-bold text-white tabular-nums mt-0.5 block">
                        {selectedMetrics.tracksCount} тр. · {selectedMetrics.albumsCount} альб. · {selectedMetrics.topHitsCount} хит.
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.07]">
                      <span className="text-[11px] text-zinc-400 block">Ср. оценка / Готовность</span>
                      <span className="text-xs font-bold text-white tabular-nums mt-0.5 block">
                        {selectedMetrics.avgQuality}/90 · Готов на {selectedMetrics.readinessScore}%
                      </span>
                    </div>
                  </div>

                  {/* Release & Feature Timeline */}
                  <div className="p-3.5 rounded-2xl bg-black/45 border border-white/[0.08] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Своих работ нет:</span>
                      </span>
                      <span className="font-bold text-amber-300 tabular-nums text-right">
                        {selectedMetrics.lastDropDate
                          ? `${selectedMetrics.daysSilent} дн. (${formatSimDate(selectedMetrics.lastDropDate)})`
                          : 'Ещё не было дропов'}
                      </span>
                    </div>
                    {artistDossier?.latestOwnTrack && (
                      <p className="text-[11px] text-zinc-400 pl-5 truncate">
                        Последний трек: <span className="text-zinc-200 font-semibold">{artistDossier.latestOwnTrack.title}</span> ({formatCompact(artistDossier.latestOwnTrack.plays || 0)})
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.06]">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>На гостевых фитах:</span>
                      </span>
                      <span className="font-bold text-emerald-300 tabular-nums text-right">
                        {selectedMetrics.daysSinceFeat !== null && selectedMetrics.lastFeatDate
                          ? `${selectedMetrics.daysSinceFeat} дн. назад (${formatSimDate(selectedMetrics.lastFeatDate)})`
                          : 'На фитах не был'}
                      </span>
                    </div>
                    {artistDossier?.latestFeatTrack && (
                      <p className="text-[11px] text-zinc-400 pl-5 truncate">
                        Гость у <span className="text-zinc-200 font-semibold">{artistDossier.latestFeatTrack.artistName}</span> — «{artistDossier.latestFeatTrack.title}»
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.06]">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>Последний альбом:</span>
                      </span>
                      <span className="font-bold text-sky-300 tabular-nums text-right">
                        {selectedMetrics.daysSinceAlbum !== null && selectedMetrics.lastAlbumDate
                          ? `${selectedMetrics.daysSinceAlbum} дн. (${formatSimDate(selectedMetrics.lastAlbumDate)})`
                          : 'Альбомов не было'}
                      </span>
                    </div>
                    {artistDossier?.latestOwnAlbum && (
                      <p className="text-[11px] text-zinc-400 pl-5 truncate">
                        «{artistDossier.latestOwnAlbum.title}» · {formatCompact(artistDossier.latestOwnAlbum.totalPlays || 0)}
                      </p>
                    )}

                    {artistDossier?.topTrack && (
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.06]">
                        <span className="text-zinc-400">Главный хит в базе:</span>
                        <span className="font-semibold text-white truncate max-w-[55%]">
                          {artistDossier.topTrack.title} ({formatCompact(artistDossier.topTrack.plays || 0)})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Artist Hype Bar + Adjust */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.07] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 theme-accent" />
                        <span>Хайп артиста сейчас: <strong className="text-white font-mono">{selectedMetrics.hype}/100</strong></span>
                      </span>
                      {onAdjustArtistHype && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onAdjustArtistHype(selectedArtist.id, -5)}
                            className="px-2 py-0.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-xs font-bold text-zinc-200 cursor-pointer"
                          >
                            −5
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdjustArtistHype(selectedArtist.id, 5)}
                            className="px-2 py-0.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-xs font-bold text-zinc-200 cursor-pointer"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = randInt(35, 95);
                              onAdjustArtistHype(selectedArtist.id, target - selectedMetrics.hype);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[11px] font-semibold text-zinc-300 cursor-pointer"
                            title="Случайно задать хайп артиста"
                          >
                            <Dices className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full theme-bg-accent rounded-full transition-all" style={{ width: `${selectedMetrics.hype}%` }} />
                    </div>
                  </div>

                  {/* Audience Expectation & Recent Collabs */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-100">
                      <p className="font-bold">Ожидания: {selectedMetrics.fanExpectation}</p>
                      <p className="text-[11px] text-emerald-200/80 mt-1">
                        Рекомендовано: <strong className="text-white">{selectedMetrics.recommendedFormat}</strong>
                      </p>
                    </div>

                    {selectedMetrics.recentCollabPartners.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500">Недавние фиты:</span>
                        {selectedMetrics.recentCollabPartners.slice(0, 6).map(nm => (
                          <span key={nm} className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-zinc-300">
                            {nm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: IDEA, TITLE, FEATS, STREAMS & HYPE CONSTRUCTOR */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Creative Idea Categories & Pitch Card */}
                <div className="space-y-3">
                  {/* Category Filter Pills for Ideas */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-black/45 rounded-2xl border border-white/10 text-xs">
                      {[
                        { id: 'all', label: 'Все идеи' },
                        { id: 'hype', label: '🔥 Громкие инфоповоды' },
                        { id: 'routine', label: '☕ Рутинные и спокойные' },
                        { id: 'album', label: '💿 Альбомы и EP' },
                        { id: 'collab', label: '🤝 Коллаборации' },
                        { id: 'viral', label: '⚡ Вирусные' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const nextCat = cat.id as IdeaCategory;
                            setIdeaCategory(nextCat);
                            handleRegenerateIdeaOnly(nextCat);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            ideaCategory === cat.id
                              ? 'theme-bg-accent text-black shadow-md font-extrabold'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAllIdeasModal(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        showAllIdeasModal
                          ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-300'
                      }`}
                    >
                      <List className="w-3.5 h-3.5 theme-accent" />
                      <span>Каталог инфоповодов ({allIdeasForSelectedArtist.length})</span>
                    </button>
                  </div>

                  {/* All Ideas Drawer Modal / Dropdown */}
                  {showAllIdeasModal && (
                    <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/15 shadow-2xl space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 theme-accent" />
                          <span>Выберите любой инфоповод для {selectedArtist.name}:</span>
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {allIdeasForSelectedArtist.length} вариантов
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {allIdeasForSelectedArtist.map(idea => (
                          <div
                            key={idea.id}
                            onClick={() => {
                              setActiveIdea(idea);
                              setShowAllIdeasModal(false);
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer text-left space-y-1 group ${
                              activeIdea?.id === idea.id
                                ? 'bg-white/[0.12] border-white/30'
                                : 'bg-black/40 hover:bg-white/[0.06] border-white/[0.08]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${idea.badgeClass}`}>
                                {idea.badge}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-semibold">({idea.categoryLabel})</span>
                            </div>
                            <h5 className="text-xs font-extrabold text-white group-hover:theme-accent transition-colors line-clamp-1">
                              {idea.title}
                            </h5>
                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                              {idea.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Idea Pitch Card */}
                  {activeIdea && (
                    <div className="p-4 rounded-3xl bg-zinc-900/70 border border-white/12 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${activeIdea.badgeClass}`}>
                            {activeIdea.badge}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-semibold text-zinc-400 shrink-0">
                            {activeIdea.categoryLabel}
                          </span>
                          <h4 className="text-sm font-extrabold text-white truncate">{activeIdea.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRegenerateIdeaOnly()}
                            className="px-2.5 py-1 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-[11px] font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer"
                            title="Сгенерировать другой инфоповод из выбранной категории"
                          >
                            <RefreshCw className="w-3 h-3 theme-accent" />
                            <span>Другой инфоповод</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyIdea}
                            className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-[11px] font-bold text-emerald-200 cursor-pointer"
                          >
                            Применить к релизу
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{activeIdea.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                        <span>Подача: <strong className="text-zinc-200">{activeIdea.vibeHint}</strong></span>
                        <span>Формат: <strong className="text-zinc-200">{activeIdea.suggestedFormat.toUpperCase()}</strong></span>
                        <span>Промо: <strong className="text-zinc-200">{RELEASE_PROMO_LABELS[activeIdea.suggestedPromo]?.shortLabel || activeIdea.suggestedPromo}</strong></span>
                        <span>Хайп: <strong className="text-zinc-200">{activeIdea.suggestedHype}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Format, Title Ideas & Feats */}
                <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/55 border border-white/10 space-y-4">
                  {/* Format + Duration/Track Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-8">
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Формат релиза</label>
                      <div className="grid grid-cols-4 gap-1 p-1 bg-black/45 rounded-2xl border border-white/10">
                        {([
                          { id: 'single', label: 'Трек' },
                          { id: 'ep', label: 'EP' },
                          { id: 'album', label: 'Альбом' },
                          { id: 'snippet', label: 'Сниппет' }
                        ] as const).map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setReleaseFormat(f.id);
                              if (f.id === 'ep' && (draftAlbumTracksCount < 3 || draftAlbumTracksCount > 7)) {
                                setDraftAlbumTracksCount(randInt(4, 6));
                              } else if (f.id === 'album' && draftAlbumTracksCount < 7) {
                                setDraftAlbumTracksCount(getRandomAlbumTrackCount());
                              } else if (f.id === 'snippet') {
                                setDraftDuration('0:34');
                                if (!draftTeaser) setDraftTeaser(SNIPPET_TEASERS[randInt(0, SNIPPET_TEASERS.length - 1)]);
                              } else if (f.id === 'single' && draftDuration.startsWith('0:')) {
                                setDraftDuration(getRandomDuration());
                              }
                            }}
                            className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              releaseFormat === f.id ? 'theme-bg-accent text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      {releaseFormat === 'album' || releaseFormat === 'ep' ? (
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                            Кол-во треков
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min={3}
                              max={30}
                              value={draftAlbumTracksCount}
                              onChange={e => setDraftAlbumTracksCount(clamp(parseInt(e.target.value, 10) || 10, 3, 30))}
                              className="w-full bg-black/45 border border-white/10 rounded-2xl px-3 py-2 text-xs font-mono font-bold text-white text-center outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftAlbumTracksCount(releaseFormat === 'ep' ? randInt(4, 6) : getRandomAlbumTrackCount())
                              }
                              className="px-3 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 cursor-pointer shrink-0"
                              title="Случайное число треков"
                            >
                              <Dices className="w-3.5 h-3.5 theme-accent" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                            Длительность
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={draftDuration}
                              onChange={e => setDraftDuration(e.target.value)}
                              className="w-full bg-black/45 border border-white/10 rounded-2xl px-3 py-2 text-xs font-mono font-bold text-white text-center outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftDuration(releaseFormat === 'snippet' ? `0:${randInt(22, 46)}` : getRandomDuration())
                              }
                              className="px-3 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 cursor-pointer shrink-0"
                              title="Случайный хронометраж"
                            >
                              <Dices className="w-3.5 h-3.5 theme-accent" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title Input + Mood Selector + 4 Clickable Title Ideas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Название релиза</label>
                      <button
                        type="button"
                        onClick={() => handleRegenerateTitles()}
                        className="text-[11px] font-bold theme-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Dices className="w-3 h-3" />
                        <span>Новые варианты названий</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={e => setDraftTitle(e.target.value)}
                        placeholder="Введите или выберите вариант ниже..."
                        className="flex-1 bg-black/45 border border-white/12 focus:border-white/30 rounded-2xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                      />
                      <TitleMoodPicker
                        value={titleMood}
                        onChange={nextMood => {
                          setTitleMood(nextMood);
                          handleRegenerateTitles(nextMood);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRegenerateTitles()}
                        className="px-3.5 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 cursor-pointer"
                        title="Сгенерировать новое название"
                      >
                        <Dices className="w-4 h-4 theme-accent" />
                      </button>
                    </div>
                    {titleSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {titleSuggestions.map((tOpt, idx) => (
                          <button
                            key={`${tOpt}_${idx}`}
                            type="button"
                            onClick={() => setDraftTitle(tOpt)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors ${
                              draftTitle === tOpt
                                ? 'theme-bg-accent text-black border-transparent font-bold'
                                : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:border-white/25'
                            }`}
                          >
                            {tOpt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feat / Co-Artist Generators */}
                  <div className={`grid grid-cols-1 ${releaseFormat === 'album' || releaseFormat === 'ep' ? 'sm:grid-cols-2' : ''} gap-3`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Фит (гость)</label>
                        <button
                          type="button"
                          onClick={handleRollFeatPartner}
                          className="text-[11px] font-bold theme-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Dices className="w-3 h-3" />
                          <span>Подобрать по синергии</span>
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={draftFeat}
                          onChange={e => setDraftFeat(e.target.value)}
                          placeholder="Без гостя (соло)..."
                          className="flex-1 min-w-0 bg-black/45 border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setPickerMode('feat')}
                          className="px-3 py-2 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-zinc-200 cursor-pointer"
                          title="Выбрать гостя из базы"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        {draftFeat && (
                          <button
                            type="button"
                            onClick={() => setDraftFeat('')}
                            className="px-2.5 py-2 rounded-2xl bg-white/[0.05] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 cursor-pointer"
                            title="Сделать сольным"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {(releaseFormat === 'album' || releaseFormat === 'ep') && (
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                          Соавтор альбома (опц.)
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={draftCoArtist}
                            onChange={e => setDraftCoArtist(e.target.value)}
                            placeholder="Дуэтный проект..."
                            className="flex-1 min-w-0 bg-black/45 border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setPickerMode('co')}
                            className="px-3 py-2 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-zinc-200 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Album Quick Tracklist Preview / Generator */}
                  {(releaseFormat === 'album' || releaseFormat === 'ep') && (
                    <div className="p-3 rounded-2xl bg-black/35 border border-white/[0.08] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-200">
                          Треклист ({draftAlbumTracks.length > 0 ? `${draftAlbumTracks.length} готовых треков` : `будет авто при дропе: ${draftAlbumTracksCount} тр.`})
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleGenerateDraftTracklist}
                            className="px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 theme-accent" />
                            <span>{draftAlbumTracks.length > 0 ? 'Перегенерировать' : 'Сгенерировать треклист'}</span>
                          </button>
                          {draftAlbumTracks.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDraftAlbumTracks([])}
                              className="px-2 py-1 rounded-xl text-[11px] text-zinc-400 hover:text-rose-300 cursor-pointer"
                            >
                              Сбросить
                            </button>
                          )}
                        </div>
                      </div>
                      {draftAlbumTracks.length > 0 && (
                        <div className="max-h-28 overflow-y-auto custom-scrollbar divide-y divide-white/[0.05] text-[11px]">
                          {draftAlbumTracks.map((tr, idx) => (
                            <div key={tr.id} className="py-1 flex items-center justify-between gap-2">
                              <span className="text-zinc-300 truncate">
                                <span className="text-zinc-500 font-mono mr-1.5">{idx + 1}.</span>
                                <span className="font-semibold text-white">{tr.title}</span>
                                {tr.featuredArtist ? <span className="text-zinc-400"> feat. {tr.featuredArtist}</span> : null}
                              </span>
                              <span className="text-emerald-300 font-mono tabular-nums shrink-0">
                                {formatCompact(tr.plays || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Snippet Teaser */}
                  {releaseFormat === 'snippet' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Строка / тизер сниппета</label>
                        <button
                          type="button"
                          onClick={() => setDraftTeaser(SNIPPET_TEASERS[randInt(0, SNIPPET_TEASERS.length - 1)])}
                          className="text-[11px] font-bold theme-accent hover:underline cursor-pointer"
                        >
                          Случайный тизер
                        </button>
                      </div>
                      <input
                        type="text"
                        value={draftTeaser}
                        onChange={e => setDraftTeaser(e.target.value)}
                        placeholder="Тизер в соцсетях..."
                        className="w-full bg-black/45 border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Streams & Hype / Promo Generator */}
                <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/55 border border-white/10 space-y-4">
                  {/* Plays Generator */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Генератор стартовых прослушиваний
                      </label>
                      <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                        Базовый прогноз: ~{formatCompact(deterministicForecast)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={formatNumber(draftPlays)}
                        onChange={e => {
                          const d = e.target.value.replace(/\D/g, '');
                          setDraftPlays(d ? parseInt(d, 10) : 0);
                        }}
                        className="w-44 bg-black/50 border border-white/15 focus:border-white/35 rounded-2xl px-3.5 py-2 text-sm font-mono font-extrabold text-white tabular-nums outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 flex-1">
                        <button
                          type="button"
                          onClick={() => handleRollPlaysScenario('realistic')}
                          className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs font-bold text-white cursor-pointer"
                        >
                          🎲 Реалистичный
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRollPlaysScenario('under')}
                          className="px-3 py-2 rounded-xl bg-black/45 hover:bg-black/65 border border-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
                        >
                          🌙 Андер
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRollPlaysScenario('hit')}
                          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/25 text-xs font-bold text-amber-200 cursor-pointer"
                        >
                          🔥 Хит
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRollPlaysScenario('viral')}
                          className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/25 text-xs font-bold text-emerald-200 cursor-pointer"
                        >
                          🚀 Вирал
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Release Hype & Promo Strategy */}
                  <div className="pt-3 border-t border-white/[0.08] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Уровень хайпа релиза и стратегия промо
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDraftPromoStrategy(promoKeys[randInt(0, promoKeys.length - 1)]);
                            setDraftReleaseHype(randInt(40, 96));
                          }}
                          className="text-[11px] font-bold theme-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Dices className="w-3 h-3" />
                          <span>Случайное промо и хайп</span>
                        </button>
                        {draftPromoStrategy && (
                          <button
                            type="button"
                            onClick={() => setDraftPromoStrategy(undefined)}
                            className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Сброс промо
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDraftPromoStrategy(undefined)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                          !draftPromoStrategy
                            ? 'theme-bg-accent text-black border-transparent font-bold'
                            : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white'
                        }`}
                      >
                        Стандарт
                      </button>
                      {promoKeys.map(pk => (
                        <button
                          key={pk}
                          type="button"
                          onClick={() => setDraftPromoStrategy(pk)}
                          title={RELEASE_PROMO_LABELS[pk].hint}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                            draftPromoStrategy === pk
                              ? 'theme-bg-accent text-black border-transparent font-bold'
                              : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {RELEASE_PROMO_LABELS[pk].shortLabel}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-300 font-semibold whitespace-nowrap">Хайп релиза:</span>
                      <input
                        type="range"
                        min={10}
                        max={99}
                        value={draftReleaseHype}
                        onChange={e => setDraftReleaseHype(Number(e.target.value))}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-white w-24 text-right tabular-nums">
                        {draftReleaseHype} (×{getReleaseHypeMultiplier(draftReleaseHype).toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Transfer Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-zinc-900/65 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-400 tabular-nums">
              В очереди батча: <strong className="text-white">{manualQueueCount}</strong>
            </span>
            {actionToast && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-semibold">
                {actionToast}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!selectedArtist}
              onClick={() => {
                const prop = buildProposalFromDraft();
                if (!prop) return;
                onAddToSemi(prop);
                setActionToast(`✓ Добавлено в полуавтомат: ${prop.artistName} — ${prop.title}`);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] disabled:opacity-40 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 theme-accent" />
              <span>В полуавтомат</span>
            </button>

            <button
              type="button"
              disabled={!selectedArtist}
              onClick={() => {
                const item = buildManualItemFromDraft();
                if (!item) return;
                onQueueManualItem(item);
                setActionToast(`✓ В очереди батча: ${item.artistName} — ${item.title}`);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 border border-emerald-400/30 text-xs font-bold text-emerald-200 flex items-center gap-1.5 cursor-pointer"
              title="Добавить в очередь батча сразу и продолжить подбирать ещё артистов"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Сразу в очередь батча</span>
            </button>

            <button
              type="button"
              disabled={!selectedArtist}
              onClick={() => {
                const item = buildManualItemFromDraft();
                if (!item) return;
                onTransferToManual(item);
              }}
              className="px-4 py-2 rounded-xl theme-bg-accent text-black text-xs font-extrabold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              <span>Перенести в батчер</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <SimArtistPickerModal
        isOpen={Boolean(pickerMode)}
        onClose={() => setPickerMode(null)}
        title={
          pickerMode === 'artist'
            ? 'Выбор артиста (приоритет >0 слуш.)'
            : pickerMode === 'co'
              ? 'Выбор соавтора альбома'
              : 'Выбор артиста на фит'
        }
        artists={pickerMode === 'artist' ? filteredPool : nonZeroArtists.length > 0 ? nonZeroArtists : simState.artists}
        metricsMap={metricsMap}
        onSelect={art => {
          if (pickerMode === 'artist') {
            populateForArtist(art, false);
          } else if (pickerMode === 'feat') {
            setDraftFeat(prev => appendFeaturedName(prev, art.name));
          } else if (pickerMode === 'co') {
            setDraftCoArtist(prev => appendFeaturedName(prev, art.name));
          }
        }}
      />
    </div>,
    document.body
  );
};

// ============================================================================
// SIMULATION START MODAL (PORTALED, ZERO-LAG)
// ============================================================================

export const SimStartModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  saveSlots: SimSaveSlot[];
  onStartNew: (startDate: string, futurePolicy: SimFuturePolicy) => void;
  onLoadSlot: (slot: SimSaveSlot) => void;
  onDeleteSlot: (slotId: string) => void;
}> = ({
  isOpen,
  onClose,
  artists,
  albums,
  tracks,
  saveSlots,
  onStartNew,
  onLoadSlot,
  onDeleteSlot
}) => {
  const latestCatalogDate = useMemo(() => {
    let maxD = new Date().toISOString().slice(0, 10);
    let best = '';
    for (let i = 0; i < tracks.length; i++) {
      const d = tracks[i].releaseDate;
      if (d && d > best) best = d;
    }
    for (let i = 0; i < albums.length; i++) {
      const d = albums[i].releaseDate;
      if (d && d > best) best = d;
    }
    return best || maxD;
  }, [tracks, albums]);

  const [startDate, setStartDate] = useState<string>(latestCatalogDate);
  const [futurePolicy, setFuturePolicy] = useState<SimFuturePolicy>('hidden');

  useEffect(() => {
    if (isOpen) {
      setStartDate(latestCatalogDate);
    }
  }, [isOpen, latestCatalogDate]);

  const previewCounts = useMemo(() => {
    let albCount = 0;
    for (let i = 0; i < albums.length; i++) {
      const d = albums[i].releaseDate || `${albums[i].releaseYear || 2020}-01-01`;
      if (d <= startDate) albCount++;
    }
    let trkCount = 0;
    for (let i = 0; i < tracks.length; i++) {
      const d = tracks[i].releaseDate || '1900-01-01';
      if (d <= startDate) trkCount++;
    }
    return { artistsCount: artists.length, albCount, trkCount };
  }, [artists.length, albums, tracks, startDate]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl bg-zinc-950 border border-white/12 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[calc(100vh-1.5rem)] sm:max-h-[88vh] flex flex-col"
      >
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.02]">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-white tracking-tight">Режим симуляции индустрии</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Изолированная песочница: ваша основная база остаётся полностью нетронутой
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-300 block">
              Точка старта во времени (дата начала)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white outline-none"
              />
              {[
                { label: 'Последний дроп', date: latestCatalogDate },
                { label: '-1 месяц', date: addDaysISO(latestCatalogDate, -30) },
                { label: '-3 месяца', date: addDaysISO(latestCatalogDate, -90) },
                { label: 'Начало 2025', date: '2025-01-01' },
                { label: 'Сегодня', date: new Date().toISOString().slice(0, 10) }
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setStartDate(p.date)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    startDate === p.date
                      ? 'theme-bg-accent text-black border-transparent font-bold'
                      : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400 tabular-nums">
              На дату <span className="text-white font-semibold">{formatSimDate(startDate)}</span> в мире будет:{' '}
              {previewCounts.artistsCount} артистов · {previewCounts.albCount} альбомов · {previewCounts.trkCount} треков
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-zinc-300 block">
              Как поступать с треками из базы, которые выйдут позже этой даты?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFuturePolicy('hidden')}
                className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                  futurePolicy === 'hidden'
                    ? 'bg-white/[0.08] border-white/30 text-white'
                    : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <p className="text-xs font-bold text-white">Чистая альтернативная история</p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Будущие релизы не загружаются — дальше выходят только симулированные и созданные вами треки.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFuturePolicy('scheduled')}
                className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                  futurePolicy === 'scheduled'
                    ? 'bg-white/[0.08] border-white/30 text-white'
                    : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <p className="text-xs font-bold text-white">Открывать реальные по датам</p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Когда симуляция дойдёт до даты реального релиза из вашей базы, он тоже появится на площадке.
                </p>
              </button>
            </div>
          </div>

          <SimScenarioPicker />

          {saveSlots.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
              <span className="text-xs font-bold text-zinc-300 block">Сохранённые симуляции ({saveSlots.length})</span>
              <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                {saveSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="px-3.5 py-2.5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{slot.name}</p>
                      <p className="text-[11px] text-zinc-400 tabular-nums mt-0.5">
                        {formatSimDate(slot.currentDate)} · Неделя {slot.weekNumber} · {slot.tracksCount} треков
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onLoadSlot(slot)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Загрузить
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSlot(slot.id)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Удалить слот"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Обычная база не изменится</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => onStartNew(startDate, futurePolicy)}
              className="px-4 py-2 rounded-xl theme-bg-accent text-black text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Начать симуляцию</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

// ============================================================================
// MEMOIZED ROW COMPONENTS FOR ZERO-LAG RENDERING
// ============================================================================

const SemiProposalRow = memo<{
  prop: SimProposal;
  onToggle: (id: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onPlaysChange: (id: string, plays: number) => void;
  onOpenEditor: (prop: SimProposal) => void;
}>(({ prop, onToggle, onTitleChange, onPlaysChange, onOpenEditor }) => {
  return (
    <div
      className={`p-3.5 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 transition-opacity ${
        prop.selected ? 'bg-white/[0.04]' : 'opacity-70 hover:opacity-90'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggle(prop.id)}
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
            prop.selected
              ? 'theme-bg-accent border-transparent text-black'
              : 'bg-black/40 border-white/25 text-transparent hover:border-white/50'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <CoverArt
          url={prop.coverUrl}
          title={prop.title || 'Без названия'}
          albumTitle={prop.itemType === 'album' ? prop.title : undefined}
          className="w-12 h-12 rounded-xl shrink-0 border border-white/15 bg-zinc-900"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 bg-white/[0.08] px-2 py-0.5 rounded-md">
              {prop.releaseFormat === 'ep'
                ? 'EP'
                : prop.itemType === 'album'
                  ? 'Альбом'
                  : prop.itemType === 'snippet'
                    ? 'Сниппет'
                    : 'Трек'}
            </span>
            <span className="text-[13px] font-extrabold text-white whitespace-nowrap">{prop.artistName}</span>
            {prop.featuredArtist && (
              <span className="text-xs font-medium text-zinc-300 whitespace-nowrap">feat. {prop.featuredArtist}</span>
            )}
            <input
              type="text"
              value={prop.title}
              onChange={e => onTitleChange(prop.id, e.target.value)}
              className="flex-1 min-w-[140px] bg-black/50 border border-white/15 focus:border-white/35 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white outline-none"
              placeholder="Название релиза..."
            />
          </div>

          <p className="text-xs text-zinc-300 tabular-nums truncate">
            {prop.reason} · Хайп <span className="text-white font-semibold">{prop.artistHype}/100</span> · Качество{' '}
            <span className="text-white font-semibold">{prop.qualityScore}/90</span>
            {prop.promoStrategy && RELEASE_PROMO_LABELS[prop.promoStrategy]
              ? ` · ${RELEASE_PROMO_LABELS[prop.promoStrategy].shortLabel}`
              : prop.promoBoost
                ? ' · Промо-буст'
                : ''}
            {typeof prop.releaseHype === 'number' ? ` · Релиз-хайп ${prop.releaseHype}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-8 xl:pl-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-300 whitespace-nowrap">Прогноз:</span>
          <input
            type="text"
            value={formatNumber(prop.estimatedPlays)}
            onChange={e => onPlaysChange(prop.id, parseFormattedNumber(e.target.value))}
            className="w-28 bg-black/55 border border-white/15 focus:border-white/35 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-white text-right tabular-nums outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => onOpenEditor(prop)}
          className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          title="Открыть полный редактор трека/альбома и обложки"
        >
          <Edit3 className="w-3.5 h-3.5 theme-accent" />
          <span>Редактор</span>
        </button>
      </div>
    </div>
  );
});

// --- Radar v2: simpler card, expectation meter, drop / hide / regenerate ---
const RADAR_HIDDEN_LS = 'musaic.radar.hidden';
let radarHidden: Set<string> = (() => { try { return new Set<string>(JSON.parse(localStorage.getItem(RADAR_HIDDEN_LS) || '[]')); } catch { return new Set<string>(); } })();
let radarShowHidden = false;
const radarListeners = new Set<() => void>();
let radarVersion = 0;
const radarEmit = () => { radarVersion++; radarListeners.forEach(f => f()); };
const radarSub = (f: () => void) => { radarListeners.add(f); return () => { radarListeners.delete(f); }; };
const useRadarVersion = () => React.useSyncExternalStore(radarSub, () => radarVersion, () => radarVersion);
const setRadarHidden = (id: string, hide: boolean) => {
  radarHidden = new Set(radarHidden);
  if (hide) radarHidden.add(id); else radarHidden.delete(id);
  try { localStorage.setItem(RADAR_HIDDEN_LS, JSON.stringify([...radarHidden])); } catch { /* */ }
  radarEmit();
};

/** what fans expect and how much (0-100). Grows with hype and silence, cools down after a very long silence */
export function computeFanExpectation(m: ArtistSimMetrics): { score: number; label: string; what: string; color: string } {
  const cadence = m.tier === 'mega' ? 60 : m.tier === 'large' ? 45 : m.tier === 'mid' ? 35 : 25;
  const s = m.daysSilent / cadence;
  const albumHunger = m.daysSinceAlbum === null ? (m.tracksCount >= 6 ? 0.7 : 0.2) : Math.min(1, m.daysSinceAlbum / 365);
  const cool = s > 3 ? (s - 3) * 9 : 0;
  const score = clamp(Math.round(m.hype * 0.55 + 30 * Math.min(1, s) + 18 * albumHunger + (m.activeSnippet ? 14 : 0) - cool), 0, 100);
  const label = score >= 80 ? 'Ждут как никогда' : score >= 62 ? 'Сильно ждут' : score >= 42 ? 'Ждут' : score >= 22 ? 'Спокойно' : 'Остыли';
  const what = m.activeSnippet ? `полную версию «${m.activeSnippet.title}»` : albumHunger >= 0.7 && m.tracksCount >= 4 ? 'альбом' : s >= 1 ? 'новый сингл' : 'продолжение волны';
  const color = score >= 80 ? '#f472b6' : score >= 62 ? '#fbbf24' : score >= 42 ? '#34d399' : score >= 22 ? '#60a5fa' : '#71717a';
  return { score, label, what, color };
}

const RadarHiddenBar: React.FC = () => {
  useRadarVersion();
  if (radarHidden.size === 0 && !radarShowHidden) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300">
      <span>Скрыто с радара: <strong className="text-white">{radarHidden.size}</strong></span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => { radarShowHidden = !radarShowHidden; radarEmit(); }} className="font-bold hover:text-white cursor-pointer">{radarShowHidden ? 'Спрятать скрытых' : 'Показать скрытых'}</button>
        {radarHidden.size > 0 && <button type="button" onClick={() => { radarHidden = new Set(); try { localStorage.removeItem(RADAR_HIDDEN_LS); } catch { /* */ } radarEmit(); }} className="font-bold text-zinc-500 hover:text-white cursor-pointer">Вернуть всех</button>}
      </div>
    </div>
  );
};

const RadarArtistRow = memo<{
  m: ArtistSimMetrics;
  radarSeed?: number;
  suggestedPartner?: { id: string; name: string } | null;
  onAdjustHype?: (artistId: string, delta: number) => void;
  onAddToSemi: (artist: Artist) => void;
  onCreateManual: (artist: Artist) => void;
  onOpenArtist?: (artistId: string) => void;
}>(({ m, radarSeed = 0, suggestedPartner, onAdjustHype, onAddToSemi, onCreateManual, onOpenArtist }) => {
  useRadarVersion();
  const [open, setOpen] = useState(false);
  const [localSeed, setLocalSeed] = useState(0);
  const hidden = radarHidden.has(m.artist.id);
  const exp = useMemo(() => computeFanExpectation(m), [m]);
  // the click changes the SHOWN hype by ±5 (manual bias is blended with organic hype)
  const adjust = onAdjustHype ? (delta: number) => {
    const org = m.organicHype ?? m.hype;
    const target = clamp(m.hype + delta, 5, 99);
    const manual = clamp(Math.round((target - org * 0.3) / 0.7), 5, 99);
    onAdjustHype(m.artist.id, manual - (m.artist.hype ?? 50));
  } : undefined;
  const tierLabel = m.tier === 'mega' ? 'Мега-топ' : m.tier === 'large' ? 'Крупный' : m.tier === 'mid' ? 'Средний' : 'Новичок';
  const ideas = useMemo(() => {
    const base = [m.recommendedFormat];
    if (m.daysSinceAlbum === null || m.daysSinceAlbum >= 220) base.push('Концепт-EP (4–6 тр.)', 'Альбом с громким синглом-прогревом');
    if (suggestedPartner) base.push(`Коллаб-сингл с ${suggestedPartner.name}`);
    if (m.activeSnippet) base.push(`Выпустить «${m.activeSnippet.title}» целиком`);
    base.push(m.hype >= 72 ? 'Громкий хит-сингл' : 'Сниппет + быстрый клип', 'Сюрприз-дроп без анонса', 'Ремикс на старый хит');
    return base.filter(Boolean);
  }, [m.recommendedFormat, m.daysSinceAlbum, m.hype, m.activeSnippet, suggestedPartner]);
  const idea = ideas[(radarSeed + localSeed) % ideas.length];
  if (hidden && !radarShowHidden) return null;
  const lastDrop = m.lastDropDate ? `${m.daysSilent} дн. назад` : 'ещё не было';
  return (
    <div className={`p-3.5 sm:p-4 transition-colors ${hidden ? 'opacity-45' : 'hover:bg-white/[0.03]'}`}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onOpenArtist && onOpenArtist(m.artist.id)} disabled={!onOpenArtist} className="shrink-0 cursor-pointer disabled:cursor-default">
          <CoverArt url={m.artist.imageUrl} title={m.artist.name} isArtist className="w-12 h-12 rounded-full border border-white/15" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" onClick={() => onOpenArtist && onOpenArtist(m.artist.id)} className="text-[15px] font-extrabold text-white truncate hover:underline cursor-pointer">{m.artist.name}</button>
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">{tierLabel}</span>
          </div>
          <div className="text-[12px] text-zinc-400 tabular-nums truncate">
            {formatListeners(m.artist.followers)} слуш. · последний трек {lastDrop}{m.artist.genre ? ` · ${m.artist.genre}` : ''}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="w-28">
            <div className="flex justify-between text-[11px]"><span className="text-zinc-400">Хайп</span><span className="font-mono font-bold text-white">{m.hype}</span></div>
            <div className="flex items-center gap-1 mt-1">
              {adjust && <button type="button" onClick={() => adjust(-5)} className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.14] text-[11px] font-bold text-zinc-200 cursor-pointer">−</button>}
              <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full theme-bg-accent rounded-full transition-all duration-500" style={{ width: `${m.hype}%` }} /></div>
              {adjust && <button type="button" onClick={() => adjust(5)} className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.14] text-[11px] font-bold text-zinc-200 cursor-pointer">+</button>}
            </div>
          </div>
          <div className="w-32" title={`Фанаты ждут: ${exp.what}`}>
            <div className="flex justify-between text-[11px]"><span className="text-zinc-400">Ожидание</span><span className="font-mono font-bold" style={{ color: exp.color }}>{exp.score}</span></div>
            <div className="h-1.5 mt-1 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${exp.score}%`, background: exp.color }} /></div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: exp.color }}>{exp.label}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => onCreateManual(m.artist)} className="px-3 py-1.5 rounded-xl theme-bg-accent text-black text-xs font-black hover:opacity-90 cursor-pointer" title="Создать релиз для этого артиста">Дроп</button>
          <button type="button" onClick={() => onAddToSemi(m.artist)} className="hidden sm:block px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-white cursor-pointer" title="Добавить в кандидаты недели">+ Неделя</button>
          <button type="button" onClick={() => setRadarHidden(m.artist.id, !hidden)} className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] text-zinc-400 hover:text-white text-xs cursor-pointer" title={hidden ? 'Вернуть на радар' : 'Убрать с радара'}>{hidden ? '↺' : '✕'}</button>
          <button type="button" onClick={() => setOpen(v => !v)} className={`w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] text-zinc-300 text-xs cursor-pointer transition-transform ${open ? 'rotate-180' : ''}`} title="Подробнее">▾</button>
        </div>
      </div>

      {/* mobile meters */}
      <div className="md:hidden grid grid-cols-2 gap-3 mt-2.5 pl-[60px]">
        <div><div className="flex justify-between text-[11px]"><span className="text-zinc-400">Хайп</span><span className="font-mono font-bold text-white">{m.hype}</span></div><div className="h-1.5 mt-1 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full theme-bg-accent rounded-full" style={{ width: `${m.hype}%` }} /></div></div>
        <div><div className="flex justify-between text-[11px]"><span className="text-zinc-400">Ожидание</span><span className="font-mono font-bold" style={{ color: exp.color }}>{exp.score}</span></div><div className="h-1.5 mt-1 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${exp.score}%`, background: exp.color }} /></div></div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-zinc-500">Ждут: <span className="text-zinc-200 font-semibold">{exp.what}</span></span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-500">Идея: <span className="theme-accent font-bold">{idea}</span></span>
        <button type="button" onClick={() => setLocalSeed(s => s + 1)} className="text-[11px] text-zinc-500 hover:text-white cursor-pointer" title="Другая идея">🔄</button>
      </div>

      {open && (
        <div className="mt-3 grid sm:grid-cols-2 gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-zinc-300">
          <div className="space-y-1 tabular-nums">
            <div>Ср. на трек: <strong className="text-white">{formatCompact(m.catalogAvgPlays)}</strong> · всего <strong className="text-white">{formatCompact(m.totalPlays)}</strong></div>
            <div>Хитов: <strong className="text-white">{m.topHitsCount}</strong> · оценка <strong className="text-white">{m.avgQuality}/90</strong> · готовность <strong className="text-white">{m.readinessScore}%</strong></div>
            <div>Прогноз: сингл <strong className="text-white">{formatCompact(m.predictedTrackPlays)}</strong> · альбом <strong className="text-white">{formatCompact(m.predictedAlbumPlays)}</strong></div>
            <div>Без альбома: <strong className="text-white">{m.daysSinceAlbum === null ? 'не было' : `${m.daysSinceAlbum} дн.`}</strong>{m.daysSilentOverall < m.daysSilent ? <> · с фитами {m.daysSilentOverall} дн.</> : null}</div>
            {suggestedPartner && <div>Возможный фит: <strong className="text-white">{suggestedPartner.name}</strong></div>}
          </div>
          <div className="space-y-1">
            {m.dropReasons.slice(0, 3).map((r, i) => <p key={i} className="leading-snug">• {r}</p>)}
            {m.hypeParts && m.hypeParts.length > 0 && (
              <div className="pt-1.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Из чего хайп</div>
                <div className="flex flex-wrap gap-1">
                  {m.hypeParts.map(([l, v]) => <span key={l} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${v >= 0 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>{l} {v > 0 ? `+${v}` : v}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// --- Simulation scenarios (season presets) and weekly decisions ---
export const SIM_SCENARIO_LS = 'musaic.sim.scenario';
export const SIM_SCENARIOS: Array<{ id: string; icon: string; title: string; text: string; cfg: Partial<SimAutopilotConfig> }> = [
  { id: 'classic', icon: '🎧', title: 'Классика', text: 'Ровный сезон, всё как в жизни', cfg: {} },
  { id: 'quiet', icon: '🌙', title: 'Тихий сезон', text: 'Меньше релизов, каждый заметнее', cfg: { intensity: 'calm', weekEvent: 'quiet_week', virality: 'stable' } },
  { id: 'album_war', icon: '💿', title: 'Война альбомов', text: 'Крупные артисты выпускают альбомы', cfg: { formatFocus: 'albums', tierFocus: 'stars', intensity: 'active', hypeRange: 'high' } },
  { id: 'feat_season', icon: '🤝', title: 'Сезон фитов', text: 'Коллабы и неожиданные дуэты', cfg: { collabRate: 'high', allowSurpriseCollabs: true, weekEvent: 'collab_fest' } },
  { id: 'new_blood', icon: '🌱', title: 'Новая кровь', text: 'Новички врываются в чарты', cfg: { tierFocus: 'rising', weekEvent: 'underground_wave', virality: 'viral' } },
  { id: 'comebacks', icon: '🔁', title: 'Камбэк-сезон', text: 'Возвращаются те, кто долго молчал', cfg: { tierFocus: 'comeback', formatFocus: 'auto', intensity: 'balanced' } },
  { id: 'chaos', icon: '🌪️', title: 'Хаос', text: 'Мега-интенсивность и вирусные взлёты', cfg: { intensity: 'mega', virality: 'viral', weekEvent: 'hot_drops', collabRate: 'high' } }
];
const SIM_EVENTS: Array<{ id: string; icon: string; title: string; text: string; cfg: Partial<SimAutopilotConfig> }> = [
  { id: 'hot_friday', icon: '🔥', title: 'Горячая пятница', text: 'Все дропают в один день', cfg: { weekEvent: 'hot_drops', intensity: 'active' } },
  { id: 'collab', icon: '🤝', title: 'Фестиваль коллабов', text: 'Фиты на каждом шагу', cfg: { weekEvent: 'collab_fest', collabRate: 'high' } },
  { id: 'calm', icon: '☕', title: 'Затишье', text: 'Индустрия отдыхает', cfg: { weekEvent: 'quiet_week', intensity: 'calm' } },
  { id: 'underground', icon: '🕳️', title: 'Андеграунд-волна', text: 'Шанс для маленьких артистов', cfg: { weekEvent: 'underground_wave', tierFocus: 'rising' } },
  { id: 'tiktok', icon: '📱', title: 'Тренд в TikTok', text: 'Вирусные взлёты сильнее', cfg: { virality: 'viral' } },
  { id: 'albums', icon: '💿', title: 'Неделя альбомов', text: 'Больше альбомов и EP', cfg: { formatFocus: 'albums' } },
  { id: 'snippets', icon: '✂️', title: 'Сниппет-лихорадка', text: 'Артисты дразнят фанатов', cfg: { formatFocus: 'snippets' } },
  { id: 'stars', icon: '⭐', title: 'Звёздная неделя', text: 'Выходят только топы', cfg: { tierFocus: 'stars', hypeRange: 'high' } },
  { id: 'comeback', icon: '🔁', title: 'Неделя камбэков', text: 'Молчавшие возвращаются', cfg: { tierFocus: 'comeback' } },
  { id: 'singles', icon: '🎵', title: 'Синглы решают', text: 'Только синглы, много синглов', cfg: { formatFocus: 'singles', intensity: 'active' } }
];
export const loadScenarioConfig = (): Partial<SimAutopilotConfig> => {
  try { const id = localStorage.getItem(SIM_SCENARIO_LS); return SIM_SCENARIOS.find(s => s.id === id)?.cfg || {}; } catch { return {}; }
};

export const SimScenarioPicker: React.FC = () => {
  const [sel, setSel] = useState<string>(() => { try { return localStorage.getItem(SIM_SCENARIO_LS) || 'classic'; } catch { return 'classic'; } });
  const pick = (id: string) => { setSel(id); try { localStorage.setItem(SIM_SCENARIO_LS, id); } catch { /* */ } };
  return (
    <div className="space-y-2.5">
      <label className="text-xs font-bold text-zinc-300 block">Сценарий сезона</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SIM_SCENARIOS.map(s => (
          <motion.button key={s.id} type="button" onClick={() => pick(s.id)} whileTap={{ scale: 0.97 }}
            className={`p-3 rounded-2xl border text-left transition-colors cursor-pointer ${sel === s.id ? 'bg-white/[0.1] border-white/35' : 'bg-zinc-900/50 border-white/10 hover:border-white/20'}`}>
            <div className="text-lg leading-none">{s.icon}</div>
            <div className="text-xs font-extrabold text-white mt-1.5">{s.title}</div>
            <div className="text-[10px] text-zinc-400 leading-snug mt-0.5">{s.text}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

/** season preset + 3 event cards for this week: one click changes the autopilot */
export const SimScenarioDeck: React.FC<{ autopilot: SimAutopilotConfig; setAutopilot: React.Dispatch<React.SetStateAction<SimAutopilotConfig>>; weekNumber: number; compact?: boolean }> = ({ setAutopilot, weekNumber, compact }) => {
  const [scenario, setScenario] = useState<string>(() => { try { return localStorage.getItem(SIM_SCENARIO_LS) || 'classic'; } catch { return 'classic'; } });
  const [chosen, setChosen] = useState<string | null>(null);
  const [reroll, setReroll] = useState(0);
  const [collapsed, setCollapsed] = useState<boolean>(() => { try { return localStorage.getItem('musaic.sim.deck') === 'min'; } catch { return false; } });
  useEffect(() => { setChosen(null); }, [weekNumber]);
  const events = useMemo(() => {
    let h = (weekNumber + 1) * 2654435761 + reroll * 97;
    const pool = [...SIM_EVENTS];
    const out: typeof SIM_EVENTS = [];
    while (out.length < 3 && pool.length) { h = (h * 1103515245 + 12345) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); }
    return out;
  }, [weekNumber, reroll]);
  const applyScenario = (id: string) => {
    const s = SIM_SCENARIOS.find(x => x.id === id); if (!s) return;
    setScenario(id); try { localStorage.setItem(SIM_SCENARIO_LS, id); } catch { /* */ }
    setAutopilot(prev => ({ ...DEFAULT_AUTOPILOT_CONFIG, preferredArtistIds: prev.preferredArtistIds, weeksCount: prev.weeksCount, ...s.cfg }));
  };
  const applyEvent = (e: typeof SIM_EVENTS[number]) => {
    setChosen(e.id);
    const base = SIM_SCENARIOS.find(x => x.id === scenario)?.cfg || {};
    setAutopilot(prev => ({ ...prev, ...base, ...e.cfg }));
  };
  const toggle = () => { setCollapsed(v => { const n = !v; try { localStorage.setItem('musaic.sim.deck', n ? 'min' : 'full'); } catch { /* */ } return n; }); };
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-extrabold text-white">Решение недели {weekNumber > 0 ? `#${weekNumber}` : ''}</span>
          {chosen && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300">выбрано: {SIM_EVENTS.find(e => e.id === chosen)?.title}</span>}
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && <button type="button" onClick={() => setReroll(r => r + 1)} className="text-[11px] font-bold text-zinc-400 hover:text-white cursor-pointer">🎲 Другие события</button>}
          <button type="button" onClick={toggle} className="text-[11px] font-bold text-zinc-400 hover:text-white cursor-pointer">{collapsed ? 'Развернуть' : 'Свернуть'}</button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {events.map(e => (
              <motion.button key={e.id} type="button" onClick={() => applyEvent(e)} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-colors ${chosen === e.id ? 'bg-white text-black border-white' : 'bg-zinc-900/60 border-white/10 hover:border-white/25'}`}>
                <div className="flex items-center gap-2"><span className="text-lg">{e.icon}</span><span className={`text-xs font-extrabold ${chosen === e.id ? 'text-black' : 'text-white'}`}>{e.title}</span></div>
                <div className={`text-[11px] mt-1 leading-snug ${chosen === e.id ? 'text-black/70' : 'text-zinc-400'}`}>{e.text}</div>
              </motion.button>
            ))}
          </div>
          {!compact && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 self-center mr-1">Сценарий</span>
              {SIM_SCENARIOS.map(s => (
                <button key={s.id} type="button" onClick={() => applyScenario(s.id)} title={s.text}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${scenario === s.id ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-300 hover:text-white'}`}>{s.icon} {s.title}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};


// ============================================================================
// SIMULATION CONSOLE MODAL (ISOLATED TABS FOR INSTANT 60FPS INTERACTION)
// ============================================================================

// --- Isolated Manual Batch Tab Component (Prevents parent re-render lag on keystrokes) ---
const SimManualTab = memo(({
  simState,
  artistByIdMap,
  getArtistMetrics,
  metricsMap,
  autopilot,
  manualQueue,
  setManualQueue,
  setShowQueueShowcase,
  onNavigateToRadar,
  hasCreateArtist,
  onRequestCreateArtist,
  onOpenIdeaStudio,
  radarAssignSignal,
  createdAssignSignal,
  editingManualSignal,
  ideaAssignSignal
}: {
  simState: SimState;
  artistByIdMap: Map<string, Artist>;
  getArtistMetrics: (art: Artist) => ArtistSimMetrics;
  metricsMap: Map<string, ArtistSimMetrics>;
  autopilot: SimAutopilotConfig;
  manualQueue: ManualSimItem[];
  setManualQueue: React.Dispatch<React.SetStateAction<ManualSimItem[]>>;
  setShowQueueShowcase: (val: boolean) => void;
  onNavigateToRadar: () => void;
  hasCreateArtist: boolean;
  onRequestCreateArtist: (
    ctx: 'manual_main' | 'manual_feat' | 'manual_co' | 'manual_child_feat',
    prefillName?: string
  ) => void;
  onOpenIdeaStudio: (currentArtistId?: string) => void;
  radarAssignSignal: { seq: number; artistId: string; genre: string } | null;
  createdAssignSignal: { seq: number; ctx: string; artist: Artist } | null;
  editingManualSignal: { seq: number; item: ManualSimItem } | null;
  ideaAssignSignal: { seq: number; draft: ManualSimItem } | null;
}) => {
  const [manualItemType, setManualItemType] = useState<'track' | 'album' | 'snippet'>('track');
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtistId, setManualArtistId] = useState(simState.artists[0]?.id || '');
  const [manualCustomArtistMode, setManualCustomArtistMode] = useState(false);
  const [manualCustomArtist, setManualCustomArtist] = useState('');
  const [manualGenre, setManualGenre] = useState(simState.artists[0]?.genre || 'Hip-Hop / Rap');
  const [manualCoverUrl, setManualCoverUrl] = useState('');
  const [manualPlays, setManualPlays] = useState('');
  const [manualDuration, setManualDuration] = useState('2:34');
  const [manualFeat, setManualFeat] = useState('');
  const [manualCoArtist, setManualCoArtist] = useState('');
  const [manualSnippetTeaser, setManualSnippetTeaser] = useState('');
  const [manualPromoStrategy, setManualPromoStrategy] = useState<ReleasePromoStrategy | undefined>(undefined);
  const [manualReleaseHype, setManualReleaseHype] = useState<number | undefined>(undefined);
  const [manualAlbumTracksCount, setManualAlbumTracksCount] = useState<number>(10);
  const [manualAlbumTracks, setManualAlbumTracks] = useState<SimAlbumTrack[]>([]);
  const [manualTitleMood, setManualTitleMood] = useState<TitleMood>('all');

  // Child track draft inside album builder
  const [childTrTitle, setChildTrTitle] = useState('');
  const [childTrDur, setChildTrDur] = useState('2:36');
  const [childTrPlays, setChildTrPlays] = useState('');
  const [childTrFeat, setChildTrFeat] = useState('');

  // Editing an existing queued item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Sub-modals inside Manual Tab
  const [pickerTarget, setPickerTarget] = useState<'main' | 'feat' | 'co' | 'child_feat' | null>(null);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);
  const [isParserOpen, setIsParserOpen] = useState(false);

  const deferredManualTitle = useDeferredValue(manualTitle);
  const deferredManualFeat = useDeferredValue(manualFeat);

  // Sync radar assign signal
  useEffect(() => {
    if (!radarAssignSignal) return;
    const found = artistByIdMap.get(radarAssignSignal.artistId);
    if (found) {
      setManualArtistId(found.id);
      setManualCustomArtistMode(false);
      setManualCustomArtist('');
      setManualGenre(radarAssignSignal.genre || found.genre || 'Hip-Hop / Rap');
    }
  }, [radarAssignSignal, artistByIdMap]);

  // Sync newly created artist signal into the exact field requested
  useEffect(() => {
    if (!createdAssignSignal || !createdAssignSignal.artist) return;
    const art = createdAssignSignal.artist;
    if (createdAssignSignal.ctx === 'manual_main') {
      setManualArtistId(art.id);
      setManualCustomArtistMode(false);
      setManualCustomArtist('');
      if (art.genre) setManualGenre(art.genre);
    } else if (createdAssignSignal.ctx === 'manual_feat') {
      setManualFeat(prev => appendFeaturedName(prev, art.name));
    } else if (createdAssignSignal.ctx === 'manual_co') {
      setManualCoArtist(prev => appendFeaturedName(prev, art.name));
    } else if (createdAssignSignal.ctx === 'manual_child_feat') {
      setChildTrFeat(prev => appendFeaturedName(prev, art.name));
    }
  }, [createdAssignSignal]);

  // Reload queued item when user clicks "Изменить" in showcase or inline queue
  useEffect(() => {
    if (!editingManualSignal) return;
    const item = editingManualSignal.item;
    setEditingItemId(item.id);
    setManualItemType(item.itemType);
    setManualTitle(item.title || '');
    const isGuest = !artistByIdMap.has(item.artistId) && Boolean(item.artistName);
    if (isGuest) {
      setManualCustomArtistMode(true);
      setManualCustomArtist(item.artistName);
    } else {
      setManualCustomArtistMode(false);
      setManualCustomArtist('');
      setManualArtistId(item.artistId);
    }
    setManualGenre(item.genre || artistByIdMap.get(item.artistId)?.genre || 'Hip-Hop / Rap');
    setManualCoverUrl(item.coverUrl || '');
    setManualPlays(item.plays && item.plays > 0 ? formatNumber(item.plays) : '');
    setManualDuration(item.duration || (item.itemType === 'snippet' ? '0:32' : '2:34'));
    setManualFeat(item.featuredArtist || '');
    setManualCoArtist(item.coArtist || '');
    setManualSnippetTeaser(item.snippetTeaser || '');
    setManualPromoStrategy(item.promoStrategy);
    setManualReleaseHype(item.releaseHype);
    setManualAlbumTracksCount(item.albumTracksCount || item.albumTracks?.length || 10);
    setManualAlbumTracks(item.albumTracks || []);
  }, [editingManualSignal, artistByIdMap]);

  // Apply preset transferred from Idea & Random Studio
  useEffect(() => {
    if (!ideaAssignSignal) return;
    const item = ideaAssignSignal.draft;
    setEditingItemId(null);
    setManualItemType(item.itemType);
    setManualTitle(item.title || '');
    setManualCustomArtistMode(false);
    setManualCustomArtist('');
    setManualArtistId(item.artistId);
    setManualGenre(item.genre || artistByIdMap.get(item.artistId)?.genre || 'Hip-Hop / Rap');
    setManualCoverUrl(item.coverUrl || '');
    setManualPlays(item.plays && item.plays > 0 ? formatNumber(item.plays) : '');
    setManualDuration(item.duration || (item.itemType === 'snippet' ? '0:32' : '2:34'));
    setManualFeat(item.featuredArtist || '');
    setManualCoArtist(item.coArtist || '');
    setManualSnippetTeaser(item.snippetTeaser || '');
    setManualPromoStrategy(item.promoStrategy);
    setManualReleaseHype(item.releaseHype);
    setManualAlbumTracksCount(item.albumTracksCount || item.albumTracks?.length || 10);
    setManualAlbumTracks(item.albumTracks || []);
  }, [ideaAssignSignal, artistByIdMap]);

  const selectedArt = artistByIdMap.get(manualArtistId) || simState.artists[0];
  const selectedArtName =
    manualCustomArtistMode && manualCustomArtist.trim()
      ? manualCustomArtist.trim()
      : selectedArt?.name || 'Артист';

  const selectedArtMetrics = useMemo(() => {
    if (manualCustomArtistMode || !selectedArt) return null;
    return metricsMap.get(selectedArt.id) || getArtistMetrics(selectedArt);
  }, [manualCustomArtistMode, selectedArt, metricsMap, getArtistMetrics]);

  // Deterministic live stream forecast (runs with deferred text inputs for 60fps typing)
  const autoForecastPlays = useMemo(() => {
    const baseArt: Artist =
      !manualCustomArtistMode && selectedArt
        ? selectedArt
        : {
            id: 'guest_preview',
            name: selectedArtName,
            bio: '',
            imageUrl: '',
            followers: 250_000,
            genre: manualGenre || 'Hip-Hop',
            verified: false,
            hype: 55
          };
    const m = !manualCustomArtistMode ? selectedArtMetrics : null;
    const tracksLen =
      manualItemType === 'album'
        ? manualAlbumTracks.length > 0
          ? manualAlbumTracks.length
          : Math.max(3, manualAlbumTracksCount)
        : 1;
    return forecastReleasePlays({
      artist: baseArt,
      featuredNames: deferredManualFeat || manualCoArtist,
      allArtists: simState.artists,
      itemType: manualItemType,
      qualityScore: m?.avgQuality || 72,
      hype: m?.hype ?? baseArt.hype ?? 60,
      hasWarmup: Boolean(m?.activeSnippet),
      promoStrategy: manualPromoStrategy,
      releaseHype: manualReleaseHype,
      albumTracksCount: tracksLen,
      virality: autopilot.virality,
      hitsCount: m?.topHitsCount || 0,
      catalogAvgPlays: m?.catalogAvgPlays || 0,
      deterministic: true
    });
  }, [
    manualCustomArtistMode,
    selectedArt,
    selectedArtName,
    manualGenre,
    selectedArtMetrics,
    manualItemType,
    manualAlbumTracks.length,
    manualAlbumTracksCount,
    deferredManualFeat,
    manualCoArtist,
    simState.artists,
    manualPromoStrategy,
    manualReleaseHype,
    autopilot.virality
  ]);

  const albumTracksTotalPlays = useMemo(
    () => manualAlbumTracks.reduce((sum, t) => sum + (t.plays || 0), 0),
    [manualAlbumTracks]
  );

  const resetForm = () => {
    setEditingItemId(null);
    setManualTitle('');
    setManualCoverUrl('');
    setManualPlays('');
    setManualFeat('');
    setManualCoArtist('');
    setManualSnippetTeaser('');
    setManualPromoStrategy(undefined);
    setManualReleaseHype(undefined);
    setManualAlbumTracks([]);
    setChildTrTitle('');
    setChildTrFeat('');
    setChildTrPlays('');
  };

  const handleUploadCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      const mediaId = await saveMediaItem(b64, {
        type: manualItemType === 'album' ? 'album' : 'track',
        title: manualTitle.trim() || 'Новый релиз',
        artistName: selectedArtName
      });
      setManualCoverUrl(mediaId);
    } catch (err) {
      console.error('Cover upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerateRandomTitle = (moodArg?: TitleMood) => {
    const moodToUse: TitleMood = typeof moodArg === 'string' ? moodArg : manualTitleMood;
    const existing = new Set<string>([
      ...simState.tracks.map(t => t.title.toLowerCase()),
      ...simState.albums.map(a => a.title.toLowerCase()),
      ...manualQueue.map(q => q.title.toLowerCase())
    ]);
    const namingProf = selectedArtMetrics?.namingProfile ?? false;
    const generated = generateModernTitle(existing, manualItemType === 'album', namingProf, autopilot.languageMix, moodToUse);
    setManualTitle(generated);
  };

  const handleRollPlays = () => {
    const baseArt: Artist =
      !manualCustomArtistMode && selectedArt
        ? selectedArt
        : {
            id: 'guest_roll',
            name: selectedArtName,
            bio: '',
            imageUrl: '',
            followers: 250_000,
            genre: manualGenre || 'Hip-Hop',
            verified: false,
            hype: 55
          };
    const m = !manualCustomArtistMode ? selectedArtMetrics : null;
    const rolled = forecastReleasePlays({
      artist: baseArt,
      featuredNames: manualFeat || manualCoArtist,
      allArtists: simState.artists,
      itemType: manualItemType,
      qualityScore: m?.avgQuality || 72,
      hype: m?.hype ?? baseArt.hype ?? 60,
      hasWarmup: Boolean(m?.activeSnippet),
      promoStrategy: manualPromoStrategy,
      releaseHype: manualReleaseHype,
      albumTracksCount:
        manualItemType === 'album'
          ? manualAlbumTracks.length || Math.max(3, manualAlbumTracksCount)
          : 1,
      virality: autopilot.virality,
      hitsCount: m?.topHitsCount || 0,
      catalogAvgPlays: m?.catalogAvgPlays || 0,
      deterministic: false
    });
    setManualPlays(formatNumber(rolled));
  };

  const handleAddChildTrack = () => {
    if (!childTrTitle.trim()) return;
    const parsedPlays = parseFormattedNumber(childTrPlays);
    const defaultPerTrack = Math.max(
      28_000,
      Math.round(autoForecastPlays / Math.max(4, manualAlbumTracks.length || manualAlbumTracksCount || 10))
    );
    const nextTrack: SimAlbumTrack = {
      id: makeId('mtrk'),
      title: childTrTitle.trim(),
      duration: childTrDur.trim() || smartDuration(childTrFeat),
      plays: parsedPlays > 0 ? parsedPlays : Math.round(defaultPerTrack * randRange(0.75, 1.35)),
      featuredArtist: childTrFeat.trim() || undefined,
      isExplicit: false
    };
    setManualAlbumTracks(prev => [...prev, nextTrack]);
    setChildTrTitle('');
    setChildTrFeat('');
    setChildTrPlays('');
  };

  const handleUpdateChildTrack = (id: string, patch: Partial<SimAlbumTrack>) => {
    setManualAlbumTracks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleMoveChildTrack = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= manualAlbumTracks.length) return;
    setManualAlbumTracks(prev => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const handleGenerateFullTracklist = () => {
    if (!selectedArt) return;
    const count =
      manualAlbumTracks.length > 0
        ? manualAlbumTracks.length
        : clamp(manualAlbumTracksCount || getRandomAlbumTrackCount(), 3, 28);
    const estTotal = parseFormattedNumber(manualPlays) || autoForecastPlays;
    const existingSet = new Set<string>([
      ...simState.tracks.map(t => t.title.toLowerCase()),
      ...manualQueue.map(q => q.title.toLowerCase())
    ]);
    const generated = generateAlbumTracksWithFeats({
      artist: selectedArt,
      allArtists: simState.artists,
      count,
      estimatedAlbumPlays: estTotal,
      existingTitles: existingSet,
      namingProfile: selectedArtMetrics?.namingProfile || /[a-zA-Z]/.test(manualTitle),
      languageOverride: autopilot.languageMix,
      coArtist: manualCoArtist.trim() || undefined,
      collabRate: autopilot.collabRate,
      allowSurpriseCollabs: autopilot.allowSurpriseCollabs
    });
    setManualAlbumTracks(generated);
    setManualAlbumTracksCount(generated.length);
  };

  const handleRandomFeatsOnTracklist = () => {
    if (!selectedArt || manualAlbumTracks.length === 0) return;
    const existingSet = new Set<string>(manualAlbumTracks.map(t => t.title.toLowerCase()));
    const fresh = generateAlbumTracksWithFeats({
      artist: selectedArt,
      allArtists: simState.artists,
      count: manualAlbumTracks.length,
      estimatedAlbumPlays: albumTracksTotalPlays || autoForecastPlays,
      existingTitles: existingSet,
      namingProfile: selectedArtMetrics?.namingProfile || false,
      coArtist: manualCoArtist.trim() || undefined,
      collabRate: autopilot.collabRate,
      allowSurpriseCollabs: autopilot.allowSurpriseCollabs
    });
    setManualAlbumTracks(prev =>
      prev.map((tr, i) => ({
        ...tr,
        featuredArtist: tr.featuredArtist || fresh[i]?.featuredArtist,
        isSurpriseFeat: fresh[i]?.isSurpriseFeat
      }))
    );
  };

  const handleAddManualItem = () => {
    const existing = new Set<string>([
      ...simState.tracks.map(t => t.title.toLowerCase()),
      ...simState.albums.map(a => a.title.toLowerCase())
    ]);
    const resolvedTitle =
      manualTitle.trim() ||
      generateModernTitle(
        existing,
        manualItemType === 'album',
        selectedArtMetrics?.namingProfile ?? false,
        autopilot.languageMix
      );

    const parsedManualPlays = parseFormattedNumber(manualPlays);
    const resolvedPlays =
      manualItemType === 'album' && manualAlbumTracks.length > 0
        ? albumTracksTotalPlays
        : parsedManualPlays > 0
          ? parsedManualPlays
          : autoForecastPlays;

    const newItem: ManualSimItem = {
      id: editingItemId || makeId('man'),
      itemType: manualItemType,
      artistId:
        manualCustomArtistMode && manualCustomArtist.trim()
          ? `guest_${manualCustomArtist.trim().toLowerCase().replace(/\s+/g, '_')}`
          : selectedArt?.id || 'unknown',
      artistName: selectedArtName,
      featuredArtist: manualFeat.trim() || undefined,
      coArtist: manualItemType === 'album' ? manualCoArtist.trim() || undefined : undefined,
      title: resolvedTitle,
      coverUrl: manualCoverUrl.trim(),
      duration:
        manualItemType === 'album'
          ? undefined
          : manualItemType === 'snippet'
            ? manualDuration.trim() || '0:32'
            : !manualDuration.trim() || manualDuration.trim() === '2:34'
              ? smartDuration(manualFeat)
              : manualDuration.trim(),
      isExplicit: false,
      genre: manualGenre.trim() || selectedArt?.genre || 'Hip-Hop / Pop',
      plays: resolvedPlays,
      albumTracksCount:
        manualItemType === 'album'
          ? manualAlbumTracks.length > 0
            ? manualAlbumTracks.length
            : clamp(manualAlbumTracksCount || 10, 3, 30)
          : undefined,
      albumTracks: manualItemType === 'album' && manualAlbumTracks.length > 0 ? manualAlbumTracks : undefined,
      snippetTeaser: manualItemType === 'snippet' ? manualSnippetTeaser.trim() || undefined : undefined,
      promoStrategy: manualPromoStrategy,
      releaseHype: manualReleaseHype
    };

    setManualQueue(prev => [...prev, newItem]);
    resetForm();
  };

  const handleLoadInlineItemForEdit = (item: ManualSimItem) => {
    setManualQueue(prev => prev.filter(q => q.id !== item.id));
    setEditingItemId(item.id);
    setManualItemType(item.itemType);
    setManualTitle(item.title || '');
    const isGuest = !artistByIdMap.has(item.artistId) && Boolean(item.artistName);
    if (isGuest) {
      setManualCustomArtistMode(true);
      setManualCustomArtist(item.artistName);
    } else {
      setManualCustomArtistMode(false);
      setManualCustomArtist('');
      setManualArtistId(item.artistId);
    }
    setManualGenre(item.genre || artistByIdMap.get(item.artistId)?.genre || 'Hip-Hop / Rap');
    setManualCoverUrl(item.coverUrl || '');
    setManualPlays(item.plays && item.plays > 0 ? formatNumber(item.plays) : '');
    setManualDuration(item.duration || (item.itemType === 'snippet' ? '0:32' : '2:34'));
    setManualFeat(item.featuredArtist || '');
    setManualCoArtist(item.coArtist || '');
    setManualSnippetTeaser(item.snippetTeaser || '');
    setManualPromoStrategy(item.promoStrategy);
    setManualReleaseHype(item.releaseHype);
    setManualAlbumTracksCount(item.albumTracksCount || item.albumTracks?.length || 10);
    setManualAlbumTracks(item.albumTracks || []);
  };

  const queueTotalPlays = useMemo(
    () => manualQueue.reduce((sum, item) => sum + (item.plays || 0), 0),
    [manualQueue]
  );

  const queueTotalTracks = useMemo(
    () =>
      manualQueue.reduce(
        (sum, item) => sum + (item.itemType === 'album' ? item.albumTracks?.length || item.albumTracksCount || 10 : 1),
        0
      ),
    [manualQueue]
  );

  return (
    <div className="space-y-5">
      {/* Main Manual Builder Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/45 backdrop-blur-md border border-white/10 shadow-2xl space-y-5">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Ручной конструктор релиза для недели</span>
              {editingItemId && (
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                  Редактирование
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Собирайте синглы, альбомы и сниппеты с обложкой, фитами, стратегией и треклистом
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQueueShowcase(true)}
              className={`px-3.5 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                manualQueue.length > 0
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25'
                  : 'bg-white/[0.06] border-white/10 text-white hover:bg-white/[0.12]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="tabular-nums">Витрина очереди ({manualQueue.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenIdeaStudio(selectedArt?.id)}
              className="px-3.5 py-1.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Случайный выбор артиста, досье по дропам и генератор идей/стримов/хайпа"
            >
              <Sparkles className="w-3.5 h-3.5 theme-accent" />
              <span>Идеи и рандом</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToRadar}
              className="px-3.5 py-1.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              title="Выбрать артиста на радаре"
            >
              <Radar className="w-3.5 h-3.5 theme-accent" />
              <span>Радар</span>
            </button>
            {hasCreateArtist && (
              <button
                type="button"
                onClick={() => onRequestCreateArtist('manual_main')}
                className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Создать артиста</span>
              </button>
            )}
            {(manualTitle || manualCoverUrl || manualFeat || manualAlbumTracks.length > 0 || editingItemId) && (
              <button
                type="button"
                onClick={resetForm}
                className="p-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
                title="Очистить поля"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cover + Form Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Cover Studio Column (Bigger Cover + Upload + Pencil + Delete/Restore Generated) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative aspect-square w-full max-w-[280px] mx-auto lg:max-w-none rounded-3xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl shrink-0" style={{ contain: 'layout size style' }}>
              <CoverArt
                url={manualCoverUrl}
                title={manualTitle || 'Новый релиз'}
                albumTitle={manualItemType === 'album' ? manualTitle || 'Альбом' : undefined}
                className="w-full h-full"
              />
            </div>

            <div className="flex items-center gap-2 max-w-[280px] mx-auto lg:max-w-none">
              <label className="flex-1 py-2.5 px-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-zinc-100 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <FileUp className="w-3.5 h-3.5 theme-accent shrink-0" />
                <span>Загрузить обложку</span>
                <input type="file" accept="image/*" onChange={handleUploadCoverFile} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setIsCoverEditorOpen(true)}
                className="w-10 h-10 shrink-0 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 hover:border-white/25 text-zinc-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Редактор обложек"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {manualCoverUrl ? (
              <button
                type="button"
                onClick={() => setManualCoverUrl('')}
                className="w-full max-w-[280px] mx-auto lg:max-w-none block py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[11px] font-bold text-rose-300 cursor-pointer transition-colors"
              >
                × Удалить обложку (вернуть сгенерированную)
              </button>
            ) : (
              <p className="text-[11px] text-zinc-500 text-center">Сейчас используется сгенерированная обложка</p>
            )}
          </div>

          {/* Right Form Controls Column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Row 1: Release Type + Duration/Tracks (NO Explicit 'E') */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Тип релиза</label>
                <div className="flex gap-1 p-1 bg-black/40 rounded-2xl border border-white/10">
                  {([
                    { id: 'track', label: 'Трек' },
                    { id: 'album', label: 'Альбом' },
                    { id: 'snippet', label: 'Сниппет' }
                  ] as const).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setManualItemType(t.id);
                        if (t.id === 'snippet' && (!manualDuration || manualDuration === '2:34')) {
                          setManualDuration('0:32');
                        } else if (t.id === 'track' && manualDuration === '0:32') {
                          setManualDuration('2:34');
                        }
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        manualItemType === t.id ? 'theme-bg-accent text-black shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  {manualItemType === 'album' ? 'Треков (авто)' : 'Длительность'}
                </label>
                {manualItemType === 'album' ? (
                  <input
                    type="number"
                    min={3}
                    max={40}
                    value={manualAlbumTracks.length > 0 ? manualAlbumTracks.length : manualAlbumTracksCount}
                    disabled={manualAlbumTracks.length > 0}
                    onChange={e => setManualAlbumTracksCount(clamp(parseInt(e.target.value, 10) || 10, 3, 40))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-white text-center outline-none disabled:opacity-60"
                    title={
                      manualAlbumTracks.length > 0
                        ? 'Определяется количеством добавленных треков'
                        : 'Количество треков при автогенерации'
                    }
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={manualDuration}
                      onChange={e => setManualDuration(e.target.value)}
                      placeholder={manualItemType === 'snippet' ? '0:32' : 'авто'}
                      className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-white text-center outline-none"
                    />
                    <button
                      type="button"
                      title="Случайная длительность (с учётом фитов)"
                      onClick={() => setManualDuration(smartDuration(manualFeat, { snippet: manualItemType === 'snippet' }))}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 text-xs"
                    >
                      🎲
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Main Artist Picker (Larger Avatar + Translucent Rounded Card) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Основной артист</label>
                <button
                  type="button"
                  onClick={() => setManualCustomArtistMode(v => !v)}
                  className="text-[11px] font-semibold text-zinc-400 hover:text-white cursor-pointer"
                >
                  {manualCustomArtistMode ? 'Выбрать из базы' : 'Ввести вручную (гость)'}
                </button>
              </div>

              {manualCustomArtistMode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCustomArtist}
                    onChange={e => setManualCustomArtist(e.target.value)}
                    placeholder="Имя нового / стороннего артиста..."
                    className="flex-1 bg-black/40 border border-white/12 focus:border-white/30 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none"
                  />
                  {hasCreateArtist && (
                    <button
                      type="button"
                      onClick={() => onRequestCreateArtist('manual_main', manualCustomArtist.trim() || undefined)}
                      className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/25 text-xs font-bold text-emerald-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>В базу</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerTarget('main')}
                    className="flex-1 min-w-0 p-2.5 px-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/25 flex items-center justify-between gap-3 text-left cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CoverArt
                        url={selectedArt?.imageUrl}
                        title={selectedArt?.name || 'Артист'}
                        isArtist
                        className="w-12 h-12 rounded-full border-2 border-white/15 shadow-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-white truncate">
                          {selectedArt?.name || 'Выберите артиста'}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate tabular-nums mt-0.5">
                          {selectedArt
                            ? `${formatListeners(selectedArt.followers)}/мес${
                                selectedArtMetrics ? ` · Хайп ${selectedArtMetrics.hype} · ${selectedArtMetrics.daysSilent}д без релиза` : ''
                              }`
                            : 'Нажмите для поиска по базе'}
                        </p>
                      </div>
                    </div>
                    <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-1" />
                  </button>
                  {hasCreateArtist && (
                    <button
                      type="button"
                      onClick={() => onRequestCreateArtist('manual_main')}
                      className="px-3.5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="Создать нового артиста в базу"
                    >
                      <UserPlus className="w-4 h-4 theme-accent" />
                      <span className="hidden sm:inline">Новый</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Row 3: Release Title + Mood Selector + Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
                    Название релиза
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomTitle()}
                    className="text-[11px] font-bold theme-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Случайное название</span>
                  </button>
                </div>


                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={manualItemType === 'album' ? 'Название альбома...' : 'Название трека / сниппета...'}
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    className="flex-1 min-w-0 bg-black/40 border border-white/12 focus:border-white/30 rounded-2xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                  />
                  <TitleMoodPicker
                    value={manualTitleMood}
                    onChange={nextMood => {
                      setManualTitleMood(nextMood);
                      handleGenerateRandomTitle(nextMood);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomTitle()}
                    className="px-3.5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-zinc-200 hover:text-white cursor-pointer shrink-0"
                    title="Сгенерировать название"
                  >
                    <Dices className="w-4 h-4 theme-accent" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">Жанр</label>
                <input
                  type="text"
                  list="sim-manual-genres"
                  value={manualGenre}
                  onChange={e => setManualGenre(e.target.value)}
                  placeholder="Hip-Hop / Pop..."
                  className="w-full bg-black/40 border border-white/12 focus:border-white/30 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white outline-none"
                />
                <datalist id="sim-manual-genres">
                  {GENRE_CATALOG.map(g => (
                    <option key={g.id} value={g.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Row 4: Featured Artist / Co-Artist */}
            <div className={`grid grid-cols-1 ${manualItemType === 'album' ? 'sm:grid-cols-2' : ''} gap-3`}>
              {manualItemType === 'album' && (
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                    Совместный альбом (Co-Artist)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={manualCoArtist}
                      onChange={e => setManualCoArtist(e.target.value)}
                      placeholder="Второй автор альбома (опц.)..."
                      className="flex-1 min-w-0 bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerTarget('co')}
                      className="px-3 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-zinc-200 cursor-pointer shrink-0"
                      title="Выбрать соавтора из базы"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  Приглашенный артист (Фит)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="SALUKI, FRIENDLY THUG 52..."
                    value={manualFeat}
                    onChange={e => setManualFeat(e.target.value)}
                    className="flex-1 min-w-0 bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerTarget('feat')}
                    className="px-3 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-zinc-200 cursor-pointer shrink-0"
                    title="Выбрать гостя из базы"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  {hasCreateArtist && (
                    <button
                      type="button"
                      onClick={() => onRequestCreateArtist('manual_feat')}
                      className="px-3 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/25 text-xs font-bold text-emerald-300 cursor-pointer shrink-0"
                      title="Создать нового гостя"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 5: Plays + Forecast + Promo / Hype Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Стартовые стримы
                  </label>
                  <span className="text-[11px] text-emerald-400 font-semibold tabular-nums">
                    Прогноз: {formatCompact(autoForecastPlays)}
                  </span>
                </div>
                {manualItemType === 'album' && manualAlbumTracks.length > 0 ? (
                  <div className="w-full bg-emerald-500/10 border border-emerald-400/25 rounded-2xl px-4 py-2.5 text-xs font-extrabold text-emerald-200 flex items-center justify-between tabular-nums">
                    <span>Сумма треков:</span>
                    <span>{formatNumber(albumTracksTotalPlays)}</span>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder={`Авто (${formatNumber(autoForecastPlays)})`}
                      value={manualPlays}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setManualPlays(digits ? formatNumber(parseInt(digits, 10)) : '');
                      }}
                      className="flex-1 min-w-0 bg-black/40 border border-white/12 focus:border-white/30 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-white outline-none tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={handleRollPlays}
                      className="px-3.5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-zinc-200 cursor-pointer shrink-0"
                      title="Рассчитать случайный старт по метрикам артиста"
                    >
                      <Dices className="w-4 h-4 theme-accent" />
                    </button>
                  </div>
                )}
              </div>

              <div className="md:col-span-7">
                <ReleaseHypeControl
                  promoStrategy={manualPromoStrategy}
                  releaseHype={manualReleaseHype}
                  defaultHype={selectedArtMetrics?.hype ?? 70}
                  onChange={(strat, hypeVal) => {
                    setManualPromoStrategy(strat);
                    setManualReleaseHype(hypeVal);
                  }}
                />
              </div>
            </div>

            {/* Snippet Teaser Box */}
            {manualItemType === 'snippet' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Описание / строка сниппета
                  </label>
                  <button
                    type="button"
                    onClick={() => setManualSnippetTeaser(SNIPPET_TEASERS[randInt(0, SNIPPET_TEASERS.length - 1)])}
                    className="text-[11px] font-semibold theme-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Случайный тизер</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={manualSnippetTeaser}
                  onChange={e => setManualSnippetTeaser(e.target.value)}
                  placeholder="Тизер в соцсетях, отрывок припева или описание..."
                  className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl p-3.5 text-xs text-white outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Full Album Tracklist Builder (No 'E' button clutter) */}
        {manualItemType === 'album' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-black/30 border border-white/10 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                  <Disc className="w-4 h-4 theme-accent" />
                  <span className="tabular-nums">Треклист альбома ({manualAlbumTracks.length})</span>
                  {manualAlbumTracks.length > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
                      · {formatCompact(albumTracksTotalPlays)} стримов
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Оставьте пустым для автогенерации ({manualAlbumTracksCount} треков) или соберите вручную / парсером
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerateFullTracklist}
                  className="px-3 py-1.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 theme-accent" />
                  <span>Сгенерировать треклист</span>
                </button>
                {manualAlbumTracks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRandomFeatsOnTracklist}
                    className="px-3 py-1.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5 theme-accent" />
                    <span>Подобрать фиты</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsParserOpen(true)}
                  className="px-3 py-1.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/25 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Парсер треклиста</span>
                </button>
              </div>
            </div>

            {/* Add single child track row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                placeholder="Название трека в альбоме..."
                value={childTrTitle}
                onChange={e => setChildTrTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChildTrack();
                  }
                }}
                className="sm:col-span-4 bg-zinc-950/80 border border-white/12 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white outline-none"
              />
              <div className="sm:col-span-3 flex gap-1">
                <input
                  type="text"
                  placeholder="Фит (опц.)"
                  value={childTrFeat}
                  onChange={e => setChildTrFeat(e.target.value)}
                  className="flex-1 min-w-0 bg-zinc-950/80 border border-white/12 rounded-2xl px-3.5 py-2 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPickerTarget('child_feat')}
                  className="px-3 py-2 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-zinc-200 cursor-pointer shrink-0"
                  title="Выбрать гостя из базы"
                >
                  +
                </button>
              </div>
              <input
                type="text"
                placeholder="2:36"
                value={childTrDur}
                onChange={e => setChildTrDur(e.target.value)}
                className="sm:col-span-2 bg-zinc-950/80 border border-white/12 rounded-2xl px-3 py-2 text-xs font-mono text-white text-center outline-none"
              />
              <input
                type="text"
                placeholder="Стримы (авто)"
                value={childTrPlays}
                onChange={e => {
                  const d = e.target.value.replace(/\D/g, '');
                  setChildTrPlays(d ? formatNumber(parseInt(d, 10)) : '');
                }}
                className="sm:col-span-2 bg-zinc-950/80 border border-white/12 rounded-2xl px-3 py-2 text-xs font-mono text-white outline-none tabular-nums"
              />
              <button
                type="button"
                onClick={handleAddChildTrack}
                className="sm:col-span-1 py-2 px-3 theme-bg-accent text-black rounded-2xl text-xs font-bold flex items-center justify-center cursor-pointer hover:opacity-90"
                title="Добавить трек"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {manualAlbumTracks.length > 0 && (
              <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-2xl bg-zinc-950/65 max-h-60 overflow-y-auto custom-scrollbar">
                {manualAlbumTracks.map((tr, idx) => (
                  <div key={tr.id} className="px-3 py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-mono text-zinc-500 w-5 shrink-0 tabular-nums">{idx + 1}.</span>
                    <input
                      type="text"
                      value={tr.title}
                      onChange={e => handleUpdateChildTrack(tr.id, { title: e.target.value })}
                      className="flex-1 min-w-[130px] bg-transparent border border-transparent focus:border-white/20 focus:bg-zinc-900 rounded-xl px-2.5 py-1 font-semibold text-white outline-none"
                    />
                    <input
                      type="text"
                      value={tr.featuredArtist || ''}
                      onChange={e => handleUpdateChildTrack(tr.id, { featuredArtist: e.target.value || undefined })}
                      placeholder="feat..."
                      className="w-28 sm:w-32 bg-zinc-900/70 border border-white/10 rounded-xl px-2.5 py-1 text-[11px] text-zinc-200 outline-none"
                    />
                    <input
                      type="text"
                      value={tr.duration || '2:35'}
                      onChange={e => handleUpdateChildTrack(tr.id, { duration: e.target.value })}
                      className="w-14 bg-zinc-900/70 border border-white/10 rounded-xl px-1.5 py-1 text-[11px] font-mono text-zinc-300 text-center outline-none"
                    />
                    <input
                      type="number"
                      value={tr.plays || 0}
                      onChange={e => handleUpdateChildTrack(tr.id, { plays: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-24 bg-zinc-900/70 border border-white/10 rounded-xl px-2.5 py-1 text-[11px] font-mono text-white text-right tabular-nums outline-none"
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveChildTrack(idx, -1)}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-25 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === manualAlbumTracks.length - 1}
                        onClick={() => handleMoveChildTrack(idx, 1)}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-25 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualAlbumTracks(prev => prev.filter(x => x.id !== tr.id))}
                        className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddManualItem}
          className="w-full py-3.5 theme-bg-accent text-black font-extrabold rounded-2xl text-xs hover:opacity-95 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
        >
          {editingItemId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{editingItemId ? 'Сохранить обновлённый релиз в очередь' : 'Добавить релиз в очередь недели'}</span>
        </button>
      </div>

      {/* Inline Queue Strip */}
      {manualQueue.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-white tabular-nums">
                В очереди на эту неделю ({manualQueue.length}) · {queueTotalTracks} тр. · ~{formatCompact(queueTotalPlays)}
              </h4>
              <p className="text-[11px] text-zinc-400">
                Нажмите «Провести неделю» внизу пульта, чтобы выпустить все релизы разом в пятницу
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQueueShowcase(true)}
                className="px-3 py-1.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 theme-accent" />
                <span>Витрина</span>
              </button>
              <button
                type="button"
                onClick={() => setManualQueue([])}
                className="px-3 py-1.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-300 cursor-pointer"
              >
                Очистить очередь
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {manualQueue.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 flex items-center gap-3 min-w-0 transition-colors"
              >
                <CoverArt
                  url={item.coverUrl}
                  title={item.title}
                  albumTitle={item.itemType === 'album' ? item.title : undefined}
                  className="w-12 h-12 rounded-xl shrink-0 border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white truncate block">{item.title}</span>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {item.artistName}
                    {item.coArtist ? ` & ${item.coArtist}` : ''}
                    {item.featuredArtist ? ` feat. ${item.featuredArtist}` : ''}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-400 tabular-nums truncate">
                    {item.itemType === 'album'
                      ? `Альбом (${item.albumTracks?.length || item.albumTracksCount || 10} тр.)`
                      : item.itemType === 'snippet'
                        ? 'Сниппет'
                        : 'Сингл'}{' '}
                    · {formatCompact(item.plays || 0)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadInlineItemForEdit(item)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Изменить"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualQueue(prev => prev.filter(x => x.id !== item.id))}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searchable Artist Picker for Main / Feat / Co-Artist / Child Track Feat */}
      <SimArtistPickerModal
        isOpen={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        title={
          pickerTarget === 'main'
            ? 'Выбор основного артиста'
            : pickerTarget === 'co'
              ? 'Выбор соавтора альбома'
              : 'Выбор приглашенного артиста'
        }
        artists={simState.artists}
        metricsMap={metricsMap}
        onRequestCreateNew={
          hasCreateArtist
            ? prefillName => {
                const target = pickerTarget;
                setPickerTarget(null);
                if (!target) return;
                const ctxMap = {
                  main: 'manual_main',
                  feat: 'manual_feat',
                  co: 'manual_co',
                  child_feat: 'manual_child_feat'
                } as const;
                onRequestCreateArtist(ctxMap[target], prefillName);
              }
            : undefined
        }
        onSelect={art => {
          if (pickerTarget === 'main') {
            setManualArtistId(art.id);
            setManualCustomArtistMode(false);
            setManualCustomArtist('');
            if (art.genre) setManualGenre(art.genre);
          } else if (pickerTarget === 'feat') {
            setManualFeat(prev => appendFeaturedName(prev, art.name));
          } else if (pickerTarget === 'co') {
            setManualCoArtist(prev => appendFeaturedName(prev, art.name));
          } else if (pickerTarget === 'child_feat') {
            setChildTrFeat(prev => appendFeaturedName(prev, art.name));
          }
        }}
      />

      {/* Cover Editor Integration */}
      <CoverEditorModal
        isOpen={isCoverEditorOpen}
        onClose={() => setIsCoverEditorOpen(false)}
        initialTitle={manualTitle || 'UNTITLED'}
        initialArtist={selectedArtName}
        onApplyDataUrl={async dataUrl => {
          const mediaId = await saveMediaItem(dataUrl, {
            type: manualItemType === 'album' ? 'album' : 'track',
            title: manualTitle.trim() || 'Новый релиз',
            artistName: selectedArtName
          });
          setManualCoverUrl(mediaId);
        }}
      />

      {/* Bulk Text Tracklist Importer */}
      <TextTracklistParserModal
        isOpen={isParserOpen}
        onClose={() => setIsParserOpen(false)}
        onImport={parsed => {
          const fallbackPerTrack = Math.max(
            25_000,
            Math.round((parseFormattedNumber(manualPlays) || autoForecastPlays) / Math.max(4, parsed.length))
          );
          const imported: SimAlbumTrack[] = parsed.map(pt => ({
            id: makeId('mprstrk'),
            title: pt.title,
            featuredArtist: pt.featuredArtist,
            duration: pt.duration || getRandomDuration(),
            plays: pt.plays || fallbackPerTrack,
            isExplicit: false
          }));
          setManualAlbumTracks(prev => [...prev, ...imported]);
        }}
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Light mode of the console: one calm screen — who drops this week, one tap to toggle,
// quick presets; everything else stays in the full mode
// ---------------------------------------------------------------------------
const FMT_RU: Record<string, string> = { single: 'Сингл', ep: 'EP', album: 'Альбом', snippet: 'Сниппет' };
const SimLightPanel: React.FC<{
  proposals: SimProposal[]; setProposals: React.Dispatch<React.SetStateAction<SimProposal[]>>;
  regenerate: (o?: Partial<SimAutopilotConfig>) => void; autopilot: SimAutopilotConfig; setAuto: <K extends keyof SimAutopilotConfig>(k: K, v: SimAutopilotConfig[K]) => void;
  simState: SimState; advanceDays: number; setAdvanceDays: (n: number) => void;
}> = ({ proposals, setProposals, regenerate, autopilot, setAuto, simState, advanceDays, setAdvanceDays }) => {
  const sel = proposals.filter(p => p.selected);
  const total = sel.reduce((s, p) => s + (p.estimatedPlays || 0), 0);
  const best = (n: number) => { const ids = new Set([...proposals].sort((a, b) => (b.estimatedPlays || 0) - (a.estimatedPlays || 0)).slice(0, n).map(p => p.id)); setProposals(ps => ps.map(p => ({ ...p, selected: ids.has(p.id) }))); };
  const chip = (on: boolean) => `px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer ${on ? 'bg-white text-black' : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.09]'}`;
  const hl = simState.lastDigest?.highlights || [];
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-2">
        {[[`${sel.length}`, 'релизов на неделю'], [`≈ ${formatCompact(total)}`, 'прогноз прослушиваний'], [formatSimDate(addDaysISO(simState.currentDate, advanceDays)), 'следующая дата']].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] px-4 py-3"><div className="text-xl font-black text-white tabular-nums truncate">{v}</div><div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mt-0.5">{l}</div></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {([['calm', 'Спокойно'], ['balanced', 'Стандарт'], ['active', 'Активно'], ['mega', 'Мега']] as Array<[SimIntensity, string]>).map(([k, l]) => (
          <button key={k} type="button" className={chip(autopilot.intensity === k)} onClick={() => { setAuto('intensity', k); regenerate({ intensity: k }); }}>{l}</button>
        ))}
        <span className="w-px h-5 bg-white/10 mx-1" />
        {([['normal', 'Обычная'], ['hot_drops', 'Горячая'], ['collab_fest', 'Фиты'], ['underground_wave', 'Андеграунд'], ['quiet_week', 'Тихая']] as Array<[SimWeekEvent, string]>).map(([k, l]) => (
          <button key={k} type="button" className={chip(autopilot.weekEvent === k)} onClick={() => { setAuto('weekEvent', k); regenerate({ weekEvent: k }); }}>{l}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={chip(false)} onClick={() => regenerate()}>🎲 Новые кандидаты</button>
        <button type="button" className={chip(false)} onClick={() => best(5)}>Лучшие 5</button>
        <button type="button" className={chip(false)} onClick={() => best(8)}>Лучшие 8</button>
        <button type="button" className={chip(false)} onClick={() => setProposals(ps => ps.map(p => ({ ...p, selected: false })))}>Снять всё</button>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-zinc-500">шаг
          {[7, 14, 30].map(d => <button key={d} type="button" onClick={() => setAdvanceDays(d)} className={`px-2 py-1 rounded-lg font-semibold ${advanceDays === d ? 'bg-white/15 text-white' : 'hover:text-white'}`}>{d} дн.</button>)}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {proposals.length === 0 && <div className="text-sm text-zinc-500 py-8">Нажми «Новые кандидаты».</div>}
        {proposals.map(p => (
          <button key={p.id} type="button" onClick={() => setProposals(ps => ps.map(x => (x.id === p.id ? { ...x, selected: !x.selected } : x)))}
            className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all ${p.selected ? 'bg-white/[0.06] border-white/20' : 'bg-white/[0.015] border-white/[0.05] opacity-60 hover:opacity-100'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${p.selected ? 'theme-bg-accent border-transparent' : 'border-white/20'}`}>{p.selected && <Check className="w-3 h-3 text-black" />}</span>
            <CoverArt url={p.coverUrl} title={p.title} className="w-10 h-10 rounded-xl overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-white truncate">{p.title}</span>
              <span className="block text-[11px] text-zinc-500 truncate">{p.artistName}{p.featuredArtist ? ` feat. ${p.featuredArtist}` : ''} · {FMT_RU[p.releaseFormat || (p.itemType === 'album' ? 'album' : p.itemType === 'snippet' ? 'snippet' : 'single')]}</span>
            </span>
            <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">≈ {formatCompact(p.estimatedPlays || 0)}</span>
          </button>
        ))}
      </div>
      {hl.length > 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Прошлая неделя</div>
          <div className="space-y-1">{hl.slice(0, 5).map((h, i) => <div key={i} className="text-[12.5px] text-zinc-300">{h}</div>)}</div>
        </div>
      )}
    </div>
  );
};

const SIM_CALM_CSS = `.sim-calm [class*='bg-emerald-500/'],.sim-calm [class*='bg-amber-500/'],.sim-calm [class*='bg-fuchsia-500/'],.sim-calm [class*='bg-sky-500/'],.sim-calm [class*='bg-violet-500/'],.sim-calm [class*='bg-rose-500/'],.sim-calm [class*='bg-red-500/'],.sim-calm [class*='bg-blue-500/'],.sim-calm [class*='bg-cyan-500/'],.sim-calm [class*='bg-orange-500/'],.sim-calm [class*='bg-purple-500/'],.sim-calm [class*='bg-pink-500/'],.sim-calm [class*='bg-indigo-500/'],.sim-calm [class*='bg-teal-500/'],.sim-calm [class*='bg-yellow-500/'],.sim-calm [class*='bg-lime-500/'],.sim-calm [class*='bg-emerald-400/'],.sim-calm [class*='bg-amber-400/']{background-color:rgba(255,255,255,.045)!important}.sim-calm [class*='border-emerald-'],.sim-calm [class*='border-amber-'],.sim-calm [class*='border-fuchsia-'],.sim-calm [class*='border-sky-'],.sim-calm [class*='border-violet-'],.sim-calm [class*='border-rose-'],.sim-calm [class*='border-red-'],.sim-calm [class*='border-blue-'],.sim-calm [class*='border-cyan-'],.sim-calm [class*='border-orange-'],.sim-calm [class*='border-purple-'],.sim-calm [class*='border-pink-'],.sim-calm [class*='border-indigo-'],.sim-calm [class*='border-teal-'],.sim-calm [class*='border-yellow-']{border-color:rgba(255,255,255,.08)!important}.sim-calm [class*='bg-gradient-to-']:not(.theme-bg-accent){background-image:none!important;background-color:rgba(255,255,255,.035)!important}.sim-calm [class*='shadow-']:not(.theme-bg-accent){box-shadow:none!important}.sim-calm [class*='border-white/1'],.sim-calm [class*='border-white/2']{border-color:rgba(255,255,255,.07)!important}.sim-calm p.text-xs.text-zinc-300,.sim-calm p.text-\\[11px\\].text-zinc-300{color:rgb(113 113 122)!important}.sim-calm .rounded-2xl,.sim-calm .rounded-3xl{transition:background-color .25s ease,border-color .25s ease}`;

export const SimConsoleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SimModeType | 'radar' | 'digest';
  initialShowWeeklyDrops?: boolean;
  initialDigestWeekNumber?: number | null;
  simState: SimState;
  saveSlots: SimSaveSlot[];
  onRunWeek: (args: {
    proposals?: SimProposal[];
    manualItems?: ManualSimItem[];
    advanceDays: number;
    autopilotConfig?: Partial<SimAutopilotConfig>;
    stepsCount?: number;
  }) => void;
  onUndoStep: () => void;
  onResetToStart: () => void;
  onSaveSlot: (name: string) => void;
  onLoadSlot: (slot: SimSaveSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onExportSimJson: () => void;
  onImportSimJson: (file: File) => void;
  onCommitSimToMaster?: (exitAfter: boolean) => void;
  onAdjustArtistHype?: (artistId: string, delta: number) => void;
  onCreateArtist?: (artist: Artist) => void;
  onGenerateArtistBio?: (name: string, genre: string) => Promise<string>;
  onOpenRelease?: (itemType: 'track' | 'album' | 'snippet', id: string, weekNumber?: number) => void;
  onOpenArtist?: (artistId: string) => void;
  onExitSim: () => void;
  onSetArtistFollowers?: (map: Record<string, number>) => void;
  onExportSimAsCatalog?: (mode: 'light' | 'full' | 'media') => void;
  onExportSimSnapshot?: (withMedia: boolean) => void;
  onRestoreBackup?: (kind: 'master' | 'sim', data: any) => void;
}> = ({
  isOpen,
  onClose,
  initialTab = 'semi',
  initialShowWeeklyDrops = false,
  initialDigestWeekNumber = null,
  simState,
  saveSlots,
  onRunWeek,
  onUndoStep,
  onResetToStart,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  onExportSimJson,
  onImportSimJson,
  onCommitSimToMaster,
  onAdjustArtistHype,
  onCreateArtist,
  onGenerateArtistBio,
  onOpenRelease,
  onOpenArtist,
  onExitSim,
  onSetArtistFollowers,
  onExportSimAsCatalog,
  onExportSimSnapshot,
  onRestoreBackup
}) => {
  const [tab, setTab] = useState<SimModeType | 'radar' | 'digest'>(initialTab);
  const [digestFull, setDigestFull] = useState(false);
  const [autopilot, setAutopilot] = useState<SimAutopilotConfig>(() => ({ ...DEFAULT_AUTOPILOT_CONFIG, ...loadScenarioConfig() }));
  const [advanceDays, setAdvanceDays] = useState<number>(7);
  const [proposals, setProposals] = useState<SimProposal[]>([]);
  const [semiFilter, setSemiFilter] = useState<'all' | 'track' | 'album' | 'snippet'>('all');
  const [showSemiSettings, setShowSemiSettings] = useState<boolean>(false);
  const [preferredPickerOpen, setPreferredPickerOpen] = useState<boolean>(false);
  const [confirmMasterCommit, setConfirmMasterCommit] = useState<boolean>(false);
  const [editingProposal, setEditingProposal] = useState<SimProposal | null>(null);
  const [semiAddArtistOpen, setSemiAddArtistOpen] = useState(false);
  const [createArtistTarget, setCreateArtistTarget] = useState<{
    ctx:
      | 'standalone'
      | 'semi_proposal'
      | 'preferred_author'
      | 'manual_main'
      | 'manual_feat'
      | 'manual_co'
      | 'manual_child_feat';
    prefillName?: string;
  } | null>(null);
  const [slotName, setSlotName] = useState<string>('');

  // Radar & Top Artists explorer state
  const [radarViewMode, setRadarViewMode] = useState<'radar' | 'top'>('radar');
  const [radarSort, setRadarSort] = useState<'readiness' | 'silent' | 'overallSilent' | 'warmup' | 'hype' | 'rising' | 'avgTrack'>('readiness');
  const [topArtistsSort, setTopArtistsSort] = useState<'followers' | 'totalPlays' | 'avgTrack' | 'hype' | 'hits' | 'quality'>('followers');
  const [radarTier, setRadarTier] = useState<'all' | 'mega_large' | 'mid' | 'rising'>('all');
  const [radarGenre, setRadarGenre] = useState<string>('all');
  const [radarAlbumDueOnly, setRadarAlbumDueOnly] = useState<boolean>(false);
  const [radarQuery, setRadarQuery] = useState('');
  const [radarSeed, setRadarSeed] = useState(0);
  const deferredRadarQuery = useDeferredValue(radarQuery);
  const [radarLimit, setRadarLimit] = useState(25);

  // Manual queue & coordination signals (typing state stays isolated inside SimManualTab!)
  const [manualQueue, setManualQueue] = useState<ManualSimItem[]>([]);
  const [showQueueShowcase, setShowQueueShowcase] = useState(false);
  const [editingManualSignal, setEditingManualSignal] = useState<{ seq: number; item: ManualSimItem } | null>(null);
  const [ideaStudioState, setIdeaStudioState] = useState<{ open: boolean; artistId?: string }>({ open: false });
  const [ideaAssignSignal, setIdeaAssignSignal] = useState<{ seq: number; draft: ManualSimItem } | null>(null);

  const handleEditQueuedManualItem = (item: ManualSimItem) => {
    setManualQueue(prev => prev.filter(x => x.id !== item.id));
    setEditingManualSignal({ seq: Date.now(), item });
    setTab('manual');
  };
  const [radarAssignSignal, setRadarAssignSignal] = useState<{ seq: number; artistId: string; genre: string } | null>(null);
  const [createdAssignSignal, setCreatedAssignSignal] = useState<{ seq: number; ctx: string; artist: Artist } | null>(null);
  const [showWeeklyDropsModal, setShowWeeklyDropsModal] = useState(initialShowWeeklyDrops);
  const [selectedDigestWeekNumber, setSelectedDigestWeekNumber] = useState<number | null>(initialDigestWeekNumber);
  const [weeklyDropsFilter, setWeeklyDropsFilter] = useState<'all' | 'album' | 'track' | 'snippet'>('all');
  const [weeklyDropsSort, setWeeklyDropsSort] = useState<'plays' | 'type' | 'title'>('plays');
  const [weeklyDropsQuery, setWeeklyDropsQuery] = useState('');

  const artistByIdMap = useMemo(
    () => new Map(simState.artists.map(a => [a.id, a])),
    [simState.artists]
  );

  // Decoupled CatalogIndex + per-artist WeakMap cache: editing hype on 1 artist or typing in proposals never recalculates the whole catalog!
  const catalogIndex = useMemo(
    () => buildCatalogIndex(simState.tracks, simState.albums, simState.currentDate),
    [simState.tracks, simState.albums, simState.currentDate]
  );

  const metricsCacheRef = useRef<{
    catalogIndex: typeof catalogIndex | null;
    currentDate: string;
    cache: WeakMap<Artist, ArtistSimMetrics>;
  }>({
    catalogIndex: null,
    currentDate: '',
    cache: new WeakMap()
  });

  const getArtistMetrics = useCallback(
    (art: Artist): ArtistSimMetrics => {
      if (
        metricsCacheRef.current.catalogIndex !== catalogIndex ||
        metricsCacheRef.current.currentDate !== simState.currentDate
      ) {
        metricsCacheRef.current = {
          catalogIndex,
          currentDate: simState.currentDate,
          cache: new WeakMap()
        };
      }
      const cached = metricsCacheRef.current.cache.get(art);
      if (cached) return cached;
      const { myTracks, myAlbums, myFeatTracks, albumById } = getArtistBucketFromIndex(art, catalogIndex);
      const computed = computeArtistMetricsFast(art, myTracks, myAlbums, simState.currentDate, myFeatTracks, albumById);
      metricsCacheRef.current.cache.set(art, computed);
      return computed;
    },
    [catalogIndex, simState.currentDate]
  );

  // Lazy analytics: cached per-Artist object in WeakMap, only materialized when Radar/Manual needs full list
  const artistAnalytics = useMemo(() => {
    if (tab !== 'radar' && tab !== 'manual') return [];
    return simState.artists.map(art => getArtistMetrics(art));
  }, [tab, simState.artists, getArtistMetrics]);

  // Decoupled from proposals edits: O(1) WeakMap-backed metrics lookup without recomputing on keystrokes
  const metricsMap = useMemo(() => {
    const map = new Map<string, ArtistSimMetrics>();
    simState.artists.forEach(art => {
      map.set(art.id, getArtistMetrics(art));
    });
    return map;
  }, [simState.artists, getArtistMetrics]);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setProposals(
        generateWeekProposals(simState.artists, simState.albums, simState.tracks, simState.currentDate, autopilot)
      );
      setSlotName(`Неделя ${simState.weekNumber} (${formatSimDate(simState.currentDate)})`);
      if (initialShowWeeklyDrops) {
        setShowWeeklyDropsModal(true);
        setSelectedDigestWeekNumber(initialDigestWeekNumber ?? simState.lastDigest?.weekNumber ?? null);
      } else {
        setShowWeeklyDropsModal(false);
      }
    }
  }, [isOpen, initialTab, initialShowWeeklyDrops, initialDigestWeekNumber]);

  useEffect(() => {
    setRadarLimit(25);
  }, [deferredRadarQuery, radarTier, radarSort, radarGenre, radarAlbumDueOnly, radarViewMode, topArtistsSort]);

  const regenerateProposals = useCallback(
    (overrideCfg?: Partial<SimAutopilotConfig>) => {
      const merged = overrideCfg ? { ...autopilot, ...overrideCfg } : autopilot;
      setProposals(
        generateWeekProposals(simState.artists, simState.albums, simState.tracks, simState.currentDate, merged)
      );
    },
    [autopilot, simState.artists, simState.albums, simState.tracks, simState.currentDate]
  );

  const filteredProposals = useMemo(() => {
    if (semiFilter === 'all') return proposals;
    return proposals.filter(p => p.itemType === semiFilter);
  }, [proposals, semiFilter]);

  const radarGenres = useMemo(() => {
    if (tab !== 'radar') return [];
    const counts = new Map<string, number>();
    artistAnalytics.forEach(m => {
      const g = (m.artist.genre || '').trim();
      if (g) counts.set(g, (counts.get(g) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(x => x[0]);
  }, [tab, artistAnalytics]);

  const partnerByArtistId = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    if (tab !== 'radar' || artistAnalytics.length < 2) return map;

    const tierRank: Record<ArtistSimMetrics['tier'], number> = {
      rising: 0,
      mid: 1,
      large: 2,
      mega: 3
    };
    const strHash = (str: string) => {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h);
    };

    artistAnalytics.forEach(m => {
      const mGenre = (m.artist.genre || '').toLowerCase();
      const mTokens = mGenre.split(/[\s/,&-]+/).filter(Boolean);
      const recentSet = new Set(m.recentCollabPartners);

      const scoredCandidates = artistAnalytics
        .filter(other => other.artist.id !== m.artist.id)
        .map(other => {
          const oGenre = (other.artist.genre || '').toLowerCase();
          let score = 0;
          if (mGenre && oGenre && mGenre === oGenre) score += 45;
          else if (mTokens.some(tok => tok.length >= 3 && oGenre.includes(tok))) score += 24;

          const tierDiff = Math.abs(tierRank[m.tier] - tierRank[other.tier]);
          if (tierDiff === 0) score += 32;
          else if (tierDiff === 1) score += 16;
          else if (tierDiff >= 2) score -= 36;

          const hypeDiff = Math.abs(m.hype - other.hype);
          score += Math.max(0, 20 - hypeDiff * 0.35);

          if (!recentSet.has(other.artist.name.toLowerCase().trim())) score += 16;

          const pairNoise = (strHash(`${m.artist.id}:${other.artist.id}:${radarSeed}`) % 19) - 9;
          return { other, score: score + pairNoise };
        })
        .sort((a, b) => b.score - a.score);

      const topPool = scoredCandidates.slice(0, Math.min(6, scoredCandidates.length));
      if (topPool.length > 0) {
        const pickIdx = (strHash(m.artist.id) + radarSeed) % topPool.length;
        const chosen = topPool[pickIdx].other;
        map.set(m.artist.id, { id: chosen.artist.id, name: chosen.artist.name });
      }
    });
    return map;
  }, [tab, artistAnalytics, radarSeed]);

  const radarFilteredArtists = useMemo(() => {
    if (tab !== 'radar') return [];
    const q = deferredRadarQuery.trim().toLowerCase();
    return artistAnalytics
      .filter(m => {
        if (q && !m.artist.name.toLowerCase().includes(q) && !(m.artist.genre || '').toLowerCase().includes(q)) {
          return false;
        }
        if (radarTier === 'mega_large' && m.tier !== 'mega' && m.tier !== 'large') return false;
        if (radarTier === 'mid' && m.tier !== 'mid') return false;
        if (radarTier === 'rising' && m.tier !== 'rising' && !m.artist.isRisingStar) return false;
        if (radarGenre !== 'all' && (m.artist.genre || '').trim() !== radarGenre) return false;
        if (radarViewMode === 'radar') {
          if (radarAlbumDueOnly && (m.daysSinceAlbum === null || m.daysSinceAlbum < 260)) return false;
          if (radarSort === 'warmup' && !m.activeSnippet) return false;
          if (radarSort === 'rising' && !m.artist.isRisingStar && m.tier !== 'rising') return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (radarViewMode === 'top') {
          if (topArtistsSort === 'totalPlays') return b.totalPlays - a.totalPlays;
          if (topArtistsSort === 'avgTrack') return b.catalogAvgPlays - a.catalogAvgPlays;
          if (topArtistsSort === 'hype') return b.hype - a.hype || (b.artist.followers || 0) - (a.artist.followers || 0);
          if (topArtistsSort === 'hits') return b.topHitsCount - a.topHitsCount || b.totalPlays - a.totalPlays;
          if (topArtistsSort === 'quality') return b.avgQuality - a.avgQuality || b.catalogAvgPlays - a.catalogAvgPlays;
          return (b.artist.followers || 0) - (a.artist.followers || 0);
        }
        if (radarSort === 'silent') return b.daysSilent - a.daysSilent;
        if (radarSort === 'overallSilent') return b.daysSilentOverall - a.daysSilentOverall;
        if (radarSort === 'hype') return b.hype - a.hype;
        if (radarSort === 'avgTrack') return b.catalogAvgPlays - a.catalogAvgPlays;
        if (radarSort === 'warmup') return (b.activeSnippet ? 1 : 0) - (a.activeSnippet ? 1 : 0) || b.hype - a.hype;
        if (radarSeed > 0) {
          const jitterA = ((a.artist.name.charCodeAt(0) + radarSeed * 13) % 11) - 5;
          const jitterB = ((b.artist.name.charCodeAt(0) + radarSeed * 13) % 11) - 5;
          return b.readinessScore + jitterB - (a.readinessScore + jitterA);
        }
        return b.readinessScore - a.readinessScore;
      });
  }, [
    tab,
    artistAnalytics,
    deferredRadarQuery,
    radarTier,
    radarGenre,
    radarAlbumDueOnly,
    radarViewMode,
    radarSort,
    topArtistsSort,
    radarSeed
  ]);

  const radarVisibleSlice = useMemo(
    () => radarFilteredArtists.slice(0, radarLimit),
    [radarFilteredArtists, radarLimit]
  );

  // Stable memoized callbacks so SemiProposalRow & RadarArtistRow never re-render needlessly!
  const handleToggleProposal = useCallback((id: string) => {
    setProposals(prev => prev.map(x => (x.id === id ? { ...x, selected: !x.selected } : x)));
  }, []);

  const handleProposalTitleChange = useCallback((id: string, title: string) => {
    setProposals(prev => prev.map(x => (x.id === id ? { ...x, title } : x)));
  }, []);

  const handleProposalPlaysChange = useCallback((id: string, estimatedPlays: number) => {
    setProposals(prev => prev.map(x => (x.id === id ? { ...x, estimatedPlays } : x)));
  }, []);

  const handleAddArtistProposal = useCallback(
    (art: Artist) => {
      const m = metricsMap.get(art.id);
      const existingSet = new Set<string>([
        ...simState.tracks.map(t => t.title.toLowerCase()),
        ...simState.albums.map(a => a.title.toLowerCase()),
        ...proposals.map(p => p.title.toLowerCase())
      ]);
      const title = generateModernTitle(existingSet, false, m?.namingProfile || false, autopilot.languageMix);
      const resolvedHype = m?.hype ?? art.hype ?? 55;
      const est = forecastReleasePlays({
        artist: art,
        itemType: 'track',
        qualityScore: m?.avgQuality || 70,
        hype: resolvedHype,
        hasWarmup: Boolean(m?.activeSnippet),
        hitsCount: m?.topHitsCount || 0,
        catalogAvgPlays: m?.catalogAvgPlays || 0
      });

      const newProp: SimProposal = {
        id: makeId('prop'),
        selected: true,
        itemType: 'track',
        artistId: art.id,
        artistName: art.name,
        title,
        coverUrl: '',
        duration: getRandomDuration(),
        isExplicit: false,
        genre: art.genre || 'Hip-Hop / Pop',
        estimatedPlays: est,
        qualityScore: m?.avgQuality || 70,
        artistHype: resolvedHype,
        daysSilent: m?.daysSilent ?? 30,
        hasWarmupBoost: Boolean(m?.activeSnippet),
        reason: 'Добавлен вручную в полуавтомат'
      };

      setProposals(prev => [newProp, ...prev]);
      setEditingProposal(newProp);
    },
    [metricsMap, simState.tracks, simState.albums, proposals, autopilot.languageMix]
  );

  const handleRadarAddSemi = useCallback(
    (art: Artist) => {
      handleAddArtistProposal(art);
      setTab('semi');
    },
    [handleAddArtistProposal]
  );

  const [calmView, setCalmView] = useState<boolean>(() => { try { return localStorage.getItem('musaic.sim.calm') !== '0'; } catch { return true; } });
  const [lightMode, setLightMode] = useState<boolean>(() => { try { return localStorage.getItem('musaic.sim.light') === '1'; } catch { return false; } });
  const toggleLight = () => setLightMode(v => { const n = !v; try { localStorage.setItem('musaic.sim.light', n ? '1' : '0'); } catch { /* */ } if (n) setTab('semi'); return n; });
  useEffect(() => { if (lightMode && tab !== 'semi') setTab('semi'); }, [lightMode, tab]);
  const [rumorsOpen, setRumorsOpen] = useState(false);
  const [rumorMsg, setRumorMsg] = useState<string | null>(null);
  const [confirmedRumors, setConfirmedRumors] = useState<ConfirmedRumor[]>(() => loadConfirmed());
  useEffect(() => { const f = () => setConfirmedRumors(loadConfirmed()); window.addEventListener('musaic-confirmed', f); return () => window.removeEventListener('musaic-confirmed', f); }, []);
  useEffect(() => { if (isOpen) setConfirmedRumors(loadConfirmed()); }, [isOpen]);
  useEffect(() => { if (!rumorMsg) return; const t = setTimeout(() => setRumorMsg(null), 2600); return () => clearTimeout(t); }, [rumorMsg]);
  const toggleCalm = () => setCalmView(v => { const n = !v; try { localStorage.setItem('musaic.sim.calm', n ? '1' : '0'); } catch { /* */ } return n; });
  const handleRadarCreateManual = useCallback((art: Artist) => {
    setRadarAssignSignal({ seq: Date.now(), artistId: art.id, genre: art.genre || '' });
    setTab('manual');
  }, []);

  if (!isOpen) return null;

  const selectedProposalsCount = proposals.filter(p => p.selected).length;
  const openRumors = confirmedRumors.filter(r => !r.used);
  const sendRumor = (rm: ConfirmedRumor, target: 'semi' | 'manual') => {
    const art = simState.artists.find(a => a.id === rm.artistId) || simState.artists.find(a => a.name.toLowerCase() === rm.artistName.toLowerCase());
    if (!art) { setRumorMsg(`${rm.artistName} нет в симуляции`); return; }
    const m = metricsMap.get(art.id);
    const existing = new Set<string>([...simState.tracks.map(t => t.title.toLowerCase()), ...simState.albums.map(a => a.title.toLowerCase()), ...proposals.map(p => p.title.toLowerCase())]);
    const isBig = rm.kind === 'album' || rm.kind === 'ep';
    const itemType: 'track' | 'album' | 'snippet' = isBig ? 'album' : rm.kind === 'snippet' ? 'snippet' : 'track';
    const title = rm.title || generateModernTitle(existing, isBig, m?.namingProfile || false, autopilot.languageMix);
    const hype = m?.hype ?? art.hype ?? 55;
    const count = rm.kind === 'ep' ? randInt(4, 6) : randInt(10, 15);
    const est = forecastReleasePlays({ artist: art, itemType, qualityScore: m?.avgQuality || 70, hype, hasWarmup: Boolean(m?.activeSnippet), hitsCount: m?.topHitsCount || 0, catalogAvgPlays: m?.catalogAvgPlays || 0, albumTracksCount: isBig ? count : undefined } as any);
    let albumTracks: SimAlbumTrack[] | undefined;
    if (isBig) { try { albumTracks = generateAlbumTracksWithFeats({ artist: art, allArtists: simState.artists, count, estimatedAlbumPlays: est, existingTitles: existing, namingProfile: m?.namingProfile || false }); } catch { albumTracks = undefined; } }
    const reason = `Подтверждённый слух (${rm.source}) · ≈ ${formatSimDate(rm.date)}`;
    if (target === 'semi') {
      const prop: SimProposal = {
        id: makeId('prop'), selected: true, itemType, releaseFormat: isBig ? (rm.kind as 'ep' | 'album') : itemType === 'snippet' ? 'snippet' : 'single',
        artistId: art.id, artistName: art.name, featuredArtist: rm.feat, title, coverUrl: '', duration: itemType === 'snippet' ? `0:${randInt(24, 46)}` : getRandomDuration(), isExplicit: false,
        genre: art.genre || 'Hip-Hop / Pop', estimatedPlays: est, qualityScore: m?.avgQuality || 70, artistHype: hype, daysSilent: m?.daysSilent ?? 30, hasWarmupBoost: Boolean(m?.activeSnippet), reason,
        albumTracksCount: isBig ? albumTracks?.length || count : undefined, albumTracks, albumTrackTitles: albumTracks?.map(t => t.title)
      };
      setProposals(prev => [prop, ...prev]);
      if (!lightMode) setTab('semi');
      setEditingProposal(prop);
    } else {
      setManualQueue(q => [...q, { id: makeId('manual'), itemType, artistId: art.id, artistName: art.name, featuredArtist: rm.feat, title, genre: art.genre, plays: est, albumTracksCount: isBig ? albumTracks?.length || count : undefined, albumTracks }]);
      setLightMode(false); setTab('manual');
    }
    saveConfirmed(confirmedRumors.map(x => (x.id === rm.id ? { ...x, used: target } : x)));
    setRumorMsg(target === 'semi' ? `«${title}» в полуавтомате — открыт редактор` : `«${title}» в ручном батче`);
  };

  const updateAutopilot = <K extends keyof SimAutopilotConfig>(key: K, val: SimAutopilotConfig[K]) => {
    const next = { ...autopilot, [key]: val };
    setAutopilot(next);
  };

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-2.5 sm:p-5">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-[calc(100vw-1.25rem)] sm:w-[calc(100vw-2.5rem)] max-w-6xl h-[calc(100vh-1.25rem)] sm:h-[88vh] bg-zinc-950 border border-white/12 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col min-w-0 ${calmView ? 'sim-calm' : ''}`}>
        <style>{SIM_CALM_CSS}</style>
        {/* Subtle static top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-28 pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(60% 100% at 20% 0%, var(--accent-color), transparent 70%)'
          }}
        />

        {/* Header */}
        <div className="relative px-5 md:px-6 py-4 border-b border-white/[0.12] bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-extrabold text-white tracking-tight truncate">
              Пульт симуляции · {formatSimDate(simState.currentDate)}
            </h2>
            <p className="text-xs text-zinc-300 tabular-nums mt-0.5">
              Неделя {simState.weekNumber} · {simState.artists.length} артистов · {simState.tracks.length} треков
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] tabular-nums">
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-200" title="Отмечено релизов на эту неделю">✓ {selectedProposalsCount} в релиз</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-200" title="Прогноз прослушиваний отмеченных релизов">≈ {formatCompact(proposals.filter(p => p.selected).reduce((s, p) => s + (p.estimatedPlays || 0), 0))} просл.</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-200" title="Релизов с фитами среди отмеченных">feat · {proposals.filter(p => p.selected && p.featuredArtist).length}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-200" title="Следующая дата">→ {formatSimDate(addDaysISO(simState.currentDate, 7))}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {!lightMode && (
            <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-900 border border-white/15 rounded-2xl">
              {[
                { id: 'semi', label: 'Полуавтомат' },
                { id: 'auto', label: 'Автопилот' },
                { id: 'manual', label: 'Ручной батч' },
                { id: 'radar', label: 'Радар артистов' },
                { id: 'digest', label: 'Итоги и слоты' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    tab === item.id ? 'theme-bg-accent text-black font-bold shadow-md' : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            )}
            <ListenEngineButton artists={simState.artists} tracks={simState.tracks} albums={simState.albums} refIso={simState.currentDate} onApplyListeners={onSetArtistFollowers} label="Движок" />
            <button
              type="button"
              onClick={() => setRumorsOpen(v => !v)}
              title="Подтверждённые слухи из ленты"
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${rumorsOpen ? 'bg-white text-black border-transparent' : 'border-white/10 text-zinc-300 hover:text-white'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />Слухи{openRumors.length > 0 && <span className="tabular-nums">· {openRumors.length}</span>}
            </button>
            <button
              type="button"
              onClick={toggleLight}
              title={lightMode ? 'Вернуть полный пульт со всеми вкладками' : 'Лёгкий режим: один экран, только главное'}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer shrink-0 ${lightMode ? 'theme-bg-accent text-black border-transparent' : 'border-white/10 text-zinc-300 hover:text-white'}`}
            >
              {lightMode ? 'Лёгкий режим' : 'Полный режим'}
            </button>
            <button
              type="button"
              onClick={toggleCalm}
              title={calmView ? 'Сейчас спокойный вид: меньше цвета и рамок. Нажми, чтобы вернуть яркий' : 'Включить спокойный, менее загруженный вид'}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer shrink-0 ${calmView ? 'border-white/15 text-white bg-white/[0.06]' : 'border-white/10 text-zinc-400 hover:text-white'}`}
            >
              {calmView ? 'Спокойный вид' : 'Яркий вид'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body (instant tab switching, zero AnimatePresence lag) */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar min-w-0">
          {/* TAB 1: SEMI-AUTO PRODUCER PICKER */}
          {rumorMsg && <div className="mb-3 px-3 py-2 rounded-xl bg-white/[0.06] text-[12px] text-white">{rumorMsg}</div>}
          {rumorsOpen && (
            <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div><div className="text-[13px] font-bold text-white">Подтверждённые слухи</div><div className="text-[11px] text-zinc-500">Подтверждай посты с датами в «Ленте» — они появляются здесь и в календаре</div></div>
                <button type="button" onClick={() => setRumorsOpen(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              {confirmedRumors.length === 0 && <div className="text-[12px] text-zinc-500 py-3">Пока пусто. Открой «Ленту» и нажми «Подтвердить» под анонсом или инсайдом.</div>}
              <div className="space-y-1.5">
                {[...confirmedRumors].sort((a, b) => Number(Boolean(a.used)) - Number(Boolean(b.used)) || a.date.localeCompare(b.date)).map(rm => {
                  const soon = rm.date >= simState.currentDate && rm.date <= addDaysISO(simState.currentDate, advanceDays);
                  return (
                    <div key={rm.id} className={`flex flex-wrap items-center gap-3 p-2.5 rounded-xl ${rm.used ? 'opacity-50' : 'bg-white/[0.03]'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-white truncate">{rm.artistName}{rm.feat ? ` feat. ${rm.feat}` : ''} · {rm.kind === 'album' ? 'Альбом' : rm.kind === 'ep' ? 'EP' : rm.kind === 'snippet' ? 'Сниппет' : 'Сингл'}{rm.title ? ` «${rm.title}»` : ''}</div>
                        <div className="text-[11px] text-zinc-500 truncate">≈ {formatSimDate(rm.date)}{soon ? ' · на этой неделе' : rm.date < simState.currentDate ? ' · дата уже прошла' : ''} · {rm.source}: {rm.text}</div>
                      </div>
                      {rm.used ? <span className="text-[11px] text-zinc-500">{rm.used === 'semi' ? 'в полуавтомате' : 'в батче'}</span> : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button" onClick={() => sendRumor(rm, 'semi')} className="px-2.5 py-1.5 rounded-lg theme-bg-accent text-black text-[11px] font-bold cursor-pointer">В полуавтомат</button>
                          <button type="button" onClick={() => sendRumor(rm, 'manual')} className="px-2.5 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white text-[11px] font-semibold cursor-pointer">В ручной батч</button>
                        </div>
                      )}
                      <button type="button" title="Убрать" onClick={() => saveConfirmed(confirmedRumors.filter(x => x.id !== rm.id))} className="p-1 rounded-lg text-zinc-600 hover:text-rose-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {lightMode && (
            <SimLightPanel proposals={proposals} setProposals={setProposals} regenerate={regenerateProposals} autopilot={autopilot} setAuto={updateAutopilot} simState={simState} advanceDays={advanceDays} setAdvanceDays={setAdvanceDays} />
          )}
          {(tab === 'semi' || tab === 'manual') && (
            <WeekBuzzStrip simState={simState} rumors={confirmedRumors} onUse={id => { const rm = confirmedRumors.find(x => x.id === id); if (rm) sendRumor(rm, tab === 'manual' ? 'manual' : 'semi'); }} />
          )}
          {!lightMode && tab === 'semi' && (
            <div className="space-y-4">
              <SimScenarioDeck autopilot={autopilot} setAutopilot={setAutopilot} weekNumber={simState.weekNumber} compact />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold text-white">Кандидаты на релиз недели</p>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Отмечайте галочками, настраивайте точное число треков, EP и альбомов, желаемых авторов и хайп
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSemiSettings(prev => !prev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      showSemiSettings
                        ? 'theme-bg-accent text-black border-transparent font-bold'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Состав и авторы</span>
                  </button>

                  <select
                    value={autopilot.weekEvent}
                    onChange={e => {
                      const ev = e.target.value as SimWeekEvent;
                      updateAutopilot('weekEvent', ev);
                      regenerateProposals({ weekEvent: ev });
                    }}
                    className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-200 outline-none cursor-pointer"
                    title="Событие недели"
                  >
                    <option value="normal">Обычная неделя</option>
                    <option value="collab_fest">Волна фитов</option>
                    <option value="hot_drops">Горячие новинки</option>
                    <option value="underground_wave">Взрыв андерграунда</option>
                    <option value="quiet_week">Тихая неделя</option>
                  </select>

                  <div className="flex items-center gap-1 p-0.5 bg-zinc-900 border border-white/10 rounded-xl">
                    {[
                      { id: 'calm', label: 'Спокойно' },
                      { id: 'balanced', label: 'Стандарт' },
                      { id: 'active', label: 'Активно' }
                    ].map(lvl => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          const next = lvl.id as SimIntensity;
                          updateAutopilot('intensity', next);
                          regenerateProposals({ intensity: next });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          autopilot.intensity === lvl.id ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSemiAddArtistOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 theme-accent" />
                    <span>Добавить артиста</span>
                  </button>

                  {onCreateArtist && (
                    <button
                      type="button"
                      onClick={() => setCreateArtistTarget({ ctx: 'semi_proposal' })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-bold text-emerald-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Создать совершенно нового артиста и сразу поставить ему релиз на эту неделю"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Новый артист</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIdeaStudioState({ open: true })}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                    title="Случайный выбор артиста, досье по дропам и генератор идей/стримов/хайпа"
                  >
                    <Sparkles className="w-3.5 h-3.5 theme-accent" />
                    <span>Идеи и рандом</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => regenerateProposals()}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Новые идеи</span>
                  </button>
                </div>
              </div>

              {showSemiSettings && (
                <div className="p-4 rounded-2xl bg-zinc-900/75 border border-white/10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white">Точные параметры подбора на неделю</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cleared: Partial<SimAutopilotConfig> = {
                            singlesCount: null,
                            epsCount: null,
                            albumsCount: null,
                            snippetsCount: null,
                            preferredArtistIds: [],
                            hypeRange: 'any'
                          };
                          setAutopilot(prev => ({ ...prev, ...cleared }));
                          regenerateProposals(cleared);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-semibold text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Сбросить к авто
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateProposals()}
                        className="px-3 py-1 rounded-lg theme-bg-accent text-black text-[11px] font-bold cursor-pointer"
                      >
                        Сгенерировать по настройкам
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'singlesCount' as const, label: 'Синглы (треки)', max: 12 },
                      { key: 'epsCount' as const, label: 'EP (3–6 тр.)', max: 6 },
                      { key: 'albumsCount' as const, label: 'Альбомы (8–14 тр.)', max: 6 },
                      { key: 'snippetsCount' as const, label: 'Сниппеты', max: 8 }
                    ].map(fc => {
                      const val = autopilot[fc.key];
                      const isAuto = val == null;
                      return (
                        <div key={fc.key} className="p-2.5 rounded-xl bg-black/45 border border-white/[0.07] space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold text-zinc-300 truncate">{fc.label}</span>
                            <button
                              type="button"
                              onClick={() => updateAutopilot(fc.key, isAuto ? 1 : null)}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                                isAuto ? 'bg-white/10 text-zinc-300' : 'theme-bg-accent text-black'
                              }`}
                            >
                              {isAuto ? 'Авто' : 'Точно'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateAutopilot(fc.key, Math.max(0, (val ?? 1) - 1))}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-xs font-mono font-bold text-white tabular-nums">
                              {isAuto ? 'Авто' : val}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateAutopilot(fc.key, Math.min(fc.max, (val ?? 0) + 1))}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/[0.07] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-300">Желаемые авторы на неделю</span>
                        <button
                          type="button"
                          onClick={() => setPreferredPickerOpen(true)}
                          className="text-[11px] theme-accent font-bold hover:underline cursor-pointer"
                        >
                          + Добавить автора
                        </button>
                      </div>
                      {(autopilot.preferredArtistIds?.length || 0) === 0 ? (
                        <p className="text-[11px] text-zinc-500">Не выбраны — алгоритм сам подберёт по готовности</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(autopilot.preferredArtistIds || []).map(aid => {
                            const art = simState.artists.find(a => a.id === aid);
                            if (!art) return null;
                            return (
                              <span
                                key={aid}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-[11px] font-semibold text-white"
                              >
                                <span>{art.name}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAutopilot(
                                      'preferredArtistIds',
                                      (autopilot.preferredArtistIds || []).filter(x => x !== aid)
                                    )
                                  }
                                  className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/[0.07] space-y-2">
                      <span className="text-[11px] font-semibold text-zinc-300 block">Фильтр по хайпу авторов</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'any', label: 'Любой' },
                          { id: 'low', label: 'До 50' },
                          { id: 'mid', label: '50–75' },
                          { id: 'high', label: '75+' }
                        ].map(h => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => updateAutopilot('hypeRange', h.id as SimHypeRange)}
                            className={`py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              (autopilot.hypeRange || 'any') === h.id
                                ? 'theme-bg-accent text-black font-bold'
                                : 'bg-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-zinc-900/80 border border-white/[0.08] rounded-xl">
                  {[
                    { id: 'all', label: `Все (${proposals.length})` },
                    { id: 'track', label: `Треки (${proposals.filter(p => p.itemType === 'track').length})` },
                    { id: 'album', label: `Альбомы/EP (${proposals.filter(p => p.itemType === 'album').length})` },
                    { id: 'snippet', label: `Сниппеты (${proposals.filter(p => p.itemType === 'snippet').length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSemiFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                        semiFilter === f.id ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('radar')}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Radar className="w-3.5 h-3.5 theme-accent" />
                    <span>Кому пора дропнуть?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = proposals.every(p => p.selected);
                      setProposals(prev => prev.map(p => ({ ...p, selected: !allSelected })));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
                  >
                    {proposals.every(p => p.selected) ? 'Снять все' : 'Выбрать все'}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-white/[0.1] border border-white/15 rounded-2xl bg-zinc-900/55 overflow-hidden">
                {filteredProposals.map(prop => (
                  <SemiProposalRow
                    key={prop.id}
                    prop={prop}
                    onToggle={handleToggleProposal}
                    onTitleChange={handleProposalTitleChange}
                    onPlaysChange={handleProposalPlaysChange}
                    onOpenEditor={setEditingProposal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EXPANDED AUTOPILOT WITH DEEP SETTINGS */}
          {tab === 'auto' && (
            <div className="max-w-4xl mx-auto py-2 space-y-6">
              <SimScenarioDeck autopilot={autopilot} setAutopilot={setAutopilot} weekNumber={simState.weekNumber} />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-[17px] font-extrabold text-white">Расширенный автопилот индустрии</h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed max-w-2xl">
                    Настройте точное количество треков, EP и альбомов, желаемых авторов, уровень хайпа, язык названий и виральность.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutopilot(DEFAULT_AUTOPILOT_CONFIG)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Сбросить пресет
                </button>
              </div>

              {/* 0. Detailed Release Format Counts & Preferred Authors / Hype */}
              <div className="p-4 rounded-2xl bg-zinc-900/65 border border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-zinc-200">
                    Точное количество дропов по форматам (или «Авто» по интенсивности)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setAutopilot(prev => ({
                        ...prev,
                        singlesCount: null,
                        epsCount: null,
                        albumsCount: null,
                        snippetsCount: null
                      }))
                    }
                    className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Сделать все «Авто»
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'singlesCount' as const, label: 'Синглы (треки)', max: 12 },
                    { key: 'epsCount' as const, label: 'EP (3–6 тр.)', max: 6 },
                    { key: 'albumsCount' as const, label: 'Альбомы (8–14 тр.)', max: 6 },
                    { key: 'snippetsCount' as const, label: 'Сниппеты', max: 8 }
                  ].map(fc => {
                    const val = autopilot[fc.key];
                    const isAuto = val == null;
                    return (
                      <div key={fc.key} className="p-3 rounded-xl bg-black/45 border border-white/[0.07] space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-semibold text-zinc-300 truncate">{fc.label}</span>
                          <button
                            type="button"
                            onClick={() => updateAutopilot(fc.key, isAuto ? 1 : null)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                              isAuto ? 'bg-white/10 text-zinc-300' : 'theme-bg-accent text-black'
                            }`}
                          >
                            {isAuto ? 'Авто' : 'Точно'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => updateAutopilot(fc.key, Math.max(0, (val ?? 1) - 1))}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
                          >
                            −
                          </button>
                          <span className="text-xs font-mono font-bold text-white tabular-nums">
                            {isAuto ? 'Авто' : val}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateAutopilot(fc.key, Math.min(fc.max, (val ?? 0) + 1))}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.07] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-300">Желаемые авторы (обязательно дропнут)</span>
                      <button
                        type="button"
                        onClick={() => setPreferredPickerOpen(true)}
                        className="text-[11px] theme-accent font-bold hover:underline cursor-pointer"
                      >
                        + Выбрать автора
                      </button>
                    </div>
                    {(autopilot.preferredArtistIds?.length || 0) === 0 ? (
                      <p className="text-[11px] text-zinc-500">Авторы выбираются автоматически</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(autopilot.preferredArtistIds || []).map(aid => {
                          const art = simState.artists.find(a => a.id === aid);
                          if (!art) return null;
                          return (
                            <span
                              key={aid}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-[11px] font-semibold text-white"
                            >
                              <span>{art.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateAutopilot(
                                    'preferredArtistIds',
                                    (autopilot.preferredArtistIds || []).filter(x => x !== aid)
                                  )
                                }
                                className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.07] space-y-2">
                    <span className="text-[11px] font-semibold text-zinc-300 block">Желаемый уровень хайпа авторов</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'any', label: 'Любой' },
                        { id: 'low', label: 'До 50' },
                        { id: 'mid', label: '50–75' },
                        { id: 'high', label: '75+' }
                      ].map(h => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => updateAutopilot('hypeRange', h.id as SimHypeRange)}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            (autopilot.hypeRange || 'any') === h.id
                              ? 'theme-bg-accent text-black font-bold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Intensity */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-300 block">1. Активность релизов (когда форматы в «Авто»)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'calm', title: 'Спокойная', desc: '2–3 релиза' },
                    { id: 'balanced', title: 'Сбалансированная', desc: '4–5 релизов' },
                    { id: 'active', title: 'Горячая неделя', desc: '6–7 релизов' },
                    { id: 'mega', title: 'Мега-пятница', desc: '8–10 премьер' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateAutopilot('intensity', opt.id as SimIntensity)}
                      className={`p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                        autopilot.intensity === opt.id
                          ? 'bg-white/[0.1] border-white/30 text-white'
                          : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <p className="text-xs font-bold text-white">{opt.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Scenario / Vibe */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-300 block">2. Сценарий и настроение недели</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'normal', label: 'Стандарт' },
                    { id: 'collab_fest', label: 'Волна фитов' },
                    { id: 'hot_drops', label: 'Крупные премьеры' },
                    { id: 'underground_wave', label: 'Новые имена' },
                    { id: 'quiet_week', label: 'Затишье' }
                  ].map(ev => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => updateAutopilot('weekEvent', ev.id as SimWeekEvent)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        autopilot.weekEvent === ev.id
                          ? 'theme-bg-accent text-black border-transparent font-bold'
                          : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {ev.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Language + Format Focus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/55 border border-white/[0.08] space-y-2.5">
                  <label className="text-xs font-bold text-zinc-300 block">3. Язык названий (строго RU или EN, без смешивания)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'auto', label: 'По стилю артиста' },
                      { id: 'mix', label: 'Чередовать RU и EN' },
                      { id: 'ru', label: 'Только русский' },
                      { id: 'en', label: 'Только английский' }
                    ].map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => updateAutopilot('languageMix', l.id as SimLanguageMix)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          autopilot.languageMix === l.id
                            ? 'bg-white/15 border-white/30 text-white'
                            : 'bg-black/35 border-white/[0.07] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/55 border border-white/[0.08] space-y-2.5">
                  <label className="text-xs font-bold text-zinc-300 block">4. Приоритет форматов</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'auto', label: 'Сбалансированно' },
                      { id: 'singles', label: 'Упор на синглы' },
                      { id: 'albums', label: 'Сезон альбомов' },
                      { id: 'snippets', label: 'Волна сниппетов' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateAutopilot('formatFocus', f.id as SimFormatFocus)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          autopilot.formatFocus === f.id
                            ? 'bg-white/15 border-white/30 text-white'
                            : 'bg-black/35 border-white/[0.07] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Collabs + Tier Focus + Virality */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/55 border border-white/[0.08] space-y-2.5">
                  <label className="text-xs font-bold text-zinc-300 block">5. Частота фитов</label>
                  <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/[0.07]">
                    {[
                      { id: 'low', label: 'Редко' },
                      { id: 'balanced', label: 'Норма' },
                      { id: 'high', label: 'Много' }
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updateAutopilot('collabRate', c.id as SimCollabRate)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          autopilot.collabRate === c.id ? 'theme-bg-accent text-black font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={autopilot.allowSurpriseCollabs}
                      onChange={e => updateAutopilot('allowSurpriseCollabs', e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Неожиданные кроссовер-фиты</span>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/55 border border-white/[0.08] space-y-2.5">
                  <label className="text-xs font-bold text-zinc-300 block">6. Кто в фокусе</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', label: 'Все артисты' },
                      { id: 'stars', label: 'Топ-звёзды' },
                      { id: 'rising', label: 'Новички' },
                      { id: 'comeback', label: 'Камбэки' }
                    ].map(tf => (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => updateAutopilot('tierFocus', tf.id as SimTierFocus)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                          autopilot.tierFocus === tf.id
                            ? 'bg-white/15 border-white/30 text-white'
                            : 'bg-black/35 border-white/[0.07] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/55 border border-white/[0.08] space-y-2.5">
                  <label className="text-xs font-bold text-zinc-300 block">7. Виральность и промо</label>
                  <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/[0.07]">
                    {[
                      { id: 'stable', label: 'Стабильно' },
                      { id: 'balanced', label: 'Баланс' },
                      { id: 'viral', label: 'Вирусно' }
                    ].map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => updateAutopilot('virality', v.id as SimViralityLevel)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          autopilot.virality === v.id ? 'theme-bg-accent text-black font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={autopilot.enablePromoWaves}
                      onChange={e => updateAutopilot('enablePromoWaves', e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Промо-волны и хайп-кампании</span>
                  </label>
                </div>
              </div>

              {/* 5. Multi-step depth */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white">8. Глубина автопрокрутки</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Можно прогнать сразу серию шагов подряд — каждая неделя просчитается с чартами и прогревами
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-black/50 rounded-xl border border-white/10">
                  {[
                    { n: 1, label: '1 шаг' },
                    { n: 2, label: '2 шага подряд' },
                    { n: 4, label: '4 шага подряд' }
                  ].map(st => (
                    <button
                      key={st.n}
                      type="button"
                      onClick={() => updateAutopilot('weeksCount', st.n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        autopilot.weeksCount === st.n ? 'theme-bg-accent text-black font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FULL MANUAL BATCH BUILDER */}
          {tab === 'manual' && (
            <SimManualTab
              simState={simState}
              artistByIdMap={artistByIdMap}
              getArtistMetrics={getArtistMetrics}
              metricsMap={metricsMap}
              autopilot={autopilot}
              manualQueue={manualQueue}
              setManualQueue={setManualQueue}
              setShowQueueShowcase={setShowQueueShowcase}
              onNavigateToRadar={() => setTab('radar')}
              hasCreateArtist={Boolean(onCreateArtist)}
              onRequestCreateArtist={(ctx, prefillName) => setCreateArtistTarget({ ctx, prefillName })}
              onOpenIdeaStudio={artistId => setIdeaStudioState({ open: true, artistId })}
              radarAssignSignal={radarAssignSignal}
              createdAssignSignal={createdAssignSignal}
              editingManualSignal={editingManualSignal}
              ideaAssignSignal={ideaAssignSignal}
            />
          )}

          {/* TAB 4: ARTIST READINESS, ANALYTICS & TOP ARTISTS EXPLORER */}
          {tab === 'radar' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRadarViewMode('radar')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        radarViewMode === 'radar' ? 'theme-bg-accent text-black' : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Radar className="w-3.5 h-3.5" />
                      <span>Радар готовности</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadarViewMode('top')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        radarViewMode === 'top' ? 'theme-bg-accent text-black' : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Топ артистов и цифры</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRadarSeed(s => s + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                    title="Обновить идеи фитов, форматов и очередность рекомендаций"
                  >
                    <RefreshCw className="w-3.5 h-3.5 theme-accent" />
                    <span>Перезагрузить радар</span>
                  </button>

                  {onCreateArtist && (
                    <button
                      type="button"
                      onClick={() => setCreateArtistTarget({ ctx: 'standalone' })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-bold text-emerald-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Создать артиста</span>
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={radarQuery}
                    onChange={e => setRadarQuery(e.target.value)}
                    placeholder="Найти артиста или жанр..."
                    className="w-full bg-zinc-900 border border-white/15 focus:border-white/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-400 outline-none"
                  />
                </div>
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {radarViewMode === 'radar' ? (
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
                    {[
                      { id: 'readiness', label: 'Готовность' },
                      { id: 'silent', label: 'Без своего дропа' },
                      { id: 'overallSilent', label: 'Всего отсутствуют (с фитами)' },
                      { id: 'warmup', label: 'Есть сниппет' },
                      { id: 'hype', label: 'Пик хайпа' },
                      { id: 'avgTrack', label: 'Ср. на трек' },
                      { id: 'rising', label: 'Новые волны' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setRadarSort(s.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          radarSort === s.id ? 'theme-bg-accent text-black font-bold' : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
                    {[
                      { id: 'followers', label: 'По слушателям/мес' },
                      { id: 'totalPlays', label: 'Всего стримов' },
                      { id: 'avgTrack', label: 'Среднее на трек' },
                      { id: 'hype', label: 'По хайпу' },
                      { id: 'hits', label: 'По хитам' },
                      { id: 'quality', label: 'По оценке' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTopArtistsSort(s.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          topArtistsSort === s.id ? 'theme-bg-accent text-black font-bold' : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {radarViewMode === 'radar' && (
                    <button
                      type="button"
                      onClick={() => setRadarAlbumDueOnly(prev => !prev)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        radarAlbumDueOnly
                          ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                          : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      Пора альбом (260+ дн.)
                    </button>
                  )}

                  {radarGenres.length > 0 && (
                    <select
                      value={radarGenre}
                      onChange={e => setRadarGenre(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-200 outline-none cursor-pointer"
                    >
                      <option value="all">Все жанры</option>
                      {radarGenres.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
                    {[
                      { id: 'all', label: 'Все' },
                      { id: 'mega_large', label: 'Крупные' },
                      { id: 'mid', label: 'Средние' },
                      { id: 'rising', label: 'Новые' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setRadarTier(t.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          radarTier === t.id ? 'bg-white/20 text-white' : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Radar Summary Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-xs text-zinc-300 tabular-nums">
                <span>
                  Найдено артистов: <strong className="text-white">{radarFilteredArtists.length}</strong>
                  {' · '}Активных сниппетов: <strong className="text-white">{artistAnalytics.filter(a => Boolean(a.activeSnippet)).length}</strong>
                  {' · '}Ждут альбом 260+ дн.: <strong className="text-white">{artistAnalytics.filter(a => a.daysSinceAlbum !== null && a.daysSinceAlbum >= 260).length}</strong>
                </span>
                <span className="text-zinc-400">Нажмите на имя артиста, чтобы открыть его страницу</span>
              </div>
              <RadarHiddenBar />

              {radarViewMode === 'radar' ? (
                <div className="divide-y divide-white/[0.08] border border-white/10 rounded-2xl bg-zinc-900/45 overflow-hidden">
                  {radarVisibleSlice.length === 0 ? (
                    <p className="py-12 text-center text-sm text-zinc-400">Нет артистов по выбранным фильтрам</p>
                  ) : (
                    radarVisibleSlice.map(m => (
                      <RadarArtistRow
                        key={m.artist.id}
                        m={m}
                        radarSeed={radarSeed}
                        suggestedPartner={partnerByArtistId.get(m.artist.id)}
                        onAdjustHype={onAdjustArtistHype}
                        onAddToSemi={handleRadarAddSemi}
                        onCreateManual={handleRadarCreateManual}
                        onOpenArtist={onOpenArtist}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="border border-white/10 rounded-2xl bg-zinc-900/45 overflow-hidden">
                  {radarVisibleSlice.length === 0 ? (
                    <p className="py-12 text-center text-sm text-zinc-400">Нет артистов по выбранным фильтрам</p>
                  ) : (
                    <div className="divide-y divide-white/[0.08]">
                      {radarVisibleSlice.map((m, idx) => (
                        <div
                          key={m.artist.id}
                          className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <span className="w-7 text-center font-mono text-xs font-black text-zinc-400 tabular-nums shrink-0">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenArtist && onOpenArtist(m.artist.id)}
                              disabled={!onOpenArtist}
                              className={`shrink-0 ${onOpenArtist ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <CoverArt
                                url={m.artist.imageUrl}
                                title={m.artist.name}
                                isArtist
                                className="w-11 h-11 rounded-full border border-white/15"
                              />
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onOpenArtist && onOpenArtist(m.artist.id)}
                                  className="text-sm font-extrabold text-white hover:theme-accent cursor-pointer flex items-center gap-1"
                                >
                                  <span>{m.artist.name}</span>
                                  {onOpenArtist && <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />}
                                </button>
                                <span className="text-xs text-zinc-400">{m.artist.genre || 'Без жанра'}</span>
                              </div>
                              <p className="text-xs text-zinc-300 mt-0.5 tabular-nums">
                                Слуш./мес: <strong className="text-white">{formatCompact(m.artist.followers)}</strong>
                                {' · '}Всего стримов: <strong className="text-white">{formatCompact(m.totalPlays)}</strong>
                                {' · '}Ср. трек: <strong className="theme-accent">{formatCompact(m.catalogAvgPlays)}</strong>
                                {' · '}Каталог: <strong className="text-white">{m.tracksCount} тр. / {m.albumsCount} альб.</strong>
                                {' · '}Хитов: <strong className="text-white">{m.topHitsCount}</strong>
                                {' · '}Ср. оценка: <strong className="text-white">{m.avgQuality}</strong>
                                {' · '}Своих дропов: <strong className="text-amber-300">{m.daysSilent} дн.</strong>
                                {m.daysSilentOverall < m.daysSilent && (
                                  <>
                                    {' · '}С фитами: <strong className="text-emerald-300">{m.daysSilentOverall} дн.</strong>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0 pl-10 lg:pl-0">
                            <div className="flex items-center gap-1.5 tabular-nums">
                              <span className="text-[11px] text-zinc-400">
                                Хайп <strong className="text-white font-mono">{m.hype}</strong>
                              </span>
                              {onAdjustArtistHype && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onAdjustArtistHype(m.artist.id, -5)}
                                    className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-xs font-bold text-zinc-300 cursor-pointer"
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onAdjustArtistHype(m.artist.id, 5)}
                                    className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-xs font-bold text-zinc-300 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRadarAddSemi(m.artist)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.15] border border-white/10 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
                              >
                                + В полуавтомат
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRadarCreateManual(m.artist)}
                                className="px-2.5 py-1.5 rounded-xl theme-bg-accent text-black text-[11px] font-bold hover:opacity-90 cursor-pointer whitespace-nowrap"
                              >
                                Создать
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {radarFilteredArtists.length > radarLimit && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setRadarLimit(prev => prev + 30)}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-zinc-200 cursor-pointer"
                  >
                    Показать ещё ({radarFilteredArtists.length - radarLimit} осталось)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WEEKLY DIGEST & SAFE DATABASE SLOTS */}
          {tab === 'digest' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4 min-w-0">
                <SimDigestPro
                  simState={simState}
                  onExpand={() => setDigestFull(true)}
                  onOpenRelease={onOpenRelease}
                  onOpenArtist={onOpenArtist}
                  onShowAllDrops={w => { setSelectedDigestWeekNumber(w ?? null); setWeeklyDropsFilter('all'); setWeeklyDropsQuery(''); setShowWeeklyDropsModal(true); }}
                />
                <AnimatePresence>
                  {digestFull && (
                    <SimDigestFullscreen
                      key="digest-full"
                      simState={simState}
                      onClose={() => setDigestFull(false)}
                      onOpenRelease={(t, id, w) => { setDigestFull(false); onOpenRelease && onOpenRelease(t, id, w); }}
                      onOpenArtist={id => { setDigestFull(false); onOpenArtist && onOpenArtist(id); }}
                      onShowAllDrops={w => { setDigestFull(false); setSelectedDigestWeekNumber(w ?? null); setWeeklyDropsFilter('all'); setWeeklyDropsQuery(''); setShowWeeklyDropsModal(true); }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="lg:col-span-5 space-y-4 min-w-0">
                <h3 className="text-sm font-extrabold text-white">Сохранение и управление базами</h3>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Сохранить текущий момент симуляции в слот
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slotName}
                      onChange={e => setSlotName(e.target.value)}
                      placeholder="Название сохранения..."
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onSaveSlot(slotName.trim() || `Неделя ${simState.weekNumber}`)}
                      className="px-3.5 py-2 rounded-xl theme-bg-accent text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Сохранить</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={onExportSimJson}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Экспорт JSON</span>
                    </button>
                    <label className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Импорт JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) onImportSimJson(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {simState.undoStack.length > 0 && (
                      <button
                        type="button"
                        onClick={onUndoStep}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Откатить 1 шаг</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onResetToStart}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold text-amber-300 cursor-pointer"
                    >
                      Сбросить к {formatSimDate(simState.startDate)}
                    </button>
                  </div>

                  {(onExportSimSnapshot || onExportSimAsCatalog) && (
                    <div className="pt-3 border-t border-white/[0.06] space-y-2">
                      <p className="text-[11px] font-bold text-zinc-300">Сохранить базу симуляции файлом</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {onExportSimSnapshot && <button type="button" onClick={() => onExportSimSnapshot(false)} className="px-2.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-400/20 text-[11px] font-bold text-violet-200 text-left leading-tight">Снимок симуляции<span className="block text-[10px] font-medium text-violet-300/70">для загрузки в режиме симуляции</span></button>}
                        {onExportSimSnapshot && <button type="button" onClick={() => onExportSimSnapshot(true)} className="px-2.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-400/20 text-[11px] font-bold text-violet-200 text-left leading-tight">Снимок + фото<span className="block text-[10px] font-medium text-violet-300/70">только используемые обложки</span></button>}
                        {onExportSimAsCatalog && <button type="button" onClick={() => onExportSimAsCatalog('light')} className="px-2.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] font-bold text-zinc-100 text-left leading-tight">Как обычная БД · лёгкая<span className="block text-[10px] font-medium text-zinc-500">без фото, формат настроек</span></button>}
                        {onExportSimAsCatalog && <button type="button" onClick={() => onExportSimAsCatalog('full')} className="px-2.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] font-bold text-zinc-100 text-left leading-tight">Как обычная БД · полная<span className="block text-[10px] font-medium text-zinc-500">с фото, формат настроек</span></button>}
                        {onExportSimAsCatalog && <button type="button" onClick={() => onExportSimAsCatalog('media')} className="col-span-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-semibold text-zinc-300">Только фото симуляции (медиа-пак)</button>}
                      </div>
                      <p className="text-[10.5px] text-zinc-500 leading-snug">Снимок открывается через «Импорт JSON» здесь, обычная БД — через импорт в настройках. Картинки без дублей, файл компактный.</p>
                    </div>
                  )}
                  {onRestoreBackup && <AutoBackupPanel kind="both" compact onRestore={onRestoreBackup} />}

                  {onCommitSimToMaster && (
                    <div className="pt-3 border-t border-white/[0.06] space-y-2">
                      {!confirmMasterCommit ? (
                        <button
                          type="button"
                          onClick={() => setConfirmMasterCommit(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Сохранить текущую симуляцию как обычную базу</span>
                        </button>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2.5">
                          <p className="text-[11px] text-emerald-200 leading-relaxed">
                            Текущие артисты, альбомы, треки и чарты симуляции заменят обычную базу данных. Предыдущая база автоматически сохранится в резервный слот.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onCommitSimToMaster(false);
                                setConfirmMasterCommit(false);
                              }}
                              className="px-3 py-1.5 rounded-lg theme-bg-accent text-black text-xs font-bold cursor-pointer"
                            >
                              Сохранить и остаться здесь
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onCommitSimToMaster(true);
                                setConfirmMasterCommit(false);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold cursor-pointer"
                            >
                              Сохранить и выйти в обычную базу
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmMasterCommit(false)}
                              className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-300">Сохранённые слоты ({saveSlots.length})</p>
                  {saveSlots.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-white/10 text-xs text-zinc-500 text-center">
                      Пока нет сохранённых слотов симуляции
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {saveSlots.map(slot => (
                        <div
                          key={slot.id}
                          className="px-3.5 py-2.5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{slot.name}</p>
                            <p className="text-[11px] text-zinc-400 tabular-nums mt-0.5">
                              {formatSimDate(slot.currentDate)} · Нед. {slot.weekNumber} · {slot.tracksCount} тр.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onLoadSlot(slot)}
                              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                            >
                              Загрузить
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSlot(slot.id)}
                              className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative px-5 md:px-6 py-4 border-t border-white/[0.12] bg-zinc-900/75 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(tab === 'semi' || tab === 'auto' || tab === 'manual') && (
              <>
                <span className="text-xs font-medium text-zinc-300">Шаг времени:</span>
                <div className="flex items-center gap-1 p-0.5 bg-black/50 border border-white/10 rounded-xl">
                  {[
                    { days: 7, label: '1 неделя' },
                    { days: 14, label: '2 недели' },
                    { days: 30, label: '1 месяц' }
                  ].map(step => (
                    <button
                      key={step.days}
                      type="button"
                      onClick={() => setAdvanceDays(step.days)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        advanceDays === step.days ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExitSim}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-300 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти в обычную базу</span>
            </button>

            {tab === 'semi' && (
              <button
                type="button"
                onClick={() => {
                  onRunWeek({ proposals, advanceDays });
                  if (!lightMode) setTab('digest');
                }}
                className="px-4 py-2 rounded-xl theme-bg-accent text-black text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 fill-black" />
                <span>Выпустить ({selectedProposalsCount}) и промотать</span>
              </button>
            )}

            {tab === 'auto' && (
              <button
                type="button"
                onClick={() => {
                  const autoProps = generateWeekProposals(
                    simState.artists,
                    simState.albums,
                    simState.tracks,
                    simState.currentDate,
                    autopilot
                  );
                  onRunWeek({
                    proposals: autoProps,
                    advanceDays,
                    autopilotConfig: autopilot,
                    stepsCount: autopilot.weeksCount
                  });
                  setTab('digest');
                }}
                className="px-4 py-2 rounded-xl theme-bg-accent text-black text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 fill-black" />
                <span>
                  {autopilot.weeksCount > 1
                    ? `Запустить (${autopilot.weeksCount} шага подряд)`
                    : 'Запустить автосимуляцию'}
                </span>
              </button>
            )}

            {tab === 'manual' && (
              <button
                type="button"
                onClick={() => {
                  onRunWeek({ manualItems: manualQueue, advanceDays });
                  setManualQueue([]);
                  setTab('digest');
                }}
                className="px-4 py-2 rounded-xl theme-bg-accent text-black text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 fill-black" />
                <span>Провести неделю ({manualQueue.length} в очереди)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {editingProposal && (
        <SimProposalEditorModal
          proposal={editingProposal}
          artists={simState.artists}
          metricsMap={metricsMap}
          onClose={() => setEditingProposal(null)}
          onCreateArtist={onCreateArtist}
          onGenerateArtistBio={onGenerateArtistBio}
          onSave={updated => {
            setProposals(prev => prev.map(p => (p.id === updated.id ? updated : p)));
          }}
        />
      )}

      {semiAddArtistOpen && (
        <SimArtistPickerModal
          isOpen={semiAddArtistOpen}
          onClose={() => setSemiAddArtistOpen(false)}
          title="Добавить артиста в список недели"
          artists={simState.artists}
          metricsMap={metricsMap}
          onRequestCreateNew={
            onCreateArtist
              ? prefillName => {
                  setSemiAddArtistOpen(false);
                  setCreateArtistTarget({ ctx: 'semi_proposal', prefillName });
                }
              : undefined
          }
          onSelect={handleAddArtistProposal}
        />
      )}

      {preferredPickerOpen && (
        <SimArtistPickerModal
          isOpen={preferredPickerOpen}
          onClose={() => setPreferredPickerOpen(false)}
          title="Добавить желаемого автора на неделю"
          artists={simState.artists}
          metricsMap={metricsMap}
          onRequestCreateNew={
            onCreateArtist
              ? prefillName => {
                  setPreferredPickerOpen(false);
                  setCreateArtistTarget({ ctx: 'preferred_author', prefillName });
                }
              : undefined
          }
          onSelect={art => {
            const cur = autopilot.preferredArtistIds || [];
            if (!cur.includes(art.id)) {
              updateAutopilot('preferredArtistIds', [...cur, art.id]);
            }
          }}
        />
      )}

      {createArtistTarget && (
        <SimCreateArtistModal
          isOpen={Boolean(createArtistTarget)}
          initialName={createArtistTarget.prefillName}
          onClose={() => setCreateArtistTarget(null)}
          onGenerateBio={onGenerateArtistBio}
          onCreated={newArt => {
            onCreateArtist?.(newArt);
            const ctx = createArtistTarget.ctx;
            if (ctx === 'semi_proposal') {
              handleAddArtistProposal(newArt);
            } else if (ctx === 'preferred_author') {
              const cur = autopilot.preferredArtistIds || [];
              if (!cur.includes(newArt.id)) {
                updateAutopilot('preferredArtistIds', [...cur, newArt.id]);
              }
            } else if (
              ctx === 'manual_main' ||
              ctx === 'manual_feat' ||
              ctx === 'manual_co' ||
              ctx === 'manual_child_feat'
            ) {
              setCreatedAssignSignal({ seq: Date.now(), ctx, artist: newArt });
            }
          }}
        />
      )}

      {ideaStudioState.open && (
        <SimIdeaStudioModal
          isOpen={ideaStudioState.open}
          onClose={() => setIdeaStudioState({ open: false })}
          simState={simState}
          metricsMap={metricsMap}
          getArtistMetrics={getArtistMetrics}
          autopilot={autopilot}
          initialArtistId={ideaStudioState.artistId}
          manualQueueCount={manualQueue.length}
          onAdjustArtistHype={onAdjustArtistHype}
          onOpenArtist={onOpenArtist}
          onTransferToManual={draft => {
            setIdeaAssignSignal({ seq: Date.now(), draft });
            setIdeaStudioState({ open: false });
            setTab('manual');
          }}
          onQueueManualItem={item => {
            setManualQueue(prev => [...prev, item]);
          }}
          onAddToSemi={prop => {
            setProposals(prev => [prop, ...prev]);
          }}
        />
      )}

      {showWeeklyDropsModal && (() => {
        const recordedDigests: SimWeekDigest[] = [];
        const seenWeeks = new Set<number>();
        const pushDigest = (d?: SimWeekDigest) => {
          if (!d || seenWeeks.has(d.weekNumber)) return;
          seenWeeks.add(d.weekNumber);
          recordedDigests.push(d);
        };
        (simState.digestHistory || []).forEach(pushDigest);
        pushDigest(simState.lastDigest);

        // Also recover earlier sim-generated weeks if they existed before digestHistory was tracked
        const coveredDates = new Set<string>();
        recordedDigests.forEach(d => {
          (d.weeklyDrops || []).forEach(dr => coveredDates.add(dr.id));
        });

        const orphanGroups = new Map<string, SimWeeklyDropSummary[]>();
        const albumTrackCntMap = new Map<string, number>();
        simState.tracks.forEach(tr => {
          if (tr.albumId && tr.albumId !== 'single') {
            albumTrackCntMap.set(tr.albumId, (albumTrackCntMap.get(tr.albumId) || 0) + 1);
          }
        });
        simState.albums.forEach(al => {
          if (!al.simGenerated || coveredDates.has(al.id)) return;
          const dt = al.releaseDate || simState.startDate;
          const arr = orphanGroups.get(dt) || [];
          arr.push({
            id: al.id,
            title: al.title,
            artistName: al.artistName,
            featuredArtist: al.coArtist,
            itemType: 'album',
            plays: al.totalPlays || 0,
            coverUrl: al.coverUrl,
            genre: al.genre,
            trackCount: albumTrackCntMap.get(al.id) || 10
          });
          orphanGroups.set(dt, arr);
        });
        simState.tracks.forEach(tr => {
          if (!tr.simGenerated || coveredDates.has(tr.id)) return;
          if (tr.albumId && tr.albumId !== 'single' && !tr.isSnippet) return;
          const dt = tr.releaseDate || simState.startDate;
          const arr = orphanGroups.get(dt) || [];
          arr.push({
            id: tr.id,
            title: tr.title,
            artistName: tr.artistName,
            featuredArtist: tr.featuredArtist,
            itemType: tr.isSnippet ? 'snippet' : 'track',
            plays: tr.plays || 0,
            coverUrl: tr.coverUrl,
            genre: tr.genre
          });
          orphanGroups.set(dt, arr);
        });

        let syntheticWeekNum = Math.max(0, (recordedDigests[recordedDigests.length - 1]?.weekNumber || simState.weekNumber) - 1);
        Array.from(orphanGroups.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .forEach(([dt, drops]) => {
            while (seenWeeks.has(syntheticWeekNum) && syntheticWeekNum > -999) syntheticWeekNum--;
            seenWeeks.add(syntheticWeekNum);
            recordedDigests.push({
              weekNumber: Math.max(1, syntheticWeekNum),
              fromDate: dt,
              toDate: dt,
              newReleasesCount: drops.filter(x => x.itemType !== 'snippet').length,
              newSnippetsCount: drops.filter(x => x.itemType === 'snippet').length,
              topListenersGainers: [],
              topListenersLosers: [],
              highlights: [],
              weeklyDrops: drops
            });
          });

        const sortedWeeks = recordedDigests
          .filter(d => (d.weeklyDrops || []).length > 0 || d.weekNumber === simState.lastDigest?.weekNumber)
          .sort((a, b) => b.weekNumber - a.weekNumber || b.toDate.localeCompare(a.toDate));

        if (sortedWeeks.length === 0) return null;

        const activeWeekIdx = Math.max(
          0,
          sortedWeeks.findIndex(w => w.weekNumber === selectedDigestWeekNumber)
        );
        const activeDigest = sortedWeeks[activeWeekIdx] || sortedWeeks[0];

        const liveAlbumMap = new Map<string, Album>();
        simState.albums.forEach(a => liveAlbumMap.set(a.id, a));
        const liveTrackMap = new Map<string, Track>();
        simState.tracks.forEach(t => liveTrackMap.set(t.id, t));

        const q = weeklyDropsQuery.trim().toLowerCase();
        const enrichedDrops = (activeDigest.weeklyDrops || [])
          .map(drop => {
            const liveAlb = drop.itemType === 'album' ? liveAlbumMap.get(drop.id) : undefined;
            const liveTrk = drop.itemType !== 'album' ? liveTrackMap.get(drop.id) : undefined;
            const livePlays = liveAlb?.totalPlays ?? liveTrk?.plays ?? drop.plays ?? 0;
            const liveCover = liveAlb?.coverUrl || liveTrk?.coverUrl || drop.coverUrl;
            const ratingScore = liveAlb?.rating?.totalScore ?? liveTrk?.rating?.totalScore;
            const likes = liveTrk?.likes;
            const duration = liveTrk?.duration;
            return {
              ...drop,
              livePlays,
              liveCover,
              ratingScore,
              likes,
              duration,
              canNavigate: Boolean(liveAlb || liveTrk)
            };
          })
          .filter(d => {
            if (weeklyDropsFilter !== 'all' && d.itemType !== weeklyDropsFilter) return false;
            if (q) {
              const hay = `${d.title} ${d.artistName} ${d.featuredArtist || ''} ${d.genre || ''}`.toLowerCase();
              if (!hay.includes(q)) return false;
            }
            return true;
          })
          .sort((a, b) => {
            if (weeklyDropsSort === 'title') return a.title.localeCompare(b.title);
            if (weeklyDropsSort === 'type') {
              const order = { album: 0, track: 1, snippet: 2 };
              return order[a.itemType] - order[b.itemType] || b.livePlays - a.livePlays;
            }
            return b.livePlays - a.livePlays;
          });

        const hasPrev = activeWeekIdx < sortedWeeks.length - 1;
        const hasNext = activeWeekIdx > 0;

        return (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowWeeklyDropsModal(false)} />
            <div className="relative w-full max-w-5xl bg-zinc-950 border border-white/12 rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
              {/* Top Header & Week Stepper */}
              <div className="px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-zinc-900/40 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                      Релизы недели {activeDigest.weekNumber}
                    </h3>
                    <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                      {activeDigest.fromDate === activeDigest.toDate
                        ? formatSimDate(activeDigest.fromDate)
                        : `${formatSimDate(activeDigest.fromDate)} — ${formatSimDate(activeDigest.toDate)}`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                    {(activeDigest.weeklyDrops || []).length} релизов · Нажмите на карточку, чтобы открыть страницу
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!hasPrev}
                    onClick={() => hasPrev && setSelectedDigestWeekNumber(sortedWeeks[activeWeekIdx + 1].weekNumber)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap ${
                      hasPrev
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-white cursor-pointer'
                        : 'bg-zinc-900/40 border-white/5 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Прошлая</span>
                  </button>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={() => hasNext && setSelectedDigestWeekNumber(sortedWeeks[activeWeekIdx - 1].weekNumber)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap ${
                      hasNext
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-white cursor-pointer'
                        : 'bg-zinc-900/40 border-white/5 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Следующая</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWeeklyDropsModal(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Week Timeline + Filter Controls */}
              <div className="px-5 sm:px-6 py-3 border-b border-white/[0.06] bg-zinc-950 space-y-3">
                {sortedWeeks.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {sortedWeeks.map(wk => {
                      const isActive = wk.weekNumber === activeDigest.weekNumber;
                      return (
                        <button
                          key={`${wk.weekNumber}_${wk.toDate}`}
                          type="button"
                          onClick={() => setSelectedDigestWeekNumber(wk.weekNumber)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors border tabular-nums ${
                            isActive
                              ? 'theme-bg-accent text-black border-transparent font-bold'
                              : 'bg-zinc-900/70 text-zinc-400 border-white/[0.08] hover:text-white hover:border-white/20'
                          }`}
                        >
                          Нед. {wk.weekNumber} · {(wk.weeklyDrops || []).length}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
                    {[
                      { id: 'all', label: 'Все' },
                      { id: 'album', label: 'Альбомы' },
                      { id: 'track', label: 'Синглы' },
                      { id: 'snippet', label: 'Сниппеты' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setWeeklyDropsFilter(f.id as typeof weeklyDropsFilter)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          weeklyDropsFilter === f.id ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={weeklyDropsQuery}
                        onChange={e => setWeeklyDropsQuery(e.target.value)}
                        placeholder="Поиск релиза или артиста..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/25"
                      />
                    </div>
                    <select
                      value={weeklyDropsSort}
                      onChange={e => setWeeklyDropsSort(e.target.value as typeof weeklyDropsSort)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-200 outline-none cursor-pointer"
                    >
                      <option value="plays">По прослушиваниям</option>
                      <option value="type">Сначала альбомы</option>
                      <option value="title">По названию</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cover-First Grid of Release Cards */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                {enrichedDrops.length === 0 ? (
                  <div className="py-16 text-center text-sm text-zinc-500">
                    В этой неделе по выбранным фильтрам релизов не найдено
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {enrichedDrops.map(drop => (
                      <button
                        key={drop.id}
                        type="button"
                        disabled={!drop.canNavigate || !onOpenRelease}
                        onClick={() => {
                          if (drop.canNavigate && onOpenRelease) {
                            setShowWeeklyDropsModal(false);
                            onOpenRelease(drop.itemType, drop.id, activeDigest.weekNumber);
                          }
                        }}
                        className={`group flex flex-col text-left rounded-2xl p-2.5 bg-zinc-900/50 border border-white/[0.07] transition-all ${
                          drop.canNavigate && onOpenRelease
                            ? 'hover:bg-zinc-900 hover:border-white/20 cursor-pointer'
                            : 'opacity-80 cursor-default'
                        }`}
                      >
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-white/[0.06] mb-3">
                          <CoverArt
                            url={drop.liveCover}
                            title={drop.title}
                            albumTitle={drop.itemType === 'album' ? drop.title : undefined}
                            className="w-full h-full"
                            innerClassName="group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold text-white/95 tabular-nums">
                            <span>{formatCompact(drop.livePlays)}</span>
                            {drop.canNavigate && onOpenRelease && (
                              <span className="w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="w-3.5 h-3.5 theme-accent" />
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 truncate w-full">
                          {drop.itemType === 'album'
                            ? `Альбом · ${drop.trackCount || 10} тр.`
                            : drop.itemType === 'snippet'
                              ? 'Сниппет'
                              : 'Сингл'}
                          {drop.genre ? ` · ${drop.genre}` : ''}
                        </p>

                        <h4 className="text-sm font-bold text-white truncate w-full mt-0.5 group-hover:theme-accent transition-colors">
                          {drop.title}
                        </h4>

                        <p className="text-xs text-zinc-400 truncate w-full mt-0.5">
                          {drop.artistName}
                          {drop.featuredArtist ? ` feat. ${drop.featuredArtist}` : ''}
                        </p>

                        <div className="mt-2 pt-2 border-t border-white/[0.06] w-full flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
                          <span>{formatNumber(drop.livePlays)}</span>
                          {drop.ratingScore ? (
                            <span className="text-zinc-300 font-semibold">{drop.ratingScore}★</span>
                          ) : drop.duration ? (
                            <span>{drop.duration}</span>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Visual Showcase Modal for Manual Weekly Queue */}
      {showQueueShowcase && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowQueueShowcase(false)} />
          <div
            className="relative w-full max-w-5xl max-h-[88vh] bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Витрина очереди недели ({manualQueue.length})
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5 tabular-nums">
                  Пятница дропов · Треков: {manualQueue.reduce((acc, q) => acc + (q.itemType === 'album' ? q.albumTracks?.length || q.albumTracksCount || 10 : 1), 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQueueShowcase(false)}
                className="p-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.15] text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
              {manualQueue.length === 0 ? (
                <div className="py-16 text-center text-sm text-zinc-400">Очередь пока пуста</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {manualQueue.map(item => {
                    const stratSpec = getPromoStrategyConfig(item.promoStrategy);
                    const estMetrics = metricsMap.get(item.artistId);
                    const estArt = simState.artists.find(a => a.id === item.artistId);
                    const forecast =
                      item.plays && item.plays > 0
                        ? item.plays
                        : estArt
                          ? forecastReleasePlays({
                              artist: estArt,
                              featuredNames: item.featuredArtist,
                              allArtists: simState.artists,
                              itemType: item.itemType,
                              qualityScore: estMetrics?.avgQuality || 72,
                              hype: estMetrics?.hype || 60,
                              hasWarmup: Boolean(estMetrics?.activeSnippet),
                              promoStrategy: item.promoStrategy,
                              releaseHype: item.releaseHype,
                              albumTracksCount: item.albumTracks?.length || item.albumTracksCount || 10,
                              hitsCount: estMetrics?.topHitsCount || 0,
                              catalogAvgPlays: estMetrics?.catalogAvgPlays || 0,
                              deterministic: true
                            })
                          : 350_000;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-zinc-900/75 border border-white/10 hover:border-white/25 transition-all flex flex-col gap-3"
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
                          <CoverArt
                            url={item.coverUrl}
                            title={item.title}
                            albumTitle={item.itemType === 'album' ? item.title : undefined}
                            className="w-full h-full"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-bold text-white tabular-nums">
                            <span>
                              {item.itemType === 'album'
                                ? `Альбом · ${item.albumTracks?.length || item.albumTracksCount || 10} тр.`
                                : item.itemType === 'snippet'
                                  ? 'Сниппет'
                                  : 'Сингл'}
                            </span>
                            <span>{formatCompact(forecast)}</span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="text-sm font-extrabold text-white truncate">{item.title}</h4>
                            {item.isExplicit && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-700 text-[10px] font-bold text-white shrink-0">
                                E
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 truncate">
                            {item.artistName}
                            {item.coArtist ? ` & ${item.coArtist}` : ''}
                            {item.featuredArtist ? ` feat. ${item.featuredArtist}` : ''}
                          </p>
                          {(stratSpec || typeof item.releaseHype === 'number' || item.genre) && (
                            <p className="text-xs text-zinc-400 truncate tabular-nums">
                              {[
                                item.genre,
                                stratSpec?.shortLabel,
                                typeof item.releaseHype === 'number' ? `Хайп ${item.releaseHype}` : null
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
                          <button
                            type="button"
                            onClick={() => {
                              handleEditQueuedManualItem(item);
                              setShowQueueShowcase(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Изменить</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualQueue(prev => prev.filter(x => x.id !== item.id))}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Убрать из очереди"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowQueueShowcase(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Вернуться к редактору
              </button>
              {manualQueue.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowQueueShowcase(false);
                    onRunWeek({ manualItems: manualQueue, advanceDays });
                    setManualQueue([]);
                    setTab('digest');
                  }}
                  className="px-5 py-2.5 rounded-xl theme-bg-accent text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <FastForward className="w-4 h-4 fill-black" />
                  <span>Провести неделю ({manualQueue.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};