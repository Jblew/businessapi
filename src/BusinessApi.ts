export interface BusinessApi {
  listen(): { close(): void };

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
    requestSchema<REQUEST>(requestDefinition: string): {
      responseSchema<RESPONSE>(responseDefinition: string): {
        post(handler: (body: REQUEST) => Promise<RESPONSE>): void;
      };
    };
    responseSchema<RESPONSE>(responseDefinition: string): {
      get(handler: () => Promise<RESPONSE>): void;
    };
  };
}

// TODO swap orders, to always include request before response
