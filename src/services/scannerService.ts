import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHintALLOption,
} from '@capacitor/barcode-scanner';

export type ScanOutcome =
  | { state: 'cancelled' }
  | { state: 'ok'; raw: string; value: string };

const normalizeValue = (raw: string): string => {
  const initial = raw
    .replaceAll('\u0000', '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return initial;
};

export async function scanBarcode(): Promise<ScanOutcome> {
  const result = await CapacitorBarcodeScanner.scanBarcode({
    hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
    scanInstructions: 'Apunta la cámara hacia un código QR o de barras',
    scanButton: false,
    cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
    scanOrientation: CapacitorBarcodeScannerScanOrientation.PORTRAIT,
  });

  const raw = (result?.ScanResult ?? '').toString();
  const value = normalizeValue(raw);

  if (!value) return { state: 'cancelled' };
  return { state: 'ok', raw, value };
}

