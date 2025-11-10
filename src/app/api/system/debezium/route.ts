 

import { seedDebeziumConnectors } from '@/lib/debezium/seed';
import { NextResponse } from 'next/server';
import get from 'lodash/get';
import { elasticClient } from '@/lib/elastic';
import { compose } from '@/lib/http/api-compose';

// clear elast
const clearEs = async () => {
  await elasticClient.deleteByQuery({
    index: '_all',
    query: { match_all: {} },
  });
};

export const GET = compose(async () => {
  try {
    await clearEs();
    const result = await seedDebeziumConnectors();
    return NextResponse.json({ status: 'success', message: result });
  } catch (error) {
    console.error(error);
    const errorMessage = get(error, 'message', 'Unknown error');
    const detail = get(error, 'response.data', null);
    console.error('Detail:', detail);
    return NextResponse.json({ status: 'error', message: errorMessage, detail }, { status: 500 });
  }
});
