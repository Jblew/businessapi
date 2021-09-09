import { BusinessApiRequestParams, ConditionValidatorFn } from "src";
import { BusinessApi } from "./BusinessApi";
import { BusinessApiAbstract } from "./BusinessApiAbstract";

export class BusinessApiTest
  extends BusinessApiAbstract
  implements BusinessApi
{
  private services: {
    [name: string]: (body?: any) => Promise<{ status: number; data: any }>;
  } = {};

  private handlers: {
    [url: string]: (
      params: BusinessApiRequestParams,
      body?: any
    ) => Promise<{ status: number; json: any }>;
  } = {};

  listen(): { close: () => void } {
    return { close() {} };
  }

  /**
   * Creates fake service that can be called directly using call()
   * @param envName
   * @param handler
   */
  async fakeService<REQUEST, RESPONSE>(
    envName: string,
    handler: (body?: REQUEST) => Promise<{ status: number; data: RESPONSE }>
  ): Promise<REQUEST> {
    return new Promise((resolve, reject) => {
      this.services[envName] = async (requestBody?: any) => {
        try {
          const { status, data } = await handler(requestBody);
          resolve(requestBody);
          return { status, data };
        } catch (err) {
          reject(err);
          throw err;
        }
      };
    });
  }

  /**
   * Calls local endpoint handler
   */
  fakeCall(url: string) {
    return {
      get: <RESPONSE>(
        req: Partial<BusinessApiRequestParams> = {}
      ): Promise<{ status: number; json: RESPONSE }> => {
        const handler = this.handlers[url];
        if (!handler) {
          throw new Error(`Missing handler ${url}`);
        }
        const params = { headers: {} };
        return handler(params);
      },
      post: <REQUEST, RESPONSE>(
        body: REQUEST,
        req: Partial<BusinessApiRequestParams> = {}
      ): Promise<{ status: number; json: RESPONSE }> => {
        const handler = this.handlers[url];
        if (!handler) {
          throw new Error(`Missing handler ${url}`);
        }
        const params = { headers: {} };
        return handler(params, body);
      },
    };
  }

  protected bindHandler(r: {
    method: "GET" | "POST";
    url: string;
    handler: (
      params: BusinessApiRequestParams,
      body?: any
    ) => Promise<{ status: number; json: object }>;
  }): void {
    this.handlers[r.url] = r.handler;
  }

  protected async makeRequest(r: {
    method: "GET" | "POST";
    urlEnv: string;
    body?: any;
  }): Promise<{ status: number; data: any }> {
    const service = this.services[r.urlEnv];
    if (!service) {
      throw new TypeError(
        `Fake service specified by env ${r.urlEnv} does not exist`
      );
    }
    return service(r.body);
  }
}
