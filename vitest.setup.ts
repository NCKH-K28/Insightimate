import { config } from 'dotenv';
import path from 'path';
import '@testing-library/jest-dom';

// Load test environment variables
config({ path: path.resolve(__dirname, '.env.test.local') });
