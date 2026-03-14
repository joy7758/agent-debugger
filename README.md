# Agent-Debugger

**像调试代码一样调试 AI Agent。**  
**Debug AI agents like you debug code.**

Agent-Debugger 是一个面向 AI 编码工作流的本地优先调试工具。它帮助你检查 AI agent 做了什么、改了什么，以及一次运行是在哪里出错的。  
Agent-Debugger is a local-first debugging tool for AI coding workflows. It helps you inspect what an AI agent did, what it changed, and where a run went wrong.

当前仓库包含 v0.1 的产品切片、核心契约、trace 样例，以及一个最小可运行的本地预览。  
This repository currently contains the v0.1 product slice, core contracts, trace fixtures, and a minimal runnable local preview.

## 为什么选择 Agent-Debugger？ / Why Agent-Debugger?
一旦 AI agent 开始读文件、调用工具并重试动作，原始日志就不再够用。你需要看到执行了哪些步骤、哪些文件被修改，以及执行从哪里开始偏离。Agent-Debugger 的目标就是让这种检查更快、更清晰。  
Once an AI agent starts reading files, calling tools, and retrying actions, raw logs stop being enough. You need to see which steps ran, which files changed, and where execution started to drift. Agent-Debugger is built to make that inspection faster and clearer.

## 核心价值 / Core Value
- **工具调用时间线 / Tool-Call Timeline**: 按时间顺序检查 agent 动作和 API 调用。 / Inspect agent actions and API calls in chronological order.
- **文件变更关联 / File Diff Correlation**: 将 agent 活动直接关联到它修改的代码。 / Connect agent activity directly to the code it changed.
- **故障聚焦 / Failure Focus**: 快速定位失败步骤、上下文限制错误和被阻塞的工具重试。 / Instantly locate failed steps, context limit errors, and blocked tool retries.

## 适用对象 / Who is this for?
- 构建自主 agent 或 AI 编码工作流的开发者。 / Developers building autonomous agents or AI coding workflows.
- 需要审查和检查 agent 驱动代码变更的团队。 / Teams reviewing and inspecting agent-driven code changes.
- 需要对复杂 AI 执行过程获得实用、本地可见性的工程师。 / Engineers who need practical, local visibility into complex AI execution.

## 范围（v0.1） / Scope (v0.1)
### 已包含 / Included
- 已完成运行的 LangGraph 适配器 / LangGraph adapter for completed runs
- 标准本地 trace 格式 / Standard local trace format
- VS Code 扩展检查器 / VS Code extension inspector
- 工具调用执行时间线 / Tool-call execution timeline
- 文件 diff 关联视图 / File diff correlation views
- 故障状态高亮 / Failure state highlighting
- 存储在 `.agent-debugger/runs/` 下的本地优先数据 / Local-first storage under `.agent-debugger/runs/`

### 暂不包含 / Not Included
- LangChain 适配器 / LangChain adapter
- 运行中任务的实时流式展示 / Live streaming of in-flight runs
- 执行回放 / Execution replay
- 深层推理过程或 LLM 注意力可视化 / Deep reasoning/LLM attention visualization
- 企业治理 UI / Enterprise governance UI
- 自定义 tracing 后端基础设施 / Custom tracing backend infrastructure
- 广义的多平台可观测性承诺 / Broad multi-platform observability claims

## 架构概览 / Architecture Overview
Agent-Debugger v0.1 采用一个聚焦且本地化的工作流：  
Agent-Debugger v0.1 follows a narrow local workflow:

1. **LangGraph Adapter** 以 JSON 形式输出一次已完成运行的 trace。 / A **LangGraph Adapter** emits a completed run trace as JSON.
2. trace 会依据 [`core/event-schema/trace.schema.json`](./core/event-schema/trace.schema.json) 中的 **Standard Event Schema** 进行校验。 / The trace is validated against the **Standard Event Schema** in [`core/event-schema/trace.schema.json`](./core/event-schema/trace.schema.json).
3. trace 会被存储到本地 `.agent-debugger/runs/`。 / The trace is stored locally in `.agent-debugger/runs/`.
4. **VS Code 扩展 / VS Code extension** 加载该 trace，并渲染时间线、文件视图和故障视图。 / A **VS Code extension** loads that trace and renders timeline, file, and failure views.

第一个版本有意采用运行后、基于文件的形式。如果静态工作流被证明足够有用，后续可以再加入实时流式能力。  
The first version is intentionally post-run and file-based. Live streaming can be added later if the static workflow proves useful.

## 仓库结构 / Repo Map
- [`core/event-schema/README.md`](./core/event-schema/README.md): 规范化 trace 模型。 / Canonical trace model.
- [`core/event-schema/trace.schema.json`](./core/event-schema/trace.schema.json): 运行时校验契约。 / Runtime validation contract.
- [`examples/traces`](./examples/traces): 用于实现和测试的样例 fixture。 / Sample fixtures for implementation and tests.
- [`test/trace.test.js`](./test/trace.test.js): 最小自动化验收测试。 / Minimal automated acceptance harness.

## 信任说明 / Trust Statement
你的代码和执行 trace 会保留在你的机器上。  
Your code and execution traces stay on your machine.

- **本地优先 / Local-First**: 工具严格运行在你的代码所在环境。 / The tool runs strictly where your code runs.
- **默认不上传源码 / No Source Upload by Default**: 除非你显式导出数据，否则源码分析都在本地进行。 / Source code is analyzed locally unless you explicitly export data.
- **最小权限 / Minimal Permissions**: 整个工具运行在尽可能窄的本地边界内。 / Operates entirely within the narrowest possible local boundary.
- **透明事件模型 / Transparent Event Model**: 所有采集到的执行事件都保持开放、可检查、可理解。 / All collected execution events remain open, inspectable, and understandable.

## 当前状态 / Status
⚠️ **早期阶段。当前已有一个最小可运行的 v0.1 切片，更完整的实现仍在推进中。**  
⚠️ **Early stage. A minimal runnable v0.1 slice exists and broader implementation is still in progress.**

## 安装与试用 / Install & Try
### 路径 1：从 VSIX 本地安装 / Path 1: Local Install From VSIX
1. 下载测试人员收到的 `.vsix` 文件。 / Download the `.vsix` file shared for testing.
2. 在 VS Code 中运行 `Extensions: Install from VSIX...` 并选择该文件。 / In VS Code, run `Extensions: Install from VSIX...` and select the file.
3. 或者运行 `code --install-extension <file>.vsix`。 / Or run `code --install-extension <file>.vsix`.
4. 安装后，在命令面板运行 `Agent Debugger: Try Demo Trace`。 / After install, run `Agent Debugger: Try Demo Trace` from the Command Palette.

### 路径 2：扩展开发模式 / Path 2: Extension Development Mode
1. 运行 `npm install`。 / Run `npm install`.
2. 运行 `npm run compile`。 / Run `npm run compile`.
3. 在 VS Code 中打开本仓库，并启动 `Run Agent Debugger Extension`。 / Open this repo in VS Code and launch `Run Agent Debugger Extension`.
4. 在 Extension Development Host 中运行 `Agent Debugger: Try Demo Trace`。 / In the Extension Development Host, run `Agent Debugger: Try Demo Trace`.

当前扩展只做三件事：加载本地 JSON trace、按 schema 校验、在 Tree View 中展示运行摘要、故障聚焦、文件触达和时间线。它默认不会上传源码，也不会执行 replay、平台同步或治理 UI。  
The current extension does three things only: load local JSON traces, validate them against the bundled schema, and render run summary, failure focus, files touched, and timeline in the Tree View. It does not upload source code by default, and it does not provide replay, platform sync, or governance UI.

当前早期测试通过 VSIX 分发，Marketplace 发布计划后续再做。  
Early tester distribution is currently via VSIX; Marketplace publication is planned later.

## 验证 / Verification
- 运行 `npm test`，覆盖 schema、view-model 和命令级扩展逻辑。 / Run `npm test` for schema, view-model, and command-level extension coverage.
- 运行 `npm run test:ui`，通过扩展命令入口验证 `Agent Debugger` 树根节点和无效 trace 的报错处理。 / Run `npm run test:ui` to validate the `Agent Debugger` tree roots and invalid trace error handling through the extension command surface.
