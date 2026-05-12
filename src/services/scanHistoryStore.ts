import { Preferences } from '@capacitor/preferences';

export type ScanStatus = 'found' | 'not-found' | 'no-assignment';

export interface ScanRecord {
  id: string;
  location: string;
  value: string;
  raw?: string;
  createdAt: string; // ISO
  /** Estado del resultado del escaneo */
  status?: ScanStatus;
  /** Nombre del responsable (TRAB_NOM) */
  equipoName?: string;
  /** Marca del equipo */
  marca?: string;
  /** Modelo del equipo */
  modelo?: string;
  /** Categoría del bien */
  categoria?: string;
  /** Departamento del responsable */
  depto?: string;
  /** Estado del equipo (ESTADO) */
  estado?: string;
  /** Cargo del responsable (TRAB_CARGO) */
  cargo?: string;
  /** División (TRAB_DIV) */
  division?: string;
  /** Descripción del bien (DESCRIPCION) */
  descripcion?: string;
  /** Clase / grupo del bien (CLASE_BIEN) */
  claseBien?: string;
  /** Fecha de asignación (F_ASIG) */
  propietario?: string;
  /** Código HTTP cuando falló la petición (p. ej. 404) */
  httpStatus?: number;
  /** Mensaje de error para not-found / no-assignment */
  message?: string;
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

