import { IonList } from '@ionic/react';
import DeptoCard from '../DeptoCard';
import './HomeContainer.css';

interface ContainerProps {
  name: string;
}



const ExploreContainer: React.FC<ContainerProps> = ({ name }) => {
  return (
    <div>
      <IonList inset={true}>
        <DeptoCard nombre="Depto 1" descripcion="Área de producción general" itemCount={12} />
        <DeptoCard nombre="Depto 2" descripcion="Almacén y logística" itemCount={5} />
        <DeptoCard nombre="Depto 3" descripcion="Control de calidad" itemCount={8} />
        <DeptoCard nombre="Depto 4" descripcion="Administración" itemCount={3} />
      </IonList>
    </div>
  )
};

export default ExploreContainer;
