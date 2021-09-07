import express from "express";
import { AddressInfo } from "net";
import { Schema } from "./Schema";
import morgan from "morgan";
import { installSchemaHandlers } from "./endpoints_schema";
import axios from "axios";
import { BusinessApi } from "./BusinessApi";

export class BusinessApiHTTP implements BusinessApi {
  private app: express.Application;
  private schema: Schema;
  constructor(private config: BusinessApiConfig) {
    this.schema = new Schema(config.schemaPath);
    this.app = this.makeExpressApp();
    this.installDefaultHandlers();
  }

  listen(): { close(): void; address(): string | null | AddressInfo } {
    const port = 80;
    const httpServer = this.app.listen(port, () => {
      if (!this.config.silent) console.log(`Listening at :${port}`);
    });
    return httpServer;
  }

  call(urlEnv: string) {
    return {
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (): Promise<RESPONSE> => {
          return this.makeRequest<RESPONSE>({
            method: "GET",
            urlEnv,
            responseDefinition,
          });
        },
        requestSchema: <REQUEST>(requestDefinition: string) => {
          return {
            post: (body: REQUEST): Promise<RESPONSE> => {
              return this.makeRequest<RESPONSE>({
                method: "POST",
                urlEnv,
                responseDefinition,
                requestDefinition,
                body,
              });
            },
          };
        },
      }),
    };
  }

  handle(url: string) {
    return {
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (handler: () => Promise<RESPONSE>) => {
          this.installHandler({
            method: "GET",
            url,
            responseDefinition,
            handler,
          });
        },
        requestSchema: <REQUEST>(requestDefinition: string) => ({
          post: (handler: (body: REQUEST) => Promise<RESPONSE>) => {
            this.installHandler({
              method: "POST",
              url,
              requestDefinition,
              responseDefinition,
              handler,
            });
          },
        }),
      }),
    };
  }

  private makeExpressApp() {
    const app = express();
    app.use(express.json());
    if (!this.config.silent) {
      app.use(morgan("tiny"));
    }
    return app;
  }

  private installDefaultHandlers() {
    this.app.get("/", (_, res) => res.send(""));
    installSchemaHandlers(this.app, this.schema);
  }

  private async makeRequest<R>(r: {
    method: "POST" | "GET";
    urlEnv: string;
    responseDefinition: string;
    requestDefinition?: string;
    body?: any;
  }): Promise<R> {
    const url = process.env[r.urlEnv];
    if (!url) {
      throw new TypeError(`Env ${r.urlEnv} does not exist`);
    }
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

    if (r.method === "POST" && (!r.body || typeof r.body != "object")) {
      throw new TypeError(`When method is POST, body must be an object`);
    }

    if (r.method === "POST") {
      if (!r.requestDefinition) {
        throw new TypeError(
          `When method is POST, requestDefinition must be specified`
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

    const resp = await axios({
      method: r.method,
      url,
      data: r.body,
      validateStatus: () => true,
    });
    if (resp.status !== 200) {
      let error = "(no error field in response)";
      if (
        resp.data &&
        typeof resp.data === "object" &&
        resp.data !== null &&
        !!resp.data.error
      ) {
        error = `${resp.data.error}`.substring(0, 300);
      }
      throw new Error(`Request failed (status=${resp.status}): ${error}`);
    }
    if (!(resp.data && typeof resp.data === "object" && resp.data !== null)) {
      throw new Error("Response should be an object");
    }
    const body = resp.data;
    const { isValid, error } = this.schema.isValid(r.responseDefinition, body);
    if (!isValid) {
      throw new Error(
        `Response is not valid against schema ${r.responseDefinition}: ${error}`
      );
    }
    return body;
  }

  private async installHandler<R>(r: {
    method: "POST" | "GET";
    url: string;
    responseDefinition: string;
    requestDefinition?: string;
    handler: (body?: any) => Promise<any>;
  }): Promise<R> {
    throw new Error("Not implemented yet");
  }
}

export interface BusinessApiConfig {
  schemaPath: string;
  silent?: boolean;
}
