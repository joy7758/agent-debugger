# Event Schema

## Goal
The event schema defines the smallest stable contract shared by adapters, fixtures, and the UI. v0.1 optimizes for completed LangGraph runs stored as local JSON files.

## Canonical Trace Envelope
Each trace file is a single JSON document with three top-level keys:

```json
{
  "schemaVersion": "0.1.0",
  "run": {},
  "events": []
}
```

See [`trace.schema.json`](/Users/zhangbin/GitHub/agent-debugger/core/event-schema/trace.schema.json) for a machine-readable version.

## Run Metadata
`run` captures stable metadata about the execution:

- `runId`: unique per run
- `framework`: `langgraph` in v0.1
- `status`: `ok`, `error`, or `cancelled`
- `startedAt` and `endedAt`: ISO-8601 UTC timestamps
- `workflow.name`: human-facing workflow or graph name
- `workspace.root`: absolute path to the inspected repository
- `source`: where the trace came from, such as `langgraph.callback`

## Event Model
Each entry in `events` is ordered by `seq` and timestamped with `ts`.

Required fields:
- `id`: unique within the run
- `seq`: monotonically increasing integer
- `ts`: ISO-8601 UTC timestamp
- `kind`: normalized event kind
- `level`: `info`, `warning`, or `error`
- `actor`: the logical producer of the event

Useful optional fields:
- `parentId`: direct causal parent
- `relatedEventIds`: sibling or derived correlations
- `attempt`: retry attempt number starting from `1`
- `durationMs`: duration for completed or failed span events
- `payload`: structured details for the UI

## Normalized Event Kinds
v0.1 supports the following core kinds:

- `run.started`
- `run.completed`
- `run.failed`
- `node.started`
- `node.completed`
- `node.failed`
- `tool.started`
- `tool.completed`
- `tool.failed`
- `model.started`
- `model.completed`
- `model.failed`
- `file.changed`
- `artifact.created`
- `log.message`

Adapters may preserve framework-specific details under `payload.native`, but the UI should rely only on normalized fields for primary rendering.

## Invariants
- `seq` defines timeline order even if timestamps are identical.
- Every `*.completed` or `*.failed` event should point back to its start event through `parentId` or `relatedEventIds`.
- `file.changed` is emitted when the adapter can identify a file mutation or post-run diff result.
- Unknown fields are allowed inside `payload`.
- Schema additions must be backward-compatible within the same `schemaVersion`.

## Example
```json
{
  "id": "evt_008",
  "seq": 8,
  "ts": "2026-03-14T10:31:24.128Z",
  "kind": "tool.completed",
  "level": "info",
  "actor": {
    "type": "tool",
    "id": "tool:write_file",
    "name": "write_file"
  },
  "parentId": "evt_007",
  "durationMs": 42,
  "payload": {
    "tool": {
      "name": "write_file",
      "args": {
        "path": "README.md"
      }
    }
  }
}
```
