import express from "express";
import { AddressInfo } from "net";
import { Schema } from "./Schema";
import morgan from "morgan";
import { installSchemaHandlers } from "./endpoints_schema";
import axios from "axios";
import { BusinessApi } from "./BusinessApi";
import { BusinessApiAbstract } from "./BusinessApiAbstract";
import { ConditionValidatorFn } from "src";

export class BusinessApiHTTP
  extends BusinessApiAbstract
  implements BusinessApi
{
  private app: express.Application;

  constructor(private config: BusinessApiHTTPConfig) {
    super(config);
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

  protected bindHandler(r: {
    method: "GET" | "POST";
    url: string;
    conditionValidators: ConditionValidatorFn[];
    handler: (
      headers: Record<string, string>,
      body?: any
    ) => Promise<{ status: number; json: object }>;
  }): void {
    const expressHandler = async (
      req: express.Request,
      res: express.Response
    ) => {
      const headers = headersToRecord(req.headers);
      const { status, json } = await r.handler(headers, req.body);
      res.status(status).send(json);
    };
    if (r.method === "GET") {
      this.app.get(r.url, expressHandler);
    } else {
      this.app.post(r.url, expressHandler);
    }
  }

  protected async makeRequest(r: {
    method: "GET" | "POST";
    urlEnv: string;
    body?: any;
  }): Promise<{ status: number; data: any }> {
    const url = process.env[r.urlEnv];
    if (!url) {
      throw new TypeError(`Env ${r.urlEnv} does not exist`);
    }
    const { status, data } = await axios({
      method: r.method,
      url,
      data: r.body,
      validateStatus: () => true,
    });
    return { status, data };
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
}

function headersToRecord(
  expressHeaders: Record<string, string[] | string | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};

  Object.keys(expressHeaders).forEach((k) => {
    const v = expressHeaders[k];
    if (typeof v !== "undefined") {
      out[k] = Array.isArray(v) ? v[0] : v;
    }
  });

  return out;
}

export interface BusinessApiHTTPConfig {
  schemaPath: string;
  silent?: boolean;
  port?: number;
}
