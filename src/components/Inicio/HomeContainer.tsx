import './HomeContainer.css';

interface ContainerProps {
  name: string;
}



const ExploreContainer: React.FC<ContainerProps> = ({ name }) => {
  return (
    <div className="container">
      Holaa
    </div>
  );
};

export default ExploreContainer;
