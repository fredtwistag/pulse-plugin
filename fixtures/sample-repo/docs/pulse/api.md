# API

The application's public API is JSON-over-HTTPS, versioned by URL prefix (`/v1/…`), authenticated by short-lived bearer tokens.

## Conventions

- **Verbs in the URL are forbidden.** `POST /v1/orgs/:id/invite` is wrong; `POST /v1/orgs/:id/invitations` is right. Resources, not actions.
- **Pagination is cursor-based.** Page-number pagination is forbidden for list endpoints — it does not scale and exposes ordering invariants we can't promise.
- **Errors are RFC 9457 problem details.** `application/problem+json`, with a `type:` URI, a stable `title:`, and a free-form `detail:`.
- **No `null` for optional fields.** Omit the field. Clients should never have to disambiguate "missing" from "null".

## Stability tiers

- **Stable.** Documented in the OpenAPI spec, breaking changes require a deprecation cycle. `/pulse-guard`'s data-api-safety check enforces this.
- **Beta.** Documented but explicitly marked `x-beta: true` per operation. Breaking changes require notice but not a deprecation cycle.
- **Internal.** Not in the public OpenAPI; no compatibility guarantees.

## Auth

- Bearer tokens, ~15-minute lifetime, refreshed via a single-use refresh token.
- All admin endpoints additionally check organization role via middleware (see [middleware-instrumentation](/tasks/middleware-instrumentation)).
