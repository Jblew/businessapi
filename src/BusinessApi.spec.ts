import { expect } from "chai";

describe("BusinessApi", () => {
  describe("listen", () => {
    it("Serves blank page at root");
    it("Responds with 404 on not found");
    it("Serves JSON schema at /schema");

    describe("Schema compatibility endpoint", () => {
      it("Responds with 400 on missing POST body");
      it("Responds with 400 on missing definition name");
      it("Responds with 200 when definitions are compatible");
      it("Responds with 409 when definitions are incompatible");
    });
  });

  function commonCallTests() {
    it("Throws error when request definition is not found");
    it("Throws error when response definition is not found");
    it("Calls url specified by named env");
    it("Throws error when response body is invalid against schema");
  }

  describe("callPOST", () => {
    commonCallTests();
    it("Throws error when request data is invalid against schema");
  });

  describe("callGET", () => {
    commonCallTests();
  });

  function commonHandleTests() {
    it("Throws error when request definition is not found");
    it("Throws error when response definition is not found");
    it("Responds with 200 when handler is resolved");
    it("Responds with 404 on not found");
    it("Responds with 500 when handler response is invalid against schema");
    it("Responds with 500 when handler throws");
    it("Responds with 500 when handler is rejected");
  }

  describe("handlePOST", () => {
    commonHandleTests();
    it("Responds with 409 when request body is invalid against schema");
  });

  describe("handleGET", () => {
    commonHandleTests();
  });
});
