import { expect } from "chai";
import { BusinessApiTest } from "./BusinessApiTest";

describe("BusinessApiTest", () => {
  const validEmployee = {
    firstName: "a",
    lastName: "b",
    username: "c",
    rules: [],
  };
  describe("fakeService", () => {
    it("Creates service that can be accessed via env name", () => {});

    it("Calls handler with GET method", async () => {
      const test = new BusinessApiTest();
      const [request, response] = await Promise.all([
        test.fakeService("SERVICE_URL_EMPLOYEE", async (_) => validEmployee),
        test.call("SERVICE_URL_EMPLOYEE").responseSchema<any>("Employee").get(),
      ]);
      expect(request).to.be.undefined;
      expect(response.firstName).to.be.equal(validEmployee.firstName);
    });

    it("Passes POST body to the handler", async () => {
      const test = new BusinessApiTest();
      let passedRequest: any;
      const [request, response] = await Promise.all([
        test.fakeService("SERVICE_URL_EMPLOYEE", async (body: any) => {
          passedRequest = body;
          return validEmployee;
        }),
        test
          .call("SERVICE_URL_EMPLOYEE")
          .requestSchema<any>("Employee")
          .responseSchema<any>("Employee")
          .post(validEmployee),
      ]);
      expect(request.firstName).to.be.equal(validEmployee.firstName);
      expect(passedRequest.firstName).to.be.equal(validEmployee.firstName);
    });
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
