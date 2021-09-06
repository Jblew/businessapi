import { Schema } from "./Schema";
import express from "express";

export function installSchemaHandlers(
  app: express.Application,
  schema: Schema
) {
  app.get("/schema", (_, res) => {
    res.send(schema.getSchemaObject());
  });
  app.post("/schema/is_definition_compatible", (req, res) =>
    schemaCompatibilityHandler(req, res)
  );

  function schemaCompatibilityHandler(
    req: express.Request,
    res: express.Response
  ) {
    if (!req.body) {
      return res.status(400).send({ error: "POST body is missing" });
    }
    if (!req.query.definition_name) {
      return res.status(400).send({ error: "?definition_name is required" });
    }
    const theirSchema = req.body;
    const definitionName = req.query.definition_name.toString();
    try {
      const result = schema.isDefinitionCompatible(definitionName, theirSchema);
      if (result) {
        return res
          .status(200)
          .send({ ok: true, msg: "Both SchemaVers are compatible" });
      } else {
        return res.status(409).send({
          error: `Your SchemaVer is not equal to our SchemaVer. Please update your definition`,
        });
      }
    } catch (err) {
      if (err instanceof TypeError) {
        return res.status(400).send({ error: err.message });
      } else {
        console.error(err);
        return res.status(500).send({ error: "Server error" });
      }
    }
  }
}
