import { expect } from "chai";
import request from "supertest";
import { BusinessApiHTTP } from "./BusinessApiHTTP";
import * as fs from "fs";
import nock from "nock";
import axios from "axios";
import { getRandomInt } from "./util";

const port = getRandomInt(4000, 6000);
const validEmployee = {
  firstName: "a",
  lastName: "b",
  username: "c",
  roles: [],
};
const invalidEmployee = {
  firstName: "a",
  lastName: "b",
  username: 5,
  roles: [],
};

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
          expect(resp.body.definitions).to.haveOwnProperty("AllEmployees")
        );
    });

    describe("Schema compatibility endpoint", () => {
      it("Responds with 400 on missing POST body", async () => {
        return request(businessApiServer)
          .post("/schema/is_definition_compatible?definition_name=AllEmployees")
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
          .post("/schema/is_definition_compatible?definition_name=AllEmployees")
          .send(schema)
          .expect(200)
          .then((resp) => expect(resp.body.ok).to.be.true);
      });

      it("Responds with 409 when definitions are incompatible", async () => {
        const schema = getSchema();
        schema.definitions.AllEmployees.properties.SchemaVer.enum[0] = "0.1.0";
        return request(businessApiServer)
          .post("/schema/is_definition_compatible?definition_name=AllEmployees")
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
        .responseSchema("Chart")
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
        .reply(200, JSON.stringify(validEmployee));
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
        .reply(200, JSON.stringify(invalidEmployee));
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
        .requestSchema("Employee")
        .responseSchema("Chart")
        .post(validEmployee)
        .then(
          () => expect.fail("Should fail"),
          (err) => expect(err).to.match(/env .* does not exist/i)
        ));

    it("Throws error when request definition is not found", () => {
      process.env.SERVICE_URL = "http://localhost/";
      return businessApi
        .call("SERVICE_URL")
        .requestSchema("Nonexistent")
        .responseSchema("Chart")
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
        .requestSchema("Chart")
        .responseSchema("Nonexistent")
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
        .reply(200, JSON.stringify(validEmployee));
      const resp = await businessApi
        .call("SERVICE_URL_GET_EMPLOYEE")
        .requestSchema("Employee")
        .responseSchema<any>("Employee")
        .post(validEmployee);
      expect(resp.firstName).to.equal("a");
      expect(interceptor.isDone()).to.be.true;
    });

    it("Throws error when response body is invalid against schema", async () => {
      const serviceURL = "http://nock.test/set/employee";
      process.env.SERVICE_URL_GET_EMPLOYEE = serviceURL;
      const interceptor = nock("http://nock.test")
        .post("/set/employee")
        .reply(200, JSON.stringify(invalidEmployee));
      try {
        await businessApi
          .call("SERVICE_URL_GET_EMPLOYEE")
          .requestSchema("Employee")
          .responseSchema<any>("Employee")
          .post(validEmployee);
        expect.fail("Should throw error");
      } catch (err) {
        expect(err).to.match(/response is not valid.* Employee.*username/i);
      }
      expect(interceptor.isDone()).to.be.true;
    });

    it("Throws error when request data is invalid against schema", async () => {
      const serviceURL = "http://nock.test/set/employee";
      process.env.SERVICE_URL_GET_EMPLOYEE = serviceURL;
      const interceptor = nock("http://nock.test")
        .post("/set/employee")
        .reply(200, JSON.stringify(validEmployee));
      await businessApi
        .call("SERVICE_URL_GET_EMPLOYEE")
        .requestSchema("Employee")
        .responseSchema<any>("Employee")
        .post(invalidEmployee)
        .then(
          () => expect.fail("Should throw error"),
          (err) =>
            expect(err).to.match(/Request.*not valid.*Employee.*username/i)
        );
      expect(interceptor.isDone()).to.be.eq(false);
    });
  });

  describe("handle - get", () => {
    it("Throws error when response definition is not found", () =>
      expect(() =>
        businessApi
          .handle("/")
          .responseSchema("NonExistentSchema")
          .get(async () => ({}))
      ).to.throw(TypeError));

    it("Responds with 200 when handler is resolved", async () => {
      await businessApi
        .handle("/test")
        .responseSchema("Employee")
        .get(async () => validEmployee);
      const resp = await axios.get(`http://localhost:${port}/test`, {
        validateStatus: () => true,
      });
      expect(resp.status).to.equal(200);
      expect(resp.data.username).to.equal(validEmployee.username);
    });

    it("Responds with 404 on not found", async () => {
      await businessApi
        .handle("/test")
        .responseSchema("Employee")
        .get(async () => validEmployee);
      const resp = await axios.get(`http://localhost:${port}/nonexistent`, {
        validateStatus: () => true,
      });
      expect(resp.status).to.equal(404);
    });

    it("Responds with 500 when handler response is invalid against schema", async () => {
      await businessApi
        .handle("/testInvalid")
        .responseSchema("Employee")
        .get(async () => invalidEmployee);
      const resp = await axios.get(`http://localhost:${port}/testInvalid`, {
        validateStatus: () => true,
      });
      expect(resp.status).to.equal(500);
    });

    it("Responds with 500 when handler is rejected", async () => {
      await businessApi
        .handle("/test")
        .responseSchema("Employee")
        .get(async () => Promise.reject(new Error("Some error")));
      const resp = await axios.get(`http://localhost:${port}/test`, {
        validateStatus: () => true,
      });
      expect(resp.status).to.equal(500);
    });
  });

  describe("handle - post", () => {
    it("Throws error when request definition is not found", () =>
      expect(() =>
        businessApi
          .handle("/")
          .requestSchema("NonExistentSchema")
          .responseSchema("Employee")
          .post(async (_) => ({}))
      ).to.throw(/request schema definition.*NonExistentSchema.*not found/i));

    it("Responds with 409 when request body is invalid against schema", async () => {
      await businessApi
        .handle("/test")
        .requestSchema("Employee")
        .responseSchema("Employee")
        .post(async () => validEmployee);
      const resp = await axios.post(
        `http://localhost:${port}/test`,
        invalidEmployee,
        { validateStatus: () => true }
      );
      expect(resp.status).to.equal(409);
      expect(resp.data.error).to.match(/username/i);
    });

    it("Responds with 200 when handler is resolved", async () => {
      await businessApi
        .handle("/test")
        .requestSchema("Employee")
        .responseSchema("Employee")
        .post(async () => validEmployee);
      const resp = await axios.post(
        `http://localhost:${port}/test`,
        validEmployee,
        { validateStatus: () => true }
      );
      expect(resp.status).to.equal(200);
      expect(resp.data.username).to.equal(validEmployee.username);
    });

    it("Passes valid request body to the handler", async () => {
      let receivedBody: any;
      await businessApi
        .handle("/test")
        .requestSchema("Employee")
        .responseSchema("Employee")
        .post(async (body) => {
          receivedBody = body;
          return validEmployee;
        });
      const resp = await axios.post(
        `http://localhost:${port}/test`,
        { ...validEmployee, lastName: "X" },
        { validateStatus: () => true }
      );
      expect(resp.status).to.equal(200);
      expect(receivedBody!.lastName).to.equal("X");
    });

    it("Responds with 500 when handler response is invalid against schema", async () => {
      await businessApi
        .handle("/test")
        .requestSchema("Employee")
        .responseSchema("Employee")
        .post(async () => invalidEmployee);
      const resp = await axios.post(
        `http://localhost:${port}/test`,
        validEmployee,
        { validateStatus: () => true }
      );
      expect(resp.status).to.equal(500);
    });

    it("Responds with 500 when handler is rejected", async () => {
      await businessApi
        .handle("/test")
        .requestSchema("Employee")
        .responseSchema("Employee")
        .post(async () => Promise.reject(new Error("Some error")));
      const resp = await axios.post(
        `http://localhost:${port}/test`,
        validEmployee,
        { validateStatus: () => true }
      );
      expect(resp.status).to.equal(500);
    });
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
      port,
    });
  }
});
