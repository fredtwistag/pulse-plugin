---
id: middleware-instrumentation
type: task
status: active
owners: [joao]
created: 2026-05-05
updated: 2026-05-11
acceptance:
  - "[x] Single middleware captures create/update/delete/role-change actions"
  - Per-action capture overhead stays under 5ms p95 in load tests
  - Failure to write an audit event is logged but does not block the action
links:
  parent: add-audit-capture
  adr: [ADR-001-audit-storage]
  related: [db-schema]
artifacts:
  api: ./api.md
---

# Middleware instrumentation

## Context

Now that the `audit_events` table exists (see [db-schema](/tasks/db-schema)), every admin action must funnel through a single middleware that writes to it. Per ADR-001 the write is in the same transaction as the underlying action; the middleware decides what payload to capture.

## Requirements

- Wrap all admin routes through `withAuditCapture(action)`.
- Action name comes from the route's contract — not from the URL string — so refactors don't silently break audit names.
- Payload diff only — never dump the whole entity (privacy concern, also avoids unbounded payloads).
- Capture happens after the action's transaction succeeds. Failure-to-audit fires a structured warn log but never rolls back the action itself (per ADR-001's consequence note).

## Edge cases

- Role changes can affect multiple `organization_id`s atomically — the middleware must emit one event per affected org.
- Bulk operations: emit one event per item with a `batch_id` payload field linking them.
- Soft deletes vs hard deletes: both are captured with `action: 'delete'` and a `payload.mode` distinguishing them.

## Open questions

- Whether to emit events for read-only admin actions (impersonation, exports). Decision deferred to the next sprint.
