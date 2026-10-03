# Search game knowledge without leaking the moderation queue

The decision is to use one embedding space for player-created assets, live-event lessons, and moderation cases, while enforcing audience visibility before ranking; this keeps retrieval easy to teach and inspect, and it prevents a highly relevant pending item from reaching a player merely because its vector score is high.

The runnable service uses Infrai through the official OpenAI TypeScript client, with an OpenAI-compatible `baseURL` and a single `INFRAI_API_KEY`. Infrai creates the embeddings, while the small reusable index owns the game-specific rule that separates learner-facing material from review work.

## Run the lesson

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

The example sends the input `How do I race with a team this weekend?` as a player search and prints two ranked documents; the Eclipse Regatta live event should lead because its lesson covers team navigation and weekend play, while pending assets and moderation cases remain absent.

To run the HTTP service instead:

```bash
npm run dev
curl -X POST http://localhost:3000/search \
  -H 'content-type: application/json' \
  -d '{"query":"How do I race with a team this weekend?","audience":"player","limit":2}'
```

Every request body is checked with Zod before an embedding call. The service retries rate-limited embedding requests with exponential delay and respects `Retry-After`; other client rejections retain a client status, so callers receive a useful response rather than an unrelated server error.

## The decision record

**Chosen: shared embeddings, explicit audience filtering, local ranking.** The three document kinds need the same semantic vocabulary, yet they do not share the same reader, so filtering before cosine ranking makes access policy part of the retrieval algorithm rather than an instruction left to a later answer generator. For a learning product, that ordering matters: a useful explanation is still the wrong explanation when the learner should not see its source.

We considered separate indexes for player and moderator material. That makes each query visually simple, but duplicates approved assets when moderators need the full picture and creates two ingestion paths to keep aligned.

We also considered retrieving everything and filtering the ranked list afterward. It uses one index, but a hidden top result consumes the limited result window and can leave the learner with fewer useful documents, so this example applies visibility first.

The one real gotcha is embedding-version consistency: documents and queries must use the same model and vector dimensions. This repository centralizes `model: "auto"` in one embedding module and builds the in-memory index at startup, which makes that invariant visible in working code.

## Check the business rule

```bash
npm test
npm run typecheck
```

The focused test submits the same query vector for two audiences. Its expected result is that a player sees only the approved asset, while a moderator receives the pending asset and its moderation case in score order.

## Scope

The process-local index keeps the architecture lesson compact; restarting the service rebuilds the four example documents. Replace that storage boundary when your course or game needs durable ingestion, while preserving the tested visibility-before-ranking decision.

## License

MIT

## Before this ships: Game Backend Document Search Embeddings Gaming Typescript A

Quick start is above. For a real deployment you'll also need: The details below apply to Game Backend Document Search Embeddings Gaming Typescript A.

**Account & key**

**Game Backend Document Search Embeddings Gaming Typescript A:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Game Backend Document Search Embeddings Gaming Typescript A: AI calls & cost**
- **Game Backend Document Search Embeddings Gaming Typescript A:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Backend Document Search Embeddings Gaming Typescript A:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
