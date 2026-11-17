// Title generator for the regular creator, album tracklists, edit modals and the batch tool
// (not only simulation). Uses the same generator v2 as SimulationMode.
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { generateModernTitle, analyzeArtistNamingStyle, TITLE_MOOD_OPTIONS, type TitleMood } from './index';

interface CatalogLike {
  artist?: { id?: string; name?: string; genre?: string; country?: string } | null;
  tracks?: Array<{ title?: string; artistId?: string; artistName?: string }>;
  albums?: Array<{ title?: string; artistId?: string; artistName?: string }>;
}

function artistItems<T extends { artistId?: string; artistName?: string }>(list: T[] = [], a?: CatalogLike['artist']) {
  if (!a) return [];
  const n = (a.name || '').toLowerCase().trim();
  return list.filter(x => (a.id && x.artistId === a.id) || (x.artistName || '').toLowerCase().trim() === n);
}

/** One title. `isAlbum` = title for an album/EP. */
export function generateTitleFor(c: CatalogLike, isAlbum = false, mood: TitleMood = 'all', extraTaken: string[] = []): string {
  const existing = new Set<string>([...(c.tracks || []), ...(c.albums || [])].map(x => (x.title || '').toLowerCase()).concat(extraTaken.map(t => t.toLowerCase())));
  const profile = c.artist ? analyzeArtistNamingStyle(c.artist, artistItems(c.tracks, c.artist), artistItems(c.albums, c.artist)) : false;
  return generateModernTitle(existing, isAlbum, profile, 'auto', mood);
}

/** N unique titles for an album tracklist (fills only empty slots when `current` is given). */
export function generateTracklist(c: CatalogLike, count: number, mood: TitleMood = 'all', current: string[] = []): string[] {
  const out = [...current];
  while (out.length < count) out.push('');
  const taken = out.filter(Boolean);
  return out.map(t => {
    if (t.trim()) return t;
    const title = generateTitleFor(c, false, mood, taken);
    taken.push(title);
    return title;
  });
}

/** Input with a dice button and a mood picker. Drop it in place of a plain title <input>. */
export const TitleGenField: React.FC<CatalogLike & {
  value: string;
  onChange: (v: string) => void;
  isAlbum?: boolean;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, isAlbum = false, placeholder = 'Название', className = '', ...catalog }) => {
  const [mood, setMood] = useState<TitleMood>('all');
  const [spin, setSpin] = useState(0);
  const moodLabel = useMemo(() => TITLE_MOOD_OPTIONS.find(m => m.id === mood)?.emoji || '🎲', [mood]);
  const roll = () => { onChange(generateTitleFor(catalog, isAlbum, mood, value ? [value] : [])); setSpin(s => s + 1); };
  return (
    <div className={`flex items-center gap-1.5 rounded-xl bg-black/40 border border-white/10 focus-within:border-white/30 pl-3 pr-1.5 py-1 ${className}`}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none" />
      <select value={mood} onChange={e => setMood(e.target.value as TitleMood)} title="Тема названия"
        className="bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-xs text-zinc-300 py-1.5 px-1.5 outline-none cursor-pointer">
        {TITLE_MOOD_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
      </select>
      <motion.button type="button" onClick={roll} title={`Сгенерировать название (${moodLabel})`}
        animate={{ rotate: spin * 180 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="w-8 h-8 shrink-0 rounded-lg bg-white text-black flex items-center justify-center text-base font-black">
        🎲
      </motion.button>
    </div>
  );
};
