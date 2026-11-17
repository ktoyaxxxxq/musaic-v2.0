import React, { useEffect, useRef, useState } from 'react';
import {
  TITLE_MOOD_OPTIONS,
  TITLE_LANG_OPTIONS,
  getTitleLanguage,
  setTitleLanguage,
  type TitleMood,
  type TitleLang
} from './titleGen';

interface TitleMoodPickerProps {
  value: TitleMood;
  onChange: (mood: TitleMood) => void;
  className?: string;
}

/** Small button next to the dice: opens a compact grid of title moods + optional language. */
export const TitleMoodPicker: React.FC<TitleMoodPickerProps> = ({ value, onChange, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<TitleLang>(() => getTitleLanguage());
  const rootRef = useRef<HTMLDivElement>(null);
  const current = TITLE_MOOD_OPTIONS.find(o => o.id === value) ?? TITLE_MOOD_OPTIONS[0];
  const currentLang = TITLE_LANG_OPTIONS.find(o => o.id === lang) ?? TITLE_LANG_OPTIONS[0];

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

  const chooseLang = (id: TitleLang) => {
    setLang(id);
    setTitleLanguage(id);
  };

  const active = value !== 'all' || lang !== 'auto';

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={`Настроение: ${current.name} · Язык: ${currentLang.name}`}
        className={`relative h-full min-h-[38px] px-3 rounded-2xl border text-sm cursor-pointer transition-all flex items-center justify-center ${
          active
            ? 'border-white/30 bg-white/[0.12]'
            : 'border-white/10 bg-white/[0.06] hover:bg-white/[0.14]'
        }`}
      >
        <span className="leading-none">{current.emoji}</span>
        {lang !== 'auto' && (
          <span className="absolute -top-1.5 -right-1.5 px-1 rounded-md text-[9px] font-bold leading-[14px] theme-bg-accent text-black">
            {lang.toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[80] w-[260px] p-2 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
          <div className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Язык названия</div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {TITLE_LANG_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => chooseLang(opt.id)}
                title={opt.id === 'auto' ? 'Подстраивается под артиста' : opt.name}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors ${
                  lang === opt.id ? 'theme-bg-accent text-black font-bold' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{opt.emoji}</span>
                <span className="truncate">{opt.name}</span>
              </button>
            ))}
          </div>
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
