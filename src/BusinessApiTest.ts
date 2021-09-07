import express from "express";
import { AddressInfo } from "net";
import { Schema } from "./Schema";
import morgan from "morgan";
import { installSchemaHandlers } from "./endpoints_schema";
import axios from "axios";
import { BusinessApi } from "./BusinessApi";

export class BusinessApiTest implements BusinessApi {
  listen(): { close: () => void } {
    throw new Error("Not implemented yet");
  }

  call(urlEnv: string) {
    return {
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (): Promise<RESPONSE> => {
          return this.makeRequest<RESPONSE>({
            method: "GET",
            urlEnv,
            responseDefinition,
          });
        },
      }),
      requestSchema: <REQUEST>(requestDefinition: string) => ({
        responseSchema: <RESPONSE>(responseDefinition: string) => ({
          post: (body: REQUEST): Promise<RESPONSE> => {
            return this.makeRequest<RESPONSE>({
              method: "POST",
              urlEnv,
              responseDefinition,
              requestDefinition,
              body,
            });
          },
        }),
      }),
    };
  }

  handle(url: string) {
    return {
      responseSchema: <RESPONSE>(responseDefinition: string) => ({
        get: (handler: () => Promise<RESPONSE>) => {
          this.installHandler({
            method: "GET",
            url,
            responseDefinition,
            handler,
          });
        },
      }),
      requestSchema: <REQUEST>(requestDefinition: string) => ({
        responseSchema: <RESPONSE>(responseDefinition: string) => ({
          post: (handler: (body: REQUEST) => Promise<RESPONSE>) => {
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

  mockService() {
    throw new Error("Not specified yet");
  }

  mockCall() {
    throw new Error("Not specified yet");
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
