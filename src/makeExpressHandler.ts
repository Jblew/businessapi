import express from "express";

export function makeExpressHandler(r: {
  responseBodyValidator: (body: any) => { isValid: boolean; error: string };
  requestBodyValidator?: (body: any) => { isValid: boolean; error: string };
  handler: (body?: any) => Promise<any>;
  silent?: boolean;
}) {
  return async (req: express.Request, res: express.Response) => {
    try {
      let requestBody = undefined;
      if (r.requestBodyValidator) {
        requestBody = req.body;
        if (!requestBody || typeof requestBody !== "object") {
          throw new Error("Request body must be a JSON object");
        }
        const { isValid, error } = r.requestBodyValidator(requestBody);
        if (!isValid) {
          return res.status(409).send({ error });
        }
      }
      const responseBody = await r.handler(requestBody);
      const { isValid, error } = r.responseBodyValidator(responseBody);
      if (!isValid) {
        throw new Error(`Handler response is not valid: ${error}`);
      }
      return res.status(200).send(responseBody);
    } catch (err) {
      if (!r.silent) console.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  };
}
