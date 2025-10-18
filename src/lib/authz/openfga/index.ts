import { OpenFgaClient } from '@openfga/sdk';

// curl -sX POST http://localhost:8080/stores -d '{"name":"local-dev"}'

// run in local
const storeIdULID = '01K7NAE2HAAT7CXKV1966XA4J2'; // env.OPENFGA_STORE_ID;
export const openfgaClient = new OpenFgaClient({
  apiUrl: 'http://103.141.177.146:8080',
  storeId: storeIdULID,
});