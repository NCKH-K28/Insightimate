import { z } from 'zod';

export const SitelinkSchema = z.object({ title: z.string(), link: z.string() });

export const OrganicSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
  sitelinks: z.array(SitelinkSchema).optional(),
  position: z.number(),
  date: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()),
});

export const PeopleAlsoAskSchema = z.object({
  question: z.string(),
  snippet: z.string(),
  title: z.string(),
  link: z.string(),
});

export const RelatedSearchSchema = z.object({ query: z.string() });

export const SearchParametersSchema = z.object({
  q: z.string(),
  gl: z.string(),
  hl: z.string(),
  autocorrect: z.boolean(),
  page: z.number(),
  type: z.string(),
});

export const KnowledgeGraphSchema = z.object({
  title: z.string(),
  type: z.string(),
  website: z.string(),
  imageUrl: z.string(),
  description: z.string(),
  descriptionSource: z.string(),
  descriptionLink: z.string(),
  attributes: z.record(z.string(), z.unknown()),
});

export const RootSchema = z.object({
  searchParameters: SearchParametersSchema,
  knowledgeGraph: KnowledgeGraphSchema,
  organic: z.array(OrganicSchema),
  peopleAlsoAsk: z.array(PeopleAlsoAskSchema),
  relatedSearches: z.array(RelatedSearchSchema),
});

export type Root = z.infer<typeof RootSchema>;
