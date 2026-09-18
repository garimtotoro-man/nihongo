import type { Level, PackId } from '@/lib/content';

export type DayStat = { seen: number; revealed: number; quizCorrect: number; quizTotal: number };

export type Progress = {
  schemaVersion: 1;
  onboarded: boolean;
  level: Level;
  activePacks: PackId[];
  liked: string[];
  saved: string[];
  seen: Record<string, number>;
  recent: string[];
  daily: Record<string, DayStat>;
  settings: { dailyGoal: number; ttsRate: number; voiceURI?: string };
};

export const RECENT_LIMIT = 100;

export interface ProgressStore {
  load(): Promise<Progress>;
  save(p: Progress): Promise<void>;
}

export function defaultProgress(): Progress {
  return {
    schemaVersion: 1,
    onboarded: false,
    level: 'N5',
    activePacks: ['travel'],
    liked: [],
    saved: [],
    seen: {},
    recent: [],
    daily: {},
    settings: { dailyGoal: 20, ttsRate: 0.9 },
  };
}

export function emptyDay(): DayStat {
  return { seen: 0, revealed: 0, quizCorrect: 0, quizTotal: 0 };
}
