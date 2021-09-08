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
          post(handler: (body: REQUEST) => Promise<RESPONSE> | RESPONSE): void;
        };
      };
      responseSchema<RESPONSE>(responseDefinition: string): {
        get(handler: () => Promise<RESPONSE> | RESPONSE): void;
      };
    };
  };
}

export type ConditionValidatorFn = (props: {
  headers: Record<string, string>;
}) => boolean | Promise<boolean>;
