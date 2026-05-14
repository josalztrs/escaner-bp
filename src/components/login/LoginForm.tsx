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
    IonIcon
} from "@ionic/react";
import { barcodeOutline} from 'ionicons/icons';
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
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default LoginForm;