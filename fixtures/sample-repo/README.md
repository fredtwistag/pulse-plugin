# sample-repo

A fixture repo used by the Pulse Dashboard during development. It contains a small but realistic `docs/pulse/` tree so the dashboard has something to render before `/pulse-spec` produces real artifacts.

To regenerate against a real Twistag client repo:

```bash
PULSE_ARTIFACTS_ROOT=/path/to/client-repo/docs/pulse pnpm dev
```
