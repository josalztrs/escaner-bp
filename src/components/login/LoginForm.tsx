import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonInputOtp,
    IonItem,
    IonButton,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonContent,
    IonPage,
    IonIcon,
    IonChip,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons
} from "@ionic/react";
import { barcodeOutline, serverOutline, cloudDoneOutline, cloudOfflineOutline, informationCircleOutline, closeOutline } from 'ionicons/icons';
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { CapacitorHttp } from '@capacitor/core';
import { Preferences } from "@capacitor/preferences";

const LoginForm: React.FC = () => {
    const history = useHistory();
    const [otpValue, setOtpValue] = useState('');
    const [validationState, setValidationState] = useState<{
        isValid: boolean | null;
        isLoading: boolean;
        error: string | null;
    }>({
        isValid: null,
        isLoading: false,
        error: null,
    });

    const [apiStatus, setApiStatus] = useState<{
        state: 'idle' | 'loading' | 'ok' | 'db-error' | 'network-error';
        message: string | null;
    }>({ state: 'idle', message: null });

    const [showInfo, setShowInfo] = useState(false);

    const checkApiStatus = async () => {
        setApiStatus({ state: 'loading', message: null });
        try {
            const response = await CapacitorHttp.get({
                url: 'http://10.60.20.5:8014/api/v1/status',
            });
            if (response.status === 200) {
                setApiStatus({ state: 'ok', message: 'Servidor operativo' });
            } else if (response.status === 503) {
                setApiStatus({ state: 'db-error', message: 'Error conectando a BD' });
            } else {
                setApiStatus({ state: 'network-error', message: `Respuesta inesperada (HTTP ${response.status})` });
            }
        } catch {
            setApiStatus({ state: 'network-error', message: 'No se pudo conectar al servidor' });
        }
    };

    const validateOtp = async (value: string) => {
        if (value.length !== 5) return;

        setValidationState({ isValid: null, isLoading: true, error: null });

        try {
            const url = 'http://10.60.20.5:8014/api/v1/auth/login';
            const payload = { pin: value };

            const response = await CapacitorHttp.post({
                url: url,
                headers: { 'Content-Type': 'application/json' },
                data: payload,
            });

            const responseData = response.data;

            if (response.status >= 200 && response.status < 300) {
                let data = responseData;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                }

                if (data?.status === 'correct') {
                    await Preferences.set({
                        key: 'credentials',
                        value: JSON.stringify(data)
                    });

                    if (data.token) {
                        await Preferences.set({
                            key: 'auth_token',
                            value: data.token
                        });
                    }

                    history.push('/tab1');
                }

                setValidationState({
                    isValid: data?.status === 'correct',
                    isLoading: false,
                    error: data?.status !== 'correct' ? 'PIN incorrecto' : null
                });
            } else {
                throw new Error(`Error en el servidor: ${response.status}`);
            }
        } catch (err) {
            setValidationState({ isValid: false, isLoading: false, error: (err as Error).message });
        }
    };

    const handleInput = (value: string) => {
        setOtpValue(value);
    };

    return (
        <IonPage>
            <IonContent className="ion-padding">
                {/* Info button bottom-left */}
                <IonButton fill="clear" style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 20 }} onClick={() => setShowInfo(true)}>
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>

                <IonModal isOpen={showInfo} onDidDismiss={() => setShowInfo(false)} className="app-modal">
                    <IonHeader className="modal-header">
                        <IonToolbar>
                            <IonTitle>Acerca de</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowInfo(false)}>
                                    <IonIcon icon={closeOutline} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding modal-content">
                        <div className="modal-card">
                            <div className="modal-card-header">
                                <h2 className="modal-card-title"><span style={{ color: 'var(--ion-color-primary-contrast)' }}>SID</span>REB</h2>
                            </div>
                            <div className="modal-body">
                                <div className="details">
                                    <div className="detail-item">
                                        <span className="detail-label">Versión</span>
                                        <span className="detail-value">1.0.0</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Creado usando</span>
                                        <span className="detail-value">React (UI) y Capacitor (Android Build)</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Realizado por</span>
                                        <span className="detail-value">José David Salazar Gómez</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Para</span>
                                        <span className="detail-value">BOLIPUERTOS PTO EL GUAMACHE</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <p>Sistema de Disposición Remota de Bienes — app para inventario y escaneo de activos.</p>
                                    <p className="hint">Esta aplicación y sus contenidos son de uso exclusivo de BOLIVARIANA DE PUERTOS (BOLIPUERTOS) S.A. Queda prohibida su utilización, reproducción o distribución no autorizada. El usuario asume toda responsabilidad por el uso indebido de la aplicación y por las consecuencias legales, administrativas o contractuales que puedan derivarse.</p>
                                </div>
                            </div>
                        </div>
                    </IonContent>
                </IonModal>
                <IonGrid style={{ height: '100%' }}>
                    <IonRow className="ion-align-items-center ion-justify-content-center" style={{ height: '100%' }}>
                        <IonCol size="12" sizeMd="6" sizeLg="5" sizeXl="4">
                            {/* Logo / Icon Area */}
                            <div className="ion-text-center ion-margin-bottom fade-in-up" style={{ marginBottom: '2rem' }}>
                                <div style={{
                                    background: 'var(--premium-gradient)',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '24px',
                                    margin: '0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 10px 25px rgba(56, 128, 255, 0.4)',
                                    marginBottom: '1rem'
                                }}>
                                    <IonIcon
                                        icon={barcodeOutline}
                                        style={{ fontSize: '40px', color: 'white' }}
                                    />
                                </div>
                                <h1 style={{ fontWeight: 800, margin: 0, fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                                    SID<span style={{ color: 'var(--ion-color-primary)' }}>REB</span>
                                </h1>
                                <p style={{ color: 'var(--ion-color-medium)', margin: '4px 0 0' }}>Sistema de Disposición Remota de Bienes</p>
                            </div>

                            <IonCard className="glass-card fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <IonCardHeader>
                                    <IonCardTitle className="ion-text-center" style={{ fontWeight: 700, fontSize: '1.2rem' }}>Acceso al Sistema</IonCardTitle>
                                </IonCardHeader>

                                <div className="ion-padding">
                                    <IonText color="medium">
                                        <p className="ion-text-center">Por favor, ingresa la llave de acceso al sistema.</p>
                                    </IonText>

                                    <IonItem lines="none" className="ion-margin-vertical" style={{ '--background': 'transparent' }}>
                                        <IonInputOtp
                                            length={5}
                                            type="number"
                                            value={otpValue}
                                            onIonInput={(e) => handleInput(e.detail.value!)}
                                            disabled={validationState.isLoading}
                                            style={{ margin: 'auto' }}
                                        />
                                    </IonItem>

                                    {validationState.error && (
                                        <IonText color="danger" className="ion-text-center">
                                            <p>{validationState.error}</p>
                                        </IonText>
                                    )}

                                    <div className="ion-margin-top">
                                        <IonButton
                                            expand="block"
                                            className="premium-button"
                                            onClick={() => validateOtp(otpValue)}
                                            disabled={otpValue.length !== 5 || validationState.isLoading}
                                        >
                                            {validationState.isLoading ? <IonSpinner name="crescent" /> : "Ingresar"}
                                        </IonButton>
                                    </div>
                                </div>
                            </IonCard>

                            {/* Status check */}
                            <div className="ion-text-center ion-margin-top fade-in-up" style={{ animationDelay: '0.2s' }}>
                                <IonButton
                                    fill="clear"
                                    size="small"
                                    onClick={() => void checkApiStatus()}
                                    disabled={apiStatus.state === 'loading'}
                                    style={{ textTransform: 'none', fontWeight: 500, fontSize: '0.85rem' }}
                                >
                                    {apiStatus.state === 'loading' ? (
                                        <><IonSpinner name="dots" style={{ width: 18, height: 18, marginRight: 6 }} /> Verificando...</>
                                    ) : (
                                        <><IonIcon icon={serverOutline} slot="start" /> Verificar conexión</>
                                    )}
                                </IonButton>

                                {apiStatus.state !== 'idle' && apiStatus.state !== 'loading' && (
                                    <div style={{ marginTop: 4 }}>
                                        <IonChip
                                            color={
                                                apiStatus.state === 'ok' ? 'success'
                                                    : apiStatus.state === 'db-error' ? 'danger'
                                                        : 'medium'
                                            }
                                            style={{ fontWeight: 600 }}
                                        >
                                            <IonIcon
                                                icon={apiStatus.state === 'ok' ? cloudDoneOutline : cloudOfflineOutline}
                                            />
                                            <span style={{ marginLeft: 6 }}>{apiStatus.message}</span>
                                        </IonChip>
                                    </div>
                                )}
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default LoginForm;