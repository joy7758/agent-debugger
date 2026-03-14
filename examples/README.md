# Examples

This directory contains trace fixtures that future adapters, validators, and UI code should use as baseline test data.

## Fixtures
- `happy-path.json`: successful run with a file change
- `tool-retry-failure.json`: tool fails twice and the run ends in error
- `context-window-failure.json`: model call fails because context exceeds the limit
- `invalid-missing-runid.json`: intentionally invalid trace for schema rejection tests
