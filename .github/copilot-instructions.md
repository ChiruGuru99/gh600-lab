# Repo-wide instructions (loaded for every Copilot request)

- Zero runtime dependencies. Use Node built-ins only. Never add a package without asking.
- ES modules, Node 20+. Run `npm test` before opening or updating a PR; it must pass.
- Every behavior change needs a test in `test/`.
- Keep changes inside the files the task names. Do not reformat unrelated code.
- Record plan, progress and decisions in the issue/PR, not only in chat.
- Read `AGENTS.md` for autonomy levels and what needs a human.
