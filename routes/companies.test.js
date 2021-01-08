// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");

  const cResults = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('test', 'TestCompany', 'this is a test')
    RETURNING code, name, description`);
  testCompany = cResults.rows[0];

  const iResults = await db.query(
    `
    INSERT INTO invoices (comp_code, amt)
    VALUES ($1, '300'),
           ($1, '500')
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [testCompany.code]
  );
  testInvoice = iResults.rows[0];
});

/** GET /companies - returns `{companies: [{code, name}, ...]}` */

describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const resp = await request(app).get("/companies");
    debugger;
    expect(resp.body).toEqual({
      companies: [{ code: testCompany.code, name: "TestCompany" }],
    });
  });
});
//end

/** GET /companies/:code: - returns
 * `{ company: { code, name, description,
 *              invoices: [id, ...] }
 *  }`
 **/
describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({
      company: {
        code: testCompany.code,
        name: "TestCompany",
        description: "this is a test",
        invoices: [
          {
            id: expect.any(Number),
            amt: "300.00",
          },
          {
            id: expect.any(Number),
            amt: "500.00",
          },
        ],
      },
    });
  });

  // Pessimistic Test
  test("Responds with 404 if company not found", async function () {
    const resp = await request(app).get(`/companies/no-way-exists`);
    expect(resp.statusCode).toEqual(404);
  });
});
//end

/** POST /companies: - create company from data;
 *  request sent with JSON body of {code, name, description};
 *  return `{company: {code, name, description}}` */
describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app).post(`/companies`).send({
      code: "rithm",
      name: "RithmSchool",
      description: "this is also a test",
    });

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: {
        code: "rithm",
        name: "RithmSchool",
        description: "this is also a test",
      },
    });
  });

  // Pessimistic case: goes to middleware to throw error
  test("Missing input to create a company", async function () {
    const resp = await request(app).post(`/companies`).send({
      name: "testCompany2",
      description: "this will not work",
    });

    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message).toEqual("Missing arguments in request");
  });

  // Pessimistic case
  test("Company already exists", async function () {
    const resp = await request(app).post(`/companies`).send({
      code: "test",
      name: "testCompany",
      description: "this will not work",
    });

    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message).toEqual("Company already exists: test");
  });
});
// end

/** PUT /companies/:code: - update fields in company;
 *  request sent with JSON body of {name, description};
 *  return `{company: {code, name, description}}` */

describe("PUT /companies/:code", function () {
  test("Update a single company", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ 
              name: "testUpdated",
              description: "this description was updated" 
            });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: {
        code: "test",
        name: "testUpdated",
        description: "this description was updated",
      },
    });
  });

  // Pessimistic test
  test("Respond with 404 if not found", async function () {
    const resp = await request(app)
      .put(`/companies/no-way-exists`)
      .send({ 
        name: "testUpdated2",
        description: "this will not work" 
      });
    expect(resp.statusCode).toEqual(404);
  });

  test("Respond with 400 if no inputs given", async function () {
    const resp = await request(app).put(`/companies/no-way-exists`);
    expect(resp.statusCode).toEqual(400);
  });
});
// end

/** DELETE /companies/:code: - delete company, return `{status: "deleted"}` */
describe("DELETE /companies/:code", function () {
  test("Delete single company", async function () {
    const resp = await request(app).delete(`/companies/${testCompany.code}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });
  });

  // Pessimistic test
  test("Respond with 404 if not found", async function () {
    const resp = await request(app).delete(`/companies/no-way-exists`);
    expect(resp.statusCode).toEqual(404);
  });
});
// end

afterAll(async function () {
  // close db connection --- if you forget this, Jest will hang
  await db.end();
});
