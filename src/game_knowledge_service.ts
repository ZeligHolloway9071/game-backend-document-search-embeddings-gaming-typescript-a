import express from "express";
import { z } from "zod";
import { GameDocumentIndex, type GameDocument } from "./game_document_index.js";
import { EmbeddingServiceError, embedTexts } from "./infrai_embeddings.js";

const searchBody = z.object({
  query: z.string().trim().min(3).max(300),
  audience: z.enum(["player", "moderator"]),
  limit: z.number().int().min(1).max(10).default(3),
});

const lessons: GameDocument[] = [
  {
    id: "asset-solar-sloop",
    kind: "player_asset",
    title: "Solar Sloop build guide",
    body: "A player-built ship lesson using light sails and low-mass cargo modules.",
    moderation: "approved",
  },
  {
    id: "event-eclipse-race",
    kind: "live_event",
    title: "Eclipse Regatta",
    body: "The weekend live event teaches drafting, checkpoint timing, and team navigation.",
    moderation: "not_applicable",
  },
  {
    id: "asset-unreviewed-banner",
    kind: "player_asset",
    title: "Unreviewed guild banner",
    body: "A submitted guild banner waiting for a safety review.",
    moderation: "pending",
  },
  {
    id: "case-banner-104",
    kind: "moderation_case",
    title: "Banner safety review",
    body: "Review queue notes for symbols and text on the submitted guild banner.",
    moderation: "pending",
  },
];

export async function buildService() {
  const index = new GameDocumentIndex();
  index.add(lessons, await embedTexts(lessons.map(searchText)));
  const app = express();
  app.use(express.json({ limit: "16kb" }));

  app.post("/search", async (request, response) => {
    const parsed = searchBody.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid search request", details: parsed.error.issues });
      return;
    }
    try {
      const [queryEmbedding] = await embedTexts([parsed.data.query]);
      response.json({
        audience: parsed.data.audience,
        items: index.search(queryEmbedding, parsed.data.audience, parsed.data.limit),
      });
    } catch (error) {
      if (error instanceof EmbeddingServiceError) {
        response.status(error.status).json({ error: error.message });
        return;
      }
      response.status(500).json({ error: "Search could not be completed" });
    }
  });
  return app;
}

function searchText(document: GameDocument): string {
  return `${document.kind}: ${document.title}. ${document.body}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  const app = await buildService();
  app.listen(port, () => console.log(`Game document search listening on http://localhost:${port}`));
}
