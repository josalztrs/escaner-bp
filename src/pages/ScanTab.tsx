import { useMemo, useRef, useState } from 'react';
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
import { scanOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { addRecord, ScanRecord } from '../services/scanHistoryStore';
import { ApiError, EquipoResponse, escanearYBuscarEquipo } from '../services/Escaner';

const DEPARTAMENTOS = ['Almacén', 'Oficina A', 'Sistemas'] as const;

const normalize = (s: string) => s.trim().toLocaleLowerCase();

const ScanTab: React.FC = () => {
  const [location, setLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSaved, setLastSaved] = useState<ScanRecord | null>(null);
  const [scannedSN, setScannedSN] = useState<string | null>(null);
  const [equipoData, setEquipoData] = useState<EquipoResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchbarRef = useRef<HTMLIonSearchbarElement | null>(null);

  const isValidLocation = useMemo(() => {
    const n = normalize(location);
    return DEPARTAMENTOS.some((d) => normalize(d) === n);
  }, [location]);

  const suggestions = useMemo(() => {
    const q = normalize(location);
    if (!q) return [];
    return DEPARTAMENTOS.filter((d) => normalize(d).includes(q));
  }, [location]);

  const pickLocation = async (value: string) => {
    setLocation(value);
    setShowSuggestions(false);
    await searchbarRef.current?.setFocus();
  };

  const handleScan = async () => {
    if (!isValidLocation || isScanning) return;
    setIsScanning(true);
    setErrorMsg(null);
    setEquipoData(null);
    setScannedSN(null);

    try {
      if (Capacitor.getPlatform() === 'web') {
        setErrorMsg('El escáner no está disponible en el navegador. Ejecuta en Android/iOS (Capacitor).');
        return;
      }
      const result = await escanearYBuscarEquipo();
      if (!result) return; // cancelado

      setScannedSN(result.serialNumber);
      setEquipoData(result.equipo);

      const saved = await addRecord({
        location: location.trim(),
        value: result.serialNumber,
        createdAt: new Date().toISOString(),
      });
      setLastSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMsg(`${error.message} (HTTP ${error.info.status})\n${error.info.url}\nSN="${error.info.serialNumber}"`);
        return;
      }
      const message = error instanceof Error ? error.message : 'Error desconocido al escanear';
      setErrorMsg(message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Escaneo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard style={{ marginInline: 0 }}>
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
              placeholder="Ej: Almacén, Oficina A, Sistemas"
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
          size="large"
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

        {lastSaved && (
          <IonCard className="ion-margin-top" style={{ marginInline: 0 }}>
            <IonCardHeader>
              <IonCardSubtitle>Último registro guardado</IonCardSubtitle>
              <IonCardTitle>{lastSaved.value}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem lines="none">
                <IonLabel className="ion-text-wrap">
                  <h3>Ubicación</h3>
                  <p>{lastSaved.location}</p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel className="ion-text-wrap">
                  <h3>Fecha</h3>
                  <p>{new Date(lastSaved.createdAt).toLocaleString()}</p>
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {equipoData && scannedSN && (
          <IonCard className="ion-margin-top" style={{ marginInline: 0 }}>
            <IonCardHeader>
              <IonCardSubtitle>Datos del equipo</IonCardSubtitle>
              <IonCardTitle>S/N: {scannedSN}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '14px', margin: 0 }}>
                {JSON.stringify(equipoData, null, 2)}
              </pre>
            </IonCardContent>
          </IonCard>
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

