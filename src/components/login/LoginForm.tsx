import { IonCard, IonCardHeader, IonCardTitle, IonInputOtp, IonItem } from "@ionic/react";
import { useState, useEffect } from "react";
import { CapacitorHttp } from '@capacitor/core';
// import { useDebugger, DebugConsole } from "../debugger/DebugConsole";
import "./LoginForm.css";

const LoginForm: React.FC = () => {
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
    // const { debugLogs, addLog, clearLogs } = useDebugger();

    const validateOtp = async (value: string) => {
        if (value.length !== 5) return;

        setValidationState({ isValid: null, isLoading: true, error: null });
        // clearLogs(); // Limpiar logs anteriores
        
        try {
            const url = 'http://172.16.20.63:3001/api/v1/auth/login';
            const payload = { pin: value };

            // addLog("=== INICIANDO FETCH ===");
            // addLog("URL:", url);
            // addLog("Method: POST, Headers: application/json");
            // addLog("Body/Payload:", payload);

            const response = await CapacitorHttp.post({
                url: url,
                headers: { 'Content-Type': 'application/json' },
                data: payload,
            });

            // addLog("=== RESPUESTA RECIBIDA ===");
            // addLog(`Status: ${response.status} | Ok: ${response.status >= 200 && response.status < 300}`);

            // Obtenemos el cuerpo de la respuesta
            const responseData = response.data;
            // addLog("Body:", responseData);

            if (response.status >= 200 && response.status < 300) {
                let data = responseData;
                try {
                    if (typeof data === 'string') {
                        data = JSON.parse(data);
                    }
                    // addLog("Body (Parsed JSON):", data);
                    
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                    // addLog("Error al parsear el JSON de la respuesta:", (e as Error).message);
                }
                setValidationState({ isValid: data?.isValid ?? false, isLoading: false, error: null });
            } else {
                // addLog("El servidor devolvió un error. Status Code:", response.status);
                throw new Error(`Error en el servidor: ${response.status}`);
            }
        } catch (err) {
            // addLog("=== ERROR EN FETCH ===");
            // addLog((err as Error).message);
            setValidationState({ isValid: false, isLoading: false, error: (err as Error).message });
        }
    };

    useEffect(() => {
        if (otpValue.length === 5) {
            validateOtp(otpValue);
        } else {
            setValidationState({ isValid: null, isLoading: false, error: null });
        }
    }, [otpValue]);

    const getValidationState = () => {
        if (validationState.isLoading) {
            return { class: 'loading', disabled: true };
        }
        if (validationState.isValid === true) {
            return { class: 'valid', disabled: true };
        }
        if (validationState.isValid === false) {
            return { class: 'invalid', disabled: false };
        }
        return { class: '', disabled: false };
    };

    const handleInput = (value: string) => {
        setOtpValue(value);
    };

    return (
        <div className="container">
            <IonCard>
                <IonCardHeader>
                    <IonCardTitle>Inicia Sesión</IonCardTitle>
                </IonCardHeader>

                <IonItem>
                    <IonInputOtp
                        length={5}
                        type="number"
                        size="small"
                        value={otpValue}
                        onIonInput={(e) => handleInput(e.detail.value!)}
                        className={`ion-touched ${getValidationState().class}`}
                        disabled={getValidationState().disabled}
                    >
                        Por favor, ingresa la llave de acceso al sistema.
                        {validationState.error && <p className="error">{validationState.error}</p>}
                    </IonInputOtp>
                </IonItem>
            </IonCard>

            {/*  <DebugConsole logs={debugLogs} /> */}
        </div>
    );
};

export default LoginForm;