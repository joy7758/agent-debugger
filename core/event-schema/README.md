# 事件 Schema / Event Schema

## 目标 / Goal
事件 schema 定义了适配器、fixture 和 UI 之间共享的最小稳定契约。v0.1 针对以本地 JSON 文件存储的、已完成的 LangGraph 运行做了优化。  
The event schema defines the smallest stable contract shared by adapters, fixtures, and the UI. v0.1 optimizes for completed LangGraph runs stored as local JSON files.

## 标准 Trace 包装结构 / Canonical Trace Envelope
每个 trace 文件都是一个单独的 JSON 文档，包含三个顶层字段：  
Each trace file is a single JSON document with three top-level keys:

```json
{
  "schemaVersion": "0.1.0",
  "run": {},
  "events": []
}
```

机器可读版本见 [`trace.schema.json`](/Users/zhangbin/GitHub/agent-debugger/core/event-schema/trace.schema.json)。  
See [`trace.schema.json`](/Users/zhangbin/GitHub/agent-debugger/core/event-schema/trace.schema.json) for a machine-readable version.

## 运行元数据 / Run Metadata
`run` 用于描述执行过程中的稳定元数据：  
`run` captures stable metadata about the execution:

- `runId`: 每次运行唯一。 / Unique per run.
- `framework`: 在 v0.1 中固定为 `langgraph`。 / `langgraph` in v0.1.
- `status`: `ok`、`error` 或 `cancelled`。 / `ok`, `error`, or `cancelled`.
- `startedAt` 和 `endedAt`: ISO-8601 UTC 时间戳。 / ISO-8601 UTC timestamps.
- `workflow.name`: 面向人的工作流或图名称。 / Human-facing workflow or graph name.
- `workspace.root`: 被检查仓库的绝对路径。 / Absolute path to the inspected repository.
- `source`: trace 来源，例如 `langgraph.callback`。 / Where the trace came from, such as `langgraph.callback`.

## 事件模型 / Event Model
`events` 中的每一项都按 `seq` 排序，并使用 `ts` 记录时间戳。  
Each entry in `events` is ordered by `seq` and timestamped with `ts`.

必填字段 / Required fields:
- `id`: 在当前运行内唯一。 / Unique within the run.
- `seq`: 单调递增的整数。 / Monotonically increasing integer.
- `ts`: ISO-8601 UTC 时间戳。 / ISO-8601 UTC timestamp.
- `kind`: 规范化后的事件类型。 / Normalized event kind.
- `level`: `info`、`warning` 或 `error`。 / `info`, `warning`, or `error`.
- `actor`: 事件的逻辑生产者。 / The logical producer of the event.

有用的可选字段 / Useful optional fields:
- `parentId`: 直接因果父节点。 / Direct causal parent.
- `relatedEventIds`: 同级或派生关联。 / Sibling or derived correlations.
- `attempt`: 从 `1` 开始的重试次数。 / Retry attempt number starting from `1`.
- `durationMs`: 已完成或失败 span 事件的持续时间。 / Duration for completed or failed span events.
- `payload`: 提供给 UI 的结构化细节。 / Structured details for the UI.

## 规范化事件类型 / Normalized Event Kinds
v0.1 支持以下核心事件类型：  
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

适配器可以在 `payload.native` 下保留框架特定细节，但 UI 的主要渲染应只依赖规范化字段。  
Adapters may preserve framework-specific details under `payload.native`, but the UI should rely only on normalized fields for primary rendering.

## 不变量 / Invariants
- `seq` 决定时间线顺序，即使时间戳完全相同。 / `seq` defines timeline order even if timestamps are identical.
- 每个 `*.completed` 或 `*.failed` 事件都应通过 `parentId` 或 `relatedEventIds` 指回其起始事件。 / Every `*.completed` or `*.failed` event should point back to its start event through `parentId` or `relatedEventIds`.
- 当适配器能够识别文件修改或运行后 diff 结果时，应发出 `file.changed`。 / `file.changed` is emitted when the adapter can identify a file mutation or post-run diff result.
- `payload` 内允许存在未知字段。 / Unknown fields are allowed inside `payload`.
- 在同一 `schemaVersion` 内新增 schema 字段必须保持向后兼容。 / Schema additions must be backward-compatible within the same `schemaVersion`.

## 示例 / Example
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
