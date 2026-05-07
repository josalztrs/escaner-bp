import { useState, useCallback } from 'react';
import {
    IonPage,
    IonContent,
    IonSpinner,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonText,
} from '@ionic/react';
import {
    scanOutline,
    flashlightOutline,
    personCircleOutline,
    barcodeOutline,
    closeOutline,
    alertCircleOutline,
} from 'ionicons/icons';
import { ApiError, iniciarEscaneoDetallado, buscarEquipoPorSN, EquipoResponse } from '../services/Escaner';

/** Estados posibles de la pantalla del escáner */
type ScanState = 'idle' | 'scanning' | 'fetching' | 'success' | 'error';

const Escaner: React.FC = () => {
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [scannedSN, setScannedSN] = useState<string | null>(null);
    const [equipoData, setEquipoData] = useState<EquipoResponse | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleScan = useCallback(async () => {
        setEquipoData(null);
        setErrorMsg(null);
        setScanState('scanning');

        try {
            const scan = await iniciarEscaneoDetallado();

            if (scan.state !== 'ok') {
                setScanState('idle');
                return;
            }

            setScannedSN(scan.serialNumber);
            setScanState('fetching');

            const data = await buscarEquipoPorSN(scan.serialNumber);
            setEquipoData(data);
            setScanState('success');
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMsg(`${error.message} (HTTP ${error.info.status})\n${error.info.url}\nSN="${error.info.serialNumber}"`);
                setScanState('error');
                return;
            }
            const message = error instanceof Error ? error.message : 'Error desconocido al escanear';
            setErrorMsg(message);
            setScanState('error');
        }
    }, []);

    const handleClear = useCallback(() => {
        setScannedSN(null);
        setEquipoData(null);
        setErrorMsg(null);
        setScanState('idle');
    }, []);

    const getStatusInfo = () => {
        switch (scanState) {
            case 'scanning':
                return { title: 'Escaneando...', subtitle: 'Apunta hacia el código', badge: 'SCANNING' };
            case 'fetching':
                return { title: 'Consultando...', subtitle: 'Buscando equipo en el sistema', badge: 'BUSCANDO' };
            case 'success':
                return { title: 'Equipo Encontrado', subtitle: 'Datos cargados exitosamente', badge: 'LISTO' };
            case 'error':
                return { title: 'Error', subtitle: 'No se pudo completar la operación', badge: 'ERROR' };
            default:
                return { title: 'Listo para Escanear', subtitle: 'Apunta a cualquier QR o código de barras', badge: 'LISTO' };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/tab1" />
                    </IonButtons>
                    <IonTitle>Inventario de Activos</IonTitle>
                    <IonButtons slot="end">
                        <IonButton>
                            <IonIcon icon={personCircleOutline} size="large" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                
                {/* ── Scanner Viewport ── */}
                <div style={{ height: '300px', backgroundColor: '#000', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="ion-margin-bottom">
                    <div style={{ width: '200px', height: '200px', border: '2px dashed #fff', borderRadius: '12px' }} />
                    <IonButton fill="clear" color="light" style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                        <IonIcon icon={flashlightOutline} slot="icon-only" />
                    </IonButton>
                    
                    {scanState === 'fetching' && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <IonSpinner name="crescent" color="light" />
                            <p>Consultando equipo...</p>
                        </div>
                    )}
                </div>

                {/* Status Card */}
                <IonCard className="ion-margin-bottom" style={{ marginInline: 0 }}>
                    <IonItem lines="none">
                        <IonIcon icon={barcodeOutline} slot="start" color="primary" />
                        <IonLabel>
                            <h2>{statusInfo.title}</h2>
                            <p>{statusInfo.subtitle}</p>
                        </IonLabel>
                        <IonBadge color="primary" slot="end">{statusInfo.badge}</IonBadge>
                    </IonItem>
                </IonCard>

                {/* Scan Button */}
                <IonButton 
                    expand="block" 
                    size="large" 
                    onClick={handleScan}
                    disabled={scanState === 'scanning' || scanState === 'fetching'}
                    className="ion-margin-bottom"
                >
                    {scanState === 'scanning' || scanState === 'fetching' ? (
                        <>
                            <IonSpinner name="crescent" className="ion-margin-end" />
                            {scanState === 'scanning' ? 'Escaneando...' : 'Buscando...'}
                        </>
                    ) : (
                        <>
                            <IonIcon icon={scanOutline} slot="start" />
                            Iniciar Escaneo
                        </>
                    )}
                </IonButton>

                {/* Resultado exitoso */}
                {scanState === 'success' && equipoData && (
                    <IonCard className="ion-margin-top" style={{ marginInline: 0 }}>
                        <IonCardHeader>
                            <IonItem lines="none" style={{ '--padding-start': '0' }}>
                                <IonLabel>
                                    <IonCardSubtitle>Resultado del Escaneo</IonCardSubtitle>
                                    <IonCardTitle>S/N: {scannedSN}</IonCardTitle>
                                </IonLabel>
                                <IonButton fill="clear" color="medium" onClick={handleClear} slot="end">
                                    <IonIcon icon={closeOutline} slot="icon-only" />
                                </IonButton>
                            </IonItem>
                        </IonCardHeader>
                        <IonCardContent>
                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '14px', margin: 0 }}>
                                {JSON.stringify(equipoData, null, 2)}
                            </pre>
                        </IonCardContent>
                    </IonCard>
                )}

                {/* Error */}
                {scanState === 'error' && errorMsg && (
                    <IonCard color="danger" className="ion-margin-top" style={{ marginInline: 0 }}>
                        <IonItem color="danger" lines="none">
                            <IonIcon icon={alertCircleOutline} slot="start" />
                            <IonLabel className="ion-text-wrap">
                                <h2>Error al buscar equipo</h2>
                                <p>{errorMsg}</p>
                            </IonLabel>
                        </IonItem>
                    </IonCard>
                )}

                {/* Hint cuando está idle */}
                {scanState === 'idle' && !equipoData && (
                    <div className="ion-text-center ion-padding-top">
                        <IonText color="medium">
                            <p>Presiona el botón para escanear un código QR o de barras del equipo</p>
                        </IonText>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default Escaner;
