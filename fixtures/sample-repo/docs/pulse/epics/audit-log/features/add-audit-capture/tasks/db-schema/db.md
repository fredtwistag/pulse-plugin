---
kind: db
created: 2026-05-03
updated: 2026-05-06
links:
  parent: db-schema
---

# Audit events — schema

```mermaid
erDiagram
  organizations ||--o{ audit_events : has
  users ||--o{ audit_events : performs

  audit_events {
    uuid id PK
    uuid organization_id FK
    uuid actor_id FK
    text action
    uuid target_id
    text target_type
    jsonb payload
    timestamptz created_at
  }
```

## Notes

- `payload` is intentionally untyped JSONB — admin actions vary widely; structured columns would force a schema-per-action.
- Index on `(organization_id, created_at desc)` is the only one we add in v1; viewer queries are always filtered by org first.
