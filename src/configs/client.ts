import 'client-only';
import { z } from 'zod';

const ZClientConfig = z.object({
  appName: z.string().min(1, 'App name is required'),
  appDomain: z.string().default('localhost'),
  apiBaseURL: z.url().default('http://localhost:3000/api'),
});
export type ClientConfig = z.infer<typeof ZClientConfig>;

export const clientConfig = ZClientConfig.parse({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Insightimate',
  appURL: process.env.NEXT_PUBLIC_APP_URL,
  apiBaseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN,
});

export default clientConfig;
