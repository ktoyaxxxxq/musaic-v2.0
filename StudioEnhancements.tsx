import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Play,
  ArrowLeftRight,
  TrendingUp,
  Newspaper,
  Disc,
  User,
  Music,
  Award,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Palette,
  Settings2,
  Shuffle,
  X,
  Check,
  Calendar,
  Flame,
  Trophy,
  LayoutGrid
} from 'lucide-react';
import { Artist, Album, Track, ViewType, AwardItem } from './types';
import {
  CoverArt,
  getTrackCover,
  formatDateDisplay,
  formatShortListeners,
  pluralizeTracks,
  parseFeaturedNames,
  aggregateArtistScores,
  getScoreTier
} from './App';

// ============================================================================
// 1. CHART DYNAMICS (TRUTHFUL TREND DELTAS & PEAKS — NO CLUTTER)
// ============================================================================

export interface ChartDynamics {
  currentRank: number;
  previousRank: number | null;
  delta: number; // positive = moved up, negative = moved down, 0 = steady
  status: 'new' | 'up' | 'down' | 'same';
  peakRank: number | null;
  weeksOnChart: number | null;
}

export function computeChartDynamics(
  item: {
    id: string;
    title?: string;
    releaseDate?: string;
    peakChartPosition?: number;
    previousChartPosition?: number;
    weeksOnChart?: number;
    chartHistory?: number[];
    diffDays?: number;
  },
  currentRank: number,
  referenceDate?: string
): ChartDynamics {
  const refMs = referenceDate ? new Date(referenceDate).getTime() : Date.now();
  const daysOld = typeof item.diffDays === 'number'
    ? item.diffDays
    : (item.releaseDate ? Math.max(1, Math.floor((refMs - new Date(item.releaseDate).getTime()) / 86400000)) : 90);

  // Only report previousRank when real history exists (never fabricate synthetic movement)
  let previousRank: number | null = null;
  if (typeof item.previousChartPosition === 'number' && item.previousChartPosition > 0) {
    previousRank = item.previousChartPosition;
  } else if (item.chartHistory && item.chartHistory.length >= 2) {
    previousRank = item.chartHistory[item.chartHistory.length - 2];
  }

  const delta = previousRank !== null ? previousRank - currentRank : 0;
  const isNewRelease = item.weeksOnChart === 1 || (previousRank === null && daysOld <= 14);

  let status: ChartDynamics['status'] = 'same';
  if (isNewRelease) status = 'new';
  else if (delta > 0) status = 'up';
  else if (delta < 0) status = 'down';

  const peakRank = typeof item.peakChartPosition === 'number' && item.peakChartPosition > 0
    ? Math.min(item.peakChartPosition, currentRank)
    : null;

  const weeksOnChart = typeof item.weeksOnChart === 'number' && item.weeksOnChart > 0
    ? item.weeksOnChart
    : null;

  return {
    currentRank,
    previousRank,
    delta,
    status,
    peakRank,
    weeksOnChart
  };
}

export const ChartTrendBadge: React.FC<{
  dynamics: ChartDynamics;
  compact?: boolean;
}> = ({ dynamics, compact = false }) => {
  if (dynamics.status === 'same') return null;

  const titleText = dynamics.status === 'new'
    ? `Свежий релиз в чарте${dynamics.peakRank ? ` · Пик #${dynamics.peakRank}` : ''}`
    : dynamics.previousRank
      ? `Прошлая неделя: #${dynamics.previousRank}${dynamics.peakRank ? ` · Пик #${dynamics.peakRank}` : ''}`
      : '';

  if (dynamics.status === 'new') {
    return (
      <span
        title={titleText}
        className={`inline-flex items-center font-bold tracking-wider uppercase tabular-nums ${
          compact ? 'text-[9px]' : 'text-[10px]'
        } text-sky-400`}
      >
        NEW
      </span>
    );
  }

  if (dynamics.status === 'up') {
    return (
      <span
        title={titleText}
        className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
          compact ? 'text-[10px]' : 'text-[11px]'
        } text-emerald-400`}
      >
        <span aria-hidden="true">▲</span>
        <span>+{dynamics.delta}</span>
      </span>
    );
  }

  return (
    <span
      title={titleText}
      className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
        compact ? 'text-[10px]' : 'text-[11px]'
      } text-rose-400`}
    >
      <span aria-hidden="true">▼</span>
      <span>{dynamics.delta}</span>
    </span>
  );
};

// ============================================================================
// 2. EDITORIAL INDUSTRY NEWSFEED (SMART HIGHLIGHTS + AUTO-GENERATED EVENTS)
// ============================================================================

export type NewsCategory = 'featured' | 'all' | 'release' | 'chart' | 'collab' | 'milestone';

export interface IndustryNewsItem {
  id: string;
  entityKey: string;
  category: Exclude<NewsCategory, 'all' | 'featured'>;
  categoryLabel: string;
  headline: string;
  detail: string;
  dateStr: string;
  timestamp: number;
  importanceScore: number;
  coverUrl?: string;
  targetView: ViewType;
  targetParams: { id?: string; artistName?: string; tab?: string; year?: string; month?: string };
  playTrack?: Track;
}

const formatCompactRus = (num: number): string => {
  if (num >= 100_000_000) return `${(num / 1_000_000).toFixed(0)} млн`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.', ',')} млн`;
  if (num >= 1_000) return `${Math.round(num / 1_000)} тыс.`;
  return num.toLocaleString('ru-RU');
};

export function generateIndustryNews(
  artists: Artist[],
  albums: Album[],
  tracks: Track[],
  awards: AwardItem[] = [],
  referenceDate?: string
): IndustryNewsItem[] {
  const items: IndustryNewsItem[] = [];
  const nowMs = referenceDate ? new Date(referenceDate).getTime() : Date.now();

  const artistFollowersMap = new Map<string, number>();
  artists.forEach(a => {
    artistFollowersMap.set(a.id, a.followers || 0);
    artistFollowersMap.set(a.name.toLowerCase().trim(), a.followers || 0);
  });

  const parseTs = (d?: string) => {
    if (!d) return 0;
    const t = new Date(d).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Freshness decay: items from last 7-30 days score much higher than 2-year-old items
  const calcFreshnessScore = (ts: number): number => {
    if (!ts || ts <= 0) return 5;
    const ageDays = Math.max(1, (nowMs - ts) / 86400000);
    if (ageDays <= 7) return 110;
    if (ageDays <= 21) return 85;
    if (ageDays <= 45) return 62;
    if (ageDays <= 90) return 42;
    if (ageDays <= 180) return 24;
    if (ageDays <= 365) return 12;
    return 4;
  };

  const calcVelocityBonus = (plays: number, ts: number): number => {
    const ageDays = ts > 0 ? Math.max(1, (nowMs - ts) / 86400000) : 120;
    const daily = plays / ageDays;
    return Math.min(48, Math.log10(daily + 1) * 8.5) + Math.min(30, Math.log10(plays + 1) * 3.4);
  };

  // A. Albums: Fresh Drops, High Chart Peaks, Critic Scores & Album Value
  albums.forEach(alb => {
    const ts = parseTs(alb.releaseDate) || (alb.releaseYear ? new Date(`${alb.releaseYear}-01-01`).getTime() : 0);
    const albTracks = tracks.filter(t => t.albumId === alb.id);
    const albPlays = alb.totalPlays || albTracks.reduce((s, t) => s + (t.plays || 0), 0);
    const freshness = calcFreshnessScore(ts);
    const velocity = calcVelocityBonus(albPlays, ts);
    const followers = artistFollowersMap.get(alb.artistId) || artistFollowersMap.get(alb.artistName.toLowerCase().trim()) || 0;
    const starPower = Math.min(18, Math.log10(followers + 1) * 2.4);

    items.push({
      id: `news_alb_${alb.id}`,
      entityKey: `alb_${alb.id}`,
      category: 'release',
      categoryLabel: 'Премьера альбома',
      headline: `${alb.artistName}${alb.coArtist ? ` и ${alb.coArtist}` : ''} выпустили «${alb.title}»`,
      detail: `${alb.genre || 'Релиз'}${albTracks.length > 0 ? ` · ${albTracks.length} ${pluralizeTracks(albTracks.length)}` : ''}${albPlays ? ` · ${formatCompactRus(albPlays)} просл.` : ''}`,
      dateStr: alb.releaseDate || String(alb.releaseYear || ''),
      timestamp: ts,
      importanceScore: freshness + velocity + starPower + (alb.coArtist ? 12 : 6),
      coverUrl: alb.coverUrl,
      targetView: 'album',
      targetParams: { id: alb.id }
    });

    if (alb.peakChartPosition && alb.peakChartPosition <= 3) {
      const peakBoost = alb.peakChartPosition === 1 ? 45 : 26;
      items.push({
        id: `news_alb_peak_${alb.id}`,
        entityKey: `alb_${alb.id}`,
        category: 'chart',
        categoryLabel: 'Лидер чарта',
        headline: `Альбом «${alb.title}» занял #${alb.peakChartPosition} в чарте`,
        detail: `${alb.artistName} · ${formatCompactRus(albPlays)} прослушиваний`,
        dateStr: alb.releaseDate || String(alb.releaseYear || ''),
        timestamp: ts + 1000,
        importanceScore: freshness + velocity + peakBoost,
        coverUrl: alb.coverUrl,
        targetView: 'album',
        targetParams: { id: alb.id }
      });
    }

    if ((alb.rating && alb.rating.totalScore >= 82) || (alb.albumValue && (alb.albumValue.categoryKey === 'ruby' || alb.albumValue.categoryKey === 'sapphire'))) {
      const scoreVal = alb.rating?.totalScore || 0;
      const tierInfo = alb.albumValue ? alb.albumValue.categoryTitle : '';
      items.push({
        id: `news_alb_score_${alb.id}`,
        entityKey: `alb_${alb.id}`,
        category: 'milestone',
        categoryLabel: 'Признание',
        headline: scoreVal >= 82
          ? `«${alb.title}» получил ${scoreVal}/90 от редакции`
          : `«${alb.title}» получил статус «${tierInfo}»`,
        detail: `${alb.artistName}${tierInfo && scoreVal >= 82 ? ` · ${tierInfo}` : (alb.genre ? ` · ${alb.genre}` : '')}`,
        dateStr: alb.releaseDate || String(alb.releaseYear || ''),
        timestamp: ts + 500,
        importanceScore: freshness + (scoreVal >= 88 ? 42 : 28) + (alb.albumValue?.categoryKey === 'ruby' ? 20 : 10),
        coverUrl: alb.coverUrl,
        targetView: 'album',
        targetParams: { id: alb.id }
      });
    }
  });

  // B. Tracks: Hot Fresh Drops, Chart #1s, Big Collabs & Stream Milestones
  const sortedByPlays = [...tracks].sort((a, b) => (b.plays || 0) - (a.plays || 0));
  sortedByPlays.forEach((tr) => {
    const ts = parseTs(tr.releaseDate);
    const cover = getTrackCover(tr, albums);
    const feats = parseFeaturedNames(tr.featuredArtist, tr.artistName);
    const freshness = calcFreshnessScore(ts);
    const velocity = calcVelocityBonus(tr.plays || 0, ts);
    const ageDays = ts > 0 ? Math.max(1, (nowMs - ts) / 86400000) : 120;

    // Fresh release or major single
    if (!tr.albumId || tr.albumId === 'single' || ageDays <= 45) {
      items.push({
        id: `news_trk_rel_${tr.id}`,
        entityKey: `trk_${tr.id}`,
        category: 'release',
        categoryLabel: tr.albumId && tr.albumId !== 'single' ? 'Горячий трек' : 'Свежий сингл',
        headline: `${tr.artistName} — «${tr.title}»${feats.length ? ` (feat. ${feats.join(', ')})` : ''}`,
        detail: `${tr.genre || 'Трек'} · ${formatCompactRus(tr.plays || 0)} прослушиваний`,
        dateStr: tr.releaseDate || '',
        timestamp: ts,
        importanceScore: freshness + velocity + (feats.length > 0 ? 10 : 0),
        coverUrl: cover,
        targetView: 'track',
        targetParams: { id: tr.id },
        playTrack: tr
      });
    }

    // Major collaboration
    if (feats.length > 0 && ((tr.plays || 0) >= 500_000 || (tr.rating?.totalScore || 0) >= 75 || ageDays <= 30)) {
      const featPower = feats.reduce((acc, f) => acc + (artistFollowersMap.get(f.toLowerCase().trim()) || 0), 0);
      const collabBonus = 18 + Math.min(18, Math.log10(featPower + 1) * 2.2);
      items.push({
        id: `news_trk_col_${tr.id}`,
        entityKey: `trk_${tr.id}`,
        category: 'collab',
        categoryLabel: 'Коллаборация',
        headline: `Совместный фит ${tr.artistName} × ${feats.join(', ')} — «${tr.title}»`,
        detail: `${formatCompactRus(tr.plays || 0)} прослушиваний${tr.rating ? ` · ${tr.rating.totalScore}/90` : ''}`,
        dateStr: tr.releaseDate || '',
        timestamp: ts + 300,
        importanceScore: freshness + velocity * 0.9 + collabBonus,
        coverUrl: cover,
        targetView: 'track',
        targetParams: { id: tr.id },
        playTrack: tr
      });
    }

    // Chart Peak #1 or Top-3
    if (tr.peakChartPosition && tr.peakChartPosition <= 3) {
      const peakBoost = tr.peakChartPosition === 1 ? 48 : 28;
      items.push({
        id: `news_trk_pk_${tr.id}`,
        entityKey: `trk_${tr.id}`,
        category: 'chart',
        categoryLabel: tr.peakChartPosition === 1 ? 'Чарт #1' : 'Топ чарта',
        headline: `«${tr.title}» занял #${tr.peakChartPosition} в главном чарте`,
        detail: `${tr.artistName} · ${formatCompactRus(tr.plays || 0)} прослушиваний`,
        dateStr: tr.releaseDate || '',
        timestamp: ts + 800,
        importanceScore: freshness + velocity * 0.85 + peakBoost,
        coverUrl: cover,
        targetView: 'track',
        targetParams: { id: tr.id },
        playTrack: tr
      });
    }

    // Stream milestones & 85+ scores
    if ((tr.plays || 0) >= 10_000_000) {
      const tierText = tr.plays >= 100_000_000
        ? '100 млн+'
        : tr.plays >= 50_000_000
          ? '50 млн+'
          : '10 млн+';
      const milestoneBoost = tr.plays >= 100_000_000 ? 44 : tr.plays >= 50_000_000 ? 32 : 20;
      items.push({
        id: `news_trk_ms_${tr.id}`,
        entityKey: `trk_${tr.id}`,
        category: 'milestone',
        categoryLabel: 'Рекорд стримов',
        headline: `«${tr.title}» преодолел отметку ${tierText} прослушиваний`,
        detail: `${tr.artistName} · всего ${formatCompactRus(tr.plays)}`,
        dateStr: tr.releaseDate || '',
        timestamp: ts + 200,
        importanceScore: freshness * 0.8 + velocity + milestoneBoost,
        coverUrl: cover,
        targetView: 'track',
        targetParams: { id: tr.id },
        playTrack: tr
      });
    } else if (tr.rating && tr.rating.totalScore >= 85) {
      items.push({
        id: `news_trk_sc_${tr.id}`,
        entityKey: `trk_${tr.id}`,
        category: 'milestone',
        categoryLabel: 'Высокий балл',
        headline: `«${tr.title}» получил ${tr.rating.totalScore}/90 от редакции`,
        detail: `${tr.artistName} · ${tr.genre || 'Трек'}`,
        dateStr: tr.releaseDate || '',
        timestamp: ts + 150,
        importanceScore: freshness + 32 + (tr.rating.totalScore === 90 ? 18 : 0),
        coverUrl: cover,
        targetView: 'track',
        targetParams: { id: tr.id },
        playTrack: tr
      });
    }
  });

  // C. Major Awards (Премии)
  awards.forEach(aw => {
    if (!aw?.winner?.title) return;
    const dateISO = aw.month ? `${aw.year}-${aw.month}-15` : `${aw.year}-12-20`;
    const ts = parseTs(dateISO);
    const freshness = calcFreshnessScore(ts);
    const isTopNom = aw.periodType === 'year' || aw.nominationKey === 'artist_of_month' || aw.nominationKey === 'album_of_month' || aw.nominationKey === 'track_of_month';
    items.push({
      id: `news_aw_${aw.id}`,
      entityKey: `aw_${aw.id}`,
      category: 'milestone',
      categoryLabel: 'Премия',
      headline: `${aw.nominationTitle}: победил ${aw.winner.title}`,
      detail: `${aw.winner.artistName ? `${aw.winner.artistName} · ` : ''}${aw.month ? `${aw.month}.${aw.year}` : `${aw.year} год`}`,
      dateStr: dateISO,
      timestamp: ts,
      importanceScore: freshness + (aw.periodType === 'year' ? 42 : isTopNom ? 28 : 16),
      coverUrl: aw.winner.coverUrl,
      targetView: 'rating',
      targetParams: { tab: 'awards', year: aw.year, month: aw.month }
    });
  });

  // Deduplicate by headline
  const seen = new Set<string>();
  return items
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(item => {
      const k = item.headline.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

function selectIndustryNews(allNews: IndustryNewsItem[], filter: NewsCategory): IndustryNewsItem[] {
  if (filter === 'featured') {
    // Sort by smart importanceScore (freshness + magnitude) and keep 1 top headline per entity for diversity
    const byImportance = [...allNews].sort((a, b) => b.importanceScore - a.importanceScore);
    const seenEntities = new Set<string>();
    const diverse: IndustryNewsItem[] = [];
    for (const item of byImportance) {
      if (!seenEntities.has(item.entityKey)) {
        seenEntities.add(item.entityKey);
        diverse.push(item);
      }
    }
    return diverse;
  }
  if (filter === 'all') return allNews;
  return allNews.filter(n => n.category === filter);
}

export const IndustryNewsSection: React.FC<{
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  awards?: AwardItem[];
  referenceDate?: string;
  navigateTo: (view: ViewType, params?: any) => void;
  onPlayTrack?: (t: Track) => void;
}> = React.memo(({ artists, albums, tracks, awards = [], referenceDate, navigateTo, onPlayTrack }) => {
  const [filter, setFilter] = useState<NewsCategory>('featured');
  const allNews = useMemo(() => generateIndustryNews(artists, albums, tracks, awards, referenceDate), [artists, albums, tracks, awards, referenceDate]);
  const filtered = useMemo(() => selectIndustryNews(allNews, filter).slice(0, 5), [allNews, filter]);

  if (allNews.length === 0) return null;

  const tabs: Array<{ id: NewsCategory; label: string }> = [
    { id: 'featured', label: 'Главное' },
    { id: 'release', label: 'Премьеры' },
    { id: 'chart', label: 'Чарты' },
    { id: 'collab', label: 'Фиты' },
    { id: 'milestone', label: 'Рекорды' }
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">События индустрии</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Самые свежие и заметные события вашего каталога</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 bg-zinc-900/80 border border-white/10 rounded-xl">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filter === t.id ? 'bg-white/12 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigateTo('news', { newsFilter: filter })}
            className="text-xs font-semibold text-zinc-400 hover-text-link flex items-center gap-1 cursor-pointer whitespace-nowrap px-2 py-1"
          >
            <span>Вся хроника</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/45 border border-white/[0.07] divide-y divide-white/[0.05] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Нет событий в этой категории.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              onClick={() => navigateTo(item.targetView, item.targetParams)}
              className="group flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <CoverArt
                  url={item.coverUrl}
                  title={item.headline}
                  className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0"
                  showZoomIcon={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-bold text-zinc-100 truncate hover-text-link">
                    {item.headline}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    <span className="text-zinc-300 font-medium">{item.categoryLabel}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    <span>{item.detail}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {item.dateStr && (
                  <span className="hidden sm:inline text-[11px] font-mono text-zinc-500 tabular-nums">
                    {formatDateDisplay(item.dateStr)}
                  </span>
                )}
                {item.playTrack && onPlayTrack && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(item.playTrack!);
                    }}
                    className="w-7 h-7 rounded-full bg-white/5 hover:theme-bg-accent text-zinc-300 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                    title="Воспроизвести"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
});

export const DropTimelinePanel: React.FC<{
  artists?: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: any) => void;
  onPlayTrack?: (t: Track) => void;
  onOpenActivityFeed?: () => void;
}> = ({ albums, tracks, navigateTo, onPlayTrack, onOpenActivityFeed }) => {
  const [timelineViewMode, setTimelineViewMode] = useState<'grid' | 'dual_column'>('grid');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'tops' | 'albums' | 'tracks' | 'snippets'>('all');
  const [timelineSearch, setTimelineSearch] = useState<string>('');
  const [visibleDateGroups, setVisibleDateGroups] = useState<number>(18);

  const groupedResult = useMemo(() => {
    let combined: Array<{
      id: string;
      type: 'album' | 'track';
      title: string;
      artistName: string;
      artistId?: string;
      coverUrl?: string;
      releaseDate: string;
      plays: number;
      duration?: string;
      rating?: any;
      isSnippet?: boolean;
      snippetTeaser?: string;
      trackCount?: number;
      raw: any;
    }> = [
      ...albums.map((al: Album) => {
        const albTracksCount = tracks.filter(
          (t: Track) => t.albumId === al.id || (t.albumTitle && t.albumTitle.toLowerCase() === al.title.toLowerCase())
        ).length;
        return {
          id: al.id,
          type: 'album' as const,
          title: al.title,
          artistName: al.artistName,
          artistId: al.artistId,
          coverUrl: al.coverUrl,
          releaseDate: al.releaseDate || `${al.releaseYear || 2025}-01-01`,
          plays: al.totalPlays || 0,
          rating: al.rating,
          trackCount: albTracksCount > 0 ? albTracksCount : 8,
          raw: al
        };
      }),
      ...tracks.map((tr: Track) => ({
        id: tr.id,
        type: 'track' as const,
        title: tr.title,
        artistName: tr.artistName,
        artistId: tr.artistId,
        coverUrl: getTrackCover(tr, albums),
        releaseDate: tr.releaseDate || '2025-01-01',
        plays: tr.plays || 0,
        duration: tr.duration,
        rating: tr.rating,
        isSnippet: tr.isSnippet,
        snippetTeaser: tr.snippetTeaser,
        raw: tr
      }))
    ];

    if (timelineFilter === 'tops') {
      combined = combined.filter(x => x.plays >= 500_000 || (x.rating && x.rating.totalScore >= 65));
    } else if (timelineFilter === 'albums') {
      combined = combined.filter(x => x.type === 'album');
    } else if (timelineFilter === 'tracks') {
      combined = combined.filter(x => x.type === 'track' && !x.isSnippet);
    } else if (timelineFilter === 'snippets') {
      combined = combined.filter(x => x.isSnippet);
    }

    if (timelineSearch.trim()) {
      const q = timelineSearch.trim().toLowerCase();
      combined = combined.filter(x => x.title.toLowerCase().includes(q) || x.artistName.toLowerCase().includes(q));
    }

    const groups = new Map<string, typeof combined>();
    combined.forEach(item => {
      const dateStr = item.releaseDate ? item.releaseDate.split('T')[0] : 'Без даты';
      if (!groups.has(dateStr)) groups.set(dateStr, []);
      groups.get(dateStr)!.push(item);
    });

    const sortedDates = Array.from(groups.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return { totalCount: combined.length, groups, sortedDates };
  }, [albums, tracks, timelineFilter, timelineSearch]);

  const visibleDates = groupedResult.sortedDates.slice(0, visibleDateGroups);

  return (
    <div className="space-y-6">
      <div className="p-5 md:p-6 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl md:text-2xl font-black text-white">Лента дропов</h3>
            <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.08] text-xs font-bold text-zinc-300 tabular-nums">
              {groupedResult.totalCount} релизов
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex gap-1 p-1 bg-black/40 rounded-2xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTimelineViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  timelineViewMode === 'grid' ? 'theme-bg-accent text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Сетка</span>
              </button>
              <button
                type="button"
                onClick={() => setTimelineViewMode('dual_column')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  timelineViewMode === 'dual_column' ? 'theme-bg-accent text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Альбомы | Треки</span>
              </button>
            </div>

            {onOpenActivityFeed && (
              <button
                type="button"
                onClick={onOpenActivityFeed}
                className="px-3.5 py-2 rounded-2xl text-xs font-black bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all border border-indigo-500/30 flex items-center gap-2 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-indigo-400" />
                <span>Активность артистов</span>
              </button>
            )}

            <div className="relative w-full md:w-56">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Поиск дропов..."
                value={timelineSearch}
                onChange={e => setTimelineSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 overflow-x-auto">
          {[
            { id: 'all', label: 'Все дропы' },
            { id: 'tops', label: 'Топы недели' },
            { id: 'albums', label: 'Альбомы' },
            { id: 'tracks', label: 'Треки' },
            { id: 'snippets', label: 'Сниппеты / Тизеры' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTimelineFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timelineFilter === f.id ? 'theme-bg-accent text-black shadow-md font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visibleDates.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 font-bold bg-zinc-900/40 border border-white/5 rounded-3xl">
          По вашему запросу релизы не найдены.
        </div>
      ) : timelineViewMode === 'dual_column' ? (
        <div className="space-y-8">
          {visibleDates.map(dateKey => {
            const dayItems = groupedResult.groups.get(dateKey) || [];
            const dayAlbums = dayItems.filter(x => x.type === 'album');
            const dayTracks = dayItems.filter(x => x.type === 'track' && (!x.raw.albumId || x.raw.albumId === 'single'));

            return (
              <div key={dateKey} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full theme-bg-accent" />
                  <h4 className="text-base md:text-lg font-black text-white font-mono">{formatDateDisplay(dateKey)}</h4>
                  <span className="text-xs text-zinc-500 font-bold">({dayItems.length} релизов)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Disc className="w-4 h-4" /> Альбомы ({dayAlbums.length})
                      </span>
                    </div>
                    {dayAlbums.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic py-2">Нет альбомов на эту дату</p>
                    ) : (
                      <div className="space-y-2">
                        {dayAlbums.map(rel => (
                          <div
                            key={`dual-alb-${rel.id}`}
                            onClick={() => navigateTo('album', { id: rel.id })}
                            className="p-3 rounded-2xl bg-black/40 hover:bg-zinc-800/80 border border-white/10 hover:border-white/25 transition-all cursor-pointer group flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CoverArt url={rel.coverUrl} title={rel.title} className="w-12 h-12 rounded-xl shrink-0 bg-zinc-800" />
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-sm text-white truncate group-hover:text-amber-300 transition-colors">{rel.title}</h5>
                                <p className="text-xs text-zinc-400 truncate">{rel.artistName}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono text-xs text-zinc-400">
                              <p className="text-white font-bold tabular-nums">{rel.plays.toLocaleString('ru-RU')}</p>
                              <p className="text-[10px] text-amber-300 font-bold">{rel.trackCount} тр.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Music className="w-4 h-4" /> Треки и Синглы ({dayTracks.length})
                      </span>
                    </div>
                    {dayTracks.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic py-2">Нет синглов на эту дату</p>
                    ) : (
                      <div className="space-y-2">
                        {dayTracks.map(rel => (
                          <div
                            key={`dual-trk-${rel.id}`}
                            onClick={() => navigateTo('track', { id: rel.id })}
                            className="p-3 rounded-2xl bg-black/40 hover:bg-zinc-800/80 border border-white/10 hover:border-white/25 transition-all cursor-pointer group flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CoverArt url={rel.coverUrl} title={rel.title} className="w-11 h-11 rounded-xl shrink-0 bg-zinc-800" />
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-sm text-white truncate group-hover:text-sky-300 transition-colors">{rel.title}</h5>
                                <p className="text-xs text-zinc-400 truncate">{rel.artistName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                              <span className="text-white font-bold tabular-nums">{rel.plays.toLocaleString('ru-RU')}</span>
                              {onPlayTrack && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onPlayTrack(rel.raw);
                                  }}
                                  className="w-8 h-8 rounded-full theme-bg-accent flex items-center justify-center text-black shadow-lg hover:scale-105 transition-transform cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleDates.map(dateKey => {
            const items = groupedResult.groups.get(dateKey) || [];
            return (
              <div key={dateKey} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full theme-bg-accent" />
                  <h4 className="text-base md:text-lg font-black text-white font-mono">{formatDateDisplay(dateKey)}</h4>
                  <span className="text-xs text-zinc-500 font-bold">({items.length} релизов)</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map(rel => (
                    <div
                      key={`${rel.type}-${rel.id}`}
                      onClick={() => navigateTo(rel.type === 'track' ? 'track' : 'album', { id: rel.id })}
                      className="p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-800">
                          <CoverArt url={rel.coverUrl} title={rel.title} className="w-full h-full" innerClassName="group-hover:scale-105 duration-300" />
                          <div className="absolute top-2 left-2 z-10">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                rel.isSnippet
                                  ? 'bg-purple-500 text-white'
                                  : rel.type === 'album'
                                    ? 'bg-amber-400 text-black'
                                    : 'bg-black/80 text-white border border-white/10'
                              }`}
                            >
                              {rel.isSnippet ? 'Сниппет' : rel.type === 'album' ? 'Альбом' : 'Трек'}
                            </span>
                          </div>
                          {rel.type === 'track' && onPlayTrack && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                onPlayTrack(rel.raw);
                              }}
                              className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full theme-bg-accent flex items-center justify-center text-black shadow-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                              <Play className="w-5 h-5 fill-black ml-0.5" />
                            </button>
                          )}
                        </div>

                        <h5 className="font-extrabold text-sm text-white truncate group-hover:text-amber-300 transition-colors">{rel.title}</h5>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{rel.artistName}</p>
                        {rel.snippetTeaser && <p className="text-[11px] text-purple-300 italic mt-1 line-clamp-2">{rel.snippetTeaser}</p>}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span className="tabular-nums text-white font-bold">{rel.plays.toLocaleString('ru-RU')}</span>
                          {rel.type === 'album' && <span className="text-[10px] text-amber-300 font-bold ml-1">· {rel.trackCount} тр.</span>}
                        </span>
                        {rel.duration && <span>{rel.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {groupedResult.sortedDates.length > visibleDateGroups && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleDateGroups(prev => prev + 18)}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-white cursor-pointer transition-colors"
          >
            Показать более ранние даты ({groupedResult.sortedDates.length - visibleDateGroups} ещё)
          </button>
        </div>
      )}
    </div>
  );
};

export const IndustryNewsView: React.FC<{
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  awards?: AwardItem[];
  referenceDate?: string;
  initialFilter?: string;
  navigateTo: (view: ViewType, params?: any) => void;
  onPlayTrack?: (t: Track) => void;
  onOpenActivityFeed?: () => void;
}> = ({ artists, albums, tracks, awards = [], referenceDate, initialFilter = 'featured', navigateTo, onPlayTrack, onOpenActivityFeed }) => {
  const [sectionMode, setSectionMode] = useState<'events' | 'timeline'>(() =>
    initialFilter === 'timeline' ? 'timeline' : 'events'
  );
  const [filter, setFilter] = useState<NewsCategory>(
    initialFilter && initialFilter !== 'timeline' ? (initialFilter as NewsCategory) : 'featured'
  );
  const [query, setQuery] = useState('');

  const allNews = useMemo(() => generateIndustryNews(artists, albums, tracks, awards, referenceDate), [artists, albums, tracks, awards, referenceDate]);
  const filtered = useMemo(() => {
    const base = selectIndustryNews(allNews, filter);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(item => item.headline.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q));
  }, [allNews, filter, query]);

  const tabs: Array<{ id: NewsCategory; label: string }> = [
    { id: 'featured', label: 'Главное' },
    { id: 'all', label: 'Все события' },
    { id: 'release', label: 'Премьеры' },
    { id: 'chart', label: 'Чарты и пики' },
    { id: 'collab', label: 'Коллаборации' },
    { id: 'milestone', label: 'Рекорды и оценки' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 pt-6 pb-28 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {sectionMode === 'timeline' ? 'Лента дропов' : 'События'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch Button between Events Feed & Drop Timeline */}
          <button
            type="button"
            onClick={() => setSectionMode(prev => (prev === 'events' ? 'timeline' : 'events'))}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
              sectionMode === 'timeline'
                ? 'theme-bg-accent text-black border-transparent shadow-lg'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-white border-white/10 hover:border-white/20'
            }`}
          >
            {sectionMode === 'timeline' ? (
              <>
                <Newspaper className="w-4 h-4" />
                <span>К событиям</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 theme-accent" />
                <span>Лента дропов</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </>
            )}
          </button>

          {sectionMode === 'events' && (
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по событиям..."
                className="w-full bg-zinc-900/80 border border-white/10 focus:border-white/25 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {sectionMode === 'timeline' ? (
        <DropTimelinePanel
          artists={artists}
          albums={albums}
          tracks={tracks}
          navigateTo={navigateTo}
          onPlayTrack={onPlayTrack}
          onOpenActivityFeed={onOpenActivityFeed}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900/80 border border-white/10 rounded-2xl w-fit">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filter === t.id ? 'theme-bg-accent text-black shadow-md font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-sm text-zinc-400">
              По выбранному фильтру событий пока нет.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.slice(0, 60).map(item => (
                <div
                  key={item.id}
                  onClick={() => navigateTo(item.targetView, item.targetParams)}
                  className="group flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <CoverArt
                      url={item.coverUrl}
                      title={item.headline}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-md"
                      showZoomIcon={false}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          item.category === 'release'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                            : item.category === 'chart'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-400/30'
                              : item.category === 'collab'
                                ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                                : item.category === 'milestone'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                                  : 'bg-white/10 text-zinc-300 border-white/15'
                        }`}>
                          {item.categoryLabel}
                        </span>
                        {item.dateStr && (
                          <span className="text-xs font-mono text-zinc-400 tabular-nums">
                            {formatDateDisplay(item.dateStr)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-extrabold text-white truncate group-hover:theme-accent transition-colors">
                        {item.headline}
                      </p>
                      <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {item.playTrack && onPlayTrack && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack(item.playTrack!);
                        }}
                        className="w-9 h-9 rounded-full theme-bg-accent text-black flex items-center justify-center hover:scale-105 transition-all shadow-md cursor-pointer"
                        title="Воспроизвести"
                      >
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// 3. COMPARE VIEW (HEAD-TO-HEAD VERSUS FOR ARTISTS & ALBUMS)
// ============================================================================

export const CompareView: React.FC<{
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  initialMode?: 'artists' | 'albums';
  initialLeftId?: string;
  initialRightId?: string;
  navigateTo: (view: ViewType, params?: any) => void;
  onPlayTrack?: (t: Track) => void;
}> = ({ artists, albums, tracks, initialMode = 'artists', initialLeftId, initialRightId, navigateTo, onPlayTrack }) => {
  const [mode, setMode] = useState<'artists' | 'albums'>(initialMode);
  const [leftId, setLeftId] = useState<string>(() => initialLeftId || (initialMode === 'artists' ? artists[0]?.id || '' : albums[0]?.id || ''));
  const [rightId, setRightId] = useState<string>(() => initialRightId || (initialMode === 'artists' ? artists[1]?.id || '' : albums[1]?.id || ''));
  const [pickerSide, setPickerSide] = useState<'left' | 'right' | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialLeftId) setLeftId(initialLeftId);
  }, [initialLeftId]);

  useEffect(() => {
    if (initialRightId) setRightId(initialRightId);
  }, [initialRightId]);

  const handleModeSwitch = (nextMode: 'artists' | 'albums') => {
    setMode(nextMode);
    setPickerSide(null);
    setPickerQuery('');
    if (nextMode === 'artists') {
      setLeftId(artists[0]?.id || '');
      setRightId(artists[1]?.id || artists[0]?.id || '');
    } else {
      setLeftId(albums[0]?.id || '');
      setRightId(albums[1]?.id || albums[0]?.id || '');
    }
  };

  const swapSides = () => {
    setLeftId(rightId);
    setRightId(leftId);
  };

  const artistScores = useMemo(() => aggregateArtistScores(tracks, albums), [tracks, albums]);

  // Compute Artist Comparison Metrics
  const getArtistStats = (artist?: Artist) => {
    if (!artist) return null;
    const artTracks = tracks.filter(t => t.artistId === artist.id || t.artistName?.toLowerCase() === artist.name.toLowerCase());
    const artAlbums = albums.filter(a => a.artistId === artist.id || a.artistName?.toLowerCase() === artist.name.toLowerCase());
    const totalPlays = artTracks.reduce((sum, t) => sum + (t.plays || 0), 0);
    const scoreEntry = artistScores.get(artist.id) || artistScores.get(artist.name.toLowerCase().trim());
    const avgScore = scoreEntry ? Number((scoreEntry.sum / scoreEntry.count).toFixed(1)) : 0;
    const peakCandidates = [
      ...artTracks.map(t => t.peakChartPosition).filter((p): p is number => Boolean(p && p > 0)),
      ...artAlbums.map(a => a.peakChartPosition).filter((p): p is number => Boolean(p && p > 0))
    ];
    const bestPeak = peakCandidates.length > 0 ? Math.min(...peakCandidates) : null;
    const topTrack = [...artTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0] || null;
    return {
      entity: artist,
      tracksCount: artTracks.length,
      albumsCount: artAlbums.length,
      totalPlays,
      avgScore,
      bestPeak,
      topTrack,
      artTracks
    };
  };

  // Compute Album Comparison Metrics
  const getAlbumStats = (album?: Album) => {
    if (!album) return null;
    const albTracks = tracks.filter(t => t.albumId === album.id || (t.albumTitle && album.title && t.albumTitle.toLowerCase() === album.title.toLowerCase()));
    const totalPlays = album.totalPlays || albTracks.reduce((sum, t) => sum + (t.plays || 0), 0);
    const avgPlays = albTracks.length > 0 ? Math.round(totalPlays / albTracks.length) : totalPlays;
    const ratedTracks = albTracks.filter(t => t.rating?.totalScore);
    const avgTrackScore = ratedTracks.length > 0
      ? Number((ratedTracks.reduce((s, t) => s + (t.rating?.totalScore || 0), 0) / ratedTracks.length).toFixed(1))
      : (album.rating?.totalScore || 0);
    const topTrack = [...albTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0] || null;
    return {
      entity: album,
      tracksCount: albTracks.length,
      totalPlays,
      avgPlays,
      score: album.rating?.totalScore || avgTrackScore,
      valueScore: album.albumValue?.totalValue || 0,
      bestPeak: album.peakChartPosition || null,
      topTrack
    };
  };

  const leftArtist = mode === 'artists' ? getArtistStats(artists.find(a => a.id === leftId)) : null;
  const rightArtist = mode === 'artists' ? getArtistStats(artists.find(a => a.id === rightId)) : null;
  const leftAlbum = mode === 'albums' ? getAlbumStats(albums.find(a => a.id === leftId)) : null;
  const rightAlbum = mode === 'albums' ? getAlbumStats(albums.find(a => a.id === rightId)) : null;

  // Shared collaborations when comparing two artists
  const sharedTracks = useMemo(() => {
    if (mode !== 'artists' || !leftArtist || !rightArtist || leftArtist.entity.id === rightArtist.entity.id) return [];
    const nameA = leftArtist.entity.name.toLowerCase().trim();
    const nameB = rightArtist.entity.name.toLowerCase().trim();
    return tracks.filter(t => {
      const main = (t.artistName || '').toLowerCase().trim();
      const feats = parseFeaturedNames(t.featuredArtist).map(f => f.toLowerCase().trim());
      const hasA = main === nameA || feats.includes(nameA);
      const hasB = main === nameB || feats.includes(nameB);
      return hasA && hasB;
    }).sort((a, b) => (b.plays || 0) - (a.plays || 0));
  }, [mode, leftArtist, rightArtist, tracks]);

  interface MetricRow {
    label: string;
    leftVal: number;
    rightVal: number;
    leftDisplay: string;
    rightDisplay: string;
    lowerIsBetter?: boolean;
  }

  const metricRows: MetricRow[] = useMemo(() => {
    if (mode === 'artists' && leftArtist && rightArtist) {
      return [
        {
          label: 'Слушатели в месяц',
          leftVal: leftArtist.entity.followers || 0,
          rightVal: rightArtist.entity.followers || 0,
          leftDisplay: (leftArtist.entity.followers || 0).toLocaleString('ru-RU'),
          rightDisplay: (rightArtist.entity.followers || 0).toLocaleString('ru-RU')
        },
        {
          label: 'Всего прослушиваний',
          leftVal: leftArtist.totalPlays,
          rightVal: rightArtist.totalPlays,
          leftDisplay: formatCompactRus(leftArtist.totalPlays),
          rightDisplay: formatCompactRus(rightArtist.totalPlays)
        },
        {
          label: 'Треки в каталоге',
          leftVal: leftArtist.tracksCount,
          rightVal: rightArtist.tracksCount,
          leftDisplay: `${leftArtist.tracksCount} · ${leftArtist.albumsCount} альб.`,
          rightDisplay: `${rightArtist.tracksCount} · ${rightArtist.albumsCount} альб.`
        },
        {
          label: 'Средняя оценка',
          leftVal: leftArtist.avgScore,
          rightVal: rightArtist.avgScore,
          leftDisplay: leftArtist.avgScore > 0 ? `${leftArtist.avgScore} / 90` : '—',
          rightDisplay: rightArtist.avgScore > 0 ? `${rightArtist.avgScore} / 90` : '—'
        },
        {
          label: 'Лучший пик в чарте',
          leftVal: leftArtist.bestPeak ?? 999,
          rightVal: rightArtist.bestPeak ?? 999,
          leftDisplay: leftArtist.bestPeak ? `#${leftArtist.bestPeak}` : '—',
          rightDisplay: rightArtist.bestPeak ? `#${rightArtist.bestPeak}` : '—',
          lowerIsBetter: true
        }
      ];
    }

    if (mode === 'albums' && leftAlbum && rightAlbum) {
      return [
        {
          label: 'Всего прослушиваний',
          leftVal: leftAlbum.totalPlays,
          rightVal: rightAlbum.totalPlays,
          leftDisplay: formatCompactRus(leftAlbum.totalPlays),
          rightDisplay: formatCompactRus(rightAlbum.totalPlays)
        },
        {
          label: 'В среднем на трек',
          leftVal: leftAlbum.avgPlays,
          rightVal: rightAlbum.avgPlays,
          leftDisplay: formatCompactRus(leftAlbum.avgPlays),
          rightDisplay: formatCompactRus(rightAlbum.avgPlays)
        },
        {
          label: 'Треков в релизе',
          leftVal: leftAlbum.tracksCount,
          rightVal: rightAlbum.tracksCount,
          leftDisplay: String(leftAlbum.tracksCount),
          rightDisplay: String(rightAlbum.tracksCount)
        },
        {
          label: 'Оценка (из 90)',
          leftVal: leftAlbum.score,
          rightVal: rightAlbum.score,
          leftDisplay: leftAlbum.score > 0 ? `${leftAlbum.score} / 90` : '—',
          rightDisplay: rightAlbum.score > 0 ? `${rightAlbum.score} / 90` : '—'
        },
        {
          label: 'Ценность альбома',
          leftVal: leftAlbum.valueScore,
          rightVal: rightAlbum.valueScore,
          leftDisplay: leftAlbum.valueScore > 0 ? String(leftAlbum.valueScore) : '—',
          rightDisplay: rightAlbum.valueScore > 0 ? String(rightAlbum.valueScore) : '—'
        },
        {
          label: 'Пик в чарте',
          leftVal: leftAlbum.bestPeak ?? 999,
          rightVal: rightAlbum.bestPeak ?? 999,
          leftDisplay: leftAlbum.bestPeak ? `#${leftAlbum.bestPeak}` : '—',
          rightDisplay: rightAlbum.bestPeak ? `#${rightAlbum.bestPeak}` : '—',
          lowerIsBetter: true
        }
      ];
    }
    return [];
  }, [mode, leftArtist, rightArtist, leftAlbum, rightAlbum]);

  const scoreCount = useMemo(() => {
    let leftWins = 0;
    let rightWins = 0;
    metricRows.forEach(r => {
      if (r.leftDisplay === '—' && r.rightDisplay === '—') return;
      if (r.lowerIsBetter) {
        if (r.leftVal < r.rightVal) leftWins++;
        else if (r.rightVal < r.leftVal) rightWins++;
      } else {
        if (r.leftVal > r.rightVal) leftWins++;
        else if (r.rightVal > r.leftVal) rightWins++;
      }
    });
    return { leftWins, rightWins };
  }, [metricRows]);

  const pickerItems = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (mode === 'artists') {
      return artists
        .filter(a => !q || a.name.toLowerCase().includes(q) || (a.genre || '').toLowerCase().includes(q))
        .slice(0, 30);
    }
    return albums
      .filter(al => !q || al.title.toLowerCase().includes(q) || al.artistName.toLowerCase().includes(q))
      .slice(0, 30);
  }, [mode, artists, albums, pickerQuery]);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 pt-8 pb-28 space-y-6">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Аналитика</p>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Сравнение (Versus)</h1>
        </div>

        <div className="flex items-center p-1 bg-zinc-900/80 border border-white/10 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => handleModeSwitch('artists')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              mode === 'artists' ? 'theme-bg-accent text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Артисты</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('albums')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              mode === 'albums' ? 'theme-bg-accent text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Альбомы</span>
          </button>
        </div>
      </div>

      {/* Duel Selector Slots */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Left Slot */}
        <button
          type="button"
          onClick={() => { setPickerSide('left'); setPickerQuery(''); }}
          className="p-3.5 rounded-2xl bg-zinc-900/55 hover:bg-zinc-800/75 border border-white/10 hover-outline-card flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <CoverArt
              url={mode === 'artists' ? leftArtist?.entity.imageUrl : leftAlbum?.entity.coverUrl}
              title={mode === 'artists' ? leftArtist?.entity.name : leftAlbum?.entity.title}
              isArtist={mode === 'artists'}
              className={`w-12 h-12 ${mode === 'artists' ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-zinc-800 border border-white/10 shrink-0`}
              showZoomIcon={false}
            />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                {mode === 'artists' ? 'Исполнитель A' : 'Альбом A'}
              </span>
              <p className="text-sm font-bold text-white truncate">
                {mode === 'artists' ? (leftArtist?.entity.name || 'Выбрать...') : (leftAlbum?.entity.title || 'Выбрать...')}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {mode === 'artists'
                  ? (leftArtist?.entity.genre || 'Все жанры')
                  : (leftAlbum?.entity.artistName || '')}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Сменить</span>
        </button>

        {/* Center Swap Button */}
        <button
          type="button"
          onClick={swapSides}
          className="mx-auto w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/25 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          title="Поменять местами"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Right Slot */}
        <button
          type="button"
          onClick={() => { setPickerSide('right'); setPickerQuery(''); }}
          className="p-3.5 rounded-2xl bg-zinc-900/55 hover:bg-zinc-800/75 border border-white/10 hover-outline-card flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <CoverArt
              url={mode === 'artists' ? rightArtist?.entity.imageUrl : rightAlbum?.entity.coverUrl}
              title={mode === 'artists' ? rightArtist?.entity.name : rightAlbum?.entity.title}
              isArtist={mode === 'artists'}
              className={`w-12 h-12 ${mode === 'artists' ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-zinc-800 border border-white/10 shrink-0`}
              showZoomIcon={false}
            />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                {mode === 'artists' ? 'Исполнитель B' : 'Альбом B'}
              </span>
              <p className="text-sm font-bold text-white truncate">
                {mode === 'artists' ? (rightArtist?.entity.name || 'Выбрать...') : (rightAlbum?.entity.title || 'Выбрать...')}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {mode === 'artists'
                  ? (rightArtist?.entity.genre || 'Все жанры')
                  : (rightAlbum?.entity.artistName || '')}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Сменить</span>
        </button>
      </div>

      {/* Inline Picker Drawer when choosing Left or Right */}
      <AnimatePresence>
        {pickerSide && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder={mode === 'artists' ? 'Найти артиста...' : 'Найти альбом...'}
                  className="w-full bg-black/40 border border-white/10 focus:border-white/25 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setPickerSide(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {pickerItems.map((item: any) => {
                const isSelected = (pickerSide === 'left' ? leftId : rightId) === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (pickerSide === 'left') setLeftId(item.id);
                      else setRightId(item.id);
                      setPickerSide(null);
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white/12 border-white/30'
                        : 'bg-black/25 hover:bg-white/[0.06] border-white/[0.06]'
                    }`}
                  >
                    <CoverArt
                      url={mode === 'artists' ? item.imageUrl : item.coverUrl}
                      title={mode === 'artists' ? item.name : item.title}
                      isArtist={mode === 'artists'}
                      className={`w-8 h-8 ${mode === 'artists' ? 'rounded-full' : 'rounded-lg'} overflow-hidden bg-zinc-800 shrink-0`}
                      showZoomIcon={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{mode === 'artists' ? item.name : item.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {mode === 'artists' ? formatShortListeners(item.followers || 0) : item.artistName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Versus Comparison Board */}
      {metricRows.length > 0 ? (
        <div className="rounded-2xl bg-zinc-900/50 border border-white/[0.08] overflow-hidden">
          {/* Scoreboard Header */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4 bg-black/20">
            <div
              onClick={() => navigateTo(mode === 'artists' ? 'artist' : 'album', { id: leftId })}
              className="min-w-0 flex-1 cursor-pointer group"
            >
              <p className="text-sm md:text-base font-black text-white truncate hover-text-link">
                {mode === 'artists' ? leftArtist?.entity.name : leftAlbum?.entity.title}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {mode === 'artists'
                  ? `${leftArtist?.entity.country || leftArtist?.entity.genre || 'Исполнитель'}`
                  : `${leftAlbum?.entity.artistName} · ${leftAlbum?.entity.releaseYear}`}
              </p>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-center shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Счёт</span>
              <span className="text-sm md:text-base font-black tabular-nums text-white">
                <span className={scoreCount.leftWins > scoreCount.rightWins ? 'theme-accent' : ''}>{scoreCount.leftWins}</span>
                <span className="text-zinc-600 mx-1.5">:</span>
                <span className={scoreCount.rightWins > scoreCount.leftWins ? 'theme-accent' : ''}>{scoreCount.rightWins}</span>
              </span>
            </div>

            <div
              onClick={() => navigateTo(mode === 'artists' ? 'artist' : 'album', { id: rightId })}
              className="min-w-0 flex-1 text-right cursor-pointer group"
            >
              <p className="text-sm md:text-base font-black text-white truncate hover-text-link">
                {mode === 'artists' ? rightArtist?.entity.name : rightAlbum?.entity.title}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {mode === 'artists'
                  ? `${rightArtist?.entity.country || rightArtist?.entity.genre || 'Исполнитель'}`
                  : `${rightAlbum?.entity.artistName} · ${rightAlbum?.entity.releaseYear}`}
              </p>
            </div>
          </div>

          {/* Metric Comparison Rows */}
          <div className="divide-y divide-white/[0.05]">
            {metricRows.map((row) => {
              const hasBoth = row.leftDisplay !== '—' || row.rightDisplay !== '—';
              const leftLeads = hasBoth && (row.lowerIsBetter ? row.leftVal < row.rightVal : row.leftVal > row.rightVal);
              const rightLeads = hasBoth && (row.lowerIsBetter ? row.rightVal < row.leftVal : row.rightVal > row.leftVal);

              let leftPct = 50;
              let rightPct = 50;
              if (row.lowerIsBetter) {
                const lInv = row.leftVal < 999 ? 1 / Math.max(1, row.leftVal) : 0;
                const rInv = row.rightVal < 999 ? 1 / Math.max(1, row.rightVal) : 0;
                const tot = lInv + rInv;
                if (tot > 0) {
                  leftPct = Math.round((lInv / tot) * 100);
                  rightPct = 100 - leftPct;
                }
              } else {
                const tot = row.leftVal + row.rightVal;
                if (tot > 0) {
                  leftPct = Math.round((row.leftVal / tot) * 100);
                  rightPct = 100 - leftPct;
                }
              }

              return (
                <div key={row.label} className="px-5 py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-4 text-xs md:text-sm">
                    <span className={`font-bold tabular-nums ${leftLeads ? 'text-white' : 'text-zinc-400'}`}>
                      {row.leftDisplay}
                      {leftLeads && <span className="ml-1.5 text-[10px] theme-accent">●</span>}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400 text-center">
                      {row.label}
                    </span>
                    <span className={`font-bold tabular-nums text-right ${rightLeads ? 'text-white' : 'text-zinc-400'}`}>
                      {rightLeads && <span className="mr-1.5 text-[10px] theme-accent">●</span>}
                      {row.rightDisplay}
                    </span>
                  </div>

                  {/* Mirrored Slim Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full transition-all duration-500 rounded-l-full ${leftLeads ? 'theme-bg-accent' : 'bg-zinc-600'}`}
                      style={{ width: `${leftPct}%` }}
                    />
                    <div
                      className={`h-full transition-all duration-500 rounded-r-full ${rightLeads ? 'bg-sky-400' : 'bg-zinc-700'}`}
                      style={{ width: `${rightPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Track Spotlight Row */}
          {((mode === 'artists' && (leftArtist?.topTrack || rightArtist?.topTrack)) || (mode === 'albums' && (leftAlbum?.topTrack || rightAlbum?.topTrack))) && (
            <div className="px-5 py-4 border-t border-white/[0.06] bg-black/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Главный хит (A)', tr: mode === 'artists' ? leftArtist?.topTrack : leftAlbum?.topTrack },
                { label: 'Главный хит (B)', tr: mode === 'artists' ? rightArtist?.topTrack : rightAlbum?.topTrack }
              ].map((side, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 min-w-0">
                  {side.tr ? (
                    <>
                      <div
                        onClick={() => navigateTo('track', { id: side.tr!.id })}
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      >
                        <CoverArt
                          url={getTrackCover(side.tr, albums)}
                          title={side.tr.title}
                          className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0"
                          showZoomIcon={false}
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] text-zinc-500 font-semibold block">{side.label}</span>
                          <p className="text-xs font-bold text-white truncate hover-text-link">{side.tr.title}</p>
                          <p className="text-[11px] text-zinc-400 tabular-nums">{formatCompactRus(side.tr.plays || 0)} просл.</p>
                        </div>
                      </div>
                      {onPlayTrack && (
                        <button
                          type="button"
                          onClick={() => onPlayTrack(side.tr!)}
                          className="w-7 h-7 rounded-full bg-white/5 hover:theme-bg-accent text-zinc-300 hover:text-black flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Воспроизвести"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-zinc-500">Нет треков</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-10 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-sm text-zinc-400">
          Выберите двух участников для сравнения.
        </div>
      )}

      {/* Shared Collaborations Section (Artists mode) */}
      {mode === 'artists' && sharedTracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-white">
              Совместные треки ({sharedTracks.length})
            </h3>
          </div>
          <div className="rounded-2xl bg-zinc-900/45 border border-white/[0.07] divide-y divide-white/[0.05]">
            {sharedTracks.map(tr => (
              <div
                key={tr.id}
                onClick={() => navigateTo('track', { id: tr.id })}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CoverArt
                    url={getTrackCover(tr, albums)}
                    title={tr.title}
                    className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0"
                    showZoomIcon={false}
                  />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-white truncate hover-text-link">{tr.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {tr.artistName}{tr.featuredArtist ? ` feat. ${tr.featuredArtist}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-zinc-300 tabular-nums">
                    {formatCompactRus(tr.plays || 0)}
                  </span>
                  {onPlayTrack && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onPlayTrack(tr); }}
                      className="w-7 h-7 rounded-full bg-white/5 hover:theme-bg-accent text-zinc-300 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                      title="Воспроизвести"
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
  );
};

// ============================================================================
// 4. GLOBAL CTRL+K COMMAND PALETTE
// ============================================================================

interface PaletteEntry {
  id: string;
  group: 'Действия' | 'Артисты' | 'Треки' | 'Альбомы' | 'Разделы';
  title: string;
  subtitle: string;
  coverUrl?: string;
  isArtist?: boolean;
  icon?: React.ReactNode;
  onSelect: () => void;
  onPlay?: () => void;
}

export const CommandPaletteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: any) => void;
  onPlayTrack: (t: Track) => void;
  onOpenSettings: () => void;
}> = ({ isOpen, onClose, artists, albums, tracks, navigateTo, onPlayTrack, onOpenSettings }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: PaletteEntry[] = [];

    const quickActions: PaletteEntry[] = [
      {
        id: 'act_compare',
        group: 'Действия',
        title: 'Сравнить артистов или альбомы',
        subtitle: 'Режим дуэли (Versus)',
        icon: <ArrowLeftRight className="w-4 h-4 theme-accent" />,
        onSelect: () => { onClose(); navigateTo('compare', { mode: 'artists' }); }
      },
      {
        id: 'act_news',
        group: 'Действия',
        title: 'События индустрии',
        subtitle: 'Хроника релизов, пиков и рекордов',
        icon: <Newspaper className="w-4 h-4 theme-accent" />,
        onSelect: () => { onClose(); navigateTo('news'); }
      },
      {
        id: 'act_creator',
        group: 'Действия',
        title: 'Создать артиста, альбом или трек',
        subtitle: 'Открыть студию создания контента',
        icon: <Settings2 className="w-4 h-4 theme-accent" />,
        onSelect: () => { onClose(); navigateTo('creator'); }
      },
      {
        id: 'act_charts',
        group: 'Действия',
        title: 'Чарты и динамика позиций',
        subtitle: 'Тренды, пики и топ недели',
        icon: <TrendingUp className="w-4 h-4 theme-accent" />,
        onSelect: () => { onClose(); navigateTo('charts'); }
      },
      {
        id: 'act_random_play',
        group: 'Действия',
        title: 'Включить случайный трек',
        subtitle: 'Быстрый старт прослушивания',
        icon: <Shuffle className="w-4 h-4 theme-accent" />,
        onSelect: () => {
          if (tracks.length > 0) {
            const rnd = tracks[Math.floor(Math.random() * tracks.length)];
            onPlayTrack(rnd);
          }
          onClose();
        }
      },
      {
        id: 'act_theme',
        group: 'Действия',
        title: 'Настройки оформления',
        subtitle: 'Палитра, фон, шрифты и эффекты',
        icon: <Palette className="w-4 h-4 theme-accent" />,
        onSelect: () => { onClose(); onOpenSettings(); }
      }
    ];

    const navSections: PaletteEntry[] = [
      { id: 'nav_home', group: 'Разделы', title: 'Главная', subtitle: 'Подборка и обзоры', icon: <Sparkles className="w-4 h-4 text-zinc-400" />, onSelect: () => { onClose(); navigateTo('home'); } },
      { id: 'nav_rating', group: 'Разделы', title: 'Рейтинг и оценки (90 баллов)', subtitle: 'Лучшие релизы по оценкам', icon: <Award className="w-4 h-4 text-zinc-400" />, onSelect: () => { onClose(); navigateTo('rating', { tab: 'rating' }); } },
      { id: 'nav_awards', group: 'Разделы', title: 'Премии и номинации', subtitle: 'Итоги месяцев и лет', icon: <Trophy className="w-4 h-4 text-zinc-400" />, onSelect: () => { onClose(); navigateTo('rating', { tab: 'awards' }); } },
      { id: 'nav_val', group: 'Разделы', title: 'Ценность альбомов', subtitle: 'Рейтинг ценности и тиры в Премиях', icon: <Disc className="w-4 h-4 text-zinc-400" />, onSelect: () => { onClose(); navigateTo('rating', { tab: 'album_value' }); } },
      { id: 'nav_lib', group: 'Разделы', title: 'Медиатека', subtitle: 'Все сохранённые релизы', icon: <Music className="w-4 h-4 text-zinc-400" />, onSelect: () => { onClose(); navigateTo('library'); } },
      { id: 'nav_dates', group: 'Разделы', title: 'Календарь по датам', subtitle: 'Хронология по годам и месяцам', icon: <Calendar className="w-4 h-4 text-zinc-400" />, onSelect: () => { onClose(); navigateTo('search', { tab: 'dates' }); } }
    ];

    if (!q) {
      return [...quickActions, ...navSections.slice(0, 4)];
    }

    quickActions.forEach(a => {
      if (a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)) list.push(a);
    });
    navSections.forEach(n => {
      if (n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)) list.push(n);
    });

    artists
      .filter(a => a.name.toLowerCase().includes(q) || (a.genre || '').toLowerCase().includes(q))
      .slice(0, 6)
      .forEach(a => {
        list.push({
          id: `art_${a.id}`,
          group: 'Артисты',
          title: a.name,
          subtitle: `${formatShortListeners(a.followers || 0)}${a.genre ? ` · ${a.genre}` : ''}`,
          coverUrl: a.imageUrl,
          isArtist: true,
          onSelect: () => { onClose(); navigateTo('artist', { id: a.id }); }
        });
      });

    tracks
      .filter(t => t.title.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q) || (t.featuredArtist || '').toLowerCase().includes(q))
      .slice(0, 8)
      .forEach(t => {
        list.push({
          id: `trk_${t.id}`,
          group: 'Треки',
          title: t.title,
          subtitle: `${t.artistName}${t.featuredArtist ? ` feat. ${t.featuredArtist}` : ''} · ${formatCompactRus(t.plays || 0)}`,
          coverUrl: getTrackCover(t, albums),
          onSelect: () => { onClose(); navigateTo('track', { id: t.id }); },
          onPlay: () => { onPlayTrack(t); onClose(); }
        });
      });

    albums
      .filter(al => al.title.toLowerCase().includes(q) || al.artistName.toLowerCase().includes(q))
      .slice(0, 6)
      .forEach(al => {
        list.push({
          id: `alb_${al.id}`,
          group: 'Альбомы',
          title: al.title,
          subtitle: `${al.artistName} · ${al.releaseYear}`,
          coverUrl: al.coverUrl,
          onSelect: () => { onClose(); navigateTo('album', { id: al.id }); }
        });
      });

    return list;
  }, [query, artists, albums, tracks, navigateTo, onPlayTrack, onOpenSettings, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (entries.length > 0 ? (prev + 1) % entries.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (entries.length > 0 ? (prev - 1 + entries.length) % entries.length : 0));
    } else if (e.key === 'Enter' && entries[activeIndex]) {
      e.preventDefault();
      entries[activeIndex].onSelect();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-xl bg-zinc-900/95 border border-white/12 rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск артистов, треков, альбомов или команд..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto p-2 custom-scrollbar space-y-0.5">
          {entries.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              Ничего не найдено по запросу «{query}»
            </div>
          ) : (
            entries.map((entry, idx) => {
              const showGroupHeader = idx === 0 || entries[idx - 1].group !== entry.group;
              const isActive = idx === activeIndex;
              return (
                <React.Fragment key={entry.id}>
                  {showGroupHeader && (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {entry.group}
                    </div>
                  )}
                  <div
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={entry.onSelect}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                      isActive ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {entry.coverUrl !== undefined ? (
                        <CoverArt
                          url={entry.coverUrl}
                          title={entry.title}
                          isArtist={entry.isArtist}
                          className={`w-8 h-8 ${entry.isArtist ? 'rounded-full' : 'rounded-lg'} overflow-hidden bg-zinc-800 border border-white/10 shrink-0`}
                          showZoomIcon={false}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0">
                          {entry.icon}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-semibold text-white truncate">{entry.title}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{entry.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {entry.onPlay && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            entry.onPlay!();
                          }}
                          className="w-7 h-7 rounded-full bg-white/5 hover:theme-bg-accent text-zinc-300 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                          title="Воспроизвести"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? 'opacity-80 text-white' : 'opacity-25'}`} />
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Minimal Footer Hints */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/25 flex items-center justify-between text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ навигация</span>
            <span>Enter открыть</span>
          </div>
          <span>Ctrl+K / Cmd+K</span>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
