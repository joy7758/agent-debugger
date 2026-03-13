# Agent-Debugger

**Debug AI agents like you debug code.**

Agent-Debugger is a local-first debugging tool for AI coding workflows. It helps you inspect what an AI agent did, what it changed, and where a run went wrong.

## Why Agent-Debugger?
Once an AI agent starts reading files, calling tools, and retrying actions, raw logs stop being enough. You need to see which steps ran, which files changed, and where execution started to drift. Agent-Debugger is built to make that inspection faster and clearer.

## Core Value
- **Tool-Call Timeline**: Inspect agent actions and API calls in chronological order.
- **File Diff Correlation**: Connect the agent's reasoning directly to the code it changed.
- **Failure Focus**: Instantly locate failed steps, context limit errors, and blocked tool retries.

## Who is this for?
- Developers building autonomous agents or AI coding workflows.
- Teams reviewing and inspecting agent-driven code changes.
- Engineers who need practical, local visibility into complex AI execution.

## Scope (v0.1)
### Included
- LangGraph / LangChain adapter
- Tool-call execution timeline
- File diff correlation views
- Failure state highlighting
- Local-first trust posture

### Not Included
- Execution replay
- Deep reasoning/LLM attention visualization
- Enterprise governance UI
- Custom tracing backend infrastructure
- Broad multi-platform observability claims

## Architecture Overview
Agent-Debugger connects to your agent framework via **Adapters** to intercept execution traces natively. These traces are normalized into a **Standard Event Schema** and rendered in a local **Timeline / Focus UI** for intuitive inspection.

## Trust Statement
Your code and execution traces stay on your machine.

- **Local-First**: The tool runs strictly where your code runs.
- **No Source Upload by Default**: Source code is analyzed locally unless you explicitly export data.
- **Minimal Permissions**: Operates entirely within the narrowest possible local boundary.
- **Transparent Event Model**: All collected execution events remain open, inspectable, and understandable.

## Status
⚠️ **Early stage / draft / design in progress**
