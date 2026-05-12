# Database

The project's data model lives in a single Postgres database, accessed through Prisma. We optimize for transactional consistency over scale — see ADR-001 for the audit-events storage decision and the constraints it carried.

## Conventions

- **All IDs are UUIDs.** No bigint surrogate keys, no exposed sequences.
- **Soft deletes are off by default.** A row that's gone is gone; if a domain needs reversible deletion, it owns its own `deletedAt` column and the surrounding read filters.
- **JSONB for free-form payloads, not for typed data.** If a column has a fixed shape, it gets columns. `payload` on audit events is the canonical "you reach for JSONB when the shape genuinely varies" use case.
- **Timezones are UTC at rest.** Conversion happens at the edge.

## Migration policy

- Every migration must run safely while the app is live. NOT NULL without a backfill is a fail in `/pulse-guard` (data-api-safety).
- Index creation on tables over 1M rows uses `CONCURRENTLY`.
- Renames are two-phase: add the new column → backfill → switch reads → drop the old. Never a single-step rename in production.
