import Link from 'next/link';
import { FallbackProps } from 'react-error-boundary';

const Unauthorized: React.ComponentType<FallbackProps> = () => {
  return (
    <div>
      401 - Unauthorized
      <Link href='/signin'>Go to Sign In</Link>
    </div>
  );
};

export default Unauthorized;
