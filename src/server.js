import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

// In-memory notes API. Deliberately incomplete: the lab issues ask Copilot to extend it.
export function createApp() {
  const notes = new Map();
  let nextId = 1;

  const send = (res, code, body) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://x");

    if (req.method === "GET" && pathname === "/health") return send(res, 200, { ok: true });

    if (req.method === "GET" && pathname === "/notes") return send(res, 200, [...notes.values()]);

    if (req.method === "POST" && pathname === "/notes") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const { text } = JSON.parse(raw); // LAB ISSUE 1: no validation, bad JSON crashes the request
      const note = { id: nextId++, text };
      notes.set(note.id, note);
      return send(res, 201, note);
    }

    send(res, 404, { error: "not found" });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createApp().listen(process.env.PORT ?? 3000);
}
