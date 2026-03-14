export type TraceRunStatus = "ok" | "error" | "cancelled";
export type TraceEventLevel = "info" | "warning" | "error";
export type TraceEventKind =
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "node.started"
  | "node.completed"
  | "node.failed"
  | "tool.started"
  | "tool.completed"
  | "tool.failed"
  | "model.started"
  | "model.completed"
  | "model.failed"
  | "file.changed"
  | "artifact.created"
  | "log.message";

export interface TraceActor {
  type: "run" | "node" | "tool" | "model" | "system";
  id?: string;
  name: string;
}

export interface TraceRun {
  runId: string;
  framework: "langgraph";
  status: TraceRunStatus;
  startedAt: string;
  endedAt?: string;
  source?: string;
  workflow?: {
    name?: string;
    entrypoint?: string;
  };
  workspace: {
    root: string;
    vcs?: {
      provider?: string;
      head?: string;
    };
  };
  [key: string]: unknown;
}

export interface TraceEvent {
  id: string;
  seq: number;
  ts: string;
  kind: TraceEventKind;
  level: TraceEventLevel;
  actor: TraceActor;
  parentId?: string;
  relatedEventIds?: string[];
  attempt?: number;
  durationMs?: number;
  payload?: Record<string, unknown>;
}

export interface TraceDocument {
  schemaVersion: "0.1.0";
  run: TraceRun;
  events: TraceEvent[];
}

export interface RunSummary {
  runId: string;
  status: TraceRunStatus;
  totalSteps: number;
  workflowName?: string;
  durationMs?: number;
  tracePath: string;
}

export interface TimelineStep {
  id: string;
  seq: number;
  label: string;
  target?: string;
  status: "started" | "completed" | "failed" | "warning" | "changed" | "info";
  kind: TraceEventKind;
  attempt?: number;
  details?: string;
}

export interface FailureFocus {
  hasFailure: boolean;
  firstFailedStep?: TimelineStep;
  terminalFailedStep?: TimelineStep;
  errorSummary?: string;
  retryHint?: string;
}

export interface TouchedFile {
  path: string;
  changeType?: string;
  correlationMode?: string;
}

export interface TraceViewModel {
  tracePath: string;
  trace: TraceDocument;
  summary: RunSummary;
  failureFocus: FailureFocus;
  touchedFiles: TouchedFile[];
  steps: TimelineStep[];
}
