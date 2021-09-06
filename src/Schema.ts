import * as fs from "fs";

export class Schema {
  private schema: unknown;

  constructor(schemaPath: string) {
    this.schema = this.loadSchema(schemaPath);
  }

  public hasDefinition(definitionName: string): boolean {
    throw new Error("Not implemented yet");
  }

  public isValid(definitionName: string, data: unknown): boolean {
    throw new Error("Not implemented yet");
  }

  private loadSchema(schemaPath: string): unknown {
    return JSON.parse(fs.readFileSync(schemaPath).toString());
  }
}
