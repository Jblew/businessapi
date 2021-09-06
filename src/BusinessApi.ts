import * as express from "express";
export class BusinessApi {
  constructor(private config: BusinessApiConfig) {}

  listen(): express.Application {
    throw new Error("Not implemented yet");
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
