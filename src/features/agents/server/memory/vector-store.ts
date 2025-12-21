export interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface VectorStore {
  add(documents: VectorDocument[]): Promise<void>;
  search(query: string, limit?: number): Promise<VectorDocument[]>;
  delete(ids: string[]): Promise<void>;
}

// Mock implementation for MVP/Tests
export class InMemoryVectorStore implements VectorStore {
  private docs: VectorDocument[] = [];

  async add(documents: VectorDocument[]) {
    this.docs.push(...documents);
  }

  async search(query: string, limit: number = 3) {
    // Simple keyword match for mock
    return this.docs
      .filter((d) => d.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }

  async delete(ids: string[]) {
    this.docs = this.docs.filter((d) => !ids.includes(d.id));
  }
}
