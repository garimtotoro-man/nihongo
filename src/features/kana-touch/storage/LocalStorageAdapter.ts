import { applyDelta } from '../engine/weakQueue';
import type { GameMode, GameResult, Level } from '../engine/types';
import { DEFAULT_SETTINGS, type KanaTouchSettings, type StorageAdapter } from './StorageAdapter';

export const KEYS = {
  best: (mode: GameMode, level: Level) => `kanaTouch:best:${mode}:${level}`,
  weak: 'kanaTouch:weak',
  history: 'kanaTouch:history',
  settings: 'kanaTouch:settings',
};

export const HISTORY_LIMIT = 50;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly storage: StorageLike = globalThis.localStorage) {}

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = this.storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장이 막힌 환경(사생활 보호 모드 등)에서는 조용히 넘어간다.
    }
  }

  async getBestRecord(mode: GameMode, level: Level): Promise<number | null> {
    return this.read<number | null>(KEYS.best(mode, level), null);
  }

  async saveResult(result: GameResult): Promise<void> {
    const best = await this.getBestRecord(result.mode, result.level);
    if (best === null || result.totalMs < best) this.write(KEYS.best(result.mode, result.level), result.totalMs);
    const history = await this.getHistory();
    this.write(KEYS.history, [result, ...history].slice(0, HISTORY_LIMIT));
  }

  async getWeakWeights(): Promise<Record<string, number>> {
    return this.read<Record<string, number>>(KEYS.weak, {});
  }

  async updateWeakWeights(delta: Record<string, number>): Promise<void> {
    this.write(KEYS.weak, applyDelta(await this.getWeakWeights(), delta));
  }

  async getHistory(): Promise<GameResult[]> {
    return this.read<GameResult[]>(KEYS.history, []);
  }

  async getSettings(): Promise<KanaTouchSettings> {
    return { ...DEFAULT_SETTINGS, ...this.read<Partial<KanaTouchSettings>>(KEYS.settings, {}) };
  }

  async saveSettings(s: KanaTouchSettings): Promise<void> {
    this.write(KEYS.settings, s);
  }
}
