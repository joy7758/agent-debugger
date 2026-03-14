const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

const { SchemaValidator } = require("../dist/vscode-extension/src/schemaValidator.js");
const { TraceLoader, TraceValidationError } = require("../dist/vscode-extension/src/traceLoader.js");
const { buildTraceViewModel } = require("../dist/vscode-extension/src/viewModel.js");

const repoRoot = path.resolve(__dirname, "..");

test("schema validation accepts a valid fixture", async () => {
  const validator = new SchemaValidator(repoRoot);
  const trace = await readFixture("happy-path.json");
  const result = await validator.validateTrace(trace);

  assert.equal(result.valid, true);
});

test("schema validation rejects an invalid trace with a human-readable failure", async () => {
  const loader = new TraceLoader(repoRoot, new SchemaValidator(repoRoot));

  await assert.rejects(
    () => loader.loadExampleTrace("invalid-missing-runid.json"),
    (error) => {
      assert.ok(error instanceof TraceValidationError);
      assert.match(error.message, /invalid-missing-runid\.json/);
      assert.match(error.message, /missing required property "runId"/);
      return true;
    }
  );
});

test("failure focus is derived correctly from tool-retry-failure.json", async () => {
  const trace = await readFixture("tool-retry-failure.json");
  const viewModel = buildTraceViewModel(trace, fixturePath("tool-retry-failure.json"));

  assert.equal(viewModel.failureFocus.hasFailure, true);
  assert.equal(viewModel.failureFocus.firstFailedStep?.id, "evt_004");
  assert.equal(viewModel.failureFocus.terminalFailedStep?.id, "evt_008");
  assert.match(viewModel.failureFocus.errorSummary ?? "", /tool_retry_exhausted/);
  assert.match(viewModel.failureFocus.errorSummary ?? "", /No such file or directory/);
  assert.equal(viewModel.failureFocus.retryHint, "run_shell reached attempt 2.");
});

test("failure focus is derived correctly from context-window-failure.json", async () => {
  const trace = await readFixture("context-window-failure.json");
  const viewModel = buildTraceViewModel(trace, fixturePath("context-window-failure.json"));

  assert.equal(viewModel.failureFocus.hasFailure, true);
  assert.equal(viewModel.failureFocus.firstFailedStep?.id, "evt_004");
  assert.equal(viewModel.failureFocus.terminalFailedStep?.id, "evt_006");
  assert.match(viewModel.failureFocus.errorSummary ?? "", /context_window_exceeded/);
  assert.match(viewModel.failureFocus.errorSummary ?? "", /context window/);
  assert.equal(viewModel.failureFocus.retryHint, undefined);
});

test("files touched summary is derived correctly from happy-path.json", async () => {
  const trace = await readFixture("happy-path.json");
  const viewModel = buildTraceViewModel(trace, fixturePath("happy-path.json"));

  assert.deepEqual(viewModel.touchedFiles, [
    {
      path: "README.md",
      changeType: "modified",
      correlationMode: "direct-tool-metadata"
    }
  ]);
});

test("timeline ordering is preserved by sequence number", async () => {
  const trace = await readFixture("happy-path.json");
  const reversedTrace = {
    ...trace,
    events: [...trace.events].reverse()
  };
  const viewModel = buildTraceViewModel(reversedTrace, fixturePath("happy-path.json"));
  const stepIds = viewModel.steps.map((step) => step.id);

  assert.deepEqual(stepIds, [
    "evt_001",
    "evt_002",
    "evt_003",
    "evt_004",
    "evt_005",
    "evt_006",
    "evt_007",
    "evt_008",
    "evt_009",
    "evt_010"
  ]);
});

async function readFixture(fileName) {
  const source = await fs.readFile(fixturePath(fileName), "utf8");
  return JSON.parse(source);
}

function fixturePath(fileName) {
  return path.join(repoRoot, "examples", "traces", fileName);
}
