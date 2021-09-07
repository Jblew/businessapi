import express from "express";
import { AddressInfo } from "net";
import { Schema } from "./Schema";
import morgan from "morgan";
import { installSchemaHandlers } from "./endpoints_schema";
import axios from "axios";
import { BusinessApi } from "./BusinessApi";
import { makeRequest } from "./makeRequest";
import { makeExpressHandler } from "./makeExpressHandler";

export class BusinessApiHTTP implements BusinessApi {
  private app: express.Application;
  private schema: Schema;
  constructor(private config: BusinessApiConfig) {
    this.schema = new Schema(config.schemaPath);
    this.app = this.makeExpressApp();
    this.installDefaultHandlers();
  }

  listen(): { close(): void; address(): string | null | AddressInfo } {
    const port = this.config.port || 80;
    const httpServer = this.app.listen(port, () => {
      if (!this.config.silent) console.log(`Listening at :${port}`);
    });
    return httpServer;
  }

  call(urlEnv: string) {
    return {
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (): Promise<RESPONSE> => {
          return makeRequest<RESPONSE>({
            schema: this.schema,
            method: "GET",
            urlEnv,
            responseDefinition,
          });
        },
      }),
      requestSchema: <REQUEST>(requestDefinition: string) => ({
        responseSchema: <RESPONSE>(responseDefinition: string) => ({
          post: (body: REQUEST): Promise<RESPONSE> => {
            return makeRequest<RESPONSE>({
              schema: this.schema,
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
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (handler: () => Promise<RESPONSE>) => {
          this.installHandler({
            method: "GET",
            url,
            responseDefinition,
            handler,
          });
        },
      }),
      requestSchema: <REQUEST>(requestDefinition: string) => ({
        responseSchema: <RESPONSE>(responseDefinition: string) => ({
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

  private installHandler(r: {
    method: "POST" | "GET";
    url: string;
    responseDefinition: string;
    requestDefinition?: string;
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
    const handler = makeExpressHandler({
      responseBodyValidator: (body) =>
        this.schema.isValid(r.responseDefinition, body),
      requestBodyValidator: r.requestDefinition
        ? (body) => this.schema.isValid(r.requestDefinition!, body)
        : undefined,
      handler: r.handler,
      silent: this.config.silent,
    });
    if (r.method === "POST") {
      this.app.post(r.url, handler);
    } else {
      this.app.get(r.url, handler);
    }
    if (!this.config.silent) {
      console.log(`Handling ${r.method} on ${r.url}`);
    }
  }
}

export interface BusinessApiConfig {
  schemaPath: string;
  silent?: boolean;
  port?: number;
}
