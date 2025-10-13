import { FallbackProps } from 'react-error-boundary';

const NotFound: React.ComponentType<FallbackProps> = (props) => {
  return <div>404 - Page Not Found</div>;
};

export default NotFound;
