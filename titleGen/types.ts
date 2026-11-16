// Track title generator v2: shared types
export type ThemeId =
  | 'fashion' | 'status' | 'relations' | 'vibe' | 'sad' | 'numbers' | 'cars_weapons'
  | 'body_dark' | 'mystic' | 'aesthetics' | 'absurd' | 'conceptual' | 'rap' | 'trap'
  | 'real_talk' | 'celebs' | 'slang' | 'digital' | 'punch';

/** Weighted pattern: placeholders {key} are filled from LangBank.lists[key]. */
export type Pattern = [template: string, weight: number];

export interface LangBank {
  lists: Record<string, string[]>;
  themes: Record<ThemeId, Pattern[]>;
  /** rare numeric tails, e.g. "x3", "99" */
  sprinkle: string[];
  albumTags: string[];
}
