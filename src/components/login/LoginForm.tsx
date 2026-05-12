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
    IonPage
} from "@ionic/react";
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
                        <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle className="ion-text-center">Inicia Sesión</IonCardTitle>
                                </IonCardHeader>

                                <div className="ion-padding">
                                    <IonText color="medium">
                                        <p className="ion-text-center">Por favor, ingresa la llave de acceso al sistema.</p>
                                    </IonText>
                                    
                                    <IonItem lines="none" className="ion-margin-vertical">
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