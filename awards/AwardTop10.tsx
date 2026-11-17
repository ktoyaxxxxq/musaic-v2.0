// Top-10 for an award: live percents/votes from the engine, clickable rows,
// optional editor to pick your own top-10 (search, add, remove, reorder).
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import type { AwardItem } from '../types';
import { recomputeAward, rankNomination, targetOfKey, type AwardCatalog, type EngineAward, type EngineNominee } from './awardEngine';

/** Renders modals in <body>, so `fixed` is never broken by transformed parents (fixes the "slides on scroll" bug). */
export const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return typeof document === 'undefined' ? <>{children}</> : createPortal(children, document.body);
};

const fmt = (n?: number) => (n || 0).toLocaleString('ru-RU');

export const AwardTop10: React.FC<{
  award: EngineAward;
  catalog: AwardCatalog;
  awards?: AwardItem[];
  onOpen?: (n: EngineNominee) => void;               // navigate to artist / album / track
  onSaveNominees?: (award: EngineAward) => void;     // when user edits his own top-10
  renderCover?: (n: EngineNominee) => React.ReactNode; // e.g. <CoverArt .../>
}> = ({ award, catalog, awards, onOpen, onSaveNominees, renderCover }) => {
  const live = useMemo(() => recomputeAward(award, catalog, awards), [award, catalog, awards]);
  const nominees = live.nominees || [];
  const total = nominees.reduce((s, n) => s + (n.votesCount || 0), 0);
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
          {nominees.length >= 10 ? 'Топ-10' : `Номинантов: ${nominees.length}`} · голосование
          {nominees.length < 10 && <span className="ml-1.5 normal-case font-semibold text-zinc-500">в этом периоде больше нет релизов</span>}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500">Всего голосов: <b className="text-zinc-300">{fmt(total)}</b></span>
          {onSaveNominees && (
            <button type="button" onClick={() => setEditing(true)} className="text-[11px] font-bold text-zinc-400 hover:text-white">
              {live.nomineesMode === 'manual' ? 'Мой топ ✎' : 'Свой топ ✎'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {nominees.map((n, i) => (
          <motion.button key={`${n.type}:${n.id}:${i}`} type="button" layout onClick={() => onOpen?.(n)}
            className={`w-full text-left rounded-xl px-3 py-2 border transition-colors ${i === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.025] border-white/[0.05] hover:bg-white/[0.06]'}`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${i === 0 ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-300'}`}>{i + 1}</span>
              {renderCover && <span className={`w-7 h-7 shrink-0 overflow-hidden ${n.type === 'artist' ? 'rounded-full' : 'rounded-md'}`}>{renderCover(n)}</span>}
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">
                {n.title}{n.type !== 'artist' && n.artistName && <span className="font-medium text-zinc-500"> · {n.artistName}</span>}
                {n.inPeriod === false && <span className="ml-1.5 text-[10px] text-zinc-600">вне периода</span>}
              </span>
              <span className="text-[13px] font-black text-white tabular-nums">{n.votesPercent}%</span>
              <span className="text-[10px] text-zinc-500 tabular-nums w-[68px] text-right">{fmt(n.votesCount)}</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div className={`h-full rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-zinc-500'}`} initial={false} animate={{ width: `${n.votesPercent || 0}%` }} transition={{ type: 'spring', stiffness: 160, damping: 24 }} />
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {editing && onSaveNominees && (
          <ModalPortal>
            <Top10Editor award={live} catalog={catalog} awards={awards} onClose={() => setEditing(false)}
              onSave={(list, mode) => { onSaveNominees(recomputeAward({ ...award, nominees: list, nomineesMode: mode }, catalog, awards)); setEditing(false); }} />
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
};

const Top10Editor: React.FC<{
  award: EngineAward; catalog: AwardCatalog; awards?: AwardItem[];
  onClose: () => void; onSave: (list: EngineNominee[], mode: 'auto' | 'manual') => void;
}> = ({ award, catalog, awards, onClose, onSave }) => {
  const [list, setList] = useState<EngineNominee[]>(() => (award.nominees || []).slice(1)); // winner stays fixed on top
  const [q, setQ] = useState('');
  const period = { year: award.year, month: award.periodType === 'month' ? award.month : undefined };
  const pool = useMemo(() => rankNomination(award.nominationKey, period, catalog, awards), [award.nominationKey, award.year, award.month, catalog, awards]);
  const has = (id?: string) => list.some(n => n.id === id) || award.winner.id === id;
  const target = targetOfKey(award.nominationKey);
  const found = useMemo(() => {
    const s = q.toLowerCase().trim();
    const base = pool.length ? pool : [];
    const extra = s && target === 'artist' ? catalog.artists.filter(a => a.name.toLowerCase().includes(s)).map(a => ({ id: a.id, type: 'artist' as const, title: a.name, coverUrl: a.imageUrl }))
      : s && target === 'album' ? catalog.albums.filter(a => a.title.toLowerCase().includes(s)).map(a => ({ id: a.id, type: 'album' as const, title: a.title, artistName: a.artistName, coverUrl: a.coverUrl }))
      : s ? catalog.tracks.filter(t => t.title.toLowerCase().includes(s)).map(t => ({ id: t.id, type: 'track' as const, title: t.title, artistName: t.artistName, coverUrl: t.coverUrl })) : [];
    const all = [...base.filter(c => !s || `${c.title} ${c.artistName || ''}`.toLowerCase().includes(s)), ...extra];
    const seen = new Set<string>();
    return all.filter(c => !has(c.id) && !seen.has(c.id) && seen.add(c.id)).slice(0, 30);
  }, [q, pool, list, catalog]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }}
        className="relative w-full max-w-lg max-h-[86vh] flex flex-col rounded-3xl border border-white/10 bg-[#0e0f13] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-white">Свой топ-10 · {award.nominationTitle}</div>
            <div className="text-[11px] text-zinc-500">Победитель «{award.winner.title}» остаётся первым. Перетаскивай, чтобы менять порядок.</div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white text-lg">×</button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
          <Reorder.Group axis="y" values={list} onReorder={setList} className="space-y-1">
            {list.map((n, i) => (
              <Reorder.Item key={`${n.id}`} value={n} className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2 cursor-grab active:cursor-grabbing">
                <span className="text-[11px] text-zinc-500 w-4">{i + 2}</span>
                <span className="flex-1 min-w-0 truncate text-[13px] font-bold text-white">{n.title}<span className="text-zinc-500 font-medium">{n.artistName && n.type !== 'artist' ? ` · ${n.artistName}` : ''}</span></span>
                <button type="button" onClick={() => setList(l => l.filter(x => x !== n))} className="text-zinc-500 hover:text-red-400 text-sm">×</button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {list.length < 9 && (
            <div className="space-y-2">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Найти и добавить..." className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30" />
              <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                {found.map(c => (
                  <button key={c.id} type="button" onClick={() => setList(l => [...l, { id: c.id, type: c.type, title: c.title, artistName: c.artistName, coverUrl: c.coverUrl }])}
                    className="w-full text-left flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 hover:bg-white/[0.06] text-[12px] text-zinc-300">
                    <span className="truncate">{c.title}{c.artistName && c.type !== 'artist' ? <span className="text-zinc-500"> · {c.artistName}</span> : null}</span>
                    <span className="text-zinc-500">+</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-white/[0.06] flex justify-between gap-2">
          <button type="button" onClick={() => onSave([], 'auto')} className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white">Вернуть авто-топ</button>
          <button type="button" onClick={() => onSave([{ ...award.winner, id: award.winner.id, type: award.winner.type } as EngineNominee, ...list], 'manual')}
            className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black">Сохранить топ</button>
        </div>
      </motion.div>
    </div>
  );
};
