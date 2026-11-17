// Loads extra Google Fonts used by the app, generated covers and the cover editor (all Cyrillic-ready).
// Imported once for side effects. FONT_LIBRARY can be merged into AVAILABLE_FONTS (site) and the cover editor list.
const EXTRA_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800;900' +
  '&family=Golos+Text:wght@400;500;600;700;800;900' +
  '&family=Inter+Tight:wght@300;400;500;600;700;800;900' +
  '&family=Geologica:wght@300;400;500;600;700;800;900' +
  '&family=Jost:wght@300;400;500;600;700;800' +
  '&family=Exo+2:wght@400;600;700;800;900' +
  '&family=Comfortaa:wght@400;600;700' +
  '&family=Tenor+Sans&family=Prata&family=Yeseva+One&family=Forum' +
  '&family=Caveat:wght@500;700&family=Marck+Script' +
  '&family=Press+Start+2P&family=Rubik+Mono+One' +
  '&display=swap';

// v2: new families (serif italics like "вэйст!", wide display, condensed, script)
const EXTRA_FONTS_URL_2 =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,800;0,900;1,400;1,500;1,700' +
  '&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600' +
  '&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700' +
  '&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600' +
  '&family=Spectral:ital,wght@0,400;0,600;1,400' +
  '&family=Unbounded:wght@300;400;600;800;900' +
  '&family=Dela+Gothic+One&family=Russo+One&family=Seymour+One&family=Stalinist+One' +
  '&family=Oswald:wght@400;500;600;700' +
  '&family=Sofia+Sans+Extra+Condensed:wght@600;800;900' +
  '&family=Montserrat+Alternates:wght@400;600;700;800' +
  '&family=Commissioner:wght@300;500;700;900' +
  '&family=Raleway:wght@300;500;700;900' +
  '&family=Tektur:wght@400;600;800' +
  '&family=Poiret+One&family=Philosopher:wght@400;700&family=Alice&family=Ruslan+Display' +
  '&family=Kelly+Slab&family=Train+One&family=Bad+Script&family=Pacifico&family=Lobster&family=Amatic+SC:wght@400;700' +
  '&display=swap';

export interface FontOption {
  id: string;        // CSS font-family value
  name: string;      // label in pickers
  desc: string;
  category: 'sans' | 'display' | 'serif' | 'script' | 'mono';
}

export const FONT_LIBRARY: FontOption[] = [
  { id: "'Playfair Display', serif", name: 'Playfair Display', desc: 'Элегантная антиква, красивый курсив', category: 'serif' },
  { id: "'Cormorant Garamond', serif", name: 'Cormorant Garamond', desc: 'Тонкая книжная антиква', category: 'serif' },
  { id: "'PT Serif', serif", name: 'PT Serif', desc: 'Классика с мягким курсивом', category: 'serif' },
  { id: "'Lora', serif", name: 'Lora', desc: 'Тёплая антиква для заголовков', category: 'serif' },
  { id: "'Spectral', serif", name: 'Spectral', desc: 'Строгая современная антиква', category: 'serif' },
  { id: "'Prata', serif", name: 'Prata', desc: 'Контрастная дидона', category: 'serif' },
  { id: "'Alice', serif", name: 'Alice', desc: 'Сказочная мягкая антиква', category: 'serif' },
  { id: "'Unbounded', sans-serif", name: 'Unbounded', desc: 'Широкий модный гротеск', category: 'display' },
  { id: "'Dela Gothic One', sans-serif", name: 'Dela Gothic One', desc: 'Жирный плакатный', category: 'display' },
  { id: "'Russo One', sans-serif", name: 'Russo One', desc: 'Спортивный, рубленый', category: 'display' },
  { id: "'Seymour One', sans-serif", name: 'Seymour One', desc: 'Очень широкий и тяжёлый', category: 'display' },
  { id: "'Stalinist One', sans-serif", name: 'Stalinist One', desc: 'Конструктивизм', category: 'display' },
  { id: "'Oswald', sans-serif", name: 'Oswald', desc: 'Узкий плакатный', category: 'display' },
  { id: "'Sofia Sans Extra Condensed', sans-serif", name: 'Sofia Sans Condensed', desc: 'Сверхузкий для больших заголовков', category: 'display' },
  { id: "'Tektur', sans-serif", name: 'Tektur', desc: 'Техно, гранёный', category: 'display' },
  { id: "'Train One', sans-serif", name: 'Train One', desc: 'Контурный, игривый', category: 'display' },
  { id: "'Ruslan Display', sans-serif", name: 'Ruslan Display', desc: 'Старорусский стиль', category: 'display' },
  { id: "'Montserrat Alternates', sans-serif", name: 'Montserrat Alternates', desc: 'Геометрия с характером', category: 'sans' },
  { id: "'Commissioner', sans-serif", name: 'Commissioner', desc: 'Мягкий современный гротеск', category: 'sans' },
  { id: "'Raleway', sans-serif", name: 'Raleway', desc: 'Тонкий элегантный гротеск', category: 'sans' },
  { id: "'Onest', sans-serif", name: 'Onest', desc: 'Чистый интерфейсный', category: 'sans' },
  { id: "'Golos Text', sans-serif", name: 'Golos', desc: 'Нейтральный, очень читаемый', category: 'sans' },
  { id: "'Geologica', sans-serif", name: 'Geologica', desc: 'Технологичный гротеск', category: 'sans' },
  { id: "'Philosopher', sans-serif", name: 'Philosopher', desc: 'Гуманистический с изгибом', category: 'sans' },
  { id: "'Poiret One', sans-serif", name: 'Poiret One', desc: 'Ар-деко, тонкий', category: 'sans' },
  { id: "'Kelly Slab', serif", name: 'Kelly Slab', desc: 'Брусковый ретро', category: 'serif' },
  { id: "'Bad Script', cursive", name: 'Bad Script', desc: 'Рукописный', category: 'script' },
  { id: "'Pacifico', cursive", name: 'Pacifico', desc: 'Сёрф-скрипт', category: 'script' },
  { id: "'Lobster', cursive", name: 'Lobster', desc: 'Жирный скрипт', category: 'script' },
  { id: "'Amatic SC', cursive", name: 'Amatic SC', desc: 'Узкий рисованный', category: 'script' },
  { id: "'Caveat', cursive", name: 'Caveat', desc: 'Живой почерк', category: 'script' },
  { id: "'JetBrains Mono', monospace", name: 'JetBrains Mono', desc: 'Моноширинный', category: 'mono' }
];

function addLink(id: string, href: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export function ensureExtraFonts(): void {
  if (typeof document === 'undefined') return;
  addLink('musaic-extra-fonts', EXTRA_FONTS_URL);
  addLink('musaic-extra-fonts-2', EXTRA_FONTS_URL_2);
}

ensureExtraFonts();
