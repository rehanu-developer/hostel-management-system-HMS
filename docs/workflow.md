# Workflow

## Branch model

```
main                       ← protected. Never commit directly.
  └─ feature/finance-section   ← current working branch (all recent work)
       ├─ feature/<next>        ← new work goes on its own branch
       └─ fix/<short>           ← bug fixes
```

### Rules
1. **Default = feature branch.** Never commit to `main` without explicit user
   instruction.
2. Branch naming: `feature/<short>`, `fix/<short>`, `chore/<short>`, `experiment/<short>`.
3. **Push the feature branch** to GitHub (`origin`), not `main`.
4. **Wait for "merge to main" / "deploy to main"** before merging.
5. Read `.cursorrules` for the same rules in AI-assistant format.

## Commit style

Conventional Commits with scope:

```
feat(finance): Export button + pagination
fix(hostels): move targetRoom pre-fill effect below declaration
refactor(sidebar): split logo + title into row layout
docs(workflow): document branch model + deploy flow
chore(deps): bump vite to 8.x
```

Body explains **why** (not what). Include affected files when non-obvious.

## Deploy flow

The project's production host is `*.space.minimax.io` (one URL per deploy).
Deploy is triggered by the `website_deploy` tool, NOT by `git push`.

```bash
# 1. Work on the feature branch
git checkout feature/<short>
# ... edit, commit, push ...

# 2. Verify locally
npm run build
# + Playwright headless smoke test of the affected route

# 3. Deploy
# (website_deploy tool, with path=./dist, source_path=./, project_name=...)

# 4. Verify deployed URL
# Playwright headless against https://<id>.space.minimax.io/<route>

# 5. Report back to the user with the new URL

# 6. ONLY after user says "merge to main" or "deploy to main":
git checkout main
git pull origin main
git merge feature/<short>
git push origin main
```

The user explicitly controls merging. This is a hard rule.

## Verification checklist

Before claiming work is done:

- [ ] `npx tsc --noEmit` passes
- [ ] `npx vite build` succeeds
- [ ] Playwright headless renders the affected route(s) — no `pageerror`
- [ ] Primary happy path still works (e.g., add nomad → appears in list)
- [ ] Existing tabs / sheets / nav still work (no regressions)
- [ ] Toast + nav side-effects work

## Common pitfalls in this sandbox

1. **Bash working directory resets to `/root` between calls** — always
   prefix commands with `cd /workspace/hostel-manager && ...`.
2. **GitHub proxy CA cert expires** — re-extract as shown in
   `architecture.md` if `git push` starts failing with cert errors.
3. **Dev server is process-per-session** — use `nohup ... &` or
   `setsid -f` so it doesn't die when the bash exits.
4. **`pgrep`/`pkill` available** — kill stale dev servers before starting
   fresh ones.
