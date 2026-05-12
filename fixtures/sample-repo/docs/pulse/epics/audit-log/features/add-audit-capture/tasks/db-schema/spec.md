---
id: db-schema
type: task
status: shipped
owners: [joao]
created: 2026-05-03
updated: 2026-05-06
acceptance:
  - "[x] audit_events table created with organization_id, actor_id, action, target_id, target_type, payload, created_at"
  - "[x] Index on (organization_id, created_at desc) for paginated views"
  - "[x] Backfill migration leaves existing data untouched"
links:
  parent: add-audit-capture
  adr: [ADR-001-audit-storage]
  related: []
artifacts:
  db: ./db.md
---

# DB schema for audit events

## Context

We need a place to store admin actions per organization. ADR-001 settled on a single Postgres table in the existing database rather than a separate event store.

## Requirements

- Columns: id (uuid), organization_id, actor_id, action, target_id, target_type, payload (jsonb), created_at.
- Index on `(organization_id, created_at desc)` to support paginated viewer queries.
- Migration must be safe to run while the app is live.

## Edge cases

- Some legacy admin endpoints don't have an `organization_id` in scope — these are tracked separately and excluded from this epic.

## Open questions

- None remaining.
