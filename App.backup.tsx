
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from "motion/react";
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
  Star,
  Flame,
  RotateCcw,
  Filter
} from 'lucide-react';
import { Artist, Album, Track, ViewType, NavigationState, HomeViewProps, ArtistViewProps, RatingData } from './types';
import { GoogleGenAI } from "@google/genai";

// --- Types & Constants ---

interface ThemePreset {
  id: string;
  name: string;
  accentColor: string;
  bgColor: string;
  fontFamily: string;
  radiusFactor: number;
}

const THEME_PRESETS: ThemePreset[] = [
  { id: 'spotify', name: 'Spotify Dark', accentColor: '#1ed760', bgColor: '#121212', fontFamily: "'Plus Jakarta Sans', sans-serif", radiusFactor: 1.0 },
  { id: 'cyber', name: 'Cyber Violet', accentColor: '#a855f7', bgColor: '#09090b', fontFamily: "'Outfit', sans-serif", radiusFactor: 1.2 },
  { id: 'ocean', name: 'Nordic Ocean', accentColor: '#38bdf8', bgColor: '#080e1a', fontFamily: "'Inter', sans-serif", radiusFactor: 0.8 },
  { id: 'sunset', name: 'Sunset Glow', accentColor: '#f97316', bgColor: '#140d0b', fontFamily: "'Montserrat', sans-serif", radiusFactor: 1.3 },
  { id: 'mono', name: 'Monochrome Pro', accentColor: '#ffffff', bgColor: '#000000', fontFamily: "'JetBrains Mono', monospace", radiusFactor: 0.5 },
];

const AVAILABLE_FONTS = [
  { id: "'Inter', sans-serif", name: 'Inter', desc: 'Чистый современный' },
  { id: "'Plus Jakarta Sans', sans-serif", name: 'Plus Jakarta Sans', desc: 'Стиль Spotify' },
  { id: "'Montserrat', sans-serif", name: 'Montserrat', desc: 'Плотный выразительный' },
  { id: "'Manrope', sans-serif", name: 'Manrope', desc: 'Сбалансированный гротеск' },
  { id: "'Outfit', sans-serif", name: 'Outfit', desc: 'Модный футуристичный' },
  { id: "'JetBrains Mono', monospace", name: 'JetBrains Mono', desc: 'Технический моно' },
];

interface ThemeConfig {
  bgColor: string;
  accentColor: string;
  cardBg: string;
  textScale: number;
  uiScale: number;
  radiusFactor: number;
  blurIntensity: number;
  fontFamily: string;
  glowEnabled: boolean;
  letterSpacing: number;
  fontWeight: number;
  cardOpacity: number;
  sidebarWidth: number;
  playerHeight: number;
  headerBlur: number;
  animationSpeed: number;
}

const DEFAULT_THEME: ThemeConfig = {
  bgColor: '#121212',
  accentColor: '#1ed760',
  cardBg: 'rgba(24, 24, 27, 0.5)',
  textScale: 1.0,
  uiScale: 1.0,
  radiusFactor: 1.0,
  blurIntensity: 20,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  glowEnabled: true,
  letterSpacing: -0.02,
  fontWeight: 400,
  cardOpacity: 0.4,
  sidebarWidth: 240,
  playerHeight: 90,
  headerBlur: 20,
  animationSpeed: 0.35,
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

// Smart random plays generator strictly in 200k - 15M range
const getRandomPlays = (_artistFollowers?: number): string => {
  const min = 200000;
  const max = 15000000;
  const plays = Math.floor(Math.random() * (max - min + 1)) + min;
  return plays.toLocaleString('ru-RU');
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

const getRandomDuration = () => {
  const min = Math.floor(Math.random() * 4) + 1;
  const sec = Math.floor(Math.random() * 60).toString().padStart(2, '0');
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

const formatNumber = (num: number) => {
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

const parseFormattedNumber = (str: string) => {
  if (typeof str !== 'string') return 0;
  return parseInt(str.replace(/[\s\.\u00A0]/g, '')) || 0;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- IndexedDB Storage Helper (Supports Large DBs > 5MB without lag) ---
const DB_NAME = 'MusaicDatabase';
const STORE_NAME = 'masterStore';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const dbGet = async (key: string): Promise<any> => {
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

const dbSet = async (key: string, val: any): Promise<void> => {
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

// Optimized Parent Album Resolution with caching logic for high performance
export const findParentAlbumForTrack = (track?: Track | null, albumList?: Album[]): Album | undefined => {
  if (!track || !albumList || albumList.length === 0) return undefined;

  const trackAlbId = String(track.albumId || '').trim();
  if (trackAlbId && trackAlbId !== 'single' && trackAlbId !== 'сингл' && trackAlbId !== 'undefined') {
    const foundById = albumList.find(a => String(a.id).trim() === trackAlbId);
    if (foundById) return foundById;
  }

  const rawAlbumTitle = track.albumTitle?.replace(/[\«\»\"\'\`]/g, '').trim().toLowerCase();
  if (rawAlbumTitle && rawAlbumTitle !== 'single' && rawAlbumTitle !== 'сингл' && rawAlbumTitle !== 'undefined') {
    const foundByExactTitle = albumList.find(a => a.title.replace(/[\«\»\"\'\`]/g, '').trim().toLowerCase() === rawAlbumTitle);
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

// Synchronizes all existing tracks with their parent albums, updating coverUrl and album metadata
export const syncTracksWithAlbumCovers = (trackList: Track[], albumList: Album[]): Track[] => {
  if (!trackList || !albumList || albumList.length === 0) return trackList || [];
  return trackList.map(t => {
    const parentAlb = findParentAlbumForTrack(t, albumList);
    const parentCover = getAlbumCoverUrl(parentAlb);
    if (parentAlb && parentCover) {
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

// Hook for incremental loading of large lists to prevent UI freezes
export function useVisibleCount(initialCount: number = 15, step: number = 15, total: number) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  
  useEffect(() => {
    if (visibleCount < total) {
      const timeout = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + step, total));
      }, 50); // Small delay to allow main thread to breathe
      return () => clearTimeout(timeout);
    }
  }, [visibleCount, total, step]);

  return visibleCount;
}

// Component that splits multiple featured artists by comma and links each to their individual profile
export const FeaturedArtistsLinks: React.FC<{
  featuredArtist?: string;
  artists?: Artist[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string }) => void;
  className?: string;
}> = ({ featuredArtist, artists = [], navigateTo, className = "text-zinc-400" }) => {
  if (!featuredArtist || !featuredArtist.trim()) return null;

  const names = featuredArtist.split(',').map(s => s.trim()).filter(Boolean);
  if (names.length === 0) return null;

  return (
    <span className={className}>
      <span className="text-zinc-500 font-medium mr-1">feat.</span>
      {names.map((featName, idx) => {
        const found = artists.find(a => a.name.trim().toLowerCase() === featName.toLowerCase());
        const targetId = found ? found.id : `guest_${featName}`;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-zinc-500 font-normal mr-1">, </span>}
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('artist', { id: targetId, artistName: featName });
              }}
              className="hover:text-white hover:underline cursor-pointer transition-colors font-semibold"
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
const PlaceholderArt: React.FC<{
  title?: string;
  albumTitle?: string;
  isArtist?: boolean;
  innerClassName?: string;
}> = ({ title = '', albumTitle = '', isArtist = false, innerClassName = '' }) => {
  // Hash logic improved to favor album titles for consistency across tracks in an album
  const hashSource = albumTitle ? (albumTitle.toLowerCase().trim()) : (title || '').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    hash = hashSource.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const mainText = albumTitle || title || (isArtist ? 'Артист' : 'Музыка');
  const trimmed = mainText.trim();
  const words = trimmed.split(/\s+/);
  
  // Enhanced wrapping: handles both multi-word titles and long single words
  let lines: string[] = [];
  if (words.length > 1 && trimmed.length > 10) {
    const mid = Math.ceil(words.length / 2);
    lines.push(words.slice(0, mid).join(' '));
    lines.push(words.slice(mid).join(' '));
  } else if (trimmed.length > 9) {
    // Split long single words roughly in half
    const mid = Math.ceil(trimmed.length / 2);
    lines.push(trimmed.slice(0, mid));
    lines.push(trimmed.slice(mid));
  } else {
    lines.push(trimmed);
  }

  // Refined palette: Added more neutral, deep, and sophisticated gradients per user request
  const backgrounds = [
    'bg-zinc-950',
    'bg-gradient-to-br from-zinc-950 to-neutral-950',
    'bg-gradient-to-tr from-stone-950 to-zinc-950',
    'bg-gradient-to-b from-neutral-950 to-black',
    'bg-gradient-to-bl from-zinc-950 to-slate-950',
    'bg-gradient-to-br from-zinc-900 to-zinc-950',
    'bg-gradient-to-tr from-zinc-900 to-neutral-950',
    'bg-gradient-to-bl from-slate-900 to-zinc-950',
    'bg-gradient-to-b from-zinc-900 to-black',
    'bg-gradient-to-r from-neutral-900 to-stone-950',
    'bg-gradient-to-br from-gray-900 to-zinc-950',
    'bg-gradient-to-tr from-zinc-800/10 to-zinc-950',
    'bg-gradient-to-bl from-stone-800/10 to-neutral-950',
    'bg-gradient-to-br from-slate-800/10 to-zinc-950',
    'bg-gradient-to-br from-slate-950 via-zinc-950 to-stone-950',
    'bg-gradient-to-tr from-stone-950 via-neutral-950 to-zinc-950',
    'bg-gradient-to-br from-zinc-900/40 to-black',
    'bg-gradient-to-tr from-slate-900/30 to-zinc-950',
    'bg-gradient-to-b from-stone-900/20 to-black',
    // Newly added neutral variations
    'bg-gradient-to-tr from-zinc-900 via-stone-900 to-black',
    'bg-gradient-to-br from-neutral-900 via-zinc-950 to-stone-950',
    'bg-gradient-to-bl from-slate-950 via-zinc-900 to-black',
    'bg-gradient-to-r from-stone-950 via-neutral-900 to-zinc-950',
    'bg-gradient-to-t from-black via-zinc-950 to-neutral-900',
    'bg-gradient-to-br from-gray-950 to-black',
    'bg-gradient-to-tr from-zinc-950 to-slate-900/30',
    'bg-gradient-to-bl from-stone-950 to-zinc-900/30',
    'bg-gradient-to-r from-black to-zinc-900/20',
    'bg-gradient-to-b from-zinc-950 via-black to-zinc-900',
    'bg-gradient-to-tr from-neutral-950 to-stone-900',
  ];

  const variant = Math.abs(hash) % backgrounds.length;

  return (
    <div className={`w-full h-full ${backgrounds[variant]} flex flex-col items-center justify-center relative overflow-hidden select-none [container-type:size] ${innerClassName}`}>
      {/* Centered stylized text - Subtler visibility [text-white/0.25] and multi-line wrapping */}
      <div className="absolute inset-0 flex items-center justify-center p-[8cqw]">
        <div className="flex flex-col items-center justify-center w-full">
          {lines.map((line, idx) => (
            <span 
              key={idx} 
              className="text-[12cqw] font-black text-white/0.25 pointer-events-none select-none tracking-tighter leading-[0.95] text-center break-all uppercase"
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- Beautiful Cover Art Component with Zoom Support ---

const CoverArt: React.FC<{ 
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
}> = ({ url, title, albumTitle, className = "", innerClassName = "", onPlay, onZoom, showZoomIcon = false, isArtist = false, children }) => {
  const [imgError, setImgError] = useState(false);
  
  const showPlaceholder = !url || imgError || url.includes('picsum.photos/seed');

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
          src={url} 
          alt={title || ""} 
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
};

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

const RatingScoreBadge: React.FC<{
  rating?: RatingData;
  size?: 'sm' | 'md' | 'lg';
  showDetailsOnHover?: boolean;
}> = ({ rating, size = 'md', showDetailsOnHover = true }) => {
  if (!rating || !rating.totalScore) return null;
  const [showPopover, setShowPopover] = useState(false);
  const score = rating.totalScore;
  const isMax = score === 90;
  const tier = getScoreTier(score);

  // Dimensions optimized for impact - 10% smaller than classic was the old req, but now they want "bigger" for main score
  const badgeSizeClasses = 
    size === 'sm' ? 'w-6 h-6 text-[10px]' :
    size === 'lg' ? 'w-14 h-14 text-lg md:text-xl font-black' :
    'w-10 h-10 text-sm font-black';

  return (
    <div 
      className="relative inline-block select-none group shrink-0"
      onMouseEnter={() => showDetailsOnHover && setShowPopover(true)}
      onMouseLeave={() => showDetailsOnHover && setShowPopover(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (showDetailsOnHover) setShowPopover(!showPopover);
      }}
    >
      <motion.div 
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className={`rounded-full flex items-center justify-center cursor-pointer border-2 backdrop-blur-md font-black tabular-nums antialiased transition-all duration-300 ${tier.badgeBorder} ${tier.badgeText} ${tier.badgeBg} ${tier.glow} ${badgeSizeClasses} relative z-10 shadow-lg`}
      >
        <span className="tracking-tight leading-none drop-shadow-sm">{score}</span>
        {isMax && (
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/80 animate-ping opacity-40" />
        )}
      </motion.div>

      {/* Popover Breakdown on Hover / Click */}
      <AnimatePresence>
        {showPopover && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-72 bg-zinc-900/95 border border-white/10 rounded-3xl p-5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] z-[2000] text-xs space-y-4 backdrop-blur-3xl pointer-events-none ring-1 ring-white/5"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="font-black text-white/40 uppercase tracking-[0.2em] text-[8px]">Экспертный разбор</span>
              <span className={`font-black text-sm ${tier.textColor}`}>{score} / 90</span>
            </div>
            
            <div className="space-y-2.5 text-zinc-400 text-[11px] font-bold">
              <div className="flex justify-between items-center">
                <span className="opacity-80">Рифмы / Образы</span> 
                <span className="text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{rating.rhymes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80">Структура / Ритмика</span> 
                <span className="text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{rating.structure}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80">Реализация стиля</span> 
                <span className="text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{rating.style}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80">Индивидуальность</span> 
                <span className="text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{rating.charisma}</span>
              </div>
              <div className="flex justify-between items-center text-purple-400 pt-2 border-t border-white/5 font-black">
                <span>Атмосфера / Вайб</span> 
                <span className="bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">{rating.vibe}</span>
              </div>
            </div>

            {rating.nominations && rating.nominations.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Номинировано:</span>
                <div className="flex flex-wrap gap-1">
                  {rating.nominations.map(n => (
                    <span key={n} className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-[9px] font-bold text-amber-300">
                      🏆 {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 text-[8px] text-zinc-500 flex justify-between font-mono font-bold tracking-widest opacity-70">
              <span>90-POINT SYSTEM</span>
              <span className="theme-accent uppercase">CRITIC CHOICE</span>
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

const RatingInputCard: React.FC<{
  rating?: RatingData;
  onChange: (rating: RatingData | undefined) => void;
  onConfirm?: () => void;
  title?: string;
  isStandalone?: boolean;
  targetType?: 'track' | 'album' | 'artist';
}> = ({ rating, onChange, onConfirm, title = "ОЦЕНКА", isStandalone = false, targetType = 'track' }) => {
  const [enabled, setEnabled] = useState(Boolean(rating) || isStandalone);
  const [rhymes, setRhymes] = useState(rating?.rhymes || 10);
  const [structure, setStructure] = useState(rating?.structure || 10);
  const [style, setStyle] = useState(rating?.style || 10);
  const [charisma, setCharisma] = useState(rating?.charisma || 10);
  const [vibe, setVibe] = useState(rating?.vibe || 10);
  const [selectedNominations, setSelectedNominations] = useState<string[]>(rating?.nominations || []);

  const nominationOptions = targetType === 'album'
    ? ['Альбом года', 'Лучшая обложка', 'Лучший концепт', 'Дебют года', 'EP года']
    : targetType === 'artist'
    ? ['Артист года', 'Фрешмен года', 'Продюсер года', 'Открытие года']
    : ['Трек года', 'Хит года', 'Лучший фит', 'Фрешмен-трек', 'Лучший текст', 'Лучший бит', 'Лучший клип'];

  const toggleNomination = (nom: string) => {
    setSelectedNominations(prev => 
      prev.includes(nom) ? prev.filter(x => x !== nom) : [...prev, nom]
    );
  };

  const calculatedTotal = calculateRatingScore(rhymes, structure, style, charisma, vibe);
  const tier = getScoreTier(calculatedTotal);

  useEffect(() => {
    if (enabled) {
      onChange({ rhymes, structure, style, charisma, vibe, totalScore: calculatedTotal, nominations: selectedNominations });
    } else {
      onChange(undefined);
    }
  }, [enabled, rhymes, structure, style, charisma, vibe, calculatedTotal, selectedNominations]);

  return (
    <div className={`bg-[#0d111b] border border-[#1e273e] rounded-[2rem] p-5 sm:p-7 space-y-5 shadow-2xl relative transition-all ${calculatedTotal === 90 ? 'border-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.15)]' : ''}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-left text-base sm:text-xl font-black tracking-widest text-white uppercase flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs font-bold text-zinc-500 font-mono">90-POINT SYSTEM</span>
        </h3>
        {!isStandalone && (
          <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-all shrink-0">
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={(e) => setEnabled(e.target.checked)} 
              className="w-3.5 h-3.5 rounded accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Оценить</span>
          </label>
        )}
      </div>

      {enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start animate-in fade-in duration-300">
          {/* Column 1: Sliders */}
          <div className="space-y-3.5">
            {/* Box 1: 4 Main Criteria (Blue Sliders) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121625]/90 border border-[#1f283e] space-y-3 shadow-inner">
              <CriterionSlider label="Рифмы / Образы" value={rhymes} onChange={setRhymes} gradient="from-[#2563eb] to-[#3b82f6]" />
              <CriterionSlider label="Структура / Ритмика" value={structure} onChange={setStructure} gradient="from-[#2563eb] to-[#3b82f6]" />
              <CriterionSlider label="Реализация стиля" value={style} onChange={setStyle} gradient="from-[#2563eb] to-[#3b82f6]" />
              <CriterionSlider label="Индивидуальность / Харизма" value={charisma} onChange={setCharisma} gradient="from-[#2563eb] to-[#3b82f6]" />
            </div>

            {/* Box 2: Atmosphere / Vibe (Purple Slider) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#171429]/90 border border-[#37284f] shadow-inner">
              <CriterionSlider label="Атмосфера / Вайб" value={vibe} onChange={setVibe} gradient="from-[#7c3aed] to-[#a855f7]" badgeStyle="text-purple-300 bg-purple-500/20 border-purple-500/30" />
            </div>
          </div>

          {/* Column 2: Nominations & Big Total Score Box */}
          <div className="space-y-4 flex flex-col justify-between h-full">
            {/* Nominations Selector */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121625]/90 border border-[#1f283e] space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Номинации ({selectedNominations.length})</span>
                </span>
                {selectedNominations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedNominations([])}
                    className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer underline"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {nominationOptions.map(nom => {
                  const isSelected = selectedNominations.includes(nom);
                  return (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => toggleNomination(nom)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-400/25 text-amber-300 border-amber-400/50 shadow-md scale-102 font-black'
                          : 'bg-black/40 text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{nom}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Score & Action Row */}
            <div className="p-5 rounded-2xl bg-black/40 border border-[#1f283e] flex items-center justify-between gap-4 mt-auto">
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl sm:text-7xl font-[1000] tabular-nums tracking-tight leading-none transition-colors duration-300 ${tier.textColor}`}>
                  {calculatedTotal}
                </span>
                <span className="text-base sm:text-lg font-bold text-zinc-500 uppercase tracking-wider">
                  / 90
                </span>
              </div>

              <motion.button 
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onConfirm) onConfirm();
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black cursor-pointer shadow-2xl transition-all duration-300 ${tier.btnBg}`}
                title="Подтвердить оценку"
              >
                <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5]" />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

const ArtworkLightbox: React.FC<{
  media: { url: string; title: string; subtitle?: string; type?: string } | null;
  onClose: () => void;
  onPlay?: () => void;
}> = ({ media, onClose, onPlay }) => {
  if (!media) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 max-w-sm sm:max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col items-center"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <CoverArt 
          url={media.url} 
          title={media.title}
          className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-zinc-800 border border-white/10 mb-5 relative group"
        >
          {onPlay && (
            <button 
              onClick={onPlay}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full theme-bg-accent shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer hover:opacity-90"
            >
              <Play className="w-6 h-6 text-black fill-black ml-0.5" />
            </button>
          )}
        </CoverArt>

        <div className="text-center w-full space-y-1 mb-5">
          {media.type && (
            <span className="text-[10px] uppercase font-bold tracking-widest theme-accent">
              {media.type}
            </span>
          )}
          <h3 className="text-xl md:text-2xl font-extrabold text-white truncate px-2">
            {media.title}
          </h3>
          {media.subtitle && (
            <p className="text-sm font-medium text-zinc-400 truncate px-2">
              {media.subtitle}
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full">
          {onPlay && (
            <button 
              onClick={onPlay} 
              className="flex-1 py-3 theme-bg-accent text-black font-bold rounded-xl text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 hover:opacity-90"
            >
              <Play className="w-4 h-4 fill-black" />
              Слушать
            </button>
          )}
          <button 
            onClick={onClose} 
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs md:text-sm transition-all cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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
                    setForm({ ...form, coverUrl: b64 });
                  }
                }} 
              />
              <span className="text-[10px] text-zinc-400 font-semibold">Нажмите для загрузки</span>
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
                  onClick={() => setForm({ ...form, plays: getRandomPlays() })}
                  className="text-[10px] theme-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  title="Случайные 200к - 15млн"
                >
                  <Dices className="w-3.5 h-3.5" /> 200к-15М
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
                    setForm({ ...form, coverUrl: b64 });
                  }
                }} 
              />
              <span className="text-[10px] text-zinc-400 font-semibold">Нажмите для загрузки</span>
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
    </div>
  );
};

// --- Edit Artist Modal ---

const EditArtistModal: React.FC<{
  isOpen: boolean;
  artist: Artist | null;
  onClose: () => void;
  onSave: (artist: Artist) => void;
}> = ({ isOpen, artist, onClose, onSave }) => {
  if (!isOpen || !artist) return null;

  const [form, setForm] = useState({
    name: artist.name,
    bio: artist.bio || '',
    genre: artist.genre || '',
    followers: formatNumber(artist.followers || 0),
    country: artist.country || '',
    verified: Boolean(artist.verified),
    imageUrl: artist.imageUrl || '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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
                    setForm({ ...form, imageUrl: b64 });
                  }
                }} 
              />
              <span className="text-[10px] text-zinc-400 font-semibold">Нажмите для загрузки</span>
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
    </div>
  );
};

// --- Action Menu Modal (Triggered by 3-dots) ---

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
  onGoToArtist?: () => void;
  onToggleLike?: () => void;
  isLiked?: boolean;
  onDelete?: () => void;
  type: 'track' | 'album' | 'artist';
}> = ({ isOpen, onClose, title, subtitle, featuredArtist, artists = [], navigateTo, coverUrl, onEdit, onCopyLink, onGoToArtist, onToggleLike, isLiked, onDelete, type }) => {
  if (!isOpen) return null;
  const labelType = type === 'track' ? 'трек' : type === 'album' ? 'альбом' : 'артиста';

  const featNames = featuredArtist ? featuredArtist.split(',').map(s => s.trim()).filter(Boolean) : [];

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
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Вы уверены, что хотите удалить ${labelType} «${title}»?`)) {
                  onClose();
                  onDelete();
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Удалить {labelType}</span>
            </button>
          )}
        </div>
      </div>
    </div>
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
  size?: 'sm' | 'lg';
  albums?: Album[];
  artists?: Artist[];
  navigateTo?: (view: ViewType, params?: { id?: string; artistName?: string }) => void;
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
  size = 'sm',
  albums = [],
  artists = [],
  navigateTo
}) => {
  const isLarge = size === 'lg';
  const resolvedCover = getTrackCover(track, albums);
  // Cap animation delay to prevent frame drops in long lists
  const animDelay = Math.min(index, 12) * 0.015;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.2 }}
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.07)' }}
      whileTap={{ scale: 0.99 }}
      onClick={() => {
        if (onTrackClick) onTrackClick();
        else onPlay();
      }}
      className={`group grid ${isLarge ? 'grid-cols-[36px_1fr_40px_70px] md:grid-cols-[40px_1fr_140px_120px]' : 'grid-cols-[30px_1fr_40px_60px] md:grid-cols-[36px_1fr_120px_100px]'} gap-3 md:gap-4 items-center ${isLarge ? 'px-3 md:px-4 py-2.5 md:py-3' : 'px-2 md:px-3 py-2 md:py-2.5'} rounded-xl md:rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5 active:bg-zinc-800/60`}
      style={{ borderRadius: `calc(1rem * var(--radius-factor))` }}
    >
      {/* Index or Play button */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
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
            <span className={`${isLarge ? 'text-xs md:text-sm' : 'text-xs'} text-zinc-400 group-hover:hidden font-semibold tabular-nums`}>
              {index + 1}
            </span>
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
          className={`${isLarge ? 'w-12 h-12 md:w-14 md:h-14' : 'w-11 h-11 md:w-12 md:h-12'} bg-zinc-800 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-white/5 relative group/img cursor-pointer`}
          showZoomIcon={true}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
            <span className={`${isLarge ? 'text-sm md:text-[15px]' : 'text-xs md:text-sm'} font-extrabold tracking-tight truncate ${isPlayingTrack ? 'theme-accent' : track.isLiked ? 'theme-accent' : 'text-zinc-100'} group-hover:text-white`}>
              {track.title}
            </span>
            {track.isExplicit && <span className="bg-zinc-600/90 text-white text-[8px] md:text-[9px] font-bold px-1 rounded flex-shrink-0">E</span>}
            {track.genre && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-white/5 text-[9px] text-zinc-400 font-semibold rounded">
                {track.genre}
              </span>
            )}
            {track.rating && <RatingScoreBadge rating={track.rating} size="sm" />}
          </div>
          <div className="flex items-center gap-1 overflow-hidden mt-0.5">
            <span className={`${isLarge ? 'text-xs md:text-[13px]' : 'text-[11px] md:text-xs'} text-zinc-400 font-medium truncate flex items-center`}>
              <span 
                onClick={(e) => {
                  if (onArtistClick) {
                    e.stopPropagation();
                    onArtistClick(track.artistName, track.artistId);
                  }
                }}
                className="hover:text-white hover:underline cursor-pointer"
                title="Перейти к артисту"
              >
                {track.artistName}
              </span>
              {track.featuredArtist && (
                <FeaturedArtistsLinks 
                  featuredArtist={track.featuredArtist} 
                  artists={artists} 
                  navigateTo={navigateTo || ((view, params) => { if (onArtistClick && params?.artistName) onArtistClick(params.artistName, params.id); })}
                  className="ml-1"
                />
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Plays Count */}
      <div className={`${isLarge ? 'text-xs md:text-sm' : 'text-xs'} text-zinc-400 text-right tabular-nums font-semibold hidden md:block`}>
        {!hideStats ? formatNumber(track.plays) : ''}
      </div>

      {/* Heart, Duration & 3-Dots Menu */}
      <div className="flex items-center justify-end gap-2 md:gap-3">
        <Heart 
          onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
          className={`w-4 h-4 transition-all hover:scale-125 cursor-pointer ${track.isLiked ? 'theme-accent fill-current opacity-100' : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white'}`} 
        />
        <span className="text-zinc-400 text-xs md:text-sm font-medium tabular-nums">{track.duration}</span>
        {onMoreOptionsClick && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoreOptionsClick(track); }}
            className="p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full hover:bg-white/10"
            title="Действия с треком"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const TrackRow = React.memo(TrackRowComponent);

// --- Settings Modal with Clear Separation: Text Size vs UI Scale vs Font Weight ---

const SettingsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  theme: ThemeConfig; 
  setTheme: (t: ThemeConfig) => void;
}> = ({ isOpen, onClose, theme, setTheme }) => {
  if (!isOpen) return null;

  const update = (key: keyof ThemeConfig, val: any) => setTheme({ ...theme, [key]: val });

  const applyPreset = (preset: ThemePreset) => {
    setTheme({
      ...theme,
      accentColor: preset.accentColor,
      bgColor: preset.bgColor,
      fontFamily: preset.fontFamily,
      radiusFactor: preset.radiusFactor,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Настройки оформления</h2>
            <p className="text-xs font-semibold text-zinc-400 mt-1">Персонализация размера текста, жирности, масштаба UI и темы</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
          {/* One-Click Presets */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 theme-accent" /> Готовые темы в один клик
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {THEME_PRESETS.map((p) => {
                const isActive = theme.bgColor === p.bgColor && theme.accentColor === p.accentColor;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                      isActive 
                        ? 'border-white bg-white/10 shadow-lg scale-102' 
                        : 'border-white/5 bg-black/30 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: p.accentColor }}></div>
                    <span className="text-xs font-bold text-white truncate w-full">{p.name}</span>
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

// --- Main App ---

export default function App() {
  const [nav, setNav] = useState<NavigationState>({ view: 'home' });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [history, setHistory] = useState<Array<NavigationState & { scrollY: number }>>([]);
  const [forwardHistory, setForwardHistory] = useState<Array<NavigationState & { scrollY: number }>>([]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Interactive player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerHidden, setIsPlayerHidden] = useState(false);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);
  const [enlargedMedia, setEnlargedMedia] = useState<{ url: string; title: string; subtitle?: string; type?: string } | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(32); // percentage for scrubber
  
  // Modals and 3-dots action menu state
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [actionMenuTarget, setActionMenuTarget] = useState<{
    type: 'track' | 'album' | 'artist';
    item: Track | Album | Artist;
  } | null>(null);
  const [quickRatingTarget, setQuickRatingTarget] = useState<{
    type: 'track' | 'album';
    item: Track | Album;
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
    setTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
    if (currentTrack && currentTrack.id === updatedTrack.id) {
      setCurrentTrack(updatedTrack);
    }
  };

  const handleSaveEditedAlbum = (updatedAlbum: Album) => {
    setAlbums(prev => prev.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
    setTracks(prev => prev.map(t => {
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

  const handleSaveEditedArtist = (updatedArtist: Artist) => {
    setArtists(prev => prev.map(a => a.id === updatedArtist.id ? updatedArtist : a));
    setTracks(prev => prev.map(t => t.artistId === updatedArtist.id ? { ...t, artistName: updatedArtist.name } : t));
    setAlbums(prev => prev.map(a => a.artistId === updatedArtist.id ? { ...a, artistName: updatedArtist.name } : a));
  };

  const handleDeleteItem = (type: 'track' | 'album' | 'artist', id: string) => {
    if (type === 'track') {
      setTracks(prev => prev.filter(t => t.id !== id));
      if (currentTrack?.id === id) setCurrentTrack(null);
    } else if (type === 'album') {
      setAlbums(prev => prev.filter(a => a.id !== id));
      setTracks(prev => prev.map(t => t.albumId === id ? { ...t, albumId: 'single', albumTitle: 'Single' } : t));
    } else if (type === 'artist') {
      setArtists(prev => prev.filter(a => a.id !== id));
    }
  };

  const isResizing = useRef(false);

  useEffect(() => {
    // Load Data asynchronously from IndexedDB
    dbGet('musaic_master_db').then(saved => {
      if (saved) {
        try {
          const { artists: a, albums: al, tracks: t, theme: th, followedArtistIds: f } = saved;
          if (a) setArtists(a);
          if (al) setAlbums(al);
          if (t) {
            const synced = syncTracksWithAlbumCovers(t, al || []);
            setTracks(synced);
            if (synced.length > 0) setCurrentTrack(synced[0]);
          }
          if (th) setTheme({ ...DEFAULT_THEME, ...th });
          if (f) setFollowedArtistIds(f);
        } catch (e) { console.error(e); }
      } else {
        // Fallback to localStorage if available
        const savedData = localStorage.getItem('musaic_master_db');
        if (savedData) {
          try {
            const { artists: a, albums: al, tracks: t, theme: th, followedArtistIds: f } = JSON.parse(savedData);
            if (a) setArtists(a);
            if (al) setAlbums(al);
            if (t) {
              const synced = syncTracksWithAlbumCovers(t, al || []);
              setTracks(synced);
              if (synced.length > 0) setCurrentTrack(synced[0]);
            }
            if (th) setTheme({ ...DEFAULT_THEME, ...th });
            if (f) setFollowedArtistIds(f);
          } catch (e) { console.error(e); }
        }
      }
    });

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
      // Build a map for O(1) lookups by ID and title
      const idMap = new Map();
      const titleMap = new Map();
      albums.forEach(a => {
        idMap.set(String(a.id), a);
        titleMap.set(a.title.toLowerCase().trim(), a);
      });

      let hasUpdates = false;
      const updatedTracks = tracks.map(t => {
        // Try fast lookup first
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
    const timer = setTimeout(() => {
      dbSet('musaic_master_db', { artists, albums, tracks, theme, followedArtistIds });
    }, 500);
    
    // Apply Theme to DOM
    const root = document.documentElement;
    root.style.fontSize = `${16 * theme.textScale}px`;
    root.style.setProperty('--bg-color', theme.bgColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-glow', `${theme.accentColor}${theme.glowEnabled ? '80' : '00'}`);
    root.style.setProperty('--text-scale', theme.textScale.toString());
    root.style.setProperty('--ui-scale', theme.uiScale.toString());
    root.style.setProperty('--radius-factor', theme.radiusFactor.toString());
    root.style.setProperty('--blur-intensity', `${theme.blurIntensity}px`);
    root.style.setProperty('--font-main', theme.fontFamily);
    root.style.setProperty('--letter-spacing', `${theme.letterSpacing}em`);
    root.style.setProperty('--font-weight', theme.fontWeight.toString());
    root.style.setProperty('--card-opacity', theme.cardOpacity.toString());
    root.style.setProperty('--player-height', `${theme.playerHeight}px`);
    root.style.setProperty('--header-blur', `${theme.headerBlur}px`);
    root.style.setProperty('--anim-speed', `${theme.animationSpeed}s`);
    document.body.style.backgroundColor = theme.bgColor;
    document.body.style.fontFamily = theme.fontFamily;
    return () => clearTimeout(timer);
  }, [artists, albums, tracks, theme, followedArtistIds]);

  // Navigation with Scroll Position Restoration (Solves Request 7)
  const navigateTo = React.useCallback((view: ViewType, params?: { id?: string; tab?: string; genre?: string; artistName?: string }) => {
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

  const restoreScrollPosition = (targetY: number) => {
    // Multi-phase restoration ensures position is restored even if DOM re-renders asynchronously
    [10, 50, 120, 250].forEach(delay => {
      setTimeout(() => {
        if (contentScrollRef.current) {
          contentScrollRef.current.scrollTo({ top: targetY || 0, behavior: 'instant' });
        }
      }, delay);
    });
  };

  const goBack = () => {
    if (history.length > 0) {
      const currentScrollY = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;
      const prevItem = history[history.length - 1];
      setForwardHistory(fwd => [...fwd, { ...nav, scrollY: currentScrollY }]);
      setHistory(prev => prev.slice(0, -1));
      setNav({ view: prevItem.view, params: prevItem.params });
      restoreScrollPosition(prevItem.scrollY || 0);
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

  const playTrack = (track: Track) => {
    const resolvedCover = getTrackCover(track, albums);
    setCurrentTrack({ ...track, coverUrl: resolvedCover });
    setIsPlaying(true);
    if (isPlayerHidden) setIsPlayerHidden(false);
  };

  const togglePlay = () => {
    if (!currentTrack && tracks.length > 0) {
      setCurrentTrack(tracks[0]);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const playNextTrack = () => {
    if (tracks.length === 0) return;
    const currentIndex = currentTrack ? tracks.findIndex(t => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevTrack = () => {
    if (tracks.length === 0) return;
    const currentIndex = currentTrack ? tracks.findIndex(t => t.id === currentTrack.id) : -1;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
    setIsPlaying(true);
  };

  const toggleLikeTrack = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, isLiked: !t.isLiked, likes: t.isLiked ? t.likes - 1 : t.likes + 1 } : t));
    if (currentTrack && currentTrack.id === id) {
      setCurrentTrack(prev => prev ? { ...prev, isLiked: !prev.isLiked } : null);
    }
  };

  const toggleLikeAlbum = (id: string) => {
    setAlbums(prev => prev.map(a => a.id === id ? { ...a, isLiked: !a.isLiked } : a));
  };

  const toggleFollowArtist = (artistId: string) => {
    setFollowedArtistIds(prev => 
      prev.includes(artistId) ? prev.filter(id => id !== artistId) : [...prev, artistId]
    );
  };

  const openLightbox = (media: { url: string; title: string; subtitle?: string; type?: string }) => {
    setEnlargedMedia(media);
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick, compact = false, customBadge }: { icon: any, label: string, active: boolean, onClick: () => void, compact?: boolean, customBadge?: React.ReactNode }) => (
    <button 
      onClick={onClick} 
      className={`flex items-center transition-all group cursor-pointer ${
        compact 
          ? 'flex-col gap-1 px-1 py-1 justify-center flex-1' 
          : 'w-full gap-3.5 px-4 py-2.5'
      } ${active ? 'bg-white/10 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
      style={{ borderRadius: `calc(0.75rem * var(--radius-factor))` }}
    >
      {customBadge || <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${active ? 'theme-accent' : 'group-hover:text-white'}`} style={active ? { color: theme.accentColor } : {}} />}
      <span className={`font-semibold tracking-tight ${compact ? 'text-[9px]' : 'text-sm'}`}>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen text-zinc-100 select-none overflow-hidden flex-col md:flex-row bg-[var(--bg-color)]">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} setTheme={setTheme} />
      <ArtworkLightbox media={enlargedMedia} onClose={() => setEnlargedMedia(null)} onPlay={currentTrack ? () => playTrack(currentTrack) : undefined} />
      
      <aside 
        style={{ width: `${theme.sidebarWidth}px`, backgroundColor: theme.bgColor }} 
        className="hidden md:flex p-4 flex-col gap-3 border-r border-white/5 z-50 relative shrink-0"
      >
        <div className="p-2 mb-2 cursor-pointer group flex items-center justify-between" onClick={() => navigateTo('home')}>
          <h1 className="text-xl font-black flex items-center gap-2.5 tracking-tight group-hover:scale-102 transition-transform">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.accentColor }}>
              <Play className="w-4 h-4 text-black fill-black ml-0.5" />
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">Musaic</span>
          </h1>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <SidebarItem icon={Home} label="Главная" active={nav.view === 'home'} onClick={() => navigateTo('home')} />
          <SidebarItem icon={TrendingUp} label="Чарты" active={nav.view === 'charts'} onClick={() => navigateTo('charts')} />
          <SidebarItem icon={Award} label="Рейтинг" active={nav.view === 'rating'} onClick={() => navigateTo('rating')} />
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
          <SidebarItem icon={Settings2} label="Создать контент" active={nav.view === 'creator'} onClick={() => navigateTo('creator')} />
          <SidebarItem icon={Palette} label="Оформление" active={isSettingsOpen} onClick={() => setIsSettingsOpen(true)} />
        </div>
        
        {/* Core Stats Box */}
        <div className="mt-auto p-4 bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-2xl">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2.5">Коллекция</p>
          <div className="space-y-1.5 text-xs text-zinc-400 font-medium">
            <div className="flex justify-between"><span>Артисты</span> <span className="text-white font-bold">{artists.length}</span></div>
            <div className="flex justify-between"><span>Альбомы</span> <span className="text-white font-bold">{albums.length}</span></div>
            <div className="flex justify-between"><span>Треки</span> <span className="text-white font-bold">{tracks.length}</span></div>
            <div className="flex justify-between"><span>Подписки</span> <span className="text-[#1ed760] font-bold">{followedArtistIds.length}</span></div>
          </div>
        </div>

        <div onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'col-resize'; }} className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#1ed760]/50 opacity-20 transition-all"></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header 
          style={{ backdropFilter: `blur(var(--header-blur))` }}
          className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 bg-black/40 border-b border-white/5"
        >
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden max-w-[70%]">
            <button 
              onClick={goBack} 
              disabled={history.length === 0} 
              className={`p-2 rounded-full transition-all border shrink-0 ${
                history.length > 0 
                  ? 'bg-zinc-900/80 hover:bg-black border-white/10 cursor-pointer text-white shadow-md active:scale-95' 
                  : 'bg-black/20 opacity-20 cursor-not-allowed border-transparent text-zinc-600'
              }`}
              title="Назад"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 h-5" />
            </button>
            <button 
              onClick={goForward} 
              disabled={forwardHistory.length === 0} 
              className={`hidden md:block p-2 rounded-full transition-all border shrink-0 ${
                forwardHistory.length > 0 
                  ? 'bg-zinc-900/80 hover:bg-black border-white/10 cursor-pointer text-white shadow-md active:scale-95' 
                  : 'bg-black/20 opacity-20 cursor-not-allowed border-transparent text-zinc-600'
              }`}
              title="Вперед"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {nav.view === 'search' && (
              <div className="relative shrink min-w-0">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Что вы хотите послушать?" 
                  className="bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 rounded-full py-1.5 pl-9 md:pl-10 pr-4 md:pr-6 w-full max-w-[220px] md:w-80 text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-[#1ed760] transition-all" 
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Настройки оформления"
            >
              <Palette className="w-4 h-4" />
            </button>
            <div className="bg-zinc-900 border border-white/5 px-3 md:px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 tracking-tight shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse"></span>
              <span>Pro Studio</span>
            </div>
          </div>
        </header>

        <div ref={contentScrollRef} className={`flex-1 overflow-y-auto ${isPlayerHidden ? 'pb-20' : 'pb-36'} scroll-smooth custom-scrollbar`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={nav.view + (nav.params?.id || '')}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-full"
            >
              {nav.view === 'home' && (
                <HomeView 
                  artists={artists} 
                  albums={albums} 
                  tracks={tracks} 
                  navigateTo={navigateTo} 
                  onPlayTrack={playTrack}
                  toggleLikeTrack={toggleLikeTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                />
              )}
              {nav.view === 'charts' && (
                <ChartsView 
                  artists={artists} 
                  albums={albums} 
                  tracks={tracks} 
                  navigateTo={navigateTo} 
                  onPlayTrack={playTrack}
                  toggleLikeTrack={toggleLikeTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  followedArtistIds={followedArtistIds}
                  toggleFollowArtist={toggleFollowArtist}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                />
              )}
              {nav.view === 'rating' && (
                <RatingView 
                  tracks={tracks}
                  albums={albums}
                  artists={artists}
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  toggleLikeTrack={toggleLikeTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                />
              )}
              {nav.view === 'artist' && (
                <ArtistView 
                  id={nav.params?.id || ''} 
                  artists={artists} 
                  albums={albums} 
                  tracks={tracks} 
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
                  artists={artists} 
                  tracks={tracks} 
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
                  id={nav.params?.id || ''} 
                  albums={albums} 
                  tracks={tracks} 
                  artists={artists}
                  toggleLikeTrack={toggleLikeTrack} 
                  toggleLikeAlbum={toggleLikeAlbum} 
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'album', item })}
                  onRateClick={(item: Album) => setQuickRatingTarget({ type: 'album', item })}
                />
              )}
              {nav.view === 'track' && (
                <TrackPage 
                  id={nav.params?.id || ''} 
                  tracks={tracks} 
                  albums={albums} 
                  artists={artists} 
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
                  artists={artists}
                  albums={albums}
                  tracks={tracks}
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
                  artists={artists} 
                  setArtists={setArtists} 
                  albums={albums} 
                  setAlbums={setAlbums} 
                  tracks={tracks} 
                  setTracks={setTracks} 
                  initialTab={nav.params?.id ? (artists.find(a => a.id === nav.params?.id) ? 'artist' : 'album') : 'artist'} 
                  targetId={nav.params?.id} 
                />
              )}
              {nav.view === 'library' && (
                <LibraryView 
                  albums={albums} 
                  artists={artists} 
                  tracks={tracks} 
                  navigateTo={navigateTo}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                />
              )}
              {nav.view === 'search' && (
                <SearchView 
                  query={searchQuery} 
                  artists={artists} 
                  albums={albums} 
                  tracks={tracks} 
                  navigateTo={navigateTo} 
                  toggleLikeTrack={toggleLikeTrack}
                  onPlayTrack={playTrack}
                  openLightbox={openLightbox}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onMoreOptionsClick={(item: any) => setActionMenuTarget({ type: 'track', item })}
                  initialTab={nav.params?.tab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modals for Edit and 3-Dots Action Menu */}
        <EditTrackModal 
          isOpen={Boolean(editingTrack)} 
          track={editingTrack} 
          onClose={() => setEditingTrack(null)} 
          onSave={handleSaveEditedTrack} 
          artists={artists} 
          albums={albums} 
        />

        <EditAlbumModal 
          isOpen={Boolean(editingAlbum)} 
          album={editingAlbum} 
          onClose={() => setEditingAlbum(null)} 
          onSave={handleSaveEditedAlbum} 
          artists={artists} 
        />

        <EditArtistModal 
          isOpen={Boolean(editingArtist)} 
          artist={editingArtist} 
          onClose={() => setEditingArtist(null)} 
          onSave={handleSaveEditedArtist} 
        />

        {actionMenuTarget && (
          <ActionMenuModal 
            isOpen={Boolean(actionMenuTarget)} 
            onClose={() => setActionMenuTarget(null)} 
            type={actionMenuTarget.type} 
            title={'name' in actionMenuTarget.item ? (actionMenuTarget.item as any).name : (actionMenuTarget.item as any).title} 
            subtitle={actionMenuTarget.type === 'track' ? (actionMenuTarget.item as Track).artistName : (actionMenuTarget.type === 'album' ? (actionMenuTarget.item as Album).artistName : undefined)} 
            featuredArtist={actionMenuTarget.type === 'track' ? (actionMenuTarget.item as Track).featuredArtist : undefined}
            artists={artists}
            navigateTo={navigateTo}
            coverUrl={'imageUrl' in actionMenuTarget.item ? (actionMenuTarget.item as any).imageUrl : (actionMenuTarget.item as any).coverUrl} 
            onEdit={() => {
              if (actionMenuTarget.type === 'track') setEditingTrack(actionMenuTarget.item as Track);
              else if (actionMenuTarget.type === 'album') setEditingAlbum(actionMenuTarget.item as Album);
              else if (actionMenuTarget.type === 'artist') setEditingArtist(actionMenuTarget.item as Artist);
            }} 
            onCopyLink={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Ссылка скопирована!');
            }} 
            onGoToArtist={actionMenuTarget.type === 'track' ? () => navigateTo('artist', { id: (actionMenuTarget.item as Track).artistId }) : (actionMenuTarget.type === 'album' ? () => navigateTo('artist', { id: (actionMenuTarget.item as Album).artistId }) : undefined)} 
            onToggleLike={actionMenuTarget.type === 'track' ? () => toggleLikeTrack((actionMenuTarget.item as Track).id) : (actionMenuTarget.type === 'album' ? () => toggleLikeAlbum((actionMenuTarget.item as Album).id) : undefined)} 
            isLiked={actionMenuTarget.type === 'track' ? (actionMenuTarget.item as Track).isLiked : (actionMenuTarget.type === 'album' ? (actionMenuTarget.item as Album).isLiked : undefined)} 
            onDelete={() => handleDeleteItem(actionMenuTarget.type, actionMenuTarget.item.id)} 
          />
        )}

        <QuickRatingModal 
          isOpen={Boolean(quickRatingTarget)} 
          type={quickRatingTarget?.type || 'track'} 
          item={quickRatingTarget?.item || null} 
          onClose={() => setQuickRatingTarget(null)} 
          onSave={handleSaveQuickRating} 
        />

        {/* Interactive Bottom Player Bar with Sync & Hide Support */}
        <AnimatePresence>
          {!isPlayerHidden && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ height: `var(--player-height)` }}
              className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-[#18181b]/95 backdrop-blur-[var(--blur-intensity)] border-t border-white/10 flex items-center justify-between px-4 md:px-8 z-[60] shadow-2xl"
            >
              {/* Left: Current Track Details */}
              <div className="flex items-center gap-3.5 w-[55%] sm:w-1/3 min-w-0">
                {currentTrack ? (
                  <>
                    <CoverArt 
                      url={getTrackCover(currentTrack, albums)} 
                      title={currentTrack.title}
                      className="w-12 h-12 md:w-14 md:h-14 bg-zinc-800 rounded-lg md:rounded-xl overflow-hidden shadow-xl shrink-0 group border border-white/10 cursor-pointer relative"
                      showZoomIcon={true}
                    />
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
                            artists={artists} 
                            navigateTo={navigateTo} 
                            className="text-zinc-400"
                          />
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleLikeTrack(currentTrack.id)}
                      className="ml-1 text-zinc-400 hover:text-white transition-all cursor-pointer p-1"
                    >
                      <Heart className={`w-4 h-4 ${currentTrack.isLiked ? 'text-[#1ed760] fill-current' : ''}`} />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 border border-white/5">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-400 truncate">Выберите трек</p>
                      <p className="text-[10px] text-zinc-500 truncate">Библиотека готова</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Center: Playback Controls & Scrubber */}
              <div className="flex flex-col items-center gap-1.5 w-[45%] sm:w-1/3 shrink-0">
                <div className="flex items-center gap-3 sm:gap-6">
                  <button 
                    onClick={() => {
                      if (tracks.length > 0) {
                        const random = tracks[Math.floor(Math.random() * tracks.length)];
                        playTrack(random);
                      }
                    }}
                    className="text-zinc-400 hover:text-white transition-all cursor-pointer hidden sm:block p-1" 
                    title="Перемешать"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={playPrevTrack}
                    className="text-zinc-300 hover:text-white transition-all cursor-pointer p-1"
                    title="Предыдущий трек"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={togglePlay}
                    className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:scale-108 active:scale-95 transition-all shadow-xl cursor-pointer"
                    title={isPlaying ? "Пауза" : "Воспроизвести"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-black fill-black" />
                    ) : (
                      <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    )}
                  </button>

                  <button 
                    onClick={playNextTrack}
                    className="text-zinc-300 hover:text-white transition-all cursor-pointer p-1"
                    title="Следующий трек"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={() => {}}
                    className="text-zinc-400 hover:text-white transition-all cursor-pointer hidden sm:block p-1" 
                    title="Повтор"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Timeline Scrubber */}
                <div className="hidden sm:flex items-center gap-2.5 w-full max-w-md">
                  <span className="text-[10px] text-zinc-400 font-mono tabular-nums">0:45</span>
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                      setPlaybackProgress(pct);
                    }}
                    className="h-1 flex-1 bg-zinc-700 hover:h-1.5 rounded-full overflow-hidden transition-all cursor-pointer group"
                  >
                    <div className="h-full bg-white group-hover:bg-[var(--accent-color)] transition-colors rounded-full" style={{ width: `${playbackProgress}%` }}></div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono tabular-nums">{currentTrack?.duration || '3:15'}</span>
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

                <div className="hidden md:flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <div className="w-16 h-1 bg-zinc-700 hover:h-1.5 rounded-full cursor-pointer overflow-hidden transition-all group">
                    <div className="w-4/5 h-full bg-white group-hover:bg-[var(--accent-color)]"></div>
                  </div>
                </div>

                {/* Hide Player Button */}
                <button 
                  onClick={() => setIsPlayerHidden(true)}
                  className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer"
                  title="Скрыть панель плеера"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Restore Player Button when hidden */}
        {isPlayerHidden && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsPlayerHidden(false)}
            className="fixed bottom-20 md:bottom-5 right-5 z-[80] bg-zinc-900/90 border border-white/15 hover:border-white/30 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'theme-bg-accent animate-pulse' : 'bg-zinc-500'}`}></span>
            <Music className="w-4 h-4 theme-accent" />
            <span className="text-xs font-bold truncate max-w-[140px]">
              {currentTrack ? currentTrack.title : 'Плеер'}
            </span>
            <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-white" />
          </motion.button>
        )}

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-xl border-t border-white/5 z-[70] flex items-center justify-around px-1">
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

function ChartsView({
  artists,
  albums,
  tracks,
  navigateTo,
  onPlayTrack,
  toggleLikeTrack,
  openLightbox,
  currentTrackId,
  isPlaying,
  followedArtistIds = [],
  toggleFollowArtist,
  onMoreOptionsClick
}: {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  onPlayTrack: (t: Track) => void;
  toggleLikeTrack: (id: string) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  followedArtistIds?: string[];
  toggleFollowArtist?: (id: string) => void;
  onMoreOptionsClick?: (item: any) => void;
}) {
  const [category, setCategory] = useState<'tracks' | 'albums' | 'artists'>('tracks');
  const [trackSort, setTrackSort] = useState<'hot' | 'allTime'>('hot');
  const [albumSort, setAlbumSort] = useState<'hot' | 'allTime'>('hot');
  const [artistSort, setArtistSort] = useState<'seasonal' | 'global'>('seasonal');

  const nowMs = useMemo(() => new Date().getTime(), []);

  // High-performance data indexing for Charts
  const chartDataMap = useMemo(() => {
    const trackCounts = new Map<string, number>();
    const albumCounts = new Map<string, number>();
    const totalPlays = new Map<string, number>();
    const recentPlays = new Map<string, number>();
    
    tracks.forEach(t => {
      const key = (t.artistId && t.artistId !== 'undefined') ? t.artistId : (t.artistName?.toLowerCase().trim() || '');
      trackCounts.set(key, (trackCounts.get(key) || 0) + 1);
      totalPlays.set(key, (totalPlays.get(key) || 0) + (t.plays || 0));
      
      if (t.releaseDate) {
        const diff = (nowMs - new Date(t.releaseDate).getTime()) / 86400000;
        if (diff <= 90) {
          recentPlays.set(key, (recentPlays.get(key) || 0) + (t.plays || 0));
        }
      }
    });

    albums.forEach(a => {
      const key = (a.artistId && a.artistId !== 'undefined') ? a.artistId : (a.artistName?.toLowerCase().trim() || '');
      albumCounts.set(key, (albumCounts.get(key) || 0) + 1);
    });

    return { trackCounts, albumCounts, totalPlays, recentPlays };
  }, [tracks, albums, nowMs]);

  // 1) Tracks Algorithm (В тренде gives massive weight to fresh release date):
  const rankedTracks = useMemo(() => [...tracks].map(t => {
    const relTime = t.releaseDate ? new Date(t.releaseDate).getTime() : (nowMs - 30 * 86400000);
    const diffDays = Math.max(1, Math.floor((nowMs - relTime) / 86400000));
    
    // Aggressive Recency Boost Multiplier: Fresh releases now climb MUCH higher in В тренде
    let recencyBoost = 1.0;
    if (diffDays <= 7) recencyBoost = 15.0;      // Massive boost for very new tracks
    else if (diffDays <= 30) recencyBoost = 8.5; // Strong boost for month-old tracks
    else if (diffDays <= 90) recencyBoost = 4.2; 
    else if (diffDays <= 180) recencyBoost = 2.0;
    else if (diffDays <= 365) recencyBoost = 1.0;
    else if (diffDays <= 730) recencyBoost = 0.25; // Sharp decay for old items
    else recencyBoost = 0.05;

    const hotScore = Math.round((t.plays * recencyBoost * 12) / Math.pow(diffDays + 2, 0.82));
    const playsPerDay = Math.round(t.plays / diffDays);
    return {
      ...t,
      diffDays,
      hotScore,
      playsPerDay,
      allTimeScore: t.plays
    };
  }).sort((a, b) => trackSort === 'hot' ? b.hotScore - a.hotScore : b.allTimeScore - a.allTimeScore), [tracks, trackSort, nowMs]);

  // 2) Albums Algorithm (Injected Aggressive Recency Weight):
  const rankedAlbums = useMemo(() => [...albums].map(al => {
    const albumTotalPlays = al.totalPlays || 0;
    const trackCount = 10; 
    const avgPerTrack = albumTotalPlays / trackCount;
    const fairPlays = Math.round((albumTotalPlays * 0.6) + (avgPerTrack * 5 * 0.4));
    const relTime = al.releaseDate ? new Date(al.releaseDate).getTime() : (nowMs - 45 * 86400000);
    const diffDays = Math.max(1, Math.floor((nowMs - relTime) / 86400000));
    
    // Recency Boost for Albums:
    let recencyBoost = 1.0;
    if (diffDays <= 14) recencyBoost = 12.0;     // Huge boost for new EPs/Albums
    else if (diffDays <= 30) recencyBoost = 7.0; 
    else if (diffDays <= 90) recencyBoost = 3.5;
    else if (diffDays <= 180) recencyBoost = 1.8;
    else if (diffDays <= 365) recencyBoost = 1.0;
    else recencyBoost = 0.3;

    const hotScore = Math.round((fairPlays * recencyBoost * 12) / Math.pow(diffDays + 6, 0.65));
    return {
      ...al,
      trackCount,
      totalPlays: albumTotalPlays,
      avgPerTrack,
      fairPlays,
      diffDays,
      hotScore
    };
  }).sort((a, b) => albumSort === 'hot' ? b.hotScore - a.hotScore : b.totalPlays - a.totalPlays), [albums, albumSort, nowMs]);

  // 3) Artists Algorithm (Hyper-Seasonal Discovery):
  const rankedArtists = useMemo(() => [...artists].map(art => {
    const key = art.id || (art.name?.toLowerCase().trim() || '');
    const artTrackCount = chartDataMap.trackCounts.get(key) || 0;
    const artAlbumCount = chartDataMap.albumCounts.get(key) || 0;
    const artTotalPlays = chartDataMap.totalPlays.get(key) || 0;
    const artRecentPlays = chartDataMap.recentPlays.get(key) || 0;

    // Seasonal score gives extreme weight to recent velocity (3.5 -> 5.5)
    // and slightly lowers the base followers weight to let active newcomers rise
    const seasonalScore = Math.round((artRecentPlays * 5.5) + (artTotalPlays * 0.1) + (art.followers * 120));
    const globalScore = Math.round((artTotalPlays * 0.75) + (art.followers * 250));
    return {
      ...art,
      trackCount: artTrackCount,
      albumCount: artAlbumCount,
      totalPlays: artTotalPlays,
      recentPlays: artRecentPlays,
      seasonalScore,
      globalScore
    };
  }).sort((a, b) => artistSort === 'seasonal' ? b.seasonalScore - a.seasonalScore : b.globalScore - a.globalScore), [artists, artistSort, chartDataMap]);




  // Performance Optimization: Incremental loading for Charts
  const visibleTracksCount = useVisibleCount(20, 20, rankedTracks.length);
  const visibleAlbumsCount = useVisibleCount(12, 12, rankedAlbums.length);
  const visibleArtistsCount = useVisibleCount(12, 12, rankedArtists.length);

  const displayedTracks = rankedTracks.slice(0, visibleTracksCount);
  const displayedAlbums = rankedAlbums.slice(0, visibleAlbumsCount);
  const displayedArtists = rankedArtists.slice(0, visibleArtistsCount);

  return (
    <div className="min-h-full pb-28">
      {/* Header Banner (Matches Home style) */}
      <div className="bg-gradient-to-b from-zinc-800/40 via-zinc-900/60 to-[var(--bg-color)] px-6 md:px-8 pt-8 pb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
          <div className="min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <div className="w-7 h-7 rounded-full theme-bg-accent flex items-center justify-center shadow-md">
                <TrendingUp className="w-4 h-4 text-black stroke-[3]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                Официальные рейтинги
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-2">
              Чарты
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 max-w-xl font-medium leading-relaxed">
              Динамический рейтинг треков, альбомов и артистов с учетом скорости прослушиваний и новизны релизов.
            </p>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-6">
        {/* Navigation Categories and Sub-Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          {/* Main 3 Categories */}
          <div className="flex gap-2 p-1 bg-zinc-900/70 rounded-2xl border border-white/10">
            {[
              { id: 'tracks', label: `Треки (${tracks.length})`, icon: Music },
              { id: 'albums', label: `Альбомы (${albums.length})`, icon: Disc },
              { id: 'artists', label: `Артисты (${artists.length})`, icon: User }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  category === tab.id 
                    ? 'theme-bg-accent text-black shadow-lg scale-102' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Sub Filters for Selected Category */}
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
            {category === 'tracks' && (
              <>
                <button
                  onClick={() => setTrackSort('hot')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    trackSort === 'hot' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 theme-accent" />
                  <span>В тренде (Hot Velocity)</span>
                </button>
                <button
                  onClick={() => setTrackSort('allTime')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trackSort === 'allTime' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>За все время</span>
                </button>
              </>
            )}

            {category === 'albums' && (
              <>
                <button
                  onClick={() => setAlbumSort('hot')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    albumSort === 'hot' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 theme-accent" />
                  <span>Свежие релизы (Хиты)</span>
                </button>
                <button
                  onClick={() => setAlbumSort('allTime')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    albumSort === 'allTime' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Все время</span>
                </button>
              </>
            )}

            {category === 'artists' && (
              <>
                <button
                  onClick={() => setArtistSort('seasonal')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    artistSort === 'seasonal' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 theme-accent" />
                  <span>Сезонный топ</span>
                </button>
                <button
                  onClick={() => setArtistSort('global')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    artistSort === 'global' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Глобальный топ</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Showcase */}
        <div className="pt-8">
          {category === 'tracks' && (
            <div className="space-y-6">
              {/* Top 3 Podium for Tracks if available */}
              {rankedTracks.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {rankedTracks.slice(0, 3).map((t, idx) => {
                    const badgeStyles = [
                      'from-amber-400/20 to-amber-600/5 border-amber-400/40 text-amber-300',
                      'from-slate-300/20 to-slate-500/5 border-slate-300/40 text-slate-200',
                      'from-amber-700/20 to-amber-900/5 border-amber-700/40 text-amber-400'
                    ][idx];
                    const rankLabels = ['#1 Золото', '#2 Серебро', '#3 Бронза'];
                    return (
                      <div 
                        key={t.id}
                        onClick={() => navigateTo('track', { id: t.id })}
                        className={`p-5 rounded-2xl bg-gradient-to-b ${badgeStyles} border backdrop-blur-xl relative group cursor-pointer transition-all hover:scale-102 shadow-xl flex flex-col justify-between`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 border border-white/10">
                            {rankLabels[idx]}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(t);
                            }}
                            className="w-10 h-10 rounded-full theme-bg-accent text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                          >
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                          <CoverArt 
                            url={t.coverUrl} 
                            title={t.title}
                            className="w-16 h-16 rounded-xl overflow-hidden shadow-lg bg-zinc-800 shrink-0 border border-white/10 relative group/cov"
                            innerClassName="group-hover/cov:scale-108"
                            showZoomIcon={true}
                          />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-base text-white truncate group-hover:underline">{t.title}</p>
                          <p 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (t.artistId) navigateTo('artist', { id: t.artistId, artistName: t.artistName });
                              else navigateTo('artist', { artistName: t.artistName });
                            }}
                            className="text-xs text-zinc-300 truncate mt-0.5 hover:text-white hover:underline cursor-pointer transition-colors"
                          >
                            {t.artistName}
                          </p>
                          {t.peakChartPosition && (
                            <span className="inline-block mt-1 text-[10px] font-bold theme-accent">Пик: #{t.peakChartPosition}</span>
                          )}
                        </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                          <span className="font-semibold text-white tabular-nums">{t.plays.toLocaleString('ru-RU')} прослушиваний</span>
                          <span className="font-mono text-[11px] theme-accent">
                            {trackSort === 'hot' ? `~${t.playsPerDay.toLocaleString('ru-RU')} / день` : t.duration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full Tracks Chart List */}
              <div className="space-y-1">
                {displayedTracks.map((track, i) => (
                  <TrackRow 
                    key={track.id} 
                    track={track} 
                    index={i} 
                    toggleLike={toggleLikeTrack} 
                    onTrackClick={() => navigateTo('track', { id: track.id })}
                    onPlay={() => onPlayTrack(track)} 
                    onArtworkClick={() => openLightbox({ url: track.coverUrl, title: track.title, subtitle: track.artistName, type: 'Трек' })}
                    isPlayingTrack={isPlaying && currentTrackId === track.id}
                    size="lg" 
                  />
                ))}
              </div>
            </div>
          )}

          {category === 'albums' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedAlbums.map((album, idx) => (
                <div 
                  key={album.id}
                  onClick={() => navigateTo('album', { id: album.id })}
                  className="p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <CoverArt 
                      url={album.coverUrl} 
                      title={album.title}
                      className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 shadow-xl bg-zinc-800 border border-white/5"
                      innerClassName="group-hover:scale-105 duration-300"
                    >
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-black text-white border border-white/10 z-20">
                        #{idx + 1}
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const albTrks = tracks.filter((t: any) => t.albumId === album.id);
                          if (albTrks.length > 0) onPlayTrack(albTrks[0]);
                          else navigateTo('album', { id: album.id });
                        }}
                        className="absolute bottom-3 right-3 w-12 h-12 rounded-full theme-bg-accent shadow-2xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-108 active:scale-95 cursor-pointer z-20"
                      >
                        <Play className="w-6 h-6 text-black fill-black ml-0.5" />
                      </button>
                    </CoverArt>

                    <h4 className="font-extrabold text-base text-white truncate group-hover:underline">{album.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-1 mt-1">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (album.artistId) navigateTo('artist', { id: album.artistId, artistName: album.artistName });
                          else navigateTo('artist', { artistName: album.artistName });
                        }}
                        className="text-xs text-zinc-400 hover:text-white hover:underline cursor-pointer transition-colors"
                      >
                        {album.artistName}
                      </span>
                      {album.coArtist && (
                        <>
                          <span className="text-zinc-500 text-xs">,</span>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo('artist', { artistName: album.coArtist });
                            }}
                            className="text-xs text-zinc-400 hover:text-white hover:underline cursor-pointer transition-colors"
                          >
                            {album.coArtist}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                    <span>{album.trackCount} {pluralizeTracks(album.trackCount)}</span>
                    <span className="font-bold text-white tabular-nums">{album.totalPlays.toLocaleString('ru-RU')} просл.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {category === 'artists' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedArtists.map((artist, idx) => (
                <div 
                  key={artist.id}
                  onClick={() => navigateTo('artist', { id: artist.id })}
                  className="p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-xl flex flex-col items-center text-center relative"
                >
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-black text-white border border-white/10">
                    #{idx + 1}
                  </div>

                  <CoverArt 
                    url={artist.imageUrl} 
                    title={artist.name} 
                    isArtist={true}
                    className="w-28 h-28 rounded-full mb-4 shadow-2xl bg-zinc-800 border-2 border-white/10" 
                    innerClassName="group-hover:scale-105 transition-transform duration-300"
                  />

                  <h4 className="font-black text-lg text-white truncate w-full group-hover:underline">{artist.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{formatListeners(artist.followers)}</p>

                  <div className="w-full mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                    <span>{artist.trackCount} треков</span>
                    <span className="font-bold text-white tabular-nums">{artist.totalPlays.toLocaleString('ru-RU')} просл.</span>
                  </div>

                  {toggleFollowArtist && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowArtist(artist.id);
                      }}
                      className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        followedArtistIds.includes(artist.id)
                          ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400'
                          : 'theme-bg-accent text-black hover:opacity-90'
                      }`}
                    >
                      {followedArtistIds.includes(artist.id) ? 'В подписках' : 'Подписаться'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  isPlaying
}: {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  onPlayTrack: (t: Track) => void;
  toggleLikeTrack: (id: string) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
}) {
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
    <div className="p-scale pb-28 space-y-10 animate-in">
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
  isPlaying, 
  onMoreOptionsClick 
}: {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  onPlayTrack: (t: Track) => void;
  toggleLikeTrack: (id: string) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onMoreOptionsClick?: (item: any) => void;
}) {
  const [trackSort, setTrackSort] = useState<'plays' | 'rating' | 'date' | 'alpha'>('plays');
  const [artistSort, setArtistSort] = useState<'followers' | 'rating' | 'alpha' | 'tracks'>('followers');
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [artistQuery, setArtistQuery] = useState('');

  const [freshSeed, setFreshSeed] = useState(() => Math.floor(Math.random() * 1000) + 1);

  // High-performance data indexing for O(1) lookups instead of O(N) searches
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

  // Dynamic selection of diversified recommendations (Solves Request 4: Mix of fresh and older)
  const homeRecommendations = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'album' | 'track';
      title: string;
      artistName: string;
      artistId?: string;
      coverUrl?: string;
      releaseDate?: string;
      rating?: RatingData;
      raw: Album | Track;
      weight: number;
    }> = [];

    const now = new Date().getTime();

    const processItem = (item: Album | Track, type: 'album' | 'track') => {
      const rel = item.releaseDate || '2025-01-01';
      const relTime = new Date(rel).getTime();
      const diffDays = Math.max(1, (now - relTime) / 86400000);
      
      // WEIGHTING LOGIC:
      // 1. Freshness factor: decays with time but stays relevant (logarithmic decay)
      const freshness = 100 / (Math.log10(diffDays + 1) + 1);
      
      // 2. Popularity / Quality factor:
      const score = item.rating?.totalScore || 60;
      const quality = (score / 90) * 50;
      
      // 3. Random jitter: ensure variety on each refresh
      const hash = (str: string) => {
        let h = 0; for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i); return Math.abs(h);
      };
      const jitter = (hash(item.id + freshSeed) % 100);

      const totalWeight = freshness + quality + jitter;

      list.push({
        id: item.id,
        type,
        title: item.title,
        artistName: item.artistName,
        artistId: item.artistId,
        coverUrl: type === 'track' ? getTrackCover(item as Track, albums) : (item as Album).coverUrl,
        releaseDate: item.releaseDate,
        rating: item.rating,
        raw: item,
        weight: totalWeight
      });
    };

    albums.forEach(al => processItem(al, 'album'));
    tracks.forEach(tr => processItem(tr, 'track'));

    // Sort by weight and pick top 6
    return list.sort((a, b) => b.weight - a.weight).slice(0, 6);
  }, [albums, tracks, freshSeed]);

  // 1) High-rated critic highlights (80-90 score)
  const criticPicks = useMemo(() => [
    ...tracks.filter((t: Track) => t.rating && t.rating.totalScore >= 70).map((t: Track) => ({
      type: 'track' as const,
      data: t,
      id: t.id,
      score: t.rating!.totalScore,
      title: t.title,
      subtitle: t.artistName,
      cover: getTrackCover(t, albums),
      plays: t.plays,
      rating: t.rating
    })),
    ...albums.filter((a: Album) => a.rating && a.rating.totalScore >= 70).map((a: Album) => ({
      type: 'album' as const,
      data: a,
      id: a.id,
      score: a.rating!.totalScore,
      title: a.title,
      subtitle: a.artistName,
      cover: a.coverUrl,
      plays: a.totalPlays || 0,
      rating: a.rating
    }))
  ].sort((a, b) => b.score - a.score).slice(0, 6), [tracks, albums]);

  // 2) Sorted tracks
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

  // 3) Sorted artists - OPTIMIZED using Maps
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


  // Performance: Incremental loading for home sections
  const visibleTracksCount = useVisibleCount(12, 12, filteredTracks.length);
  const visibleArtistsCount = useVisibleCount(8, 8, filteredArtists.length);

  const displayedTracks = showAllTracks ? filteredTracks.slice(0, visibleTracksCount) : sortedTracks.slice(0, 8);
  const displayedArtists = showAllArtists ? filteredArtists.slice(0, visibleArtistsCount) : sortedArtists.slice(0, 6);

  // 4) Fresh new releases
  const recentAlbums = [...albums].sort((a, b) => 
    new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime()
  ).slice(0, 6);

  return (
    <div className="p-scale space-y-12 pb-28">
      {/* Top Banner / Quick Picks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Главная</h2>
            <p className="text-sm md:text-base font-semibold text-zinc-300 mt-1 leading-relaxed">
              Актуальные релизы, экспертный разбор и чарты
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFreshSeed(s => s + 1)}
              className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
              title="Показать другие свежие релизы"
            >
              <Shuffle className="w-3.5 h-3.5 theme-accent" />
              <span>Обновить свежее</span>
            </button>
            <button
              onClick={() => navigateTo('search', { tab: 'dates' })}
              className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Calendar className="w-4 h-4 theme-accent" />
              <span>Календарь по датам</span>
            </button>
          </div>
        </div>

        {homeRecommendations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4">
            {homeRecommendations.map((rel, i: number) => {

              const isTrack = rel.type === 'track';
              return (
                <motion.div 
                  key={`${rel.type}-${rel.id}`} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateTo(isTrack ? 'track' : 'album', { id: rel.id })} 
                  className="group flex items-center gap-3.5 bg-zinc-900/70 p-3 rounded-2xl hover:bg-zinc-800/90 transition-all overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 shadow-lg relative"
                >
                  <CoverArt 
                    url={rel.coverUrl} 
                    title={rel.title}
                    className="w-16 h-16 md:w-20 md:h-20 shadow-2xl shrink-0 rounded-xl overflow-hidden relative cursor-pointer"
                    innerClassName="duration-300"
                  />
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                        {isTrack ? 'Сингл' : 'Альбом'}
                      </span>
                      {rel.releaseDate && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {rel.releaseDate.split('-')[0]}
                        </span>
                      )}
                    </div>
                    <p className="font-black text-sm md:text-[15px] text-white truncate group-hover:underline leading-snug">{rel.title}</p>
                    <p 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (rel.artistId) navigateTo('artist', { id: rel.artistId, artistName: rel.artistName });
                        else navigateTo('artist', { artistName: rel.artistName });
                      }}
                      className="text-xs md:text-sm font-semibold text-zinc-400 hover:text-white hover:underline cursor-pointer truncate mt-0.5"
                      title={`Перейти к артисту ${rel.artistName}`}
                    >
                      {rel.artistName}
                    </p>
                    {rel.rating && (
                      <div className="mt-1.5">
                        <RatingScoreBadge rating={rel.rating} size="sm" showDetailsOnHover={false} />
                      </div>
                    )}
                  </div>
                  <motion.div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isTrack) onPlayTrack(rel.raw as Track);
                      else navigateTo('album', { id: rel.id });
                    }}
                    className="mr-2 w-10 h-10 theme-bg-accent rounded-full flex items-center justify-center shadow-xl shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                    title={isTrack ? "Воспроизвести трек" : "Открыть альбом"}
                  >
                    <Play className="text-black fill-black ml-0.5 w-5 h-5" />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Critic Picks Highlight (90-point Evaluation) */}
      {criticPicks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-purple-500/10 border border-amber-400/20 shadow-2xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-lg">
                <Star className="w-5 h-5 fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-2xl font-black text-white">Выбор критиков • Топ баллы</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    90-балльная шкала
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">Релизы с наивысшими оценками экспертной комиссии</p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('rating')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>Все оценки в Рейтинге</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 md:gap-4">
            {criticPicks.map((pick) => (
              <div
                key={`${pick.type}-${pick.id}`}
                onClick={() => navigateTo(pick.type === 'track' ? 'track' : 'album', { id: pick.id })}
                className="p-3 bg-zinc-900/80 hover:bg-zinc-800/90 rounded-2xl border border-white/5 hover:border-amber-400/30 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 bg-zinc-800">
                    <CoverArt 
                      url={pick.cover} 
                      title={pick.title}
                      className="w-full h-full"
                      innerClassName="duration-300"
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <RatingScoreBadge rating={pick.rating} size="sm" showDetailsOnHover={false} />
                    </div>
                    {pick.type === 'track' && onPlayTrack && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPlayTrack(pick.data as Track); }}
                        className="absolute bottom-2 right-2 w-9 h-9 rounded-full theme-bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                      </button>
                    )}
                  </div>
                  <p className="font-extrabold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
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
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-zinc-400">
                  <span className="uppercase text-amber-400/80">{pick.type === 'track' ? 'Трек' : 'Альбом'}</span>
                  <span className="tabular-nums font-mono">{pick.score} / 90</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* POPULAR TRACKS SECTION with Sorting & Clickable Header to Open All */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pb-1 border-b border-white/5">
          {/* Header Title: Clickable to expand all tracks */}
          <div 
            onClick={() => setShowAllTracks(!showAllTracks)}
            className="cursor-pointer group flex items-center gap-3 select-none"
            title={showAllTracks ? "Свернуть к топ-8" : "Открыть все треки"}
          >
            <h3 className="text-xl md:text-3xl font-extrabold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
              <span>Популярные треки</span>
              <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white px-2.5 py-0.5 bg-white/5 rounded-full border border-white/10 transition-colors">
                {tracks.length}
              </span>
            </h3>
            <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-300 hidden sm:inline-block">
              {showAllTracks ? '• Свернуть' : '• Открыть все'}
            </span>
          </div>

          {/* Sort Controls & View All Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <span className="text-[10px] text-zinc-500 uppercase px-2 hidden sm:inline">Сорт:</span>
              {[
                { id: 'plays', label: 'По стримам' },
                { id: 'rating', label: 'По оценке' },
                { id: 'date', label: 'По дате' },
                { id: 'alpha', label: 'А-Я' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTrackSort(opt.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              onClick={() => setShowAllTracks(!showAllTracks)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              {showAllTracks ? `Свернуть (Топ 8)` : `Все треки (${tracks.length}) →`}
            </button>
          </div>
        </div>

        {/* Live Search within Tracks if Expanded */}
        {showAllTracks && (
          <div className="relative max-w-md pt-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="Поиск по всем трекам и артистам..."
              className="w-full bg-zinc-900/80 border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>
        )}

        {/* Track Rows List */}
        <div className="space-y-1 max-w-5xl">
          {displayedTracks.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Треки не найдены
            </div>
          ) : showAllTracks ? (
            <ProgressiveTrackList
              tracks={displayedTracks}
              initialBatchSize={50}
              incrementBatchSize={50}
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
      </motion.div>

      {/* POPULAR ARTISTS SECTION with Sorting & Clickable Header to Open All */}
      {artists.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pb-1 border-b border-white/5">
            {/* Header Title: Clickable to expand all artists */}
            <div 
              onClick={() => setShowAllArtists(!showAllArtists)}
              className="cursor-pointer group flex items-center gap-3 select-none"
              title={showAllArtists ? "Свернуть к топ-6" : "Открыть всех артистов"}
            >
              <h3 className="text-xl md:text-3xl font-extrabold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                <span>Популярные артисты</span>
                <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white px-2.5 py-0.5 bg-white/5 rounded-full border border-white/10 transition-colors">
                  {artists.length}
                </span>
              </h3>
              <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-300 hidden sm:inline-block">
                {showAllArtists ? '• Свернуть' : '• Открыть всех'}
              </span>
            </div>

            {/* Sort Controls & View All Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <span className="text-[10px] text-zinc-500 uppercase px-2 hidden sm:inline">Сорт:</span>
                {[
                  { id: 'followers', label: 'По слушателям' },
                  { id: 'rating', label: 'По оценке' },
                  { id: 'alpha', label: 'А-Я' },
                  { id: 'tracks', label: 'По трекам' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setArtistSort(opt.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      artistSort === opt.id 
                        ? 'theme-bg-accent text-black shadow-md' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAllArtists(!showAllArtists)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                {showAllArtists ? `Свернуть (Топ 6)` : `Все артисты (${artists.length}) →`}
              </button>
            </div>
          </div>

          {/* Live Search within Artists if Expanded */}
          {showAllArtists && (
            <div className="relative max-w-md pt-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                placeholder="Поиск артиста..."
                className="w-full bg-zinc-900/80 border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          )}

          {/* Artists Grid - Symmetrical Circular Avatars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {displayedArtists.map((artist: any, i: number) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ y: -6 }}
                onClick={() => navigateTo('artist', { id: artist.id })}
                className="flex flex-col items-center gap-3 cursor-pointer group p-3.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 transition-all text-center shadow-lg"
              >
                <div className="relative aspect-square w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shrink-0 mx-auto">
                  <CoverArt 
                    url={artist.imageUrl} 
                    title={artist.name}
                    isArtist={true}
                    className="w-full h-full rounded-full overflow-hidden shadow-2xl border-2 border-white/5 group-hover:border-[#1ed760] transition-all duration-300 relative"
                    innerClassName="group-hover:scale-108 duration-500"
                  />
                  {artist.avgScore > 0 && (
                    <div className="absolute bottom-0 right-0 z-10">
                      <RatingScoreBadge rating={{ totalScore: Math.round(artist.avgScore) } as any} size="sm" showDetailsOnHover={false} />
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <p className="font-bold text-sm md:text-base text-white truncate">{artist.name}</p>
                  <p className="text-[11px] font-bold text-zinc-400 mt-1 truncate">
                    {formatShortListeners(artist.followers)} • {artist.trackCount || 0} {pluralizeTracks(artist.trackCount || 0)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* RECENT RELEASES SECTION */}
      {recentAlbums.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xl md:text-3xl font-extrabold text-white">Свежие релизы</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Новые альбомы и синглы в каталоге</p>
            </div>
            <button
              onClick={() => navigateTo('search', { tab: 'dates' })}
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>По датам</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentAlbums.map((album: Album) => (
              <div 
                key={album.id}
                onClick={() => navigateTo('album', { id: album.id })}
                className="p-3 bg-zinc-900/40 hover:bg-zinc-800/80 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-800">
                    <CoverArt 
                      url={album.coverUrl} 
                      title={album.title}
                      className="w-full h-full"
                      innerClassName="group-hover:scale-105 duration-300"
                    />
                    {album.rating && (
                      <div className="absolute top-2 right-2 z-10">
                        <RatingScoreBadge rating={album.rating} size="sm" showDetailsOnHover={false} />
                      </div>
                    )}
                  </div>
                  <p className="font-extrabold text-sm text-white truncate group-hover:underline">{album.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{album.artistName}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                  <span>{album.releaseYear}</span>
                  <span className="truncate max-w-[80px]">{album.genre || 'Музыка'}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* RELEASE ARCHIVE CALENDAR PROMO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-black border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl"
      >
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 shadow-xl">
            <Calendar className="w-7 h-7 theme-accent" />
          </div>
          <div>
            <h4 className="text-lg md:text-xl font-black text-white">Хронологический архив по датам</h4>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-xl">
              Удобный календарный поиск: переключайте месяца и года (2021–2026), сортируйте релизы по прослушиваниям и дате выхода.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigateTo('search', { tab: 'dates' })}
          className="px-6 py-3 theme-bg-accent text-black font-extrabold text-xs md:text-sm rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer shrink-0"
        >
          <Calendar className="w-4 h-4 fill-black" />
          <span>Открыть календарь</span>
        </button>
      </motion.div>
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
  onMoreOptionsClick
}: {
  id?: string;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
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
  
  const artistAlbums = albums.filter((a: any) => a.artistId === artist.id || a.artistName?.toLowerCase() === artist.name.toLowerCase());
  const artistTracks = sortTracksByRelevance(
    tracks.filter((t: any) => 
      t.artistId === artist.id || 
      t.artistName?.toLowerCase() === artist.name.toLowerCase() ||
      (t.featuredArtist && t.featuredArtist.toLowerCase().includes(artist.name.toLowerCase()))
    )
  );
  
  const isFollowing = followedArtistIds.includes(artist.id);
  const [showAllTracks, setShowAllTracks] = useState(false);
  
  // Incremental loading for large discographies
  const visibleAlbumsCount = useVisibleCount(12, 12, artistAlbums.length);
  const visibleTracksCount = useVisibleCount(10, 10, artistTracks.length);
  const displayedAlbums = artistAlbums.slice(0, visibleAlbumsCount);
  
  const displayedTracks = showAllTracks ? artistTracks.slice(0, visibleTracksCount) : artistTracks.slice(0, 5);

  return (
    <div className="relative min-h-full pb-20">
      {/* Top Banner / Header (Spotify-style) */}
      <div className="relative bg-gradient-to-b from-zinc-700/50 via-zinc-900/60 to-[var(--bg-color)] px-6 md:px-8 pt-8 pb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Circular Artist Avatar */}
          <CoverArt 
            url={artist.imageUrl} 
            title={artist.name}
            className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full overflow-hidden shadow-2xl flex-shrink-0 bg-zinc-800 border border-white/10 relative cursor-pointer"
            innerClassName="group-hover:scale-105 transition-transform duration-300"
            showZoomIcon={true}
          />

          {/* Artist Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
            {artist.verified && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-2">
                <CheckCircle2 className="w-4 h-4 fill-sky-400 text-black" />
                <span>Подтвержденный исполнитель</span>
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-2 leading-none break-words">
              {artist.name}
            </h1>
            <p className="text-sm md:text-base font-normal text-zinc-300">
              {formatListeners(artist.followers)}
            </p>
            {(() => {
              const avg = getArtistAverageRating(artist.id, artist.name, tracks, albums);
              if (avg !== null) {
                return (
                  <div className="flex items-center gap-3 mt-4">
                    <RatingScoreBadge rating={{ totalScore: Math.round(avg) } as any} size="md" showDetailsOnHover={false} />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Средний балл</span>
                      <span className="text-[11px] font-bold text-zinc-400">Musaic Expert Rank</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Action Bar (Play, Shuffle, Follow, More) */}
        <div className="flex items-center gap-6 py-6">
          <button 
            onClick={() => artistTracks[0] && (onPlayTrack ? onPlayTrack(artistTracks[0]) : navigateTo('track', { id: artistTracks[0].id }))}
            className="w-14 h-14 rounded-full theme-bg-accent hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center cursor-pointer group"
            title="Воспроизвести"
          >
            <Play className="text-black fill-black ml-1 w-6 h-6" />
          </button>
          
          <button 
            onClick={() => {
              if (artistTracks.length > 0) {
                const randomTrack = artistTracks[Math.floor(Math.random() * artistTracks.length)];
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
            onClick={() => toggleFollowArtist && toggleFollowArtist(artist.id)}
            className={`px-4 py-1.5 rounded-full border text-xs md:text-sm font-semibold tracking-wide transition-all hover:scale-105 cursor-pointer ${
              isFollowing 
                ? 'border-white bg-white text-black font-bold' 
                : 'border-zinc-500 hover:border-white text-white'
            }`}
          >
            {isFollowing ? 'В подписках' : 'Подписаться'}
          </button>

          <button 
            onClick={() => onMoreOptionsClick && onMoreOptionsClick(artist)} 
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
            title="Действия с исполнителем"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Popular Tracks Section with Larger Covers and Fonts */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Популярные треки</h2>
          
          <div className="space-y-1">
            {displayedTracks.map((track: Track, i: number) => (
              <TrackRow 
                key={track.id} 
                track={track} 
                index={i} 
                toggleLike={toggleLikeTrack} 
                onTrackClick={() => navigateTo('track', { id: track.id })}
                onPlay={() => onPlayTrack ? onPlayTrack(track) : navigateTo('track', { id: track.id })} 
                onArtworkClick={() => openLightbox && openLightbox({ url: track.coverUrl, title: track.title, subtitle: track.artistName, type: 'Трек' })}
                isPlayingTrack={isPlaying && currentTrackId === track.id}
                size="lg" 
              />
            ))}
          </div>

          {artistTracks.length > 5 && (
            <button 
              onClick={() => setShowAllTracks(!showAllTracks)} 
              className="mt-3 px-4 py-2 text-xs md:text-sm font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {showAllTracks ? 'Свернуть' : 'Еще'}
            </button>
          )}
        </section>

        {/* Discography Section */}
        {artistAlbums.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Дискография</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedAlbums.map((album: any) => (
                <div 
                  key={album.id} 
                  onClick={() => navigateTo('album', { id: album.id })} 
                  className="p-3.5 bg-zinc-900/40 hover:bg-zinc-800/80 rounded-xl transition-all group cursor-pointer relative border border-white/5"
                >
                  <CoverArt 
                    url={album.coverUrl} 
                    title={album.title}
                    className="aspect-square w-full rounded-lg overflow-hidden mb-3 relative shadow-md bg-zinc-800"
                    innerClassName="group-hover:scale-105"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('album', { id: album.id });
                      }}
                      className="absolute bottom-2 right-2 w-10 h-10 rounded-full theme-bg-accent shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105"
                    >
                      <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </button>
                  </CoverArt>
                  <p className="font-semibold text-sm text-white truncate">{album.title}</p>
                  <p className="text-xs text-zinc-400 mt-1">{album.releaseYear} • Альбом</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">О себе</h2>
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900/60 p-6 md:p-8 max-w-3xl border border-white/5 group hover:border-white/10 transition-all">
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
  openLightbox 
}: {
  albums: Album[];
  artists: Artist[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const LibraryGrid = ({ items, type }: any) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((item: any) => (
        <div 
          key={item.id} 
          onClick={() => navigateTo(type === 'track' ? 'track' : (type === 'album' ? 'album' : 'artist'), { id: item.id })} 
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
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
              onClick={() => setActiveTab(t.id as any)} 
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { id: 'artists', label: 'Исполнители', count: artists.length, icon: User },
            { id: 'albums', label: 'Альбомы', count: albums.length, icon: Disc },
            { id: 'tracks', label: 'Треки', count: tracks.length, icon: Music }
          ].map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => setActiveTab(cat.id as any)} 
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

      {activeTab === 'artists' && <LibraryGrid items={artists} type="artist" />}
      {activeTab === 'albums' && <LibraryGrid items={albums} type="album" />}
      {activeTab === 'tracks' && <LibraryGrid items={tracks} type="track" />}
    </div>
  );
}

function CreatorHub({ artists, setArtists, albums, setAlbums, tracks, setTracks, initialTab = 'artist', targetId }: any) {
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
  
  const [formData, setFormData] = useState<any>({
    artistName: '', artistBio: '', artistGenre: '', artistFollowers: '0', artistVerified: true, artistImg: '', artistCountry: '', artistTrending: false,
    albumTitle: '', albumArtistId: targetId || '', customAlbumArtist: '', albumCoArtist: '', albumImg: '', albumYear: new Date().getFullYear(), albumDate: '', albumGenre: '', albumLabel: '', albumProducer: '', albumPeakChart: '',
    trackTitle: '', trackArtistId: targetId || '', customTrackArtist: '', trackAlbumId: '', trackDuration: getRandomDuration(), trackPlays: '0', trackLikes: '0', trackComposer: '', trackExplicit: false, trackImg: '', trackFit: '', trackYear: new Date().getFullYear(), trackDate: '', trackPeakChart: '',
    albumRating: undefined, trackRating: undefined
  });

  const [inlineTracks, setInlineTracks] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic calculation of total album plays
  const selectedExistingTracks = tracks.filter((t: any) => selectedExistingTrackIds.includes(t.id));
  const existingTracksPlaysSum = selectedExistingTracks.reduce((acc: number, t: any) => acc + (t.plays || 0), 0);
  const inlineTracksPlaysSum = inlineTracks.reduce((acc: number, t: any) => acc + parseFormattedNumber(t.plays), 0);
  const totalCalculatedAlbumPlays = existingTracksPlaysSum + inlineTracksPlaysSum;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSyncAllCovers = async () => {
    const synced = syncTracksWithAlbumCovers(tracks, albums);
    setTracks(synced);
    await dbSet('musaic_master_db', { artists, albums, tracks: synced });
    showToast(`✓ Обложки ${synced.length} треков синхронизированы с альбомами!`);
  };

  const exportData = () => {
    const data = { artists, albums, tracks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `musaic_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(async () => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const rawArtists = data.artists || artists;
          const rawAlbums = data.albums || albums;
          // Synchronize every existing track with album covers immediately on import!
          const syncedTracks = syncTracksWithAlbumCovers(data.tracks || tracks, rawAlbums);

          if (data.artists) setArtists(rawArtists);
          if (data.albums) setAlbums(rawAlbums);
          setTracks(syncedTracks);

          await dbSet('musaic_master_db', {
            artists: rawArtists,
            albums: rawAlbums,
            tracks: syncedTracks
          });

          showToast('✓ База данных импортирована, обложки треков синхронизированы!');
        } catch (err) {
          alert('Invalid JSON file or parsing error.');
        }
      }, 50);
    };
    reader.readAsText(file);
  };

  const fillRealisticStats = () => {
    if (activeTab === 'artist') {
      setFormData((prev: any) => ({ ...prev, artistFollowers: formatNumber(getRandomValue(5000, 50000000)) }));
    } else if (activeTab === 'track') {
      const plays = getRandomValue(50000, 100000000);
      setFormData((prev: any) => ({ ...prev, trackPlays: formatNumber(plays), trackLikes: formatNumber(Math.floor(plays * 0.04)) }));
    }
  };

  const randomizePlays = () => {
    const plays = getRandomValue(200000, 15000000);
    return formatNumber(plays);
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
    
    // Process selected existing tracks: update their albumId & albumTitle
    if (selectedExistingTrackIds.length > 0) {
      setTracks((prev: any) => prev.map((t: any) => {
        if (selectedExistingTrackIds.includes(t.id)) {
          return { ...t, albumId: albumId, albumTitle: formData.albumTitle, coverUrl: formData.albumImg || t.coverUrl };
        }
        return t;
      }));
    }

    // Process inline tracks
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

  const availableArtistTracks = tracks.filter((t: any) => t.artistId === formData.albumArtistId);

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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-zinc-900/40 p-6 md:p-8 rounded-3xl border border-white/10 gap-4 shadow-xl">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Студия создания</h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Публикация и управление артистами, альбомами и треками</p>
        </div>
        <div className="flex gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'artist', label: 'Артист' },
            { id: 'album', label: 'Альбом' },
            { id: 'track', label: 'Трек' },
            { id: 'manage', label: 'Управление' },
            { id: 'database', label: 'База данных' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => { setActiveTab(t.id as any); resetForm(); }} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id ? 'theme-bg-accent text-black shadow-md font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeTab === 'database' && (
          <div className="md:col-span-3 space-y-8 animate-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-white/10 rounded-3xl bg-zinc-900/50 shadow-xl justify-between">
                <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Download className="w-7 h-7 theme-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white mb-1.5">Экспорт базы данных</h3>
                  <p className="text-zinc-400 text-xs font-medium leading-relaxed">Скачайте полную медиатеку в виде JSON файла для резервной копии.</p>
                </div>
                <button onClick={exportData} className="w-full py-3 theme-bg-accent text-black font-extrabold rounded-2xl hover:opacity-90 transition-all cursor-pointer shadow-lg text-xs">Скачать бэкап</button>
              </div>

              <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-white/10 rounded-3xl bg-zinc-900/50 shadow-xl justify-between">
                <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center">
                  <FileUp className="w-7 h-7 theme-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white mb-1.5">Импорт базы данных</h3>
                  <p className="text-zinc-400 text-xs font-medium leading-relaxed">Восстановите библиотеку из JSON файла. Обложки треков синхронизируются автоматически.</p>
                </div>
                <label className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all cursor-pointer text-center block text-xs">
                  Загрузить файл
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>

              <div className="theme-card p-6 md:p-8 flex flex-col items-center text-center gap-5 border border-purple-500/20 rounded-3xl bg-purple-950/20 shadow-xl justify-between">
                <div className="w-14 h-14 bg-purple-900/40 rounded-full flex items-center justify-center border border-purple-500/30">
                  <Sparkles className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white mb-1.5">Синхронизация обложек</h3>
                  <p className="text-zinc-400 text-xs font-medium leading-relaxed">Автоматически присвоить всем трекам в базе официальные обложки из альбомов.</p>
                </div>
                <button onClick={handleSyncAllCovers} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-2xl transition-all cursor-pointer shadow-lg text-xs">
                  Синхронизировать обложки
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'manage' && activeTab !== 'database' && (
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
        {activeTab !== 'manage' && activeTab !== 'database' && (
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
                  <span className="text-xs font-bold text-white">Загрузить обложку</span>
                  <span className="text-[11px] text-zinc-500">Нажмите для выбора фото или изображения</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                Изменить обложку
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
                  setFormData({...formData, [activeTab === 'artist' ? 'artistImg' : (activeTab === 'album' ? 'albumImg' : 'trackImg')]: b}); 
                } 
              }} 
            />
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
                setFormData({ ...formData, albumCoArtist: picked.name });
              } else if (pickerTarget === 'trackArtist') {
                if (picked.id.startsWith('custom_')) {
                  setFormData({ ...formData, trackArtistId: '', customTrackArtist: picked.name });
                } else {
                  setFormData({ ...formData, trackArtistId: picked.id, customTrackArtist: '' });
                }
              } else if (pickerTarget === 'trackFeat') {
                setFormData({ ...formData, trackFit: picked.name });
              }
            }}
            title={
              pickerTarget === 'albumArtist' ? 'Основной исполнитель альбома' :
              pickerTarget === 'albumCoArtist' ? 'Приглашенный соавтор альбома' :
              pickerTarget === 'trackArtist' ? 'Основной исполнитель трека' :
              'Приглашенный артист на фит'
            }
          />
        )}
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
    <div className="min-h-full pb-24">
      {/* Top Banner (Spotify style) */}
      <div className="bg-gradient-to-b from-zinc-700/50 via-zinc-900/60 to-[var(--bg-color)] px-6 md:px-8 pt-8 pb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Square Cover with Clickable Lightbox */}
          <CoverArt 
            url={track.coverUrl} 
            title={track.title}
            className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-xl shadow-2xl flex-shrink-0 bg-zinc-800 overflow-hidden border border-white/10 relative cursor-pointer"
            innerClassName="group-hover:scale-105"
            showZoomIcon={true}
          />

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
              <span className="text-zinc-400">{track.releaseDate ? track.releaseDate.split('-')[0] : '2026'}</span>

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

          <button 
            onClick={() => onRateClick && onRateClick(track)} 
            className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 hover:border-amber-400/30 text-zinc-400 hover:text-white transition-all cursor-pointer group/rate shadow-xl active:scale-95 relative overflow-hidden"
            title="Оценить трек по 90-балльной системе"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 group-hover/rate:opacity-100 transition-opacity duration-500" />
            <Star className="w-4 h-4 group-hover/rate:fill-amber-400 transition-colors relative z-10" />
            <span className="text-xs font-black uppercase tracking-widest relative z-10">Оценить</span>
          </button>

          {track.rating && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative group/score"
            >
              <div className="absolute inset-0 rounded-full blur-xl opacity-20 group-hover/score:opacity-40 transition-opacity bg-current" style={{ color: track.rating.totalScore === 90 ? '#fbbf24' : track.rating.totalScore >= 80 ? '#a855f7' : track.rating.totalScore >= 70 ? '#2563eb' : '#10b981' }} />
              <RatingScoreBadge rating={track.rating} size="lg" />
            </motion.div>
          )}

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
                className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer group flex flex-col gap-5 shadow-2xl"
              >
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border-2 border-white/10 shadow-xl group-hover:scale-105 transition-transform">
                    <CoverArt 
                      url={artist?.imageUrl} 
                      title={artist?.name} 
                      isArtist={true} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">Исполнитель</span>
                    <p className="font-black text-2xl md:text-3xl text-white group-hover:underline truncate">{track.artistName}</p>
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
                    <span className="text-white font-semibold">{track.releaseDate || '2026-01-01'}</span>
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
              className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between gap-6 shadow-2xl"
            >
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border-2 border-white/10 shadow-xl group-hover:scale-105 transition-transform">
                    <CoverArt 
                      url={artist?.imageUrl} 
                      title={artist?.name} 
                      isArtist={true} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">Исполнитель</span>
                    <p className="font-black text-2xl md:text-3xl text-white group-hover:underline truncate">{track.artistName}</p>
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
                    <span className="text-white font-semibold">{track.releaseDate || '2026-01-01'}</span>
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
  onRateClick 
}: {
  id: string;
  albums: Album[];
  tracks: Track[];
  artists?: Artist[];
  toggleLikeTrack: (id: string) => void;
  toggleLikeAlbum: (id: string) => void;
  navigateTo: (view: ViewType, params?: { id?: string; artistName?: string; tab?: string; genre?: string }) => void;
  onPlayTrack: (t: Track) => void;
  openLightbox: (m: any) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onMoreOptionsClick?: (item: any) => void;
  onRateClick?: (item: any) => void;
}) {
  const [sortMode, setSortMode] = useState<'relevance' | 'added' | 'alpha'>('relevance');

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
      // Assuming 'added' means the order they appear in the master tracks array
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

  return (
    <div className="min-h-full pb-20">
      {/* Top Banner (Spotify style) */}
      <div className="bg-gradient-to-b from-zinc-700/50 via-zinc-900/60 to-[var(--bg-color)] px-6 md:px-8 pt-8 pb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Square Album Cover with Clickable Lightbox */}
          <CoverArt 
            url={album.coverUrl} 
            title={album.title}
            className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-xl shadow-2xl flex-shrink-0 bg-zinc-800 overflow-hidden border border-white/10 relative cursor-pointer"
            innerClassName="group-hover:scale-105"
            showZoomIcon={true}
          />

          {/* Album Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 flex-1">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">
              Альбом
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-3 leading-tight break-words">
              {album.title}
            </h1>

            {album.rating && (
              <div className="mb-4">
                <RatingScoreBadge rating={album.rating} size="lg" />
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 md:gap-2 text-xs md:text-sm text-zinc-300">
              <span 
                onClick={() => navigateTo('artist', { id: album.artistId, artistName: album.artistName })}
                className="font-bold text-white hover:underline cursor-pointer"
                title={`Перейти к артисту ${album.artistName}`}
              >
                {album.artistName}
              </span>
              {album.coArtist && (
                <>
                  <span className="text-zinc-400">, </span>
                  <span 
                    onClick={() => navigateTo('artist', { artistName: album.coArtist })}
                    className="font-bold text-white hover:underline cursor-pointer"
                    title={`Перейти к артисту ${album.coArtist}`}
                  >
                    {album.coArtist}
                  </span>
                </>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => sortedAlbumTracks[0] && (onPlayTrack ? onPlayTrack(sortedAlbumTracks[0]) : navigateTo('track', { id: sortedAlbumTracks[0].id }))}
              className="w-14 h-14 rounded-full theme-bg-accent hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center cursor-pointer group"
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

            <button 
              onClick={() => onRateClick && onRateClick(album)} 
              className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 hover:border-amber-400/30 text-zinc-400 hover:text-white transition-all cursor-pointer group/rate shadow-xl active:scale-95 relative overflow-hidden"
              title="Оценить альбом по 90-балльной системе"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 group-hover/rate:opacity-100 transition-opacity duration-500" />
              <Star className="w-4 h-4 group-hover/rate:fill-amber-400 transition-colors relative z-10" />
              <span className="text-xs font-black uppercase tracking-widest relative z-10">Оценить</span>
            </button>

            {album.rating && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group/score"
              >
                <div className="absolute inset-0 rounded-full blur-xl opacity-20 group-hover/score:opacity-40 transition-opacity bg-current" style={{ color: album.rating.totalScore === 90 ? '#fbbf24' : album.rating.totalScore >= 80 ? '#a855f7' : album.rating.totalScore >= 70 ? '#2563eb' : '#10b981' }} />
                <RatingScoreBadge rating={album.rating} size="lg" />
              </motion.div>
            )}

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
          <p>{album.releaseDate} • {album.genre || 'Музыка'}</p>
          <p className="text-zinc-400 font-semibold">
            Всего прослушиваний альбома: {totalAlbumPlays.toLocaleString('ru-RU')}
          </p>
          {album.producer && <p>Продюсер: {album.producer}</p>}
          {album.label && <p>© {album.releaseYear} {album.label}</p>}
        </div>
      </div>
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
  initialTab 
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
  onMoreOptionsClick?: (item: any) => void;
}) {
  const [subTab, setSubTab] = useState<string>(initialTab === 'dates' ? 'dates' : 'catalog');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

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
                              <div className="absolute top-2.5 right-2.5 z-10">
                                <RatingScoreBadge rating={rel.rating} size="sm" showDetailsOnHover={false} />
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
                            className="font-black text-sm md:text-base text-white truncate text-center group-hover:underline"
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
                          <span className="text-[10px] text-zinc-500 font-mono">{rel.releaseDate}</span>
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
