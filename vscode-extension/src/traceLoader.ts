import * as fs from "fs/promises";
import * as path from "path";

import { type TraceViewModel } from "./model";
import { SchemaValidator } from "./schemaValidator";
import { buildTraceViewModel } from "./viewModel";

export class TraceValidationError extends Error {
  constructor(tracePath: string, readonly issues: string[]) {
    super(`Trace validation failed for ${path.basename(tracePath)}: ${issues.join(" ")}`);
    this.name = "TraceValidationError";
  }
}

export class TraceLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TraceLoadError";
  }
}

export class TraceLoader {
  constructor(
    private readonly extensionRoot: string,
    private readonly schemaValidator: SchemaValidator
  ) {}

  async loadExampleTrace(fileName: string): Promise<TraceViewModel> {
    const exampleTracePath = path.join(this.extensionRoot, "examples", "traces", fileName);
    return this.loadTraceFile(exampleTracePath);
  }

  async loadTraceFile(tracePath: string): Promise<TraceViewModel> {
    const rawTrace = await this.readTraceFile(tracePath);
    const validationResult = await this.schemaValidator.validateTrace(rawTrace);

    if (!validationResult.valid) {
      throw new TraceValidationError(tracePath, validationResult.errors);
    }

    return buildTraceViewModel(validationResult.data, tracePath);
  }

  private async readTraceFile(tracePath: string): Promise<unknown> {
    let source: string;

    try {
      source = await fs.readFile(tracePath, "utf8");
    } catch (error) {
      throw new TraceLoadError(`Could not read trace file: ${tracePath}.`);
    }

    try {
      return JSON.parse(source) as unknown;
    } catch (error) {
      throw new TraceLoadError(`Trace file is not valid JSON: ${path.basename(tracePath)}.`);
    }
  }
}
