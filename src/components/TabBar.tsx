import { IonLabel, IonTabBar, IonTabButton } from "@ionic/react";

const TabBar: React.FC = () => {
    return (
        <IonTabBar slot="bottom">
            <IonTabButton tab="tab1" href="/tab1">
                <IonLabel>Inicio</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab2" href="/tab2">
                <IonLabel>Escáner</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab3" href="/tab3">
                <IonLabel>Historial</IonLabel>
            </IonTabButton>
        </IonTabBar>
    )
}

export default TabBar;