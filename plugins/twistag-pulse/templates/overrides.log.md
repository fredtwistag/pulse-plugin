# Pulse — Guard override audit log

This file is append-only. Every Guard override gets one entry. The Pulse Dashboard reads this file directly and renders it at `/audit`.

Schema for each entry:

```yaml
- sha: <full-git-sha>
  base: <base-branch>
  engineer: <git-user>
  check: <check-id>
  reason: <free-text, required>
  second_engineer: <name>   # required for checks in overrides.require_second_engineer
  created: <ISO-8601>
```

---

<!-- Entries appended below this line by /pulse-guard --override. Do not edit by hand. -->
