# Agent-Debugger

**Debug AI agents like you debug code.**

Agent-Debugger is a local-first debugging tool for AI coding workflows. It helps you inspect what an AI agent did, what it changed, and where a run went wrong.

This repository currently contains the v0.1 product slice, core contracts, trace fixtures, and a minimal runnable local preview.

## Why Agent-Debugger?
Once an AI agent starts reading files, calling tools, and retrying actions, raw logs stop being enough. You need to see which steps ran, which files changed, and where execution started to drift. Agent-Debugger is built to make that inspection faster and clearer.

## Core Value
- **Tool-Call Timeline**: Inspect agent actions and API calls in chronological order.
- **File Diff Correlation**: Connect agent activity directly to the code it changed.
- **Failure Focus**: Instantly locate failed steps, context limit errors, and blocked tool retries.

## Who is this for?
- Developers building autonomous agents or AI coding workflows.
- Teams reviewing and inspecting agent-driven code changes.
- Engineers who need practical, local visibility into complex AI execution.

## Scope (v0.1)
### Included
- LangGraph adapter for completed runs
- Standard local trace format
- VS Code extension inspector
- Tool-call execution timeline
- File diff correlation views
- Failure state highlighting
- Local-first storage under `.agent-debugger/runs/`

### Not Included
- LangChain adapter
- Live streaming of in-flight runs
- Execution replay
- Deep reasoning/LLM attention visualization
- Enterprise governance UI
- Custom tracing backend infrastructure
- Broad multi-platform observability claims

## Architecture Overview
Agent-Debugger v0.1 follows a narrow local workflow:

1. A **LangGraph Adapter** emits a completed run trace as JSON.
2. The trace is validated against the **Standard Event Schema** in [`core/event-schema/trace.schema.json`](/Users/zhangbin/GitHub/agent-debugger/core/event-schema/trace.schema.json).
3. The trace is stored locally in `.agent-debugger/runs/`.
4. A **VS Code extension** loads that trace and renders timeline, file, and failure views.

The first version is intentionally post-run and file-based. Live streaming can be added later if the static workflow proves useful.

## Repo Map
- [`core/event-schema/README.md`](/Users/zhangbin/GitHub/agent-debugger/core/event-schema/README.md): canonical trace model
- [`core/event-schema/trace.schema.json`](/Users/zhangbin/GitHub/agent-debugger/core/event-schema/trace.schema.json): runtime validation contract
- [`examples/traces`](/Users/zhangbin/GitHub/agent-debugger/examples/traces): sample fixtures for implementation and tests
- [`test/trace.test.js`](/Users/zhangbin/GitHub/agent-debugger/test/trace.test.js): minimal automated acceptance harness

## Trust Statement
Your code and execution traces stay on your machine.

- **Local-First**: The tool runs strictly where your code runs.
- **No Source Upload by Default**: Source code is analyzed locally unless you explicitly export data.
- **Minimal Permissions**: Operates entirely within the narrowest possible local boundary.
- **Transparent Event Model**: All collected execution events remain open, inspectable, and understandable.

## Status
⚠️ **Early stage. A minimal runnable v0.1 slice exists and broader implementation is still in progress.**

## Early Local Preview
1. Run `npm install`
2. Run `npm run compile`
3. Open this repo in VS Code and launch `Run Agent Debugger Extension`
4. In the Extension Development Host, run one of:
   - `Agent Debugger: Load Happy Path Trace`
   - `Agent Debugger: Load Tool Retry Failure Trace`
   - `Agent Debugger: Load Context Window Failure Trace`
