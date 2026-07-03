---
name: deploy-smoke-check
description: Walks through verifying or extending the production smoke test in .github/workflows/deploy-production.yml (port-forward, /-/health poll, CSP header check, /sitemap.xml check) and the "check RBAC verbs first" habit whenever those steps change. This concerns production deploy verification for the live complyeaze-tools Kubernetes footprint, so only invoke it when a person explicitly asks — do not trigger it automatically.
disable-model-invocation: true
---

# Deploy smoke check

`deploy-production.yml` is manual-dispatch-only and is the last gate before
`tools.complyeaze.com` actually changes. Its final step, "Service smoke
checks", is the only thing standing between "the manifests applied cleanly"
and "the site is actually serving traffic correctly." Treat any change to
that step as a change to production verification itself, not a cosmetic
workflow edit.

Re-read `.github/workflows/deploy-production.yml` and
`tests/config/tools-kubernetes.test.ts` before relying on any specifics
below — this repo evolves via frequent automated PRs and the exact strings
may have moved.

## 1. What the smoke test actually checks today

After `kubectl apply` and `kubectl rollout status`, the "Service smoke
checks" step does, in order:

1. **Port-forward**: backgrounds
   `kubectl -n "${NAMESPACE}" port-forward service/complyeaze-tools 18080:80`,
   logging to `/tmp/complyeaze-tools-port-forward.log`, with a `trap` to kill
   the port-forward PID on exit.
2. **Poll `/-/health`**: loops up to 20 times, 1s apart, curling
   `http://127.0.0.1:18080/-/health` and requiring the literal body `ok`
   (`grep -Fx "ok"`). If the port-forward process dies mid-poll, it dumps the
   port-forward log and exits 1 immediately rather than exhausting the loop.
3. **Require healthy**: fails the job if the health poll never succeeded.
4. **CSP header check**: `curl -fsSI http://127.0.0.1:18080/` (a HEAD
   request) and greps case-insensitively for `content-security-policy` —
   this only confirms the header is *present*, not its contents.
5. **Sitemap check**: `curl -fsSL http://127.0.0.1:18080/sitemap.xml` and
   greps for the literal string `https://tools.complyeaze.com` — a cheap
   proof the correct site is actually being served (not a stale/wrong build).

`tests/config/tools-kubernetes.test.ts` pins several of these as literal
substrings of the workflow file: `"Service smoke checks"`,
`"port-forward service/complyeaze-tools 18080:80"`,
`"complyeaze-tools-port-forward.log"`, and
`"http://127.0.0.1:18080/-/health"`. Any edit to the port number, health
path, service name, or log filename must update the matching assertion in
that test file in the same change, or `pnpm scan:k8s` will fail.

## 2. Check RBAC verbs FIRST, before touching the workflow

This is the recurring failure mode: someone extends what the smoke-test step
curls, port-forwards, or otherwise queries against the live cluster, ships
the workflow change, and only then discovers the deploy pipeline's
ServiceAccount lacks the Kubernetes permission to do it — a hotfix follows.

Before editing anything the smoke-test step does against the cluster, read
`deploy/k8s/deploy-access/role.yaml` and confirm the `complyeaze-tools-deployer`
Role (namespace `complyeaze-tools`) already grants the verb you need. See
`deploy/CLAUDE.md` ("Kubernetes: least-privilege deploy-access pattern") for
the current verb table — read `role.yaml` directly rather than trusting a
copy here, since it drifts.

It explicitly does **not** grant `secrets` or `namespaces` access, and it is
a namespaced `Role`/`RoleBinding` — never a `ClusterRole`/`ClusterRoleBinding`.
Keep it that way; this is asserted directly in
`tests/config/tools-kubernetes.test.ts` (`role).not.toContain("secrets")`,
`role).not.toContain("namespaces")`,
`role).not.toContain("kind: ClusterRole")`,
`roleBinding).not.toContain("kind: ClusterRoleBinding")`).

If a new or changed smoke-test step needs a verb the Role doesn't already
have — for example, reading a new resource type, execing into a pod, tailing
logs, or watching events — add exactly that verb to `role.yaml`, nothing
broader, and:

1. Update `tests/config/tools-kubernetes.test.ts` in the same change to
   assert the new `resources: [...]`/verb combination, so the test would
   actually fail if the permission were later dropped.
2. Never add `secrets` access, never widen to a `ClusterRole`, never touch
   `deploy/k8s/deploy-access/service-account.yaml`'s
   `automountServiceAccountToken: false` setting. If the smoke test seems to
   need one of these, stop and flag it as a deliberate escalation requiring
   human sign-off rather than making the change silently.
3. Run `pnpm scan:k8s` (`vitest run tests/config/tools-kubernetes.test.ts`)
   and confirm it passes against both the updated `role.yaml` and the
   updated workflow.

## 3. Order of operations for any smoke-test change

1. Read `deploy/k8s/deploy-access/role.yaml` and
   `tests/config/tools-kubernetes.test.ts` first — before touching
   `deploy-production.yml` — to know what's already permitted.
2. Make the workflow change.
3. If it needs a new verb, update `role.yaml` and the matching test
   assertions in the same commit.
4. Run `pnpm scan:k8s`. Treat a failure as blocking.
5. If you can exercise this against a real or staging cluster, prefer doing
   so over reasoning about it in the abstract — port-forward and curl
   locally against a deployed service before trusting a workflow-only
   review. If no live cluster is reachable from this environment, say so
   explicitly rather than silently skipping verification.
6. Summarize exactly which smoke-test behavior changed, which RBAC verbs (if
   any) were added, and which files were updated to match, in your final
   response.
