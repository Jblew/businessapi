export class BusinessApi {
  constructor(private config: BusinessApiConfig) {}

  listen() {}

  callPOST(c: POSTCallConfig) {}
  callGET(c: POSTCallConfig) {}
  handlePOST(c: POSTHandlerConfig) {}
  handleGET(c: GETHandlerConfig) {}
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
  data: unknown;
}

export interface POSTHandlerConfig extends GETHandlerConfig {
  requestDefinition: string;
}
