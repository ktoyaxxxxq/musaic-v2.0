// ============================================================================
// STUDIO TOOLS
// - ReleaseCalendarButton: small calendar icon -> release calendar with
//   announcements, pre-saves and countdowns (+ future releases & snippets)
// - AlbumFromTracksButton: build an album at a chosen date from released singles
// Light: one interval only while the calendar is open, covers resized to 256px.
// ============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';

type AnyTrack = { id: string; title: string; artistId?: string; artistName?: string; albumId?: string; albumTitle?: string; releaseDate?: string; plays?: number; coverUrl?: string; isSnippet?: boolean; snippetTeaser?: string; genre?: string; featuredArtist?: string };
type AnyAlbum = { id: string; title: string; artistId?: string; artistName?: string; releaseDate?: string; releaseYear?: number; coverUrl?: string; totalPlays?: number; genre?: string };
type AnyArtist = { id: string; name: string; followers?: number; imageUrl?: string };

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => { const p = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = p; }; }, []);
  return createPortal(children, document.body);
};
const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parseDay(s?: string): string | null {
  if (!s) return null;
  let m = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(s.trim());
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/.exec(s.trim());
  if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  return null;
}
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const shortDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1].slice(0, 3).toLowerCase()} ${y}`; };
const fmt = (n: number) => n.toLocaleString('ru-RU');

/** small cover for localStorage (keeps the data light) */
function shrinkImage(file: File, size = 256): Promise<string> {
  return new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        const ctx = c.getContext('2d')!; const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = fr.result as string;
    };
    fr.readAsDataURL(file);
  });
}
const IconBtn: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button type="button" onClick={onClick} title={title}
    className="p-2 rounded-full bg-zinc-900/75 hover:bg-zinc-800/90 border border-white/10 hover:border-white/25 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0">
    {children}
  </button>
);
const CalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
);

// ---------------------------------------------------------------------------
// release calendar
// ---------------------------------------------------------------------------
export interface Announcement {
  id: string; title: string; artistName: string; artistId?: string;
  type: 'single' | 'ep' | 'album' | 'snippet' | 'clip'; date: string; time?: string;
  coverUrl?: string; note?: string; presaves: number; released?: boolean; createdAt: number;
}
const LS = 'musaic.announcements';
const loadAnn = (): Announcement[] => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; } };
const saveAnn = (a: Announcement[]) => { try { localStorage.setItem(LS, JSON.stringify(a)); } catch { /* quota */ } };
const TYPE_LABEL: Record<Announcement['type'], string> = { single: 'Сингл', ep: 'EP', album: 'Альбом', snippet: 'Сниппет', clip: 'Клип' };

interface CalItem { key: string; title: string; artist: string; date: string; time?: string; cover?: string; kind: string; source: 'ann' | 'catalog' | 'snippet'; ann?: Announcement; refId?: string; refType?: 'track' | 'album' }

function useCountdown(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!active) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [active]);
  return now;
}
function left(target: number, now: number) {
  const d = Math.max(0, target - now);
  const days = Math.floor(d / 864e5), h = Math.floor((d % 864e5) / 36e5), m = Math.floor((d % 36e5) / 6e4), s = Math.floor((d % 6e4) / 1e3);
  return days > 0 ? `${days} д ${h} ч ${m} мин` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}
/** realistic pre-saves: audience x hype that grows as the date gets closer */
function projectedPresaves(a: Announcement, artist?: AnyArtist, now = Date.now()) {
  const fol = artist?.followers || 50_000;
  const daysOut = (new Date(`${a.date}T${a.time || '00:00'}`).getTime() - a.createdAt) / 864e5;
  const passed = Math.max(0, Math.min(1, (now - a.createdAt) / Math.max(1, daysOut * 864e5)));
  const typeK = a.type === 'album' ? 0.03 : a.type === 'ep' ? 0.02 : a.type === 'snippet' ? 0.006 : 0.012;
  return Math.round(fol * typeK * (0.15 + 0.85 * Math.pow(passed, 1.6))) + a.presaves;
}

export const ReleaseCalendarButton: React.FC<{
  artists: AnyArtist[]; tracks: AnyTrack[]; albums: AnyAlbum[];
  onRelease?: (a: Announcement) => void; // create the track when the date has come
  todayIso?: string;                      // e.g. simulation date
}> = props => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconBtn onClick={() => setOpen(true)} title="Календарь релизов"><CalIcon /></IconBtn>
      <AnimatePresence>{open && <Portal><ReleaseCalendar {...props} onClose={() => setOpen(false)} /></Portal>}</AnimatePresence>
    </>
  );
};

const ReleaseCalendar: React.FC<React.ComponentProps<typeof ReleaseCalendarButton> & { onClose: () => void }> = ({ artists, tracks, albums, onRelease, todayIso, onClose }) => {
  const today = todayIso || toISO(new Date());
  const [ann, setAnn] = useState<Announcement[]>(loadAnn);
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selDay, setSelDay] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Announcement> | null>(null);
  const now = useCountdown(true);
  useEffect(() => saveAnn(ann), [ann]);

  const items = useMemo<CalItem[]>(() => {
    const out: CalItem[] = ann.map(a => ({ key: a.id, title: a.title, artist: a.artistName, date: a.date, time: a.time, cover: a.coverUrl, kind: TYPE_LABEL[a.type], source: 'ann', ann: a }));
    for (const t of tracks) {
      const d = parseDay(t.releaseDate);
      if (!d) continue;
      if (t.isSnippet) out.push({ key: `s-${t.id}`, title: t.title, artist: t.artistName || '', date: d, cover: t.coverUrl, kind: 'Сниппет', source: 'snippet', refId: t.id, refType: 'track' });
      else if (d > today && (!t.albumId || t.albumId === 'single')) out.push({ key: `t-${t.id}`, title: t.title, artist: t.artistName || '', date: d, cover: t.coverUrl, kind: 'Сингл', source: 'catalog', refId: t.id, refType: 'track' });
    }
    for (const a of albums) {
      const d = parseDay(a.releaseDate);
      if (d && d > today) out.push({ key: `a-${a.id}`, title: a.title, artist: a.artistName || '', date: d, cover: a.coverUrl, kind: 'Альбом', source: 'catalog', refId: a.id, refType: 'album' });
    }
    return out.sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')));
  }, [ann, tracks, albums, today]);

  const byDay = useMemo(() => { const m = new Map<string, CalItem[]>(); items.forEach(i => m.set(i.date, [...(m.get(i.date) || []), i])); return m; }, [items]);
  const upcoming = items.filter(i => i.date >= today && !(i.ann?.released)).slice(0, 20);
  const recent = items.filter(i => i.date < today && i.date >= toISO(new Date(new Date(today).getTime() - 21 * 864e5))).slice(-8).reverse();

  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysIn = new Date(y, m, 0).getDate();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${month}-${pad(i + 1)}`)];
  const shift = (k: number) => { const d = new Date(y, m - 1 + k, 1); setMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); setSelDay(null); };
  const list = selDay ? byDay.get(selDay) || [] : upcoming;
  const artistOf = (name: string) => artists.find(a => a.name.toLowerCase() === name.toLowerCase());

  const saveForm = () => {
    if (!form?.title?.trim() || !form.date) return;
    const art = artistOf(form.artistName || '');
    const entry: Announcement = {
      id: form.id || `ann_${Date.now().toString(36)}`, title: form.title.trim(), artistName: (form.artistName || '').trim() || 'Без артиста', artistId: art?.id,
      type: (form.type as Announcement['type']) || 'single', date: form.date, time: form.time || undefined, coverUrl: form.coverUrl, note: form.note?.trim() || undefined,
      presaves: form.presaves || 0, released: form.released, createdAt: form.createdAt || Date.now()
    };
    setAnn(prev => [...prev.filter(a => a.id !== entry.id), entry]);
    setForm(null);
  };

  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center p-3 sm:p-6">
      <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[28px] border border-white/10 bg-[#0e0f13] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black text-white">Календарь релизов</div>
            <div className="text-[11px] text-zinc-500">Анонсы, пре-сейвы, сниппеты и запланированные релизы</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setForm({ date: selDay || today, type: 'single', presaves: 0 })} className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-black">+ Анонс</button>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar grid md:grid-cols-[1.1fr_1fr]">
          <div className="p-5 border-b md:border-b-0 md:border-r border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => shift(-1)} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-300">‹</button>
              <div className="text-sm font-black text-white">{MONTHS[m - 1]} {y}</div>
              <button type="button" onClick={() => shift(1)} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-300">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-600 uppercase mb-1">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={`p${i}`} />;
                const its = byDay.get(d) || [];
                const isSel = selDay === d;
                return (
                  <button key={d} type="button" onClick={() => setSelDay(isSel ? null : d)}
                    className={`relative aspect-square rounded-xl text-[12px] font-bold overflow-hidden transition-colors ${isSel ? 'ring-2 ring-white' : ''} ${d === today ? 'text-black bg-white' : 'text-zinc-300 bg-white/[0.03] hover:bg-white/[0.08]'}`}>
                    {its[0]?.cover && d !== today && <img src={its[0].cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />}
                    <span className="relative">{+d.slice(8)}</span>
                    {its.length > 0 && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">{its.slice(0, 3).map(x => <span key={x.key} className={`w-1 h-1 rounded-full ${x.source === 'snippet' ? 'bg-sky-400' : x.source === 'ann' ? 'bg-amber-400' : 'bg-emerald-400'}`} />)}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 mt-3 text-[10px] text-zinc-500"><span>● <span className="text-amber-400">анонс</span></span><span>● <span className="text-emerald-400">запланирован</span></span><span>● <span className="text-sky-400">сниппет</span></span></div>
            {recent.length > 0 && !selDay && (
              <div className="mt-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Недавно вышло</div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {recent.map(r => (
                    <div key={r.key} className="shrink-0 w-24">
                      <div className="w-24 h-24 rounded-xl bg-zinc-800 overflow-hidden">{r.cover && <img src={r.cover} alt="" className="w-full h-full object-cover" />}</div>
                      <div className="text-[11px] font-bold text-white truncate mt-1">{r.title}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{r.artist}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{selDay ? shortDate(selDay) : 'Скоро'}</div>
            {list.length === 0 && <div className="text-xs text-zinc-500 py-8 text-center">Пусто. Нажми «+ Анонс», чтобы запланировать релиз.</div>}
            {list.map(it => {
              const target = new Date(`${it.date}T${it.time || '00:00'}`).getTime();
              const isPast = it.date < today || target <= now;
              const art = artistOf(it.artist);
              return (
                <motion.div key={it.key} layout className="flex gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0">{it.cover && <img src={it.cover} alt="" className="w-full h-full object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.07] text-zinc-300">{it.kind}</span>
                      <span className="text-[10px] text-zinc-500">{shortDate(it.date)}{it.time ? ` · ${it.time}` : ''}</span>
                    </div>
                    <div className="text-[14px] font-black text-white truncate mt-0.5">{it.title}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{it.artist}{it.ann?.note ? ` · ${it.ann.note}` : ''}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {!isPast ? <span className="text-[11px] font-black text-emerald-300 tabular-nums">через {left(target, now)}</span> : <span className="text-[11px] font-bold text-zinc-500">{it.ann?.released ? 'вышел' : 'дата наступила'}</span>}
                      {it.ann && (
                        <>
                          <button type="button" onClick={() => setAnn(p => p.map(a => a.id === it.ann!.id ? { ...a, presaves: a.presaves + 1 } : a))}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200">♥ пре-сейв · {fmt(projectedPresaves(it.ann, art, now))}</button>
                          <button type="button" onClick={() => setForm({ ...it.ann })} className="text-[10px] text-zinc-500 hover:text-white">изм.</button>
                          <button type="button" onClick={() => setAnn(p => p.filter(a => a.id !== it.ann!.id))} className="text-[10px] text-zinc-600 hover:text-red-400">удалить</button>
                          {isPast && !it.ann.released && onRelease && (it.ann.type === 'single' || it.ann.type === 'snippet') && (
                            <button type="button" onClick={() => { onRelease(it.ann!); setAnn(p => p.map(a => a.id === it.ann!.id ? { ...a, released: true } : a)); }}
                              className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-black">Выпустить</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {form && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
              <motion.div initial={{ y: 12 }} animate={{ y: 0 }} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121318] p-5 space-y-3">
                <div className="text-sm font-black text-white">{form.id ? 'Изменить анонс' : 'Новый анонс'}</div>
                <input placeholder="Название релиза" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
                <input list="musaic-artists" placeholder="Исполнитель" value={form.artistName || ''} onChange={e => setForm({ ...form, artistName: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
                <datalist id="musaic-artists">{artists.slice(0, 300).map(a => <option key={a.id} value={a.name} />)}</datalist>
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(TYPE_LABEL) as Announcement['type'][]).map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${form.type === t ? 'bg-white text-black' : 'bg-white/[0.05] text-zinc-400'}`}>{TYPE_LABEL[t]}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" />
                  <input type="time" value={form.time || ''} onChange={e => setForm({ ...form, time: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" />
                </div>
                <input placeholder="Заметка (тизер, фит, клип...)" value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
                <label className="flex items-center gap-3 text-xs text-zinc-400 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden">{form.coverUrl && <img src={form.coverUrl} alt="" className="w-full h-full object-cover" />}</div>
                  <span>Обложка (необязательно)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setForm({ ...form, coverUrl: await shrinkImage(f) }); }} />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setForm(null)} className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white">Отмена</button>
                  <button type="button" onClick={saveForm} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black">Сохранить</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// album from released tracks
// ---------------------------------------------------------------------------
export const AlbumFromTracksButton: React.FC<{
  artists: AnyArtist[]; albums: AnyAlbum[]; tracks: AnyTrack[];
  setAlbums: (fn: (prev: any[]) => any[]) => void; setTracks: (fn: (prev: any[]) => any[]) => void;
  className?: string;
}> = props => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Собрать альбом из уже вышедших треков"
        className={props.className || 'px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap'}>
        💿 Альбом из треков
      </button>
      <AnimatePresence>{open && <Portal><AlbumFromTracks {...props} onClose={() => setOpen(false)} /></Portal>}</AnimatePresence>
    </>
  );
};

const AlbumFromTracks: React.FC<React.ComponentProps<typeof AlbumFromTracksButton> & { onClose: () => void }> = ({ artists, albums, tracks, setAlbums, setTracks, onClose }) => {
  const [artistId, setArtistId] = useState('');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<AnyTrack[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [cover, setCover] = useState<string | undefined>();
  const [moveDates, setMoveDates] = useState(true);
  const [applyCover, setApplyCover] = useState(true);
  const [undo, setUndo] = useState<null | { albums: any[]; tracks: any[]; name: string }>(null);

  const artist = artists.find(a => a.id === artistId);
  const albumIds = useMemo(() => new Set(albums.map(a => a.id)), [albums]);
  const singles = useMemo(() => {
    if (!artist) return [];
    const n = artist.name.toLowerCase();
    return tracks.filter(t => (t.artistId === artist.id || (t.artistName || '').toLowerCase() === n) && (!t.albumId || t.albumId === 'single' || !albumIds.has(t.albumId)) && !t.isSnippet)
      .filter(t => !q || t.title.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (parseDay(a.releaseDate) || '').localeCompare(parseDay(b.releaseDate) || ''));
  }, [artist, tracks, albumIds, q]);
  const groups = useMemo(() => {
    const m = new Map<string, AnyTrack[]>();
    singles.forEach(t => { const k = (parseDay(t.releaseDate) || 'без даты').slice(0, 7); m.set(k, [...(m.get(k) || []), t]); });
    return [...m.entries()];
  }, [singles]);
  const has = (t: AnyTrack) => picked.some(p => p.id === t.id);
  const toggle = (t: AnyTrack) => setPicked(p => (has(t) ? p.filter(x => x.id !== t.id) : [...p, t]));
  useEffect(() => {
    if (!date && picked.length) setDate(picked.map(t => parseDay(t.releaseDate)).filter(Boolean).sort()[0] || '');
    if (!cover && picked.length) setCover(picked.find(t => t.coverUrl)?.coverUrl);
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = () => {
    if (!artist || !title.trim() || !date || picked.length === 0) return;
    const id = `alb_${Date.now().toString(36)}`;
    const totalPlays = picked.reduce((s, t) => s + (t.plays || 0), 0);
    const genre = picked.map(t => t.genre).find(Boolean);
    const album = { id, title: title.trim(), artistId: artist.id, artistName: artist.name, coverUrl: cover || '', releaseYear: +date.slice(0, 4), releaseDate: date, genre: genre || '', isLiked: false, totalPlays };
    const ids = new Set(picked.map(t => t.id));
    const snapshot = { albums, tracks, name: album.title };
    setAlbums(prev => [...prev, album]);
    setTracks(prev => {
      const rest = prev.filter(t => !ids.has(t.id));
      const moved = picked.map(p => {
        const t = prev.find(x => x.id === p.id) || p;
        return { ...t, albumId: id, albumTitle: album.title, ...(moveDates ? { releaseDate: date } : {}), ...(applyCover && cover ? { coverUrl: cover } : {}) };
      });
      return [...rest, ...moved]; // tracklist order = the order you picked
    });
    setUndo(snapshot);
    setPicked([]); setTitle(''); setDate(''); setCover(undefined);
  };

  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center p-3 sm:p-6">
      <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[28px] border border-white/10 bg-[#0e0f13] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-white">Альбом из вышедших треков</div>
            <div className="text-[11px] text-zinc-500">Выбери синглы: они станут треками альбома, как будто всегда в нём были</div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white">×</button>
        </div>
        {undo && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200 flex items-center justify-between">
            <span>Альбом «{undo.name}» создан</span>
            <button type="button" onClick={() => { setAlbums(() => undo.albums); setTracks(() => undo.tracks); setUndo(null); }} className="font-bold text-white hover:underline">Отменить</button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar grid md:grid-cols-2 gap-0">
          <div className="p-5 space-y-3 border-b md:border-b-0 md:border-r border-white/[0.06]">
            <select value={artistId} onChange={e => { setArtistId(e.target.value); setPicked([]); }} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
              <option value="">Выбери исполнителя</option>
              {[...artists].sort((a, b) => a.name.localeCompare(b.name, 'ru')).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {artist && <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по трекам..." className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none" />}
            {artist && groups.length === 0 && <div className="text-xs text-zinc-500 py-6 text-center">У артиста нет синглов вне альбомов</div>}
            {groups.map(([k, list]) => (
              <div key={k}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{k === 'без даты' ? k : `${MONTHS[+k.slice(5) - 1]} ${k.slice(0, 4)}`} · {list.length}</span>
                  <button type="button" onClick={() => setPicked(p => [...p, ...list.filter(t => !p.some(x => x.id === t.id))])} className="text-[10px] font-bold text-zinc-400 hover:text-white">выбрать все</button>
                </div>
                {list.map(t => (
                  <button key={t.id} type="button" onClick={() => toggle(t)} className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left ${has(t) ? 'bg-white/[0.09]' : 'hover:bg-white/[0.04]'}`}>
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${has(t) ? 'bg-white border-white text-black' : 'border-white/25'}`}>{has(t) ? '✓' : ''}</span>
                    <span className="flex-1 min-w-0 text-[13px] font-semibold text-white truncate">{t.title}</span>
                    <span className="text-[10px] text-zinc-500">{parseDay(t.releaseDate) ? shortDate(parseDay(t.releaseDate)!) : '—'}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="p-5 space-y-3">
            <div className="flex gap-3">
              <label className="w-24 h-24 rounded-2xl bg-zinc-800 overflow-hidden shrink-0 cursor-pointer relative" title="Сменить обложку">
                {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
                {!cover && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-500 text-center px-2">обложка</span>}
                <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setCover(await shrinkImage(f, 600)); }} />
              </label>
              <div className="flex-1 space-y-2">
                <input placeholder="Название альбома" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" />
                <div className="text-[11px] text-zinc-500">{picked.length} {picked.length <= 7 ? '· будет EP' : '· альбом'} · {fmt(picked.reduce((s, t) => s + (t.plays || 0), 0))} прослушиваний</div>
              </div>
            </div>
            {picked.some(t => t.coverUrl) && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">{picked.filter(t => t.coverUrl).slice(0, 10).map(t => (
                <button key={t.id} type="button" onClick={() => setCover(t.coverUrl)} className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${cover === t.coverUrl ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}><img src={t.coverUrl} alt="" className="w-full h-full object-cover" /></button>
              ))}</div>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"><input type="checkbox" checked={moveDates} onChange={e => setMoveDates(e.target.checked)} /> Поставить всем трекам дату альбома</label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"><input type="checkbox" checked={applyCover} onChange={e => setApplyCover(e.target.checked)} /> Обложка альбома для всех треков</label>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold pt-1">Треклист · перетаскивай</div>
            <Reorder.Group axis="y" values={picked} onReorder={setPicked} className="space-y-1">
              {picked.map((t, i) => (
                <Reorder.Item key={t.id} value={t} className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 cursor-grab active:cursor-grabbing">
                  <span className="text-[11px] text-zinc-500 w-4">{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate text-[13px] font-bold text-white">{t.title}</span>
                  <button type="button" onClick={() => toggle(t)} className="text-zinc-500 hover:text-red-400">×</button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button type="button" onClick={create} disabled={!artist || !title.trim() || !date || !picked.length}
              className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-black disabled:opacity-30">Создать альбом</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
