---
id: add-audit-capture
type: feature
status: active
owners: [joao]
created: 2026-05-02
updated: 2026-05-10
acceptance:
  - Single middleware captures every admin action
  - Capture overhead ≤5ms p95 measured under load
  - Tests cover create / update / delete / role-change actions
links:
  parent: audit-log
  related: []
---

# Add audit capture

## What

A single middleware layer that records admin actions into the `audit_events` table without each route having to remember to log.

## Tasks

- [middleware-instrumentation](./tasks/middleware-instrumentation/spec.md)
- [db-schema](./tasks/db-schema/spec.md)

## Non-goals

- No retention enforcement in this feature — handled by a separate job.
