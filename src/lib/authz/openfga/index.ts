import { OpenFgaClient } from '@openfga/sdk';

// curl -sX POST http://localhost:8080/stores -d '{"name":"local-dev"}'

// run in local
const storeIdULID = '01K6HQBJMJY421B0EE983T6XKZ'; // env.OPENFGA_STORE_ID;
export const openfgaClient = new OpenFgaClient({
  apiUrl: 'http://localhost:8080',
  storeId: storeIdULID,
});
