import * as fs from "fs/promises";
import * as path from "path";

import { type ErrorObject, type ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

import { type TraceDocument } from "./model";

export type TraceValidationResult =
  | {
      valid: true;
      data: TraceDocument;
    }
  | {
      valid: false;
      errors: string[];
    };

export class SchemaValidator {
  private validateTraceDocument?: ValidateFunction<TraceDocument>;

  constructor(private readonly extensionRoot: string) {}

  async validateTrace(candidate: unknown): Promise<TraceValidationResult> {
    const validator = await this.getValidator();
    const valid = validator(candidate);

    if (!valid) {
      return {
        valid: false,
        errors: formatAjvErrors(validator.errors)
      };
    }

    return {
      valid: true,
      data: candidate as TraceDocument
    };
  }

  private async getValidator(): Promise<ValidateFunction<TraceDocument>> {
    if (this.validateTraceDocument) {
      return this.validateTraceDocument;
    }

    const schemaPath = path.join(this.extensionRoot, "core", "event-schema", "trace.schema.json");
    const schemaSource = await fs.readFile(schemaPath, "utf8");
    const schema = JSON.parse(schemaSource) as object;
    const ajv = new Ajv2020({
      allErrors: true,
      strict: false
    });

    addFormats(ajv);
    this.validateTraceDocument = ajv.compile<TraceDocument>(schema);

    return this.validateTraceDocument;
  }
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return ["Unknown schema validation error."];
  }

  const messages = errors.slice(0, 5).map((error) => {
    const location = error.instancePath || "/";

    if (error.keyword === "required" && typeof error.params.missingProperty === "string") {
      return `${location} is missing required property "${error.params.missingProperty}".`;
    }

    return `${location} ${error.message ?? "is invalid"}.`;
  });

  if (errors.length > messages.length) {
    messages.push(`${errors.length - messages.length} more validation issues omitted.`);
  }

  return messages;
}
