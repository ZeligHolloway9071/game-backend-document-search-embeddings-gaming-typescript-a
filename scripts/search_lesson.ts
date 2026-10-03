import { buildService } from "../src/game_knowledge_service.js";

const app = await buildService();
const server = app.listen(0, async () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a local TCP address");
  const response = await fetch(`http://127.0.0.1:${address.port}/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "How do I race with a team this weekend?", audience: "player", limit: 2 }),
  });
  console.log(JSON.stringify(await response.json(), null, 2));
  server.close();
});
