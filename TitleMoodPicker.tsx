import React, { useEffect, useRef, useState } from 'react';
import { TITLE_MOOD_OPTIONS, type TitleMood } from './titleGen';

interface TitleMoodPickerProps {
  value: TitleMood;
  onChange: (mood: TitleMood) => void;
  className?: string;
}

/** Small button next to the dice: opens a compact grid of title moods. */
export const TitleMoodPicker: React.FC<TitleMoodPickerProps> = ({ value, onChange, className = '' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = TITLE_MOOD_OPTIONS.find(o => o.id === value) ?? TITLE_MOOD_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={`Настроение названия: ${current.name}`}
        className={`h-full min-h-[38px] px-3 rounded-2xl border text-sm cursor-pointer transition-all flex items-center justify-center ${
          value !== 'all'
            ? 'border-white/30 bg-white/[0.12]'
            : 'border-white/10 bg-white/[0.06] hover:bg-white/[0.14]'
        }`}
      >
        <span className="leading-none">{current.emoji}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[80] w-[260px] p-2 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
          <div className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Настроение трека</div>
          <div className="grid grid-cols-2 gap-1">
            {TITLE_MOOD_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-left cursor-pointer transition-colors ${
                  value === opt.id ? 'theme-bg-accent text-black font-bold' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{opt.emoji}</span>
                <span className="truncate">{opt.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
