import { Schema } from "./Schema";
export interface BusinessApi {
  listen(): { close(): void };

  getSchema(): Schema;

  call(urlEnv: string): {
    requestSchema<REQUEST>(requestDefinition: string): {
      responseSchema<RESPONSE>(responseDefinition: string): {
        post(body: REQUEST): Promise<RESPONSE>;
      };
    };
    responseSchema<RESPONSE>(responseDefinition: string): {
      get(): Promise<RESPONSE>;
    };
  };

  handle(url: string): {
    conditions(conditionValidators: ConditionValidatorFn[]): {
      requestSchema<REQUEST>(requestDefinition: string): {
        responseSchema<RESPONSE>(responseDefinition: string): {
          post(handler: BusinessApiPOSTHandlerFn<REQUEST, RESPONSE>): void;
        };
      };
      responseSchema<RESPONSE>(responseDefinition: string): {
        get(handler: BusinessApiGETHandlerFn<RESPONSE>): void;
      };
    };
  };
}

export type ConditionValidatorFn = (
  props: BusinessApiRequestParams
) => true | string | Promise<true | string>;

export interface BusinessApiRequestParams {
  headers: Record<string, string>;
}

export type BusinessApiGETHandlerFn<RESPONSE> = (
  req: BusinessApiRequestParams
) => RESPONSE | Promise<RESPONSE>;

export type BusinessApiPOSTHandlerFn<REQUEST, RESPONSE> = (
  body: REQUEST,
  req: BusinessApiRequestParams
) => RESPONSE | Promise<RESPONSE>;
