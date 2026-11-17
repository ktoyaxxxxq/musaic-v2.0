// Auto title generator for EVERY "Название ..." field in the app (create, edit, album tracklist, batch tool).
// No changes to the forms are needed: when such a field gets focus, a small 🎲 bar appears at its right edge.
// 🎲 = new title, the theme chip = pick a theme. Artist-aware: it looks for the artist chosen in the same form.
import { generateModernTitle, analyzeArtistNamingStyle, TITLE_MOOD_OPTIONS, type TitleMood } from './index';

interface Cat { artists: any[]; tracks: any[]; albums: any[] }
let catalog: Cat = { artists: [], tracks: [], albums: [] };
let mood: TitleMood = 'all';
const sessionTaken = new Set<string>();

/** Call from App with the current catalog (artists/tracks/albums). */
export function setTitleGenCatalog(c: Cat) { catalog = c; }

const TITLE_RE = /назван/i;
const SKIP_RE = /поиск|search|исполнител|групп|артист|лейбл|продюсер/i;

function fieldLabel(input: HTMLInputElement): string {
  const own = `${input.placeholder || ''} ${input.getAttribute('aria-label') || ''} ${input.name || ''}`;
  let el: HTMLElement | null = input;
  for (let i = 0; i < 3 && el; i++, el = el.parentElement) {
    const label = el.parentElement?.querySelector(':scope > label');
    if (label?.textContent) return `${own} ${label.textContent}`;
  }
  return own;
}
function isTitleField(t: EventTarget | null): t is HTMLInputElement {
  if (!(t instanceof HTMLInputElement)) return false;
  if (t.type && t.type !== 'text') return false;
  if (t.closest('[data-no-titlegen]')) return false;
  const l = fieldLabel(t);
  return TITLE_RE.test(l) && !SKIP_RE.test(l.replace(/назван[^ ]*/gi, ''));
}
function findArtist(input: HTMLInputElement): any | null {
  if (!catalog.artists.length) return null;
  let box: HTMLElement | null = input.closest('form');
  if (!box) { box = input; for (let i = 0; i < 7 && box?.parentElement; i++) box = box.parentElement; }
  if (!box) return null;
  const values: string[] = [];
  box.querySelectorAll('input, select, button').forEach(el => {
    if (el === input) return;
    if (el instanceof HTMLSelectElement) values.push(el.selectedOptions[0]?.textContent || '', el.value);
    else if (el instanceof HTMLInputElement) values.push(el.value);
    else values.push(el.textContent || '');
  });
  const vals = values.map(v => v.toLowerCase().trim()).filter(Boolean);
  const sorted = [...catalog.artists].sort((a, b) => (b.name || '').length - (a.name || '').length);
  return sorted.find(a => {
    const n = (a.name || '').toLowerCase().trim();
    return n && vals.some(v => v === n || v === String(a.id) || v.startsWith(n + ' ') || v.includes(` ${n}`));
  }) || null;
}
function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
function generateFor(input: HTMLInputElement): string {
  const label = fieldLabel(input);
  const isAlbum = /альбом|\bep\b/i.test(label) && !/трек/i.test(label);
  const artist = findArtist(input);
  const existing = new Set<string>([...catalog.tracks, ...catalog.albums].map(x => String(x?.title || '').toLowerCase()));
  sessionTaken.forEach(t => existing.add(t));
  document.querySelectorAll('input').forEach(i => { if (i !== input && i.value) existing.add(i.value.toLowerCase()); });
  let profile: any = false;
  let lang: 'auto' | 'mix' = 'mix';
  if (artist) {
    const mine = (list: any[]) => list.filter(x => x.artistId === artist.id || String(x.artistName || '').toLowerCase() === String(artist.name).toLowerCase());
    profile = analyzeArtistNamingStyle(artist, mine(catalog.tracks), mine(catalog.albums));
    lang = 'auto';
  }
  const title = generateModernTitle(existing, isAlbum, profile, lang, mood);
  sessionTaken.add(title.toLowerCase());
  return title;
}

let bar: HTMLDivElement | null = null;
let menu: HTMLDivElement | null = null;
let current: HTMLInputElement | null = null;

function css(el: HTMLElement, s: Partial<CSSStyleDeclaration>) { Object.assign(el.style, s); }
function moodChipText() { return TITLE_MOOD_OPTIONS.find(m => m.id === mood)?.emoji || '🎲'; }

function ensureBar() {
  if (bar) return bar;
  bar = document.createElement('div');
  bar.setAttribute('data-no-titlegen', '');
  css(bar, { position: 'fixed', zIndex: '9999', display: 'none', gap: '4px', alignItems: 'center', padding: '3px', borderRadius: '10px', background: 'rgba(20,20,24,0.92)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', transition: 'opacity .15s', fontFamily: 'inherit' });
  const btn = (txt: string, title: string) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = txt; b.title = title;
    css(b, { border: 'none', cursor: 'pointer', borderRadius: '7px', padding: '4px 8px', fontSize: '13px', fontWeight: '800', lineHeight: '1' });
    b.addEventListener('mousedown', e => e.preventDefault()); // keep focus in the field
    return b;
  };
  const moodBtn = btn(moodChipText(), 'Тема названия');
  css(moodBtn, { background: 'rgba(255,255,255,0.08)', color: '#e4e4e7' });
  const dice = btn('🎲', 'Сгенерировать название');
  css(dice, { background: '#fff', color: '#000' });
  dice.addEventListener('click', () => {
    if (!current) return;
    setNativeValue(current, generateFor(current));
    dice.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 350, easing: 'cubic-bezier(.22,1,.36,1)' });
  });
  moodBtn.addEventListener('click', () => {
    if (menu) { menu.remove(); menu = null; return; }
    menu = document.createElement('div');
    menu.setAttribute('data-no-titlegen', '');
    const r = bar!.getBoundingClientRect();
    css(menu, { position: 'fixed', zIndex: '10000', left: `${Math.max(8, r.right - 200)}px`, top: `${r.bottom + 6}px`, width: '200px', maxHeight: '260px', overflowY: 'auto', padding: '4px', borderRadius: '12px', background: 'rgba(18,18,22,0.97)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' });
    TITLE_MOOD_OPTIONS.forEach(m => {
      const it = btn(`${m.emoji} ${m.name}`, m.name);
      css(it, { display: 'block', width: '100%', textAlign: 'left', fontWeight: '600', fontSize: '12px', background: m.id === mood ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#e4e4e7' });
      it.addEventListener('click', () => { mood = m.id; moodBtn.textContent = moodChipText(); menu?.remove(); menu = null; });
      menu!.appendChild(it);
    });
    document.body.appendChild(menu);
  });
  bar.append(moodBtn, dice);
  document.body.appendChild(bar);
  return bar;
}
function place() {
  if (!bar || !current) return;
  const r = current.getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > window.innerHeight) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const w = bar.offsetWidth || 80;
  css(bar, { left: `${r.right - w - 4}px`, top: `${r.top + (r.height - (bar.offsetHeight || 28)) / 2}px` });
}
function hide() { if (bar) bar.style.display = 'none'; menu?.remove(); menu = null; current = null; }

export function installTitleGenAuto() {
  if (typeof document === 'undefined' || (window as any).__musaicTitleGen) return;
  (window as any).__musaicTitleGen = true;
  document.addEventListener('focusin', e => {
    if (isTitleField(e.target)) { current = e.target; ensureBar(); place(); }
    else if (!(e.target as HTMLElement)?.closest?.('[data-no-titlegen]')) hide();
  });
  document.addEventListener('focusout', () => setTimeout(() => {
    if (!document.activeElement || !isTitleField(document.activeElement)) {
      if (!(document.activeElement as HTMLElement)?.closest?.('[data-no-titlegen]') && !menu) hide();
    }
  }, 120));
  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);
}

installTitleGenAuto();
