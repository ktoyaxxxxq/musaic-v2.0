// ============================================================================
// MUSAIC SOCIAL v2 — текстовая лента: в основном пишут исполнители, иногда
// инсайдеры, издания, паблики с мемами, лейблы и (редко) знаменитости.
// Голос автора, контекст каталога (релизы, анонсы, чарт, премии), опросы,
// комментарии по смыслу поста, реалистичные лайки, живая лента в симуляции.
// ============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Repeat2, Share2, ChevronLeft, ChevronRight, Sparkles, Trash2, BadgeCheck, Send, Shuffle, Search, X, Pause, Play, TrendingUp, Settings2, Pin } from 'lucide-react';
import type { Artist, Album, Track, AwardItem, ViewType } from './types';
import { CoverArt } from './App';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const DAY = 864e5;
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (ms: number) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const msOf = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const fmtDate = (iso: string) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const norm = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const fmtK = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',')} млн` : n >= 1e4 ? `${Math.round(n / 1e3)} тыс.` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace('.', ',')} тыс.` : String(Math.round(n));
const lsGet = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } };
type R = () => number;
const pick = <T,>(r: R, a: T[]): T => a[Math.floor(r() * a.length)];
const wpick = <T,>(r: R, a: Array<[T, number]>): T => { const tot = a.reduce((s, x) => s + Math.max(0, x[1]), 0); let x = r() * tot; for (const [v, w] of a) { x -= Math.max(0, w); if (x <= 0) return v; } return a[a.length - 1][0]; };
const slug = (s: string) => norm(s).replace(/[^a-zа-яё0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 18) || 'user';

// ---------------------------------------------------------------------------
// personas
// ---------------------------------------------------------------------------
type Kind = 'artist' | 'insider' | 'media' | 'label' | 'page' | 'celeb';
type Style = 'hype' | 'calm' | 'ironic' | 'aggressive' | 'poetic' | 'official' | 'mysterious' | 'minimal';
export interface Persona {
  id: string; name: string; handle: string; kind: Kind; verified: boolean; followers: number; hue: number; style: Style; bio: string;
  avatar?: string; artistId?: string; genre?: string; hype?: number; lower?: boolean; emoji?: string[]; sign?: string; cryptic?: number
}
const KIND_RU: Record<Kind, string> = { artist: 'Артист', insider: 'Инсайдер', media: 'Издание', label: 'Лейбл', page: 'Паблик', celeb: 'Личность' };
type Ext = [string, string, Kind, number, Style, string, boolean?];
const EXT: Ext[] = [
  // insiders: many different names so posts do not come from the same accounts
  ['Кухня рэпа', 'rap_kitchen', 'insider', 870e3, 'calm', 'Инсайды. Источники не раскрываем'], ['Слив Слива', 'sliv_sliva', 'insider', 420e3, 'ironic', 'Сливаем раньше, чем вы проснулись'],
  ['Тихий A&R', 'quiet_anr', 'insider', 96e3, 'calm', 'Работаю в индустрии. Без имён'], ['Студия 47', 'studio47_leaks', 'insider', 210e3, 'mysterious', 'Кто пишется — мы знаем'],
  ['Вова Инсайд', 'vova_insider', 'insider', 330e3, 'hype', 'Первым узнаёшь — первым пишешь'], ['Закулисье', 'zakulisye', 'insider', 560e3, 'calm', 'Что происходит за кадром'],
  ['Дистро-утечки', 'distro_leaks', 'insider', 150e3, 'official', 'Видим релизы до релиза'], ['Звукач Анонимно', 'zvukach_anon', 'insider', 64e3, 'ironic', 'Свожу ваших любимых артистов'],
  ['Мира Слухи', 'mira.rumors', 'insider', 280e3, 'hype', 'Слухи, которые сбываются'], ['Источник №5', 'source_n5', 'insider', 88e3, 'mysterious', 'Иногда ошибаюсь. Редко'],
  ['Контракт Ньюс', 'contract_news', 'insider', 190e3, 'official', 'Подписания и уходы с лейблов'], ['Ночной Продюсер', 'night_prod', 'insider', 120e3, 'calm', 'Продюсер. Видел многое'],
  // media
  ['Пульс', 'puls_media', 'media', 2.4e6, 'official', 'Главные музыкальные новости', true], ['Звук.Журнал', 'zvuk_journal', 'media', 1.3e6, 'calm', 'Длинные тексты о музыке', true],
  ['Рэп-Обзор', 'rap_obzor', 'media', 3.1e6, 'ironic', 'Рэп без цензуры', true], ['NOISE', 'noise.mag', 'media', 640e3, 'aggressive', 'Мы не любим всё подряд', true],
  ['Хайп-Радар', 'hyperadar', 'media', 1.9e6, 'hype', 'Кто взлетел, кто упал', true], ['Чарт-Аналитика', 'chart_data', 'media', 510e3, 'official', 'Цифры, графики, рекорды', true],
  ['Волна', 'volna_fm', 'media', 880e3, 'poetic', 'Радио и подкасты', true], ['Сабвуфер', 'subwoofer', 'media', 430e3, 'calm', 'Обзоры и интервью', true],
  // labels / agencies
  ['Северный Ветер Records', 'northwind.rec', 'label', 980e3, 'official', 'Независимый лейбл', true], ['Gold Vault', 'goldvault', 'label', 2.2e6, 'hype', 'Мейджор', true],
  ['Неон Саунд', 'neon_sound', 'label', 720e3, 'poetic', 'Звук ночного города', true], ['808 Collective', '808collective', 'label', 450e3, 'aggressive', 'Андеграунд', true],
  ['Monolith Music', 'monolith', 'label', 1.5e6, 'official', 'Большие релизы', true], ['Пиар-агентство «Шум»', 'shum_pr', 'label', 160e3, 'ironic', 'Делаем шум'],
  // meme pages
  ['Бит в голове', 'bit_v_golove', 'page', 1.7e6, 'ironic', 'Мемы про музыку'], ['Фан-база 24/7', 'fanbase247', 'page', 560e3, 'hype', 'Сливы, фан-арты, хайп'],
  ['Олдскул ТВ', 'oldschool.tv', 'page', 330e3, 'calm', 'Раньше было лучше?'], ['Строчки', 'strochki', 'page', 780e3, 'poetic', 'Лучшие строчки недели'],
  ['Мемы 808', 'memes808', 'page', 940e3, 'ironic', 'Смешно, но больно'], ['Рэп-Цитатник', 'rap_quotes', 'page', 410e3, 'poetic', 'Цитаты без контекста'],
  // celebs (rare)
  ['Алина Вэйв', 'alinawave', 'celeb', 8.4e6, 'hype', 'Блогер', true], ['Макс Стрелков', 'strelkov', 'celeb', 5.2e6, 'calm', 'Актёр', true],
  ['Игорь «Шторм» Лебедев', 'shtorm_mma', 'celeb', 4.1e6, 'aggressive', 'Боец ММА', true], ['Лера Пикчерс', 'lera.pictures', 'celeb', 690e3, 'poetic', 'Режиссёр клипов', true],
  ['Ника Ночь', 'nika.night', 'celeb', 950e3, 'hype', 'Диджей', true], ['Стас Стримит', 'stas_live', 'celeb', 2.9e6, 'ironic', 'Стример', true]
];
const EMOJI: Record<Style, string[]> = { hype: ['🔥', '🚀', '💥', '⚡️', '❤️‍🔥', '😤'], calm: ['🤍', '🌙', '☁️'], ironic: ['🙃', '🍿', '😏', '🤡'], aggressive: ['🩸', '⚔️', '😈', '🖕🏻'], poetic: ['🌒', '🕯', '🥀', '✨'], official: ['🎧', '📀'], mysterious: ['🌑', '⏳', '🗝', '👁'], minimal: ['.', '—'] };
function artistTraits(a: Artist): Pick<Persona, 'style' | 'lower' | 'emoji' | 'sign' | 'cryptic'> {
  const h = hash(a.id + a.name); const f = a.followers || 0; const g = norm(a.genre); const r = rng(h);
  let style: Style;
  if (f > 6e6) style = wpick(r, [['official', 3], ['calm', 3], ['mysterious', 2], ['hype', 1], ['minimal', 2]]);
  else if (/drill|дрилл|phonk|фонк|trap|трэп/.test(g)) style = wpick(r, [['aggressive', 3], ['hype', 3], ['ironic', 2], ['mysterious', 1], ['minimal', 1]]);
  else if (/indie|инди|r&b|rnb|soul|соул|alt|альт|pop|поп/.test(g)) style = wpick(r, [['poetic', 3], ['calm', 3], ['mysterious', 2], ['minimal', 2], ['ironic', 1]]);
  else style = wpick(r, [['hype', 2], ['calm', 2], ['ironic', 2], ['poetic', 1], ['aggressive', 1], ['mysterious', 1], ['minimal', 1]]);
  const lower = style === 'calm' || style === 'minimal' || style === 'poetic' ? r() < 0.6 : r() < 0.15;
  const sign = r() < 0.22 ? pick(r, ['🖤', '🌑', '.', '— ' + a.name.split(' ')[0].toLowerCase(), '🕊', '♾', '🥀', '💿']) : undefined;
  const cryptic = style === 'mysterious' ? 0.35 : style === 'minimal' ? 0.25 : f > 3e6 ? 0.12 : 0.05;
  return { style, lower, emoji: EMOJI[style], sign, cryptic };
}
function buildPersonas(artists: Artist[]): Persona[] {
  const ext: Persona[] = EXT.map(([name, handle, kind, followers, style, bio, verified]) => ({ id: `x:${handle}`, name, handle, kind, followers, style, bio, verified: Boolean(verified), hue: hash(handle) % 360, emoji: EMOJI[style] }));
  const arts: Persona[] = artists.map(a => ({
    id: `a:${a.id}`, name: a.name, handle: slug(a.name), kind: 'artist', verified: Boolean(a.verified) || (a.followers || 0) > 1e6, followers: a.followers || 50_000,
    hue: hash(a.id) % 360, bio: a.genre || 'Артист', avatar: a.imageUrl, artistId: a.id, genre: a.genre, hype: a.hype, ...artistTraits(a)
  }));
  return [...arts, ...ext];
}

// ---------------------------------------------------------------------------
// post model
// ---------------------------------------------------------------------------
type PType = 'release' | 'announce' | 'countdown' | 'teaser' | 'cryptic' | 'cover' | 'tracklist' | 'thanks' | 'milestone' | 'chart' | 'award' | 'studio' | 'emotion' | 'life' | 'opinion'
  | 'lyric' | 'poll' | 'throwback' | 'respect' | 'subtweet' | 'beef' | 'collab' | 'tour' | 'merch' | 'delay' | 'producer' | 'city' | 'night'
  | 'news' | 'insider' | 'leak' | 'signing' | 'meme' | 'review' | 'record' | 'celeb';
export const TYPE_RU: Record<PType, string> = {
  release: 'Релиз', announce: 'Анонс', countdown: 'Отсчёт', teaser: 'Прогрев', cryptic: 'Загадка', cover: 'Обложка', tracklist: 'Треклист', thanks: 'Спасибо', milestone: 'Рубеж', chart: 'Чарт', award: 'Премия',
  studio: 'Студия', emotion: 'Эмоции', life: 'Жизнь', opinion: 'Мнение', lyric: 'Строчка', poll: 'Опрос', throwback: 'Ностальгия', respect: 'Респект', subtweet: 'Намёк', beef: 'Биф',
  collab: 'Коллаб', tour: 'Концерты', merch: 'Мерч', delay: 'Перенос', producer: 'Продюсер', city: 'Город', night: 'Ночь', news: 'Новость', insider: 'Инсайд', leak: 'Утечка',
  signing: 'Подписание', meme: 'Мем', review: 'Рецензия', record: 'Рекорд', celeb: 'Реакция'
};
const TYPE_GROUP: Record<string, PType[]> = {
  'Релизы': ['release', 'announce', 'countdown', 'teaser', 'cover', 'tracklist', 'delay'], 'Загадки': ['cryptic', 'lyric', 'night'], 'Инсайды': ['insider', 'leak', 'signing'],
  'Бифы': ['beef', 'subtweet'], 'Мемы': ['meme'], 'Респект': ['respect', 'collab', 'producer'], 'Жизнь': ['emotion', 'life', 'opinion', 'studio', 'city', 'tour', 'merch'],
  'Чарт и премии': ['chart', 'award', 'record', 'milestone', 'thanks', 'review'], 'Опросы': ['poll'], 'Новости': ['news', 'celeb', 'throwback']
};
interface Comment { id: string; author: string; text: string; likes: number }
/** a date/release the author hinted at — can be confirmed and sent to the calendar / simulation */
export interface Claim { artistId: string; artistName: string; kind: 'single' | 'ep' | 'album' | 'snippet'; date: string; title?: string; feat?: string }
export interface ConfirmedRumor extends Claim { id: string; postId: string; source: string; text: string; createdAt: number; used?: 'semi' | 'manual' }
export const CONFIRMED_LS = 'musaic.rumors.confirmed';
export const loadConfirmed = (): ConfirmedRumor[] => { try { return JSON.parse(localStorage.getItem(CONFIRMED_LS) || '[]'); } catch { return []; } };
export const saveConfirmed = (l: ConfirmedRumor[]) => { try { localStorage.setItem(CONFIRMED_LS, JSON.stringify(l.slice(-200))); window.dispatchEvent(new Event('musaic-confirmed')); } catch { /* */ } };
const ANN_KEY = 'musaic.announcements';
const CLAIM_RU: Record<Claim['kind'], string> = { single: 'Сингл', ep: 'EP', album: 'Альбом', snippet: 'Сниппет' };
interface Attach { kind: 'track' | 'album'; id: string; title: string; artist: string; cover?: string; label: string }
export interface Post {
  id: string; author: string; date: string; time: string; type: PType; text: string; big?: boolean;
  attach?: Attach; poll?: { q?: string; options: string[]; votes: number[] }; mentions: string[]; claim?: Claim;
  likes: number; reposts: number; comments: Comment[]; commentsTotal: number; user?: boolean; fresh?: number; topic?: string
}

// ---------------------------------------------------------------------------
// text banks (artist voice first; style variants override the generic pool)
// ---------------------------------------------------------------------------
type Bank = Partial<Record<Style | 'any', string[]>>;
const B: Partial<Record<PType, Bank>> = {
  release: {
    any: ['«{t}» уже везде', '«{t}» вышел. Слушайте целиком', 'это «{t}». спасибо, что ждали', '«{t}» — на всех площадках', 'Наконец-то. «{t}»', '«{t}» — ваш', 'Вышло. «{t}»', 'Новый {kind}. «{t}». Громко'],
    hype: ['«{t}» ВЫШЕЛ!!! РАЗНОСИМ', 'НАКОНЕЦ-ТО «{t}» НА ВСЕХ ПЛОЩАДКАХ', 'кто ещё не слушал «{t}» — бегом', '«{t}» — лучшее, что я делал. ВКЛЮЧАЙТЕ'],
    calm: ['вышел «{t}». слушайте по порядку', 'долго шли к этому. «{t}» теперь ваш', '«{t}». без лишних слов', 'спасибо всем, кто был рядом, пока делался «{t}»'],
    poetic: ['«{t}» — то, что я не мог сказать вслух', 'ночь, наушники и «{t}»', 'каждый трек «{t}» — кусочек прошлого года', '«{t}» звучит как письмо, которое я не отправил'],
    aggressive: ['«{t}» вышел. хейтеры — в очередь', 'без разговоров. «{t}»', '«{t}». кто не понял — поймёт', 'Я СКАЗАЛ, ЧТО ВЫЙДЕТ. «{t}»'],
    ironic: ['выпустил «{t}», иду читать ваши разборы', '«{t}». да, опять гениально', 'ну что, «{t}» вышел, можете начинать спорить', 'мама, я выпустил «{t}»'],
    official: ['Релиз «{t}» уже на всех площадках.', 'Встречайте: «{t}». Спасибо команде', 'Сегодня вышел {kind} «{t}»'],
    mysterious: ['«{t}»', 'открыто. «{t}»', 'глава закрыта. «{t}»'], minimal: ['«{t}»', 'вышло.', '{t}.']
  },
  announce: {
    any: ['новый альбом выйдет {d}', 'сингл — {d}. запомните', '{d}. новый трек', 'EP почти готов. ориентир — {d}', 'в эту пятницу?', 'дата: {d}', 'новый трек на этой неделе', 'альбом в этом году. ориентир — {d}', 'фит с @{a2} — {d}', 'готовлю сингл. {d}', 'сниппет завтра, трек — {d}', 'всё сведено. {d}'],
    hype: ['{d} НОВЫЙ ТРЕК!!!', 'АЛЬБОМ {d}. ГОТОВЬТЕСЬ'], mysterious: ['{d}', '{d}…', '🗝 {d}', 'альбом. {d}'], minimal: ['{d}.', 'сингл {d}.'], calm: ['новый трек выйдет {d}', 'альбом будет {d}. спасибо, что ждёте']
  },
  countdown: {
    any: ['{n} дн. до «{t}»', '«{t}» · {d}', 'обратный отсчёт: {n}', '{d}. запомните дату', 'через {n} дней всё изменится', '«{t}» выходит {d}. пресейв открыт'],
    hype: ['{n} ДНЕЙ. ГОТОВЫ?', '{d} — ДАТА. «{t}»'], mysterious: ['{n}', '{d}', '⏳ {n}'], minimal: ['{d}.', '{n}.']
  },
  teaser: {
    any: ['кусок из нового. как вам?', 'это будет в «{t}»', 'сниппет «{t}» — ставьте реакции, если ждёте', 'сливать полностью?', 'слушаю это 40-й раз за день', 'не удержался. 15 секунд из «{t}»'],
    hype: ['СНИППЕТ «{t}» 👀 ставьте 🔥 если ждёте', 'это будет бомба. «{t}» скоро'], ironic: ['вы просили — я сделал вид, что не слышал. «{t}» скоро'], mysterious: ['скоро. «{t}»', '«{t}»…']
  },
  cryptic: {
    any: ['…', 'скоро', 'ты знаешь', 'тишина', 'не спрашивайте', 'всё меняется', 'последний раз', 'глава II', 'готово', 'помните это число', '13', '∞', '{d}', '01:13', 'пора', 'это не конец', 'начало', 'НЕТ', 'да.', 'зачем?', '{w}', '{w}.', '{w}…'],
    mysterious: ['🌑', '⏳', '👁', '🗝', '…', 'глава III', 'я вижу вас', 'вы не готовы', 'шаг первый', '{d}', 'вернусь, когда стемнеет'],
    minimal: ['.', '—', 'ок', 'да', 'нет', 'скоро.', '{w}.']
  },
  cover: { any: ['обложка «{t}». что видите?', 'вот так будет выглядеть «{t}»', 'показываю обложку. детали — {d}', 'над этой обложкой работали три месяца'] },
  tracklist: { any: ['треклист «{t}»: {n} треков. один фит пока секрет', 'в «{t}» будет {n} треков. последний — самый личный', 'треклист готов. гостей не скажу', '{n} треков. ни одного проходного'] },
  thanks: { any: ['спасибо за первые сутки «{t}». вы безумные', '{plays} за первые дни. я не верю', 'читаю каждый комментарий про «{t}». спасибо', 'не ожидал такого приёма «{t}»'], aggressive: ['говорили — не залетит. «{t}»: {plays}'], ironic: ['{plays} прослушиваний «{t}». кто это всё вы?'] },
  milestone: { any: ['{num} слушателей в месяц. год назад было в разы меньше', 'нас уже {num}. спасибо', '{num}. просто цифра, но для меня — всё', 'с первого трека до {num}. спасибо, что вы здесь'] },
  chart: { any: ['«{t}» — №{pos} в чарте. это вы', '№{pos}. «{t}». спасибо', 'вижу «{t}» на №{pos} и не верю', 'чарт: №{pos}. дальше — выше'], aggressive: ['№{pos}. кто там сомневался?'], minimal: ['№{pos}.'] },
  award: { any: ['«{nom}» — это для вас 🏆', 'спасибо за «{nom}». не ожидал', '«{nom}». посвящаю всем, кто был рядом', 'награда «{nom}» стоит на полке. работаем дальше'] },
  studio: { any: ['ночь в студии. что-то будет', 'свели первый куплет. мурашки', 'записали то, чего вы не ожидаете', 'студия, 4 утра, бит на повторе', 'новые демки звучат иначе', 'двенадцатый дубль. оставили первый', 'сегодня написал припев за 10 минут. так не бывает', 'в студии с {prod}. ждите'], minimal: ['студия.', 'пишемся.'] },
  emotion: {
    any: ['иногда хочется выключить телефон', 'спасибо, что вы со мной. серьёзно', 'сегодня был хороший день', 'не спал двое суток. оно того стоит', 'скучаю по сцене', 'устал, но счастлив', 'всё будет', 'просто спасибо'],
    hype: ['ЭТО ЛУЧШИЙ ДЕНЬ!!! ЛЮБЛЮ ВАС', 'энергия на максимум'], calm: ['тишина. чай. новые демки', 'просто дышу'], poetic: ['город спит, а у меня в голове припев', 'каждая строчка — письмо, которое я не отправил'],
    aggressive: ['никто не верил. посмотрите сейчас', 'работаю, пока вы спорите'], ironic: ['день 47: всё ещё делаю вид, что альбом почти готов', 'мама спросила про нормальную работу. я выпустил трек']
  },
  life: { any: ['первый раз за год выспался', 'кто знает, где лучшая шаурма в {city}?', 'купил плёночный фотик. ждите странные обложки', 'бегаю по утрам. да, я тоже не верю', 'смотрю старые концерты. ностальгия', 'мой кот послушал новый трек и ушёл. это рецензия', 'сломал телефон. если не отвечаю — вот почему'] },
  opinion: { any: ['альбомы по 25 треков — это не альбомы', 'хороший фит — это когда оба выкладываются, а не один', 'сниппеты убивают сюрприз. но я их всё равно выкладываю', 'жанры больше не существуют', 'чарты — не главное. главное, что вы поёте на концертах', 'лучшие треки пишутся за 20 минут', 'олдскул был честнее. спорьте'], ironic: ['хот тейк: интро на альбоме никто не слушает'] },
  lyric: { any: ['«{line}»', '«{line}» — строчка из нового', 'одна строчка, а сколько смысла: «{line}»'], minimal: ['«{line}»'] },
  poll: { any: ['альбом или сингл?', 'какой мой трек лучший?', 'фит с кем следующий?', 'куда поехать в тур первым?', 'слушаете меня в наушниках или в машине?'] },
  throwback: { any: ['помните «{t}»? будто вчера было', '«{t}» до сих пор звучит свежо?', 'год назад я выпустил «{t}». как вам сейчас?', 'нашёл старые демки «{t}». хотите оригинал?', 'кто со мной с «{t}» — вы лучшие'] },
  respect: { any: ['уважение @{a2}. «{t2}» — шедевр', '@{a2}, как ты это делаешь? «{t2}» на повторе', 'самый недооценённый артист сейчас — @{a2}', 'признаю: «{t2}» от @{a2} лучше всего, что я выпустил в этом году', 'обнял @{a2} на студии. скоро кое-что будет'], official: ['поздравляю @{a2} с «{t2}»'], minimal: ['@{a2} 🤝'] },
  subtweet: { any: ['кто-то слишком много говорит в интервью. не будем показывать пальцем', 'забавно, когда копируют, а потом делают вид, что не знакомы', 'я всё вижу. просто молчу', 'кто понял — тот понял', 'не все друзья — друзья', 'отвечу треком'], mysterious: ['👁', 'вы знаете, о ком я'], minimal: ['ага.', 'ну-ну.'] },
  beef: { any: ['@{a2}, выходи на бит, а не в сторис', '@{a2} — у тебя хуки взяты в аренду', 'ответ будет в треке. @{a2}, жди', '@{a2} опять пишет про меня. приятно, что ты так внимательно слушаешь', 'мой стрим больше, чем весь твой каталог, @{a2}'], calm: ['не хочу ссориться, но @{a2} перешёл черту'] },
  collab: { any: ['@{a2} и я. скоро', 'когда-то мечтал о фите с @{a2}. мечты сбываются', 'студия с @{a2} — отдельный вид искусства', '@{a2}, наш трек уже сведён', 'фит с @{a2} готов. угадаете название?'], mysterious: ['@{a2} 🗝'] },
  tour: { any: ['тур подтверждён. города — скоро', 'вчерашний концерт в {city} — это что-то', 'скоро в {city}', 'солд-аут в {city} за 3 часа', 'фестивальный сезон открыт', 'спасибо, {city}. голос сорван, сердце полное'] },
  merch: { any: ['мерч «{t}» — скоро', 'новый мерч. носите с гордостью', 'сделали худи, в которых не стыдно выйти', 'мерч распродали за ночь. сделаем ещё'] },
  delay: { any: ['простите, «{t}» переносится. хочу сделать идеально', 'релиз сдвигаем. причина — я перфекционист', 'плохая новость: «{t}» позже. хорошая: будет лучше'] },
  producer: { any: ['отдельное спасибо {prod} за бит на «{t}»', '{prod} — гений. без него этого бы не было', 'с {prod} мы сделали что-то новое'] },
  city: { any: ['{city}, я дома', '{city}, вы самые громкие', 'гуляю по {city}. вдохновение на месте', 'каждый раз в {city} как в первый'] },
  night: { any: ['3:47. не сплю', 'ночью всё честнее', 'написал куплет и испугался', 'в такие ночи пишутся альбомы', 'кто тоже не спит?'] },
  news: { any: ['{a} выпустил «{t}». Первые цифры — {plays}', '«{t}» — новый релиз {a}. Делимся впечатлениями', 'Главное за день: {a} — «{t}»', '{a} снова в центре внимания: «{t}» собирает реакции', 'Неделя {a}: релиз, интервью и сотни мемов', '{a} анонсировал «{t}». Выход — {d}', 'В сети обсуждают «{t}»: шедевр или проходняк?'] },
  insider: { any: ['По нашим данным, {a} заканчивает альбом', 'Источники: {a} и {a2} записали совместный трек', 'Говорят, {a} готовит смену звучания', 'Слух: {a} подписывает контракт с {lbl}', 'Инсайд: у {a} 20+ неизданных треков', 'Видели {a} на съёмках клипа. Бюджет — большой', '{a} и {a2} перестали друг на друга подписываться. Совпадение?', '{a} уходит с {lbl}? Переговоры идут неделю', 'Продюсер {prod} работает над новым альбомом {a}', 'У {a} будет совместный EP. С кем — пока молчим', '{a} готовит тур по 20 городам'] },
  leak: { any: ['УТЕЧКА: треклист нового релиза {a} уже у дистрибьютора', 'Дата нового релиза {a} — {d}. Источник надёжный', 'В сеть утёк кусок трека {a} с фитом {a2}', 'Слили обложку «{t}». Похоже на правду', 'Название нового альбома {a} — «{alb}». Не благодарите'] },
  signing: { any: ['Добро пожаловать в семью, @{a}', '{lbl} и {a}: подписали. Подробности скоро', 'Новый артист лейбла — @{a}. Готовьтесь', 'С {a} начинаем новую главу'] },
  meme: { any: ['Когда {a} опять дропнул в пятницу, а ты пятый раз переслушиваешь прошлый релиз', 'Я: сплю\nМозг в 3 ночи: а помнишь строчку {a}?', 'Фанаты {a} каждую пятницу:\n— ну где\n— ну когда\n— ну хоть сниппет', 'POV: ты в пробке и включил «{t}» на всю', 'Слушатели {a} после третьего прослушивания «{t}»: это трек десятилетия', 'Скажи, что ты фанат {a}, не говоря, что ты фанат {a}', '{a}: выпускает трек\nКомменты: а где альбом?', 'Мой бюджет на концерты {a} vs мой реальный бюджет', '«{t}» в 7 утра — это отдельный вид спорта', 'Когда {a} лайкнул твой комментарий: всё, жизнь удалась', 'Никто:\nАбсолютно никто:\n{a}: выкладывает загадочную цифру'] },
  review: { any: ['{outlet}: «{t}» — {score}. Рецензия уже на сайте', 'Наш вердикт по «{t}» от {a}: {score}', '«{t}» — {score}. Сильнее, чем ждали?'] },
  record: { any: ['Рекорд: «{t}» — лучший дебют месяца', '{a} обновил личный рекорд: {plays} за неделю', '«{t}» держится в чарте дольше всех в этом году', 'У {a} сразу несколько треков в Топ-100'] },
  celeb: { any: ['«{t}» от {a} на повторе весь день', 'вышла на ринг под {a}. энергия!', 'кто был на концерте {a}? это было мощно', 'снимаю клип, а в голове «{t}»', 'реакция на «{t}» сегодня на стриме'] }
};
const WORDS = ['Пепел', 'Вода', 'Свет', 'Пусто', 'Зеркало', 'Дом', 'Мост', 'Холод', 'Небо', 'Ключ', 'Тень', 'Шум', 'Сердце', 'Север', 'Код', 'Сон', 'Огонь', 'Луна', 'Пульс', 'Ноль'];
const LINES = ['я падал, но не туда, куда вы ждали', 'в этом городе даже тишина громкая', 'деньги не пахнут, но память пахнет тобой', 'мой страх стал моим битом', 'я не идеален, зато настоящий', 'кто был со мной в подъезде — тот и семья', 'ночь длиннее, чем мои оправдания', 'мы горели так, что стало светло', 'я выбрал путь, где нет навигатора', 'всё, что не сказал, — в этом куплете'];
const CITIES = ['Москве', 'Питере', 'Казани', 'Екатеринбурге', 'Новосибирске', 'Сочи', 'Минске', 'Алматы', 'Краснодаре', 'Самаре', 'Ростове', 'Владивостоке'];
const PRODS = ['Kaze', 'Mars Beat', 'Грусть', 'Nevoy', 'Lowkey Lab', 'Сэнси', 'Ocean Drive', 'Dr. Haze', 'Тимур Кэш', 'Pyramid'];
const POLL: Array<[RegExp, (v: Record<string, string>, tops: string[]) => string[]]> = [
  [/альбом или сингл/, () => ['Альбом', 'Сингл', 'EP']], [/трек лучший/, (_, tops) => (tops.length >= 2 ? tops.slice(0, 4) : ['Новый', 'Старый'])],
  [/фит с кем/, v => [v.a2 || 'С тем самым', 'С андеграундом', 'С поп-звездой']], [/тур/, () => ['Москва', 'Питер', 'Казань', 'Екатеринбург']], [/наушниках/, () => ['Наушники', 'Машина', 'Колонка']]
];
// comments that fit the post
const NICK_A = ['lera', 'tima', 'dasha', 'kirill', 'alya', 'nikita', 'sonya', 'egor', 'vika', 'max', 'liza', 'artem', 'polina', 'denis', 'mila', 'yan', 'katya', 'roma', 'nastya', 'gleb'];
const NICK_B = ['_vibes', '.808', '_music', '02', '_sad', '_luv', 'xx', '_official', '.beats', '_03', '_night', '_fan', '777', '.wav', '_drip'];
const C: Record<string, string[]> = {
  release: ['«{t}» на повторе с утра', 'третий трек — шедевр', 'ждал «{t}» как ничего', 'это лучший твой релиз', 'мурашки на втором куплете', 'слушаю «{t}» в пятый раз', 'кто тоже плакал?', 'ну наконец-то', 'это гимн этого года', 'продакшн 🔥', 'не понял, нужно ещё раз', 'ожидал большего, если честно'],
  announce: ['записал в календарь', 'это точно?', 'сохраню этот пост', 'жду {d}', 'пожалуйста, без переносов', 'фит с кем??'],
  countdown: ['я не доживу', 'пресейв сделан', 'скорее бы {d}', 'считаю дни', 'дайте хоть сниппет'],
  teaser: ['сливай полностью!!!', 'дата?', 'это будет хит', 'залетит в чарт сразу', 'кто на фите??', 'дай ещё 10 секунд', 'уже в голове крутится'],
  cryptic: ['что это значит???', 'альбом?', 'он что-то знает', 'я расшифровал: это дата', 'опять загадки 😭', 'теории в комментах 👇', 'это намёк на {t}?', 'всё, ждём', 'тревожно'],
  chart: ['заслуженно', 'дальше — №1', 'гордимся', 'а должно быть выше', 'это только начало'],
  award: ['заслужил', 'ограбление века, должен был победить {a2}', 'поздравляю!', 'наконец-то оценили'],
  beef: ['🍿🍿🍿', 'ну всё, ждём дисс', 'это было лично', 'кто прав?', 'ответ будет жёстким', 'зачем вы так', '{a2} не ответит', 'помиритесь уже'],
  subtweet: ['это про {a2}?', 'мы все знаем, про кого это', 'ой', 'ахаха понял', 'драма?'],
  insider: ['источник?', 'верим', 'опять фейк', '{a} подтверди', 'если это правда, я в шоке', 'кухня не ошибается', 'жду 3 года'],
  leak: ['удалите, пока не поздно', 'это фейк', 'если правда — топ', 'кто сливает?', 'спасибо за инфу'],
  meme: ['ахахаха', 'я в этом посте и мне норм', '😭😭😭', 'база', 'кто здесь из TikTok?', 'отметь друга', 'админ гений', 'это про меня'],
  poll: ['{o}!!!', 'конечно {o}', 'всё и сразу', 'голосую за {o}'],
  respect: ['🤝🤝', 'фит когда?', 'уважение взаимное', 'лучшие'], collab: ['ЧТО', 'фит года', 'не верю', 'дата???'],
  tour: ['приезжай в {city}', 'билеты уже купил', 'был, это лучший концерт', 'добавь {city}!!!'],
  emotion: ['мы с тобой', 'береги себя', '❤️', 'всё будет хорошо', 'спасибо тебе за музыку'], night: ['не сплю', 'то же самое', 'иди спать 😭', 'пиши альбом'],
  news: ['давно пора', 'кто слушал?', 'неожиданно', 'ну такое', 'ждём'], review: ['слишком низко', 'справедливо', 'критики опять ничего не поняли', 'соглашусь'],
  any: ['🔥', '❤️', 'лучший', 'ждём новое', 'база', '👀']
};

// ---------------------------------------------------------------------------
// index of the catalog
// ---------------------------------------------------------------------------
interface Rel { kind: 'track' | 'album' | 'snippet'; id: string; title: string; artistId: string; artistName: string; cover?: string; plays: number; date: string; feat?: string; n?: number; label?: string; rating?: number }
interface Index {
  personas: Persona[]; byId: Map<string, Persona>; artistP: Persona[]; byKind: Record<Kind, Persona[]>;
  rels: Map<string, Rel[]>; relByDay: Map<string, Rel[]>; tops: Map<string, Track[]>; charted: Map<string, Track[]>;
  awardsByMonth: Map<string, AwardItem[]>; labels: string[]; cum: number[]; actW: number[]
}
interface Catalog { artists: Artist[]; albums: Album[]; tracks: Track[]; awards: AwardItem[] }
function buildIndex(c: Catalog): Index {
  const personas = buildPersonas(c.artists);
  const byId = new Map(personas.map(p => [p.id, p]));
  const byKind = { artist: [], insider: [], media: [], label: [], page: [], celeb: [] } as Record<Kind, Persona[]>;
  personas.forEach(p => byKind[p.kind].push(p));
  const artistP = byKind.artist.sort((a, b) => b.followers - a.followers);
  const rels = new Map<string, Rel[]>(); const relByDay = new Map<string, Rel[]>(); const tops = new Map<string, Track[]>(); const charted = new Map<string, Track[]>();
  const albumCount = new Map<string, number>(); const albumIds = new Set(c.albums.map(a => a.id));
  const add = (r: Rel) => { if (!r.date || r.date.length < 10) return; (rels.get(r.artistId) || rels.set(r.artistId, []).get(r.artistId)!).push(r); (relByDay.get(r.date) || relByDay.set(r.date, []).get(r.date)!).push(r); };
  for (const t of c.tracks) {
    if (t.albumId) albumCount.set(t.albumId, (albumCount.get(t.albumId) || 0) + 1);
    if (!t.isSnippet) { (tops.get(t.artistId) || tops.set(t.artistId, []).get(t.artistId)!).push(t); if (t.peakChartPosition) (charted.get(t.artistId) || charted.set(t.artistId, []).get(t.artistId)!).push(t); }
    if (t.albumId && t.albumId !== 'single' && albumIds.has(t.albumId) && !t.isSnippet) continue;
    add({ kind: t.isSnippet ? 'snippet' : 'track', id: t.id, title: t.title, artistId: t.artistId, artistName: t.artistName, cover: t.coverUrl, plays: t.plays || 0, date: (t.releaseDate || '').slice(0, 10), feat: t.featuredArtist, rating: t.rating?.totalScore });
  }
  for (const a of c.albums) add({ kind: 'album', id: a.id, title: a.title, artistId: a.artistId, artistName: a.artistName, cover: a.coverUrl, plays: a.totalPlays || 0, date: (a.releaseDate || '').slice(0, 10), n: albumCount.get(a.id), label: a.label, rating: a.rating?.totalScore });
  rels.forEach(l => l.sort((x, y) => x.date.localeCompare(y.date)));
  tops.forEach(l => l.sort((x, y) => (y.plays || 0) - (x.plays || 0)));
  const awardsByMonth = new Map<string, AwardItem[]>();
  for (const a of c.awards) { const k = a.periodType === 'year' ? `${a.year}-12` : `${a.year}-${a.month}`; (awardsByMonth.get(k) || awardsByMonth.set(k, []).get(k)!).push(a); }
  const labels = [...new Set([...c.albums.map(a => a.label).filter(Boolean) as string[], ...byKind.label.map(l => l.name)])];
  const actW = artistP.map(p => Math.pow(p.followers, 0.33) * (0.55 + (p.hype ?? 50) / 100));
  const cum: number[] = []; actW.reduce((s, w, i) => (cum[i] = s + w), 0);
  return { personas, byId, artistP, byKind, rels, relByDay, tops, charted, awardsByMonth, labels, cum, actW };
}
const pickArtist = (ix: Index, r: R) => { const tot = ix.cum[ix.cum.length - 1] || 0; const x = r() * tot; let lo = 0, hi = ix.cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (ix.cum[m] < x) lo = m + 1; else hi = m; } return ix.artistP[lo]; };
const upcomingOf = (ix: Index, id: string | undefined, date: string, days = 21) => { if (!id) return undefined; const lim = isoOf(msOf(date) + days * DAY); return (ix.rels.get(id) || []).find(x => x.date > date && x.date <= lim); };
const recentOf = (ix: Index, id: string | undefined, date: string, days: number) => { if (!id) return undefined; const from = isoOf(msOf(date) - days * DAY); const l = (ix.rels.get(id) || []).filter(x => x.date <= date && x.date >= from && x.kind !== 'snippet'); return l[l.length - 1]; };
const attachOf = (rel: Rel, date: string): Attach => ({ kind: rel.kind === 'album' ? 'album' : 'track', id: rel.id, title: rel.title, artist: rel.artistName, cover: rel.cover, label: rel.date > date ? `Скоро · ${fmtDate(rel.date).slice(0, 5)}` : rel.kind === 'album' ? ((rel.n || 10) <= 6 ? 'EP' : 'Альбом') : rel.kind === 'snippet' ? 'Сниппет' : 'Сингл' });

// ---------------------------------------------------------------------------
// one post
// ---------------------------------------------------------------------------
interface Ctx { rel?: Rel; subject?: Persona; other?: Persona; pos?: number; nom?: string; time?: string; outlet?: string; score?: string }
const HOURS: Record<Kind, Array<[number, number]>> = {
  artist: [[11, 1], [13, 1], [15, 1.2], [17, 1.4], [19, 1.8], [21, 2.2], [23, 2], [1, 1.4], [3, 0.7]], insider: [[10, 1], [12, 1.5], [15, 1.5], [18, 1.2], [22, 1]],
  media: [[9, 2], [11, 2], [13, 1.5], [16, 1.5], [19, 1]], label: [[12, 2], [15, 1], [18, 1]], page: [[12, 1], [17, 1.4], [21, 2], [23, 1.4]], celeb: [[14, 1], [20, 1.5], [22, 1]]
};
const TYPE_K: Partial<Record<PType, number>> = { release: 2.1, announce: 1.6, countdown: 1.3, teaser: 1.5, cryptic: 1.6, cover: 1.6, tracklist: 1.5, thanks: 1.2, milestone: 1.5, chart: 1.1, award: 1.6, beef: 2.6, subtweet: 1.7, collab: 1.9, meme: 1.6, leak: 1.4, insider: 1.2, poll: 1.1, delay: 1.3, lyric: 1.2, news: 0.8, review: 0.7, record: 0.9 };
function engagement(p: Persona, type: PType, r: R) {
  const size = Math.max(1000, p.followers);
  const rate = p.kind === 'artist' ? clampN(0.022 * Math.pow(size / 1e5, -0.18), 0.002, 0.05) * (0.55 + (p.hype ?? 50) / 90)
    : p.kind === 'insider' ? 0.012 : p.kind === 'page' ? 0.009 : p.kind === 'celeb' ? 0.006 : 0.0025;
  const noise = Math.exp((r() + r() + r() - 1.5) * 0.75);
  const viral = r() < 0.025 ? 3 + r() * 6 : 1;
  const likes = Math.max(2, Math.round(size * rate * (TYPE_K[type] ?? 1) * noise * viral));
  const ck = type === 'beef' || type === 'subtweet' ? 0.09 : type === 'poll' ? 0.07 : type === 'cryptic' || type === 'insider' || type === 'leak' ? 0.05 : 0.025;
  return { likes, commentsTotal: Math.max(0, Math.round(likes * ck * (0.5 + r()))), reposts: Math.round(likes * (type === 'meme' ? 0.09 : type === 'beef' ? 0.07 : 0.025) * (0.4 + r())) };
}
function clampN(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
function voice(text: string, p: Persona, r: R) {
  let s = text;
  if (p.kind === 'artist') {
    if (p.lower && r() < 0.85) s = s.replace(/^[А-ЯЁA-Z]/, ch => ch.toLowerCase());
    if ((p.style === 'aggressive' || p.style === 'hype') && r() < 0.1) s = s.toUpperCase();
    const ep = p.style === 'hype' ? 0.55 : p.style === 'minimal' || p.style === 'official' ? 0.05 : 0.25;
    if (p.emoji?.length && r() < ep && s.length > 3) s = `${s} ${pick(r, p.emoji)}`;
    if (p.sign && r() < 0.35 && s.length > 8) s = `${s} ${p.sign}`;
  } else if (p.style === 'hype' && r() < 0.3) s = `${s} ${pick(r, EMOJI.hype)}`;
  return s;
}
function bankPick(type: PType, st: Style, r: R) { const b = B[type] || {}; const own = b[st] || []; const pool = [...own, ...own, ...(b.any || [])]; return pool.length ? pick(r, pool) : '…'; }
export function makePost(ix: Index, author: Persona, type: PType, date: string, r: R, ctx: Ctx = {}): Post {
  const subj = ctx.subject || (author.kind === 'artist' ? author : pickArtist(ix, r));
  const tops = subj?.artistId ? ix.tops.get(subj.artistId) || [] : [];
  const rel = ctx.rel;
  const other = ctx.other || (() => { for (let i = 0; i < 6; i++) { const o = pickArtist(ix, r); if (o && o.id !== author.id && o.id !== subj?.id) return o; } return undefined; })();
  const otherTop = other?.artistId ? (ix.tops.get(other.artistId) || [])[0]?.title : '';
  const tMine = tops.filter(t => (t.releaseDate || '') <= date);
  const old = tMine.filter(t => t.releaseDate && msOf(date) - msOf(t.releaseDate.slice(0, 10)) > 300 * DAY);
  const title = rel?.title || (type === 'throwback' ? (old[0] || tMine[0])?.title : tMine[Math.floor(r() * Math.min(4, tMine.length))]?.title) || 'новый трек';
  const nDays = rel && rel.date > date ? Math.round((msOf(rel.date) - msOf(date)) / DAY) : 2 + Math.floor(r() * 12);
  const v: Record<string, string> = {
    t: title, a: rel?.artistName || subj?.name || 'кто-то', me: author.name, a2: other?.name || '', t2: otherTop || 'последний релиз',
    kind: rel?.kind === 'album' ? ((rel.n || 10) <= 6 ? 'EP' : 'альбом') : 'трек', plays: fmtK(rel?.plays || tMine[0]?.plays || 0), pos: String(ctx.pos || ''), nom: ctx.nom || '',
    d: rel ? fmtDate(rel.date).slice(0, 5) : fmtDate(isoOf(msOf(date) + nDays * DAY)).slice(0, 5), n: String(type === 'tracklist' ? rel?.n || 8 + Math.floor(r() * 8) : nDays),
    city: pick(r, CITIES), prod: pick(r, PRODS), num: fmtK(Math.round((author.followers || 1e5) / Math.pow(10, Math.floor(Math.log10(author.followers || 1e5)))) * Math.pow(10, Math.floor(Math.log10(author.followers || 1e5)))),
    line: pick(r, LINES), w: pick(r, WORDS), alb: pick(r, WORDS) + (r() < 0.5 ? '' : ' ' + pick(r, ['II', 'Ночь', 'Север', 'Дом'])), lbl: pick(r, ix.labels.length ? ix.labels : ['мейджором']),
    outlet: ctx.outlet || author.name, score: ctx.score || ''
  };
  let text = fill(bankPick(type, author.style, r), v);
  if (type === 'release' && rel?.feat && r() < 0.6) text += ` · feat. ${rel.feat}`;
  if (author.kind === 'page' && type === 'lyric' && subj) text = `«${v.line}» — ${subj.name}`;
  text = voice(text, author, r);
  const mentions: string[] = [];
  if (text.includes(`@${v.a2}`) && other) mentions.push(other.id);
  if (type === 'signing' && subj) { text = text.replace(`@${v.a}`, `@${subj.name}`); if (text.includes(`@${subj.name}`)) mentions.push(subj.id); }
  let poll: Post['poll'];
  if (type === 'poll') { const m = POLL.find(([re]) => re.test(text.toLowerCase())); const opts = m ? m[1](v, tMine.slice(0, 4).map(t => t.title)) : ['Да', 'Нет']; poll = { options: opts, votes: opts.map((_, i) => Math.round(100 + r() * 900 / (i + 1))) }; }
  const eng = engagement(author, type, r);
  const hour = wpick(r, HOURS[author.kind]) + Math.floor(r() * 2);
  const time = ctx.time || `${pad(hour % 24)}:${pad(Math.floor(r() * 60))}`;
  const ckey = C[type] ? type : 'any';
  const nC = Math.min(eng.commentsTotal, 2 + Math.floor(r() * 3));
  const near = ix.artistP.filter(p => p.id !== author.id && norm(p.genre) === norm(author.genre)).slice(0, 30);
  const comments: Comment[] = Array.from({ length: nC }, (_, i) => {
    const roll = r();
    const reply = author.kind === 'artist' && i === nC - 1 && roll < 0.25;
    const who = reply ? author.id : roll < 0.16 && near.length ? pick(r, near).id : `fan:${pick(r, NICK_A)}${pick(r, NICK_B)}`;
    const txt = reply ? pick(r, ['спасибо 🤝', 'скоро', '🖤', 'увидите', 'люблю вас', 'всё будет', 'тише 🤫']) : fill(pick(r, [...C[ckey], ...(r() < 0.25 ? C.any : [])]), { ...v, o: poll ? pick(r, poll.options) : '' });
    return { id: `c${i}`, author: who, text: txt, likes: Math.round(eng.likes * (0.015 + r() * 0.06) / (i + 1)) };
  });
  let claim: Claim | undefined;
  const claimArtist = author.kind === 'artist' ? author : subj;
  if (claimArtist?.artistId && !rel) {
    const low = text.toLowerCase();
    const kindOf = (): Claim['kind'] => (/альбом/.test(low) ? 'album' : /\bep\b|эп/.test(low) ? 'ep' : /сниппет|кусок/.test(low) && type !== 'announce' ? 'snippet' : 'single');
    const fri = (min: number, span: number) => { let d = msOf(date) + Math.round(min + r() * span) * DAY; for (let i = 0; i < 7 && new Date(d).getUTCDay() !== 5; i++) d += DAY; return isoOf(d); };
    const said = isoOf(msOf(date) + nDays * DAY);
    const feat = text.includes(`@${v.a2}`) || /совместн|фит/.test(low) ? other?.name : undefined;
    if (type === 'announce') claim = { artistId: claimArtist.artistId, artistName: claimArtist.name, kind: kindOf(), date: /пятниц/.test(low) ? fri(1, 0) : /неделе/.test(low) ? fri(1, 0) : said, feat };
    else if ((type === 'cryptic' || type === 'countdown') && text.includes(v.d)) claim = { artistId: claimArtist.artistId, artistName: claimArtist.name, kind: 'single', date: said };
    else if (type === 'insider' || type === 'leak') { const k = kindOf(); claim = { artistId: claimArtist.artistId, artistName: claimArtist.name, kind: k, date: /дата/.test(low) && text.includes(v.d) ? said : k === 'album' ? fri(21, 50) : fri(7, 35), feat, title: type === 'leak' && /альбома .+ — «/.test(text) ? v.alb : undefined }; }
    else if (type === 'collab' && other) claim = { artistId: claimArtist.artistId, artistName: claimArtist.name, kind: 'single', date: fri(10, 35), feat: other.name };
  }
  const big = text.replace(/[\s.…]/g, '').length <= 12 && !rel && type !== 'poll';
  return {
    id: `p${hash(`${author.id}|${type}|${date}|${text}|${time}`)}`, author: author.id, date, time, type, text, big,
    attach: rel && type !== 'cryptic' && type !== 'delay' ? attachOf(rel, date) : undefined, poll, mentions, claim, ...eng, comments,
    topic: rel?.title || (type === 'beef' || type === 'collab' ? `${author.name} × ${other?.name}` : subj?.name)
  };
}

// ---------------------------------------------------------------------------
// one day of the feed
// ---------------------------------------------------------------------------
export interface FeedSettings { density: 'low' | 'normal' | 'high'; mix: 'artists' | 'balanced'; memes: boolean; topComment: boolean; liveSpeed: 'slow' | 'normal' | 'fast'; compact: boolean }
export const DEFAULT_SETTINGS: FeedSettings = { density: 'normal', mix: 'artists', memes: true, topComment: true, liveSpeed: 'normal', compact: false };
function artistType(ix: Index, p: Persona, date: string, r: R): { type: PType; ctx: Ctx } {
  const up = upcomingOf(ix, p.artistId, date, 14);
  const ch = (ix.charted.get(p.artistId || '') || []).filter(t => (t.previousChartPosition || 99) <= 40)[0];
  const aw = (ix.awardsByMonth.get(date.slice(0, 7)) || []).find(a => norm(a.winner.type === 'artist' ? a.winner.title : a.winner.artistName).includes(norm(p.name)));
  const hasOld = (ix.tops.get(p.artistId || '') || []).some(t => t.releaseDate && msOf(date) - msOf(t.releaseDate.slice(0, 10)) > 300 * DAY);
  const ag = p.style === 'aggressive' ? 2.2 : p.style === 'ironic' ? 1.4 : 1;
  const w: Array<[PType, number]> = [
    ['emotion', 2.6], ['studio', 2], ['life', 1.5], ['opinion', 0.9], ['lyric', 1.1], ['poll', 0.9], ['night', 1], ['city', 0.6], ['tour', 0.7], ['merch', 0.35],
    ['respect', 1], ['collab', 0.55], ['subtweet', 0.45 * ag], ['beef', 0.18 * ag], ['producer', 0.45], ['cryptic', (p.cryptic || 0.05) * 14], ['milestone', p.followers > 2e5 ? 0.15 : 0],
    ['announce', up ? 0 : 1.2], ['throwback', hasOld ? 0.8 : 0], ['chart', ch ? 2 : 0], ['award', aw ? 3 : 0], ['countdown', up ? 2.4 : 0], ['teaser', up ? 1.6 : 0], ['cover', up ? 0.7 : 0], ['tracklist', up && up.kind === 'album' ? 1 : 0], ['delay', up ? 0.06 : 0]
  ];
  const type = wpick(r, w);
  const ctx: Ctx = {};
  if (['countdown', 'teaser', 'cover', 'tracklist', 'delay'].includes(type)) ctx.rel = up;
  if (type === 'chart' && ch) { ctx.pos = ch.previousChartPosition; ctx.rel = { kind: 'track', id: ch.id, title: ch.title, artistId: ch.artistId, artistName: ch.artistName, cover: ch.coverUrl, plays: ch.plays, date: (ch.releaseDate || '').slice(0, 10) }; }
  if (type === 'award' && aw) ctx.nom = aw.nominationTitle;
  if (['respect', 'collab', 'subtweet', 'beef'].includes(type)) {
    const near = ix.artistP.filter(o => o.id !== p.id && Math.abs(Math.log10(o.followers) - Math.log10(p.followers)) < 0.7 && (type === 'respect' || norm(o.genre) === norm(p.genre) || r() < 0.35));
    ctx.other = near.length ? pick(r, near.slice(0, 40)) : undefined;
    if (!ctx.other && type !== 'subtweet') return { type: 'emotion', ctx: {} };
  }
  return { type, ctx };
}
function genDay(ix: Index, date: string, seed: number, st: FeedSettings): Post[] {
  if (!ix.artistP.length) return [];
  const r = rng(hash(date) + seed * 9973);
  const out: Post[] = []; const per = new Map<string, number>();
  const push = (p: Post | null, cap = 2) => { if (!p) return; const n = per.get(p.author) || 0; if (n >= cap) return; per.set(p.author, n + 1); out.push(p); };
  const K = ix.byKind;
  const pk = (k: Kind) => (K[k].length ? pick(r, K[k]) : null);
  // 1. today's releases
  for (const rel of (ix.relByDay.get(date) || []).slice(0, 14)) {
    const ap = ix.byId.get(`a:${rel.artistId}`);
    if (ap) push(makePost(ix, ap, rel.kind === 'snippet' ? 'teaser' : 'release', date, r, { rel }), 3);
    if (rel.kind !== 'snippet' && r() < 0.45) { const m = pk('media'); if (m) push(makePost(ix, m, 'news', date, r, { rel, subject: ap })); }
    if (rel.label && r() < 0.35) { const l = K.label.find(x => norm(x.name) === norm(rel.label)) || pk('label'); if (l) push(makePost(ix, l, 'news', date, r, { rel, subject: ap })); }
    if (st.memes && r() < 0.18) { const pg = pk('page'); if (pg) push(makePost(ix, pg, 'meme', date, r, { rel, subject: ap })); }
  }
  // 2. after-release: thanks + reviews
  for (const k of [1, 2, 3]) for (const rel of (ix.relByDay.get(isoOf(msOf(date) - k * DAY)) || []).slice(0, 8)) {
    if (rel.kind === 'snippet') continue;
    const ap = ix.byId.get(`a:${rel.artistId}`);
    if (ap && r() < 0.4 / k) push(makePost(ix, ap, 'thanks', date, r, { rel }), 3);
    if (r() < 0.22) { const m = pk('media'); const base = rel.rating ? (rel.rating / 90) * 10 : 5.6 + r() * 3; if (m) push(makePost(ix, m, 'review', date, r, { rel, subject: ap, score: `${Math.min(9.8, Math.max(3.5, base + (r() - 0.5) * 1.6)).toFixed(1)}/10` })); }
  }
  // 3. the rest of the day
  const base = st.density === 'low' ? 12 : st.density === 'high' ? 34 : 22;
  const n = base + Math.floor(r() * base * 0.4);
  const mix: Array<[Kind, number]> = st.mix === 'artists'
    ? [['artist', 76], ['insider', 9], ['media', 6], ['page', st.memes ? 5 : 0], ['label', 2.5], ['celeb', 1.5]]
    : [['artist', 58], ['insider', 13], ['media', 11], ['page', st.memes ? 9 : 0], ['label', 5], ['celeb', 4]];
  for (let i = 0; i < n; i++) {
    const kind = wpick(r, mix);
    if (kind === 'artist') { const p = pickArtist(ix, r); const { type, ctx } = artistType(ix, p, date, r); push(makePost(ix, p, type, date, r, ctx)); continue; }
    const p = pk(kind); if (!p) continue;
    const subj = pickArtist(ix, r);
    if (kind === 'insider') { const up = upcomingOf(ix, subj.artistId, date, 30); const t: PType = up && r() < 0.5 ? 'leak' : 'insider'; push(makePost(ix, p, t, date, r, { subject: subj, rel: t === 'leak' ? up : undefined })); }
    else if (kind === 'media') { const rec = recentOf(ix, subj.artistId, date, 10); const t = wpick<PType>(r, [['news', rec ? 3 : 0.8], ['record', 0.8], ['insider', 0.6], ['meme', st.memes ? 0.3 : 0]]); push(makePost(ix, p, t, date, r, { subject: subj, rel: t === 'news' || t === 'record' ? rec : undefined })); }
    else if (kind === 'page') push(makePost(ix, p, wpick<PType>(r, [['meme', 5], ['lyric', 1.2], ['throwback', 0.8]]), date, r, { subject: subj }));
    else if (kind === 'label') push(makePost(ix, p, r() < 0.4 ? 'signing' : 'news', date, r, { subject: subj, rel: recentOf(ix, subj.artistId, date, 14) }));
    else push(makePost(ix, p, 'celeb', date, r, { subject: subj }));
  }
  const seen = new Set<string>();
  return out.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
function avatarUri(p: Persona) {
  const ini = p.name.replace(/[«»"']/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const rx = p.kind === 'media' || p.kind === 'insider' ? 26 : p.kind === 'page' ? 30 : 48;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${p.hue},55%,52%)'/><stop offset='1' stop-color='hsl(${(p.hue + 40) % 360},55%,24%)'/></linearGradient></defs><rect width='96' height='96' rx='${rx}' fill='url(#g)'/><text x='48' y='59' text-anchor='middle' font-family='Inter,sans-serif' font-size='${ini.length > 1 ? 32 : 40}' font-weight='800' fill='white' fill-opacity='.92'>${ini.replace(/[<>&']/g, '')}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const Av: React.FC<{ p?: Persona; size?: number }> = ({ p, size = 40 }) => (
  <div className={`shrink-0 overflow-hidden ${p?.kind === 'artist' || p?.kind === 'celeb' || p?.kind === 'label' || !p ? 'rounded-full' : 'rounded-xl'} bg-zinc-800 [&>*]:!w-full [&>*]:!h-full`} style={{ width: size, height: size }}>
    {p?.kind === 'artist' ? <CoverArt url={p.avatar} title={p.name} isArtist className="w-full h-full" innerClassName="w-full h-full object-cover" /> : p ? <img src={avatarUri(p)} alt="" className="w-full h-full" /> : null}
  </div>
);
const TYPE_DOT: Partial<Record<PType, string>> = { release: '#34d399', countdown: '#34d399', teaser: '#34d399', beef: '#f87171', subtweet: '#fb923c', insider: '#a78bfa', leak: '#a78bfa', meme: '#facc15', cryptic: '#94a3b8', award: '#fbbf24', chart: '#38bdf8', poll: '#60a5fa' };
const SORTS: Array<[string, string]> = [['new', 'Свежие'], ['top', 'Топ'], ['hot', 'Обсуждаемые']];
const KINDS: Array<[Kind | 'all', string]> = [['all', 'Все'], ['artist', 'Артисты'], ['insider', 'Инсайдеры'], ['media', 'Издания'], ['page', 'Паблики'], ['label', 'Лейблы'], ['celeb', 'Личности']];
const LIVE_SPEED = { slow: 16000, normal: 9000, fast: 4500 };

export const SocialIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v10H9l-5 4z" /><path d="M8 9h8M8 12h5" /></svg>
);
const Seg: React.FC<{ value: string; options: Array<[string, string]>; onChange: (v: any) => void }> = ({ value, options, onChange }) => (
  <div className="flex p-0.5 rounded-xl bg-white/[0.04]">{options.map(([k, l]) => <button key={k} type="button" onClick={() => onChange(k)} className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold whitespace-nowrap transition-colors ${value === k ? 'bg-white/[0.12] text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>{l}</button>)}</div>
);

export const SocialFeed: React.FC<{
  artists: Artist[]; albums: Album[]; tracks: Track[]; awards: AwardItem[];
  referenceDate?: string; isSim?: boolean;
  navigateTo: (view: ViewType, params?: any) => void;
}> = ({ artists, albums, tracks, awards, referenceDate, isSim, navigateTo }) => {
  const today = referenceDate && /^\d{4}-\d{2}-\d{2}/.test(referenceDate) ? referenceDate.slice(0, 10) : isoOf(Date.now());
  const ix = useMemo(() => buildIndex({ artists, albums, tracks, awards }), [artists, albums, tracks, awards]);
  const [date, setDate] = useState(today);
  const prevToday = useRef(today);
  const [live, setLive] = useState<Post[]>([]);
  useEffect(() => { if (date === prevToday.current) setDate(today); prevToday.current = today; setLive([]); }, [today]); // eslint-disable-line react-hooks/exhaustive-deps
  const [st, setSt] = useState<FeedSettings>(() => ({ ...DEFAULT_SETTINGS, ...lsGet<Partial<FeedSettings>>('musaic.social.settings', {}) }));
  useEffect(() => lsSet('musaic.social.settings', st), [st]);
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [sort, setSort] = useState('new');
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [group, setGroup] = useState<string>('all');
  const [authorF, setAuthorF] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [seed, setSeed] = useState(() => lsGet<number>('musaic.social.seed', 1));
  const [likedArr, setLikedArr] = useState<string[]>(() => lsGet<string[]>('musaic.social.likes', []));
  const liked = useMemo(() => new Set(likedArr), [likedArr]);
  const [votes, setVotes] = useState<Record<string, number>>(() => lsGet('musaic.social.votes', {}));
  const [pins, setPins] = useState<string[]>(() => lsGet<string[]>('musaic.social.pins', []));
  const [userPosts, setUserPosts] = useState<Post[]>(() => lsGet<Post[]>('musaic.social.posts.v2', []));
  const [liveOn, setLiveOn] = useState(true);
  const [openC, setOpenC] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedRumor[]>(() => loadConfirmed());
  useEffect(() => { const f = () => setConfirmed(loadConfirmed()); window.addEventListener('musaic-confirmed', f); return () => window.removeEventListener('musaic-confirmed', f); }, []);
  const confirmedIds = useMemo(() => new Set(confirmed.map(c => c.postId)), [confirmed]);
  const toggleClaim = (post: Post) => {
    const c = post.claim; if (!c) return;
    const anns = lsGet<any[]>(ANN_KEY, []);
    if (confirmedIds.has(post.id)) {
      const ex = confirmed.find(x => x.postId === post.id);
      saveConfirmed(confirmed.filter(x => x.postId !== post.id));
      lsSet(ANN_KEY, anns.filter(a => a.id !== `ann-rum-${ex?.id}`));
      setToast('Слух снова не подтверждён'); return;
    }
    const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    const src = ix.byId.get(post.author)?.name || 'лента';
    saveConfirmed([...confirmed, { ...c, id, postId: post.id, source: src, text: post.text, createdAt: Date.now() }]);
    lsSet(ANN_KEY, [...anns, { id: `ann-rum-${id}`, title: c.title || `${CLAIM_RU[c.kind]} ${c.artistName}`, artistName: c.artistName, artistId: c.artistId, type: c.kind, date: c.date, presaves: 0, createdAt: Date.now(), featuredArtist: c.feat, note: `Слух от ${src}: ${post.text}`, fromRumor: true }]);
    setToast('Подтверждено: слух в календаре и в пульте симуляции');
  };
  useEffect(() => lsSet('musaic.social.likes', likedArr.slice(-3000)), [likedArr]);
  useEffect(() => lsSet('musaic.social.votes', votes), [votes]);
  useEffect(() => lsSet('musaic.social.pins', pins.slice(-100)), [pins]);
  useEffect(() => lsSet('musaic.social.posts.v2', userPosts.slice(-400)), [userPosts]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);

  const isLiveDay = date === today && range === 'day';
  const nowTime = () => { const n = new Date(); return `${pad(n.getHours())}:${pad(n.getMinutes())}`; };
  const freshPost = (p: Post): Post => ({ ...p, id: `u${Date.now()}${Math.floor(Math.random() * 1e4)}`, time: nowTime(), fresh: Date.now() });
  useEffect(() => {
    if (!isLiveDay || !liveOn || !ix.artistP.length) return;
    let alive = true; let timer: any;
    const tick = () => {
      const r = rng(Date.now() & 0x7fffffff);
      const post = genDay(ix, date, Math.floor(r() * 1e6), { ...st, density: 'low' })[Math.floor(r() * 8)];
      if (post && alive) setLive(l => [{ ...freshPost(post), likes: 1 + Math.floor(r() * 30), commentsTotal: Math.floor(r() * 4), reposts: 0, comments: post.comments.slice(0, 1) }, ...l].slice(0, 40));
      timer = setTimeout(tick, LIVE_SPEED[st.liveSpeed] * (0.7 + Math.random() * 0.6));
    };
    timer = setTimeout(tick, 3500);
    return () => { alive = false; clearTimeout(timer); };
  }, [isLiveDay, liveOn, ix, date, st]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!live.length) return;
    const t = setInterval(() => setLive(l => l.map(p => { const f = ix.byId.get(p.author)?.followers || 1e4; const add = Math.floor(Math.random() * Math.max(2, Math.sqrt(f) / 18)); return { ...p, likes: p.likes + add, commentsTotal: p.commentsTotal + (Math.random() < add / 60 ? 1 : 0), reposts: p.reposts + (Math.random() < add / 120 ? 1 : 0) }; })), 2500);
    return () => clearInterval(t);
  }, [live.length > 0, ix]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => range === 'day' ? [date] : Array.from({ length: 7 }, (_, i) => isoOf(msOf(date) - i * DAY)), [range, date]);
  const all = useMemo(() => { const ds = new Set(days); return [...days.flatMap(d => genDay(ix, d, seed, st)), ...userPosts.filter(p => ds.has(p.date)), ...(isLiveDay ? live : [])]; }, [days, ix, seed, st, userPosts, live, isLiveDay]);
  const posts = useMemo(() => {
    let list = all;
    if (kind !== 'all') list = list.filter(p => ix.byId.get(p.author)?.kind === kind);
    if (group !== 'all') list = list.filter(p => (TYPE_GROUP[group] || []).includes(p.type));
    if (authorF) list = list.filter(p => p.author === authorF || p.mentions.includes(authorF));
    if (q.trim()) { const n = norm(q); list = list.filter(p => norm(p.text).includes(n) || norm(ix.byId.get(p.author)?.name).includes(n) || norm(p.topic).includes(n)); }
    const score = (p: Post) => sort === 'top' ? p.likes : p.commentsTotal * 3 + p.reposts * 2;
    const pinned = list.filter(p => pins.includes(p.id));
    const rest = list.filter(p => !pins.includes(p.id)).sort((a, b) => sort === 'new' ? ((b.fresh || 0) - (a.fresh || 0)) || (b.date + b.time).localeCompare(a.date + a.time) : score(b) - score(a));
    return [...pinned, ...rest].slice(0, 180);
  }, [all, ix, kind, group, authorF, q, sort, pins]);
  const postOfDay = useMemo(() => [...all].sort((a, b) => b.likes - a.likes)[0], [all]);
  const trends = useMemo(() => {
    const m = new Map<string, { p: Persona; w: number; n: number }>();
    for (const post of all) for (const id of [post.author, ...post.mentions]) { const p = ix.byId.get(id); if (!p || p.kind !== 'artist') continue; const e = m.get(id) || { p, w: 0, n: 0 }; e.w += post.likes + post.commentsTotal * 4; e.n++; m.set(id, e); }
    return [...m.values()].sort((a, b) => b.w - a.w).slice(0, 7);
  }, [all, ix]);
  const topics = useMemo(() => { const m = new Map<string, number>(); all.forEach(p => { if (p.topic && p.topic !== 'новый трек') m.set(p.topic, (m.get(p.topic) || 0) + p.likes); }); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8); }, [all]);

  const like = (id: string) => setLikedArr(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));
  const shift = (k: number) => setDate(d => isoOf(msOf(d) + k * DAY));
  const openPersona = (p?: Persona) => { if (p?.artistId) navigateTo('artist', { id: p.artistId }); };
  const publish = (p: Post) => { setUserPosts(u => [...u, { ...p, user: true, fresh: Date.now() }]); setSort('new'); setDate(p.date); setRange('day'); setToast('Пост опубликован'); };
  const randomPost = () => { const r = rng((Date.now() ^ seed * 7919) & 0x7fffffff); const list = genDay(ix, date, Math.floor(r() * 1e6), st); const p = list[Math.floor(r() * list.length)]; if (p) publish(freshPost(p)); };
  const renderText = (post: Post) => {
    const names = post.mentions.map(id => ix.byId.get(id)).filter(Boolean) as Persona[];
    if (!names.length) return post.text;
    const parts: React.ReactNode[] = []; let rest = post.text; let k = 0;
    for (const p of names) { const tok = `@${p.name}`; const i = rest.indexOf(tok); if (i < 0) continue; parts.push(rest.slice(0, i)); parts.push(<button key={k++} type="button" onClick={() => openPersona(p)} className="theme-accent font-semibold hover:underline">{tok}</button>); rest = rest.slice(i + tok.length); }
    parts.push(rest); return parts;
  };
  const authorName = (id: string) => ix.byId.get(id)?.name || `@${id.replace('fan:', '')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter flex items-center gap-3">Лента
            {isLiveDay && <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest px-2 py-1 rounded-full bg-red-500/10 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE</span>}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">{range === 'day' ? fmtDate(date) : `${fmtDate(days[6])} — ${fmtDate(date)}`} · {all.length} постов</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-white/[0.04]">
            <button type="button" onClick={() => shift(-1)} className="w-8 h-8 rounded-[10px] hover:bg-white/10 text-zinc-300 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} className="bg-transparent text-xs font-semibold text-white outline-none [color-scheme:dark] px-1" />
            <button type="button" onClick={() => shift(1)} className="w-8 h-8 rounded-[10px] hover:bg-white/10 text-zinc-300 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
            {date !== today && <button type="button" onClick={() => setDate(today)} className="px-2.5 h-8 rounded-[10px] text-[11px] font-semibold text-zinc-300 hover:bg-white/10">{isSim ? 'Сейчас' : 'Сегодня'}</button>}
          </div>
          <Seg value={range} onChange={setRange} options={[['day', 'День'], ['week', 'Неделя']]} />
          <div className="relative">
            <button type="button" onClick={() => setShowSet(v => !v)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showSet ? 'bg-white text-black' : 'bg-white/[0.04] text-zinc-400 hover:text-white'}`} title="Настройки ленты"><Settings2 className="w-4 h-4" /></button>
            <AnimatePresence>{showSet && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-11 z-30 w-72 rounded-2xl border border-white/10 bg-[#121317]/95 backdrop-blur-xl p-4 space-y-3 shadow-2xl">
                {([['Сколько постов', 'density', [['low', 'Меньше'], ['normal', 'Норма'], ['high', 'Больше']]], ['Кто пишет', 'mix', [['artists', 'В основном артисты'], ['balanced', 'Все поровну']]], ['Живая лента', 'liveSpeed', [['slow', 'Медленно'], ['normal', 'Норма'], ['fast', 'Быстро']]]] as Array<[string, keyof FeedSettings, Array<[string, string]>]>).map(([l, k, o]) => (
                  <div key={k}><div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5">{l}</div><Seg value={String(st[k])} onChange={v => setSt(s => ({ ...s, [k]: v }))} options={o} /></div>
                ))}
                {([['Мемы и паблики', 'memes'], ['Топ-комментарий под постом', 'topComment'], ['Компактный вид', 'compact']] as Array<[string, keyof FeedSettings]>).map(([l, k]) => (
                  <button key={k} type="button" onClick={() => setSt(s => ({ ...s, [k]: !s[k] }))} className="w-full flex items-center justify-between text-[12px] text-zinc-300">
                    <span>{l}</span><span className={`w-8 h-[18px] rounded-full p-0.5 transition-colors ${st[k] ? 'theme-bg-accent' : 'bg-white/10'}`}><span className={`block w-[14px] h-[14px] rounded-full bg-white transition-transform ${st[k] ? 'translate-x-[14px]' : ''}`} /></span>
                  </button>
                ))}
              </motion.div>
            )}</AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_290px] gap-6 items-start">
        <div className="min-w-0">
          <div className="rounded-3xl bg-white/[0.025] border border-white/[0.06] p-3 mb-3 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setCompose(c => !c)} className="flex-1 min-w-[200px] h-10 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] text-left text-[13px] text-zinc-500 transition-colors">Написать пост от имени артиста, издания…</button>
              <button type="button" onClick={randomPost} className="h-10 px-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 inline-flex items-center gap-2"><Shuffle className="w-3.5 h-3.5" />Случайный</button>
              <button type="button" onClick={() => setSeed(s => s + 1)} title="Другая лента на эту дату" className="h-10 w-10 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 flex items-center justify-center"><Sparkles className="w-4 h-4" /></button>
              {isLiveDay && <button type="button" onClick={() => setLiveOn(v => !v)} className="h-10 w-10 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 flex items-center justify-center" title={liveOn ? 'Пауза живой ленты' : 'Включить живую ленту'}>{liveOn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>}
            </div>
            <AnimatePresence initial={false}>{compose && <Composer key="cmp" ix={ix} date={date} st={st} onClose={() => setCompose(false)} onPost={p => { publish(p); setCompose(false); }} />}</AnimatePresence>
            <div className="flex flex-wrap items-center gap-2">
              <Seg value={sort} onChange={setSort} options={SORTS} />
              <div className="overflow-x-auto no-scrollbar max-w-full"><Seg value={kind} onChange={setKind} options={KINDS as Array<[string, string]>} /></div>
              <div className="relative flex-1 min-w-[130px]"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск" className="w-full h-8 pl-8 pr-2 rounded-xl bg-white/[0.04] text-xs text-white outline-none placeholder:text-zinc-600" /></div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {['all', ...Object.keys(TYPE_GROUP)].map(g => <button key={g} type="button" onClick={() => setGroup(g)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${group === g ? 'bg-white text-black' : 'bg-white/[0.04] text-zinc-400 hover:text-white'}`}>{g === 'all' ? 'Всё' : g}</button>)}
              {authorF && <button type="button" onClick={() => setAuthorF(null)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap theme-bg-accent text-black inline-flex items-center gap-1">{ix.byId.get(authorF)?.name}<X className="w-3 h-3" /></button>}
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.06] overflow-hidden divide-y divide-white/[0.05]">
            {posts.length === 0 && <div className="py-16 text-center text-sm text-zinc-500">Тишина. Смени дату или нажми «Случайный».</div>}
            <AnimatePresence initial={false}>
              {posts.map(post => {
                const p = ix.byId.get(post.author); const isL = liked.has(post.id); const isPin = pins.includes(post.id);
                const myVote = votes[post.id];
                const top = st.topComment && openC !== post.id ? post.comments[0] : undefined;
                return (
                  <motion.article key={post.id} layout="position" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className={`group/post flex gap-3 ${st.compact ? 'px-4 py-3' : 'px-4 sm:px-5 py-4'} hover:bg-white/[0.015] transition-colors`}>
                    <button type="button" onClick={() => openPersona(p)} className="shrink-0 self-start mt-0.5"><Av p={p} size={st.compact ? 34 : 42} /></button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button type="button" onClick={() => openPersona(p)} className="text-[14px] font-bold text-white hover:underline truncate min-w-0">{p?.name || 'Аккаунт'}</button>
                        {p?.verified && <BadgeCheck className="w-[15px] h-[15px] text-sky-400 shrink-0" />}
                        <span className="text-[12px] text-zinc-600 truncate shrink min-w-0">@{p?.handle}</span>
                        <span className="text-[12px] text-zinc-600 shrink-0">· {range === 'week' || post.date !== today ? `${fmtDate(post.date).slice(0, 5)} ` : ''}{post.time}</span>
                        {isPin && <Pin className="w-3 h-3 text-zinc-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-zinc-600">
                        <span>{p ? KIND_RU[p.kind] : ''}</span><span>·</span>
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_DOT[post.type] || '#52525b' }} />{TYPE_RU[post.type]}</span>
                        {post.user && <span className="text-emerald-400/80">· твой</span>}
                      </div>
                      <p className={`mt-1.5 whitespace-pre-line break-words text-zinc-100 ${post.big ? 'text-[26px] font-black tracking-tight leading-tight' : 'text-[14.5px] leading-relaxed'}`}>{renderText(post)}</p>
                      {post.attach && (
                        <button type="button" onClick={() => navigateTo(post.attach!.kind === 'album' ? 'album' : 'track', { id: post.attach!.id })}
                          className="mt-2.5 w-full max-w-sm flex items-center gap-3 p-2 pr-3 rounded-2xl bg-white/[0.035] hover:bg-white/[0.06] border border-white/[0.05] text-left transition-colors">
                          <CoverArt url={post.attach.cover} title={post.attach.title} className="w-11 h-11 rounded-xl overflow-hidden shrink-0" innerClassName="w-full h-full object-cover" />
                          <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-white truncate">{post.attach.title}</span><span className="block text-[11px] text-zinc-500 truncate">{post.attach.label} · {post.attach.artist}</span></span>
                          <Play className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        </button>
                      )}
                      {post.claim && (() => {
                        const ok = confirmedIds.has(post.id);
                        return (
                          <div className="mt-2.5 flex items-center gap-2 text-[11.5px]">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.035] text-zinc-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />{CLAIM_RU[post.claim.kind]} · ≈ {fmtDate(post.claim.date)}{post.claim.feat ? ` · feat. ${post.claim.feat}` : ''}
                            </span>
                            <button type="button" onClick={() => toggleClaim(post)} title={ok ? 'Снять подтверждение' : 'Подтвердить слух: добавить в календарь и в пульт симуляции'}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-colors ${ok ? 'theme-bg-accent text-black' : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] hover:text-white'}`}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>{ok ? 'Подтверждено' : 'Подтвердить'}
                            </button>
                          </div>
                        );
                      })()}
                      {post.poll && (() => {
                        const v = post.poll.votes.map((x, i) => x + (myVote === i ? 1 : 0)); const tot = v.reduce((s, x) => s + x, 0) || 1;
                        return (
                          <div className="mt-2.5 max-w-sm space-y-1.5">
                            {post.poll.options.map((o, i) => (
                              <button key={o} type="button" onClick={() => setVotes(m => ({ ...m, [post.id]: i }))} className="relative w-full h-9 rounded-xl overflow-hidden bg-white/[0.04] text-left">
                                {myVote !== undefined && <motion.span className="absolute inset-y-0 left-0 rounded-xl" style={{ background: myVote === i ? 'color-mix(in srgb, var(--accent-color) 35%, transparent)' : 'rgba(255,255,255,0.07)' }} initial={{ width: 0 }} animate={{ width: `${(v[i] / tot) * 100}%` }} />}
                                <span className="relative px-3 flex items-center justify-between h-full text-[12.5px]"><span className="text-white font-semibold truncate">{o}</span>{myVote !== undefined && <span className="text-zinc-400 tabular-nums">{Math.round((v[i] / tot) * 100)}%</span>}</span>
                              </button>
                            ))}
                            <div className="text-[10.5px] text-zinc-600">{fmtK(tot)} голосов{myVote === undefined ? ' · нажми, чтобы проголосовать' : ''}</div>
                          </div>
                        );
                      })()}
                      <div className="mt-2.5 flex items-center gap-6 text-[12px] text-zinc-500 tabular-nums">
                        <button type="button" onClick={() => like(post.id)} className={`inline-flex items-center gap-1.5 transition-colors ${isL ? 'text-rose-400' : 'hover:text-rose-300'}`}>
                          <motion.span key={String(isL)} initial={{ scale: isL ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}><Heart className={`w-4 h-4 ${isL ? 'fill-current' : ''}`} /></motion.span>{fmtK(post.likes + (isL ? 1 : 0))}
                        </button>
                        <button type="button" onClick={() => setOpenC(o => (o === post.id ? null : post.id))} className="inline-flex items-center gap-1.5 hover:text-white"><MessageCircle className="w-4 h-4" />{fmtK(post.commentsTotal)}</button>
                        <span className="inline-flex items-center gap-1.5"><Repeat2 className="w-4 h-4" />{fmtK(post.reposts)}</span>
                        <span className="ml-auto flex items-center gap-3 opacity-0 group-hover/post:opacity-100 transition-opacity">
                          <button type="button" title={isPin ? 'Открепить' : 'Закрепить'} onClick={() => setPins(a => (a.includes(post.id) ? a.filter(x => x !== post.id) : [...a, post.id]))} className="hover:text-white"><Pin className="w-3.5 h-3.5" /></button>
                          <button type="button" title="Скопировать" onClick={() => { try { navigator.clipboard?.writeText(`${p?.name}: ${post.text}`); setToast('Текст скопирован'); } catch { /* */ } }} className="hover:text-white"><Share2 className="w-3.5 h-3.5" /></button>
                          {post.user && <button type="button" title="Удалить" onClick={() => setUserPosts(u => u.filter(x => x.id !== post.id))} className="hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </span>
                      </div>
                      {top && (
                        <button type="button" onClick={() => setOpenC(post.id)} className="mt-2.5 w-full text-left flex items-start gap-2 text-[12.5px]">
                          <span className="w-0.5 self-stretch rounded-full bg-white/10" />
                          <span className="min-w-0"><span className="font-semibold text-zinc-300 mr-1.5">{authorName(top.author)}</span><span className="text-zinc-400">{top.text}</span></span>
                        </button>
                      )}
                      <AnimatePresence initial={false}>
                        {openC === post.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-3 space-y-2.5 border-l border-white/[0.08] pl-3">
                              {post.comments.length === 0 && <div className="text-[12px] text-zinc-600">Комментариев пока нет</div>}
                              {post.comments.map(c => { const cp = ix.byId.get(c.author); return (
                                <div key={c.id} className="flex gap-2.5 text-[13px]">
                                  {cp ? <Av p={cp} size={24} /> : <div className="w-6 h-6 rounded-full shrink-0" style={{ background: `hsl(${hash(c.author) % 360},30%,28%)` }} />}
                                  <div className="min-w-0 flex-1"><span className="font-semibold text-white mr-1.5">{authorName(c.author)}</span>{c.author === post.author && <span className="text-[10px] text-zinc-500 mr-1.5">автор</span>}<span className="text-zinc-300">{c.text}</span>
                                    <div className="text-[10px] text-zinc-600 mt-0.5 tabular-nums">♥ {fmtK(c.likes)}</div></div>
                                </div>
                              ); })}
                              {post.commentsTotal > post.comments.length && <div className="text-[11px] text-zinc-600">ещё {fmtK(post.commentsTotal - post.comments.length)} комментариев</div>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4">
          {postOfDay && (
            <div className="rounded-3xl bg-white/[0.025] border border-white/[0.06] p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Пост {range === 'day' ? 'дня' : 'недели'}</div>
              <div className="flex gap-2.5"><Av p={ix.byId.get(postOfDay.author)} size={28} /><div className="min-w-0"><div className="text-[12px] font-bold text-white truncate">{ix.byId.get(postOfDay.author)?.name}</div><div className="text-[12.5px] text-zinc-300 line-clamp-3 mt-0.5">{postOfDay.text}</div><div className="text-[10.5px] text-zinc-600 mt-1 tabular-nums">♥ {fmtK(postOfDay.likes)} · 💬 {fmtK(postOfDay.commentsTotal)}</div></div></div>
            </div>
          )}
          <div className="rounded-3xl bg-white/[0.025] border border-white/[0.06] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Кого обсуждают</div>
            {trends.length === 0 && <div className="text-xs text-zinc-600">Пока тихо</div>}
            <div className="space-y-2.5">
              {trends.map((t, i) => (
                <button key={t.p.id} type="button" onClick={() => setAuthorF(f => (f === t.p.id ? null : t.p.id))} className={`w-full flex items-center gap-2.5 text-left rounded-xl transition-opacity ${authorF && authorF !== t.p.id ? 'opacity-50' : ''}`}>
                  <span className="w-3 text-[11px] font-bold text-zinc-600 tabular-nums">{i + 1}</span>
                  <Av p={t.p} size={28} />
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-white truncate">{t.p.name}</span><span className="block text-[10.5px] text-zinc-600 tabular-nums">{t.n} {t.n === 1 ? 'пост' : t.n < 5 ? 'поста' : 'постов'} · ♥ {fmtK(t.w)}</span></span>
                </button>
              ))}
            </div>
          </div>
          {topics.length > 0 && (
            <div className="rounded-3xl bg-white/[0.025] border border-white/[0.06] p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Темы</div>
              <div className="flex flex-wrap gap-1.5">{topics.map(([t]) => <button key={t} type="button" onClick={() => setQ(q === t ? '' : t)} className={`text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${q === t ? 'bg-white text-black' : 'bg-white/[0.04] text-zinc-400 hover:text-white'}`}>#{t.replace(/\s+/g, '')}</button>)}</div>
            </div>
          )}
        </aside>
      </div>
      <AnimatePresence>{toast && <motion.div key="t" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-full bg-white text-black text-xs font-bold shadow-2xl">{toast}</motion.div>}</AnimatePresence>
    </div>
  );
};

const Composer: React.FC<{ ix: Index; date: string; st: FeedSettings; onClose: () => void; onPost: (p: Post) => void }> = ({ ix, date, onClose, onPost }) => {
  const [who, setWho] = useState('');
  const [author, setAuthor] = useState<Persona | null>(null);
  const [type, setType] = useState<PType>('emotion');
  const [d, setD] = useState(date);
  const [text, setText] = useState('');
  const [rel, setRel] = useState('');
  const sugg = useMemo(() => { const n = norm(who); return (n ? ix.personas.filter(p => norm(p.name).includes(n) || p.handle.includes(n)) : [...ix.artistP.slice(0, 6), ...ix.byKind.insider.slice(0, 2), ...ix.byKind.media.slice(0, 2)]).slice(0, 10); }, [who, ix]);
  const rels = useMemo(() => (author?.artistId ? [...(ix.rels.get(author.artistId) || [])].reverse().slice(0, 30) : []), [author, ix]);
  const ctx = (): Ctx => { const r = rels.find(x => x.id === rel); return r ? { rel: r } : author?.kind === 'artist' ? artistType(ix, author, d, rng(hash(type + d))).ctx : {}; };
  const gen = () => { if (author) setText(makePost(ix, author, type, d, rng((Date.now() & 0x7fffffff) ^ hash(text)), ctx()).text); };
  const post = () => { if (!author) return; const base = makePost(ix, author, type, d, rng(hash(text + d + Date.now())), ctx()); const n = new Date(); onPost({ ...base, id: `u${Date.now()}`, time: `${pad(n.getHours())}:${pad(n.getMinutes())}`, date: d, text: text.trim() || base.text, big: (text.trim() || base.text).replace(/[\s.…]/g, '').length <= 12 && !base.attach, mentions: text.trim() ? [] : base.mentions }); };
  const inp = 'h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white outline-none focus:border-white/20';
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="space-y-2.5 pt-1">
        {author ? (
          <div className="flex items-center gap-2.5"><Av p={author} size={32} /><div className="min-w-0 flex-1"><div className="text-sm font-bold text-white truncate">{author.name}</div><div className="text-[10.5px] text-zinc-500">{KIND_RU[author.kind]} · {fmtK(author.followers)} подписчиков</div></div><button type="button" onClick={() => { setAuthor(null); setRel(''); }} className="text-[11px] text-zinc-400 hover:text-white">сменить</button></div>
        ) : (
          <div>
            <input value={who} onChange={e => setWho(e.target.value)} placeholder="Кто пишет: артист, инсайдер, издание…" className={`${inp} w-full`} autoFocus />
            <div className="flex flex-wrap gap-1.5 mt-2">{sugg.map(p => <button key={p.id} type="button" onClick={() => setAuthor(p)} className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.09] text-[11px] text-zinc-200"><Av p={p} size={20} />{p.name}</button>)}</div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <select value={type} onChange={e => setType(e.target.value as PType)} className={inp}>{Object.entries(TYPE_GROUP).map(([g, ts]) => <optgroup key={g} label={g} className="bg-zinc-950">{ts.map(t => <option key={t} value={t} className="bg-zinc-950">{TYPE_RU[t]}</option>)}</optgroup>)}</select>
          <input type="date" value={d} onChange={e => e.target.value && setD(e.target.value)} className={`${inp} [color-scheme:dark]`} />
          {rels.length > 0 && <select value={rel} onChange={e => setRel(e.target.value)} className={`${inp} max-w-[210px]`}><option value="" className="bg-zinc-950">Без релиза</option>{rels.map(t => <option key={t.id} value={t.id} className="bg-zinc-950">{t.title} · {fmtDate(t.date)}</option>)}</select>}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Текст поста или «Сгенерировать» — в стиле автора" className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none focus:border-white/20 resize-none" />
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
          <button type="button" onClick={gen} disabled={!author} className="px-3 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-zinc-200 disabled:opacity-30 inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Сгенерировать</button>
          <button type="button" onClick={post} disabled={!author} className="px-4 h-9 rounded-xl bg-white text-black text-xs font-black disabled:opacity-30 inline-flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Опубликовать</button>
        </div>
      </div>
    </motion.div>
  );
};
