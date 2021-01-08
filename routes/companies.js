"use strict";

/** Routes about companies. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

const middleware = require("./middleware");

/** GET /companies: - returns `{companies: [{code, name}, ...]}` */

router.get("/", async function (req, res, next) {
  const cResults = await db.query("SELECT code, name FROM companies");
  const companies = cResults.rows;

  return res.json({ companies });
});

/** GET /companies/:code: - returns 
 * `{ company: { code, name, description,
 *              invoices: [id, ...] }
 *  }` 
 **/

router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  const cResults = await db.query(
    "SELECT code, name, description FROM companies WHERE code = $1", [code]);
  const company = cResults.rows[0];
  if (!company) throw new NotFoundError(`No matching company: ${code}`);

  // grab invoice ids next for company
  const iResults = await db.query(
    "SELECT id, amt FROM invoices WHERE comp_code = $1", [code]);
  const invoices = iResults.rows;

  company.invoices = invoices;

  return res.json({ company });
});

/** POST /companies: - create company from data;
 *  request sent with JSON body of {code, name, description};
 *  return `{company: {code, name, description}}` */

router.post("/", middleware.checkCompanyReqBody,
                 middleware.formatInputs,
                 async function (req, res, next) {
    const { code, name, description } = req.body;
    let cResults;
    try {
      cResults = await db.query(
        `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
        [code, name, description]);
      } catch (err) {
        throw new BadRequestError(`Company already exists: ${code}`);
      }
    const company = cResults.rows[0];

    return res.status(201).json({ company });
  });

/** PUT /companies/:code: - update fields in company;
 *  request sent with JSON body of {name, description};
 *  return `{company: {code, name, description}}` */

router.put("/:code", middleware.checkCompanyReqBody, async function (req, res, next) {
  if ("code" in req.body) throw new BadRequestError("Not allowed");

  const { name, description } = req.body;
  const code = req.params.code;
  const cResults = await db.query(
    `UPDATE companies
         SET name=$1, description=$2
         WHERE code = $3
         RETURNING code, name, description`,
    [name, description, code]);
  const company = cResults.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});

/** DELETE /companies/:code: - delete company, return `{status: "deleted"}` */

router.delete("/:code", async function (req, res, next) {
  const code = req.params.code;
  const cResults = await db.query(
    "DELETE FROM companies WHERE code = $1 RETURNING code", [code]);
  const company = cResults.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ status: "deleted" });
});

module.exports = router;