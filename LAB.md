# GH-600 Hands-on Lab

A tiny Notes API (`src/server.js`, zero dependencies) used as a **practice target**. The app is not the point.
The point is the agent setup around it: instructions, custom agents, MCP, setup steps, rulesets, scanning.

Verify product details against the docs as you go (features move fast; GH-600 may include Preview features):
<https://docs.github.com/copilot> (cloud agent, custom agents, MCP, memory, risks and mitigations).

## 0. Setup (do once)

1. Create a GitHub repo from this folder (private is fine; a personal account works for most exercises).
   `git init` is done locally; commit, create the remote and push yourself, or tell Claude to and approve each push.
2. Enable Copilot (Pro/Pro+/Business/Enterprise) and the **Copilot cloud agent** for the repo
   (org owners: Settings > Copilot > Policies; individuals: your Copilot settings).
3. Settings > Rules > Rulesets: protect `main`
   - require a PR, require 1 approval, require status checks `test` and `analyze`, block force pushes.
4. Settings > Environments: create an environment named `copilot` (cloud agent secrets/variables live here).
5. Run the `Copilot Setup Steps` workflow manually once (Actions tab) to confirm it passes.
6. Create labels used below. Open issues L-1..L-4 using the **Agent task** template (text below).

Take notes in `NOTES.md` as you go: what you did, what you observed, what surprised you. That is your exam memory.

---

## Domain 1: Agent architecture and SDLC (15-20%)

**Concepts:** structured task (inputs/outputs/success criteria), plan vs act separation, plan validation, approval gate, inspectable artifacts.

**L-1 (issue text):** *Goal:* `POST /notes` rejects invalid input. *Inputs:* `src/server.js` POST handler. *Success:* invalid JSON returns 400; missing/non-string/empty `text` returns 400; valid still returns 201; tests cover all three. *Constraints:* only `src/**`, `test/**`. *Autonomy:* L1.

Exercise:
1. In VS Code Copilot Chat, pick the **planner** agent, give it L-1. It must return the structured plan and touch nothing.
2. Validate the plan yourself: right files? every success criterion has a step? anything flagged L2/L3?
3. Paste the approved plan into the issue as a comment. Assign L-1 to Copilot (cloud agent).
4. Watch the session log and PR. Note the artifacts: branch `copilot/*`, commits, PR description checklist, session log.

Check yourself: Which artifact would you point an auditor to? Why did the planner have no `edit` tool? What would an *anti-pattern* version of L-1 look like (vague goal, no criteria, all tools)?

---

## Domain 2: Tool use and environment interaction (20-25%)

**Concepts:** tool allowlists, MCP servers/registries/allow lists, GitHub remote MCP, repo scope, branch scope, setup steps, firewall, CI invocation, autonomous branch/PR creation, error handling and escalation.

Exercises:
1. **Tool permissions.** Compare `tools:` in the three agent files. Change `reviewer` to add `edit`, observe it now *can* alter code, then revert. Rule: least privilege per role.
2. **GitHub remote MCP (local).** Open the repo in VS Code; `.vscode/mcp.json` points at `https://api.githubcopilot.com/mcp/`. Start the server, authorize, ask chat to "list open issues in this repo".
3. **MCP for the cloud agent.** Repo Settings > Copilot > Cloud agent > MCP configuration. Example JSON (check current schema in docs):
   ```json
   {
     "mcpServers": {
       "everything": {
         "type": "local",
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-everything"],
         "tools": ["echo"],
         "env": {}
       }
     }
   }
   ```
   Note `tools` is an allowlist. Any secret goes in the `copilot` environment as `COPILOT_MCP_<NAME>`.
4. **MCP registry / allow list (org only).** If you have an org: Copilot policies > MCP servers. Practice the scenario "only vetted servers allowed". If not, write 3 sentences on how you'd do it.
5. **Setup steps.** Edit `copilot-setup-steps.yml`; add `npm test` as a step. Confirm the job name must stay `copilot-setup-steps`. Break it (bad Node version), run it, read the failure.
6. **Firewall.** Add L-2: *"add a `/version` endpoint that fetches https://example.com/ and returns its status"* (contrived). Watch whether the agent's network call is blocked, then read how allowlists/setup steps fix it.
7. **CI + autonomy.** On the agent's PR, notice workflows may need a human "Approve and run". Then check the docs on who may approve an agent PR (the person who asked for it generally can't be the required approver).
8. **Error paths.** In `AGENTS.md` rule 5 (retry twice, then escalate). Cause a persistent failure (see Domain 4) and check whether the agent follows it.

Check yourself: repo scope vs branch scope; why `copilot/*` branches; where MCP secrets live; what setup steps can and can't do.

---

## Domain 3: Memory, state, execution (10-15%)

**Concepts:** short/long/external memory, scoping, expiry, durable artifacts, resumption, drift, stale/conflicting context.

Exercises:
1. **Instruction layers.** Identify which file applies when: `copilot-instructions.md` (always), `instructions/tests.instructions.md` (`applyTo: test/**`), `AGENTS.md`. Ask an agent to edit a test; confirm path-specific rules show up in behavior.
2. **Durable state.** For L-3 (below), require a PR checklist as the progress record. Interrupt: close the session halfway (or stop after step 1), then start a new session pointing only at the PR. Does it resume without redoing step 1?
3. **Stale context.** Mid-task, change `copilot-instructions.md` (e.g. "use 2-space indent" to "tabs"). Which run saw old vs new? Write down how you'd prevent stale context (single source of truth: the repo file, not chat).
4. **Conflicting context.** Add a contradiction (instructions say "no dependencies"; issue says "use express"). Observe what the agent does. Fix by removing the conflict at its source.
5. **Copilot Memory.** Read <https://docs.github.com/copilot/concepts/agents/copilot-memory>. Note scope (repo), validation against current code, expiry. Decide: what belongs in memory vs instructions vs an issue?

---

## Domain 4: Evaluation, error analysis, tuning (15-20%)

**Concepts:** success criteria, quantitative/qualitative signals, automated scanning as signal, failure classification, targeted tuning.

**L-2b (security signal):** *"Add `GET /files?name=` returning a file from `./public`."* This naturally invites path traversal. Open the PR, let **CodeQL** run, read the alert, then have the agent fix it. Record: signal source, finding, fix.

**Failure lab.** Inject one failure at a time, run an agent on L-3, and fill this table in `NOTES.md`:

| Injected failure | Symptom | Root cause class | Targeted fix |
|---|---|---|---|
| Remove `execute` from `implementer` | Can't run tests, claims done | Tool misuse / missing tool | Restore tool access |
| Instruction says "tests live in `spec/`" (wrong) | Tests in wrong dir, CI misses them | Context (bad instruction) | Fix instruction |
| Bad Node version in setup steps | Env errors, can't run | Environment | Fix setup steps |
| Vague issue "make notes better" | Scope creep / wrong feature | Reasoning (underspecified task) | Rewrite with criteria |

Rule: classify first (reasoning vs tool vs context/environment), then change the *smallest* thing that addresses that class. Do not rewrite everything.

Signals to list for exam: CI pass rate, CodeQL alerts, review rounds, retries, diff size vs plan, time to merge.

---

## Domain 5: Multi-agent coordination (15-20%)

**Concepts:** orchestration patterns, isolation, conflict detection, audit artifacts, failure recovery, agent lifecycle.

Issues:
- **L-3:** `DELETE /notes/:id` (204 on success, 404 unknown) + tests. Owns `src/**`, `test/**`.
- **L-4:** `docs/API.md` documenting all endpoints. Owns `docs/**`. Reads `src/**`, edits nothing there.

Exercises:
1. **Pipeline pattern.** planner -> implementer -> reviewer on L-3. Run each as its own step; hand artifacts forward via the issue/PR. Note the handoffs you documented.
2. **Parallel + isolation.** Assign L-3 and L-4 to Copilot at the same time. Confirm separate `copilot/*` branches and PRs (isolation). Merge both: no conflict because ownership paths don't overlap.
3. **Deliberate conflict.** Now give two agents tasks that both edit `src/server.js` (e.g. DELETE route and a `/notes/:id` GET). Merge one, then see the conflict on the other. Practice: detect (merge conflict / overlapping diff), resolve (rebase, reassign, or sequence), prevent (ownership boundaries).
4. **Failure handling.** Cancel a run midway (stalled/partial). Decide: resume from PR checklist, roll back (close PR, delete branch), or escalate to a human.
5. **Lifecycle.** Add a new `docs.agent.md` (tools: read, search, edit; edits `docs/**` only). Update `implementer` (tighten a rule) while a run is active: existing runs keep their old config, new runs use the new one. Retire an agent by removing the file, and confirm its PRs/logs remain as audit history.

Check yourself: orchestrator-worker vs pipeline vs fan-out; why isolation is per-branch; what must be preserved when retiring an agent.

---

## Domain 6: Guardrails and accountability (10-15%)

**Concepts:** risk-based autonomy, human-in-the-loop only where it matters, least privilege, blocking policy violations, controlled paths for irreversible actions.

Exercises:
1. **Autonomy matrix.** Read `AGENTS.md` table. Classify five actions of your own (e.g. add test = L1, bump a dependency = L2, publish release = L3) and justify.
2. **Block L2.** Add `.github/CODEOWNERS` with `.github/** @<your-username>` and in the ruleset enable "Require review from Code Owners". Then give an agent a task that tempts it to edit `.github/workflows/ci.yml`; confirm the PR is blocked until you review.
3. **Irreversible path.** Add an environment `production` with required reviewers; make a (dummy) deploy job reference it. Confirm nobody (agent included) can deploy without approval.
4. **Don't over-gate.** List approvals you would remove (e.g. human sign-off on a test-only PR when CI + CodeQL pass). Exam theme: approvals that don't reduce risk only slow delivery.
5. **Read** the cloud agent "risks and mitigations" doc and map each risk to a control you built here.

---

## Exam objective to lab map

| Exam skill | Where practiced |
|---|---|
| Inputs/outputs/success criteria, anti-patterns | D1, issue template |
| Plan vs action, validate plan, block action until approved | D1 planner agent |
| Observability, inspectable artifacts, HITL without slowing delivery | D1, PR template |
| Tool selection/permissions | D2.1 |
| MCP: add server, GitHub remote, registry, allow list | D2.2-D2.4 |
| Repo/branch scope, CI invocation, autonomous PRs, environment constraints | D2.5-D2.7 |
| Errors, retries, rollback, escalation, traceability | D2.8, D5.4 |
| Memory choice, scoping, expiry | D3.1, D3.5 |
| Durable state, resume, drift | D3.2-D3.4 |
| Success signals, scanning tools | D4 (CodeQL) |
| Failure root causes, tuning | D4 failure lab |
| Orchestration, isolation, conflicts | D5.1-D5.3 |
| Multi-agent observability, recovery, lifecycle | D5.1, D5.4, D5.5 |
| Autonomy levels, least privilege, HITL, irreversible actions | D6 |
