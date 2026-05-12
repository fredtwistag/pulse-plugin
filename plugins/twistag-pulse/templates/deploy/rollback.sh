#!/usr/bin/env bash
# Pulse — starter rollback script for a Vercel target.
#
# Usage:
#   ./scripts/rollback.sh                  # rolls back to the previous prod deploy
#   ./scripts/rollback.sh <deployment-id>  # rolls back to a specific deployment
#
# Requires VERCEL_TOKEN in the environment. Read .pulse/config.yaml.ship.vercel
# for project + team identifiers (substituted by /pulse-ship at generation time).
set -euo pipefail

VERCEL_PROJECT="${VERCEL_PROJECT:-__PULSE_PROJECT__}"
VERCEL_TEAM="${VERCEL_TEAM:-__PULSE_TEAM__}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN not set. Aborting." >&2
  exit 1
fi

target="${1:-}"

if [[ -z "$target" ]]; then
  # Find the previous successful prod deployment (the one before the current alias).
  echo "Resolving previous production deployment..."
  target=$(pnpm dlx vercel ls "$VERCEL_PROJECT" \
    --scope "$VERCEL_TEAM" \
    --prod --token "$VERCEL_TOKEN" \
    --json \
    | jq -r '.[1].uid')   # [0] is current; [1] is the previous one
fi

if [[ -z "$target" || "$target" == "null" ]]; then
  echo "Could not resolve a rollback target. Pass an explicit deployment id." >&2
  exit 1
fi

echo "Promoting deployment $target to production..."
pnpm dlx vercel promote "$target" \
  --scope "$VERCEL_TEAM" \
  --token "$VERCEL_TOKEN"

echo "Done. Verify in Vercel dashboard, then notify the team."
