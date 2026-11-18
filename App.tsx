import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from '@google/genai';
import { 
  Home, 
  Search, 
  Library, 
  PlusCircle, 
  Heart, 
  Play, 
  Pause,
  SkipBack,
  SkipForward,
  MoreHorizontal, 
  Mic2, 
  Disc, 
  Music,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  CheckCircle2,
  ListMusic,
  Clock,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  Zap,
  Dices,
  Settings2,
  Download,
  FileUp,
  Plus,
  Package,
  Globe,
  TrendingUp,
  CircleCheck,
  ArrowRight,
  MessageSquare,
  Menu,
  X,
  Calendar,
  Palette,
  Type,
  Maximize,
  Maximize2,
  Layers,
  Wind,
  Database,
  Share2,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Sliders,
  ZoomIn,
  Edit3,
  Tag,
  Award,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  Flame,
  RotateCcw,
  Filter,
  Trophy,
  LayoutGrid,
  FileText,
  ArrowLeftRight,
  Newspaper,
  FastForward,
  Pencil
} from 'lucide-react';
import { Artist, Album, Track, ViewType, NavigationState, HomeViewProps, ArtistViewProps, RatingData, AlbumValueRating, AwardItem, AwardNominee, SimState, SimSaveSlot, SimFuturePolicy, SimModeType, SimAutopilotConfig, ReleasePromoStrategy } from './types';
import { AwardsView } from './AwardsView';
// --- Musaic v2.2 modules ---
import { AutoCover } from './covers/AutoCover';
import { RatingPanel, ScoreBadge } from './rating/RatingPanel';
import { ArtistHeroV2, ArtistEras, eraHas, CoArtistLinks, splitNames } from './profile/ArtistHero';
import { AlbumFromTracksButton } from './tools/StudioTools';
import { FONT_LIBRARY } from './fontsExtra';
import { setTitleGenCatalog } from './titleGen/TitleGenAuto';
import { CoverEditorModal } from './CoverEditorModal';
import { INITIAL_AWARDS, buildAwardsFromCatalog } from './awardsData';
import {
  ChartDynamics,
  computeChartDynamics,
  ChartTrendBadge,
  IndustryNewsSection,
  IndustryNewsView,
  CompareView,
  CommandPaletteModal
} from './StudioEnhancements';
import {
  SimControlBar,
  SimStartModal,
  SimConsoleModal,
  computeInitialSimSnapshot,
  generateWeekProposals,
  advanceSimulationStep,
  formatSimDate,
  ManualSimItem,
  RELEASE_PROMO_LABELS,
  getPromoStrategyConfig,
  getReleaseHypeMultiplier,
  ReleaseHypeControl
} from './SimulationMode';
import './fontsExtra';
// --- Musaic v2.4: charts, release stage, calendar, awards, eras, cover viewer, batch generators ---
import { SocialFeed, SocialIcon } from './SocialFeed';
import { ChartsPro, CoverPeek, ReleaseStage, ArtistAwardsButton, ReleaseCalendarPro, BatchSmartTools, computeArtistEras, setArtistAwardsSource, ScoreRing, AlbumReviewsButton, TrackReviewsButton, WeeklyNewsFeed, ArtistPortfolioButton } from './MusaicPlus';

// --- Types & Constants ---

interface ThemePreset {
  id: string;
  name: string;
  accentColor: string;
  bgColor: string;
  fontFamily: string;
  radiusFactor: number;
  desc?: string;
}

const THEME_PRESETS: ThemePreset[] = [
  { id: 'emerald', name: 'Изумрудный неон', accentColor: '#10b981', bgColor: '#09090b', fontFamily: "'Geist', 'Inter', sans-serif", radiusFactor: 1.3, desc: 'Глубокий оникс со свежим изумрудным блеском' },
  { id: 'ruby', name: 'Рубиновый нуар', accentColor: '#ef4444', bgColor: '#09090c', fontFamily: "'Montserrat', sans-serif", radiusFactor: 1.4, desc: 'Глубокий тёмный с рубиновым акцентом' },
  { id: 'sapphire', name: 'Сапфир элит', accentColor: '#3b82f6', bgColor: '#080c14', fontFamily: "'Space Grotesk', sans-serif", radiusFactor: 1.3, desc: 'Глубокий ультрамарин и сапфировый градиент' },
  { id: 'cyber', name: 'Кибер аметист', accentColor: '#a855f7', bgColor: '#0a0912', fontFamily: "'Outfit', sans-serif", radiusFactor: 1.3, desc: 'Фиолетовый неон и футуристичный вайб' },
  { id: 'mono', name: 'Глубокий оникс', accentColor: '#ffffff', bgColor: '#050505', fontFamily: "'Geist', 'Inter', sans-serif", radiusFactor: 1.2, desc: 'Чистый премиальный монохром' },
  { id: 'studio-green', name: 'Студийный зеленый', accentColor: '#1ed760', bgColor: '#121212', fontFamily: "'Plus Jakarta Sans', sans-serif", radiusFactor: 1.0, desc: 'Классический музыкальный зеленый' },
  { id: 'amber', name: 'Янтарный закат', accentColor: '#f59e0b', bgColor: '#1c1917', fontFamily: "'Manrope', sans-serif", radiusFactor: 1.5, desc: 'Тёплый янтарный на каменном фоне' },
  { id: 'rose', name: 'Розовый кварц', accentColor: '#f43f5e', bgColor: '#1c1317', fontFamily: "'Outfit', sans-serif", radiusFactor: 1.6, desc: 'Нежный розовый на графите' },
  { id: 'violet', name: 'Фиолетовый туман', accentColor: '#8b5cf6', bgColor: '#0f0a1a', fontFamily: "'Space Grotesk', sans-serif", radiusFactor: 1.4, desc: 'Мистический фиолетовый' },
  { id: 'cyan', name: 'Циановая волна', accentColor: '#06b6d4', bgColor: '#08171c', fontFamily: "'Geist', 'Inter', sans-serif", radiusFactor: 1.2, desc: 'Свежий циан на глубоком море' },
  { id: 'orange', name: 'Огненный закат', accentColor: '#f97316', bgColor: '#1c1008', fontFamily: "'Montserrat', sans-serif", radiusFactor: 1.3, desc: 'Энергичный оранжевый на угле' },
  { id: 'lime', name: 'Лаймовый пульс', accentColor: '#84cc16', bgColor: '#0f1408', fontFamily: "'Manrope', sans-serif", radiusFactor: 1.1, desc: 'Кислый лайм на тёмной траве' },
];

const AVAILABLE_FONTS_BASE = [
  { id: "'Geist', 'Inter', sans-serif", name: 'Geist (Современный)', desc: 'Премиальный системный шрифт от Vercel' },
  { id: "'Inter', sans-serif", name: 'Inter (Классический)', desc: 'Премиальный гротеск с высокой читаемостью' },
  { id: "'Space Grotesk', sans-serif", name: 'Space Grotesk (Техно)', desc: 'Геометрический гротеск для заголовков' },
  { id: "'Outfit', sans-serif", name: 'Outfit (Футуристичный)', desc: 'Модный округлый шрифт' },
  { id: "'Manrope', sans-serif", name: 'Manrope (Сбалансированный)', desc: 'Современный гротеск с открытыми формами' },
  { id: "'Plus Jakarta Sans', sans-serif", name: 'Plus Jakarta Sans', desc: 'Стиль музыкального стриминга' },
  { id: "'Montserrat', sans-serif", name: 'Montserrat (Выразительный)', desc: 'Плотный выразительный шрифт' },
  { id: "'JetBrains Mono', monospace", name: 'JetBrains Mono', desc: 'Технический моноширинный шрифт' },
  { id: "'Onest', 'Inter', sans-serif", name: 'Onest (Новый)', desc: 'Современный чистый гротеск с отличной кириллицей' },
  { id: "'Golos Text', 'Inter', sans-serif", name: 'Golos Text', desc: 'Мягкий и очень читаемый' },
  { id: "'Inter Tight', 'Inter', sans-serif", name: 'Inter Tight', desc: 'Плотный, как в Apple Music' },
  { id: "'Geologica', 'Inter', sans-serif", name: 'Geologica', desc: 'Адаптивный с характером' },
  { id: "'Jost', sans-serif", name: 'Jost', desc: 'Геометрический минимализм' },
];
const AVAILABLE_FONTS = [...AVAILABLE_FONTS_BASE, ...FONT_LIBRARY.filter(f => !AVAILABLE_FONTS_BASE.some(b => b.id === f.id))];

export interface ThemeConfig {
  designMode: 'nextGen' | 'classic'; // 'nextGen' = Modern Liquid Glass UI; 'classic' = Original Classic Musaic
  cardStyle: 'glass' | 'matte' | 'glow'; // Surface styling
  bgGradientPattern: 'aurora' | 'animated' | 'radial' | 'mesh' | 'subtle' | 'none'; // Background gradient pattern
  enableParallax: boolean; // Subtle parallax on cards
  enableAnimatedBg: boolean; // Animated gradient blobs
  enableQueuePanel: boolean; // Play Queue side panel
  enableCardHoverAnim: boolean; // Smooth lift and glow
  enableReducedMotion: boolean; // Respect OS reduced-motion preference
  bgColor: string;
  accentColor: string;
  cardBg: string;
  textScale: number;
  uiScale: number;
  radiusFactor: number;
  blurIntensity: number;
  fontFamily: string;
  fontMono: string; // Monospace font
  glowEnabled: boolean;
  letterSpacing: number;
  fontWeight: number;
  cardOpacity: number;
  sidebarWidth: number;
  playerHeight: number;
  headerBlur: number;
  animationSpeed: number;
  // Advanced visual controls
  saturation: number; // Global saturation
  contrast: number; // Global contrast
  borderIntensity: number; // Border opacity multiplier
  shadowDepth: number; // Shadow intensity
  // Page appearance (can be switched off in Settings -> Страницы)
  coverColorPages?: boolean; // page colors follow the cover (Apple Music style)
  artistHero?: boolean; // big artist header
  albumHero?: boolean; // big album header
  smoothTransitions?: boolean; // animated page transitions
  artistHeroStyle?: 'cinema' | 'poster'; // big artist header variant
  typographyMode?: 'classic' | 'modern' | 'editorial' | 'display'; // font pairs for the whole app
}

const DEFAULT_THEME: ThemeConfig = {
  designMode: 'classic',
  cardStyle: 'matte',
  bgGradientPattern: 'aurora',
  enableParallax: true,
  enableAnimatedBg: false,
  enableQueuePanel: true,
  enableCardHoverAnim: true,
  enableReducedMotion: true,
  bgColor: '#09090b',
  accentColor: '#10b981',
  cardBg: 'rgba(20, 20, 25, 0.65)',
  textScale: 1.0,
  uiScale: 1.0,
  radiusFactor: 1.3,
  blurIntensity: 24,
  fontFamily: "'Geist', 'Inter', sans-serif",
  fontMono: "'Geist Mono', 'JetBrains Mono', monospace",
  glowEnabled: true,
  letterSpacing: -0.025,
  fontWeight: 500,
  cardOpacity: 0.65,
  sidebarWidth: 260,
  playerHeight: 96,
  headerBlur: 24,
  animationSpeed: 0.3,
  // Advanced visual controls
  saturation: 1,
  contrast: 1,
  borderIntensity: 1,
  shadowDepth: 1,
  coverColorPages: true,
  artistHero: true,
  albumHero: true,
  smoothTransitions: true,
  artistHeroStyle: 'cinema',
  typographyMode: 'classic',
};

// --- Genre Catalog (Curated & Synchronized with Search & Creation) ---

export interface GenreItem {
  id: string;
  name: string;
  shortName: string;
  gradient: string;
  accentBg: string;
  coverImage: string;
}

export const GENRE_CATALOG: GenreItem[] = [
  { 
    id: 'rap', 
    name: 'Рэп и Хип-хоп', 
    shortName: 'Рэп',
    gradient: 'from-orange-600 via-amber-600 to-amber-900', 
    accentBg: 'bg-orange-600',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'hyperpop', 
    name: 'Хайперпоп', 
    shortName: 'Хайперпоп',
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-800', 
    accentBg: 'bg-fuchsia-600',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'grunge', 
    name: 'Гранж и Рок', 
    shortName: 'Гранж',
    gradient: 'from-red-700 via-neutral-900 to-zinc-950', 
    accentBg: 'bg-red-700',
    coverImage: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'pop', 
    name: 'Поп-музыка', 
    shortName: 'Поп',
    gradient: 'from-pink-600 via-rose-500 to-purple-800', 
    accentBg: 'bg-pink-600',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'electronic', 
    name: 'Электроника', 
    shortName: 'Электроника',
    gradient: 'from-cyan-600 via-blue-600 to-indigo-900', 
    accentBg: 'bg-cyan-600',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'indie', 
    name: 'Инди и Lo-Fi', 
    shortName: 'Инди',
    gradient: 'from-emerald-600 via-teal-700 to-slate-900', 
    accentBg: 'bg-emerald-600',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'rnb', 
    name: 'R&B и Соул', 
    shortName: 'R&B',
    gradient: 'from-purple-700 via-violet-800 to-indigo-950', 
    accentBg: 'bg-purple-700',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'phonk', 
    name: 'Фонк и Дрифт', 
    shortName: 'Фонк',
    gradient: 'from-violet-900 via-purple-950 to-black', 
    accentBg: 'bg-violet-900',
    coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'dance', 
    name: 'Танцевальная', 
    shortName: 'Клубная',
    gradient: 'from-yellow-500 via-amber-600 to-orange-800', 
    accentBg: 'bg-yellow-500',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'atmospheric', 
    name: 'Атмосферная', 
    shortName: 'Lo-Fi Chill',
    gradient: 'from-slate-700 via-zinc-800 to-black', 
    accentBg: 'bg-slate-700',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80' 
  }
];

// --- Helpers ---

// Smart random plays generator scaled by artist popularity (monthly listeners/followers)
const getRandomPlays = (artistFollowers?: number, isAlbum = false): string => {
  const viralChance = Math.random() < 0.04; 
  // Base multiplier: albums naturally have more cumulative plays
  const baseMultiplier = isAlbum ? 2.8 : 1.2;
  const viralMultiplier = viralChance ? 4.5 : 1;
  
  if (artistFollowers && artistFollowers > 0) {
    // Realistic scaling: relative to followers with stepped bonuses
    let popularityScale = 1.15; // Boosted base for small artists
    if (artistFollowers > 1000000) popularityScale = 1.35; // Boosted for mid-low
    if (artistFollowers > 3000000) popularityScale = 1.45; // Gradual transition
    if (artistFollowers > 5000000) popularityScale = 1.6;
    if (artistFollowers > 15000000) popularityScale = 2.1;

    // Range variance: 0.6 to 1.9 (slightly higher floor for success)
    const randomFactor = 0.6 + Math.random() * 1.3;
    
    // Result = followers * percentage * popularity_bonus * randomness * viral_chance
    let raw = Math.round(artistFollowers * baseMultiplier * popularityScale * randomFactor * viralMultiplier);
    
    // Final variance jitter
    const variance = 0.9 + Math.random() * 0.2;
    raw = Math.round(raw * variance);

    // Slightly higher floor for any artist activity (no one gets 0)
    const min = isAlbum ? 180000 : 75000;
    if (raw < min) raw = min + Math.floor(Math.random() * min);
    
    // Rounding for realism
    if (raw > 1000000) raw = Math.round(raw / 10000) * 10000;
    else if (raw > 100000) raw = Math.round(raw / 1000) * 1000;
    
    return raw.toLocaleString('ru-RU');
  }
  
  // No followers context: fallback to generic reasonable ranges
  const min = isAlbum ? 4500000 : 1200000;
  const max = isAlbum ? 45000000 : 12000000;
  const plays = (Math.floor(Math.random() * (max - min + 1)) + min) * (viralChance ? 3 : 1);
  return Math.round(plays).toLocaleString('ru-RU');
};

// Flexible date parser accepting DD.MM.YYYY, DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD
const parseFlexibleDate = (input?: string): string => {
  if (!input || !input.trim()) {
    return new Date().toISOString().split('T')[0];
  }
  const trimmed = input.trim();
  // Match DD.MM.YYYY, DD-MM-YYYY, or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Match YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
};

// Smart Duration Auto-formatter: space key inserts colon, or continuous digits auto-format (e.g. 221 -> 2:21, 320 -> 3:20, 3 -> 3:)
export const formatDurationInput = (val: string): string => {
  let clean = val.replace(/[^\d:]/g, '');
  const digits = clean.replace(/:/g, '');
  if (digits.length === 0) return '';
  if (digits.length === 1) {
    return `${digits}:`;
  } else if (digits.length === 2) {
    return `${digits[0]}:${digits[1]}`;
  } else if (digits.length === 3) {
    return `${digits[0]}:${digits.slice(1)}`;
  } else if (digits.length >= 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
  return clean;
};

export const handleDurationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentVal: string, onChange: (v: string) => void) => {
  if (e.key === ' ') {
    e.preventDefault();
    if (!currentVal.includes(':')) {
      onChange(currentVal + ':');
    }
  }
};

// Smart Date Auto-formatter: inserts dots after 2 digits of day and 2 digits of month (e.g. 24102026 -> 24.10.2026)
export const formatDateInput = (val: string): string => {
  let clean = val.replace(/[^\d\.]/g, '');
  const digits = clean.replace(/\./g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
  }
};

export const formatDateDisplay = (dateStr?: string): string => {
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

// 90-Point Author Rating Formula Multipliers
export const VIBE_MULTIPLIERS: Record<number, number> = {
  1: 1.00,
  2: 1.0675,
  3: 1.1349,
  4: 1.2024,
  5: 1.2699,
  6: 1.3373,
  7: 1.4048,
  8: 1.4723,
  9: 1.5397,
  10: 1.6072,
};

export const calculateRatingScore = (
  rhymes: number = 0,
  structure: number = 0,
  style: number = 0,
  charisma: number = 0,
  vibe: number = 0
): number => {
  if (!rhymes && !structure && !style && !charisma && !vibe) return 0;
  const baseSum = (rhymes || 0) + (structure || 0) + (style || 0) + (charisma || 0);
  const basePoints = baseSum * 1.4; // Max 56
  const vibeMultiplier = VIBE_MULTIPLIERS[Math.max(1, Math.min(10, vibe || 1))] || 1.0;
  return Math.min(90, Math.round(basePoints * vibeMultiplier));
};

// Optimized Artist Average Rating using pre-aggregated maps for O(1) performance
export const getArtistAverageRating = (artistId: string, artistName: string, tracks: Track[], albums: Album[]): number | null => {
  // This version is kept for legacy compatibility but the app should prefer pre-calculated scores
  const ratedTracks = tracks.filter(t => 
    (t.artistId === artistId || t.artistName?.toLowerCase() === artistName.toLowerCase()) && 
    t.rating && t.rating.totalScore > 0
  );
  const ratedAlbums = albums.filter(a => 
    (a.artistId === artistId || a.artistName?.toLowerCase() === artistName.toLowerCase()) && 
    a.rating && a.rating.totalScore > 0
  );

  const scores = [
    ...ratedTracks.map(t => t.rating!.totalScore),
    ...ratedAlbums.map(a => a.rating!.totalScore)
  ];

  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
};

// New helper to pre-aggregate all artist scores in a single pass O(N)
export const aggregateArtistScores = (tracks: Track[], albums: Album[]) => {
  const scoresMap = new Map<string, { sum: number; count: number }>();
  
  const addScore = (id?: string, name?: string, score?: number) => {
    if (!score) return;
    const key = (id && id !== 'undefined') ? id : (name?.toLowerCase().trim() || '');
    if (!key) return;
    const entry = scoresMap.get(key) || { sum: 0, count: 0 };
    entry.sum += score;
    entry.count += 1;
    scoresMap.set(key, entry);
  };

  tracks.forEach(t => t.rating?.totalScore && addScore(t.artistId, t.artistName, t.rating.totalScore));
  albums.forEach(a => a.rating?.totalScore && addScore(a.artistId, a.artistName, a.rating.totalScore));

  return scoresMap;
};



// Accurate daily streaming velocity based on real calendar days since release
const getDailyVelocity = (track: Track): number => {
  const now = new Date().getTime();
  if (!track.releaseDate) {
    return Math.max(1, Math.round(track.plays / 28));
  }
  
  const relTime = new Date(track.releaseDate).getTime();
  if (isNaN(relTime)) {
    return Math.max(1, Math.round(track.plays / 28));
  }
  
  // Calculate calendar days
  const diffDays = Math.round((now - relTime) / 86400000);
  
  if (diffDays <= 0) {
    // Released today: streams are today's volume
    return track.plays;
  }
  
  return Math.max(1, Math.round(track.plays / diffDays));
};

const getRandomValue = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomDuration = () => {
  const totalSec = Math.floor(Math.random() * (255 - 75 + 1)) + 75; // 1:15 to 4:15
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
};

const calcTotalDuration = (tracksList: Track[]) => {
  let totalSeconds = 0;
  tracksList.forEach(t => {
    if (!t.duration) return;
    const parts = t.duration.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      totalSeconds += (parts[0] * 60) + parts[1];
    }
  });
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins} мин. ${secs.toString().padStart(2, '0')} сек.`;
};

export const formatNumber = (num: number) => {
  if (isNaN(num)) return '0';
  return num.toLocaleString('ru-RU');
};

const formatListeners = (num: number) => {
  if (isNaN(num) || !num) return '0 слушателей за месяц';
  if (num >= 1000000) {
    const millions = (num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
    return `${millions} млн слушателей за месяц`;
  }
  return `${num.toLocaleString('ru-RU')} слушателей за месяц`;
};

export const parseReleaseTs = (dateStr?: string, fallbackYear?: number | string): { ts: number; year: number } => {
  let ts = 0;
  if (dateStr) {
    const clean = dateStr.trim();
    const parts = clean.split(/[-.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        ts = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`).getTime();
      } else if (parts[2].length === 4) {
        ts = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      }
    }
    if (!ts || isNaN(ts)) {
      const parsed = new Date(clean).getTime();
      if (!isNaN(parsed)) ts = parsed;
    }
  }
  const yr = fallbackYear ? Number(fallbackYear) : (ts > 0 ? new Date(ts).getFullYear() : 2025);
  if (!ts || isNaN(ts)) {
    ts = new Date(`${yr || 2025}-01-01`).getTime();
  }
  return { ts, year: yr || 2025 };
};

export const parseFormattedNumber = (str: string) => {
  if (typeof str !== 'string') return 0;
  return parseInt(str.replace(/[\s\.\u00A0]/g, '')) || 0;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- IndexedDB Storage Subsystem (Decoupled Metadata & High-Performance Media Store) ---
const DB_NAME = 'MusaicDatabase';
const DB_VERSION = 2;
const STORE_NAME = 'masterStore';
const MEDIA_STORE_NAME = 'mediaStore';

export interface MediaItem {
  id: string; // e.g. "media_alb_abc123"
  dataUrl: string; // base64 / data:image/...
  albumId?: string;
  artistId?: string;
  trackId?: string;
  type?: 'album' | 'artist' | 'track';
  slug?: string; // normalized slug for smart fuzzy matching
  title?: string;
  artistName?: string;
  timestamp: number;
}

// In-Memory Synchronous Caches for Instantaneous Zero-Lag Rendering
export const mediaCache = new Map<string, string>();
export const albumMediaMap = new Map<string, string>();
export const artistMediaMap = new Map<string, string>();
export const artistSlugMediaMap = new Map<string, string>();
export const albumSlugMediaMap = new Map<string, string>();
export const slugMediaMap = new Map<string, string>();

const mediaListeners = new Set<() => void>();
export const notifyMediaUpdated = () => {
  mediaListeners.forEach(fn => {
    try { fn(); } catch (e) { console.error(e); }
  });
};

export const useMediaVersion = () => {
  const [, setV] = useState(0);
  useEffect(() => {
    const cb = () => setV(v => v + 1);
    mediaListeners.add(cb);
    return () => { mediaListeners.delete(cb); };
  }, []);
};

export const normalizeMediaSlug = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .replace(/[\«\»\"\'\`\.\,\!\?\:\;\(\)\[\]\{\}\-\_\/\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getEntitySlug = (artistName?: string, title?: string): string => {
  const a = normalizeMediaSlug(artistName || '');
  const t = normalizeMediaSlug(title || '');
  return `${a}___${t}`;
};

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        const mediaStore = db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'id' });
        mediaStore.createIndex('albumId', 'albumId', { unique: false });
        mediaStore.createIndex('artistId', 'artistId', { unique: false });
        mediaStore.createIndex('slug', 'slug', { unique: false });
      }
    };
  });
};

export const dbGet = async (key: string): Promise<any> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (e) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
};

export const dbSet = async (key: string, val: any): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(val, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      console.error('Storage quota exceeded', err);
    }
  }
};

export const dbPutMedia = async (item: MediaItem): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE_NAME);
      const request = store.put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Error saving media to IndexedDB:', e);
  }
};

export const dbPutMediaBatch = async (items: MediaItem[]): Promise<void> => {
  if (!items || items.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(MEDIA_STORE_NAME);
      for (const item of items) {
        store.put(item);
      }
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  } catch (e) {
    console.error('Error batch-saving media to IndexedDB:', e);
  }
};

export const dbGetAllMedia = async (): Promise<MediaItem[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MEDIA_STORE_NAME, 'readonly');
      const store = transaction.objectStore(MEDIA_STORE_NAME);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (e) {
    console.error('Error loading media from IndexedDB:', e);
    return [];
  }
};

export const dbCountMedia = async (): Promise<number> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MEDIA_STORE_NAME, 'readonly');
      const store = transaction.objectStore(MEDIA_STORE_NAME);
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || 0);
    });
  } catch (e) {
    return mediaCache.size;
  }
};

// Preload memory cache from mediaStore
export const loadMediaCache = async (): Promise<number> => {
  try {
    const all = await dbGetAllMedia();
    all.forEach(item => {
      if (item && item.id && item.dataUrl) {
        mediaCache.set(item.id, item.dataUrl);
        if (item.type === 'artist' || item.artistId) {
          if (item.artistId) artistMediaMap.set(String(item.artistId), item.id);
          if (item.slug) artistSlugMediaMap.set(item.slug, item.id);
        }
        if (item.type === 'album' || item.albumId) {
          if (item.albumId) albumMediaMap.set(String(item.albumId), item.id);
          if (item.slug) albumSlugMediaMap.set(item.slug, item.id);
        }
        if (item.slug) slugMediaMap.set(item.slug, item.id);
      }
    });
    notifyMediaUpdated();
    return all.length;
  } catch (e) {
    console.error('Failed to preload mediaCache:', e);
    return 0;
  }
};

// Synchronously resolve any image URL or idb: reference with smart slug/map fallback
export const resolveMedia = (
  url?: string,
  meta?: { title?: string; albumTitle?: string; isArtist?: boolean; artistName?: string; id?: string }
): string => {
  if (url) {
    if (url.startsWith('idb:')) {
      const id = url.slice(4);
      const cached = mediaCache.get(id);
      if (cached) return cached;
    } else if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
      return url;
    }
  }

  // Fallback 1: lookup by id in albumMediaMap / artistMediaMap
  if (meta?.id) {
    const byId = meta.isArtist ? artistMediaMap.get(String(meta.id)) : albumMediaMap.get(String(meta.id));
    if (byId && mediaCache.has(byId)) return mediaCache.get(byId)!;
  }

  // Fallback 2: lookup by slug in artistSlugMediaMap or albumSlugMediaMap
  if (meta?.title || meta?.albumTitle) {
    if (meta.isArtist) {
      const slug = normalizeMediaSlug(meta.title || '');
      const mediaId = artistSlugMediaMap.get(slug) || artistMediaMap.get(meta.title || '');
      if (mediaId && mediaCache.has(mediaId)) return mediaCache.get(mediaId)!;
    } else {
      if (meta.artistName && meta.title) {
        const slug = getEntitySlug(meta.artistName, meta.title);
        const mediaId = albumSlugMediaMap.get(slug) || slugMediaMap.get(slug);
        if (mediaId && mediaCache.has(mediaId)) return mediaCache.get(mediaId)!;
      }
      if (meta.albumTitle) {
        const slug = meta.artistName ? getEntitySlug(meta.artistName, meta.albumTitle) : normalizeMediaSlug(meta.albumTitle);
        const mediaId = albumSlugMediaMap.get(slug) || slugMediaMap.get(slug);
        if (mediaId && mediaCache.has(mediaId)) return mediaCache.get(mediaId)!;
      }
      const titleSlug = normalizeMediaSlug(meta.title || '');
      const mediaId = albumSlugMediaMap.get(titleSlug) || slugMediaMap.get(titleSlug);
      if (mediaId && mediaCache.has(mediaId)) return mediaCache.get(mediaId)!;
    }
  }

  return '';
};

// Save a new media item and register it in cache + IndexedDB
export const saveMediaItem = async (
  dataUrl: string,
  meta: {
    id?: string;
    albumId?: string;
    artistId?: string;
    trackId?: string;
    type?: 'album' | 'artist' | 'track';
    title?: string;
    artistName?: string;
  }
): Promise<string> => {
  if (!dataUrl) return '';
  if (dataUrl.startsWith('idb:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }
  const id = meta.id || `media_${meta.type || 'item'}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  const slug = meta.type === 'album'
    ? getEntitySlug(meta.artistName, meta.title)
    : normalizeMediaSlug(meta.artistName || meta.title || '');

  const item: MediaItem = {
    id,
    dataUrl,
    albumId: meta.albumId,
    artistId: meta.artistId,
    trackId: meta.trackId,
    type: meta.type,
    title: meta.title,
    artistName: meta.artistName,
    slug,
    timestamp: Date.now()
  };

  mediaCache.set(id, dataUrl);
  if (meta.type === 'artist' || meta.artistId) {
    if (meta.artistId) artistMediaMap.set(String(meta.artistId), id);
    if (slug) artistSlugMediaMap.set(slug, id);
  } else if (meta.type === 'album' || meta.albumId) {
    if (meta.albumId) albumMediaMap.set(String(meta.albumId), id);
    if (slug) albumSlugMediaMap.set(slug, id);
  }
  if (slug) slugMediaMap.set(slug, id);

  await dbPutMedia(item);
  notifyMediaUpdated();

  return `idb:${id}`;
};

// Auto-extract base64 images from legacy 200MB catalogs into mediaStore
export const extractLegacyBase64Media = async (
  rawArtists: Artist[],
  rawAlbums: Album[],
  rawTracks: Track[]
): Promise<{
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  extractedCount: number;
}> => {
  const mediaToSave: MediaItem[] = [];
  let extractedCount = 0;

  // Process artists
  const cleanedArtists = (rawArtists || []).map(a => {
    if (a.imageUrl && a.imageUrl.startsWith('data:image/')) {
      const mediaId = `media_art_${a.id}`;
      const slug = normalizeMediaSlug(a.name);
      const item: MediaItem = {
        id: mediaId,
        dataUrl: a.imageUrl,
        artistId: a.id,
        artistName: a.name,
        type: 'artist',
        slug,
        timestamp: Date.now()
      };
      mediaToSave.push(item);
      mediaCache.set(mediaId, a.imageUrl);
      artistMediaMap.set(String(a.id), mediaId);
      if (slug) artistSlugMediaMap.set(slug, mediaId);
      extractedCount++;
      return { ...a, imageUrl: `idb:${mediaId}` };
    }
    return a;
  });

  // Process albums
  const cleanedAlbums = (rawAlbums || []).map(alb => {
    if (alb.coverUrl && alb.coverUrl.startsWith('data:image/')) {
      const mediaId = `media_alb_${alb.id}`;
      const slug = getEntitySlug(alb.artistName, alb.title);
      const item: MediaItem = {
        id: mediaId,
        dataUrl: alb.coverUrl,
        albumId: alb.id,
        artistId: alb.artistId,
        artistName: alb.artistName,
        title: alb.title,
        type: 'album',
        slug,
        timestamp: Date.now()
      };
      mediaToSave.push(item);
      mediaCache.set(mediaId, alb.coverUrl);
      albumMediaMap.set(String(alb.id), mediaId);
      if (slug) albumSlugMediaMap.set(slug, mediaId);
      extractedCount++;
      return { ...alb, coverUrl: `idb:${mediaId}` };
    }
    return alb;
  });

  // Process tracks (syncing with album cover if possible)
  const albumCoverLookup = new Map<string, string>();
  cleanedAlbums.forEach(al => {
    if (al.coverUrl) albumCoverLookup.set(String(al.id), al.coverUrl);
  });

  const cleanedTracks = (rawTracks || []).map(t => {
    const parentCover = t.albumId ? albumCoverLookup.get(String(t.albumId)) : null;
    if (parentCover) {
      return { ...t, coverUrl: parentCover };
    }
    if (t.coverUrl && t.coverUrl.startsWith('data:image/')) {
      const mediaId = `media_trk_${t.id}`;
      const item: MediaItem = {
        id: mediaId,
        dataUrl: t.coverUrl,
        trackId: t.id,
        artistId: t.artistId,
        albumId: t.albumId,
        title: t.title,
        artistName: t.artistName,
        type: 'track',
        slug: getEntitySlug(t.artistName, t.title),
        timestamp: Date.now()
      };
      mediaToSave.push(item);
      mediaCache.set(mediaId, t.coverUrl);
      extractedCount++;
      return { ...t, coverUrl: `idb:${mediaId}` };
    }
    return t;
  });

  if (mediaToSave.length > 0) {
    await dbPutMediaBatch(mediaToSave);
    notifyMediaUpdated();
  }

  return { artists: cleanedArtists, albums: cleanedAlbums, tracks: cleanedTracks, extractedCount };
};

// Relink lightweight catalog metadata with local media in IndexedDB
export const relinkCatalogMedia = (
  artists: Artist[],
  albums: Album[],
  tracks: Track[]
): { artists: Artist[]; albums: Album[]; tracks: Track[]; relinkedCount: number } => {
  let relinkedCount = 0;

  const linkedAlbums = (albums || []).map(alb => {
    if (alb.coverUrl && alb.coverUrl.startsWith('idb:') && mediaCache.has(alb.coverUrl.slice(4))) {
      return alb;
    }
    const byId = albumMediaMap.get(String(alb.id));
    if (byId && mediaCache.has(byId)) {
      relinkedCount++;
      return { ...alb, coverUrl: `idb:${byId}` };
    }
    const slug = getEntitySlug(alb.artistName, alb.title);
    const bySlug = albumSlugMediaMap.get(slug) || slugMediaMap.get(slug);
    if (bySlug && mediaCache.has(bySlug)) {
      relinkedCount++;
      return { ...alb, coverUrl: `idb:${bySlug}` };
    }
    return alb;
  });

  const linkedArtists = (artists || []).map(art => {
    if (art.imageUrl && art.imageUrl.startsWith('idb:') && mediaCache.has(art.imageUrl.slice(4))) {
      return art;
    }
    const byId = artistMediaMap.get(String(art.id));
    if (byId && mediaCache.has(byId)) {
      relinkedCount++;
      return { ...art, imageUrl: `idb:${byId}` };
    }
    const slug = normalizeMediaSlug(art.name);
    const bySlug = artistSlugMediaMap.get(slug);
    if (bySlug && mediaCache.has(bySlug)) {
      relinkedCount++;
      return { ...art, imageUrl: `idb:${bySlug}` };
    }
    return art;
  });

  const linkedTracks = syncTracksWithAlbumCovers(tracks || [], linkedAlbums);

  return { artists: linkedArtists, albums: linkedAlbums, tracks: linkedTracks, relinkedCount };
};

const sortTracksByRelevance = (tracks: Track[]) => {
  return [...tracks].sort((a, b) => {
    const dateA = new Date(a.releaseDate).getTime();
    const dateB = new Date(b.releaseDate).getTime();
    return b.plays - a.plays;
  });
};

// --- Parent Album Resolution & Automatic Cover Inheritance ---

export const getAlbumCoverUrl = (album?: Album | null): string => {
  if (!album) return '';
  return album.coverUrl || (album as any).cover || (album as any).imageUrl || (album as any).image || (album as any).albumImg || (album as any).artwork || '';
};

// Optimized Parent Album Resolution with WeakMap O(1) index cache for large databases
const albumLookupIndexCache = new WeakMap<Album[], { byId: Map<string, Album>; byTitle: Map<string, Album> }>();

const getAlbumLookupIndex = (albumList: Album[]) => {
  let cached = albumLookupIndexCache.get(albumList);
  if (cached) return cached;
  const byId = new Map<string, Album>();
  const byTitle = new Map<string, Album>();
  for (let i = 0; i < albumList.length; i++) {
    const a = albumList[i];
    if (a.id) {
      const idKey = String(a.id).trim();
      if (idKey && !byId.has(idKey)) byId.set(idKey, a);
    }
    if (a.title) {
      const titleKey = a.title.replace(/[\«\»\"\'\`]/g, '').trim().toLowerCase();
      if (titleKey && !byTitle.has(titleKey)) byTitle.set(titleKey, a);
    }
  }
  cached = { byId, byTitle };
  albumLookupIndexCache.set(albumList, cached);
  return cached;
};

export const findParentAlbumForTrack = (track?: Track | null, albumList?: Album[]): Album | undefined => {
  if (!track || !albumList || albumList.length === 0) return undefined;
  const { byId, byTitle } = getAlbumLookupIndex(albumList);

  const trackAlbId = String(track.albumId || '').trim();
  if (trackAlbId && trackAlbId !== 'single' && trackAlbId !== 'сингл' && trackAlbId !== 'undefined') {
    const foundById = byId.get(trackAlbId);
    if (foundById) return foundById;
  }

  const rawAlbumTitle = track.albumTitle?.replace(/[\«\»\"\'\`]/g, '').trim().toLowerCase();
  if (rawAlbumTitle && rawAlbumTitle !== 'single' && rawAlbumTitle !== 'сингл' && rawAlbumTitle !== 'undefined') {
    const foundByExactTitle = byTitle.get(rawAlbumTitle);
    if (foundByExactTitle) return foundByExactTitle;
  }

  return undefined;
};

// Automatic Album Cover Inheritance: if track belongs to an album, always resolve to the album's artwork
export const getTrackCover = (track?: Track | null, albums?: Album[]): string | undefined => {
  if (!track) return undefined;
  if (albums && albums.length > 0) {
    const parentAlb = findParentAlbumForTrack(track, albums);
    const parentCover = getAlbumCoverUrl(parentAlb);
    if (parentCover) return parentCover;
  }
  return track.coverUrl;
};

// Synchronizes all existing tracks with their parent albums in O(N + M) time
export const syncTracksWithAlbumCovers = (trackList: Track[], albumList: Album[]): Track[] => {
  if (!trackList || !albumList || albumList.length === 0) return trackList || [];
  const idMap = new Map<string, Album>();
  const titleMap = new Map<string, Album>();
  for (let i = 0; i < albumList.length; i++) {
    const a = albumList[i];
    if (a.id) idMap.set(String(a.id).trim(), a);
    if (a.title) {
      const cleanTitle = a.title.replace(/[\«\»\"\'\`]/g, '').trim().toLowerCase();
      if (cleanTitle && !titleMap.has(cleanTitle)) titleMap.set(cleanTitle, a);
    }
  }
  return trackList.map(t => {
    const albId = String(t.albumId || '').trim();
    let parentAlb: Album | undefined;
    if (albId && albId !== 'single' && albId !== 'сингл' && albId !== 'undefined') {
      parentAlb = idMap.get(albId);
    }
    if (!parentAlb && t.albumTitle) {
      const cleanT = t.albumTitle.replace(/[\«\»\"\'\`]/g, '').trim().toLowerCase();
      if (cleanT && cleanT !== 'single' && cleanT !== 'сингл' && cleanT !== 'undefined') {
        parentAlb = titleMap.get(cleanT);
      }
    }
    const parentCover = getAlbumCoverUrl(parentAlb);
    if (parentAlb && parentCover && (t.coverUrl !== parentCover || t.albumId !== parentAlb.id)) {
      return {
        ...t,
        albumId: parentAlb.id,
        albumTitle: parentAlb.title,
        coverUrl: parentCover
      };
    }
    return t;
  });
};

// --- Formatting & Multi-Artist Link Helpers ---

export const formatShortListeners = (num: number) => {
  if (isNaN(num) || !num) return '0 / мес';
  if (num >= 1000000) {
    const m = (num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
    return `${m}M / мес`;
  }
  if (num >= 1000) {
    const k = (num / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
    return `${k}k / мес`;
  }
  return `${num} / мес`;
};

export const pluralizeTracks = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'треков';
  if (mod10 === 1) return 'трек';
  if (mod10 >= 2 && mod10 <= 4) return 'трека';
  return 'треков';
};

// Hook for incremental loading of large lists without flooding frames
export function useVisibleCount(initialCount: number = 15, step: number = 15, total: number, enabled: boolean = true) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    if (!enabled) return;
    if (visibleCount < total) {
      const batch = Math.max(step, 30);
      const timeout = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + batch, total));
      }, 90);
      return () => clearTimeout(timeout);
    }
  }, [visibleCount, total, step, enabled]);

  return visibleCount;
}

// Helper to parse featured artists cleanly, splitting by all common delimiters and excluding the main artist
export const parseFeaturedNames = (raw?: string, excludeName?: string): string[] => {
  if (!raw || !raw.trim()) return [];
  const excl = excludeName ? excludeName.trim().toLowerCase() : '';
  const seen = new Set<string>();
  const result: string[] = [];
  raw
    .split(/[,&/;]|\bfeat\.?|\bft\.?/i)
    .map(s => s.replace(/^[()[\]\s]+|[()[\]\s]+$/g, '').trim())
    .filter(Boolean)
    .forEach(name => {
      const lower = name.toLowerCase();
      if (lower && lower !== excl && !seen.has(lower)) {
        seen.add(lower);
        result.push(name);
      }
    });
  return result;
};

// Component that splits multiple featured artists and links each to their individual profile
export const FeaturedArtistsLinks: React.FC<{
  featuredArtist?: string;
  excludeArtistName?: string;
  artists?: Artist[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string }) => void;
  className?: string;
}> = ({ featuredArtist, excludeArtistName, artists = [], navigateTo, className = "text-zinc-400" }) => {
  const names = parseFeaturedNames(featuredArtist, excludeArtistName);
  if (names.length === 0) return null;

  return (
    <span className={className}>
      <span className="text-zinc-500 font-medium mr-1">feat.</span>
      {names.map((featName, idx) => {
        const found = artists.find(a => a.name.trim().toLowerCase() === featName.toLowerCase());
        const targetId = found ? found.id : `guest_${featName}`;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-zinc-500 font-normal">, </span>}
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('artist', { id: targetId, artistName: featName });
              }}
              className="hover-text-link text-zinc-300 cursor-pointer font-semibold"
              title={`Перейти к профилю ${featName}`}
            >
              {featName}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
};

// Minimalist Procedural Art Generator
// Minimalist Procedural Art Generator - Optimized for all sizes using Container Queries


// --- Beautiful Cover Art Component with Zoom Support ---

export const CoverArt: React.FC<{ 
  url?: string; 
  title?: string; 
  albumTitle?: string;
  className?: string; 
  innerClassName?: string;
  onPlay?: () => void;
  onZoom?: () => void;
  showZoomIcon?: boolean;
  isArtist?: boolean;
  children?: React.ReactNode;
}> = React.memo(({ url, title, albumTitle, className = "", innerClassName = "", onPlay, onZoom, showZoomIcon = false, isArtist = false, children }) => {
  const [imgError, setImgError] = useState(false);
  useMediaVersion();

  const resolvedUrl = resolveMedia(url, { title, albumTitle, isArtist });
  const showPlaceholder = !resolvedUrl || imgError || resolvedUrl.includes('picsum.photos/seed');

  return (
    <div 
      onClick={(e) => {
        if (onZoom) {
          e.stopPropagation();
          onZoom();
        }
      }}
      className={`relative overflow-hidden group ${className} ${onZoom ? 'cursor-pointer' : ''}`}
    >
      {showPlaceholder ? (
        <PlaceholderArt 
          title={title} 
          albumTitle={albumTitle}
          isArtist={isArtist} 
          innerClassName={innerClassName.replace(/group-hover:scale-\[?[a-zA-Z0-9\.]+%?\]?/g, '').replace(/duration-\d+/, '').replace(/transition-all/, '').replace(/transition-transform/, '')} 
        />
      ) : (
        <img 
          src={resolvedUrl} 
          alt={title || ""} 
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-700 ${innerClassName}`} 
          onError={() => setImgError(true)}
        />
      )}

      {/* Overlays */}
      {onPlay && (
        <div 
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer z-10"
        >
          <Play className="w-10 h-10 text-white fill-white drop-shadow-2xl" />
        </div>
      )}

      {(showZoomIcon || onZoom) && !onPlay && (
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none z-10">
          <ZoomIn className="w-1/4 h-1/4 text-white" />
        </div>
      )}

      {children}
    </div>
  );
});

// --- Unified Score Tier Styling & Color Matching ---

export interface ScoreTierStyle {
  textColor: string;
  badgeBorder: string;
  badgeText: string;
  badgeBg: string;
  glow: string;
  btnBg: string;
  hex: string;
}

export const getScoreTier = (score: number): ScoreTierStyle => {
  if (score >= 90) {
    return {
      textColor: 'text-amber-400',
      badgeBorder: 'border-amber-400',
      badgeText: 'text-amber-400',
      badgeBg: 'bg-[#1a1608]/90',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]',
      btnBg: 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.5)]',
      hex: '#fbbf24'
    };
  }
  if (score >= 80) {
    return {
      textColor: 'text-purple-400',
      badgeBorder: 'border-purple-500',
      badgeText: 'text-purple-300',
      badgeBg: 'bg-[#180e26]/90',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.25)]',
      btnBg: 'bg-purple-500 text-white shadow-[0_0_18px_rgba(168,85,247,0.4)]',
      hex: '#c084fc'
    };
  }
  if (score >= 70) {
    return {
      textColor: 'text-blue-400',
      badgeBorder: 'border-blue-500',
      badgeText: 'text-blue-300',
      badgeBg: 'bg-[#0f172a]/90',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.25)]',
      btnBg: 'bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.4)]',
      hex: '#60a5fa'
    };
  }
  if (score >= 60) {
    return {
      textColor: 'text-cyan-400',
      badgeBorder: 'border-cyan-500',
      badgeText: 'text-cyan-300',
      badgeBg: 'bg-[#081a24]/90',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.2)]',
      btnBg: 'bg-cyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.35)]',
      hex: '#22d3ee'
    };
  }
  if (score >= 50) {
    return {
      textColor: 'text-emerald-400',
      badgeBorder: 'border-emerald-500',
      badgeText: 'text-emerald-300',
      badgeBg: 'bg-[#081b13]/90',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      btnBg: 'bg-emerald-500 text-black shadow-[0_0_18px_rgba(16,185,129,0.35)]',
      hex: '#34d399'
    };
  }
  return {
    textColor: 'text-zinc-400',
    badgeBorder: 'border-zinc-700',
    badgeText: 'text-zinc-300',
    badgeBg: 'bg-[#18181b]/90',
    glow: '',
    btnBg: 'bg-zinc-700 text-white',
    hex: '#a1a1aa'
  };
};

// --- Rating Score Badge (Slightly smaller circular design per Request 2) ---


const AlbumValueBadge: React.FC<{
  albumValue?: AlbumValueRating;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({ albumValue, size = 'md', onClick }) => {
  if (!albumValue) return null;
  const [showPopover, setShowPopover] = useState(false);
  const tier = getAlbumValueTier(albumValue.totalValue);
  
  const badgeSizeClasses = 
    size === 'sm' ? 'w-6 h-6' :
    size === 'lg' ? 'w-14 h-14' :
    'w-10 h-10';

  return (
    <div 
      className="relative inline-block select-none group shrink-0"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <motion.div 
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className={`rounded-full flex items-center justify-center cursor-pointer border-2 backdrop-blur-md transition-all duration-300 ${tier.borderColor} ${tier.badgeBg} ${tier.glowColor} ${badgeSizeClasses} relative z-10 shadow-lg`}
      >
        <GemIcon tier={tier.key} className={size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
      </motion.div>

      {/* Popover Breakdown on Hover */}
      <AnimatePresence>
        {showPopover && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-64 bg-[#0d111a]/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-[2000] text-xs space-y-3 backdrop-blur-3xl pointer-events-none ring-1 ring-white/5"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <GemIcon tier={tier.key} className="w-4 h-4" />
                <span className={`font-black uppercase tracking-wider ${tier.textColor}`}>{tier.title}</span>
              </div>
              <span className="font-mono font-black text-white text-sm">{albumValue.totalValue}</span>
            </div>
            
            <div className="space-y-2 text-zinc-400 text-[10px] font-bold uppercase">
              <div className="flex justify-between items-center">
                <span>Редкость</span> 
                <span className="text-white font-mono">{albumValue.rarityScore}/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Целостность</span> 
                <span className="text-white font-mono">{albumValue.integrityScore}/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Глубина</span> 
                <span className="text-white font-mono">{albumValue.depthScore}/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Качество</span> 
                <span className="text-white font-mono">{albumValue.qualityPct}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Влияние</span> 
                <span className="text-white font-mono">{albumValue.influenceScore}/2.00</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 text-[8px] text-zinc-500 flex justify-between font-mono font-bold tracking-widest opacity-70">
              <span>ALBUM VALUE SYSTEM</span>
              <span className="theme-accent uppercase">CERTIFIED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Criterion Slider with Silver Metallic Thumb, Smooth Animations & Larger Typography ---

const CriterionSlider: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  gradient?: string;
  badgeStyle?: string;
}> = ({ 
  label, 
  value, 
  onChange, 
  gradient = "from-[#2563eb] to-[#3b82f6]",
  badgeStyle = "text-sky-300 bg-sky-500/15 border-sky-500/20"
}) => (
  <div className="space-y-2 py-2 group/slider">
    <div className="flex justify-between items-center px-0.5">
      <span className="text-xs sm:text-sm font-extrabold text-zinc-100 group-hover/slider:text-white transition-colors">{label}</span>
      <span className={`px-3 py-1 rounded-xl border text-xs sm:text-sm font-black font-mono tabular-nums transition-all duration-200 group-hover/slider:scale-105 shadow-sm ${badgeStyle}`}>{value}</span>
    </div>
    <div className="relative h-7 flex items-center">
      {/* Slider Track Background */}
      <div className="absolute inset-x-0 h-2.5 my-auto bg-[#1b2234] rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <input 
        type="range" 
        min="1" 
        max="10" 
        step="1" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      {/* Metallic Thumb */}
      <div 
        className="absolute w-5 h-7 bg-gradient-to-b from-[#ffffff] via-[#e2e8f0] to-[#94a3b8] rounded-full border border-white shadow-[0_2px_12px_rgba(0,0,0,0.7)] pointer-events-none transition-all duration-200 ease-out flex items-center justify-center -translate-x-1/2 group-hover/slider:scale-110 active:scale-95"
        style={{ left: `${(value / 10) * 100}%` }}
      >
        <div className="w-[2px] h-3.5 bg-zinc-400/80 rounded-full shadow-inner" />
      </div>
    </div>
  </div>
);

// --- Rating Input Form Component with 2-Column Responsive Layout & Nominations ---


// --- Quick Rating Modal matching image_ac7b40f7.png ---

const QuickRatingModal: React.FC<{
  isOpen: boolean;
  type: 'track' | 'album';
  item: Track | Album | null;
  onClose: () => void;
  onSave: (rating: RatingData | undefined) => void;
}> = ({ isOpen, type, item, onClose, onSave }) => {
  const [currentRating, setCurrentRating] = useState<RatingData | undefined>(item?.rating);
  
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative z-10 w-full max-w-3xl my-auto max-h-[90vh] overflow-y-auto custom-scrollbar p-1"
      >
        <div className="mb-4 flex items-center justify-between px-2 bg-zinc-900/90 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3.5 min-w-0">
            <CoverArt 
              url={(item as any).coverUrl} 
              title={(item as any).title}
              className="w-12 h-12 shadow-xl shrink-0 overflow-hidden rounded-xl border border-white/20"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block truncate">
                {type === 'track' ? 'Разбор трека' : 'Разбор альбома'}
              </span>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight truncate">{(item as any).title}</h2>
              <p className="text-xs sm:text-sm font-semibold text-zinc-400 truncate">{(item as any).artistName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <RatingInputCard 
          rating={currentRating} 
          onChange={setCurrentRating} 
          onConfirm={() => { onSave(currentRating); onClose(); }}
          title="ОЦЕНКА"
          isStandalone={true}
          targetType={type}
          context={{ hasFeature: Boolean((item as any).featuredArtist || (item as any).coArtist), isSnippet: Boolean((item as any).isSnippet), genre: (item as any).genre }}
        />
      </motion.div>
    </div>
  );
};

// --- High-Performance Progressive Track List Component (Fixes UI Freezes on Large DBs > 5MB) ---

const ProgressiveTrackList: React.FC<{
  tracks: Track[];
  renderItem: (track: Track, index: number) => React.ReactNode;
  initialBatchSize?: number;
  incrementBatchSize?: number;
  emptyMessage?: string;
  className?: string;
}> = ({
  tracks,
  renderItem,
  initialBatchSize = 50,
  incrementBatchSize = 50,
  emptyMessage = "Треки не найдены",
  className = "space-y-1"
}) => {
  const [visibleCount, setVisibleCount] = useState(initialBatchSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset batch size on query / list length change
  useEffect(() => {
    setVisibleCount(initialBatchSize);
  }, [tracks.length, initialBatchSize]);

  // Seamless auto-load via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(tracks.length, prev + incrementBatchSize));
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tracks.length, incrementBatchSize]);

  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const visibleTracks = tracks.slice(0, visibleCount);
  const hasMore = visibleCount < tracks.length;

  return (
    <div className={className}>
      {visibleTracks.map((t, i) => renderItem(t, i))}

      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount(prev => Math.min(tracks.length, prev + incrementBatchSize))}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            Загрузить ещё ({Math.min(incrementBatchSize, tracks.length - visibleCount)} из {tracks.length - visibleCount})
          </button>
        </div>
      )}
    </div>
  );
};

// Scroll-driven batch reveal hook (never triggers timer loops or mounts thousands of nodes at once)
export function useScrollBatchCount(total: number, initialBatch: number = 24, step: number = 24, resetKey?: string | number | boolean) {
  const [visibleCount, setVisibleCount] = useState(initialBatch);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(initialBatch);
  }, [total, initialBatch, resetKey]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= total) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(total, prev + step));
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [total, step, visibleCount]);

  const loadMore = () => setVisibleCount(prev => Math.min(total, prev + step));
  return { visibleCount, sentinelRef, loadMore, hasMore: visibleCount < total };
}

// --- Interactive Artist Picker Modal for Primary Artist & Features with Avatars ---

const ArtistPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  artists: Artist[];
  selectedArtistId?: string;
  selectedArtistName?: string;
  onSelectArtist: (artist: { id: string; name: string; imageUrl?: string }) => void;
  title?: string;
  allowCustom?: boolean;
}> = ({
  isOpen,
  onClose,
  artists,
  selectedArtistId,
  selectedArtistName,
  onSelectArtist,
  title = "Выбор исполнителя",
  allowCustom = true
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'alpha' | 'recent'>('followers');

  if (!isOpen) return null;

  const sortedArtists = [...artists].sort((a, b) => {
    if (sortBy === 'followers') return (b.followers || 0) - (a.followers || 0);
    if (sortBy === 'alpha') return (a.name || '').localeCompare(b.name || '', 'ru');
    return 0;
  });

  const filtered = sortedArtists.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.genre && a.genre.toLowerCase().includes(search.toLowerCase()))
  );

  const exactMatchExists = artists.some(a => a.name.trim().toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative z-10 w-full max-w-xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div>
            <h3 className="text-lg font-black text-white">{title}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Выберите из базы или впишите новое имя</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-zinc-900/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Поиск артиста или ввести новое имя..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-bold">Сортировать:</span>
            <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
              {[
                { id: 'followers', label: 'По популярности' },
                { id: 'alpha', label: 'А-Я' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id as any)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    sortBy === opt.id ? 'theme-bg-accent text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Name Quick-Add Button */}
        {allowCustom && search.trim() && !exactMatchExists && (
          <div className="p-3 bg-zinc-800/60 border-b border-white/5">
            <button
              type="button"
              onClick={() => {
                onSelectArtist({ id: `custom_${Date.now()}`, name: search.trim() });
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-black text-white flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 theme-accent" />
                <span>Использовать имя «<strong className="theme-accent">{search.trim()}</strong>»</span>
              </div>
              <span className="text-[10px] text-zinc-400">Нажмите для выбора →</span>
            </button>
          </div>
        )}

        {/* Artists Grid / List */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Артисты не найдены. Введите имя выше, чтобы использовать его.
            </div>
          ) : (
            filtered.map(art => {
              const isSelected = selectedArtistId === art.id || selectedArtistName === art.name;
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    onSelectArtist({ id: art.id, name: art.name, imageUrl: art.imageUrl });
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-zinc-800 border-white/40 shadow-lg' 
                      : 'bg-black/30 hover:bg-zinc-800/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CoverArt 
                      url={art.imageUrl} 
                      title={art.name}
                      isArtist={true}
                      className="w-11 h-11 rounded-full shadow-md shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-sm text-white truncate">{art.name}</p>
                        {art.verified && (
                          <span className="text-[10px] theme-accent font-black">✓</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {formatListeners(art.followers)} {art.genre ? `• ${art.genre}` : ''}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-7 h-7 rounded-full theme-bg-accent text-black flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Artwork Lightbox Modal ---

// (old ArtworkLightbox was replaced by CoverPeek from MusaicPlus.tsx)

// --- Edit Track Modal ---

const EditTrackModal: React.FC<{
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onSave: (track: Track) => void;
  artists: Artist[];
  albums: Album[];
}> = ({ isOpen, track, onClose, onSave, artists, albums }) => {
  if (!isOpen || !track) return null;

  const [form, setForm] = useState({
    title: track.title,
    artistId: track.artistId,
    artistName: track.artistName,
    featuredArtist: track.featuredArtist || '',
    albumId: track.albumId || 'single',
    plays: formatNumber(track.plays),
    likes: formatNumber(track.likes || 0),
    duration: track.duration,
    releaseDate: track.releaseDate || '',
    peakChartPosition: track.peakChartPosition ? track.peakChartPosition.toString() : '',
    genre: track.genre || '',
    composer: track.composer || '',
    isExplicit: Boolean(track.isExplicit),
    coverUrl: track.coverUrl || '',
    rating: track.rating
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const chosenArtist = artists.find(a => a.id === form.artistId);
    const chosenAlbum = albums.find(a => a.id === form.albumId);
    
    const updated: Track = {
      ...track,
      title: form.title.trim(),
      artistId: form.artistId || track.artistId,
      artistName: chosenArtist ? chosenArtist.name : (form.artistName || track.artistName),
      featuredArtist: form.featuredArtist.trim() || undefined,
      albumId: form.albumId === 'single' ? 'single' : (chosenAlbum?.id || 'single'),
      albumTitle: form.albumId === 'single' ? 'Single' : (chosenAlbum?.title || 'Single'),
      plays: parseFormattedNumber(form.plays),
      likes: parseFormattedNumber(form.likes),
      duration: form.duration.trim() || track.duration,
      releaseDate: parseFlexibleDate(form.releaseDate),
      peakChartPosition: form.peakChartPosition ? parseInt(form.peakChartPosition) : undefined,
      genre: form.genre.trim() || undefined,
      composer: form.composer.trim() || undefined,
      isExplicit: form.isExplicit,
      coverUrl: form.coverUrl.trim() || track.coverUrl,
      rating: form.rating
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in">
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-black/30">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white">Редактирование трека</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Изменение параметров, метаданных и статистики трека</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Cover Upload */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-2xl bg-zinc-800 border-2 border-white/10 overflow-hidden relative cursor-pointer group shadow-xl"
              >
                {form.coverUrl ? (
                  <CoverArt url={form.coverUrl} title={form.title} className="w-full h-full" innerClassName="group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold">Обложка</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                  Заменить
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const b64 = await fileToBase64(file);
                    const mediaId = await saveMediaItem(b64, {
                      trackId: form.id || track.id,
                      artistId: form.artistId,
                      albumId: form.albumId,
                      title: form.title,
                      artistName: form.artistName,
                      type: 'track'
                    });
                    setForm({ ...form, coverUrl: mediaId });
                  }
                }} 
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-zinc-400 hover:text-white font-semibold cursor-pointer transition-colors"
                >
                  Загрузить
                </button>
                <button
                  type="button"
                  onClick={() => setIsCoverEditorOpen(true)}
                  title="Редактор обложки"
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                {form.coverUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, coverUrl: '' })}
                    title="Удалить обложку и вернуть сгенерированную"
                    className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Название трека</label>
                <input 
                  type="text" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Основной исполнитель</label>
                  <select 
                    value={form.artistId} 
                    onChange={e => {
                      const a = artists.find(x => x.id === e.target.value);
                      setForm({ ...form, artistId: e.target.value, artistName: a?.name || form.artistName });
                    }} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs md:text-sm font-semibold text-white outline-none"
                  >
                    {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Альбом</label>
                  <select 
                    value={form.albumId} 
                    onChange={e => {
                      const selAlbum = albums.find(al => al.id === e.target.value);
                      setForm({ 
                        ...form, 
                        albumId: e.target.value,
                        coverUrl: (selAlbum?.coverUrl ? selAlbum.coverUrl : form.coverUrl)
                      });
                    }} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs md:text-sm font-semibold text-white outline-none"
                  >
                    <option value="single">Сингл (Без альбома)</option>
                    {albums.map(al => <option key={al.id} value={al.id}>{al.title} ({al.artistName})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Приглашенный артист (Фит)</label>
                <input 
                  type="text" 
                  placeholder="Имя приглашенного артиста" 
                  value={form.featuredArtist} 
                  onChange={e => setForm({ ...form, featuredArtist: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Genre Selection */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-300 block">Жанр трека</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_CATALOG.map(g => {
                const isSelected = form.genre === g.name;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setForm({ ...form, genre: isSelected ? '' : g.name })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'theme-bg-accent text-black shadow-md' 
                        : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
            <input 
              type="text" 
              placeholder="Или укажите свой жанр..." 
              value={form.genre} 
              onChange={e => setForm({ ...form, genre: e.target.value })} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/30 mt-1"
            />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300">Прослушивания</label>
                <button 
                  type="button" 
                  onClick={() => {
                    const art = artists.find(a => a.id === form.artistId);
                    setForm({ ...form, plays: getRandomPlays(art?.followers) });
                  }}
                  className="text-[10px] theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  title="Рандом на основе популярности"
                >
                  <Dices className="w-3.5 h-3.5" /> Рандом
                </button>
              </div>
              <input 
                type="text" 
                value={form.plays} 
                onChange={e => {
                  const num = e.target.value.replace(/\D/g, '');
                  setForm({ ...form, plays: formatNumber(parseInt(num) || 0) });
                }} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300">Длительность</label>
                <button 
                  type="button" 
                  onClick={() => setForm({ ...form, duration: getRandomDuration() })}
                  className="text-[10px] text-zinc-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" /> Рандом
                </button>
              </div>
              <input 
                type="text" 
                value={form.duration} 
                onChange={e => setForm({ ...form, duration: formatDurationInput(e.target.value) })} 
                onKeyDown={e => handleDurationKeyDown(e, form.duration, v => setForm({ ...form, duration: v }))}
                placeholder="2:21"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Пик в чарте (#)</label>
              <input 
                type="text" 
                placeholder="1" 
                value={form.peakChartPosition} 
                onChange={e => {
                  const num = e.target.value.replace(/\D/g, '');
                  setForm({ ...form, peakChartPosition: num });
                }} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Дата выпуска (ДД.ММ.ГГГГ)</label>
              <input 
                type="text" 
                placeholder="24.10.2026" 
                value={form.releaseDate} 
                onChange={e => setForm({ ...form, releaseDate: formatDateInput(e.target.value) })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Композитор / Автор</label>
              <input 
                type="text" 
                placeholder="Имя автора" 
                value={form.composer} 
                onChange={e => setForm({ ...form, composer: e.target.value })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none"
              />
            </div>
          </div>

          {/* Rating 90-Point Card */}
          <RatingInputCard 
            rating={form.rating} 
            onChange={r => setForm({ ...form, rating: r })} 
            title="Оценка трека (90-балльная система)" 
          />

          <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
            <input 
              type="checkbox" 
              id="edit-explicit" 
              checked={form.isExplicit} 
              onChange={e => setForm({ ...form, isExplicit: e.target.checked })} 
              className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
            />
            <label htmlFor="edit-explicit" className="text-xs font-bold text-zinc-300 cursor-pointer">
              Explicit Content [E] (Ненормативная лексика)
            </label>
          </div>

          <div className="pt-4 border-t border-white/5 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs md:text-sm transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 theme-bg-accent text-black font-bold rounded-xl text-xs md:text-sm hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
      <CoverEditorModal
        isOpen={isCoverEditorOpen}
        onClose={() => setIsCoverEditorOpen(false)}
        initialTitle={form.title}
        initialArtist={form.artistName}
        onApplyDataUrl={async (dataUrl) => {
          const mediaId = await saveMediaItem(dataUrl, {
            trackId: track.id,
            artistId: form.artistId,
            albumId: form.albumId,
            title: form.title,
            artistName: form.artistName,
            type: 'track'
          });
          setForm(prev => ({ ...prev, coverUrl: mediaId }));
        }}
      />
    </div>
  );
};

// --- Edit Album Modal ---

const EditAlbumModal: React.FC<{
  isOpen: boolean;
  album: Album | null;
  onClose: () => void;
  onSave: (album: Album) => void;
  artists: Artist[];
}> = ({ isOpen, album, onClose, onSave, artists }) => {
  if (!isOpen || !album) return null;

  const [form, setForm] = useState({
    title: album.title,
    artistId: album.artistId,
    artistName: album.artistName,
    coArtist: album.coArtist || '',
    releaseYear: album.releaseYear.toString(),
    releaseDate: album.releaseDate || '',
    genre: album.genre || '',
    peakChartPosition: album.peakChartPosition ? album.peakChartPosition.toString() : '',
    producer: album.producer || '',
    label: album.label || '',
    coverUrl: album.coverUrl || '',
    rating: album.rating
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const chosenArtist = artists.find(a => a.id === form.artistId);
    
    const updated: Album = {
      ...album,
      title: form.title.trim(),
      artistId: form.artistId || album.artistId,
      artistName: chosenArtist ? chosenArtist.name : (form.artistName || album.artistName),
      coArtist: form.coArtist.trim() || undefined,
      releaseYear: parseInt(form.releaseYear) || album.releaseYear,
      releaseDate: parseFlexibleDate(form.releaseDate),
      genre: form.genre.trim() || album.genre,
      peakChartPosition: form.peakChartPosition ? parseInt(form.peakChartPosition) : undefined,
      producer: form.producer.trim() || undefined,
      label: form.label.trim() || undefined,
      coverUrl: form.coverUrl.trim() || album.coverUrl,
      rating: form.rating
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in">
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-black/30">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white">Редактирование альбома</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Изменение названия, авторов, даты и параметров релиза</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-2xl bg-zinc-800 border-2 border-white/10 overflow-hidden relative cursor-pointer group shadow-xl"
              >
                {form.coverUrl ? (
                  <CoverArt url={form.coverUrl} title={form.title} className="w-full h-full" innerClassName="group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900">
                    <Disc className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold">Обложка</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                  Заменить
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const b64 = await fileToBase64(file);
                    const mediaId = await saveMediaItem(b64, {
                      albumId: form.id || album.id,
                      artistId: form.artistId,
                      title: form.title,
                      artistName: form.artistName,
                      type: 'album'
                    });
                    setForm({ ...form, coverUrl: mediaId });
                  }
                }} 
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-zinc-400 hover:text-white font-semibold cursor-pointer transition-colors"
                >
                  Загрузить
                </button>
                <button
                  type="button"
                  onClick={() => setIsCoverEditorOpen(true)}
                  title="Редактор обложки"
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                {form.coverUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, coverUrl: '' })}
                    title="Удалить обложку и вернуть сгенерированную"
                    className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Название альбома</label>
                <input 
                  type="text" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Основной исполнитель</label>
                  <select 
                    value={form.artistId} 
                    onChange={e => {
                      const a = artists.find(x => x.id === e.target.value);
                      setForm({ ...form, artistId: e.target.value, artistName: a?.name || form.artistName });
                    }} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs md:text-sm font-semibold text-white outline-none"
                  >
                    {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Второй автор (фит)</label>
                  <input 
                    type="text" 
                    placeholder="Имя соавтора" 
                    value={form.coArtist} 
                    onChange={e => setForm({ ...form, coArtist: e.target.value })} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white placeholder:text-zinc-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-300 block">Жанр альбома</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_CATALOG.map(g => {
                const isSelected = form.genre === g.name;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setForm({ ...form, genre: isSelected ? '' : g.name })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'theme-bg-accent text-black shadow-md' 
                        : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
            <input 
              type="text" 
              placeholder="Или введите свой жанр..." 
              value={form.genre} 
              onChange={e => setForm({ ...form, genre: e.target.value })} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/30 mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Год выпуска</label>
              <input 
                type="number" 
                value={form.releaseYear} 
                onChange={e => setForm({ ...form, releaseYear: e.target.value })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Дата выпуска (ДД.ММ.ГГГГ)</label>
              <input 
                type="text" 
                placeholder="24.10.2026" 
                value={form.releaseDate} 
                onChange={e => setForm({ ...form, releaseDate: formatDateInput(e.target.value) })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Пик в чарте (#)</label>
              <input 
                type="text" 
                placeholder="1" 
                value={form.peakChartPosition} 
                onChange={e => {
                  const num = e.target.value.replace(/\D/g, '');
                  setForm({ ...form, peakChartPosition: num });
                }} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
              />
            </div>
          </div>

          {/* Rating 90-Point Card */}
          <RatingInputCard 
            rating={form.rating} 
            onChange={r => setForm({ ...form, rating: r })} 
            title="Оценка альбома (90-балльная система)" 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Продюсер</label>
              <input 
                type="text" 
                placeholder="Имя продюсера" 
                value={form.producer} 
                onChange={e => setForm({ ...form, producer: e.target.value })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Лейбл</label>
              <input 
                type="text" 
                placeholder="Лейбл звукозаписи" 
                value={form.label} 
                onChange={e => setForm({ ...form, label: e.target.value })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs md:text-sm transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 theme-bg-accent text-black font-bold rounded-xl text-xs md:text-sm hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
      <CoverEditorModal
        isOpen={isCoverEditorOpen}
        onClose={() => setIsCoverEditorOpen(false)}
        initialTitle={form.title}
        initialArtist={form.artistName}
        onApplyDataUrl={async (dataUrl) => {
          const mediaId = await saveMediaItem(dataUrl, {
            albumId: album.id,
            artistId: form.artistId,
            title: form.title,
            artistName: form.artistName,
            type: 'album'
          });
          setForm(prev => ({ ...prev, coverUrl: mediaId }));
        }}
      />
    </div>
  );
};

// --- Helper: Realistic Recommended Monthly Listeners for Artists ---

export function calculateRecommendedArtistListeners(
  artist: { id?: string; name: string; verified?: boolean; followers?: number },
  allTracks: Track[],
  allAlbums: Album[]
): {
  recommendedFollowers: number;
  tierName: string;
  tierClass: string;
  basisText: string;
} {
  const artName = (artist.name || '').toLowerCase().trim();
  const artId = artist.id;
  const myTracks = allTracks.filter(t => 
    (artId && t.artistId === artId) || 
    (t.artistName && t.artistName.toLowerCase().trim() === artName)
  );

  const playsList = myTracks.map(t => t.plays || 0).sort((a, b) => b - a);
  const totalCatalogPlays = playsList.reduce((acc, p) => acc + p, 0);
  const formatCompactNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн`;
    if (n >= 1_000) return `${Math.round(n / 1_000)} тыс.`;
    return n.toString();
  };

  const topTrackPlays = playsList[0] || 0;
  const avgTrackPlays = playsList.length > 0 ? Math.round(totalCatalogPlays / playsList.length) : 0;

  let rec = 120_000;
  let basis = 'По средним значениям новичка';

  if (playsList.length >= 1) {
    if (topTrackPlays > 15_000_000 || totalCatalogPlays > 40_000_000) {
      rec = Math.round(Math.max(4_500_000, Math.min(12_000_000, topTrackPlays * 0.25 + totalCatalogPlays * 0.04)));
      basis = `На основе каталога (${playsList.length} тр., топ ${formatCompactNum(topTrackPlays)})`;
    } else if (topTrackPlays > 4_000_000 || totalCatalogPlays > 12_000_000) {
      rec = Math.round(Math.max(1_800_000, Math.min(4_500_000, topTrackPlays * 0.28 + totalCatalogPlays * 0.06)));
      basis = `На основе каталога (${playsList.length} тр., топ ${formatCompactNum(topTrackPlays)})`;
    } else if (topTrackPlays > 500_000 || totalCatalogPlays > 1_500_000) {
      rec = Math.round(Math.max(220_000, Math.min(1_800_000, topTrackPlays * 0.30 + avgTrackPlays * 0.5)));
      basis = `По стримам треков (${playsList.length} тр., ср. ${formatCompactNum(avgTrackPlays)})`;
    } else {
      rec = Math.round(Math.max(25_000, Math.min(280_000, topTrackPlays * 0.35 + avgTrackPlays * 0.4)));
      basis = `По каталогу начинающего (${playsList.length} тр.)`;
    }
  } else if (artist.followers && artist.followers > 0) {
    rec = artist.followers;
    basis = 'Текущее значение артиста';
  }

  if (artist.verified && rec < 200_000) {
    rec = Math.round(rec * 1.4);
  }

  // Round to clean readable number
  if (rec >= 1_000_000) {
    rec = Math.round(rec / 50_000) * 50_000;
  } else if (rec >= 100_000) {
    rec = Math.round(rec / 10_000) * 10_000;
  } else {
    rec = Math.round(rec / 1_000) * 1_000;
  }

  let tierName = 'Новичок (до 300к)';
  let tierClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (rec >= 8_000_000) {
    tierName = 'Мега-топ (8М+)';
    tierClass = 'text-amber-300 bg-amber-500/10 border-amber-500/25';
  } else if (rec >= 2_500_000) {
    tierName = 'Крупный (2.5М–8М)';
    tierClass = 'text-purple-300 bg-purple-500/10 border-purple-500/25';
  } else if (rec >= 300_000) {
    tierName = 'Средний (300к–2.5М)';
    tierClass = 'text-sky-300 bg-sky-500/10 border-sky-500/25';
  }

  return { recommendedFollowers: rec, tierName, tierClass, basisText: basis };
}

// --- Edit Artist Modal ---

const EditArtistModal: React.FC<{
  isOpen: boolean;
  artist: Artist | null;
  onClose: () => void;
  onSave: (artist: Artist) => void;
  tracks?: Track[];
  albums?: Album[];
}> = ({ isOpen, artist, onClose, onSave, tracks = [], albums = [] }) => {
  const [form, setForm] = useState({
    name: '',
    bio: '',
    genre: '',
    followers: '0',
    country: '',
    verified: false,
    imageUrl: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);

  useEffect(() => {
    if (artist && isOpen) {
      setForm({
        name: artist.name,
        bio: artist.bio || '',
        genre: artist.genre || '',
        followers: formatNumber(artist.followers || 0),
        country: artist.country || '',
        verified: Boolean(artist.verified),
        imageUrl: artist.imageUrl || '',
      });
    }
  }, [artist, isOpen]);

  const recommendedRec = useMemo(() => {
    if (!artist) return null;
    return calculateRecommendedArtistListeners(
      { id: artist.id, name: form.name || artist.name, verified: form.verified, followers: artist.followers },
      tracks,
      albums
    );
  }, [artist, form.name, form.verified, tracks, albums]);

  if (!isOpen || !artist) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const updated: Artist = {
      ...artist,
      name: form.name.trim(),
      bio: form.bio.trim(),
      genre: form.genre.trim(),
      followers: parseFormattedNumber(form.followers),
      country: form.country.trim() || undefined,
      verified: form.verified,
      imageUrl: form.imageUrl.trim() || artist.imageUrl,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in">
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-black/30">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white">Редактирование исполнителя</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Изменение информации, фотографии, жанра и статистики</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full border-2 border-white/10 relative cursor-pointer group shadow-xl"
              >
                <CoverArt 
                  url={form.imageUrl} 
                  title={form.name} 
                  isArtist={true}
                  className="w-full h-full rounded-full" 
                  innerClassName="group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold rounded-full">
                  Заменить
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const b64 = await fileToBase64(file);
                    const mediaId = await saveMediaItem(b64, {
                      artistId: artist.id,
                      artistName: form.name,
                      type: 'artist'
                    });
                    setForm({ ...form, imageUrl: mediaId });
                  }
                }} 
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-zinc-400 hover:text-white font-semibold cursor-pointer transition-colors"
                >
                  Загрузить
                </button>
                <button
                  type="button"
                  onClick={() => setIsCoverEditorOpen(true)}
                  title="Редактор обложки"
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: '' })}
                    title="Удалить фото и вернуть сгенерированное"
                    className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Имя исполнителя</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-zinc-300">Слушатели</label>
                    <button 
                      type="button" 
                      onClick={() => setForm({ ...form, followers: getRandomPlays() })}
                      className="text-[10px] theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5" /> 200к-15М
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={form.followers} 
                    onChange={e => {
                      const num = e.target.value.replace(/\D/g, '');
                      setForm({ ...form, followers: formatNumber(parseInt(num) || 0) });
                    }} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
                  />
                  {recommendedRec && (
                    <div className="mt-2 p-2 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Рекомендуется по базе:</span>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, followers: formatNumber(recommendedRec.recommendedFollowers) }))}
                          className="theme-accent font-bold hover:underline text-[11px] cursor-pointer"
                        >
                          Применить
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white tabular-nums">
                          {formatNumber(recommendedRec.recommendedFollowers)}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${recommendedRec.tierClass}`}>
                          {recommendedRec.tierName}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        {recommendedRec.basisText}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Страна / Локация</label>
                  <input 
                    type="text" 
                    placeholder="Россия, Москва" 
                    value={form.country} 
                    onChange={e => setForm({ ...form, country: e.target.value })} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-300 block">Жанр артиста</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_CATALOG.map(g => {
                const isSelected = form.genre === g.name;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setForm({ ...form, genre: isSelected ? '' : g.name })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'theme-bg-accent text-black shadow-md' 
                        : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
            <input 
              type="text" 
              placeholder="Или укажите свой жанр..." 
              value={form.genre} 
              onChange={e => setForm({ ...form, genre: e.target.value })} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/30 mt-1"
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-300 block">Биография</label>
            <textarea 
              value={form.bio} 
              onChange={e => setForm({ ...form, bio: e.target.value })} 
              rows={3} 
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
            <input 
              type="checkbox" 
              id="edit-verified" 
              checked={form.verified} 
              onChange={e => setForm({ ...form, verified: e.target.checked })} 
              className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
            />
            <label htmlFor="edit-verified" className="text-xs font-bold text-zinc-300 cursor-pointer">
              Подтвержденный профиль (Галочка ✓)
            </label>
          </div>

          <div className="pt-4 border-t border-white/5 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs md:text-sm transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 theme-bg-accent text-black font-bold rounded-xl text-xs md:text-sm hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
      <CoverEditorModal
        isOpen={isCoverEditorOpen}
        onClose={() => setIsCoverEditorOpen(false)}
        initialTitle={form.name}
        initialArtist={form.genre}
        onApplyDataUrl={async (dataUrl) => {
          const mediaId = await saveMediaItem(dataUrl, {
            artistId: artist.id,
            artistName: form.name,
            type: 'artist'
          });
          setForm(prev => ({ ...prev, imageUrl: mediaId }));
        }}
      />
    </div>
  );
};

// --- Action Menu Modal (Triggered by 3-dots) ---

// --- Remembered per-page UI state (sort, filters, view mode) so "Back" returns to the same state ---
const viewUiMemory = new Map<string, any>();
function useViewMemo<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => (viewUiMemory.has(key) ? viewUiMemory.get(key) : initial));
  useEffect(() => { viewUiMemory.set(key, val); }, [key, val]);
  return [val, setVal];
}

// Keeps a cover color readable as an accent (not too dark, not too light)
const readableAccent = (hex: string): string => {
  try {
    const h = (hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
    const n = parseInt(full, 16);
    if (isNaN(n)) return hex;
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (lum < 0.38) {
      const k = Math.min(0.75, (0.5 - lum) / (1 - lum));
      r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k);
    } else if (lum > 0.86) {
      const k = 0.82;
      r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k);
    }
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return hex;
  }
};

const PAGE_ENHANCE_CSS = `
.page-accent-scope .theme-bg-accent.page-accent-bg { background-color: var(--page-accent) !important; transition: background-color .6s ease, transform .2s ease; }
.page-accent-scope .page-accent-text { color: var(--page-accent) !important; }
.artist-hero-img { transition: transform .08s linear; }
html[data-design="classic"] .page-cover-blur { display: none !important; }
html[data-design="classic"] .artist-hero-compact { box-shadow: inset 0 -1px 0 rgba(255,255,255,0.07); }
html[data-design="classic"] .album-cover-glow { opacity: 0.25 !important; filter: blur(18px) !important; }
@media (prefers-reduced-motion: reduce) { .artist-hero-img { transform: none !important; } }
html[data-typography="modern"] { --typo-body: 'Onest', 'Inter', sans-serif; --typo-head: 'Inter Tight', 'Onest', sans-serif; }
html[data-typography="editorial"] { --typo-body: 'Golos Text', 'Inter', sans-serif; --typo-head: 'Geologica', 'Golos Text', sans-serif; }
html[data-typography="display"] { --typo-body: 'Manrope', 'Inter', sans-serif; --typo-head: 'Unbounded', 'Manrope', sans-serif; }
html[data-typography]:not([data-typography="classic"]) body,
html[data-typography]:not([data-typography="classic"]) .font-main { font-family: var(--typo-body) !important; }
html[data-typography]:not([data-typography="classic"]) :is(h1, h2, h3, .font-display, .font-headline) { font-family: var(--typo-head) !important; letter-spacing: -0.03em; }
html[data-typography="display"] :is(h1, h2, h3) { letter-spacing: -0.015em; }
html[data-typography]:not([data-typography="classic"]) p { text-wrap: pretty; }
html[data-typography]:not([data-typography="classic"]) h1 { text-wrap: balance; }
`;

// --- Big artist header (Apple Music style): "cinema" (full-bleed photo, can expand to the whole photo) or "poster" (whole photo on a blurred backdrop) ---
const ArtistHero: React.FC<{
  artist: Artist;
  coverUrl: string;
  palette: [string, string, string, string];
  useColors: boolean;
  animate: boolean;
  variant?: 'cinema' | 'poster';
  onPlay: () => void;
  onZoom?: () => void;
}> = ({ artist, coverUrl, palette, useColors, animate, variant = 'cinema', onZoom }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const [expandedH, setExpandedH] = useState<number | null>(null);

  const c0 = palette[0];
  const c1 = palette[1];
  const hasImage = Boolean(coverUrl) && !imgFailed;

  // full-photo height for the expanded cinema view
  useEffect(() => {
    if (!expanded || !ratio) return;
    const calc = () => {
      const w = heroRef.current?.offsetWidth || 0;
      if (w) setExpandedH(Math.min(Math.round(w * ratio), Math.round(window.innerHeight * 1.6)));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [expanded, ratio]);

  // gentle parallax (cinema, collapsed only)
  useEffect(() => {
    if (variant !== 'cinema') return;
    const el = heroRef.current;
    if (!el) return;
    if (!animate || expanded) {
      if (imgRef.current) imgRef.current.style.transform = 'none';
      return;
    }
    const scroller = el.closest('.overflow-y-auto') as HTMLElement | null;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = scroller.scrollTop;
        const h = el.offsetHeight || 1;
        if (imgRef.current) {
          imgRef.current.style.transform = `translate3d(0, ${Math.min(y * 0.35, 140)}px, 0) scale(${1 + Math.min(y / h, 1) * 0.06})`;
        }
      });
    };
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [animate, expanded, variant]);

  const titleBlock = (
    <>
      {artist.verified && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 mb-2">
          <CheckCircle2 className="w-4 h-4 fill-sky-400 text-black" />
          <span>Подтвержденный исполнитель</span>
        </div>
      )}
      <h1
        className="font-black text-white leading-[0.95] break-words"
        style={{ fontSize: 'clamp(40px, 7vw, 96px)', letterSpacing: '-0.035em', textShadow: '0 6px 32px rgba(0,0,0,0.45)' }}
      >
        {artist.name}
      </h1>
      <p className="mt-3 text-sm md:text-base font-medium text-white/85 tabular-nums">
        {formatListeners(artist.followers)}{artist.genre ? ` · ${artist.genre}` : ''}
      </p>
    </>
  );

  if (variant === 'poster') {
    return (
      <div ref={heroRef} className="artist-hero relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {hasImage && (
            <div
              className="page-cover-blur absolute -inset-20 bg-cover bg-center blur-[80px] opacity-60 scale-110"
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
          )}
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: useColors
                ? `linear-gradient(120deg, ${c0}66 0%, ${c1}22 50%, rgba(0,0,0,0.25) 100%)`
                : 'linear-gradient(120deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%)'
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-color))' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-8 pt-10 pb-10 flex flex-col-reverse md:flex-row md:items-end gap-6 md:gap-12">
          <motion.div
            initial={animate ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-w-0 text-center md:text-left"
          >
            {titleBlock}
          </motion.div>
          <motion.div
            initial={animate ? { opacity: 0, scale: 0.96 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 self-center md:self-auto"
          >
            {hasImage ? (
              <button
                type="button"
                onClick={onZoom}
                className="block rounded-3xl overflow-hidden border border-white/10 cursor-zoom-in transition-transform duration-500 hover:scale-[1.015]"
                style={{ boxShadow: useColors ? `0 30px 80px -20px ${c0}88` : '0 30px 80px -20px rgba(0,0,0,0.7)' }}
                title="Открыть фото"
              >
                <img
                  src={coverUrl}
                  alt={artist.name}
                  className="block w-auto h-auto max-h-[340px] md:max-h-[420px] max-w-[80vw] md:max-w-[440px] object-contain"
                  onError={() => setImgFailed(true)}
                />
              </button>
            ) : (
              <div className="w-56 h-56 rounded-3xl" style={{ background: `linear-gradient(135deg, ${c0}, ${c1})` }} />
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={heroRef}
      className={`artist-hero relative overflow-hidden ${expanded && expandedH ? '' : 'h-[300px] sm:h-[380px] md:h-[440px]'}`}
      style={{
        height: expanded && expandedH ? expandedH : undefined,
        transition: 'height 0.55s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      <div ref={imgRef} className="artist-hero-img absolute inset-0 will-change-transform">
        {hasImage ? (
          <img
            src={coverUrl}
            alt={artist.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: expanded ? 'center' : 'center 25%' }}
            onLoad={(e) => {
              const im = e.currentTarget;
              if (im.naturalWidth) setRatio(im.naturalHeight / im.naturalWidth);
            }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)` }} />
        )}
      </div>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 32%, rgba(0,0,0,0.35) 68%, var(--bg-color) 100%)', opacity: expanded ? 0.55 : 1 }}
      />
      {useColors && !expanded && (
        <div className="absolute inset-0 pointer-events-none opacity-70 transition-all duration-700" style={{ background: `linear-gradient(to top, ${c0}55 0%, transparent 55%)` }} />
      )}
      {hasImage && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {ratio && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="px-3 py-1.5 rounded-full bg-black/45 hover:bg-black/65 text-white/90 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title={expanded ? 'Свернуть' : 'Показать фото целиком'}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{expanded ? 'Свернуть' : 'Фото целиком'}</span>
            </button>
          )}
          {onZoom && (
            <button
              type="button"
              onClick={onZoom}
              className="p-2 rounded-full bg-black/45 hover:bg-black/65 text-white/80 hover:text-white cursor-pointer transition-colors"
              title="Открыть фото"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      <motion.div
        initial={animate ? { opacity: 0, y: 18 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-0 pb-6"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8">{titleBlock}</div>
      </motion.div>
    </div>
  );
};

// --- Add an existing track into an album at a chosen position ---
const AddToAlbumModal: React.FC<{
  track: Track | null;
  albums: Album[];
  tracks: Track[];
  onClose: () => void;
  onConfirm: (albumId: string, beforeTrackId: string | null) => void;
}> = ({ track, albums, tracks, onClose, onConfirm }) => {
  const [search, setSearch] = useState('');
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [beforeId, setBeforeId] = useState<string | null>(null);

  useEffect(() => {
    setSearch('');
    setAlbumId(null);
    setBeforeId(null);
  }, [track?.id]);

  if (!track) return null;

  const artistKey = (track.artistName || '').toLowerCase().trim();
  const isOwn = (a: Album) =>
    a.artistId === track.artistId ||
    (a.artistName || '').toLowerCase().trim() === artistKey ||
    (!!artistKey && (a.coArtist || '').toLowerCase().includes(artistKey));
  const q = search.trim().toLowerCase();
  const candidates = albums
    .filter(a => a.id !== track.albumId)
    .filter(a => !q || (a.title || '').toLowerCase().includes(q) || (a.artistName || '').toLowerCase().includes(q))
    .sort((a, b) => {
      const am = isOwn(a) ? 0 : 1;
      const bm = isOwn(b) ? 0 : 1;
      if (am !== bm) return am - bm;
      return (Number(b.releaseYear) || 0) - (Number(a.releaseYear) || 0);
    })
    .slice(0, 80);
  const chosen = albumId ? albums.find(a => a.id === albumId) || null : null;
  const albumTracks = chosen ? tracks.filter(t => t.albumId === chosen.id && t.id !== track.id) : [];

  const Slot: React.FC<{ before: string | null; label: string }> = ({ before, label }) => {
    const active = beforeId === before;
    return (
      <button
        type="button"
        onClick={() => setBeforeId(before)}
        className={`w-full my-0.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer border ${
          active ? 'theme-border-accent theme-accent bg-white/[0.06]' : 'border-dashed border-white/10 text-zinc-500 hover:text-zinc-200 hover:border-white/25'
        }`}
      >
        {active ? `«${track.title}» будет здесь` : label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <CoverArt url={track.coverUrl} title={track.title} className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">Добавить в альбом</h4>
            <p className="text-xs text-zinc-400 truncate">{track.title} · {track.artistName}</p>
          </div>
          <span className="text-[10px] font-bold text-zinc-500">Шаг {chosen ? 2 : 1} из 2</span>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {!chosen ? (
            <div className="space-y-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Найти альбом…"
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {candidates.length === 0 && <p className="text-xs text-zinc-500 text-center py-8">Альбомы не найдены</p>}
              <div className="space-y-1">
                {candidates.map(a => {
                  const count = tracks.filter(t => t.albumId === a.id).length;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { setAlbumId(a.id); setBeforeId(null); }}
                      className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-left hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer"
                    >
                      <CoverArt url={a.coverUrl} title={a.title} className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{a.title}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{a.artistName} · {a.releaseYear} · {count} {pluralizeTracks(count)}</p>
                      </div>
                      {isOwn(a) && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">Свой</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button type="button" onClick={() => setAlbumId(null)} className="text-xs font-bold text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Другой альбом
              </button>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                <CoverArt url={chosen.coverUrl} title={chosen.title} className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{chosen.title}</p>
                  <p className="text-[11px] text-zinc-400">Выберите место в треклисте. Обложка трека сменится на альбомную.</p>
                </div>
              </div>
              <div>
                {albumTracks.map((t, i) => (
                  <div key={t.id}>
                    <Slot before={t.id} label={`Перед треком ${i + 1}`} />
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                      <span className="w-5 text-right text-xs text-zinc-500 tabular-nums">{i + 1}</span>
                      <span className="text-sm text-zinc-200 truncate flex-1">{t.title}</span>
                      <span className="text-xs text-zinc-500 tabular-nums">{t.duration}</span>
                    </div>
                  </div>
                ))}
                <Slot before={null} label="В конец альбома" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold cursor-pointer transition-colors">
            Отмена
          </button>
          <button
            type="button"
            disabled={!chosen}
            onClick={() => chosen && onConfirm(chosen.id, beforeId)}
            className="flex-1 py-2.5 rounded-xl theme-bg-accent text-black text-sm font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Добавить в альбом
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ActionMenuModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  featuredArtist?: string;
  artists?: Artist[];
  navigateTo?: (view: ViewType, params?: { id?: string; artistName?: string }) => void;
  coverUrl?: string;
  onEdit: () => void;
  onCopyLink: () => void;
  onOpenStory?: () => void;
  onGoToArtist?: () => void;
  onToggleLike?: () => void;
  isLiked?: boolean;
  onDelete?: () => void;
  onAddToAlbum?: () => void;
  type: 'track' | 'album' | 'artist';
}> = ({ isOpen, onClose, title, subtitle, featuredArtist, artists = [], navigateTo, coverUrl, onEdit, onCopyLink, onOpenStory, onGoToArtist, onToggleLike, isLiked, onDelete, onAddToAlbum, type }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const labelType = type === 'album' ? 'альбом' : type === 'artist' ? 'артиста' : 'трек';
  const featNames = featuredArtist ? featuredArtist.split(/[,&]/).map(s => s.trim()).filter(Boolean) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-5 z-10 animate-in space-y-4">
        <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
          {coverUrl && (
            <CoverArt 
              url={coverUrl} 
              title={title}
              className={`w-12 h-12 ${type === 'artist' ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-zinc-800 shrink-0 border border-white/10`} 
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{title}</h4>
            {subtitle && <p className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => { onClose(); onEdit(); }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <Edit3 className="w-4 h-4 text-zinc-400 group-hover:theme-accent transition-colors" />
            <span>Редактировать {labelType}</span>
          </button>

          {onAddToAlbum && (
            <button
              type="button"
              onClick={() => { onClose(); onAddToAlbum(); }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <Disc className="w-4 h-4 text-zinc-400 group-hover:theme-accent transition-colors" />
              <span>Добавить в альбом…</span>
            </button>
          )}

          {onOpenStory && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenStory(); }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <ImageIcon className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-transform" />
              <span>Поделиться в Story (Постер 9:16)</span>
            </button>
          )}

          {onGoToArtist && (
            <button
              type="button"
              onClick={() => { onClose(); onGoToArtist(); }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <User className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span>Перейти к артисту ({subtitle || 'Профиль'})</span>
            </button>
          )}

          {featNames.map((featName, idx) => {
            const found = artists.find(a => a.name.trim().toLowerCase() === featName.toLowerCase());
            const targetId = found ? found.id : `guest_${featName}`;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onClose();
                  if (navigateTo) navigateTo('artist', { id: targetId, artistName: featName });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer group"
              >
                <User className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
                <span className="truncate">Перейти к фиту: {featName}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => { onClose(); onCopyLink(); }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <Share2 className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            <span>Копировать ссылку</span>
          </button>

          {onToggleLike && (
            <button
              type="button"
              onClick={() => { onToggleLike(); }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'theme-accent fill-current' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
              <span>{isLiked ? 'Удалить из любимого' : 'Добавить в любимое'}</span>
            </button>
          )}

          {onDelete && (
            <div className="pt-1">
              {!isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Удалить {labelType}</span>
                </button>
              ) : (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-2.5">
                  <p className="text-xs font-bold text-red-300 text-center">Вы уверены, что хотите удалить {labelType} «{title}»?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onDelete();
                      }}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Да, удалить
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- StoryCardModal: 9:16 Social Release Poster Generator with Canvas Export ---

const StoryCardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: 'track' | 'album' | 'artist';
  theme: ThemeConfig;
  albums?: Album[];
  artists?: Artist[];
  showToast?: (msg: string) => void;
}> = ({ isOpen, onClose, item, type, theme, albums = [], artists = [], showToast }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !item) return null;

  const isTrack = type === 'track';
  const isAlbum = type === 'album';
  const isArtist = type === 'artist';

  const title = isArtist ? item.name : item.title;
  const artistName = isArtist ? '' : (item.artistName || '');
  const cleanSubtitle = isArtist 
    ? formatListeners(item.followers) 
    : `${artistName}${item.featuredArtist ? ` (feat. ${item.featuredArtist})` : ''}`;
  const rawCover = isTrack ? getTrackCover(item, albums) : (isAlbum ? item.coverUrl : item.imageUrl);
  const coverUrl = resolveMedia(rawCover, { title, artistName, isArtist });
  const plays = isArtist ? (item.followers || 0) : (isTrack ? (item.plays || 0) : (item.totalPlays || 0));
  const releaseYear = isTrack 
    ? (item.year || (item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2025)) 
    : (isAlbum ? (item.releaseYear || (item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2025)) : null);
  const score = item.rating?.totalScore || null;

  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 1. Rich dark gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, '#090a10');
      bgGrad.addColorStop(0.35, '#131524');
      bgGrad.addColorStop(0.75, '#0b0c14');
      bgGrad.addColorStop(1, '#050508');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Radial ambient lighting
      const radGrad = ctx.createRadialGradient(540, 780, 50, 540, 780, 800);
      radGrad.addColorStop(0, `${theme.accentColor}35`);
      radGrad.addColorStop(0.5, '#6366f120');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Vinyl Record effect behind cover
      const cx = 540;
      const cy = 720;
      const vinylRadius = 380;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx + 90, cy, vinylRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#08090d';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#27272a';
      ctx.stroke();

      // Vinyl grooves
      for (let r = vinylRadius - 25; r > 140; r -= 18) {
        ctx.beginPath();
        ctx.arc(cx + 90, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Vinyl center label
      ctx.beginPath();
      ctx.arc(cx + 90, cy, 120, 0, Math.PI * 2);
      ctx.fillStyle = theme.accentColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 90, cy, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#090a10';
      ctx.fill();
      ctx.restore();

      // 3. Cover art
      const drawCover = (imgObj?: CanvasImageSource) => {
        const coverSize = 640;
        const coverX = 140;
        const coverY = 400;

        // Cover shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetY = 30;

        // Clip rounded rectangle
        const radius = 40;
        ctx.beginPath();
        ctx.moveTo(coverX + radius, coverY);
        ctx.lineTo(coverX + coverSize - radius, coverY);
        ctx.quadraticCurveTo(coverX + coverSize, coverY, coverX + coverSize, coverY + radius);
        ctx.lineTo(coverX + coverSize, coverY + coverSize - radius);
        ctx.quadraticCurveTo(coverX + coverSize, coverY + coverSize, coverX + coverSize - radius, coverY + coverSize);
        ctx.lineTo(coverX + radius, coverY + coverSize);
        ctx.quadraticCurveTo(coverX, coverY + coverSize, coverX, coverY + coverSize - radius);
        ctx.lineTo(coverX, coverY + radius);
        ctx.quadraticCurveTo(coverX, coverY, coverX + radius, coverY);
        ctx.closePath();
        ctx.fillStyle = '#18181b';
        ctx.fill();
        ctx.restore();

        if (imgObj) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(coverX + radius, coverY);
          ctx.lineTo(coverX + coverSize - radius, coverY);
          ctx.quadraticCurveTo(coverX + coverSize, coverY, coverX + coverSize, coverY + radius);
          ctx.lineTo(coverX + coverSize, coverY + coverSize - radius);
          ctx.quadraticCurveTo(coverX + coverSize, coverY + coverSize, coverX + coverSize - radius, coverY + coverSize);
          ctx.lineTo(coverX + radius, coverY + coverSize);
          ctx.quadraticCurveTo(coverX, coverY + coverSize, coverX, coverY + coverSize - radius);
          ctx.lineTo(coverX, coverY + radius);
          ctx.quadraticCurveTo(coverX, coverY, coverX + radius, coverY);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(imgObj, coverX, coverY, coverSize, coverSize);
          ctx.restore();
        }

        // Cover border
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      };

      // Try loading image
      let loadedImg: HTMLImageElement | null = null;
      if (coverUrl) {
        try {
          loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            if (!coverUrl.startsWith('data:')) img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = coverUrl;
          });
        } catch {
          loadedImg = null;
        }
      }
      drawCover(loadedImg || undefined);

      // 4. Header: MUSAIC PREMIERE
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.accentColor;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('● M U S A I C   P R E M I E R E', 540, 240);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '500 28px sans-serif';
      ctx.fillText(isArtist ? 'ОФИЦИАЛЬНЫЙ ПРОФИЛЬ' : (isAlbum ? 'НОВЫЙ АЛЬБОМ' : 'СИНГЛ / ТРЕК'), 540, 290);

      // 5. Titles
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 68px sans-serif';
      const cleanTitle = title.length > 24 ? title.slice(0, 22) + '...' : title;
      ctx.fillText(cleanTitle, 540, 1180);

      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 44px sans-serif';
      const sub = (artistName || cleanSubtitle || '').length > 32 ? (artistName || cleanSubtitle || '').slice(0, 30) + '...' : (artistName || cleanSubtitle || '');
      ctx.fillText(sub, 540, 1250);

      // 6. Sound wave graphics (vertical bars)
      const waveY = 1360;
      const waveHeights = [24, 45, 30, 60, 80, 52, 95, 70, 40, 65, 88, 55, 34, 48, 25];
      const startX = 540 - (waveHeights.length * 24) / 2;
      for (let i = 0; i < waveHeights.length; i++) {
        const barX = startX + i * 24;
        const h = waveHeights[i];
        ctx.fillStyle = i % 2 === 0 ? theme.accentColor : '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(barX, waveY - h / 2, 10, h, 5);
        } else {
          ctx.rect(barX, waveY - h / 2, 10, h);
        }
        ctx.fill();
      }

      // 7. Stats capsule
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(190, 1480, 700, 110, 55);
      } else {
        ctx.rect(190, 1480, 700, 110);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 36px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🔥 ${formatNumber(plays)} ${isArtist ? 'слушателей' : 'прослушиваний'}`, 240, 1550);

      if (score || releaseYear) {
        ctx.textAlign = 'right';
        ctx.fillStyle = theme.accentColor;
        ctx.fillText(score ? `★ ${score}/90` : `📅 ${releaseYear}`, 850, 1550);
      }

      // 8. Footer Watermark
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 28px sans-serif';
      ctx.fillText('Слушайте прямо сейчас на Musaic', 540, 1720);

      // Download trigger
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `musaic-story-${title.toLowerCase().replace(/[^a-zа-я0-9]/gi, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        showToast?.('Постер 9:16 сохранён на ваше устройство!');
      }, 'image/png');
    } catch (err) {
      console.error('Story export error', err);
      setIsExporting(false);
      showToast?.('Не удалось экспортировать постер');
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] z-10 animate-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full theme-bg-accent animate-pulse" />
            <h3 className="text-sm font-extrabold text-white">Поделиться в Story (9:16)</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 9:16 Card Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col items-center custom-scrollbar">
          <div className="w-[280px] sm:w-[310px] aspect-[9/16] rounded-3xl p-5 border border-white/15 bg-gradient-to-b from-[#11131c] via-[#0d0e14] to-black shadow-2xl flex flex-col justify-between relative overflow-hidden select-none">
            {/* Ambient Blob */}
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-35 pointer-events-none"
              style={{ background: theme.accentColor }}
            />

            {/* Card Header */}
            <div className="text-center relative z-10 pt-1">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                ● MUSAIC PREMIERE
              </span>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                {isArtist ? 'Официальный профиль' : (isAlbum ? 'Новый альбом' : 'Сингл / Трек')}
              </p>
            </div>

            {/* Central Artwork with Vinyl Behind */}
            <div className="relative w-full aspect-square flex items-center justify-center my-auto">
              {/* Vinyl Record */}
              <div className="absolute right-0 w-36 h-36 rounded-full bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center translate-x-4">
                <div className="w-28 h-28 rounded-full border border-white/5 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full theme-bg-accent flex items-center justify-center shadow-inner">
                    <div className="w-3.5 h-3.5 rounded-full bg-zinc-950" />
                  </div>
                </div>
              </div>

              {/* Cover Art */}
              <div className="relative z-10 w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-900 -translate-x-3">
                <CoverArt url={coverUrl} title={title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Titles & Soundwave */}
            <div className="relative z-10 text-center space-y-2 pb-1">
              <div className="space-y-0.5 px-2">
                <h4 className="text-base sm:text-lg font-black text-white truncate leading-tight tracking-tight">
                  {title}
                </h4>
                <p className="text-xs font-semibold theme-accent truncate">
                  {cleanSubtitle}
                </p>
              </div>

              {/* Mini Sound Wave Bars */}
              <div className="flex items-end justify-center gap-1 h-6 py-1">
                {[12, 22, 16, 26, 18, 14, 24, 20, 15, 22, 13].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`w-1 rounded-full ${i % 2 === 0 ? 'theme-bg-accent' : 'bg-white/60'} animate-pulse`}
                  />
                ))}
              </div>

              {/* Stats capsule */}
              <div className="mx-2 py-1.5 px-3 rounded-full bg-white/5 border border-white/10 flex items-center justify-between text-[10px] font-bold">
                <span className="text-white">🔥 {formatNumber(plays)}</span>
                <span className="theme-accent">{score ? `★ ${score}/90` : (releaseYear ? `${releaseYear}` : 'Musaic')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex flex-col gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadImage}
            className="w-full py-3 theme-bg-accent text-black font-extrabold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-98 hover:opacity-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isExporting ? 'Создание изображения...' : 'Скачать постер 9:16 (PNG)'}</span>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast?.('Ссылка скопирована!');
              }}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Скопировать ссылку</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TextTracklistParserModal: Smart Tracklist Parser from Plain Text ---

export const TextTracklistParserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsedTracks: Array<{
    title: string;
    featuredArtist?: string;
    duration: string;
    plays: number;
  }>) => void;
}> = ({ isOpen, onClose, onImport }) => {
  const [rawText, setRawText] = useState('');

  const parsedTracks = useMemo(() => {
    if (!rawText.trim()) return [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    return lines.map((line, idx) => {
      let clean = line;

      // 1. Strip leading track number: "1.", "01.", "1 -", "1) "
      clean = clean.replace(/^\s*\d+[\.\)\-\:]\s*/, '').trim();

      // 2. Extract duration if present (\d{1,2}:\d{2})
      let duration = '02:45';
      const durMatch = clean.match(/\b(\d{1,2}:\d{2})\b/);
      if (durMatch) {
        duration = durMatch[1].padStart(5, '0');
        clean = clean.replace(durMatch[0], '').trim();
      } else {
        const sec = 130 + ((idx * 27) % 75);
        const m = Math.floor(sec / 60);
        const s = (sec % 60).toString().padStart(2, '0');
        duration = `${m}:${s}`;
      }

      // 3. Extract plays if present (e.g. 1500000, 1.5M, 850k, 1 500 000)
      let plays = 500000 + ((idx * 170000) % 1800000);
      const playsMatch = clean.match(/\b(\d+[\s\d]*(?:\.\d+)?\s*[kKmMкКмМ]?)\b/);
      if (playsMatch) {
        const pStr = playsMatch[1].replace(/\s/g, '').toLowerCase();
        if (pStr.includes('m') || pStr.includes('м')) {
          plays = Math.round(parseFloat(pStr) * 1000000);
          clean = clean.replace(playsMatch[0], '').trim();
        } else if (pStr.includes('k') || pStr.includes('к')) {
          plays = Math.round(parseFloat(pStr) * 1000);
          clean = clean.replace(playsMatch[0], '').trim();
        } else if (parseInt(pStr) > 999) {
          plays = parseInt(pStr);
          clean = clean.replace(playsMatch[0], '').trim();
        }
      }

      // 4. Extract featured artists: "(feat. ...)", "(ft. ...)", "feat. ..."
      let featuredArtist = '';
      const featMatch = clean.match(/[\(\[]?(?:feat\.?|ft\.?|фит\.?)\s*([^\)\]]+)[\)\]]?/i);
      if (featMatch) {
        featuredArtist = featMatch[1].trim();
        clean = clean.replace(featMatch[0], '').trim();
      }

      // 5. Clean up title
      clean = clean.replace(/^[-\–\—\s]+|[-\–\—\s]+$/g, '').trim();
      const cleanTitle = clean || `Трек ${idx + 1}`;

      return {
        title: cleanTitle,
        featuredArtist: featuredArtist || undefined,
        duration,
        plays,
      };
    });
  }, [rawText]);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip) setRawText(prev => prev ? `${prev}\n${clip}` : clip);
      }
    } catch {
      // ignore clipboard error in strict sandbox
    }
  };

  const handleAddExample = (exampleLine: string) => {
    setRawText(prev => prev ? `${prev}\n${exampleLine}` : exampleLine);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#14151b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in">
        {/* Header matching Photo 2 aesthetic */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/20">
                ⚡ БЫСТРЫЙ ИМПОРТ
              </span>
              <h3 className="text-base font-extrabold text-white">Парсер треклиста текстом</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Вставьте список треков — названия, фиты, длительность и стримы распознаются автоматически</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Helper Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📋 Вставить из буфера</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddExample('1. Название трека 2:45')}
              className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5 font-semibold transition-all cursor-pointer"
            >
              + Пример: 1. Трек 2:45
            </button>
            <button
              type="button"
              onClick={() => handleAddExample('Ночной рейс (feat. Артист) 3:12 1.5M')}
              className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5 font-semibold transition-all cursor-pointer"
            >
              + Пример с фитом
            </button>
            {rawText && (
              <button
                type="button"
                onClick={() => setRawText('')}
                className="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 transition-all cursor-pointer ml-auto"
              >
                Очистить
              </button>
            )}
          </div>

          <div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs font-mono text-white placeholder:text-zinc-600 outline-none focus:border-white/25 transition-colors"
              placeholder={`Вставьте треклист сюда (каждый трек с новой строки)...\nНапример:\n1. Интро 1:45\n2. Название трека (feat. Артист) 2:54 1.2M\n3. Финальный трек 3:10`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-300">
                Распознано треков: <span className="theme-accent font-mono">{parsedTracks.length}</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Параметры подбираются на лету</span>
            </div>

            {parsedTracks.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-2xl bg-black/20">
                Здесь появится распознанный список треков после вставки текста
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/5 bg-black/30 divide-y divide-white/5 custom-scrollbar">
                {parsedTracks.map((pt, i) => (
                  <div key={i} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-zinc-500 font-mono text-center font-bold text-[11px]">{i + 1}</span>
                      <span className="font-bold text-white truncate">{pt.title}</span>
                      {pt.featuredArtist && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                          ft. {pt.featuredArtist}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 shrink-0 font-mono text-[11px]">
                      <span>{pt.duration}</span>
                      <span className="text-zinc-300 font-bold">{formatNumber(pt.plays)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/30 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={parsedTracks.length === 0}
            onClick={() => {
              onImport(parsedTracks);
              onClose();
            }}
            className="flex-1 py-3 theme-bg-accent text-black font-extrabold rounded-2xl text-xs transition-all shadow-xl hover:opacity-90 active:scale-98 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Импортировать {parsedTracks.length} треков
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


// --- TrackRow with Clickable Artists, Feat Support, Rating Badge and 3-Dots Action Menu ---

const TrackRowComponent: React.FC<{ 
  track: Track; 
  index: number; 
  toggleLike: (id: string) => void; 
  onPlay: () => void; 
  onTrackClick?: () => void;
  onArtworkClick?: () => void;
  onArtistClick?: (artistName: string, artistId?: string) => void;
  onMoreOptionsClick?: (track: Track) => void;
  isPlayingTrack?: boolean;
  hideStats?: boolean; 
  hideDuration?: boolean;
  size?: 'sm' | 'lg';
  albums?: Album[];
  artists?: Artist[];
  navigateTo?: (view: ViewType, params?: { id?: string; artistName?: string }) => void;
  chartDynamics?: ChartDynamics;
}> = ({ 
  track, 
  index, 
  toggleLike, 
  onPlay, 
  onTrackClick, 
  onArtworkClick, 
  onArtistClick, 
  onMoreOptionsClick, 
  isPlayingTrack, 
  hideStats, 
  hideDuration,
  size = 'sm',
  albums = [],
  artists = [],
  navigateTo,
  chartDynamics
}) => {
  const isLarge = size === 'lg';
  const resolvedCover = getTrackCover(track, albums);

  const gridColsClass = hideDuration
    ? (isLarge ? 'grid-cols-[36px_1fr_90px_36px] md:grid-cols-[40px_1fr_180px_40px]' : 'grid-cols-[30px_1fr_80px_32px] md:grid-cols-[36px_1fr_160px_36px]')
    : chartDynamics
      ? (isLarge ? 'grid-cols-[44px_1fr_40px_70px] md:grid-cols-[50px_1fr_180px_115px]' : 'grid-cols-[38px_1fr_40px_60px] md:grid-cols-[44px_1fr_155px_100px]')
      : (isLarge ? 'grid-cols-[36px_1fr_40px_70px] md:grid-cols-[40px_1fr_140px_120px]' : 'grid-cols-[30px_1fr_40px_60px] md:grid-cols-[36px_1fr_120px_100px]');

  return (
    <div
      onClick={() => {
        if (onTrackClick) onTrackClick();
        else onPlay();
      }}
      className={`group hover-outline-row grid ${gridColsClass} gap-3 md:gap-4 items-center ${isLarge ? 'px-3 md:px-4 py-2.5 md:py-3' : 'px-2 md:px-3 py-2 md:py-2.5'} rounded-xl md:rounded-2xl cursor-pointer border border-transparent active:scale-[0.996] active:bg-zinc-800/60 transition-transform duration-150`}
      style={{ borderRadius: `calc(1rem * var(--radius-factor))` }}
    >
      {/* Index or Play button */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 border border-transparent hover:border-white/15 active:scale-95 transition-all duration-300 delay-[35ms] cursor-pointer"
        title={isPlayingTrack ? "Воспроизводится" : "Воспроизвести трек"}
      >
        {isPlayingTrack ? (
          <div className="flex items-end gap-0.5 h-4 w-4">
            <span className="w-1 theme-bg-accent rounded-full animate-bounce h-3"></span>
            <span className="w-1 theme-bg-accent rounded-full animate-bounce h-4" style={{ animationDelay: '0.15s' }}></span>
            <span className="w-1 theme-bg-accent rounded-full animate-bounce h-2" style={{ animationDelay: '0.3s' }}></span>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center leading-none gap-0.5 group-hover:hidden">
              <span className={`${isLarge ? 'text-xs md:text-sm' : 'text-xs'} text-zinc-400 font-semibold tabular-nums`}>
                {index + 1}
              </span>
              {chartDynamics && <ChartTrendBadge dynamics={chartDynamics} compact />}
            </div>
            <Play className={`hidden group-hover:block ${isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} fill-white text-white ml-0.5`} />
          </>
        )}
      </div>
      
      {/* Artwork and Track Title / Artist */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <CoverArt 
          url={resolvedCover} 
          title={track.title}
          albumTitle={track.albumTitle}
          className={`${isLarge ? 'w-12 h-12 md:w-14 md:h-14' : 'w-11 h-11 md:w-12 md:h-12'} bg-zinc-800 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-white/5 hover-outline-media relative group/img cursor-pointer`}
          showZoomIcon={true}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
            <span className={`${isLarge ? 'text-sm md:text-[15px]' : 'text-xs md:text-sm'} hover-text-link font-extrabold tracking-tight truncate ${isPlayingTrack ? 'theme-accent' : track.isLiked ? 'theme-accent' : 'text-zinc-100'}`}>
              {track.title}
            </span>
            {track.isExplicit && <span className="bg-zinc-600/90 text-white text-[8px] md:text-[9px] font-bold px-1 rounded flex-shrink-0">E</span>}
            {track.rating && <RatingScoreBadge rating={track.rating} size="sm" />}
          </div>
          <div className={`${isLarge ? 'text-xs md:text-[13px]' : 'text-[11px] md:text-xs'} text-zinc-400 font-medium truncate mt-0.5`}>
            <span 
              onClick={(e) => {
                if (onArtistClick) {
                  e.stopPropagation();
                  onArtistClick(track.artistName, track.artistId);
                } else if (navigateTo) {
                  e.stopPropagation();
                  navigateTo('artist', { id: track.artistId, artistName: track.artistName });
                }
              }}
              className="hover-text-link text-zinc-300 cursor-pointer"
              title="Перейти к артисту"
            >
              {track.artistName}
            </span>
            {track.featuredArtist && (
              <FeaturedArtistsLinks 
                featuredArtist={track.featuredArtist} 
                excludeArtistName={track.artistName}
                artists={artists} 
                navigateTo={navigateTo || ((view, params) => { if (onArtistClick && params?.artistName) onArtistClick(params.artistName, params.id); })}
                className="ml-1"
              />
            )}
          </div>
        </div>
      </div>

      {/* Plays Count & Optional Truthful Peak */}
      <div className={`${isLarge ? 'text-xs md:text-sm' : 'text-xs'} text-zinc-400 text-right tabular-nums font-semibold ${hideDuration ? 'block' : 'hidden md:flex items-center justify-end gap-3'}`}>
        {chartDynamics?.peakRank && (
          <span className="text-[11px] font-medium text-zinc-500">Пик #{chartDynamics.peakRank}</span>
        )}
        <span>{!hideStats ? (hideDuration ? `${formatNumber(track.plays)} просл.` : formatNumber(track.plays)) : ''}</span>
      </div>

      {/* Heart, Duration & 3-Dots Menu */}
      <div className="flex items-center justify-end gap-2 md:gap-3">
        <Heart 
          onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
          className={`w-4 h-4 transition-all duration-200 hover:scale-125 cursor-pointer ${track.isLiked ? 'theme-accent fill-current opacity-100' : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white'}`} 
        />
        {!hideDuration && (
          <span className="text-zinc-400 text-xs md:text-sm font-medium tabular-nums">{track.duration}</span>
        )}
        {onMoreOptionsClick && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoreOptionsClick(track); }}
            className="p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer rounded-full hover:bg-white/10"
            title="Действия с треком"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const TrackRow = React.memo(TrackRowComponent);

// --- Settings Modal with Clear Separation: Text Size vs UI Scale vs Font Weight ---

const SettingsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  theme: ThemeConfig; 
  setTheme: (t: ThemeConfig) => void;
  isPlayerDismissed?: boolean;
  onTogglePlayerDismissed?: (dismissed: boolean) => void;
}> = ({ isOpen, onClose, theme, setTheme, isPlayerDismissed, onTogglePlayerDismissed }) => {
  if (!isOpen) return null;

  const update = (key: keyof ThemeConfig, val: any) => setTheme({ ...theme, [key]: val });

  const applyPreset = (preset: ThemePreset) => {
    setTheme(prev => ({
      ...prev,
      accentColor: preset.accentColor,
      bgColor: preset.bgColor,
      fontFamily: preset.fontFamily || prev.fontFamily,
      radiusFactor: preset.radiusFactor || prev.radiusFactor
    }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-black/30">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Оформление и дизайн</h2>
            <p className="text-xs font-semibold text-zinc-400 mt-1">Выбор внешнего вида (Современный Liquid Glass / Классический Musaic), цветовых тем и шрифтов</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
          {/* Main Design Mode Switcher */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Режим дизайна
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                1-клик переключение
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: NextGen Liquid Glass Style */}
              <button
                type="button"
                onClick={() => update('designMode', 'nextGen')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                  theme.designMode === 'nextGen'
                    ? 'border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                    : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-black text-white">Современный (Liquid Glass)</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Новый стиль
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Мягкий премиальный интерфейс: полупрозрачное размытие стеклоблоков, градиенты, плавный подъём карточек и оптимизированная типографика.
                </p>
              </button>

              {/* Option 2: Classic Musaic Style */}
              <button
                type="button"
                onClick={() => update('designMode', 'classic')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                  theme.designMode === 'classic'
                    ? 'border-white/80 bg-white/10 shadow-lg ring-1 ring-white/20'
                    : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-zinc-400" />
                    <span className="text-sm font-black text-white">Классический Musaic</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                    Оригинал
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Привычный оригинальный интерфейс. Все блоки и расположение элементов остаются ровно такими, как были раньше.
                </p>
              </button>
            </div>
          </section>

          {/* Visual Sub-options */}
          <section className="space-y-3.5 p-5 rounded-2xl bg-black/40 border border-white/10">
            <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 theme-accent" /> Опции визуализации
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* 1. Play Queue Drawer */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors">
                <div className="pr-2">
                  <p className="text-xs font-bold text-white">Боковая панель очереди</p>
                  <p className="text-[10px] text-zinc-400">Остров Play Queue справа</p>
                </div>
                <input
                  type="checkbox"
                  checked={theme.enableQueuePanel}
                  onChange={(e) => update('enableQueuePanel', e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                />
              </label>

              {/* 2. Hover Animations */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors">
                <div className="pr-2">
                  <p className="text-xs font-bold text-white">Плавные эффекты при наведении</p>
                  <p className="text-[10px] text-zinc-400">Мягкий подъём и свечение карточек</p>
                </div>
                <input
                  type="checkbox"
                  checked={theme.enableCardHoverAnim}
                  onChange={(e) => update('enableCardHoverAnim', e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                />
              </label>

              {/* 3. Audio Player Bar Visibility */}
              {onTogglePlayerDismissed && (
                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors sm:col-span-2">
                  <div className="pr-2">
                    <p className="text-xs font-bold text-white">Нижний аудиоплеер</p>
                    <p className="text-[10px] text-zinc-400">Отображать нижнюю панель плеера и плавающую капсулу</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!isPlayerDismissed}
                    onChange={(e) => onTogglePlayerDismissed(!e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                  />
                </label>
              )}
            </div>

            {/* Pages appearance */}
            <div className="pt-2">
              <label className="text-xs font-bold text-zinc-300 block mb-2">Страницы</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'coverColorPages', title: 'Цвет из обложки', desc: 'Фон и акцент страниц подстраиваются под обложку' },
                  { key: 'artistHero', title: 'Большая шапка артиста', desc: 'Фото на всю ширину, параллакс и компактная панель' },
                  { key: 'albumHero', title: 'Большая шапка альбома', desc: 'Крупная обложка и размытый фон из неё' },
                  { key: 'smoothTransitions', title: 'Плавные переходы', desc: 'Анимация при смене страниц и параллакс' },
                ] as Array<{ key: keyof ThemeConfig; title: string; desc: string }>).map(opt => (
                  <label key={opt.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors">
                    <div className="pr-2">
                      <p className="text-xs font-bold text-white">{opt.title}</p>
                      <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={theme[opt.key] !== false}
                      onChange={(e) => update(opt.key, e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs font-bold text-white mb-2">Стиль шапки артиста</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'cinema', label: 'Кино', desc: 'Фото на всю ширину' },
                      { id: 'poster', label: 'Постер', desc: 'Фото целиком' },
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => update('artistHeroStyle', s.id)}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                          (theme.artistHeroStyle || 'cinema') === s.id ? 'border-white bg-white/15 text-white' : 'border-white/5 bg-black/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{s.label}</span>
                        <span className="text-[9px] text-zinc-400 block">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs font-bold text-white mb-2">Режим шрифтов</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'classic', label: 'Как было', desc: 'Ваш шрифт', font: 'inherit' },
                      { id: 'modern', label: 'Современный', desc: 'Onest + Inter Tight', font: "'Inter Tight', sans-serif" },
                      { id: 'editorial', label: 'Редакция', desc: 'Golos + Geologica', font: "'Geologica', sans-serif" },
                      { id: 'display', label: 'Широкий', desc: 'Manrope + Unbounded', font: "'Unbounded', sans-serif" },
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => update('typographyMode', s.id)}
                        className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                          (theme.typographyMode || 'classic') === s.id ? 'border-white bg-white/15 text-white' : 'border-white/5 bg-black/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block" style={{ fontFamily: s.font }}>{s.label}</span>
                        <span className="text-[9px] text-zinc-400 block">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Surface Style */}
            <div className="pt-2">
              <label className="text-xs font-bold text-zinc-300 block mb-2">Стиль поверхностей</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'glass', label: 'Liquid Glass', desc: 'Стекло и размытие' },
                  { id: 'matte', label: 'Matte Noir', desc: 'Глубокий матовый оникс' },
                  { id: 'glow', label: 'Soft Glow', desc: 'Контурное свечение' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update('cardStyle', s.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      theme.cardStyle === s.id
                        ? 'border-white bg-white/15 text-white font-black shadow-md'
                        : 'border-white/5 bg-black/30 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{s.label}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Gradient & Pattern Option */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">Фоновые градиенты и режим свечения</label>
                <span className="text-[10px] text-zinc-400">Классический или адаптивный под обложку и экран</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'aurora', label: 'Аврора (Как было)', desc: 'Оригинальный спокойный градиент' },
                  { id: 'animated', label: 'Живой адаптивный ✨', desc: 'Подстраивается под обложку и меню' },
                  { id: 'mesh', label: 'Шелковая вуаль', desc: 'Многослойный глубокий перелив' },
                  { id: 'radial', label: 'Радиальный', desc: 'Мягкий центральный ореол' },
                  { id: 'subtle', label: 'Минимал', desc: 'Легкое свечение сверху' },
                  { id: 'none', label: 'Отключено', desc: 'Чистый темный фон' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update('bgGradientPattern', p.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      (theme.bgGradientPattern || 'aurora') === p.id
                        ? 'border-white bg-white/15 text-white font-black shadow-md'
                        : 'border-white/5 bg-black/30 text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs font-bold block">{p.label}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 cursor-pointer transition-all">
                <div className="pr-3">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 theme-accent" />
                    <span>Адаптивный живой градиент (Под цвет обложки и экрана)</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Плавно переливается и окрашивает фон, боковое меню и плеер в цвета текущей обложки и открытого раздела
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={theme.bgGradientPattern === 'animated'}
                  onChange={(e) => {
                    update('bgGradientPattern', e.target.checked ? 'animated' : 'aurora');
                  }}
                  className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer shrink-0"
                />
              </label>
            </div>
          </section>

          {/* One-Click Presets */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 theme-accent" /> Готовые цветовые темы
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEME_PRESETS.map((p) => {
                const isActive = theme.bgColor === p.bgColor && theme.accentColor === p.accentColor;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1.5 transition-all cursor-pointer text-left ${
                      isActive 
                        ? 'border-white bg-white/10 shadow-lg scale-102 ring-1 ring-white/30' 
                        : 'border-white/5 bg-black/30 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0" style={{ backgroundColor: p.accentColor }}></div>
                      <span className="text-xs font-bold text-white truncate">{p.name}</span>
                    </div>
                    {p.desc && <span className="text-[10px] text-zinc-400 line-clamp-1">{p.desc}</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Typography: Font Family, Font Size & Font Weight */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Type className="w-4 h-4 text-sky-400" /> Типографика и шрифты
            </div>
            
            {/* Font Family Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Гарнитура шрифта (Семейство)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_FONTS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => update('fontFamily', f.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      theme.fontFamily === f.id
                        ? 'border-white bg-white/10 shadow-sm'
                        : 'border-white/5 bg-black/30 hover:bg-white/5'
                    }`}
                  >
                    <p className="text-xs font-bold text-white" style={{ fontFamily: f.id }}>{f.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dedicated Text Font Scale */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-black/30 border border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-300">Размер шрифта текста ({Math.round(theme.textScale * 100)}%)</label>
                <span className="text-[11px] text-zinc-500">Меняет величину букв по сайту</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '90% Мелкий', val: 0.9 },
                  { label: '100% Стандарт', val: 1.0 },
                  { label: '115% Крупный', val: 1.15 },
                  { label: '130% Большой', val: 1.3 },
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => update('textScale', item.val)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      Math.abs(theme.textScale - item.val) < 0.04
                        ? 'border-white bg-white text-black'
                        : 'border-white/5 bg-black/40 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="0.80"
                max="1.40"
                step="0.01"
                value={theme.textScale}
                onChange={(e) => update('textScale', parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer mt-1"
              />
            </div>

            {/* Dedicated Font Weight Setting */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-black/30 border border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-300">Жирность шрифта (Font Weight: {theme.fontWeight})</label>
                <span className="text-[11px] text-zinc-500">Толщина начертания текста</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Обычный', val: 400 },
                  { label: 'Средний', val: 500 },
                  { label: 'Полужирный', val: 600 },
                  { label: 'Жирный', val: 700 },
                  { label: 'Экстра', val: 800 },
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => update('fontWeight', item.val)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      theme.fontWeight === item.val
                        ? 'border-white bg-white text-black'
                        : 'border-white/5 bg-black/40 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="300"
                max="900"
                step="50"
                value={theme.fontWeight}
                onChange={(e) => update('fontWeight', parseInt(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer mt-1"
              />
            </div>
          </section>

          {/* Interface Scale (UI and Spacing) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Maximize className="w-4 h-4 text-emerald-400" /> Масштаб интерфейса (UI и элементы)
            </div>
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-300">Плотность сетки и отступы ({Math.round(theme.uiScale * 100)}%)</span>
                <span className="text-zinc-500 font-normal">Увеличивает или сжимает карточки и блоки</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '85% Компакт', val: 0.85 },
                  { label: '100% Стандарт', val: 1.0 },
                  { label: '115% Просторный', val: 1.15 },
                  { label: '130% Крупный', val: 1.3 },
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => update('uiScale', item.val)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      Math.abs(theme.uiScale - item.val) < 0.04
                        ? 'border-white bg-white text-black'
                        : 'border-white/5 bg-black/40 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="0.8"
                max="1.35"
                step="0.05"
                value={theme.uiScale}
                onChange={(e) => update('uiScale', parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer mt-1"
              />
            </div>
          </section>

          {/* Colors */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Palette className="w-4 h-4 text-emerald-400" /> Цветовая палитра
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Основной акцент</label>
                <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <input type="color" value={theme.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="w-9 h-9 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                  <span className="text-xs font-mono font-bold">{theme.accentColor.toUpperCase()}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Цвет фона</label>
                <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <input type="color" value={theme.bgColor} onChange={(e) => update('bgColor', e.target.value)} className="w-9 h-9 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                  <span className="text-xs font-mono font-bold">{theme.bgColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Visual Elements */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-purple-400" /> Геометрия и эффекты
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Скругление углов</span>
                  <span className="text-white">{theme.radiusFactor.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.2" max="2.0" step="0.1" value={theme.radiusFactor} onChange={(e) => update('radiusFactor', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Размытие фона (Blur)</span>
                  <span className="text-white">{theme.blurIntensity}px</span>
                </div>
                <input type="range" min="0" max="40" step="2" value={theme.blurIntensity} onChange={(e) => update('blurIntensity', parseInt(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
            </div>

            {/* Mono Font Selection */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-zinc-400">Моноширинный шрифт (код, данные)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "'Geist Mono', 'JetBrains Mono', monospace", name: 'Geist Mono', desc: 'Пара к Geist, идеальная' },
                  { id: "'JetBrains Mono', monospace", name: 'JetBrains Mono', desc: 'Классика для кода' },
                  { id: "'Fira Code', monospace", name: 'Fira Code', desc: 'С лигатурами' },
                  { id: "'IBM Plex Mono', monospace", name: 'IBM Plex Mono', desc: 'Технический, широкий' },
                  { id: "'Space Mono', monospace", name: 'Space Mono', desc: 'Геометричный, rétro' },
                  { id: "'Cascadia Code', monospace", name: 'Cascadia Code', desc: 'Современный, Windows Terminal' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => update('fontMono', f.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      theme.fontMono === f.id
                        ? 'border-white bg-white/10 shadow-sm'
                        : 'border-white/5 bg-black/30 hover:bg-white/5'
                    }`}
                  >
                    <p className="text-xs font-bold text-white" style={{ fontFamily: f.id }}>{f.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Межбуквенный интервал</span>
                <span className="text-white">{theme.letterSpacing.toFixed(3)}em</span>
              </div>
              <input type="range" min="-0.05" max="0.05" step="0.005" value={theme.letterSpacing} onChange={(e) => update('letterSpacing', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
            </div>
          </section>

          {/* Motion & Animation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Wind className="w-4 h-4 text-sky-400" /> Анимация и движение
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors">
                <div className="pr-2">
                  <p className="text-xs font-bold text-white">Параллакс на карточках</p>
                  <p className="text-[10px] text-zinc-400">Тонкий 3D-эффект при движении мыши</p>
                </div>
                <input
                  type="checkbox"
                  checked={theme.enableParallax}
                  onChange={(e) => update('enableParallax', e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors">
                <div className="pr-2">
                  <p className="text-xs font-bold text-white">Уважать reduced-motion</p>
                  <p className="text-[10px] text-zinc-400">Отключить анимации при настройке ОС</p>
                </div>
                <input
                  type="checkbox"
                  checked={theme.enableReducedMotion}
                  onChange={(e) => update('enableReducedMotion', e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                />
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Скорость анимаций</span>
                <span className="text-white">{theme.animationSpeed.toFixed(1)}s</span>
              </div>
              <input type="range" min="0.1" max="0.8" step="0.05" value={theme.animationSpeed} onChange={(e) => update('animationSpeed', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-zinc-300 block mb-2">Стиль фона</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'aurora', label: 'Аврора', desc: 'Два цветовых ореола' },
                  { id: 'radial', label: 'Радиальный', desc: 'Центральное свечение' },
                  { id: 'mesh', label: 'Сетка', desc: 'Тонкая градиентная сетка' },
                  { id: 'animated', label: 'Анимированный', desc: 'Плавно двигающиеся блобы' },
                  { id: 'none', label: 'Отключено', desc: 'Чистый фон' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update('bgGradientPattern', p.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      (theme.bgGradientPattern || 'aurora') === p.id
                        ? 'border-white bg-white/15 text-white font-black shadow-md'
                        : 'border-white/5 bg-black/30 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{p.label}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Advanced Visual Controls */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-400" /> Продвинутая настройка
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Интенсивность границ</span>
                  <span className="text-white">{Math.round(theme.borderIntensity * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={theme.borderIntensity} onChange={(e) => update('borderIntensity', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Глубина теней</span>
                  <span className="text-white">{Math.round(theme.shadowDepth * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={theme.shadowDepth} onChange={(e) => update('shadowDepth', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Насыщенность цветов</span>
                  <span className="text-white">{theme.saturation.toFixed(1)}x</span>
                </div>
                <input type="range" min="0" max="1.5" step="0.05" value={theme.saturation} onChange={(e) => update('saturation', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Контраст</span>
                  <span className="text-white">{theme.contrast.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.8" max="1.2" step="0.02" value={theme.contrast} onChange={(e) => update('contrast', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
            </div>
          </section>

          {/* Colors */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Palette className="w-4 h-4 text-emerald-400" /> Цветовая палитра
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Основной акцент</label>
                <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <input type="color" value={theme.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="w-9 h-9 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                  <span className="text-xs font-mono font-bold">{theme.accentColor.toUpperCase()}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Цвет фона</label>
                <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <input type="color" value={theme.bgColor} onChange={(e) => update('bgColor', e.target.value)} className="w-9 h-9 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                  <span className="text-xs font-mono font-bold">{theme.bgColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Visual Elements */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-purple-400" /> Геометрия и эффекты
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Скругление углов</span>
                  <span className="text-white">{theme.radiusFactor.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.2" max="2.0" step="0.1" value={theme.radiusFactor} onChange={(e) => update('radiusFactor', parseFloat(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Размытие фона (Blur)</span>
                  <span className="text-white">{theme.blurIntensity}px</span>
                </div>
                <input type="range" min="0" max="40" step="2" value={theme.blurIntensity} onChange={(e) => update('blurIntensity', parseInt(e.target.value))} className="w-full accent-[var(--accent-color)] cursor-pointer" />
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 md:p-8 border-t border-white/5 bg-black/40 flex gap-3">
          <button 
            onClick={() => setTheme(DEFAULT_THEME)} 
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Сбросить по умолчанию
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Adaptive Cover & Screen Color Extraction Engine ---
const coverPaletteCache = new Map<string, [string, string, string, string]>();

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const hslToHex = (h: number, s: number, l: number): string => {
  const normH = ((h % 360) + 360) % 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normL = Math.max(0, Math.min(100, l)) / 100;
  const a = normS * Math.min(normL, 1 - normL);
  const f = (n: number) => {
    const k = (n + normH / 30) % 12;
    const color = normL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const generateSeedPalette = (seedStr: string, baseAccent: string): [string, string, string, string] => {
  let hash = 0;
  const clean = seedStr || 'musaic';
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const h1 = absHash % 360;
  const h2 = (h1 + 52 + (absHash % 35)) % 360;
  const h3 = (h1 + 145 + (absHash % 40)) % 360;
  const h4 = (h1 + 230) % 360;
  return [
    hslToHex(h1, 78, 56),
    hslToHex(h2, 74, 54),
    hslToHex(h3, 70, 52),
    baseAccent || hslToHex(h4, 76, 58),
  ];
};

const extractPaletteFromImageUrl = (
  resolvedUrl: string,
  fallback: [string, string, string, string]
): Promise<[string, string, string, string]> => {
  if (!resolvedUrl) return Promise.resolve(fallback);
  const cached = coverPaletteCache.get(resolvedUrl);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    if (!resolvedUrl.startsWith('data:')) {
      img.crossOrigin = 'Anonymous';
    }
    const timeoutId = setTimeout(() => resolve(fallback), 2500);

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        const size = 28;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Collect vibrant candidate HSL colors across image regions
        const candidates: Array<{ h: number; s: number; l: number; weight: number }> = [];
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          const [h, s, l] = rgbToHsl(r, g, b);
          // Favor pixels that aren't pure black or pure white
          if (l < 10 || l > 92) continue;
          const vibrancyWeight = (s + 20) * (1 - Math.abs(l - 52) / 65);
          candidates.push({ h, s, l, weight: vibrancyWeight });
        }

        if (candidates.length === 0) {
          coverPaletteCache.set(resolvedUrl, fallback);
          resolve(fallback);
          return;
        }

        candidates.sort((a, b) => b.weight - a.weight);
        const picked: Array<{ h: number; s: number; l: number }> = [];

        for (const cand of candidates) {
          if (picked.length >= 4) break;
          const isDistinct = picked.every(p => {
            const diff = Math.min(Math.abs(p.h - cand.h), 360 - Math.abs(p.h - cand.h));
            return diff >= 32;
          });
          if (isDistinct) {
            picked.push({
              h: cand.h,
              s: Math.max(62, Math.min(90, cand.s + 14)),
              l: Math.max(48, Math.min(64, cand.l < 45 ? cand.l + 18 : cand.l)),
            });
          }
        }

        // Fill remaining slots with harmonious analog/triadic shifts from primary
        const baseH = picked[0]?.h ?? 160;
        while (picked.length < 4) {
          const idx = picked.length;
          picked.push({
            h: (baseH + idx * 68) % 360,
            s: 74,
            l: 55,
          });
        }

        const palette: [string, string, string, string] = [
          hslToHex(picked[0].h, picked[0].s, picked[0].l),
          hslToHex(picked[1].h, picked[1].s, picked[1].l),
          hslToHex(picked[2].h, picked[2].s, picked[2].l),
          hslToHex(picked[3].h, picked[3].s, picked[3].l),
        ];
        coverPaletteCache.set(resolvedUrl, palette);
        resolve(palette);
      } catch {
        resolve(fallback);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(fallback);
    };

    img.src = resolvedUrl;
  });
};

// --- Animated Blobs Background Component (Memoized outside App to prevent remount flashes) ---
const AnimatedBlobs = React.memo(({ accentColor }: { accentColor: string }) => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    <motion.div
      className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[150px] opacity-20"
      style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
      animate={{ scale: [1, 1.12, 1], x: [0, 25, 0], y: [0, 15, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[160px] opacity-16"
      style={{ background: `radial-gradient(circle, #60a5fa 0%, transparent 70%)` }}
      animate={{ scale: [1, 1.08, 1], x: [0, -20, 0], y: [0, -15, 0] }}
      transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
    <motion.div
      className="absolute bottom-[15%] left-1/3 w-[45vw] h-[45vw] rounded-full blur-[160px] opacity-12"
      style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
      animate={{ scale: [1, 1.07, 1], y: [0, -18, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
    />
  </div>
));

// --- Adaptive Multi-Color Animated Ambient Gradient Mode (Reacts to Cover Art, Active Screen & Playback) ---
const AnimatedAmbientFlow = React.memo(({
  palette,
  isPlaying
}: {
  palette: [string, string, string, string];
  isPlaying?: boolean;
}) => {
  const [c1, c2, c3, c4] = palette;
  const speedFactor = isPlaying ? 0.8 : 1;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Top-down atmospheric veil that smoothly morphs with current cover & screen */}
      <div
        className="absolute inset-0 opacity-90 transition-all duration-[1500ms] ease-out"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 22% 0%, ${c1}2e 0%, transparent 68%),
            radial-gradient(ellipse 80% 60% at 88% 18%, ${c2}24 0%, transparent 68%),
            radial-gradient(ellipse 85% 65% at 50% 100%, ${c3}20 0%, transparent 72%)
          `
        }}
      />

      {/* Primary Cover Color Orb (Top-Left / Center Drift) */}
      <motion.div
        className="absolute -top-[18%] -left-[10%] w-[64vw] h-[64vw] rounded-full blur-[155px] opacity-[0.24] transition-colors duration-[1500ms]"
        style={{
          background: `radial-gradient(circle, ${c1} 0%, ${c2}40 45%, transparent 72%)`,
          transition: 'background 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        animate={{
          scale: [1, 1.12, 0.96, 1],
          x: [0, 45, -20, 0],
          y: [0, 28, -12, 0],
        }}
        transition={{ duration: 24 * speedFactor, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary Cover/Menu Color Orb (Right Drift) */}
      <motion.div
        className="absolute top-[18%] -right-[14%] w-[58vw] h-[58vw] rounded-full blur-[165px] opacity-[0.20] transition-colors duration-[1500ms]"
        style={{
          background: `radial-gradient(circle, ${c2} 0%, ${c3}35 48%, transparent 72%)`,
          transition: 'background 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        animate={{
          scale: [1, 0.93, 1.1, 1],
          x: [0, -40, 20, 0],
          y: [0, -30, 18, 0],
        }}
        transition={{ duration: 28 * speedFactor, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Tertiary Atmospheric Orb (Bottom-Left / Center-Bottom Drift) */}
      <motion.div
        className="absolute -bottom-[16%] left-[12%] w-[55vw] h-[55vw] rounded-full blur-[165px] opacity-[0.18] transition-colors duration-[1500ms]"
        style={{
          background: `radial-gradient(circle, ${c3} 0%, ${c4}30 48%, transparent 72%)`,
          transition: 'background 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        animate={{
          scale: [1, 1.09, 0.95, 1],
          x: [0, 30, -28, 0],
          y: [0, -24, 14, 0],
        }}
        transition={{ duration: 26 * speedFactor, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Fourth Accent Highlight Orb (Center / Floating) */}
      <motion.div
        className="absolute top-[38%] left-[32%] w-[44vw] h-[44vw] rounded-full blur-[170px] opacity-[0.14] transition-colors duration-[1500ms]"
        style={{
          background: `radial-gradient(circle, ${c4} 0%, ${c1}25 50%, transparent 70%)`,
          transition: 'background 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        animate={{
          scale: [0.95, 1.12, 0.98, 0.95],
          x: [0, -25, 30, 0],
          y: [0, 22, -20, 0],
        }}
        transition={{ duration: 22 * speedFactor, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
    </div>
  );
});

// --- Main App ---

// Stable sidebar item: keeps hover/active transitions smooth (no remount on every App render)
const sidebarItemImplRef: { current: ((props: any) => React.ReactElement | null) | null } = { current: null };
const SidebarItem = (props: any) => (sidebarItemImplRef.current ? sidebarItemImplRef.current(props) : null);

export default function App() {
  const [nav, setNav] = useState<NavigationState>({ view: 'home' });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  useEffect(() => { setTitleGenCatalog({ artists, tracks, albums }); }, [artists, tracks, albums]);
  useEffect(() => { setArtistAwardsSource(awards as any); }, [awards]);
  const [history, setHistory] = useState<Array<NavigationState & { scrollY: number }>>([]);
  const [forwardHistory, setForwardHistory] = useState<Array<NavigationState & { scrollY: number }>>([]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [appToast, setAppToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 3000);
  };
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  // Interactive player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerHidden, setIsPlayerHidden] = useState(false);
  const [isPlayerDismissed, setIsPlayerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('musaic_player_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleSetPlayerDismissed = (dismissed: boolean) => {
    setIsPlayerDismissed(dismissed);
    try {
      localStorage.setItem('musaic_player_dismissed', dismissed ? 'true' : 'false');
    } catch {}
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);
  const [enlargedMedia, setEnlargedMedia] = useState<{ url: string; title: string; subtitle?: string; type?: string } | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0); // percentage for scrubber
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Simulation Mode Isolated State (Never mutates musaic_master_db) ---
  const [simState, setSimState] = useState<SimState | null>(null);
  const [simSaveSlots, setSimSaveSlots] = useState<SimSaveSlot[]>([]);
  const [isSimStartOpen, setIsSimStartOpen] = useState(false);
  const [isSimConsoleOpen, setIsSimConsoleOpen] = useState(false);
  const [isSimBarHidden, setIsSimBarHidden] = useState(false);
  const [simConsoleTab, setSimConsoleTab] = useState<SimModeType | 'radar' | 'digest'>('semi');
  const [simInitWeekly, setSimInitWeekly] = useState<{ open: boolean; weekNumber: number | null }>({ open: false, weekNumber: null });
  const [pendingSimReturn, setPendingSimReturn] = useState<{
    returnHistoryLen: number;
    tab: SimModeType | 'radar' | 'digest';
    openWeeklyDrops: boolean;
    weekNumber: number | null;
  } | null>(null);

  const isSimMode = Boolean(simState?.isActive);
  const simActiveDate = simState?.currentDate || '';

  const viewArtists = isSimMode ? simState!.artists : artists;
  const viewAllAlbums = isSimMode ? simState!.albums : albums;
  const viewAllTracks = isSimMode ? simState!.tracks : tracks;
  const viewAwards = isSimMode ? simState!.awards : awards;

  const viewAlbums = useMemo(() => {
    if (!isSimMode) return viewAllAlbums;
    return viewAllAlbums.filter(al => (al.releaseDate || `${al.releaseYear || 2020}-01-01`) <= simActiveDate);
  }, [isSimMode, viewAllAlbums, simActiveDate]);

  const viewTracks = useMemo(() => {
    if (!isSimMode) return viewAllTracks;
    return viewAllTracks.filter(t => (t.releaseDate || '1900-01-01') <= simActiveDate);
  }, [isSimMode, viewAllTracks, simActiveDate]);

  const activeSetArtists: React.Dispatch<React.SetStateAction<Artist[]>> = (updater) => {
    if (isSimMode) {
      setSimState(prev => prev ? ({
        ...prev,
        artists: typeof updater === 'function' ? updater(prev.artists) : updater
      }) : prev);
    } else {
      setArtists(updater);
    }
  };

  const activeSetAlbums: React.Dispatch<React.SetStateAction<Album[]>> = (updater) => {
    if (isSimMode) {
      setSimState(prev => prev ? ({
        ...prev,
        albums: typeof updater === 'function' ? updater(prev.albums) : updater
      }) : prev);
    } else {
      setAlbums(updater);
    }
  };

  const activeSetTracks: React.Dispatch<React.SetStateAction<Track[]>> = (updater) => {
    if (isSimMode) {
      setSimState(prev => prev ? ({
        ...prev,
        tracks: typeof updater === 'function' ? updater(prev.tracks) : updater
      }) : prev);
    } else {
      setTracks(updater);
    }
  };
  
  // Modals and 3-dots action menu state
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [actionMenuTarget, setActionMenuTarget] = useState<{
    type: 'track' | 'album' | 'artist';
    item: Track | Album | Artist;
  } | null>(null);
  const [addToAlbumTrack, setAddToAlbumTrack] = useState<Track | null>(null);
  const [quickRatingTarget, setQuickRatingTarget] = useState<{
    type: 'track' | 'album';
    item: Track | Album;
  } | null>(null);
  const [storyTarget, setStoryTarget] = useState<{
    type: 'track' | 'album' | 'artist';
    item: Track | Album | Artist;
  } | null>(null);

  const handleSaveQuickRating = (rating: RatingData | undefined) => {
    if (!quickRatingTarget) return;
    if (quickRatingTarget.type === 'track') {
      handleSaveEditedTrack({ ...quickRatingTarget.item as Track, rating });
    } else {
      handleSaveEditedAlbum({ ...quickRatingTarget.item as Album, rating });
    }
  };

  const handleSaveEditedTrack = (updatedTrack: Track) => {
    activeSetTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
    if (currentTrack && currentTrack.id === updatedTrack.id) {
      setCurrentTrack(updatedTrack);
    }
  };

  const handleSaveEditedAlbum = (updatedAlbum: Album) => {
    activeSetAlbums(prev => prev.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
    activeSetTracks(prev => prev.map(t => {
      const isChild = t.albumId === updatedAlbum.id || 
                      (t.albumTitle && t.albumTitle.toLowerCase() === updatedAlbum.title.toLowerCase());
      if (isChild) {
        return { 
          ...t, 
          albumId: updatedAlbum.id,
          albumTitle: updatedAlbum.title,
          coverUrl: updatedAlbum.coverUrl || t.coverUrl 
        };
      }
      return t;
    }));
  };

  const handleSaveAlbumValue = (albumId: string, valueRating: AlbumValueRating) => {
    activeSetAlbums(prev => prev.map(a => a.id === albumId ? { ...a, albumValue: valueRating } : a));
  };

  const handleSaveEditedArtist = (updatedArtist: Artist) => {
    activeSetArtists(prev => prev.map(a => a.id === updatedArtist.id ? updatedArtist : a));
    activeSetTracks(prev => prev.map(t => t.artistId === updatedArtist.id ? { ...t, artistName: updatedArtist.name } : t));
    activeSetAlbums(prev => prev.map(a => a.artistId === updatedArtist.id ? { ...a, artistName: updatedArtist.name } : a));
  };

  const handleDeleteItem = (type: 'track' | 'album' | 'artist', id: string) => {
    if (type === 'track') {
      activeSetTracks(prev => prev.filter(t => t.id !== id));
      if (currentTrack?.id === id) setCurrentTrack(null);
    } else if (type === 'album') {
      activeSetAlbums(prev => prev.filter(a => a.id !== id));
      activeSetTracks(prev => prev.map(t => t.albumId === id ? { ...t, albumId: 'single', albumTitle: 'Single' } : t));
    } else if (type === 'artist') {
      activeSetArtists(prev => prev.filter(a => a.id !== id));
    }
  };

  // Move an existing track into an album at a chosen position (keeps the same track: plays, likes, rating, charts)
  const handleAddTrackToAlbum = (trackId: string, albumId: string, beforeTrackId: string | null) => {
    const targetAlbum = viewAlbums.find(a => a.id === albumId);
    const moving = viewTracks.find(t => t.id === trackId);
    if (!targetAlbum || !moving) return;
    const cover = getAlbumCoverUrl(targetAlbum);
    const prevAlbumId = moving.albumId;
    const prevAlbumHasOthers = !!prevAlbumId && viewTracks.some(t => t.id !== trackId && t.albumId === prevAlbumId);
    activeSetTracks(prev => {
      const original = prev.find(t => t.id === trackId);
      if (!original) return prev;
      const without = prev.filter(t => t.id !== trackId);
      const updated: Track = {
        ...original,
        albumId: targetAlbum.id,
        albumTitle: targetAlbum.title,
        coverUrl: cover || original.coverUrl,
        ...({ previousAlbumId: original.albumId, previousCoverUrl: original.coverUrl } as any)
      };
      let insertAt = beforeTrackId ? without.findIndex(t => t.id === beforeTrackId) : -1;
      if (insertAt < 0) {
        let lastIdx = -1;
        without.forEach((t, i) => { if (t.albumId === targetAlbum.id) lastIdx = i; });
        insertAt = lastIdx >= 0 ? lastIdx + 1 : without.length;
      }
      const next = [...without];
      next.splice(insertAt, 0, updated);
      return next;
    });
    // The track no longer shows as a separate single release
    if (prevAlbumId && prevAlbumId !== 'single' && prevAlbumId !== targetAlbum.id && !prevAlbumHasOthers) {
      activeSetAlbums(prev => prev.filter(a => a.id !== prevAlbumId));
    }
    if (currentTrack?.id === trackId) {
      setCurrentTrack(prev => prev ? { ...prev, albumId: targetAlbum.id, albumTitle: targetAlbum.title, coverUrl: cover || prev.coverUrl } : prev);
    }
    showToast(`«${moving.title}» теперь в альбоме «${targetAlbum.title}»`);
  };

  const handleSaveAward = (award: AwardItem) => {
    if (isSimMode) {
      setSimState(prev => {
        if (!prev) return prev;
        const exists = prev.awards.some(a => a.id === award.id);
        const updated = exists ? prev.awards.map(a => a.id === award.id ? award : a) : [award, ...prev.awards];
        return { ...prev, awards: updated };
      });
      return;
    }
    setAwards(prev => {
      const exists = prev.some(a => a.id === award.id);
      const updated = exists ? prev.map(a => a.id === award.id ? award : a) : [award, ...prev];
      dbSet('musaic_awards_db', updated).catch(console.error);
      return updated;
    });
  };

  const handleDeleteAward = (awardId: string) => {
    if (isSimMode) {
      setSimState(prev => prev ? ({ ...prev, awards: prev.awards.filter(a => a.id !== awardId) }) : prev);
      return;
    }
    setAwards(prev => {
      const updated = prev.filter(a => a.id !== awardId);
      dbSet('musaic_awards_db', updated).catch(console.error);
      return updated;
    });
  };

  // --- Simulation Mode Action Handlers ---
  const handleStartSimulation = (startDate: string, futurePolicy: SimFuturePolicy) => {
    const initial = computeInitialSimSnapshot(artists, albums, tracks, awards, startDate, futurePolicy);
    setSimState(initial);
    setIsSimStartOpen(false);
    showToast(`Симуляция запущена с ${formatSimDate(startDate)}`);
  };

  const handleRunSimulationWeek = ({
    proposals,
    manualItems,
    advanceDays,
    autopilotConfig,
    stepsCount = 1
  }: {
    proposals?: any[];
    manualItems?: ManualSimItem[];
    advanceDays: number;
    autopilotConfig?: Partial<SimAutopilotConfig>;
    stepsCount?: number;
  }) => {
    if (!simState) return;
    let current = simState;
    const totalSteps = Math.max(1, Math.min(8, stepsCount));
    for (let s = 0; s < totalSteps; s++) {
      const stepProps =
        s === 0 && proposals
          ? proposals
          : autopilotConfig
            ? generateWeekProposals(current.artists, current.albums, current.tracks, current.currentDate, autopilotConfig)
            : [];
      current = advanceSimulationStep({
        simState: current,
        proposals: stepProps,
        manualItems: s === 0 ? manualItems : [],
        advanceDays,
        virality: autopilotConfig?.virality
      });
    }
    setSimState(current);
    showToast(
      totalSteps > 1
        ? `Пройдено ${totalSteps} шагов → ${formatSimDate(current.currentDate)}`
        : `Неделя ${current.weekNumber} (${formatSimDate(current.currentDate)}) завершена`
    );
  };

  const handleQuickSimStep = (days: number) => {
    if (!simState) return;
    const autoProps = days >= 5
      ? generateWeekProposals(simState.artists, simState.albums, simState.tracks, simState.currentDate, 'balanced')
      : [];
    const next = advanceSimulationStep({ simState, proposals: autoProps, advanceDays: days });
    setSimState(next);
    showToast(`+${days} дн. → ${formatSimDate(next.currentDate)}`);
  };

  const handleUndoSimStep = () => {
    if (!simState || simState.undoStack.length === 0) return;
    const [prevSnap, ...rest] = simState.undoStack;
    setSimState({
      ...simState,
      weekNumber: prevSnap.weekNumber,
      currentDate: prevSnap.currentDate,
      artists: prevSnap.artists,
      albums: prevSnap.albums,
      tracks: prevSnap.tracks,
      awards: prevSnap.awards,
      lastDigest: prevSnap.digest,
      undoStack: rest
    });
    showToast(`Откат к ${formatSimDate(prevSnap.currentDate)}`);
  };

  const handleResetSimToStart = () => {
    if (!simState) return;
    const fresh = computeInitialSimSnapshot(artists, albums, tracks, awards, simState.startDate, simState.futurePolicy);
    setSimState(fresh);
    showToast(`Сброшено к ${formatSimDate(simState.startDate)}`);
  };

  const handleSaveSimSlot = (name: string) => {
    if (!simState) return;
    const { isActive: _omit, undoStack: _omitUndo, ...restState } = simState;
    const newSlot: SimSaveSlot = {
      id: `slot_${Date.now().toString(36)}`,
      name,
      savedAt: new Date().toISOString(),
      startDate: simState.startDate,
      currentDate: simState.currentDate,
      weekNumber: simState.weekNumber,
      futurePolicy: simState.futurePolicy,
      artistsCount: simState.artists.length,
      albumsCount: simState.albums.length,
      tracksCount: simState.tracks.length,
      state: { ...restState, undoStack: [] }
    };
    setSimSaveSlots(prev => {
      const updated = [newSlot, ...prev];
      dbSet('musaic_sim_slots', updated).catch(console.error);
      return updated;
    });
    showToast(`Слот «${name}» сохранён`);
  };

  const handleLoadSimSlot = (slot: SimSaveSlot) => {
    setSimState({ ...slot.state, isActive: true });
    setIsSimStartOpen(false);
    setIsSimConsoleOpen(false);
    setSimInitWeekly({ open: false, weekNumber: null });
    setPendingSimReturn(null);
    showToast(`Загружен слот «${slot.name}»`);
  };

  const handleDeleteSimSlot = (slotId: string) => {
    setSimSaveSlots(prev => {
      const updated = prev.filter(s => s.id !== slotId);
      dbSet('musaic_sim_slots', updated).catch(console.error);
      return updated;
    });
    showToast('Слот удалён');
  };

  const handleExportSimJson = () => {
    if (!simState) return;
    const payload = {
      type: 'musaic_simulation_snapshot',
      exportedAt: new Date().toISOString(),
      state: { ...simState, isActive: false }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `musaic_sim_${simState.currentDate}_w${simState.weekNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Снимок симуляции экспортирован');
  };

  const handleImportSimJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        const st = parsed.state || parsed;
        if (st && Array.isArray(st.artists) && Array.isArray(st.tracks) && st.currentDate) {
          setSimState({ ...st, isActive: true });
          showToast(`Загружена симуляция от ${formatSimDate(st.currentDate)}`);
        } else {
          showToast('Неверный формат файла симуляции');
        }
      } catch {
        showToast('Ошибка чтения JSON файла');
      }
    };
    reader.readAsText(file);
  };

  const handleExitSimulation = () => {
    setSimState(null);
    setIsSimConsoleOpen(false);
    setSimInitWeekly({ open: false, weekNumber: null });
    setPendingSimReturn(null);
    if (currentTrack && !tracks.some(t => t.id === currentTrack.id)) {
      setCurrentTrack(tracks[0] || null);
      setIsPlaying(false);
    }
    dbSet('musaic_sim_active', null).catch(console.error);
    showToast('Вы вернулись к обычной базе данных');
  };

  const handleCommitSimToMaster = async (exitAfter: boolean = false) => {
    if (!simState) return;
    try {
      const backupSlot: SimSaveSlot = {
        id: `backup_master_${Date.now().toString(36)}`,
        name: `Резервная копия до применения симуляции (${new Date().toLocaleDateString('ru-RU')})`,
        savedAt: new Date().toISOString(),
        startDate: simState.startDate,
        currentDate: simState.currentDate,
        weekNumber: simState.weekNumber,
        futurePolicy: simState.futurePolicy,
        artistsCount: artists.length,
        albumsCount: albums.length,
        tracksCount: tracks.length,
        state: {
          startDate: simState.startDate,
          currentDate: simState.currentDate,
          weekNumber: simState.weekNumber,
          futurePolicy: simState.futurePolicy,
          artists: [...artists],
          albums: [...albums],
          tracks: [...tracks],
          awards: awards || [],
          undoStack: []
        }
      };
      const updatedSlots = [backupSlot, ...simSaveSlots.slice(0, 19)];
      setSimSaveSlots(updatedSlots);
      await dbSet('musaic_sim_slots', updatedSlots).catch(console.error);

      const newArtists = [...simState.artists];
      const newAlbums = [...simState.albums];
      const newTracks = [...simState.tracks];

      setArtists(newArtists);
      setAlbums(newAlbums);
      setTracks(newTracks);

      const payload = {
        artists: newArtists,
        albums: newAlbums,
        tracks: newTracks,
        theme,
        followedArtistIds
      };
      await dbSet('musaic_master_db', payload).catch(console.error);
      try {
        localStorage.setItem('musaic_master_db', JSON.stringify({
          ...payload,
          tracks: newTracks.slice(0, 400)
        }));
      } catch (e) {
        console.warn('LocalStorage quota, IndexedDB updated successfully', e);
      }

      if (exitAfter) {
        setSimState(null);
        setIsSimConsoleOpen(false);
        await dbSet('musaic_sim_active', null).catch(console.error);
        showToast('Симуляция успешно перенесена в основную базу данных!');
      } else {
        showToast('Основная база данных синхронизирована с текущей симуляцией!');
      }
    } catch (err) {
      console.error('Error committing sim to master:', err);
      showToast('Ошибка при синхронизации базы данных');
    }
  };

  const isResizing = useRef(false);
  const hasHydratedMasterRef = useRef(false);

  useEffect(() => {
    // Load Data asynchronously from IndexedDB in parallel batches for snappy startup
    (async () => {
      const [, rawDbData, savedAwards, savedSlots, savedSim] = await Promise.all([
        loadMediaCache(),
        dbGet('musaic_master_db'),
        dbGet('musaic_awards_db').catch(() => null),
        dbGet('musaic_sim_slots').catch(() => null),
        dbGet('musaic_sim_active').catch(() => null)
      ]);

      let rawData = rawDbData;
      if (!rawData) {
        const savedData = localStorage.getItem('musaic_master_db');
        if (savedData) {
          try { rawData = JSON.parse(savedData); } catch (e) { console.error(e); }
        }
      }

      let loadedArtists: Artist[] = [];
      let loadedAlbums: Album[] = [];
      let loadedTracks: Track[] = [];

      if (rawData) {
        try {
          let { artists: a = [], albums: al = [], tracks: t = [], theme: th, followedArtistIds: f } = rawData;

          const hasBase64 = (
            a.some((x: any) => x.imageUrl?.startsWith('data:image/')) ||
            al.some((x: any) => x.coverUrl?.startsWith('data:image/')) ||
            t.some((x: any) => x.coverUrl?.startsWith('data:image/'))
          );

          if (hasBase64) {
            const extracted = await extractLegacyBase64Media(a, al, t);
            a = extracted.artists;
            al = extracted.albums;
            t = extracted.tracks;
            await dbSet('musaic_master_db', { artists: a, albums: al, tracks: t, theme: th, followedArtistIds: f });
          }

          const relinked = relinkCatalogMedia(a, al, t);
          loadedArtists = relinked.artists;
          loadedAlbums = relinked.albums;
          loadedTracks = relinked.tracks;

          setArtists(loadedArtists);
          setAlbums(loadedAlbums);
          setTracks(loadedTracks);

          if (loadedTracks.length > 0) setCurrentTrack(loadedTracks[0]);
          if (th) setTheme({ ...DEFAULT_THEME, ...th });
          if (f) setFollowedArtistIds(f);
        } catch (e) {
          console.error('Error initializing Musaic DB:', e);
        }
      }

      // Process Awards DB without redundant disk writes when unchanged
      try {
        const knownArtistNames = new Set(loadedArtists.map((art: any) => art.name?.toLowerCase().trim()));
        const knownAlbumTitles = new Set(loadedAlbums.map((alb: any) => alb.title?.toLowerCase().trim()));
        const knownTrackTitles = new Set(loadedTracks.map((trk: any) => trk.title?.toLowerCase().trim()));

        const isUserCatalogAward = (aw: AwardItem) => {
          if (!aw || !aw.winner) return false;
          if (aw.year === '2026') return false;
          if (aw.year === '2025' && aw.periodType === 'year') return false;

          const wt = aw.winner.title?.toLowerCase().trim();
          if (aw.winner.type === 'artist') return knownArtistNames.has(wt);
          if (aw.winner.type === 'album') return knownAlbumTitles.has(wt);
          if (aw.winner.type === 'track') return knownTrackTitles.has(wt);
          if (aw.winner.artistName && knownArtistNames.has(aw.winner.artistName.toLowerCase().trim())) return true;
          return knownArtistNames.has(wt) || knownAlbumTitles.has(wt) || knownTrackTitles.has(wt);
        };

        let validAwards = Array.isArray(savedAwards) ? savedAwards.filter(isUserCatalogAward) : [];
        const needsAwardRebuild = validAwards.length === 0 && (loadedArtists.length > 0 || loadedAlbums.length > 0 || loadedTracks.length > 0);
        if (needsAwardRebuild) {
          validAwards = buildAwardsFromCatalog(loadedArtists, loadedAlbums, loadedTracks);
        }

        if (needsAwardRebuild || !Array.isArray(savedAwards) || validAwards.length !== savedAwards.length) {
          dbSet('musaic_awards_db', validAwards).catch(console.error);
        }
        setAwards(validAwards);
      } catch (err) {
        console.error('Error loading awards DB:', err);
        setAwards([]);
      }

      // Hydrate Simulation Save Slots & Active Sandbox (strip oversized legacy undoStacks)
      try {
        if (Array.isArray(savedSlots)) {
          setSimSaveSlots(
            savedSlots.map((sl: SimSaveSlot) => ({
              ...sl,
              state: sl.state ? { ...sl.state, undoStack: [] } : sl.state
            }))
          );
        }
        if (savedSim && savedSim.isActive) {
          setSimState({
            ...savedSim,
            undoStack: Array.isArray(savedSim.undoStack) ? savedSim.undoStack.slice(0, 5) : []
          });
        }
      } catch (err) {
        console.error('Error loading simulation state:', err);
      }

      // Mark initial hydration complete on next tick so first effect doesn't re-write master DB unnecessarily
      setTimeout(() => {
        hasHydratedMasterRef.current = true;
      }, 150);
    })();

    // Sidebar resize logic
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      setTheme(prev => ({ ...prev, sidebarWidth: Math.max(160, Math.min(400, e.clientX)) }));
    };
    const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = 'default'; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Continuous background sync of existing tracks with album artwork - Optimized to avoid O(N*M)
  useEffect(() => {
    if (tracks.length > 0 && albums.length > 0) {
      const idMap = new Map();
      const titleMap = new Map();
      albums.forEach(a => {
        idMap.set(String(a.id), a);
        titleMap.set(a.title.toLowerCase().trim(), a);
      });

      let hasUpdates = false;
      const updatedTracks = tracks.map(t => {
        let parentAlb = idMap.get(String(t.albumId)) || titleMap.get(t.albumTitle?.toLowerCase().trim());
        
        if (parentAlb && parentAlb.coverUrl && t.coverUrl !== parentAlb.coverUrl) {
          hasUpdates = true;
          return {
            ...t,
            albumId: parentAlb.id,
            albumTitle: parentAlb.title,
            coverUrl: parentAlb.coverUrl
          };
        }
        return t;
      });

      if (hasUpdates) {
        setTracks(updatedTracks);
        dbSet('musaic_master_db', { artists, albums, tracks: updatedTracks, theme, followedArtistIds });
      }
    }
  }, [albums.length, tracks.length]);

  useEffect(() => {
    if (!hasHydratedMasterRef.current) return;
    const timer = setTimeout(() => {
      dbSet('musaic_master_db', { artists, albums, tracks, theme, followedArtistIds });
    }, 650);
    return () => clearTimeout(timer);
  }, [artists, albums, tracks, theme, followedArtistIds]);

  // Persist active Simulation Mode state separately without bloated undoStack
  useEffect(() => {
    if (!simState) return;
    const timer = setTimeout(() => {
      const { undoStack: _omitUndo, ...lightState } = simState;
      dbSet('musaic_sim_active', { ...lightState, undoStack: [] }).catch(console.error);
    }, 500);
    return () => clearTimeout(timer);
  }, [simState]);

  // Apply Theme CSS Variables to DOM only when theme changes (prevents compositor flashes during playback)
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${16 * theme.textScale}px`;
    root.style.setProperty('--bg-color', theme.bgColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-glow', `${theme.accentColor}${theme.glowEnabled ? '73' : '00'}`);
    root.style.setProperty('--accent-glow-strong', `${theme.accentColor}${theme.glowEnabled ? 'B3' : '00'}`);
    root.style.setProperty('--card-bg', theme.cardBg);
    root.style.setProperty('--card-bg-hover', `${theme.cardBg.replace('0.65', '0.8').replace('0.7', '0.85')}`);
    root.style.setProperty('--text-scale', theme.textScale.toString());
    root.style.setProperty('--ui-scale', theme.uiScale.toString());
    root.style.setProperty('--radius-factor', theme.radiusFactor.toString());
    root.style.setProperty('--blur-intensity', `${theme.blurIntensity}px`);
    root.style.setProperty('--font-main', theme.fontFamily);
    root.style.setProperty('--font-mono', theme.fontMono);
    root.style.setProperty('--letter-spacing', `${theme.letterSpacing}em`);
    root.style.setProperty('--font-weight', theme.fontWeight.toString());
    root.style.setProperty('--card-opacity', theme.cardOpacity.toString());
    root.style.setProperty('--player-height', `${theme.playerHeight}px`);
    root.style.setProperty('--header-blur', `${theme.headerBlur}px`);
    root.style.setProperty('--anim-speed', `${theme.animationSpeed}s`);
    root.style.setProperty('--sidebar-width', theme.sidebarWidth.toString() + 'px');
    root.dataset.design = theme.designMode;
    root.dataset.typography = theme.typographyMode || 'classic';

    // Advanced visual controls
    root.style.setProperty('--border-intensity', theme.borderIntensity.toString());
    root.style.setProperty('--shadow-depth', theme.shadowDepth.toString());
    root.style.setProperty('--saturation', theme.saturation.toString());
    root.style.setProperty('--contrast', theme.contrast.toString());

    // Only set body filter if saturation or contrast differs from 1.0 to avoid breaking backdrop-filter GPU layers
    if (theme.saturation !== 1 || theme.contrast !== 1) {
      document.body.style.filter = `saturate(${theme.saturation}) contrast(${theme.contrast})`;
    } else {
      document.body.style.filter = 'none';
    }
    document.body.style.backgroundColor = theme.bgColor;
    document.body.style.fontFamily = theme.fontFamily;
  }, [theme]);

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Navigation with Scroll Position Restoration (Solves Request 7)
  const navigateTo = React.useCallback((view: ViewType, params?: { id?: string; tab?: string; genre?: string; artistName?: string; mode?: 'artists' | 'albums'; leftId?: string; rightId?: string; newsFilter?: string; year?: string; month?: string }) => {
    const currentScrollY = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;
    setHistory(prev => [...prev, { ...nav, scrollY: currentScrollY }]);
    setForwardHistory([]);
    setNav({ view, params });

    setTimeout(() => {
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    }, 35);
  }, [nav]);

  const updateNavParams = React.useCallback((newParams: any) => {
    setNav(prev => ({ ...prev, params: { ...prev.params, ...newParams } }));
  }, []);

  const restoreScrollPosition = (targetY: number) => {
    // Waits until the new page is rendered and tall enough, then keeps the exact position
    // for a few frames (lists load progressively). Stops as soon as the user scrolls himself.
    const target = Math.max(0, targetY || 0);
    const startDelay = theme.smoothTransitions === false ? 0 : 170; // let the exit animation finish
    let userMoved = false;
    const stopOnUser = () => { userMoved = true; };
    setTimeout(() => {
      const el0 = contentScrollRef.current;
      if (!el0) return;
      el0.addEventListener('wheel', stopOnUser, { passive: true });
      el0.addEventListener('touchstart', stopOnUser, { passive: true });
      const started = performance.now();
      let stableFrames = 0;
      const cleanup = () => {
        el0.removeEventListener('wheel', stopOnUser);
        el0.removeEventListener('touchstart', stopOnUser);
      };
      const tick = () => {
        const el = contentScrollRef.current;
        if (!el || userMoved) { cleanup(); return; }
        const maxY = el.scrollHeight - el.clientHeight;
        const y = Math.min(target, Math.max(0, maxY));
        el.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
        if (maxY >= target - 2 && Math.abs(el.scrollTop - target) < 3) stableFrames++;
        else stableFrames = 0;
        if (stableFrames < 10 && performance.now() - started < 2500) requestAnimationFrame(tick);
        else cleanup();
      };
      requestAnimationFrame(tick);
    }, startDelay);
  };

  const goBack = () => {
    if (history.length > 0) {
      const currentScrollY = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;
      const prevItem = history[history.length - 1];
      const nextHistoryLen = history.length - 1;
      setForwardHistory(fwd => [...fwd, { ...nav, scrollY: currentScrollY }]);
      setHistory(prev => prev.slice(0, -1));
      setNav({ view: prevItem.view, params: prevItem.params });
      restoreScrollPosition(prevItem.scrollY || 0);
      if (pendingSimReturn && nextHistoryLen === pendingSimReturn.returnHistoryLen && isSimMode) {
        setSimConsoleTab(pendingSimReturn.tab);
        setSimInitWeekly({
          open: pendingSimReturn.openWeeklyDrops,
          weekNumber: pendingSimReturn.weekNumber
        });
        setIsSimConsoleOpen(true);
        setPendingSimReturn(null);
      }
    }
  };

  const goForward = () => {
    if (forwardHistory.length > 0) {
      const currentScrollY = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;
      const nextItem = forwardHistory[forwardHistory.length - 1];
      setHistory(prev => [...prev, { ...nav, scrollY: currentScrollY }]);
      setForwardHistory(fwd => fwd.slice(0, -1));
      setNav({ view: nextItem.view, params: nextItem.params });
      restoreScrollPosition(nextItem.scrollY || 0);
    }
  };

  // Mouse side buttons (back / forward) use the same in-app history
  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;
  const goForwardRef = useRef(goForward);
  goForwardRef.current = goForward;
  useEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 3) { e.preventDefault(); goBackRef.current(); }
      else if (e.button === 4) { e.preventDefault(); goForwardRef.current(); }
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  const parseDurationSeconds = (dur?: string): number => {
    if (!dur) return 195;
    const parts = dur.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return Math.max(15, parts[0] * 60 + parts[1]);
    }
    return 195;
  };

  const formatElapsedFromProgress = (pct: number, dur?: string): string => {
    const totalSec = parseDurationSeconds(dur);
    const currentSec = Math.min(totalSec, Math.floor((pct / 100) * totalSec));
    const m = Math.floor(currentSec / 60);
    const s = (currentSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const playTrack = (track: Track) => {
    const resolvedCover = getTrackCover(track, viewAlbums);
    const isSameTrack = currentTrack?.id === track.id;
    setCurrentTrack({ ...track, coverUrl: resolvedCover });
    if (!isSameTrack) {
      setPlaybackProgress(28);
    }
    setIsPlaying(true);
    if (isPlayerHidden) setIsPlayerHidden(false);
    if (isPlayerDismissed) handleSetPlayerDismissed(false);
  };

  const togglePlay = () => {
    if (!currentTrack && viewTracks.length > 0) {
      playTrack(viewTracks[0]);
      return;
    }
    setIsPlaying(prev => !prev);
  };

  const playNextTrack = () => {
    if (viewTracks.length === 0) return;
    if (isShuffle && viewTracks.length > 1) {
      const candidates = viewTracks.filter(t => t.id !== currentTrack?.id);
      const next = candidates[Math.floor(Math.random() * candidates.length)] || viewTracks[0];
      playTrack(next);
      return;
    }
    const currentIndex = currentTrack ? viewTracks.findIndex(t => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % viewTracks.length;
    playTrack(viewTracks[nextIndex]);
  };

  const playPrevTrack = () => {
    if (viewTracks.length === 0) return;
    const currentIndex = currentTrack ? viewTracks.findIndex(t => t.id === currentTrack.id) : -1;
    const prevIndex = (currentIndex - 1 + viewTracks.length) % viewTracks.length;
    playTrack(viewTracks[prevIndex]);
  };

  // Global keyboard shortcuts: Space to Play/Pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable;
      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTrack, isPlaying, viewTracks]);

  const toggleLikeTrack = (id: string) => {
    activeSetTracks(prev => prev.map(t => t.id === id ? { ...t, isLiked: !t.isLiked, likes: t.isLiked ? t.likes - 1 : t.likes + 1 } : t));
    if (currentTrack && currentTrack.id === id) {
      setCurrentTrack(prev => prev ? { ...prev, isLiked: !prev.isLiked } : null);
    }
  };

  const toggleLikeAlbum = (id: string) => {
    activeSetAlbums(prev => prev.map(a => a.id === id ? { ...a, isLiked: !a.isLiked } : a));
  };

  const toggleFollowArtist = (artistId: string) => {
    setFollowedArtistIds(prev => 
      prev.includes(artistId) ? prev.filter(id => id !== artistId) : [...prev, artistId]
    );
  };

  const openLightbox = (media: { url: string; title: string; subtitle?: string; type?: string }) => {
    setEnlargedMedia(media);
  };

  // Compute dynamic adaptive palette from active cover art, open modal, or current screen view
  const [ambientPalette, setAmbientPalette] = useState<[string, string, string, string]>([
    theme.accentColor,
    '#6366f1',
    '#a855f7',
    '#38bdf8',
  ]);

  // Keep latest catalog arrays in ref so ambientPalette effect never re-runs on unrelated hype/like updates
  const catalogPaletteRef = useRef({ viewAlbums, viewTracks, viewArtists });
  catalogPaletteRef.current = { viewAlbums, viewTracks, viewArtists };

  useEffect(() => {
    const { viewAlbums: curAlbums, viewTracks: curTracks, viewArtists: curArtists } = catalogPaletteRef.current;
    let targetCoverUrl = '';
    let contextSeed = '';
    let basePalette: [string, string, string, string] = [
      theme.accentColor,
      '#6366f1',
      '#a855f7',
      '#38bdf8',
    ];

    // 1. Highest priority: Enlarged Cover Lightbox
    if (enlargedMedia) {
      targetCoverUrl = resolveMedia(enlargedMedia.url, {
        title: enlargedMedia.title,
        artistName: enlargedMedia.subtitle,
      });
      contextSeed = `${enlargedMedia.title}_${enlargedMedia.subtitle || ''}`;
      basePalette = generateSeedPalette(contextSeed, theme.accentColor);
    }
    // 2. Opened Album page
    else if (nav.view === 'album' && nav.params?.id) {
      const alb = curAlbums.find(a => String(a.id) === String(nav.params?.id));
      if (alb) {
        targetCoverUrl = resolveMedia(alb.coverUrl, {
          id: alb.id,
          title: alb.title,
          artistName: alb.artistName,
        });
        contextSeed = `${alb.title}_${alb.artistName}_${alb.genre || ''}`;
        basePalette = generateSeedPalette(contextSeed, theme.accentColor);
      }
    }
    // 3. Opened Track page
    else if (nav.view === 'track' && nav.params?.id) {
      const trk = curTracks.find(t => String(t.id) === String(nav.params?.id));
      if (trk) {
        const rawCover = getTrackCover(trk, curAlbums);
        targetCoverUrl = resolveMedia(rawCover, {
          id: trk.albumId || trk.id,
          title: trk.title,
          albumTitle: trk.albumTitle,
          artistName: trk.artistName,
        });
        contextSeed = `${trk.title}_${trk.artistName}_${trk.genre || ''}`;
        basePalette = generateSeedPalette(contextSeed, theme.accentColor);
      }
    }
    // 4. Opened Artist / Artist Tracks page
    else if ((nav.view === 'artist' || nav.view === 'artist_tracks') && (nav.params?.id || nav.params?.artistName)) {
      const art = curArtists.find(
        a => String(a.id) === String(nav.params?.id) ||
             (nav.params?.artistName && a.name.toLowerCase().trim() === nav.params.artistName.toLowerCase().trim())
      );
      if (art) {
        targetCoverUrl = resolveMedia(art.imageUrl, {
          id: art.id,
          title: art.name,
          isArtist: true,
        });
        contextSeed = `${art.name}_${art.genre || ''}`;
        basePalette = generateSeedPalette(contextSeed, theme.accentColor);
      }
    }
    // 5. Genre page
    else if (nav.view === 'genre' && nav.params?.genre) {
      const gKey = nav.params.genre.toLowerCase();
      if (gKey.includes('rap') || gKey.includes('рэп')) {
        basePalette = ['#f97316', '#f59e0b', '#ef4444', theme.accentColor];
      } else if (gKey.includes('hyperpop') || gKey.includes('хайперпоп')) {
        basePalette = ['#ec4899', '#d946ef', '#8b5cf6', '#38bdf8'];
      } else if (gKey.includes('grunge') || gKey.includes('гранж')) {
        basePalette = ['#ef4444', '#b91c1c', '#9333ea', '#f97316'];
      } else if (gKey.includes('electronic') || gKey.includes('электрон')) {
        basePalette = ['#06b6d4', '#3b82f6', '#6366f1', '#10b981'];
      } else if (gKey.includes('rnb') || gKey.includes('r&b')) {
        basePalette = ['#8b5cf6', '#a855f7', '#ec4899', '#6366f1'];
      } else if (gKey.includes('phonk') || gKey.includes('фонк')) {
        basePalette = ['#9333ea', '#e11d48', '#6366f1', '#c026d3'];
      } else {
        basePalette = generateSeedPalette(gKey, theme.accentColor);
      }
    }
    // 6. Hall of Fame / Awards / Rating / Album Value / Likes / Charts / Studio sections
    else if (nav.view === 'rating' && nav.params?.tab === 'awards') {
      basePalette = ['#f59e0b', '#a855f7', '#ec4899', '#fbbf24'];
    } else if (nav.view === 'album_value' || (nav.view === 'rating' && nav.params?.tab === 'album_value')) {
      basePalette = ['#38bdf8', '#6366f1', '#a855f7', '#14b8a6'];
    } else if (nav.view === 'rating') {
      basePalette = ['#10b981', '#f59e0b', '#6366f1', '#38bdf8'];
    } else if (nav.view === 'likes') {
      basePalette = ['#ec4899', '#8b5cf6', '#6366f1', '#f43f5e'];
    } else if (nav.view === 'charts') {
      basePalette = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];
    } else if (nav.view === 'creator') {
      basePalette = ['#8b5cf6', '#06b6d4', theme.accentColor, '#ec4899'];
    }

    if (!targetCoverUrl && currentTrack) {
      const rawTrackCover = getTrackCover(currentTrack, curAlbums);
      targetCoverUrl = resolveMedia(rawTrackCover, {
        id: currentTrack.albumId || currentTrack.id,
        title: currentTrack.title,
        albumTitle: currentTrack.albumTitle,
        artistName: currentTrack.artistName,
      });
      if (nav.view === 'home' || nav.view === 'search' || nav.view === 'library') {
        contextSeed = `${currentTrack.title}_${currentTrack.artistName}`;
        basePalette = generateSeedPalette(contextSeed, theme.accentColor);
      }
    }

    let cancelled = false;
    if (targetCoverUrl) {
      extractPaletteFromImageUrl(targetCoverUrl, basePalette).then((extracted) => {
        if (!cancelled) {
          if (
            !enlargedMedia &&
            (nav.view === 'likes' || nav.view === 'rating' || nav.view === 'album_value' || nav.view === 'charts')
          ) {
            setAmbientPalette([extracted[0], basePalette[0], extracted[1], basePalette[1]]);
          } else {
            setAmbientPalette(extracted);
          }
        }
      });
    } else {
      setAmbientPalette(basePalette);
    }

    return () => {
      cancelled = true;
    };
  }, [
    nav.view,
    nav.params?.id,
    nav.params?.tab,
    nav.params?.genre,
    nav.params?.artistName,
    currentTrack?.id,
    currentTrack?.coverUrl,
    enlargedMedia?.url,
    enlargedMedia?.title,
    theme.accentColor,
    viewAlbums.length,
  ]);

  const isAdaptiveAnimated = theme.bgGradientPattern === 'animated';

  const SidebarItemImpl = ({ icon: Icon, label, active, onClick, compact = false, customBadge }: { icon: any, label: string, active: boolean, onClick: () => void, compact?: boolean, customBadge?: React.ReactNode }) => {
    return (
      <button 
        onClick={onClick} 
        className={`flex items-center transition-all duration-300 group cursor-pointer ${
          compact 
            ? 'flex-col gap-1 px-1 py-1 justify-center flex-1' 
            : 'w-full gap-3.5 px-4 py-2.5'
        } ${
          active 
            ? 'bg-gradient-to-r from-white/12 via-white/8 to-transparent text-white font-bold shadow-md border border-white/10 translate-x-1' 
            : 'text-zinc-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
        }`}
        style={{
          borderRadius: `calc(0.75rem * var(--radius-factor))`,
          ...(active && isAdaptiveAnimated
            ? {
                backgroundImage: `linear-gradient(90deg, ${ambientPalette[0]}30 0%, ${ambientPalette[1]}18 65%, transparent 100%)`,
                borderColor: `${ambientPalette[0]}45`,
                boxShadow: `0 6px 20px -4px ${ambientPalette[0]}28`,
              }
            : {}),
        }}
      >
        {customBadge || (
          <Icon
            className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${active ? 'theme-accent' : 'group-hover:text-white'} transition-colors duration-500`}
            style={active ? { color: isAdaptiveAnimated ? ambientPalette[0] : theme.accentColor } : {}}
          />
        )}
        <span className={`font-semibold tracking-tight ${compact ? 'text-[9px]' : 'text-sm'}`}>{label}</span>
      </button>
    );
  };
  sidebarItemImplRef.current = SidebarItemImpl;

  return (
    <div className="flex h-screen text-zinc-100 select-none overflow-hidden flex-col md:flex-row bg-[var(--bg-color)] relative">
      {/* Ambient Multi-Color Gradient Lighting */}
      {theme.bgGradientPattern !== 'none' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {(theme.bgGradientPattern === 'aurora' || !theme.bgGradientPattern) && (
            <>
              <div
                className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-25 transition-all duration-700"
                style={{ background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)` }}
              />
              <div
                className="absolute top-[35%] -right-[15%] w-[55vw] h-[55vw] rounded-full blur-[160px] opacity-20 transition-all duration-700"
                style={{ background: `radial-gradient(circle, #818cf8 0%, transparent 70%)` }}
              />
            </>
          )}
          {theme.bgGradientPattern === 'animated' && (
            <AnimatedAmbientFlow palette={ambientPalette} isPlaying={isPlaying} />
          )}
          {theme.bgGradientPattern === 'radial' && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[75vw] rounded-full blur-[180px] opacity-20 transition-all duration-700"
              style={{ background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 65%)` }}
            />
          )}
          {theme.bgGradientPattern === 'subtle' && (
            <div
              className="absolute top-0 left-1/4 w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-10 transition-all duration-700"
              style={{ background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)` }}
            />
          )}
          {theme.bgGradientPattern === 'mesh' && (
            <>
              <div
                className="absolute top-0 left-0 w-full h-full opacity-30"
                style={{
                  background: `linear-gradient(135deg, ${theme.accentColor}15 0%, transparent 50%),
                               linear-gradient(225deg, #3b82f610 0%, transparent 50%)`,
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 14s ease-in-out infinite'
                }}
              />
              <div
                className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[130px] opacity-15"
                style={{ background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)` }}
              />
              <div
                className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full blur-[130px] opacity-12"
                style={{ background: `radial-gradient(circle, #818cf8 0%, transparent 70%)` }}
              />
            </>
          )}
          {theme.enableAnimatedBg && theme.bgGradientPattern !== 'animated' && (
            <AnimatedBlobs accentColor={theme.accentColor} />
          )}
        </div>
      )}

      <AnimatePresence>
        {appToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[200] theme-bg-accent text-black font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm ring-1 ring-white/20"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{appToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Left-Edge Sidebar Reveal Strip when Collapsed (Never covers Back/Forward buttons) */}
      {isSidebarCollapsed && (
        <div
          onClick={() => setIsSidebarCollapsed(false)}
          title="Развернуть боковую панель"
          className="fixed left-0 top-0 bottom-24 w-3.5 z-[90] group cursor-pointer flex items-center select-none"
        >
          <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-full bg-white/15 group-hover:bg-[var(--accent-color)] transition-all duration-300" />
          <div className="w-1.5 group-hover:w-7 h-20 rounded-r-2xl bg-zinc-900/80 group-hover:bg-zinc-900/95 backdrop-blur-xl border-y border-r border-white/10 group-hover:border-white/25 shadow-2xl transition-all duration-300 flex items-center justify-center overflow-hidden">
            <ChevronRight className="w-4 h-4 theme-accent opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0" />
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        theme={theme} 
        setTheme={setTheme} 
        isPlayerDismissed={isPlayerDismissed}
        onTogglePlayerDismissed={handleSetPlayerDismissed}
      />
      <CoverPeek
        media={enlargedMedia}
        onClose={() => setEnlargedMedia(null)}
        onPlay={currentTrack ? () => playTrack(currentTrack) : undefined}
        ambientPalette={ambientPalette}
      />
      <ActivityFeedModal 
        isOpen={isActivityFeedOpen} 
        onClose={() => setIsActivityFeedOpen(false)} 
        artists={viewArtists} 
        albums={viewAlbums} 
        tracks={viewTracks} 
        navigateTo={navigateTo} 
      />
      
      <aside 
        style={{
          width: `${theme.sidebarWidth}px`,
          ...(isAdaptiveAnimated
            ? {
                backgroundImage: `
                  radial-gradient(130% 55% at 0% 0%, ${ambientPalette[0]}24 0%, transparent 65%),
                  radial-gradient(120% 60% at 100% 100%, ${ambientPalette[1]}1c 0%, transparent 70%),
                  linear-gradient(180deg, rgba(16,16,22,0.82) 0%, rgba(10,10,14,0.88) 100%)
                `,
                borderColor: `${ambientPalette[0]}22`,
              }
            : {}),
        }} 
        className={`app-sidebar ${isSidebarCollapsed ? 'hidden' : 'hidden md:flex'} p-4 flex-col gap-3 z-50 relative shrink-0 transition-all duration-1000 border-r border-white/5 bg-gradient-to-b from-zinc-900/75 via-zinc-950/80 to-black/85 backdrop-blur-2xl`}
      >
        <div className="p-2 mb-2 cursor-pointer group flex items-center justify-between" onClick={() => navigateTo('home')}>
          <h1 className="text-xl font-black flex items-center gap-2.5 tracking-tight group-hover:scale-102 transition-transform">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-700"
              style={{
                background: isAdaptiveAnimated
                  ? `linear-gradient(135deg, ${ambientPalette[0]} 0%, ${ambientPalette[1]} 100%)`
                  : theme.accentColor,
              }}
            >
              <Play className="w-4 h-4 text-black fill-black ml-0.5" />
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">Musaic</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarCollapsed(true);
              }}
              className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/10"
              title="Свернуть шторку влево"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <SidebarItem icon={Home} label="Главная" active={nav.view === 'home'} onClick={() => navigateTo('home')} />
          <SidebarItem icon={TrendingUp} label="Чарты" active={nav.view === 'charts'} onClick={() => navigateTo('charts')} />
          <SidebarItem icon={Newspaper} label="События" active={nav.view === 'news'} onClick={() => navigateTo('news')} />
          <SidebarItem icon={SocialIcon} label="Лента" active={nav.view === 'social'} onClick={() => navigateTo('social')} />
          <SidebarItem icon={Award} label="Рейтинг" active={nav.view === 'rating' && nav.params?.tab !== 'awards' && nav.params?.tab !== 'album_value'} onClick={() => navigateTo('rating', { tab: 'rating' })} />
          <SidebarItem icon={Trophy} label="Премии" active={(nav.view === 'rating' && (nav.params?.tab === 'awards' || nav.params?.tab === 'album_value')) || nav.view === 'album_value'} onClick={() => navigateTo('rating', { tab: 'awards' })} />
          <SidebarItem icon={Search} label="Поиск" active={nav.view === 'search'} onClick={() => navigateTo('search')} />
          <SidebarItem icon={Library} label="Медиатека" active={nav.view === 'library'} onClick={() => navigateTo('library')} />
        </div>

        {/* Playlists & Likes */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
          <SidebarItem 
            icon={Heart} 
            label="Любимое" 
            active={nav.view === 'likes'} 
            onClick={() => navigateTo('likes')} 
            customBadge={
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            }
          />
        </div>

        {/* Creator & Studio Tools */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
          <h3 className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Студия</h3>
          <SidebarItem icon={Settings2} label="Управление треками" active={nav.view === 'creator'} onClick={() => navigateTo('creator')} />
          <SidebarItem
            icon={FastForward}
            label={isSimMode ? 'Пульт симуляции' : 'Режим симуляции'}
            active={isSimConsoleOpen || isSimStartOpen}
            onClick={() => {
              if (isSimMode) {
                setSimConsoleTab('semi');
                setIsSimConsoleOpen(true);
              } else {
                setIsSimStartOpen(true);
              }
            }}
          />
          <SidebarItem icon={Palette} label="Оформление" active={isSettingsOpen} onClick={() => setIsSettingsOpen(true)} />
        </div>
        
        {/* Core Stats Box */}
        <div
          style={
            isAdaptiveAnimated
              ? {
                  backgroundImage: `linear-gradient(135deg, ${ambientPalette[0]}1f 0%, rgba(24,24,30,0.65) 55%, ${ambientPalette[2]}1a 100%)`,
                  borderColor: `${ambientPalette[0]}28`,
                }
              : undefined
          }
          className="mt-auto p-4 border border-white/5 bg-gradient-to-br from-zinc-900/65 via-zinc-900/40 to-black/65 backdrop-blur-xl rounded-2xl transition-all duration-1000 hover:border-white/15"
        >
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2.5">
            {isSimMode ? `Симуляция · Нед. ${simState?.weekNumber}` : 'Коллекция'}
          </p>
          <div className="space-y-1.5 text-xs text-zinc-400 font-medium tabular-nums">
            <div className="flex justify-between"><span>Артисты</span> <span className="text-white font-bold">{viewArtists.length}</span></div>
            <div className="flex justify-between"><span>Альбомы</span> <span className="text-white font-bold">{viewAlbums.length}</span></div>
            <div className="flex justify-between"><span>Треки</span> <span className="text-white font-bold">{viewTracks.length}</span></div>
            <div className="flex justify-between"><span>Подписки</span> <span className="font-bold transition-colors duration-700" style={{ color: isAdaptiveAnimated ? ambientPalette[0] : '#1ed760' }}>{followedArtistIds.length}</span></div>
          </div>
        </div>

        <div onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'col-resize'; }} className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#1ed760]/50 opacity-20 transition-all"></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header 
          style={{
            backdropFilter: `blur(var(--header-blur))`,
            ...(isAdaptiveAnimated
              ? {
                  backgroundImage: `linear-gradient(90deg, ${ambientPalette[0]}22 0%, rgba(12,12,18,0.58) 48%, ${ambientPalette[1]}20 100%)`,
                  borderColor: `${ambientPalette[0]}20`,
                }
              : {}),
          }}
          className="app-header h-14 md:h-16 flex items-center justify-between px-5 md:px-8 sticky top-0 z-40 transition-all duration-1000 bg-gradient-to-r from-black/30 via-zinc-900/20 to-black/30 border-b border-white/[0.03]"
        >
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden max-w-[75%]">
            <button 
              type="button"
              onClick={goBack} 
              disabled={history.length === 0} 
              className={`p-2 rounded-full transition-all border shrink-0 flex items-center justify-center ${
                history.length > 0 
                  ? 'bg-zinc-900/80 hover:bg-black border-white/10 cursor-pointer text-white shadow-md active:scale-95' 
                  : 'bg-black/20 opacity-25 cursor-not-allowed border-transparent text-zinc-600'
              }`}
              title="Назад"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 h-5" />
            </button>
            <button 
              type="button"
              onClick={goForward} 
              disabled={forwardHistory.length === 0} 
              className={`p-2 rounded-full transition-all border shrink-0 flex items-center justify-center ${
                forwardHistory.length > 0 
                  ? 'bg-zinc-900/80 hover:bg-black border-white/10 cursor-pointer text-white shadow-md active:scale-95' 
                  : 'bg-black/20 opacity-25 cursor-not-allowed border-transparent text-zinc-600'
              }`}
              title="Вперед"
            >
              <ChevronRight className="w-4 h-4 md:w-5 h-5" />
            </button>
            {nav.view === 'search' && (
              <div className="relative shrink min-w-0 ml-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Что вы хотите послушать?" 
                  className="bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 focus:border-white/25 rounded-full py-1.5 pl-9 md:pl-10 pr-4 md:pr-6 w-full max-w-[220px] md:w-80 text-xs md:text-sm font-medium text-white placeholder:text-zinc-400 outline-none transition-all" 
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ReleaseCalendarPro
              artists={viewArtists}
              tracks={viewTracks}
              albums={viewAlbums}
              todayIso={isSimMode ? simActiveDate : undefined}
              onAddTrack={(t) => activeSetTracks((prev: any) => [...prev, t])}
              onAddAlbum={(al, ts) => { activeSetAlbums((prev: any) => [...prev, al]); if (ts.length) activeSetTracks((prev: any) => [...prev, ...ts]); }}
              onOpen={(type, id) => navigateTo(type, { id })}
              onRelease={(a) => activeSetTracks((prev: any) => [...prev, {
                id: Math.random().toString(36).slice(2, 11), title: a.title,
                artistId: a.artistId || viewArtists.find(x => x.name.toLowerCase() === a.artistName.toLowerCase())?.id || '', artistName: a.artistName,
                albumId: 'single', albumTitle: 'Single', duration: getRandomDuration(), plays: 0, likes: 0, isLiked: false,
                releaseDate: a.date, coverUrl: a.coverUrl || '', isSnippet: a.type === 'snippet' || undefined
              }])}
            />
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="px-2.5 py-1.5 rounded-full bg-zinc-900/75 hover:bg-zinc-800/90 border border-white/10 hover:border-white/25 text-zinc-400 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Быстрый поиск и команды (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px] font-medium">Поиск</span>
              <kbd className="hidden sm:inline text-[10px] font-mono text-zinc-500 bg-white/[0.06] px-1.5 py-0.2 rounded">Ctrl+K</kbd>
            </button>
            <button 
              onClick={() => setIsQueueOpen(prev => !prev)}
              className={`p-2 rounded-full border transition-all cursor-pointer relative ${
                isQueueOpen 
                  ? 'bg-white text-black border-white shadow-lg scale-105' 
                  : 'bg-zinc-900/80 border-white/10 hover:border-white/30 text-zinc-300 hover:text-white'
              }`}
              title="Очередь воспроизведения (Play Queue)"
            >
              <ListMusic className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-zinc-900/80 border border-white/10 hover:border-white/30 rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Настройки оформления"
            >
              <Palette className="w-4 h-4" />
            </button>
            <div className="px-3.5 md:px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 tracking-tight shrink-0 bg-zinc-900/80 border border-white/10 text-zinc-200 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full theme-bg-accent"></span>
              <span>Pro Studio</span>
            </div>
          </div>
        </header>

        {isSimMode && simState && (
          <SimControlBar
            simState={simState}
            isHidden={isSimBarHidden}
            onToggleHide={() => setIsSimBarHidden(prev => !prev)}
            onQuickStep={handleQuickSimStep}
            onOpenConsole={(tab) => {
              setSimConsoleTab(tab || 'semi');
              setIsSimConsoleOpen(true);
            }}
            onUndoStep={handleUndoSimStep}
            onExitSim={handleExitSimulation}
          />
        )}

        <div ref={contentScrollRef} className={`flex-1 overflow-y-auto ${isPlayerDismissed || isPlayerHidden ? 'pb-20' : 'pb-36'} scroll-smooth custom-scrollbar`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={nav.view + (nav.params?.id || '')}
              initial={theme.smoothTransitions === false ? false : { opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={theme.smoothTransitions === false ? { opacity: 1, transition: { duration: 0 } } : { opacity: 0, y: -6, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              {nav.view === 'home' && (
                <HomeView 
                  artists={viewArtists} 
                  albums={viewAlbums} 
                  tracks={viewTracks} 
                  navigateTo={navigateTo} 
                  onPlayTrack={playTrack}
                  toggleLikeTrack={toggleLikeTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  togglePlay={togglePlay}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                  onRateClick={(item: any) => setQuickRatingTarget(
                    item?.item && (item.type === 'track' || item.type === 'album')
                      ? item
                      : { type: 'plays' in item ? 'track' : 'album', item }
                  )}
                  theme={theme}
                  followedArtistIds={followedArtistIds}
                  awards={viewAwards}
                  referenceDate={isSimMode ? simActiveDate : undefined}
                  showToast={showToast}
                />
              )}
              {nav.view === 'charts' && (
                <ChartsPro 
                  artists={viewArtists} 
                  albums={viewAlbums} 
                  tracks={viewTracks} 
                  navigateTo={navigateTo} 
                  onPlayTrack={playTrack}
                  toggleLikeTrack={toggleLikeTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  followedArtistIds={followedArtistIds}
                  toggleFollowArtist={toggleFollowArtist}
                  referenceDate={isSimMode ? simActiveDate : undefined}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                />
              )}
              {(nav.view === 'rating' || nav.view === 'album_value') && (
                <RatingView 
                  tracks={viewTracks}
                  albums={viewAlbums}
                  artists={viewArtists}
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  toggleLikeTrack={toggleLikeTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  awards={viewAwards}
                  onSaveAward={handleSaveAward}
                  onDeleteAward={handleDeleteAward}
                  onSaveAlbumValue={handleSaveAlbumValue}
                  initialTab={nav.view === 'album_value' ? 'album_value' : (nav.params?.tab as any)}
                  initialYear={nav.params?.year}
                  initialMonth={nav.params?.month}
                  updateNavParams={updateNavParams}
                  showToast={showToast}
                />
              )}
              {nav.view === 'artist' && (
                <ArtistView 
                  uiPrefs={theme}
                  id={nav.params?.id || ''} 
                  artists={viewArtists} 
                  albums={viewAlbums} 
                  tracks={viewTracks} 
                  navigateTo={navigateTo} 
                  toggleLikeTrack={toggleLikeTrack}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  followedArtistIds={followedArtistIds}
                  toggleFollowArtist={toggleFollowArtist}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'artist', item })}
                />
              )}
              {nav.view === 'artist_tracks' && (
                <ArtistTracksView 
                  id={nav.params?.id || ''} 
                  artists={viewArtists} 
                  tracks={viewTracks} 
                  navigateTo={navigateTo} 
                  toggleLikeTrack={toggleLikeTrack}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                />
              )}
              {nav.view === 'album' && (
                <AlbumView 
                  uiPrefs={theme}
                  id={nav.params?.id || ''} 
                  albums={viewAlbums} 
                  tracks={viewTracks} 
                  artists={viewArtists}
                  toggleLikeTrack={toggleLikeTrack} 
                  toggleLikeAlbum={toggleLikeAlbum} 
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'album', item })}
                  onRateClick={(item: Album) => setQuickRatingTarget({ type: 'album', item })}
                  onSaveAlbumValue={handleSaveAlbumValue}
                />
              )}
              {nav.view === 'track' && (
                <TrackPage 
                  id={nav.params?.id || ''} 
                  tracks={viewTracks} 
                  albums={viewAlbums} 
                  artists={viewArtists} 
                  toggleLikeTrack={toggleLikeTrack} 
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                  onRateClick={(item: Track) => setQuickRatingTarget({ type: 'track', item })}
                />
              )}
              {nav.view === 'likes' && (
                <LikesView 
                  artists={viewArtists}
                  albums={viewAlbums}
                  tracks={viewTracks}
                  followedArtistIds={followedArtistIds}
                  toggleFollowArtist={toggleFollowArtist}
                  toggleLikeTrack={toggleLikeTrack}
                  toggleLikeAlbum={toggleLikeAlbum}
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                />
              )}
              {nav.view === 'creator' && (
                <CreatorHub
                  artists={viewArtists}
                  setArtists={activeSetArtists}
                  albums={viewAlbums}
                  setAlbums={activeSetAlbums}
                  tracks={viewTracks}
                  setTracks={activeSetTracks}
                  theme={theme}
                  setTheme={setTheme}
                  followedArtistIds={followedArtistIds}
                  setFollowedArtistIds={setFollowedArtistIds}
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  initialTab={nav.params?.id ? (viewArtists.find(a => a.id === nav.params?.id) ? 'artist' : 'album') : 'artist'}
                  targetId={nav.params?.id}
                  isActivityFeedOpen={isActivityFeedOpen}
                  setIsActivityFeedOpen={setIsActivityFeedOpen}
                  isSimMode={isSimMode}
                  onOpenSimulation={() => {
                    if (isSimMode) {
                      setSimConsoleTab('semi');
                      setIsSimConsoleOpen(true);
                    } else {
                      setIsSimStartOpen(true);
                    }
                  }}
                />
              )}
              {nav.view === 'library' && (
                <LibraryView 
                  albums={viewAlbums} 
                  artists={viewArtists} 
                  tracks={viewTracks} 
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  initialTab={nav.params?.tab || 'all'}
                  onTabChange={(t: string) => updateNavParams({ tab: t })}
                />
              )}
              {nav.view === 'search' && (
                <SearchView 
                  query={searchQuery} 
                  artists={viewArtists} 
                  albums={viewAlbums} 
                  tracks={viewTracks} 
                  navigateTo={navigateTo} 
                  toggleLikeTrack={toggleLikeTrack}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                  initialTab={nav.params?.tab}
                  initialGenre={nav.params?.genre}
                />
              )}
              {nav.view === 'compare' && (
                <CompareView
                  artists={viewArtists}
                  albums={viewAlbums}
                  tracks={viewTracks}
                  initialMode={nav.params?.mode}
                  initialLeftId={nav.params?.leftId}
                  initialRightId={nav.params?.rightId}
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                />
              )}
              {nav.view === 'social' && (
                <SocialFeed
                  artists={viewArtists}
                  albums={viewAlbums}
                  tracks={viewTracks}
                  awards={viewAwards}
                  referenceDate={isSimMode ? simActiveDate : undefined}
                  isSim={isSimMode}
                  navigateTo={navigateTo}
                />
              )}
              {nav.view === 'news' && (
                <div>
                <WeeklyNewsFeed
                  artists={viewArtists}
                  albums={viewAlbums}
                  tracks={viewTracks}
                  awards={viewAwards}
                  referenceDate={isSimMode ? simActiveDate : undefined}
                  navigateTo={navigateTo}
                />
                <IndustryNewsView
                  artists={viewArtists}
                  albums={viewAlbums}
                  tracks={viewTracks}
                  awards={viewAwards}
                  referenceDate={isSimMode ? simActiveDate : undefined}
                  initialFilter={nav.params?.newsFilter}
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  onOpenActivityFeed={() => setIsActivityFeedOpen(true)}
                />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          artists={viewArtists}
          albums={viewAlbums}
          tracks={viewTracks}
          navigateTo={navigateTo}
          onPlayTrack={playTrack}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {isSimStartOpen && (
          <SimStartModal
            isOpen={isSimStartOpen}
            onClose={() => setIsSimStartOpen(false)}
            artists={artists}
            albums={albums}
            tracks={tracks}
            saveSlots={simSaveSlots}
            onStartNew={handleStartSimulation}
            onLoadSlot={handleLoadSimSlot}
            onDeleteSlot={handleDeleteSimSlot}
          />
        )}

        {isSimConsoleOpen && simState && (
          <SimConsoleModal
            isOpen={isSimConsoleOpen}
            onClose={() => {
              setIsSimConsoleOpen(false);
              setSimInitWeekly({ open: false, weekNumber: null });
            }}
            initialTab={simConsoleTab}
            initialShowWeeklyDrops={simInitWeekly.open}
            initialDigestWeekNumber={simInitWeekly.weekNumber}
            simState={simState}
            saveSlots={simSaveSlots}
            onRunWeek={handleRunSimulationWeek}
            onUndoStep={handleUndoSimStep}
            onResetToStart={handleResetSimToStart}
            onSaveSlot={handleSaveSimSlot}
            onLoadSlot={handleLoadSimSlot}
            onDeleteSlot={handleDeleteSimSlot}
            onExportSimJson={handleExportSimJson}
            onImportSimJson={handleImportSimJson}
            onAdjustArtistHype={(artistId, delta) => {
              setSimState(prev =>
                prev
                  ? {
                      ...prev,
                      artists: prev.artists.map(a =>
                        a.id === artistId
                          ? { ...a, hype: Math.max(5, Math.min(99, (a.hype ?? 50) + delta)) }
                          : a
                      )
                    }
                  : prev
              );
            }}
            onCreateArtist={(newArtist) => {
              setSimState(prev =>
                prev
                  ? {
                      ...prev,
                      artists: prev.artists.some(a => a.id === newArtist.id)
                        ? prev.artists
                        : [newArtist, ...prev.artists]
                    }
                  : prev
              );
              showToast(`✓ Артист «${newArtist.name}» добавлен в неделю`);
            }}
            onGenerateArtistBio={async (artistName, artistGenre) => {
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Music bio for "${artistName}". Genre: ${artistGenre || 'Unknown'}. Short, futuristic, cyberpunk vibe.`
              });
              return response.text?.trim() || '';
            }}
            onCommitSimToMaster={handleCommitSimToMaster}
            onExitSim={handleExitSimulation}
            onOpenRelease={(itemType, id, weekNumber) => {
              setPendingSimReturn({
                returnHistoryLen: history.length,
                tab: 'digest',
                openWeeklyDrops: true,
                weekNumber: weekNumber ?? null
              });
              setIsSimConsoleOpen(false);
              setSimInitWeekly({ open: false, weekNumber: null });
              if (itemType === 'album') {
                navigateTo('album', { id });
              } else {
                navigateTo('track', { id });
              }
            }}
            onOpenArtist={(artistId) => {
              setPendingSimReturn({
                returnHistoryLen: history.length,
                tab: 'radar',
                openWeeklyDrops: false,
                weekNumber: null
              });
              setIsSimConsoleOpen(false);
              setSimInitWeekly({ open: false, weekNumber: null });
              navigateTo('artist', { id: artistId });
            }}
          />
        )}

        {/* Modals for Edit and 3-Dots Action Menu */}
        <EditTrackModal 
          isOpen={Boolean(editingTrack)} 
          track={editingTrack} 
          onClose={() => setEditingTrack(null)} 
          onSave={handleSaveEditedTrack} 
          artists={viewArtists} 
          albums={viewAlbums} 
        />

        <EditAlbumModal 
          isOpen={Boolean(editingAlbum)} 
          album={editingAlbum} 
          onClose={() => setEditingAlbum(null)} 
          onSave={handleSaveEditedAlbum} 
          artists={viewArtists} 
        />

        <EditArtistModal 
          isOpen={Boolean(editingArtist)} 
          artist={editingArtist} 
          onClose={() => setEditingArtist(null)} 
          onSave={handleSaveEditedArtist} 
          tracks={viewAllTracks}
          albums={viewAllAlbums}
        />

        {actionMenuTarget && (
          <ActionMenuModal 
            isOpen={Boolean(actionMenuTarget)} 
            onClose={() => setActionMenuTarget(null)} 
            type={actionMenuTarget.type} 
            title={'name' in actionMenuTarget.item ? (actionMenuTarget.item as any).name : (actionMenuTarget.item as any).title} 
            subtitle={actionMenuTarget.type === 'track' ? (actionMenuTarget.item as Track).artistName : (actionMenuTarget.type === 'album' ? (actionMenuTarget.item as Album).artistName : undefined)} 
            featuredArtist={actionMenuTarget.type === 'track' ? (actionMenuTarget.item as Track).featuredArtist : undefined}
            artists={viewArtists}
            navigateTo={navigateTo}
            coverUrl={'imageUrl' in actionMenuTarget.item ? (actionMenuTarget.item as any).imageUrl : (actionMenuTarget.item as any).coverUrl} 
            onEdit={() => {
              if (actionMenuTarget.type === 'track') setEditingTrack(actionMenuTarget.item as Track);
              else if (actionMenuTarget.type === 'album') setEditingAlbum(actionMenuTarget.item as Album);
              else if (actionMenuTarget.type === 'artist') setEditingArtist(actionMenuTarget.item as Artist);
            }} 
            onCopyLink={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Ссылка скопирована в буфер обмена');
            }} 
            onGoToArtist={actionMenuTarget.type === 'track' ? () => navigateTo('artist', { id: (actionMenuTarget.item as Track).artistId }) : (actionMenuTarget.type === 'album' ? () => navigateTo('artist', { id: (actionMenuTarget.item as Album).artistId }) : undefined)} 
            onToggleLike={actionMenuTarget.type === 'track' ? () => toggleLikeTrack((actionMenuTarget.item as Track).id) : (actionMenuTarget.type === 'album' ? () => toggleLikeAlbum((actionMenuTarget.item as Album).id) : undefined)} 
            isLiked={actionMenuTarget.type === 'track' ? (actionMenuTarget.item as Track).isLiked : (actionMenuTarget.type === 'album' ? (actionMenuTarget.item as Album).isLiked : undefined)} 
            onOpenStory={() => setStoryTarget(actionMenuTarget)}
            onDelete={() => handleDeleteItem(actionMenuTarget.type, actionMenuTarget.item.id)} 
            onAddToAlbum={actionMenuTarget.type === 'track' ? () => setAddToAlbumTrack(actionMenuTarget.item as Track) : undefined}
          />
        )}

        <style>{PAGE_ENHANCE_CSS}</style>
        <AddToAlbumModal
          track={addToAlbumTrack}
          albums={viewAlbums}
          tracks={viewTracks}
          onClose={() => setAddToAlbumTrack(null)}
          onConfirm={(albumId, beforeId) => {
            if (addToAlbumTrack) handleAddTrackToAlbum(addToAlbumTrack.id, albumId, beforeId);
            setAddToAlbumTrack(null);
          }}
        />

        <StoryCardModal
          isOpen={Boolean(storyTarget)}
          onClose={() => setStoryTarget(null)}
          item={storyTarget?.item || null}
          type={storyTarget?.type || 'track'}
          theme={theme}
          albums={viewAlbums}
          artists={viewArtists}
          showToast={showToast}
        />

        <QuickRatingModal 
          isOpen={Boolean(quickRatingTarget)} 
          type={quickRatingTarget?.type || 'track'} 
          item={quickRatingTarget?.item || null} 
          onClose={() => setQuickRatingTarget(null)} 
          onSave={handleSaveQuickRating} 
        />

        {/* Interactive Bottom Player Bar with Sync & Hide Support */}
        <AnimatePresence>
          {!isPlayerDismissed && !isPlayerHidden && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                height: `var(--player-height)`,
                ...(isAdaptiveAnimated
                  ? {
                      backgroundImage: `linear-gradient(90deg, ${ambientPalette[0]}2a 0%, rgba(16,16,23,0.92) 45%, ${ambientPalette[1]}24 100%)`,
                      borderColor: `${ambientPalette[0]}28`,
                    }
                  : {}),
              }}
              className="app-player fixed bottom-16 md:bottom-0 left-0 right-0 bg-gradient-to-r from-[#121217]/92 via-[#171822]/90 to-[#121217]/92 backdrop-blur-[var(--blur-intensity)] border-t border-white/10 flex items-center justify-between px-4 md:px-8 z-[60] shadow-2xl transition-colors duration-1000"
            >
              {/* Left: Current Track Details */}
              <div className="flex items-center gap-3.5 w-[55%] sm:w-1/3 min-w-0">
                {currentTrack ? (
                  <>
                    <div className="relative shrink-0">
                      {isAdaptiveAnimated && (
                        <div
                          className="absolute -inset-2 rounded-2xl blur-xl opacity-45 pointer-events-none transition-all duration-1000"
                          style={{ background: `radial-gradient(circle, ${ambientPalette[0]} 0%, transparent 70%)` }}
                        />
                      )}
                      <CoverArt 
                        url={getTrackCover(currentTrack, viewAlbums)} 
                        title={currentTrack.title}
                        onZoom={() => openLightbox({ url: getTrackCover(currentTrack, viewAlbums) || '', title: currentTrack.title, subtitle: currentTrack.artistName, type: 'Сейчас играет' })}
                        className={`w-12 h-12 md:w-14 md:h-14 bg-zinc-800 rounded-lg md:rounded-xl overflow-hidden shadow-xl shrink-0 group border transition-all cursor-pointer relative ${isPlaying ? 'border-[var(--accent-color)]/60 shadow-[0_0_20px_var(--accent-glow)]' : 'border-white/10'}`}
                        showZoomIcon={true}
                      />
                      {isPlaying && (
                        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-black/90 border border-white/15 flex items-end gap-0.5 h-4 pointer-events-none shadow-md">
                          <span className="w-0.5 theme-bg-accent rounded-full animate-bounce h-2.5"></span>
                          <span className="w-0.5 theme-bg-accent rounded-full animate-bounce h-3" style={{ animationDelay: '0.15s' }}></span>
                          <span className="w-0.5 theme-bg-accent rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          onClick={() => navigateTo('track', { id: currentTrack.id })}
                          className="text-xs md:text-sm font-bold text-white hover:underline truncate cursor-pointer"
                        >
                          {currentTrack.title}
                        </span>
                        {currentTrack.isExplicit && <span className="bg-zinc-600 text-white text-[8px] font-bold px-1 rounded flex-shrink-0">E</span>}
                      </div>
                      <div className="text-[11px] md:text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                        <span 
                          onClick={() => navigateTo('artist', { id: currentTrack.artistId })}
                          className="hover:text-white hover:underline cursor-pointer"
                        >
                          {currentTrack.artistName}
                        </span>
                        {currentTrack.featuredArtist && (
                          <FeaturedArtistsLinks 
                            featuredArtist={currentTrack.featuredArtist} 
                            artists={viewArtists} 
                            navigateTo={navigateTo} 
                            className="text-zinc-400"
                          />
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleLikeTrack(currentTrack.id)}
                      className="ml-1 text-zinc-400 hover:text-white transition-all cursor-pointer p-1 hover:scale-110 active:scale-95"
                      title={currentTrack.isLiked ? "Убрать из любимого" : "В любимое"}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${currentTrack.isLiked ? 'theme-accent fill-current' : ''}`} />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 border border-white/5">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-400 truncate">Выберите трек</p>
                      <p className="text-[10px] text-zinc-500 truncate">Нажмите Пробел для старта</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Center: Playback Controls & Scrubber */}
              <div className="flex flex-col items-center gap-1.5 w-[45%] sm:w-1/3 shrink-0">
                <div className="flex items-center gap-3 sm:gap-5">
                  <button 
                    onClick={() => {
                      setIsShuffle(prev => !prev);
                      showToast(!isShuffle ? 'Режим перемешивания включён' : 'Режим перемешивания выключен');
                    }}
                    className={`transition-all cursor-pointer hidden sm:flex flex-col items-center p-1 relative ${isShuffle ? 'theme-accent' : 'text-zinc-400 hover:text-white'}`} 
                    title="Перемешать очередь"
                  >
                    <Shuffle className="w-4 h-4" />
                    {isShuffle && <span className="w-1 h-1 rounded-full theme-bg-accent mt-0.5" />}
                  </button>

                  <button 
                    onClick={playPrevTrack}
                    className="text-zinc-300 hover:text-white transition-all cursor-pointer p-1 hover:scale-105 active:scale-95"
                    title="Предыдущий трек"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={togglePlay}
                    className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:scale-108 active:scale-95 transition-all shadow-xl cursor-pointer"
                    title={isPlaying ? "Пауза (Пробел)" : "Воспроизвести (Пробел)"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-black fill-black" />
                    ) : (
                      <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    )}
                  </button>

                  <button 
                    onClick={playNextTrack}
                    className="text-zinc-300 hover:text-white transition-all cursor-pointer p-1 hover:scale-105 active:scale-95"
                    title="Следующий трек"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={() => {
                      setIsRepeat(prev => !prev);
                      showToast(!isRepeat ? 'Повтор трека включён' : 'Повтор трека выключен');
                    }}
                    className={`transition-all cursor-pointer hidden sm:flex flex-col items-center p-1 relative ${isRepeat ? 'theme-accent' : 'text-zinc-400 hover:text-white'}`} 
                    title="Повтор трека"
                  >
                    <Repeat className="w-4 h-4" />
                    {isRepeat && <span className="w-1 h-1 rounded-full theme-bg-accent mt-0.5" />}
                  </button>
                </div>

                {/* Progress Timeline Scrubber */}
                <div className="hidden sm:flex items-center gap-2.5 w-full max-w-md">
                  <span className="text-[10px] text-zinc-400 font-mono tabular-nums w-7 text-right">
                    {formatElapsedFromProgress(playbackProgress, currentTrack?.duration)}
                  </span>
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                      setPlaybackProgress(pct);
                    }}
                    className="h-1 flex-1 bg-zinc-700/80 hover:h-1.5 rounded-full overflow-hidden transition-all cursor-pointer group relative"
                  >
                    <div 
                      className="h-full bg-white group-hover:bg-[var(--accent-color)] transition-all duration-150 rounded-full" 
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono tabular-nums w-7">
                    {currentTrack?.duration || '3:15'}
                  </span>
                </div>
              </div>

              {/* Right: Quick Tools & Hide Toggle */}
              <div className="flex items-center justify-end gap-3 sm:gap-4 sm:w-1/3 text-zinc-400 shrink-0">
                {currentTrack && (
                  <button 
                    onClick={() => navigateTo('track', { id: currentTrack.id })}
                    className="hover:text-white transition-colors cursor-pointer hidden md:block p-1.5"
                    title="Открыть страницу трека"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}

                <button 
                  onClick={() => setIsQueueOpen(prev => !prev)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isQueueOpen ? 'text-white bg-white/20' : 'hover:text-white'
                  }`}
                  title="Очередь воспроизведения (Play Queue)"
                >
                  <ListMusic className="w-4 h-4" />
                </button>

                <div className="hidden md:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(prev => !prev)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? "Включить звук" : "Выключить звук"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                      setVolume(pct);
                      if (pct > 0 && isMuted) setIsMuted(false);
                    }}
                    className="w-16 h-1 bg-zinc-700 hover:h-1.5 rounded-full cursor-pointer overflow-hidden transition-all group"
                    title={`Громкость: ${isMuted ? 0 : volume}%`}
                  >
                    <div 
                      className="h-full bg-white group-hover:bg-[var(--accent-color)] transition-all" 
                      style={{ width: `${isMuted ? 0 : volume}%` }}
                    />
                  </div>
                </div>

                {/* Hide Player Button */}
                <button 
                  onClick={() => setIsPlayerHidden(true)}
                  className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer"
                  title="Скрыть панель в капсулу"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>

                {/* Dismiss Player Completely */}
                <button 
                  onClick={() => handleSetPlayerDismissed(true)}
                  className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer"
                  title="Закрыть аудиоплеер"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Restore Player Button when hidden */}
        {!isPlayerDismissed && isPlayerHidden && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 md:bottom-5 right-5 z-[80] bg-zinc-900/95 border border-white/15 hover:border-white/30 text-white pl-3.5 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-2.5 backdrop-blur-xl transition-all group"
          >
            <button
              onClick={() => setIsPlayerHidden(false)}
              className="flex items-center gap-2.5 hover:text-white cursor-pointer select-none"
              title="Развернуть аудиоплеер"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'theme-bg-accent animate-pulse' : 'bg-zinc-500'}`}></span>
              <Music className="w-4 h-4 theme-accent" />
              <span className="text-xs font-bold truncate max-w-[130px]">
                {currentTrack ? currentTrack.title : 'Плеер'}
              </span>
              <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSetPlayerDismissed(true);
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Закрыть плеер"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Mobile Navigation */}
        <nav className="app-mobile-nav md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-xl border-t border-white/5 z-[70] flex items-center justify-around px-1">
          <SidebarItem icon={Home} label="Главная" active={nav.view === 'home'} onClick={() => navigateTo('home')} compact />
          <SidebarItem icon={TrendingUp} label="Чарты" active={nav.view === 'charts'} onClick={() => navigateTo('charts')} compact />
          <SidebarItem icon={Award} label="Рейтинг" active={nav.view === 'rating'} onClick={() => navigateTo('rating')} compact />
          <SidebarItem icon={Search} label="Поиск" active={nav.view === 'search'} onClick={() => navigateTo('search')} compact />
          <SidebarItem 
            icon={Heart} 
            label="Любимое" 
            active={nav.view === 'likes'} 
            onClick={() => navigateTo('likes')} 
            compact 
            customBadge={<Heart className={`w-4 h-4 ${nav.view === 'likes' ? 'theme-accent fill-current' : 'text-zinc-400'}`} style={nav.view === 'likes' ? { color: theme.accentColor } : {}} />} 
          />
          <SidebarItem icon={Library} label="Медиатека" active={nav.view === 'library'} onClick={() => navigateTo('library')} compact />
          <SidebarItem icon={Settings2} label="Студия" active={nav.view === 'creator'} onClick={() => navigateTo('creator')} compact />
        </nav>


        {/* Play Queue Side Drawer (Screenshot 1) */}
        <PlayQueueDrawer
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
          tracks={viewTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={playTrack}
          togglePlay={togglePlay}
          playNextTrack={playNextTrack}
          playPrevTrack={playPrevTrack}
          toggleLikeTrack={toggleLikeTrack}
          playbackProgress={playbackProgress}
          setPlaybackProgress={setPlaybackProgress}
          albums={viewAlbums}
          navigateTo={navigateTo}
        />
      </main>
    </div>
  );
}

// --- Content Views ---

function LikesView({
  artists,
  albums,
  tracks,
  followedArtistIds,
  toggleFollowArtist,
  toggleLikeTrack,
  toggleLikeAlbum,
  navigateTo,
  onPlayTrack,
  openLightbox,
  currentTrackId,
  isPlaying
}: {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  followedArtistIds: string[];
  toggleFollowArtist: (id: string) => void;
  toggleLikeTrack: (id: string) => void;
  toggleLikeAlbum: (id: string) => void;
  navigateTo: (view: ViewType, params?: { id?: string }) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onMoreOptionsClick?: (item: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums' | 'artists'>('tracks');
  
  const likedTracks = tracks.filter(t => t.isLiked);
  const likedAlbums = albums.filter(a => a.isLiked);
  const followedArtists = artists.filter(a => followedArtistIds.includes(a.id));

  return (
    <div className="min-h-full pb-24">
      {/* Spotify Header with Gradient Heart */}
      <div className="bg-gradient-to-b from-indigo-900/60 via-zinc-900/70 to-[var(--bg-color)] px-6 md:px-8 pt-8 pb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Gradient Heart Box */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-2xl shadow-2xl flex-shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center border border-white/20">
            <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
          </div>

          {/* Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 flex-1">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">
              Плейлист
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-3 leading-tight">
              Любимое
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs md:text-sm text-zinc-300">
              <span className="font-semibold text-white">Моя коллекция</span>
              <span className="text-zinc-500">•</span>
              <span>{likedTracks.length} {likedTracks.length === 1 ? 'трек' : (likedTracks.length < 5 ? 'трека' : 'треков')}</span>
              {likedTracks.length > 0 && (
                <>
                  <span className="text-zinc-500">•</span>
                  <span>{calcTotalDuration(likedTracks)}</span>
                </>
              )}
              <span className="text-zinc-500">•</span>
              <span>{followedArtists.length} {followedArtists.length === 1 ? 'подписка' : 'подписок'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Play actions + Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 gap-4 border-b border-white/5">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => likedTracks[0] && onPlayTrack(likedTracks[0])}
              disabled={likedTracks.length === 0}
              className="w-14 h-14 rounded-full theme-bg-accent hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Воспроизвести все"
            >
              <Play className="text-black fill-black ml-1 w-6 h-6" />
            </button>
            <button 
              onClick={() => {
                if (likedTracks.length > 0) {
                  const rnd = likedTracks[Math.floor(Math.random() * likedTracks.length)];
                  onPlayTrack(rnd);
                }
              }}
              disabled={likedTracks.length === 0}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 disabled:opacity-30"
              title="Перемешать"
            >
              <Shuffle className="w-6 h-6" />
            </button>
          </div>

          {/* Sub tabs */}
          <div className="flex gap-2 p-1 bg-zinc-900/60 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('tracks')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'tracks' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              Треки ({likedTracks.length})
            </button>
            <button 
              onClick={() => setActiveTab('albums')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'albums' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              Альбомы ({likedAlbums.length})
            </button>
            <button 
              onClick={() => setActiveTab('artists')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'artists' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              Подписки ({followedArtists.length})
            </button>
          </div>
        </div>

        {/* Content based on Tab */}
        <div className="pt-6">
          {activeTab === 'tracks' && (
            <div>
              {likedTracks.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <Heart className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-lg font-bold text-zinc-300">В любимых пока ничего нет</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">Нажмите сердечко рядом с любым треком, чтобы добавить его в эту коллекцию.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {likedTracks.map((t, i) => (
                    <TrackRow 
                      key={t.id} 
                      track={t} 
                      index={i} 
                      toggleLike={toggleLikeTrack} 
                      onTrackClick={() => navigateTo('track', { id: t.id })}
                      onPlay={() => onPlayTrack(t)}
                      onArtworkClick={() => openLightbox({ url: t.coverUrl, title: t.title, subtitle: t.artistName, type: 'Трек' })}
                      isPlayingTrack={isPlaying && currentTrackId === t.id}
                      size="lg" 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'albums' && (
            <div>
              {likedAlbums.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <Disc className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-lg font-bold text-zinc-300">Любимых альбомов пока нет</p>
                  <p className="text-xs text-zinc-500">Нажмите сердечко на странице альбома, чтобы сохранить его.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {likedAlbums.map(album => (
                    <div 
                      key={album.id}
                      onClick={() => navigateTo('album', { id: album.id })}
                      className="p-3.5 bg-zinc-900/40 hover:bg-zinc-800/80 rounded-xl transition-all group cursor-pointer border border-white/5"
                    >
                      <CoverArt 
                        url={album.coverUrl} 
                        title={album.title}
                        className="aspect-square w-full rounded-lg overflow-hidden mb-3 relative shadow-md bg-zinc-800"
                        innerClassName="group-hover:scale-105"
                      />
                      <p className="font-bold text-sm text-white truncate">{album.title}</p>
                      <p className="text-xs text-zinc-400 mt-1 truncate">{album.artistName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'artists' && (
            <div>
              {followedArtists.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <User className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-lg font-bold text-zinc-300">Вы пока не подписаны на артистов</p>
                  <p className="text-xs text-zinc-500">Нажмите «Подписаться» в профиле исполнителя, чтобы следить за его релизами.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {followedArtists.map(artist => (
                    <div 
                      key={artist.id}
                      onClick={() => navigateTo('artist', { id: artist.id })}
                      className="p-4 bg-zinc-900/40 hover:bg-zinc-800/80 rounded-2xl transition-all group cursor-pointer border border-white/5 flex flex-col items-center text-center"
                    >
                      <CoverArt 
                        url={artist.imageUrl} 
                        title={artist.name} 
                        isArtist={true}
                        className="w-24 h-24 rounded-full mb-3 shadow-xl bg-zinc-800 border border-white/10" 
                        innerClassName="group-hover:scale-105 transition-transform"
                      />
                      <p className="font-bold text-sm text-white truncate w-full">{artist.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{formatListeners(artist.followers)}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFollowArtist(artist.id); }}
                        className="mt-3 px-3 py-1 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-xs font-semibold rounded-full transition-all cursor-pointer"
                      >
                        Отписаться
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Charts & Ratings View ---

// (old ChartsView was replaced by ChartsPro from MusaicPlus.tsx)

// --- ALBUM VALUE CALCULATOR & VIEW ---

export const GemIcon: React.FC<{ tier: 'silver' | 'gold' | 'emerald' | 'sapphire' | 'ruby' | string; className?: string }> = ({ tier, className = "w-5 h-5" }) => {
  switch (tier) {
    case 'ruby':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          <polygon points="6,3 18,3 22,9 12,21 2,9" fill="url(#rubyGrad)" stroke="#fecdd3" strokeWidth="0.75" />
          <polygon points="6,3 18,3 15,9 9,9" fill="#ffffff" fillOpacity="0.3" />
          <polygon points="9,9 15,9 12,21" fill="#000000" fillOpacity="0.2" />
          <line x1="2" y1="9" x2="22" y2="9" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.5" />
        </svg>
      );
    case 'sapphire':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sapphireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="url(#sapphireGrad)" stroke="#bfdbfe" strokeWidth="0.75" />
          <polygon points="12,2 20,7 12,12 4,7" fill="#ffffff" fillOpacity="0.3" />
          <line x1="12" y1="12" x2="12" y2="22" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
        </svg>
      );
    case 'emerald':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>
          <polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8" fill="url(#emeraldGrad)" stroke="#a7f3d0" strokeWidth="0.75" />
          <polygon points="8,2 16,2 16,8 8,8" fill="#ffffff" fillOpacity="0.3" />
          <line x1="2" y1="8" x2="22" y2="8" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
          <line x1="2" y1="16" x2="22" y2="16" stroke="#000000" strokeWidth="0.5" strokeOpacity="0.3" />
        </svg>
      );
    case 'gold':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="9.5" fill="url(#goldGrad)" stroke="#fef08a" strokeWidth="0.8" />
          <circle cx="12" cy="12" r="6.5" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.6" strokeDasharray="3 2" />
          <polygon points="12,6 13.8,9.6 17.7,10.2 14.9,12.9 15.6,16.8 12,14.9 8.4,16.8 9.1,12.9 6.3,10.2 10.2,9.6" fill="#ffffff" fillOpacity="0.85" />
        </svg>
      );
    default: // silver
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <polygon points="12,2 21,8 18,19 6,19 3,8" fill="url(#silverGrad)" stroke="#f1f5f9" strokeWidth="0.75" />
          <polygon points="12,2 21,8 12,11 3,8" fill="#ffffff" fillOpacity="0.3" />
          <line x1="12" y1="11" x2="12" y2="19" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
        </svg>
      );
  }
};

export function getAlbumValueTier(score: number) {
  if (score >= 24.0) {
    return {
      key: 'ruby',
      title: 'Рубиновый альбом',
      badgeBg: 'bg-gradient-to-br from-rose-950/90 via-red-900/70 to-zinc-950',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/50',
      glowColor: 'shadow-[0_0_30px_rgba(244,63,94,0.35)]',
      gemGradient: 'from-red-500 via-rose-600 to-pink-700'
    };
  } else if (score >= 18.0) {
    return {
      key: 'sapphire',
      title: 'Сапфировый альбом',
      badgeBg: 'bg-gradient-to-br from-blue-950/90 via-indigo-900/70 to-zinc-950',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/50',
      glowColor: 'shadow-[0_0_30px_rgba(59,130,246,0.35)]',
      gemGradient: 'from-blue-500 via-indigo-600 to-cyan-500'
    };
  } else if (score >= 12.0) {
    return {
      key: 'emerald',
      title: 'Изумрудный альбом',
      badgeBg: 'bg-gradient-to-br from-emerald-950/90 via-teal-900/70 to-zinc-950',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/50',
      glowColor: 'shadow-[0_0_30px_rgba(16,185,129,0.35)]',
      gemGradient: 'from-emerald-400 via-teal-500 to-green-600'
    };
  } else if (score >= 6.0) {
    return {
      key: 'gold',
      title: 'Золотой альбом',
      badgeBg: 'bg-gradient-to-br from-amber-950/90 via-yellow-900/70 to-zinc-950',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/50',
      glowColor: 'shadow-[0_0_30px_rgba(245,158,11,0.35)]',
      gemGradient: 'from-amber-400 via-yellow-500 to-amber-600'
    };
  } else {
    return {
      key: 'silver',
      title: 'Серебряный альбом',
      badgeBg: 'bg-gradient-to-br from-zinc-900/90 via-slate-800/70 to-zinc-950',
      textColor: 'text-zinc-300',
      borderColor: 'border-zinc-700/50',
      glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]',
      gemGradient: 'from-zinc-300 via-slate-400 to-zinc-500'
    };
  }
}

export function calculateAlbumValueScore(
  rarityGenre: number,
  rarityFormat: number,
  integrityFormat: number,
  integrityGenre: number,
  integrityMeaning: number,
  depthScore: number,
  rhymes: number,
  structure: number,
  style: number,
  charisma: number,
  authorFame: number,
  expectation: number
): AlbumValueRating {
  const rarityScore = Number((((rarityGenre + rarityFormat) / 6) * 5).toFixed(2));
  const integrityScore = Number((((integrityFormat + integrityGenre + integrityMeaning) / 7) * 5).toFixed(2));
  const qualityPct = Number((((rhymes + structure + style + charisma) / 40) * 100).toFixed(1));
  const influenceScore = Number((1.12 + (((authorFame + expectation - 2) / 8) * 0.88)).toFixed(2));

  const rawTotal = (rarityScore + integrityScore + depthScore) * (qualityPct / 100) * influenceScore;
  const totalValue = Number(rawTotal.toFixed(2));
  const tier = getAlbumValueTier(totalValue);

  return {
    albumId: '',
    rarityGenre,
    rarityFormat,
    rarityScore,
    integrityFormat,
    integrityGenre,
    integrityMeaning,
    integrityScore,
    depthScore,
    rhymes,
    structure,
    style,
    charisma,
    qualityPct,
    authorFame,
    expectation,
    influenceScore,
    totalValue,
    categoryKey: tier.key as any,
    categoryTitle: tier.title as any,
    evaluationsCount: 1,
    reviewsCount: 1,
    updatedAt: new Date().toISOString()
  };
}

// Modal explaining formula and tiers
function AlbumValueInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121624] border border-[#232f48] rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative text-left">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-black text-white flex items-center gap-2">
          <Disc className="w-6 h-6 text-emerald-400" />
          <span>Как рассчитывается ценность альбомов</span>
        </h3>

        <div className="space-y-4 text-xs md:text-sm text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <p className="font-bold text-white">Формула ценности:</p>
            <p className="font-mono text-emerald-400 text-xs bg-black/60 p-2.5 rounded-xl border border-emerald-500/20">
              Ценность = (Редкость [1-5] + Целостность [1-5] + Глубина [1-5]) × Качество % × Влияние [1.12 - 2.00]
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white">Критерии и параметры:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li><strong className="text-zinc-200">1. Редкость [1-5]:</strong> рассчитывается из редкости жанра (1-3) и формата (1-3).</li>
              <li><strong className="text-zinc-200">2. Целостность [1-5]:</strong> состоит из формата релиза (1-2), жанровой целостности (1-3) и смысловой целостности (1-2).</li>
              <li><strong className="text-zinc-200">3. Глубина [1-5]:</strong> концептуальная выдержка и смысловой пласт альбома.</li>
              <li><strong className="text-zinc-200">4. Качество %:</strong> средняя оценка за Рифмы, Структуру, Стиль и Харизму (0% – 100%).</li>
              <li><strong className="text-zinc-200">5. Влияние [1.12 – 2.00]:</strong> рейтинг популярности артиста (1-5) и ожидания релиза (1-5).</li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <p className="font-bold text-white">Категории и типы альбомов:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center gap-2.5">
                <GemIcon tier="silver" className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold text-zinc-200">Серебряный альбом</p>
                  <p className="text-[10px] text-zinc-400">0.34 – 5.99 балла</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2.5">
                <GemIcon tier="gold" className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold text-amber-300">Золотой альбом</p>
                  <p className="text-[10px] text-amber-400/80">6.00 – 11.99 балла</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5">
                <GemIcon tier="emerald" className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-300">Изумрудный альбом</p>
                  <p className="text-[10px] text-emerald-400/80">12.00 – 17.99 балла</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2.5">
                <GemIcon tier="sapphire" className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold text-blue-300">Сапфировый альбом</p>
                  <p className="text-[10px] text-blue-400/80">18.00 – 23.99 балла</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center sm:col-span-2 gap-2.5">
                <GemIcon tier="ruby" className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold text-rose-300">Рубиновый альбом</p>
                  <p className="text-[10px] text-rose-400/80">24.00 – 30.00 баллов</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl theme-bg-accent text-black font-extrabold text-xs hover:opacity-90 transition-all cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

// Interactive Album Picker Modal
function AlbumPickerModal({
  isOpen,
  albums,
  onClose,
  onSelectAlbum
}: {
  isOpen: boolean;
  albums: Album[];
  onClose: () => void;
  onSelectAlbum: (album: Album) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unrated' | 'rated'>('all');

  if (!isOpen) return null;

  const filtered = albums.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.artistName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'rated') return Boolean(a.rating);
    if (filter === 'unrated') return !a.albumValue;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e111a] border border-[#222b40] rounded-[2rem] max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative text-left max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div>
            <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Disc className="w-6 h-6 text-emerald-400" />
              <span>Выберите альбом для оценки</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Выберите релиз из вашей коллекции для присвоения ценности</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или исполнителю..."
              className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white outline-none focus:border-emerald-400/50 transition-all placeholder:text-zinc-500"
            />
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-white/20 text-white border border-white/20 shadow-md' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              Все ({albums.length})
            </button>
            <button
              onClick={() => setFilter('unrated')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === 'unrated' ? 'bg-white/20 text-white border border-white/20 shadow-md' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              Неоценённые ({albums.filter(a => !a.rating).length})
            </button>
            <button
              onClick={() => setFilter('rated')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === 'rated' ? 'bg-white/20 text-white border border-white/20 shadow-md' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              Оценённые ({albums.filter(a => Boolean(a.rating)).length})
            </button>
          </div>
        </div>

        {/* Grid of Albums */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[280px]">
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Disc className="w-10 h-10 text-zinc-600 mx-auto opacity-40" />
              <p className="text-sm font-bold text-zinc-400">Альбомы не найдены</p>
              <p className="text-xs text-zinc-600">Попробуйте изменить поисковый запрос или сбросить фильтры</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filtered.map(a => {
                const tier = a.albumValue ? getAlbumValueTier(a.albumValue.totalValue) : null;
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectAlbum(a);
                      onClose();
                    }}
                    className="p-3 bg-[#18181b]/90 hover:bg-zinc-800/90 border border-white/10 hover:border-emerald-400/50 rounded-2xl cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-zinc-900 border border-white/5">
                        <CoverArt url={a.coverUrl} title={a.title} className="w-full h-full" innerClassName="group-hover:scale-105 transition-transform duration-300" />
                        {tier && (
                          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-md">
                            <GemIcon tier={tier.key} className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <p className="font-extrabold text-xs text-white truncate text-center group-hover:text-emerald-300">{a.title}</p>
                      <p className="text-[11px] text-zinc-400 truncate text-center font-medium mt-0.5">{a.artistName}</p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/5 text-center">
                      <span className="text-[10px] font-bold text-emerald-400 hover-text-link">
                        {tier ? `Оценка: ${a.albumValue?.totalValue}` : '+ Оценить ценность'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Luxury Slider for Album Value Criteria ---
const LuxuryValueSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  gradient?: string;
  badgeStyle?: string;
  unit?: string;
}> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  gradient = "from-sky-500 to-blue-600",
  badgeStyle = "text-sky-300 bg-sky-500/15 border-sky-500/25",
  unit = ""
}) => {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="space-y-1.5 py-1 select-none group/val-slider">
      <div className="flex justify-between items-center text-xs">
        <span className="font-extrabold text-zinc-300 group-hover/val-slider:text-white transition-colors">
          {label}
        </span>
        <span className={`px-2 py-0.5 rounded-lg border font-mono font-bold text-xs ${badgeStyle}`}>
          {value}{unit} <span className="text-zinc-500 font-normal">/ {max}{unit}</span>
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-2 bg-[#121624] rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-150 ease-out shadow-[0_0_10px_rgba(59,130,246,0.4)]`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        {/* Metallic Slider Thumb */}
        <div
          className="absolute w-4 h-6 bg-gradient-to-b from-white via-slate-200 to-slate-400 rounded-full border border-white shadow-[0_2px_8px_rgba(0,0,0,0.8)] pointer-events-none transition-all duration-150 -translate-x-1/2 flex items-center justify-center group-hover/val-slider:scale-110 active:scale-95 z-10"
          style={{ left: `${percent}%` }}
        >
          <div className="w-[1.5px] h-3 bg-zinc-500 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Modal for evaluation of Album Value
function AlbumValueModal({
  isOpen,
  album,
  onClose,
  onSave
}: {
  isOpen: boolean;
  album: Album | null;
  onClose: () => void;
  onSave: (albumId: string, valueRating: AlbumValueRating) => void;
}) {
  if (!isOpen || !album) return null;

  const initial = useMemo(() => {
    if (album.albumValue) return album.albumValue;
    if (album.rating) {
      return calculateAlbumValueScore(
        1, 1, 1, 1, 1, 1, 
        album.rating.rhymes || 1, 
        album.rating.structure || 1, 
        album.rating.style || 1, 
        album.rating.charisma || 1, 
        1, 1
      );
    }
    return calculateAlbumValueScore(1, 1, 1, 1, 1, 1, 10, 9, 5, 5, 1, 1);
  }, [album.albumValue, album.rating]);

  const [rarityGenre, setRarityGenre] = useState(initial.rarityGenre || 1);
  const [rarityFormat, setRarityFormat] = useState(initial.rarityFormat || 1);
  const [integrityFormat, setIntegrityFormat] = useState(initial.integrityFormat || 1);
  const [integrityGenre, setIntegrityGenre] = useState(initial.integrityGenre || 1);
  const [integrityMeaning, setIntegrityMeaning] = useState(initial.integrityMeaning || 1);
  const [depthScore, setDepthScore] = useState(initial.depthScore || 1);
  const [rhymes, setRhymes] = useState(initial.rhymes || 10);
  const [structure, setStructure] = useState(initial.structure || 9);
  const [style, setStyle] = useState(initial.style || 5);
  const [charisma, setCharisma] = useState(initial.charisma || 5);
  const [authorFame, setAuthorFame] = useState(initial.authorFame || 1);
  const [expectation, setExpectation] = useState(initial.expectation || 1);

  const currentRating = useMemo(() => {
    const val = calculateAlbumValueScore(
      rarityGenre, rarityFormat,
      integrityFormat, integrityGenre, integrityMeaning,
      depthScore, rhymes, structure, style, charisma,
      authorFame, expectation
    );
    val.albumId = album.id;
    return val;
  }, [
    album.id, rarityGenre, rarityFormat,
    integrityFormat, integrityGenre, integrityMeaning,
    depthScore, rhymes, structure, style, charisma,
    authorFame, expectation
  ]);

  const tier = getAlbumValueTier(currentRating.totalValue);

  return (
    <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 select-none">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="bg-[#070912]/95 border border-[#1b253b] rounded-[2.5rem] max-w-3xl w-full p-5 sm:p-7 space-y-5 shadow-[0_30px_90px_rgba(0,0,0,0.9)] relative text-left max-h-[92vh] flex flex-col backdrop-blur-3xl ring-1 ring-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <CoverArt url={album.coverUrl} title={album.title} className="w-12 h-12 rounded-xl shrink-0 shadow-lg border border-white/10" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">
                Формула ценности альбома
              </span>
              <h3 className="text-base sm:text-xl font-black text-white truncate leading-tight">{album.title}</h3>
              <p className="text-xs text-zinc-400 font-semibold truncate">{album.artistName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Container with Refined Metallic Aesthetics */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
          {/* Section 1: Редкость */}
          <div className="p-4 rounded-2xl bg-[#0f1422]/90 border border-[#1f2b44] space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black flex items-center justify-center border border-sky-500/30">1</span>
                <span>Редкость жанра и формата</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-[11px] font-mono font-black text-sky-400 border border-sky-500/20">
                {currentRating.rarityScore} / 5
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1 pt-1">
              <LuxuryValueSlider label="Редкость жанра" value={rarityGenre} min={1} max={3} onChange={setRarityGenre} gradient="from-cyan-500 to-blue-600" badgeStyle="text-cyan-300 bg-cyan-500/15 border-cyan-500/25" />
              <LuxuryValueSlider label="Редкость формата" value={rarityFormat} min={1} max={3} onChange={setRarityFormat} gradient="from-cyan-500 to-blue-600" badgeStyle="text-cyan-300 bg-cyan-500/15 border-cyan-500/25" />
            </div>
          </div>

          {/* Section 2: Целостность */}
          <div className="p-4 rounded-2xl bg-[#0f1422]/90 border border-[#1f2b44] space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black flex items-center justify-center border border-emerald-500/30">2</span>
                <span>Целостность релиза</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[11px] font-mono font-black text-emerald-400 border border-emerald-500/20">
                {currentRating.integrityScore} / 5
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 pt-1">
              <LuxuryValueSlider label="Формат релиза" value={integrityFormat} min={1} max={2} onChange={setIntegrityFormat} gradient="from-emerald-500 to-teal-600" badgeStyle="text-emerald-300 bg-emerald-500/15 border-emerald-500/25" />
              <LuxuryValueSlider label="Жанровая целостность" value={integrityGenre} min={1} max={3} onChange={setIntegrityGenre} gradient="from-emerald-500 to-teal-600" badgeStyle="text-emerald-300 bg-emerald-500/15 border-emerald-500/25" />
              <LuxuryValueSlider label="Смысловая целостность" value={integrityMeaning} min={1} max={2} onChange={setIntegrityMeaning} gradient="from-emerald-500 to-teal-600" badgeStyle="text-emerald-300 bg-emerald-500/15 border-emerald-500/25" />
            </div>
          </div>

          {/* Section 3: Глубина */}
          <div className="p-4 rounded-2xl bg-[#121024]/90 border border-[#2b1f47] space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black flex items-center justify-center border border-purple-500/30">3</span>
                <span>Глубина смысла</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-[11px] font-mono font-black text-purple-400 border border-purple-500/20">
                {depthScore} / 5
              </span>
            </div>
            <LuxuryValueSlider label="Вертикаль смысла и рефлексии" value={depthScore} min={1} max={5} onChange={setDepthScore} gradient="from-purple-500 via-fuchsia-500 to-violet-600" badgeStyle="text-purple-300 bg-purple-500/15 border-purple-500/25" />
          </div>

          {/* Section 4: Качество */}
          <div className="p-4 rounded-2xl bg-[#0f1422]/90 border border-[#1f2b44] space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black flex items-center justify-center border border-blue-500/30">4</span>
                <span>Качество реализации</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-mono font-black border border-blue-500/30">
                {currentRating.qualityPct}% / 100%
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1 pt-1">
              <LuxuryValueSlider label="Рифмы / Образы" value={rhymes} min={1} max={10} onChange={setRhymes} gradient="from-blue-600 to-indigo-600" badgeStyle="text-blue-300 bg-blue-500/15 border-blue-500/25" />
              <LuxuryValueSlider label="Структура / Ритмика" value={structure} min={1} max={10} onChange={setStructure} gradient="from-blue-600 to-indigo-600" badgeStyle="text-blue-300 bg-blue-500/15 border-blue-500/25" />
              <LuxuryValueSlider label="Реализация стиля" value={style} min={1} max={10} onChange={setStyle} gradient="from-blue-600 to-indigo-600" badgeStyle="text-blue-300 bg-blue-500/15 border-blue-500/25" />
              <LuxuryValueSlider label="Индивидуальность / Харизма" value={charisma} min={1} max={10} onChange={setCharisma} gradient="from-blue-600 to-indigo-600" badgeStyle="text-blue-300 bg-blue-500/15 border-blue-500/25" />
            </div>
          </div>

          {/* Section 5: Влияние */}
          <div className="p-4 rounded-2xl bg-[#16120b]/90 border border-[#3b2a14] space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black flex items-center justify-center border border-amber-500/30">5</span>
                <span>Влияние на индустрию</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[11px] font-mono font-black text-amber-400 border border-amber-500/20">
                {currentRating.influenceScore} / 2.00
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1 pt-1">
              <LuxuryValueSlider label="Известность автора" value={authorFame} min={1} max={5} onChange={setAuthorFame} gradient="from-amber-500 to-orange-500" badgeStyle="text-amber-300 bg-amber-500/15 border-amber-500/25" />
              <LuxuryValueSlider label="Ожидание релиза" value={expectation} min={1} max={5} onChange={setExpectation} gradient="from-amber-500 to-orange-500" badgeStyle="text-amber-300 bg-amber-500/15 border-amber-500/25" />
            </div>
          </div>
        </div>

        {/* Real-time Summary Crystal Bar */}
        <div className={`p-4 sm:p-5 rounded-3xl border ${tier.borderColor} ${tier.badgeBg} flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-2xl backdrop-blur-xl relative overflow-hidden group`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-lg shrink-0">
              <GemIcon tier={tier.key} className="w-7 h-7" />
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${tier.textColor}`}>{tier.title}</p>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono leading-none mt-0.5">{currentRating.totalValue}</p>
            </div>
          </div>

          <div className="text-[11px] font-bold text-zinc-300 flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 justify-center sm:justify-end">
            <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">Редкость: <strong className="text-white">{currentRating.rarityScore}</strong></span>
            <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">Целостность: <strong className="text-white">{currentRating.integrityScore}</strong></span>
            <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">Глубина: <strong className="text-white">{currentRating.depthScore}</strong></span>
            <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">Качество: <strong className="text-white">{currentRating.qualityPct}%</strong></span>
            <span className="bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">Влияние: <strong className="text-white">{currentRating.influenceScore}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 shrink-0 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(album.id, currentRating);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl theme-bg-accent text-black font-black text-xs hover:opacity-90 transition-all shadow-xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Присвоить ценность</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Dedicated View matching "Релизы по датам" aesthetic
function AlbumValueView({
  albums,
  navigateTo,
  onSaveAlbumValue,
  embedded = false
}: {
  albums: Album[];
  navigateTo: (view: ViewType, params?: { id?: string }) => void;
  onSaveAlbumValue: (albumId: string, rating: AlbumValueRating) => void;
  embedded?: boolean;
}) {
  const [filterMode, setFilterMode] = useState<'calculated' | 'assigned'>('calculated');
  const [sortOrder, setSortOrder] = useState<'newest' | 'score' | 'popular'>('newest');
  const [selectedAlbumForModal, setSelectedAlbumForModal] = useState<Album | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const albumsWithValue = useMemo(() => {
    return albums.filter(a => {
      if (filterMode === 'calculated') return Boolean(a.albumValue);
      return Boolean(a.albumValue) && a.albumValue!.totalValue > 0;
    });
  }, [albums, filterMode]);

  const sortedAlbums = useMemo(() => {
    const list = [...albumsWithValue];
    if (sortOrder === 'score') {
      return list.sort((a, b) => (b.albumValue?.totalValue || 0) - (a.albumValue?.totalValue || 0));
    }
    if (sortOrder === 'popular') {
      return list.sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0));
    }
    return list.sort((a, b) => (b.releaseYear || 2026) - (a.releaseYear || 2026));
  }, [albumsWithValue, sortOrder]);

  return (
    <div className={embedded ? 'space-y-6 animate-in fade-in duration-300' : 'p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300'}>
      {/* Page Title */}
      <h2 className={embedded ? 'text-2xl md:text-3xl font-black text-white tracking-tight text-left' : 'text-3xl md:text-5xl font-black text-white tracking-tight text-left'}>
        Ценность альбомов
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar Filter Card matching Screenshot 2 */}
        <div className="lg:col-span-1 bg-[#121520]/80 border border-white/10 rounded-3xl p-5 space-y-5 text-left shadow-xl">
          <div className="space-y-2">
            <button
              onClick={() => setFilterMode('calculated')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                filterMode === 'calculated' ? 'bg-white/15 text-white shadow-md border border-white/10' : 'bg-black/30 text-zinc-400 hover:text-white'
              }`}
            >
              Все расчеты и обсуждения ценности
            </button>
            <button
              onClick={() => setIsPickerOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold theme-bg-accent text-black hover:opacity-90 transition-all text-left cursor-pointer shadow-lg flex items-center justify-between"
            >
              <span>Форма присвоения ценности</span>
              <Plus className="w-4 h-4 text-black shrink-0" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all text-left cursor-pointer border border-white/5"
            >
              Как рассчитывается ценность альбомов
            </button>
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs text-zinc-300 font-semibold">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="valueFilter"
                checked={filterMode === 'calculated'}
                onChange={() => setFilterMode('calculated')}
                className="accent-emerald-400 cursor-pointer"
              />
              <span>Ценность рассчитывается</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="valueFilter"
                checked={filterMode === 'assigned'}
                onChange={() => setFilterMode('assigned')}
                className="accent-emerald-400 cursor-pointer"
              />
              <span>Ценность присвоена</span>
            </label>
          </div>

          <div className="pt-3 border-t border-white/10">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="newest">Сначала новые</option>
              <option value="score">По значению ценности</option>
              <option value="popular">По популярности</option>
            </select>
          </div>
        </div>

        {/* Main Grid of Albums matching "Релизы по датам" */}
        <div className="lg:col-span-3">
          {sortedAlbums.length === 0 ? (
            <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-white/5 p-8 space-y-4">
              <Disc className="w-12 h-12 text-zinc-600 mx-auto animate-spin-slow" />
              <p className="text-lg font-bold text-zinc-300">Расчётов ценности пока нет</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Выберите любой альбом в каталоге или нажмите «Форма присвоения ценности», чтобы рассчитать его ценность.
              </p>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="px-6 py-2.5 rounded-xl theme-bg-accent text-black font-extrabold text-xs cursor-pointer shadow-xl hover:scale-105 transition-all"
              >
                Выбрать альбом для оценки
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {sortedAlbums.map(alb => {
                const tier = alb.albumValue ? getAlbumValueTier(alb.albumValue.totalValue) : null;
                return (
                  <motion.div
                    key={alb.id}
                    whileHover={{ y: -6 }}
                    onClick={() => navigateTo('album', { id: alb.id })}
                    className="bg-[#18181b]/90 hover:bg-zinc-800/90 border border-white/10 hover:border-white/25 rounded-3xl p-3.5 md:p-4 transition-all duration-300 group cursor-pointer shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      {/* Square Cover Container */}
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-3 bg-zinc-900 shadow-xl border border-white/5">
                        <CoverArt
                          url={alb.coverUrl}
                          title={alb.title}
                          className="w-full h-full"
                          innerClassName="group-hover:scale-108 duration-500"
                        />

                        {/* Format Badge top-left */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-wider text-white">
                            Альбом
                          </span>
                        </div>

                        {/* Gem Icon top-right */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
                          {alb.rating && (
                            <RatingScoreBadge rating={alb.rating} size="sm" showDetailsOnHover={false} />
                          )}
                          {tier && (
                            <div className="p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center">
                              <GemIcon tier={tier.key} className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Artist Name */}
                      <p 
                        onClick={(e) => {
                          if (alb.artistId) {
                            e.stopPropagation();
                            navigateTo('artist', { id: alb.artistId });
                          }
                        }}
                        className="font-black text-sm md:text-base text-white truncate text-center hover-text-link"
                      >
                        {alb.artistName}
                      </p>

                      {/* Release Title */}
                      <p className="text-xs text-zinc-400 font-semibold truncate text-center mt-0.5">
                        {alb.title}
                      </p>
                    </div>

                    {/* Bottom Status / Category Bar */}
                    <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-zinc-400 px-1">
                      {tier ? (
                        <span className={`flex items-center gap-1.5 ${tier.textColor}`}>
                          <GemIcon tier={tier.key} className="w-3.5 h-3.5" />
                          <span>{tier.title}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500">Ценность рассчитывается</span>
                      )}
                      <span className="text-white font-mono font-black">{alb.albumValue?.totalValue ?? '—'}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlbumPickerModal
        isOpen={isPickerOpen}
        albums={albums}
        onClose={() => setIsPickerOpen(false)}
        onSelectAlbum={(alb) => setSelectedAlbumForModal(alb)}
      />

      <AlbumValueModal
        isOpen={Boolean(selectedAlbumForModal)}
        album={selectedAlbumForModal}
        onClose={() => setSelectedAlbumForModal(null)}
        onSave={onSaveAlbumValue}
      />

      <AlbumValueInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}

function ActivityFeedModal({ isOpen, onClose, artists, albums, tracks, navigateTo }: any) {
  const [sortOrder, setSortOrder] = useState<'recent' | 'silent'>('recent');
  
  const artistActivity = useMemo(() => {
    return artists.map(art => {
      const artTracks = tracks.filter(t => t.artistId === art.id);
      const artAlbums = albums.filter(al => al.artistId === art.id);
      
      const allDates = [
        ...artTracks.map(t => t.releaseDate).filter(Boolean),
        ...artAlbums.map(al => al.releaseDate).filter(Boolean)
      ].map(d => new Date(d).getTime());
      
      const lastDropTs = allDates.length > 0 ? Math.max(...allDates) : 0;
      const lastDropDate = lastDropTs > 0 ? new Date(lastDropTs).toISOString().split('T')[0] : null;
      
      return {
        ...art,
        lastDropDate,
        lastDropTs,
        tracksCount: artTracks.length,
        albumsCount: artAlbums.length
      };
    });
  }, [artists, albums, tracks]);

  const sorted = useMemo(() => {
    return [...artistActivity].sort((a, b) => {
      if (sortOrder === 'silent') return a.lastDropTs - b.lastDropTs;
      return b.lastDropTs - a.lastDropTs;
    });
  }, [artistActivity, sortOrder]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] z-10"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div>
            <h3 className="text-2xl font-black text-white">Активность артистов</h3>
            <p className="text-xs text-zinc-400 mt-1">Кто дропает чаще всех, а кто ушел в долгое затишье</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="recent">Недавние дропы</option>
              <option value="silent">Самое долгое затишье</option>
            </select>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6 text-zinc-400 hover:text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {sorted.map((art, i) => (
            <div 
              key={art.id}
              onClick={() => { onClose(); navigateTo('artist', { id: art.id }); }}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-6 text-xs font-mono text-zinc-600 font-bold">{i + 1}</span>
                <CoverArt url={art.imageUrl} title={art.name} isArtist className="w-12 h-12 rounded-full shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{art.name}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-black uppercase text-amber-400/80">💿 {art.albumsCount} альбомов</span>
                    <span className="text-[10px] font-black uppercase text-sky-400/80">🎵 {art.tracksCount} треков</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-0.5">Последний дроп</p>
                <p className={`text-xs font-mono font-bold ${art.lastDropTs === 0 ? 'text-zinc-600' : (sortOrder === 'silent' && i < 5 ? 'text-red-400' : 'text-zinc-300')}`}>
                  {art.lastDropDate ? formatDateDisplay(art.lastDropDate) : 'Нет данных'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function RatingView({
  tracks,
  albums,
  artists,
  navigateTo,
  onPlayTrack,
  toggleLikeTrack,
  openLightbox,
  currentTrackId,
  isPlaying,
  awards = [],
  onSaveAward,
  onDeleteAward,
  onSaveAlbumValue,
  initialTab = 'rating',
  initialYear,
  initialMonth,
  updateNavParams,
  showToast
}: {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string; year?: string; month?: string }) => void;
  onPlayTrack: (t: Track) => void;
  toggleLikeTrack: (id: string) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  awards?: AwardItem[];
  onSaveAward?: (award: AwardItem) => void;
  onDeleteAward?: (awardId: string) => void;
  onSaveAlbumValue?: (albumId: string, rating: AlbumValueRating) => void;
  initialTab?: 'rating' | 'awards' | 'album_value';
  initialYear?: string;
  initialMonth?: string;
  updateNavParams?: (p: any) => void;
  showToast?: (msg: string) => void;
}) {
  const normalizeTab = (t?: string): 'rating' | 'awards' | 'album_value' =>
    t === 'awards' || t === 'album_value' ? t : 'rating';

  const [activeSection, setActiveSection] = useState<'rating' | 'awards' | 'album_value'>(normalizeTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveSection(normalizeTab(initialTab));
    }
  }, [initialTab]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'plays'>('score');
  const [isNewNamesOnly, setIsNewNamesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | 'tracks' | 'albums'>('both');

  const MONTH_NAMES: Record<string, string> = {
    'all': 'Все месяцы',
    '01': 'Январь',
    '02': 'Февраль',
    '03': 'Март',
    '04': 'Апрель',
    '05': 'Май',
    '06': 'Июнь',
    '07': 'Июль',
    '08': 'Август',
    '09': 'Сентябрь',
    '10': 'Октябрь',
    '11': 'Ноябрь',
    '12': 'Декабрь',
  };

  // Optimization: Map for O(1) artist lookups
  const artistMap = useMemo(() => {
    const m = new Map<string, Artist>();
    artists.forEach(a => {
      m.set(a.id, a);
      m.set(a.name.toLowerCase().trim(), a);
    });
    return m;
  }, [artists]);

  // Filter rated tracks
  const ratedTracks = useMemo(() => {
    return tracks.filter((t: Track) => {
      if (!t.rating || !t.rating.totalScore) return false;
      const rel = t.releaseDate || '2026-01-01';
      const parts = rel.split('-');
      const y = parts[0] || '2026';
      const m = parts[1] || '01';

      if (selectedYear !== 'all' && y !== selectedYear) return false;
      if (selectedMonth !== 'all' && m !== selectedMonth) return false;
      
      if (isNewNamesOnly) {
        const key = t.artistId || (t.artistName?.toLowerCase().trim() || '');
        const artist = artistMap.get(key);
        if (artist && artist.followers > 10000000) return false;
      }
      return true;
    }).sort((a: Track, b: Track) => {
      if (sortBy === 'score') return (b.rating?.totalScore || 0) - (a.rating?.totalScore || 0);
      if (sortBy === 'recent') return new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime();
      return (b.plays || 0) - (a.plays || 0);
    });
  }, [tracks, artistMap, selectedYear, selectedMonth, sortBy, isNewNamesOnly]);

  // Filter rated albums
  const ratedAlbums = useMemo(() => {
    return albums.filter((al: Album) => {
      if (!al.rating || !al.rating.totalScore) return false;
      const rel = al.releaseDate || (al.releaseYear ? `${al.releaseYear}-01-01` : '2026-01-01');
      const parts = rel.split('-');
      const y = parts[0] || al.releaseYear?.toString() || '2026';
      const m = parts[1] || '01';

      if (selectedYear !== 'all' && y !== selectedYear) return false;
      if (selectedMonth !== 'all' && m !== selectedMonth) return false;

      if (isNewNamesOnly) {
        const key = al.artistId || (al.artistName?.toLowerCase().trim() || '');
        const artist = artistMap.get(key);
        if (artist && artist.followers > 10000000) return false;
      }
      return true;
    }).sort((a: Album, b: Album) => {
      if (sortBy === 'score') return (b.rating?.totalScore || 0) - (a.rating?.totalScore || 0);
      if (sortBy === 'recent') return new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime();
      return (b.totalPlays || 0) - (a.totalPlays || 0);
    });
  }, [albums, artistMap, selectedYear, selectedMonth, sortBy, isNewNamesOnly]);


  const showTracks = viewMode === 'both' || viewMode === 'tracks';
  const showAlbums = viewMode === 'both' || viewMode === 'albums';

  // Incremental loading for better performance
  const visibleTracksCount = useVisibleCount(20, 20, ratedTracks.length);
  const visibleAlbumsCount = useVisibleCount(20, 20, ratedAlbums.length);

  const displayedRatedTracks = ratedTracks.slice(0, visibleTracksCount);
  const displayedRatedAlbums = ratedAlbums.slice(0, visibleAlbumsCount);

  return (
    <div className="p-scale pb-28 space-y-8 animate-in">
      {/* Top Section Tab Switcher: Официальный рейтинг vs Премии */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setActiveSection('rating');
              updateNavParams?.({ tab: 'rating' });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSection === 'rating'
                ? 'bg-white text-black shadow-lg'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Официальный рейтинг</span>
          </button>

          <button
            onClick={() => {
              if (activeSection === 'rating') {
                setActiveSection('awards');
                updateNavParams?.({ tab: 'awards' });
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSection === 'awards' || activeSection === 'album_value'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Премии</span>
          </button>
        </div>

        {(activeSection === 'awards' || activeSection === 'album_value') && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveSection('awards');
                updateNavParams?.({ tab: 'awards' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'awards' ? 'bg-white/12 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Лауреаты и итоги</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection('album_value');
                updateNavParams?.({ tab: 'album_value' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'album_value' ? 'bg-white/12 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5 text-sky-400" />
              <span>Ценность альбомов</span>
            </button>
          </div>
        )}
      </div>

      {activeSection === 'awards' ? (
        <AwardsView
          awards={awards}
          albums={albums}
          tracks={tracks}
          artists={artists}
          navigateTo={navigateTo}
          openLightbox={openLightbox}
          onPlayTrack={onPlayTrack}
          onSaveAward={onSaveAward || (() => {})}
          onDeleteAward={onDeleteAward || (() => {})}
          initialYear={initialYear}
          initialMonth={initialMonth}
          updateNavParams={updateNavParams}
          showToast={showToast}
        />
      ) : activeSection === 'album_value' ? (
        <AlbumValueView
          albums={albums}
          navigateTo={navigateTo}
          onSaveAlbumValue={onSaveAlbumValue || (() => {})}
          embedded
        />
      ) : (
        <div className="space-y-10">
          {/* Header - Simple 'Рейтинг' per Request 2 */}
          <div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter">
              Рейтинг
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-bold uppercase tracking-[0.2em]">
              Официальные оценки музыкальных экспертов
            </p>
          </div>

      {/* Filter & Sort Bar */}
      <div className="bg-zinc-900/60 p-4 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
            {[
              { id: 'both', label: 'Все' },
              { id: 'tracks', label: 'Треки' },
              { id: 'albums', label: 'Альбомы' }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => setViewMode(m.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${viewMode === m.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/5 mx-1 hidden md:block"></div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs font-black text-white outline-none cursor-pointer focus:border-white/20 transition-all"
          >
            <option value="all">Все время</option>
            <option value="2026">2026 год</option>
            <option value="2025">2025 год</option>
            <option value="2024">2024 год</option>
            <option value="2023">2023 год</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs font-black text-white outline-none cursor-pointer focus:border-white/20 transition-all"
          >
            {Object.entries(MONTH_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs font-black text-white outline-none cursor-pointer focus:border-white/20 transition-all"
          >
            <option value="score">Сортировка: Балл</option>
            <option value="recent">Сортировка: Дата</option>
            <option value="plays">Сортировка: Стримы</option>
          </select>
        </div>

        <button
          onClick={() => setIsNewNamesOnly(!isNewNamesOnly)}
          className={`px-6 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer border ${
            isNewNamesOnly 
              ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' 
              : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
          }`}
        >
          Новые имена
        </button>
      </div>

      {/* Grid Layout based on viewMode */}
      <div className={`grid gap-3 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Left Column: Треки */}
        {showTracks && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <Music className="w-5 h-5 theme-accent" />
                <span>Треки</span>
                <span className="text-[10px] font-black text-zinc-500 px-2 py-0.5 bg-white/5 rounded-full border border-white/5 tabular-nums">
                  {ratedTracks.length}
                </span>
              </h3>
            </div>

            {ratedTracks.length === 0 ? (
              <div className="py-20 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                Пусто
              </div>
            ) : (
              <div className={`gap-2.5 ${viewMode === 'tracks' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col space-y-1.5'}`}>
                {displayedRatedTracks.map((t: Track) => (
                  <div
                    key={t.id}
                    onClick={() => navigateTo('track', { id: t.id })}
                    className="p-1.5 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between gap-2.5 shadow-lg"
                  >

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CoverArt 
                        url={getTrackCover(t, albums)} 
                        title={t.title}
                        albumTitle={t.albumTitle}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden shadow-xl bg-zinc-800 shrink-0 border border-white/5 relative"
                        innerClassName="duration-300"
                      />


                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm md:text-base text-white truncate group-hover:text-amber-300 transition-colors leading-tight">
                          {t.title}
                        </p>
                        <p 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (t.artistId) navigateTo('artist', { id: t.artistId, artistName: t.artistName });
                            else navigateTo('artist', { artistName: t.artistName });
                          }}
                          className="text-xs font-bold text-zinc-500 hover:text-white hover:underline cursor-pointer truncate mt-1 transition-colors"
                        >
                          {t.artistName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {t.rating && (
                        <div className="flex items-center gap-2">
                          <RatingScoreBadge rating={t.rating} size="md" showDetailsOnHover={true} />
                          {t.rating.vibe && viewMode !== 'tracks' && (
                            <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-300 flex items-center justify-center text-[10px] font-black font-mono shadow-inner">
                              {t.rating.vibe}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onPlayTrack && onPlayTrack(t); }}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white text-zinc-400 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right Column: Альбомы */}
        {showAlbums && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <Disc className="w-5 h-5 theme-accent" />
                <span>Альбомы</span>
                <span className="text-[10px] font-black text-zinc-500 px-2 py-0.5 bg-white/5 rounded-full border border-white/5 tabular-nums">
                  {ratedAlbums.length}
                </span>
              </h3>
            </div>

            {ratedAlbums.length === 0 ? (
              <div className="py-20 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                Пусто
              </div>
            ) : (
              <div className={`gap-2.5 ${viewMode === 'albums' ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col space-y-1.5'}`}>
                {displayedRatedAlbums.map((al: Album) => (
                  <div
                    key={al.id}
                    onClick={() => navigateTo('album', { id: al.id })}
                    className="p-1.5 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between gap-2.5 shadow-lg"
                  >

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CoverArt 
                        url={al.coverUrl} 
                        title={al.title}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden shadow-xl bg-zinc-800 shrink-0 border border-white/5 relative"
                        innerClassName="duration-300"
                      />


                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm md:text-base text-white truncate group-hover:text-amber-300 transition-colors leading-tight">
                          {al.title}
                        </p>
                        <p 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (al.artistId) navigateTo('artist', { id: al.artistId, artistName: al.artistName });
                            else navigateTo('artist', { artistName: al.artistName });
                          }}
                          className="text-xs font-bold text-zinc-500 hover:text-white hover:underline cursor-pointer truncate mt-1 transition-colors"
                        >
                          {al.artistName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {al.rating && (
                        <div className="flex items-center gap-2">
                          <RatingScoreBadge rating={al.rating} size="md" showDetailsOnHover={true} />
                          {al.rating.vibe && viewMode !== 'albums' && (
                            <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-300 flex items-center justify-center text-[10px] font-black font-mono shadow-inner">
                              {al.rating.vibe}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const albTrks = tracks.filter((t: any) => t.albumId === al.id);
                          if (albTrks.length > 0 && onPlayTrack) onPlayTrack(albTrks[0]);
                          else navigateTo('album', { id: al.id });
                        }}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white text-zinc-400 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
}

// --- Play Queue Drawer (Screenshot 1: Side Queue with Active Track & Upcoming List) ---
function PlayQueueDrawer({
  isOpen,
  onClose,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  togglePlay,
  playNextTrack,
  playPrevTrack,
  toggleLikeTrack,
  playbackProgress,
  setPlaybackProgress,
  albums,
  navigateTo
}: {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (t: Track) => void;
  togglePlay: () => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  toggleLikeTrack: (id: string) => void;
  playbackProgress: number;
  setPlaybackProgress: (p: number) => void;
  albums: Album[];
  navigateTo: (view: ViewType, params?: any) => void;
}) {
  if (!isOpen) return null;

  const currentIndex = currentTrack ? tracks.findIndex(t => t.id === currentTrack.id) : 0;
  const queueTracks = tracks.length > 0
    ? (currentIndex >= 0 ? tracks.slice(currentIndex + 1).concat(tracks.slice(0, Math.max(0, currentIndex))) : tracks)
    : [];

  return (
    <AnimatePresence>
      <motion.div
        key="queue-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:bg-transparent lg:pointer-events-none"
      />
      <motion.aside
        key="queue-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#0c0d12]/95 border-l border-white/10 backdrop-blur-2xl z-[95] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header matching Screenshot 1 */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black text-white">
                M
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white">Musaic Listener</p>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse"></span>
                <span>Pro Studio</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Закрыть очередь"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title + Queue Counter */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-lg font-black text-white tracking-tight">Play queue</h3>
          <span className="text-xs font-mono font-bold text-zinc-400 tabular-nums bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            {currentIndex >= 0 ? currentIndex + 1 : 1}/{tracks.length}
          </span>
        </div>

        {/* Active Track Card matching Screenshot 1 */}
        {currentTrack && (
          <div className="p-4 mx-4 my-2 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-xl">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-zinc-800 flex items-center justify-center group">
              <CoverArt
                url={getTrackCover(currentTrack, albums)}
                title={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-black text-sm text-white truncate drop-shadow">{currentTrack.title}</p>
                  <p className="text-xs text-zinc-300 truncate drop-shadow">{currentTrack.artistName}</p>
                </div>
                <button
                  onClick={() => toggleLikeTrack(currentTrack.id)}
                  className="p-1.5 rounded-full bg-black/40 text-zinc-300 hover:text-white"
                >
                  <Heart className={`w-4 h-4 ${currentTrack.isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-5 my-2">
              <button 
                onClick={playPrevTrack} 
                className="text-zinc-400 hover:text-white transition-all cursor-pointer p-1"
                title="Предыдущий трек"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                title={isPlaying ? "Пауза" : "Воспроизвести"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>
              <button 
                onClick={playNextTrack} 
                className="text-zinc-400 hover:text-white transition-all cursor-pointer p-1"
                title="Следующий трек"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Scrubber */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                {(() => {
                  const dur = currentTrack.duration || '3:15';
                  const parts = dur.split(':').map(Number);
                  const totalSec = (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) ? Math.max(15, parts[0] * 60 + parts[1]) : 195;
                  const cur = Math.min(totalSec, Math.floor((playbackProgress / 100) * totalSec));
                  return `${Math.floor(cur / 60)}:${(cur % 60).toString().padStart(2, '0')}`;
                })()}
              </span>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                  setPlaybackProgress(pct);
                }}
                className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
              >
                <div className="h-full bg-white rounded-full transition-all duration-150" style={{ width: `${playbackProgress}%` }} />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono tabular-nums">{currentTrack.duration || '3:15'}</span>
            </div>
          </div>
        )}

        {/* Next Tracks List */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Далее в очереди</p>
          <span className="text-[11px] text-zinc-500 font-mono">{queueTracks.length} треков</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-1.5 custom-scrollbar">
          {queueTracks.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-10">Очередь пуста</p>
          ) : (
            queueTracks.map((trk, idx) => (
              <div
                key={trk.id + '-' + idx}
                onClick={() => onPlayTrack(trk)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group"
              >
                <CoverArt
                  url={getTrackCover(trk, albums)}
                  title={trk.title}
                  className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-white/5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                    {trk.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{trk.artistName}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeTrack(trk.id);
                    }}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <Heart className={`w-3.5 h-3.5 ${trk.isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>
                  <span className="p-1 text-zinc-500">
                    <ListMusic className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}



function HomeView({
  artists,
  albums,
  tracks,
  navigateTo,
  onPlayTrack,
  toggleLikeTrack,
  openLightbox,
  currentTrackId,
  currentTrack: _currentTrack,
  isPlaying,
  togglePlay,
  onMoreOptionsClick,
  onRateClick,
  theme: _theme,
  followedArtistIds = [],
  awards = [],
  referenceDate,
  showToast: _showToast
}: {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: NavigationState['params']) => void;
  onPlayTrack: (t: Track) => void;
  toggleLikeTrack: (id: string) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  currentTrack?: Track | null;
  isPlaying?: boolean;
  togglePlay?: () => void;
  onMoreOptionsClick?: (item: any) => void;
  onRateClick?: (item: any) => void;
  theme?: ThemeConfig;
  followedArtistIds?: string[];
  awards?: AwardItem[];
  referenceDate?: string;
  showToast?: (msg: string) => void;
}) {
  const [showcaseMode, setShowcaseMode] = useState<'critics' | 'value'>('critics');
  const [trackSort, setTrackSort] = useState<'plays' | 'rating' | 'date' | 'alpha'>('plays');
  const [artistSort, setArtistSort] = useState<'followers' | 'rating' | 'alpha' | 'tracks'>('followers');
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  const [freshSeed, setFreshSeed] = useState(() => Math.floor(Math.random() * 1000) + 1);

  const refTimeMs = useMemo(() => {
    if (referenceDate) {
      const t = new Date(referenceDate).getTime();
      if (!Number.isNaN(t)) return t;
    }
    return Date.now();
  }, [referenceDate]);

  // High-performance data indexing for O(1) lookups
  const artistDataMap = useMemo(() => {
    const scores = aggregateArtistScores(tracks, albums);
    const trackCounts = new Map<string, number>();
    const playCounts = new Map<string, number>();

    tracks.forEach(t => {
      const key = (t.artistId && t.artistId !== 'undefined') ? t.artistId : (t.artistName?.toLowerCase().trim() || '');
      trackCounts.set(key, (trackCounts.get(key) || 0) + 1);
      playCounts.set(key, (playCounts.get(key) || 0) + (t.plays || 0));
    });

    return { scores, trackCounts, playCounts };
  }, [tracks, albums]);

  const formatCompactStreams = (num: number) => {
    if (!num || Number.isNaN(num)) return '0';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}M`;
    if (num >= 1_000) return `${(num / 1_000).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}k`;
    return num.toLocaleString('ru-RU');
  };

  // Diversified Collection Mix:
  // Combines BOTH unrated and rated releases across albums & tracks,
  // giving rated releases a gentle advantage (~5/9) while keeping unrated releases (~4/9) well represented.
  const homeRecommendations = useMemo(() => {
    type ColItem = {
      id: string;
      type: 'album' | 'track';
      title: string;
      artistName: string;
      artistId?: string;
      coverUrl?: string;
      releaseDate?: string;
      genre?: string;
      plays: number;
      isSnippet?: boolean;
      rating?: RatingData;
      albumValue?: AlbumValueRating;
      raw: Album | Track;
      weight: number;
    };

    const hashStr = (str: string) => {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h);
    };

    const pool: ColItem[] = [];

    const pushCandidate = (item: Album | Track, type: 'album' | 'track') => {
      const hasRating = Boolean(item.rating);
      const rel = item.releaseDate || '2025-01-01';
      const relTime = new Date(rel).getTime();
      const diffDays = Number.isNaN(relTime) ? 180 : Math.max(1, Math.abs(refTimeMs - relTime) / 86400000);

      const freshness = 50 / (Math.log10(diffDays + 3) + 0.6);
      const ratedBonus = hasRating
        ? 14 + Math.min(12, ((item.rating?.totalScore || 65) / 90) * 12)
        : 0;

      const playsVal = type === 'track' ? (item as Track).plays || 0 : (item as Album).totalPlays || 0;
      const popularity = Math.min(16, Math.log10(Math.max(10, playsVal)) * 2.2);
      const jitter = hashStr(`${type}:${item.id}:${freshSeed}`) % 130;

      pool.push({
        id: item.id,
        type,
        title: item.title,
        artistName: item.artistName,
        artistId: item.artistId,
        coverUrl: type === 'track' ? getTrackCover(item as Track, albums) : (item as Album).coverUrl,
        releaseDate: item.releaseDate,
        genre: item.genre,
        plays: playsVal,
        isSnippet: type === 'track' ? Boolean((item as Track).isSnippet) : false,
        rating: item.rating,
        albumValue: type === 'album' ? (item as Album).albumValue : undefined,
        raw: item,
        weight: freshness + ratedBonus + popularity + jitter
      });
    };

    albums.forEach(al => pushCandidate(al, 'album'));
    tracks.forEach(tr => pushCandidate(tr, 'track'));

    const sortedPool = pool.sort((a, b) => b.weight - a.weight);
    const ratedPool = sortedPool.filter(x => Boolean(x.rating));
    const unratedPool = sortedPool.filter(x => !x.rating);
    const chosen: ColItem[] = [];
    const chosenKeys = new Set<string>();
    const artistHits = new Map<string, number>();

    const pickFrom = (source: ColItem[], limit: number) => {
      let added = 0;
      for (const item of source) {
        if (added >= limit || chosen.length >= 9) break;
        const key = `${item.type}:${item.id}`;
        if (chosenKeys.has(key)) continue;
        const aKey = (item.artistName || '').toLowerCase();
        if ((artistHits.get(aKey) || 0) >= 2 && source.length > 10) continue;
        chosen.push(item);
        chosenKeys.add(key);
        artistHits.set(aKey, (artistHits.get(aKey) || 0) + 1);
        added++;
      }
    };

    pickFrom(ratedPool, 5);
    pickFrom(unratedPool, 4);

    if (chosen.length < 9) {
      for (const item of sortedPool) {
        if (chosen.length >= 9) break;
        const key = `${item.type}:${item.id}`;
        if (!chosenKeys.has(key)) {
          chosen.push(item);
          chosenKeys.add(key);
        }
      }
    }

    return chosen.sort((a, b) => b.weight - a.weight);
  }, [albums, tracks, freshSeed, refTimeMs]);

  // Hero Spotlight items (always dynamically rotates with freshSeed)
  const heroItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'album' | 'track';
      title: string;
      artistName: string;
      artistId?: string;
      coverUrl?: string;
      releaseDate?: string;
      genre?: string;
      plays: number;
      rating?: RatingData;
      albumValue?: AlbumValueRating;
      raw: Album | Track;
    }> = [];

    const seen = new Set<string>();
    const pushItem = (raw: Album | Track, type: 'album' | 'track') => {
      const key = `${type}:${raw.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({
        id: raw.id,
        type,
        title: raw.title,
        artistName: raw.artistName,
        artistId: raw.artistId,
        coverUrl: type === 'track' ? getTrackCover(raw as Track, albums) : (raw as Album).coverUrl,
        releaseDate: raw.releaseDate,
        genre: raw.genre,
        plays: type === 'track' ? (raw as Track).plays || 0 : (raw as Album).totalPlays || 0,
        rating: raw.rating,
        albumValue: type === 'album' ? (raw as Album).albumValue : undefined,
        raw
      });
    };

    homeRecommendations.slice(0, 6).forEach(rec => pushItem(rec.raw, rec.type));

    const newestAlb = [...albums].sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime())[0];
    if (newestAlb) pushItem(newestAlb, 'album');

    return items.slice(0, 6);
  }, [homeRecommendations, albums]);

  const activeHero = heroItems[heroIndex % Math.max(1, heroItems.length)] || null;

  const navigateToRef = useRef(navigateTo);
  navigateToRef.current = navigateTo;
  const onRateClickRef = useRef(onRateClick);
  onRateClickRef.current = onRateClick;

  // Release-specific insights for the right panel of Hero Spotlight (O(N), no sorting)
  const heroInsights = useMemo(() => {
    if (!activeHero) return [];

    const sourceList = activeHero.type === 'album' ? albums : tracks;
    const getPlays = (x: Album | Track) =>
      (activeHero.type === 'album' ? (x as Album).totalPlays : (x as Track).plays) || 0;
    const heroPlays = activeHero.plays || 0;

    const artistKey = (activeHero.artistId && activeHero.artistId !== 'undefined')
      ? activeHero.artistId
      : (activeHero.artistName?.toLowerCase().trim() || '');

    let catalogRank = 1;
    let artistRank = 1;
    let artistCount = 0;
    let artistSumPlays = 0;

    for (let i = 0; i < sourceList.length; i++) {
      const item = sourceList[i];
      const p = getPlays(item);
      if (item.id !== activeHero.id && p > heroPlays) {
        catalogRank++;
      }
      const k = (item.artistId && item.artistId !== 'undefined')
        ? item.artistId
        : (item.artistName?.toLowerCase().trim() || '');
      if (k === artistKey) {
        artistCount++;
        artistSumPlays += p;
        if (item.id !== activeHero.id && p > heroPlays) {
          artistRank++;
        }
      }
    }

    const peakPos = (activeHero.raw as Track | Album).peakChartPosition;
    const weeksOnChart = (activeHero.raw as Track | Album).weeksOnChart;

    // 1. Chart peak or catalog rank
    const card1 = peakPos
      ? {
          value: `#${peakPos}`,
          suffix: undefined as string | undefined,
          label: weeksOnChart ? `Пик чарта · ${weeksOnChart} нед.` : 'Пик в чарте',
          onClick: () => navigateToRef.current('charts')
        }
      : {
          value: `#${catalogRank}`,
          suffix: `из ${sourceList.length}`,
          label: activeHero.type === 'album' ? 'В топе альбомов' : 'В топе треков',
          onClick: () => navigateToRef.current('charts')
        };

    // 2. Artist rank & stream share
    const artistTotalStreams = artistDataMap.playCounts.get(artistKey) || artistSumPlays;
    const sharePct = artistTotalStreams > 0 && heroPlays > 0
      ? Math.min(100, Math.round((heroPlays / artistTotalStreams) * 100))
      : 0;

    const card2 = {
      value: `#${artistRank}`,
      suffix: artistCount > 1 ? `из ${artistCount}` : undefined,
      label: sharePct >= 5
        ? `У артиста · ${sharePct}% стримов`
        : 'Позиция у артиста',
      onClick: () => {
        if (activeHero.artistId) navigateToRef.current('artist', { id: activeHero.artistId, artistName: activeHero.artistName });
        else navigateToRef.current('artist', { artistName: activeHero.artistName });
      }
    };

    // 3. Context fact: Top album hit OR parent album / feat / duration
    let card3: { value: string; suffix?: string; label: string; isTextValue?: boolean; onClick: () => void };
    if (activeHero.type === 'album') {
      const albObj = activeHero.raw as Album;
      let albCount = 0;
      let topTrack: Track | null = null;
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (t.albumId === activeHero.id) {
          albCount++;
          if (!topTrack || (t.plays || 0) > (topTrack.plays || 0)) topTrack = t;
        }
      }
      if (topTrack) {
        const topId = topTrack.id;
        card3 = {
          value: topTrack.title,
          label: `Главный хит · ${albCount} ${pluralizeTracks(albCount)}`,
          isTextValue: true,
          onClick: () => navigateToRef.current('track', { id: topId })
        };
      } else {
        card3 = {
          value: String(albObj.releaseYear || '—'),
          label: albObj.producer ? `Прод.: ${albObj.producer}` : 'Год выхода',
          onClick: () => navigateToRef.current('album', { id: activeHero.id })
        };
      }
    } else {
      const trk = activeHero.raw as Track;
      const parentAlb = findParentAlbumForTrack(trk, albums);
      if (parentAlb) {
        const parentId = parentAlb.id;
        card3 = {
          value: parentAlb.title,
          label: 'Из альбома',
          isTextValue: true,
          onClick: () => navigateToRef.current('album', { id: parentId })
        };
      } else if (trk.featuredArtist) {
        card3 = {
          value: trk.featuredArtist,
          label: 'При участии',
          isTextValue: true,
          onClick: () => navigateToRef.current('track', { id: trk.id })
        };
      } else {
        card3 = {
          value: trk.duration || '—',
          label: trk.composer ? `Прод.: ${trk.composer}` : (trk.isSnippet ? 'Сниппет' : 'Длительность'),
          onClick: () => navigateToRef.current('track', { id: trk.id })
        };
      }
    }

    // 4. Award / Strongest rating criterion / Album value / Relative impact
    let card4: { value: string; suffix?: string; label: string; onClick: () => void };
    const matchedAward = awards.find(aw => aw.winner?.id === activeHero.id);
    if (matchedAward) {
      card4 = {
        value: matchedAward.year,
        label: `Премия · ${matchedAward.nominationTitle}`,
        onClick: () => navigateToRef.current('rating', { tab: 'awards', year: matchedAward.year, month: matchedAward.month })
      };
    } else if (activeHero.rating) {
      const criteria = [
        { name: 'Рифмы', val: activeHero.rating.rhymes },
        { name: 'Структура', val: activeHero.rating.structure },
        { name: 'Реализация', val: activeHero.rating.style },
        { name: 'Харизма', val: activeHero.rating.charisma },
        { name: 'Вайб', val: activeHero.rating.vibe }
      ].sort((a, b) => b.val - a.val);
      const topCrit = criteria[0];
      card4 = {
        value: `${topCrit.val}`,
        suffix: '/ 10',
        label: `Сильное: ${topCrit.name}`,
        onClick: () => onRateClickRef.current ? onRateClickRef.current({ type: activeHero.type, item: activeHero.raw }) : navigateToRef.current('rating')
      };
    } else if (activeHero.albumValue) {
      card4 = {
        value: activeHero.albumValue.totalValue.toFixed(1),
        label: activeHero.albumValue.categoryTitle,
        onClick: () => navigateToRef.current('album_value')
      };
    } else {
      const artistAvg = artistCount > 0 ? artistSumPlays / artistCount : 0;
      const ratio = artistAvg > 0 ? heroPlays / artistAvg : 0;
      const artistObj = artists.find(a => a.id === activeHero.artistId || a.name === activeHero.artistName);

      if (ratio >= 1.15 && artistCount > 1) {
        card4 = {
          value: `×${ratio.toFixed(1)}`,
          label: 'К среднему у артиста',
          onClick: () => navigateToRef.current(activeHero.type === 'track' ? 'track' : 'album', { id: activeHero.id })
        };
      } else if (artistObj && artistObj.followers > 0) {
        card4 = {
          value: formatCompactStreams(artistObj.followers),
          label: 'Слушателей у артиста',
          onClick: () => navigateToRef.current('artist', { id: artistObj.id, artistName: artistObj.name })
        };
      } else {
        card4 = {
          value: `${activeHero.type === 'album' ? 'Альбом' : 'Сингл'}`,
          label: activeHero.genre || 'Оценить релиз',
          onClick: () => onRateClickRef.current ? onRateClickRef.current({ type: activeHero.type, item: activeHero.raw }) : navigateToRef.current(activeHero.type === 'track' ? 'track' : 'album', { id: activeHero.id })
        };
      }
    }

    return [card1, card2, card3, card4];
  }, [activeHero, albums, tracks, artists, awards, artistDataMap]);

  // Showcase: Critic Picks or Album Value
  const showcaseItems = useMemo(() => {
    if (showcaseMode === 'value') {
      return albums
        .filter(a => Boolean(a.albumValue))
        .sort((a, b) => (b.albumValue?.totalValue || 0) - (a.albumValue?.totalValue || 0))
        .slice(0, 6)
        .map(a => ({
          type: 'album' as const,
          data: a,
          id: a.id,
          score: a.rating?.totalScore || 0,
          valueScore: a.albumValue?.totalValue || 0,
          title: a.title,
          subtitle: a.artistName,
          cover: a.coverUrl,
          rating: a.rating,
          albumValue: a.albumValue
        }));
    }

    return [
      ...tracks.filter(t => t.rating && t.rating.totalScore >= 65).map(t => ({
        type: 'track' as const,
        data: t,
        id: t.id,
        score: t.rating!.totalScore,
        valueScore: 0,
        title: t.title,
        subtitle: t.artistName,
        cover: getTrackCover(t, albums),
        rating: t.rating,
        albumValue: undefined
      })),
      ...albums.filter(a => a.rating && a.rating.totalScore >= 65).map(a => ({
        type: 'album' as const,
        data: a,
        id: a.id,
        score: a.rating!.totalScore,
        valueScore: a.albumValue?.totalValue || 0,
        title: a.title,
        subtitle: a.artistName,
        cover: a.coverUrl,
        rating: a.rating,
        albumValue: a.albumValue
      }))
    ].sort((a, b) => b.score - a.score).slice(0, 6);
  }, [tracks, albums, showcaseMode]);

  // Sorted tracks
  const sortedTracks = useMemo(() => [...tracks].sort((a, b) => {
    if (trackSort === 'plays') return (b.plays || 0) - (a.plays || 0);
    if (trackSort === 'rating') return (b.rating?.totalScore || 0) - (a.rating?.totalScore || 0);
    if (trackSort === 'date') return new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime();
    if (trackSort === 'alpha') return (a.title || '').localeCompare(b.title || '', 'ru');
    return 0;
  }), [tracks, trackSort]);

  const filteredTracks = useMemo(() => trackQuery.trim()
    ? sortedTracks.filter(t =>
        t.title.toLowerCase().includes(trackQuery.toLowerCase()) ||
        t.artistName.toLowerCase().includes(trackQuery.toLowerCase())
      )
    : sortedTracks, [sortedTracks, trackQuery]);

  // Sorted artists
  const sortedArtists = useMemo(() => [...artists].map(art => {
    const key = art.id || (art.name?.toLowerCase().trim() || '');
    const scoreEntry = artistDataMap.scores.get(key);
    const avgScore = scoreEntry ? (scoreEntry.sum / scoreEntry.count) : 0;
    const trackCount = artistDataMap.trackCounts.get(key) || 0;
    const totalPlays = artistDataMap.playCounts.get(key) || 0;
    return { ...art, avgScore, trackCount, totalPlays };
  }).sort((a, b) => {
    if (artistSort === 'followers') return (b.followers || 0) - (a.followers || 0);
    if (artistSort === 'rating') return (b.avgScore || 0) - (a.avgScore || 0);
    if (artistSort === 'alpha') return (a.name || '').localeCompare(b.name || '', 'ru');
    if (artistSort === 'tracks') return (b.trackCount || 0) - (a.trackCount || 0);
    return 0;
  }), [artists, artistSort, artistDataMap]);

  const filteredArtists = useMemo(() => artistQuery.trim()
    ? sortedArtists.filter(a => a.name.toLowerCase().includes(artistQuery.toLowerCase()))
    : sortedArtists, [sortedArtists, artistQuery]);

  const isTracksExpanded = showAllTracks || Boolean(trackQuery.trim());
  const isArtistsExpanded = showAllArtists || Boolean(artistQuery.trim());
  const homeArtistsBatch = useScrollBatchCount(
    filteredArtists.length,
    24,
    24,
    `${isArtistsExpanded}-${artistSort}-${artistQuery}`
  );

  const displayedTracks = isTracksExpanded ? filteredTracks : sortedTracks.slice(0, 8);
  const displayedArtists = isArtistsExpanded ? filteredArtists.slice(0, homeArtistsBatch.visibleCount) : sortedArtists.slice(0, 6);

  // Fresh recent albums sorted strictly by releaseDate
  const recentAlbums = useMemo(
    () =>
      [...albums]
        .sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime())
        .slice(0, 6),
    [albums]
  );

  // Awards (Hall of Fame)
  const recentAwards = useMemo(() => {
    return [...awards]
      .sort((a, b) => `${b.year}-${b.month || '13'}`.localeCompare(`${a.year}-${a.month || '13'}`))
      .slice(0, 3);
  }, [awards]);

  // Followed artists releases OR Rising artists (placed at bottom)
  const followedFeed = useMemo(() => {
    if (!followedArtistIds.length) return [];
    const followedSet = new Set(followedArtistIds);
    const items = [
      ...albums.filter(a => followedSet.has(a.artistId)).map(a => ({
        id: a.id,
        type: 'album' as const,
        title: a.title,
        artistId: a.artistId,
        artistName: a.artistName,
        coverUrl: a.coverUrl,
        releaseDate: a.releaseDate,
        rating: a.rating,
        raw: a
      })),
      ...tracks.filter(t => followedSet.has(t.artistId)).map(t => ({
        id: t.id,
        type: 'track' as const,
        title: t.title,
        artistId: t.artistId,
        artistName: t.artistName,
        coverUrl: getTrackCover(t, albums),
        releaseDate: t.releaseDate,
        rating: t.rating,
        raw: t
      }))
    ];
    return items
      .sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime())
      .slice(0, 6);
  }, [followedArtistIds, albums, tracks]);

  const handlePlayHero = () => {
    if (!activeHero) return;
    if (activeHero.type === 'track') {
      if (currentTrackId === activeHero.id && togglePlay) {
        togglePlay();
      } else {
        onPlayTrack(activeHero.raw as Track);
      }
      return;
    }
    const albTracks = tracks.filter(t => t.albumId === activeHero.id);
    if (albTracks.length > 0) {
      onPlayTrack(albTracks[0]);
    } else {
      navigateTo('album', { id: activeHero.id });
    }
  };

  return (
    <div className="p-scale space-y-10 md:space-y-12 pb-28">
      {/* 1. CLEAN HEADER & FEATURED SPOTLIGHT */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Главная</h2>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setFreshSeed(s => s + 1);
                setHeroIndex(0);
              }}
              className="px-3.5 py-2 rounded-2xl bg-zinc-900/85 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Shuffle className="w-3.5 h-3.5 theme-accent" />
              <span>Обновить подборку</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('search', { tab: 'dates' })}
              className="px-4 py-2 rounded-2xl bg-zinc-900/85 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4 theme-accent" />
              <span>Календарь по датам</span>
            </button>
          </div>
        </div>

        {/* Hero Spotlight: Larger Cover, Minimal Visual Noise, Clean Metrics */}
        {activeHero && (
          <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-black/95 border border-white/[0.08] hover-outline-card overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-transparent to-black/60 pointer-events-none" />

            <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`hero-${activeHero.type}-${activeHero.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0"
                >
                  <div
                    onClick={() => openLightbox({
                      url: activeHero.coverUrl,
                      title: activeHero.title,
                      subtitle: activeHero.artistName,
                      type: activeHero.type === 'album' ? 'Альбом' : 'Трек'
                    })}
                    className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-3xl overflow-hidden shadow-2xl shrink-0 cursor-pointer group border border-white/15"
                    title="Открыть обложку"
                  >
                    <CoverArt
                      url={activeHero.coverUrl}
                      title={activeHero.title}
                      className="w-full h-full"
                      innerClassName="group-hover:scale-105 duration-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
                      <span className="text-zinc-200">{activeHero.type === 'album' ? 'Альбом' : 'Сингл'}</span>
                      {activeHero.releaseDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{formatDateDisplay(activeHero.releaseDate)}</span>
                        </>
                      )}
                      {activeHero.genre && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{activeHero.genre}</span>
                        </>
                      )}
                    </div>

                    <div>
                      <h3
                        onClick={() => navigateTo(activeHero.type === 'track' ? 'track' : 'album', { id: activeHero.id })}
                        className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight cursor-pointer hover-text-link truncate"
                        title={activeHero.title}
                      >
                        {activeHero.title}
                      </h3>
                      <p
                        onClick={() => {
                          if (activeHero.artistId) navigateTo('artist', { id: activeHero.artistId, artistName: activeHero.artistName });
                          else navigateTo('artist', { artistName: activeHero.artistName });
                        }}
                        className="text-base sm:text-lg font-bold text-zinc-300 hover-text-link cursor-pointer truncate mt-1"
                      >
                        {activeHero.artistName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-zinc-300 tabular-nums">
                      <span>{formatCompactStreams(activeHero.plays)} прослушиваний</span>
                      {activeHero.rating && (
                        <RatingScoreBadge rating={activeHero.rating} size="sm" showDetailsOnHover={false} />
                      )}
                      {activeHero.albumValue && (
                        <AlbumValueBadge albumValue={activeHero.albumValue} size="sm" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handlePlayHero}
                        className="px-5 py-2.5 rounded-xl theme-bg-accent text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        {isPlaying && currentTrackId === activeHero.id ? (
                          <Pause className="w-4 h-4 fill-black" />
                        ) : (
                          <Play className="w-4 h-4 fill-black" />
                        )}
                        <span>{isPlaying && currentTrackId === activeHero.id ? 'Пауза' : 'Слушать'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo(activeHero.type === 'track' ? 'track' : 'album', { id: activeHero.id })}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap"
                      >
                        Открыть
                      </button>

                      {onRateClick && (
                        <button
                          type="button"
                          onClick={() => onRateClick({ type: activeHero.type, item: activeHero.raw })}
                          className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span>{activeHero.rating ? 'Оценка' : 'Оценить'}</span>
                        </button>
                      )}

                      {heroItems.length > 1 && (
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            onClick={() => setHeroIndex(i => (i - 1 + heroItems.length) % heroItems.length)}
                            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Предыдущий релиз"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeroIndex(i => (i + 1) % heroItems.length)}
                            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Следующий релиз"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Right 4 cols: Release-Specific Facts & Insights */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`hero-facts-${activeHero.type}-${activeHero.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="lg:col-span-4 lg:border-l border-white/[0.08] lg:pl-7 grid grid-cols-2 gap-x-5 gap-y-5"
                >
                  {heroInsights.map((fact, idx) => (
                    <button
                      key={`fact-${idx}`}
                      type="button"
                      onClick={fact.onClick}
                      className="text-left group cursor-pointer min-w-0"
                    >
                      <p
                        className={`${
                          fact.isTextValue
                            ? 'text-base sm:text-lg font-extrabold leading-snug'
                            : 'text-xl sm:text-2xl font-black tabular-nums whitespace-nowrap'
                        } text-white group-hover:theme-accent transition-colors truncate`}
                        title={fact.value}
                      >
                        {fact.value}
                        {fact.suffix && (
                          <span className="text-xs font-semibold text-zinc-500 ml-1">{fact.suffix}</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 group-hover:text-zinc-200 mt-0.5 truncate" title={fact.label}>
                        {fact.label}
                      </p>
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.section>

      {/* 2. DIVERSIFIED MUSIC COLLECTION (Clean Title, No Extra Filter Chips/Subtitles) */}
      {homeRecommendations.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4 px-1">
            <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">Музыкальная коллекция</h3>
            <button
              type="button"
              onClick={() => setFreshSeed(s => s + 1)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Shuffle className="w-3.5 h-3.5 theme-accent" />
              <span>Обновить</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`col-${freshSeed}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {homeRecommendations.map((rel) => {
                const isTrack = rel.type === 'track';
                const isCurrentlyPlaying = isTrack && isPlaying && currentTrackId === rel.id;
                return (
                  <div
                    key={`${rel.type}-${rel.id}`}
                    onClick={() => navigateTo(isTrack ? 'track' : 'album', { id: rel.id })}
                    className="group flex items-center gap-4 bg-gradient-to-br from-zinc-900/85 via-zinc-900/70 to-black/85 hover:from-zinc-800/90 hover:via-zinc-900/85 hover:to-zinc-950/95 p-4 rounded-3xl overflow-hidden cursor-pointer border border-white/[0.08] hover-outline-card hover:-translate-y-0.5 active:scale-[0.99] shadow-lg relative transition-all duration-200"
                  >
                    <CoverArt
                      url={rel.coverUrl}
                      title={rel.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 shadow-2xl shrink-0 rounded-2xl overflow-hidden relative"
                      innerClassName="group-hover:scale-105 duration-300"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 truncate">
                        <span className="text-zinc-300">{rel.isSnippet ? 'Сниппет' : isTrack ? 'Сингл' : 'Альбом'}</span>
                        {rel.releaseDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{formatDateDisplay(rel.releaseDate)}</span>
                          </>
                        )}
                      </div>

                      <p className="font-black text-base sm:text-lg text-white truncate hover-text-link leading-snug">
                        {rel.title}
                      </p>

                      <p
                        onClick={(e) => {
                          e.stopPropagation();
                          if (rel.artistId) navigateTo('artist', { id: rel.artistId, artistName: rel.artistName });
                          else navigateTo('artist', { artistName: rel.artistName });
                        }}
                        className="text-xs sm:text-sm font-semibold text-zinc-400 hover-text-link cursor-pointer truncate"
                      >
                        {rel.artistName}
                      </p>

                      {(rel.rating || rel.albumValue) && (
                        <div className="flex items-center gap-2 pt-1">
                          {rel.rating && <RatingScoreBadge rating={rel.rating} size="sm" showDetailsOnHover={false} />}
                          {rel.albumValue && <AlbumValueBadge albumValue={rel.albumValue} size="sm" />}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isTrack) {
                          if (isCurrentlyPlaying && togglePlay) togglePlay();
                          else onPlayTrack(rel.raw as Track);
                        } else {
                          const albTrks = tracks.filter(t => t.albumId === rel.id);
                          if (albTrks.length > 0) onPlayTrack(albTrks[0]);
                          else navigateTo('album', { id: rel.id });
                        }
                      }}
                      className={`w-11 h-11 theme-bg-accent rounded-full flex items-center justify-center shadow-xl shrink-0 transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                        isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title={isTrack ? 'Воспроизвести трек' : 'Воспроизвести альбом'}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="text-black fill-black w-5 h-5" />
                      ) : (
                        <Play className="text-black fill-black ml-0.5 w-5 h-5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* 3. CRITIC PICKS / ALBUM VALUE SHOWCASE */}
      {showcaseItems.length > 0 && (
        <section className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/75 to-black/90 border border-white/[0.08] hover-outline-card shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl theme-bg-accent text-black flex items-center justify-center font-black shadow-lg shrink-0">
                {showcaseMode === 'value' ? <Disc className="w-5 h-5" /> : <Star className="w-5 h-5 fill-black" />}
              </div>
              <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">
                {showcaseMode === 'value' ? 'Ценность альбомов' : 'Выбор критиков • Топ баллы'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/10">
                {[
                  { id: 'critics', label: 'Топ баллы' },
                  { id: 'value', label: 'Ценность' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setShowcaseMode(m.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      showcaseMode === m.id
                        ? 'theme-bg-accent text-black shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigateTo(showcaseMode === 'value' ? 'album_value' : 'rating')}
                className="text-xs font-bold theme-accent hover:underline flex items-center gap-1.5 cursor-pointer px-2 whitespace-nowrap"
              >
                <span>Весь рейтинг</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={showcaseMode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {showcaseItems.map((pick) => (
                <div
                  key={`${pick.type}-${pick.id}`}
                  onClick={() => navigateTo(pick.type === 'track' ? 'track' : 'album', { id: pick.id })}
                  className="p-3.5 bg-black/45 hover:bg-black/65 rounded-2xl border border-white/[0.07] hover-outline-card hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-800">
                      <CoverArt
                        url={pick.cover}
                        title={pick.title}
                        className="w-full h-full"
                        innerClassName="group-hover:scale-105 duration-300"
                      />
                      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                        {pick.rating && <RatingScoreBadge rating={pick.rating} size="sm" showDetailsOnHover={false} />}
                        {pick.albumValue && <AlbumValueBadge albumValue={pick.albumValue} size="sm" />}
                      </div>
                      {pick.type === 'track' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayTrack(pick.data as Track);
                          }}
                          className="absolute bottom-2 right-2 w-9 h-9 rounded-full theme-bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                        </button>
                      )}
                    </div>
                    <p className="font-extrabold text-sm text-white truncate group-hover:theme-accent transition-colors">
                      {pick.title}
                    </p>
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pick.data.artistId) navigateTo('artist', { id: pick.data.artistId, artistName: pick.subtitle });
                        else navigateTo('artist', { artistName: pick.subtitle });
                      }}
                      className="text-xs text-zinc-400 truncate mt-0.5 hover:text-white hover:underline cursor-pointer transition-colors"
                    >
                      {pick.subtitle}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-zinc-400 tabular-nums">
                    <span>{pick.type === 'track' ? 'Трек' : 'Альбом'}</span>
                    <span className="font-mono text-zinc-200">
                      {showcaseMode === 'value' && pick.valueScore > 0 ? pick.valueScore : `${pick.score} / 90`}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* 4. POPULAR TRACKS SECTION (Minimalist & Clean) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pb-2.5 border-b border-white/[0.07]">
          <div
            onClick={() => setShowAllTracks(!showAllTracks)}
            className="cursor-pointer group flex items-center gap-3 select-none"
          >
            <h3 className="text-xl md:text-3xl font-black text-white group-hover:theme-accent transition-colors">
              Популярные треки
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
              {[
                { id: 'plays', label: 'По стримам' },
                { id: 'rating', label: 'По оценке' },
                { id: 'date', label: 'По дате' },
                { id: 'alpha', label: 'А-Я' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTrackSort(opt.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    trackSort === opt.id
                      ? 'theme-bg-accent text-black shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAllTracks(!showAllTracks)}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              {showAllTracks ? 'Свернуть' : `Все треки (${tracks.length})`}
            </button>
          </div>
        </div>

        {showAllTracks && (
          <div className="relative max-w-md pt-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="Поиск по трекам и артистам..."
              className="w-full bg-zinc-900/85 border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>
        )}

        <div className="space-y-1.5 max-w-6xl">
          {displayedTracks.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Треки не найдены
            </div>
          ) : isTracksExpanded ? (
            <ProgressiveTrackList
              tracks={displayedTracks}
              initialBatchSize={40}
              incrementBatchSize={40}
              renderItem={(track: Track, i: number) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  toggleLike={toggleLikeTrack || (() => {})}
                  onTrackClick={() => navigateTo('track', { id: track.id })}
                  onPlay={() => onPlayTrack && onPlayTrack(track)}
                  onArtworkClick={() => openLightbox && openLightbox({ url: getTrackCover(track, albums), title: track.title, subtitle: track.artistName, type: 'Трек' })}
                  onMoreOptionsClick={onMoreOptionsClick}
                  isPlayingTrack={isPlaying && currentTrackId === track.id}
                  size="lg"
                  albums={albums}
                  artists={artists}
                  navigateTo={navigateTo}
                />
              )}
            />
          ) : (
            displayedTracks.map((track: Track, i: number) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                toggleLike={toggleLikeTrack || (() => {})}
                onTrackClick={() => navigateTo('track', { id: track.id })}
                onPlay={() => onPlayTrack && onPlayTrack(track)}
                onArtworkClick={() => openLightbox && openLightbox({ url: getTrackCover(track, albums), title: track.title, subtitle: track.artistName, type: 'Трек' })}
                onMoreOptionsClick={onMoreOptionsClick}
                isPlayingTrack={isPlaying && currentTrackId === track.id}
                size="lg"
                albums={albums}
                artists={artists}
                navigateTo={navigateTo}
              />
            ))
          )}
        </div>
      </section>

      {/* 5. POPULAR ARTISTS SECTION (Sorting & Search only when expanded) */}
      {artists.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pb-2.5 border-b border-white/[0.07]">
            <h3
              onClick={() => setShowAllArtists(!showAllArtists)}
              className="text-xl md:text-3xl font-black text-white hover:theme-accent transition-colors cursor-pointer select-none"
            >
              Популярные артисты
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {showAllArtists && (
                <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
                  {[
                    { id: 'followers', label: 'Слушатели' },
                    { id: 'rating', label: 'Оценка' },
                    { id: 'alpha', label: 'А-Я' },
                    { id: 'tracks', label: 'Треки' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setArtistSort(opt.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        artistSort === opt.id
                          ? 'theme-bg-accent text-black shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowAllArtists(!showAllArtists)}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all cursor-pointer whitespace-nowrap"
              >
                {showAllArtists ? 'Свернуть' : `Все артисты (${artists.length})`}
              </button>
            </div>
          </div>

          {showAllArtists && (
            <div className="relative max-w-md pt-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                placeholder="Поиск артиста..."
                className="w-full bg-zinc-900/85 border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {displayedArtists.map((artist: any) => (
              <div
                key={artist.id}
                onClick={() => navigateTo('artist', { id: artist.id })}
                className="flex flex-col items-center gap-3 cursor-pointer group p-4 rounded-3xl bg-gradient-to-b from-zinc-900/80 via-zinc-900/65 to-black/85 hover:from-zinc-800/90 hover:to-zinc-900/95 border border-white/[0.07] hover-outline-card hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 text-center shadow-lg"
              >
                <div className="relative aspect-square w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shrink-0 mx-auto">
                  <CoverArt
                    url={artist.imageUrl}
                    title={artist.name}
                    isArtist={true}
                    className="w-full h-full rounded-full overflow-hidden shadow-2xl border-2 border-white/10 group-hover:border-[var(--accent-color)] transition-all duration-300 relative"
                    innerClassName="group-hover:scale-108 duration-500"
                  />
                  {artist.avgScore > 0 && (
                    <div className="absolute bottom-0 right-0 z-10">
                      <RatingScoreBadge rating={{ totalScore: Math.round(artist.avgScore) } as any} size="sm" showDetailsOnHover={false} />
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <p className="font-extrabold text-sm md:text-base text-white truncate group-hover:theme-accent transition-colors">{artist.name}</p>
                  <p className="text-xs font-medium text-zinc-400 mt-1 truncate tabular-nums">
                    {formatShortListeners(artist.followers)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isArtistsExpanded && homeArtistsBatch.hasMore && (
            <div ref={homeArtistsBatch.sentinelRef} className="py-3 text-center">
              <button
                type="button"
                onClick={homeArtistsBatch.loadMore}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Показать ещё артистов ({filteredArtists.length - displayedArtists.length})
              </button>
            </div>
          )}
        </section>
      )}

      {/* 6. FRESH RELEASES SECTION (Clean, No Extra Subtitles/Switches) */}
      {recentAlbums.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">Свежие релизы</h3>
            <button
              type="button"
              onClick={() => navigateTo('search', { tab: 'dates' })}
              className="text-xs font-bold theme-accent hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>По датам</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentAlbums.map((album: Album) => (
              <div
                key={`fresh-alb-${album.id}`}
                onClick={() => navigateTo('album', { id: album.id })}
                className="p-3.5 bg-gradient-to-b from-zinc-900/80 via-zinc-900/65 to-black/85 hover:from-zinc-800/90 hover:to-zinc-900/95 rounded-2xl border border-white/[0.07] hover-outline-card hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-800">
                    <CoverArt
                      url={album.coverUrl}
                      title={album.title}
                      className="w-full h-full"
                      innerClassName="group-hover:scale-105 duration-500"
                    />
                    {(album.rating || album.albumValue) && (
                      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                        {album.rating && <RatingScoreBadge rating={album.rating} size="sm" showDetailsOnHover={false} />}
                        {album.albumValue && <AlbumValueBadge albumValue={album.albumValue} size="sm" />}
                      </div>
                    )}
                  </div>
                  <p className="font-extrabold text-sm text-white truncate hover-text-link">{album.title}</p>
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      if (album.artistId) navigateTo('artist', { id: album.artistId, artistName: album.artistName });
                      else navigateTo('artist', { artistName: album.artistName });
                    }}
                    className="text-xs text-zinc-400 mt-0.5 truncate hover:text-white hover:underline cursor-pointer"
                  >
                    {album.artistName}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 font-medium tabular-nums">
                  <span>{album.releaseYear}</span>
                  <span className="truncate max-w-[90px]">{album.genre || 'Музыка'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOLLOWED ARTISTS RELEASES (Placed above Hall of Fame) */}
      {followedFeed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">От ваших подписок</h3>
            <button
              type="button"
              onClick={() => navigateTo('likes')}
              className="text-xs font-bold theme-accent hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Все подписки ({followedArtistIds.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {followedFeed.map((item) => (
              <div
                key={`fol-${item.type}-${item.id}`}
                onClick={() => navigateTo(item.type === 'track' ? 'track' : 'album', { id: item.id })}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-zinc-900/80 via-zinc-900/65 to-black/85 border border-white/[0.07] hover-outline-card hover:-translate-y-1 transition-all duration-200 cursor-pointer group shadow-lg space-y-2.5"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                  <CoverArt url={item.coverUrl} title={item.title} className="w-full h-full" innerClassName="group-hover:scale-105 duration-300" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.type === 'track') onPlayTrack(item.raw as Track);
                      else {
                        const albTrks = tracks.filter(t => t.albumId === item.id);
                        if (albTrks.length > 0) onPlayTrack(albTrks[0]);
                        else navigateTo('album', { id: item.id });
                      }
                    }}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full theme-bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate group-hover:theme-accent transition-colors">{item.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{item.artistName}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HALL OF FAME (Unified Minimal Style, Fewer Tiny Labels) */}
      {recentAwards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Зал славы и Премии</h3>
            <button
              type="button"
              onClick={() => navigateTo('rating', { tab: 'awards' })}
              className="text-xs font-bold theme-accent hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Все премии</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAwards.map((aw) => (
              <button
                key={`award-${aw.id}`}
                type="button"
                onClick={() => {
                  if (aw.winner.id && (aw.winner.type === 'artist' || aw.winner.type === 'album' || aw.winner.type === 'track')) {
                    navigateTo(aw.winner.type, { id: aw.winner.id });
                  } else {
                    navigateTo('rating', { tab: 'awards', year: aw.year, month: aw.month });
                  }
                }}
                className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900/85 via-zinc-900/70 to-black/85 border border-white/[0.08] hover-outline-card hover:-translate-y-0.5 transition-all duration-200 shadow-lg flex items-center gap-4 text-left cursor-pointer group"
              >
                <CoverArt
                  url={aw.winner.coverUrl}
                  title={aw.winner.title}
                  isArtist={aw.winner.type === 'artist'}
                  className={`w-16 h-16 shrink-0 shadow-xl ${aw.winner.type === 'artist' ? 'rounded-full' : 'rounded-2xl'}`}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-base font-black text-white truncate group-hover:theme-accent transition-colors">
                    {aw.winner.title}
                  </p>
                  <p className="text-xs font-semibold text-zinc-400 truncate">
                    {aw.nominationTitle} · {aw.year}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* TOOLS STRIP */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 md:p-6 rounded-3xl bg-zinc-900/75 border border-white/[0.08] hover-outline-card flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-5 h-5 theme-accent" />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-extrabold text-white tracking-tight">Сравнение бок о бок</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Сопоставьте статистику, прослушивания и оценки двух артистов или альбомов.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('compare', { mode: 'artists' })}
              className="px-3.5 py-2 rounded-xl theme-bg-accent text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Сравнить артистов</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('compare', { mode: 'albums' })}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 font-semibold text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Сравнить альбомы</span>
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6 rounded-3xl bg-zinc-900/75 border border-white/[0.08] hover-outline-card flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 theme-accent" />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-extrabold text-white tracking-tight">Хронология и События</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Архив релизов по датам и лента событий музыкальной индустрии.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('search', { tab: 'dates' })}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-xs inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 theme-accent" />
              <span>Календарь</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('news')}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 font-semibold text-xs inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Newspaper className="w-3.5 h-3.5 theme-accent" />
              <span>Новости</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ArtistView({ 
  id, 
  artists, 
  albums, 
  tracks, 
  navigateTo, 
  toggleLikeTrack,
  onPlayTrack,
  openLightbox,
  followedArtistIds = [],
  toggleFollowArtist,
  currentTrackId,
  isPlaying,
  artistName,
  onMoreOptionsClick,
  uiPrefs
}: {
  uiPrefs?: Partial<ThemeConfig>;
  id?: string;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: NavigationState['params']) => void;
  toggleLikeTrack: (id: string) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
  followedArtistIds?: string[];
  toggleFollowArtist?: (id: string) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  artistName?: string;
  onMoreOptionsClick?: (item: any) => void;
}) {
  let artist = artists.find((a: any) => a.id === id);

  // If not found by ID, search by artistName or guest_ prefix in real artists list
  if (!artist && (id || artistName)) {
    const cleanSearch = (artistName || id.replace('guest_', '')).trim().toLowerCase();
    if (cleanSearch) {
      const realMatch = artists.find((a: any) => a.name.trim().toLowerCase() === cleanSearch);
      if (realMatch) artist = realMatch;
    }
  }

  // Guest/collaborator artist fallback (if not found in database)
  if (!artist && id) {
    const cleanName = (artistName || id.replace('guest_', '')).trim();
    if (cleanName) {
      const guestTracksList = sortTracksByRelevance(
        tracks.filter((t: any) => 
          t.artistName?.toLowerCase() === cleanName.toLowerCase() ||
          (t.featuredArtist && t.featuredArtist.toLowerCase().includes(cleanName.toLowerCase()))
        )
      );
      artist = {
        id: id,
        name: cleanName,
        bio: `Гостевой исполнитель и соавтор. Участвовал в ${guestTracksList.length} релизе(-ах) на платформе.`,
        imageUrl: '',
        genre: guestTracksList[0]?.genre || 'Коллаборация',
        followers: 185000,
        verified: false
      };
    }
  }

  if (!artist) return <div className="p-20 text-center text-xl font-bold opacity-30">АРТИСТ НЕ НАЙДЕН</div>;

  const resolvedArtistCover = resolveMedia(artist.imageUrl, { id: artist.id, title: artist.name, isArtist: true });
  const [headerPalette, setHeaderPalette] = useState<[string, string, string, string]>(() =>
    generateSeedPalette(artist.name, '#10b981')
  );

  useEffect(() => {
    let cancelled = false;
    const fallback = generateSeedPalette(artist.name, '#10b981');
    if (resolvedArtistCover) {
      extractPaletteFromImageUrl(resolvedArtistCover, fallback).then((pal) => {
        if (!cancelled) setHeaderPalette(pal);
      });
    } else {
      setHeaderPalette(fallback);
    }
    return () => {
      cancelled = true;
    };
  }, [artist.id, artist.name, resolvedArtistCover]);

  const artistAlbums = albums.filter((a: any) => a.artistId === artist.id || a.artistName?.toLowerCase() === artist.name.toLowerCase() ||
    (a.coArtist && splitNames(a.coArtist).some(n => n.toLowerCase() === artist.name.toLowerCase())));
  const artistTracks = sortTracksByRelevance(
    tracks.filter((t: any) => 
      t.artistId === artist.id || 
      t.artistName?.toLowerCase() === artist.name.toLowerCase() ||
      (t.featuredArtist && (
        parseFeaturedNames(t.featuredArtist).some(n => n.toLowerCase() === artist.name.toLowerCase()) ||
        t.featuredArtist.toLowerCase().includes(artist.name.toLowerCase())
      ))
    )
  );

  // --- Auto-computed Career Eras Timeline ---
  const distinctYears = useMemo(() => {
    const yearsSet = new Set<number>();
    artistAlbums.forEach((a: any) => {
      if (a.releaseYear) yearsSet.add(Number(a.releaseYear));
      else if (a.releaseDate) {
        const y = new Date(a.releaseDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    artistTracks.forEach((t: any) => {
      if (t.year) yearsSet.add(Number(t.year));
      else if (t.releaseDate) {
        const y = new Date(t.releaseDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [artistAlbums, artistTracks]);

  const eras = useMemo(() => computeArtistEras(artist, artistAlbums, artistTracks), [artist.id, artist.name, albums, tracks]);

  const [selectedEraId, setSelectedEraId] = useViewMemo<string>(`artist:${artist.id}:era`, 'all');
  const [trackViewMode, setTrackViewMode] = useViewMemo<'list' | 'grid'>(`artist:${artist.id}:view`, 'list');
  const [trackSortBy, setTrackSortBy] = useViewMemo<'popular' | 'newest' | 'oldest'>(`artist:${artist.id}:trackSort`, 'popular');
  const [albumSortBy, setAlbumSortBy] = useViewMemo<'newest' | 'oldest' | 'popular'>(`artist:${artist.id}:albumSort`, 'newest');
  const [isLatestDropExpanded, setIsLatestDropExpanded] = useState<boolean>(false);

  const parseReleaseTs = (dateStr?: string, fallbackYear?: number | string): { ts: number; year: number } => {
    let ts = 0;
    if (dateStr) {
      const clean = dateStr.trim();
      const parts = clean.split(/[-.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          ts = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`).getTime();
        } else if (parts[2].length === 4) {
          ts = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
        }
      }
      if (!ts || isNaN(ts)) {
        const parsed = new Date(clean).getTime();
        if (!isNaN(parsed)) ts = parsed;
      }
    }
    const yr = fallbackYear ? Number(fallbackYear) : (ts > 0 ? new Date(ts).getFullYear() : 2025);
    if (!ts || isNaN(ts)) {
      ts = new Date(`${yr || 2025}-01-01`).getTime();
    }
    return { ts, year: yr || 2025 };
  };

  // Filter and sort releases by selected era and sort mode (popular vs newest vs oldest)
  const filteredArtistTracks = useMemo(() => {
    let base = artistTracks;
    if (selectedEraId !== 'all') {
      const currentEra = eras.find(e => e.id === selectedEraId);
      if (currentEra) {
        base = artistTracks.filter((t: any) => eraHas(currentEra, t, 'track'));
      }
    }
    if (trackSortBy === 'newest') {
      const idxMap = new Map<string, number>();
      tracks.forEach((t, i) => idxMap.set(t.id, i));
      return [...base].sort((a: any, b: any) => {
        const dA = parseReleaseTs(a.releaseDate, a.year);
        const dB = parseReleaseTs(b.releaseDate, b.year);
        if (dB.ts !== dA.ts) return dB.ts - dA.ts;
        if (dB.year !== dA.year) return dB.year - dA.year;
        return (idxMap.get(b.id) || 0) - (idxMap.get(a.id) || 0);
      });
    }
    if (trackSortBy === 'oldest') {
      const idxMap = new Map<string, number>();
      tracks.forEach((t, i) => idxMap.set(t.id, i));
      return [...base].sort((a: any, b: any) => {
        const dA = parseReleaseTs(a.releaseDate, a.year);
        const dB = parseReleaseTs(b.releaseDate, b.year);
        if (dA.ts !== dB.ts) return dA.ts - dB.ts;
        if (dA.year !== dB.year) return dA.year - dB.year;
        return (idxMap.get(a.id) || 0) - (idxMap.get(b.id) || 0);
      });
    }
    return [...base].sort((a: any, b: any) => (b.plays || 0) - (a.plays || 0));
  }, [artistTracks, selectedEraId, eras, trackSortBy, tracks]);

  const filteredArtistAlbums = useMemo(() => {
    let base = artistAlbums;
    if (selectedEraId !== 'all') {
      const currentEra = eras.find(e => e.id === selectedEraId);
      if (currentEra) {
        base = artistAlbums.filter((a: any) => eraHas(currentEra, a, 'album'));
      }
    }
    if (albumSortBy === 'oldest') {
      return [...base].sort((a: any, b: any) => {
        const dA = parseReleaseTs(a.releaseDate, a.releaseYear);
        const dB = parseReleaseTs(b.releaseDate, b.releaseYear);
        if (dA.ts !== dB.ts) return dA.ts - dB.ts;
        return dA.year - dB.year;
      });
    }
    if (albumSortBy === 'popular') {
      return [...base].sort((a: any, b: any) => (b.totalPlays || 0) - (a.totalPlays || 0));
    }
    return [...base].sort((a: any, b: any) => {
      const dA = parseReleaseTs(a.releaseDate, a.releaseYear);
      const dB = parseReleaseTs(b.releaseDate, b.releaseYear);
      if (dB.ts !== dA.ts) return dB.ts - dA.ts;
      return dB.year - dA.year;
    });
  }, [artistAlbums, selectedEraId, eras, albumSortBy]);

  // Latest Drop / Release calculation: ONLY where the artist is the main author (never where they are only a guest feat)
  const latestRelease = useMemo(() => {
    type ReleaseCandidate = {
      id: string;
      title: string;
      coverUrl: string;
      releaseYear: number;
      releaseDate?: string;
      coArtist?: string;
      label?: string;
      totalPlays?: number;
      isTrack: boolean;
      ts: number;
      orderIdx: number;
      trackObj?: Track;
      albumObj?: Album;
    };

    const candidates: ReleaseCandidate[] = [];

    // 1. Authored albums
    artistAlbums.forEach((a: any, idx: number) => {
      const { ts, year } = parseReleaseTs(a.releaseDate, a.releaseYear);
      candidates.push({
        id: a.id,
        title: a.title,
        coverUrl: a.coverUrl,
        releaseYear: year,
        releaseDate: a.releaseDate,
        coArtist: a.coArtist,
        label: a.label,
        totalPlays: a.totalPlays,
        isTrack: false,
        ts,
        orderIdx: idx,
        albumObj: a,
      });
    });

    // 2. Authored tracks (strictly main author: artistId or artistName matches, NOT guest feat)
    const authoredTracks = tracks.filter((t: any) =>
      t.artistId === artist.id ||
      t.artistName?.trim().toLowerCase() === artist.name.trim().toLowerCase()
    );

    authoredTracks.forEach((t: any, idx: number) => {
      const belongsToArtistAlbum = t.albumId && t.albumId !== 'single' && artistAlbums.some((a: any) => a.id === t.albumId);
      if (!belongsToArtistAlbum || artistAlbums.length === 0) {
        const { ts, year } = parseReleaseTs(t.releaseDate, t.year);
        candidates.push({
          id: t.id,
          title: t.title,
          coverUrl: getTrackCover(t, albums),
          releaseYear: year,
          releaseDate: t.releaseDate,
          coArtist: t.featuredArtist,
          totalPlays: t.plays || 0,
          isTrack: true,
          ts,
          orderIdx: 1000 + idx,
          trackObj: t,
        });
      }
    });

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      if (b.ts !== a.ts) return b.ts - a.ts;
      if (b.releaseYear !== a.releaseYear) return b.releaseYear - a.releaseYear;
      return b.orderIdx - a.orderIdx;
    });

    return candidates[0];
  }, [artistAlbums, tracks, artist, albums]);

  const latestReleaseTracks = useMemo(() => {
    if (!latestRelease || latestRelease.isTrack) return [];
    return tracks.filter(t => 
      t.albumId === latestRelease.id || 
      (t.albumTitle && latestRelease.title && t.albumTitle.trim().toLowerCase() === latestRelease.title.trim().toLowerCase())
    );
  }, [latestRelease, tracks]);

  // All unique featured artists on the latest release (excluding the artist themselves)
  const latestReleaseFeats = useMemo(() => {
    if (!latestRelease) return [];
    const rawList: string[] = [];
    if (latestRelease.coArtist) rawList.push(latestRelease.coArtist);
    if (!latestRelease.isTrack && latestReleaseTracks.length > 0) {
      latestReleaseTracks.forEach(tr => {
        if (tr.featuredArtist) rawList.push(tr.featuredArtist);
      });
    }
    return parseFeaturedNames(rawList.join(', '), artist.name);
  }, [latestRelease, latestReleaseTracks, artist.name]);

  const latestReleasePlays = useMemo(() => {
    if (!latestRelease) return 0;
    if (latestRelease.isTrack) return latestRelease.totalPlays || 0;
    const tracksPlays = latestReleaseTracks.reduce((sum, t) => sum + (t.plays || 0), 0);
    return Math.max(latestRelease.totalPlays || 0, tracksPlays);
  }, [latestRelease, latestReleaseTracks]);

  // Collaborators network calculation
  const collaborators = useMemo(() => {
    const collabMap = new Map<string, { count: number; name: string }>();
    artistTracks.forEach((t: any) => {
      if (t.featuredArtist) {
        const parts = parseFeaturedNames(t.featuredArtist, artist.name);
        parts.forEach((p: string) => {
          const existing = collabMap.get(p.toLowerCase()) || { count: 0, name: p };
          existing.count += 1;
          collabMap.set(p.toLowerCase(), existing);
        });
      }
    });

    tracks.forEach((t: any) => {
      if (t.artistName?.toLowerCase() !== artist.name.toLowerCase() && t.featuredArtist) {
        const parts = parseFeaturedNames(t.featuredArtist);
        if (parts.some(p => p.toLowerCase() === artist.name.toLowerCase())) {
          const existing = collabMap.get(t.artistName.toLowerCase()) || { count: 0, name: t.artistName };
          existing.count += 1;
          collabMap.set(t.artistName.toLowerCase(), existing);
        }
      }
    });

    return Array.from(collabMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map(c => {
        const found = artists.find(a => a.name.trim().toLowerCase() === c.name.toLowerCase());
        return {
          name: c.name,
          count: c.count,
          artistId: found ? found.id : `guest_${c.name}`,
          imageUrl: found ? found.imageUrl : '',
          followers: found ? found.followers : 150000,
          verified: found ? found.verified : false
        };
      });
  }, [artist, artistTracks, tracks, artists]);
  
  const isFollowing = followedArtistIds.includes(artist.id);
  const [showAllTracks, setShowAllTracks] = useState(false);
  
  // Incremental loading for large discographies; in card grid mode, load all tracks immediately
  const visibleAlbumsCount = useVisibleCount(12, 12, filteredArtistAlbums.length);
  const visibleTracksCount = useVisibleCount(10, 10, filteredArtistTracks.length);
  const displayedAlbums = filteredArtistAlbums.slice(0, visibleAlbumsCount);
  
  const displayedTracks = trackViewMode === 'grid'
    ? filteredArtistTracks
    : (showAllTracks ? filteredArtistTracks.slice(0, visibleTracksCount) : filteredArtistTracks.slice(0, 5));

  const heroOn = uiPrefs?.artistHero !== false;
  const coverColorsOn = uiPrefs?.coverColorPages !== false;
  const pageAccent = readableAccent(headerPalette[0]);

  return (
    <div
      className={`relative isolate min-h-full pb-20 ${coverColorsOn ? 'page-accent-scope' : ''}`}
      style={coverColorsOn ? ({ ['--page-accent' as any]: pageAccent } as React.CSSProperties) : undefined}
    >
      <ReleaseStage kind="artist" id={artist.id} cover={artist.imageUrl} title={artist.name} genre={artist.genre} />
      {heroOn && (
        <ArtistHeroV2
          artistId={String(artist.id)}
          name={artist.name}
          imageUrl={resolvedArtistCover}
          fallback={<CoverArt url="" title={artist.name} isArtist className="w-full h-full" innerClassName="w-full h-full object-cover" />}
          verified={artist.verified}
          subtitle={`${formatListeners(artist.followers)}${artist.genre ? ` · ${artist.genre}` : ''}`}
          palette={headerPalette}
          defaultVariant={uiPrefs?.artistHeroStyle || 'cinema'}
          onZoom={() => openLightbox && openLightbox({ url: artist.imageUrl, title: artist.name, subtitle: formatListeners(artist.followers), type: 'Исполнитель' })}
        />
      )}
      {!heroOn && (
        <>
      {/* Seamless Adaptive Multi-Tone Profile Header Backdrop (zero horizontal cuts) */}
      <div
        className="absolute inset-x-0 -top-20 h-[480px] pointer-events-none overflow-hidden transition-all duration-700"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.3) 76%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.3) 76%, transparent 100%)',
        }}
      >
        {resolvedArtistCover && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.22] filter blur-[90px] scale-115 transition-opacity duration-700"
            style={{ backgroundImage: `url(${resolvedArtistCover})` }}
          />
        )}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: `
              radial-gradient(ellipse 65% 85% at 18% 35%, ${headerPalette[0]}45 0%, transparent 70%),
              radial-gradient(ellipse 60% 75% at 72% 18%, ${headerPalette[1]}32 0%, transparent 72%),
              radial-gradient(ellipse 50% 60% at 45% 65%, ${headerPalette[2]}1f 0%, transparent 75%)
            `,
          }}
        />
      </div>

      {/* Top Banner Content */}
      <div className="relative px-6 md:px-8 pt-8 pb-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 max-w-7xl mx-auto relative z-10">
          {/* Circular Artist Avatar with adaptive ambient aura & smooth outline hover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-shrink-0"
          >
            <div
              className="absolute -inset-2 rounded-full blur-2xl opacity-45 pointer-events-none transition-all duration-700"
              style={{ background: `radial-gradient(circle, ${headerPalette[0]}80 0%, ${headerPalette[1]}35 55%, transparent 75%)` }}
            />
            <CoverArt 
              url={artist.imageUrl} 
              title={artist.name}
              className="w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/15 hover-outline-media relative cursor-pointer"
              innerClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
              showZoomIcon={true}
              onZoom={() => openLightbox && openLightbox({ url: artist.imageUrl, title: artist.name, subtitle: formatListeners(artist.followers), type: 'Исполнитель' })}
            />
          </motion.div>

          {/* Clean Artist Info without clutter */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 pb-1">
            {artist.verified && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-2">
                <CheckCircle2 className="w-4 h-4 fill-sky-400 text-black" />
                <span>Подтвержденный исполнитель</span>
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-2 leading-none break-words drop-shadow-[0_6px_28px_rgba(0,0,0,0.45)]">
              {artist.name}
            </h1>
            <p className="text-sm md:text-base font-medium text-zinc-200/85">
              {formatListeners(artist.followers)}
            </p>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        {/* Action Bar (Play, Shuffle, Follow, More) */}
        <div className="flex items-center gap-6 py-6">
          <button 
            onClick={() => filteredArtistTracks[0] && (onPlayTrack ? onPlayTrack(filteredArtistTracks[0]) : navigateTo('track', { id: filteredArtistTracks[0].id }))}
            className="w-14 h-14 rounded-full theme-bg-accent page-accent-bg hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center cursor-pointer group"
            title="Воспроизвести"
          >
            <Play className="text-black fill-black ml-1 w-6 h-6" />
          </button>
          
          <button 
            onClick={() => {
              if (filteredArtistTracks.length > 0) {
                const randomTrack = filteredArtistTracks[Math.floor(Math.random() * filteredArtistTracks.length)];
                if (onPlayTrack) onPlayTrack(randomTrack);
                else navigateTo('track', { id: randomTrack.id });
              }
            }}
            className="text-zinc-400 hover:text-white transition-all duration-300 delay-[40ms] cursor-pointer p-2 rounded-full border border-transparent hover:border-white/15 hover:bg-white/[0.04]" 
            title="Перемешать"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <button 
            onClick={() => toggleFollowArtist && toggleFollowArtist(artist.id)}
            className={`px-4 py-1.5 rounded-full border text-xs md:text-sm font-semibold tracking-wide transition-all duration-300 delay-[40ms] hover:scale-[1.03] cursor-pointer ${
              isFollowing 
                ? 'border-white bg-white text-black font-bold' 
                : 'border-zinc-500/80 hover:border-white/90 hover:bg-white/[0.05] text-white'
            }`}
          >
            {isFollowing ? 'В подписках' : 'Подписаться'}
          </button>

          <button 
            onClick={() => onMoreOptionsClick && onMoreOptionsClick(artist)} 
            className="text-zinc-400 hover:text-white transition-all duration-300 delay-[40ms] cursor-pointer p-2 rounded-full border border-transparent hover:border-white/15 hover:bg-white/[0.04]"
            title="Действия с исполнителем"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Popular Tracks & Latest Drop Section (Side by side with more horizontal room for tracks) */}
        <div className={`grid grid-cols-1 ${latestRelease ? 'lg:grid-cols-12' : ''} gap-6 mb-12 items-start`}>
          {/* Left Column: Popular / Newest Tracks (List or Grid) */}
          <section className={latestRelease ? 'lg:col-span-8 xl:col-span-8' : 'w-full'}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {selectedEraId !== 'all'
                    ? `Треки эпохи «${eras.find(e => e.id === selectedEraId)?.label || ''}»`
                    : (trackSortBy === 'newest' ? 'Новые треки' : (trackSortBy === 'oldest' ? 'Старые треки' : 'Популярные треки'))}
                </h2>
                <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                  {filteredArtistTracks.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Compact Sort Toggle: По стримам / Новые / Старые */}
                <div className="flex items-center p-0.5 rounded-xl bg-zinc-900/90 border border-white/10 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTrackSortBy('popular')}
                    className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      trackSortBy === 'popular'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    По стримам
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackSortBy('newest')}
                    className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      trackSortBy === 'newest'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Новые
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackSortBy('oldest')}
                    className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      trackSortBy === 'oldest'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Старые
                  </button>
                </div>

                {/* Minimalist View Switcher (List vs Card Grid) */}
                <div className="flex items-center p-0.5 rounded-xl bg-zinc-900/90 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setTrackViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      trackViewMode === 'list'
                        ? 'theme-bg-accent text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Вид списком"
                  >
                    <ListMusic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      trackViewMode === 'grid'
                        ? 'theme-bg-accent text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Вид карточками (все сразу)"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {displayedTracks.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-white/5 text-sm font-semibold">
                В этой эпохе пока нет треков.
              </div>
            ) : trackViewMode === 'list' ? (
              <div className="space-y-1">
                {displayedTracks.map((track: Track, i: number) => (
                  <TrackRow 
                    key={track.id} 
                    track={track} 
                    index={i} 
                    toggleLike={toggleLikeTrack} 
                    onTrackClick={() => navigateTo('track', { id: track.id })}
                    onPlay={() => onPlayTrack ? onPlayTrack(track) : navigateTo('track', { id: track.id })} 
                    onArtworkClick={() => openLightbox && openLightbox({ url: getTrackCover(track, albums), title: track.title, subtitle: track.artistName, type: 'Трек' })}
                    isPlayingTrack={isPlaying && currentTrackId === track.id}
                    hideDuration={true}
                    size="lg"
                    albums={albums}
                    artists={artists}
                    navigateTo={navigateTo}
                  />
                ))}
              </div>
            ) : (
              /* Card Grid Mode (All tracks loaded immediately) */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayedTracks.map((track: Track) => {
                  const cleanFeats = parseFeaturedNames(track.featuredArtist, track.artistName);
                  return (
                    <div 
                      key={track.id}
                      onClick={() => navigateTo('track', { id: track.id })}
                      className="p-3 bg-zinc-900/50 hover:bg-zinc-800/75 border border-white/[0.06] hover-outline-card rounded-2xl group flex flex-col justify-between cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-zinc-800 group/art">
                        <CoverArt 
                          url={getTrackCover(track, albums)} 
                          title={track.title} 
                          className="w-full h-full object-cover" 
                          innerClassName="group-hover:scale-[1.03] transition-transform duration-500 ease-out" 
                          showZoomIcon={false}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPlayTrack) onPlayTrack(track);
                            else navigateTo('track', { id: track.id });
                          }}
                          className="absolute inset-0 m-auto w-10 h-10 rounded-full theme-bg-accent text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 delay-[40ms] hover:scale-105 shadow-2xl cursor-pointer"
                        >
                          <Play className="w-4 h-4 ml-0.5 fill-black" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo('track', { id: track.id });
                            }}
                            className="text-xs sm:text-sm font-bold text-white truncate hover-text-link cursor-pointer flex-1"
                          >
                            {track.title}
                          </h3>
                          {track.isExplicit && <span className="text-[9px] bg-zinc-700 text-zinc-300 px-1 py-0.2 rounded font-bold shrink-0">E</span>}
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo('artist', { id: track.artistId, artistName: track.artistName });
                            }}
                            className="hover-text-link text-zinc-300 cursor-pointer"
                          >
                            {track.artistName}
                          </span>
                          {cleanFeats.length > 0 && (
                            <FeaturedArtistsLinks
                              featuredArtist={cleanFeats.join(', ')}
                              excludeArtistName={track.artistName}
                              artists={artists}
                              navigateTo={navigateTo}
                              className="ml-1"
                            />
                          )}
                        </div>
                        <div className="flex items-baseline gap-1.5 pt-1.5 mt-1 border-t border-white/[0.06] text-[11px]">
                          <span className="text-zinc-200 font-bold tabular-nums">
                            {track.plays ? track.plays.toLocaleString('ru-RU') : '—'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            прослушиваний
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {trackViewMode === 'list' && filteredArtistTracks.length > 5 && (
              <button 
                onClick={() => setShowAllTracks(!showAllTracks)} 
                className="mt-3 px-4 py-2 text-xs md:text-sm font-bold text-zinc-400 hover-text-link cursor-pointer"
              >
                {showAllTracks ? 'Свернуть' : `Показать все (${filteredArtistTracks.length})`}
              </button>
            )}
          </section>

          {/* Right Column: «Актуальный релиз» (Clean reference glass aesthetic, zero button clutter, native tracklist & accurate feats) */}
          {latestRelease && (
            <aside className="lg:col-span-4 xl:col-span-4 self-start">
              <div 
                onClick={() => navigateTo(latestRelease.isTrack ? 'track' : 'album', { id: latestRelease.id })}
                className="p-5 sm:p-6 rounded-3xl bg-zinc-900/50 hover:bg-zinc-800/70 backdrop-blur-xl border border-white/10 hover-outline-card hover:-translate-y-0.5 cursor-pointer group flex flex-col gap-3.5 shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (latestRelease.isTrack && latestRelease.trackObj && onPlayTrack) {
                        onPlayTrack(latestRelease.trackObj);
                      } else if (latestReleaseTracks.length > 0 && onPlayTrack) {
                        onPlayTrack(latestReleaseTracks[0]);
                      } else {
                        navigateTo(latestRelease.isTrack ? 'track' : 'album', { id: latestRelease.id });
                      }
                    }}
                    className="relative w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border border-white/10 hover-outline-media shadow-xl group-hover:scale-[1.03] group/art"
                    title="Воспроизвести релиз"
                  >
                    <CoverArt
                      url={latestRelease.coverUrl}
                      title={latestRelease.title}
                      className="w-full h-full object-cover"
                      showZoomIcon={false}
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/art:opacity-100 transition-opacity duration-300 delay-[35ms] flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full theme-bg-accent text-black flex items-center justify-center shadow-lg transform scale-95 group-hover/art:scale-100 transition-transform duration-300">
                        {isPlaying && ((latestRelease.isTrack && currentTrackId === latestRelease.id) || (!latestRelease.isTrack && latestReleaseTracks.some(t => t.id === currentTrackId))) ? (
                          <Pause className="w-4 h-4 fill-black" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5 fill-black" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-0.5">
                      Актуальный релиз
                    </span>
                    <p 
                      className="font-black text-lg sm:text-xl md:text-[22px] text-white hover-text-link line-clamp-2 break-words leading-snug tracking-tight"
                      title={latestRelease.title}
                    >
                      {latestRelease.title}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 font-semibold">
                      {latestReleasePlays >= 1000000
                        ? `${(latestReleasePlays / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} млн прослушиваний`
                        : latestReleasePlays > 0
                          ? `${latestReleasePlays.toLocaleString('ru-RU')} прослушиваний`
                          : `${latestRelease.releaseYear || '2025'} • ${latestRelease.isTrack ? 'Сингл' : 'Альбом'}`}
                    </p>
                  </div>
                </div>

                {/* Author, all unique feats (never self), and release type/year */}
                <div className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed border-t border-white/[0.06] pt-3">
                  <span className="font-semibold text-white">{artist.name}</span>
                  {latestReleaseFeats.length > 0 && (
                    <FeaturedArtistsLinks
                      featuredArtist={latestReleaseFeats.join(', ')}
                      excludeArtistName={artist.name}
                      artists={artists}
                      navigateTo={navigateTo}
                      className="ml-1 text-zinc-300"
                    />
                  )}
                  <span className="text-zinc-500 mx-1.5">•</span>
                  <span className="text-zinc-400">{latestRelease.isTrack ? 'Сингл' : 'Альбом'}</span>
                  <span className="text-zinc-500 mx-1.5">•</span>
                  <span className="text-zinc-400">{latestRelease.releaseYear || '2025'}</span>
                </div>

                {/* Native, seamless Tracklist section for Albums */}
                {!latestRelease.isTrack && latestReleaseTracks.length > 0 && (
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setIsLatestDropExpanded(!isLatestDropExpanded)}
                      className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white transition-all duration-300 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ListMusic className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Треклист</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span>{latestReleaseTracks.length} {latestReleaseTracks.length === 1 ? 'трек' : (latestReleaseTracks.length < 5 ? 'трека' : 'треков')}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isLatestDropExpanded ? 'rotate-180 text-white' : ''}`} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isLatestDropExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {latestReleaseTracks.map((tr, idx) => {
                              const trFeats = parseFeaturedNames(tr.featuredArtist, artist.name);
                              const isTrPlaying = isPlaying && currentTrackId === tr.id;
                              return (
                                <div
                                  key={tr.id}
                                  onClick={() => onPlayTrack ? onPlayTrack(tr) : navigateTo('track', { id: tr.id })}
                                  className={`flex items-center justify-between py-2 px-3 rounded-xl border border-transparent hover-outline-row text-xs cursor-pointer group/tr ${
                                    isTrPlaying ? 'bg-white/[0.09] text-white border-white/10' : 'bg-white/[0.02] text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                    <span className="w-4 flex items-center justify-center shrink-0">
                                      {isTrPlaying ? (
                                        <span className="w-2 h-2 rounded-full theme-bg-accent animate-pulse" />
                                      ) : (
                                        <>
                                          <span className="text-[11px] text-zinc-500 font-bold tabular-nums group-hover/tr:hidden">{idx + 1}</span>
                                          <Play className="w-3 h-3 fill-white text-white hidden group-hover/tr:block" />
                                        </>
                                      )}
                                    </span>
                                    <div className="min-w-0 flex-1 truncate">
                                      <span className={`font-semibold hover-text-link ${isTrPlaying ? 'theme-accent' : 'text-zinc-100'}`}>
                                        {tr.title}
                                      </span>
                                      {trFeats.length > 0 && (
                                        <span className="text-[11px] text-zinc-400 ml-1">
                                          feat. {trFeats.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[11px] text-zinc-400 font-medium tabular-nums shrink-0">
                                    {formatNumber(tr.plays)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Discography Section */}
        {filteredArtistAlbums.length > 0 && (
          <section className="mb-12">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {selectedEraId === 'all' ? 'Дискография' : `Дискография эпохи «${eras.find(e => e.id === selectedEraId)?.label || ''}»`}
                </h2>
                <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                  {filteredArtistAlbums.length}
                </span>
              </div>
              <div className="flex items-center p-0.5 rounded-xl bg-zinc-900/90 border border-white/10 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAlbumSortBy('newest')}
                  className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                    albumSortBy === 'newest' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Новые
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumSortBy('oldest')}
                  className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                    albumSortBy === 'oldest' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Старые
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumSortBy('popular')}
                  className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                    albumSortBy === 'popular' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  По стримам
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedAlbums.map((album: any) => (
                <div 
                  key={album.id} 
                  onClick={() => navigateTo('album', { id: album.id })} 
                  className="p-3.5 bg-zinc-900/40 hover:bg-zinc-800/75 rounded-xl hover-outline-card group cursor-pointer relative border border-white/[0.06]"
                >
                  <CoverArt 
                    url={album.coverUrl} 
                    title={album.title}
                    className="aspect-square w-full rounded-lg overflow-hidden mb-3 relative shadow-md bg-zinc-800"
                    innerClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('album', { id: album.id });
                      }}
                      className="absolute bottom-2 right-2 w-10 h-10 rounded-full theme-bg-accent shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-[40ms] hover:scale-105"
                    >
                      <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </button>
                  </CoverArt>
                  <p className="font-semibold text-sm text-white truncate hover-text-link">{album.title}</p>
                  <p className="text-xs text-zinc-400 mt-1">{album.releaseYear} • Альбом</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About Section (О себе) */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">О себе</h2>
          <div className="relative rounded-3xl overflow-hidden bg-zinc-900/60 p-6 md:p-8 max-w-3xl border border-white/[0.06] hover-outline-card">
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
                  {formatNumber(artist.followers)}
                </span>
                <span className="text-xs md:text-sm font-medium text-zinc-400">слушателей за месяц</span>
              </div>
              <p className="text-sm md:text-base text-zinc-300 line-clamp-3 leading-relaxed">
                {artist.bio || "Информация об исполнителе отсутствует."}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {artist.genre && (
                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-zinc-300">
                    {artist.genre}
                  </span>
                )}
                {artist.country && (
                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-zinc-400">
                    {artist.country}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- Collaborators Network (Визуальная сеть связей — расположена под «О себе») --- */}
        {collaborators.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Сеть коллабораций</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Артисты, с которыми записано больше всего совместных треков</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {collaborators.map((c, i) => (
                <div
                  key={i}
                  onClick={() => navigateTo('artist', { id: c.artistId, artistName: c.name })}
                  className="p-3.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/75 border border-white/[0.06] hover-outline-card text-center group cursor-pointer shadow-md"
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2.5 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 group-hover:border-white/30 transition-all duration-300 delay-[40ms] shadow-lg">
                    <CoverArt url={c.imageUrl} title={c.name} isArtist={true} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out" />
                  </div>
                  <p className="text-xs font-bold text-white truncate hover-text-link">{c.name}</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    {c.count} {c.count === 1 ? 'совм. трек' : (c.count < 5 ? 'совм. трека' : 'совм. треков')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- Awards & nominations (Musaic v2.4) --- */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <ArtistAwardsButton artist={artist} tracks={tracks} albums={albums} artists={artists} navigateTo={navigateTo} />
          <button type="button" onClick={() => navigateTo('compare', { mode: 'artists', leftId: artist.id })} title="Сравнить с другим артистом"
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeftRight className="w-3.5 h-3.5" /><span>Сравнить</span>
          </button>
          <ArtistPortfolioButton artist={artist} tracks={tracks} albums={albums} navigateTo={navigateTo} />
        </div>

        {/* --- Eras of the artist (Musaic v2.3) --- */}
        <ArtistEras
          eras={eras}
          selectedEraId={selectedEraId}
          onSelect={setSelectedEraId}
          artistName={artist.name}
          navigateTo={navigateTo}
          totalTracks={artistTracks.length}
          renderCover={(url, title) => <CoverArt url={url} title={title} className="w-full h-full" innerClassName="w-full h-full object-cover" />}
        />
      </div>
    </div>
  );
}

function ArtistTracksView({ 
  id, 
  artists, 
  tracks, 
  navigateTo, 
  toggleLikeTrack, 
  onPlayTrack, 
  openLightbox, 
  currentTrackId, 
  isPlaying,
  onMoreOptionsClick
}: {
  id: string;
  artists: Artist[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  toggleLikeTrack: (id: string) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onMoreOptionsClick?: (item: any) => void;
}) {
  const artist = artists.find((a: any) => a.id === id);
  if (!artist) return <div className="p-20 text-center text-xl font-bold opacity-30">АРТИСТ НЕ НАЙДЕН</div>;
  const artistTracks = sortTracksByRelevance(tracks.filter((t: any) => t.artistId === id));
  const visibleTracksCount = useVisibleCount(25, 25, artistTracks.length);
  const displayedTracks = artistTracks.slice(0, visibleTracksCount);

  return (
    <div className="p-scale animate-in min-h-full">
      <div className="flex items-center gap-4 md:gap-8 mb-8 md:mb-12">
        <CoverArt 
          url={artist.imageUrl} 
          title={artist.name}
          isArtist={true}
          showZoomIcon={true}
          className="w-20 h-20 md:w-32 md:h-32 rounded-full border-2 border-white/10 shrink-0 cursor-pointer shadow-xl relative"
          innerClassName="group-hover:scale-105 transition-transform"
          onPlay={() => openLightbox && openLightbox({ url: artist.imageUrl, title: artist.name, subtitle: `${artistTracks.length} треков`, type: 'Исполнитель' })}
        />
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Все релизы</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">{artist.name}</h2>
          <p className="text-zinc-400 text-xs md:text-sm font-semibold mt-1">Всего {artistTracks.length} {artistTracks.length === 1 ? 'трек' : (artistTracks.length < 5 ? 'трека' : 'треков')}</p>
        </div>
      </div>
      
      <div className="max-w-6xl space-y-1">
        {displayedTracks.map((track: any, i: number) => (
          <TrackRow 
            key={track.id} 
            track={track} 
            index={i} 
            toggleLike={toggleLikeTrack} 
            onTrackClick={() => navigateTo('track', { id: track.id })}
            onPlay={() => onPlayTrack ? onPlayTrack(track) : navigateTo('track', { id: track.id })} 
            onArtworkClick={() => openLightbox && openLightbox({ url: track.coverUrl, title: track.title, subtitle: track.artistName, type: 'Трек' })}
            isPlayingTrack={isPlaying && currentTrackId === track.id}
            hideDuration={true}
            size="lg" 
          />
        ))}
      </div>
    </div>
  );
}

function LibraryView({ 
  albums, 
  artists, 
  tracks, 
  navigateTo, 
  onPlayTrack, 
  openLightbox,
  initialTab = 'all',
  onTabChange,
}: {
  albums: Album[];
  artists: Artist[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [trackSort, setTrackSort] = useState<'popular' | 'newest' | 'oldest' | 'alpha'>('popular');
  const [albumSort, setAlbumSort] = useState<'newest' | 'oldest' | 'popular' | 'alpha'>('newest');
  const [artistSort, setArtistSort] = useState<'popular' | 'alpha' | 'newest'>('popular');

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const sortedTracks = useMemo(() => {
    const list = [...tracks];
    if (trackSort === 'popular') return list.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    if (trackSort === 'alpha') return list.sort((a, b) => a.title.localeCompare(b.title));
    if (trackSort === 'newest') {
      return list.sort((a, b) => {
        const da = parseReleaseTs(a.releaseDate).ts;
        const db = parseReleaseTs(b.releaseDate).ts;
        return db - da;
      });
    }
    if (trackSort === 'oldest') {
      return list.sort((a, b) => {
        const da = parseReleaseTs(a.releaseDate).ts;
        const db = parseReleaseTs(b.releaseDate).ts;
        return da - db;
      });
    }
    return list;
  }, [tracks, trackSort]);

  const sortedAlbums = useMemo(() => {
    const list = [...albums];
    if (albumSort === 'popular') return list.sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0));
    if (albumSort === 'alpha') return list.sort((a, b) => a.title.localeCompare(b.title));
    if (albumSort === 'oldest') {
      return list.sort((a, b) => {
        const da = parseReleaseTs(a.releaseDate, a.releaseYear).ts;
        const db = parseReleaseTs(b.releaseDate, b.releaseYear).ts;
        return da - db;
      });
    }
    // newest default
    return list.sort((a, b) => {
      const da = parseReleaseTs(a.releaseDate, a.releaseYear).ts;
      const db = parseReleaseTs(b.releaseDate, b.releaseYear).ts;
      return db - da;
    });
  }, [albums, albumSort]);

  const sortedArtists = useMemo(() => {
    const list = [...artists];
    if (artistSort === 'popular') return list.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    if (artistSort === 'alpha') return list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [artists, artistSort]);

  const LibraryGrid = ({ items, type }: any) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((item: any) => (
        <div 
          key={item.id} 
          onClick={() => {
            if (onTabChange) onTabChange(activeTab);
            navigateTo(type === 'track' ? 'track' : (type === 'album' ? 'album' : 'artist'), { id: item.id });
          }} 
          className="p-3.5 bg-zinc-900/40 hover:bg-zinc-800/80 rounded-xl transition-all cursor-pointer group border border-white/5"
        >
          <CoverArt 
            url={item.imageUrl || item.coverUrl} 
            title={item.name || item.title}
            isArtist={type === 'artist'}
            className={`w-full aspect-square shadow-md bg-zinc-800 ${type === 'artist' ? 'rounded-full' : 'rounded-lg'}`}
            innerClassName="group-hover:scale-105 duration-300"
          />
          <p className="font-bold truncate text-sm text-white">{item.name || item.title}</p>
          <p className="text-zinc-400 text-xs mt-1 truncate">{type === 'artist' ? 'Исполнитель' : item.artistName || (type === 'album' ? 'Альбом' : 'Трек')}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-scale animate-in min-h-full pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Моя медиатека</h2>
          <p className="text-xs text-zinc-400 mt-1">Все сохраненные артисты, альбомы и треки</p>
        </div>
        <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Все' },
            { id: 'artists', label: `Артисты (${artists.length})` },
            { id: 'albums', label: `Альбомы (${albums.length})` },
            { id: 'tracks', label: `Треки (${tracks.length})` }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => handleSelectTab(t.id)} 
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Minimalist Sort Control Bar when viewing specific tab */}
      {activeTab !== 'all' && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-white/10 text-[11px] font-bold">
            <span className="text-[10px] text-zinc-400 uppercase px-2 font-mono flex items-center gap-1">
              <Sliders className="w-3 h-3 theme-accent" /> Сорт:
            </span>
            {activeTab === 'tracks' && [
              { id: 'popular', label: 'По стримам' },
              { id: 'newest', label: 'Новые' },
              { id: 'oldest', label: 'Старые' },
              { id: 'alpha', label: 'А-Я' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTrackSort(s.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  trackSort === s.id ? 'bg-white/15 text-white shadow-sm font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}

            {activeTab === 'albums' && [
              { id: 'newest', label: 'Новые' },
              { id: 'oldest', label: 'Старые' },
              { id: 'popular', label: 'По стримам' },
              { id: 'alpha', label: 'А-Я' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setAlbumSort(s.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  albumSort === s.id ? 'bg-white/15 text-white shadow-sm font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}

            {activeTab === 'artists' && [
              { id: 'popular', label: 'По слушателям' },
              { id: 'alpha', label: 'А-Я' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setArtistSort(s.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  artistSort === s.id ? 'bg-white/15 text-white shadow-sm font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { id: 'artists', label: 'Исполнители', count: artists.length, icon: User },
            { id: 'albums', label: 'Альбомы', count: albums.length, icon: Disc },
            { id: 'tracks', label: 'Треки', count: tracks.length, icon: Music }
          ].map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => handleSelectTab(cat.id)} 
              className="bg-zinc-900/40 hover:bg-zinc-800/80 p-8 rounded-2xl flex flex-col items-center gap-4 cursor-pointer border border-white/5 transition-all group shadow-lg"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <cat.icon className="w-8 h-8 text-[#1ed760]" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{cat.label}</p>
                <p className="text-xs text-zinc-400 mt-1">{cat.count} элементов в коллекции</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'artists' && <LibraryGrid items={sortedArtists} type="artist" />}
      {activeTab === 'albums' && <LibraryGrid items={sortedAlbums} type="album" />}
      {activeTab === 'tracks' && <LibraryGrid items={sortedTracks} type="track" />}
    </div>
  );
}

function CreatorHub({ artists, setArtists, albums, setAlbums, tracks, setTracks, initialTab = 'artist', targetId, theme, setTheme, followedArtistIds = [], setFollowedArtistIds, navigateTo, onPlayTrack, isActivityFeedOpen, setIsActivityFeedOpen, isSimMode = false, onOpenSimulation }: any) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [selectedExistingTrackIds, setSelectedExistingTrackIds] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isDeployingAlbum, setIsDeployingAlbum] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSelectExistingModalOpen, setIsSelectExistingModalOpen] = useState(false);
  const [existingSearchFilter, setExistingSearchFilter] = useState('');
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [parserTargetMode, setParserTargetMode] = useState<'batch_album' | 'form_album'>('batch_album');

  const handleParserImport = (parsedTracks: Array<{
    title: string;
    duration?: string;
    plays?: number;
    featuredArtist?: string;
  }>) => {
    if (parserTargetMode === 'batch_album') {
      const newTracks = parsedTracks.map(pt => ({
        id: Math.random().toString(36).substr(2, 8),
        title: pt.title,
        duration: pt.duration || getRandomDuration(),
        plays: pt.plays || parseFormattedNumber(getRandomPlays()),
        featuredArtist: pt.featuredArtist
      }));
      setStagedAlbumTracks(prev => [...prev, ...newTracks]);
      setSuccessToast(`✨ Импортировано ${newTracks.length} треков в альбом!`);
    } else {
      const newInline = parsedTracks.map(pt => ({
        title: pt.title,
        duration: pt.duration || getRandomDuration(),
        explicit: false,
        plays: pt.plays ? pt.plays.toLocaleString('ru-RU') : getRandomPlays(),
        featuredArtist: pt.featuredArtist || '',
        peakChart: ''
      }));
      setInlineTracks((prev: any) => [...prev, ...newInline]);
      setSuccessToast(`✨ Добавлено ${newInline.length} треков в альбом!`);
    }
  };
  
  // Batch Release & Timeline State
  const [batchTargetDate, setBatchTargetDate] = useState<string>('2025-09-12');
  const [batchTargetEndDate, setBatchTargetEndDate] = useState<string>('');
  const [batchItemType, setBatchItemType] = useState<'track' | 'album' | 'snippet'>('track');
  const [snippetTeaser, setSnippetTeaser] = useState<string>('');

  // New States for Batch Constructor features
  const [batchCoverUrl, setBatchCoverUrl] = useState<string>('');
  const [coverEditorTarget, setCoverEditorTarget] = useState<'batch' | 'studio' | null>(null);
  const [batchFit, setBatchFit] = useState<string>('');
  const [batchCoArtist, setBatchCoArtist] = useState<string>('');
  const [batchDistMode, setBatchDistMode] = useState<'single' | 'multi_week' | 'period'>('single');
  const [batchDistWeeks, setBatchDistWeeks] = useState<number>(3);
  const [batchPromoStrategy, setBatchPromoStrategy] = useState<ReleasePromoStrategy | undefined>(undefined);
  const [batchReleaseHype, setBatchReleaseHype] = useState<number | undefined>(undefined);
  const [isDraftBatchExpanded, setIsDraftBatchExpanded] = useState<boolean>(false);
  const [previewDraftAlbumItem, setPreviewDraftAlbumItem] = useState<any | null>(null);

  // Album Child Tracks Builder inside Batch
  const [stagedAlbumTracks, setStagedAlbumTracks] = useState<Array<{
    id: string;
    title: string;
    duration: string;
    plays: number;
    featuredArtist?: string;
  }>>([]);
  const [childTrackTitle, setChildTrackTitle] = useState<string>('');
  const [childTrackFit, setChildTrackFit] = useState<string>('');
  const [childTrackDuration, setChildTrackDuration] = useState<string>('2:30');
  const [childTrackPlays, setChildTrackPlays] = useState<string>('50 000');

  // Timeline View Mode
  const [timelineViewMode, setTimelineViewMode] = useState<'grid' | 'dual_column'>('grid');

  const [draftBatch, setDraftBatch] = useState<Array<{
    id: string;
    itemType: 'track' | 'album' | 'snippet';
    title: string;
    artistId: string;
    artistName: string;
    coverUrl?: string;
    plays: number;
    duration?: string;
    isExplicit?: boolean;
    featuredArtist?: string;
    snippetTeaser?: string;
    albumTitle?: string;
    genre?: string;
    promoStrategy?: ReleasePromoStrategy;
    releaseHype?: number;
    albumTracks?: Array<{
      id: string;
      title: string;
      duration: string;
      plays: number;
      featuredArtist?: string;
    }>;
  }>>([]);

  const [timelineFilter, setTimelineFilter] = useState<'all' | 'tops' | 'albums' | 'tracks' | 'snippets'>('all');
  const [timelineSearch, setTimelineSearch] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    artistName: '', artistBio: '', artistGenre: '', artistFollowers: '0', artistVerified: true, artistImg: '', artistCountry: '', artistTrending: false,
    albumTitle: '', albumArtistId: targetId || '', customAlbumArtist: '', albumCoArtist: '', albumImg: '', albumYear: new Date().getFullYear(), albumDate: '', albumGenre: '', albumLabel: '', albumProducer: '', albumPeakChart: '',
    trackTitle: '', trackArtistId: targetId || '', customTrackArtist: '', trackAlbumId: '', trackDuration: getRandomDuration(), trackPlays: '0', trackLikes: '0', trackComposer: '', trackExplicit: false, trackImg: '', trackFit: '', trackYear: new Date().getFullYear(), trackDate: '', trackPeakChart: '',
    albumRating: undefined, trackRating: undefined
  });

  // Suggest best release date (+1 week from latest drop in catalog)
  const suggestBestNextReleaseDate = () => {
    let maxTs = 0;
    [...albums, ...tracks].forEach((x: any) => {
      const dStr = x.releaseDate || (x.releaseYear ? `${x.releaseYear}-01-01` : '');
      if (dStr) {
        const d = new Date(dStr).getTime();
        if (!isNaN(d) && d > maxTs) maxTs = d;
      }
    });

    let target = maxTs > 0 ? new Date(maxTs) : new Date();
    target.setDate(target.getDate() + 7);

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const res = `${yyyy}-${mm}-${dd}`;
    setBatchTargetDate(res);
    showToast(`✨ Назначена дата: ${res} (+1 неделя от последнего релизы)`);
  };

  const addToDraftBatch = () => {
    let targetArtistId = formData.trackArtistId || formData.albumArtistId;
    let targetArtistName = '';

    if (formData.customTrackArtist?.trim()) {
      targetArtistName = formData.customTrackArtist.trim();
      targetArtistId = 'guest_' + targetArtistName;
    } else if (formData.customAlbumArtist?.trim()) {
      targetArtistName = formData.customAlbumArtist.trim();
      targetArtistId = 'guest_' + targetArtistName;
    } else if (targetArtistId) {
      const art = artists.find((a: any) => a.id === targetArtistId);
      targetArtistName = art ? art.name : 'Unknown Artist';
    } else {
      showToast('⚠️ Укажите исполнителя для добавления в батч!');
      return;
    }

    const title = batchItemType === 'album' ? (formData.albumTitle.trim() || 'Без названия альбома') : (formData.trackTitle.trim() || 'Без названия трека');
    const playsNum = parseFormattedNumber(batchItemType === 'album' ? '0' : formData.trackPlays);
    
    // Explicit cover selection
    const coverUrl = batchCoverUrl || (batchItemType === 'album' ? formData.albumImg : formData.trackImg) || '';

    // Calculate total album plays if child tracks exist
    const artObj = artists.find((a: any) => a.id === targetArtistId);
    const followers = artObj?.followers || 0;
    let finalPlays = playsNum || parseFormattedNumber(getRandomPlays(followers, batchItemType === 'album'));
    if (batchItemType === 'album' && stagedAlbumTracks.length > 0) {
      finalPlays = stagedAlbumTracks.reduce((acc, tr) => acc + (tr.plays || 0), 0);
    }

    // Apply optional hype/promo modifier ONLY if user explicitly picked one
    const stratSpec = getPromoStrategyConfig(batchPromoStrategy);
    const hasOptionalPromo = Boolean(stratSpec) || typeof batchReleaseHype === 'number';
    const optionalMult = (stratSpec ? stratSpec.startMult : 1) * getReleaseHypeMultiplier(batchReleaseHype);

    const adjustedStagedTracks = (hasOptionalPromo && optionalMult !== 1)
      ? stagedAlbumTracks.map(tr => ({ ...tr, plays: Math.max(100, Math.round((tr.plays || 0) * optionalMult)) }))
      : [...stagedAlbumTracks];

    if (hasOptionalPromo && optionalMult !== 1) {
      if (batchItemType === 'album' && adjustedStagedTracks.length > 0) {
        finalPlays = adjustedStagedTracks.reduce((acc, tr) => acc + (tr.plays || 0), 0);
      } else {
        finalPlays = Math.max(100, Math.round(finalPlays * optionalMult));
      }
    }

    const draftItem = {
      id: Math.random().toString(36).substring(2, 9),
      itemType: batchItemType,
      title,
      artistId: targetArtistId,
      artistName: targetArtistName,
      coverUrl,
      plays: finalPlays,
      duration: batchItemType === 'album' ? undefined : (formData.trackDuration || getRandomDuration()),
      isExplicit: formData.trackExplicit,
      featuredArtist: batchItemType === 'album' ? (batchCoArtist?.trim() || formData.albumCoArtist?.trim() || undefined) : (batchFit?.trim() || formData.trackFit?.trim() || undefined),
      snippetTeaser: batchItemType === 'snippet' ? snippetTeaser.trim() : undefined,
      albumTitle: batchItemType === 'track' ? (albums.find((a: any) => a.id === formData.trackAlbumId)?.title || 'Single') : undefined,
      genre: batchItemType === 'album' ? formData.albumGenre : formData.trackGenre,
      promoStrategy: batchPromoStrategy,
      releaseHype: batchReleaseHype,
      albumTracks: batchItemType === 'album' ? adjustedStagedTracks : undefined
    };

    setDraftBatch(prev => [...prev, draftItem]);
    showToast(`✓ Релиз "${title}" добавлен в черновик батча!`);
    
    // Reset inputs
    setFormData((prev: any) => ({
      ...prev,
      trackTitle: '',
      albumTitle: '',
      trackFit: '',
      albumCoArtist: ''
    }));
    setBatchCoverUrl('');
    setBatchFit('');
    setBatchCoArtist('');
    setSnippetTeaser('');
    setBatchPromoStrategy(undefined);
    setBatchReleaseHype(undefined);
    setStagedAlbumTracks([]);
  };

  const publishWholeBatch = async () => {
    if (draftBatch.length === 0) return;

    const newTracks: Track[] = [];
    const newAlbums: Album[] = [];
    const startDateStr = parseFlexibleDate(batchTargetDate);
    const startDate = new Date(startDateStr);
    const endDateStr = batchDistMode === 'period' ? parseFlexibleDate(batchTargetEndDate) : '';
    const endDate = endDateStr ? new Date(endDateStr) : null;
    
    const numWeeks = batchDistMode === 'multi_week' ? Math.max(1, batchDistWeeks) : 1;

    draftBatch.forEach((item, index) => {
      let itemReleaseDate = startDateStr;
      
      if (batchDistMode === 'multi_week' && numWeeks > 1) {
        const weekOffset = Math.floor((index * numWeeks) / draftBatch.length);
        const itemDateObj = new Date(startDate.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000);
        const yyyy = itemDateObj.getFullYear();
        const mm = String(itemDateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(itemDateObj.getDate()).padStart(2, '0');
        itemReleaseDate = `${yyyy}-${mm}-${dd}`;
      } else if (batchDistMode === 'period' && endDate) {
        const diffMs = endDate.getTime() - startDate.getTime();
        const itemOffsetMs = (index / Math.max(1, draftBatch.length - 1)) * diffMs;
        const itemDateObj = new Date(startDate.getTime() + itemOffsetMs);
        const yyyy = itemDateObj.getFullYear();
        const mm = String(itemDateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(itemDateObj.getDate()).padStart(2, '0');
        itemReleaseDate = `${yyyy}-${mm}-${dd}`;
      }

      const releaseYear = new Date(itemReleaseDate).getFullYear() || 2025;

      if (item.itemType === 'album') {
        const newAlb: Album = {
          id: item.id,
          title: item.title,
          artistId: item.artistId,
          artistName: item.artistName,
          coArtist: item.featuredArtist,
          coverUrl: item.coverUrl || '',
          releaseYear: releaseYear,
          releaseDate: itemReleaseDate,
          genre: item.genre || 'Музыка',
          isLiked: false,
          totalPlays: item.plays,
          ...(item.promoStrategy ? { promoStrategy: item.promoStrategy } : {}),
          ...(typeof item.releaseHype === 'number' ? { releaseHype: item.releaseHype } : {})
        };
        newAlbums.push(newAlb);

        if (item.albumTracks && item.albumTracks.length > 0) {
          item.albumTracks.forEach((tr, trIdx) => {
            newTracks.push({
              id: tr.id || (item.id + '_tr_' + trIdx),
              title: tr.title,
              artistId: item.artistId,
              artistName: item.artistName,
              albumId: item.id,
              albumTitle: item.title,
              duration: tr.duration || getRandomDuration(),
              plays: tr.plays || Math.floor(item.plays / item.albumTracks!.length),
              likes: Math.floor((tr.plays || 10000) * 0.05),
              isLiked: false,
              releaseDate: itemReleaseDate,
              coverUrl: item.coverUrl || '',
              featuredArtist: tr.featuredArtist || item.featuredArtist,
              ...(item.promoStrategy ? { promoStrategy: item.promoStrategy } : {}),
              ...(typeof item.releaseHype === 'number' ? { releaseHype: item.releaseHype } : {})
            });
          });
        }
      } else {
        const newTrk: Track = {
          id: item.id,
          title: item.title,
          artistId: item.artistId,
          artistName: item.artistName,
          albumId: 'single',
          albumTitle: item.albumTitle || 'Single',
          duration: item.duration || getRandomDuration(),
          plays: item.plays,
          likes: Math.floor(item.plays * 0.05),
          isLiked: false,
          releaseDate: itemReleaseDate,
          isExplicit: item.isExplicit,
          coverUrl: item.coverUrl || '',
          featuredArtist: item.featuredArtist,
          genre: item.genre,
          isSnippet: item.itemType === 'snippet',
          snippetTeaser: item.snippetTeaser,
          ...(item.promoStrategy ? { promoStrategy: item.promoStrategy } : {}),
          ...(typeof item.releaseHype === 'number' ? { releaseHype: item.releaseHype } : {})
        };
        newTracks.push(newTrk);
      }
    });

    const updatedTracks = [...tracks, ...newTracks];
    const updatedAlbums = [...albums, ...newAlbums];

    setTracks(updatedTracks);
    setAlbums(updatedAlbums);

    await dbSet('musaic_master_db', {
      artists,
      albums: updatedAlbums,
      tracks: updatedTracks,
      theme,
      followedArtistIds
    });

    let distInfo = ` за ${startDateStr}`;
    if (batchDistMode === 'multi_week') distInfo = ` за ${numWeeks} нед. (по 7 дней)`;
    else if (batchDistMode === 'period') distInfo = ` за период ${startDateStr} - ${endDateStr}`;

    showToast(`🚀 Успешно выложен весь батч из ${draftBatch.length} релизов${distInfo}!`);
    setDraftBatch([]);
  };

  const [inlineTracks, setInlineTracks] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic calculation of total album plays (memoized to prevent input lag)
  const selectedExistingTracks = useMemo(() => {
    if (selectedExistingTrackIds.length === 0) return [];
    const idSet = new Set(selectedExistingTrackIds);
    return tracks.filter((t: any) => idSet.has(t.id));
  }, [tracks, selectedExistingTrackIds]);

  const totalCalculatedAlbumPlays = useMemo(() => {
    const existingSum = selectedExistingTracks.reduce((acc: number, t: any) => acc + (t.plays || 0), 0);
    const inlineSum = inlineTracks.reduce((acc: number, t: any) => acc + parseFormattedNumber(t.plays), 0);
    return existingSum + inlineSum;
  }, [selectedExistingTracks, inlineTracks]);

  const editingArtistCandidate = useMemo(() => {
    if (editingId) return artists.find((a: any) => a.id === editingId) || null;
    if (formData.artistName?.trim()) {
      return artists.find((a: any) => a.name.toLowerCase() === formData.artistName.trim().toLowerCase()) || {
        id: 'new_temp',
        name: formData.artistName.trim(),
        followers: parseFormattedNumber(formData.artistFollowers),
        genre: formData.artistGenre,
        verified: formData.artistVerified
      };
    }
    return null;
  }, [editingId, formData.artistName, artists, formData.artistFollowers, formData.artistGenre, formData.artistVerified]);

  const recommendedListenersInfo = useMemo(() => {
    if (!editingArtistCandidate) return null;
    return calculateRecommendedArtistListeners(editingArtistCandidate, tracks, albums);
  }, [editingArtistCandidate, tracks, albums]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const [mediaItemCount, setMediaItemCount] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  useEffect(() => {
    dbCountMedia().then(setMediaItemCount);
  }, [activeTab]);

  const handleSyncAllCovers = async () => {
    const synced = syncTracksWithAlbumCovers(tracks, albums);
    setTracks(synced);
    await dbSet('musaic_master_db', { artists, albums, tracks: synced });
    showToast(`✓ Обложки ${synced.length} треков синхронизированы с альбомами!`);
  };

  // 1. Lightweight Catalog Export (Zero Heavy Images, strictly ~100-400 KB)
  const exportLightCatalog = async () => {
    setIsExporting(true);
    try {
      let currentArtists = artists;
      let currentAlbums = albums;
      let currentTracks = tracks;

      const hasBase64 = (
        currentArtists.some((x: any) => x.imageUrl?.startsWith('data:image/')) ||
        currentAlbums.some((x: any) => x.coverUrl?.startsWith('data:image/')) ||
        currentTracks.some((x: any) => x.coverUrl?.startsWith('data:image/'))
      );

      if (hasBase64) {
        const extracted = await extractLegacyBase64Media(currentArtists, currentAlbums, currentTracks);
        currentArtists = extracted.artists;
        currentAlbums = extracted.albums;
        currentTracks = extracted.tracks;
        setArtists(currentArtists);
        setAlbums(currentAlbums);
        setTracks(currentTracks);
        await dbSet('musaic_master_db', { artists: currentArtists, albums: currentAlbums, tracks: currentTracks, theme, followedArtistIds });
      }

      const lightArtists = currentArtists.map(a => {
        let img = a.imageUrl || '';
        if (img.startsWith('data:image/')) {
          img = `idb:media_art_${a.id}`;
        }
        return { ...a, imageUrl: img };
      });

      const lightAlbums = currentAlbums.map(al => {
        let cov = al.coverUrl || '';
        if (cov.startsWith('data:image/')) {
          cov = `idb:media_alb_${al.id}`;
        }
        return { ...al, coverUrl: cov };
      });

      const lightTracks = currentTracks.map(t => {
        const isAlbumTrack = t.albumId && t.albumId !== 'single';
        let cov = t.coverUrl || '';
        if (cov.startsWith('data:image/')) {
          cov = isAlbumTrack ? '' : `idb:media_trk_${t.id}`;
        } else if (isAlbumTrack && cov.startsWith('idb:')) {
          cov = '';
        }
        return { ...t, coverUrl: cov };
      });

      const data = {
        version: 2,
        type: 'lightweight_catalog',
        exportedAt: new Date().toISOString(),
        description: 'Musaic Lightweight Catalog (Metadata without heavy embedded base64 images)',
        itemCounts: {
          artists: lightArtists.length,
          albums: lightAlbums.length,
          tracks: lightTracks.length
        },
        artists: lightArtists,
        albums: lightAlbums,
        tracks: lightTracks,
        theme,
        followedArtistIds
      };

      const jsonStr = JSON.stringify(data, null, 2);
      const sizeKb = Math.round(jsonStr.length / 1024);

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `musaic_catalog_light_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✓ Лёгкий каталог экспортирован: размер всего ~${sizeKb} КБ (вместо 200 МБ)!`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Ошибка при экспорте лёгкого каталога');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Full Backup Export (Metadata + All Media Store Images)
  const exportFullBackup = async () => {
    setIsExporting(true);
    try {
      let currentArtists = artists;
      let currentAlbums = albums;
      let currentTracks = tracks;

      const hasBase64 = (
        currentArtists.some((x: any) => x.imageUrl?.startsWith('data:image/')) ||
        currentAlbums.some((x: any) => x.coverUrl?.startsWith('data:image/')) ||
        currentTracks.some((x: any) => x.coverUrl?.startsWith('data:image/'))
      );

      if (hasBase64) {
        const extracted = await extractLegacyBase64Media(currentArtists, currentAlbums, currentTracks);
        currentArtists = extracted.artists;
        currentAlbums = extracted.albums;
        currentTracks = extracted.tracks;
        setArtists(currentArtists);
        setAlbums(currentAlbums);
        setTracks(currentTracks);
        await dbSet('musaic_master_db', { artists: currentArtists, albums: currentAlbums, tracks: currentTracks, theme, followedArtistIds });
      }

      const allMedia = await dbGetAllMedia();

      const backupArtists = currentArtists.map(a => ({
        ...a,
        imageUrl: a.imageUrl?.startsWith('data:image/') ? `idb:media_art_${a.id}` : a.imageUrl
      }));
      const backupAlbums = currentAlbums.map(al => ({
        ...al,
        coverUrl: al.coverUrl?.startsWith('data:image/') ? `idb:media_alb_${al.id}` : al.coverUrl
      }));
      const backupTracks = currentTracks.map(t => ({
        ...t,
        coverUrl: t.coverUrl?.startsWith('data:image/') ? `idb:media_trk_${t.id}` : t.coverUrl
      }));

      const data = {
        version: 2,
        type: 'full_backup',
        exportedAt: new Date().toISOString(),
        description: 'Musaic Full Backup (Catalog + Standalone Media Store Archive)',
        itemCounts: {
          artists: backupArtists.length,
          albums: backupAlbums.length,
          tracks: backupTracks.length,
          media: allMedia.length
        },
        artists: backupArtists,
        albums: backupAlbums,
        tracks: backupTracks,
        theme,
        followedArtistIds,
        media: allMedia
      };

      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `musaic_full_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✓ Полный бэкап сохранен (${allMedia.length} фото в архиве + каталог)!`);
    } catch (err) {
      console.error(err);
      alert('Ошибка экспорта полного бэкапа');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Media Pack Export
  const exportMediaPack = async () => {
    setIsExporting(true);
    try {
      const allMedia = await dbGetAllMedia();
      const data = {
        version: 2,
        type: 'media_pack',
        exportedAt: new Date().toISOString(),
        description: 'Musaic Media Pack (Standalone photos for all albums and artists)',
        mediaCount: allMedia.length,
        media: allMedia
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `musaic_media_pack_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✓ Медиа-пак экспортирован (${allMedia.length} изображений)!`);
    } catch (err) {
      console.error(err);
      alert('Ошибка экспорта медиа-пака');
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Smart Universal Import
  const handleSmartImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (Array.isArray(data.media) && data.media.length > 0) {
          await dbPutMediaBatch(data.media);
          await loadMediaCache();
        }

        if (data.type === 'media_pack' && (!data.artists && !data.albums && !data.tracks)) {
          const relinked = relinkCatalogMedia(artists, albums, tracks);
          setArtists(relinked.artists);
          setAlbums(relinked.albums);
          setTracks(relinked.tracks);
          await dbSet('musaic_master_db', {
            artists: relinked.artists,
            albums: relinked.albums,
            tracks: relinked.tracks,
            theme,
            followedArtistIds
          });
          const count = await dbCountMedia();
          setMediaItemCount(count);
          showToast(`✓ Медиа-пак загружен! ${data.media.length} фото добавлено и привязано.`);
          setIsImporting(false);
          return;
        }

        let rawArtists = data.artists || artists;
        let rawAlbums = data.albums || albums;
        let rawTracks = data.tracks || tracks;

        if (data.theme) setTheme(prev => ({ ...prev, ...data.theme }));
        if (data.followedArtistIds) setFollowedArtistIds(data.followedArtistIds);

        const hasLegacyBase64 = (
          rawArtists.some((x: any) => x.imageUrl?.startsWith('data:image/')) ||
          rawAlbums.some((x: any) => x.coverUrl?.startsWith('data:image/')) ||
          rawTracks.some((x: any) => x.coverUrl?.startsWith('data:image/'))
        );

        if (hasLegacyBase64) {
          const extracted = await extractLegacyBase64Media(rawArtists, rawAlbums, rawTracks);
          rawArtists = extracted.artists;
          rawAlbums = extracted.albums;
          rawTracks = extracted.tracks;
        }

        const relinked = relinkCatalogMedia(rawArtists, rawAlbums, rawTracks);
        rawArtists = relinked.artists;
        rawAlbums = relinked.albums;
        rawTracks = relinked.tracks;

        setArtists(rawArtists);
        setAlbums(rawAlbums);
        setTracks(rawTracks);

        await dbSet('musaic_master_db', {
          artists: rawArtists,
          albums: rawAlbums,
          tracks: rawTracks,
          theme: data.theme || theme,
          followedArtistIds: data.followedArtistIds || followedArtistIds
        });

        const count = await dbCountMedia();
        setMediaItemCount(count);

        if (hasLegacyBase64) {
          showToast(`✓ База импортирована! Большой файл успешно разгружен: фото сохранены в IndexedDB.`);
        } else if (count === 0) {
          showToast(`✓ Лёгкий каталог импортирован (${rawTracks.length} треков, ${rawAlbums.length} альбомов)! Работает с нуля без фото.`);
        } else {
          showToast(`✓ Каталог импортирован! Фото автоматически привязаны (${relinked.relinkedCount} совпадений).`);
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка чтения файла. Убедитесь, что это корректный JSON Musaic.');
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 5. Explicit Relink Action
  const handleRelinkAllMedia = async () => {
    await loadMediaCache();
    const relinked = relinkCatalogMedia(artists, albums, tracks);
    setArtists(relinked.artists);
    setAlbums(relinked.albums);
    setTracks(relinked.tracks);
    await dbSet('musaic_master_db', {
      artists: relinked.artists,
      albums: relinked.albums,
      tracks: relinked.tracks
    });
    const count = await dbCountMedia();
    setMediaItemCount(count);
    showToast(`✓ Просканировано: привязано ${relinked.relinkedCount} фото к релизам!`);
  };

  const exportData = exportLightCatalog;
  const importData = handleSmartImport;

  const fillRealisticStats = () => {
    if (activeTab === 'artist') {
      setFormData((prev: any) => ({ ...prev, artistFollowers: formatNumber(getRandomValue(5000, 50000000)) }));
    } else if (activeTab === 'track') {
      const plays = getRandomValue(50000, 100000000);
      setFormData((prev: any) => ({ ...prev, trackPlays: formatNumber(plays), trackLikes: formatNumber(Math.floor(plays * 0.04)) }));
    }
  };

  const randomizePlays = () => {
    const artistId = formData.trackArtistId || formData.albumArtistId;
    const art = artists.find((a: any) => a.id === artistId);
    const followers = art?.followers || 0;
    return getRandomPlays(followers, activeTab === 'album');
  };

  const generateAIBio = async () => {
    if (!formData.artistName) return;
    setIsGeneratingBio(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Music bio for "${formData.artistName}". Genre: ${formData.artistGenre || 'Unknown'}. Short, futuristic, cyberpunk vibe.`,
      });
      if (response.text) setFormData((prev: any) => ({ ...prev, artistBio: response.text.trim() }));
    } catch (e) { console.error(e); } finally { setIsGeneratingBio(false); }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      ...formData, 
      artistName: '', artistBio: '', artistGenre: '', artistFollowers: '0', 
      albumTitle: '', albumArtistId: targetId || '', customAlbumArtist: '', albumCoArtist: '', albumProducer: '', albumDate: '', albumPeakChart: '',
      trackTitle: '', trackArtistId: targetId || '', customTrackArtist: '', trackPlays: '0', trackDuration: getRandomDuration(), trackFit: '', trackDate: '', trackPeakChart: '',
      albumRating: undefined, trackRating: undefined
    });
    setInlineTracks([]);
    setSelectedExistingTrackIds([]);
    setBatchCoverUrl('');
    setBatchFit('');
    setBatchCoArtist('');
    setStagedAlbumTracks([]);
  };

  const saveArtist = () => {
    if (!formData.artistName) return;
    const followers = parseFormattedNumber(formData.artistFollowers);
    const id = editingId || Math.random().toString(36).substr(2, 9);
    const newArtist: Artist = {
      id, name: formData.artistName, bio: formData.artistBio, imageUrl: formData.artistImg,
      genre: formData.artistGenre, followers, verified: formData.artistVerified, country: formData.artistCountry, isRisingStar: formData.artistTrending
    };
    if (editingId) setArtists((prev: any) => prev.map((a: any) => a.id === editingId ? newArtist : a));
    else setArtists([...artists, newArtist]);
    showToast(`✓ Артист "${formData.artistName}" сохранен!`);
    resetForm();
  };

  const saveAlbum = () => {
    if (!formData.albumTitle) return;
    let targetArtistId = formData.albumArtistId;
    let targetArtistName = '';

    if (formData.customAlbumArtist?.trim()) {
      targetArtistName = formData.customAlbumArtist.trim();
      targetArtistId = 'guest_' + targetArtistName;
    } else if (formData.albumArtistId) {
      const artist = artists.find((a: any) => a.id === formData.albumArtistId);
      targetArtistName = artist ? artist.name : 'Unknown';
    } else {
      return;
    }

    const albumId = editingId || Math.random().toString(36).substr(2, 9);
    const releaseYear = Number(formData.albumYear) || new Date().getFullYear();
    const releaseDate = parseFlexibleDate(formData.albumDate);

    const newAlbum: Album = {
      id: albumId, 
      title: formData.albumTitle.trim(), 
      artistId: targetArtistId, 
      artistName: targetArtistName,
      coArtist: formData.albumCoArtist?.trim() || undefined,
      coverUrl: formData.albumImg, 
      releaseYear, 
      releaseDate,
      genre: formData.albumGenre, 
      isLiked: false, 
      producer: formData.albumProducer,
      peakChartPosition: formData.albumPeakChart ? parseInt(formData.albumPeakChart) : undefined,
      totalPlays: totalCalculatedAlbumPlays,
      rating: formData.albumRating
    };
    
    if (selectedExistingTrackIds.length > 0) {
      setTracks((prev: any) => prev.map((t: any) => {
        if (selectedExistingTrackIds.includes(t.id)) {
          return { ...t, albumId: albumId, albumTitle: formData.albumTitle, coverUrl: formData.albumImg || t.coverUrl };
        }
        return t;
      }));
    }

    if (inlineTracks.length > 0) {
      const newTracksList: Track[] = inlineTracks.map(t => {
        const playsNum = parseFormattedNumber(t.plays);
        return {
          id: Math.random().toString(36).substr(2, 9), 
          title: t.title || 'Untitled Track', 
          artistId: targetArtistId, 
          artistName: targetArtistName, 
          albumId: albumId, 
          albumTitle: formData.albumTitle,
          duration: t.duration || getRandomDuration(), 
          plays: playsNum, 
          likes: Math.floor(playsNum * 0.05), 
          isLiked: false, 
          isExplicit: t.explicit, 
          coverUrl: formData.albumImg || '',
          featuredArtist: t.featuredArtist || undefined,
          peakChartPosition: t.peakChart ? parseInt(t.peakChart) : undefined,
          releaseDate: releaseDate
        };
      });
      setTracks((prev: any) => [...prev, ...newTracksList]);
    }

    if (editingId) setAlbums((prev: any) => prev.map((a: any) => a.id === editingId ? newAlbum : a));
    else setAlbums([...albums, newAlbum]);

    setIsDeployingAlbum(true);
    showToast(`✓ Альбом "${formData.albumTitle}" успешно развернут!`);
    setTimeout(() => {
      setIsDeployingAlbum(false);
      resetForm();
    }, 2000);
  };

  const saveTrack = () => {
    if (!formData.trackTitle) return;
    let targetArtistId = formData.trackArtistId;
    let targetArtistName = '';

    if (formData.customTrackArtist?.trim()) {
      targetArtistName = formData.customTrackArtist.trim();
      targetArtistId = 'guest_' + targetArtistName;
    } else if (formData.trackArtistId) {
      const artist = artists.find((a: any) => a.id === formData.trackArtistId);
      targetArtistName = artist ? artist.name : 'Unknown';
    } else {
      return;
    }

    const album = albums.find((a: any) => a.id === formData.trackAlbumId);
    const id = editingId || Math.random().toString(36).substr(2, 9);
    const plays = parseFormattedNumber(formData.trackPlays);
    const releaseDate = parseFlexibleDate(formData.trackDate || (album ? album.releaseDate : ''));

    const newTrack: Track = {
      id, 
      title: formData.trackTitle.trim(), 
      artistId: targetArtistId, 
      artistName: targetArtistName,
      albumId: album?.id || 'single', 
      albumTitle: album?.title || 'Single', 
      duration: formData.trackDuration || getRandomDuration(), 
      plays, 
      likes: parseFormattedNumber(formData.trackLikes), 
      isLiked: false, 
      composer: formData.trackComposer, 
      isExplicit: formData.trackExplicit, 
      coverUrl: formData.trackImg || album?.coverUrl || '', 
      featuredArtist: formData.trackFit?.trim() || undefined,
      peakChartPosition: formData.trackPeakChart ? parseInt(formData.trackPeakChart) : undefined,
      releaseDate,
      rating: formData.trackRating
    };

    if (editingId) setTracks((prev: any) => prev.map((t: any) => t.id === editingId ? newTrack : t));
    else setTracks([...tracks, newTrack]);

    setIsBroadcasting(true);
    showToast(`✓ Трек "${formData.trackTitle}" успешно опубликован!`);
    setTimeout(() => {
      setIsBroadcasting(false);
      resetForm();
    }, 2000);
  };

  const availableArtistTracks = useMemo(() => {
    if (!formData.albumArtistId) return [];
    return tracks.filter((t: any) => t.artistId === formData.albumArtistId);
  }, [tracks, formData.albumArtistId]);

  return (
    <div className="p-scale max-w-6xl mx-auto relative">
      {/* Success Toast */}
      {successToast && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-20 right-6 z-50 bg-[#1ed760] text-black font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{successToast}</span>
        </motion.div>
      )}

      {/* Redesigned Clean Segmented Header Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-zinc-900/40 p-6 md:p-8 rounded-3xl border border-white/10 gap-4 shadow-2xl backdrop-blur-xl">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 theme-accent" />
              <span>Студия создания</span>
            </h2>
            {onOpenSimulation && (
              <button
                type="button"
                onClick={onOpenSimulation}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FastForward className="w-3.5 h-3.5 theme-accent" />
                <span>{isSimMode ? 'Пульт симуляции' : 'Войти в режим симуляции'}</span>
              </button>
            )}
            <AlbumFromTracksButton artists={artists} albums={albums} tracks={tracks} setAlbums={setAlbums} setTracks={setTracks} />
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Пакетный конструктор релизов, временная лента дропов и управление каталогом</p>
        </div>
        
        {/* Sleek Liquid Glass Segmented Pill Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/50 rounded-2xl border border-white/10 shadow-inner max-w-full overflow-x-auto">
          {[
            { id: 'batch_builder', label: '🚀 Батч-конструктор' },
            { id: 'timeline', label: '📅 Лента дропов' },
            { id: 'artist', label: '🎤 Артист' },
            { id: 'album', label: '💿 Альбом' },
            { id: 'track', label: '🎵 Трек' },
            { id: 'manage', label: '⚙️ Управление' },
            { id: 'database', label: '💾 База данных' }
          ].map(t => {
            const isActive = activeTab === t.id;
            return (
              <button 
                key={t.id} 
                type="button"
                onClick={() => { setActiveTab(t.id as any); resetForm(); }} 
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-extrabold ${
                  isActive 
                    ? 'theme-bg-accent text-black shadow-lg scale-102 ring-1 ring-white/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeTab === 'database' && (
          <div className="md:col-span-3 space-y-8 animate-in">
            {/* Storage Status & Architecture Overview Card */}
            <div className="theme-card p-6 md:p-8 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      IndexedDB v2 • Offline First
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold text-zinc-400 bg-white/5 border border-white/10">
                      100% Локально и бесплатно
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    Раздельное хранение данных и медиа
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                    Все обложки и фото артистов хранятся в постоянном изолированном хранилище IndexedDB браузера. Каталог релизов разгружен и весит всего ~200 КБ вместо сотен мегабайт, что исключает подвисания и гарантирует моментальный экспорт.
                  </p>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 text-center min-w-[90px]">
                    <p className="text-xl font-black text-white tabular-nums">{artists.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Артистов</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 text-center min-w-[90px]">
                    <p className="text-xl font-black text-white tabular-nums">{albums.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Альбомов</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 text-center min-w-[90px]">
                    <p className="text-xl font-black text-white tabular-nums">{tracks.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Треков</p>
                  </div>
                  <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-3.5 text-center min-w-[90px]">
                    <p className="text-xl font-black text-emerald-400 tabular-nums">{mediaItemCount || mediaCache.size}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Фото в базе</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Export Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Download className="w-4 h-4 theme-accent" />
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Экспорт данных</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-white/10 rounded-3xl bg-zinc-900/50 shadow-xl justify-between group hover:border-white/20 transition-all">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Download className="w-7 h-7 theme-accent" />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 mb-2">
                      Рекомендуется • ~200 КБ
                    </div>
                    <h3 className="text-lg font-extrabold text-white mb-1.5">Лёгкий каталог (Без фото)</h3>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                      Экспорт структуры медиатеки: все исполнители, релизы, треки и оценки без тяжёлых изображений. Скачивается мгновенно.
                    </p>
                  </div>
                  <button 
                    onClick={exportLightCatalog} 
                    className="w-full py-3 theme-bg-accent text-black font-extrabold rounded-2xl hover:opacity-90 transition-all cursor-pointer shadow-lg text-xs"
                  >
                    Скачать лёгкий JSON
                  </button>
                </div>

                <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-white/10 rounded-3xl bg-zinc-900/50 shadow-xl justify-between group hover:border-white/20 transition-all">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileUp className="w-7 h-7 text-sky-400" />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 mb-2">
                      Для переноса на другой ПК
                    </div>
                    <h3 className="text-lg font-extrabold text-white mb-1.5">Полный бэкап (С фото)</h3>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                      Полная копия со всеми метаданными и всеми сохранёнными фото из IndexedDB в одном файле.
                    </p>
                  </div>
                  <button 
                    onClick={exportFullBackup} 
                    disabled={isExporting}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-2xl transition-all cursor-pointer shadow-lg text-xs disabled:opacity-50"
                  >
                    {isExporting ? 'Формирование архива...' : 'Скачать полный бэкап'}
                  </button>
                </div>

                <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-white/10 rounded-3xl bg-zinc-900/50 shadow-xl justify-between group hover:border-white/20 transition-all">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 mb-2">
                      Медиа-хранилище
                    </div>
                    <h3 className="text-lg font-extrabold text-white mb-1.5">Экспорт пака фото</h3>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                      Выгрузить архив только обложек и фотографий артистов со связями по ID для отдельного хранения.
                    </p>
                  </div>
                  <button 
                    onClick={exportMediaPack} 
                    disabled={isExporting}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-2xl transition-all cursor-pointer shadow-lg text-xs disabled:opacity-50"
                  >
                    {isExporting ? 'Экспорт...' : 'Скачать пак фото'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Import & Relink Tools */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <FileUp className="w-4 h-4 theme-accent" />
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Импорт и восстановление связей</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-emerald-500/20 rounded-3xl bg-emerald-950/20 shadow-xl justify-between">
                  <div className="w-14 h-14 bg-emerald-900/40 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <FileUp className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white mb-1.5">Умный импорт базы</h3>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                      Поддерживает ЛЮБОЙ файл: старый 200MB JSON, лёгкий каталог, полный бэкап или медиа-пак. База автоматически оптимизируется, а фото найдут свои релизы.
                    </p>
                  </div>
                  <label className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold rounded-2xl transition-all cursor-pointer text-center block text-xs shadow-lg">
                    {isImporting ? 'Импорт и обработка...' : 'Загрузить JSON файл'}
                    <input type="file" accept=".json" onChange={handleSmartImport} disabled={isImporting} className="hidden" />
                  </label>
                </div>

                <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-white/10 rounded-3xl bg-zinc-900/50 shadow-xl justify-between">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white mb-1.5">Привязать фото к релизам</h3>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                      Сопоставить все альбомы и артистов в медиатеке с сохранёнными в IndexedDB фото по ID, названиям и именам.
                    </p>
                  </div>
                  <button 
                    onClick={handleRelinkAllMedia} 
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-2xl transition-all cursor-pointer shadow-lg text-xs"
                  >
                    Привязать фото к релизам
                  </button>
                </div>

                <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-purple-500/20 rounded-3xl bg-purple-950/20 shadow-xl justify-between">
                  <div className="w-14 h-14 bg-purple-900/40 rounded-2xl flex items-center justify-center border border-purple-500/30">
                    <Disc className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white mb-1.5">Синхронизация треков</h3>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                      Автоматически присвоить всем трекам в базе официальные обложки из соответствующих альбомов.
                    </p>
                  </div>
                  <button 
                    onClick={handleSyncAllCovers} 
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-2xl transition-all cursor-pointer shadow-lg text-xs"
                  >
                    Синхронизировать обложки
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- BATCH BUILDER TAB --- */}
        {activeTab === 'batch_builder' && (
          <div className="md:col-span-3 space-y-8 animate-in">
            {/* Target Release Date & Period Auto-Distribution Selector */}
            <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 theme-accent" />
                    <h3 className="text-xl md:text-2xl font-black text-white">Релизный период и автораспределение</h3>
                  </div>
                  <p className="text-xs text-zinc-400">Выберите дату или промежуток для автоматического распределения релизов</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={suggestBestNextReleaseDate}
                    className="px-4 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>✨ +1 нед. от последнего</span>
                  </button>
                  <div className="px-4 py-2 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono font-bold text-emerald-400">
                    📅 {batchTargetDate}{batchDistMode === 'period' && batchTargetEndDate ? ` — ${batchTargetEndDate}` : ''}
                  </div>
                </div>
              </div>

              {/* Distribution Mode Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">Режим выкладки батча</label>
                  <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setBatchDistMode('single')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        batchDistMode === 'single' ? 'theme-bg-accent text-black shadow-md' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      1 ДЕНЬ
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchDistMode('multi_week')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        batchDistMode === 'multi_week' ? 'theme-bg-accent text-black shadow-md' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      НЕДЕЛИ
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchDistMode('period')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        batchDistMode === 'period' ? 'theme-bg-accent text-black shadow-md' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      ПЕРИОД
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {batchDistMode === 'multi_week' && (
                    <>
                      <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">Длительность периода (Недель)</label>
                      <div className="flex items-center gap-2">
                        {[2, 3, 4, 8].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setBatchDistWeeks(w)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              batchDistWeeks === w ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/5 bg-black/40 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {w} нед.
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          max={52}
                          value={batchDistWeeks}
                          onChange={e => setBatchDistWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs font-bold text-white text-center outline-none"
                        />
                      </div>
                    </>
                  )}
                  {batchDistMode === 'period' && (
                    <>
                      <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">Конечная дата диапазона</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="date"
                          value={batchTargetEndDate}
                          onChange={e => setBatchTargetEndDate(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white outline-none focus:border-white/30"
                        />
                        <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400">
                          Релизы распределятся равномерно
                        </div>
                      </div>
                    </>
                  )}
                  {batchDistMode === 'single' && (
                    <div className="flex items-center gap-3 h-full pt-6">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <p className="text-xs text-zinc-500 font-medium">Все релизы батча выйдут в один указанный день</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Year & Date Selector Controls - ONLY IN MULTI/PERIOD MODE */}
              {batchDistMode !== 'single' && (
                <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">Быстрый выбор года для эпохи</label>
                    <span className="text-[10px] text-zinc-500 font-bold">2019 — 2026</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'].map(yr => {
                      const currentYr = batchTargetDate.split('-')[0] || '2025';
                      const isSel = currentYr === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            const parts = batchTargetDate.split('-');
                            const monthDay = parts.length === 3 ? `${parts[1]}-${parts[2]}` : '09-12';
                            setBatchTargetDate(`${yr}-${monthDay}`);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                            isSel ? 'theme-bg-accent text-black border-white/20 shadow-lg scale-105' : 'bg-black/40 text-zinc-500 hover:text-white border-white/5'
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Manual Date Input & Date Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                      {batchDistMode === 'period' ? 'Дата начала (Старт)' : 'Дата релиза (или начало)'}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={batchTargetDate}
                        onChange={e => setBatchTargetDate(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white outline-none focus:border-white/30"
                      />
                    </div>
                  </div>

                  {/* Friday Preset Buttons */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">Релизные пятницы (Сентябрь/Октябрь)</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '12 Сен', date: `${batchTargetDate.split('-')[0] || '2025'}-09-12` },
                        { label: '19 Сен', date: `${batchTargetDate.split('-')[0] || '2025'}-09-19` },
                        { label: '26 Сен', date: `${batchTargetDate.split('-')[0] || '2025'}-09-26` },
                        { label: '03 Окт', date: `${batchTargetDate.split('-')[0] || '2025'}-10-03` },
                      ].map(p => (
                        <button
                          key={p.date}
                          type="button"
                          onClick={() => setBatchTargetDate(p.date)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer border ${
                            batchTargetDate === p.date 
                              ? 'theme-bg-accent text-black border-white/20 shadow-md scale-102' 
                              : 'bg-black/40 text-zinc-500 hover:text-white border-white/5 hover:border-white/20'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form: Add Item to Batch Draft */}
              <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl border border-white/10 bg-zinc-900/50 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h4 className="text-lg font-black text-white">Добавить релиз в черновик батча</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Укажите фит, обложку и состав альбома</p>
                  </div>
                  {/* Item Type Switcher */}
                  <div className="flex gap-1 p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
                    {[
                      { id: 'track', label: '🎵 Трек' },
                      { id: 'album', label: '💿 Альбом' },
                      { id: 'snippet', label: '🎬 Сниппет' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBatchItemType(t.id as any)}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          batchItemType === t.id ? 'theme-bg-accent text-black shadow-md font-extrabold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      {batchItemType === 'album' ? 'Название альбома' : 'Название трека / сниппета'}
                    </label>
                    <input
                      type="text"
                      placeholder={batchItemType === 'album' ? 'Название альбома' : 'Название трека / сниппета'}
                      value={batchItemType === 'album' ? formData.albumTitle : formData.trackTitle}
                      onChange={e => {
                        if (batchItemType === 'album') setFormData({ ...formData, albumTitle: e.target.value });
                        else setFormData({ ...formData, trackTitle: e.target.value });
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm md:text-base font-bold text-white outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Generators from the simulation (Musaic v2.4) */}
                  <BatchSmartTools
                    mode={batchItemType}
                    artistId={batchItemType === 'album' ? formData.albumArtistId : formData.trackArtistId}
                    artists={artists}
                    tracks={tracks}
                    albums={albums}
                    dateIso={parseFlexibleDate(batchTargetDate)}
                    onTitle={(v) => setFormData((prev: any) => (batchItemType === 'album' ? { ...prev, albumTitle: v } : { ...prev, trackTitle: v }))}
                    onPlays={(v) => setFormData((prev: any) => ({ ...prev, trackPlays: v }))}
                    onDuration={(v) => setFormData((prev: any) => ({ ...prev, trackDuration: v }))}
                    onFeat={(v) => setBatchFit(v)}
                    onAlbumTracks={(list) => setStagedAlbumTracks(list)}
                  />

                  {/* Artist Selector Modal Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">Основной исполнитель</label>
                      <button
                        type="button"
                        onClick={() => setPickerTarget(batchItemType === 'album' ? 'albumArtist' : 'trackArtist')}
                        className="text-xs theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" /> Выбрать из списка
                      </button>
                    </div>
                    {(() => {
                      const currentArtId = batchItemType === 'album' ? formData.albumArtistId : formData.trackArtistId;
                      const currentCustomName = batchItemType === 'album' ? formData.customAlbumArtist : formData.customTrackArtist;
                      const selectedArt = artists.find((a: any) => a.id === currentArtId);

                      if (selectedArt) {
                        return (
                          <div
                            onClick={() => setPickerTarget(batchItemType === 'album' ? 'albumArtist' : 'trackArtist')}
                            className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <CoverArt url={selectedArt.imageUrl} title={selectedArt.name} isArtist className="w-9 h-9 rounded-full border border-white/10" />
                              <div>
                                <p className="font-extrabold text-sm text-white">{selectedArt.name}</p>
                                <p className="text-[10px] text-zinc-400">{formatListeners(selectedArt.followers)}</p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 font-bold px-2 py-1 rounded-lg bg-white/5">Сменить →</span>
                          </div>
                        );
                      }
                      if (currentCustomName) {
                        return (
                          <div
                            onClick={() => setPickerTarget(batchItemType === 'album' ? 'albumArtist' : 'trackArtist')}
                            className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer"
                          >
                            <p className="font-extrabold text-sm text-white">{currentCustomName} (Свой артист)</p>
                            <span className="text-xs text-zinc-400 font-bold px-2 py-1 rounded-lg bg-white/5">Сменить →</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => setPickerTarget(batchItemType === 'album' ? 'albumArtist' : 'trackArtist')}
                          className="w-full p-3.5 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-white/15 text-xs font-bold text-zinc-300 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <User className="w-4 h-4 theme-accent" /> Нажмите, чтобы выбрать артиста
                        </button>
                      );
                    })()}
                  </div>

                  {/* Fit / Co-Artist Input with Catalog Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">
                        {batchItemType === 'album' ? 'Соавтор альбома / Коллаборация' : 'Приглашенный артист (Фит)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setPickerTarget(batchItemType === 'album' ? 'batchCoArtist' : 'batchFit')}
                        className="text-xs theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" /> Выбрать из списка
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Имя приглашенного артиста или соавтора"
                        value={batchItemType === 'album' ? batchCoArtist : batchFit}
                        onChange={e => {
                          if (batchItemType === 'album') setBatchCoArtist(e.target.value);
                          else setBatchFit(e.target.value);
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold text-white outline-none focus:border-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setPickerTarget(batchItemType === 'album' ? 'batchCoArtist' : 'batchFit')}
                        className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-white/10 transition-colors cursor-pointer shrink-0"
                      >
                        + Из базы
                      </button>
                    </div>
                  </div>

                  {/* Cover Selection: File Upload Button */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 block">Обложка релиза</label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <label className="flex-1 py-3 px-4 bg-zinc-800/90 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-2xl text-xs font-extrabold text-white cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 group">
                          <FileUp className="w-4 h-4 theme-accent group-hover:scale-110 transition-transform" />
                          <span>Загрузить обложку с устройства</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const b64 = await fileToBase64(file);
                                const mediaId = await saveMediaItem(b64, { type: 'album' });
                                setBatchCoverUrl(mediaId);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCoverEditorTarget('batch')}
                          title="Создать обложку в редакторе"
                          className="w-11 h-11 shrink-0 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 border border-white/10 hover:border-white/25 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      {batchCoverUrl && (
                        <div className="flex items-center gap-3 p-2 px-3 bg-black/40 rounded-2xl border border-white/10 shrink-0">
                          <CoverArt url={batchCoverUrl} title="Превью" className="w-9 h-9 rounded-xl shrink-0" />
                          <span className="text-xs text-emerald-400 font-bold">Загружено ✓</span>
                          <button type="button" onClick={() => setBatchCoverUrl('')} className="text-xs text-red-400 font-bold hover:text-red-300 ml-1 cursor-pointer">× Удалить</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Album Child Tracks Builder (When itemType === 'album') */}
                  {batchItemType === 'album' && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Disc className="w-4 h-4" /> Треки внутри альбома ({stagedAlbumTracks.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setParserTargetMode('batch_album');
                            setIsParserOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                          title="Вставить список треков из буфера или текста"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>⚡ Экспресс-парсер треклиста</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Название трека"
                            value={childTrackTitle}
                            onChange={e => setChildTrackTitle(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                          />
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Длительность"
                              value={childTrackDuration}
                              onChange={e => setChildTrackDuration(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setChildTrackDuration(getRandomDuration())}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] theme-accent font-bold hover:underline cursor-pointer"
                              title="Случайная длительность (1-4 мин)"
                            >
                              🎲
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Прослушивания"
                              value={childTrackPlays}
                              onChange={e => setChildTrackPlays(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none pr-8"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentArtId = formData.albumArtistId;
                                const art = artists.find((a: any) => a.id === currentArtId);
                                const followers = art?.followers || 150000;
                                setChildTrackPlays(getRandomPlays(followers, false));
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] theme-accent font-bold hover:underline cursor-pointer"
                              title="Рассчитать прослушивания на основе популярности артиста"
                            >
                              🎲
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Приглашенный артист (Фит, опционально)"
                            value={childTrackFit}
                            onChange={e => setChildTrackFit(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setPickerTarget('childTrackFit')}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] rounded-xl border border-white/10 transition-colors cursor-pointer shrink-0"
                          >
                            + Артист
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!childTrackTitle.trim()) return;
                          setStagedAlbumTracks(prev => [
                            ...prev,
                            {
                              id: Math.random().toString(36).substr(2, 8),
                              title: childTrackTitle.trim(),
                              duration: childTrackDuration || getRandomDuration(),
                              plays: parseFormattedNumber(childTrackPlays) || parseFormattedNumber(getRandomPlays()),
                              featuredArtist: childTrackFit.trim() || undefined
                            }
                          ]);
                          setChildTrackTitle('');
                          setChildTrackFit('');
                          setChildTrackDuration(getRandomDuration());
                        }}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Добавить трек в альбом
                      </button>

                      {stagedAlbumTracks.length > 0 && (
                        <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto custom-scrollbar">
                          {stagedAlbumTracks.map((tr, idx) => (
                            <div key={tr.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-xs text-zinc-300">
                              <span className="font-bold text-white truncate max-w-[200px]">{idx + 1}. {tr.title}</span>
                              <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                                <span>{tr.plays.toLocaleString('ru-RU')} просл.</span>
                                <span>{tr.duration}</span>
                                <button
                                  type="button"
                                  onClick={() => setStagedAlbumTracks(stagedAlbumTracks.filter(x => x.id !== tr.id))}
                                  className="text-red-400 hover:text-red-300 cursor-pointer ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Snippet teaser text field if snippet */}
                  {batchItemType === 'snippet' && (
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Описание тизера / сниппета</label>
                      <textarea
                        value={snippetTeaser}
                        onChange={e => setSnippetTeaser(e.target.value)}
                        placeholder="Эксклюзивный сниппет перед официальным дропом альбома..."
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs md:text-sm text-white outline-none focus:border-white/30"
                      />
                    </div>
                  )}

                  {/* Plays and Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-zinc-300">Прослушивания</label>
                        <button
                          type="button"
                          onClick={() => {
                            const rnd = getRandomPlays();
                            setFormData((prev: any) => ({ ...prev, trackPlays: rnd }));
                          }}
                          className="text-[11px] theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Dices className="w-3.5 h-3.5" /> 🎲 Рандом
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.trackPlays}
                        onChange={e => {
                          const num = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, trackPlays: formatNumber(parseInt(num) || 0) });
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none tabular-nums"
                      />
                    </div>

                    {batchItemType !== 'album' && (
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">Длительность</label>
                        <input
                          type="text"
                          value={formData.trackDuration}
                          onChange={e => setFormData({ ...formData, trackDuration: formatDurationInput(e.target.value) })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Optional Compact 1-Button Hype / Promo Control */}
                  <ReleaseHypeControl
                    promoStrategy={batchPromoStrategy}
                    releaseHype={batchReleaseHype}
                    defaultHype={70}
                    onChange={(strategy, hypeVal) => {
                      setBatchPromoStrategy(strategy);
                      setBatchReleaseHype(hypeVal);
                    }}
                  />

                  <button
                    type="button"
                    onClick={addToDraftBatch}
                    className="w-full py-4 theme-bg-accent text-black font-extrabold rounded-2xl text-sm shadow-xl hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5 fill-black" />
                    <span>Добавить в черновик батча (+1)</span>
                  </button>
                </div>
              </div>

              {/* Upgraded Staged Draft Basket Column */}
              <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-lg font-black text-white">Черновик батча</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {batchDistMode === 'multi_week' ? `Распределение на ${batchDistWeeks} нед.` : 'Однодневный дроп'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDraftBatchExpanded(true)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Открыть расписание батча на весь экран"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Крупный вид</span>
                      </button>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold tabular-nums">
                        {draftBatch.length} релизов
                      </span>
                    </div>
                  </div>

                  {draftBatch.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 text-xs font-medium space-y-2">
                      <Package className="w-8 h-8 mx-auto text-zinc-600 mb-1" />
                      <p>Черновик пуст.</p>
                      <p className="text-[11px] text-zinc-600">Заполните форму слева и добавьте треки или альбомы в батч.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                      {/* Summary Stats Badge */}
                      <div className="p-3 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-between text-xs text-zinc-300 font-bold">
                        <span>Всего треков: {
                          draftBatch.reduce((sum, item) => sum + (item.itemType === 'album' ? (item.albumTracks?.length || 1) : 1), 0)
                        }</span>
                        <span className="theme-accent tabular-nums">{
                          draftBatch.reduce((sum, item) => sum + (item.plays || 0), 0).toLocaleString('ru-RU')
                        } просл.</span>
                      </div>

                      {/* Items List grouped by Type */}
                      {draftBatch.map((item) => (
                        <div key={item.id} className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 group">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <CoverArt url={item.coverUrl} title={item.title} className="w-12 h-12 rounded-xl shrink-0 bg-zinc-800" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    item.itemType === 'album' ? 'bg-amber-500/20 text-amber-300' : (item.itemType === 'snippet' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300')
                                  }`}>
                                    {item.itemType === 'album' ? 'Альбом' : (item.itemType === 'snippet' ? 'Сниппет' : 'Трек')}
                                  </span>
                                  {item.featuredArtist && (
                                    <span className="text-[9px] text-zinc-400 font-bold truncate">feat. {item.featuredArtist}</span>
                                  )}
                                  {(item.promoStrategy || typeof item.releaseHype === 'number') && (
                                    <span className="text-[10px] text-amber-300 font-semibold truncate">
                                      · {item.promoStrategy && RELEASE_PROMO_LABELS[item.promoStrategy] ? RELEASE_PROMO_LABELS[item.promoStrategy].shortLabel : ''}{typeof item.releaseHype === 'number' ? ` (${item.releaseHype})` : ''}
                                    </span>
                                  )}
                                </div>
                                <p className="font-extrabold text-xs text-white truncate mt-0.5">{item.title}</p>
                                <p className="text-[11px] text-zinc-400 truncate">{item.artistName}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDraftBatch(draftBatch.filter(x => x.id !== item.id))}
                              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer shrink-0"
                              title="Удалить из черновика"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Stats and Child Tracks preview for Albums */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <span className="tabular-nums text-white font-bold">{item.plays.toLocaleString('ru-RU')} просл.</span>
                            {item.itemType === 'album' && item.albumTracks && (
                              <span className="text-amber-400 font-bold">{item.albumTracks.length} треков в составе</span>
                            )}
                            {item.duration && <span>{item.duration}</span>}
                          </div>

                          {/* Child Tracks list preview */}
                          {item.itemType === 'album' && item.albumTracks && item.albumTracks.length > 0 && (
                            <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1 text-[10px] text-zinc-400">
                              {item.albumTracks.map((tr, idx) => (
                                <div key={tr.id} className="flex justify-between items-center">
                                  <span className="truncate text-zinc-300">{idx + 1}. {tr.title}</span>
                                  <span>{tr.duration}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={publishWholeBatch}
                  disabled={draftBatch.length === 0}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-2xl text-sm shadow-xl transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 fill-black" />
                  <span>🚀 Выложить весь батч ({draftBatch.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DROP TIMELINE TAB WITH DUAL COLUMN VIEW MODE --- */}
        {activeTab === 'timeline' && (
          <div className="md:col-span-3 space-y-8 animate-in">
            {/* Timeline Header, Search & View Mode Switcher */}
            <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-white">Временная лента дропов</h3>
                  <p className="text-xs text-zinc-400 mt-1">Хронологическая лента всех релизов с переключением режимов отображения</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Mode Switcher: Grid vs Dual Column */}
                  <div className="flex gap-1 p-1 bg-black/40 rounded-2xl border border-white/10 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTimelineViewMode('grid')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        timelineViewMode === 'grid' ? 'theme-bg-accent text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🔳 Сетка
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineViewMode('dual_column')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        timelineViewMode === 'dual_column' ? 'theme-bg-accent text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      📊 Колонки: Альбомы | Треки
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsActivityFeedOpen(true)}
                    className="px-3.5 py-2 rounded-2xl text-xs font-black bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all border border-indigo-500/30 flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Flame className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Активность артистов</span>
                  </button>

                  <div className="relative w-full md:w-60">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Поиск дропов..."
                      value={timelineSearch}
                      onChange={e => setTimelineSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Segmented Buttons */}
              <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/10 overflow-x-auto">
                {[
                  { id: 'all', label: 'Все дропы' },
                  { id: 'tops', label: '🔥 Топы недели' },
                  { id: 'albums', label: '💿 Альбомы' },
                  { id: 'tracks', label: '🎵 Треки' },
                  { id: 'snippets', label: '🎬 Сниппеты / Тизеры' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTimelineFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      timelineFilter === f.id ? 'theme-bg-accent text-black shadow-md font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Content */}
            {(() => {
              // Collect all items (tracks + albums)
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
                  const albTracksCount = tracks.filter((t: Track) => t.albumId === al.id || (t.albumTitle && t.albumTitle.toLowerCase() === al.title.toLowerCase())).length;
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

              // Apply filters
              if (timelineFilter === 'tops') {
                combined = combined.filter(x => x.plays >= 500000 || (x.rating && x.rating.totalScore >= 65));
              } else if (timelineFilter === 'albums') {
                combined = combined.filter(x => x.type === 'album');
              } else if (timelineFilter === 'tracks') {
                combined = combined.filter(x => x.type === 'track' && !x.isSnippet);
              } else if (timelineFilter === 'snippets') {
                combined = combined.filter(x => x.isSnippet);
              }

              if (timelineSearch.trim()) {
                const q = timelineSearch.toLowerCase();
                combined = combined.filter(x => x.title.toLowerCase().includes(q) || x.artistName.toLowerCase().includes(q));
              }

              if (combined.length === 0) {
                return (
                  <div className="p-12 text-center text-zinc-500 font-bold bg-zinc-900/40 border border-white/5 rounded-3xl">
                    По вашему запросу релизы не найдены.
                  </div>
                );
              }

              /* MODE 2: DUAL COLUMN VIEW (Chronological Timeline Split: Albums Left | Tracks Right) */
              if (timelineViewMode === 'dual_column') {
                const groups = new Map<string, typeof combined>();
                combined.forEach(item => {
                  const dateStr = item.releaseDate ? item.releaseDate.split('T')[0] : 'Без даты';
                  if (!groups.has(dateStr)) groups.set(dateStr, []);
                  groups.get(dateStr)!.push(item);
                });

                const sortedDates = Array.from(groups.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                return sortedDates.map(dateKey => {
                  const dayItems = groups.get(dateKey) || [];
                  const dayAlbums = dayItems.filter(x => x.type === 'album');
                  const dayTracks = dayItems.filter(x => x.type === 'track' && (!x.raw.albumId || x.raw.albumId === 'single'));

                  return (
                    <div key={dateKey} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                        <div className="w-3 h-3 rounded-full theme-bg-accent shadow-md"></div>
                        <h4 className="text-lg font-black text-white font-mono">{formatDateDisplay(dateKey)}</h4>
                        <span className="text-xs text-zinc-500 font-bold">({dayItems.length} релизов)</span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* LEFT COLUMN: ALBUMS */}
                        <div className="p-5 rounded-3xl bg-zinc-900/40 border border-white/10 space-y-3 shadow-xl">
                          <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Disc className="w-4 h-4" /> Альбомы ({dayAlbums.length})
                            </span>
                          </div>
                          {dayAlbums.length === 0 ? (
                            <p className="text-xs text-zinc-600 italic py-2">Нет альбомов на эту дату</p>
                          ) : (
                            <div className="space-y-2.5">
                              {dayAlbums.map(rel => (
                                <div
                                  key={`dual-alb-${rel.id}`}
                                  onClick={() => navigateTo('album', { id: rel.id })}
                                  className="p-3 rounded-2xl bg-black/40 hover:bg-zinc-800/80 border border-white/10 hover:border-white/25 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-lg"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <CoverArt url={rel.coverUrl} title={rel.title} className="w-12 h-12 rounded-xl shrink-0 bg-zinc-800" />
                                    <div className="min-w-0">
                                      <h5 className="font-extrabold text-sm text-white truncate group-hover:text-amber-300 transition-colors">{rel.title}</h5>
                                      <p className="text-xs text-zinc-400 truncate">{rel.artistName}</p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 font-mono text-xs text-zinc-400">
                                    <p className="text-white font-bold tabular-nums">{rel.plays.toLocaleString('ru-RU')} просл.</p>
                                    <p className="text-[10px] text-amber-300 font-bold">💿 {rel.trackCount} треков</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* RIGHT COLUMN: TRACKS */}
                        <div className="p-5 rounded-3xl bg-zinc-900/40 border border-white/10 space-y-3 shadow-xl">
                          <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Music className="w-4 h-4" /> Треки и Синглы ({dayTracks.length})
                            </span>
                          </div>
                          {dayTracks.length === 0 ? (
                            <p className="text-xs text-zinc-600 italic py-2">Нет синглов на эту дату</p>
                          ) : (
                            <div className="space-y-2.5">
                              {dayTracks.map(rel => (
                                <div
                                  key={`dual-trk-${rel.id}`}
                                  onClick={() => navigateTo('track', { id: rel.id })}
                                  className="p-3 rounded-2xl bg-black/40 hover:bg-zinc-800/80 border border-white/10 hover:border-white/25 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-lg"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <CoverArt url={rel.coverUrl} title={rel.title} className="w-11 h-11 rounded-xl shrink-0 bg-zinc-800" />
                                    <div className="min-w-0">
                                      <h5 className="font-extrabold text-sm text-white truncate group-hover:text-sky-300 transition-colors">{rel.title}</h5>
                                      <p className="text-xs text-zinc-400 truncate">{rel.artistName}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                                    <span className="text-white font-bold tabular-nums">{rel.plays.toLocaleString('ru-RU')} просл.</span>
                                    <button
                                      type="button"
                                      onClick={e => { e.stopPropagation(); onPlayTrack(rel.raw); }}
                                      className="w-8 h-8 rounded-full theme-bg-accent flex items-center justify-center text-black shadow-lg hover:scale-105 transition-transform cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              }

              /* MODE 1: UNIFIED GRID CHRONOLOGICAL STREAM */
              const groups = new Map<string, typeof combined>();
              combined.forEach(item => {
                const dateStr = item.releaseDate ? item.releaseDate.split('T')[0] : 'Без даты';
                if (!groups.has(dateStr)) groups.set(dateStr, []);
                groups.get(dateStr)!.push(item);
              });

              const sortedDates = Array.from(groups.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

              return sortedDates.map(dateKey => {
                const items = groups.get(dateKey) || [];
                return (
                  <div key={dateKey} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full theme-bg-accent shadow-md"></div>
                      <h4 className="text-lg font-black text-white font-mono">{formatDateDisplay(dateKey)}</h4>
                      <span className="text-xs text-zinc-500 font-bold">({items.length} релизов)</span>
                      <div className="flex-1 h-px bg-white/10"></div>
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
                              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  rel.isSnippet ? 'bg-purple-500 text-white' : (rel.type === 'album' ? 'bg-amber-400 text-black' : 'bg-black/80 text-white border border-white/10')
                                }`}>
                                  {rel.isSnippet ? 'Сниппет' : (rel.type === 'album' ? 'Альбом' : 'Трек')}
                                </span>
                              </div>
                              {rel.type === 'track' && (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); onPlayTrack(rel.raw); }}
                                  className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full theme-bg-accent flex items-center justify-center text-black shadow-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                  <Play className="w-5 h-5 fill-black ml-0.5" />
                                </button>
                              )}
                            </div>

                            <h5 className="font-extrabold text-sm text-white truncate group-hover:text-amber-300 transition-colors">{rel.title}</h5>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{rel.artistName}</p>
                            {rel.snippetTeaser && (
                              <p className="text-[11px] text-purple-300 italic mt-1 line-clamp-2">{rel.snippetTeaser}</p>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
                            <span className="flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5 text-amber-400" />
                              <span className="tabular-nums text-white font-bold">{rel.plays.toLocaleString('ru-RU')}</span>
                              {rel.type === 'album' && (
                                <span className="text-[10px] text-amber-300 font-bold ml-1">• {rel.trackCount} треков</span>
                              )}
                            </span>
                            {rel.duration && <span>{rel.duration}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {activeTab !== 'manage' && activeTab !== 'database' && activeTab !== 'batch_builder' && activeTab !== 'timeline' && (
          <div className="md:col-span-2 space-y-6 theme-card p-6 md:p-8 border border-white/10 rounded-3xl bg-zinc-900/50 shadow-2xl">
            {/* --- ARTIST FORM --- */}
            {activeTab === 'artist' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2">Имя исполнителя / Название группы</label>
                  <input 
                    type="text" 
                    placeholder="" 
                    value={formData.artistName} 
                    onChange={(e) => setFormData({...formData, artistName: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-3 text-sm md:text-base font-bold text-white placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">Жанр артиста</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_CATALOG.map(g => {
                      const isSelected = formData.artistGenre === g.name;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, artistGenre: isSelected ? '' : g.name })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'theme-bg-accent text-black shadow-md' 
                              : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Или укажите свой жанр..." 
                    value={formData.artistGenre} 
                    onChange={e => setFormData({ ...formData, artistGenre: e.target.value })} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/30 mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">Ежемесячные слушатели</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFormData({ ...formData, artistFollowers: getRandomPlays() });
                        }} 
                        className="text-[11px] theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Dices className="w-3.5 h-3.5" /> 200к-15М
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={formData.artistFollowers} 
                      onChange={e => {
                        const num = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, artistFollowers: formatNumber(parseInt(num) || 0) });
                      }} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none tabular-nums"
                    />
                    {recommendedListenersInfo && (
                      <div className="mt-2 p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Рекомендуется по базе:</span>
                            <span className="text-xs font-black text-white tabular-nums">
                              {formatNumber(recommendedListenersInfo.recommended)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 font-bold">
                              {recommendedListenersInfo.tier}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {recommendedListenersInfo.reason}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev: any) => ({
                              ...prev,
                              artistFollowers: formatNumber(recommendedListenersInfo.recommended)
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg theme-bg-accent text-black text-[11px] font-black hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                          Применить
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Страна / Локация</label>
                    <input 
                      type="text" 
                      placeholder="Россия, Москва..." 
                      value={formData.artistCountry} 
                      onChange={e => setFormData({ ...formData, artistCountry: e.target.value })} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-300">Биография артиста</label>
                    <button 
                      type="button"
                      onClick={generateAIBio} 
                      disabled={isGeneratingBio} 
                      className="text-xs font-bold theme-accent hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> 
                      <span>{isGeneratingBio ? 'Генерация ИИ...' : 'Сгенерировать биографию (AI)'}</span>
                    </button>
                  </div>
                  <textarea 
                    value={formData.artistBio} 
                    onChange={e => setFormData({...formData, artistBio: e.target.value})} 
                    placeholder="Описание творческого пути, анонсы и факты..." 
                    rows={3} 
                    className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl p-4 text-xs md:text-sm font-medium text-white placeholder:text-zinc-500 outline-none transition-all" 
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2.5 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.artistVerified} 
                      onChange={e => setFormData({ ...formData, artistVerified: e.target.checked })} 
                      className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-zinc-300">Подтвержденный профиль ✓</span>
                  </label>

                  <label className="flex items-center gap-2.5 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.artistTrending} 
                      onChange={e => setFormData({ ...formData, artistTrending: e.target.checked })} 
                      className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-zinc-300">Восходящая звезда 🔥</span>
                  </label>
                </div>

                <button 
                  onClick={saveArtist} 
                  className="w-full py-4 theme-bg-accent text-black font-extrabold rounded-2xl text-sm hover:opacity-90 transition-all cursor-pointer shadow-xl mt-4"
                >
                  Сохранить карточку артиста
                </button>
              </div>
            )}

            {/* --- ALBUM FORM --- */}
            {activeTab === 'album' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2">Название альбома / EP</label>
                  <input 
                    type="text" 
                    placeholder="" 
                    value={formData.albumTitle} 
                    onChange={(e) => setFormData({...formData, albumTitle: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-3 text-sm md:text-base font-bold text-white placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">Основной исполнитель</label>
                      <button
                        type="button"
                        onClick={() => setPickerTarget('albumArtist')}
                        className="text-xs theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Выбрать артиста</span>
                      </button>
                    </div>

                    {(() => {
                      const selectedAlbArtist = artists.find((a: any) => a.id === formData.albumArtistId);
                      if (selectedAlbArtist) {
                        return (
                          <div 
                            onClick={() => setPickerTarget('albumArtist')}
                            className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-2xl flex items-center justify-between transition-all cursor-pointer group shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CoverArt 
                                url={selectedAlbArtist.imageUrl} 
                                title={selectedAlbArtist.name} 
                                isArtist={true} 
                                className="w-10 h-10 rounded-full border border-white/10 shrink-0" 
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-extrabold text-sm text-white truncate">{selectedAlbArtist.name}</p>
                                </div>
                                <p className="text-[11px] text-zinc-400 truncate">{formatListeners(selectedAlbArtist.followers)}</p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 group-hover:text-white font-bold px-2.5 py-1 rounded-xl bg-white/5 border border-white/5">
                              Сменить →
                            </span>
                          </div>
                        );
                      }
                      if (formData.customAlbumArtist) {
                        return (
                          <div 
                            onClick={() => setPickerTarget('albumArtist')}
                            className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-black text-sm">
                                {formData.customAlbumArtist[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-sm text-white truncate">{formData.customAlbumArtist}</p>
                                <p className="text-[11px] text-zinc-400">Свой артист</p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 font-bold px-2.5 py-1 rounded-xl bg-white/5">Сменить →</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => setPickerTarget('albumArtist')}
                          className="w-full p-3.5 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-white/15 hover:border-white/30 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <User className="w-4 h-4 theme-accent" />
                          <span>Выбрать артиста (с аватаркой и поиском)</span>
                        </button>
                      );
                    })()}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">Приглашенный соавтор (фит)</label>
                      {formData.albumCoArtist && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, albumCoArtist: '' })}
                          className="text-[11px] text-zinc-400 hover:text-red-400 font-bold cursor-pointer"
                        >
                          Очистить
                        </button>
                      )}
                    </div>
                    {formData.albumCoArtist ? (
                      <div 
                        onClick={() => setPickerTarget('albumCoArtist')}
                        className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-2xl flex items-center justify-between transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-500/20 flex items-center justify-center text-purple-200 font-black text-sm shrink-0">
                            {formData.albumCoArtist[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-white truncate">{formData.albumCoArtist}</p>
                            <p className="text-[11px] text-zinc-400">Соавтор альбома</p>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-white font-bold px-2.5 py-1 rounded-xl bg-white/5 border border-white/5">
                          Сменить →
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPickerTarget('albumCoArtist')}
                        className="w-full p-3.5 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-white/15 hover:border-white/30 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 theme-accent" />
                        <span>Выбрать соавтора / указать имя</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">Жанр альбома</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_CATALOG.map(g => {
                      const isSelected = formData.albumGenre === g.name;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, albumGenre: isSelected ? '' : g.name })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'theme-bg-accent text-black shadow-md' 
                              : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Год выпуска</label>
                    <input 
                      type="number" 
                      value={formData.albumYear} 
                      onChange={e => setFormData({ ...formData, albumYear: e.target.value })} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Дата выпуска (ДД.ММ.ГГГГ)</label>
                    <input 
                      type="text" 
                      placeholder="24.10.2026" 
                      value={formData.albumDate} 
                      onChange={e => setFormData({ ...formData, albumDate: e.target.value })} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Пик в чарте (#)</label>
                    <input 
                      type="text" 
                      placeholder="1" 
                      value={formData.albumPeakChart} 
                      onChange={e => {
                        const num = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, albumPeakChart: num });
                      }} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Rating 90-Point Card for New Album */}
                <RatingInputCard 
                  rating={formData.albumRating} 
                  onChange={r => setFormData({ ...formData, albumRating: r })} 
                  title="Оценка альбома (90-балльная система)" 
                />

                {/* Total Album Plays Summary Card */}
                <div className="bg-zinc-900/80 p-5 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Общие прослушивания альбома (Автосумма)</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-white tabular-nums tracking-tight mt-1">
                      {totalCalculatedAlbumPlays.toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 font-semibold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    {selectedExistingTrackIds.length + inlineTracks.length} треков в альбоме
                  </span>
                </div>

                {/* Section: Select Existing Tracks by Chosen Artist */}
                {formData.albumArtistId && availableArtistTracks.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Существующие треки артиста в релиз
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {selectedExistingTrackIds.length > 0 
                            ? `Выбрано: ${selectedExistingTrackIds.length} из ${availableArtistTracks.length} треков` 
                            : 'Включите готовые треки артиста в альбом'}
                        </p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsSelectExistingModalOpen(true)}
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-white/10 shrink-0"
                      >
                        <ListMusic className="w-4 h-4 theme-accent" />
                        <span>Выбрать треки ({selectedExistingTrackIds.length})</span>
                      </button>
                    </div>

                    {selectedExistingTrackIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto custom-scrollbar p-1">
                        {selectedExistingTrackIds.map(id => {
                          const tr = availableArtistTracks.find((t: any) => t.id === id);
                          if (!tr) return null;
                          return (
                            <span 
                              key={id} 
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/90 border border-white/10 text-xs font-semibold text-white shadow-sm"
                            >
                              <span className="truncate max-w-[170px]">{tr.title}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">({tr.duration})</span>
                              <button 
                                type="button"
                                onClick={() => setSelectedExistingTrackIds(selectedExistingTrackIds.filter(x => x !== id))}
                                className="text-zinc-400 hover:text-red-400 transition-colors cursor-pointer ml-0.5"
                                title="Исключить трек"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Modal for selecting existing tracks */}
                {isSelectExistingModalOpen && (
                  <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsSelectExistingModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] z-10 animate-in">
                      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/30">
                        <div>
                          <h3 className="text-xl font-bold text-white">Выбор существующих треков</h3>
                          <p className="text-xs text-zinc-400 mt-1">Отметьте треки исполнителя для добавления в альбом</p>
                        </div>
                        <button onClick={() => setIsSelectExistingModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer">
                          <X className="w-5 h-5 text-zinc-300" />
                        </button>
                      </div>

                      <div className="p-4 border-b border-white/10 flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input 
                            type="text" 
                            placeholder="Поиск по названию трека..." 
                            value={existingSearchFilter}
                            onChange={e => setExistingSearchFilter(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            if (selectedExistingTrackIds.length === availableArtistTracks.length) {
                              setSelectedExistingTrackIds([]);
                            } else {
                              setSelectedExistingTrackIds(availableArtistTracks.map((t: any) => t.id));
                            }
                          }}
                          className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                          {selectedExistingTrackIds.length === availableArtistTracks.length ? 'Снять все' : 'Выбрать все'}
                        </button>
                      </div>

                      <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1 max-h-[50vh]">
                        {availableArtistTracks
                          .filter((t: any) => t.title.toLowerCase().includes(existingSearchFilter.toLowerCase()))
                          .map((tr: any) => {
                            const isSelected = selectedExistingTrackIds.includes(tr.id);
                            return (
                              <div 
                                key={tr.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedExistingTrackIds(selectedExistingTrackIds.filter(id => id !== tr.id));
                                  } else {
                                    setSelectedExistingTrackIds([...selectedExistingTrackIds, tr.id]);
                                  }
                                }}
                                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected ? 'bg-zinc-800/90 border-white/30 text-white shadow-md' : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-zinc-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={() => {}} 
                                    className="w-4 h-4 rounded pointer-events-none accent-[var(--accent-color)]" 
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate text-white">{tr.title}</p>
                                    <p className="text-[11px] text-zinc-500">{tr.albumTitle || 'Single'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                                  <span className="text-zinc-400 tabular-nums">{tr.plays.toLocaleString('ru-RU')} просл.</span>
                                  <span className="text-zinc-500">{tr.duration}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400">
                          Выбрано: <strong className="text-white">{selectedExistingTrackIds.length}</strong>
                        </span>
                        <button 
                          type="button"
                          onClick={() => setIsSelectExistingModalOpen(false)}
                          className="px-6 py-2.5 theme-bg-accent text-black font-bold text-xs md:text-sm rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg"
                        >
                          Готово
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section: Quick Add Inline Tracks */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Быстро добавить новые треки в альбом</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Комфортный интерфейс добавления композиций</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {inlineTracks.length > 0 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = inlineTracks.map(t => ({
                              ...t,
                              plays: getRandomPlays()
                            }));
                            setInlineTracks(updated);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all text-emerald-400 cursor-pointer shadow-md border border-white/10"
                          title="Сгенерировать прослушивания (200к - 15млн) для всех треков"
                        >
                          <Dices className="w-4 h-4" />
                          <span>Рандом прослушиваний</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setParserTargetMode('form_album');
                          setIsParserOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                        title="Вставить список треков из текста с авто-распознаванием фитов и длительности"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Вставить текстом</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setInlineTracks([...inlineTracks, { 
                            title: '', 
                            duration: getRandomDuration(), 
                            explicit: false, 
                            plays: getRandomPlays(), 
                            featuredArtist: '', 
                            peakChart: '' 
                          }]);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 theme-bg-accent text-black rounded-xl text-xs font-bold transition-all hover:opacity-90 cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Добавить трек</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {inlineTracks.map((t, idx) => {
                      return (
                        <div key={idx} className="bg-zinc-900/80 p-5 rounded-2xl border border-white/10 space-y-4 shadow-md transition-all hover:border-white/20">
                          <div className="flex items-center gap-3">
                            <input 
                              placeholder="Название трека" 
                              value={t.title} 
                              onChange={e => {
                                const newTracks = [...inlineTracks];
                                newTracks[idx].title = e.target.value;
                                setInlineTracks(newTracks);
                              }}
                              className="flex-1 bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-4 py-2.5 text-sm md:text-base font-bold text-white placeholder:text-zinc-500 outline-none transition-all"
                            />
                            <button 
                              type="button"
                              onClick={() => setInlineTracks(inlineTracks.filter((_, i) => i !== idx))} 
                              className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                              title="Удалить трек"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Длительность</label>
                              <input 
                                placeholder="3:20" 
                                value={t.duration} 
                                onChange={e => {
                                  const newTracks = [...inlineTracks];
                                  newTracks[idx].duration = e.target.value;
                                  setInlineTracks(newTracks);
                                }}
                                className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none font-mono"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Прослушивания</label>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newTracks = [...inlineTracks];
                                    newTracks[idx].plays = getRandomPlays();
                                    setInlineTracks(newTracks);
                                  }}
                                  className="text-[10px] theme-accent font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                                  title="Рандом 200к - 15млн"
                                >
                                  <Dices className="w-3 h-3" /> 🎲
                                </button>
                              </div>
                              <input 
                                placeholder="500 000" 
                                value={t.plays} 
                                onChange={e => {
                                  const num = e.target.value.replace(/\D/g, '');
                                  const newTracks = [...inlineTracks];
                                  newTracks[idx].plays = formatNumber(parseInt(num) || 0);
                                  setInlineTracks(newTracks);
                                }}
                                className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Фит (feat. ...)</label>
                              <input 
                                placeholder="Имя артиста" 
                                value={t.featuredArtist} 
                                onChange={e => {
                                  const newTracks = [...inlineTracks];
                                  newTracks[idx].featuredArtist = e.target.value;
                                  setInlineTracks(newTracks);
                                }}
                                className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Пик в чарте (#)</label>
                              <input 
                                placeholder="1" 
                                value={t.peakChart} 
                                onChange={e => {
                                  const newTracks = [...inlineTracks];
                                  newTracks[idx].peakChart = e.target.value;
                                  setInlineTracks(newTracks);
                                }}
                                className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <label className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={t.explicit} 
                                onChange={e => {
                                  const newTracks = [...inlineTracks];
                                  newTracks[idx].explicit = e.target.checked;
                                  setInlineTracks(newTracks);
                                }}
                                className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                              />
                              <span className="text-xs font-bold text-zinc-300">Explicit [E]</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={saveAlbum} 
                  disabled={isDeployingAlbum}
                  className={`w-full py-4 font-extrabold rounded-2xl text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDeployingAlbum 
                      ? 'theme-bg-accent text-black' 
                      : 'bg-white hover:bg-zinc-200 text-black active:scale-98'
                  }`}
                >
                  {isDeployingAlbum ? (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>Релиз опубликован!</span>
                    </>
                  ) : (
                    <span>Опубликовать релиз альбома</span>
                  )}
                </button>
              </div>
            )}

            {/* --- TRACK FORM --- */}
            {activeTab === 'track' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2">Название трека</label>
                  <input 
                    type="text" 
                    placeholder="" 
                    value={formData.trackTitle} 
                    onChange={(e) => setFormData({...formData, trackTitle: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-3 text-sm md:text-base font-bold text-white placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Artist Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">Основной исполнитель</label>
                      <button
                        type="button"
                        onClick={() => setPickerTarget('trackArtist')}
                        className="text-xs theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Выбрать артиста</span>
                      </button>
                    </div>

                    {(() => {
                      const selectedTrkArtist = artists.find((a: any) => a.id === formData.trackArtistId);
                      if (selectedTrkArtist) {
                        return (
                          <div 
                            onClick={() => setPickerTarget('trackArtist')}
                            className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-2xl flex items-center justify-between transition-all cursor-pointer group shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CoverArt 
                                url={selectedTrkArtist.imageUrl} 
                                title={selectedTrkArtist.name} 
                                isArtist={true} 
                                className="w-10 h-10 rounded-full border border-white/10 shrink-0" 
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-extrabold text-sm text-white truncate">{selectedTrkArtist.name}</p>
                                </div>
                                <p className="text-[11px] text-zinc-400 truncate">{formatListeners(selectedTrkArtist.followers)}</p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 group-hover:text-white font-bold px-2.5 py-1 rounded-xl bg-white/5 border border-white/5">
                              Сменить →
                            </span>
                          </div>
                        );
                      }
                      if (formData.customTrackArtist) {
                        return (
                          <div 
                            onClick={() => setPickerTarget('trackArtist')}
                            className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-black text-sm shrink-0">
                                {formData.customTrackArtist[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-sm text-white truncate">{formData.customTrackArtist}</p>
                                <p className="text-[11px] text-zinc-400">Свой артист</p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 font-bold px-2.5 py-1 rounded-xl bg-white/5">Сменить →</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => setPickerTarget('trackArtist')}
                          className="w-full p-3.5 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-white/15 hover:border-white/30 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <User className="w-4 h-4 theme-accent" />
                          <span>Выбрать артиста (с аватаркой и поиском)</span>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Album Selection with automatic cover art sync */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Альбом</label>
                    <select 
                      value={formData.trackAlbumId} 
                      onChange={e => {
                        const alb = albums.find((a: any) => a.id === e.target.value);
                        setFormData({
                          ...formData, 
                          trackAlbumId: e.target.value,
                          trackImg: alb?.coverUrl || formData.trackImg
                        });
                      }} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-bold text-xs md:text-sm text-white outline-none cursor-pointer"
                    >
                      <option value="single">Сингл (Без альбома)</option>
                      {albums
                        .filter((a: any) => !formData.trackArtistId || a.artistId === formData.trackArtistId || (formData.customTrackArtist && a.artistName?.toLowerCase() === formData.customTrackArtist.toLowerCase()))
                        .map((a: any) => (
                          <option key={a.id} value={a.id}>{a.title} ({a.artistName})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Featured Artist / Fit Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">Приглашенный артист (Фит)</label>
                      {formData.trackFit && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, trackFit: '' })}
                          className="text-[11px] text-zinc-400 hover:text-red-400 font-bold cursor-pointer"
                        >
                          Очистить
                        </button>
                      )}
                    </div>
                    {formData.trackFit ? (
                      <div 
                        onClick={() => setPickerTarget('trackFeat')}
                        className="p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-2xl flex items-center justify-between transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {(() => {
                            const featArt = artists.find((a: any) => a.name.toLowerCase() === formData.trackFit.toLowerCase());
                            if (featArt?.imageUrl) {
                              return <CoverArt url={featArt.imageUrl} title={featArt.name} isArtist={true} className="w-10 h-10 rounded-full border border-white/10 shrink-0" />;
                            }
                            return (
                              <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-500/20 flex items-center justify-center text-purple-200 font-black text-sm shrink-0">
                                {formData.trackFit[0]?.toUpperCase()}
                              </div>
                            );
                          })()}
                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-white truncate">{formData.trackFit}</p>
                            <p className="text-[11px] text-zinc-400">Приглашенный артист</p>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-white font-bold px-2.5 py-1 rounded-xl bg-white/5 border border-white/5">
                          Сменить →
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPickerTarget('trackFeat')}
                        className="w-full p-3.5 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-white/15 hover:border-white/30 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 theme-accent" />
                        <span>Выбрать артиста на фит / указать имя</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">Прослушивания</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFormData({ ...formData, trackPlays: getRandomPlays() });
                        }} 
                        className="text-[11px] theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Dices className="w-3.5 h-3.5" /> 200к-15М
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={formData.trackPlays} 
                      onChange={e => {
                        const num = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, trackPlays: formatNumber(parseInt(num) || 0) });
                      }} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Genre selection chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">Жанр трека</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_CATALOG.map(g => {
                      const isSelected = formData.trackGenre === g.name;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, trackGenre: isSelected ? '' : g.name })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'theme-bg-accent text-black shadow-md' 
                              : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Длительность</label>
                    <input 
                      type="text" 
                      value={formData.trackDuration} 
                      onChange={e => setFormData({ ...formData, trackDuration: formatDurationInput(e.target.value) })} 
                      onKeyDown={e => handleDurationKeyDown(e, formData.trackDuration, v => setFormData({ ...formData, trackDuration: v }))}
                      placeholder="3:20"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Дата релиза (ДД.ММ.ГГГГ)</label>
                    <input 
                      type="text" 
                      placeholder="24.10.2026" 
                      value={formData.trackDate} 
                      onChange={e => setFormData({ ...formData, trackDate: formatDateInput(e.target.value) })} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Пик в чарте (#)</label>
                    <input 
                      type="text" 
                      placeholder="1" 
                      value={formData.trackPeakChart} 
                      onChange={e => {
                        const num = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, trackPeakChart: num });
                      }} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Rating 90-Point Card for New Track */}
                <RatingInputCard 
                  rating={formData.trackRating} 
                  onChange={r => setFormData({ ...formData, trackRating: r })} 
                  title="Оценка трека (90-балльная система)" 
                />

                <div className="flex items-center gap-3 p-3.5 bg-black/30 border border-white/10 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="track-explicit" 
                    checked={formData.trackExplicit} 
                    onChange={e => setFormData({ ...formData, trackExplicit: e.target.checked })} 
                    className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                  />
                  <label htmlFor="track-explicit" className="text-xs font-bold text-zinc-300 cursor-pointer">
                    Explicit Content [E] (Ненормативная лексика)
                  </label>
                </div>

                <button 
                  onClick={saveTrack} 
                  disabled={isBroadcasting}
                  className={`w-full py-4 font-extrabold rounded-2xl text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isBroadcasting 
                      ? 'theme-bg-accent text-black' 
                      : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
                >
                  {isBroadcasting ? (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>Трек опубликован!</span>
                    </>
                  ) : (
                    <span>Опубликовать трек</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Artwork preview card */}
        {activeTab !== 'manage' && activeTab !== 'database' && activeTab !== 'batch_builder' && activeTab !== 'timeline' && (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full aspect-square bg-zinc-900 border-2 border-dashed border-white/15 hover:border-white/30 rounded-3xl overflow-hidden relative cursor-pointer group shadow-2xl flex flex-col items-center justify-center transition-all"
            >
              {(activeTab === 'artist' ? formData.artistImg : (activeTab === 'album' ? formData.albumImg : formData.trackImg)) ? (
              <CoverArt 
                url={activeTab === 'artist' ? formData.artistImg : (activeTab === 'album' ? formData.albumImg : formData.trackImg)} 
                title={activeTab === 'artist' ? formData.artistName : (activeTab === 'album' ? formData.albumTitle : formData.trackTitle)}
                isArtist={activeTab === 'artist'}
                className="w-full h-full"
                innerClassName="group-hover:scale-105 transition-transform"
              />
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <ImageIcon className="w-10 h-10 text-zinc-500 mb-1" />
                  <span className="text-xs font-bold text-white">{activeTab === 'artist' ? 'Загрузить фото' : 'Загрузить обложку'}</span>
                  <span className="text-[11px] text-zinc-500">Нажмите для выбора фото или изображения</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                {activeTab === 'artist' ? 'Изменить фото' : 'Изменить обложку'}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={async (e) => { 
                const f = e.target.files?.[0]; 
                if (f) { 
                  const b = await fileToBase64(f); 
                  const type = activeTab === 'artist' ? 'artist' : (activeTab === 'album' ? 'album' : 'track');
                  const mediaId = await saveMediaItem(b, {
                    type,
                    title: type === 'album' ? formData.albumTitle : (type === 'track' ? formData.trackTitle : undefined),
                    artistName: type === 'artist' ? formData.artistName : (type === 'album' ? (formData.customAlbumArtist || artists.find((a: any) => a.id === formData.albumArtistId)?.name) : formData.customTrackArtist)
                  });
                  setFormData({...formData, [activeTab === 'artist' ? 'artistImg' : (activeTab === 'album' ? 'albumImg' : 'trackImg')]: mediaId}); 
                } 
              }} 
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{activeTab === 'artist' ? 'Загрузить фото' : 'Загрузить обложку'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCoverEditorTarget('studio')}
                title="Создать обложку в редакторе"
                className="w-10 h-10 shrink-0 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            {(activeTab === 'artist' ? formData.artistImg : (activeTab === 'album' ? formData.albumImg : formData.trackImg)) && (
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    [activeTab === 'artist' ? 'artistImg' : activeTab === 'album' ? 'albumImg' : 'trackImg']: ''
                  })
                }
                className="w-full text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer text-center"
              >
                × Удалить обложку (вернуть сгенерированную)
              </button>
            )}
            <button 
              onClick={fillRealisticStats} 
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Dices className="w-4 h-4 theme-accent" />
              <span>Заполнить реалистичные метрики</span>
            </button>
          </div>
        )}

        {/* Interactive Artist Picker Modal */}
        {pickerTarget && (
          <ArtistPickerModal 
            isOpen={Boolean(pickerTarget)}
            onClose={() => setPickerTarget(null)}
            artists={artists}
            selectedArtistId={pickerTarget === 'albumArtist' ? formData.albumArtistId : (pickerTarget === 'trackArtist' ? formData.trackArtistId : undefined)}
            selectedArtistName={
              pickerTarget === 'albumArtist' ? formData.customAlbumArtist :
              pickerTarget === 'albumCoArtist' ? formData.albumCoArtist :
              pickerTarget === 'trackArtist' ? formData.customTrackArtist :
              pickerTarget === 'trackFeat' ? formData.trackFit : undefined
            }
            onSelectArtist={(picked) => {
              if (pickerTarget === 'albumArtist') {
                if (picked.id.startsWith('custom_')) {
                  setFormData({ ...formData, albumArtistId: '', customAlbumArtist: picked.name });
                } else {
                  setFormData({ ...formData, albumArtistId: picked.id, customAlbumArtist: '' });
                }
              } else if (pickerTarget === 'albumCoArtist') {
                const list = parseFeaturedNames(formData.albumCoArtist);
                const next = list.includes(picked.name) ? formData.albumCoArtist : (formData.albumCoArtist ? `${formData.albumCoArtist}, ${picked.name}` : picked.name);
                setFormData({ ...formData, albumCoArtist: next });
              } else if (pickerTarget === 'trackArtist') {
                if (picked.id.startsWith('custom_')) {
                  setFormData({ ...formData, trackArtistId: '', customTrackArtist: picked.name });
                } else {
                  setFormData({ ...formData, trackArtistId: picked.id, customTrackArtist: '' });
                }
              } else if (pickerTarget === 'trackFeat') {
                const list = parseFeaturedNames(formData.trackFit);
                const next = list.includes(picked.name) ? formData.trackFit : (formData.trackFit ? `${formData.trackFit}, ${picked.name}` : picked.name);
                setFormData({ ...formData, trackFit: next });
              } else if (pickerTarget === 'batchFit') {
                setBatchFit(prev => {
                  const list = parseFeaturedNames(prev);
                  return list.includes(picked.name) ? prev : (prev ? `${prev}, ${picked.name}` : picked.name);
                });
              } else if (pickerTarget === 'batchCoArtist') {
                setBatchCoArtist(prev => {
                  const list = parseFeaturedNames(prev);
                  return list.includes(picked.name) ? prev : (prev ? `${prev}, ${picked.name}` : picked.name);
                });
              } else if (pickerTarget === 'childTrackFit') {
                setChildTrackFit(prev => {
                  const list = parseFeaturedNames(prev);
                  return list.includes(picked.name) ? prev : (prev ? `${prev}, ${picked.name}` : picked.name);
                });
              }
            }}
            title={
              pickerTarget === 'albumArtist' ? 'Основной исполнитель альбома' :
              pickerTarget === 'albumCoArtist' ? 'Приглашенный соавтор альбома' :
              pickerTarget === 'trackArtist' ? 'Основной исполнитель трека' :
              pickerTarget === 'batchCoArtist' ? 'Соавтор альбома' :
              'Приглашенный артист на фит'
            }
          />
        )}

        <CoverEditorModal
          isOpen={Boolean(coverEditorTarget)}
          onClose={() => setCoverEditorTarget(null)}
          initialTitle={
            coverEditorTarget === 'batch'
              ? (batchItemType === 'album' ? formData.albumTitle : formData.trackTitle)
              : activeTab === 'artist'
                ? formData.artistName
                : activeTab === 'album'
                  ? formData.albumTitle
                  : formData.trackTitle
          }
          initialArtist={
            coverEditorTarget === 'batch'
              ? (batchItemType === 'album'
                  ? (artists.find((a: any) => a.id === formData.albumArtistId)?.name || formData.customAlbumArtist || '')
                  : (artists.find((a: any) => a.id === formData.trackArtistId)?.name || formData.customTrackArtist || ''))
              : activeTab === 'artist'
                ? formData.artistGenre
                : activeTab === 'album'
                  ? (artists.find((a: any) => a.id === formData.albumArtistId)?.name || formData.customAlbumArtist || '')
                  : (artists.find((a: any) => a.id === formData.trackArtistId)?.name || formData.customTrackArtist || '')
          }
          onApplyDataUrl={async (dataUrl) => {
            if (coverEditorTarget === 'batch') {
              const mediaId = await saveMediaItem(dataUrl, {
                type: batchItemType === 'album' ? 'album' : 'track',
                title: batchItemType === 'album' ? formData.albumTitle : formData.trackTitle
              });
              setBatchCoverUrl(mediaId);
            } else {
              const type = activeTab === 'artist' ? 'artist' : (activeTab === 'album' ? 'album' : 'track');
              const artistName = type === 'artist'
                ? formData.artistName
                : type === 'album'
                  ? (formData.customAlbumArtist || artists.find((a: any) => a.id === formData.albumArtistId)?.name)
                  : (formData.customTrackArtist || artists.find((a: any) => a.id === formData.trackArtistId)?.name);
              const mediaId = await saveMediaItem(dataUrl, {
                type,
                title: type === 'album' ? formData.albumTitle : (type === 'track' ? formData.trackTitle : undefined),
                artistName
              });
              setFormData((prev: any) => ({
                ...prev,
                [activeTab === 'artist' ? 'artistImg' : (activeTab === 'album' ? 'albumImg' : 'trackImg')]: mediaId
              }));
            }
          }}
        />

        {/* Expanded Draft Batch Modal */}
        {isDraftBatchExpanded && (
          <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl p-4 md:p-8 flex flex-col overflow-y-auto animate-in">
            <div className="max-w-6xl w-full mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-black text-white">📦 Расписание и Черновик Батча</h2>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                      {draftBatch.length} релизов
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-400 mt-1">
                    {batchDistMode === 'multi_week' ? `Авто-распределение на ${batchDistWeeks} нед. по пятницам` : 'Однодневный дроп'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={publishWholeBatch}
                    disabled={draftBatch.length === 0}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-2xl shadow-xl transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 fill-black" />
                    <span>🚀 Выложить весь батч ({draftBatch.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDraftBatchExpanded(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-5 h-5" />
                    <span>Закрыть</span>
                  </button>
                </div>
              </div>

              {/* Overview Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-900/80 border border-white/10 rounded-2xl">
                  <p className="text-xs text-zinc-400 font-bold">Всего релизов</p>
                  <p className="text-2xl font-black text-white mt-1">{draftBatch.length}</p>
                </div>
                <div className="p-4 bg-zinc-900/80 border border-white/10 rounded-2xl">
                  <p className="text-xs text-zinc-400 font-bold">Всего треков</p>
                  <p className="text-2xl font-black text-amber-300 mt-1">
                    {draftBatch.reduce((sum, item) => sum + (item.itemType === 'album' ? (item.albumTracks?.length || 1) : 1), 0)}
                  </p>
                </div>
                <div className="p-4 bg-zinc-900/80 border border-white/10 rounded-2xl">
                  <p className="text-xs text-zinc-400 font-bold">Прослушивания (оценка)</p>
                  <p className="text-2xl font-black theme-accent mt-1">
                    {draftBatch.reduce((sum, item) => sum + (item.plays || 0), 0).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="p-4 bg-zinc-900/80 border border-white/10 rounded-2xl">
                  <p className="text-xs text-zinc-400 font-bold">Период дропов</p>
                  <p className="text-xl font-black text-sky-300 mt-1">
                    {batchDistMode === 'multi_week' ? `${batchDistWeeks} нед. (Пятницы)` : batchTargetDate}
                  </p>
                </div>
              </div>

              {/* Grid of Scheduled Releases */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {draftBatch.map((item, idx) => {
                  let itemDate = batchTargetDate;
                  if (batchDistMode === 'multi_week' && draftBatch.length > 0) {
                    const startDate = new Date(batchTargetDate);
                    const pseudoRnd = ((idx * 7) + 3) % 10 / 10;
                    const weekIndex = Math.min(batchDistWeeks - 1, Math.floor((idx / draftBatch.length) * batchDistWeeks + (pseudoRnd > 0.7 ? 1 : 0)));
                    const target = new Date(startDate);
                    target.setDate(startDate.getDate() + (weekIndex * 7));
                    const yyyy = target.getFullYear();
                    const mm = String(target.getMonth() + 1).padStart(2, '0');
                    const dd = String(target.getDate()).padStart(2, '0');
                    itemDate = `${yyyy}-${mm}-${dd}`;
                  }

                  return (
                    <div key={item.id} className="p-5 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl space-y-4 hover:border-white/20 transition-all group relative flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <CoverArt url={item.coverUrl} title={item.title} className="w-16 h-16 rounded-2xl shrink-0 bg-zinc-800 shadow-lg" />
                            <div className="min-w-0">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                item.itemType === 'album' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : (item.itemType === 'snippet' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30')
                              }`}>
                                {item.itemType === 'album' ? '💿 АЛЬБОМ' : (item.itemType === 'snippet' ? '🎬 СНИППЕТ' : '🎵 ТРЕК')}
                              </span>
                              <h4 className="font-extrabold text-base text-white truncate mt-1">{item.title}</h4>
                              <p className="text-xs text-zinc-400 truncate">{item.artistName} {item.featuredArtist ? `feat. ${item.featuredArtist}` : ''}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDraftBatch(draftBatch.filter(x => x.id !== item.id))}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                            title="Удалить из черновика"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-300">
                          <span>📅 {itemDate}</span>
                          {(item.promoStrategy || typeof item.releaseHype === 'number') && (
                            <span className="text-[11px] font-sans font-semibold text-amber-300">
                              {item.promoStrategy && RELEASE_PROMO_LABELS[item.promoStrategy] ? RELEASE_PROMO_LABELS[item.promoStrategy].shortLabel : 'Хайп'}
                              {typeof item.releaseHype === 'number' ? ` · ${item.releaseHype}/99` : ''}
                            </span>
                          )}
                          <span className="theme-accent font-bold">{item.plays.toLocaleString('ru-RU')} просл.</span>
                        </div>
                      </div>

                      {/* Album Specific Entry Button */}
                      {item.itemType === 'album' && (
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                            <span>💿 {item.albumTracks?.length || 0} треков в составе</span>
                            <span>{calcTotalDuration((item.albumTracks || []) as any)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewDraftAlbumItem(item)}
                            className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Disc className="w-4 h-4" />
                            <span>Войти в альбом и просмотр треклиста →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Album Draft Detail Preview Modal */}
        {previewDraftAlbumItem && (
          <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-3xl p-4 md:p-8 flex items-center justify-center animate-in">
            <div className="max-w-3xl w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar relative">
              {/* Background Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-amber-500/10 blur-[90px] pointer-events-none"></div>

              {/* Header with Large Album Artwork */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-white/10 relative z-10">
                <CoverArt 
                  url={previewDraftAlbumItem.coverUrl} 
                  title={previewDraftAlbumItem.title} 
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl shrink-0 bg-zinc-800 shadow-2xl border border-white/10" 
                />
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                    <Disc className="w-3.5 h-3.5" /> Альбом в черновике
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{previewDraftAlbumItem.title}</h2>
                  <p className="text-sm font-extrabold text-zinc-300">
                    {previewDraftAlbumItem.artistName} {previewDraftAlbumItem.featuredArtist ? `feat. ${previewDraftAlbumItem.featuredArtist}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2 text-xs font-mono text-zinc-400">
                    <span className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-white font-bold">
                      💿 {previewDraftAlbumItem.albumTracks?.length || 0} треков
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 theme-accent font-extrabold">
                      {((previewDraftAlbumItem.albumTracks || []).reduce((s: number, t: any) => s + (t.plays || 0), 0) || previewDraftAlbumItem.plays).toLocaleString('ru-RU')} просл.
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-zinc-300">
                      ⏱ {calcTotalDuration((previewDraftAlbumItem.albumTracks || []) as any)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setPreviewDraftAlbumItem(null)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-zinc-400 hover:text-white cursor-pointer absolute top-0 right-0 sm:relative">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tracklist Table */}
              <div className="space-y-4 relative z-10">
                <h4 className="text-base font-black text-white flex items-center justify-between">
                  <span>Состав треков в альбоме</span>
                  <span className="text-xs text-zinc-400 font-mono">Порядок добавления</span>
                </h4>

                {(!previewDraftAlbumItem.albumTracks || previewDraftAlbumItem.albumTracks.length === 0) ? (
                  <p className="text-xs text-zinc-500 py-6 text-center border border-dashed border-white/10 rounded-2xl">
                    В этом альбоме пока нет треков.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {previewDraftAlbumItem.albumTracks.map((tr: any, idx: number) => (
                      <div key={tr.id || idx} className="p-3.5 bg-black/40 border border-white/10 hover:border-white/20 rounded-2xl flex items-center justify-between text-xs md:text-sm transition-all group">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="font-mono font-black text-zinc-500 w-5 text-center">{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-white truncate">{tr.title}</p>
                            {tr.featuredArtist && <p className="text-xs text-zinc-400 truncate">feat. {tr.featuredArtist}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-xs shrink-0">
                          <span className="theme-accent font-extrabold">{tr.plays.toLocaleString('ru-RU')} просл.</span>
                          <span className="text-zinc-400">{tr.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPreviewDraftAlbumItem(null)}
                className="w-full py-4 theme-bg-accent text-black font-extrabold text-sm rounded-2xl shadow-xl hover:opacity-90 transition-all cursor-pointer relative z-10"
              >
                Готово / Вернуться к черновику
              </button>
            </div>
          </div>
        )}

        {/* Smart Text Tracklist Parser Modal */}
        <TextTracklistParserModal
          isOpen={isParserOpen}
          onClose={() => setIsParserOpen(false)}
          onImport={handleParserImport}
        />
      </div>
    </div>
  );
}

const InputGroup = ({ label, type = 'text', numeric, value, onChange, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-zinc-300 block">{label}</label>
    <input 
      type={type} 
      value={value} 
      placeholder={placeholder}
      onChange={e => { 
        if (numeric) { 
          const v = e.target.value.replace(/\D/g, ''); 
          onChange(formatNumber(parseInt(v) || 0)); 
        } else onChange(e.target.value); 
      }} 
      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold text-white outline-none focus:border-white/30 transition-all" 
    />
  </div>
);

const ManagementSection = ({ title, items, onDelete, icon: Icon }: any) => (
  <div className="space-y-6">
    <h3 className="text-xl md:text-4xl font-black italic uppercase leading-none">{title} <span className="theme-accent opacity-40">({items.length})</span></h3>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-scale">
      {items.map((item: any) => (
        <div key={item.id} className="theme-card p-3 md:p-5 border border-white/5 flex flex-col gap-3">
          <CoverArt 
            url={item.imageUrl || item.coverUrl} 
            title={item.name || item.title}
            className={`w-full aspect-square ${title === 'Artists' ? 'rounded-full' : 'rounded-lg'}`} 
          />
          <p className="text-[11px] md:text-sm font-black truncate uppercase italic tracking-tighter">{item.name || item.title}</p>
          <button onClick={() => onDelete(item.id)} className="w-full py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5 mx-auto" /></button>
        </div>
      ))}
    </div>
  </div>
);

function TrackPage({ 
  id, 
  tracks, 
  albums, 
  artists, 
  navigateTo, 
  toggleLikeTrack,
  onPlayTrack,
  openLightbox,
  currentTrackId,
  isPlaying,
  onMoreOptionsClick,
  onRateClick
}: any) {
  const track = tracks.find((t: any) => t.id === id);
  if (!track) return <div className="p-20 text-center text-xl font-bold opacity-30">ТРЕК НЕ НАЙДЕН</div>;
  const artist = artists.find((a: any) => a.id === track.artistId);
  const album = albums.find((a: any) => a.id === track.albumId);
  
  // Other tracks from the same album if not a single
  const albumOtherTracks = (album && track.albumId !== 'single') 
    ? tracks.filter((t: any) => t.albumId === album.id) 
    : [];

  // Recommendations: other tracks by the same artist or other popular tracks
  const artistOtherTracks = tracks.filter((t: any) => t.artistId === track.artistId && t.id !== track.id);
  const recommendedTracks = artistOtherTracks.length > 0 
    ? artistOtherTracks.slice(0, 5) 
    : tracks.filter((t: any) => t.id !== track.id).slice(0, 5);

  const isCurrentPlaying = isPlaying && currentTrackId === track.id;

  return (
    <div className="min-h-full pb-24 relative isolate">
      <ReleaseStage kind="track" id={track.id} cover={track.coverUrl} title={track.title} artistName={track.artistName} genre={track.genre || album?.genre} releaseDate={track.releaseDate || album?.releaseDate} plays={track.plays} />
      {/* Top Banner (Spotify style with rich gradient & larger cover) */}
      <div className="bg-gradient-to-b from-emerald-950/35 via-zinc-900/65 to-[var(--bg-color)] backdrop-blur-xl px-6 md:px-8 pt-8 pb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 max-w-7xl mx-auto relative z-10">
          {/* Larger Square Cover with Clickable Lightbox */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-shrink-0"
          >
            <CoverArt 
              url={track.coverUrl} 
              title={track.title}
              className="w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-zinc-800 overflow-hidden border border-white/15 relative cursor-pointer"
              innerClassName="group-hover:scale-105"
              showZoomIcon={true}
              onZoom={() => openLightbox && openLightbox({ url: track.coverUrl, title: track.title, subtitle: track.artistName, type: 'Трек' })}
            />
          </motion.div>

          {/* Track Meta */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 flex-1">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">
              {track.albumId === 'single' ? 'Сингл' : 'Трек'}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-3 leading-tight break-words">
              {track.title}
            </h1>
            
            {track.rating && (
              <div className="mb-4">
                <RatingScoreBadge rating={track.rating} size="lg" />
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs md:text-sm text-zinc-300">
              <div className="flex items-center -space-x-2">
                <div 
                  onClick={() => navigateTo('artist', { id: track.artistId })}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-zinc-900 cursor-pointer hover:scale-110 transition-transform z-20 shadow-lg"
                >
                  <CoverArt 
                    url={artist?.imageUrl} 
                    title={artist?.name} 
                    isArtist={true} 
                    className="w-full h-full" 
                  />
                </div>
                {track.featuredArtist && track.featuredArtist.split(',').map((name: string, i: number) => {
                  const featArt = artists.find((a: any) => a.name.toLowerCase() === name.trim().toLowerCase());
                  return (
                    <div 
                      key={i}
                      onClick={() => navigateTo('artist', { id: featArt?.id || `guest_${name.trim()}`, artistName: name.trim() })}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-zinc-900 cursor-pointer hover:scale-110 transition-transform shadow-lg"
                      style={{ zIndex: 10 - i }}
                    >
                      <CoverArt 
                        url={featArt?.imageUrl} 
                        title={name.trim()} 
                        isArtist={true} 
                        className="w-full h-full" 
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-1.5 ml-1">
                <span 
                  onClick={() => navigateTo('artist', { id: track.artistId })}
                  className="font-bold text-white hover:underline cursor-pointer"
                >
                  {track.artistName}
                </span>
                {track.featuredArtist && (
                  <FeaturedArtistsLinks 
                    featuredArtist={track.featuredArtist} 
                    artists={artists} 
                    navigateTo={navigateTo} 
                    className="text-zinc-300 font-medium"
                  />
                )}
              </div>
              
              {track.albumTitle && (
                <>
                  <span className="text-zinc-500">•</span>
                  <span 
                    onClick={() => track.albumId !== 'single' && navigateTo('album', { id: track.albumId })}
                    className={`font-semibold hover:underline ${track.albumId !== 'single' ? 'text-zinc-200 cursor-pointer' : 'text-zinc-400'}`}
                  >
                    {track.albumTitle}
                  </span>
                </>
              )}

              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{formatDateDisplay(track.releaseDate) || '01-01-2026'}</span>

              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{track.duration}</span>

              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 font-medium tabular-nums">{track.plays.toLocaleString('ru-RU')} прослушиваний</span>

              {track.peakChartPosition && (
                <>
                  <span className="text-zinc-500">•</span>
                  <span className="text-[#1ed760] font-bold">Пик в чарте: #{track.peakChartPosition}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Actions Bar */}
        <div className="flex items-center gap-6 py-6 border-b border-white/5 mb-8">
          <button 
            onClick={() => onPlayTrack && onPlayTrack(track)}
            className="w-14 h-14 rounded-full theme-bg-accent hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center cursor-pointer group"
            title={isCurrentPlaying ? "Пауза" : "Воспроизвести"}
          >
            {isCurrentPlaying ? (
              <Pause className="w-6 h-6 text-black fill-black" />
            ) : (
              <Play className="text-black fill-black ml-1 w-6 h-6" />
            )}
          </button>
          
          <button 
            onClick={() => toggleLikeTrack && toggleLikeTrack(track.id)}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
            title="Добавить в любимое"
          >
            <Heart className={`w-6 h-6 ${track.isLiked ? 'theme-accent fill-current' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onRateClick && onRateClick(track)} className="h-9 inline-flex items-center gap-2 px-3.5 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95" title="Оценить трек по 90-балльной системе">
              <Star className="w-3.5 h-3.5" /><span>{track.rating ? 'Переоценить' : 'Оценить'}</span>
            </button>
            <TrackReviewsButton track={track} tracks={tracks} albums={albums} artists={artists} />
          </div>

          <button 
            onClick={() => onMoreOptionsClick && onMoreOptionsClick(track)} 
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
            title="Действия с треком"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Adaptive Layout: If has album/artist tracks, 2-column split. If single/isolated, spacious 2-card grid */}
        {((album && track.albumId !== 'single' && albumOtherTracks.length > 0) || recommendedTracks.length > 0) ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left/Main Column: Album Tracks & Artist's Popular Tracks */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-10">
              {/* If Part of an Album: Album Context Section */}
              {album && track.albumId !== 'single' && albumOtherTracks.length > 0 && (
                <section className="bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-4">
                      <CoverArt 
                        url={album.coverUrl} 
                        title={album.title}
                        className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg bg-zinc-800 cursor-pointer border border-white/10" 
                      />
                      <div>
                        <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">Из альбома</span>
                        <h3 
                          onClick={() => navigateTo('album', { id: album.id })}
                          className="text-xl font-bold text-white hover:underline cursor-pointer"
                        >
                          {album.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{album.releaseYear} • {albumOtherTracks.length} треков</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigateTo('album', { id: album.id })}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-all cursor-pointer"
                    >
                      Открыть альбом
                    </button>
                  </div>

                  {/* Tracklist from Album */}
                  <div className="space-y-1 pt-2">
                    {albumOtherTracks.map((albTrack: any, i: number) => {
                      const isThisTrack = albTrack.id === track.id;
                      return (
                        <div 
                          key={albTrack.id}
                          onClick={() => navigateTo('track', { id: albTrack.id })}
                          className={`grid grid-cols-[36px_1fr_auto] md:grid-cols-[40px_1fr_120px_60px] gap-3 items-center px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer group ${
                            isThisTrack ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            {isThisTrack ? (
                              <span className="w-2.5 h-2.5 rounded-full theme-bg-accent inline-block"></span>
                            ) : (
                              <span className="text-xs font-semibold text-zinc-400 tabular-nums">{i + 1}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isThisTrack ? 'theme-accent' : 'text-white'}`}>
                              {albTrack.title}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">{albTrack.artistName}</p>
                          </div>
                          <div className="hidden md:block text-xs text-zinc-400 font-medium tabular-nums text-right">
                            {albTrack.plays.toLocaleString('ru-RU')}
                          </div>
                          <div className="text-xs text-zinc-400 text-right tabular-nums font-mono">
                            {albTrack.duration}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Popular Tracks from Artist */}
              {recommendedTracks.length > 0 && (
                <section>
                  <div className="mb-4">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      Больше треков от {track.artistName}
                    </h3>
                    <p className="text-sm sm:text-base font-semibold text-zinc-400 mt-1">
                      Популярные композиции исполнителя
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    {recommendedTracks.map((recTrack: any, i: number) => (
                      <TrackRow 
                        key={recTrack.id} 
                        track={recTrack} 
                        index={i} 
                        toggleLike={toggleLikeTrack} 
                        onTrackClick={() => navigateTo('track', { id: recTrack.id })}
                        onPlay={() => onPlayTrack ? onPlayTrack(recTrack) : navigateTo('track', { id: recTrack.id })} 
                        onArtworkClick={() => openLightbox && openLightbox({ url: recTrack.coverUrl, title: recTrack.title, subtitle: recTrack.artistName, type: 'Трек' })}
                        isPlayingTrack={isPlaying && currentTrackId === recTrack.id}
                        size="lg" 
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Artist Card & Release Metadata */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              {/* Artist Card (Directly clickable, no шумный text) */}
              <div 
                onClick={() => navigateTo('artist', { id: track.artistId })}
                className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover-outline-card cursor-pointer group flex flex-col gap-5 shadow-2xl"
              >
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border-2 border-white/10 shadow-xl group-hover:scale-105 transition-transform duration-300 delay-[40ms]">
                    <CoverArt 
                      url={artist?.imageUrl} 
                      title={artist?.name} 
                      isArtist={true} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">Исполнитель</span>
                    <p className="font-black text-2xl md:text-3xl text-white hover-text-link truncate">{track.artistName}</p>
                    <p className="text-xs md:text-sm text-zinc-400 mt-1 font-semibold">{formatListeners(artist?.followers || 0)}</p>
                  </div>
                </div>
                {artist?.bio && (
                  <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 leading-relaxed border-t border-white/5 pt-3">
                    {artist.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {artist?.genre && <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-zinc-300">{artist.genre}</span>}
                  {artist?.country && <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-zinc-400">{artist.country}</span>}
                </div>
              </div>

              {/* Release Info */}
              <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-4 shadow-2xl">
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400">Информация о релизе</h4>
                <div className="space-y-3.5 text-xs md:text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-zinc-400">Дата выпуска</span>
                    <span className="text-white font-semibold">{formatDateDisplay(track.releaseDate) || '01-01-2026'}</span>
                  </div>
                  {track.peakChartPosition && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Пик в чарте</span>
                      <span className="theme-accent font-black text-base">#{track.peakChartPosition}</span>
                    </div>
                  )}
                  {album && track.albumId !== 'single' && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Альбом</span>
                      <span onClick={() => navigateTo('album', { id: album.id })} className="text-white font-semibold hover:underline cursor-pointer truncate max-w-[200px] text-right">{album.title}</span>
                    </div>
                  )}
                  {track.composer && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Автор / Композитор</span>
                      <span className="text-white font-semibold truncate max-w-[200px] text-right">{track.composer}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-zinc-400">Всего прослушиваний</span>
                    <span className="text-white font-bold text-sm md:text-base tabular-nums">{track.plays.toLocaleString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400">В медиатеках / Лайки</span>
                    <span className="text-white font-bold text-sm md:text-base tabular-nums">{track.likes ? track.likes.toLocaleString('ru-RU') : '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Single Track: Responsive side-by-side cards that fill full screen gracefully */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl">
            {/* Artist Card */}
            <div 
              onClick={() => navigateTo('artist', { id: track.artistId })}
              className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover-outline-card cursor-pointer group flex flex-col justify-between gap-6 shadow-2xl"
            >
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border-2 border-white/10 shadow-xl group-hover:scale-105 transition-transform duration-300 delay-[40ms]">
                    <CoverArt 
                      url={artist?.imageUrl} 
                      title={artist?.name} 
                      isArtist={true} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">Исполнитель</span>
                    <p className="font-black text-2xl md:text-3xl text-white hover-text-link truncate">{track.artistName}</p>
                    <p className="text-xs md:text-sm text-zinc-400 mt-1 font-semibold">{formatListeners(artist?.followers || 0)}</p>
                  </div>
                </div>
                {artist?.bio && (
                  <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 leading-relaxed border-t border-white/5 pt-4">
                    {artist.bio}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                {artist?.genre && <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-zinc-300">{artist.genre}</span>}
                {artist?.country && <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-zinc-400">{artist.country}</span>}
              </div>
            </div>

            {/* Release Info */}
            <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-4 shadow-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-zinc-400 mb-4">Информация о релизе</h4>
                <div className="space-y-3.5 text-xs md:text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-zinc-400">Дата выпуска</span>
                    <span className="text-white font-semibold">{formatDateDisplay(track.releaseDate) || '01-01-2026'}</span>
                  </div>
                  {track.peakChartPosition && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Пик в чарте</span>
                      <span className="theme-accent font-black text-base">#{track.peakChartPosition}</span>
                    </div>
                  )}
                  {album && track.albumId !== 'single' && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Альбом</span>
                      <span onClick={() => navigateTo('album', { id: album.id })} className="text-white font-semibold hover:underline cursor-pointer truncate max-w-[200px] text-right">{album.title}</span>
                    </div>
                  )}
                  {track.composer && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Автор / Композитор</span>
                      <span className="text-white font-semibold truncate max-w-[200px] text-right">{track.composer}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-zinc-400">Всего прослушиваний</span>
                    <span className="text-white font-bold text-sm md:text-base tabular-nums">{track.plays.toLocaleString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400">В медиатеках / Лайки</span>
                    <span className="text-white font-bold text-sm md:text-base tabular-nums">{track.likes ? track.likes.toLocaleString('ru-RU') : '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumView({ 
  id, 
  albums, 
  tracks, 
  artists = [], 
  toggleLikeTrack, 
  toggleLikeAlbum, 
  navigateTo, 
  onPlayTrack, 
  openLightbox, 
  currentTrackId, 
  isPlaying, 
  onMoreOptionsClick, 
  onRateClick,
  onSaveAlbumValue,
  uiPrefs
}: {
  uiPrefs?: Partial<ThemeConfig>;
  id: string;
  albums: Album[];
  tracks: Track[];
  artists?: Artist[];
  toggleLikeTrack: (id: string) => void;
  toggleLikeAlbum: (id: string) => void;
  navigateTo: (view: ViewType, params?: NavigationState['params']) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onMoreOptionsClick?: (item: any) => void;
  onRateClick?: (item: any) => void;
  onSaveAlbumValue?: (albumId: string, rating: AlbumValueRating) => void;
}) {
  const [sortMode, setSortMode] = useViewMemo<'relevance' | 'added' | 'alpha'>(`album:${id}:sort`, 'added');
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const album = albums.find((a: any) => a.id === id);
  if (!album) return <div className="p-20 text-center text-xl font-bold opacity-30">АЛЬБОМ НЕ НАЙДЕН</div>;
  
  const rawAlbumTracks = useMemo(() => tracks.filter((t: any) => t.albumId === id), [tracks, id]);
  
  const sortedAlbumTracks = useMemo(() => {
    const list = [...rawAlbumTracks];
    if (sortMode === 'relevance') {
      return list.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    }
    if (sortMode === 'alpha') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru'));
    }
    if (sortMode === 'added') {
      const idOrderMap = new Map();
      tracks.forEach((t, i) => idOrderMap.set(t.id, i));
      return list.sort((a, b) => (idOrderMap.get(a.id) || 0) - (idOrderMap.get(b.id) || 0));
    }
    return list;
  }, [rawAlbumTracks, sortMode, tracks]);

  const visibleTracksCount = useVisibleCount(15, 15, sortedAlbumTracks.length);
  const displayedTracks = sortedAlbumTracks.slice(0, visibleTracksCount);

  // Total plays of album: either stored or sum of tracks
  const totalAlbumPlays = album.totalPlays || rawAlbumTracks.reduce((sum: number, t: any) => sum + (t.plays || 0), 0);

  // Cover-driven colors and big header (can be switched off in Settings)
  const coverColorsOn = uiPrefs?.coverColorPages !== false;
  const albumHeroOn = uiPrefs?.albumHero !== false;
  const albumCoverResolved = resolveMedia(album.coverUrl, { id: album.id, title: album.title, artistName: album.artistName });
  const [albumPalette, setAlbumPalette] = useState<[string, string, string, string]>(() =>
    generateSeedPalette(`${album.title}_${album.artistName}`, '#6366f1')
  );
  useEffect(() => {
    let cancelled = false;
    const fallback = generateSeedPalette(`${album.title}_${album.artistName}`, '#6366f1');
    if (albumCoverResolved) {
      extractPaletteFromImageUrl(albumCoverResolved, fallback).then((pal) => { if (!cancelled) setAlbumPalette(pal); });
    } else {
      setAlbumPalette(fallback);
    }
    return () => { cancelled = true; };
  }, [album.id, albumCoverResolved]);
  const pageAccent = readableAccent(albumPalette[0]);
  const releaseKind = rawAlbumTracks.length <= 1 ? 'Сингл' : rawAlbumTracks.length <= 6 ? 'EP' : 'Альбом';

  return (
    <div
      className={`min-h-full pb-20 relative isolate ${coverColorsOn ? 'page-accent-scope' : ''}`}
      style={coverColorsOn ? ({ ['--page-accent' as any]: pageAccent } as React.CSSProperties) : undefined}
    >
      <ReleaseStage kind="album" id={album.id} cover={album.coverUrl} title={album.title} artistName={album.artistName} genre={album.genre} releaseDate={album.releaseDate} plays={totalAlbumPlays} />
      {/* Top Banner (Spotify style with rich gradient & larger cover) */}
      <div className={`${coverColorsOn ? '' : 'bg-gradient-to-b from-indigo-950/35 via-zinc-900/65 to-[var(--bg-color)] backdrop-blur-xl'} px-6 md:px-8 ${albumHeroOn ? 'pt-10 pb-10 md:pt-14 md:pb-12' : 'pt-8 pb-8'} relative overflow-hidden`}>
        {coverColorsOn && (
          <div className="absolute inset-0 pointer-events-none">
            {albumHeroOn && albumCoverResolved && (
              <div
                className="page-cover-blur absolute -inset-16 bg-cover bg-center opacity-[0.38] blur-[80px] scale-110 transition-opacity duration-700"
                style={{ backgroundImage: `url(${albumCoverResolved})` }}
              />
            )}
            <div
              className="absolute inset-0 transition-all duration-700"
              style={{ background: `linear-gradient(to bottom, ${albumPalette[0]}5c 0%, ${albumPalette[1]}22 55%, var(--bg-color) 100%)` }}
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 max-w-7xl mx-auto relative z-10">
          {/* Larger Square Album Cover with Clickable Lightbox */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-shrink-0"
          >
            {albumHeroOn && coverColorsOn && (
              <div
                className="album-cover-glow absolute -inset-3 rounded-[28px] blur-2xl opacity-60 pointer-events-none transition-all duration-700"
                style={{ background: albumPalette[0] }}
              />
            )}
            <CoverArt 
              url={album.coverUrl} 
              title={album.title}
              className={`${albumHeroOn ? 'w-56 h-56 sm:w-64 sm:h-64 md:w-[300px] md:h-[300px]' : 'w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68'} rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-zinc-800 overflow-hidden border border-white/15 relative cursor-pointer`}
              innerClassName="group-hover:scale-105"
              showZoomIcon={true}
              onZoom={() => openLightbox && openLightbox({ url: album.coverUrl, title: album.title, subtitle: album.artistName, type: 'Альбом' })}
            />
          </motion.div>

          {/* Album Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 flex-1">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">
              {albumHeroOn ? releaseKind : 'Альбом'}
            </span>
            <h1
              className={`${albumHeroOn ? '' : 'text-3xl sm:text-5xl md:text-6xl'} font-extrabold text-white tracking-tight mb-3 leading-tight break-words`}
              style={albumHeroOn ? { fontSize: 'clamp(34px, 5.6vw, 80px)', letterSpacing: '-0.035em', lineHeight: 1.02 } : undefined}
            >
              {album.title}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              {album.rating && (
                <RatingScoreBadge rating={album.rating} size="lg" />
              )}
              {album.albumValue && (
                <AlbumValueBadge 
                  albumValue={album.albumValue} 
                  size="lg" 
                  onClick={() => setIsValueModalOpen(true)}
                />
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 md:gap-2 text-xs md:text-sm text-zinc-300">
              <span 
                onClick={() => navigateTo('artist', { id: album.artistId, artistName: album.artistName })}
                className="font-bold text-white hover:underline cursor-pointer"
                title={`Перейти к артисту ${album.artistName}`}
              >
                {album.artistName}
              </span>
              {album.coArtist && (
                <CoArtistLinks names={album.coArtist} exclude={album.artistName} artists={artists} navigateTo={navigateTo} className="font-bold text-white" />
              )}
              
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{album.releaseYear}</span>

              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">
                {rawAlbumTracks.length} {rawAlbumTracks.length === 1 ? 'трек' : (rawAlbumTracks.length < 5 ? 'трека' : 'треков')}, {calcTotalDuration(rawAlbumTracks)}
              </span>

              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 font-medium tabular-nums">
                {totalAlbumPlays.toLocaleString('ru-RU')} прослушиваний
              </span>

              {album.peakChartPosition && (
                <>
                  <span className="text-zinc-500">•</span>
                  <span className="theme-accent font-bold">Пик в чарте: #{album.peakChartPosition}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Album Value Banner removed per request - info now in badge popover */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => sortedAlbumTracks[0] && (onPlayTrack ? onPlayTrack(sortedAlbumTracks[0]) : navigateTo('track', { id: sortedAlbumTracks[0].id }))}
              className="w-14 h-14 rounded-full theme-bg-accent page-accent-bg hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center cursor-pointer group"
              title="Воспроизвести альбом"
            >
              <Play className="text-black fill-black ml-1 w-6 h-6" />
            </button>
            
            <button 
              onClick={() => {
                if (rawAlbumTracks.length > 0) {
                  const randomTrack = rawAlbumTracks[Math.floor(Math.random() * rawAlbumTracks.length)];
                  if (onPlayTrack) onPlayTrack(randomTrack);
                  else navigateTo('track', { id: randomTrack.id });
                }
              }}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
              title="Перемешать"
            >
              <Shuffle className="w-6 h-6" />
            </button>

            <button 
              onClick={() => toggleLikeAlbum && toggleLikeAlbum(album.id)}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
              title="Сохранить в любимые альбомы"
            >
              <Heart className={`w-6 h-6 ${album.isLiked ? 'theme-accent fill-current' : ''}`} />
            </button>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onRateClick && onRateClick(album)} className="h-9 inline-flex items-center gap-2 px-3.5 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95" title="Оценить альбом по 90-балльной системе">
                <Star className="w-3.5 h-3.5" /><span>{album.rating ? 'Переоценить' : 'Оценить'}</span>
              </button>
              <button type="button" onClick={() => navigateTo('compare', { mode: 'albums', leftId: album.id })} className="h-9 inline-flex items-center gap-2 px-3.5 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95" title="Сравнить с другим альбомом">
                <ArrowLeftRight className="w-3.5 h-3.5" /><span>Сравнить</span>
              </button>
              <AlbumReviewsButton album={album} tracks={tracks} albums={albums} artists={artists} />
            </div>

            <button 
              onClick={() => onMoreOptionsClick && onMoreOptionsClick(album)} 
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
              title="Действия с альбомом"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          <div className="text-xs font-bold flex items-center gap-1.5 p-1 bg-black/30 rounded-xl border border-white/5">
            {[
              { id: 'relevance', label: 'Популярные' },
              { id: 'added', label: 'Порядок добавления' },
              { id: 'alpha', label: 'А-Я' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortMode(opt.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sortMode === opt.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

        </div>

        {/* Tracks Table Header */}
        <div className="grid grid-cols-[24px_1fr_auto] md:grid-cols-[32px_1fr_160px_80px] gap-3 md:gap-4 items-center px-4 py-2 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          <div className="text-center">#</div>
          <div>Название</div>
          <div className="hidden md:block text-right">Прослушивания</div>
          <div className="flex justify-end pr-2"><Clock className="w-4 h-4" /></div>
        </div>

        {/* Tracks List */}
        <div className="space-y-1 mb-12">
          {displayedTracks.map((track: any, i: number) => (
            <TrackRow 
              key={track.id} 
              track={track} 
              index={i} 
              toggleLike={toggleLikeTrack} 
              onTrackClick={() => navigateTo('track', { id: track.id })}
              onPlay={() => onPlayTrack ? onPlayTrack(track) : navigateTo('track', { id: track.id })} 
              onArtworkClick={() => openLightbox && openLightbox({ url: track.coverUrl || album.coverUrl, title: track.title, subtitle: track.artistName, type: 'Трек' })}
              isPlayingTrack={isPlaying && currentTrackId === track.id}
              size="lg"
              albums={albums}
              artists={artists}
              navigateTo={navigateTo}
            />
          ))}
        </div>

        {/* Footer Meta */}
        <div className="pt-6 border-t border-white/5 space-y-2 text-xs text-zinc-500">
          <p>{formatDateDisplay(album.releaseDate)} • {album.genre || 'Музыка'}</p>
          <p className="text-zinc-400 font-semibold">
            Всего прослушиваний альбома: {totalAlbumPlays.toLocaleString('ru-RU')}
          </p>
          {album.producer && <p>Продюсер: {album.producer}</p>}
          {album.label && <p>© {album.releaseYear} {album.label}</p>}
        </div>
      </div>

      <AlbumValueModal
        isOpen={isValueModalOpen}
        album={album}
        onClose={() => setIsValueModalOpen(false)}
        onSave={(albumId, val) => {
          if (onSaveAlbumValue) onSaveAlbumValue(albumId, val);
        }}
      />

      <AlbumValueInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}

function SearchView({ 
  query, 
  artists, 
  albums, 
  tracks, 
  navigateTo, 
  toggleLikeTrack, 
  onPlayTrack, 
  openLightbox, 
  currentTrackId, 
  isPlaying, 
  initialTab,
  initialGenre
}: {
  query: string;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  toggleLikeTrack: (id: string) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  initialTab?: string;
  initialGenre?: string;
  onMoreOptionsClick?: (item: any) => void;
}) {
  const [subTab, setSubTab] = useState<string>(initialTab === 'dates' ? 'dates' : 'catalog');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(initialGenre || null);

  useEffect(() => {
    if (initialGenre) {
      setSubTab('catalog');
      setSelectedGenre(initialGenre);
    }
  }, [initialGenre]);

  // --- 'По датам' (Release Calendar) State ---
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('09'); // Default September 2026 as in mockup
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('plays');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Month dictionary
  const MONTHS = [
    { id: 'all', name: 'Все релизы года' },
    { id: '12', name: 'Декабрь' },
    { id: '11', name: 'Ноябрь' },
    { id: '10', name: 'Октябрь' },
    { id: '09', name: 'Сентябрь' },
    { id: '08', name: 'Август' },
    { id: '07', name: 'Июль' },
    { id: '06', name: 'Июнь' },
    { id: '05', name: 'Май' },
    { id: '04', name: 'Апрель' },
    { id: '03', name: 'Март' },
    { id: '02', name: 'Февраль' },
    { id: '01', name: 'Январь' },
  ];

  const MONTH_NAMES_MAP: Record<string, string> = {
    '01': 'Январь',
    '02': 'Февраль',
    '03': 'Март',
    '04': 'Апрель',
    '05': 'Май',
    '06': 'Июнь',
    '07': 'Июль',
    '08': 'Август',
    '09': 'Сентябрь',
    '10': 'Октябрь',
    '11': 'Ноябрь',
    '12': 'Декабрь',
  };

  const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021'];

  // Count active filters for badge
  const activeFiltersCount = (selectedYear !== 'all' ? 1 : 0) + (selectedMonth !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);

  const resetDateFilters = () => {
    setSelectedYear('2026');
    setSelectedMonth('all');
    setTypeFilter('all');
    setSortBy('plays');
  };

  // Compile combined releases for 'По датам'
  const dateReleases = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'track' | 'album';
      title: string;
      artistName: string;
      artistId?: string;
      coverUrl?: string;
      releaseDate: string;
      year: string;
      month: string;
      plays: number;
      rating?: RatingData;
      raw: Track | Album;
    }> = [];

    // Tracks
    tracks.forEach((t: Track) => {
      const rel = t.releaseDate || '2026-01-01';
      const parts = rel.split('-');
      const y = parts[0] || '2026';
      const m = parts[1] || '01';
      list.push({
        id: t.id,
        type: 'track',
        title: t.title,
        artistName: t.artistName,
        artistId: t.artistId,
        coverUrl: getTrackCover(t, albums),
        releaseDate: rel,
        year: y,
        month: m,
        plays: t.plays || 0,
        rating: t.rating,
        raw: t
      });
    });

    // Albums
    albums.forEach((a: Album) => {
      const rel = a.releaseDate || (a.releaseYear ? `${a.releaseYear}-01-01` : '2026-01-01');
      const parts = rel.split('-');
      const y = parts[0] || a.releaseYear?.toString() || '2026';
      const m = parts[1] || '01';
      list.push({
        id: a.id,
        type: 'album',
        title: a.title,
        artistName: a.artistName,
        artistId: a.artistId,
        coverUrl: a.coverUrl,
        releaseDate: rel,
        year: y,
        month: m,
        plays: a.totalPlays || 0,
        rating: a.rating,
        raw: a
      });
    });

    // Filter
    let filtered = list.filter(item => {
      if (selectedYear !== 'all' && item.year !== selectedYear) return false;
      if (selectedMonth !== 'all' && item.month !== selectedMonth) return false;
      if (typeFilter !== 'all') {
        if (typeFilter === 'tracks' && item.type !== 'track') return false;
        if (typeFilter === 'albums' && item.type !== 'album') return false;
      }
      return true;
    });

    // Sort
    if (sortBy === 'plays') {
      filtered.sort((a, b) => b.plays - a.plays);
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    } else if (sortBy === 'score') {
      filtered.sort((a, b) => (b.rating?.totalScore || 0) - (a.rating?.totalScore || 0));
    }

    return filtered;
  }, [tracks, albums, selectedYear, selectedMonth, typeFilter, sortBy]);

  // Performance Optimization: Incremental loading for Search
  const visibleDatesCount = useVisibleCount(15, 15, dateReleases.length);
  const displayedDateReleases = dateReleases.slice(0, visibleDatesCount);

  // Catalog filtered search results
  const filteredArtists = useMemo(() => artists.filter((a: any) => 
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    (selectedGenre && a.genre?.toLowerCase().includes(selectedGenre.toLowerCase()))
  ), [artists, query, selectedGenre]);

  const filteredTracks = useMemo(() => tracks.filter((t: any) => {
    const matchesQuery = t.title.toLowerCase().includes(query.toLowerCase()) || 
                         t.artistName.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = selectedGenre 
      ? (t.genre?.toLowerCase().includes(selectedGenre.toLowerCase()) || 
         t.artistName.toLowerCase().includes(selectedGenre.toLowerCase()))
      : true;
    return matchesQuery && matchesGenre;
  }), [tracks, query, selectedGenre]);

  const filteredAlbums = useMemo(() => albums.filter((al: any) => {
    const matchesQuery = al.title.toLowerCase().includes(query.toLowerCase()) || 
                         al.artistName.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = selectedGenre 
      ? al.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      : true;
    return matchesQuery && matchesGenre;
  }), [albums, query, selectedGenre]);

  const visibleArtistsCount = useVisibleCount(12, 12, filteredArtists.length);
  const visibleTracksCount = useVisibleCount(20, 20, filteredTracks.length);
  const visibleAlbumsCount = useVisibleCount(12, 12, filteredAlbums.length);

  const displayedArtists = filteredArtists.slice(0, visibleArtistsCount);
  const displayedTracks = filteredTracks.slice(0, visibleTracksCount);
  const displayedAlbums = filteredAlbums.slice(0, visibleAlbumsCount);

  const currentMonthLabel = selectedMonth === 'all' 
    ? 'Все релизы года' 
    : (MONTH_NAMES_MAP[selectedMonth] || 'Все релизы');

  const formattedHeaderTitle = selectedMonth === 'all'
    ? (selectedYear === 'all' ? 'Все релизы' : `Релизы ${selectedYear} года`)
    : `${MONTH_NAMES_MAP[selectedMonth]} ${selectedYear !== 'all' ? selectedYear : ''}`.trim();

  return (
    <div className="p-scale pb-28 space-y-6">
      {/* Top Segmented Sub-Navigation: Search/Genres vs By Dates */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setSubTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
              subTab === 'catalog'
                ? 'theme-bg-accent text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Жанры и поиск</span>
          </button>

          <button
            onClick={() => setSubTab('dates')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
              subTab === 'dates'
                ? 'theme-bg-accent text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>По датам</span>
          </button>
        </div>

        {subTab === 'dates' && (
          <div className="text-xs text-zinc-400 font-medium hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full theme-bg-accent"></span>
            <span>Хронологический архив релизов</span>
          </div>
        )}
      </div>

      {/* --- SUBTAB 1: 'ПО ДАТАМ' (RELEASE ARCHIVE / CALENDAR) --- */}
      {subTab === 'dates' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Breadcrumb matching mockup */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <span onClick={() => navigateTo('home')} className="hover:text-white cursor-pointer transition-colors">Главная</span>
            <span>›</span>
            <span className="text-zinc-300">Релизы по датам</span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Релизы по датам</h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 font-medium">
              Хронологический каталог всех релизов с удобным выбором месяцев и годов
            </p>
          </div>

          {/* 2-Column Split: Left Filters vs Right Release Grid (Matching image_9c006c3f.png) */}
          <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-8 items-start">
            {/* Left Filter Card */}
            <div className="bg-[#141416] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-6 sticky top-20 z-20 backdrop-blur-xl">
              {/* Header: Фильтры & Сбросить */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <Filter className="w-4 h-4 text-zinc-400" />
                  <span className="font-extrabold text-sm text-white">Фильтры</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetDateFilters}
                  className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group"
                  title="Сбросить фильтры к 2026"
                >
                  <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                  <span>Сбросить</span>
                </button>
              </div>

              {/* Year Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-400 block">Год</label>
                <div className="grid grid-cols-4 gap-2">
                  {[...YEARS, 'all'].map(yr => {
                    const isSelected = selectedYear === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setSelectedYear(yr)}
                        className={`relative py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-zinc-800 text-white font-black shadow-inner border border-white/20'
                            : 'bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5'
                        }`}
                      >
                        <span>{yr === 'all' ? 'Все' : yr}</span>
                        {/* Active Underline Indicator from mockup */}
                        {isSelected && (
                          <span className="w-4 h-0.5 bg-white rounded-full mt-1"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Selector Dropdown (Styled after mockup) */}
              <div className="space-y-2.5 relative">
                <label className="text-xs font-bold text-zinc-400 block">Месяц</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-2xl text-xs md:text-sm font-bold text-white transition-all cursor-pointer"
                  >
                    <span>{currentMonthLabel}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu matching mockup */}
                  <AnimatePresence>
                    {isMonthDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 max-h-64 overflow-y-auto custom-scrollbar space-y-0.5 backdrop-blur-xl"
                      >
                        {MONTHS.map(m => {
                          const isSel = selectedMonth === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedMonth(m.id);
                                setIsMonthDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                isSel
                                  ? 'bg-white/10 text-white'
                                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <span>{m.name}</span>
                              {isSel && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Release Type Segmented Buttons */}
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <label className="text-xs font-bold text-zinc-400 block">Формат</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
                  {[
                    { id: 'all', label: 'Все' },
                    { id: 'tracks', label: 'Треки' },
                    { id: 'albums', label: 'Альбомы' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTypeFilter(opt.id as any)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === opt.id
                          ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Panel: Header, Tip, Sorts, Releases Grid */}
            <div className="space-y-6">
              {/* Active Selection Large Title */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {formattedHeaderTitle}
                </h2>
                <span className="text-xs font-bold text-zinc-400">
                  {dateReleases.length} {dateReleases.length === 1 ? 'релиз' : (dateReleases.length < 5 ? 'релиза' : 'релизов')}
                </span>
              </div>

              {/* Tip Banner (Matching mockup text bar) */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-xs md:text-sm text-zinc-300 shadow-md backdrop-blur-md">
                <Sparkles className="w-4 h-4 theme-accent shrink-0" />
                <span>Нажмите на карточку релиза, чтобы открыть страницу или прослушать композицию</span>
              </div>

              {/* Sort Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-2 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-zinc-400 px-3">Сортировка:</span>
                
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'plays', label: 'По прослушиваниям', icon: Flame },
                    { id: 'date', label: 'По дате выхода', icon: Clock },
                    { id: 'score', label: 'По оценке', icon: Star },
                  ].map(s => {
                    const Icon = s.icon;
                    const isActive = sortBy === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSortBy(s.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'theme-bg-accent text-black shadow-md'
                            : 'bg-black/30 text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Release Grid Matching mockup */}
              {displayedDateReleases.length === 0 ? (
                <div className="py-24 text-center space-y-4 bg-zinc-900/30 rounded-3xl border border-white/5 p-8">
                  <Calendar className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-lg font-bold text-zinc-300">Релизов за этот период не найдено</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Попробуйте выбрать другой месяц или год в меню фильтров слева.
                  </p>
                  <button
                    type="button"
                    onClick={resetDateFilters}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {displayedDateReleases.map(rel => {
                    const isTrack = rel.type === 'track';
                    return (
                      <motion.div
                        key={`${rel.type}-${rel.id}`}
                        whileHover={{ y: -6 }}
                        onClick={() => navigateTo(isTrack ? 'track' : 'album', { id: rel.id })}
                        className="bg-[#18181b]/90 hover:bg-zinc-800/90 border border-white/10 hover:border-white/25 rounded-3xl p-3.5 md:p-4 transition-all duration-300 group cursor-pointer shadow-xl flex flex-col justify-between"
                      >
                        <div>
                          {/* Square Cover Container */}
                          <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-3 bg-zinc-900 shadow-xl border border-white/5">
                            <CoverArt
                              url={rel.coverUrl}
                              title={rel.title}
                              className="w-full h-full"
                              innerClassName="group-hover:scale-108 duration-500"
                            />

                            {/* Format Chip on top-left */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-wider text-white">
                                {isTrack ? 'Трек' : 'Альбом'}
                              </span>
                            </div>

                            {/* Rating Badge on top-right */}
                            {rel.rating && (
                              <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
                                <RatingScoreBadge rating={rel.rating} size="sm" showDetailsOnHover={false} />
                                {!isTrack && (rel.raw as Album).albumValue && (
                                  <AlbumValueBadge albumValue={(rel.raw as Album).albumValue} size="sm" />
                                )}
                              </div>
                            )}

                            {/* Play Button Overlay */}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isTrack) onPlayTrack(rel.raw as Track);
                                else navigateTo('album', { id: rel.id });
                              }}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-xs cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-full theme-bg-accent flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                              </div>
                            </div>
                          </div>

                          {/* Artist Name (prominent and centered as in reference photo) */}
                          <p 
                            onClick={(e) => {
                              if (rel.artistId) {
                                e.stopPropagation();
                                navigateTo('artist', { id: rel.artistId });
                              }
                            }}
                            className="font-black text-sm md:text-base text-white truncate text-center hover-text-link"
                          >
                            {rel.artistName}
                          </p>

                          {/* Release Title */}
                          <p className="text-xs text-zinc-400 font-semibold truncate text-center mt-0.5">
                            {rel.title}
                          </p>
                        </div>

                        {/* Bottom Status / Category Bar (Exact style from reference screenshot) */}
                        <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-zinc-400 px-1">
                          <span className="tabular-nums text-zinc-300">{rel.plays ? `${formatNumber(rel.plays)}` : '0'} просл.</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{formatDateDisplay(rel.releaseDate)}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: 'ЖАНРЫ И ПОИСК' (CATALOG & SEARCH) --- */}
      {subTab === 'catalog' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Selected Genre Banner */}
          {selectedGenre && (
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-zinc-800/80 via-zinc-900/60 to-black border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Фильтр по жанру</span>
                  <button 
                    onClick={() => setSelectedGenre(null)} 
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer ml-2"
                  >
                    Сбросить
                  </button>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white">{selectedGenre}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Найдено {filteredTracks.length} треков и {filteredAlbums.length} альбомов
                </p>
              </div>

              {filteredTracks.length > 0 && (
                <button 
                  onClick={() => onPlayTrack(filteredTracks[0])}
                  className="px-6 py-3 theme-bg-accent text-black font-extrabold text-sm rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Слушать жанр</span>
                </button>
              )}
            </div>
          )}

          {/* If no active search query and no genre: show curated genres */}
          {!query && !selectedGenre && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Популярные жанры и категории</h3>
                <button
                  onClick={() => setSubTab('dates')}
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Календарь по датам</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {GENRE_CATALOG.map(g => (
                  <div 
                    key={g.id} 
                    onClick={() => setSelectedGenre(g.name)}
                    className={`bg-gradient-to-br ${g.gradient} aspect-[1.4/1] sm:h-36 p-4 md:p-5 rounded-2xl relative overflow-hidden group cursor-pointer border border-white/10 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-102 hover:shadow-2xl`}
                  >
                    <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight relative z-10 drop-shadow-md pr-4">
                      {g.name}
                    </span>

                    {/* Rotated album cover image in the bottom right corner (Spotify style) */}
                    <CoverArt 
                      url={g.coverImage} 
                      title={g.name} 
                      className="absolute -bottom-2 -right-2 w-20 h-20 sm:w-24 sm:h-24 rounded-lg shadow-2xl rotate-[22deg] group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-300 border border-white/20 shrink-0" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artists Results */}
          {displayedArtists.length > 0 && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Исполнители</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {displayedArtists.map((a: any) => (
                  <div 
                    key={a.id} 
                    onClick={() => navigateTo('artist', { id: a.id })} 
                    className="shrink-0 w-36 sm:w-44 p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/80 transition-all cursor-pointer border border-white/5 flex flex-col items-center text-center group"
                  >
                    <div 
                      onClick={(e) => {
                        if (openLightbox) {
                          e.stopPropagation();
                          openLightbox({ url: a.imageUrl, title: a.name, subtitle: `${formatListeners(a.followers)}`, type: 'Исполнитель' });
                        }
                      }}
                      className="w-24 h-24 rounded-full overflow-hidden mb-3 shadow-xl bg-zinc-800 relative cursor-pointer"
                    >
                      <CoverArt 
                        url={a.imageUrl} 
                        title={a.name} 
                        isArtist={true}
                        className="w-24 h-24 rounded-full shadow-xl bg-zinc-800 border border-white/10" 
                        innerClassName="group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="font-bold text-sm text-white truncate w-full">{a.name}</p>
                    <p className="text-[11px] font-bold text-zinc-400 mt-1 truncate w-full">
                      {formatShortListeners(a.followers)} • {a.trackCount || 0} {pluralizeTracks(a.trackCount || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracks Results with Progressive Rendering (Eliminates Search Lag) */}
          {filteredTracks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl md:text-2xl font-bold text-white">Композиции</h3>
                <span className="text-xs font-semibold text-zinc-400">
                  Всего найдено: {filteredTracks.length}
                </span>
              </div>
              <div className="max-w-5xl">
                <ProgressiveTrackList
                  tracks={filteredTracks}
                  initialBatchSize={50}
                  incrementBatchSize={50}
                  renderItem={(t: any, i: number) => (
                    <TrackRow 
                      key={t.id} 
                      track={t} 
                      index={i} 
                      toggleLike={toggleLikeTrack} 
                      onTrackClick={() => navigateTo('track', { id: t.id })}
                      onPlay={() => onPlayTrack ? onPlayTrack(t) : navigateTo('track', { id: t.id })} 
                      onArtworkClick={() => openLightbox && openLightbox({ url: getTrackCover(t, albums), title: t.title, subtitle: t.artistName, type: 'Трек' })}
                      isPlayingTrack={isPlaying && currentTrackId === t.id}
                      size="lg" 
                      albums={albums}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Albums Results */}
          {displayedAlbums.length > 0 && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Альбомы</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedAlbums.map((alb: any) => (
                  <div 
                    key={alb.id} 
                    onClick={() => navigateTo('album', { id: alb.id })} 
                    className="p-3.5 bg-zinc-900/40 hover:bg-zinc-800/80 rounded-2xl transition-all group cursor-pointer border border-white/5"
                  >
                    <CoverArt 
                      url={alb.coverUrl} 
                      title={alb.title}
                      className="aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-800 shadow-md relative"
                    />
                    <p className="font-bold text-sm text-white truncate">{alb.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{alb.artistName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Musaic v2.3: new components under the old names ---
const PlaceholderArt = AutoCover;
const RatingScoreBadge: any = ScoreRing; // Musaic v2.4: prettier rings (old ScoreBadge kept in rating/RatingPanel.tsx)
const RatingInputCard = RatingPanel;