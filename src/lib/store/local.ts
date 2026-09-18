import { defaultProgress, type Progress, type ProgressStore } from './types';

export const STORAGE_KEY = 'snn.progress.v1';

/** 저장된 값이 옛 스키마면 여기서 올린다. 지금은 v1 하나뿐이다. */
export function migrate(raw: unknown): Progress {
  const base = defaultProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Progress>;
  if (r.schemaVersion !== 1) return base;
  return { ...base, ...r, settings: { ...base.settings, ...(r.settings ?? {}) } };
}

export class LocalProgressStore implements ProgressStore {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> = globalThis.localStorage) {}

  async load(): Promise<Progress> {
    try {
      const text = this.storage.getItem(STORAGE_KEY);
      return migrate(text ? JSON.parse(text) : null);
    } catch {
      return defaultProgress();
    }
  }

  async save(p: Progress): Promise<void> {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // 사생활 보호 모드 등에서 저장이 막히면 조용히 넘어간다. 화면은 메모리 상태로 계속 동작한다.
    }
  }
}
