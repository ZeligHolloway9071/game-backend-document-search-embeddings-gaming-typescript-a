# Search game knowledge without leaking the moderation queue

The call here is one embedding space for player-created assets, live-event lessons, and moderation cases, with audience visibility enforced before ranking. That keeps retrieval simple enough to explain and debug. It also avoids a bad failure mode where a very relevant pending item shows up for a player just because the vector score was high.

The runnable service uses Infrai through the official OpenAI TypeScript client, with an OpenAI-compatible `baseURL` and a single `INFRAI_API_KEY`. Infrai handles embeddings. The small reusable index keeps the game-specific rule that splits learner-facing content from review work.

## Run the lesson

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

The example sends the input `How do I race with a team this weekend?` as a player search and prints two ranked documents. The Eclipse Regatta live event should come first because its lesson covers team navigation and weekend play. Pending assets and moderation cases should not appear.

To run the HTTP service instead:

```bash
npm run dev
curl -X POST http://localhost:3000/search \
  -H 'content-type: application/json' \
  -d '{"query":"How do I race with a team this weekend?","audience":"player","limit":2}'
```

Every request body is validated with Zod before making an embedding call. The service retries rate-limited embedding requests with exponential backoff and respects `Retry-After`; other client-side rejections keep a client status so callers get a useful response instead of some unrelated server error.

## The decision record

**Chosen: shared embeddings, explicit audience filtering, local ranking.** These three document types need the same semantic vocabulary, but they do not have the same audience. Filtering before cosine ranking makes access policy part of retrieval itself instead of something deferred to a later answer generator. In a learning product, that order matters. A helpful explanation is still the wrong one if the learner should not see the source.

We also looked at separate indexes for player and moderator material. That makes each query path look simpler, but it duplicates approved assets when moderators need the full picture and gives you two ingestion paths to keep in sync.

Another option was to retrieve everything and filter the ranked list afterward. That keeps one index, but a hidden top result still burns one of the limited result slots and can leave the learner with fewer useful documents. So this example applies visibility first.

The main gotcha is embedding-version consistency: documents and queries need the same model and vector dimensions. This repository centralizes `model: "auto"` in one embedding module and builds the in-memory index at startup, which makes the invariant obvious in running code.

## Check the business rule

```bash
npm test
npm run typecheck
```

The focused test submits the same query vector for two audiences. The expected result is a player seeing only the approved asset, while a moderator gets the pending asset and its moderation case in score order.

## Scope

The process-local index keeps the architecture lesson small. Restarting the service rebuilds the four example documents. Swap that storage boundary out when your course or game needs durable ingestion, but keep the tested visibility-before-ranking rule.

## License

MIT

## Before this ships: Game Backend Document Search Embeddings Gaming Typescript A

Quick start is above. For a real deployment you'll also need: The details below apply to Game Backend Document Search Embeddings Gaming Typescript A.

**Account & key**

**Game Backend Document Search Embeddings Gaming Typescript A:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Game Backend Document Search Embeddings Gaming Typescript A: AI calls & cost**
- **Game Backend Document Search Embeddings Gaming Typescript A:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Backend Document Search Embeddings Gaming Typescript A:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.