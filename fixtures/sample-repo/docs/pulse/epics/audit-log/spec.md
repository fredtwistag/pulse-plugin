---
id: audit-log
type: epic
status: active
owners: [fred, joao]
created: 2026-05-01
updated: 2026-05-12
acceptance:
  - Every admin action on an organization is captured with actor + target + timestamp
  - Per-organization filtering and CSV export available to admins
  - Retention policy is configurable per-organization
links:
  parent: null
  related: []
---

# Audit log epic

## Why

Compliance team flagged that admin actions on organizations are not currently traceable. Clients in regulated industries (healthcare, finance) need a clear paper trail for SOC 2 Type II.

## Scope

- Capture every admin action through a single instrumentation point.
- Per-organization view with filters (actor, action, date range).
- CSV export.
- Retention configurable per org.

## Out of scope

- Customer-facing activity logs (separate product).
- Real-time alerting on suspicious patterns (security team owns that).

## Features

- [add-audit-capture](./features/add-audit-capture/spec.md)
- [audit-viewer-ui](./features/audit-viewer-ui/spec.md)

## Constraints & assumptions

- Capture must add ≤5ms p95 to admin endpoints.
- Logs land in the same Postgres as the rest of the app; no separate audit DB in v1.
