export interface BusinessApi {
  listen(): { close(): void };

  call(urlEnv: string): {
    responseSchema<RESPONSE>(responseDefinition: string): {
      get(): Promise<RESPONSE>;
      requestSchema<REQUEST>(requestDefinition: string): {
        post(body: REQUEST): Promise<RESPONSE>;
      };
    };
  };

  handle(url: string): {
    responseSchema<RESPONSE>(responseDefinition: string): {
      get(handler: () => Promise<RESPONSE>): void;
      requestSchema<REQUEST>(requestDefinition: string): {
        post(handler: (body: REQUEST) => Promise<RESPONSE>): void;
      };
    };
  };
}
