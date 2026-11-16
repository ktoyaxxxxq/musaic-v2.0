import { AwardItem, Artist, Album, Track } from './types';

export const AWARD_YEARS = ['2026', '2025', '2024', '2023', '2022', '2021'];

export const MONTH_NAMES_RU: Record<string, string> = {
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

export const MONTH_OPTIONS = [
  { key: 'all_months', label: 'Все премии года' },
  { key: 'year_review', label: 'Итоги года' },
  { key: '01', label: 'Январь' },
  { key: '02', label: 'Февраль' },
  { key: '03', label: 'Март' },
  { key: '04', label: 'Апрель' },
  { key: '05', label: 'Май' },
  { key: '06', label: 'Июнь' },
  { key: '07', label: 'Июль' },
  { key: '08', label: 'Август' },
  { key: '09', label: 'Сентябрь' },
  { key: '10', label: 'Октябрь' },
  { key: '11', label: 'Ноябрь' },
  { key: '12', label: 'Декабрь' },
];

export const MONTHLY_NOMINATIONS = [
  { key: 'artist_of_month', title: 'Артист месяца' },
  { key: 'album_of_month', title: 'Альбом месяца' },
  { key: 'track_of_month', title: 'Трек месяца' },
  { key: 'alt_track_of_month', title: 'Трек месяца (Альтернатива)' },
  { key: 'feature_of_month', title: 'Фит месяца' },
  { key: 'freshman_of_month', title: 'Фрешмен месяца' },
  { key: 'cover_of_month', title: 'Обложка месяца' },
];

export const ANNUAL_NOMINATIONS = [
  { key: 'artist_of_year', title: 'Артист года' },
  { key: 'album_of_year', title: 'Альбом года' },
  { key: 'track_of_year', title: 'Трек года' },
  { key: 'alt_track_of_year', title: 'Трек альтернатива года' },
  { key: 'feature_of_year', title: 'Фит года' },
  { key: 'freshman_of_year', title: 'Фрешмен года' },
  { key: 'cover_of_year', title: 'Обложка года' },
];

/**
 * INITIAL_AWARDS is empty by default so no foreign or uncataloged mock releases
 * ever pollute the user's database. Awards are built strictly from the user's catalog.
 */
export const INITIAL_AWARDS: AwardItem[] = [];

/**
 * Generates genuine awards strictly from existing catalog items (artists, albums, tracks).
 * Preserves actual artist avatars, album artworks, and track metadata from user's data.
 */
export function buildAwardsFromCatalog(
  artists: Artist[],
  albums: Album[],
  tracks: Track[]
): AwardItem[] {
  if (artists.length === 0 && albums.length === 0 && tracks.length === 0) {
    return [];
  }

  const awards: AwardItem[] = [];

  const periodMap = new Map<string, { year: string; month: string; tracks: Track[]; albums: Album[] }>();
  const yearMap = new Map<string, { year: string; tracks: Track[]; albums: Album[] }>();

  tracks.forEach(tr => {
    const d = tr.releaseDate || '';
    if (d.includes('-') && d.length >= 7) {
      const parts = d.split('-');
      const y = parts[0];
      const m = parts[1];
      if (y && m) {
        const key = `${y}-${m}`;
        if (!periodMap.has(key)) periodMap.set(key, { year: y, month: m, tracks: [], albums: [] });
        periodMap.get(key)!.tracks.push(tr);

        if (!yearMap.has(y)) yearMap.set(y, { year: y, tracks: [], albums: [] });
        yearMap.get(y)!.tracks.push(tr);
      }
    }
  });

  albums.forEach(al => {
    const d = al.releaseDate || (al.releaseYear ? `${al.releaseYear}-01-01` : '');
    if (d.includes('-') && d.length >= 7) {
      const parts = d.split('-');
      const y = parts[0];
      const m = parts[1] || '01';
      if (y) {
        const key = `${y}-${m}`;
        if (!periodMap.has(key)) periodMap.set(key, { year: y, month: m, tracks: [], albums: [] });
        periodMap.get(key)!.albums.push(al);

        if (!yearMap.has(y)) yearMap.set(y, { year: y, tracks: [], albums: [] });
        yearMap.get(y)!.albums.push(al);
      }
    }
  });

  // Dynamic realistic vote calculation based on nominee popularity/score/plays/followers
  const getRealisticVotes = (nominees: Array<{ score?: number; plays?: number; totalPlays?: number; followers?: number }>) => {
    const count = nominees.length;
    if (count === 1) return [{ percent: 100, votesCount: 2500000 }];

    const weights = nominees.map((n, i) => {
      let w = n.score || n.plays || n.totalPlays || n.followers || (100000 / (i + 1));
      if (i === 0) {
        const secondW = nominees[1]?.score || nominees[1]?.plays || nominees[1]?.totalPlays || nominees[1]?.followers || 50000;
        if (w <= secondW) w = secondW * (1.2 + Math.random() * 0.6);
      }
      return Math.max(1000, w);
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rawPercentages = weights.map(w => (w / totalWeight) * 100);
    
    let rounded = rawPercentages.map(p => Math.max(1, Math.round(p)));
    let sumRounded = rounded.reduce((a, b) => a + b, 0);
    
    if (sumRounded !== 100) {
      rounded[0] += (100 - sumRounded);
    }

    for (let i = 1; i < rounded.length; i++) {
      if (rounded[0] <= rounded[i]) {
        rounded[0] = rounded[i] + 1;
      }
    }
    sumRounded = rounded.reduce((a, b) => a + b, 0);
    if (sumRounded !== 100) {
      rounded[0] -= (sumRounded - 100);
    }

    const totalVotesPool = Math.round(3500000 + Math.random() * 11000000);

    return nominees.map((_, i) => {
      const percent = rounded[i];
      const votesCount = Math.round((percent / 100) * totalVotesPool);
      return { percent, votesCount };
    });
  };

  // 1. Annual Reviews
  yearMap.forEach(({ year, tracks: yTracks, albums: yAlbums }) => {
    if (year === '2026' || year === '2025') return;

    const sortedTracks = [...yTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0));
    const sortedAlbums = [...yAlbums].sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0));

    const artistScores = new Map<string, { artist: Artist; score: number }>();
    artists.forEach(a => {
      const aTracks = yTracks.filter(t => t.artistName === a.name);
      const aAlbums = yAlbums.filter(al => al.artistName === a.name);
      const score = (a.followers || 0) + aTracks.reduce((acc, t) => acc + (t.plays || 0), 0) + aAlbums.reduce((acc, al) => acc + (al.totalPlays || 0), 0);
      artistScores.set(a.name, { artist: a, score });
    });
    const topArtists = Array.from(artistScores.values()).sort((a, b) => b.score - a.score);

    // Order: 1) Artist -> 2) Album -> 3) Track -> 4) Alt Track -> 5) Feature -> 6) Freshman -> 7) Cover
    
    // 1. Artist
    if (topArtists.length > 0) {
      const winner = topArtists[0];
      const nominees = topArtists.slice(0, 5);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-annual-artist`,
        year, periodType: 'year', nominationKey: 'artist_of_year', nominationTitle: 'Артист года',
        winner: { type: 'artist', title: winner.artist.name, artistName: 'Исполнитель года', coverUrl: winner.artist.imageUrl },
        nominees: nominees.map((n, i) => ({ title: n.artist.name, artistName: 'Номинант', votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-12-31`
      });
    }

    // 2. Album
    if (sortedAlbums.length > 0) {
      const winner = sortedAlbums[0];
      const nominees = sortedAlbums.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-annual-album`,
        year, periodType: 'year', nominationKey: 'album_of_year', nominationTitle: 'Альбом года',
        winner: { type: 'album', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-12-31`
      });
    }

    // 3. Track
    if (sortedTracks.length > 0) {
      const winner = sortedTracks[0];
      const nominees = sortedTracks.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-annual-track`,
        year, periodType: 'year', nominationKey: 'track_of_year', nominationTitle: 'Трек года',
        winner: { type: 'track', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-12-31`
      });
    }

    // 4. Alternative Track
    let altTracks = yTracks.filter(t => {
      const art = artists.find(a => a.name === t.artistName);
      return art && (art.followers || 0) < 500000;
    }).sort((a, b) => (b.plays || 0) - (a.plays || 0));

    if (altTracks.length === 0 && sortedTracks.length > 1) {
      altTracks = sortedTracks.slice(1, 9);
    }

    if (altTracks.length > 0) {
      const winner = altTracks[0];
      const nominees = altTracks.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-annual-alt-track`,
        year, periodType: 'year', nominationKey: 'alt_track_of_year', nominationTitle: 'Трек альтернатива года',
        winner: { type: 'track', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-12-31`
      });
    }

    // 5. Feature
    const featTracks = yTracks.filter(t => t.featuredArtist).sort((a, b) => (b.plays || 0) - (a.plays || 0));
    if (featTracks.length > 0) {
      const winner = featTracks[0];
      const nominees = featTracks.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-annual-feature`,
        year, periodType: 'year', nominationKey: 'feature_of_year', nominationTitle: 'Фит года',
        winner: { type: 'track', title: winner.title, artistName: `${winner.artistName} feat. ${winner.featuredArtist}`, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: `${n.artistName} feat. ${n.featuredArtist}`, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-12-31`
      });
    }

    // 6. Freshman
    if (topArtists.length > 1) {
      let nominees = topArtists.filter(a => (a.artist.followers || 0) < 200000).slice(0, 8);
      if (nominees.length === 0) {
        nominees = topArtists.slice(1, 9);
      }

      if (nominees.length > 0) {
        const winner = nominees[0];
        const votes = getRealisticVotes(nominees);
        awards.push({
          id: `award-${year}-annual-freshman`,
          year, periodType: 'year', nominationKey: 'freshman_of_year', nominationTitle: 'Фрешмен года',
          winner: { type: 'artist', title: winner.artist.name, artistName: 'Открытие года', coverUrl: winner.artist.imageUrl },
          nominees: nominees.map((n, i) => ({ title: n.artist.name, artistName: 'Номинант', votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
          awardedAt: `${year}-12-31`
        });
      }
    }

    // 7. Cover
    if (sortedAlbums.length > 0) {
      const nominees = [...sortedAlbums].sort(() => Math.random() - 0.5).slice(0, 8);
      const winner = nominees[0];
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-annual-cover`,
        year, periodType: 'year', nominationKey: 'cover_of_year', nominationTitle: 'Обложка года',
        winner: { type: 'album', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-12-31`
      });
    }
  });

  // 2. Monthly Awards
  periodMap.forEach(({ year, month, tracks: mTracks, albums: mAlbums }) => {
    if (year === '2026') return;

    const sortedTracks = [...mTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0));
    const sortedAlbums = [...mAlbums].sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0));
    
    const artistScores = new Map<string, { artist: Artist; score: number }>();
    artists.forEach(a => {
      const aTracks = mTracks.filter(t => t.artistName === a.name);
      const aAlbums = mAlbums.filter(al => al.artistName === a.name);
      if (aTracks.length === 0 && aAlbums.length === 0) return;
      const score = (a.followers || 0) / 10 + aTracks.reduce((acc, t) => acc + (t.plays || 0), 0) + aAlbums.reduce((acc, al) => acc + (al.totalPlays || 0), 0);
      artistScores.set(a.name, { artist: a, score });
    });
    const monthTopArtists = Array.from(artistScores.values()).sort((a, b) => b.score - a.score);

    // Order: 1) Artist -> 2) Album -> 3) Track -> 4) Alt Track -> 5) Feature -> 6) Freshman -> 7) Cover

    // 1. Artist
    if (monthTopArtists.length > 0) {
      const winner = monthTopArtists[0];
      const nominees = monthTopArtists.slice(0, 5);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-${month}-artist`,
        year, month, periodType: 'month', nominationKey: 'artist_of_month', nominationTitle: 'Артист месяца',
        winner: { type: 'artist', title: winner.artist.name, artistName: 'Исполнитель месяца', coverUrl: winner.artist.imageUrl },
        nominees: nominees.map((n, i) => ({ title: n.artist.name, artistName: 'Номинант', votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-${month}-28`
      });
    }

    // 2. Album
    if (sortedAlbums.length > 0) {
      const winner = sortedAlbums[0];
      const nominees = sortedAlbums.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-${month}-album`,
        year, month, periodType: 'month', nominationKey: 'album_of_month', nominationTitle: 'Альбом месяца',
        winner: { type: 'album', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-${month}-28`
      });
    }

    // 3. Track
    if (sortedTracks.length > 0) {
      const winner = sortedTracks[0];
      const nominees = sortedTracks.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-${month}-track`,
        year, month, periodType: 'month', nominationKey: 'track_of_month', nominationTitle: 'Трек месяца',
        winner: { type: 'track', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-${month}-28`
      });
    }

    // 4. Alt Track
    let altTracks = mTracks.filter(t => {
      const art = artists.find(a => a.name === t.artistName);
      return art && (art.followers || 0) < 300000;
    }).sort((a, b) => (b.plays || 0) - (a.plays || 0));

    if (altTracks.length === 0 && sortedTracks.length > 1) {
      altTracks = sortedTracks.slice(1, 9);
    }

    if (altTracks.length > 0) {
      const winner = altTracks[0];
      const nominees = altTracks.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-${month}-alt-track`,
        year, month, periodType: 'month', nominationKey: 'alt_track_of_month', nominationTitle: 'Трек месяца (Альтернатива)',
        winner: { type: 'track', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-${month}-28`
      });
    }

    // 5. Feature
    const featTracks = mTracks.filter(t => t.featuredArtist).sort((a, b) => (b.plays || 0) - (a.plays || 0));
    if (featTracks.length > 0) {
      const winner = featTracks[0];
      const nominees = featTracks.slice(0, 8);
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-${month}-feature`,
        year, month, periodType: 'month', nominationKey: 'feature_of_month', nominationTitle: 'Фит месяца',
        winner: { type: 'track', title: winner.title, artistName: `${winner.artistName} feat. ${winner.featuredArtist}`, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: `${n.artistName} feat. ${n.featuredArtist}`, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-${month}-28`
      });
    }

    // 6. Freshman
    if (monthTopArtists.length > 1) {
      let nominees = monthTopArtists.filter(a => (a.artist.followers || 0) < 150000).slice(0, 8);
      if (nominees.length === 0) {
        nominees = monthTopArtists.slice(1, 9);
      }

      if (nominees.length > 0) {
        const winner = nominees[0];
        const votes = getRealisticVotes(nominees);
        awards.push({
          id: `award-${year}-${month}-freshman`,
          year, month, periodType: 'month', nominationKey: 'freshman_of_month', nominationTitle: 'Фрешмен месяца',
          winner: { type: 'artist', title: winner.artist.name, artistName: 'Новичок месяца', coverUrl: winner.artist.imageUrl },
          nominees: nominees.map((n, i) => ({ title: n.artist.name, artistName: 'Номинант', votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
          awardedAt: `${year}-${month}-28`
        });
      }
    }

    // 7. Cover
    if (sortedAlbums.length > 0) {
      const nominees = [...sortedAlbums].sort(() => Math.random() - 0.5).slice(0, 8);
      const winner = nominees[0];
      const votes = getRealisticVotes(nominees);
      awards.push({
        id: `award-${year}-${month}-cover`,
        year, month, periodType: 'month', nominationKey: 'cover_of_month', nominationTitle: 'Обложка месяца',
        winner: { type: 'album', title: winner.title, artistName: winner.artistName, coverUrl: winner.coverUrl },
        nominees: nominees.map((n, i) => ({ title: n.title, artistName: n.artistName, votesPercent: votes[i].percent, votesCount: votes[i].votesCount })),
        awardedAt: `${year}-${month}-28`
      });
    }
  });

  return awards;
}
