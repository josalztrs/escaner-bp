import { IonIcon, IonLabel, IonTabBar, IonTabButton } from "@ionic/react";
import { homeOutline, qrCodeOutline, bookOutline } from "ionicons/icons";

/**
 * Definición del TabBar de la app.
 * Se exporta como constante JSX (no como componente funcional)
 * porque IonTabs requiere que IonTabBar sea un hijo JSX directo.
 */
const tabBar = (
    <IonTabBar slot="bottom">
        <IonTabButton tab="tab1" href="/tab1">
            <IonIcon icon={homeOutline} />
            <IonLabel>Departamentos</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab2" href="/tab2">
            <IonIcon icon={qrCodeOutline} />
            <IonLabel>Escáner</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab3" href="/tab3">
            <IonIcon icon={bookOutline} />
            <IonLabel>Historial</IonLabel>
        </IonTabButton>
    </IonTabBar>
);

export default tabBar;