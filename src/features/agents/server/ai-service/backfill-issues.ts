import { elasticClient } from '@/lib/elastic';
import { hfClient } from '@/lib/huggingface';
import z from 'zod';

const ZESIssue = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().nullable(),
  parent_id: z.string().nullish(),
  embedding: z.unknown().optional(), // có thể chưa có
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

type ESIssue = z.infer<typeof ZESIssue>;
type ESIssueWithEmbedding = ESIssue & { embedding: number[]; full_text: string };

const buildText = (issue: ESIssue) => {
  let text = issue.summary.trim();
  if (issue.description) text += `\n\n${issue.description.trim()}`;
  return text.trim();
};

const embedBatch = async (inputs: string[]): Promise<number[][]> => {
  const res = await hfClient.featureExtraction({
    model: 'sentence-transformers/all-mpnet-base-v2',
    inputs,
    options: { wait_for_model: true },
  });

  if (!Array.isArray(res[0])) return [res as number[]];
  return res as number[][];
};

const addEmbeddingFieldToIssuesIndex = async () => {
  await elasticClient.indices.putMapping({
    index: 'issues',
    properties: {
      embedding: { type: 'dense_vector', dims: 768, similarity: 'cosine' },
      embedding_updated_at: { type: 'date' },
    },
  });
};

const bulkUpsert = async (
  docs: Array<ESIssueWithEmbedding>,
  embedding_updated_at: Date = new Date(),
) => {
  const body = docs.flatMap((doc) => [
    { update: { _index: 'issues', _id: doc.id } },
    {
      doc: { embedding: doc.embedding, embedding_updated_at },
      doc_as_upsert: true,
    },
  ]);

  const res = await elasticClient.bulk({ body });
  if (res.errors) {
    const errored = res.items
      .map((action, i) => ({ action, doc: docs[i] }))
      .filter((x: any) => x.action.update && x.action.update.error);
    console.error('Bulk errors', JSON.stringify(errored, null, 2));
  }
};

export const backfillIssues = async (p?: {
  fetchSize?: number;
  maxDocs?: number;
  before?: Date;
}) => {
  const fetchSize = p?.fetchSize ?? 200;
  const maxDocs = p?.maxDocs ?? Number.POSITIVE_INFINITY;
  const before = p?.before;

  let processed = 0;

  await addEmbeddingFieldToIssuesIndex();

  const should: any[] = [{ bool: { must_not: { exists: { field: 'embedded_at' } } } }];
  if (before) should.push({ range: { embedded_at: { lt: before } } });

  const scroll = elasticClient.helpers.scrollSearch({
    index: 'issues',
    size: fetchSize,
    query: {
      bool: { should, minimum_should_match: 1 },
    }, // _source: ['id', 'summary', ...] // nếu muốn giảm payload
  });

  for await (const result of scroll) {
    const docs: ESIssue[] = result.documents.map((d) => ZESIssue.parse(d));

    if (processed >= maxDocs) break;

    const texts = docs.map(buildText);
    const embeddings = await embedBatch(texts);

    const docsWithEmbeddings: ESIssueWithEmbedding[] = docs.map((doc, idx) => ({
      ...doc,
      full_text: texts[idx],
      embedding: embeddings[idx],
    }));

    await bulkUpsert(docsWithEmbeddings);

    processed += docs.length;
    console.log(`Processed ${processed} documents`);

    if (processed >= maxDocs) break;
  }

  console.log('Backfill done');
  return { processed };
};
