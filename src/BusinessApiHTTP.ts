import express from "express";
import { AddressInfo } from "net";
import { Schema } from "./Schema";
import morgan from "morgan";
import { installSchemaHandlers } from "./endpoints_schema";
import axios from "axios";
import { BusinessApi } from "./BusinessApi";
import { BusinessApiAbstract } from "./BusinessApiAbstract";

export class BusinessApiHTTP
  extends BusinessApiAbstract
  implements BusinessApi
{
  private app: express.Application;

  constructor(private config: BusinessApiConfig) {
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
    handler: (body?: any) => Promise<{ status: number; json: object }>;
  }): void {
    const expressHandler = async (
      req: express.Request,
      res: express.Response
    ) => {
      const { status, json } = await r.handler(req.body);
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

export interface BusinessApiConfig {
  schemaPath: string;
  silent?: boolean;
  port?: number;
}
