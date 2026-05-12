# Pulse — Guard override audit log

This file is append-only. Every Guard override gets one entry. The Pulse Dashboard reads this file directly and renders it at `/audit`.

Entries are individual fenced ```yaml``` blocks. Schema:

```text
sha: <full-git-sha>
base: <base-branch>
engineer: <git-user>
check: <check-id>
reason: <free-text, required>
second_engineer: <name>   # required for checks in overrides.require_second_engineer
created: <ISO-8601>
```

---

## 2026-05-10T17:50:18Z — joao — security-regression

```yaml
sha: 9f8e7d6c5b4a3928176543210fedcba987654321
base: main
engineer: joao
check: security-regression
reason: "Banned literal `Authorization: Bearer dev-token` appears in src/test-helpers/admin-client.ts. The banned-patterns rule currently does not distinguish test helpers from production code; the literal is gated behind NODE_ENV !== 'production'. Filing a follow-up to refine the rule (PULSE-CFG-12)."
second_engineer: fred
created: 2026-05-10T17:50:18Z
```
