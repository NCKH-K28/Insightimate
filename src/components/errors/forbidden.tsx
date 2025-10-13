import { FallbackProps } from 'react-error-boundary';

const Forbidden: React.ComponentType<FallbackProps> = (props) => {
  return <div>403 - Forbidden</div>;
};

export default Forbidden;
