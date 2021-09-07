import axios from "axios";
import { Schema } from "./Schema";

export async function makeRequest<R>(r: {
  method: "POST" | "GET";
  urlEnv: string;
  responseDefinition: string;
  requestDefinition?: string;
  body?: any;
  schema: Schema;
}): Promise<R> {
  const url = process.env[r.urlEnv];
  if (!url) {
    throw new TypeError(`Env ${r.urlEnv} does not exist`);
  }
  if (!r.schema.hasDefinition(r.responseDefinition)) {
    throw new TypeError(
      `Response schema definition ${r.responseDefinition} not found`
    );
  }
  if (r.requestDefinition && !r.schema.hasDefinition(r.requestDefinition)) {
    throw new TypeError(
      `Request schema definition ${r.requestDefinition} not found`
    );
  }

  if (r.method === "POST" && (!r.body || typeof r.body != "object")) {
    throw new TypeError(`When method is POST, body must be an object`);
  }

  if (r.method === "POST") {
    if (!r.requestDefinition) {
      throw new TypeError(
        `When method is POST, requestDefinition must be specified`
      );
    }
    const { isValid, error } = r.schema.isValid(r.requestDefinition!, r.body);
    if (!isValid) {
      throw new Error(
        `Request body is not valid against schema ${r.requestDefinition}: ${error}`
      );
    }
  }

  const resp = await axios({
    method: r.method,
    url,
    data: r.body,
    validateStatus: () => true,
  });
  if (resp.status !== 200) {
    let error = "(no error field in response)";
    if (
      resp.data &&
      typeof resp.data === "object" &&
      resp.data !== null &&
      !!resp.data.error
    ) {
      error = `${resp.data.error}`.substring(0, 300);
    }
    throw new Error(`Request failed (status=${resp.status}): ${error}`);
  }
  if (!(resp.data && typeof resp.data === "object" && resp.data !== null)) {
    throw new Error("Response should be an object");
  }
  const body = resp.data;
  const { isValid, error } = r.schema.isValid(r.responseDefinition, body);
  if (!isValid) {
    throw new Error(
      `Response is not valid against schema ${r.responseDefinition}: ${error}`
    );
  }
  return body;
}
