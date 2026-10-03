import assert from "node:assert/strict";
import test from "node:test";
import { GameDocumentIndex, type GameDocument } from "../src/game_document_index.js";

const documents: GameDocument[] = [
  { id: "approved", kind: "player_asset", title: "Approved lesson", body: "", moderation: "approved" },
  { id: "pending", kind: "player_asset", title: "Pending lesson", body: "", moderation: "pending" },
  { id: "case", kind: "moderation_case", title: "Safety queue", body: "", moderation: "pending" },
];

test("player search hides review work while moderator search can retrieve it", () => {
  const index = new GameDocumentIndex();
  index.add(documents, [[0, 1], [1, 0], [0.9, 0.1]]);

  assert.deepEqual(index.search([1, 0], "player", 3).map((item) => item.id), ["approved"]);
  assert.deepEqual(index.search([1, 0], "moderator", 2).map((item) => item.id), ["pending", "case"]);
});
