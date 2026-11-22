import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

async function withServer(fn) {
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

test("GET /health", () =>
  withServer(async (base) => {
    const r = await fetch(`${base}/health`);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  }));

test("POST then GET /notes", () =>
  withServer(async (base) => {
    const post = await fetch(`${base}/notes`, { method: "POST", body: JSON.stringify({ text: "hi" }) });
    assert.equal(post.status, 201);
    const list = await (await fetch(`${base}/notes`)).json();
    assert.equal(list.length, 1);
    assert.equal(list[0].text, "hi");
  }));
