// ============================================================================
// MUSAIC SOCIAL — лента постов: артисты, лейблы, издания, знаменитости, паблики
// - посты генерируются из каталога (релизы, сниппеты, чарт, премии) + бифы, мемы,
//   инсайды, респекты, эмоции… с голосом автора (стиль, хайп, размер аудитории)
// - выбор даты / диапазона, топ по лайкам и обсуждаемые, фильтры по типам и авторам
// - свои посты: выбрать автора, дату, тип, сгенерировать текст или написать свой
// - в симуляции (и на «сегодня») лента живая: посты появляются в реальном времени
// ============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Repeat2, Share2, ChevronLeft, ChevronRight, Sparkles, Radio, Trash2, BadgeCheck, Send, Shuffle, Search, X, Pause, Play, TrendingUp } from 'lucide-react';
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
const fmtK = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',')} млн` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.', ',')} тыс.` : String(Math.round(n));
const lsGet = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } };

// ---------------------------------------------------------------------------
// personas
// ---------------------------------------------------------------------------
type Kind = 'artist' | 'label' | 'media' | 'celeb' | 'page';
type Style = 'hype' | 'calm' | 'ironic' | 'aggressive' | 'poetic' | 'official' | 'insider' | 'meme';
export interface Persona { id: string; name: string; handle: string; kind: Kind; verified: boolean; followers: number; hue: number; style: Style; bio: string; avatar?: string; artistId?: string; genre?: string; hype?: number }
const EXTERNAL: Array<Omit<Persona, 'id' | 'hue'> & { key: string }> = [
  { key: 'puls', name: 'Пульс', handle: 'puls_media', kind: 'media', verified: true, followers: 2_400_000, style: 'official', bio: 'Главные музыкальные новости дня' },
  { key: 'zvuk', name: 'Звук.Журнал', handle: 'zvuk_journal', kind: 'media', verified: true, followers: 1_300_000, style: 'calm', bio: 'Длинные тексты о музыке' },
  { key: 'rapobzor', name: 'Рэп-Обзор', handle: 'rap_obzor', kind: 'media', verified: true, followers: 3_100_000, style: 'ironic', bio: 'Рэп без цензуры' },
  { key: 'noise', name: 'NOISE', handle: 'noise.mag', kind: 'media', verified: true, followers: 640_000, style: 'aggressive', bio: 'Мы не любим всё подряд' },
  { key: 'hype', name: 'Хайп-Радар', handle: 'hyperadar', kind: 'media', verified: true, followers: 1_900_000, style: 'hype', bio: 'Кто взлетел, кто упал' },
  { key: 'kitchen', name: 'Кухня рэпа', handle: 'rap_kitchen', kind: 'media', verified: false, followers: 870_000, style: 'insider', bio: 'Инсайды. Источники не раскрываем' },
  { key: 'charts', name: 'Чарт-Аналитика', handle: 'chart_data', kind: 'media', verified: true, followers: 510_000, style: 'official', bio: 'Цифры, графики, рекорды' },
  { key: 'north', name: 'Северный Ветер Records', handle: 'northwind.rec', kind: 'label', verified: true, followers: 980_000, style: 'official', bio: 'Независимый лейбл' },
  { key: 'gold', name: 'Gold Vault', handle: 'goldvault', kind: 'label', verified: true, followers: 2_200_000, style: 'hype', bio: 'Мейджор. Только хиты' },
  { key: 'neon', name: 'Неон Саунд', handle: 'neon_sound', kind: 'label', verified: true, followers: 720_000, style: 'poetic', bio: 'Звук ночного города' },
  { key: '808', name: '808 Collective', handle: '808collective', kind: 'label', verified: true, followers: 450_000, style: 'aggressive', bio: 'Андеграунд, который громче мейнстрима' },
  { key: 'monolith', name: 'Monolith Music', handle: 'monolith', kind: 'label', verified: true, followers: 1_500_000, style: 'official', bio: 'Большие релизы' },
  { key: 'alina', name: 'Алина Вэйв', handle: 'alinawave', kind: 'celeb', verified: true, followers: 8_400_000, style: 'hype', bio: 'Блогер · 8 млн 💫' },
  { key: 'maks', name: 'Макс Стрелков', handle: 'strelkov', kind: 'celeb', verified: true, followers: 5_200_000, style: 'calm', bio: 'Актёр' },
  { key: 'dina', name: 'Дина Кор', handle: 'dina.kor', kind: 'celeb', verified: true, followers: 3_700_000, style: 'poetic', bio: 'Модель · мода и музыка' },
  { key: 'shtorm', name: 'Игорь «Шторм» Лебедев', handle: 'shtorm_mma', kind: 'celeb', verified: true, followers: 4_100_000, style: 'aggressive', bio: 'Боец. Выхожу под рэп' },
  { key: 'lera', name: 'Лера Пикчерс', handle: 'lera.pictures', kind: 'celeb', verified: true, followers: 690_000, style: 'poetic', bio: 'Режиссёр клипов' },
  { key: 'timur', name: 'Тимур Кэш', handle: 'timurcash', kind: 'celeb', verified: true, followers: 1_200_000, style: 'insider', bio: 'Продюсер · A&R' },
  { key: 'nika', name: 'Ника Ночь', handle: 'nika.night', kind: 'celeb', verified: true, followers: 950_000, style: 'hype', bio: 'Диджей · клубы и фестивали' },
  { key: 'karina', name: 'Карина Стиль', handle: 'karina_style', kind: 'celeb', verified: false, followers: 410_000, style: 'ironic', bio: 'Стилист звёзд' },
  { key: 'stream', name: 'Стас Стримит', handle: 'stas_live', kind: 'celeb', verified: true, followers: 2_900_000, style: 'meme', bio: 'Стример · реакции' },
  { key: 'bit', name: 'Бит в голове', handle: 'bit_v_golove', kind: 'page', verified: false, followers: 1_700_000, style: 'meme', bio: 'Мемы про музыку' },
  { key: 'fans', name: 'Фан-база 24/7', handle: 'fanbase247', kind: 'page', verified: false, followers: 560_000, style: 'hype', bio: 'Сливы, фан-арты, хайп' },
  { key: 'oldschool', name: 'Олдскул ТВ', handle: 'oldschool.tv', kind: 'page', verified: false, followers: 330_000, style: 'calm', bio: 'Раньше было лучше? Проверим' },
  { key: 'lyrics', name: 'Строчки', handle: 'strochki', kind: 'page', verified: false, followers: 780_000, style: 'poetic', bio: 'Лучшие строчки недели' }
];
const KIND_RU: Record<Kind, string> = { artist: 'Артист', label: 'Лейбл', media: 'Издание', celeb: 'Личность', page: 'Паблик' };

function artistStyle(a: Artist): Style {
  const h = hash(a.id + a.name) % 100; const f = a.followers || 0; const g = norm(a.genre);
  if (f > 5e6) return h < 50 ? 'official' : h < 80 ? 'calm' : 'hype';
  if (/drill|дрилл|phonk|фонк|trap|трэп/.test(g)) return h < 45 ? 'aggressive' : h < 75 ? 'hype' : 'ironic';
  if (/indie|инди|r&b|soul|соул|alt/.test(g)) return h < 55 ? 'poetic' : 'calm';
  return (['hype', 'calm', 'ironic', 'poetic', 'aggressive'] as Style[])[h % 5];
}
function buildPersonas(artists: Artist[]): Persona[] {
  const ext = EXTERNAL.map(e => ({ ...e, id: `x:${e.key}`, hue: hash(e.key) % 360 }));
  const arts = artists.map(a => ({
    id: `a:${a.id}`, name: a.name, handle: norm(a.name).replace(/[^a-zа-я0-9]+/gi, '_').slice(0, 18) || 'artist', kind: 'artist' as Kind,
    verified: Boolean(a.verified) || (a.followers || 0) > 1e6, followers: a.followers || 50_000, hue: hash(a.id) % 360, style: artistStyle(a),
    bio: a.genre || 'Артист', avatar: a.imageUrl, artistId: a.id, genre: a.genre, hype: a.hype
  }));
  return [...arts, ...ext];
}

// ---------------------------------------------------------------------------
// posts
// ---------------------------------------------------------------------------
type PType = 'release' | 'teaser' | 'meme' | 'beef' | 'respect' | 'insider' | 'news' | 'emotion' | 'chart' | 'award' | 'studio' | 'tour' | 'throwback' | 'question' | 'collab' | 'fashion';
export const TYPE_RU: Record<PType, string> = { release: 'Релиз', teaser: 'Прогрев', meme: 'Мем', beef: 'Биф', respect: 'Респект', insider: 'Инсайд', news: 'Новость', emotion: 'Эмоции', chart: 'Чарт', award: 'Премия', studio: 'Студия', tour: 'Концерты', throwback: 'Ностальгия', question: 'Вопрос', collab: 'Коллаб', fashion: 'Стиль' };
interface Comment { id: string; author: string; text: string; likes: number }
export interface Post { id: string; author: string; date: string; time: string; type: PType; text: string; cover?: { url?: string; title: string; isArtist?: boolean }; scene?: string; ref?: { view: ViewType; id: string }; mentions: string[]; likes: number; reposts: number; comments: Comment[]; commentsTotal: number; user?: boolean }

const T: Record<PType, Partial<Record<Style | 'any', string[]>>> = {
  release: {
    any: ['«{t}» уже везде. Включайте', 'Новый {kind} «{t}» — вышел', '«{t}» доступен на всех площадках', 'Это «{t}». Слушайте громко'],
    hype: ['«{t}» ВЫШЕЛ!!! РАЗНОСИМ 🔥🔥🔥', 'НАКОНЕЦ-ТО. «{t}» — уже на всех площадках 🚀', 'Кто ещё не слушал «{t}» — бегом 💥'],
    calm: ['«{t}». спасибо всем, кто ждал', 'вышел «{t}». слушайте целиком, по порядку', 'долго шли к этому. «{t}» теперь ваш'],
    poetic: ['«{t}» — это то, что я не мог сказать вслух', 'Ночь, наушники и «{t}». Всё, что нужно', 'Каждый трек «{t}» — кусочек прошлого года'],
    aggressive: ['«{t}» вышел. Хейтеры — в очередь', 'Без лишних слов: «{t}». Громко', '«{t}» — кто не понял, тот поймёт'],
    ironic: ['ну что, «{t}» вышел, можете начинать спорить в комментах', 'выпустил «{t}», пошёл читать ваши разборы', '«{t}». да, опять гениально'],
    official: ['Релиз «{t}» уже на всех площадках.', 'Встречайте: «{t}». Спасибо команде', 'Сегодня вышел {kind} «{t}»']
  },
  teaser: {
    any: ['Скоро… «{t}»', 'Кусок из «{t}». Ждём?', 'Сниппет «{t}» — как вам?', '{days} дн. до «{t}»'],
    hype: ['СНИППЕТ «{t}» 👀 ставьте 🔥 если ждёте', 'Это будет бомба. «{t}» скоро 💣'],
    calm: ['кусочек из нового. «{t}»', 'пока без даты. «{t}»'],
    poetic: ['«{t}» звучит как воспоминание, которое ещё не случилось'],
    ironic: ['вы просили — я сделал вид, что не слышал. «{t}» скоро'],
    aggressive: ['«{t}» в пути. Готовьте колонки'],
    official: ['Анонс: «{t}». Дата скоро']
  },
  meme: {
    any: ['Когда {a} опять дропнул в пятницу, а ты только пятый раз переслушал прошлый релиз 😭', 'Я: сплю\nМозг в 3 ночи: а помнишь строчку {a}?', 'Фанаты {a} каждую пятницу:\n— ну где\n— ну когда\n— ну скиньте хоть сниппет', 'POV: ты в пробке и включил «{t}» на всю', 'Слушатели {a} после третьего прослушивания «{t}»: это лучший трек десятилетия', 'Скажи, что ты фанат {a}, не говоря, что ты фанат {a}', '{a}: выпускает трек\nКомменты: а где альбом?']
  },
  beef: {
    any: ['Кто-то слишком много говорит в интервью. Не будем показывать пальцем, @{a2}', 'Странно, когда тебя копируют, а потом делают вид, что не знают. @{a2}, привет', 'Мой стрим — больше, чем весь твой каталог, @{a2}'],
    aggressive: ['@{a2}, выходи на бит, а не в сторис', '@{a2} — у тебя хуки взяты в аренду', 'Ответ будет в треке. @{a2}, жди'],
    ironic: ['@{a2} опять пишет про меня. Приятно, что ты так внимательно слушаешь', 'Обожаю, когда @{a2} объясняет, как делать музыку 🍿'],
    calm: ['не хочу ссориться, но @{a2} перешёл черту. обсудим лично'],
    hype: ['@{a2} ТЫ ВСЁ ПОНЯЛ 😤🔥']
  },
  respect: {
    any: ['Уважение @{a2}. «{t2}» — шедевр', '@{a2}, как ты это делаешь? «{t2}» на повторе', 'Самый недооценённый артист сейчас — @{a2}', 'Обнял @{a2} на студии. Скоро кое-что будет 🤝', 'Признаюсь: «{t2}» от @{a2} лучше, чем всё, что я выпустил в этом году'],
    official: ['Поздравляем @{a2} с релизом «{t2}»!'],
    calm: ['@{a2} делает очень честную музыку. респект']
  },
  insider: {
    any: ['По нашим данным, {a} заканчивает альбом. Выход — до конца сезона', 'Источники: {a} и {a2} записали совместный трек', 'Говорят, {a} готовит смену звучания', 'Слух: {a} подписал новый контракт с крупным лейблом', 'Инсайд: у {a} в запасе 20+ неизданных треков', 'Видели {a} на съёмках клипа. Бюджет — большой', 'Утечка: треклист нового релиза {a} уже у дистрибьютора']
  },
  news: {
    any: ['{a} выпустил «{t}». Первые цифры — {plays} прослушиваний', '«{t}» — новый релиз {a}. Делимся первыми впечатлениями', 'Главное за день: {a} — «{t}»', '{a} снова в центре внимания: «{t}» собирает реакции', 'Неделя {a}: релиз, интервью и сотни мемов']
  },
  emotion: {
    any: ['Иногда просто хочется выключить телефон', 'Спасибо, что вы со мной. Серьёзно', 'Сегодня был хороший день', 'Не спал двое суток. Оно того стоит', 'Скучаю по сцене'],
    hype: ['ЭТО ЛУЧШИЙ ДЕНЬ!!! ЛЮБЛЮ ВАС ❤️‍🔥', 'Энергия на максимум ⚡️'],
    calm: ['тишина. чай. новые демки', 'просто дышу'],
    poetic: ['Город спит, а у меня в голове припев', 'Каждая строчка — это письмо, которое я не отправил'],
    aggressive: ['Никто не верил. Посмотрите сейчас', 'Работаю, пока вы спорите'],
    ironic: ['день 47: всё ещё делаю вид, что альбом почти готов', 'мама спросила, когда нормальная работа. я выпустил трек']
  },
  chart: {
    any: ['«{t}» — №{pos} в чарте. Спасибо, что слушаете!', '{a} — «{t}»: №{pos} в Топ-100', 'Рекорд недели: «{t}» поднимается на №{pos}', 'Чарт дня: «{t}» удерживает №{pos}']
  },
  award: {
    any: ['{a} — победитель «{nom}» 🏆', 'Поздравляем {a}: «{nom}»!', 'Это для вас. «{nom}» — спасибо 🏆', 'Итоги: «{nom}» достаётся {a}. Заслуженно?']
  },
  studio: {
    any: ['Ночь в студии. Что-то будет 🎛', 'Свели первый куплет. Мурашки', 'Сегодня записали то, что вы не ожидаете', 'Студия, 4 утра, бит на повторе', 'Новые демки звучат иначе. Вам понравится'],
    ironic: ['записал 12 дублей одной строчки. оставили первый']
  },
  tour: {
    any: ['Тур подтверждён. Города — в сторис', 'Вчерашний концерт — это что-то. Спасибо!', 'Скоро в вашем городе 🎤', 'Солд-аут за 3 часа. Без слов', 'Фестивальный сезон открыт']
  },
  throwback: {
    any: ['Помните «{t}»? Уже столько времени прошло', 'Ностальгия: «{t}» до сих пор звучит свежо', 'Год назад вышел «{t}». Как вам сейчас?', 'Throwback: «{t}» — где вы были, когда он вышел?']
  },
  question: {
    any: ['Какой мой трек вы бы взяли на необитаемый остров?', 'Фит с кем вы хотите следующим?', 'Альбом или сингл? Решайте', 'Какую строчку из «{t}» вы знаете наизусть?', 'Что слушаете сегодня? Делитесь']
  },
  collab: {
    any: ['@{a2} и я. Скоро.', 'Когда-то мечтал о фите с @{a2}. Мечты сбываются', 'Студия с @{a2} — это отдельный вид искусства', '@{a2}, наш трек уже сведён 👀']
  },
  fashion: {
    any: ['Образ для съёмок {a} — наша работа 🖤', 'Новый мерч — уже скоро', 'Лук дня. Оценим?', 'Коллаборация с брендом — детали скоро']
  }
};
const COMMENTS: Record<string, string[]> = {
  pos: ['🔥🔥🔥', 'Это шедевр', 'На повторе весь день', 'Лучший!', 'Ждали сильно', 'Мурашки', 'Это гимн', 'Наконец-то', 'Голос 🤍', 'Сохранил', 'Слушаю 20-й раз', 'Вы лучшие'],
  neg: ['Раньше было лучше', 'Ну такое', 'Переоценено', 'Ждали большего', 'Опять одно и то же', 'Не моё'],
  fun: ['ахахаха', 'я в этом посте и мне норм', '😭😭😭', 'база', 'кто здесь из TikTok?', 'отметь друга, который знает все строчки', 'админ, ты гений'],
  beef: ['🍿🍿🍿', 'ну всё, ждём дисс', 'это было лично', 'кто прав?', 'ответ будет жёстким', 'зачем вы так'],
  q: ['фит с {a2}!!!', 'альбом!!!', 'всё и сразу', '«{t}» навсегда', 'дайте тур в мой город']
};
const SCENES = ['studio', 'stage', 'city', 'car', 'sunset', 'neon'] as const;
function sceneUri(kind: string, seed: number, caption: string) {
  const r = rng(seed); const h = Math.floor(r() * 360); const h2 = (h + 40 + Math.floor(r() * 80)) % 360;
  let body = '';
  if (kind === 'studio') body = Array.from({ length: 14 }, (_, i) => `<rect x='${40 + i * 38}' y='${260 - (40 + r() * 120)}' width='22' height='${40 + r() * 120}' rx='4' fill='hsla(${h2},90%,70%,.55)'/>`).join('') + `<rect x='0' y='262' width='640' height='138' fill='rgba(0,0,0,.55)'/>`;
  else if (kind === 'stage') body = [0, 1, 2, 3].map(i => `<polygon points='${120 + i * 130},0 ${70 + i * 130},300 ${170 + i * 130},300' fill='hsla(${h2},100%,80%,.16)'/>`).join('') + Array.from({ length: 60 }, () => `<circle cx='${r() * 640}' cy='${300 + r() * 90}' r='${6 + r() * 8}' fill='rgba(0,0,0,.75)'/>`).join('');
  else if (kind === 'city') body = Array.from({ length: 16 }, (_, i) => { const hh = 80 + r() * 200; return `<rect x='${i * 42}' y='${400 - hh}' width='38' height='${hh}' fill='rgba(5,5,10,.85)'/>` + Array.from({ length: 6 }, () => `<rect x='${i * 42 + 5 + r() * 26}' y='${400 - hh + 10 + r() * (hh - 20)}' width='4' height='6' fill='hsla(${h2},100%,75%,.8)'/>`).join(''); }).join('');
  else if (kind === 'car') body = `<rect x='0' y='250' width='640' height='150' fill='rgba(0,0,0,.6)'/>` + [0, 1, 2, 3, 4].map(i => `<rect x='${300 - i * 10}' y='${270 + i * 26}' width='${40 + i * 20}' height='6' fill='rgba(255,255,255,.5)'/>`).join('') + `<circle cx='520' cy='80' r='36' fill='hsla(${h2},100%,85%,.8)'/>`;
  else if (kind === 'sunset') body = `<circle cx='320' cy='250' r='110' fill='hsla(${h2},100%,70%,.85)'/><rect x='0' y='250' width='640' height='150' fill='rgba(0,0,0,.55)'/>`;
  else body = Array.from({ length: 7 }, (_, i) => `<rect x='${60 + i * 80}' y='${60 + r() * 60}' width='50' height='${180 + r() * 80}' rx='25' fill='none' stroke='hsla(${(h2 + i * 20) % 360},100%,65%,.8)' stroke-width='4'/>`).join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='hsl(${h},55%,22%)'/><stop offset='1' stop-color='hsl(${h2},60%,8%)'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/>${body}<text x='24' y='380' font-family='sans-serif' font-size='18' font-weight='700' fill='rgba(255,255,255,.7)'>${caption.replace(/[<>&']/g, '')}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function avatarUri(p: Persona) {
  const ini = p.name.replace(/[«»"']/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const rx = p.kind === 'media' ? 22 : p.kind === 'label' ? 48 : p.kind === 'page' ? 30 : 48;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${p.hue},70%,58%)'/><stop offset='1' stop-color='hsl(${(p.hue + 50) % 360},70%,28%)'/></linearGradient></defs><rect width='96' height='96' rx='${rx}' fill='url(#g)'/>${p.kind === 'label' ? `<circle cx='48' cy='48' r='34' fill='none' stroke='rgba(255,255,255,.35)' stroke-width='2'/>` : ''}<text x='48' y='58' text-anchor='middle' font-family='sans-serif' font-size='${ini.length > 1 ? 32 : 40}' font-weight='800' fill='white'>${ini.replace(/[<>&']/g, '')}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface Catalog { artists: Artist[]; albums: Album[]; tracks: Track[]; awards: AwardItem[] }
interface Index { personas: Persona[]; byId: Map<string, Persona>; artistP: Persona[]; ext: Persona[]; relByDay: Map<string, Array<{ kind: 'track' | 'album' | 'snippet'; id: string; title: string; artistId: string; artistName: string; cover?: string; plays: number; feat?: string }>>; byArtist: Map<string, Track[]>; awardsByMonth: Map<string, AwardItem[]>; label: Map<string, string> }
function buildIndex(c: Catalog): Index {
  const personas = buildPersonas(c.artists);
  const byId = new Map(personas.map(p => [p.id, p]));
  const relByDay = new Map<string, any[]>(); const byArtist = new Map<string, Track[]>(); const label = new Map<string, string>();
  const push = (d: string | undefined, x: any) => { if (!d || d.length < 10) return; const k = d.slice(0, 10); (relByDay.get(k) || relByDay.set(k, []).get(k)!).push(x); };
  const albumIds = new Set(c.albums.map(a => a.id));
  for (const t of c.tracks) {
    (byArtist.get(t.artistId) || byArtist.set(t.artistId, []).get(t.artistId)!).push(t);
    if (t.albumId && t.albumId !== 'single' && albumIds.has(t.albumId) && !t.isSnippet) continue;
    push(t.releaseDate, { kind: t.isSnippet ? 'snippet' : 'track', id: t.id, title: t.title, artistId: t.artistId, artistName: t.artistName, cover: t.coverUrl, plays: t.plays || 0, feat: t.featuredArtist });
  }
  for (const a of c.albums) { push(a.releaseDate, { kind: 'album', id: a.id, title: a.title, artistId: a.artistId, artistName: a.artistName, cover: a.coverUrl, plays: a.totalPlays || 0 }); if (a.label) label.set(a.artistId, a.label); }
  const awardsByMonth = new Map<string, AwardItem[]>();
  for (const a of c.awards) { const k = a.periodType === 'year' ? `${a.year}-12` : `${a.year}-${a.month}`; (awardsByMonth.get(k) || awardsByMonth.set(k, []).get(k)!).push(a); }
  const artistP = personas.filter(p => p.kind === 'artist').sort((a, b) => b.followers - a.followers);
  return { personas, byId, artistP, ext: personas.filter(p => p.kind !== 'artist'), relByDay, byArtist, awardsByMonth, label };
}

const VOICE = (s: string, st: Style, r: () => number) => {
  if (st === 'calm' || st === 'poetic') return s.replace(/!+/g, '.').replace(/\s*🔥+/g, '');
  if (st === 'hype' && r() < 0.5) return `${s} ${['🔥', '🚀', '💥', '⚡️', '❤️‍🔥'][Math.floor(r() * 5)]}`;
  if (st === 'aggressive' && r() < 0.3) return s.toUpperCase();
  if (st === 'meme' && r() < 0.4) return `${s} 😭`;
  return s;
};
function engagement(p: Persona, type: PType, r: () => number) {
  const typeK: Record<PType, number> = { release: 1.7, teaser: 1.3, meme: 2.0, beef: 2.6, respect: 1.1, insider: 1.4, news: 0.8, emotion: 1.0, chart: 0.9, award: 1.5, studio: 0.9, tour: 1.0, throwback: 0.8, question: 1.2, collab: 1.6, fashion: 0.7 };
  const hypeK = 0.6 + (p.hype ?? 55) / 100;
  const base = Math.pow(p.followers, 0.82) * 0.06 * typeK[type] * hypeK * Math.exp((r() - 0.5) * 1.4) * (r() < 0.04 ? 4 : 1);
  const likes = Math.max(3, Math.round(base));
  return { likes, reposts: Math.round(likes * (0.04 + r() * 0.08) * (type === 'beef' || type === 'meme' ? 2 : 1)), commentsTotal: Math.round(likes * (0.012 + r() * 0.03) * (type === 'beef' ? 3 : type === 'question' ? 2.5 : 1)) };
}
function fillT(s: string, v: Record<string, string>) { return s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? ''); }
function pickT(type: PType, st: Style, r: () => number) { const b = T[type]; const pool = [...(b[st] || []), ...(b.any || []), ...(b[st] || [])]; return pool[Math.floor(r() * pool.length)] || ''; }

export function makePost(ix: Index, author: Persona, type: PType, date: string, r: () => number, ctx: { rel?: any; other?: Persona; pos?: number; nom?: string; time?: string } = {}): Post {
  const myTracks = author.artistId ? (ix.byArtist.get(author.artistId) || []).filter(t => !t.isSnippet && (t.releaseDate || '') <= date) : [];
  const topT = [...myTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0))[Math.floor(r() * Math.min(3, myTracks.length))];
  const subject = ctx.rel ? { name: ctx.rel.artistName, title: ctx.rel.title } : author.kind === 'artist' ? { name: author.name, title: topT?.title || '' } : (() => { const a = ix.artistP[Math.floor(Math.pow(r(), 2) * Math.min(40, ix.artistP.length))]; const t = a?.artistId ? [...(ix.byArtist.get(a.artistId) || [])].sort((x, y) => (y.plays || 0) - (x.plays || 0))[0] : undefined; return { name: a?.name || 'кто-то', title: t?.title || 'новый трек' }; })();
  const other = ctx.other || ix.artistP.filter(p => p.id !== author.id)[Math.floor(r() * Math.min(30, Math.max(1, ix.artistP.length - 1)))];
  const otherTop = other?.artistId ? [...(ix.byArtist.get(other.artistId) || [])].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0]?.title : '';
  const v = { t: subject.title, a: subject.name, a2: other?.name || '', t2: otherTop || 'последний релиз', kind: ctx.rel?.kind === 'album' ? 'альбом' : ctx.rel?.kind === 'snippet' ? 'сниппет' : 'трек', plays: fmtK(ctx.rel?.plays || 0), pos: String(ctx.pos || ''), nom: ctx.nom || '', days: String(2 + Math.floor(r() * 12)) };
  let text = fillT(pickT(type, author.style, r), v);
  if (type === 'release' && ctx.rel?.feat) text += ` · feat. ${ctx.rel.feat}`;
  text = VOICE(text, author.style, r);
  const mentions: string[] = []; if (/@/.test(text) && other) mentions.push(other.id);
  const eng = engagement(author, type, r);
  const ckey = type === 'beef' ? 'beef' : type === 'meme' ? 'fun' : type === 'question' ? 'q' : r() < 0.82 ? 'pos' : 'neg';
  const cAuthors = [...ix.ext.filter(p => p.kind === 'page' || p.kind === 'celeb'), ...ix.artistP.slice(0, 25)];
  const comments: Comment[] = Array.from({ length: Math.min(3, 1 + Math.floor(r() * 3)) }, (_, i) => {
    const famous = r() < 0.3; const pool = COMMENTS[i === 2 && r() < 0.4 ? 'fun' : ckey];
    return { id: `c${i}`, author: famous ? cAuthors[Math.floor(r() * cAuthors.length)]?.id || 'fan' : `fan:${['lisa', 'max', 'tima', 'dasha', 'kirill', 'alya', 'nikita', 'sonya', 'egor', 'vika'][Math.floor(r() * 10)]}${Math.floor(r() * 99)}`, text: fillT(pool[Math.floor(r() * pool.length)], v), likes: Math.round(eng.likes * (0.004 + r() * 0.03)) };
  });
  const coverOk = ctx.rel && (type === 'release' || type === 'news' || type === 'teaser' || type === 'chart');
  const sceneKind = type === 'studio' ? 'studio' : type === 'tour' ? 'stage' : type === 'fashion' ? 'neon' : type === 'emotion' ? (r() < 0.5 ? 'sunset' : 'city') : type === 'meme' ? 'car' : null;
  const time = ctx.time || `${pad(8 + Math.floor(r() * 15))}:${pad(Math.floor(r() * 60))}`;
  return {
    id: `p${hash(`${author.id}|${type}|${date}|${text}|${time}`)}`, author: author.id, date, time, type, text,
    cover: coverOk ? { url: ctx.rel.cover, title: ctx.rel.title } : undefined,
    scene: !coverOk && sceneKind && r() < 0.65 ? sceneUri(sceneKind, hash(text), type === 'tour' ? 'LIVE' : '') : undefined,
    ref: ctx.rel ? { view: ctx.rel.kind === 'album' ? 'album' : 'track', id: ctx.rel.id } : undefined,
    mentions, ...eng, comments
  };
}

function genDay(ix: Index, date: string, seed: number): Post[] {
  const r = rng(hash(date) + seed * 9973);
  const out: Post[] = [];
  const rels = ix.relByDay.get(date) || [];
  const prev = [1, 2].flatMap(k => ix.relByDay.get(isoOf(msOf(date) - k * DAY)) || []);
  const pickA = () => ix.artistP[Math.floor(Math.pow(r(), 1.8) * ix.artistP.length)];
  const media = ix.ext.filter(p => p.kind === 'media'); const labels = ix.ext.filter(p => p.kind === 'label'); const celebs = ix.ext.filter(p => p.kind === 'celeb'); const pages = ix.ext.filter(p => p.kind === 'page');
  const one = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  for (const rel of rels.slice(0, 14)) {
    const ap = ix.byId.get(`a:${rel.artistId}`);
    if (ap) out.push(makePost(ix, ap, rel.kind === 'snippet' ? 'teaser' : 'release', date, r, { rel }));
    if (rel.kind !== 'snippet' && r() < 0.7) out.push(makePost(ix, one(media), 'news', date, r, { rel }));
    if (ix.label.get(rel.artistId) && r() < 0.5) out.push(makePost(ix, one(labels), 'release', date, r, { rel }));
    if (ap && r() < 0.35 && ix.artistP.length > 1) { const fan = pickA(); if (fan && fan.id !== ap.id) out.push(makePost(ix, fan, 'respect', date, r, { other: ap })); }
    if (r() < 0.3) out.push(makePost(ix, one(pages), 'meme', date, r, { rel }));
  }
  for (const rel of prev.slice(0, 6)) if (r() < 0.35) out.push(makePost(ix, one([...media, ...pages, ...celebs]), r() < 0.5 ? 'news' : 'meme', date, r, { rel }));
  const aw = ix.awardsByMonth.get(date.slice(0, 7)) || [];
  if (aw.length && +date.slice(8, 10) >= 26 && r() < 0.6) { const a = one(aw); const ap = a.winner.type === 'artist' ? ix.artistP.find(p => norm(p.name) === norm(a.winner.title)) : ix.artistP.find(p => norm(a.winner.artistName).includes(norm(p.name))); out.push(makePost(ix, ap && r() < 0.6 ? ap : one(media), 'award', date, r, { nom: a.nominationTitle, rel: { artistName: a.winner.type === 'artist' ? a.winner.title : a.winner.artistName, title: a.winner.title, cover: a.winner.coverUrl, kind: 'track', id: a.winner.id || '' } })); }
  const extra = 10 + Math.floor(r() * 12);
  const bag: Array<[PType, number]> = [['emotion', 3], ['meme', 3], ['studio', 2], ['insider', 2], ['respect', 2], ['beef', 0.9], ['question', 1.6], ['tour', 1.2], ['throwback', 1.2], ['collab', 1.1], ['fashion', 0.8], ['chart', 1.4]];
  const tot = bag.reduce((s, b) => s + b[1], 0);
  for (let i = 0; i < extra && ix.artistP.length; i++) {
    let x = r() * tot; let type: PType = 'emotion'; for (const [t, w] of bag) { x -= w; if (x <= 0) { type = t; break; } }
    let author: Persona = pickA(); let other: Persona | undefined;
    if (type === 'insider') author = one([...media.filter(m => m.style === 'insider' || r() < 0.4), ...celebs.filter(c => c.style === 'insider')]) || one(media);
    if (type === 'meme') author = r() < 0.7 ? one(pages) : one(celebs);
    if (type === 'fashion') author = r() < 0.6 ? one(celebs) : author;
    if (type === 'chart') author = r() < 0.5 ? one(media) : author;
    if (type === 'beef' || type === 'collab' || type === 'respect') { const near = ix.artistP.filter(p => p.id !== author.id && Math.abs(Math.log10(p.followers) - Math.log10(author.followers)) < 0.8 && (type !== 'beef' || norm(p.genre) === norm(author.genre) || r() < 0.3)); other = near.length ? one(near) : undefined; if (!other) type = 'emotion'; }
    if (type === 'throwback') { const old = author.artistId ? (ix.byArtist.get(author.artistId) || []).filter(t => !t.isSnippet && t.releaseDate && msOf(date) - msOf(t.releaseDate.slice(0, 10)) > 300 * DAY) : []; if (!old.length) type = 'question'; else { const t = one(old); out.push(makePost(ix, author.kind === 'artist' && r() < 0.6 ? author : one(pages), 'throwback', date, r, { rel: { kind: 'track', id: t.id, title: t.title, artistName: t.artistName, cover: t.coverUrl, plays: t.plays } })); continue; } }
    if (type === 'chart') { const ts = (author.artistId ? ix.byArtist.get(author.artistId) : null) || ix.byArtist.get(pickA()?.artistId || '') || []; const t = ts.filter(x => x.peakChartPosition && (x.releaseDate || '') <= date).sort((a, b) => (a.peakChartPosition || 99) - (b.peakChartPosition || 99))[0]; if (!t) continue; out.push(makePost(ix, author, 'chart', date, r, { pos: t.previousChartPosition || t.peakChartPosition, rel: { kind: 'track', id: t.id, title: t.title, artistName: t.artistName, cover: t.coverUrl, plays: t.plays } })); continue; }
    if (author) out.push(makePost(ix, author, type, date, r, { other }));
  }
  const seen = new Set<string>();
  return out.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const Avatar: React.FC<{ p?: Persona; size?: number }> = ({ p, size = 44 }) => {
  if (!p) return <div className="rounded-full bg-zinc-800 shrink-0" style={{ width: size, height: size }} />;
  if (p.kind === 'artist') return <CoverArt url={p.avatar} title={p.name} isArtist className="rounded-full overflow-hidden shrink-0 bg-zinc-900" innerClassName="w-full h-full object-cover" />;
  return <img src={avatarUri(p)} alt="" className="shrink-0" style={{ width: size, height: size }} />;
};
const AvatarBox: React.FC<{ p?: Persona; size?: number }> = ({ p, size = 44 }) => (
  <div className="shrink-0 [&>*]:!w-full [&>*]:!h-full" style={{ width: size, height: size }}><Avatar p={p} size={size} /></div>
);
const SORTS: Array<[string, string]> = [['new', 'Свежие'], ['top', 'Топ по лайкам'], ['hot', 'Обсуждаемые']];
const KINDS: Array<[Kind | 'all', string]> = [['all', 'Все'], ['artist', 'Артисты'], ['label', 'Лейблы'], ['media', 'Издания'], ['celeb', 'Личности'], ['page', 'Паблики']];
const TYPE_CHIPS: Array<PType | 'all'> = ['all', 'release', 'teaser', 'beef', 'meme', 'insider', 'respect', 'emotion', 'chart', 'award', 'studio', 'collab', 'tour', 'throwback', 'question', 'fashion'];
const LIVE_TYPES: PType[] = ['emotion', 'meme', 'studio', 'insider', 'respect', 'question', 'beef', 'collab', 'tour', 'fashion'];

export const SocialIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v10H9l-5 4z" /><path d="M8 9h8M8 12h5" /></svg>
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
  useEffect(() => { if (date === prevToday.current) setDate(today); prevToday.current = today; setLive([]); }, [today]); // eslint-disable-line react-hooks/exhaustive-deps
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [sort, setSort] = useState('new');
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [ptype, setPtype] = useState<PType | 'all'>('all');
  const [q, setQ] = useState('');
  const [seed, setSeed] = useState(() => lsGet<number>('musaic.social.seed', 1));
  const [likedArr, setLikedArr] = useState<string[]>(() => lsGet<string[]>('musaic.social.likes', []));
  const liked = useMemo(() => new Set(likedArr), [likedArr]);
  const [userPosts, setUserPosts] = useState<Post[]>(() => lsGet<Post[]>('musaic.social.posts.v1', []));
  const [live, setLive] = useState<Post[]>([]);
  const [liveOn, setLiveOn] = useState(true);
  const [openC, setOpenC] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => lsSet('musaic.social.seed', seed), [seed]);
  useEffect(() => lsSet('musaic.social.likes', likedArr.slice(-3000)), [likedArr]);
  useEffect(() => lsSet('musaic.social.posts.v1', userPosts.slice(-400)), [userPosts]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);

  const isLiveDay = date === today && range === 'day';
  // live: new posts keep appearing while you watch (simulation or "today")
  useEffect(() => {
    if (!isLiveDay || !liveOn || !ix.artistP.length) return;
    let alive = true; let timer: any;
    const tick = () => {
      const r = rng(Date.now() & 0x7fffffff);
      const type = LIVE_TYPES[Math.floor(r() * LIVE_TYPES.length)];
      const pool = type === 'meme' || type === 'insider' ? ix.ext : r() < 0.75 ? ix.artistP.slice(0, 60) : ix.ext;
      const author = pool[Math.floor(Math.pow(r(), 1.5) * pool.length)];
      const now = new Date();
      if (author && alive) setLive(l => [{ ...makePost(ix, author, type, date, r, { time: `${pad(now.getHours())}:${pad(now.getMinutes())}` }), id: `l${Date.now()}`, likes: 1 + Math.floor(r() * 40), commentsTotal: Math.floor(r() * 6), reposts: 0 }, ...l].slice(0, 40));
      timer = setTimeout(tick, (isSim ? 6000 : 9000) + Math.random() * 7000);
    };
    timer = setTimeout(tick, 4000);
    return () => { alive = false; clearTimeout(timer); };
  }, [isLiveDay, liveOn, ix, date, isSim]);
  // live posts slowly gain likes
  useEffect(() => {
    if (!live.length) return;
    const t = setInterval(() => setLive(l => l.map(p => ({ ...p, likes: p.likes + Math.floor(Math.random() * Math.max(2, Math.sqrt(ix.byId.get(p.author)?.followers || 1e4) / 30)), commentsTotal: p.commentsTotal + (Math.random() < 0.3 ? 1 : 0) }))), 3000);
    return () => clearInterval(t);
  }, [live.length > 0, ix]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => range === 'day' ? [date] : Array.from({ length: 7 }, (_, i) => isoOf(msOf(date) - i * DAY)), [range, date]);
  const posts = useMemo(() => {
    const ds = new Set(days);
    let list = [...days.flatMap(d => genDay(ix, d, seed)), ...userPosts.filter(p => ds.has(p.date)), ...(isLiveDay ? live : [])];
    if (kind !== 'all') list = list.filter(p => (ix.byId.get(p.author)?.kind) === kind);
    if (ptype !== 'all') list = list.filter(p => p.type === ptype);
    if (q.trim()) { const n = norm(q); list = list.filter(p => norm(p.text).includes(n) || norm(ix.byId.get(p.author)?.name).includes(n)); }
    const score = (p: Post) => sort === 'top' ? p.likes + (liked.has(p.id) ? 1 : 0) : sort === 'hot' ? p.commentsTotal * 3 + p.reposts * 2 : 0;
    return list.sort((a, b) => sort === 'new' ? (b.date + b.time).localeCompare(a.date + a.time) : score(b) - score(a)).slice(0, 160);
  }, [days, ix, seed, userPosts, live, isLiveDay, kind, ptype, q, sort, liked]);

  const trends = useMemo(() => {
    const m = new Map<string, { p: Persona; w: number; n: number }>();
    for (const post of posts) {
      const ids = [post.author, ...post.mentions];
      for (const id of ids) { const p = ix.byId.get(id); if (!p || p.kind !== 'artist') continue; const e = m.get(id) || { p, w: 0, n: 0 }; e.w += post.likes; e.n++; m.set(id, e); }
    }
    return [...m.values()].sort((a, b) => b.w - a.w).slice(0, 6);
  }, [posts, ix]);
  const tags = useMemo(() => [...new Set(posts.filter(p => p.cover?.title).map(p => `#${p.cover!.title.replace(/\s+/g, '')}`))].slice(0, 8), [posts]);

  const like = (id: string) => setLikedArr(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));
  const shift = (k: number) => setDate(d => isoOf(msOf(d) + k * DAY));
  const openPersona = (p?: Persona) => { if (p?.artistId) navigateTo('artist', { id: p.artistId }); };
  const randomPost = () => {
    const r = rng((Date.now() ^ seed * 7919) & 0x7fffffff);
    const type = (Object.keys(TYPE_RU) as PType[])[Math.floor(r() * 16)];
    const pool = r() < 0.65 ? ix.artistP.slice(0, 80) : ix.ext; const author = pool[Math.floor(r() * pool.length)];
    if (!author) return;
    const p = { ...makePost(ix, author, type, date, r), user: true }; p.id = `u${Date.now()}`;
    setUserPosts(u => [...u, p]); setSort('new'); setToast('Пост опубликован');
  };

  const highlight = (post: Post) => {
    const names = post.mentions.map(id => ix.byId.get(id)).filter(Boolean) as Persona[];
    if (!names.length) return post.text;
    const parts: React.ReactNode[] = []; let rest = post.text; let k = 0;
    for (const p of names) {
      const tok = `@${p.name}`; const i = rest.indexOf(tok); if (i < 0) continue;
      parts.push(rest.slice(0, i)); parts.push(<button key={k++} type="button" onClick={() => openPersona(p)} className="theme-accent font-semibold hover:underline">{tok}</button>); rest = rest.slice(i + tok.length);
    }
    parts.push(rest); return parts;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter flex items-center gap-3">Лента
            {isLiveDay && <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-widest px-2.5 py-1 rounded-full bg-red-500/15 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE</span>}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Артисты, лейблы, издания и знаменитости · {range === 'day' ? fmtDate(date) : `${fmtDate(days[6])} — ${fmtDate(date)}`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <button type="button" onClick={() => shift(-1)} className="w-8 h-8 rounded-xl hover:bg-white/10 text-zinc-300 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none [color-scheme:dark] px-1" />
            <button type="button" onClick={() => shift(1)} className="w-8 h-8 rounded-xl hover:bg-white/10 text-zinc-300 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
            {date !== today && <button type="button" onClick={() => setDate(today)} className="px-2.5 h-8 rounded-xl text-[11px] font-bold text-zinc-300 hover:bg-white/10">{isSim ? 'Сейчас' : 'Сегодня'}</button>}
          </div>
          <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            {(['day', 'week'] as const).map(v => <button key={v} type="button" onClick={() => setRange(v)} className={`px-3 h-8 rounded-xl text-[11px] font-bold ${range === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>{v === 'day' ? 'День' : 'Неделя'}</button>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="min-w-0 space-y-3">
          {/* composer + controls */}
          <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setCompose(c => !c)} className="flex-1 min-w-[180px] h-10 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-left text-sm text-zinc-400">Что нового? Написать пост от имени…</button>
              <button type="button" onClick={randomPost} className="h-10 px-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 inline-flex items-center gap-2"><Shuffle className="w-3.5 h-3.5" />Случайный пост</button>
              <button type="button" onClick={() => setSeed(s => s + 1)} title="Другая лента на эту дату" className="h-10 px-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" />Обновить</button>
              {isLiveDay && <button type="button" onClick={() => setLiveOn(v => !v)} className="h-10 w-10 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 flex items-center justify-center" title={liveOn ? 'Пауза живой ленты' : 'Включить живую ленту'}>{liveOn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>}
            </div>
            <AnimatePresence initial={false}>{compose && <Composer key="cmp" ix={ix} date={date} onClose={() => setCompose(false)} onPost={p => { setUserPosts(u => [...u, p]); setSort('new'); setDate(p.date); setCompose(false); setToast('Пост опубликован'); }} />}</AnimatePresence>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex p-1 rounded-xl bg-black/30">{SORTS.map(([k, l]) => <button key={k} type="button" onClick={() => setSort(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${sort === k ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'}`}>{l}</button>)}</div>
              <div className="flex p-1 rounded-xl bg-black/30 overflow-x-auto no-scrollbar">{KINDS.map(([k, l]) => <button key={k} type="button" onClick={() => setKind(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${kind === k ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'}`}>{l}</button>)}</div>
              <div className="relative flex-1 min-w-[140px]"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск в ленте" className="w-full h-8 pl-8 pr-2 rounded-xl bg-black/30 text-xs text-white outline-none" /></div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {TYPE_CHIPS.map(t => <button key={t} type="button" onClick={() => setPtype(t)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${ptype === t ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-400 hover:text-white'}`}>{t === 'all' ? 'Все типы' : TYPE_RU[t]}</button>)}
            </div>
          </div>

          {posts.length === 0 && <div className="py-16 text-center text-sm text-zinc-500">Тишина. Смени дату или нажми «Случайный пост».</div>}
          <AnimatePresence initial={false}>
            {posts.map(post => {
              const p = ix.byId.get(post.author); const isL = liked.has(post.id);
              return (
                <motion.article key={post.id} layout="position" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                  className="rounded-3xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] p-4 transition-colors">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => openPersona(p)} className={p?.artistId ? 'cursor-pointer' : 'cursor-default'}><AvatarBox p={p} /></button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button type="button" onClick={() => openPersona(p)} className="text-[14px] font-black text-white hover:underline truncate max-w-[60%] text-left">{p?.name || 'Аккаунт'}</button>
                        {p?.verified && <BadgeCheck className="w-4 h-4 text-sky-400 shrink-0" />}
                        <span className="text-[12px] text-zinc-500 truncate">@{p?.handle} · {fmtDate(post.date)} {post.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{p ? KIND_RU[p.kind] : ''}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/[0.06] text-zinc-300">{TYPE_RU[post.type]}</span>
                        {post.user && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300">твой</span>}
                      </div>
                      <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-100 whitespace-pre-line break-words">{highlight(post)}</p>
                      {post.cover && (
                        <button type="button" onClick={() => post.ref && navigateTo(post.ref.view, { id: post.ref.id })} className="mt-3 block w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border border-white/[0.06]">
                          <CoverArt url={post.cover.url} title={post.cover.title} className="w-full h-full" innerClassName="w-full h-full object-cover" />
                        </button>
                      )}
                      {post.scene && <img src={post.scene} alt="" className="mt-3 w-full max-w-[460px] aspect-[16/10] object-cover rounded-2xl border border-white/[0.06]" />}
                      <div className="mt-3 flex items-center gap-5 text-[12px] text-zinc-500">
                        <button type="button" onClick={() => like(post.id)} className={`inline-flex items-center gap-1.5 transition-colors ${isL ? 'text-rose-400' : 'hover:text-rose-300'}`}>
                          <motion.span key={String(isL)} initial={{ scale: 0.6 }} animate={{ scale: 1 }}><Heart className={`w-4 h-4 ${isL ? 'fill-current' : ''}`} /></motion.span>{fmtK(post.likes + (isL ? 1 : 0))}
                        </button>
                        <button type="button" onClick={() => setOpenC(o => (o === post.id ? null : post.id))} className="inline-flex items-center gap-1.5 hover:text-white"><MessageCircle className="w-4 h-4" />{fmtK(post.commentsTotal)}</button>
                        <span className="inline-flex items-center gap-1.5"><Repeat2 className="w-4 h-4" />{fmtK(post.reposts)}</span>
                        <button type="button" onClick={() => { try { navigator.clipboard?.writeText(`${p?.name}: ${post.text}`); setToast('Текст скопирован'); } catch { /* */ } }} className="inline-flex items-center gap-1.5 hover:text-white"><Share2 className="w-4 h-4" /></button>
                        {post.user && <button type="button" onClick={() => setUserPosts(u => u.filter(x => x.id !== post.id))} className="ml-auto inline-flex items-center gap-1 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                      <AnimatePresence initial={false}>
                        {openC === post.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                              {post.comments.map(c => { const cp = ix.byId.get(c.author); return (
                                <div key={c.id} className="flex gap-2.5 text-[13px]">
                                  {cp ? <AvatarBox p={cp} size={26} /> : <div className="w-[26px] h-[26px] rounded-full bg-zinc-800 shrink-0" />}
                                  <div className="min-w-0"><span className="font-bold text-white mr-1.5">{cp?.name || `@${c.author.replace('fan:', '')}`}</span><span className="text-zinc-300">{c.text}</span>
                                    <div className="text-[10px] text-zinc-600 mt-0.5">♥ {fmtK(c.likes)}</div></div>
                                </div>
                              ); })}
                              {post.commentsTotal > post.comments.length && <div className="text-[11px] text-zinc-500">и ещё {fmtK(post.commentsTotal - post.comments.length)} комментариев</div>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4">
          <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Кого обсуждают</div>
            {trends.length === 0 && <div className="text-xs text-zinc-500">Пока тихо</div>}
            <div className="space-y-2">
              {trends.map((t, i) => (
                <button key={t.p.id} type="button" onClick={() => openPersona(t.p)} className="w-full flex items-center gap-3 text-left group">
                  <span className="w-4 text-[11px] font-black text-zinc-600 tabular-nums">{i + 1}</span>
                  <AvatarBox p={t.p} size={30} />
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-white truncate group-hover:underline">{t.p.name}</span><span className="block text-[10px] text-zinc-500">{t.n} пост. · ♥ {fmtK(t.w)}</span></span>
                </button>
              ))}
            </div>
          </div>
          {tags.length > 0 && (
            <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Тренды</div>
              <div className="flex flex-wrap gap-1.5">{tags.map(t => <button key={t} type="button" onClick={() => setQ(t.slice(1))} className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/[0.05] text-zinc-300 hover:text-white">{t}</button>)}</div>
            </div>
          )}
          <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4 text-[12px] text-zinc-400 space-y-1">
            <div className="flex justify-between"><span>Постов</span><span className="text-white font-bold tabular-nums">{posts.length}</span></div>
            <div className="flex justify-between"><span>Лайков</span><span className="text-white font-bold tabular-nums">{fmtK(posts.reduce((s, p) => s + p.likes, 0))}</span></div>
            <div className="flex justify-between"><span>Твоих постов</span><span className="text-white font-bold tabular-nums">{userPosts.length}</span></div>
            {isLiveDay && <div className="flex items-center gap-1.5 pt-1 text-[11px] text-red-300"><Radio className="w-3.5 h-3.5" />{liveOn ? 'Новые посты появляются в реальном времени' : 'Живая лента на паузе'}</div>}
          </div>
        </aside>
      </div>

      <AnimatePresence>{toast && <motion.div key="t" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-full bg-white text-black text-xs font-bold shadow-2xl">{toast}</motion.div>}</AnimatePresence>
    </div>
  );
};

const Composer: React.FC<{ ix: Index; date: string; onClose: () => void; onPost: (p: Post) => void }> = ({ ix, date, onClose, onPost }) => {
  const [who, setWho] = useState('');
  const [author, setAuthor] = useState<Persona | null>(null);
  const [type, setType] = useState<PType>('emotion');
  const [d, setD] = useState(date);
  const [time, setTime] = useState(() => { const n = new Date(); return `${pad(n.getHours())}:${pad(n.getMinutes())}`; });
  const [text, setText] = useState('');
  const [rel, setRel] = useState('');
  const sugg = useMemo(() => { const n = norm(who); return (n ? ix.personas.filter(p => norm(p.name).includes(n)) : [...ix.artistP.slice(0, 5), ...ix.ext.slice(0, 5)]).slice(0, 8); }, [who, ix]);
  const rels = useMemo(() => author?.artistId ? [...(ix.byArtist.get(author.artistId) || [])].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || '')).slice(0, 30) : [], [author, ix]);
  const relObj = () => { const t = rels.find(x => x.id === rel); return t ? { kind: t.isSnippet ? 'snippet' : 'track', id: t.id, title: t.title, artistName: t.artistName, cover: t.coverUrl, plays: t.plays, feat: t.featuredArtist } : undefined; };
  const gen = () => { if (!author) return; setText(makePost(ix, author, type, d, rng((Date.now() & 0x7fffffff) ^ hash(text)), { rel: relObj() }).text); };
  const post = () => {
    if (!author) return;
    const base = makePost(ix, author, type, d, rng(hash(text + d + time)), { rel: relObj(), time });
    onPost({ ...base, id: `u${Date.now()}`, text: text.trim() || base.text, user: true });
  };
  const inp = 'h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-white/30';
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="space-y-2.5 pt-1">
        {author ? (
          <div className="flex items-center gap-2.5"><AvatarBox p={author} size={32} /><div className="min-w-0 flex-1"><div className="text-sm font-black text-white truncate">{author.name}</div><div className="text-[10px] text-zinc-500">{KIND_RU[author.kind]} · {fmtK(author.followers)} подписчиков</div></div><button type="button" onClick={() => { setAuthor(null); setRel(''); }} className="text-[11px] text-zinc-400 hover:text-white">сменить</button></div>
        ) : (
          <div>
            <input value={who} onChange={e => setWho(e.target.value)} placeholder="Кто пишет: артист, лейбл, издание, личность…" className={`${inp} w-full`} autoFocus />
            <div className="flex flex-wrap gap-1.5 mt-2">{sugg.map(p => <button key={p.id} type="button" onClick={() => setAuthor(p)} className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-zinc-200"><AvatarBox p={p} size={20} />{p.name}</button>)}</div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <select value={type} onChange={e => setType(e.target.value as PType)} className={inp}>{(Object.keys(TYPE_RU) as PType[]).map(t => <option key={t} value={t} className="bg-zinc-950">{TYPE_RU[t]}</option>)}</select>
          <input type="date" value={d} onChange={e => e.target.value && setD(e.target.value)} className={`${inp} [color-scheme:dark]`} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={`${inp} [color-scheme:dark]`} />
          {rels.length > 0 && <select value={rel} onChange={e => setRel(e.target.value)} className={`${inp} max-w-[200px]`}><option value="" className="bg-zinc-950">Без релиза</option>{rels.map(t => <option key={t.id} value={t.id} className="bg-zinc-950">{t.title}</option>)}</select>}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Текст поста (или нажми «Сгенерировать» — в стиле автора)" className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-white/30 resize-none" />
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 h-9 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
          <button type="button" onClick={gen} disabled={!author} className="px-3 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-zinc-200 disabled:opacity-30 inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Сгенерировать</button>
          <button type="button" onClick={post} disabled={!author} className="px-4 h-9 rounded-xl bg-white text-black text-xs font-black disabled:opacity-30 inline-flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Опубликовать</button>
        </div>
      </div>
    </motion.div>
  );
};
