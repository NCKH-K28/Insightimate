export type SourceRef = {
  id: string;
  sourceType: string;
  sourceId: string;
  source?: { name: string; avatar?: string };
};

export type Agent = {
  id: string;
  name: string;
  description?: string;
  sourcesRef?: SourceRef[];

  _count?: {
    runs: number;
    sources: number;
  };
};
