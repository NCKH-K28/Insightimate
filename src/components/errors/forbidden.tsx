import { FallbackProps } from 'react-error-boundary';

const Forbidden: React.ComponentType<FallbackProps> = () => {
  return <div>403 - Forbidden</div>;
};

export default Forbidden;
