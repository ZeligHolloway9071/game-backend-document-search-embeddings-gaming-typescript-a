export type DocumentKind = "player_asset" | "live_event" | "moderation_case";
export type SearchAudience = "player" | "moderator";

export interface GameDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  body: string;
  moderation: "approved" | "pending" | "not_applicable";
}

interface IndexedDocument extends GameDocument {
  embedding: number[];
}

export interface SearchResult {
  id: string;
  kind: DocumentKind;
  title: string;
  score: number;
}

export class GameDocumentIndex {
  readonly #documents: IndexedDocument[] = [];

  add(documents: GameDocument[], embeddings: number[][]): void {
    if (documents.length !== embeddings.length) {
      throw new Error("Each game document needs one embedding");
    }
    for (let index = 0; index < documents.length; index += 1) {
      const embedding = embeddings[index];
      if (!embedding || embedding.length === 0) {
        throw new Error("Embeddings must contain at least one value");
      }
      this.#documents.push({ ...documents[index], embedding });
    }
  }

  search(queryEmbedding: number[], audience: SearchAudience, limit: number): SearchResult[] {
    return this.#documents
      .filter((document) => isVisible(document, audience))
      .map((document) => ({
        id: document.id,
        kind: document.kind,
        title: document.title,
        score: cosineSimilarity(queryEmbedding, document.embedding),
      }))
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
      .slice(0, limit);
  }
}

function isVisible(document: GameDocument, audience: SearchAudience): boolean {
  if (audience === "moderator") return true;
  return document.kind !== "moderation_case" && document.moderation !== "pending";
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length) throw new Error("Embedding dimensions must match");
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}
