const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const Module = require("node:module");

const repoRoot = path.resolve(__dirname, "..");
const extensionEntry = path.join(repoRoot, "dist", "vscode-extension", "src", "extension.js");

test("extension commands populate the Agent Debugger tree view roots", async () => {
  const harness = createHarness();

  try {
    harness.activateExtension();

    assert.equal(harness.treeRegistration?.viewId, "agentDebugger.traceInspector");

    const expectedRoots = ["Run Summary", "Failure Focus", "Files Touched", "Timeline"];
    const scenarios = [
      ["agentDebugger.tryDemoTrace", "Loaded trace run_demo_success."],
      ["agentDebugger.loadHappyPathTrace", "Loaded trace run_demo_success."],
      ["agentDebugger.loadToolRetryFailureTrace", "Loaded trace run_tool_retry_failure."],
      ["agentDebugger.loadContextWindowFailureTrace", "Loaded trace run_context_window_failure."]
    ];

    for (const [commandId, expectedMessage] of scenarios) {
      await harness.executeCommand(commandId);
      assert.deepEqual(await harness.getRootLabels(), expectedRoots);
      assert.equal(harness.lastInfoMessage(), expectedMessage);
      assert.equal(harness.lastErrorMessage(), undefined);
    }
  } finally {
    harness.restore();
  }
});

test("open trace file surfaces a schema validation error for missing runId", async () => {
  const harness = createHarness();

  try {
    harness.activateExtension();
    harness.setOpenDialogResult([
      {
        fsPath: path.join(repoRoot, "examples", "traces", "invalid-missing-runid.json")
      }
    ]);

    await harness.executeCommand("agentDebugger.openTraceFile");

    assert.match(harness.lastErrorMessage() ?? "", /invalid-missing-runid\.json/);
    assert.match(harness.lastErrorMessage() ?? "", /missing required property "runId"/);
    assert.deepEqual(await harness.getRootLabels(), ["No trace loaded"]);
  } finally {
    harness.restore();
  }
});

function createHarness() {
  const commandHandlers = new Map();
  const infoMessages = [];
  const errorMessages = [];
  let treeRegistration;
  let openDialogResult;

  class Disposable {
    constructor(dispose = () => {}) {
      this.dispose = dispose;
    }
  }

  class EventEmitter {
    constructor() {
      this.listeners = [];
      this.event = (listener) => {
        this.listeners.push(listener);
        return new Disposable(() => {
          this.listeners = this.listeners.filter((candidate) => candidate !== listener);
        });
      };
    }

    fire(value) {
      for (const listener of this.listeners) {
        listener(value);
      }
    }
  }

  class TreeItem {
    constructor(label, collapsibleState) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  }

  class ThemeIcon {
    constructor(id) {
      this.id = id;
    }
  }

  const vscodeStub = {
    EventEmitter,
    ThemeIcon,
    TreeItem,
    TreeItemCollapsibleState: {
      None: 0,
      Collapsed: 1,
      Expanded: 2
    },
    window: {
      registerTreeDataProvider(viewId, provider) {
        treeRegistration = { viewId, provider };
        return new Disposable();
      },
      showInformationMessage(message) {
        infoMessages.push(message);
        return Promise.resolve(message);
      },
      showErrorMessage(message) {
        errorMessages.push(message);
        return Promise.resolve(message);
      },
      showOpenDialog() {
        return Promise.resolve(openDialogResult);
      }
    },
    commands: {
      registerCommand(id, callback) {
        commandHandlers.set(id, callback);
        return new Disposable(() => commandHandlers.delete(id));
      },
      async executeCommand(id, ...args) {
        if (id === "agentDebugger.traceInspector.focus") {
          return undefined;
        }

        const callback = commandHandlers.get(id);

        if (!callback) {
          throw new Error(`Command not registered: ${id}`);
        }

        return callback(...args);
      }
    }
  };

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "vscode") {
      return vscodeStub;
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  return {
    treeRegistration,
    activateExtension() {
      delete require.cache[extensionEntry];
      const extension = require(extensionEntry);
      extension.activate({
        extensionPath: repoRoot,
        subscriptions: []
      });
      this.treeRegistration = treeRegistration;
    },
    async executeCommand(commandId) {
      errorMessages.length = 0;
      await vscodeStub.commands.executeCommand(commandId);
    },
    async getRootLabels() {
      const items = treeRegistration ? await treeRegistration.provider.getChildren() : [];
      return items.map((item) => item.label);
    },
    lastInfoMessage() {
      return infoMessages.at(-1);
    },
    lastErrorMessage() {
      return errorMessages.at(-1);
    },
    setOpenDialogResult(result) {
      openDialogResult = result;
    },
    restore() {
      Module._load = originalLoad;
      delete require.cache[extensionEntry];
    }
  };
}
