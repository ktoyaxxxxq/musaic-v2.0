// Loads extra Google Fonts used by the app and the cover editor (Cyrillic-ready). Imported once for side effects.
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

export function ensureExtraFonts(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('musaic-extra-fonts')) return;
  const link = document.createElement('link');
  link.id = 'musaic-extra-fonts';
  link.rel = 'stylesheet';
  link.href = EXTRA_FONTS_URL;
  document.head.appendChild(link);
}

ensureExtraFonts();
