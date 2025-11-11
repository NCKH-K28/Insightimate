import 'server-only';
import { z } from 'zod';

const ZKafkaBroker = z.string().regex(/^[^:]+:\d+$/, 'Invalid broker format, expected host:port');
const ZKafkaBrokers = z.array(ZKafkaBroker);

const ZAppEnv = z.enum(['development', 'production', 'test'], 'Invalid app environment');
const ZServerConfig = z.object({
  appEnv: ZAppEnv,
  appURL: z.url(),
  appEmail: z.email().optional(),
  port: z.number().min(1).max(65535, 'Port must be between 1 and 65535'),
  host: z.string().min(1, 'Host is required'),

  jwt: z.object({ inviteSecret: z.string().min(1, 'Invite token secret is required') }),

  db: z.object({ url: z.string() }),
  auth: z.object({
    secret: z.string().min(1, 'Auth secret is required'),
    cookieName: z.string().min(1, 'Auth cookie name is required').default('auth_token'),
  }),
  s3: z.object({
    apiURL: z.url().optional(),
    bucketName: z.string().min(1, 'S3 bucket name is required'),
  }),
  smtp: z.object({
    host: z.string().min(1, 'SMTP host is required'),
    port: z.number().min(1).max(65535, 'SMTP port must be between 1 and 65535'),
    username: z.string().min(1, 'SMTP username is required'),
    password: z.string().min(1, 'SMTP password is required'),
  }),
  cerbos: z.object({ apiURL: z.url() }),
  openFGA: z.object({
    apiURL: z.url(),
    storeID: z.string().min(1, 'OpenFGA store ID is required'),
  }),
  debezium: z.object({ apiURL: z.url() }),
  elasticsearch: z.object({ apiURL: z.url() }),
  kafka: z.object({ brokers: ZKafkaBrokers, clientId: z.string() }),
  minio: z.object({
    apiURL: z.url(),
    accessKeyId: z.string().min(1, 'MinIO access key ID is required'),
    secretAccessKey: z.string().min(1, 'MinIO secret access key is required'),
  }),
  hf: z.object({ apiURL: z.url().optional(), apiKey: z.string().optional() }),
});

export type ServerConfig = z.infer<typeof ZServerConfig>;
const env: any = process.env;

const rawConfig: ServerConfig = {
  appEnv: env.APP_ENV || 'development',
  appURL: env.APP_URL || 'http://localhost:3000',
  appEmail: env.APP_EMAIL || undefined,

  port: env.PORT ? Number(env.PORT) : 3000,
  host: env.HOST || 'localhost',

  jwt: { inviteSecret: env.INVITE_TOKEN_SECRET || 'dev-invite-secret' },

  db: { url: env.DATABASE_URL },
  auth: {
    secret: env.AUTH_SECRET || 'dev-auth-secret',
    cookieName: env.AUTH_COOKIE_NAME || 'auth_token',
  },
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? Number(env.SMTP_PORT) : 587,
    username: env.SMTP_USERNAME,
    password: env.SMTP_PASSWORD,
  },
  s3: {
    bucketName: env.S3_BUCKET_NAME || 'dev-bucket',
    apiURL: env.S3_API_URL,
  },
  cerbos: { apiURL: env.CERBOS_API_URL || 'http://localhost:3592' },
  openFGA: {
    apiURL: env.OPENFGA_API_URL || 'http://localhost:8080',
    storeID: env.OPENFGA_STORE_ID || '',
  },
  debezium: { apiURL: env.DEBEZIUM_HOST || 'http://localhost:8083' },
  elasticsearch: { apiURL: env.ELASTICSEARCH_NODE || 'http://localhost:9200' },
  kafka: {
    brokers: ZKafkaBrokers.parse(
      (env.KAFKA_BROKERS || '')
        .split(',')
        .map((b: string) => b.trim())
        .filter((b: string) => b.length > 0),
    ),
    clientId: 'insightimate-app',
  },
  minio: {
    apiURL: env.MINIO_API_URL || 'http://localhost:9000',
    accessKeyId: env.MINIO_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: env.MINIO_SECRET_ACCESS_KEY || 'minioadmin',
  },
  hf: {
    apiURL: env.HF_API_URL || 'https://api.huggingface.co',
    apiKey: env.HF_TOKEN || undefined,
  },
};

const parse = ZServerConfig.safeParse(rawConfig);
if (!parse.success) {
  console.error('Server configuration validation failed:');
  for (const issue of parse.error.issues) {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  }
  throw new Error('Invalid server configuration');
}
export const serverConfig = parse.data;
export default serverConfig;
