export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  serif: boolean;
}

const KEY = "zhiyu-reader-settings";

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16.5,
  lineHeight: 2.1,
  serif: true,
};

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ReaderSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: ReaderSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
