
export interface Artist {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
  genre: string;
  followers: number;
  verified: boolean;
  country?: string;
  isRisingStar?: boolean;
  hype?: number;
}

export interface RatingData {
  rhymes: number;       // 1-10
  structure: number;    // 1-10
  style: number;        // 1-10
  charisma: number;     // 1-10
  vibe: number;         // 1-10
  totalScore: number;   // 0-90
  nominations?: string[]; // Nominations list e.g. ["Трек года", "Лучший фит"]
}

export interface AlbumValueRating {
  albumId: string;
  rarityGenre: number; // 1-3
  rarityFormat: number; // 1-3
  rarityScore: number; // 1-5

  integrityFormat: number; // 1-2
  integrityGenre: number; // 1-3
  integrityMeaning: number; // 1-2
  integrityScore: number; // 1-5

  depthScore: number; // 1-5

  rhymes: number; // 1-10
  structure: number; // 1-10
  style: number; // 1-10
  charisma: number; // 1-10
  qualityPct: number; // e.g. 72.5%

  authorFame: number; // 1-5
  expectation: number; // 1-5
  influenceScore: number; // 1.12 - 2.00

  totalValue: number; // calculated score
  categoryKey: 'silver' | 'gold' | 'emerald' | 'sapphire' | 'ruby';
  categoryTitle: string; // 'Серебряный альбом' | 'Золотой альбом' | 'Изумрудный альбом' | 'Сапфировый альбом' | 'Рубиновый альбом'
  evaluationsCount?: number;
  reviewsCount?: number;
  updatedAt?: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseYear: number;
  releaseDate: string; // ISO Date String
  genre: string;
  isLiked: boolean;
  label?: string;
  producer?: string;
  coArtist?: string;
  peakChartPosition?: number;
  previousChartPosition?: number;
  weeksOnChart?: number;
  chartHistory?: number[];
  totalPlays?: number;
  rating?: RatingData;
  albumValue?: AlbumValueRating;
  intrinsicQuality?: number;
  simGenerated?: boolean;
  promoStrategy?: ReleasePromoStrategy;
  releaseHype?: number;
}

export type ReleasePromoStrategy =
  | 'quiet'
  | 'warmup'
  | 'playlist_push'
  | 'tiktok_trend'
  | 'viral_push'
  | 'feature_event'
  | 'scandal_pr'
  | 'radio_tour'
  | 'deluxe_wave'
  | 'mega_campaign';

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  duration: string;
  plays: number;
  likes: number;
  isLiked: boolean;
  releaseDate: string; // ISO Date String
  composer?: string;
  isExplicit?: boolean;
  coverUrl?: string;
  featuredArtist?: string;
  peakChartPosition?: number;
  previousChartPosition?: number;
  weeksOnChart?: number;
  chartHistory?: number[];
  genre?: string;
  rating?: RatingData;
  isSnippet?: boolean;
  snippetTeaser?: string;
  intrinsicQuality?: number;
  simGenerated?: boolean;
  promoStrategy?: ReleasePromoStrategy;
  releaseHype?: number;
}

export type ViewType = 'home' | 'charts' | 'search' | 'library' | 'artist' | 'album' | 'creator' | 'track' | 'artist_tracks' | 'likes' | 'rating' | 'album_value' | 'compare' | 'news';

export interface NavigationState {
  view: ViewType;
  params?: {
    id?: string;
    tab?: string;
    genre?: string;
    artistName?: string;
    year?: string;
    month?: string;
    mode?: 'artists' | 'albums';
    leftId?: string;
    rightId?: string;
    newsFilter?: string;
  };
}

export interface HomeViewProps {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string; tab?: string }) => void;
}

export interface ArtistViewProps {
  id: string;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  navigateTo: (view: ViewType, params?: { id?: string }) => void;
  toggleLikeTrack: (id: string) => void;
}

export interface AwardNominee {
  id?: string;
  type?: 'artist' | 'album' | 'track' | 'custom';
  title: string;
  artistName?: string;
  coverUrl?: string;
  votesPercent?: number;
  votesCount?: number;
}

export interface AwardItem {
  id: string;
  year: string;
  month?: string; // '01' - '12', or undefined if annual
  periodType: 'month' | 'year';
  nominationKey: string;
  nominationTitle: string;
  winner: {
    id?: string;
    type: 'artist' | 'album' | 'track' | 'custom';
    title: string;
    artistName?: string;
    coverUrl?: string;
    label?: string;
  };
  nominees?: AwardNominee[];
  description?: string;
  awardedAt?: string;
}

export type SimModeType = 'semi' | 'auto' | 'manual';
export type SimFuturePolicy = 'hidden' | 'scheduled';
export type SimIntensity = 'calm' | 'balanced' | 'active' | 'mega';
export type SimWeekEvent = 'normal' | 'collab_fest' | 'hot_drops' | 'quiet_week' | 'underground_wave';
export type SimLanguageMix = 'auto' | 'ru' | 'en' | 'mix';
export type SimFormatFocus = 'auto' | 'singles' | 'albums' | 'snippets';
export type SimCollabRate = 'low' | 'balanced' | 'high';
export type SimTierFocus = 'all' | 'stars' | 'rising' | 'comeback';
export type SimViralityLevel = 'stable' | 'balanced' | 'viral';
export type SimHypeRange = 'any' | 'low' | 'mid' | 'high';

export interface SimAutopilotConfig {
  intensity: SimIntensity;
  weekEvent: SimWeekEvent;
  languageMix: SimLanguageMix;
  formatFocus: SimFormatFocus;
  collabRate: SimCollabRate;
  allowSurpriseCollabs: boolean;
  tierFocus: SimTierFocus;
  virality: SimViralityLevel;
  enablePromoWaves: boolean;
  weeksCount: number;
  singlesCount?: number | null;
  epsCount?: number | null;
  albumsCount?: number | null;
  snippetsCount?: number | null;
  preferredArtistIds?: string[];
  hypeRange?: SimHypeRange;
}

export interface SimAlbumTrack {
  id: string;
  title: string;
  duration?: string;
  plays?: number;
  featuredArtist?: string;
  isExplicit?: boolean;
  isSurpriseFeat?: boolean;
}

export interface SimProposal {
  id: string;
  selected: boolean;
  itemType: 'track' | 'album' | 'snippet';
  releaseFormat?: 'single' | 'ep' | 'album' | 'snippet';
  artistId: string;
  artistName: string;
  featuredArtist?: string;
  coArtist?: string;
  title: string;
  coverUrl?: string;
  duration?: string;
  isExplicit?: boolean;
  promoBoost?: boolean;
  promoStrategy?: ReleasePromoStrategy;
  releaseHype?: number;
  albumTracksCount?: number;
  albumTrackTitles?: string[];
  albumTracks?: SimAlbumTrack[];
  genre: string;
  snippetTeaser?: string;
  estimatedPlays: number;
  qualityScore: number;
  artistHype: number;
  daysSilent: number;
  hasWarmupBoost: boolean;
  reason: string;
}

export interface SimWeeklyDropSummary {
  id: string;
  title: string;
  artistName: string;
  featuredArtist?: string;
  itemType: 'track' | 'album' | 'snippet';
  plays: number;
  coverUrl?: string;
  genre?: string;
  trackCount?: number;
}

export interface SimWeekDigest {
  weekNumber: number;
  fromDate: string;
  toDate: string;
  newReleasesCount: number;
  newSnippetsCount: number;
  topDebut?: {
    id: string;
    title: string;
    artistName: string;
    plays: number;
    type: 'track' | 'album' | 'snippet';
    coverUrl?: string;
  };
  biggestClimber?: {
    id: string;
    title: string;
    artistName: string;
    fromRank: number | null;
    toRank: number;
    delta: number;
  };
  topListenersGainers: Array<{
    artistId: string;
    name: string;
    delta: number;
    newFollowers: number;
  }>;
  topListenersLosers: Array<{
    artistId: string;
    name: string;
    delta: number;
    newFollowers: number;
  }>;
  highlights: string[];
  weeklyDrops?: SimWeeklyDropSummary[];
}

export interface SimHistorySnapshot {
  weekNumber: number;
  currentDate: string;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  awards: AwardItem[];
  digest?: SimWeekDigest;
}

export interface SimState {
  isActive: boolean;
  startDate: string;
  currentDate: string;
  weekNumber: number;
  futurePolicy: SimFuturePolicy;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  awards: AwardItem[];
  lastDigest?: SimWeekDigest;
  digestHistory?: SimWeekDigest[];
  undoStack: SimHistorySnapshot[];
}

export interface SimSaveSlot {
  id: string;
  name: string;
  savedAt: string;
  startDate: string;
  currentDate: string;
  weekNumber: number;
  futurePolicy: SimFuturePolicy;
  artistsCount: number;
  albumsCount: number;
  tracksCount: number;
  state: Omit<SimState, 'isActive'>;
}

