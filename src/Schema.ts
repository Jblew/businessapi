import * as fs from "fs";
import Ajv from "ajv";

export class Schema {
  private schema: any;
  private ajv: Ajv;

  constructor(schemaPath: string) {
    this.schema = Object.freeze(this.loadSchema(schemaPath));
    this.ajv = this.makeAjv(this.schema);
    if (!this.schema.definitions) {
      throw new Error("Malformed JSON schema: field definitions is missing");
    }
  }

  public hasDefinition(name: string): boolean {
    return this.getDefinition(name) != undefined;
  }

  public isValid(definitionName: string, data: unknown): boolean {
    if (!this.hasDefinition(definitionName)) {
      throw new Error(`Missing definition ${definitionName}`);
    }
    const validator = this.ajv.getSchema(`#/definitions/${definitionName}`)!;
    const isValid = validator(data) as boolean;
    return isValid;
  }

  public getSchemaObject(): any {
    return this.schema;
  }

  private loadSchema(schemaPath: string): unknown {
    return JSON.parse(fs.readFileSync(schemaPath).toString());
  }

  private makeAjv(schema: any) {
    const ajv = new Ajv();
    ajv.addSchema(schema);
    return ajv;
  }

  private getDefinition(name: string) {
    return this.schema.definitions[name];
  }
}
