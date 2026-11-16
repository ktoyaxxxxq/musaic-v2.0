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
  { id: 'Space Mono', label: 'Space Mono', tag: 'Ретро' }
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

const PA_IMAGE_SRC = '/assets/aistudio/image_764ed5a7.png';
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
    const bw = 192 * s;
    const paAspect =
      cachedPaImage && cachedPaImage.complete && cachedPaImage.naturalWidth > 0
        ? cachedPaImage.naturalHeight / cachedPaImage.naturalWidth
        : 114 / 188;
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
    const activeFonts = Array.from(new Set(config.textLayers.map(l => l.fontFamily)));
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
