import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Sparkles,
  Filter,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  Search,
  Play,
  Trash2,
  Edit3,
  Maximize2,
  Star,
  Award,
  Layers,
  Music,
  Disc,
  User,
  ExternalLink,
  Calendar,
  Flame,
  Radio
} from 'lucide-react';
import { AwardItem, AwardNominee, Track, Album, Artist, ViewType } from './types';
import {
  AWARD_YEARS,
  MONTH_NAMES_RU,
  MONTH_OPTIONS,
  MONTHLY_NOMINATIONS,
  ANNUAL_NOMINATIONS,
  buildAwardsFromCatalog
} from './awardsData';
import { CoverArt, resolveMedia } from './App';

const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return clean;
};

interface AwardsViewProps {
  awards: AwardItem[];
  albums: Album[];
  tracks: Track[];
  artists: Artist[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string }) => void;
  openLightbox: (media: { url: string; title: string; subtitle?: string; type?: string }) => void;
  onPlayTrack?: (track: Track) => void;
  onSaveAward: (award: AwardItem) => void;
  onDeleteAward: (awardId: string) => void;
  initialYear?: string;
  initialMonth?: string;
  updateNavParams?: (p: any) => void;
  showToast?: (msg: string) => void;
}

// ----------------------------------------------------
// 1. Award Card (Matches Screenshots 1, 2, 3 & 4)
// ----------------------------------------------------
export const AwardCard: React.FC<{
  award: AwardItem;
  onClick: () => void;
  openLightbox: (media: { url: string; title: string; subtitle?: string; type?: string }) => void;
  isAnnual?: boolean;
}> = ({ award, onClick, openLightbox, isAnnual = false }) => {
  const winner = award.winner;
  const isCustomLabel = Boolean(winner.label);
  const isYearAward = isAnnual || award.periodType === 'year';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -6, scale: 1.015 }}
      onClick={onClick}
      className={`group relative rounded-3xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden ${
        isYearAward
          ? 'bg-[#0f0b0c] border-2 border-red-600/80 hover:border-red-500 shadow-[0_10px_30px_rgba(239,68,68,0.2)] hover:shadow-[0_15px_40px_rgba(239,68,68,0.35)]'
          : 'bg-[#121318]/90 hover:bg-[#1a1b23]/95 border border-white/10 hover:border-white/25 shadow-xl hover:shadow-2xl'
      } backdrop-blur-2xl`}
    >
      {/* Subtle Ambient Red Glow for Annual Winners */}
      {isYearAward && (
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-red-600/20 blur-2xl pointer-events-none group-hover:bg-red-500/35 transition-all" />
      )}

      {/* Top Cover Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 shrink-0">
        <CoverArt
          url={winner.coverUrl}
          title={winner.title}
          isArtist={winner.type === 'artist'}
          className="w-full h-full"
          innerClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Zoom Lightbox Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const resolved = resolveMedia(winner.coverUrl, { title: winner.title, isArtist: winner.type === 'artist' });
            openLightbox({
              url: resolved || winner.coverUrl || '',
              title: winner.title,
              subtitle: winner.artistName || award.nominationTitle,
              type: award.nominationTitle,
            });
          }}
          className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 shadow-lg"
          title="Открыть фото в полном размере"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>


      </div>

      {/* Info Details */}
      <div className="mt-3.5 space-y-1 min-w-0 text-center">
        <h4 className="text-base sm:text-lg font-black text-white truncate tracking-tight group-hover:text-amber-300 transition-colors">
          {winner.title}
        </h4>
        {winner.artistName && (
          <p className="text-xs sm:text-[13px] text-zinc-400 font-semibold truncate">
            {winner.artistName}
          </p>
        )}
      </div>

      {/* Nomination Subtitle at Bottom */}
      <div className="mt-3 pt-2.5 border-t border-white/5 text-center">
        <p className="text-xs sm:text-[13px] font-bold text-zinc-400 tracking-tight">
          {award.nominationTitle}
        </p>
      </div>
    </motion.div>
  );
};

// ----------------------------------------------------
// 2. Award Nominees & Contenders Modal
// ----------------------------------------------------
export const AwardNomineesModal: React.FC<{
  isOpen: boolean;
  award: AwardItem | null;
  onClose: () => void;
  onEdit: (award: AwardItem) => void;
  onDelete: (awardId: string) => void;
  openLightbox: (media: { url: string; title: string; subtitle?: string; type?: string }) => void;
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string }) => void;
  albums: Album[];
  tracks: Track[];
  artists: Artist[];
  onPlayTrack?: (track: Track) => void;
}> = ({ isOpen, award, onClose, onEdit, onDelete, openLightbox, navigateTo, albums, tracks, artists, onPlayTrack }) => {
  if (!isOpen || !award) return null;

  const winner = award.winner;
  const isAnnual = award.periodType === 'year';
  const periodPrefix = isAnnual ? award.year : `${award.year}-${award.month}`;

  const nominees = award.nominees && award.nominees.length > 0
    ? [...award.nominees].sort((a, b) => (b.votesPercent || 0) - (a.votesPercent || 0))
    : [
        {
          title: winner.title,
          artistName: winner.artistName,
          votesPercent: 52,
          votesCount: 3840
        }
      ];

  const totalVotes = nominees.reduce((acc, cur) => acc + (cur.votesCount || 0), 0);

  const periodLabel = isAnnual
    ? `Итоги ${award.year} года`
    : `${MONTH_NAMES_RU[award.month || '01'] || 'Месяц'} ${award.year}`;

  // Find other database releases from this period that were close contenders
  const periodContenders = useMemo(() => {
    const isAlbumNom = award.nominationKey.includes('album') || award.nominationKey.includes('cover');
    const isTrackNom = award.nominationKey.includes('track') || award.nominationKey.includes('producer') || award.nominationKey.includes('video');
    const isArtistNom = award.nominationKey.includes('artist') || award.nominationKey.includes('freshman') || award.nominationKey.includes('breakthrough');

    if (isAlbumNom) {
      return albums
        .filter(a => {
          if (a.title.toLowerCase() === winner.title.toLowerCase()) return false;
          const d = a.releaseDate || (a.releaseYear ? `${a.releaseYear}-01-01` : '');
          return d.startsWith(periodPrefix) || (!d && isAnnual);
        })
        .slice(0, 6)
        .map(a => ({
          id: a.id,
          type: 'album' as const,
          title: a.title,
          subtitle: a.artistName,
          coverUrl: a.coverUrl,
          date: a.releaseDate,
          score: a.rating?.totalScore,
          plays: a.totalPlays,
        }));
    }

    if (isTrackNom) {
      return tracks
        .filter(t => {
          if (t.title.toLowerCase() === winner.title.toLowerCase()) return false;
          const d = t.releaseDate || '';
          return d.startsWith(periodPrefix) || (!d && isAnnual);
        })
        .slice(0, 6)
        .map(t => ({
          id: t.id,
          type: 'track' as const,
          title: t.title,
          subtitle: t.artistName,
          coverUrl: t.coverUrl,
          date: t.releaseDate,
          score: t.rating?.totalScore,
          plays: t.plays,
          trackObj: t
        }));
    }

    // Artist nomination contenders
    return artists
      .filter(art => art.name.toLowerCase() !== winner.title.toLowerCase())
      .slice(0, 6)
      .map(art => ({
        id: art.id,
        type: 'artist' as const,
        title: art.name,
        subtitle: art.genre || 'Исполнитель',
        coverUrl: art.imageUrl,
        date: undefined,
        score: undefined,
        plays: art.followers,
      }));
  }, [award, albums, tracks, artists, winner, periodPrefix, isAnnual]);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative w-full max-w-2xl bg-[#0e0f14] border border-white/15 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
              isAnnual ? 'bg-red-600/25 border border-red-500/40 text-red-400' : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
            }`}>
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{award.nominationTitle}</h3>
              <p className="text-xs text-zinc-400 font-semibold">{periodLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Winner Banner */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 relative overflow-hidden group ${
            isAnnual ? 'bg-red-950/20 border-red-500/30' : 'bg-white/5 border-white/10'
          }`}>
            <div
              onClick={() => {
                if (winner.coverUrl) {
                  const resolved = resolveMedia(winner.coverUrl, { title: winner.title, isArtist: winner.type === 'artist' });
                  openLightbox({
                    url: resolved || winner.coverUrl,
                    title: winner.title,
                    subtitle: winner.artistName,
                    type: award.nominationTitle,
                  });
                }
              }}
              className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 relative cursor-pointer"
            >
              <CoverArt
                url={winner.coverUrl}
                title={winner.title}
                isArtist={winner.type === 'artist'}
                className="w-full h-full"
                innerClassName="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider mb-1">
                <Trophy className="w-3 h-3" /> Победитель номинации 🏆
              </div>
              <h4 className="text-xl font-black text-white truncate">{winner.title}</h4>
              {winner.artistName && (
                <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">{winner.artistName}</p>
              )}
              {winner.label && (
                <p className="text-[11px] text-zinc-500 font-semibold truncate mt-0.5">{winner.label}</p>
              )}
            </div>
          </div>

          {/* Voting Results & Nominees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Номинанты и результаты голосования
              </h5>
              {totalVotes > 0 && (
                <span className="text-[11px] font-semibold text-zinc-500">
                  Всего голосов: {totalVotes.toLocaleString('ru-RU')}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {nominees.map((nom, idx) => {
                const isTop = idx === 0;
                const pct = nom.votesPercent || Math.max(5, Math.round(100 / nominees.length));
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all ${
                      isTop
                        ? 'bg-amber-500/10 border-amber-500/35 shadow-md'
                        : 'bg-black/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                          isTop ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span
                          className="font-bold text-white truncate cursor-pointer hover:text-amber-400 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            
                            // Improved lookup: try by ID, then by Name/Artist match
                            const item = tracks.find(t => t.id === nom.id || (t.title === nom.title && t.artistName === nom.artistName)) || 
                                         albums.find(a => a.id === nom.id || (a.title === nom.title && a.artistName === nom.artistName)) || 
                                         artists.find(a => a.id === nom.id || a.name === nom.title || a.name === nom.artistName);
                            
                            if (item) {
                              // Determine type
                              let type: ViewType = 'artist';
                              if ('duration' in item) type = 'track';
                              else if ('releaseYear' in item) type = 'album';
                              
                              navigateTo(type, { id: item.id });
                            }
                          }}
                        >
                          {nom.title}
                        </span>
                        {nom.artistName && (
                          <span 
                            className="text-zinc-400 truncate cursor-pointer hover:text-amber-400 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              const artist = artists.find(a => a.name === nom.artistName);
                              if (artist) navigateTo('artist', { id: artist.id });
                            }}
                          >({nom.artistName})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-extrabold text-white text-xs">{pct}%</span>
                        {nom.votesCount && (
                          <span className="text-[10px] text-zinc-500 hidden sm:inline">
                            ({nom.votesCount.toLocaleString('ru-RU')})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop ? 'bg-gradient-to-r from-amber-400 to-amber-200' : 'bg-zinc-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Releases from this Period close to Award ("были близки к награде") */}
          {periodContenders.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400" /> Были близки к награде в этот период
                </h5>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">
                  {periodLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {periodContenders.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      if (item.type === 'album') navigateTo('album', { id: item.id });
                      else if (item.type === 'track') navigateTo('track', { id: item.id });
                      else if (item.type === 'artist') navigateTo('artist', { id: item.id });
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 ${item.type === 'artist' ? 'rounded-full' : 'rounded-lg'} overflow-hidden bg-zinc-800 shrink-0 border border-white/10`}>
                        <CoverArt
                          url={item.coverUrl}
                          title={item.title}
                          isArtist={item.type === 'artist'}
                          className="w-full h-full"
                          innerClassName="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.score && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                          {item.score}
                        </span>
                      )}
                      {item.type === 'track' && item.trackObj && onPlayTrack && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayTrack(item.trackObj);
                          }}
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Слушать"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/50 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (window.confirm(`Удалить премию «${award.nominationTitle}»?`)) {
                onDelete(award.id);
                onClose();
              }
            }}
            className="px-3.5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Удалить
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onClose();
                onEdit(award);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Изменить
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold transition-all cursor-pointer shadow-lg"
            >
              Закрыть
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ----------------------------------------------------
// 3. Award Assignment Modal ("Раздать премии")
// Strict Date Rules:
// - Year nominations (e.g. 2026): only 2026 releases
// - Month nominations (e.g. 09.2025): only 09.2025 releases
// - Artists: ANY artist allowed
// - Undated releases: allowed in any nomination, placed at the BOTTOM of the picker list
// ----------------------------------------------------
export const AwardAssignmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (award: AwardItem) => void;
  editingAward?: AwardItem | null;
  albums: Album[];
  tracks: Track[];
  artists: Artist[];
  initialYear?: string;
  initialMonth?: string;
}> = ({
  isOpen,
  onClose,
  onSave,
  editingAward,
  albums,
  tracks,
  artists,
  initialYear = '2026',
  initialMonth = '09'
}) => {
  if (!isOpen) return null;

  const [year, setYear] = useState<string>(editingAward?.year || initialYear);
  const [periodType, setPeriodType] = useState<'month' | 'year'>(
    editingAward?.periodType || (initialMonth === 'all_months' || initialMonth === 'year_review' ? 'year' : 'month')
  );
  const [month, setMonth] = useState<string>(
    editingAward?.month || (initialMonth && initialMonth !== 'all_months' && initialMonth !== 'year_review' ? initialMonth : '09')
  );

  const availableNominations = periodType === 'year' ? ANNUAL_NOMINATIONS : MONTHLY_NOMINATIONS;
  const [nominationKey, setNominationKey] = useState<string>(
    editingAward?.nominationKey || availableNominations[0].key
  );

  // Winner form state
  const [winnerTitle, setWinnerTitle] = useState(editingAward?.winner.title || '');
  const [winnerArtist, setWinnerArtist] = useState(editingAward?.winner.artistName || '');
  const [winnerCover, setWinnerCover] = useState(editingAward?.winner.coverUrl || '');
  const [winnerLabel, setWinnerLabel] = useState(editingAward?.winner.label || '');
  const [winnerType, setWinnerType] = useState<'artist' | 'album' | 'track' | 'custom'>(
    editingAward?.winner.type || 'artist'
  );

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'manual'>('catalog');

  // Determine what kind of release is being nominated
  const isArtistNomination = ['artist_of_month', 'artist_of_year', 'freshman_of_month', 'freshman_of_year', 'breakthrough_of_year'].includes(nominationKey);
  const isAlbumNomination = ['album_of_month', 'album_of_year', 'cover_of_month', 'cover_of_year'].includes(nominationKey);
  const isTrackNomination = !isArtistNomination && !isAlbumNomination;

  // Target timeframe string (e.g. '2025-09' or '2026')
  const targetPrefix = periodType === 'month' ? `${year}-${month}` : `${year}`;

  // Build filtered candidates conforming strictly to user rules:
  // 1. Matching date releases on top
  // 2. Undated releases at the bottom
  // 3. Different dates completely excluded (except artists where any artist is valid)
  const eligibleCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (isArtistNomination) {
      // Calculate actual tracks and plays for each artist in targetPrefix
      const inPeriodArtists: any[] = [];
      const otherArtists: any[] = [];

      artists.forEach(a => {
        if (q && !a.name.toLowerCase().includes(q)) return;
        const aName = a.name.toLowerCase().trim();

        let periodTracks = 0;
        let periodPlays = 0;

        tracks.forEach(t => {
          const isThisArtist = (t.artistId === a.id) || (t.artistName && t.artistName.toLowerCase().trim() === aName);
          if (isThisArtist) {
            const d = t.releaseDate || '';
            if (d.startsWith(targetPrefix)) {
              periodTracks++;
              periodPlays += (t.plays || 0);
            }
          }
        });

        albums.forEach(alb => {
          const isThisArtist = (alb.artistId === a.id) || (alb.artistName && alb.artistName.toLowerCase().trim() === aName);
          if (isThisArtist) {
            const d = alb.releaseDate || (alb.releaseYear ? `${alb.releaseYear}-01-01` : '');
            if (d.startsWith(targetPrefix)) {
              periodPlays += (alb.totalPlays || 0);
            }
          }
        });

        const followers = a.followers || 0;
        const hasPeriodActivity = periodTracks > 0 || periodPlays > 0;

        const item = {
          id: a.id,
          type: 'artist' as const,
          title: a.name,
          artistName: `${followers.toLocaleString('ru-RU')} слушателей`,
          coverUrl: a.imageUrl,
          followers,
          periodTracks,
          periodPlays,
          plays: periodPlays > 0 ? periodPlays : followers,
          isPeriodExact: hasPeriodActivity,
          isUndated: false,
        };

        if (item.isPeriodExact) inPeriodArtists.push(item);
        else otherArtists.push(item);
      });

      // Sort active period artists by periodPlays descending, then by periodTracks, then followers
      inPeriodArtists.sort((a, b) => (b.periodPlays - a.periodPlays) || (b.periodTracks - a.periodTracks) || (b.followers - a.followers));
      otherArtists.sort((a, b) => (b.followers - a.followers));

      return [...inPeriodArtists, ...otherArtists];
    }

    if (isAlbumNomination) {
      // Only albums of target timeframe + undated albums at the bottom
      const datedExact: any[] = [];
      const undatedList: any[] = [];

      albums.forEach(al => {
        if (q && !al.title.toLowerCase().includes(q) && !(al.artistName && al.artistName.toLowerCase().includes(q))) {
          return;
        }

        const dateStr = al.releaseDate || (al.releaseYear ? `${al.releaseYear}-01-01` : '');
        const hasDate = Boolean(dateStr && dateStr.trim() && dateStr !== '0000-00-00');
        const plays = al.totalPlays || 0;

        if (hasDate) {
          if (dateStr.startsWith(targetPrefix)) {
            datedExact.push({
              id: al.id,
              type: 'album' as const,
              title: al.title,
              artistName: al.artistName,
              coverUrl: al.coverUrl,
              date: al.releaseDate || (al.releaseYear ? `${al.releaseYear}` : ''),
              plays,
              score: al.rating?.totalScore,
              isPeriodExact: true,
              isUndated: false,
            });
          }
        } else {
          // Undated album -> allowed, but goes to bottom
          undatedList.push({
            id: al.id,
            type: 'album' as const,
            title: al.title,
            artistName: al.artistName,
            coverUrl: al.coverUrl,
            date: undefined,
            plays,
            score: al.rating?.totalScore,
            isPeriodExact: false,
            isUndated: true,
          });
        }
      });

      // Sort strictly by plays descending per user request
      datedExact.sort((a, b) => (b.plays || 0) - (a.plays || 0));
      undatedList.sort((a, b) => (b.plays || 0) - (a.plays || 0));

      const results = [...datedExact, ...undatedList];
      if (results.length === 0) {
        albums.forEach(al => {
          results.push({
            id: al.id,
            type: 'album' as const,
            title: al.title,
            artistName: al.artistName,
            coverUrl: al.coverUrl,
            date: al.releaseDate || (al.releaseYear ? `${al.releaseYear}` : ''),
            plays: al.totalPlays || 0,
            score: al.rating?.totalScore,
            isPeriodExact: false,
            isUndated: true,
          });
        });
      }

      return results;
    }

    if (isTrackNomination) {
      const isFeature = nominationKey.includes('feature');
      // Only tracks of target timeframe + undated tracks at bottom
      const datedExact: any[] = [];
      const undatedList: any[] = [];

      tracks.forEach(tr => {
        if (q && !tr.title.toLowerCase().includes(q) && !(tr.artistName && tr.artistName.toLowerCase().includes(q))) {
          return;
        }

        const dateStr = tr.releaseDate || '';
        const hasDate = Boolean(dateStr && dateStr.trim() && dateStr !== '0000-00-00');
        const plays = tr.plays || 0;

        if (hasDate) {
          if (dateStr.startsWith(targetPrefix)) {
            datedExact.push({
              id: tr.id,
              type: 'track' as const,
              title: tr.title,
              artistName: isFeature && tr.featuredArtist ? `${tr.artistName} feat. ${tr.featuredArtist}` : tr.artistName,
              coverUrl: tr.coverUrl,
              date: tr.releaseDate,
              plays,
              score: tr.rating?.totalScore,
              isPeriodExact: true,
              isUndated: false,
            });
          }
        } else {
          // Undated track -> allowed, placed at bottom
          undatedList.push({
            id: tr.id,
            type: 'track' as const,
            title: tr.title,
            artistName: isFeature && tr.featuredArtist ? `${tr.artistName} feat. ${tr.featuredArtist}` : tr.artistName,
            coverUrl: tr.coverUrl,
            date: undefined,
            plays,
            score: tr.rating?.totalScore,
            isPeriodExact: false,
            isUndated: true,
          });
        }
      });

      // Sort strictly by plays descending per user request
      datedExact.sort((a, b) => (b.plays || 0) - (a.plays || 0));
      undatedList.sort((a, b) => (b.plays || 0) - (a.plays || 0));

      const results = [...datedExact, ...undatedList];
      if (results.length === 0) {
        // Absolute fallback: return all tracks in the catalog if period is empty
        tracks.forEach(tr => {
          results.push({
            id: tr.id,
            type: 'track' as const,
            title: tr.title,
            artistName: isFeature && tr.featuredArtist ? `${tr.artistName} feat. ${tr.featuredArtist}` : tr.artistName,
            coverUrl: tr.coverUrl,
            date: tr.releaseDate,
            plays: tr.plays || 0,
            score: tr.rating?.totalScore,
            isPeriodExact: false,
            isUndated: true,
          });
        });
      }

      return results;
    }

    return [];
  }, [isArtistNomination, isAlbumNomination, isTrackNomination, nominationKey, searchQuery, targetPrefix, artists, albums, tracks]);

  const handleSelectRelease = (item: any) => {
    setWinnerTitle(item.title);
    setWinnerArtist(item.artistName !== 'Исполнитель' ? item.artistName : '');
    setWinnerCover(item.coverUrl || '');
    setWinnerType(item.type);
    if (!winnerLabel && item.artistName && item.title) {
      setWinnerLabel(item.type === 'album' || item.type === 'track' ? `${item.artistName} — ${item.title}` : '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerTitle.trim()) return;

    const currentNom = availableNominations.find(n => n.key === nominationKey) || availableNominations[0];

    const newAward: AwardItem = {
      id: editingAward?.id || `award-${year}-${periodType === 'year' ? 'annual' : month}-${nominationKey}-${Date.now()}`,
      year,
      month: periodType === 'month' ? month : undefined,
      periodType,
      nominationKey,
      nominationTitle: currentNom.title,
      winner: {
        type: winnerType,
        title: winnerTitle.trim(),
        artistName: winnerArtist.trim() || undefined,
        coverUrl: winnerCover.trim() || undefined,
        label: winnerLabel.trim() || undefined,
      },
      nominees: editingAward?.nominees || [
        {
          title: winnerTitle.trim(),
          artistName: winnerArtist.trim() || undefined,
          votesPercent: 54,
          votesCount: 3820,
        },
      ],
      awardedAt: new Date().toISOString().split('T')[0],
    };

    onSave(newAward);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-[#0d0e13] border border-white/15 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-lg">
              <Trophy className="w-5 h-5 fill-black" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Вручение музыкальной премии</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Номинирование артистов, альбомов и треков за период</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Step 1: Period & Nomination */}
          <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                1. Период премии
              </span>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPeriodType('month')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    periodType === 'month' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Премия месяца
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('year')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    periodType === 'year' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Итоги года 🏆
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Год</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-white/30"
                >
                  {AWARD_YEARS.map(y => (
                    <option key={y} value={y} className="bg-zinc-950 text-white">{y} год</option>
                  ))}
                </select>
              </div>

              {periodType === 'month' && (
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Месяц</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-white/30"
                  >
                    {Object.entries(MONTH_NAMES_RU).map(([k, v]) => (
                      <option key={k} value={k} className="bg-zinc-950 text-white">{v}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Номинация</label>
              <select
                value={nominationKey}
                onChange={(e) => setNominationKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-white/30"
              >
                {availableNominations.map(n => (
                  <option key={n.key} value={n.key} className="bg-zinc-950 text-white">{n.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Release / Candidate Selector (Follows Strict Date Filter Rules) */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
                  2. Выбор победителя из базы
                </span>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {periodType === 'month'
                    ? `Период: ${MONTH_NAMES_RU[month]} ${year}. Недатированные релизы отображаются снизу.`
                    : `Период: ${year} год. Недатированные релизы отображаются снизу.`}
                </p>
              </div>

              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    activeTab === 'catalog' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Из базы ({eligibleCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    activeTab === 'manual' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Вручную
                </button>
              </div>
            </div>

            {activeTab === 'catalog' && (
              <>
                {/* Fast Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Быстрый поиск по названию или исполнителю..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-white outline-none focus:border-white/30"
                  />
                </div>

                {/* Candidate List with Exact-period at Top and Undated at Bottom */}
                <div className="max-h-80 sm:max-h-[380px] overflow-y-auto custom-scrollbar space-y-2 border border-white/10 rounded-2xl p-2.5 bg-black/40">
                  {eligibleCandidates.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500 text-xs space-y-2">
                      <p>В периоде {periodType === 'month' ? `${MONTH_NAMES_RU[month]} ${year}` : `${year} год`} нет подходящих релизов.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className="text-xs text-amber-400 hover:underline font-bold"
                      >
                        Ввести данные победителя вручную →
                      </button>
                    </div>
                  ) : (
                    eligibleCandidates.map((item, idx) => {
                      const isSelected = winnerTitle.toLowerCase() === item.title.toLowerCase();
                      return (
                        <div
                          key={`${item.id}-${idx}`}
                          onClick={() => handleSelectRelease(item)}
                          className={`p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-lg ring-1 ring-amber-500/30'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Artwork / Avatar with CoverArt resolving idb: & procedural fallback */}
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 ${item.type === 'artist' ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-zinc-800 shrink-0 border border-white/15 shadow-md relative`}>
                              <CoverArt
                                url={item.coverUrl}
                                title={item.title}
                                isArtist={item.type === 'artist'}
                                className="w-full h-full"
                                innerClassName="w-full h-full object-cover"
                              />
                            </div>

                            <div className="min-w-0 space-y-1">
                              <p className="text-sm sm:text-base font-black text-white truncate leading-tight">{item.title}</p>
                              <p className="text-xs sm:text-sm font-semibold text-zinc-400 truncate">{item.artistName}</p>

                              {/* Prominent Metadata: Plays, Date, Period Stats, Score */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {item.type === 'artist' ? (
                                  <>
                                    {item.periodPlays > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30 tabular-nums">
                                        <Flame className="w-3 h-3 text-amber-400" />
                                        {item.periodPlays.toLocaleString('ru-RU')} просл. за период
                                      </span>
                                    )}

                                    {item.periodTracks > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/25">
                                        <Music className="w-3 h-3 text-emerald-400" />
                                        {item.periodTracks} {item.periodTracks === 1 ? 'трек' : (item.periodTracks < 5 ? 'трека' : 'треков')} za период
                                      </span>
                                    )}

                                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 tabular-nums">
                                      <User className="w-3 h-3 text-zinc-400" />
                                      {item.followers.toLocaleString('ru-RU')} слушателей
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    {item.plays !== undefined && item.plays > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 tabular-nums">
                                        <Flame className="w-3 h-3 text-amber-400" />
                                        {item.plays.toLocaleString('ru-RU')} просл.
                                      </span>
                                    )}

                                    {item.date && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                        <Calendar className="w-3 h-3 text-emerald-400" />
                                        {formatDateDisplay(item.date)}
                                      </span>
                                    )}

                                    {item.score !== undefined && item.score > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        {item.score}
                                      </span>
                                    )}

                                    {item.isUndated && (
                                      <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">
                                        Без даты (снизу списка)
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-black shadow-md">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-500 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-bold hidden sm:inline-block">
                                Выбрать
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Step 3: Winner Details */}
          <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
              3. Данные лауреата премии
            </span>

            {winnerCover && (
              <div className="flex items-center gap-4 p-3.5 bg-black/40 rounded-2xl border border-white/10">
                <div className={`w-16 h-16 ${winnerType === 'artist' ? 'rounded-full' : 'rounded-2xl'} overflow-hidden shrink-0 bg-zinc-900 border border-white/15 relative shadow-md`}>
                  <CoverArt
                    url={winnerCover}
                    title={winnerTitle}
                    isArtist={winnerType === 'artist'}
                    className="w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Выбранный номинант
                  </span>
                  <p className="text-sm font-extrabold text-white truncate mt-1">{winnerTitle || 'Без названия'}</p>
                  <p className="text-xs text-zinc-400 truncate">{winnerArtist || 'Исполнитель'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Победитель (Название)</label>
                <input
                  type="text"
                  required
                  placeholder="Название трека, альбома или имя артиста"
                  value={winnerTitle}
                  onChange={(e) => setWinnerTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Исполнитель / Автор</label>
                <input
                  type="text"
                  placeholder="Имя артиста или группы"
                  value={winnerArtist}
                  onChange={(e) => setWinnerArtist(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Ссылка на обложку / фото</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={winnerCover}
                  onChange={(e) => setWinnerCover(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-white outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">
                  Плашка на обложке (Подзаголовок)
                </label>
                <input
                  type="text"
                  placeholder="Например: Артист — Название"
                  value={winnerLabel}
                  onChange={(e) => setWinnerLabel(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-white outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black shadow-xl hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 fill-black" /> Вручить премию 🏆
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ----------------------------------------------------
// 4. Main Awards View Component
// ----------------------------------------------------
export const AwardsView: React.FC<AwardsViewProps> = ({
  awards,
  albums,
  tracks,
  artists,
  navigateTo,
  openLightbox,
  onPlayTrack,
  onSaveAward,
  onDeleteAward,
  initialYear = '2026',
  initialMonth = '09',
  updateNavParams,
  showToast
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialMonth);

  useEffect(() => {
    if (updateNavParams) {
      updateNavParams({ year: selectedYear, month: selectedPeriod });
    }
  }, [selectedYear, selectedPeriod, updateNavParams]);

  useEffect(() => {
    if (initialYear && initialYear !== selectedYear) {
      setSelectedYear(initialYear);
    }
  }, [initialYear]);

  useEffect(() => {
    if (initialMonth && initialMonth !== selectedPeriod) {
      setSelectedPeriod(initialMonth);
    }
  }, [initialMonth]);

  const [selectedNomination, setSelectedNomination] = useState<string>('all');

  // Modal states
  const [activeModalAward, setActiveModalAward] = useState<AwardItem | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAwardForModal, setEditingAwardForModal] = useState<AwardItem | null>(null);

  // Active filter count
  const activeFiltersCount = (selectedPeriod !== 'all_months' ? 1 : 0) + (selectedNomination !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedYear('2026');
    setSelectedPeriod('all_months');
    setSelectedNomination('all');
  };

  const NOMINATION_RANK: Record<string, number> = {
    'artist_of_month': 1, 'artist_of_year': 1,
    'album_of_month': 2, 'album_of_year': 2,
    'track_of_month': 3, 'track_of_year': 3,
    'alt_track_of_month': 4, 'alt_track_of_year': 4,
    'feature_of_month': 5, 'feature_of_year': 5,
    'freshman_of_month': 6, 'freshman_of_year': 6,
    'cover_of_month': 7, 'cover_of_year': 7,
  };
  const getRank = (key: string) => NOMINATION_RANK[key] || 99;

  // Group awards by month for timeline view
  const timelineMonths = useMemo(() => {
    const monthsOrder = ['12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01'];
    return monthsOrder.map(m => {
      const monthAwards = awards.filter(a => {
        if (a.year !== selectedYear) return false;
        if (a.periodType !== 'month') return false;
        if (a.month !== m) return false;
        if (selectedNomination !== 'all' && a.nominationKey !== selectedNomination) return false;
        return true;
      }).sort((a, b) => getRank(a.nominationKey) - getRank(b.nominationKey));

      return {
        monthKey: m,
        monthName: MONTH_NAMES_RU[m],
        awards: monthAwards,
      };
    }).filter(group => group.awards.length > 0);
  }, [awards, selectedYear, selectedNomination]);

  // Annual awards for current year (displayed at top of timeline in Screenshot 1 image_cf203f70.png)
  const annualAwardsForYear = useMemo(() => {
    return awards.filter(a => {
      if (a.year !== selectedYear) return false;
      if (a.periodType !== 'year') return false;
      if (selectedNomination !== 'all' && a.nominationKey !== selectedNomination) return false;
      return true;
    }).sort((a, b) => getRank(a.nominationKey) - getRank(b.nominationKey));
  }, [awards, selectedYear, selectedNomination]);

  // Filtered awards for single month or annual review
  const currentFilteredAwards = useMemo(() => {
    return awards.filter(a => {
      if (a.year !== selectedYear) return false;
      if (selectedPeriod === 'year_review') {
        if (a.periodType !== 'year') return false;
      } else if (selectedPeriod !== 'all_months') {
        if (a.periodType !== 'month' || a.month !== selectedPeriod) return false;
      }
      if (selectedNomination !== 'all' && a.nominationKey !== selectedNomination) return false;
      return true;
    }).sort((a, b) => getRank(a.nominationKey) - getRank(b.nominationKey));
  }, [awards, selectedYear, selectedPeriod, selectedNomination]);

  return (
    <div className="space-y-8 animate-in pb-28">
      {/* Top Banner / Heading (Matching image_cf203f70.png: Subtitle and Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter flex items-center gap-3">
            <span>Премии</span>
            <span className="text-xl sm:text-2xl font-extrabold px-3 py-1 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              {selectedYear}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-semibold tracking-wide">
            Победители и результаты голосований всех прошедших премий
          </p>
        </div>

        {/* User Hand-out Award Button & Sync with Catalog */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                 // Update existing awards using catalog data for covers/avatars
                 awards.forEach(aw => {
                    const win = aw.winner;
                    // Find latest media from catalog
                    const catTrack = tracks.find(t => t.title.toLowerCase() === win.title.toLowerCase() && (!win.artistName || t.artistName?.toLowerCase() === win.artistName.toLowerCase()));
                    const catAlb = albums.find(a => a.title.toLowerCase() === win.title.toLowerCase() && (!win.artistName || a.artistName?.toLowerCase() === win.artistName.toLowerCase()));
                    const catArt = artists.find(a => a.name.toLowerCase() === win.title.toLowerCase() || (win.artistName && a.name.toLowerCase() === win.artistName.toLowerCase()));
                    
                    const latestCover = catTrack?.coverUrl || catAlb?.coverUrl || catArt?.imageUrl || win.coverUrl;
                    
                    // If winner changed but nominees didn't, ensure winner is first in nominees
                    let updatedNominees = aw.nominees ? [...aw.nominees] : [];
                    if (updatedNominees.length > 0) {
                       // Find winner in nominees
                       const winIdx = updatedNominees.findIndex(n => n.title.toLowerCase() === win.title.toLowerCase());
                       if (winIdx !== -1) {
                          const winnerNom = updatedNominees[winIdx];
                          updatedNominees.splice(winIdx, 1);
                          updatedNominees.unshift(winnerNom);
                          
                          // Ensure winner has highest percentage
                          const maxOthers = updatedNominees.slice(1).reduce((m, n) => Math.max(m, n.votesPercent || 0), 0);
                          if ((winnerNom.votesPercent || 0) <= maxOthers) {
                             winnerNom.votesPercent = maxOthers + 5;
                             // Normalize percentages if sum > 100
                             const sum = updatedNominees.reduce((s, n) => s + (n.votesPercent || 0), 0);
                             if (sum > 100) {
                                updatedNominees.forEach((n, i) => { if(i>0) n.votesPercent = Math.max(1, Math.round((n.votesPercent || 0) * (100 - updatedNominees[0].votesPercent!) / (sum - updatedNominees[0].votesPercent!))); });
                                const finalSum = updatedNominees.reduce((s, n) => s + (n.votesPercent || 0), 0);
                                if (finalSum < 100) updatedNominees[0].votesPercent! += (100-finalSum);
                             }
                          }
                       }
                    }

                    onSaveAward({
                       ...aw,
                       winner: { ...win, coverUrl: latestCover },
                       nominees: updatedNominees.length > 0 ? updatedNominees : undefined
                    });
                 });
                 showToast?.('Данные премий обновлены (фото и метрики актуализированы)');
              }}
              className="px-4 py-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:border-emerald-400/30"
              title="Обновить аватарки и обложки, сохранив ваши изменения"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Обновить данные</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const catalogAwards = buildAwardsFromCatalog(artists, albums, tracks);
                if (catalogAwards.length === 0) {
                  alert('В каталоге пока нет релизов для авто-формирования премий. Вы можете добавить релизы или вручить премии вручную.');
                  return;
                }
                catalogAwards.forEach(aw => onSaveAward(aw));
              }}
              className="px-4 py-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:border-amber-400/30"
              title="Обновить премии на основе ваших реальных исполнителей, треков и альбомов"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Синхронизировать с каталогом</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingAwardForModal(null);
                setIsAssignModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs sm:text-sm tracking-tight shadow-xl hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 fill-black" />
              <span>Вручить премию</span>
            </button>
        </div>
      </div>

      {/* Main Grid: Left Filter Sidebar + Right Awards Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Left Filter Sidebar (Matches Screenshot 1 & 2) */}
        <aside className="p-5 rounded-3xl bg-[#111217]/90 border border-white/10 backdrop-blur-2xl space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 font-black text-sm text-white">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span>Фильтры</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-black font-extrabold text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>
          </div>

          {/* Year Pills (2026, 2025, 2024, 2023, 2022, 2021) */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
              Год
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AWARD_YEARS.map(y => {
                const isSelected = selectedYear === y;
                return (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-white text-black shadow-lg scale-102 font-black'
                        : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Award Period Dropdown */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
              Премия
            </label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer appearance-none pr-10 focus:border-white/30 transition-all"
              >
                {MONTH_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key} className="bg-zinc-950 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Nomination Dropdown */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
              Номинация
            </label>
            <div className="relative">
              <select
                value={selectedNomination}
                onChange={(e) => setSelectedNomination(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer appearance-none pr-10 focus:border-white/30 transition-all"
              >
                <option value="all" className="bg-zinc-950 text-white">Все номинации</option>
                <optgroup label="Месячные номинации" className="bg-zinc-900 text-zinc-300">
                  {MONTHLY_NOMINATIONS.map(n => (
                    <option key={n.key} value={n.key} className="bg-zinc-950 text-white">
                      {n.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Годовые номинации" className="bg-zinc-900 text-zinc-300">
                  {ANNUAL_NOMINATIONS.map(n => (
                    <option key={n.key} value={n.key} className="bg-zinc-950 text-white">
                      {n.title}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </aside>

        {/* Right Awards Area */}
        <div className="space-y-8 min-w-0">
          {/* Hint bar (Screenshot 1 top hint) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold text-zinc-300 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Нажмите на карточку, чтобы увидеть номинантов и результаты голосования</span>
          </div>

          {/* 1. TIMELINE MODE ("Все премии года" - Matches image_cf203f70.png and image_fa89632c.png) */}
          {selectedPeriod === 'all_months' && (
            <div className="space-y-10">
              {/* Row 1: Итоги года [год] if available (shown at top with red borders per image_cf203f70.png) */}
              {annualAwardsForYear.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Итоги года
                      </h3>
                      <span className="text-sm font-semibold text-zinc-500">
                        {selectedYear}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedPeriod('year_review')}
                      className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group"
                    >
                      <span>Открыть премию</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {annualAwardsForYear.slice(0, 4).map(award => (
                      <AwardCard
                        key={award.id}
                        award={award}
                        onClick={() => setActiveModalAward(award)}
                        openLightbox={openLightbox}
                        isAnnual={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Month rows in descending order */}
              {timelineMonths.length === 0 && annualAwardsForYear.length === 0 ? (
                <div className="p-16 text-center rounded-3xl bg-white/5 border border-white/5">
                  <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400 font-bold text-sm">В {selectedYear} году пока нет врученных премий</p>
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-white text-black font-black text-xs hover:bg-zinc-200 transition-all cursor-pointer"
                  >
                    Вручить первую премию
                  </button>
                </div>
              ) : (
                timelineMonths.map(group => (
                  <div key={group.monthKey} className="space-y-4">
                    {/* Row Header with Month Name and "Открыть премию ->" */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {group.monthName}
                        </h3>
                        <span className="text-sm font-semibold text-zinc-500">
                          {selectedYear}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedPeriod(group.monthKey)}
                        className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group"
                      >
                        <span>Открыть премию</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>

                    {/* Horizontal scroll / carousel grid matching Screenshot 2 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {group.awards.map(award => (
                        <AwardCard
                          key={award.id}
                          award={award}
                          onClick={() => setActiveModalAward(award)}
                          openLightbox={openLightbox}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. YEAR IN REVIEW MODE ("Итоги года" - Matches image_b58518a3.png) */}
          {selectedPeriod === 'year_review' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/70 via-zinc-900 to-black border border-red-500/40 flex items-center justify-between shadow-2xl">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider mb-2">
                    <Trophy className="w-3.5 h-3.5" /> Лауреаты года
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Итоги {selectedYear} года
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-semibold">
                    8 главных номинаций года с красными лауреатскими рамками
                  </p>
                </div>
              </div>

              {currentFilteredAwards.length === 0 ? (
                <div className="p-16 text-center rounded-3xl bg-white/5 border border-white/5">
                  <p className="text-zinc-400 font-bold text-sm">Итоги {selectedYear} года еще не подведены</p>
                  <button
                    onClick={() => {
                      setEditingAwardForModal(null);
                      setIsAssignModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-white text-black font-black text-xs hover:bg-zinc-200 transition-all cursor-pointer"
                  >
                    Вручить номинацию года
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentFilteredAwards.map(award => (
                    <AwardCard
                      key={award.id}
                      award={award}
                      onClick={() => setActiveModalAward(award)}
                      openLightbox={openLightbox}
                      isAnnual={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MONTH MODE (e.g. "Сентябрь 2026" - Matches image_581fbf04.png) */}
          {selectedPeriod !== 'all_months' && selectedPeriod !== 'year_review' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {MONTH_NAMES_RU[selectedPeriod] || selectedPeriod} {selectedYear}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-semibold">
                    Победители месяца в основных номинациях ({currentFilteredAwards.length})
                  </p>
                </div>
              </div>

              {currentFilteredAwards.length === 0 ? (
                <div className="p-16 text-center rounded-3xl bg-white/5 border border-white/5">
                  <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400 font-bold text-sm">В этом месяце пока нет лауреатов</p>
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-white text-black font-black text-xs hover:bg-zinc-200 transition-all cursor-pointer"
                  >
                    Вручить премию за {MONTH_NAMES_RU[selectedPeriod]}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentFilteredAwards.map(award => (
                    <AwardCard
                      key={award.id}
                      award={award}
                      onClick={() => setActiveModalAward(award)}
                      openLightbox={openLightbox}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nominees & Contenders Modal */}
      <AwardNomineesModal
        isOpen={Boolean(activeModalAward)}
        award={activeModalAward}
        onClose={() => setActiveModalAward(null)}
        onEdit={(award) => {
          setEditingAwardForModal(award);
          setIsAssignModalOpen(true);
        }}
        onDelete={(awardId) => {
          onDeleteAward(awardId);
          setActiveModalAward(null);
        }}
        openLightbox={openLightbox}
        navigateTo={navigateTo}
        albums={albums}
        tracks={tracks}
        artists={artists}
        onPlayTrack={onPlayTrack}
      />

      {/* Assignment / Hand-out Award Modal */}
      <AwardAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setEditingAwardForModal(null);
        }}
        onSave={onSaveAward}
        editingAward={editingAwardForModal}
        albums={albums}
        tracks={tracks}
        artists={artists}
        initialYear={selectedYear}
        initialMonth={selectedPeriod !== 'all_months' && selectedPeriod !== 'year_review' ? selectedPeriod : '09'}
      />
    </div>
  );
};
