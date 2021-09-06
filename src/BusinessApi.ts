import express from "express";
import { AddressInfo } from "net";
import { Schema } from "./Schema";
export class BusinessApi {
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
      // console.log(`Listening at :${port}`);
    });
    return httpServer;
  }

  async callPOST<RESPONSE>(c: POSTCallConfig): Promise<RESPONSE> {
    throw new Error("Not implemented yet");
  }

  async callGET<RESPONSE>(c: POSTCallConfig): Promise<RESPONSE> {
    throw new Error("Not implemented yet");
  }

  handlePOST<REQUEST>(
    c: POSTHandlerConfig,
    handler: (body: REQUEST) => Promise<unknown>
  ) {
    throw new Error("Not implemented yet");
  }

  handleGET(c: GETHandlerConfig, handler: () => Promise<unknown>) {
    throw new Error("Not implemented yet");
  }

  private makeExpressApp() {
    const app = express();
    app.use(express.json());
    return app;
  }

  private installDefaultHandlers() {
    this.app.get("/", (_, res) => {
      res.send("");
    });
    this.app.get("/schema", (_, res) => {
      res.send(this.schema.getSchemaObject());
    });
  }
}

export interface BusinessApiConfig {
  schemaPath: string;
}

export interface GETCallConfig {
  urlEnv: string;
  responseDefinition: string;
  data: unknown;
}

export interface POSTCallConfig extends GETCallConfig {
  requestDefinition: string;
}

export interface GETHandlerConfig {
  url: string;
  responseDefinition: string;
}

export interface POSTHandlerConfig extends GETHandlerConfig {
  requestDefinition: string;
}
