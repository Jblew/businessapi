import { expect } from "chai";

describe("BusinessApiTest", () => {
  it("Specify structure, behaviour and tests for BusinessApiTest mocking");

  describe("fakeService", () => {
    it("Creates service that can be accessed via env name");
    it("Calls handler");
    it("Returns handler response to the call()");
    it("Resolves with request body");
  });

  describe("fakeCall", () => {
    it("Calls the installed with get");
    it("Calls the installed with post");
    it(
      "Calls the installed with post and passes the data to the local handler"
    );
    it("Resolves with response body");
  });
});
