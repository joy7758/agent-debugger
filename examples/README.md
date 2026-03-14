# 示例 / Examples

此目录包含 trace fixture，供后续适配器、校验器和 UI 代码作为基础测试数据使用。  
This directory contains trace fixtures that future adapters, validators, and UI code should use as baseline test data.

## 样例文件 / Fixtures
- `happy-path.json`: 带有文件变更的成功运行。 / Successful run with a file change.
- `tool-retry-failure.json`: 工具失败两次，运行最终以错误结束。 / Tool fails twice and the run ends in error.
- `context-window-failure.json`: 模型调用因上下文超出限制而失败。 / Model call fails because context exceeds the limit.
- `invalid-missing-runid.json`: 有意构造的无效 trace，用于 schema 拒绝测试。 / Intentionally invalid trace for schema rejection tests.
