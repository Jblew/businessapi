import * as fs from "fs";
import Ajv from "ajv";
import { ArgumentError } from "ow/dist";

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

  public isValid(
    definitionName: string,
    data: unknown
  ): { isValid: boolean; error: string } {
    if (!this.hasDefinition(definitionName)) {
      throw new Error(`Missing definition ${definitionName}`);
    }
    const validator = this.ajv.getSchema(`#/definitions/${definitionName}`)!;
    const isValid = validator(data) as boolean;
    let error = "";
    if (!isValid) {
      error =
        `${validator.errors?.[0].instancePath} ${validator.errors?.[0].message}`.substring(
          0,
          200
        );
    }
    return {
      isValid,
      error,
    };
  }

  public getSchemaObject(): any {
    return this.schema;
  }

  public isDefinitionCompatible(definitionName: string, remoteSchema: any) {
    if (!remoteSchema || !remoteSchema.$schema || !remoteSchema.definitions) {
      throw new TypeError(
        "Remote schema misses properties: $schema and definitions"
      );
    }
    const theirDefinition = remoteSchema.definitions[definitionName];
    const ourDefinition = this.schema.definitions[definitionName];
    if (!theirDefinition) {
      throw new TypeError(
        `The specified definition (${definitionName}) does not exist in your schema`
      );
    }
    if (!ourDefinition) {
      throw new TypeError(
        `The specified definition (${definitionName}) does not exist in our schema`
      );
    }

    const theirSchemaVerId = theirDefinition.properties?.SchemaVer?.["$id"];
    const ourSchemaVerID = ourDefinition.properties?.SchemaVer?.["$id"];
    if (!theirSchemaVerId) {
      throw new TypeError(
        "Your definition misses .properties.SchemaVer.$id field (case sensitive)"
      );
    }
    if (!ourSchemaVerID) {
      throw new TypeError(
        "Our definition misses .properties.SchemaVer.$id field (case sensitive)"
      );
    }
    if (theirSchemaVerId !== ourSchemaVerID) {
      return false;
    }
    return true;
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
