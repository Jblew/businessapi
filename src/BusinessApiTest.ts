import { BusinessApi } from "./BusinessApi";
import { BusinessApiAbstract } from "./BusinessApiAbstract";

export class BusinessApiTest
  extends BusinessApiAbstract
  implements BusinessApi
{
  private services: {
    [name: string]: (body?: any) => Promise<{ status: number; data: any }>;
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
      get: <RESPONSE>(): Promise<RESPONSE> => {
        throw new Error("Not specified yet");
      },
      post: <REQUEST, RESPONSE>(body: REQUEST): Promise<RESPONSE> => {
        throw new Error("Not specified yet");
      },
    };
  }

  protected bindHandler(r: {
    method: "GET" | "POST";
    url: string;
    handler: (body?: any) => Promise<{ status: number; json: object }>;
  }): void {
    throw new Error("Not implemented yet");
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
