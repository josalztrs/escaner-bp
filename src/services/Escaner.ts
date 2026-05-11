import { CapacitorHttp } from '@capacitor/core';
import {
    CapacitorBarcodeScanner,
    CapacitorBarcodeScannerTypeHintALLOption,
    CapacitorBarcodeScannerCameraDirection,
    CapacitorBarcodeScannerScanOrientation,
} from '@capacitor/barcode-scanner';
import { Preferences } from '@capacitor/preferences';

/** URL base de la API de equipos */
const API_BASE_URL = 'http://10.60.20.5:8014/api/v1/equipo';
const AUTH_TOKEN_KEY = 'auth_token';

export type ScanState = 'cancelled' | 'ok';

export type ScanResult =
    | { state: 'cancelled' }
    | { state: 'ok'; raw: string; serialNumber: string };

const normalizeSerialNumber = (raw: string): string => {
    // Algunos QR/barcodes codifican:
    // - El SN "puro"
    // - Un texto con prefijo (SN:, S/N:, SERIAL:)
    // - Un JSON ({"sn":"..."})
    // - Una URL (https://.../equipo/<sn> o ...?sn=<sn>)
    const initial = raw
        .replaceAll('\u0000', '')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!initial) return '';

    // JSON
    if (initial.startsWith('{') || initial.startsWith('[')) {
        try {
            const parsed = JSON.parse(initial) as unknown;
            if (parsed && typeof parsed === 'object') {
                const obj = parsed as Record<string, unknown>;
                const candidate =
                    (typeof obj.sn === 'string' && obj.sn) ||
                    (typeof obj.serialNumber === 'string' && obj.serialNumber) ||
                    (typeof obj.serial === 'string' && obj.serial) ||
                    '';
                if (candidate) return normalizeSerialNumber(candidate);
            }
        } catch {
            // ignore
        }
    }

    // URL
    if (/^https?:\/\//i.test(initial)) {
        try {
            const u = new URL(initial);
            const q =
                u.searchParams.get('sn') ||
                u.searchParams.get('serial') ||
                u.searchParams.get('serialNumber');
            if (q) return normalizeSerialNumber(q);

            const last = u.pathname.split('/').filter(Boolean).at(-1) ?? '';
            if (last) return normalizeSerialNumber(last);
        } catch {
            // ignore
        }
    }

    // Prefijos comunes
    return initial.replace(/^(s\/n|sn|serial|serial\s*number)\s*[:=]\s*/i, '').trim();
};

const buildEquipoUrl = (serialNumber: string, deptoscan?: string): string => {
    const base = `${API_BASE_URL}/${encodeURIComponent(serialNumber)}`;
    if (!deptoscan) return base;

    const u = new URL(base);
    u.searchParams.set('deptoscan', deptoscan);
    return u.toString();
};

/**
 * Obtiene el token JWT almacenado en Preferences.
 * @returns El token JWT o null si no existe.
 */
const getAuthToken = async (): Promise<string | null> => {
    const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
    return value;
};

/**
 * Interfaz que representa la respuesta del equipo obtenida de la API.
 * Puedes ampliarla según los campos reales de tu backend.
 */
export interface EquipoResponse {
    [key: string]: unknown;
}

export interface ApiErrorInfo {
    status: number;
    message: string;
    url: string;
    serialNumber: string;
    responseBody?: unknown;
}

export class ApiError extends Error {
    readonly info: ApiErrorInfo;

    constructor(info: ApiErrorInfo) {
        super(info.message);
        this.name = 'ApiError';
        this.info = info;
    }
}

/**
 * Resultado completo de un escaneo exitoso con la data del equipo.
 */
export interface ScanEquipoResult {
    serialNumber: string;
    equipo: EquipoResponse;
}

const parseMaybeJson = (value: unknown): unknown => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (trimmed === '') return value;

    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
};

/**
 * Inicia el escáner de códigos de barras / QR usando el plugin oficial
 * de Capacitor y devuelve el valor escaneado.
 *
 * @returns El string contenido en el código escaneado, o null si se canceló.
 */
export const iniciarEscaneo = async (): Promise<string | null> => {
    const scan = await iniciarEscaneoDetallado();
    return scan.state === 'ok' ? scan.serialNumber : null;
};

/**
 * Variante detallada que devuelve también el valor crudo y el SN normalizado.
 */
export const iniciarEscaneoDetallado = async (): Promise<ScanResult> => {
    try {
        const result = await CapacitorBarcodeScanner.scanBarcode({
            hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
            scanInstructions: 'Apunta la cámara hacia un código QR o de barras',
            scanButton: false,
            cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
            scanOrientation: CapacitorBarcodeScannerScanOrientation.PORTRAIT,
        });

        const raw = (result?.ScanResult ?? '').toString();
        const normalized = normalizeSerialNumber(raw);

        if (!normalized) return { state: 'cancelled' };
        return { state: 'ok', raw, serialNumber: normalized };
    } catch (error) {
        console.error('Error al escanear:', error);
        throw error;
    }
};

/**
 * Consulta la API de equipos usando el serial number obtenido del escáner.
 *
 * @param serialNumber - El valor obtenido del código escaneado (serial number del equipo).
 * @returns Los datos del equipo desde la API.
 * @throws Error si la petición falla o el equipo no es encontrado.
 */
export const buscarEquipoPorSN = async (serialNumber: string, deptoscan?: string): Promise<EquipoResponse> => {
    const normalizedSN = normalizeSerialNumber(serialNumber);
    const url = buildEquipoUrl(normalizedSN, deptoscan?.trim());

    try {
        const token = await getAuthToken();
        const headers: Record<string, string> = {
            Accept: 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await CapacitorHttp.request({
            method: 'GET',
            url,
            headers,
        });

        const data = parseMaybeJson(response.data);

        if (response.status >= 200 && response.status < 300) {
            return data as EquipoResponse;
        }

        if (response.status === 404) {
            throw new ApiError({
                status: 404,
                message: `Equipo con S/N "${normalizedSN}" no encontrado.`,
                url,
                serialNumber: normalizedSN,
                responseBody: data,
            });
        }

        if (response.status === 401 || response.status === 403) {
            throw new ApiError({
                status: response.status,
                message: 'No autorizado. Inicia sesión nuevamente.',
                url,
                serialNumber: normalizedSN,
                responseBody: data,
            });
        }

        throw new ApiError({
            status: response.status,
            message: `Error del servidor: ${response.status}`,
            url,
            serialNumber: normalizedSN,
            responseBody: data,
        });
    } catch (error) {
        console.error('Error al buscar equipo:', error);
        throw error;
    }
};

export type UbicacionRow = Record<string, unknown>;

export const obtenerDeptos = async (): Promise<UbicacionRow[]> => {
    const url = `${API_BASE_URL}/deptos`;

    try {
        const token = await getAuthToken();
        const headers: Record<string, string> = {
            Accept: 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await CapacitorHttp.request({
            method: 'GET',
            url,
            headers,
        });

        const data = parseMaybeJson(response.data);

        if (response.status >= 200 && response.status < 300) {
            return Array.isArray(data) ? (data as UbicacionRow[]) : [];
        }

        if (response.status === 401 || response.status === 403) {
            throw new ApiError({
                status: response.status,
                message: 'No autorizado. Inicia sesión nuevamente.',
                url,
                serialNumber: '',
                responseBody: data,
            });
        }

        throw new ApiError({
            status: response.status,
            message: `Error del servidor: ${response.status}`,
            url,
            serialNumber: '',
            responseBody: data,
        });
    } catch (error) {
        console.error('Error al obtener deptos:', error);
        throw error;
    }
};

/**
 * Flujo completo: escanear un código y luego buscar el equipo en la API.
 *
 * @returns El resultado con el serial number y los datos del equipo, o null si se canceló el escaneo.
 */
export const escanearYBuscarEquipo = async (deptoscan?: string): Promise<ScanEquipoResult | null> => {
    const scan = await iniciarEscaneoDetallado();
    if (scan.state !== 'ok') return null;

    return {
        serialNumber: scan.serialNumber,
        equipo: await buscarEquipoPorSN(scan.serialNumber, deptoscan),
    };
};
