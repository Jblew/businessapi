import { expect } from "chai";
import { Schema } from "./Schema";

describe("Schema", () => {
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
});
