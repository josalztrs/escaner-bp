import { Preferences } from '@capacitor/preferences';

export interface ScanRecord {
  id: string;
  location: string;
  value: string;
  raw?: string;
  createdAt: string; // ISO
}

const KEY = 'scan_history_v1';

const safeParse = (value: string | null): unknown => {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

export async function listRecords(): Promise<ScanRecord[]> {
  const { value } = await Preferences.get({ key: KEY });
  const parsed = safeParse(value);
  if (!Array.isArray(parsed)) return [];
  return parsed as ScanRecord[];
}

export async function addRecord(record: Omit<ScanRecord, 'id'>): Promise<ScanRecord> {
  const existing = await listRecords();
  const makeId = () => {
    const c = globalThis.crypto as Crypto | undefined;
    if (c && 'randomUUID' in c && typeof c.randomUUID === 'function') return c.randomUUID();
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };
  const next: ScanRecord = {
    id: makeId(),
    ...record,
  };
  await Preferences.set({ key: KEY, value: JSON.stringify([next, ...existing]) });
  return next;
}

export async function clearRecords(): Promise<void> {
  await Preferences.remove({ key: KEY });
}

