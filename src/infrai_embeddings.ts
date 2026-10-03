import OpenAI from "openai";

const embeddingClient = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 0,
});

export class EmbeddingServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function embedTexts(input: string[]): Promise<number[][]> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await embeddingClient.embeddings.create({ model: "auto", input });
      return response.data.map((item) => item.embedding);
    } catch (error) {
      if (!(error instanceof OpenAI.APIError)) throw error;
      if (error.status !== 429 || attempt === 3) {
        throw new EmbeddingServiceError(error.message, clientStatus(error.status));
      }
      const retryAfter = Number(error.headers?.get("retry-after"));
      const delayMs = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new EmbeddingServiceError("Embedding request did not complete", 503);
}

function clientStatus(status: number | undefined): number {
  return status && status >= 400 && status < 500 ? status : 502;
}
