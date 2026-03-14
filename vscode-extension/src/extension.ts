import * as vscode from "vscode";

import { type TraceViewModel } from "./model";
import { SchemaValidator } from "./schemaValidator";
import { TraceLoadError, TraceLoader, TraceValidationError } from "./traceLoader";
import { AgentDebuggerTreeDataProvider } from "./treeDataProvider";

const TRACE_VIEW_ID = "agentDebugger.traceInspector";

export function activate(context: vscode.ExtensionContext): void {
  const treeDataProvider = new AgentDebuggerTreeDataProvider();
  const schemaValidator = new SchemaValidator(context.extensionPath);
  const traceLoader = new TraceLoader(context.extensionPath, schemaValidator);

  context.subscriptions.push(vscode.window.registerTreeDataProvider(TRACE_VIEW_ID, treeDataProvider));

  context.subscriptions.push(
    vscode.commands.registerCommand("agentDebugger.tryDemoTrace", async () => {
      await loadTraceIntoTree(treeDataProvider, () => traceLoader.loadExampleTrace("happy-path.json"));
    }),
    vscode.commands.registerCommand("agentDebugger.loadHappyPathTrace", async () => {
      await loadTraceIntoTree(treeDataProvider, () => traceLoader.loadExampleTrace("happy-path.json"));
    }),
    vscode.commands.registerCommand("agentDebugger.loadToolRetryFailureTrace", async () => {
      await loadTraceIntoTree(treeDataProvider, () =>
        traceLoader.loadExampleTrace("tool-retry-failure.json")
      );
    }),
    vscode.commands.registerCommand("agentDebugger.loadContextWindowFailureTrace", async () => {
      await loadTraceIntoTree(treeDataProvider, () =>
        traceLoader.loadExampleTrace("context-window-failure.json")
      );
    }),
    vscode.commands.registerCommand("agentDebugger.openTraceFile", async () => {
      const selectedUris = await vscode.window.showOpenDialog({
        canSelectFolders: false,
        canSelectFiles: true,
        canSelectMany: false,
        openLabel: "Open Trace",
        filters: {
          JSON: ["json"]
        }
      });

      const selectedUri = selectedUris?.[0];

      if (!selectedUri) {
        return;
      }

      await loadTraceIntoTree(treeDataProvider, () => traceLoader.loadTraceFile(selectedUri.fsPath));
    })
  );
}

export function deactivate(): void {}

async function loadTraceIntoTree(
  treeDataProvider: AgentDebuggerTreeDataProvider,
  loadTrace: () => Promise<TraceViewModel>
): Promise<void> {
  try {
    const traceModel = await loadTrace();
    treeDataProvider.setTraceModel(traceModel);
    await focusTraceView();
    void vscode.window.showInformationMessage(`Loaded trace ${traceModel.summary.runId}.`);
  } catch (error) {
    treeDataProvider.clear();
    void vscode.window.showErrorMessage(toUserFacingMessage(error));
  }
}

async function focusTraceView(): Promise<void> {
  try {
    await vscode.commands.executeCommand(`${TRACE_VIEW_ID}.focus`);
  } catch {
    // Keep trace loading non-fatal even if the host does not expose a focus command for the view.
  }
}

function toUserFacingMessage(error: unknown): string {
  if (error instanceof TraceValidationError || error instanceof TraceLoadError) {
    return error.message;
  }

  if (error instanceof Error) {
    return `Agent Debugger could not load the trace: ${error.message}`;
  }

  return "Agent Debugger could not load the trace.";
}
