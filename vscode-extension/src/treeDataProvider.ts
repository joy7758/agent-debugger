import * as vscode from "vscode";

import {
  type FailureFocus,
  type TimelineStep,
  type TouchedFile,
  type TraceViewModel
} from "./model";
import { formatDuration } from "./viewModel";

class AgentDebuggerTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    readonly children: AgentDebuggerTreeItem[] = []
  ) {
    super(label, collapsibleState);
  }
}

export class AgentDebuggerTreeDataProvider
  implements vscode.TreeDataProvider<AgentDebuggerTreeItem>
{
  private readonly onDidChangeTreeDataEmitter =
    new vscode.EventEmitter<AgentDebuggerTreeItem | null | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private traceModel?: TraceViewModel;

  getTreeItem(element: AgentDebuggerTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AgentDebuggerTreeItem): Thenable<AgentDebuggerTreeItem[]> {
    if (element) {
      return Promise.resolve(element.children);
    }

    return Promise.resolve(this.buildRootItems());
  }

  setTraceModel(traceModel: TraceViewModel): void {
    this.traceModel = traceModel;
    this.refresh();
  }

  clear(): void {
    this.traceModel = undefined;
    this.refresh();
  }

  private refresh(): void {
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  private buildRootItems(): AgentDebuggerTreeItem[] {
    if (!this.traceModel) {
      return [this.createEmptyStateItem()];
    }

    const summarySection = new AgentDebuggerTreeItem(
      "Run Summary",
      vscode.TreeItemCollapsibleState.Expanded,
      this.buildSummaryChildren(this.traceModel)
    );
    summarySection.description = this.traceModel.summary.status;
    summarySection.iconPath = new vscode.ThemeIcon(this.iconForStatus(this.traceModel.summary.status));

    const failureSection = new AgentDebuggerTreeItem(
      "Failure Focus",
      vscode.TreeItemCollapsibleState.Expanded,
      this.buildFailureChildren(this.traceModel.failureFocus)
    );
    failureSection.description = this.traceModel.failureFocus.hasFailure ? "attention" : "clear";
    failureSection.iconPath = new vscode.ThemeIcon(
      this.traceModel.failureFocus.hasFailure ? "error" : "check"
    );

    const filesSection = new AgentDebuggerTreeItem(
      "Files Touched",
      vscode.TreeItemCollapsibleState.Collapsed,
      this.buildTouchedFileChildren(this.traceModel.touchedFiles)
    );
    filesSection.description = `${this.traceModel.touchedFiles.length}`;
    filesSection.iconPath = new vscode.ThemeIcon("files");

    const timelineSection = new AgentDebuggerTreeItem(
      "Timeline",
      vscode.TreeItemCollapsibleState.Collapsed,
      this.buildTimelineChildren(this.traceModel.steps)
    );
    timelineSection.description = `${this.traceModel.steps.length} steps`;
    timelineSection.iconPath = new vscode.ThemeIcon("list-ordered");

    return [summarySection, failureSection, filesSection, timelineSection];
  }

  private createEmptyStateItem(): AgentDebuggerTreeItem {
    const item = new AgentDebuggerTreeItem(
      "No trace loaded",
      vscode.TreeItemCollapsibleState.None
    );
    item.description = "Run one of the Agent Debugger trace commands.";
    item.tooltip = "Load an example trace or open a local trace JSON file.";
    item.iconPath = new vscode.ThemeIcon("inbox");

    return item;
  }

  private buildSummaryChildren(traceModel: TraceViewModel): AgentDebuggerTreeItem[] {
    const summaryItems: AgentDebuggerTreeItem[] = [
      this.createLeaf("Run ID", traceModel.summary.runId, "symbol-key"),
      this.createLeaf("Status", traceModel.summary.status, this.iconForStatus(traceModel.summary.status)),
      this.createLeaf("Total Steps", `${traceModel.summary.totalSteps}`, "list-flat")
    ];

    if (traceModel.summary.workflowName) {
      summaryItems.push(this.createLeaf("Workflow", traceModel.summary.workflowName, "symbol-method"));
    }

    const duration = formatDuration(traceModel.summary.durationMs);

    if (duration) {
      summaryItems.push(this.createLeaf("Duration", duration, "watch"));
    }

    summaryItems.push(this.createLeaf("Trace File", traceModel.summary.tracePath, "file-code"));

    return summaryItems;
  }

  private buildFailureChildren(failureFocus: FailureFocus): AgentDebuggerTreeItem[] {
    if (!failureFocus.hasFailure) {
      return [this.createLeaf("Status", "No failures detected", "check")];
    }

    const children: AgentDebuggerTreeItem[] = [];

    if (failureFocus.firstFailedStep) {
      children.push(this.createLeaf("First Failed Step", this.formatStepReference(failureFocus.firstFailedStep), "warning"));
    }

    if (failureFocus.terminalFailedStep) {
      children.push(
        this.createLeaf(
          "Terminal Failed Step",
          this.formatStepReference(failureFocus.terminalFailedStep),
          "error"
        )
      );
    }

    if (failureFocus.errorSummary) {
      children.push(this.createLeaf("Error Summary", failureFocus.errorSummary, "issue-opened"));
    }

    if (failureFocus.retryHint) {
      children.push(this.createLeaf("Retry Hint", failureFocus.retryHint, "debug-restart"));
    }

    return children;
  }

  private buildTouchedFileChildren(touchedFiles: TouchedFile[]): AgentDebuggerTreeItem[] {
    if (touchedFiles.length === 0) {
      return [this.createLeaf("Status", "No files touched", "circle-slash")];
    }

    return touchedFiles.map((touchedFile) => {
      const item = new AgentDebuggerTreeItem(
        touchedFile.path,
        vscode.TreeItemCollapsibleState.None
      );
      item.description = touchedFile.changeType ?? "changed";
      item.tooltip = touchedFile.correlationMode
        ? `${touchedFile.path}\n${touchedFile.correlationMode}`
        : touchedFile.path;
      item.iconPath = new vscode.ThemeIcon("edit");

      return item;
    });
  }

  private buildTimelineChildren(steps: TimelineStep[]): AgentDebuggerTreeItem[] {
    return steps.map((step) => {
      const item = new AgentDebuggerTreeItem(
        `${step.id} ${step.label}`,
        vscode.TreeItemCollapsibleState.None
      );
      const descriptionParts = [step.target, step.status, step.attempt ? `attempt ${step.attempt}` : undefined]
        .filter((part): part is string => Boolean(part));

      item.description = descriptionParts.join(" • ");
      item.tooltip = this.buildStepTooltip(step);
      item.iconPath = new vscode.ThemeIcon(this.iconForStep(step));
      item.contextValue = step.kind;

      return item;
    });
  }

  private formatStepReference(step: TimelineStep): string {
    return `${step.id} ${step.label}${step.target ? ` -> ${step.target}` : ""}`;
  }

  private buildStepTooltip(step: TimelineStep): string {
    const lines = [`${step.id}`, `kind: ${step.kind}`, `status: ${step.status}`];

    if (step.target) {
      lines.push(`target: ${step.target}`);
    }

    if (step.attempt) {
      lines.push(`attempt: ${step.attempt}`);
    }

    if (step.details) {
      lines.push(`details: ${step.details}`);
    }

    return lines.join("\n");
  }

  private createLeaf(label: string, description: string, icon: string): AgentDebuggerTreeItem {
    const item = new AgentDebuggerTreeItem(label, vscode.TreeItemCollapsibleState.None);
    item.description = description;
    item.tooltip = description;
    item.iconPath = new vscode.ThemeIcon(icon);

    return item;
  }

  private iconForStep(step: TimelineStep): string {
    if (step.kind === "file.changed") {
      return "edit";
    }

    return this.iconForStatus(step.status);
  }

  private iconForStatus(status: string): string {
    switch (status) {
      case "ok":
      case "completed":
        return "check";
      case "error":
      case "failed":
        return "error";
      case "warning":
        return "warning";
      case "changed":
        return "edit";
      case "started":
        return "play";
      case "cancelled":
        return "circle-slash";
      default:
        return "circle-large-outline";
    }
  }
}
