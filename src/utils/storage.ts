import { ProgressData, DEFAULT_PROGRESS } from '../types/progress';

const STORAGE_KEY = 'giqbank_progress';

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const data = JSON.parse(raw);
    if (data.version === 1) return data;
    return { ...DEFAULT_PROGRESS };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(data: ProgressData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
