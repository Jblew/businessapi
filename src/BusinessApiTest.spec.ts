import { expect } from "chai";
import { BusinessApiTest } from "./BusinessApiTest";

describe("BusinessApiTest", () => {
  const validEmployee = {
    firstName: "a",
    lastName: "b",
    username: "c",
    roles: [],
  };
  const validEmployeeResponse = { status: 200, data: validEmployee };

  let businessApi: BusinessApiTest;
  beforeEach(() => {
    businessApi = new BusinessApiTest({
      schemaPath: `${__dirname}/../mock/demo.schema.json`,
      silent: true,
    });
  });

  describe("fakeService", () => {
    it("Calls handler with GET method", async () => {
      const [request, response] = await Promise.all([
        businessApi.fakeService(
          "SERVICE_URL_EMPLOYEE",
          async (_) => validEmployeeResponse
        ),
        businessApi
          .call("SERVICE_URL_EMPLOYEE")
          .responseSchema<any>("Employee")
          .get(),
      ]);
      expect(request).to.be.undefined;
      expect(response.firstName).to.be.equal(validEmployee.firstName);
    });

    it("Passes POST body to the handler", async () => {
      let passedRequest: any;
      const [request, response] = await Promise.all([
        businessApi.fakeService("SERVICE_URL_EMPLOYEE", async (body: any) => {
          passedRequest = body;
          return validEmployeeResponse;
        }),
        businessApi
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
    it("Calls the installed with get", async () => {
      let callCount = 0;
      businessApi
        .handle("/test")
        .conditions([])
        .responseSchema("Employee")
        .get(async () => {
          callCount++;
          return validEmployee;
        });
      const { status, json } = await businessApi.fakeCall("/test").get();
      expect(callCount).to.be.equal(1);
      expect(status).to.equal(200);
      expect((json as any).username).to.be.equal(validEmployee.username);
    });

    it("fakeCall.get - passes headers", async () => {
      let lastHeaders: Record<string, string> = {};
      businessApi
        .handle("/test")
        .conditions([])
        .responseSchema("Employee")
        .get(async ({ headers }) => {
          lastHeaders = headers;
          return validEmployee;
        });
      const { status } = await businessApi
        .fakeCall("/test")
        .get({ headers: { "X-Some-Header": "qwerty" } });
      expect(status).to.equal(200);
      expect(lastHeaders["x-some-header"]).to.be.equal("qwerty");
    });

    it("Calls the installed with post and passes the data to the local handler", async () => {
      let callCount = 0;
      let requestBody: any;
      businessApi
        .handle("/test")
        .conditions([])
        .requestSchema("Employee")
        .responseSchema("Employee")
        .post(async (body: any) => {
          callCount++;
          requestBody = body;
          return validEmployee;
        });
      const { status, json } = await businessApi
        .fakeCall("/test")
        .post(validEmployee);
      expect(callCount).to.be.equal(1);
      expect(status).to.equal(200);
      expect((json as any).username).to.be.equal(validEmployee.username);
      expect(requestBody.username).to.be.equal(validEmployee.username);
    });

    it("fakeCall.post - passes headers", async () => {
      let lastHeaders: Record<string, string> = {};
      businessApi
        .handle("/test")
        .conditions([])
        .requestSchema("Employee")
        .responseSchema("Employee")
        .post(async (_, { headers }) => {
          lastHeaders = headers;
          return validEmployee;
        });
      const { status } = await businessApi
        .fakeCall("/test")
        .post(validEmployee, { headers: { "X-Some-Header": "qwerty" } });
      expect(status).to.equal(200);
      expect(lastHeaders["x-some-header"]).to.be.equal("qwerty");
    });
  });
});
