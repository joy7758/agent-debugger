import {
  type FailureFocus,
  type TimelineStep,
  type TouchedFile,
  type TraceDocument,
  type TraceEvent,
  type TraceViewModel
} from "./model";

export function buildTraceViewModel(trace: TraceDocument, tracePath: string): TraceViewModel {
  const orderedEvents = sortEventsBySeq(trace.events);
  const steps = orderedEvents.map(toTimelineStep);

  return {
    tracePath,
    trace: {
      ...trace,
      events: orderedEvents
    },
    summary: {
      runId: trace.run.runId,
      status: trace.run.status,
      totalSteps: orderedEvents.length,
      workflowName: trace.run.workflow?.name,
      durationMs: toDurationMs(trace.run.startedAt, trace.run.endedAt),
      tracePath
    },
    failureFocus: buildFailureFocus(orderedEvents, steps),
    touchedFiles: buildTouchedFiles(orderedEvents),
    steps
  };
}

function buildFailureFocus(events: TraceEvent[], steps: TimelineStep[]): FailureFocus {
  const failedPairs = steps
    .map((step, index) => ({ step, event: events[index] }))
    .filter(({ step }) => step.status === "failed");

  if (failedPairs.length === 0) {
    return {
      hasFailure: false
    };
  }

  const firstFailed = failedPairs[0];
  const terminalFailed = failedPairs[failedPairs.length - 1];
  const rootCause = selectRootCause(failedPairs);

  return {
    hasFailure: true,
    firstFailedStep: firstFailed.step,
    terminalFailedStep: terminalFailed.step,
    errorSummary: extractErrorSummary(rootCause.event) ?? `${rootCause.step.label} failed`,
    retryHint: buildRetryHint(events, rootCause.event)
  };
}

function selectRootCause(failedPairs: Array<{ step: TimelineStep; event: TraceEvent }>): {
  step: TimelineStep;
  event: TraceEvent;
} {
  const toolOrModelFailure = [...failedPairs]
    .reverse()
    .find(({ event }) => event.actor.type === "tool" || event.actor.type === "model");

  if (toolOrModelFailure) {
    return toolOrModelFailure;
  }

  const nonRunFailure = [...failedPairs].reverse().find(({ event }) => event.actor.type !== "run");

  return nonRunFailure ?? failedPairs[failedPairs.length - 1];
}

function buildTouchedFiles(events: TraceEvent[]): TouchedFile[] {
  const touchedFiles = new Map<string, TouchedFile>();

  for (const event of events) {
    if (event.kind !== "file.changed") {
      continue;
    }

    const filePayload = asRecord(event.payload?.file);
    const filePath = asString(filePayload?.path);

    if (!filePath || touchedFiles.has(filePath)) {
      continue;
    }

    touchedFiles.set(filePath, {
      path: filePath,
      changeType: asString(filePayload?.changeType),
      correlationMode: asString(filePayload?.correlationMode)
    });
  }

  return Array.from(touchedFiles.values()).sort((left, right) => left.path.localeCompare(right.path));
}

function toTimelineStep(event: TraceEvent): TimelineStep {
  return {
    id: event.id,
    seq: event.seq,
    label: extractLabel(event),
    target: extractTarget(event),
    status: deriveStatus(event),
    kind: event.kind,
    attempt: event.attempt,
    details: extractErrorSummary(event)
  };
}

function sortEventsBySeq(events: TraceEvent[]): TraceEvent[] {
  return events.slice().sort((left, right) => left.seq - right.seq);
}

function extractLabel(event: TraceEvent): string {
  if (event.kind === "file.changed") {
    return "file_changed";
  }

  const payload = asRecord(event.payload);
  const toolPayload = asRecord(payload?.tool);
  const toolName = asString(toolPayload?.name);

  if (toolName) {
    return toolName;
  }

  return event.actor.name || event.kind;
}

function extractTarget(event: TraceEvent): string | undefined {
  const payload = asRecord(event.payload);
  const filePayload = asRecord(payload?.file);
  const filePath = asString(filePayload?.path);

  if (filePath) {
    return filePath;
  }

  const toolPayload = asRecord(payload?.tool);
  const args = asRecord(toolPayload?.args);
  const argTarget =
    asString(args?.path) ??
    asString(args?.command) ??
    asString(args?.target) ??
    asString(args?.file);

  if (argTarget) {
    return shorten(argTarget, 72);
  }

  const errorPayload = asRecord(payload?.error);
  const errorCode = asString(errorPayload?.code);

  if (errorCode) {
    return errorCode;
  }

  const modelPayload = asRecord(payload?.model);
  const modelName = asString(modelPayload?.name);

  return modelName;
}

function deriveStatus(event: TraceEvent): TimelineStep["status"] {
  if (event.kind === "file.changed") {
    return "changed";
  }

  if (event.kind.endsWith(".failed") || event.level === "error") {
    return "failed";
  }

  if (event.level === "warning") {
    return "warning";
  }

  if (event.kind.endsWith(".completed")) {
    return "completed";
  }

  if (event.kind.endsWith(".started")) {
    return "started";
  }

  return "info";
}

function buildRetryHint(events: TraceEvent[], failedEvent: TraceEvent): string | undefined {
  const actorKey = failedEvent.actor.id ?? failedEvent.actor.name;
  const attempts = events
    .filter((event) => (event.actor.id ?? event.actor.name) === actorKey)
    .map((event) => event.attempt)
    .filter((attempt): attempt is number => typeof attempt === "number");

  if (attempts.length === 0) {
    return undefined;
  }

  const maxAttempt = Math.max(...attempts);

  if (maxAttempt <= 1) {
    return undefined;
  }

  return `${failedEvent.actor.name} reached attempt ${maxAttempt}.`;
}

function extractErrorSummary(event: TraceEvent): string | undefined {
  const payload = asRecord(event.payload);
  const errorPayload = asRecord(payload?.error);
  const classification = asString(errorPayload?.classification);
  const message = asString(errorPayload?.message);

  if (classification && message) {
    return `${classification}: ${message}`;
  }

  return message ?? classification;
}

function toDurationMs(startedAt: string, endedAt?: string): number | undefined {
  if (!endedAt) {
    return undefined;
  }

  const started = Date.parse(startedAt);
  const ended = Date.parse(endedAt);

  if (Number.isNaN(started) || Number.isNaN(ended) || ended < started) {
    return undefined;
  }

  return ended - started;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function shorten(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

export function formatDuration(durationMs?: number): string | undefined {
  if (durationMs === undefined) {
    return undefined;
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
}
