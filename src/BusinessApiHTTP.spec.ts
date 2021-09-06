import { expect } from "chai";
import request from "supertest";
import { BusinessApiHTTP } from "./BusinessApiHTTP";
import * as fs from "fs";
import nock from "nock";

describe("BusinessApiHTTP", () => {
  let businessApi: BusinessApiHTTP = makeBusinessApi();
  let businessApiServer: { close(): void };
  beforeEach(() => {
    businessApi = makeBusinessApi();
    businessApiServer = businessApi.listen();
  });
  afterEach(() => businessApiServer.close());

  describe("listen", () => {
    it("Serves blank page at root", async () => {
      return request(businessApiServer)
        .get("/")
        .expect(200)
        .then((resp) => expect(resp.text).to.be.empty);
    });

    it("Responds with 404 on not found", async () => {
      return request(businessApiServer).get("/nonexistent").expect(404);
    });

    it("Serves JSON schema at /schema", async () => {
      return request(businessApiServer)
        .get("/schema")
        .expect(200)
        .then((resp) =>
          expect(resp.body.definitions).to.haveOwnProperty("AllEmployeesSpec")
        );
    });

    describe("Schema compatibility endpoint", () => {
      it("Responds with 400 on missing POST body", async () => {
        return request(businessApiServer)
          .post(
            "/schema/is_definition_compatible?definition_name=AllEmployeesSpec"
          )
          .send()
          .expect(400)
          .then((resp) => expect(resp.body.error).to.be.string);
      });

      it("Responds with 400 on missing definition name", async () => {
        const schema = getSchema();
        return request(businessApiServer)
          .post("/schema/is_definition_compatible")
          .send(schema)
          .expect(400)
          .then((resp) => expect(resp.body.error).to.be.string);
      });

      it("Responds with 400 on wrong definition", async () => {
        const schema = getSchema();
        return request(businessApiServer)
          .post("/schema/is_definition_compatible?definition_name=NonExistent")
          .send(schema)
          .expect(400)
          .then((resp) => expect(resp.body.error).to.be.string);
      });

      it("Responds with 200 when definitions are compatible", async () => {
        const schema = getSchema();
        return request(businessApiServer)
          .post(
            "/schema/is_definition_compatible?definition_name=AllEmployeesSpec"
          )
          .send(schema)
          .expect(200)
          .then((resp) => expect(resp.body.ok).to.be.true);
      });

      it("Responds with 409 when definitions are incompatible", async () => {
        const schema = getSchema();
        schema.definitions.AllEmployeesSpec.properties.SchemaVer["$id"] =
          "0.1.0";
        return request(businessApiServer)
          .post(
            "/schema/is_definition_compatible?definition_name=AllEmployeesSpec"
          )
          .send(schema)
          .expect(409)
          .then((resp) => {
            expect(resp.body.error).to.match(/update your definition/i);
          });
      });
    });
  });

  describe("endpoint - get", () => {
    it("Throws error when url env is empty", () =>
      businessApi
        .call("NONEXISTENT_URL")
        .responseSchema("ChartSpec")
        .get()
        .then(
          () => expect.fail("Should fail"),
          (err) => expect(err).to.match(/env .* does not exist/i)
        ));

    it("Throws error when response definition is not found", () => {
      process.env.SERVICE_URL = "http://localhost/";
      return businessApi
        .call("SERVICE_URL")
        .responseSchema("Nonexistent")
        .get()
        .then(
          () => expect.fail("Should fail"),
          (err) =>
            expect(err).to.match(/response schema definition .* not found/i)
        );
    });

    it("Calls url specified by named env", async () => {
      const serviceURL = "http://nock.test/get/employee";
      process.env.SERVICE_URL_GET_EMPLOYEE = serviceURL;
      const interceptor = nock("http://nock.test")
        .get("/get/employee")
        .reply(
          200,
          JSON.stringify({
            firstName: "a",
            lastName: "b",
            username: "c",
            roles: [],
          })
        );
      const resp = await businessApi
        .call("SERVICE_URL_GET_EMPLOYEE")
        .responseSchema<any>("Employee")
        .get();
      expect(resp.firstName).to.equal("a");
      expect(interceptor.isDone()).to.be.true;
    });

    it("Throws error when response body is invalid against schema", async () => {
      const serviceURL = "http://nock.test/get/employee";
      process.env.SERVICE_URL_GET_EMPLOYEE = serviceURL;
      const interceptor = nock("http://nock.test")
        .get("/get/employee")
        .reply(
          200,
          JSON.stringify({
            firstName: "a",
            lastName: "b",
            username: 1,
            roles: [],
          })
        );
      try {
        await businessApi
          .call("SERVICE_URL_GET_EMPLOYEE")
          .responseSchema<any>("Employee")
          .get();
        expect.fail("Should throw error");
      } catch (err) {
        expect(err).to.match(
          /response is not valid against schema .* \/username/i
        );
      }
      expect(interceptor.isDone()).to.be.true;
    });
  });

  describe("endpoint - post", () => {
    it("Throws error when url env is empty", () =>
      businessApi
        .call("NONEXISTENT_URL")
        .responseSchema("ChartSpec")
        .requestSchema("Nonexistent")
        .post({})
        .then(
          () => expect.fail("Should fail"),
          (err) => expect(err).to.match(/env .* does not exist/i)
        ));

    it("Throws error when request definition is not found", () => {
      process.env.SERVICE_URL = "http://localhost/";
      return businessApi
        .call("SERVICE_URL")
        .responseSchema("ChartSpec")
        .requestSchema("Nonexistent")
        .post({})
        .then(
          () => expect.fail("Should fail"),
          (err) =>
            expect(err).to.match(/request schema definition .* not found/i)
        );
    });

    it("Throws error when response definition is not found", () => {
      process.env.SERVICE_URL = "http://localhost/";
      return businessApi
        .call("SERVICE_URL")
        .responseSchema("Nonexistent")
        .requestSchema("ChartSpec")
        .post({})
        .then(
          () => expect.fail("Should fail"),
          (err) =>
            expect(err).to.match(/response schema definition .* not found/i)
        );
    });

    it("Calls url specified by named env", async () => {
      const serviceURL = "http://nock.test/set/employee";
      process.env.SERVICE_URL_GET_EMPLOYEE = serviceURL;
      const interceptor = nock("http://nock.test")
        .post("/set/employee")
        .reply(
          200,
          JSON.stringify({
            firstName: "a",
            lastName: "b",
            username: "c",
            roles: [],
          })
        );
      const resp = await businessApi
        .call("SERVICE_URL_GET_EMPLOYEE")
        .responseSchema<any>("Employee")
        .requestSchema("Employee")
        .post({
          firstName: "a",
          lastName: "b",
          username: "c",
          roles: [],
        });
      expect(resp.firstName).to.equal("a");
      expect(interceptor.isDone()).to.be.true;
    });

    it("Throws error when response body is invalid against schema", async () => {
      const serviceURL = "http://nock.test/set/employee";
      process.env.SERVICE_URL_GET_EMPLOYEE = serviceURL;
      const interceptor = nock("http://nock.test")
        .post("/set/employee")
        .reply(
          200,
          JSON.stringify({
            firstName: "a",
            lastName: "b",
            username: 5,
            roles: [],
          })
        );
      try {
        await businessApi
          .call("SERVICE_URL_GET_EMPLOYEE")
          .responseSchema<any>("Employee")
          .requestSchema("Employee")
          .post({
            firstName: "a",
            lastName: "b",
            username: "c",
            roles: [],
          });
        expect.fail("Should throw error");
      } catch (err) {
        expect(err).to.match(/response definition/i);
      }
      expect(interceptor.isDone()).to.be.true;
    });

    it("Throws error when request data is invalid against schema", async () => {
      const serviceURL = "http://nock.test/set/employee";
      process.env.SERVICE_URL_GET_EMPLOYEE = serviceURL;
      const interceptor = nock("http://nock.test")
        .post("/set/employee")
        .reply(
          200,
          JSON.stringify({
            firstName: "a",
            lastName: "b",
            username: "c",
            roles: [],
          })
        );
      try {
        await businessApi
          .call("SERVICE_URL_GET_EMPLOYEE")
          .responseSchema<any>("Employee")
          .requestSchema("Employee")
          .post({
            firstName: "a",
            lastName: "b",
            username: 5,
            roles: [],
          });
        expect.fail("Should throw error");
      } catch (err) {
        expect(err).to.match(/invalid request/i);
      }
      expect(interceptor.isDone()).to.be.true;
    });
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

  /* HELPERS */
  function getSchema() {
    return JSON.parse(
      fs.readFileSync(`${__dirname}/../mock/demo.schema.json`).toString()
    );
  }
  function makeBusinessApi() {
    return new BusinessApiHTTP({
      schemaPath: `${__dirname}/../mock/demo.schema.json`,
      silent: true,
    });
  }
});
