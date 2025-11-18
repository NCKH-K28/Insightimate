import { FallbackProps } from 'react-error-boundary';

const NotFound: React.ComponentType<FallbackProps> = () => {
  return <div>404 - Page Not Found</div>;
};

export default NotFound;
