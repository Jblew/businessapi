import express from "express";
import { AddressInfo } from "net";
import { Schema } from "./Schema";
import morgan from "morgan";
import { installSchemaHandlers } from "./endpoints_schema";
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
      if (!this.config.silent) console.log(`Listening at :${port}`);
    });
    return httpServer;
  }

  endpoint(urlEnv: string) {
    return {
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (): Promise<RESPONSE> => {
          return this.makeRequest<RESPONSE>({
            method: "GET",
            urlEnv,
            responseDefinition,
          });
        },
        post: (body: any) => {
          return {
            requestSchema: (requestDefinition: string): Promise<RESPONSE> => {
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

  /*

  apiServ
  .handleGET("/dashboards/ceo")
  .responseSchema("DashboardSpec")
  .handle(() => {});

apiServ
  .handlePOST("/processes/complaint/complain")
  .requestSchema("ComplaintSpec")
  .responseSchema("GoodResponse")
  .handle((body) => {});

  */

  handleGET(url: string) {
    return {
      responseSchema: (responseDefinition: string) => ({
        handle: (handler: () => Promise<any>) => {
          this.installHandler({
            method: "GET",
            url,
            responseDefinition,
            handler,
          });
        },
      }),
    };
  }

  handlePOST(url: string) {
    return {
      requestSchema: (requestDefinition: string) => ({
        responseSchema: (responseDefinition: string) => ({
          handle: (handler: () => Promise<any>) => {
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
    throw new Error("Not implemented yet");
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
