// Nominations that fit the release type (single / EP / album / mixtape / feat / snippet / artist).
// Used by RatingPanel. Pass as much context as you have, everything is optional.
export type RatingTarget = 'track' | 'album' | 'artist';

export interface NominationContext {
  trackCount?: number;      // album: number of tracks
  hasFeature?: boolean;     // track with feat / album with coArtist
  isSnippet?: boolean;
  isDebut?: boolean;        // first release of the artist
  genre?: string;
  isExplicit?: boolean;
}

export interface NominationGroup { title: string; items: string[] }

const ALT = /indie|инди|rock|рок|grunge|гранж|emo|эмо|punk|панк|alt|альт|hyper|хайпер|электро|electro|lo-?fi/i;

export function releaseFormat(target: RatingTarget, ctx: NominationContext = {}): string {
  if (target === 'artist') return 'Артист';
  if (target === 'track') return ctx.isSnippet ? 'Сниппет' : 'Трек';
  const n = ctx.trackCount || 0;
  if (n > 0 && n <= 3) return 'Сингл';
  if (n > 0 && n <= 7) return 'EP';
  return 'Альбом';
}

export function getNominationGroups(target: RatingTarget, ctx: NominationContext = {}): NominationGroup[] {
  const alt = ctx.genre ? ALT.test(ctx.genre) : false;
  if (target === 'artist') {
    return [
      { title: 'Главные', items: ['Артист года', 'Артист месяца', ctx.isDebut ? 'Фрешмен года' : 'Камбэк года', 'Фрешмен месяца'] },
      { title: 'Особые', items: ['Открытие года', 'Продюсер года', 'Лучший live', 'Самый стабильный', 'Лучший образ'] }
    ];
  }
  if (target === 'track') {
    const main = ctx.isSnippet
      ? ['Сниппет месяца', 'Самый ожидаемый трек', 'Лучший хук']
      : ['Трек года', 'Трек месяца', 'Хит года', alt ? 'Трек-альтернатива' : 'Андерграунд-трек'];
    const craft = ['Лучший текст', 'Лучший бит', 'Лучший хук', 'Лучший флоу', 'Лучшая подача', 'Лучший клип'];
    const extra = [
      ...(ctx.hasFeature ? ['Фит года', 'Фит месяца', 'Лучший куплет гостя'] : []),
      ...(ctx.isDebut ? ['Фрешмен-трек', 'Дебют года'] : []),
      'Вирусный трек', 'Самый атмосферный'
    ];
    return [
      { title: 'Главные', items: main },
      { title: 'Мастерство', items: craft.filter(x => !main.includes(x)) },
      { title: 'Особые', items: extra }
    ];
  }
  const fmt = releaseFormat('album', ctx);
  const main = fmt === 'EP'
    ? ['EP года', 'EP месяца', 'Альбом месяца']
    : fmt === 'Сингл'
      ? ['Сингл года', 'Релиз месяца']
      : ['Альбом года', 'Альбом месяца', 'Микстейп года'];
  return [
    { title: 'Главные', items: main },
    { title: 'Мастерство', items: ['Лучший концепт', 'Лучший продакшн', 'Лучшая обложка', 'Лучшая целостность', 'Лучшее интро', 'Лучший аутро'] },
    {
      title: 'Особые',
      items: [
        ...(ctx.isDebut ? ['Дебютный альбом года', 'Фрешмен месяца'] : []),
        ...(ctx.hasFeature ? ['Совместный альбом года'] : []),
        ...(alt ? ['Альтернативный альбом года'] : []),
        'Самый смелый релиз', 'Недооценённый релиз'
      ]
    }
  ];
}
