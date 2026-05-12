---
id: ADR-001-audit-storage
type: adr
status: accepted
owners: [joao]
created: 2026-05-02
updated: 2026-05-02
links:
  task: db-schema
  supersedes: null
  superseded-by: null
  related: []
---

# ADR-001 — Audit events storage

## Context

The `audit-log` epic needs persistent storage for admin actions. Compliance team specifies "queryable, retentionable, exportable" but no hard latency target. We have an existing Postgres database used by the rest of the app.

## Options considered

### Option A — Single Postgres table in the existing DB

Pros: simple, transactional with the action being audited, no new infra.
Cons: long-term storage cost grows with the main DB; eventual archival job needed.

### Option B — Dedicated event store (e.g. ClickHouse)

Pros: scales for high-volume audit data; great for analytics later.
Cons: new infra, new operational burden, eventual-consistency vs the action being audited.

### Option C — Append-only log (e.g. Kafka + S3)

Pros: cheapest at scale, easy to retain forever.
Cons: dramatically harder to query for the v1 viewer UI; replay-based.

## Decision

**Chosen: Option A — single Postgres table in the existing DB.**

Volume estimates from the metrics team show <10M rows/year per org at p95 — well within Postgres territory. Transactional consistency with the actions being audited is a clearer win than future scale concerns we'll only hit at year 3+. We'll revisit if Option A starts hurting.

## Consequences

- Audit writes are in the same transaction as the action — slight overhead but invariant correctness.
- Archival job needed once `audit_events` exceeds ~50M rows.
- The viewer UI can use the same DB connection pool; no separate adapter.
