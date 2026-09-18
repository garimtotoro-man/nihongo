import type { GameMode, GameResult, Level } from '../engine/types';

export type KanaTouchSettings = {
  hints: boolean; // 5초 헤매면 정답 타일 발광(+3초)
};

export const DEFAULT_SETTINGS: KanaTouchSettings = { hints: true };

/** 1차 localStorage, 뒤에 서버. 화면은 이 인터페이스만 본다. */
export interface StorageAdapter {
  getBestRecord(mode: GameMode, level: Level): Promise<number | null>;
  saveResult(result: GameResult): Promise<void>;
  getWeakWeights(): Promise<Record<string, number>>;
  updateWeakWeights(delta: Record<string, number>): Promise<void>;
  /** 최근 판(최신순, 최대 50). 약점 가중치의 "연속 무오답" 판정에 쓴다. */
  getHistory(): Promise<GameResult[]>;
  getSettings(): Promise<KanaTouchSettings>;
  saveSettings(s: KanaTouchSettings): Promise<void>;
}
