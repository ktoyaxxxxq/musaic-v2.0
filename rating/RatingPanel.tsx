// ============================================================================
// RATING PANEL v2 + compact SCORE BADGE
// RatingPanel  -> drop-in for RatingInputCard (same props + optional `context`)
// ScoreBadge   -> drop-in for RatingScoreBadge (same props, same or smaller size)
// ============================================================================
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { RatingData } from '../types';
import { getNominationGroups, releaseFormat, type NominationContext, type RatingTarget } from './nominationCatalog';

// same formula as calculateRatingScore in App.tsx
const vibeMult = (v: number) => 1 + (Math.max(1, Math.min(10, v || 1)) - 1) * 0.067467;
export const calcScore = (r: number, s: number, st: number, c: number, v: number) =>
  !r && !s && !st && !c && !v ? 0 : Math.min(90, Math.round((r + s + st + c) * 1.4 * vibeMult(v)));

export const tierColor = (score: number) =>
  score >= 90 ? '#fbbf24' : score >= 80 ? '#c084fc' : score >= 70 ? '#60a5fa' : score >= 60 ? '#22d3ee' : score >= 50 ? '#34d399' : '#a1a1aa';
const tierName = (score: number) =>
  score >= 90 ? 'Шедевр' : score >= 80 ? 'Выдающийся' : score >= 70 ? 'Сильный' : score >= 60 ? 'Хороший' : score >= 50 ? 'Средний' : 'Слабый';

// ---------------------------------------------------------------------------
// Score ring (animated)
// ---------------------------------------------------------------------------
const ScoreRing: React.FC<{ score: number; size: number; stroke?: number; children?: React.ReactNode }> = ({ score, size, stroke = 2, children }) => {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const color = tierColor(score);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={len} initial={false} animate={{ strokeDashoffset: len * (1 - score / 90) }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Smooth slider
// ---------------------------------------------------------------------------
const Criterion: React.FC<{ label: string; value: number; color: string; onChange: (v: number) => void; accent?: boolean }> = ({ label, value, color, onChange, accent }) => (
  <div className={`group rounded-2xl px-4 py-3 transition-colors ${accent ? 'bg-white/[0.035]' : 'hover:bg-white/[0.025]'}`}>
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[13px] font-semibold text-zinc-300">{label}</span>
      <motion.span key={value} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-sm font-black tabular-nums" style={{ color }}>
        {value}
      </motion.span>
    </div>
    <div className="relative h-5 flex items-center">
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/[0.07]" />
      <motion.div className="absolute left-0 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
        initial={false} animate={{ width: `${((value - 1) / 9) * 100}%` }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} />
      <motion.div className="absolute w-4 h-4 -ml-2 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform"
        initial={false} animate={{ left: `${((value - 1) / 9) * 100}%` }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} />
      <input type="range" min={1} max={10} step={1} value={value} onChange={e => onChange(parseInt(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer" aria-label={label} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// RatingPanel (replaces RatingInputCard)
// ---------------------------------------------------------------------------
export const RatingPanel: React.FC<{
  rating?: RatingData;
  onChange: (rating: RatingData | undefined) => void;
  onConfirm?: () => void;
  title?: string;
  isStandalone?: boolean;
  targetType?: RatingTarget;
  context?: NominationContext;
}> = ({ rating, onChange, onConfirm, title = 'Оценка', isStandalone = false, targetType = 'track', context }) => {
  const [enabled, setEnabled] = useState(Boolean(rating) || isStandalone);
  const [vals, setVals] = useState({
    rhymes: rating?.rhymes || 8, structure: rating?.structure || 8, style: rating?.style || 8,
    charisma: rating?.charisma || 8, vibe: rating?.vibe || 8
  });
  const [noms, setNoms] = useState<string[]>(rating?.nominations || []);
  const total = calcScore(vals.rhymes, vals.structure, vals.style, vals.charisma, vals.vibe);
  const color = tierColor(total);
  const groups = getNominationGroups(targetType, context);
  const set = (k: keyof typeof vals) => (v: number) => setVals(p => ({ ...p, [k]: v }));

  useEffect(() => {
    onChange(enabled ? { ...vals, totalScore: total, nominations: noms } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, vals, total, noms]);

  return (
    <div className="rounded-[28px] border border-white/[0.07] bg-[#0e0f13]/90 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-black tracking-tight text-white">{title}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-2 py-0.5 rounded-full border border-white/10">
            {releaseFormat(targetType, context)}
          </span>
        </div>
        {!isStandalone && (
          <button type="button" onClick={() => setEnabled(e => !e)}
            className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-white' : 'bg-white/10'}`} aria-label="Включить оценку">
            <motion.span layout className={`absolute top-1 w-4 h-4 rounded-full ${enabled ? 'bg-black right-1' : 'bg-zinc-400 left-1'}`} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="grid md:grid-cols-[1.15fr_1fr] gap-3 px-3 pb-3">
              <div className="space-y-0.5">
                <Criterion label="Рифмы / Образы" value={vals.rhymes} color={color} onChange={set('rhymes')} />
                <Criterion label="Структура / Ритмика" value={vals.structure} color={color} onChange={set('structure')} />
                <Criterion label="Реализация стиля" value={vals.style} color={color} onChange={set('style')} />
                <Criterion label="Индивидуальность / Харизма" value={vals.charisma} color={color} onChange={set('charisma')} />
                <Criterion label="Атмосфера / Вайб" value={vals.vibe} color="#a78bfa" onChange={set('vibe')} accent />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4">
                  <ScoreRing score={total} size={76} stroke={3}>
                    <motion.span key={total} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-black tabular-nums" style={{ color }}>
                      {total}
                    </motion.span>
                  </ScoreRing>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">из 90</div>
                    <div className="text-base font-black text-white">{tierName(total)}</div>
                  </div>
                  {onConfirm && (
                    <motion.button type="button" whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); onConfirm(); }}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-black font-black" style={{ background: color }} title="Сохранить оценку">
                      ✓
                    </motion.button>
                  )}
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-300">Номинации {noms.length > 0 && <span className="text-zinc-500">· {noms.length}</span>}</span>
                    {noms.length > 0 && <button type="button" onClick={() => setNoms([])} className="text-[11px] text-zinc-500 hover:text-white">Сбросить</button>}
                  </div>
                  <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {groups.map(g => (
                      <div key={g.title}>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">{g.title}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {g.items.map(n => {
                            const on = noms.includes(n);
                            return (
                              <motion.button key={n} type="button" layout whileTap={{ scale: 0.95 }}
                                onClick={() => setNoms(p => (p.includes(n) ? p.filter(x => x !== n) : [...p, n]))}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${on ? 'text-black border-transparent' : 'text-zinc-400 border-white/10 hover:text-white hover:border-white/25'}`}
                                style={on ? { background: color } : undefined}>
                                {n}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ScoreBadge (replaces RatingScoreBadge). Sizes: sm 22px, md 36px, lg 48px.
// Popover is rendered in a portal so it is never clipped or shifted by scroll.
// ---------------------------------------------------------------------------
const SIZES = { sm: { box: 22, font: 9, stroke: 1.5 }, md: { box: 36, font: 13, stroke: 2 }, lg: { box: 48, font: 17, stroke: 2.5 } };

export const ScoreBadge: React.FC<{ rating?: RatingData; size?: 'sm' | 'md' | 'lg'; showDetailsOnHover?: boolean }> = ({ rating, size = 'md', showDetailsOnHover = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; top?: number; bottom?: number; up: boolean } | null>(null);
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const b = ref.current.getBoundingClientRect();
    const up = b.bottom + 230 > window.innerHeight;
    const x = Math.min(window.innerWidth - 236, Math.max(8, b.left + b.width / 2 - 114));
    setPos(up ? { x, bottom: window.innerHeight - b.top + 8, up } : { x, top: b.bottom + 8, up });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [open]);
  if (!rating?.totalScore) return null;
  const s = SIZES[size];
  const score = rating.totalScore;
  const color = tierColor(score);
  const rows: Array<[string, number]> = [
    ['Рифмы / Образы', rating.rhymes], ['Структура / Ритмика', rating.structure], ['Стиль', rating.style],
    ['Харизма', rating.charisma], ['Вайб', rating.vibe]
  ];
  return (
    <>
      <div ref={ref} className="inline-flex cursor-pointer rounded-full bg-[#0b0b0e]/90"
        onMouseEnter={() => showDetailsOnHover && setOpen(true)} onMouseLeave={() => showDetailsOnHover && setOpen(false)}
        onClick={e => { e.stopPropagation(); if (showDetailsOnHover) setOpen(o => !o); }}>
        <ScoreRing score={score} size={s.box} stroke={s.stroke}>
          <span className="font-black tabular-nums leading-none" style={{ fontSize: s.font, color }}>{score}</span>
        </ScoreRing>
      </div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div initial={{ opacity: 0, y: pos.up ? 6 : -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.16 }} className="fixed z-[400] w-[228px] rounded-2xl border border-white/10 bg-[#111216]/95 backdrop-blur-xl p-3.5 shadow-2xl pointer-events-none"
              style={{ left: pos.x, top: pos.top, bottom: pos.bottom }}>
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{tierName(score)}</span>
                <span className="text-sm font-black" style={{ color }}>{score}<span className="text-zinc-600 text-xs"> / 90</span></span>
              </div>
              <div className="space-y-1.5">
                {rows.map(([l, v], i) => (
                  <div key={l} className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 w-[118px] truncate">{l}</span>
                    <div className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(v || 0) * 10}%`, background: i === 4 ? '#a78bfa' : color }} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-200 w-4 text-right tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
              {rating.nominations && rating.nominations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-white/[0.06]">
                  {rating.nominations.slice(0, 4).map(n => <span key={n} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">{n}</span>)}
                  {rating.nominations.length > 4 && <span className="text-[10px] text-zinc-500">+{rating.nominations.length - 4}</span>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
