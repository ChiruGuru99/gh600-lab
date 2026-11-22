---
applyTo: "test/**"
---

# Test rules (path-specific: only applied when Copilot touches test files)

- Use `node:test` and `node:assert/strict` only. No test frameworks.
- Start the app on port 0 via `createApp().listen(0)`; never hardcode ports.
- One behavior per test; name tests after the behavior.
