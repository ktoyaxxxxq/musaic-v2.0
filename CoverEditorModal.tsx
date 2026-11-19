import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Copy,
  Dices,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  Move,
  Palette,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Sticker,
  Trash2,
  Type,
  X
} from 'lucide-react';
import './fontsExtra';

export type CoverBgStyle =
  | 'gradient'
  | 'tri_gradient'
  | 'aurora_flow'
  | 'mesh'
  | 'quad_mesh'
  | 'radial_glow'
  | 'conic_sweep'
  | 'spotlight'
  | 'horizon_fade'
  | 'duotone_mist'
  | 'solid'
  | 'matte_vignette'
  | 'split'
  | 'diag_split'
  | 'stripes'
  | 'checker';

export type CoverMotif =
  | 'none'
  | 'eclipse'
  | 'orb'
  | 'rings'
  | 'orbit_rings'
  | 'wireframe_sphere'
  | 'tunnel'
  | 'bauhaus'
  | 'arch'
  | 'blobs'
  | 'liquid_rings'
  | 'waves'
  | 'equalizer'
  | 'prism'
  | 'vinyl'
  | 'cassette'
  | 'duality'
  | 'crosshair'
  | 'grid'
  | 'halftone'
  | 'rays'
  | 'sunburst'
  | 'stars'
  | 'horizon'
  | 'ribbons'
  | 'mosaic'
  | 'portal_frame'
  | 'minimal_squares'
  | 'crescent_arc'
  | 'diagonal_bars'
  | 'radial_mesh'
  | 'glass_shards'
  | 'monolith'
  | 'spiral_vortex'
  | 'topography'
  | 'dot_sphere'
  | 'broken_ring'
  | 'aurora_waves';

export type CoverFrame = 'none' | 'thin' | 'double' | 'sleeve' | 'polaroid' | 'film_strip';
export type CoverTextEffect = 'clean' | 'shadow' | 'glow' | 'chromatic' | 'outline';
export type CoverPhotoFilter = 'none' | 'bw' | 'contrast' | 'sepia' | 'duotone' | 'warm' | 'cold';
export type CoverStampCorner = 'br' | 'bl' | 'tr' | 'tl';
export type CoverStickerShape = 'circle' | 'starburst' | 'pill' | 'tape';

export type CoverDecalType =
  | 'circle'
  | 'circle_outline'
  | 'ring_double'
  | 'half_circle'
  | 'quarter_arc'
  | 'square'
  | 'square_outline'
  | 'rounded_box'
  | 'bar_h'
  | 'bar_v'
  | 'thin_line'
  | 'double_line'
  | 'triple_bars'
  | 'pill_shape'
  | 'triangle'
  | 'triangle_inv'
  | 'hexagon'
  | 'octagon'
  | 'pentagon'
  | 'plus_sign'
  | 'cross_x'
  | 'brackets'
  | 'corner_frame'
  | 'dot_grid'
  | 'zigzag'
  | 'wave_line'
  | 'chevron'
  | 'slash_pair'
  | 'halo'
  | 'barcode_mini'
  | 'crosshair_min'
  | 'arrow_up_diag'
  | 'burst_rays'
  | 'crescent_thin'
  | 'star4'
  | 'star5'
  | 'star8'
  | 'chrome_cross'
  | 'heart'
  | 'broken_heart'
  | 'lightning'
  | 'crown'
  | 'flame'
  | 'butterfly'
  | 'moon'
  | 'sun'
  | 'eye'
  | 'wings'
  | 'vinyl_disc'
  | 'note'
  | 'headphones'
  | 'mic'
  | 'soundwave'
  | 'play_badge'
  | 'diamond'
  | 'pyramid'
  | 'target'
  | 'globe'
  | 'planet_ring'
  | 'compass'
  | 'cross'
  | 'peace'
  | 'yin_yang'
  | 'infinity'
  | 'atom'
  | 'laurel'
  | 'rose'
  | 'cherry'
  | 'dagger'
  | 'key'
  | 'lock'
  | 'hourglass'
  | 'skull_minimal'
  | 'barbed_wire'
  | 'biohazard'
  | 'tribal_wave'
  | 'spiral_emblem'
  | 'arrow_loop';

export type CoverDecalStyle = 'fill' | 'outline' | 'glow';

export interface CoverTextLayer {
  id: string;
  label: string;
  enabled: boolean;
  text: string;
  x: number; // 0..100 (% of canvas width)
  y: number; // 0..100 (% of canvas height)
  fontFamily: string;
  fontSize: number; // px relative to 1000x1000 canvas
  fontWeight: number; // 400 | 600 | 700 | 800 | 900
  letterSpacing: number; // -2..20
  lineHeight?: number; // 0.85..1.85
  rotate: number; // -45..45 deg
  align: 'left' | 'center' | 'right';
  uppercase: boolean;
  color: string;
  effect: CoverTextEffect;
  boxBg: boolean;
  opacity: number; // 10..100
}

export interface CoverDecalLayer {
  id: string;
  type: CoverDecalType;
  x: number; // 0..100 (%)
  y: number; // 0..100 (%)
  size: number; // 8..640
  rotate: number; // -180..180
  opacity: number; // 10..100
  color: string;
  style: CoverDecalStyle;
}

export interface CoverDesignConfig {
  bgStyle: CoverBgStyle;
  color1: string;
  color2: string;
  accent: string;
  angle: number;
  bgCenterX?: number; // 0..100
  bgCenterY?: number; // 0..100
  bgBalance?: number; // 10..90
  bgSpread?: number; // 30..170
  motif: CoverMotif;
  motifScale: number;
  motifOpacity: number;
  motifOffsetX: number;
  motifOffsetY: number;
  motifRotate: number;
  showText: boolean;
  textLayers: CoverTextLayer[];
  decals: CoverDecalLayer[];
  grain: number;
  vignette: number;
  scanlines: number;
  glitch: number;
  frame: CoverFrame;
  parentalAdvisory: boolean;
  parentalCorner: CoverStampCorner;
  parentalScale?: number;
  barcodeStamp: boolean;
  cropMarks: boolean;
  hiResStamp: boolean;
  hazardStripe: boolean;
  stickerText: string;
  stickerShape: CoverStickerShape;
  stickerColor: string;
  photoDataUrl?: string;
  photoOverlayColor: string;
  photoOverlayOpacity: number; // 0..95
  photoScrimBottom: number; // 0..90
  photoScale: number; // 50..300
  photoOffsetX: number; // -60..60
  photoOffsetY: number; // -60..60
  photoRotate: number; // -180..180
  photoBrightness: number; // 30..200
  photoContrast: number; // 50..220
  photoSaturate: number; // 0..220
  photoBlur: number; // 0..18
  photoFilter: CoverPhotoFilter;
}

type TemplateCategory = 'blank' | 'neutral' | 'gradient' | 'minimal' | 'text' | 'notext' | 'art';

interface CoverTemplatePreset {
  id: string;
  name: string;
  category: TemplateCategory;
  hasText: boolean;
  config: Partial<CoverDesignConfig> & {
    titleStyle?: Partial<CoverTextLayer>;
    artistStyle?: Partial<CoverTextLayer>;
    kickerStyle?: Partial<CoverTextLayer>;
    footerStyle?: Partial<CoverTextLayer>;
  };
}

const FONT_OPTIONS = [
  { id: 'Unbounded', label: 'Unbounded', tag: 'Широкий' },
  { id: 'Syne', label: 'Syne', tag: 'Арт' },
  { id: 'Dela Gothic One', label: 'Dela Gothic', tag: 'Брутал' },
  { id: 'Russo One', label: 'Russo One', tag: 'Индастриал' },
  { id: 'Anton', label: 'Anton', tag: 'Плакат' },
  { id: 'Bebas Neue', label: 'Bebas Neue', tag: 'Узкий' },
  { id: 'Oswald', label: 'Oswald', tag: 'Сжатый' },
  { id: 'Montserrat', label: 'Montserrat', tag: 'Геометр' },
  { id: 'Rubik', label: 'Rubik', tag: 'Мягкий' },
  { id: 'Manrope', label: 'Manrope', tag: 'Чистый' },
  { id: 'Outfit', label: 'Outfit', tag: 'Модерн' },
  { id: 'Bricolage Grotesque', label: 'Bricolage', tag: 'Характер' },
  { id: 'Playfair Display', label: 'Playfair', tag: 'Люкс' },
  { id: 'Cormorant Garamond', label: 'Cormorant', tag: 'Аристо' },
  { id: 'Lora', label: 'Lora', tag: 'Книжный' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono', tag: 'Код' },
  { id: 'Space Mono', label: 'Space Mono', tag: 'Ретро' },
  { id: 'Onest', label: 'Onest', tag: 'Модерн' },
  { id: 'Inter Tight', label: 'Inter Tight', tag: 'Плотный' },
  { id: 'Golos Text', label: 'Golos', tag: 'Мягкий' },
  { id: 'Geologica', label: 'Geologica', tag: 'Характер' },
  { id: 'Jost', label: 'Jost', tag: 'Геометр' },
  { id: 'Exo 2', label: 'Exo 2', tag: 'Футуризм' },
  { id: 'Comfortaa', label: 'Comfortaa', tag: 'Округлый' },
  { id: 'Tenor Sans', label: 'Tenor Sans', tag: 'Элегант' },
  { id: 'Prata', label: 'Prata', tag: 'Вог' },
  { id: 'Yeseva One', label: 'Yeseva', tag: 'Дисплей' },
  { id: 'Forum', label: 'Forum', tag: 'Антика' },
  { id: 'Caveat', label: 'Caveat', tag: 'Рукопись' },
  { id: 'Marck Script', label: 'Marck Script', tag: 'Скрипт' },
  { id: 'Press Start 2P', label: 'Press Start', tag: 'Пиксель' },
  { id: 'Rubik Mono One', label: 'Rubik Mono', tag: 'Блок' }
];

// One-click text styles: applied to title + artist (positions and colors stay)
const TEXT_STYLE_PRESETS: Array<{ id: string; name: string; sample: string; title: Partial<CoverTextLayer>; artist: Partial<CoverTextLayer> }> = [
  { id: 'minimal', name: 'Минимал', sample: 'Тишина', title: { fontFamily: 'Inter Tight', fontWeight: 700, letterSpacing: -2, uppercase: false, effect: 'clean' }, artist: { fontFamily: 'Inter Tight', fontWeight: 500, letterSpacing: 0, uppercase: false, effect: 'clean' } },
  { id: 'swiss', name: 'Швейцарский', sample: 'HELVET', title: { fontFamily: 'Onest', fontWeight: 800, letterSpacing: -1, uppercase: true, effect: 'clean' }, artist: { fontFamily: 'Onest', fontWeight: 500, letterSpacing: 2, uppercase: true, effect: 'clean' } },
  { id: 'thin_wide', name: 'Воздушный', sample: 'В О З Д', title: { fontFamily: 'Jost', fontWeight: 400, letterSpacing: 14, uppercase: true, effect: 'clean' }, artist: { fontFamily: 'Jost', fontWeight: 400, letterSpacing: 8, uppercase: true, effect: 'clean' } },
  { id: 'luxury', name: 'Люкс', sample: 'Вог', title: { fontFamily: 'Prata', fontWeight: 400, letterSpacing: 1, uppercase: false, effect: 'clean' }, artist: { fontFamily: 'Tenor Sans', fontWeight: 400, letterSpacing: 10, uppercase: true, effect: 'clean' } },
  { id: 'editorial', name: 'Журнал', sample: 'Роман', title: { fontFamily: 'Cormorant Garamond', fontWeight: 700, letterSpacing: 0, uppercase: false, effect: 'clean' }, artist: { fontFamily: 'Inter Tight', fontWeight: 500, letterSpacing: 4, uppercase: true, effect: 'clean' } },
  { id: 'poster', name: 'Плакат', sample: 'ГРОМ', title: { fontFamily: 'Anton', fontWeight: 400, letterSpacing: 0, uppercase: true, effect: 'shadow' }, artist: { fontFamily: 'Bebas Neue', fontWeight: 400, letterSpacing: 6, uppercase: true, effect: 'clean' } },
  { id: 'wide', name: 'Широкий', sample: 'ШИРЬ', title: { fontFamily: 'Unbounded', fontWeight: 800, letterSpacing: 2, uppercase: true, effect: 'clean' }, artist: { fontFamily: 'Manrope', fontWeight: 600, letterSpacing: 4, uppercase: true, effect: 'clean' } },
  { id: 'hand', name: 'Рукопись', sample: 'лето', title: { fontFamily: 'Caveat', fontWeight: 700, letterSpacing: 0, uppercase: false, effect: 'clean' }, artist: { fontFamily: 'Caveat', fontWeight: 500, letterSpacing: 0, uppercase: false, effect: 'clean' } },
  { id: 'script_neon', name: 'Неон', sample: 'Ночь', title: { fontFamily: 'Marck Script', fontWeight: 400, letterSpacing: 0, uppercase: false, effect: 'glow' }, artist: { fontFamily: 'Jost', fontWeight: 500, letterSpacing: 10, uppercase: true, effect: 'glow' } },
  { id: 'chrome', name: 'Хром Y2K', sample: 'ХРОМ', title: { fontFamily: 'Exo 2', fontWeight: 900, letterSpacing: 1, uppercase: true, effect: 'chromatic' }, artist: { fontFamily: 'Exo 2', fontWeight: 600, letterSpacing: 6, uppercase: true, effect: 'clean' } },
  { id: 'pixel', name: 'Пиксель', sample: '8BIT', title: { fontFamily: 'Press Start 2P', fontWeight: 400, letterSpacing: 0, uppercase: true, effect: 'glow' }, artist: { fontFamily: 'Press Start 2P', fontWeight: 400, letterSpacing: 0, uppercase: true, effect: 'clean' } },
  { id: 'block', name: 'Блок', sample: 'БЛОК', title: { fontFamily: 'Rubik Mono One', fontWeight: 400, letterSpacing: 0, uppercase: true, effect: 'clean' }, artist: { fontFamily: 'Jost', fontWeight: 600, letterSpacing: 6, uppercase: true, effect: 'clean' } },
  { id: 'outline', name: 'Контур', sample: 'ЛИНИЯ', title: { fontFamily: 'Syne', fontWeight: 800, letterSpacing: 1, uppercase: true, effect: 'outline' }, artist: { fontFamily: 'Syne', fontWeight: 600, letterSpacing: 4, uppercase: true, effect: 'clean' } },
  { id: 'soft', name: 'Мягкий', sample: 'облако', title: { fontFamily: 'Comfortaa', fontWeight: 700, letterSpacing: 0, uppercase: false, effect: 'clean' }, artist: { fontFamily: 'Comfortaa', fontWeight: 400, letterSpacing: 1, uppercase: false, effect: 'clean' } },
  { id: 'mono', name: 'Код', sample: 'v1.0', title: { fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: 0, uppercase: false, effect: 'clean' }, artist: { fontFamily: 'JetBrains Mono', fontWeight: 400, letterSpacing: 0, uppercase: false, effect: 'clean' } },
  { id: 'antique', name: 'Антика', sample: 'Эпос', title: { fontFamily: 'Forum', fontWeight: 400, letterSpacing: 4, uppercase: true, effect: 'clean' }, artist: { fontFamily: 'Forum', fontWeight: 400, letterSpacing: 8, uppercase: true, effect: 'clean' } }
];

// Quick positions for the selected text (x is the anchor point for the chosen alignment)
const TEXT_POSITION_PRESETS: Array<{ id: string; label: string; patch: Partial<CoverTextLayer> }> = [
  { id: 'tl', label: '↖ Верх', patch: { x: 9, y: 12, align: 'left' } },
  { id: 'tc', label: '↑ Верх', patch: { x: 50, y: 12, align: 'center' } },
  { id: 'cc', label: '● Центр', patch: { x: 50, y: 50, align: 'center' } },
  { id: 'bl', label: '↙ Низ', patch: { x: 9, y: 86, align: 'left' } },
  { id: 'bc', label: '↓ Низ', patch: { x: 50, y: 86, align: 'center' } },
  { id: 'br', label: '↘ Низ', patch: { x: 91, y: 86, align: 'right' } }
];

const NEUTRAL_COLOR_PALETTES = [
  { name: 'Графит мат', c1: '#0b0b0d', c2: '#1b1b20', accent: '#71717a', text: '#fafafa' },
  { name: 'Тёплый уголь', c1: '#141210', c2: '#27231f', accent: '#a8a29e', text: '#fafaf9' },
  { name: 'Холодный сланец', c1: '#0c1117', c2: '#1e293b', accent: '#94a3b8', text: '#f8fafc' },
  { name: 'Слоновая кость', c1: '#f5f2eb', c2: '#e2dcd0', accent: '#a8a29e', text: '#18181b' },
  { name: 'Чистый светлый', c1: '#fafafa', c2: '#e4e4e7', accent: '#71717a', text: '#09090b' },
  { name: 'Бетон', c1: '#27272a', c2: '#52525b', accent: '#d4d4d8', text: '#ffffff' },
  { name: 'Тёплый песок', c1: '#d6cfc2', c2: '#b8ae9e', accent: '#57534e', text: '#1c1917' },
  { name: 'Дымка олива', c1: '#141815', c2: '#29302a', accent: '#9ca3af', text: '#f3f4f6' },
  { name: 'Ночной бархат', c1: '#09090b', c2: '#141418', accent: '#3f3f46', text: '#f4f4f5' }
];

const COLOR_PALETTES = [
  { name: 'Obsidian Gold', c1: '#09090b', c2: '#1f1c14', accent: '#facc15', text: '#ffffff' },
  { name: 'Cyber Mint', c1: '#050b14', c2: '#0c2730', accent: '#22d3ee', text: '#f0fdfa' },
  { name: 'Blood Moon', c1: '#0c0507', c2: '#3f0a17', accent: '#ef4444', text: '#fff1f2' },
  { name: 'Acid Chrome', c1: '#0d0f0a', c2: '#232e12', accent: '#a3e635', text: '#f7fee7' },
  { name: 'Electric Violet', c1: '#0e071c', c2: '#2d1259', accent: '#c084fc', text: '#faf5ff' },
  { name: 'Sunset Tape', c1: '#230b24', c2: '#6b1d2f', accent: '#fb923c', text: '#fff7ed' },
  { name: 'Swiss Cream', c1: '#f4f1ea', c2: '#e4dfd3', accent: '#dc2626', text: '#111111' },
  { name: 'Arctic Paper', c1: '#eff6ff', c2: '#dbeafe', accent: '#1d4ed8', text: '#09090b' },
  { name: 'Deep Ocean', c1: '#020617', c2: '#0f2942', accent: '#38bdf8', text: '#f8fafc' },
  { name: 'Rose Quartz', c1: '#1d1016', c2: '#4b1d34', accent: '#f472b6', text: '#fdf2f8' },
  { name: 'Aurora Emerald', c1: '#031510', c2: '#09382a', accent: '#34d399', text: '#ecfdf5' },
  { name: 'Iridescent Aura', c1: '#140c29', c2: '#0e3c4a', accent: '#f9a8d4', text: '#ffffff' }
];

const BG_STYLE_OPTIONS: Array<{ id: CoverBgStyle; label: string; kind: 'gradient' | 'static' }> = [
  { id: 'gradient', label: 'Линейный', kind: 'gradient' },
  { id: 'tri_gradient', label: '3-цветный', kind: 'gradient' },
  { id: 'radial_glow', label: 'Радиальный', kind: 'gradient' },
  { id: 'spotlight', label: 'Софит', kind: 'gradient' },
  { id: 'aurora_flow', label: 'Аврора', kind: 'gradient' },
  { id: 'mesh', label: 'Меш-пятна', kind: 'gradient' },
  { id: 'quad_mesh', label: 'Студия 4-точки', kind: 'gradient' },
  { id: 'duotone_mist', label: 'Мягкий туман', kind: 'gradient' },
  { id: 'conic_sweep', label: 'Вихрь', kind: 'gradient' },
  { id: 'horizon_fade', label: 'Горизонт', kind: 'gradient' },
  { id: 'solid', label: 'Сплошной', kind: 'static' },
  { id: 'matte_vignette', label: 'Матовый свет', kind: 'static' },
  { id: 'split', label: 'Раскол 50/50', kind: 'static' },
  { id: 'diag_split', label: 'Диагональ', kind: 'static' },
  { id: 'stripes', label: 'Полосы', kind: 'static' },
  { id: 'checker', label: 'Клетка', kind: 'static' }
];

const MOTIF_OPTIONS: Array<{ id: CoverMotif; label: string }> = [
  { id: 'none', label: 'Без фигуры' },
  { id: 'eclipse', label: 'Затмение' },
  { id: 'orb', label: 'Сфера' },
  { id: 'rings', label: 'Кольца' },
  { id: 'broken_ring', label: 'Разомкн. круг' },
  { id: 'crescent_arc', label: 'Полукольца' },
  { id: 'orbit_rings', label: 'Орбита' },
  { id: 'wireframe_sphere', label: '3D-сетка' },
  { id: 'dot_sphere', label: 'Точки-шар' },
  { id: 'portal_frame', label: 'Портал' },
  { id: 'minimal_squares', label: 'Квадраты' },
  { id: 'monolith', label: 'Монолит' },
  { id: 'tunnel', label: 'Туннель' },
  { id: 'arch', label: 'Арка' },
  { id: 'bauhaus', label: 'Баухаус' },
  { id: 'glass_shards', label: 'Осколки' },
  { id: 'diagonal_bars', label: 'Штрихи' },
  { id: 'radial_mesh', label: 'Паутина' },
  { id: 'topography', label: 'Рельеф' },
  { id: 'spiral_vortex', label: 'Спираль' },
  { id: 'blobs', label: 'Аура' },
  { id: 'liquid_rings', label: 'Волны-капли' },
  { id: 'aurora_waves', label: 'Шёлк-волны' },
  { id: 'waves', label: 'Осциллограф' },
  { id: 'equalizer', label: 'Эквалайзер' },
  { id: 'prism', label: 'Призма' },
  { id: 'vinyl', label: 'Винил' },
  { id: 'cassette', label: 'Кассета' },
  { id: 'duality', label: 'Дуальность' },
  { id: 'crosshair', label: 'Прицел' },
  { id: 'grid', label: 'Перспектива' },
  { id: 'halftone', label: 'Растр' },
  { id: 'rays', label: 'Лучи' },
  { id: 'sunburst', label: 'Солнце' },
  { id: 'stars', label: 'Космос' },
  { id: 'horizon', label: 'Закат' },
  { id: 'ribbons', label: 'Ленты' },
  { id: 'mosaic', label: 'Мозаика' }
];

const DECAL_OPTIONS: Array<{ id: CoverDecalType; label: string }> = [
  { id: 'circle', label: 'Круг' },
  { id: 'circle_outline', label: 'Кольцо' },
  { id: 'ring_double', label: 'Двойное кольцо' },
  { id: 'half_circle', label: 'Полукруг' },
  { id: 'quarter_arc', label: 'Дуга 90°' },
  { id: 'square', label: 'Квадрат' },
  { id: 'square_outline', label: 'Рамка квадрата' },
  { id: 'rounded_box', label: 'Скругл. блок' },
  { id: 'bar_h', label: 'Полоса гориз.' },
  { id: 'bar_v', label: 'Полоса верт.' },
  { id: 'thin_line', label: 'Линия' },
  { id: 'double_line', label: 'Двойная линия' },
  { id: 'triple_bars', label: 'Три полосы' },
  { id: 'pill_shape', label: 'Капсула' },
  { id: 'triangle', label: 'Треугольник' },
  { id: 'triangle_inv', label: 'Треуг. вниз' },
  { id: 'pentagon', label: 'Пятиугольник' },
  { id: 'hexagon', label: 'Шестиугольник' },
  { id: 'octagon', label: 'Восьмиугольник' },
  { id: 'plus_sign', label: 'Плюс' },
  { id: 'cross_x', label: 'Крестик X' },
  { id: 'brackets', label: 'Скобки [ ]' },
  { id: 'corner_frame', label: 'Уголки кадра' },
  { id: 'dot_grid', label: 'Сетка 3x3' },
  { id: 'zigzag', label: 'Зигзаг' },
  { id: 'wave_line', label: 'Волна' },
  { id: 'chevron', label: 'Шеврон' },
  { id: 'slash_pair', label: 'Слэши //' },
  { id: 'halo', label: 'Нимб' },
  { id: 'barcode_mini', label: 'Штрих-метка' },
  { id: 'crosshair_min', label: 'Метка прицела' },
  { id: 'arrow_up_diag', label: 'Стрелка ↗' },
  { id: 'burst_rays', label: 'Лучи' },
  { id: 'crescent_thin', label: 'Тонкий месяц' },
  { id: 'star4', label: 'Искра 4' },
  { id: 'star5', label: 'Звезда 5' },
  { id: 'star8', label: 'Звезда 8' },
  { id: 'chrome_cross', label: 'Кибер-крест' },
  { id: 'heart', label: 'Сердце' },
  { id: 'broken_heart', label: 'Разбитое сердце' },
  { id: 'lightning', label: 'Молния' },
  { id: 'crown', label: 'Корона' },
  { id: 'flame', label: 'Огонь' },
  { id: 'butterfly', label: 'Бабочка' },
  { id: 'moon', label: 'Полумесяц' },
  { id: 'sun', label: 'Солнце' },
  { id: 'eye', label: 'Око' },
  { id: 'wings', label: 'Крылья' },
  { id: 'vinyl_disc', label: 'Пластинка' },
  { id: 'note', label: 'Нота' },
  { id: 'headphones', label: 'Наушники' },
  { id: 'mic', label: 'Микрофон' },
  { id: 'soundwave', label: 'Аудиоволна' },
  { id: 'play_badge', label: 'Play' },
  { id: 'diamond', label: 'Ромб' },
  { id: 'pyramid', label: 'Пирамида' },
  { id: 'target', label: 'Мишень' },
  { id: 'globe', label: 'Глобус' },
  { id: 'planet_ring', label: 'Планета' },
  { id: 'compass', label: 'Компас' },
  { id: 'cross', label: 'Крест' },
  { id: 'peace', label: 'Пацифик' },
  { id: 'yin_yang', label: 'Инь-Ян' },
  { id: 'infinity', label: 'Бесконечность' },
  { id: 'atom', label: 'Атом' },
  { id: 'laurel', label: 'Лавровый венок' },
  { id: 'rose', label: 'Цветок / Лотос' },
  { id: 'cherry', label: 'Вишня' },
  { id: 'dagger', label: 'Кинжал' },
  { id: 'key', label: 'Ключ' },
  { id: 'lock', label: 'Замок' },
  { id: 'hourglass', label: 'Песочные часы' },
  { id: 'skull_minimal', label: 'Череп' },
  { id: 'barbed_wire', label: 'Колючка' },
  { id: 'biohazard', label: 'Радиация / Рейв' },
  { id: 'tribal_wave', label: 'Трайбл' },
  { id: 'spiral_emblem', label: 'Спираль' },
  { id: 'arrow_loop', label: 'Стрелка' }
];

function makeDefaultTextLayers(title = 'UNTITLED', artist = '', kicker = '', footer = ''): CoverTextLayer[] {
  return [
    {
      id: 'kicker',
      label: 'Тег сверху',
      enabled: Boolean(kicker),
      text: kicker,
      x: 50,
      y: 12,
      fontFamily: 'JetBrains Mono',
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: 6,
      lineHeight: 1.12,
      rotate: 0,
      align: 'center',
      uppercase: true,
      color: '#ffffff',
      effect: 'clean',
      boxBg: false,
      opacity: 86
    },
    {
      id: 'title',
      label: 'Название',
      enabled: true,
      text: title,
      x: 50,
      y: 78,
      fontFamily: 'Unbounded',
      fontSize: 80,
      fontWeight: 900,
      letterSpacing: 2,
      lineHeight: 1.08,
      rotate: 0,
      align: 'center',
      uppercase: true,
      color: '#ffffff',
      effect: 'shadow',
      boxBg: false,
      opacity: 100
    },
    {
      id: 'artist',
      label: 'Артист',
      enabled: true,
      text: artist,
      x: 50,
      y: 88,
      fontFamily: 'Montserrat',
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: 5,
      lineHeight: 1.15,
      rotate: 0,
      align: 'center',
      uppercase: true,
      color: '#ffffff',
      effect: 'clean',
      boxBg: false,
      opacity: 90
    },
    {
      id: 'footer',
      label: 'Подпись снизу',
      enabled: Boolean(footer),
      text: footer,
      x: 50,
      y: 94,
      fontFamily: 'Space Mono',
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: 4,
      lineHeight: 1.15,
      rotate: 0,
      align: 'center',
      uppercase: true,
      color: '#ffffff',
      effect: 'clean',
      boxBg: false,
      opacity: 72
    }
  ];
}

const DEFAULT_CONFIG: CoverDesignConfig = {
  bgStyle: 'gradient',
  color1: '#09090b',
  color2: '#1f1c14',
  accent: '#facc15',
  angle: 135,
  bgCenterX: 50,
  bgCenterY: 50,
  bgBalance: 50,
  bgSpread: 100,
  motif: 'eclipse',
  motifScale: 100,
  motifOpacity: 92,
  motifOffsetX: 0,
  motifOffsetY: -6,
  motifRotate: 0,
  showText: true,
  textLayers: makeDefaultTextLayers(),
  decals: [],
  grain: 14,
  vignette: 26,
  scanlines: 0,
  glitch: 0,
  frame: 'none',
  parentalAdvisory: false,
  parentalCorner: 'br',
  barcodeStamp: false,
  cropMarks: false,
  hiResStamp: false,
  hazardStripe: false,
  stickerText: '',
  stickerShape: 'circle',
  stickerColor: '#facc15',
  photoDataUrl: undefined,
  photoOverlayColor: '#000000',
  photoOverlayOpacity: 20,
  photoScrimBottom: 0,
  photoScale: 100,
  photoOffsetX: 0,
  photoOffsetY: 0,
  photoRotate: 0,
  photoBrightness: 100,
  photoContrast: 100,
  photoSaturate: 100,
  photoBlur: 0,
  photoFilter: 'none'
};

const COVER_TEMPLATES: CoverTemplatePreset[] = [
  // BLANK
  {
    id: 'blank_canvas',
    name: 'Пустой холст',
    category: 'blank',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#111114',
      color2: '#111114',
      accent: '#ffffff',
      motif: 'none',
      showText: false,
      grain: 0,
      vignette: 0,
      decals: []
    }
  },
  {
    id: 'blank_photo_type',
    name: 'Фото + Типографика',
    category: 'blank',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#0b0c10',
      color2: '#1a1c26',
      accent: '#ffffff',
      motif: 'none',
      showText: true,
      grain: 10,
      vignette: 20,
      photoScrimBottom: 55,
      photoOverlayOpacity: 15,
      titleStyle: { x: 10, y: 81, align: 'left', fontFamily: 'Unbounded', fontSize: 78, color: '#ffffff' },
      artistStyle: { x: 10, y: 89, align: 'left', fontFamily: 'Montserrat', fontSize: 28, color: '#e4e4e7' }
    }
  },

  // NEUTRAL BACKDROPS & CLEAN STUDIO GRADIENTS (WITH & WITHOUT TEXT)
  {
    id: 'neutral_matte_obsidian',
    name: 'Матовый обсидиан',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'matte_vignette',
      color1: '#0c0c0e',
      color2: '#1e1e24',
      accent: '#52525b',
      bgCenterX: 50,
      bgCenterY: 42,
      bgSpread: 110,
      motif: 'none',
      showText: false,
      grain: 14,
      vignette: 22
    }
  },
  {
    id: 'neutral_graphite_grad',
    name: 'Графитовый градиент',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'gradient',
      color1: '#09090b',
      color2: '#27272a',
      accent: '#71717a',
      angle: 145,
      bgBalance: 55,
      motif: 'none',
      showText: false,
      grain: 12,
      vignette: 16
    }
  },
  {
    id: 'neutral_warm_stone',
    name: 'Тёплый камень',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'duotone_mist',
      color1: '#e7e2d8',
      color2: '#c9c1b2',
      accent: '#9c9282',
      angle: 135,
      bgCenterX: 35,
      bgCenterY: 32,
      bgSpread: 115,
      motif: 'none',
      showText: false,
      grain: 16,
      vignette: 8
    }
  },
  {
    id: 'neutral_silver_fog',
    name: 'Серебристый туман',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'radial_glow',
      color1: '#18181b',
      color2: '#3f3f46',
      accent: '#a1a1aa',
      bgCenterX: 50,
      bgCenterY: 45,
      bgSpread: 125,
      motif: 'none',
      showText: false,
      grain: 14,
      vignette: 18
    }
  },
  {
    id: 'neutral_alabaster_mono',
    name: 'Светлая бумага',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'matte_vignette',
      color1: '#f4f4f2',
      color2: '#e4e4e0',
      accent: '#d4d4d8',
      bgCenterX: 50,
      bgCenterY: 50,
      bgSpread: 120,
      motif: 'none',
      showText: false,
      grain: 15,
      vignette: 6
    }
  },
  {
    id: 'neutral_slate_studio',
    name: 'Холодный сланец',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'quad_mesh',
      color1: '#0b0f14',
      color2: '#1e293b',
      accent: '#475569',
      bgCenterX: 50,
      bgCenterY: 45,
      bgSpread: 115,
      motif: 'none',
      showText: false,
      grain: 12,
      vignette: 18
    }
  },
  {
    id: 'neutral_espresso_smoke',
    name: 'Тёмный эспрессо',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'spotlight',
      color1: '#0d0b0a',
      color2: '#231f1c',
      accent: '#78716c',
      bgCenterX: 50,
      bgCenterY: 22,
      bgSpread: 105,
      motif: 'none',
      showText: false,
      grain: 16,
      vignette: 24
    }
  },
  {
    id: 'neutral_olive_ash',
    name: 'Пепельная олива',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'gradient',
      color1: '#111412',
      color2: '#282e29',
      accent: '#6b7280',
      angle: 160,
      bgBalance: 52,
      motif: 'none',
      showText: false,
      grain: 14,
      vignette: 20
    }
  },
  {
    id: 'neutral_monolith_split',
    name: 'Монохром раскол',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'diag_split',
      color1: '#111113',
      color2: '#232329',
      accent: '#71717a',
      angle: 115,
      motif: 'none',
      showText: false,
      grain: 10,
      vignette: 14
    }
  },
  {
    id: 'neutral_horizon_grey',
    name: 'Серый горизонт',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'horizon_fade',
      color1: '#09090b',
      color2: '#27272a',
      accent: '#52525b',
      bgBalance: 56,
      motif: 'none',
      showText: false,
      grain: 14,
      vignette: 14
    }
  },
  {
    id: 'neutral_clean_type_dark',
    name: 'Нейтраль (Тёмная)',
    category: 'neutral',
    hasText: true,
    config: {
      bgStyle: 'matte_vignette',
      color1: '#0d0d10',
      color2: '#1f1f25',
      accent: '#a1a1aa',
      motif: 'none',
      showText: true,
      grain: 14,
      vignette: 20,
      titleStyle: { x: 50, y: 48, align: 'center', fontFamily: 'Manrope', fontSize: 70, fontWeight: 700, letterSpacing: 4, color: '#fafafa', effect: 'clean' },
      artistStyle: { x: 50, y: 58, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 6, color: '#a1a1aa', effect: 'clean' }
    }
  },
  {
    id: 'neutral_clean_type_light',
    name: 'Нейтраль (Светлая)',
    category: 'neutral',
    hasText: true,
    config: {
      bgStyle: 'duotone_mist',
      color1: '#f5f4f0',
      color2: '#e2dfd7',
      accent: '#a8a29e',
      motif: 'none',
      showText: true,
      grain: 12,
      vignette: 6,
      titleStyle: { x: 50, y: 48, align: 'center', fontFamily: 'Outfit', fontSize: 74, fontWeight: 700, letterSpacing: 2, color: '#18181b', effect: 'clean' },
      artistStyle: { x: 50, y: 58, align: 'center', fontFamily: 'Space Mono', fontSize: 22, letterSpacing: 5, color: '#52525b', effect: 'clean' }
    }
  },
  {
    id: 'neutral_editorial_corner',
    name: 'Галерея (Угол)',
    category: 'neutral',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#18181b',
      color2: '#2c2c32',
      accent: '#d4d4d8',
      angle: 135,
      motif: 'none',
      showText: true,
      grain: 14,
      vignette: 14,
      frame: 'thin',
      kickerStyle: { enabled: true, text: 'ARCHIVE EDITION', x: 10, y: 12, align: 'left', fontFamily: 'Space Mono', fontSize: 18, letterSpacing: 4, color: '#a1a1aa' },
      titleStyle: { x: 10, y: 80, align: 'left', fontFamily: 'Playfair Display', fontSize: 72, fontWeight: 700, uppercase: false, color: '#fafafa', effect: 'clean' },
      artistStyle: { x: 10, y: 90, align: 'left', fontFamily: 'Montserrat', fontSize: 22, letterSpacing: 5, color: '#d4d4d8', effect: 'clean' }
    }
  },
  {
    id: 'neutral_sand_minimal',
    name: 'Песочный минимал',
    category: 'neutral',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#e6dfd3',
      color2: '#cfc5b4',
      accent: '#78716c',
      angle: 165,
      motif: 'none',
      showText: true,
      grain: 16,
      vignette: 8,
      titleStyle: { x: 50, y: 82, align: 'center', fontFamily: 'Cormorant Garamond', fontSize: 78, fontWeight: 700, uppercase: false, color: '#1c1917', effect: 'clean' },
      artistStyle: { x: 50, y: 90, align: 'center', fontFamily: 'Montserrat', fontSize: 20, letterSpacing: 7, color: '#57534e', effect: 'clean' }
    }
  },
  {
    id: 'neutral_steel_mist',
    name: 'Стальная дымка',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'aurora_flow',
      color1: '#111317',
      color2: '#2b323c',
      accent: '#71717a',
      bgCenterX: 30,
      bgCenterY: 30,
      bgSpread: 115,
      motif: 'none',
      showText: false,
      grain: 14,
      vignette: 18
    }
  },
  {
    id: 'neutral_concrete_soft',
    name: 'Мягкий бетон',
    category: 'neutral',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#232326',
      color2: '#232326',
      accent: '#a1a1aa',
      motif: 'none',
      showText: false,
      grain: 22,
      vignette: 14
    }
  },

  // GRADIENT RICH PRESETS
  {
    id: 'grad_aurora_prism',
    name: 'Северное сияние',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'aurora_flow',
      color1: '#06131f',
      color2: '#1c0f38',
      accent: '#34d399',
      angle: 130,
      motif: 'none',
      showText: true,
      grain: 12,
      vignette: 18,
      titleStyle: { x: 50, y: 48, align: 'center', fontFamily: 'Outfit', fontSize: 82, fontWeight: 800, color: '#ffffff', effect: 'glow' },
      artistStyle: { x: 50, y: 58, align: 'center', fontFamily: 'Manrope', fontSize: 28, letterSpacing: 7, color: '#a7f3d0' }
    }
  },
  {
    id: 'grad_solar_flare',
    name: 'Солнечный шторм',
    category: 'gradient',
    hasText: false,
    config: {
      bgStyle: 'tri_gradient',
      color1: '#1a0616',
      color2: '#7c1d2b',
      accent: '#fb923c',
      angle: 145,
      motif: 'orb',
      motifScale: 92,
      motifOffsetY: 0,
      showText: false,
      grain: 22,
      vignette: 24
    }
  },
  {
    id: 'grad_velvet_horizon',
    name: 'Бархатный горизонт',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'horizon_fade',
      color1: '#090910',
      color2: '#2d1b4e',
      accent: '#f472b6',
      angle: 180,
      motif: 'none',
      showText: true,
      grain: 16,
      vignette: 10,
      titleStyle: { x: 50, y: 78, align: 'center', fontFamily: 'Syne', fontSize: 86, fontWeight: 800, color: '#fdf2f8' },
      artistStyle: { x: 50, y: 88, align: 'center', fontFamily: 'Space Mono', fontSize: 24, letterSpacing: 6, color: '#f9a8d4' }
    }
  },
  {
    id: 'grad_liquid_chrome',
    name: 'Хром и неон',
    category: 'gradient',
    hasText: false,
    config: {
      bgStyle: 'conic_sweep',
      color1: '#09090b',
      color2: '#1e1b4b',
      accent: '#38bdf8',
      angle: 35,
      motif: 'liquid_rings',
      motifScale: 104,
      showText: false,
      grain: 10,
      vignette: 32
    }
  },
  {
    id: 'grad_crimson_mist',
    name: 'Алая дымка',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'radial_glow',
      color1: '#0b0305',
      color2: '#3f0816',
      accent: '#fb7185',
      motif: 'none',
      showText: true,
      grain: 18,
      vignette: 28,
      titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Cormorant Garamond', fontSize: 102, fontWeight: 700, uppercase: false, letterSpacing: 3, color: '#fff1f2' },
      artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'Montserrat', fontSize: 22, letterSpacing: 9, color: '#fda4af' }
    }
  },
  {
    id: 'grad_cyber_mesh',
    name: 'Жидкий меш',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'mesh',
      color1: '#070a18',
      color2: '#1a1142',
      accent: '#22d3ee',
      angle: 60,
      motif: 'blobs',
      motifOpacity: 75,
      showText: true,
      grain: 10,
      vignette: 14,
      titleStyle: { x: 10, y: 18, align: 'left', fontFamily: 'Bricolage Grotesque', fontSize: 82, fontWeight: 800, color: '#ffffff' },
      artistStyle: { x: 10, y: 89, align: 'left', fontFamily: 'JetBrains Mono', fontSize: 26, letterSpacing: 4, color: '#67e8f9' }
    }
  },
  {
    id: 'grad_peach_dusk',
    name: 'Персиковый закат',
    category: 'gradient',
    hasText: false,
    config: {
      bgStyle: 'tri_gradient',
      color1: '#231123',
      color2: '#88294a',
      accent: '#fdba74',
      angle: 155,
      motif: 'eclipse',
      motifScale: 84,
      motifOffsetY: 0,
      showText: false,
      grain: 20,
      vignette: 16
    }
  },
  {
    id: 'grad_abyss_blue',
    name: 'Глубина океана',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'aurora_flow',
      color1: '#020617',
      color2: '#0f294a',
      accent: '#60a5fa',
      angle: 120,
      motif: 'waves',
      motifOffsetY: -8,
      showText: true,
      grain: 8,
      vignette: 22,
      titleStyle: { x: 50, y: 78, align: 'center', fontFamily: 'Montserrat', fontSize: 74, fontWeight: 900, letterSpacing: 4, color: '#f8fafc' },
      artistStyle: { x: 50, y: 87, align: 'center', fontFamily: 'Manrope', fontSize: 26, letterSpacing: 6, color: '#93c5fd' }
    }
  },
  {
    id: 'grad_acid_lime',
    name: 'Кислотный луч',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'spotlight',
      color1: '#080b05',
      color2: '#1a2709',
      accent: '#bef264',
      motif: 'none',
      showText: true,
      grain: 14,
      vignette: 36,
      titleStyle: { x: 50, y: 49, align: 'center', fontFamily: 'Dela Gothic One', fontSize: 74, color: '#ecfccb' },
      artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'Space Mono', fontSize: 22, letterSpacing: 6, color: '#bef264' }
    }
  },
  {
    id: 'grad_pastel_dream',
    name: 'Пастельный туман',
    category: 'gradient',
    hasText: false,
    config: {
      bgStyle: 'mesh',
      color1: '#e0e7ff',
      color2: '#fce7f3',
      accent: '#f472b6',
      angle: 115,
      motif: 'orb',
      motifScale: 86,
      motifOpacity: 80,
      showText: false,
      grain: 10,
      vignette: 6
    }
  },

  // MINIMALIST PRESETS
  {
    id: 'min_swiss_grid',
    name: 'Швейцарский стиль',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#f4f1ea',
      color2: '#f4f1ea',
      accent: '#dc2626',
      motif: 'none',
      showText: true,
      grain: 10,
      vignette: 0,
      cropMarks: true,
      decals: [{ id: 'd1', type: 'star4', x: 86, y: 15, size: 54, rotate: 0, opacity: 100, color: '#dc2626', style: 'fill' }],
      titleStyle: { x: 10, y: 20, align: 'left', fontFamily: 'Montserrat', fontSize: 76, fontWeight: 900, letterSpacing: -1, color: '#111111' },
      artistStyle: { x: 10, y: 31, align: 'left', fontFamily: 'JetBrains Mono', fontSize: 24, letterSpacing: 4, color: '#dc2626' },
      footerStyle: { enabled: true, text: 'EDITION 01 // STEREO', x: 10, y: 88, align: 'left', color: '#52525b' }
    }
  },
  {
    id: 'min_obsidian_line',
    name: 'Чёрный шёлк',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#08080a',
      color2: '#08080a',
      accent: '#e4e4e7',
      motif: 'none',
      frame: 'thin',
      showText: true,
      grain: 8,
      vignette: 12,
      titleStyle: { x: 50, y: 49, align: 'center', fontFamily: 'Manrope', fontSize: 58, fontWeight: 700, letterSpacing: 10, color: '#ffffff' },
      artistStyle: { x: 50, y: 58, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 8, color: '#a1a1aa' }
    }
  },
  {
    id: 'min_mono_dot',
    name: 'Точка покоя',
    category: 'minimal',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#f8fafc',
      color2: '#f8fafc',
      accent: '#09090b',
      motif: 'orb',
      motifScale: 52,
      motifOffsetY: 0,
      showText: false,
      grain: 12,
      vignette: 0
    }
  },
  {
    id: 'min_editorial_serif',
    name: 'Журнал / Эдиториал',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#ebe7de',
      color2: '#dcd6c8',
      accent: '#18181b',
      angle: 180,
      motif: 'none',
      frame: 'sleeve',
      showText: true,
      grain: 14,
      vignette: 0,
      kickerStyle: { enabled: true, text: 'VOLUME I', x: 50, y: 15, align: 'center', color: '#52525b', fontFamily: 'Space Mono', fontSize: 20 },
      titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Playfair Display', fontSize: 88, fontWeight: 700, uppercase: false, letterSpacing: 1, color: '#111111' },
      artistStyle: { x: 50, y: 84, align: 'center', fontFamily: 'Montserrat', fontSize: 24, letterSpacing: 8, color: '#27272a' }
    }
  },
  {
    id: 'min_negative_arch',
    name: 'Белая арка',
    category: 'minimal',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#141416',
      color2: '#141416',
      accent: '#fafaf9',
      motif: 'arch',
      motifScale: 86,
      motifOffsetY: 2,
      showText: false,
      grain: 15,
      vignette: 18
    }
  },
  {
    id: 'min_polaroid_clean',
    name: 'Чистый Polaroid',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#171717',
      color2: '#2e2b27',
      accent: '#f59e0b',
      motif: 'eclipse',
      motifScale: 72,
      motifOffsetY: -6,
      frame: 'polaroid',
      showText: true,
      grain: 16,
      vignette: 14,
      titleStyle: { x: 50, y: 88, align: 'center', fontFamily: 'Lora', fontSize: 44, uppercase: false, letterSpacing: 1, color: '#18181b', effect: 'clean' },
      artistStyle: { x: 50, y: 94, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 5, color: '#52525b' }
    }
  },
  {
    id: 'min_blue_ink',
    name: 'Кобальт и бумага',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#eff6ff',
      color2: '#eff6ff',
      accent: '#1d4ed8',
      motif: 'rings',
      motifScale: 78,
      motifOffsetY: -6,
      showText: true,
      grain: 8,
      vignette: 0,
      titleStyle: { x: 10, y: 80, align: 'left', fontFamily: 'Outfit', fontSize: 70, fontWeight: 800, color: '#1e3a8a' },
      artistStyle: { x: 10, y: 89, align: 'left', fontFamily: 'Space Mono', fontSize: 22, color: '#1d4ed8' }
    }
  },
  {
    id: 'min_split_contrast',
    name: 'Монолитный раскол',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'split',
      color1: '#09090b',
      color2: '#f4f4f5',
      accent: '#ef4444',
      motif: 'none',
      showText: true,
      grain: 10,
      vignette: 0,
      titleStyle: { x: 50, y: 45, align: 'center', fontFamily: 'Bebas Neue', fontSize: 108, letterSpacing: 6, color: '#ef4444' },
      artistStyle: { x: 50, y: 58, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 24, letterSpacing: 6, color: '#ffffff', boxBg: true }
    }
  },
  {
    id: 'min_subtle_frame',
    name: 'Двойная рамка',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#18181b',
      color2: '#18181b',
      accent: '#d4d4d8',
      motif: 'none',
      frame: 'double',
      showText: true,
      grain: 12,
      vignette: 16,
      kickerStyle: { enabled: true, text: 'NEW SINGLE', x: 50, y: 20, align: 'center', color: '#a1a1aa' },
      titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Oswald', fontSize: 88, letterSpacing: 6, color: '#fafafa' },
      artistStyle: { x: 50, y: 78, align: 'center', fontFamily: 'Manrope', fontSize: 24, letterSpacing: 7, color: '#d4d4d8' }
    }
  },

  // TEXT HEAVY / POSTER PRESETS
  {
    id: 'text_brutal_poster',
    name: 'Брутальный плакат',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#09090b',
      color2: '#09090b',
      accent: '#facc15',
      motif: 'crosshair',
      motifScale: 112,
      motifOpacity: 35,
      showText: true,
      hazardStripe: true,
      grain: 20,
      titleStyle: { x: 50, y: 46, align: 'center', fontFamily: 'Anton', fontSize: 112, letterSpacing: 3, color: '#facc15' },
      artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 28, letterSpacing: 5, color: '#09090b', boxBg: true }
    }
  },
  {
    id: 'text_vapor_street',
    name: 'Стрит-тайпо',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#120826',
      color2: '#2e0f4e',
      accent: '#22d3ee',
      angle: 140,
      motif: 'grid',
      motifOpacity: 58,
      showText: true,
      grain: 16,
      vignette: 26,
      parentalAdvisory: true,
      titleStyle: { x: 8, y: 22, align: 'left', fontFamily: 'Dela Gothic One', fontSize: 78, color: '#ffffff', effect: 'chromatic' },
      artistStyle: { x: 8, y: 34, align: 'left', fontFamily: 'Space Mono', fontSize: 26, color: '#22d3ee' }
    }
  },
  {
    id: 'text_box_highlight',
    name: 'Плашки-маркер',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'stripes',
      color1: '#111113',
      color2: '#1b1b20',
      accent: '#a3e635',
      angle: 45,
      motif: 'none',
      showText: true,
      grain: 18,
      stickerText: 'NEW DROP',
      stickerShape: 'tape',
      stickerColor: '#a3e635',
      titleStyle: { x: 50, y: 47, align: 'center', fontFamily: 'Russo One', fontSize: 76, color: '#09090b', boxBg: true },
      artistStyle: { x: 50, y: 61, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 26, color: '#09090b', boxBg: true }
    }
  },
  {
    id: 'text_gothic_gold',
    name: 'Золото и ночь',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'radial_glow',
      color1: '#070605',
      color2: '#231b0b',
      accent: '#eab308',
      motif: 'orbit_rings',
      motifOpacity: 45,
      showText: true,
      grain: 14,
      vignette: 32,
      decals: [{ id: 'd1', type: 'crown', x: 50, y: 26, size: 76, rotate: 0, opacity: 90, color: '#eab308', style: 'outline' }],
      titleStyle: { x: 50, y: 52, align: 'center', fontFamily: 'Cormorant Garamond', fontSize: 102, fontWeight: 700, color: '#fef08a' },
      artistStyle: { x: 50, y: 64, align: 'center', fontFamily: 'Montserrat', fontSize: 24, letterSpacing: 9, color: '#eab308' }
    }
  },
  {
    id: 'text_barcode_lab',
    name: 'Лаборатория',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#e5e7eb',
      color2: '#e5e7eb',
      accent: '#2563eb',
      motif: 'halftone',
      motifOpacity: 32,
      showText: true,
      barcodeStamp: true,
      hiResStamp: true,
      cropMarks: true,
      grain: 12,
      titleStyle: { x: 10, y: 46, align: 'left', fontFamily: 'Unbounded', fontSize: 72, color: '#09090b' },
      artistStyle: { x: 10, y: 56, align: 'left', fontFamily: 'JetBrains Mono', fontSize: 24, color: '#2563eb' }
    }
  },

  // ART & NO TEXT GRAPHIC PRESETS
  {
    id: 'art_eclipse_void',
    name: 'Чёрное затмение',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'radial_glow',
      color1: '#050507',
      color2: '#1b1411',
      accent: '#facc15',
      motif: 'eclipse',
      motifScale: 100,
      motifOffsetY: 0,
      showText: false,
      grain: 18,
      vignette: 36
    }
  },
  {
    id: 'art_vinyl_club',
    name: 'Виниловый клуб',
    category: 'art',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#140c08',
      color2: '#2c170f',
      accent: '#f59e0b',
      angle: 160,
      motif: 'vinyl',
      motifScale: 96,
      motifOffsetY: -6,
      showText: true,
      grain: 22,
      vignette: 26,
      titleStyle: { x: 50, y: 80, align: 'center', fontFamily: 'Syne', fontSize: 72, color: '#fef3c7' },
      artistStyle: { x: 50, y: 89, align: 'center', fontFamily: 'Montserrat', fontSize: 24, letterSpacing: 7, color: '#fbbf24' }
    }
  },
  {
    id: 'art_prism_spectrum',
    name: 'Спектр призмы',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'spotlight',
      color1: '#05060a',
      color2: '#151828',
      accent: '#38bdf8',
      motif: 'prism',
      motifScale: 100,
      motifOffsetY: 0,
      showText: false,
      grain: 12,
      vignette: 34
    }
  },
  {
    id: 'art_wireframe_core',
    name: '3D-сфера',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'gradient',
      color1: '#040812',
      color2: '#0f2342',
      accent: '#22d3ee',
      angle: 135,
      motif: 'wireframe_sphere',
      motifScale: 100,
      motifOffsetY: 0,
      showText: false,
      grain: 10,
      vignette: 24
    }
  },
  {
    id: 'art_equalizer_night',
    name: 'Ночной бит',
    category: 'art',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#090710',
      color2: '#23113a',
      accent: '#c084fc',
      angle: 180,
      motif: 'equalizer',
      motifScale: 95,
      motifOffsetY: -8,
      showText: true,
      grain: 14,
      vignette: 28,
      titleStyle: { x: 50, y: 78, align: 'center', fontFamily: 'Rubik', fontSize: 78, fontWeight: 900, color: '#ffffff' },
      artistStyle: { x: 50, y: 88, align: 'center', fontFamily: 'Space Mono', fontSize: 24, color: '#d8b4fe' }
    }
  },
  {
    id: 'art_cassette_98',
    name: 'Кассета 98',
    category: 'art',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#1a1109',
      color2: '#422014',
      accent: '#fb923c',
      angle: 130,
      motif: 'cassette',
      motifScale: 96,
      motifOffsetY: -6,
      scanlines: 20,
      grain: 24,
      frame: 'film_strip',
      showText: true,
      titleStyle: { x: 50, y: 79, align: 'center', fontFamily: 'Space Mono', fontSize: 60, color: '#fff7ed' },
      artistStyle: { x: 50, y: 88, align: 'center', fontFamily: 'Montserrat', fontSize: 22, letterSpacing: 6, color: '#fdba74' }
    }
  },
  {
    id: 'art_tunnel_hypnosis',
    name: 'Гипно-туннель',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#08080b',
      color2: '#08080b',
      accent: '#f43f5e',
      motif: 'tunnel',
      motifScale: 108,
      motifOffsetY: 0,
      showText: false,
      grain: 16,
      vignette: 28
    }
  },
  {
    id: 'art_bauhaus_retro',
    name: 'Баухаус Арт',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#f2ece1',
      color2: '#e6decb',
      accent: '#e11d48',
      motif: 'bauhaus',
      motifScale: 98,
      motifOffsetY: 0,
      showText: false,
      grain: 16,
      vignette: 8
    }
  },
  {
    id: 'art_sunset_drive',
    name: 'Синт-закат',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'horizon_fade',
      color1: '#120726',
      color2: '#4c114f',
      accent: '#fb7185',
      motif: 'horizon',
      motifScale: 102,
      motifOffsetY: 0,
      scanlines: 18,
      showText: false,
      grain: 14,
      vignette: 24
    }
  },
  {
    id: 'art_ribbons_flow',
    name: 'Шёлковые ленты',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'gradient',
      color1: '#0b0e17',
      color2: '#1a243d',
      accent: '#f472b6',
      angle: 145,
      motif: 'ribbons',
      motifScale: 100,
      motifOffsetY: 0,
      showText: false,
      grain: 12,
      vignette: 20
    }
  },
  {
    id: 'art_mosaic_geo',
    name: 'Гео-мозаика',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#0c0c10',
      color2: '#1e1e26',
      accent: '#34d399',
      motif: 'mosaic',
      motifScale: 100,
      motifOffsetY: 0,
      showText: false,
      grain: 12,
      vignette: 14
    }
  },
  {
    id: 'art_duality_yin',
    name: 'Дуальность',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'split',
      color1: '#0a0a0c',
      color2: '#f4f4f5',
      accent: '#ef4444',
      motif: 'duality',
      motifScale: 92,
      motifOffsetY: 0,
      showText: false,
      grain: 14,
      vignette: 12
    }
  },
  {
    id: 'art_sunburst_gold',
    name: 'Сияние лучей',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'radial_glow',
      color1: '#140c04',
      color2: '#3b2407',
      accent: '#facc15',
      motif: 'sunburst',
      motifScale: 108,
      motifOffsetY: 0,
      showText: false,
      grain: 14,
      vignette: 28
    }
  },
  // CLASSIC & EXTRA DIVERSE PRESETS (RESTORED + NEW)
  {
    id: 'grad_midnight_neon',
    name: 'Неон-ночь',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#050816',
      color2: '#2e0854',
      accent: '#f43f5e',
      angle: 135,
      motif: 'portal_frame',
      motifScale: 96,
      showText: true,
      grain: 12,
      vignette: 24,
      titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Unbounded', fontSize: 78, color: '#ffffff', effect: 'glow' },
      artistStyle: { x: 50, y: 61, align: 'center', fontFamily: 'Montserrat', fontSize: 24, letterSpacing: 7, color: '#fda4af' }
    }
  },
  {
    id: 'grad_mint_chrome',
    name: 'Мятный металл',
    category: 'gradient',
    hasText: false,
    config: {
      bgStyle: 'conic_sweep',
      color1: '#06201f',
      color2: '#0f4c46',
      accent: '#5eead4',
      angle: 75,
      motif: 'broken_ring',
      motifScale: 102,
      showText: false,
      grain: 10,
      vignette: 20
    }
  },
  {
    id: 'grad_sunset_gold',
    name: 'Золотой час',
    category: 'gradient',
    hasText: true,
    config: {
      bgStyle: 'tri_gradient',
      color1: '#1f0c05',
      color2: '#9a3412',
      accent: '#fde047',
      angle: 165,
      motif: 'crescent_arc',
      motifOpacity: 78,
      showText: true,
      grain: 15,
      vignette: 18,
      titleStyle: { x: 10, y: 78, align: 'left', fontFamily: 'Playfair Display', fontSize: 92, uppercase: false, color: '#fef9c3' },
      artistStyle: { x: 10, y: 88, align: 'left', fontFamily: 'Manrope', fontSize: 24, letterSpacing: 6, color: '#fdba74' }
    }
  },
  {
    id: 'grad_frost_ice',
    name: 'Ледяной кристалл',
    category: 'gradient',
    hasText: false,
    config: {
      bgStyle: 'mesh',
      color1: '#0b192c',
      color2: '#1e3a5f',
      accent: '#bae6fd',
      motif: 'glass_shards',
      motifScale: 98,
      showText: false,
      grain: 8,
      vignette: 16
    }
  },
  {
    id: 'min_cream_monolith',
    name: 'Бежевый монолит',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#ebe5d9',
      color2: '#ebe5d9',
      accent: '#18181b',
      motif: 'monolith',
      motifScale: 82,
      motifOffsetY: -6,
      showText: true,
      grain: 14,
      vignette: 0,
      titleStyle: { x: 50, y: 80, align: 'center', fontFamily: 'Bricolage Grotesque', fontSize: 66, color: '#18181b' },
      artistStyle: { x: 50, y: 89, align: 'center', fontFamily: 'Space Mono', fontSize: 20, letterSpacing: 6, color: '#52525b' }
    }
  },
  {
    id: 'min_silver_orbit',
    name: 'Серебряная орбита',
    category: 'minimal',
    hasText: false,
    config: {
      bgStyle: 'gradient',
      color1: '#18181b',
      color2: '#27272a',
      accent: '#e4e4e7',
      angle: 135,
      motif: 'crescent_arc',
      motifScale: 94,
      showText: false,
      grain: 12,
      vignette: 18
    }
  },
  {
    id: 'min_gallery_white',
    name: 'Галерея 01',
    category: 'minimal',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#fafafa',
      color2: '#fafafa',
      accent: '#111111',
      motif: 'minimal_squares',
      motifScale: 70,
      motifOffsetY: -8,
      frame: 'thin',
      showText: true,
      grain: 6,
      vignette: 0,
      titleStyle: { x: 50, y: 80, align: 'center', fontFamily: 'Manrope', fontSize: 56, fontWeight: 800, letterSpacing: 6, color: '#09090b' },
      artistStyle: { x: 50, y: 88, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 5, color: '#71717a' }
    }
  },
  {
    id: 'min_topo_dark',
    name: 'Тёмный рельеф',
    category: 'minimal',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#0a0b0e',
      color2: '#0a0b0e',
      accent: '#94a3b8',
      motif: 'topography',
      motifScale: 112,
      motifOpacity: 62,
      showText: false,
      grain: 16,
      vignette: 26
    }
  },
  {
    id: 'min_dot_sphere',
    name: 'Точечная сфера',
    category: 'minimal',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#0f172a',
      color2: '#0f172a',
      accent: '#f8fafc',
      motif: 'dot_sphere',
      motifScale: 96,
      showText: false,
      grain: 10,
      vignette: 22
    }
  },
  {
    id: 'text_cyber_terminal',
    name: 'Кибер-терминал',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'solid',
      color1: '#030806',
      color2: '#071a12',
      accent: '#10b981',
      motif: 'radial_mesh',
      motifOpacity: 42,
      scanlines: 26,
      cropMarks: true,
      barcodeStamp: true,
      showText: true,
      grain: 14,
      kickerStyle: { enabled: true, text: 'SYS // TRACK_01', x: 10, y: 14, align: 'left', color: '#34d399', fontFamily: 'JetBrains Mono' },
      titleStyle: { x: 10, y: 48, align: 'left', fontFamily: 'JetBrains Mono', fontSize: 74, color: '#ecfdf5', effect: 'glow' },
      artistStyle: { x: 10, y: 60, align: 'left', fontFamily: 'Space Mono', fontSize: 24, color: '#10b981' }
    }
  },
  {
    id: 'text_indie_zine',
    name: 'Инди-журнал',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'checker',
      color1: '#f5f2eb',
      color2: '#eae5d9',
      accent: '#e11d48',
      motif: 'none',
      frame: 'sleeve',
      showText: true,
      grain: 22,
      vignette: 0,
      stickerText: 'DEMO TAPE',
      stickerShape: 'circle',
      stickerColor: '#facc15',
      titleStyle: { x: 50, y: 45, align: 'center', fontFamily: 'Lora', fontSize: 94, uppercase: false, color: '#111111' },
      artistStyle: { x: 50, y: 58, align: 'center', fontFamily: 'Montserrat', fontSize: 24, letterSpacing: 6, color: '#e11d48' }
    }
  },
  {
    id: 'text_heavy_metal',
    name: 'Тяжёлый гранж',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'radial_glow',
      color1: '#070708',
      color2: '#270909',
      accent: '#ef4444',
      motif: 'diagonal_bars',
      motifOpacity: 48,
      parentalAdvisory: true,
      showText: true,
      grain: 34,
      vignette: 44,
      glitch: 24,
      titleStyle: { x: 50, y: 46, align: 'center', fontFamily: 'Dela Gothic One', fontSize: 82, color: '#ffffff', effect: 'chromatic' },
      artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'Russo One', fontSize: 26, letterSpacing: 6, color: '#ef4444' }
    }
  },
  {
    id: 'text_lofi_tape',
    name: 'Lo-Fi блокнот',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'horizon_fade',
      color1: '#2b241d',
      color2: '#5c4938',
      accent: '#fcd34d',
      motif: 'cassette',
      motifScale: 84,
      motifOffsetY: -10,
      frame: 'polaroid',
      showText: true,
      grain: 26,
      vignette: 16,
      titleStyle: { x: 50, y: 88, align: 'center', fontFamily: 'Space Mono', fontSize: 40, color: '#18181b', effect: 'clean' },
      artistStyle: { x: 50, y: 94, align: 'center', fontFamily: 'Manrope', fontSize: 20, letterSpacing: 4, color: '#52525b' }
    }
  },
  {
    id: 'text_y2k_chrome',
    name: 'Y2K Хром',
    category: 'text',
    hasText: true,
    config: {
      bgStyle: 'gradient',
      color1: '#090910',
      color2: '#1e293b',
      accent: '#38bdf8',
      angle: 145,
      motif: 'orbit_rings',
      motifScale: 108,
      motifOpacity: 60,
      showText: true,
      grain: 12,
      vignette: 24,
      decals: [
        { id: 'dy1', type: 'chrome_cross', x: 84, y: 16, size: 78, rotate: 0, opacity: 95, color: '#ffffff', style: 'glow' }
      ],
      titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Syne', fontSize: 90, fontWeight: 900, color: '#f8fafc', effect: 'chromatic' },
      artistStyle: { x: 50, y: 62, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 24, letterSpacing: 6, color: '#7dd3fc' }
    }
  },
  {
    id: 'art_spiral_hypno',
    name: 'Гипно-спираль',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'solid',
      color1: '#09090b',
      color2: '#18181b',
      accent: '#ffffff',
      motif: 'spiral_vortex',
      motifScale: 108,
      showText: false,
      grain: 16,
      vignette: 28
    }
  },
  {
    id: 'art_diagonal_arch',
    name: 'Диагональ',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'gradient',
      color1: '#18181b',
      color2: '#09090b',
      accent: '#f59e0b',
      angle: 135,
      motif: 'diagonal_bars',
      motifScale: 104,
      showText: false,
      grain: 14,
      vignette: 20
    }
  },
  {
    id: 'art_silk_aurora',
    name: 'Волны шёлка',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'aurora_flow',
      color1: '#0b0914',
      color2: '#1f1538',
      accent: '#a78bfa',
      motif: 'aurora_waves',
      motifScale: 104,
      showText: false,
      grain: 10,
      vignette: 18
    }
  },
  {
    id: 'art_radar_web',
    name: 'Радарная сеть',
    category: 'art',
    hasText: true,
    config: {
      bgStyle: 'radial_glow',
      color1: '#040a0f',
      color2: '#0c2333',
      accent: '#22d3ee',
      motif: 'radial_mesh',
      motifScale: 102,
      showText: true,
      grain: 12,
      vignette: 24,
      titleStyle: { x: 50, y: 80, align: 'center', fontFamily: 'Outfit', fontSize: 72, color: '#ffffff' },
      artistStyle: { x: 50, y: 89, align: 'center', fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 6, color: '#67e8f9' }
    }
  },
  {
    id: 'art_portal_minimal',
    name: 'Портал глубины',
    category: 'notext',
    hasText: false,
    config: {
      bgStyle: 'spotlight',
      color1: '#070709',
      color2: '#1c1917',
      accent: '#fb923c',
      motif: 'portal_frame',
      motifScale: 104,
      showText: false,
      grain: 14,
      vignette: 28
    }
  }
];

// --- Extra templates: minimal and expressive ---
const tpl = (
  id: string, name: string, category: TemplateCategory, hasText: boolean,
  config: CoverTemplatePreset['config']
): CoverTemplatePreset => ({ id, name, category, hasText, config });

COVER_TEMPLATES.push(
  // MINIMAL
  tpl('min_swiss_paper', 'Швейцарская бумага', 'minimal', true, { bgStyle: 'solid', color1: '#f2f0eb', color2: '#f2f0eb', accent: '#18181b', motif: 'grid', motifOpacity: 6, grain: 14, vignette: 0,
    titleStyle: { x: 8, y: 16, align: 'left', fontFamily: 'Inter Tight', fontWeight: 800, fontSize: 92, letterSpacing: -3, uppercase: false, color: '#111111', effect: 'clean' },
    artistStyle: { x: 8, y: 24, align: 'left', fontFamily: 'Inter Tight', fontWeight: 500, fontSize: 30, color: '#52525b', effect: 'clean' } }),
  tpl('min_black_serif', 'Чёрная антиква', 'minimal', true, { bgStyle: 'solid', color1: '#0a0a0a', color2: '#0a0a0a', accent: '#a8a29e', motif: 'none', grain: 10, vignette: 18,
    titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Prata', fontWeight: 400, fontSize: 84, letterSpacing: 0, uppercase: false, color: '#f5f5f4', effect: 'clean' },
    artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'Tenor Sans', fontWeight: 400, fontSize: 22, letterSpacing: 10, uppercase: true, color: '#a8a29e', effect: 'clean' } }),
  tpl('min_receipt', 'Чек', 'minimal', true, { bgStyle: 'solid', color1: '#e7e5e4', color2: '#e7e5e4', accent: '#111111', motif: 'none', grain: 18, vignette: 0,
    titleStyle: { x: 8, y: 12, align: 'left', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 44, uppercase: true, color: '#111111', effect: 'clean' },
    artistStyle: { x: 8, y: 18, align: 'left', fontFamily: 'JetBrains Mono', fontWeight: 400, fontSize: 22, color: '#44403c', effect: 'clean' } }),
  tpl('min_one_orb', 'Одна сфера', 'minimal', true, { bgStyle: 'solid', color1: '#111114', color2: '#111114', accent: '#e4e4e7', motif: 'orb', motifScale: 70, motifOpacity: 90, grain: 12, vignette: 20,
    titleStyle: { x: 50, y: 86, align: 'center', fontFamily: 'Jost', fontWeight: 500, fontSize: 34, letterSpacing: 14, uppercase: true, color: '#fafafa', effect: 'clean' },
    artistStyle: { x: 50, y: 91, align: 'center', fontFamily: 'Jost', fontWeight: 400, fontSize: 20, letterSpacing: 6, uppercase: true, color: '#a1a1aa', effect: 'clean' } }),
  tpl('min_horizon', 'Горизонт', 'minimal', true, { bgStyle: 'horizon_fade', color1: '#0b1220', color2: '#1e293b', accent: '#cbd5e1', motif: 'horizon', motifOpacity: 50, grain: 10, vignette: 14,
    titleStyle: { x: 8, y: 80, align: 'left', fontFamily: 'Geologica', fontWeight: 700, fontSize: 70, letterSpacing: -1, color: '#f8fafc', effect: 'clean' },
    artistStyle: { x: 8, y: 87, align: 'left', fontFamily: 'Geologica', fontWeight: 400, fontSize: 26, color: '#94a3b8', effect: 'clean' } }),
  tpl('min_cream_display', 'Кремовый дисплей', 'minimal', true, { bgStyle: 'solid', color1: '#efe7da', color2: '#efe7da', accent: '#5b4b3a', motif: 'none', grain: 20, vignette: 6,
    titleStyle: { x: 50, y: 48, align: 'center', fontFamily: 'Yeseva One', fontWeight: 400, fontSize: 120, lineHeight: 0.95, color: '#2b2118', effect: 'clean' },
    artistStyle: { x: 50, y: 66, align: 'center', fontFamily: 'Forum', fontWeight: 400, fontSize: 24, letterSpacing: 8, uppercase: true, color: '#5b4b3a', effect: 'clean' } }),
  tpl('min_tiny_corner', 'Маленький угол', 'minimal', true, { bgStyle: 'solid', color1: '#fafafa', color2: '#fafafa', accent: '#71717a', motif: 'none', grain: 8, vignette: 0,
    titleStyle: { x: 8, y: 10, align: 'left', fontFamily: 'Onest', fontWeight: 600, fontSize: 30, color: '#111111', effect: 'clean' },
    artistStyle: { x: 8, y: 14, align: 'left', fontFamily: 'Onest', fontWeight: 400, fontSize: 22, color: '#71717a', effect: 'clean' } }),
  tpl('min_red_block', 'Красный блок', 'minimal', true, { bgStyle: 'solid', color1: '#e11d2e', color2: '#e11d2e', accent: '#0a0a0a', motif: 'none', grain: 16, vignette: 10,
    titleStyle: { x: 6, y: 86, align: 'left', fontFamily: 'Rubik Mono One', fontWeight: 400, fontSize: 92, uppercase: true, color: '#0a0a0a', effect: 'clean' },
    artistStyle: { x: 6, y: 93, align: 'left', fontFamily: 'Jost', fontWeight: 600, fontSize: 22, letterSpacing: 6, uppercase: true, color: '#0a0a0a', effect: 'clean' } }),
  tpl('min_slate_spaced', 'Сланец разрядка', 'neutral', true, { bgStyle: 'gradient', color1: '#0c1117', color2: '#1e293b', accent: '#94a3b8', angle: 160, motif: 'none', grain: 12, vignette: 18,
    titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Inter Tight', fontWeight: 300, fontSize: 32, letterSpacing: 16, uppercase: true, color: '#e2e8f0', effect: 'clean' },
    artistStyle: { x: 50, y: 56, align: 'center', fontFamily: 'Inter Tight', fontWeight: 400, fontSize: 18, letterSpacing: 6, uppercase: true, color: '#94a3b8', effect: 'clean' } }),
  tpl('min_paper_serif', 'Бумажная антиква', 'neutral', true, { bgStyle: 'solid', color1: '#f5f2eb', color2: '#f5f2eb', accent: '#57534e', motif: 'none', grain: 22, vignette: 4,
    titleStyle: { x: 8, y: 14, align: 'left', fontFamily: 'Cormorant Garamond', fontWeight: 700, fontSize: 96, color: '#1c1917', effect: 'clean' },
    artistStyle: { x: 8, y: 22, align: 'left', fontFamily: 'Inter Tight', fontWeight: 500, fontSize: 22, letterSpacing: 4, uppercase: true, color: '#57534e', effect: 'clean' } }),

  // EXPRESSIVE
  tpl('art_hand_dusk', 'Рукописный закат', 'art', true, { bgStyle: 'gradient', color1: '#2d1b3d', color2: '#f59e0b', accent: '#fde68a', angle: 160, motif: 'sunburst', motifOpacity: 22, grain: 16, vignette: 18,
    titleStyle: { x: 50, y: 72, align: 'center', fontFamily: 'Caveat', fontWeight: 700, fontSize: 124, color: '#fff7ed', effect: 'shadow' },
    artistStyle: { x: 50, y: 83, align: 'center', fontFamily: 'Caveat', fontWeight: 500, fontSize: 42, color: '#fde68a', effect: 'clean' } }),
  tpl('art_y2k_chrome', 'Y2K хром', 'art', true, { bgStyle: 'conic_sweep', color1: '#c0c0c0', color2: '#1e3a8a', accent: '#e0f2fe', motif: 'liquid_rings', motifOpacity: 55, grain: 8, vignette: 20,
    titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Exo 2', fontWeight: 900, fontSize: 92, letterSpacing: 1, uppercase: true, color: '#ffffff', effect: 'chromatic' },
    artistStyle: { x: 50, y: 62, align: 'center', fontFamily: 'Exo 2', fontWeight: 600, fontSize: 22, letterSpacing: 8, uppercase: true, color: '#e0f2fe', effect: 'clean' } }),
  tpl('art_pixel_arcade', 'Аркада', 'art', true, { bgStyle: 'solid', color1: '#0b0b1a', color2: '#0b0b1a', accent: '#22d3ee', motif: 'grid', motifOpacity: 25, scanlines: 30, grain: 6, vignette: 30,
    titleStyle: { x: 50, y: 46, align: 'center', fontFamily: 'Press Start 2P', fontWeight: 400, fontSize: 48, uppercase: true, color: '#22d3ee', effect: 'glow' },
    artistStyle: { x: 50, y: 56, align: 'center', fontFamily: 'Press Start 2P', fontWeight: 400, fontSize: 18, uppercase: true, color: '#f0abfc', effect: 'clean' } }),
  tpl('art_neon_script', 'Неоновая подпись', 'art', true, { bgStyle: 'radial_glow', color1: '#0a0014', color2: '#4c1d95', accent: '#f9a8d4', motif: 'none', grain: 10, vignette: 30,
    titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Marck Script', fontWeight: 400, fontSize: 110, color: '#f9a8d4', effect: 'glow' },
    artistStyle: { x: 50, y: 64, align: 'center', fontFamily: 'Jost', fontWeight: 500, fontSize: 20, letterSpacing: 12, uppercase: true, color: '#e9d5ff', effect: 'clean' } }),
  tpl('art_vinyl_soul', 'Виниловый соул', 'art', true, { bgStyle: 'matte_vignette', color1: '#1c1410', color2: '#3b2a1f', accent: '#d6a46a', motif: 'vinyl', motifScale: 95, motifOpacity: 85, grain: 18, vignette: 26,
    titleStyle: { x: 50, y: 86, align: 'center', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 64, color: '#f5e6d3', effect: 'clean' },
    artistStyle: { x: 50, y: 92, align: 'center', fontFamily: 'Tenor Sans', fontWeight: 400, fontSize: 20, letterSpacing: 8, uppercase: true, color: '#d6a46a', effect: 'clean' } }),
  tpl('art_aurora_soft', 'Мягкая аврора', 'gradient', true, { bgStyle: 'aurora_flow', color1: '#0f172a', color2: '#14b8a6', accent: '#a78bfa', motif: 'aurora_waves', motifOpacity: 45, grain: 10, vignette: 16,
    titleStyle: { x: 50, y: 48, align: 'center', fontFamily: 'Onest', fontWeight: 800, fontSize: 86, letterSpacing: -2, color: '#ffffff', effect: 'shadow' },
    artistStyle: { x: 50, y: 58, align: 'center', fontFamily: 'Onest', fontWeight: 500, fontSize: 26, color: '#e2e8f0', effect: 'clean' } }),
  tpl('art_bauhaus_cream', 'Баухаус крем', 'art', true, { bgStyle: 'solid', color1: '#f1ead8', color2: '#f1ead8', accent: '#d9480f', motif: 'bauhaus', motifOpacity: 90, grain: 14, vignette: 4,
    titleStyle: { x: 8, y: 88, align: 'left', fontFamily: 'Jost', fontWeight: 700, fontSize: 58, uppercase: true, color: '#1a1a1a', effect: 'clean' },
    artistStyle: { x: 8, y: 94, align: 'left', fontFamily: 'Jost', fontWeight: 500, fontSize: 20, letterSpacing: 6, uppercase: true, color: '#3f3f46', effect: 'clean' } }),
  tpl('art_tunnel_mono', 'Монотонный тоннель', 'art', true, { bgStyle: 'solid', color1: '#09090b', color2: '#09090b', accent: '#fafafa', motif: 'tunnel', motifOpacity: 55, grain: 12, vignette: 24,
    titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Unbounded', fontWeight: 800, fontSize: 54, letterSpacing: 2, uppercase: true, color: '#ffffff', effect: 'outline' },
    artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'Inter Tight', fontWeight: 500, fontSize: 18, letterSpacing: 10, uppercase: true, color: '#d4d4d8', effect: 'clean' } }),
  tpl('art_eclipse_gold', 'Золотое затмение', 'art', true, { bgStyle: 'radial_glow', color1: '#050505', color2: '#1c1917', accent: '#fbbf24', motif: 'eclipse', motifOpacity: 90, grain: 12, vignette: 28,
    titleStyle: { x: 50, y: 82, align: 'center', fontFamily: 'Cormorant Garamond', fontWeight: 700, fontSize: 90, color: '#fde68a', effect: 'glow' },
    artistStyle: { x: 50, y: 89, align: 'center', fontFamily: 'Tenor Sans', fontWeight: 400, fontSize: 18, letterSpacing: 10, uppercase: true, color: '#e7e5e4', effect: 'clean' } }),
  tpl('art_topo_green', 'Топография', 'art', true, { bgStyle: 'gradient', color1: '#052e16', color2: '#14532d', accent: '#86efac', angle: 150, motif: 'topography', motifOpacity: 35, grain: 14, vignette: 18,
    titleStyle: { x: 8, y: 84, align: 'left', fontFamily: 'Geologica', fontWeight: 800, fontSize: 76, letterSpacing: -2, color: '#ecfdf5', effect: 'clean' },
    artistStyle: { x: 8, y: 91, align: 'left', fontFamily: 'Geologica', fontWeight: 400, fontSize: 24, color: '#bbf7d0', effect: 'clean' } }),
  tpl('art_glass_shards', 'Стеклянные осколки', 'gradient', true, { bgStyle: 'tri_gradient', color1: '#0f0c29', color2: '#302b63', accent: '#24c6dc', motif: 'glass_shards', motifOpacity: 60, grain: 8, vignette: 20,
    titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Golos Text', fontWeight: 800, fontSize: 80, letterSpacing: -1, color: '#ffffff', effect: 'shadow' },
    artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'Golos Text', fontWeight: 500, fontSize: 24, color: '#cffafe', effect: 'clean' } }),
  tpl('art_pastel_soft', 'Пастельное облако', 'gradient', true, { bgStyle: 'duotone_mist', color1: '#fde2e4', color2: '#cddafd', accent: '#ffffff', motif: 'blobs', motifOpacity: 60, grain: 10, vignette: 0,
    titleStyle: { x: 50, y: 50, align: 'center', fontFamily: 'Comfortaa', fontWeight: 700, fontSize: 84, color: '#3f3d56', effect: 'clean' },
    artistStyle: { x: 50, y: 60, align: 'center', fontFamily: 'Comfortaa', fontWeight: 400, fontSize: 26, color: '#5b5a72', effect: 'clean' } }),
  tpl('art_halftone_pop', 'Поп-арт растр', 'art', true, { bgStyle: 'solid', color1: '#fef08a', color2: '#fef08a', accent: '#111111', motif: 'halftone', motifOpacity: 30, grain: 10, vignette: 0,
    titleStyle: { x: 50, y: 52, align: 'center', fontFamily: 'Anton', fontWeight: 400, fontSize: 130, lineHeight: 0.9, uppercase: true, color: '#111111', effect: 'clean' },
    artistStyle: { x: 50, y: 68, align: 'center', fontFamily: 'Bebas Neue', fontWeight: 400, fontSize: 34, letterSpacing: 6, uppercase: true, color: '#111111', effect: 'clean' } }),
  tpl('art_night_stars', 'Звёздная ночь', 'art', true, { bgStyle: 'gradient', color1: '#020617', color2: '#1e1b4b', accent: '#c7d2fe', angle: 180, motif: 'stars', motifOpacity: 70, grain: 8, vignette: 22,
    titleStyle: { x: 50, y: 46, align: 'center', fontFamily: 'Yeseva One', fontWeight: 400, fontSize: 88, color: '#f8fafc', effect: 'glow' },
    artistStyle: { x: 50, y: 56, align: 'center', fontFamily: 'Forum', fontWeight: 400, fontSize: 22, letterSpacing: 10, uppercase: true, color: '#c7d2fe', effect: 'clean' } }),

  // NO TEXT
  tpl('notext_orb_indigo', 'Индиго сфера', 'gradient', false, { bgStyle: 'radial_glow', color1: '#0b0b10', color2: '#312e81', accent: '#a5b4fc', motif: 'orb', motifOpacity: 85, grain: 10, vignette: 24 }),
  tpl('notext_rings_sand', 'Песочные кольца', 'neutral', false, { bgStyle: 'solid', color1: '#d6cfc2', color2: '#d6cfc2', accent: '#57534e', motif: 'rings', motifOpacity: 55, grain: 18, vignette: 6 }),
  tpl('notext_monolith', 'Монолит', 'neutral', false, { bgStyle: 'matte_vignette', color1: '#0c0c0e', color2: '#1f1f24', accent: '#a1a1aa', motif: 'monolith', motifOpacity: 70, grain: 16, vignette: 26 }),
  tpl('notext_dot_sphere', 'Точечная сфера', 'art', false, { bgStyle: 'solid', color1: '#09090b', color2: '#09090b', accent: '#f4f4f5', motif: 'dot_sphere', motifOpacity: 80, grain: 8, vignette: 20 })
);

function hexToRgba(hex: string, alpha: number): string {
  const safeHex = (hex || '#000000').trim();
  const clean = safeHex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map(ch => ch + ch)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return `rgba(0, 0, 0, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function mixHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => {
    const clean = (h || '#000000').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
    const num = parseInt(full, 16);
    if (Number.isNaN(num)) return [0, 0, 0];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };
  const a = parse(hexA);
  const b = parse(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

let cachedGrainCanvas: HTMLCanvasElement | null = null;
function getGrainPatternCanvas(): HTMLCanvasElement {
  if (cachedGrainCanvas) return cachedGrainCanvas;
  const gc = document.createElement('canvas');
  gc.width = 256;
  gc.height = 256;
  const gctx = gc.getContext('2d');
  if (gctx) {
    const img = gctx.createImageData(256, 256);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 36;
    }
    gctx.putImageData(img, 0, 0);
  }
  cachedGrainCanvas = gc;
  return gc;
}

// v2.5: the real Parental Advisory label (embedded, so it always loads and never taints the canvas)
const PA_IMAGE_SRC = 'data:image/png;base64,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';
let cachedPaImage: HTMLImageElement | null = null;
let cachedPaImageAttempted = false;

function getParentalAdvisoryImage(onLoadNotify?: () => void): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;
  if (!cachedPaImage && !cachedPaImageAttempted) {
    cachedPaImageAttempted = true;
    const img = new Image();
    img.onload = () => {
      cachedPaImage = img;
      onLoadNotify?.();
    };
    img.onerror = () => {
      cachedPaImage = null;
      cachedPaImageAttempted = false;
    };
    img.src = PA_IMAGE_SRC;
    cachedPaImage = img;
  }
  return cachedPaImage;
}

function drawAuthenticParentalAdvisory(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = Math.max(4, w * 0.04);
  const paImg = cachedPaImage;
  if (paImg && paImg.complete && paImg.naturalWidth > 0) {
    ctx.drawImage(paImg, x, y, w, h);
    ctx.restore();
    return;
  }

  ctx.fillStyle = '#070707';
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;

  const border = Math.max(1.5, w * 0.018);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = border;
  ctx.strokeRect(x + border * 0.5, y + border * 0.5, w - border, h - border);

  const innerPad = Math.max(2, w * 0.025);
  const ix = x + innerPad;
  const iy = y + innerPad;
  const iw = w - innerPad * 2;
  const ih = h - innerPad * 2;

  const topH = ih * 0.30;
  const midH = ih * 0.42;
  const botH = ih * 0.28;

  ctx.fillStyle = '#050505';
  ctx.fillRect(ix, iy, iw, topH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ix, iy + topH, iw, midH);
  ctx.fillStyle = '#050505';
  ctx.fillRect(ix, iy + topH + midH, iw, botH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.max(7, Math.round(topH * 0.72))}px "Arial Black", "Montserrat", sans-serif`;
  ctx.fillText('PARENTAL', ix + iw / 2, iy + topH * 0.54, iw * 0.88);

  ctx.fillStyle = '#050505';
  ctx.font = `900 ${Math.max(8, Math.round(midH * 0.76))}px "Arial Black", "Montserrat", sans-serif`;
  ctx.fillText('ADVISORY', ix + iw / 2, iy + topH + midH * 0.54, iw * 0.92);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.max(6, Math.round(botH * 0.66))}px "Arial", "Montserrat", sans-serif`;
  ctx.fillText('EXPLICIT CONTENT', ix + iw / 2, iy + topH + midH + botH * 0.54, iw * 0.90);

  ctx.restore();
}

function drawVectorDecal(
  ctx: CanvasRenderingContext2D,
  type: CoverDecalType,
  cx: number,
  cy: number,
  size: number,
  color: string,
  rotateDeg: number,
  opacity: number,
  style: CoverDecalStyle
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotateDeg * Math.PI) / 180);
  ctx.globalAlpha = clampNum(opacity, 5, 100) / 100;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (style === 'glow') {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.38;
  }

  const paintPath = () => {
    if (style === 'outline') ctx.stroke();
    else ctx.fill();
  };

  const r = size / 2;
  if (type === 'star4') {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.28;
      if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    paintPath();
  } else if (type === 'star8') {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI) / 8;
      const rad = i % 2 === 0 ? r : r * 0.38;
      if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    paintPath();
  } else if (type === 'heart') {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.72);
    ctx.bezierCurveTo(-r * 1.18, r * 0.05, -r * 0.92, -r * 0.92, 0, -r * 0.25);
    ctx.bezierCurveTo(r * 0.92, -r * 0.92, r * 1.18, r * 0.05, 0, r * 0.72);
    ctx.closePath();
    paintPath();
  } else if (type === 'broken_heart') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.04, r * 0.72);
    ctx.bezierCurveTo(-r * 1.15, r * 0.05, -r * 0.90, -r * 0.90, -r * 0.05, -r * 0.25);
    ctx.lineTo(-r * 0.14, r * 0.06);
    ctx.lineTo(r * 0.04, r * 0.24);
    ctx.closePath();
    paintPath();
    ctx.beginPath();
    ctx.moveTo(r * 0.08, r * 0.72);
    ctx.lineTo(r * 0.15, r * 0.24);
    ctx.lineTo(-r * 0.02, r * 0.06);
    ctx.lineTo(r * 0.06, -r * 0.25);
    ctx.bezierCurveTo(r * 0.92, -r * 0.90, r * 1.18, r * 0.05, r * 0.08, r * 0.72);
    ctx.closePath();
    paintPath();
  } else if (type === 'lightning') {
    ctx.beginPath();
    ctx.moveTo(r * 0.18, -r * 0.95);
    ctx.lineTo(-r * 0.52, r * 0.06);
    ctx.lineTo(0, r * 0.06);
    ctx.lineTo(-r * 0.22, r * 0.95);
    ctx.lineTo(r * 0.56, -r * 0.10);
    ctx.lineTo(r * 0.04, -r * 0.10);
    ctx.closePath();
    paintPath();
  } else if (type === 'crown') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, r * 0.58);
    ctx.lineTo(-r * 0.92, -r * 0.42);
    ctx.lineTo(-r * 0.38, r * 0.04);
    ctx.lineTo(0, -r * 0.68);
    ctx.lineTo(r * 0.38, r * 0.04);
    ctx.lineTo(r * 0.92, -r * 0.42);
    ctx.lineTo(r * 0.85, r * 0.58);
    ctx.closePath();
    paintPath();
  } else if (type === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-r * 0.88, r * 0.55, -r * 0.65, -r * 0.28, -r * 0.08, -r * 0.92);
    ctx.bezierCurveTo(r * 0.25, -r * 0.42, r * 0.08, -r * 0.16, r * 0.38, -r * 0.45);
    ctx.bezierCurveTo(r * 0.92, 0, r * 0.72, r * 0.72, 0, r * 0.9);
    ctx.closePath();
    paintPath();
  } else if (type === 'butterfly') {
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side * r * 0.95, -r * 0.95, side * r * 1.05, -r * 0.05, side * r * 0.22, r * 0.05);
      ctx.bezierCurveTo(side * r * 0.82, r * 0.24, side * r * 0.64, r * 0.88, 0, r * 0.36);
      ctx.closePath();
      paintPath();
    });
  } else if (type === 'moon') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0.4, Math.PI * 2 - 0.4, false);
    ctx.arc(r * 0.38, -r * 0.10, r * 0.68, Math.PI * 2 - 0.85, 0.85, true);
    ctx.closePath();
    paintPath();
  } else if (type === 'sun') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    paintPath();
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r * 0.56, Math.sin(ang) * r * 0.56);
      ctx.lineTo(Math.cos(ang) * r * 0.92, Math.sin(ang) * r * 0.92);
      ctx.stroke();
    }
  } else if (type === 'eye') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, 0);
    ctx.quadraticCurveTo(0, -r * 0.78, r * 0.95, 0);
    ctx.quadraticCurveTo(0, r * 0.78, -r * 0.95, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    paintPath();
  } else if (type === 'wings') {
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.1, r * 0.2);
      ctx.quadraticCurveTo(side * r * 0.7, -r * 0.75, side * r * 0.96, -r * 0.45);
      ctx.quadraticCurveTo(side * r * 0.85, 0, side * r * 0.52, r * 0.38);
      ctx.quadraticCurveTo(side * r * 0.28, r * 0.52, side * r * 0.1, r * 0.2);
      ctx.closePath();
      paintPath();
    });
  } else if (type === 'vinyl_disc') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    if (style === 'outline') ctx.stroke();
    else {
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.56, 0.2, 1.8);
    ctx.stroke();
  } else if (type === 'note') {
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, r * 0.48, r * 0.32, r * 0.24, -0.35, 0, Math.PI * 2);
    paintPath();
    ctx.beginPath();
    ctx.moveTo(r * 0.04, r * 0.42);
    ctx.lineTo(r * 0.04, -r * 0.78);
    ctx.lineTo(r * 0.62, -r * 0.46);
    ctx.stroke();
  } else if (type === 'headphones') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, Math.PI, 0);
    ctx.stroke();
    ctx.fillRect(-r * 0.86, -r * 0.06, r * 0.28, r * 0.62);
    ctx.fillRect(r * 0.58, -r * 0.06, r * 0.28, r * 0.62);
  } else if (type === 'mic') {
    roundRectPath(ctx, -r * 0.26, -r * 0.82, r * 0.52, r * 0.86, r * 0.26);
    paintPath();
    ctx.beginPath();
    ctx.arc(0, -r * 0.14, r * 0.48, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, r * 0.34);
    ctx.lineTo(0, r * 0.82);
    ctx.moveTo(-r * 0.32, r * 0.82);
    ctx.lineTo(r * 0.32, r * 0.82);
    ctx.stroke();
  } else if (type === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.92);
    ctx.lineTo(r * 0.68, 0);
    ctx.lineTo(0, r * 0.92);
    ctx.lineTo(-r * 0.68, 0);
    ctx.closePath();
    paintPath();
  } else if (type === 'target') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'globe') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.82, 0);
    ctx.lineTo(r * 0.82, 0);
    ctx.stroke();
  } else if (type === 'cross') {
    const w = r * 0.24;
    ctx.beginPath();
    ctx.moveTo(-w, -r * 0.9);
    ctx.lineTo(w, -r * 0.9);
    ctx.lineTo(w, -w);
    ctx.lineTo(r * 0.9, -w);
    ctx.lineTo(r * 0.9, w);
    ctx.lineTo(w, w);
    ctx.lineTo(w, r * 0.9);
    ctx.lineTo(-w, r * 0.9);
    ctx.lineTo(-w, w);
    ctx.lineTo(-r * 0.9, w);
    ctx.lineTo(-r * 0.9, -w);
    ctx.lineTo(-w, -w);
    ctx.closePath();
    paintPath();
  } else if (type === 'peace') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.82);
    ctx.lineTo(0, r * 0.82);
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.58, r * 0.58);
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.58, r * 0.58);
    ctx.stroke();
  } else if (type === 'infinity') {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(r * 0.45, -r * 0.65, r * 1.0, -r * 0.45, r * 0.88, 0);
    ctx.bezierCurveTo(r * 0.76, r * 0.45, r * 0.35, r * 0.65, 0, 0);
    ctx.bezierCurveTo(-r * 0.45, -r * 0.65, -r * 1.0, -r * 0.45, -r * 0.88, 0);
    ctx.bezierCurveTo(-r * 0.76, r * 0.45, -r * 0.35, r * 0.65, 0, 0);
    ctx.stroke();
  } else if (type === 'atom') {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.88, r * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'laurel') {
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.74, side === 1 ? -0.9 : Math.PI - 0.6, side === 1 ? 0.6 : Math.PI + 0.9);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = (side === 1 ? -0.75 : Math.PI + 0.75) + (side === 1 ? i * 0.32 : -i * 0.32);
        const lx = Math.cos(a) * r * 0.74;
        const ly = Math.sin(a) * r * 0.74;
        ctx.beginPath();
        ctx.ellipse(lx, ly, r * 0.18, r * 0.08, a + side * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else if (type === 'star5') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r * 0.94 : r * 0.4;
      if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    paintPath();
  } else if (type === 'chrome_cross') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.96);
    ctx.quadraticCurveTo(r * 0.12, -r * 0.18, r * 0.76, -r * 0.18);
    ctx.quadraticCurveTo(r * 0.14, 0, r * 0.76, r * 0.18);
    ctx.quadraticCurveTo(r * 0.12, r * 0.18, 0, r * 0.96);
    ctx.quadraticCurveTo(-r * 0.12, r * 0.18, -r * 0.76, r * 0.18);
    ctx.quadraticCurveTo(-r * 0.14, 0, -r * 0.76, -r * 0.18);
    ctx.quadraticCurveTo(-r * 0.12, -r * 0.18, 0, -r * 0.96);
    ctx.closePath();
    paintPath();
  } else if (type === 'soundwave') {
    const heights = [0.42, 0.84, 1.15, 0.72, 0.96, 0.50];
    const barW = r * 0.16;
    const gap = r * 0.12;
    const total = heights.length * barW + (heights.length - 1) * gap;
    heights.forEach((h, idx) => {
      const bx = -total / 2 + idx * (barW + gap);
      const bh = r * h * 1.3;
      roundRectPath(ctx, bx, -bh / 2, barW, bh, barW / 2);
      if (style === 'outline') ctx.stroke();
      else ctx.fill();
    });
  } else if (type === 'play_badge') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.24, -r * 0.42);
    ctx.lineTo(r * 0.48, 0);
    ctx.lineTo(-r * 0.24, r * 0.42);
    ctx.closePath();
    paintPath();
  } else if (type === 'pyramid') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.86);
    ctx.lineTo(r * 0.90, r * 0.76);
    ctx.lineTo(-r * 0.90, r * 0.76);
    ctx.closePath();
    paintPath();
    if (style !== 'outline') {
      ctx.beginPath();
      ctx.moveTo(-r * 0.34, r * 0.15);
      ctx.lineTo(r * 0.34, r * 0.15);
      ctx.stroke();
    }
  } else if (type === 'planet_ring') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
    paintPath();
    ctx.save();
    ctx.rotate(-0.36);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.96, r * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (type === 'compass') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r * 0.94 : r * 0.22;
      if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    paintPath();
  } else if (type === 'yin_yang') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, -Math.PI / 2, Math.PI / 2);
    ctx.arc(0, r * 0.42, r * 0.42, Math.PI / 2, -Math.PI / 2, true);
    ctx.arc(0, -r * 0.42, r * 0.42, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r * 0.42, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'rose') {
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.42, r * 0.26, r * 0.44, 0, 0, Math.PI * 2);
      if (style === 'outline') ctx.stroke();
      else ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'cherry') {
    ctx.beginPath();
    ctx.moveTo(r * 0.08, -r * 0.82);
    ctx.quadraticCurveTo(-r * 0.35, -r * 0.25, -r * 0.42, r * 0.24);
    ctx.moveTo(r * 0.08, -r * 0.82);
    ctx.quadraticCurveTo(r * 0.38, -r * 0.22, r * 0.44, r * 0.30);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-r * 0.44, r * 0.44, r * 0.32, 0, Math.PI * 2);
    paintPath();
    ctx.beginPath();
    ctx.arc(r * 0.44, r * 0.48, r * 0.32, 0, Math.PI * 2);
    paintPath();
  } else if (type === 'dagger') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.94);
    ctx.lineTo(r * 0.16, r * 0.24);
    ctx.lineTo(-r * 0.16, r * 0.24);
    ctx.closePath();
    paintPath();
    ctx.beginPath();
    ctx.moveTo(-r * 0.44, r * 0.26);
    ctx.lineTo(r * 0.44, r * 0.26);
    ctx.moveTo(0, r * 0.26);
    ctx.lineTo(0, r * 0.88);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, r * 0.90, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'key') {
    ctx.beginPath();
    ctx.arc(-r * 0.42, 0, r * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, 0);
    ctx.lineTo(r * 0.86, 0);
    ctx.moveTo(r * 0.56, 0);
    ctx.lineTo(r * 0.56, r * 0.32);
    ctx.moveTo(r * 0.82, 0);
    ctx.lineTo(r * 0.82, r * 0.26);
    ctx.stroke();
  } else if (type === 'lock') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.22, r * 0.38, Math.PI, 0);
    ctx.stroke();
    roundRectPath(ctx, -r * 0.58, -r * 0.20, r * 1.16, r * 0.96, r * 0.18);
    paintPath();
  } else if (type === 'hourglass') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.82);
    ctx.lineTo(r * 0.62, -r * 0.82);
    ctx.lineTo(-r * 0.62, r * 0.82);
    ctx.lineTo(r * 0.62, r * 0.82);
    ctx.closePath();
    if (style === 'outline') ctx.stroke();
    else ctx.fill();
  } else if (type === 'skull_minimal') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.12, r * 0.64, Math.PI * 0.8, Math.PI * 2.2);
    ctx.lineTo(r * 0.36, r * 0.72);
    ctx.lineTo(-r * 0.36, r * 0.72);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-r * 0.24, -r * 0.08, r * 0.15, 0, Math.PI * 2);
    ctx.arc(r * 0.24, -r * 0.08, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, r * 0.44);
    ctx.lineTo(-r * 0.12, r * 0.72);
    ctx.moveTo(r * 0.12, r * 0.44);
    ctx.lineTo(r * 0.12, r * 0.72);
    ctx.stroke();
  } else if (type === 'barbed_wire') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.94, -r * 0.10);
    ctx.lineTo(r * 0.94, -r * 0.10);
    ctx.moveTo(-r * 0.94, r * 0.10);
    ctx.lineTo(r * 0.94, r * 0.10);
    ctx.stroke();
    [-0.5, 0.0, 0.5].forEach(bx => {
      ctx.beginPath();
      ctx.moveTo(r * (bx - 0.16), -r * 0.46);
      ctx.lineTo(r * (bx + 0.16), r * 0.46);
      ctx.moveTo(r * (bx + 0.16), -r * 0.46);
      ctx.lineTo(r * (bx - 0.16), r * 0.46);
      ctx.stroke();
    });
  } else if (type === 'biohazard') {
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI * 2) / 3 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * r * 0.42, Math.sin(ang) * r * 0.42, r * 0.42, ang - 2.1, ang + 2.1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'tribal_wave') {
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.65);
      ctx.bezierCurveTo(side * r * 0.95, r * 0.32, side * r * 0.98, -r * 0.65, side * r * 0.28, -r * 0.85);
      ctx.bezierCurveTo(side * r * 0.52, -r * 0.32, side * r * 0.25, -r * 0.10, 0, -r * 0.22);
      ctx.closePath();
      paintPath();
    });
  } else if (type === 'spiral_emblem') {
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 5.2; t += 0.2) {
      const rr = (t / (Math.PI * 5.2)) * r * 0.88;
      const sx = Math.cos(t) * rr;
      const sy = Math.sin(t) * rr;
      if (t === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  } else if (type === 'arrow_loop') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, Math.PI * 0.3, Math.PI * 1.85);
    ctx.stroke();
    const tipX = Math.cos(Math.PI * 1.85) * r * 0.68;
    const tipY = Math.sin(Math.PI * 1.85) * r * 0.68;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - r * 0.34, tipY - r * 0.12);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + r * 0.08, tipY - r * 0.34);
    ctx.stroke();
  } else if (type === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    paintPath();
  } else if (type === 'circle_outline') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'ring_double') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'half_circle') {
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.86, Math.PI, 0);
    ctx.closePath();
    paintPath();
  } else if (type === 'quarter_arc') {
    ctx.beginPath();
    ctx.arc(-r * 0.45, r * 0.45, r * 1.24, -Math.PI / 2, 0);
    ctx.stroke();
  } else if (type === 'square') {
    ctx.beginPath();
    ctx.rect(-r * 0.82, -r * 0.82, r * 1.64, r * 1.64);
    paintPath();
  } else if (type === 'square_outline') {
    ctx.beginPath();
    ctx.rect(-r * 0.82, -r * 0.82, r * 1.64, r * 1.64);
    ctx.stroke();
  } else if (type === 'rounded_box') {
    roundRectPath(ctx, -r * 0.84, -r * 0.84, r * 1.68, r * 1.68, r * 0.34);
    paintPath();
  } else if (type === 'bar_h') {
    ctx.beginPath();
    ctx.rect(-r * 0.96, -r * 0.22, r * 1.92, r * 0.44);
    paintPath();
  } else if (type === 'bar_v') {
    ctx.beginPath();
    ctx.rect(-r * 0.22, -r * 0.96, r * 0.44, r * 1.92);
    paintPath();
  } else if (type === 'thin_line') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.98, 0);
    ctx.lineTo(r * 0.98, 0);
    ctx.stroke();
  } else if (type === 'double_line') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.96, -r * 0.20);
    ctx.lineTo(r * 0.96, -r * 0.20);
    ctx.moveTo(-r * 0.96, r * 0.20);
    ctx.lineTo(r * 0.96, r * 0.20);
    ctx.stroke();
  } else if (type === 'triple_bars') {
    [-0.44, 0, 0.44].forEach(oy => {
      ctx.beginPath();
      ctx.rect(-r * 0.92, r * oy - r * 0.11, r * 1.84, r * 0.22);
      if (style === 'outline') ctx.stroke();
      else ctx.fill();
    });
  } else if (type === 'pill_shape') {
    roundRectPath(ctx, -r * 0.94, -r * 0.38, r * 1.88, r * 0.76, r * 0.38);
    paintPath();
  } else if (type === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.86);
    ctx.lineTo(r * 0.88, r * 0.72);
    ctx.lineTo(-r * 0.88, r * 0.72);
    ctx.closePath();
    paintPath();
  } else if (type === 'triangle_inv') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.88, -r * 0.72);
    ctx.lineTo(r * 0.88, -r * 0.72);
    ctx.lineTo(0, r * 0.86);
    ctx.closePath();
    paintPath();
  } else if (type === 'pentagon') {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const px = Math.cos(a) * r * 0.88;
      const py = Math.sin(a) * r * 0.88;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    paintPath();
  } else if (type === 'hexagon') {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      const px = Math.cos(a) * r * 0.88;
      const py = Math.sin(a) * r * 0.88;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    paintPath();
  } else if (type === 'octagon') {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const px = Math.cos(a) * r * 0.88;
      const py = Math.sin(a) * r * 0.88;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    paintPath();
  } else if (type === 'plus_sign') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.84);
    ctx.lineTo(0, r * 0.84);
    ctx.moveTo(-r * 0.84, 0);
    ctx.lineTo(r * 0.84, 0);
    ctx.stroke();
  } else if (type === 'cross_x') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, -r * 0.72);
    ctx.lineTo(r * 0.72, r * 0.72);
    ctx.moveTo(r * 0.72, -r * 0.72);
    ctx.lineTo(-r * 0.72, r * 0.72);
    ctx.stroke();
  } else if (type === 'brackets') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, -r * 0.84);
    ctx.lineTo(-r * 0.74, -r * 0.84);
    ctx.lineTo(-r * 0.74, r * 0.84);
    ctx.lineTo(-r * 0.36, r * 0.84);
    ctx.moveTo(r * 0.36, -r * 0.84);
    ctx.lineTo(r * 0.74, -r * 0.84);
    ctx.lineTo(r * 0.74, r * 0.84);
    ctx.lineTo(r * 0.36, r * 0.84);
    ctx.stroke();
  } else if (type === 'corner_frame') {
    const s = r * 0.82;
    const arm = r * 0.42;
    ctx.beginPath();
    ctx.moveTo(-s, -s + arm); ctx.lineTo(-s, -s); ctx.lineTo(-s + arm, -s);
    ctx.moveTo(s - arm, -s); ctx.lineTo(s, -s); ctx.lineTo(s, -s + arm);
    ctx.moveTo(s, s - arm); ctx.lineTo(s, s); ctx.lineTo(s - arm, s);
    ctx.moveTo(-s + arm, s); ctx.lineTo(-s, s); ctx.lineTo(-s, s - arm);
    ctx.stroke();
  } else if (type === 'dot_grid') {
    [-0.56, 0, 0.56].forEach(gx => {
      [-0.56, 0, 0.56].forEach(gy => {
        ctx.beginPath();
        ctx.arc(r * gx, r * gy, r * 0.14, 0, Math.PI * 2);
        if (style === 'outline') ctx.stroke();
        else ctx.fill();
      });
    });
  } else if (type === 'zigzag') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.92, r * 0.28);
    ctx.lineTo(-r * 0.46, -r * 0.30);
    ctx.lineTo(0, r * 0.28);
    ctx.lineTo(r * 0.46, -r * 0.30);
    ctx.lineTo(r * 0.92, r * 0.28);
    ctx.stroke();
  } else if (type === 'wave_line') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.92, 0);
    ctx.bezierCurveTo(-r * 0.46, -r * 0.58, -r * 0.08, r * 0.58, 0, 0);
    ctx.bezierCurveTo(r * 0.08, -r * 0.58, r * 0.46, r * 0.58, r * 0.92, 0);
    ctx.stroke();
  } else if (type === 'chevron') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, -r * 0.36);
    ctx.lineTo(0, r * 0.38);
    ctx.lineTo(r * 0.72, -r * 0.36);
    ctx.stroke();
  } else if (type === 'slash_pair') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.58, r * 0.78);
    ctx.lineTo(r * 0.04, -r * 0.78);
    ctx.moveTo(-r * 0.04, r * 0.78);
    ctx.lineTo(r * 0.58, -r * 0.78);
    ctx.stroke();
  } else if (type === 'halo') {
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.92, r * 0.34, -0.18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'barcode_mini') {
    const widths = [0.10, 0.05, 0.14, 0.06, 0.08, 0.14, 0.05, 0.10];
    let bx = -r * 0.84;
    widths.forEach((w, idx) => {
      const bw = r * w;
      const bh = idx % 3 === 0 ? r * 1.15 : r * 0.94;
      ctx.fillRect(bx, -bh / 2, bw, bh);
      bx += bw + r * 0.08;
    });
  } else if (type === 'crosshair_min') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.moveTo(0, -r * 0.92); ctx.lineTo(0, -r * 0.24);
    ctx.moveTo(0, r * 0.24); ctx.lineTo(0, r * 0.92);
    ctx.moveTo(-r * 0.92, 0); ctx.lineTo(-r * 0.24, 0);
    ctx.moveTo(r * 0.24, 0); ctx.lineTo(r * 0.92, 0);
    ctx.stroke();
  } else if (type === 'arrow_up_diag') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.66, r * 0.66);
    ctx.lineTo(r * 0.66, -r * 0.66);
    ctx.moveTo(-r * 0.08, -r * 0.66);
    ctx.lineTo(r * 0.66, -r * 0.66);
    ctx.lineTo(r * 0.66, r * 0.08);
    ctx.stroke();
  } else if (type === 'burst_rays') {
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      const inner = i % 2 === 0 ? r * 0.24 : r * 0.38;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
      ctx.lineTo(Math.cos(ang) * r * 0.92, Math.sin(ang) * r * 0.92);
      ctx.stroke();
    }
  } else if (type === 'crescent_thin') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, 0.35, Math.PI * 2 - 0.35, false);
    ctx.arc(r * 0.22, 0, r * 0.72, Math.PI * 2 - 0.55, 0.55, true);
    ctx.closePath();
    paintPath();
  }

  ctx.restore();
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: CoverTextLayer,
  size: number,
  s: number,
  isSelectedHighlight: boolean
) {
  const raw = layer.text.replace(/^\s+|\s+$/g, '');
  if (!layer.enabled || !raw) return;

  const textStr = layer.uppercase ? raw.toUpperCase() : raw;
  const px = (layer.x / 100) * size;
  const py = (layer.y / 100) * size;
  const scaledSize = Math.round(layer.fontSize * s);
  const tracking = layer.letterSpacing * s;

  ctx.save();
  ctx.translate(px, py);
  if (layer.rotate) ctx.rotate((layer.rotate * Math.PI) / 180);
  ctx.globalAlpha = clampNum(layer.opacity, 10, 100) / 100;
  ctx.font = `${layer.fontWeight} ${scaledSize}px "${layer.fontFamily}", "Montserrat", sans-serif`;
  ctx.textBaseline = 'middle';

  // Preserve explicit Enter (\n) line breaks first, then word-wrap long lines to ~88% of canvas width
  const maxWidth = size * 0.88;
  const lines: string[] = [];

  const measureTracked = (str: string) => {
    if (!str) return 0;
    if (tracking === 0) return ctx.measureText(str).width;
    let w = 0;
    for (let i = 0; i < str.length; i++) {
      w += ctx.measureText(str[i]).width + (i < str.length - 1 ? tracking : 0);
    }
    return w;
  };

  const explicitParagraphs = textStr.split(/\r?\n/);
  for (const para of explicitParagraphs) {
    const cleaned = para.trim();
    if (!cleaned) {
      lines.push('');
      continue;
    }
    const words = cleaned.split(/[ \t]+/);
    let curLine = '';
    for (const word of words) {
      const candidate = curLine ? `${curLine} ${word}` : word;
      if (measureTracked(candidate) <= maxWidth || !curLine) {
        curLine = candidate;
      } else {
        lines.push(curLine);
        curLine = word;
      }
    }
    if (curLine) lines.push(curLine);
  }

  const lhMult = clampNum(layer.lineHeight ?? 1.12, 0.8, 1.9);
  const lineHeight = scaledSize * lhMult;
  const totalH = lines.length * lineHeight;

  lines.forEach((line, idx) => {
    const ly = -totalH / 2 + lineHeight * (idx + 0.5);
    if (!line) return;
    const lineW = measureTracked(line);
    const startX =
      layer.align === 'left' ? 0 : layer.align === 'right' ? -lineW : -lineW / 2;

    if (layer.boxBg) {
      const padX = 16 * s;
      const padY = 8 * s;
      ctx.save();
      ctx.fillStyle = layer.color === '#09090b' || layer.color === '#111111' ? '#facc15' : '#09090b';
      ctx.fillRect(startX - padX, ly - scaledSize * 0.55 - padY * 0.3, lineW + padX * 2, scaledSize * 1.1 + padY * 0.6);
      ctx.restore();
    }

    const paintTrackedText = (offsetX: number, offsetY: number, strokeOnly = false) => {
      let cx = startX + offsetX;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        const cw = ctx.measureText(ch).width;
        if (strokeOnly) ctx.strokeText(ch, cx, ly + offsetY);
        else ctx.fillText(ch, cx, ly + offsetY);
        cx += cw + tracking;
      }
    };

    if (layer.effect === 'chromatic') {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.78)';
      paintTrackedText(-4 * s, 0);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.78)';
      paintTrackedText(4 * s, 0);
      ctx.restore();
    } else if (layer.effect === 'glow') {
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = 24 * s;
    } else if (layer.effect === 'shadow') {
      ctx.shadowColor = 'rgba(0,0,0,0.72)';
      ctx.shadowBlur = 16 * s;
      ctx.shadowOffsetY = 5 * s;
    }

    if (layer.effect === 'outline') {
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = Math.max(2, scaledSize * 0.045);
      paintTrackedText(0, 0, true);
    } else {
      ctx.fillStyle = layer.color;
      paintTrackedText(0, 0, false);
    }
  });

  if (isSelectedHighlight && size >= 400) {
    const widest = Math.max(...lines.map(l => measureTracked(l)), 60 * s);
    const boxLeft =
      layer.align === 'left' ? -14 * s : layer.align === 'right' ? -widest - 14 * s : -widest / 2 - 14 * s;
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2 * s;
    ctx.setLineDash([8 * s, 6 * s]);
    ctx.strokeRect(boxLeft, -totalH / 2 - 10 * s, widest + 28 * s, totalH + 20 * s);
    ctx.restore();
  }

  ctx.restore();
}

export function renderCoverToCanvas(
  canvas: HTMLCanvasElement,
  cfg: CoverDesignConfig,
  photoImg?: HTMLImageElement | null,
  selectedHighlight?: { kind: 'text' | 'decal'; id: string } | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const s = size / 1000;

  ctx.clearRect(0, 0, size, size);

  // 1. Background & Customizable Gradient/Static Generator
  const rad = ((cfg.angle % 360) * Math.PI) / 180;
  const gx = Math.cos(rad) * size * 0.55;
  const gy = Math.sin(rad) * size * 0.55;
  const cx = size / 2;
  const cy = size / 2;
  const focalX = clampNum(cfg.bgCenterX ?? 50, 0, 100) / 100;
  const focalY = clampNum(cfg.bgCenterY ?? 50, 0, 100) / 100;
  const balance = clampNum(cfg.bgBalance ?? 50, 10, 90) / 100;
  const spread = clampNum(cfg.bgSpread ?? 100, 30, 175) / 100;

  if (cfg.bgStyle === 'solid') {
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'matte_vignette') {
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
    const fx = focalX * size;
    const fy = focalY * size;
    const g = ctx.createRadialGradient(fx, fy, size * 0.04, fx, fy, size * 0.82 * spread);
    g.addColorStop(0, cfg.color2);
    g.addColorStop(balance, hexToRgba(mixHex(cfg.color2, cfg.color1, 0.55), 0.72));
    g.addColorStop(1, cfg.color1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'duotone_mist') {
    const grad = ctx.createLinearGradient(cx - gx, cy - gy, cx + gx, cy + gy);
    grad.addColorStop(0, cfg.color1);
    grad.addColorStop(balance, mixHex(cfg.color1, cfg.color2, 0.52));
    grad.addColorStop(1, cfg.color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const glow = ctx.createRadialGradient(focalX * size, focalY * size, 0, focalX * size, focalY * size, size * 0.68 * spread);
    glow.addColorStop(0, hexToRgba(cfg.accent, 0.28));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'tri_gradient') {
    const grad = ctx.createLinearGradient(cx - gx, cy - gy, cx + gx, cy + gy);
    grad.addColorStop(0, cfg.color1);
    grad.addColorStop(balance, cfg.color2);
    grad.addColorStop(1, cfg.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'aurora_flow') {
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
    const ox = (focalX - 0.5) * 0.45;
    const oy = (focalY - 0.5) * 0.45;
    const g1 = ctx.createRadialGradient(
      size * clampNum(0.22 + ox, 0.05, 0.95),
      size * clampNum(0.26 + oy, 0.05, 0.95),
      size * 0.04,
      size * clampNum(0.22 + ox, 0.05, 0.95),
      size * clampNum(0.26 + oy, 0.05, 0.95),
      size * 0.85 * spread
    );
    g1.addColorStop(0, hexToRgba(cfg.accent, 0.85));
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, size, size);

    const g2 = ctx.createRadialGradient(
      size * clampNum(0.8 - ox * 0.7, 0.05, 0.95),
      size * clampNum(0.72 - oy * 0.7, 0.05, 0.95),
      size * 0.05,
      size * clampNum(0.8 - ox * 0.7, 0.05, 0.95),
      size * clampNum(0.72 - oy * 0.7, 0.05, 0.95),
      size * 0.8 * spread
    );
    g2.addColorStop(0, hexToRgba(cfg.color2, 0.92));
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, size, size);

    const g3 = ctx.createRadialGradient(focalX * size, focalY * size, 0, focalX * size, focalY * size, size * 0.55 * spread);
    g3.addColorStop(0, hexToRgba(mixHex(cfg.accent, '#ffffff', 0.3), 0.32));
    g3.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'mesh' || cfg.bgStyle === 'quad_mesh') {
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
    const ox = (focalX - 0.5) * 0.35;
    const oy = (focalY - 0.5) * 0.35;
    const spots =
      cfg.bgStyle === 'quad_mesh'
        ? [
            { x: 0.16 + ox, y: 0.18 + oy, r: 0.72 * spread, col: cfg.color2, a: 0.9 },
            { x: 0.84 - ox, y: 0.2 + oy, r: 0.68 * spread, col: mixHex(cfg.color1, cfg.color2, 0.65), a: 0.82 },
            { x: 0.22 + ox, y: 0.85 - oy, r: 0.66 * spread, col: mixHex(cfg.color2, cfg.accent, 0.45), a: 0.55 },
            { x: 0.78 - ox, y: 0.82 - oy, r: 0.64 * spread, col: cfg.accent, a: 0.48 }
          ]
        : [
            { x: 0.22 + ox, y: 0.24 + oy, r: 0.68 * spread, col: cfg.color2, a: 0.92 },
            { x: 0.80 - ox, y: 0.30 + oy, r: 0.62 * spread, col: cfg.accent, a: 0.52 },
            { x: 0.38 + ox, y: 0.82 - oy, r: 0.66 * spread, col: cfg.accent, a: 0.36 },
            { x: 0.78 - ox, y: 0.80 - oy, r: 0.56 * spread, col: cfg.color2, a: 0.85 }
          ];
    spots.forEach(sp => {
      const sx = clampNum(sp.x, 0.05, 0.95) * size;
      const sy = clampNum(sp.y, 0.05, 0.95) * size;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sp.r * size);
      g.addColorStop(0, hexToRgba(sp.col, sp.a));
      g.addColorStop(1, hexToRgba(sp.col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    });
  } else if (cfg.bgStyle === 'radial_glow') {
    const fx = focalX * size;
    const fy = focalY * size;
    const g = ctx.createRadialGradient(fx, fy, size * 0.02, fx, fy, size * 0.84 * spread);
    g.addColorStop(0, cfg.accent);
    g.addColorStop(clampNum(balance * 0.75, 0.12, 0.72), cfg.color2);
    g.addColorStop(1, cfg.color1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'conic_sweep') {
    if (typeof ctx.createConicGradient === 'function') {
      const g = ctx.createConicGradient(rad, focalX * size, focalY * size);
      g.addColorStop(0, cfg.color1);
      g.addColorStop(clampNum(balance * 0.55, 0.1, 0.42), cfg.color2);
      g.addColorStop(clampNum(balance + 0.06, 0.28, 0.72), cfg.accent);
      g.addColorStop(0.84, cfg.color2);
      g.addColorStop(1, cfg.color1);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.fillStyle = cfg.color1;
      ctx.fillRect(0, 0, size, size);
    }
  } else if (cfg.bgStyle === 'spotlight') {
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
    const fx = focalX * size;
    const fy = focalY * size;
    const g = ctx.createRadialGradient(fx, fy * 0.6 + size * 0.06, size * 0.03, fx, fy + size * 0.14, size * 0.9 * spread);
    g.addColorStop(0, hexToRgba(cfg.accent, 0.68));
    g.addColorStop(balance * 0.9, hexToRgba(cfg.color2, 0.84));
    g.addColorStop(1, hexToRgba(cfg.color1, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'horizon_fade') {
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, cfg.color1);
    grad.addColorStop(clampNum(balance, 0.18, 0.76), cfg.color2);
    grad.addColorStop(clampNum(balance + 0.28, 0.52, 0.94), cfg.accent);
    grad.addColorStop(1, cfg.color1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else if (cfg.bgStyle === 'split') {
    const splitPos = clampNum(balance, 0.15, 0.85) * size;
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = cfg.color2;
    ctx.fillRect(splitPos, 0, size - splitPos, size);
  } else if (cfg.bgStyle === 'diag_split') {
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(focalX * size, focalY * size);
    ctx.rotate(rad);
    ctx.fillStyle = cfg.color2;
    ctx.fillRect(0, -size * 2, size * 2, size * 4);
    ctx.restore();
  } else if (cfg.bgStyle === 'stripes') {
    ctx.fillStyle = cfg.color1;
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.fillStyle = cfg.color2;
    const step = clampNum(74 * (spread * 0.9), 26, 180) * s;
    for (let x = -size * 1.5; x < size * 1.5; x += step * 2) {
      ctx.fillRect(x, -size * 1.5, step, size * 3);
    }
    ctx.restore();
  } else if (cfg.bgStyle === 'checker') {
    const count = Math.round(clampNum(8 / Math.max(0.5, spread), 4, 14));
    const cell = size / count;
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? cfg.color1 : cfg.color2;
        ctx.fillRect(col * cell, row * cell, cell + 1, cell + 1);
      }
    }
  } else {
    const grad = ctx.createLinearGradient(cx - gx, cy - gy, cx + gx, cy + gy);
    grad.addColorStop(0, cfg.color1);
    grad.addColorStop(clampNum(balance, 0.15, 0.85), mixHex(cfg.color1, cfg.color2, 0.5));
    grad.addColorStop(1, cfg.color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // 2. Uploaded Photo Background Layer with Full Filters & Controls
  if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
    ctx.save();
    const imgRatio = photoImg.naturalWidth / photoImg.naturalHeight;
    const baseW = imgRatio >= 1 ? size * imgRatio : size;
    const baseH = imgRatio >= 1 ? size : size / imgRatio;
    const scaleFactor = clampNum(cfg.photoScale || 100, 40, 320) / 100;
    const drawW = baseW * scaleFactor;
    const drawH = baseH * scaleFactor;
    const panX = ((cfg.photoOffsetX || 0) / 100) * size;
    const panY = ((cfg.photoOffsetY || 0) / 100) * size;

    const filterParts: string[] = [];
    if (cfg.photoBrightness !== 100) filterParts.push(`brightness(${cfg.photoBrightness}%)`);
    if (cfg.photoContrast !== 100) filterParts.push(`contrast(${cfg.photoContrast}%)`);
    if (cfg.photoSaturate !== 100) filterParts.push(`saturate(${cfg.photoSaturate}%)`);
    if (cfg.photoBlur > 0) filterParts.push(`blur(${(cfg.photoBlur * s).toFixed(1)}px)`);
    if (cfg.photoFilter === 'bw') filterParts.push('grayscale(100%) contrast(115%)');
    else if (cfg.photoFilter === 'contrast') filterParts.push('contrast(135%) saturate(120%)');
    else if (cfg.photoFilter === 'sepia') filterParts.push('sepia(85%) contrast(110%)');
    else if (cfg.photoFilter === 'duotone') filterParts.push('grayscale(100%) contrast(125%)');
    else if (cfg.photoFilter === 'warm') filterParts.push('sepia(35%) saturate(135%)');
    else if (cfg.photoFilter === 'cold') filterParts.push('hue-rotate(18deg) saturate(110%) contrast(106%)');

    if (filterParts.length > 0 && 'filter' in ctx) {
      ctx.filter = filterParts.join(' ');
    }

    ctx.translate(cx + panX, cy + panY);
    if (cfg.photoRotate) ctx.rotate((cfg.photoRotate * Math.PI) / 180);
    ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    if (cfg.photoFilter === 'duotone') {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = hexToRgba(cfg.accent, 0.85);
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    }

    if (cfg.photoOverlayOpacity > 0) {
      ctx.save();
      ctx.fillStyle = hexToRgba(cfg.photoOverlayColor || cfg.color1, clampNum(cfg.photoOverlayOpacity, 0, 95) / 100);
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    }

    if (cfg.photoScrimBottom > 0) {
      ctx.save();
      const scrim = ctx.createLinearGradient(0, size * 0.35, 0, size);
      scrim.addColorStop(0, 'rgba(0,0,0,0)');
      scrim.addColorStop(1, `rgba(0,0,0,${clampNum(cfg.photoScrimBottom, 0, 95) / 100})`);
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    }
  }

  // 3. Central Graphic Motif
  const mScale = clampNum(cfg.motifScale || 100, 30, 200) / 100;
  const mOpacity = clampNum(cfg.motifOpacity ?? 90, 0, 100) / 100;
  const mx = cx + ((cfg.motifOffsetX || 0) / 100) * size;
  const my = cy + ((cfg.motifOffsetY || 0) / 100) * size;

  if (cfg.motif !== 'none' && mOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = mOpacity;
    ctx.translate(mx, my);
    if (cfg.motifRotate) ctx.rotate((cfg.motifRotate * Math.PI) / 180);
    ctx.scale(mScale, mScale);
    ctx.translate(-cx, -cy);

    if (cfg.motif === 'eclipse') {
      const r = size * 0.25;
      const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.9);
      g.addColorStop(0, hexToRgba(cfg.accent, 0.92));
      g.addColorStop(0.55, hexToRgba(cfg.accent, 0.24));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#050507';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(cfg.accent, 0.85);
      ctx.lineWidth = 3 * s;
      ctx.stroke();
    } else if (cfg.motif === 'orb') {
      const r = size * 0.25;
      const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.32, cfg.accent);
      g.addColorStop(0.82, cfg.color2);
      g.addColorStop(1, '#040406');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (cfg.motif === 'rings') {
      for (let i = 1; i <= 7; i++) {
        ctx.strokeStyle = hexToRgba(cfg.accent, Math.max(0.15, 0.92 - i * 0.11));
        ctx.lineWidth = (i === 1 ? 6 : 3.5) * s;
        ctx.beginPath();
        ctx.arc(cx, cy, i * 48 * s, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (cfg.motif === 'orbit_rings') {
      ctx.fillStyle = cfg.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 42 * s, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * Math.PI) / 4);
        ctx.strokeStyle = hexToRgba(cfg.accent, 0.82 - i * 0.12);
        ctx.lineWidth = 3.5 * s;
        ctx.beginPath();
        ctx.ellipse(0, 0, 290 * s, 96 * s, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    } else if (cfg.motif === 'wireframe_sphere') {
      const r = size * 0.28;
      ctx.strokeStyle = hexToRgba(cfg.accent, 0.8);
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * (i / 4.5), r, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * (i / 4.5), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (cfg.motif === 'tunnel') {
      for (let i = 10; i >= 1; i--) {
        const box = i * 76 * s;
        ctx.strokeStyle = i % 2 === 0 ? cfg.accent : '#ffffff';
        ctx.lineWidth = (i % 2 === 0 ? 4 : 2) * s;
        ctx.strokeRect(cx - box / 2, cy - box / 2, box, box);
      }
    } else if (cfg.motif === 'bauhaus') {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 80 * s, cy - 30 * s, 145 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cfg.accent;
      ctx.fillRect(cx + 15 * s, cy - 165 * s, 175 * s, 295 * s);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(cx - 190 * s, cy + 170 * s);
      ctx.lineTo(cx + 45 * s, cy + 170 * s);
      ctx.lineTo(cx - 72 * s, cy - 55 * s);
      ctx.closePath();
      ctx.fill();
    } else if (cfg.motif === 'arch') {
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 10 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 170 * s, cy + 210 * s);
      ctx.lineTo(cx - 170 * s, cy - 40 * s);
      ctx.arc(cx, cy - 40 * s, 170 * s, Math.PI, 0, false);
      ctx.lineTo(cx + 170 * s, cy + 210 * s);
      ctx.stroke();
    } else if (cfg.motif === 'blobs') {
      [
        { x: -110, y: -90, r: 210, c: cfg.accent, a: 0.72 },
        { x: 115, y: 80, r: 230, c: cfg.color2, a: 0.78 },
        { x: 45, y: -115, r: 170, c: '#ffffff', a: 0.25 }
      ].forEach(b => {
        const g = ctx.createRadialGradient(cx + b.x * s, cy + b.y * s, 10, cx + b.x * s, cy + b.y * s, b.r * s);
        g.addColorStop(0, hexToRgba(b.c, b.a));
        g.addColorStop(1, hexToRgba(b.c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + b.x * s, cy + b.y * s, b.r * s, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (cfg.motif === 'liquid_rings') {
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        const baseR = (95 + k * 42) * s;
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.08) {
          const wob = Math.sin(a * 4 + k * 0.9) * (14 + k * 3) * s;
          const x = cx + Math.cos(a) * (baseR + wob);
          const y = cy + Math.sin(a) * (baseR + wob * 0.8);
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = hexToRgba(k % 2 === 0 ? cfg.accent : '#ffffff', 0.85 - k * 0.1);
        ctx.lineWidth = 3.5 * s;
        ctx.stroke();
      }
    } else if (cfg.motif === 'waves') {
      for (let row = -5; row <= 5; row++) {
        ctx.beginPath();
        const y0 = cy + row * 40 * s;
        for (let x = size * 0.1; x <= size * 0.9; x += 6 * s) {
          const amp = (28 + (5 - Math.abs(row)) * 8) * s;
          const y = y0 + Math.sin((x / size) * Math.PI * 4.5 + row * 0.7) * amp;
          if (x === size * 0.1) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = hexToRgba(cfg.accent, row === 0 ? 0.95 : 0.45);
        ctx.lineWidth = (row === 0 ? 5 : 2.5) * s;
        ctx.stroke();
      }
    } else if (cfg.motif === 'equalizer') {
      const bars = 18;
      const barW = 18 * s;
      const gap = 12 * s;
      const totalW = bars * (barW + gap) - gap;
      const startX = cx - totalW / 2;
      for (let i = 0; i < bars; i++) {
        const h = (80 + Math.abs(Math.sin(i * 0.72)) * 280) * s;
        const bx = startX + i * (barW + gap);
        ctx.fillStyle = i % 3 === 0 ? '#ffffff' : cfg.accent;
        roundRectPath(ctx, bx, cy - h / 2, barW, h, 8 * s);
        ctx.fill();
      }
    } else if (cfg.motif === 'prism') {
      const topY = cy - 220 * s;
      const botY = cy + 170 * s;
      const beamCols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7'];
      beamCols.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 10 * s;
        ctx.beginPath();
        ctx.moveTo(cx + 42 * s, cy - 20 * s);
        ctx.lineTo(size * 0.98, cy + (i - 2.5) * 44 * s);
        ctx.stroke();
      });
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8 * s;
      ctx.beginPath();
      ctx.moveTo(0, cy + 48 * s);
      ctx.lineTo(cx - 56 * s, cy - 12 * s);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6 * s;
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx + 225 * s, botY);
      ctx.lineTo(cx - 225 * s, botY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (cfg.motif === 'vinyl') {
      const r = size * 0.30;
      ctx.fillStyle = '#0b0b0e';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      for (let g = 0.36; g < 0.95; g += 0.05) {
        ctx.strokeStyle = 'rgba(255,255,255,0.09)';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(cx, cy, r * g, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = cfg.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.33, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    } else if (cfg.motif === 'cassette') {
      const w = 520 * s;
      const h = 330 * s;
      const x = cx - w / 2;
      const y = cy - h / 2;
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 6 * s;
      roundRectPath(ctx, x, y, w, h, 24 * s);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = cfg.accent;
      ctx.fillRect(x + 36 * s, y + 36 * s, w - 72 * s, 96 * s);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 135 * s, cy - 10 * s, 270 * s, 72 * s);
      [-86 * s, 86 * s].forEach(dx => {
        ctx.fillStyle = '#f4f4f5';
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 26 * s, 28 * s, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (cfg.motif === 'duality') {
      const r = size * 0.25;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI / 2, (Math.PI * 3) / 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (cfg.motif === 'crosshair') {
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, 200 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 110 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 270 * s, cy);
      ctx.lineTo(cx + 270 * s, cy);
      ctx.moveTo(cx, cy - 270 * s);
      ctx.lineTo(cx, cy + 270 * s);
      ctx.stroke();
    } else if (cfg.motif === 'grid') {
      ctx.strokeStyle = hexToRgba(cfg.accent, 0.72);
      ctx.lineWidth = 2 * s;
      const horizonY = cy + 20 * s;
      for (let i = -8; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 24 * s, horizonY);
        ctx.lineTo(cx + i * 110 * s, size);
        ctx.stroke();
      }
      for (let y = horizonY; y <= size; y += Math.max(12 * s, (y - horizonY) * 0.24 + 12 * s)) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }
    } else if (cfg.motif === 'halftone') {
      ctx.fillStyle = cfg.accent;
      const step = 36 * s;
      for (let y = 120 * s; y <= size - 120 * s; y += step) {
        for (let x = 120 * s; x <= size - 120 * s; x += step) {
          const dist = Math.hypot(x - cx, y - cy);
          const rr = Math.max(1.5 * s, (1 - Math.min(1, dist / (size * 0.45))) * 14 * s);
          ctx.beginPath();
          ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (cfg.motif === 'rays') {
      ctx.fillStyle = hexToRgba(cfg.accent, 0.35);
      const count = 16;
      for (let i = 0; i < count; i++) {
        const a1 = (i * Math.PI * 2) / count;
        const a2 = a1 + Math.PI / count;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a1) * size * 0.7, cy + Math.sin(a1) * size * 0.7);
        ctx.lineTo(cx + Math.cos(a2) * size * 0.7, cy + Math.sin(a2) * size * 0.7);
        ctx.closePath();
        ctx.fill();
      }
    } else if (cfg.motif === 'sunburst') {
      const g = ctx.createRadialGradient(cx, cy, 10 * s, cx, cy, 340 * s);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.28, cfg.accent);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 340 * s, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 24; i++) {
        const ang = (i * Math.PI) / 12;
        ctx.strokeStyle = hexToRgba('#ffffff', 0.45);
        ctx.lineWidth = (i % 2 === 0 ? 4 : 2) * s;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 70 * s, cy + Math.sin(ang) * 70 * s);
        ctx.lineTo(cx + Math.cos(ang) * 320 * s, cy + Math.sin(ang) * 320 * s);
        ctx.stroke();
      }
    } else if (cfg.motif === 'stars') {
      for (let i = 0; i < 75; i++) {
        const rx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const ry = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1;
        const r = (1.5 + (i % 4) * 1.4) * s;
        ctx.fillStyle = i % 5 === 0 ? cfg.accent : '#ffffff';
        ctx.beginPath();
        ctx.arc(rx * size, ry * size, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = cfg.accent;
      drawVectorDecal(ctx, 'star4', cx, cy, 140 * s, cfg.accent, 0, 95, 'glow');
    } else if (cfg.motif === 'horizon') {
      const r = 190 * s;
      const sunGrad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.45, cfg.accent);
      sunGrad.addColorStop(1, cfg.color2);
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy - 20 * s, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cfg.color1;
      for (let k = 0; k < 5; k++) {
        ctx.fillRect(cx - r - 10, cy + (12 + k * 24) * s, r * 2 + 20, (4 + k * 2.5) * s);
      }
    } else if (cfg.motif === 'ribbons') {
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        const yOff = (k - 2) * 52 * s;
        ctx.moveTo(-20 * s, cy + yOff - 140 * s);
        ctx.bezierCurveTo(size * 0.3, cy + yOff + 180 * s, size * 0.7, cy + yOff - 220 * s, size + 20 * s, cy + yOff + 120 * s);
        ctx.strokeStyle = hexToRgba(k % 2 === 0 ? cfg.accent : '#ffffff', 0.85 - k * 0.12);
        ctx.lineWidth = (18 - k * 2) * s;
        ctx.stroke();
      }
    } else if (cfg.motif === 'mosaic') {
      const cells = 5;
      const box = 480 * s;
      const step = box / cells;
      const ox = cx - box / 2;
      const oy = cy - box / 2;
      const cols = [cfg.accent, '#ffffff', cfg.color2, mixHex(cfg.accent, cfg.color2, 0.5)];
      for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
          const idx = (r * 3 + c * 5) % cols.length;
          ctx.fillStyle = hexToRgba(cols[idx], 0.82);
          if ((r + c) % 2 === 0) {
            ctx.beginPath();
            ctx.arc(ox + c * step + step / 2, oy + r * step + step / 2, step * 0.42, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(ox + c * step + 6 * s, oy + r * step + 6 * s, step - 12 * s, step - 12 * s);
          }
        }
      }
    } else if (cfg.motif === 'portal_frame') {
      for (let i = 1; i <= 7; i++) {
        const w = (150 + i * 74) * s;
        const h = (210 + i * 86) * s;
        ctx.strokeStyle = hexToRgba(i === 1 ? '#ffffff' : cfg.accent, Math.max(0.18, 0.92 - i * 0.1));
        ctx.lineWidth = (i <= 2 ? 5 : 2.5) * s;
        roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, 20 * s);
        ctx.stroke();
      }
    } else if (cfg.motif === 'minimal_squares') {
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * 12 * Math.PI) / 180);
        const box = (480 - i * 66) * s;
        ctx.strokeStyle = hexToRgba(i % 2 === 0 ? cfg.accent : '#ffffff', 0.82 - i * 0.1);
        ctx.lineWidth = 3.5 * s;
        ctx.strokeRect(-box / 2, -box / 2, box, box);
        ctx.restore();
      }
    } else if (cfg.motif === 'crescent_arc') {
      for (let i = 0; i < 4; i++) {
        const r = (140 + i * 62) * s;
        ctx.strokeStyle = hexToRgba(i % 2 === 0 ? cfg.accent : '#ffffff', 0.88 - i * 0.14);
        ctx.lineWidth = (8 - i * 1.2) * s;
        ctx.beginPath();
        ctx.arc(cx, cy, r, i * 0.85, i * 0.85 + Math.PI * 1.25);
        ctx.stroke();
      }
    } else if (cfg.motif === 'broken_ring') {
      const r = 240 * s;
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 14 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, r, -0.5, 1.85);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.78, 2.3, 4.9);
      ctx.stroke();
    } else if (cfg.motif === 'diagonal_bars') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 4);
      for (let i = -5; i <= 5; i++) {
        ctx.fillStyle = hexToRgba(i % 2 === 0 ? cfg.accent : '#ffffff', 0.82 - Math.abs(i) * 0.08);
        roundRectPath(ctx, -260 * s, i * 48 * s - 9 * s, 520 * s, 18 * s, 9 * s);
        ctx.fill();
      }
      ctx.restore();
    } else if (cfg.motif === 'radial_mesh') {
      ctx.strokeStyle = hexToRgba(cfg.accent, 0.55);
      ctx.lineWidth = 2 * s;
      for (let r = 80 * s; r <= 340 * s; r += 65 * s) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let a = 0; a < 12; a++) {
        const ang = (a * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * 340 * s, cy + Math.sin(ang) * 340 * s);
        ctx.stroke();
      }
    } else if (cfg.motif === 'glass_shards') {
      const tris = [
        [[0, -280], [180, -40], [-60, 40]],
        [[-220, -140], [-10, -240], [-90, 90]],
        [[190, -210], [270, 120], [10, 60]],
        [[-160, 190], [60, -20], [210, 220]],
        [[-250, 40], [-60, 40], [-140, 260]]
      ];
      tris.forEach((pts, i) => {
        ctx.fillStyle = hexToRgba(i % 2 === 0 ? cfg.accent : '#ffffff', 0.16 + (i % 3) * 0.08);
        ctx.strokeStyle = hexToRgba('#ffffff', 0.65);
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        pts.forEach(([px, py], pi) => {
          if (pi === 0) ctx.moveTo(cx + px * s, cy + py * s);
          else ctx.lineTo(cx + px * s, cy + py * s);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else if (cfg.motif === 'monolith') {
      const g = ctx.createRadialGradient(cx, cy, 40 * s, cx, cy, 340 * s);
      g.addColorStop(0, hexToRgba(cfg.accent, 0.52));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 340 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 4 * s;
      ctx.fillRect(cx - 105 * s, cy - 260 * s, 210 * s, 520 * s);
      ctx.strokeRect(cx - 105 * s, cy - 260 * s, 210 * s, 520 * s);
    } else if (cfg.motif === 'spiral_vortex') {
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      const maxT = Math.PI * 10;
      for (let t = 0; t <= maxT; t += 0.12) {
        const rr = (t / maxT) * 320 * s;
        const sx = cx + Math.cos(t) * rr;
        const sy = cy + Math.sin(t) * rr;
        if (t === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    } else if (cfg.motif === 'topography') {
      for (let ring = 1; ring <= 8; ring++) {
        ctx.beginPath();
        const baseR = ring * 44 * s;
        for (let a = 0; a <= Math.PI * 2 + 0.08; a += 0.08) {
          const d = Math.sin(a * 3 + ring * 0.7) * 26 * s + Math.cos(a * 5 - ring) * 14 * s;
          const x = cx + Math.cos(a) * (baseR + d);
          const y = cy + Math.sin(a) * (baseR * 0.86 + d);
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = hexToRgba(ring % 2 === 0 ? cfg.accent : '#ffffff', 0.75 - ring * 0.06);
        ctx.lineWidth = 2.5 * s;
        ctx.stroke();
      }
    } else if (cfg.motif === 'dot_sphere') {
      const r = 250 * s;
      const step = 26 * s;
      for (let y = -r; y <= r; y += step) {
        for (let x = -r; x <= r; x += step) {
          const dist = Math.hypot(x, y);
          if (dist <= r) {
            const zFactor = Math.sqrt(Math.max(0, 1 - (dist / r) ** 2));
            const dotR = Math.max(1.5 * s, zFactor * 9 * s);
            ctx.fillStyle = zFactor > 0.65 ? '#ffffff' : cfg.accent;
            ctx.beginPath();
            ctx.arc(cx + x, cy + y, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else if (cfg.motif === 'aurora_waves') {
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        const y0 = cy + (k - 2.5) * 48 * s;
        ctx.moveTo(0, y0);
        ctx.bezierCurveTo(size * 0.28, y0 - 150 * s, size * 0.72, y0 + 150 * s, size, y0 - 20 * s);
        ctx.strokeStyle = hexToRgba(k % 2 === 0 ? cfg.accent : '#ffffff', 0.68 - k * 0.08);
        ctx.lineWidth = (28 - k * 3) * s;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 4. Multi-Layer Customizable Vector Emblems
  (cfg.decals || []).forEach(d => {
    const isSel = selectedHighlight?.kind === 'decal' && selectedHighlight.id === d.id;
    const dx = (d.x / 100) * size;
    const dy = (d.y / 100) * size;
    const ds = d.size * s;
    drawVectorDecal(ctx, d.type, dx, dy, ds, d.color, d.rotate, d.opacity, d.style);
    if (isSel && size >= 400) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2 * s;
      ctx.setLineDash([6 * s, 5 * s]);
      ctx.strokeRect(dx - ds * 0.6, dy - ds * 0.6, ds * 1.2, ds * 1.2);
      ctx.restore();
    }
  });

  // 5. Texture FX
  if (cfg.scanlines > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${(cfg.scanlines / 100) * 0.46})`;
    for (let y = 0; y < size; y += 6 * s) {
      ctx.fillRect(0, y, size, 2.5 * s);
    }
    ctx.restore();
  }

  if (cfg.glitch > 0) {
    ctx.save();
    const strips = Math.max(3, Math.round(cfg.glitch / 10));
    for (let i = 0; i < strips; i++) {
      const sy = ((i * 193 + 41) % 880) * s;
      const sh = (8 + (i % 5) * 6) * s;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(34,211,238,0.22)' : 'rgba(244,63,94,0.22)';
      ctx.fillRect(0, sy, size, sh);
    }
    ctx.restore();
  }

  if (cfg.vignette > 0) {
    const vig = ctx.createRadialGradient(cx, cy, size * 0.28, cx, cy, size * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${(cfg.vignette / 100) * 0.9})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, size, size);
  }

  if (cfg.grain > 0) {
    ctx.save();
    ctx.globalAlpha = (cfg.grain / 100) * 0.72;
    const pat = ctx.createPattern(getGrainPatternCanvas(), 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.restore();
  }

  // 6. Frame
  if (cfg.frame === 'thin') {
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = 3 * s;
    ctx.strokeRect(28 * s, 28 * s, size - 56 * s, size - 56 * s);
  } else if (cfg.frame === 'double') {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3 * s;
    ctx.strokeRect(26 * s, 26 * s, size - 52 * s, size - 52 * s);
    ctx.lineWidth = 1.5 * s;
    ctx.strokeRect(42 * s, 42 * s, size - 84 * s, size - 84 * s);
  } else if (cfg.frame === 'sleeve') {
    ctx.strokeStyle = '#f4f4f5';
    ctx.lineWidth = 44 * s;
    ctx.strokeRect(22 * s, 22 * s, size - 44 * s, size - 44 * s);
  } else if (cfg.frame === 'polaroid') {
    ctx.fillStyle = '#f5f2eb';
    ctx.fillRect(0, 0, size, 48 * s);
    ctx.fillRect(0, 0, 48 * s, size);
    ctx.fillRect(size - 48 * s, 0, 48 * s, size);
    ctx.fillRect(0, size - 156 * s, size, 156 * s);
  } else if (cfg.frame === 'film_strip') {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 56 * s, size);
    ctx.fillRect(size - 56 * s, 0, 56 * s, size);
    ctx.fillStyle = '#e4e4e7';
    for (let y = 26 * s; y < size - 26 * s; y += 64 * s) {
      ctx.fillRect(16 * s, y, 24 * s, 36 * s);
      ctx.fillRect(size - 40 * s, y, 24 * s, 36 * s);
    }
  }

  // 7. Hazard & Crop Marks
  if (cfg.hazardStripe) {
    ctx.save();
    const barH = 30 * s;
    const barY = size - barH;
    ctx.fillStyle = cfg.accent || '#facc15';
    ctx.fillRect(0, barY, size, barH);
    ctx.beginPath();
    ctx.rect(0, barY, size, barH);
    ctx.clip();
    ctx.fillStyle = '#09090b';
    for (let x = -barH; x < size + barH; x += 38 * s) {
      ctx.beginPath();
      ctx.moveTo(x, barY + barH);
      ctx.lineTo(x + 19 * s, barY);
      ctx.lineTo(x + 38 * s, barY);
      ctx.lineTo(x + 19 * s, barY + barH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  if (cfg.cropMarks) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2 * s;
    const m = 24 * s;
    const l = 28 * s;
    const corners: Array<[number, number, number, number]> = [
      [m, m, 1, 1],
      [size - m, m, -1, 1],
      [m, size - m, 1, -1],
      [size - m, size - m, -1, -1]
    ];
    corners.forEach(([x0, y0, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0 + dy * l);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x0 + dx * l, y0);
      ctx.stroke();
    });
    ctx.restore();
  }

  // 8. Independent Text Layers
  if (cfg.showText) {
    (cfg.textLayers || []).forEach(layer => {
      const isSel = selectedHighlight?.kind === 'text' && selectedHighlight.id === layer.id;
      drawTextLayer(ctx, layer, size, s, isSel);
    });
  }

  // 9. Stamps & Sticker
  if (cfg.parentalAdvisory) {
    const bw = 192 * s * (cfg.parentalScale || 1);
    const paAspect =
      cachedPaImage && cachedPaImage.complete && cachedPaImage.naturalWidth > 0
        ? cachedPaImage.naturalHeight / cachedPaImage.naturalWidth
        : 500 / 800;
    const bh = bw * paAspect;
    const padEdge = cfg.frame === 'polaroid' || cfg.frame === 'film_strip' ? 68 * s : 52 * s;
    const bottomPad = cfg.frame === 'polaroid' ? 172 * s : cfg.hazardStripe ? 62 * s : 52 * s;
    const bx = cfg.parentalCorner === 'bl' || cfg.parentalCorner === 'tl' ? padEdge : size - bw - padEdge;
    const by = cfg.parentalCorner === 'tr' || cfg.parentalCorner === 'tl' ? padEdge : size - bh - bottomPad;
    drawAuthenticParentalAdvisory(ctx, bx, by, bw, bh);
  }

  if (cfg.barcodeStamp) {
    ctx.save();
    const bx = cfg.parentalAdvisory && cfg.parentalCorner === 'bl' ? size - 230 * s : 56 * s;
    const by = size - (cfg.frame === 'polaroid' ? 120 : 88) * s;
    ctx.fillStyle = cfg.frame === 'polaroid' ? '#111111' : '#ffffff';
    ctx.globalAlpha = 0.85;
    const widths = [3, 6, 2, 4, 8, 2, 5, 3, 7, 2, 4, 6, 2, 3, 7, 4, 2, 5];
    let cur = bx;
    widths.forEach((w, idx) => {
      if (idx % 2 === 0) ctx.fillRect(cur, by, w * s, 32 * s);
      cur += (w + 3) * s;
    });
    ctx.font = `600 ${Math.round(11 * s)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('0 42819 2026 8', bx, by + 44 * s);
    ctx.restore();
  }

  if (cfg.hiResStamp) {
    ctx.save();
    const hx = 54 * s;
    const hy = 52 * s;
    ctx.strokeStyle = cfg.accent || '#facc15';
    ctx.lineWidth = 2.5 * s;
    ctx.strokeRect(hx, hy, 134 * s, 38 * s);
    ctx.fillStyle = cfg.accent || '#facc15';
    ctx.fillRect(hx, hy, 56 * s, 38 * s);
    ctx.fillStyle = '#09090b';
    ctx.font = `900 ${Math.round(14 * s)}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('HI-RES', hx + 28 * s, hy + 24 * s);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(13 * s)}px "JetBrains Mono", monospace`;
    ctx.fillText('24/96', hx + 95 * s, hy + 24 * s);
    ctx.restore();
  }

  if (cfg.stickerText.trim()) {
    ctx.save();
    const label = cfg.stickerText.trim().slice(0, 12).toUpperCase();
    const sx = size - 138 * s;
    const sy = 128 * s;
    const bgCol = cfg.stickerColor || cfg.accent || '#facc15';
    ctx.translate(sx, sy);
    ctx.rotate(-0.16);

    if (cfg.stickerShape === 'starburst') {
      ctx.fillStyle = bgCol;
      ctx.beginPath();
      const spikes = 22;
      for (let i = 0; i < spikes * 2; i++) {
        const rad = (i * Math.PI) / spikes;
        const rr = i % 2 === 0 ? 64 * s : 52 * s;
        if (i === 0) ctx.moveTo(Math.cos(rad) * rr, Math.sin(rad) * rr);
        else ctx.lineTo(Math.cos(rad) * rr, Math.sin(rad) * rr);
      }
      ctx.closePath();
      ctx.fill();
    } else if (cfg.stickerShape === 'pill') {
      ctx.fillStyle = bgCol;
      roundRectPath(ctx, -74 * s, -23 * s, 148 * s, 46 * s, 23 * s);
      ctx.fill();
    } else if (cfg.stickerShape === 'tape') {
      ctx.fillStyle = bgCol;
      ctx.fillRect(-76 * s, -24 * s, 152 * s, 48 * s);
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2.5 * s;
      ctx.strokeRect(-72 * s, -20 * s, 144 * s, 40 * s);
    } else {
      ctx.fillStyle = bgCol;
      ctx.beginPath();
      ctx.arc(0, 0, 56 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 48 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#09090b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round((label.length > 8 ? 13 : 16) * s)}px "Montserrat", sans-serif`;
    ctx.fillText(label, 0, 1 * s);
    ctx.restore();
  }
}

function buildPresetConfig(
  preset: CoverTemplatePreset,
  prev: CoverDesignConfig,
  initialTitle: string,
  initialArtist: string,
  keepPhoto = true
): CoverDesignConfig {
  const curTitle = prev.textLayers.find(l => l.id === 'title')?.text || initialTitle || 'UNTITLED';
  const curArtist = prev.textLayers.find(l => l.id === 'artist')?.text || initialArtist || '';
  const baseLayers = makeDefaultTextLayers(curTitle, curArtist, '', '');
  const applyLayerStyle = (id: string, patch?: Partial<CoverTextLayer>) => {
    const idx = baseLayers.findIndex(l => l.id === id);
    if (idx >= 0 && patch) {
      baseLayers[idx] = { ...baseLayers[idx], ...patch };
    }
  };
  applyLayerStyle('title', preset.config.titleStyle);
  applyLayerStyle('artist', preset.config.artistStyle);
  applyLayerStyle('kicker', preset.config.kickerStyle);
  applyLayerStyle('footer', preset.config.footerStyle);

  const { titleStyle, artistStyle, kickerStyle, footerStyle, ...cleanPreset } = preset.config;
  void titleStyle;
  void artistStyle;
  void kickerStyle;
  void footerStyle;

  return {
    ...DEFAULT_CONFIG,
    ...cleanPreset,
    showText: preset.hasText,
    textLayers: baseLayers,
    decals: preset.config.decals ? preset.config.decals.map(d => ({ ...d })) : [],
    ...(keepPhoto
      ? {
          photoDataUrl: prev.photoDataUrl,
          photoScale: prev.photoScale,
          photoOffsetX: prev.photoOffsetX,
          photoOffsetY: prev.photoOffsetY,
          photoRotate: prev.photoRotate,
          photoBrightness: prev.photoBrightness,
          photoContrast: prev.photoContrast,
          photoSaturate: prev.photoSaturate,
          photoBlur: prev.photoBlur,
          photoFilter: prev.photoFilter
        }
      : {})
  };
}

const TemplateMiniPreview: React.FC<{
  preset: CoverTemplatePreset;
  title: string;
  artist: string;
  fontsReadyTick: number;
  isSelected: boolean;
  onSelect: () => void;
}> = React.memo(({ preset, title, artist, fontsReadyTick, isSelected, onSelect }) => {
  const miniRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!miniRef.current) return;
    try {
      const cfg = buildPresetConfig(preset, DEFAULT_CONFIG, title || 'ECHOES', artist || 'ARTIST', false);
      renderCoverToCanvas(miniRef.current, cfg);
    } catch (err) {
      console.error('Mini cover render failed:', err);
    }
  }, [preset, title, artist, fontsReadyTick]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col items-start gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer text-left ${
        isSelected
          ? 'border-white/70 bg-white/10 shadow-lg'
          : 'border-white/[0.08] bg-zinc-900/60 hover:border-white/25 hover:bg-zinc-900'
      }`}
    >
      <canvas
        ref={miniRef}
        width={180}
        height={180}
        className="w-full aspect-square rounded-lg bg-black block"
      />
      <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-white truncate w-full px-0.5">
        {preset.name}
      </span>
    </button>
  );
});

const DecalMiniIcon: React.FC<{
  type: CoverDecalType;
  label: string;
  active: boolean;
  onClick: () => void;
}> = React.memo(({ type, label, active, onClick }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    try {
      drawVectorDecal(ctx, type, cvs.width / 2, cvs.height / 2, 42, active ? '#09090b' : '#f4f4f5', 0, 100, 'fill');
    } catch (e) {
      console.error('Decal mini render error:', e);
    }
  }, [type, active]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`aspect-square p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
        active
          ? 'theme-bg-accent border-transparent shadow-md scale-[1.03]'
          : 'bg-zinc-900/80 border-white/[0.09] hover:border-white/30 hover:bg-zinc-800/80'
      }`}
    >
      <canvas ref={ref} width={64} height={64} className="w-9 h-9 pointer-events-none block" />
    </button>
  );
});

export interface CoverEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialArtist?: string;
  initialKicker?: string;
  onApplyDataUrl: (dataUrl: string) => Promise<void> | void;
}

export const CoverEditorModal: React.FC<CoverEditorModalProps> = ({
  isOpen,
  onClose,
  initialTitle = '',
  initialArtist = '',
  initialKicker = '',
  onApplyDataUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedPhoto, setLoadedPhoto] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'background' | 'photo' | 'text' | 'decals' | 'details'>('templates');
  const [templateFilter, setTemplateFilter] = useState<'all' | TemplateCategory>('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('grad_aurora_prism');
  const [selectedTextId, setSelectedTextId] = useState<string>('title');
  const [selectedDecalId, setSelectedDecalId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<'auto' | 'text' | 'decal' | 'photo' | 'motif'>('auto');
  const [fontsReadyTick, setFontsReadyTick] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const dragRef = useRef<{
    kind: 'text' | 'decal' | 'photo' | 'motif';
    id?: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const [config, setConfig] = useState<CoverDesignConfig>(() => ({
    ...DEFAULT_CONFIG,
    showText: Boolean(initialTitle),
    textLayers: makeDefaultTextLayers(initialTitle || 'UNTITLED', initialArtist || '', initialKicker || '', '')
  }));

  useEffect(() => {
    if (!isOpen) return;
    getParentalAdvisoryImage(() => setFontsReadyTick(t => t + 1));
    setConfig(prev => ({
      ...prev,
      textLayers: prev.textLayers.map(layer => {
        if (layer.id === 'title' && initialTitle) return { ...layer, text: initialTitle };
        if (layer.id === 'artist' && initialArtist !== undefined) return { ...layer, text: initialArtist };
        if (layer.id === 'kicker' && initialKicker) return { ...layer, text: initialKicker, enabled: true };
        return layer;
      })
    }));
  }, [isOpen, initialTitle, initialArtist, initialKicker]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined' || !('fonts' in document)) return;
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) setFontsReadyTick(t => t + 1);
    });
    const activeFonts = Array.from(new Set([...config.textLayers.map(l => l.fontFamily), ...FONT_OPTIONS.map(f => f.id)]));
    Promise.all(
      activeFonts.map(f => document.fonts.load(`700 48px "${f}"`).catch(() => null))
    ).then(() => {
      if (alive) setFontsReadyTick(t => t + 1);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, config.textLayers]);

  useEffect(() => {
    if (!config.photoDataUrl) {
      setLoadedPhoto(null);
      return;
    }
    const img = new Image();
    img.onload = () => setLoadedPhoto(img);
    img.src = config.photoDataUrl;
  }, [config.photoDataUrl]);

  const highlightSelection = useMemo(() => {
    if (activeTab === 'text' && config.showText) {
      return { kind: 'text' as const, id: selectedTextId };
    }
    if (activeTab === 'decals' && selectedDecalId) {
      return { kind: 'decal' as const, id: selectedDecalId };
    }
    return null;
  }, [activeTab, config.showText, selectedTextId, selectedDecalId]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    try {
      renderCoverToCanvas(canvasRef.current, config, loadedPhoto, highlightSelection);
    } catch (err) {
      console.error('Cover canvas render failed:', err);
    }
  }, [isOpen, config, loadedPhoto, fontsReadyTick, highlightSelection]);

  const filteredTemplates = useMemo(() => {
    if (templateFilter === 'all') return COVER_TEMPLATES;
    if (templateFilter === 'text') return COVER_TEMPLATES.filter(t => t.hasText);
    if (templateFilter === 'notext') return COVER_TEMPLATES.filter(t => !t.hasText);
    return COVER_TEMPLATES.filter(t => t.category === templateFilter);
  }, [templateFilter]);

  const selectedTextLayer = useMemo(
    () => config.textLayers.find(l => l.id === selectedTextId) || config.textLayers[0],
    [config.textLayers, selectedTextId]
  );

  const selectedDecalLayer = useMemo(
    () => config.decals.find(d => d.id === selectedDecalId) || config.decals[0] || null,
    [config.decals, selectedDecalId]
  );

  const update = useCallback(<K extends keyof CoverDesignConfig>(key: K, val: CoverDesignConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  }, []);

  const updateTextLayer = useCallback((id: string, patch: Partial<CoverTextLayer>) => {
    setConfig(prev => {
      const shouldAutoShow =
        patch.enabled === true ||
        (typeof patch.text === 'string' && patch.text.trim().length > 0) ||
        patch.fontFamily !== undefined ||
        patch.color !== undefined ||
        patch.fontSize !== undefined ||
        patch.effect !== undefined ||
        patch.boxBg !== undefined;
      return {
        ...prev,
        showText: shouldAutoShow ? true : prev.showText,
        textLayers: prev.textLayers.map(l => (l.id === id ? { ...l, ...patch } : l))
      };
    });
  }, []);

  const addCustomTextLayer = () => {
    const newId = `custom_${Date.now()}`;
    const offsets = [
      { x: 50, y: 50, align: 'center' as const },
      { x: 10, y: 14, align: 'left' as const },
      { x: 90, y: 14, align: 'right' as const },
      { x: 10, y: 86, align: 'left' as const },
      { x: 90, y: 86, align: 'right' as const }
    ];
    const presetPos = offsets[config.textLayers.filter(l => l.id.startsWith('custom_')).length % offsets.length];
    const newLayer: CoverTextLayer = {
      id: newId,
      label: `Надпись ${config.textLayers.length + 1}`,
      enabled: true,
      text: 'NEW TEXT',
      x: presetPos.x,
      y: presetPos.y,
      fontFamily: 'Unbounded',
      fontSize: 40,
      fontWeight: 700,
      letterSpacing: 3,
      lineHeight: 1.12,
      rotate: 0,
      align: presetPos.align,
      uppercase: true,
      color: '#ffffff',
      effect: 'shadow',
      boxBg: false,
      opacity: 100
    };
    setConfig(prev => ({
      ...prev,
      showText: true,
      textLayers: [...prev.textLayers, newLayer]
    }));
    setSelectedTextId(newId);
    setActiveTab('text');
  };

  const duplicateTextLayer = (layer: CoverTextLayer) => {
    const newId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_dup`;
    const copy: CoverTextLayer = {
      ...layer,
      id: newId,
      label: `${layer.label} (копия)`,
      enabled: true,
      x: clampNum(layer.x, 6, 94),
      y: clampNum(layer.y + 8 > 92 ? layer.y - 8 : layer.y + 8, 6, 94)
    };
    setConfig(prev => ({
      ...prev,
      showText: true,
      textLayers: [...prev.textLayers, copy]
    }));
    setSelectedTextId(newId);
  };

  const removeTextLayer = (id: string) => {
    setConfig(prev => {
      const nextLayers = prev.textLayers.filter(l => l.id !== id);
      if (selectedTextId === id && nextLayers.length > 0) {
        setSelectedTextId(nextLayers[0].id);
      }
      return { ...prev, textLayers: nextLayers };
    });
  };

  const addDecalLayer = (type: CoverDecalType = 'star4') => {
    const newId = `dec_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const newDecal: CoverDecalLayer = {
      id: newId,
      type,
      x: 50,
      y: 50,
      size: 96,
      rotate: 0,
      opacity: 95,
      color: config.accent || '#ffffff',
      style: 'fill'
    };
    setConfig(prev => ({ ...prev, decals: [...prev.decals, newDecal] }));
    setSelectedDecalId(newId);
    setActiveTab('decals');
  };

  const updateDecalLayer = useCallback((id: string, patch: Partial<CoverDecalLayer>) => {
    setConfig(prev => ({
      ...prev,
      decals: prev.decals.map(d => (d.id === id ? { ...d, ...patch } : d))
    }));
  }, []);

  const removeDecalLayer = (id: string) => {
    setConfig(prev => {
      const next = prev.decals.filter(d => d.id !== id);
      if (selectedDecalId === id) {
        setSelectedDecalId(next[0]?.id ?? null);
      }
      return { ...prev, decals: next };
    });
  };

  const duplicateDecalLayer = (decal: CoverDecalLayer) => {
    const newId = `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_dup`;
    const copy: CoverDecalLayer = {
      ...decal,
      id: newId,
      x: clampNum(decal.x + 8, 5, 95),
      y: clampNum(decal.y + 8, 5, 95)
    };
    setConfig(prev => ({ ...prev, decals: [...prev.decals, copy] }));
    setSelectedDecalId(newId);
  };

  const applyPreset = (preset: CoverTemplatePreset) => {
    setSelectedPresetId(preset.id);
    setConfig(prev => buildPresetConfig(preset, prev, initialTitle, initialArtist, true));
    if (preset.id === 'blank_canvas') setActiveTab('background');
  };

  const handleResetToBlank = () => {
    const blank = COVER_TEMPLATES.find(t => t.id === 'blank_canvas');
    if (blank) {
      setSelectedPresetId('blank_canvas');
      setConfig(prev => buildPresetConfig(blank, prev, initialTitle, initialArtist, false));
    }
  };

  const handleRandomize = () => {
    const pal = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
    const bgChoices: CoverBgStyle[] = ['gradient', 'tri_gradient', 'aurora_flow', 'mesh', 'radial_glow', 'conic_sweep', 'spotlight', 'horizon_fade'];
    const motifChoices: CoverMotif[] = MOTIF_OPTIONS.map(m => m.id).filter(m => m !== 'none');
    const font = FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)].id;
    const decalChoices: CoverDecalType[] = ['star4', 'star8', 'lightning', 'crown', 'butterfly', 'moon', 'eye', 'diamond'];
    const useDecal = Math.random() > 0.45;
    setConfig(prev => ({
      ...prev,
      bgStyle: bgChoices[Math.floor(Math.random() * bgChoices.length)],
      color1: pal.c1,
      color2: pal.c2,
      accent: pal.accent,
      angle: Math.floor(Math.random() * 360),
      motif: motifChoices[Math.floor(Math.random() * motifChoices.length)],
      motifScale: 80 + Math.floor(Math.random() * 40),
      motifOffsetX: 0,
      motifOffsetY: prev.showText ? -6 : 0,
      motifRotate: Math.random() > 0.7 ? Math.floor(Math.random() * 360) : 0,
      grain: 10 + Math.floor(Math.random() * 20),
      vignette: 12 + Math.floor(Math.random() * 30),
      textLayers: prev.textLayers.map(l =>
        l.id === 'title' ? { ...l, fontFamily: font, color: pal.text } : l.id === 'artist' ? { ...l, color: pal.text } : l
      ),
      decals: useDecal
        ? [{
            id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: decalChoices[Math.floor(Math.random() * decalChoices.length)],
            x: 84,
            y: 16,
            size: 68,
            rotate: 0,
            opacity: 92,
            color: pal.accent,
            style: Math.random() > 0.5 ? 'fill' : 'outline'
          }]
        : []
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const res = ev.target?.result;
      if (typeof res === 'string') {
        setConfig(prev => ({
          ...prev,
          photoDataUrl: res,
          motif: prev.photoDataUrl ? prev.motif : 'none',
          photoOverlayOpacity: prev.photoDataUrl ? prev.photoOverlayOpacity : 14,
          photoScrimBottom: prev.photoDataUrl ? prev.photoScrimBottom : 42,
          photoScale: 100,
          photoOffsetX: 0,
          photoOffsetY: 0,
          photoRotate: 0
        }));
        setActiveTab('photo');
      }
    };
    reader.readAsDataURL(file);
  };

  // Interactive Canvas Pointer Dragging
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    let chosenKind: 'text' | 'decal' | 'photo' | 'motif' | null = null;
    let chosenId: string | undefined;

    if (dragTarget === 'photo' && config.photoDataUrl) {
      chosenKind = 'photo';
    } else if (dragTarget === 'motif' && config.motif !== 'none') {
      chosenKind = 'motif';
    } else if (dragTarget === 'decal' || (dragTarget === 'auto' && config.decals.length > 0)) {
      // Hit-test decals first when close
      const hitDecal = [...config.decals].reverse().find(d => {
        const hitRadius = Math.max(6, (d.size / 1000) * 60);
        return Math.hypot(d.x - clickX, d.y - clickY) <= hitRadius;
      });
      if (hitDecal) {
        chosenKind = 'decal';
        chosenId = hitDecal.id;
        setSelectedDecalId(hitDecal.id);
      }
    }

    if (!chosenKind && (dragTarget === 'text' || dragTarget === 'auto') && config.showText) {
      // Find closest enabled text layer with content (accounting for multiline height & alignment)
      let bestLayer: CoverTextLayer | null = null;
      let bestDist = 999;
      for (const l of config.textLayers) {
        if (!l.enabled || !l.text.trim()) continue;
        const lineCount = Math.max(1, l.text.split(/\r?\n/).length);
        const halfH = clampNum((lineCount * l.fontSize * (l.lineHeight ?? 1.12)) / 18, 6, 36);
        const centerAnchorX =
          l.align === 'left' ? Math.min(92, l.x + 18) : l.align === 'right' ? Math.max(8, l.x - 18) : l.x;
        const dy = Math.abs(l.y - clickY);
        const dx = Math.abs(centerAnchorX - clickX);
        if (dy <= halfH + 8 && dx <= 38) {
          const dist = Math.hypot(dx * 0.45, dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestLayer = l;
          }
        }
      }
      if (!bestLayer && dragTarget === 'text' && selectedTextLayer) {
        bestLayer = selectedTextLayer;
      }
      if (bestLayer) {
        chosenKind = 'text';
        chosenId = bestLayer.id;
        setSelectedTextId(bestLayer.id);
      }
    }

    if (!chosenKind && activeTab === 'photo' && config.photoDataUrl) {
      chosenKind = 'photo';
    } else if (!chosenKind && activeTab === 'decals' && selectedDecalLayer) {
      chosenKind = 'decal';
      chosenId = selectedDecalLayer.id;
    } else if (!chosenKind && activeTab === 'text' && config.showText && selectedTextLayer) {
      chosenKind = 'text';
      chosenId = selectedTextLayer.id;
    } else if (!chosenKind && config.photoDataUrl && config.motif === 'none') {
      chosenKind = 'photo';
    } else if (!chosenKind && config.motif !== 'none') {
      chosenKind = 'motif';
    }

    if (!chosenKind) return;

    let origX = 50;
    let origY = 50;
    if (chosenKind === 'text' && chosenId) {
      const l = config.textLayers.find(x => x.id === chosenId);
      if (l) {
        origX = l.x;
        origY = l.y;
      }
    } else if (chosenKind === 'decal' && chosenId) {
      const d = config.decals.find(x => x.id === chosenId);
      if (d) {
        origX = d.x;
        origY = d.y;
      }
    } else if (chosenKind === 'photo') {
      origX = config.photoOffsetX;
      origY = config.photoOffsetY;
    } else if (chosenKind === 'motif') {
      origX = config.motifOffsetX;
      origY = config.motifOffsetY;
    }

    dragRef.current = {
      kind: chosenKind,
      id: chosenId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX,
      origY
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dxPct = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startClientY) / rect.height) * 100;

    if (drag.kind === 'text' && drag.id) {
      let nx = Math.round(clampNum(drag.origX + dxPct, 4, 96));
      let ny = Math.round(clampNum(drag.origY + dyPct, 4, 96));
      if (Math.abs(nx - 50) <= 2) nx = 50;
      if (Math.abs(ny - 50) <= 2) ny = 50;
      updateTextLayer(drag.id, { x: nx, y: ny });
    } else if (drag.kind === 'decal' && drag.id) {
      let nx = Math.round(clampNum(drag.origX + dxPct, 4, 96));
      let ny = Math.round(clampNum(drag.origY + dyPct, 4, 96));
      if (Math.abs(nx - 50) <= 2) nx = 50;
      if (Math.abs(ny - 50) <= 2) ny = 50;
      updateDecalLayer(drag.id, { x: nx, y: ny });
    } else if (drag.kind === 'photo') {
      setConfig(prev => ({
        ...prev,
        photoOffsetX: Math.round(clampNum(drag.origX + dxPct, -60, 60)),
        photoOffsetY: Math.round(clampNum(drag.origY + dyPct, -60, 60))
      }));
    } else if (drag.kind === 'motif') {
      setConfig(prev => ({
        ...prev,
        motifOffsetX: Math.round(clampNum(drag.origX + dxPct, -45, 45)),
        motifOffsetY: Math.round(clampNum(drag.origY + dyPct, -45, 45))
      }));
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleApplyCover = async () => {
    setIsSaving(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1000;
      exportCanvas.height = 1000;
      // Render clean without selection dashed guide frame
      renderCoverToCanvas(exportCanvas, config, loadedPhoto, null);
      const dataUrl = exportCanvas.toDataURL('image/png', 0.96);
      await onApplyDataUrl(dataUrl);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[5000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[92vh] max-h-[92vh] bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl theme-bg-soft border border-white/15 flex items-center justify-center theme-accent shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">Редактор обложек</h2>
              <p className="text-xs text-zinc-400 truncate">
                Градиенты, 17 шрифтов, свободное перетаскивание текста, фото-фон и векторные эмблемы
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToBlank}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              title="Чистый холст с нуля"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Пустой холст</span>
            </button>
            <button
              type="button"
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5 theme-accent" />
              <span>Случайно</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Preview Stage */}
          <div className="lg:w-[44%] shrink-0 bg-zinc-900/35 border-b lg:border-b-0 lg:border-r border-white/[0.08] p-4 md:p-5 flex flex-col items-center justify-center gap-3">
            <div className="relative w-full max-w-[390px] aspect-square rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border border-white/15 bg-black">
              <canvas
                ref={canvasRef}
                width={680}
                height={680}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
                className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
              />
            </div>

            {/* Interactive Canvas Drag Target + Quick Actions */}
            <div className="w-full max-w-[390px] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/90 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Двигать мышью:</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {([
                    { id: 'auto', label: 'Авто' },
                    { id: 'text', label: 'Текст' },
                    { id: 'decal', label: 'Эмблема' },
                    { id: 'photo', label: 'Фото' },
                    { id: 'motif', label: 'Фигура' }
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDragTarget(opt.id)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                        dragTarget === opt.id
                          ? 'bg-white text-black'
                          : 'text-zinc-400 hover:text-white bg-white/[0.05]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-zinc-100 font-semibold flex items-center gap-1.5 cursor-pointer">
                  <ImagePlus className="w-3.5 h-3.5 theme-accent" />
                  <span>{config.photoDataUrl ? 'Заменить фото-фон' : 'Загрузить фото на фон'}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => update('parentalAdvisory', !config.parentalAdvisory)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                    config.parentalAdvisory
                      ? 'bg-white text-black border-white'
                      : 'bg-white/[0.06] text-zinc-300 border-white/10 hover:text-white'
                  }`}
                >
                  PA Explicit
                </button>
              </div>
            </div>
          </div>

          {/* Right Controls Column */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Navigation Tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-white/[0.08] flex gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'templates' as const, label: 'Шаблоны', icon: Sparkles },
                { id: 'background' as const, label: 'Фон и объекты', icon: Layers },
                { id: 'photo' as const, label: 'Фото-фон', icon: ImageIcon },
                { id: 'text' as const, label: 'Текст', icon: Type },
                { id: 'decals' as const, label: 'Эмблемы', icon: Sticker },
                { id: 'details' as const, label: 'Детали и FX', icon: Sliders }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'text' && !config.showText) {
                        const hasTextContent = config.textLayers.some(l => l.enabled && l.text.trim().length > 0);
                        if (hasTextContent) update('showText', true);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      active
                        ? 'theme-bg-accent text-black shadow-sm'
                        : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-5">
              {/* TAB: TEMPLATES */}
              {activeTab === 'templates' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all' as const, label: `Все (${COVER_TEMPLATES.length})` },
                      { id: 'neutral' as const, label: 'Нейтральные' },
                      { id: 'gradient' as const, label: 'Градиенты' },
                      { id: 'minimal' as const, label: 'Минимализм' },
                      { id: 'blank' as const, label: 'Пустой / Фото' },
                      { id: 'text' as const, label: 'С текстом' },
                      { id: 'notext' as const, label: 'Без текста' },
                      { id: 'art' as const, label: 'Графика' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTemplateFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          templateFilter === f.id
                            ? 'bg-white text-black'
                            : 'bg-white/[0.06] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {filteredTemplates.map(preset => (
                      <TemplateMiniPreview
                        key={preset.id}
                        preset={preset}
                        title={initialTitle || 'ECHOES'}
                        artist={initialArtist || 'ARTIST'}
                        fontsReadyTick={fontsReadyTick}
                        isSelected={selectedPresetId === preset.id}
                        onSelect={() => applyPreset(preset)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: BACKGROUND & MOTIFS */}
              {activeTab === 'background' && (
                <div className="space-y-5">
                  {/* Neutral & Studio Backdrops */}
                  <div>
                    <p className="text-xs font-bold text-zinc-300 mb-2">Нейтральные и студийные палитры</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {NEUTRAL_COLOR_PALETTES.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() =>
                            setConfig(prev => ({
                              ...prev,
                              color1: p.c1,
                              color2: p.c2,
                              accent: p.accent,
                              textLayers: prev.textLayers.map(l =>
                                l.id === 'title' ? { ...l, color: p.text } : l
                              )
                            }))
                          }
                          title={p.name}
                          className="p-2 rounded-xl bg-zinc-900/70 border border-white/[0.08] hover:border-white/30 flex flex-col gap-1.5 cursor-pointer"
                        >
                          <div className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: p.c1 }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: p.c2 }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: p.accent }} />
                          </div>
                          <span className="text-[11px] text-zinc-300 truncate w-full text-left">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vibrant Palettes */}
                  <div>
                    <p className="text-xs font-bold text-zinc-300 mb-2">Цветные палитры</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {COLOR_PALETTES.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() =>
                            setConfig(prev => ({
                              ...prev,
                              color1: p.c1,
                              color2: p.c2,
                              accent: p.accent,
                              textLayers: prev.textLayers.map(l =>
                                l.id === 'title' ? { ...l, color: p.text } : l
                              )
                            }))
                          }
                          title={p.name}
                          className="p-2 rounded-xl bg-zinc-900/70 border border-white/[0.08] hover:border-white/30 flex flex-col gap-1.5 cursor-pointer"
                        >
                          <div className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: p.c1 }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: p.c2 }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: p.accent }} />
                          </div>
                          <span className="text-[11px] text-zinc-300 truncate w-full text-left">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Pickers + Hex + Swap */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/55 border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-zinc-200">Точные цвета фона</p>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig(prev => ({
                            ...prev,
                            color1: prev.color2,
                            color2: prev.color1
                          }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[11px] font-semibold text-zinc-200 cursor-pointer"
                      >
                        ⇄ Поменять Цвет 1 и 2
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Цвет 1 (Основной)</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                          <input
                            type="color"
                            value={config.color1}
                            onChange={e => update('color1', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={config.color1}
                            onChange={e => {
                              const v = e.target.value;
                              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update('color1', v);
                            }}
                            className="w-full min-w-0 bg-transparent text-xs font-mono text-zinc-200 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Цвет 2 (Переход)</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                          <input
                            type="color"
                            value={config.color2}
                            onChange={e => update('color2', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={config.color2}
                            onChange={e => {
                              const v = e.target.value;
                              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update('color2', v);
                            }}
                            className="w-full min-w-0 bg-transparent text-xs font-mono text-zinc-200 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Цвет 3 (Свет / Акцент)</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                          <input
                            type="color"
                            value={config.accent}
                            onChange={e => update('accent', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={config.accent}
                            onChange={e => {
                              const v = e.target.value;
                              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update('accent', v);
                            }}
                            className="w-full min-w-0 bg-transparent text-xs font-mono text-zinc-200 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Gradient & Static Background Generator */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/55 border border-white/[0.08] space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white">Генератор градиентов и статичных фонов</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setConfig(prev => ({
                              ...prev,
                              angle: 135,
                              bgCenterX: 50,
                              bgCenterY: 50,
                              bgBalance: 50,
                              bgSpread: 100
                            }))
                          }
                          className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-semibold text-zinc-300 cursor-pointer"
                        >
                          Сброс геометрии
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const gradList = BG_STYLE_OPTIONS.filter(o => o.kind === 'gradient');
                            const picked = gradList[Math.floor(Math.random() * gradList.length)];
                            setConfig(prev => ({
                              ...prev,
                              bgStyle: picked.id,
                              angle: Math.floor(Math.random() * 360),
                              bgCenterX: 25 + Math.floor(Math.random() * 50),
                              bgCenterY: 25 + Math.floor(Math.random() * 50),
                              bgBalance: 30 + Math.floor(Math.random() * 40),
                              bgSpread: 75 + Math.floor(Math.random() * 65)
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Dices className="w-3 h-3 theme-accent" />
                          <span>Случ. градиент</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-zinc-400">Градиенты</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {BG_STYLE_OPTIONS.filter(o => o.kind === 'gradient').map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => update('bgStyle', opt.id)}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer truncate ${
                              config.bgStyle === opt.id
                                ? 'bg-white text-black border-white font-bold'
                                : 'bg-zinc-950/75 text-zinc-300 border-white/[0.08] hover:border-white/25'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] font-semibold text-zinc-400 pt-1">Статичные фоны и геометрия</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {BG_STYLE_OPTIONS.filter(o => o.kind === 'static').map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => update('bgStyle', opt.id)}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer truncate ${
                              config.bgStyle === opt.id
                                ? 'bg-white text-black border-white font-bold'
                                : 'bg-zinc-950/75 text-zinc-300 border-white/[0.08] hover:border-white/25'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {config.bgStyle !== 'solid' && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-white/[0.06]">
                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-400 mb-1 tabular-nums">
                            <span>Угол</span>
                            <span className="text-white font-semibold">{config.angle}°</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={360}
                            value={config.angle}
                            onChange={e => update('angle', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-400 mb-1 tabular-nums">
                            <span>Фокус X</span>
                            <span className="text-white font-semibold">{config.bgCenterX ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={95}
                            value={config.bgCenterX ?? 50}
                            onChange={e => update('bgCenterX', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-400 mb-1 tabular-nums">
                            <span>Фокус Y</span>
                            <span className="text-white font-semibold">{config.bgCenterY ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={95}
                            value={config.bgCenterY ?? 50}
                            onChange={e => update('bgCenterY', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-400 mb-1 tabular-nums">
                            <span>Баланс</span>
                            <span className="text-white font-semibold">{config.bgBalance ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min={12}
                            max={88}
                            value={config.bgBalance ?? 50}
                            onChange={e => update('bgBalance', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-400 mb-1 tabular-nums">
                            <span>Мягкость</span>
                            <span className="text-white font-semibold">{config.bgSpread ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min={35}
                            max={165}
                            value={config.bgSpread ?? 100}
                            onChange={e => update('bgSpread', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-zinc-300 mb-2">Графический объект ({MOTIF_OPTIONS.length})</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {MOTIF_OPTIONS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => update('motif', m.id)}
                          className={`px-2 py-2 rounded-xl text-[11px] font-semibold border cursor-pointer truncate ${
                            config.motif === m.id
                              ? 'theme-bg-accent text-black border-transparent font-bold'
                              : 'bg-zinc-900/70 text-zinc-300 border-white/[0.08] hover:border-white/25'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {config.motif !== 'none' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Масштаб</span>
                            <span className="text-white font-semibold">{config.motifScale}%</span>
                          </div>
                          <input
                            type="range"
                            min={35}
                            max={190}
                            value={config.motifScale}
                            onChange={e => update('motifScale', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Прозрачность</span>
                            <span className="text-white font-semibold">{config.motifOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={config.motifOpacity}
                            onChange={e => update('motifOpacity', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Поворот</span>
                            <span className="text-white font-semibold">{config.motifRotate}°</span>
                          </div>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            value={config.motifRotate}
                            onChange={e => update('motifRotate', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Сдвиг X</span>
                            <span className="text-white font-semibold">{config.motifOffsetX}%</span>
                          </div>
                          <input
                            type="range"
                            min={-45}
                            max={45}
                            value={config.motifOffsetX}
                            onChange={e => update('motifOffsetX', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Сдвиг Y</span>
                            <span className="text-white font-semibold">{config.motifOffsetY}%</span>
                          </div>
                          <input
                            type="range"
                            min={-45}
                            max={45}
                            value={config.motifOffsetY}
                            onChange={e => update('motifOffsetY', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: PHOTO BACKGROUND STUDIO */}
              {activeTab === 'photo' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-zinc-900/70 border border-white/[0.08]">
                    <div>
                      <p className="text-sm font-bold text-white">Фото на задний фон обложки</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Загрузите снимок вместо шаблона и настройте кадр, фильтры и затемнение для текста
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 rounded-xl theme-bg-accent text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
                        <ImagePlus className="w-4 h-4" />
                        <span>{config.photoDataUrl ? 'Другое фото' : 'Загрузить фото'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      {config.photoDataUrl && (
                        <button
                          type="button"
                          onClick={() => update('photoDataUrl', undefined)}
                          className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300 cursor-pointer"
                        >
                          Удалить фото
                        </button>
                      )}
                    </div>
                  </div>

                  {config.photoDataUrl ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setConfig(prev => ({
                              ...prev,
                              motif: 'none',
                              photoOverlayOpacity: 10,
                              photoScrimBottom: 45
                            }))
                          }
                          className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold cursor-pointer"
                        >
                          Только фото (убрать центральную фигуру)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig(prev => ({
                              ...prev,
                              photoScale: 100,
                              photoOffsetX: 0,
                              photoOffsetY: 0,
                              photoRotate: 0,
                              photoBrightness: 100,
                              photoContrast: 100,
                              photoSaturate: 100,
                              photoBlur: 0,
                              photoFilter: 'none'
                            }))
                          }
                          className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-zinc-200 cursor-pointer"
                        >
                          Сбросить настройки фото
                        </button>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-zinc-300 mb-2">Цветовой фильтр</p>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {[
                            { id: 'none' as const, label: 'Оригинал' },
                            { id: 'bw' as const, label: 'Ч/Б' },
                            { id: 'contrast' as const, label: 'Контраст' },
                            { id: 'sepia' as const, label: 'Плёнка' },
                            { id: 'duotone' as const, label: 'Дуотон' },
                            { id: 'warm' as const, label: 'Тёплый' },
                            { id: 'cold' as const, label: 'Холод' }
                          ].map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => update('photoFilter', f.id)}
                              className={`px-2 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                                config.photoFilter === f.id
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900/70 text-zinc-300 border-white/[0.08]'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Зум</span>
                            <span className="text-white font-semibold">{config.photoScale}%</span>
                          </div>
                          <input
                            type="range"
                            min={50}
                            max={280}
                            value={config.photoScale}
                            onChange={e => update('photoScale', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Поворот</span>
                            <span className="text-white font-semibold">{config.photoRotate}°</span>
                          </div>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            value={config.photoRotate}
                            onChange={e => update('photoRotate', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Сдвиг X</span>
                            <span className="text-white font-semibold">{config.photoOffsetX}%</span>
                          </div>
                          <input
                            type="range"
                            min={-60}
                            max={60}
                            value={config.photoOffsetX}
                            onChange={e => update('photoOffsetX', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Сдвиг Y</span>
                            <span className="text-white font-semibold">{config.photoOffsetY}%</span>
                          </div>
                          <input
                            type="range"
                            min={-60}
                            max={60}
                            value={config.photoOffsetY}
                            onChange={e => update('photoOffsetY', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Яркость</span>
                            <span className="text-white font-semibold">{config.photoBrightness}%</span>
                          </div>
                          <input
                            type="range"
                            min={35}
                            max={190}
                            value={config.photoBrightness}
                            onChange={e => update('photoBrightness', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Контраст</span>
                            <span className="text-white font-semibold">{config.photoContrast}%</span>
                          </div>
                          <input
                            type="range"
                            min={50}
                            max={210}
                            value={config.photoContrast}
                            onChange={e => update('photoContrast', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Насыщенность</span>
                            <span className="text-white font-semibold">{config.photoSaturate}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={210}
                            value={config.photoSaturate}
                            onChange={e => update('photoSaturate', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Размытие</span>
                            <span className="text-white font-semibold">{config.photoBlur}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={16}
                            value={config.photoBlur}
                            onChange={e => update('photoBlur', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Цвет тонировки поверх фото</label>
                          <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                            <input
                              type="color"
                              value={config.photoOverlayColor}
                              onChange={e => update('photoOverlayColor', e.target.value)}
                              className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-zinc-200">{config.photoOverlayColor}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Плотность тонировки</span>
                            <span className="text-white font-semibold">{config.photoOverlayOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={90}
                            value={config.photoOverlayOpacity}
                            onChange={e => update('photoOverlayOpacity', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Нижний градиент под текст</span>
                            <span className="text-white font-semibold">{config.photoScrimBottom}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={90}
                            value={config.photoScrimBottom}
                            onChange={e => update('photoScrimBottom', Number(e.target.value))}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center border border-dashed border-white/15 rounded-2xl bg-zinc-900/30">
                      <p className="text-sm text-zinc-300 font-semibold">Фото ещё не загружено</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Нажмите «Загрузить фото» выше — после этого вы сможете зумить, крутить, фильтровать его и наложить сверху надписи.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: INDEPENDENT MULTI-LAYER TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/70 border border-white/[0.08]">
                    <div>
                      <p className="text-sm font-bold text-white">Показывать надписи на обложке</p>
                      <p className="text-xs text-zinc-400">
                        Каждую надпись можно двигать мышью по холсту и настраивать отдельно
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addCustomTextLayer}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Надпись</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => update('showText', !config.showText)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          config.showText ? 'theme-bg-accent text-black' : 'bg-white/[0.08] text-zinc-300'
                        }`}
                      >
                        {config.showText ? 'Вкл' : 'Выкл'}
                      </button>
                    </div>
                  </div>

                  {/* Quick text styles */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Быстрые стили текста</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {TEXT_STYLE_PRESETS.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setConfig(prev => ({
                              ...prev,
                              showText: true,
                              textLayers: prev.textLayers.map(l =>
                                l.id === 'title'
                                  ? { ...l, ...p.title }
                                  : l.id === 'artist'
                                    ? { ...l, ...p.artist }
                                    : { ...l, fontFamily: p.artist.fontFamily || l.fontFamily }
                              )
                            }))
                          }
                          className="p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.08] hover:border-white/25 hover:bg-zinc-800/70 text-left cursor-pointer transition-colors"
                          title={`${p.title.fontFamily} + ${p.artist.fontFamily}`}
                        >
                          <span
                            className="block text-[15px] text-white leading-tight truncate"
                            style={{
                              fontFamily: `"${p.title.fontFamily}"`,
                              fontWeight: p.title.fontWeight,
                              letterSpacing: `${(p.title.letterSpacing || 0) / 40}em`,
                              textTransform: p.title.uppercase ? 'uppercase' : 'none'
                            }}
                          >
                            {p.sample}
                          </span>
                          <span className="block text-[10px] text-zinc-500 mt-0.5">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTextLayer && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Положение: «{selectedTextLayer.label}»</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {TEXT_POSITION_PRESETS.map(pos => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => updateTextLayer(selectedTextLayer.id, pos.patch)}
                            className="px-2 py-1.5 rounded-lg bg-zinc-900/70 border border-white/[0.08] hover:border-white/25 text-[11px] font-bold text-zinc-300 hover:text-white cursor-pointer transition-colors"
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: 'S', size: 0.75 },
                          { label: 'M', size: 1 },
                          { label: 'L', size: 1.3 },
                          { label: 'XL', size: 1.7 }
                        ].map(sz => (
                          <button
                            key={sz.label}
                            type="button"
                            onClick={() => {
                              const base = selectedTextLayer.id === 'title' ? 80 : selectedTextLayer.id === 'artist' ? 30 : 24;
                              updateTextLayer(selectedTextLayer.id, { fontSize: Math.round(base * sz.size) });
                            }}
                            className="py-1.5 rounded-lg bg-zinc-900/70 border border-white/[0.08] hover:border-white/25 text-[11px] font-bold text-zinc-300 hover:text-white cursor-pointer transition-colors"
                            title="Размер надписи"
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Layer Selector Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {config.textLayers.map(layer => {
                      const active = selectedTextLayer?.id === layer.id;
                      return (
                        <button
                          key={layer.id}
                          type="button"
                          onClick={() => setSelectedTextId(layer.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                            active
                              ? 'bg-white text-black border-white'
                              : 'bg-zinc-900/70 text-zinc-300 border-white/[0.09] hover:border-white/25'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              layer.enabled && layer.text.trim() ? 'bg-emerald-400' : 'bg-zinc-500'
                            }`}
                          />
                          <span>{layer.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTextLayer && (
                    <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/55 border border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{selectedTextLayer.label}</span>
                          <button
                            type="button"
                            onClick={() => updateTextLayer(selectedTextLayer.id, { enabled: !selectedTextLayer.enabled })}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                              selectedTextLayer.enabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                                : 'bg-zinc-800 text-zinc-400 border border-white/10'
                            }`}
                          >
                            {selectedTextLayer.enabled ? 'Видима' : 'Скрыта'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => duplicateTextLayer(selectedTextLayer)}
                            className="px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Создать копию этого текста"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Дублировать</span>
                          </button>
                          {selectedTextLayer.id.startsWith('custom_') && (
                            <button
                              type="button"
                              onClick={() => removeTextLayer(selectedTextLayer.id)}
                              className="px-2.5 py-1 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Удалить</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-zinc-400">Текст надписи</label>
                            <span className="text-[11px] text-zinc-500">Enter — новая строка</span>
                          </div>
                          <textarea
                            rows={3}
                            value={selectedTextLayer.text}
                            onChange={e =>
                              updateTextLayer(selectedTextLayer.id, {
                                text: e.target.value,
                                enabled: e.target.value.trim().length > 0 ? true : selectedTextLayer.enabled
                              })
                            }
                            placeholder="Введите текст (нажмите Enter для переноса строки)..."
                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/15 text-sm text-white focus:outline-none focus:border-white/40 resize-y custom-scrollbar"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Цвет этой надписи</label>
                          <div className="flex items-center gap-2 bg-zinc-950 border border-white/15 rounded-xl px-2.5 py-1.5">
                            <input
                              type="color"
                              value={selectedTextLayer.color}
                              onChange={e => updateTextLayer(selectedTextLayer.id, { color: e.target.value })}
                              className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              value={selectedTextLayer.color}
                              onChange={e => {
                                const v = e.target.value;
                                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateTextLayer(selectedTextLayer.id, { color: v });
                              }}
                              className="w-full min-w-0 bg-transparent text-xs font-mono text-zinc-200 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Font Grid for THIS layer */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-zinc-300">Шрифт надписи ({FONT_OPTIONS.length})</label>
                          <span className="text-[11px] text-zinc-400">{selectedTextLayer.fontFamily}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                          {FONT_OPTIONS.map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => updateTextLayer(selectedTextLayer.id, { fontFamily: f.id })}
                              style={{ fontFamily: `"${f.id}", sans-serif` }}
                              className={`px-2.5 py-2 rounded-xl text-left border cursor-pointer flex items-center justify-between gap-2 ${
                                selectedTextLayer.fontFamily === f.id
                                  ? 'bg-white text-black border-white font-bold'
                                  : 'bg-zinc-950/75 text-zinc-200 border-white/[0.08] hover:border-white/25'
                              }`}
                            >
                              <span className="text-xs truncate">{f.label}</span>
                              <span className={`text-[10px] shrink-0 ${selectedTextLayer.fontFamily === f.id ? 'text-zinc-700' : 'text-zinc-500'}`}>
                                {f.tag}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Exact Position & Size */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Позиция X</span>
                            <span className="text-white font-semibold">{selectedTextLayer.x}%</span>
                          </div>
                          <input
                            type="range"
                            min={4}
                            max={96}
                            value={selectedTextLayer.x}
                            onChange={e => updateTextLayer(selectedTextLayer.id, { x: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Позиция Y</span>
                            <span className="text-white font-semibold">{selectedTextLayer.y}%</span>
                          </div>
                          <input
                            type="range"
                            min={4}
                            max={96}
                            value={selectedTextLayer.y}
                            onChange={e => updateTextLayer(selectedTextLayer.id, { y: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Размер</span>
                            <span className="text-white font-semibold">{selectedTextLayer.fontSize}px</span>
                          </div>
                          <input
                            type="range"
                            min={14}
                            max={160}
                            value={selectedTextLayer.fontSize}
                            onChange={e => updateTextLayer(selectedTextLayer.id, { fontSize: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Поворот</span>
                            <span className="text-white font-semibold">{selectedTextLayer.rotate}°</span>
                          </div>
                          <input
                            type="range"
                            min={-45}
                            max={45}
                            value={selectedTextLayer.rotate}
                            onChange={e => updateTextLayer(selectedTextLayer.id, { rotate: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Интервал букв</span>
                            <span className="text-white font-semibold">{selectedTextLayer.letterSpacing}</span>
                          </div>
                          <input
                            type="range"
                            min={-2}
                            max={20}
                            value={selectedTextLayer.letterSpacing}
                            onChange={e => updateTextLayer(selectedTextLayer.id, { letterSpacing: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Межстрочный</span>
                            <span className="text-white font-semibold">{(selectedTextLayer.lineHeight ?? 1.12).toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min={85}
                            max={185}
                            value={Math.round((selectedTextLayer.lineHeight ?? 1.12) * 100)}
                            onChange={e => updateTextLayer(selectedTextLayer.id, { lineHeight: Number(e.target.value) / 100 })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Непрозрачность</span>
                            <span className="text-white font-semibold">{selectedTextLayer.opacity}%</span>
                          </div>
                          <input
                            type="range"
                            min={15}
                            max={100}
                            value={selectedTextLayer.opacity}
                            onChange={e => updateTextLayer(selectedTextLayer.id, { opacity: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Насыщенность</label>
                          <div className="flex gap-1">
                            {[400, 600, 700, 900].map(w => (
                              <button
                                key={w}
                                type="button"
                                onClick={() => updateTextLayer(selectedTextLayer.id, { fontWeight: w })}
                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                  selectedTextLayer.fontWeight === w
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-950 text-zinc-300 border border-white/10'
                                }`}
                              >
                                {w === 400 ? 'Reg' : w === 600 ? 'Med' : w === 700 ? 'Bold' : 'Blk'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3x3 Quick Zone Grid + Alignment + Toggles */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400">Зона:</span>
                          <div className="grid grid-cols-3 gap-1 bg-zinc-950 border border-white/10 rounded-xl p-1">
                            {[
                              { label: '↖', x: 9, y: 12, align: 'left' as const },
                              { label: '↑', x: 50, y: 12, align: 'center' as const },
                              { label: '↗', x: 91, y: 12, align: 'right' as const },
                              { label: '←', x: 9, y: 50, align: 'left' as const },
                              { label: '•', x: 50, y: 50, align: 'center' as const },
                              { label: '→', x: 91, y: 50, align: 'right' as const },
                              { label: '↙', x: 9, y: 86, align: 'left' as const },
                              { label: '↓', x: 50, y: 86, align: 'center' as const },
                              { label: '↘', x: 91, y: 86, align: 'right' as const }
                            ].map(pos => (
                              <button
                                key={pos.label}
                                type="button"
                                onClick={() =>
                                  updateTextLayer(selectedTextLayer.id, {
                                    x: pos.x,
                                    y: pos.y,
                                    align: pos.align
                                  })
                                }
                                className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center cursor-pointer ${
                                  Math.abs(selectedTextLayer.x - pos.x) <= 4 && Math.abs(selectedTextLayer.y - pos.y) <= 6
                                    ? 'bg-white text-black'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                                }`}
                                title="Быстрое размещение на холсте"
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex bg-zinc-950 border border-white/10 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateTextLayer(selectedTextLayer.id, { align: 'left' })}
                              className={`p-1.5 rounded-md cursor-pointer ${selectedTextLayer.align === 'left' ? 'bg-white text-black' : 'text-zinc-400'}`}
                              title="Выровнять слева"
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateTextLayer(selectedTextLayer.id, { align: 'center' })}
                              className={`p-1.5 rounded-md cursor-pointer ${selectedTextLayer.align === 'center' ? 'bg-white text-black' : 'text-zinc-400'}`}
                              title="По центру"
                            >
                              <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateTextLayer(selectedTextLayer.id, { align: 'right' })}
                              className={`p-1.5 rounded-md cursor-pointer ${selectedTextLayer.align === 'right' ? 'bg-white text-black' : 'text-zinc-400'}`}
                              title="Выровнять справа"
                            >
                              <AlignRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateTextLayer(selectedTextLayer.id, { uppercase: !selectedTextLayer.uppercase })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                              selectedTextLayer.uppercase
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-950 text-zinc-300 border-white/10'
                            }`}
                          >
                            CAPS
                          </button>

                          <button
                            type="button"
                            onClick={() => updateTextLayer(selectedTextLayer.id, { boxBg: !selectedTextLayer.boxBg })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                              selectedTextLayer.boxBg
                                ? 'theme-bg-accent text-black border-transparent'
                                : 'bg-zinc-950 text-zinc-300 border-white/10'
                            }`}
                          >
                            Плашка
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'clean' as const, label: 'Без эффекта' },
                          { id: 'shadow' as const, label: 'Тень' },
                          { id: 'glow' as const, label: 'Свечение' },
                          { id: 'chromatic' as const, label: 'RGB-сдвиг' },
                          { id: 'outline' as const, label: 'Контур' }
                        ].map(ef => (
                          <button
                            key={ef.id}
                            type="button"
                            onClick={() => updateTextLayer(selectedTextLayer.id, { effect: ef.id })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                              selectedTextLayer.effect === ef.id
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-950 text-zinc-300 border-white/[0.08]'
                            }`}
                          >
                            {ef.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: VECTOR EMBLEMS */}
              {activeTab === 'decals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">Векторные эмблемы ({DECAL_OPTIONS.length} видов)</p>
                      <p className="text-xs text-zinc-400">
                        Добавляйте несколько эмблем, меняйте форму, стиль, цвет, угол и двигайте по холсту
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addDecalLayer('star4')}
                      className="px-3.5 py-2 rounded-xl theme-bg-accent text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Добавить эмблему</span>
                    </button>
                  </div>

                  {/* Active Decals List */}
                  {config.decals.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {config.decals.map((d, idx) => {
                        const label = DECAL_OPTIONS.find(o => o.id === d.type)?.label || d.type;
                        const active = selectedDecalLayer?.id === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDecalId(d.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                              active
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-900/70 text-zinc-200 border-white/10 hover:border-white/25'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ background: d.color }} />
                            <span>#{idx + 1} {label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Visual Grid to Pick Emblem Shape (Drawn directly, zero clutter) */}
                  <div>
                    <p className="text-xs font-bold text-zinc-300 mb-2">
                      {selectedDecalLayer
                        ? 'Нажмите на эмблему, чтобы сменить форму выбранной'
                        : 'Нажмите на любую эмблему, чтобы добавить её на обложку'}
                    </p>
                    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 gap-2">
                      {DECAL_OPTIONS.map(opt => (
                        <DecalMiniIcon
                          key={opt.id}
                          type={opt.id}
                          label={opt.label}
                          active={selectedDecalLayer?.type === opt.id}
                          onClick={() => {
                            if (selectedDecalLayer) updateDecalLayer(selectedDecalLayer.id, { type: opt.id });
                            else addDecalLayer(opt.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedDecalLayer && (
                    <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/55 border border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">Настройки выбранной эмблемы</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => duplicateDecalLayer(selectedDecalLayer)}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Дублировать</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDecalLayer(selectedDecalLayer.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-xs font-semibold text-red-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Удалить</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Цвет</label>
                          <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                            <input
                              type="color"
                              value={selectedDecalLayer.color}
                              onChange={e => updateDecalLayer(selectedDecalLayer.id, { color: e.target.value })}
                              className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-zinc-200">{selectedDecalLayer.color}</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs text-zinc-400 block mb-1">Стиль отрисовки</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'fill' as const, label: 'Заливка' },
                              { id: 'outline' as const, label: 'Контур' },
                              { id: 'glow' as const, label: 'Неон-свечение' }
                            ].map(st => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => updateDecalLayer(selectedDecalLayer.id, { style: st.id })}
                                className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                                  selectedDecalLayer.style === st.id
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-950 text-zinc-300 border-white/10'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Размер</span>
                            <span className="text-white font-semibold">{selectedDecalLayer.size}</span>
                          </div>
                          <input
                            type="range"
                            min={8}
                            max={640}
                            value={selectedDecalLayer.size}
                            onChange={e => updateDecalLayer(selectedDecalLayer.id, { size: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Поворот</span>
                            <span className="text-white font-semibold">{selectedDecalLayer.rotate}°</span>
                          </div>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            value={selectedDecalLayer.rotate}
                            onChange={e => updateDecalLayer(selectedDecalLayer.id, { rotate: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Прозр.</span>
                            <span className="text-white font-semibold">{selectedDecalLayer.opacity}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={selectedDecalLayer.opacity}
                            onChange={e => updateDecalLayer(selectedDecalLayer.id, { opacity: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>X</span>
                            <span className="text-white font-semibold">{selectedDecalLayer.x}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={selectedDecalLayer.x}
                            onChange={e => updateDecalLayer(selectedDecalLayer.id, { x: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                            <span>Y</span>
                            <span className="text-white font-semibold">{selectedDecalLayer.y}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={selectedDecalLayer.y}
                            onChange={e => updateDecalLayer(selectedDecalLayer.id, { y: Number(e.target.value) })}
                            className="w-full accent-white cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: DETAILS & FX */}
              {activeTab === 'details' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold text-zinc-300 mb-2">Штампы и маркировка</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { key: 'parentalAdvisory' as const, label: 'Parental Advisory' },
                        { key: 'barcodeStamp' as const, label: 'Штрих-код' },
                        { key: 'hiResStamp' as const, label: 'HI-RES 24/96' },
                        { key: 'cropMarks' as const, label: 'Метки реза' },
                        { key: 'hazardStripe' as const, label: 'Полоса снизу' }
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => update(item.key, !config[item.key])}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between cursor-pointer ${
                            config[item.key]
                              ? 'bg-white text-black border-white font-bold'
                              : 'bg-zinc-900/70 text-zinc-300 border-white/[0.08]'
                          }`}
                        >
                          <span>{item.label}</span>
                          {config[item.key] && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>

                    {config.parentalAdvisory && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-xs text-zinc-400">Размер:</span>
                        {([['S', 0.78], ['M', 1], ['L', 1.28], ['XL', 1.6]] as Array<[string, number]>).map(([l, v]) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => update('parentalScale' as any, v as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                              (config.parentalScale || 1) === v ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-white/10'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    )}
                    {config.parentalAdvisory && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-xs text-zinc-400">Угол Parental Advisory:</span>
                        {(['br', 'bl', 'tr', 'tl'] as CoverStampCorner[]).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => update('parentalCorner', c)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                              config.parentalCorner === c
                                ? 'bg-white text-black'
                                : 'bg-zinc-900 text-zinc-400 border border-white/10'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Hype Sticker */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
                    <p className="text-xs font-bold text-zinc-300">Хайп-стикер (в углу обложки)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={config.stickerText}
                        onChange={e => update('stickerText', e.target.value)}
                        placeholder="DELUXE / NEW..."
                        className="px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none"
                      />
                      <div className="flex gap-1">
                        {(['circle', 'starburst', 'pill', 'tape'] as CoverStickerShape[]).map(sh => (
                          <button
                            key={sh}
                            type="button"
                            onClick={() => update('stickerShape', sh)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              config.stickerShape === sh ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-400'
                            }`}
                          >
                            {sh === 'circle' ? 'Круг' : sh === 'starburst' ? 'Взрыв' : sh === 'pill' ? 'Капсула' : 'Скотч'}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                        <input
                          type="color"
                          value={config.stickerColor}
                          onChange={e => update('stickerColor', e.target.value)}
                          className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-zinc-300">{config.stickerColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Frame */}
                  <div>
                    <p className="text-xs font-bold text-zinc-300 mb-2">Рамка обложки</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[
                        { id: 'none' as const, label: 'Нет' },
                        { id: 'thin' as const, label: 'Тонкая' },
                        { id: 'double' as const, label: 'Двойная' },
                        { id: 'sleeve' as const, label: 'Конверт' },
                        { id: 'polaroid' as const, label: 'Polaroid' },
                        { id: 'film_strip' as const, label: 'Киноплёнка' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => update('frame', f.id)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                            config.frame === f.id
                              ? 'bg-white text-black border-white'
                              : 'bg-zinc-900/70 text-zinc-300 border-white/[0.08]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Texture Sliders */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                        <span>Плёночное зерно</span>
                        <span className="text-white font-semibold">{config.grain}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={85}
                        value={config.grain}
                        onChange={e => update('grain', Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                        <span>Виньетка</span>
                        <span className="text-white font-semibold">{config.vignette}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={90}
                        value={config.vignette}
                        onChange={e => update('vignette', Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                        <span>VHS-строки</span>
                        <span className="text-white font-semibold">{config.scanlines}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        value={config.scanlines}
                        onChange={e => update('scanlines', Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1 tabular-nums">
                        <span>Глитч</span>
                        <span className="text-white font-semibold">{config.glitch}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={90}
                        value={config.glitch}
                        onChange={e => update('glitch', Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] bg-zinc-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Layers className="w-4 h-4 theme-accent" />
            <span className="tabular-nums">1000 × 1000 PNG</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-zinc-200 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleApplyCover}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl theme-bg-accent text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Сохранение...' : 'Применить обложку'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
