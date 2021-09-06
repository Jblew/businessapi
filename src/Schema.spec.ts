import { expect } from "chai";
import { Schema } from "./Schema";

describe.only("Schema", () => {
  const schemaPath = `${__dirname}/../mock/demo.schema.json`;
  describe("Constructor", () => {
    it("Throws when schema file does not exist", () => {
      expect(
        () => new Schema(`${__dirname}/../mock/nonexistent.schema.json`)
      ).to.throw();
    });

    it("Passes when schema is loaded", () => {
      expect(() => new Schema(schemaPath)).to.not.throw();
    });
  });

  describe("hasDefinition", () => {
    it("Returns true when definition exists", () => {
      const schema = new Schema(schemaPath);
      expect(schema.hasDefinition("AllEmployees")).to.be.true;
    });

    it("Returns false when definition does not exist", () => {
      const schema = new Schema(schemaPath);
      expect(schema.hasDefinition("NonExistent")).to.be.false;
    });
  });

  describe("isValid", () => {
    it("Throws when definition does not exist", () => {
      const schema = new Schema(schemaPath);
      expect(() => schema.isValid("NonExistent", {})).to.throw();
    });

    it("Returns true when data is compliant", () => {
      const schema = new Schema(schemaPath);
      expect(
        schema.isValid("Employee", {
          username: "user",
          firstName: "User",
          lastName: "User",
          roles: [],
        })
      ).to.be.true;
    });

    it("Returns false when data is not compliant", () => {
      const schema = new Schema(schemaPath);
      expect(
        schema.isValid("Employee", {
          username: "user",
          firstName: "User",
          lastName: 5,
          roles: [],
        })
      ).to.be.false;
    });
  });

  describe("getSchemaObject", () => {
    it("Returns schema object", () => {
      const schema = new Schema(schemaPath);
      expect(schema.getSchemaObject()).to.haveOwnProperty("$schema");
    });
  });

  describe("isDefinitionCompatible", () => {
    it("Throws TypeError if definition name not found", () => {
      const ourSchema = new Schema(schemaPath);
      const theirSchema = new Schema(schemaPath);
      expect(() =>
        ourSchema.isDefinitionCompatible(
          "NonExistent",
          theirSchema.getSchemaObject()
        )
      ).to.throw(TypeError);
    });

    it("Throws TypeError if definition does not have SchemaVer", () => {
      const ourSchema = new Schema(schemaPath);
      const theirSchema = new Schema(schemaPath);
      expect(() =>
        ourSchema.isDefinitionCompatible("Chart", theirSchema.getSchemaObject())
      ).to.throw(TypeError);
    });

    it("Returns true if schemavers match", () => {
      const ourSchema = new Schema(schemaPath);
      const theirSchema = new Schema(schemaPath);
      expect(
        ourSchema.isDefinitionCompatible(
          "ChartSpec",
          theirSchema.getSchemaObject()
        )
      ).to.be.equal(true);
    });

    it("Returns false when schemavers are different", () => {
      const ourSchema = new Schema(schemaPath);
      const theirSchema = new Schema(schemaPath);
      const theirSchemaObject = theirSchema.getSchemaObject();
      theirSchemaObject.definitions.ChartSpec.properties.SchemaVer.$id =
        "0.1.0";
      expect(
        ourSchema.isDefinitionCompatible("ChartSpec", theirSchemaObject)
      ).to.be.equal(false);
    });
  });
});
