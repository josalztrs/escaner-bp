import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonText,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { scanOutline, searchOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { addRecord, ScanRecord, ScanStatus } from '../services/scanHistoryStore';
import {
  ApiError,
  type ApiErrorInfo,
  EquipoResponse,
  buscarEquipoPorSN,
  escanearYBuscarEquipo,
  obtenerDeptos,
} from '../services/Escaner';
import EquipoResultCard from '../components/EquipoResultCard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const normalize = (s: string) => s.trim().toLocaleLowerCase();

/* ── Helpers para extraer metadata del equipo ── */

const resolveFlat = (raw: EquipoResponse): Record<string, unknown> => {
  let obj: unknown = raw;
  if (Array.isArray(obj)) obj = obj[0] ?? {};
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    for (const wk of ['data', 'equipo', 'result', 'record', 'item']) {
      const inner = record[wk];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        return inner as Record<string, unknown>;
      }
      if (Array.isArray(inner) && inner.length > 0) {
        return (inner[0] ?? {}) as Record<string, unknown>;
      }
    }
    return record;
  }
  return {};
};

const str = (data: Record<string, unknown>, key: string): string | undefined => {
  const val = data[key];
  return val == null || val === '' ? undefined : String(val);
};

const extractApiErrorMessage = (info: ApiErrorInfo): string => {
  const b = info.responseBody;
  if (b && typeof b === 'object' && !Array.isArray(b)) {
    const o = b as Record<string, unknown>;
    if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();
    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
  }
  return info.message;
};

/** Determina el status y extrae campos relevantes de la respuesta del equipo */
const buildRecordMeta = (
  equipo: EquipoResponse,
  sn: string,
  loc: string,
  opts?: { raw?: string },
): Omit<ScanRecord, 'id'> => {
  const flat = resolveFlat(equipo);
  const isError = flat['error'] === true || flat['error'] === 'true';
  const rawMsg = String(flat['message'] ?? flat['msg'] ?? '');
  const msg = rawMsg.toLowerCase();

  let status: ScanStatus = 'found';
  let message: string | undefined;

  if (isError) {
    if (
      msg.includes('sin asignación') ||
      msg.includes('sin asignacion') ||
      msg.includes('sin asignaci')
    ) {
      status = 'no-assignment';
      message = rawMsg || 'Equipo tecnológico sin asignación vigente.';
    } else if (
      msg.includes('no está registrado') ||
      msg.includes('no esta registrado') ||
      msg.includes('no registrado') ||
      msg.includes('no encontrado') ||
      msg.includes('inventario')
    ) {
      status = 'not-found';
      message = rawMsg || 'El bien no está registrado o no fue encontrado.';
    } else {
      status = 'not-found';
      message = rawMsg || 'No se pudo obtener información del bien.';
    }
  }

  return {
    location: loc,
    value: sn,
    raw: opts?.raw,
    createdAt: new Date().toISOString(),
    status,
    equipoName: str(flat, 'TRAB_NOM'),
    marca: str(flat, 'MARCA'),
    modelo: str(flat, 'MODELO'),
    categoria: str(flat, 'CATEG_BIEN'),
    depto: str(flat, 'DEPTO'),
    estado: str(flat, 'ESTADO'),
    cargo: str(flat, 'TRAB_CARGO'),
    division: str(flat, 'TRAB_DIV'),
    descripcion: str(flat, 'DESCRIPCION'),
    claseBien: str(flat, 'CLASE_BIEN'),
    propietario: str(flat, 'PROPIETARIO'),
    message,
  };
};

const ScanTab: React.FC = () => {
  const [location, setLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingDeptos, setIsLoadingDeptos] = useState(false);
  const [deptos, setDeptos] = useState<string[]>([]);
  const [deptosError, setDeptosError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<ScanRecord | null>(null);
  const [lastSavedVisible, setLastSavedVisible] = useState(true);
  const [scannedSN, setScannedSN] = useState<string | null>(null);
  const [equipoData, setEquipoData] = useState<EquipoResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualSN, setManualSN] = useState('');

  const searchbarRef = useRef<HTMLIonSearchbarElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const toLabel = (row: Record<string, unknown>): string => {
      const candidate =
        (typeof row.UNIDAD === 'string' && row.UNIDAD) ||
        (typeof row.Unidad === 'string' && row.Unidad) ||
        (typeof row.unidad === 'string' && row.unidad) ||
        (typeof row.DEPTO === 'string' && row.DEPTO) ||
        (typeof row.depto === 'string' && row.depto) ||
        '';
      return candidate.trim();
    };

    const load = async () => {
      setIsLoadingDeptos(true);
      setDeptosError(null);
      try {
        const rows = await obtenerDeptos();
        if (cancelled) return;

        const labels = rows
          .map((r) => toLabel(r))
          .filter((s) => s.length > 0);

        const uniqueSorted = Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b, 'es'));
        setDeptos(uniqueSorted);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar los departamentos';
        setDeptos([]);
        setDeptosError(msg);
      } finally {
        if (!cancelled) setIsLoadingDeptos(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isValidLocation = useMemo(() => {
    const n = normalize(location);
    return deptos.some((d) => normalize(d) === n);
  }, [location, deptos]);

  const suggestions = useMemo(() => {
    const q = normalize(location);
    if (!q) return [];
    return deptos.filter((d) => normalize(d).includes(q));
  }, [location, deptos]);

  const pickLocation = async (value: string) => {
    setLocation(value);
    setShowSuggestions(false);
    await searchbarRef.current?.setFocus();
  };

  const handleScan = async () => {
    if (!isValidLocation || isScanning) return;
    setIsScanning(true);
    setLastSavedVisible(false); // fade-out de la card anterior
    setErrorMsg(null);
    setEquipoData(null);
    setScannedSN(null);

    try {
      if (Capacitor.getPlatform() === 'web') {
        setErrorMsg('El escáner no está disponible en el navegador. Ejecuta en Android/iOS (Capacitor).');
        return;
      }
      const result = await escanearYBuscarEquipo(location.trim());
      if (!result){
        Haptics.impact({style: ImpactStyle.Light})
        return;
      } // cancelado

      setScannedSN(result.serialNumber);
      setEquipoData(result.equipo);

      const meta = buildRecordMeta(result.equipo, result.serialNumber, location.trim(), { raw: result.raw });
      const saved = await addRecord(meta);
      setLastSaved(saved);
      setLastSavedVisible(true);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.info.status === 404) {
          const saved = await addRecord({
            location: location.trim(),
            value: error.info.serialNumber,
            createdAt: new Date().toISOString(),
            status: 'not-found',
            message: extractApiErrorMessage(error.info),
            httpStatus: 404,
          });
          setLastSaved(saved);
          setLastSavedVisible(true);
        }
        Haptics.notification({type: NotificationType.Error});
        setErrorMsg(`${error.message} (HTTP ${error.info.status})\n${error.info.url}\nSN="${error.info.serialNumber}"`);
        return;
      }
      Haptics.notification({type: NotificationType.Error});
      const message = error instanceof Error ? error.message : 'Error desconocido al escanear';
      setErrorMsg(message);
    } finally {
      Haptics.notification({type: NotificationType.Success});
      setIsScanning(false);
    }
  };

  const handleManualSearch = async () => {
    const sn = manualSN.trim();
    if (!sn || !isValidLocation || isScanning) return;
    setIsScanning(true);
    setLastSavedVisible(false); // fade-out de la card anterior
    setErrorMsg(null);
    setEquipoData(null);
    setScannedSN(null);

    try {
      const equipo = await buscarEquipoPorSN(sn, location.trim());
      setScannedSN(sn);
      setEquipoData(equipo);

      const meta = buildRecordMeta(equipo, sn, location.trim());
      const saved = await addRecord(meta);
      setLastSaved(saved);
      setLastSavedVisible(true);
      setManualSN('');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.info.status === 404) {
          const saved = await addRecord({
            location: location.trim(),
            value: error.info.serialNumber || sn,
            createdAt: new Date().toISOString(),
            status: 'not-found',
            message: extractApiErrorMessage(error.info),
            httpStatus: 404,
          });
          setLastSaved(saved);
          setLastSavedVisible(true);
        }
        setErrorMsg(`${error.message} (HTTP ${error.info.status})\n${error.info.url}\nSN="${error.info.serialNumber}"`);
        return;
      }
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setErrorMsg(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = () => {
    setEquipoData(null);
    setScannedSN(null);
    setErrorMsg(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Escaneo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard className="glass-card">
          <IonCardHeader>
            <IonCardTitle>Ubicación / Departamento</IonCardTitle>
            <IonCardSubtitle>Selecciona una ubicación válida para habilitar el escáner</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <IonSearchbar
              ref={(el) => {
                searchbarRef.current = el;
              }}
              value={location}
              placeholder={isLoadingDeptos ? 'Cargando departamentos...' : 'Busca y selecciona un departamento'}
              onIonInput={(e) => {
                setLocation(e.detail.value ?? '');
                setShowSuggestions(true);
              }}
              onIonFocus={() => setShowSuggestions(true)}
              onIonBlur={() => {
                // pequeño delay para permitir click en sugerencia
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              debounce={0}
              inputmode="search"
              showClearButton="focus"
            />

            {deptosError && (
              <IonNote color="danger">
                No se pudieron cargar los departamentos desde la API. {deptosError}
              </IonNote>
            )}

            {isLoadingDeptos && (
              <IonNote>
                <IonSpinner name="crescent" className="ion-margin-end" />
                Cargando departamentos...
              </IonNote>
            )}

            {!isValidLocation && location.trim().length > 0 && (
              <IonNote color="danger">Ubicación no válida. Debe coincidir con la lista.</IonNote>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <IonList inset style={{ marginTop: 8 }}>
                {suggestions.map((d) => (
                  <IonItem
                    key={d}
                    button
                    onClick={() => {
                      void pickLocation(d);
                    }}
                  >
                    <IonLabel>{d}</IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          className="premium-button"
          onClick={() => void handleScan()}
          disabled={!isValidLocation || isScanning}
        >
          {isScanning ? (
            <>
              <IonSpinner name="crescent" className="ion-margin-end" />
              Escaneando...
            </>
          ) : (
            <>
              <IonIcon icon={scanOutline} slot="start" />
              Iniciar escaneo
            </>
          )}
        </IonButton>

        {/* Búsqueda manual por S/N */}
        <IonCard className="ion-margin-top">
          <IonCardHeader>
            <IonCardSubtitle>Búsqueda manual</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" className="search-container">
              <IonInput
                value={manualSN}
                placeholder="Escribe el serial del equipo"
                onIonInput={(e) => setManualSN(e.detail.value ?? '')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleManualSearch();
                }}
                clearInput
              />
            </IonItem>
            <IonButton
              expand="block"
              className="premium-button"
              onClick={() => void handleManualSearch()}
              disabled={!isValidLocation || isScanning || !manualSN.trim()}
            >
              {isScanning ? (
                <>
                  <IonSpinner name="crescent" className="ion-margin-end" />
                  Buscando...
                </>
              ) : (
                <>
                  <IonIcon icon={searchOutline} slot="start" />
                  Buscar por serial
                </>
              )}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {lastSaved && (
          <IonCard
            className="glass-card ion-margin-top fade-in-up"
            style={{
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              opacity: lastSavedVisible ? 1 : 0,
              transform: lastSavedVisible ? 'translateY(0)' : 'translateY(-12px)',
              pointerEvents: lastSavedVisible ? 'auto' : 'none',
            }}
          >
            <IonCardHeader>
              <IonCardSubtitle>Último registro guardado</IonCardSubtitle>
              <IonCardTitle color="primary" style={{ fontWeight: 800 }}>{lastSaved.value}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem lines="none">
                <IonLabel className="ion-text-wrap">
                  <h3>Dpto. escaneo</h3>
                  <p>{lastSaved.location}</p>
                </IonLabel>
              </IonItem>
              {lastSaved.depto && (
                <IonItem lines="none">
                  <IonLabel className="ion-text-wrap">
                    <h3>Dpto. asignación</h3>
                    <p>{lastSaved.depto}</p>
                  </IonLabel>
                </IonItem>
              )}
              {lastSaved.equipoName && (
                <IonItem lines="none">
                  <IonLabel className="ion-text-wrap">
                    <h3>Responsable</h3>
                    <p>{lastSaved.equipoName}</p>
                  </IonLabel>
                </IonItem>
              )}
              {(lastSaved.marca || lastSaved.modelo) && (
                <IonItem lines="none">
                  <IonLabel className="ion-text-wrap">
                    <h3>Marca / modelo</h3>
                    <p>
                      {[lastSaved.marca, lastSaved.modelo].filter(Boolean).join(' · ')}
                    </p>
                  </IonLabel>
                </IonItem>
              )}
              {lastSaved.message && (
                <IonItem lines="none">
                  <IonLabel className="ion-text-wrap">
                    <h3>Nota</h3>
                    <p>{lastSaved.message}</p>
                  </IonLabel>
                </IonItem>
              )}
              <IonItem lines="none">
                <IonLabel className="ion-text-wrap">
                  <h3>Fecha</h3>
                  <p>{new Date(lastSaved.createdAt).toLocaleString()}</p>
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {/* Resultado del equipo escaneado */}
        {equipoData && scannedSN && (
          <div className="fade-in-up">
            <EquipoResultCard
              resultado={equipoData}
              serialNumber={scannedSN}
              onClear={handleClear}
            />
          </div>
        )}

        {errorMsg && (
          <IonCard color="danger" className="ion-margin-top" style={{ marginInline: 0 }}>
            <IonCardContent>
              <IonText>
                <h3 style={{ marginTop: 0 }}>Error al obtener datos</h3>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{errorMsg}</pre>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ScanTab;


