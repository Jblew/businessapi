import { Schema } from "./Schema";
import { BusinessApi } from "./BusinessApi";
import { ConditionValidatorFn } from "src";

export abstract class BusinessApiAbstract implements BusinessApi {
  protected schema: Schema;
  protected silent: boolean;

  constructor(config: { schemaPath: string; silent?: boolean }) {
    this.schema = new Schema(config.schemaPath);
    this.silent = config.silent!!;
  }

  abstract listen(): { close(): void };

  protected abstract bindHandler(r: {
    method: "GET" | "POST";
    url: string;
    conditionValidators: ConditionValidatorFn[];
    handler: (body?: any) => Promise<{ status: number; json: object }>;
  }): void;

  protected abstract makeRequest(r: {
    method: "GET" | "POST";
    urlEnv: string;
    body?: any;
  }): Promise<{ status: number; data: any }>;

  getSchema() {
    return this.schema;
  }

  call(urlEnv: string) {
    return {
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (): Promise<RESPONSE> => {
          return this.makeCall({
            method: "GET",
            urlEnv,
            responseDefinition,
          });
        },
      }),
      requestSchema: <REQUEST>(requestDefinition: string) => ({
        responseSchema: <RESPONSE>(responseDefinition: string) => ({
          post: (body: REQUEST): Promise<RESPONSE> => {
            return this.makeCall({
              method: "POST",
              urlEnv,
              responseDefinition,
              requestDefinition,
              body,
            });
          },
        }),
      }),
    };
  }

  handle(url: string) {
    return {
      conditions: (conditionValidators: ConditionValidatorFn[]) => ({
        responseSchema: <RESPONSE>(responseDefinition: string) => ({
          get: (handler: () => Promise<RESPONSE> | RESPONSE) => {
            this.installHandler({
              method: "GET",
              url,
              responseDefinition,
              conditionValidators,
              handler: async () => handler(),
            });
          },
        }),
        requestSchema: <REQUEST>(requestDefinition: string) => ({
          responseSchema: <RESPONSE>(responseDefinition: string) => ({
            post: (
              handler: (body: REQUEST) => Promise<RESPONSE> | RESPONSE
            ) => {
              this.installHandler({
                method: "POST",
                url,
                requestDefinition,
                responseDefinition,
                conditionValidators,
                handler: async (body) => handler(body),
              });
            },
          }),
        }),
      }),
    };
  }

  private installHandler(r: {
    method: "POST" | "GET";
    url: string;
    responseDefinition: string;
    requestDefinition?: string;
    conditionValidators: ConditionValidatorFn[];
    handler: (body?: any) => Promise<any>;
  }) {
    if (!this.schema.hasDefinition(r.responseDefinition)) {
      throw new TypeError(
        `Response schema definition ${r.responseDefinition} not found`
      );
    }
    if (
      r.requestDefinition &&
      !this.schema.hasDefinition(r.requestDefinition)
    ) {
      throw new TypeError(
        `Request schema definition ${r.requestDefinition} not found`
      );
    }
    const handler = this.makeSchemaValidatingHandler({ ...r });
    this.bindHandler({
      method: r.method,
      url: r.url,
      conditionValidators: r.conditionValidators,
      handler,
    });
  }

  private async makeCall(r: {
    method: "POST" | "GET";
    urlEnv: string;
    responseDefinition: string;
    requestDefinition?: string;
    body?: any;
  }): Promise<any> {
    if (!this.schema.hasDefinition(r.responseDefinition)) {
      throw new TypeError(
        `Response schema definition ${r.responseDefinition} not found`
      );
    }
    if (
      r.requestDefinition &&
      !this.schema.hasDefinition(r.requestDefinition)
    ) {
      throw new TypeError(
        `Request schema definition ${r.requestDefinition} not found`
      );
    }

    if (r.method === "POST") {
      if (!r.body || typeof r.body != "object") {
        throw new TypeError(`When method is POST, body must be an object`);
      }
      if (!r.requestDefinition) {
        throw new TypeError(
          `When method is POST, request schema definition must be specified`
        );
      }
      const { isValid, error } = this.schema.isValid(
        r.requestDefinition!,
        r.body
      );
      if (!isValid) {
        throw new Error(
          `Request body is not valid against schema ${r.requestDefinition}: ${error}`
        );
      }
    }

    const { status, data } = await this.makeRequest({
      method: r.method,
      urlEnv: r.urlEnv,
      body: r.body,
    });
    if (status !== 200) {
      let error = "(no error field in response)";
      if (data && typeof data === "object" && data !== null && !!data.error) {
        error = `${data.error}`.substring(0, 300);
      }
      throw new Error(`Request failed (status=${status}): ${error}`);
    }
    if (!(data && typeof data === "object" && data !== null)) {
      throw new Error("Response should be an object");
    }
    const { isValid, error } = this.schema.isValid(r.responseDefinition, data);
    if (!isValid) {
      throw new Error(
        `Response is not valid against schema ${r.responseDefinition}: ${error}`
      );
    }
    return data;
  }

  private makeSchemaValidatingHandler(r: {
    responseDefinition: string;
    requestDefinition?: string;
    handler: (body?: any) => Promise<any>;
  }) {
    return async (requestBody?: any) => {
      try {
        if (r.requestDefinition) {
          if (!requestBody || typeof requestBody !== "object") {
            throw new Error("Request body must be a JSON object");
          }
          const { isValid, error } = this.schema.isValid(
            r.requestDefinition,
            requestBody
          );
          if (!isValid) {
            return { status: 409, json: { error } };
          }
        }
        const responseBody = await r.handler(requestBody);
        const { isValid, error } = this.schema.isValid(
          r.responseDefinition,
          responseBody
        );
        if (!isValid) {
          throw new Error(`Handler response is not valid: ${error}`);
        }
        return { status: 200, json: responseBody };
      } catch (err) {
        if (!this.silent) console.error(err);
        return { status: 500, json: { error: "Internal server error" } };
      }
    };
  }
}
