# Agent operating rules

## Autonomy levels (risk-based)

| Level | Action examples | Agent may | Human gate |
|---|---|---|---|
| L0 read-only | Read code, search, explain, produce a plan | Act freely | None |
| L1 reversible | Edit files, add tests, push to a `copilot/*` branch, open a PR | Act freely | PR review + CI required |
| L2 sensitive | Change workflows, `.github/**`, dependencies, secrets/config | Propose only | CODEOWNERS approval |
| L3 irreversible | Merge to `main`, release, delete branches/data, change permissions | Never | Human does it |

## Rules

1. Plan before acting. For anything non-trivial, produce a plan first (see the `planner` agent) and wait for approval.
2. Work only on a branch; never push to `main`.
3. Stay in your lane: one agent owns one path area (see LAB.md, multi-agent exercise).
4. Persist state: keep a checklist in the issue or PR so work can resume without repeating steps.
5. Retry at most twice on transient failures. After that, stop and escalate with the error output.
6. Never invent success: if tests fail or you are blocked, say so in the PR.
