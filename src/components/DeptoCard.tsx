import {
    IonCard,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
} from "@ionic/react";
import { businessOutline, chevronForwardOutline } from "ionicons/icons";

interface DeptoCardProps {
    nombre: string;
    descripcion?: string;
    itemCount?: number;
}

const DeptoCard: React.FC<DeptoCardProps> = ({ nombre, descripcion, itemCount }) => {
    return (
        <IonCard button>
            <IonItem lines="none">
                <IonIcon icon={businessOutline} slot="start" color="primary" />
                <IonLabel>
                    <p>Departamento</p>
                    <h2>{nombre}</h2>
                    {descripcion && <p>{descripcion}</p>}
                </IonLabel>
                {itemCount !== undefined && (
                    <IonBadge color="primary" slot="end">
                        {itemCount}
                    </IonBadge>
                )}
                <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
            </IonItem>
        </IonCard>
    );
};

export default DeptoCard;