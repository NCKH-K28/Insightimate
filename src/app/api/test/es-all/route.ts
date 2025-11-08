import { elasticClient } from '@/lib/elastic';

export const GET = async (req: Request) => {
  const response = await elasticClient.search({
    index: '_all',
    query: { match_all: {} },
  });

  const text = JSON.stringify(response, null, 2);

  return new Response(text, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
