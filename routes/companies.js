"use strict";

/** Routes about companies. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

const middleware = require("./middleware.js")

/** GET /companies: - returns `{companies: [{code, name}, ...]}` */

router.get("/", async function (req, res, next) {
  const results = await db.query("SELECT code, name FROM companies");
  const companies = results.rows;

  return res.json({ companies });
});

/** GET /companies/:code: - returns `{company: {code, name, description}}` */

router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  const results = await db.query(
    "SELECT code, name, description FROM companies WHERE code = $1", [code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});

/** POST /companies: - create company from data;
 *  request sent with JSON body of {code, name, description};
 *  return `{company: {code, name, description}}` */

router.post("/", middleware.validateReqBody, middleware.formatInputs, async function (req, res, next) {
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
    [req.body.code, req.body.name, req.body.description]);
  const company = results.rows[0];

  return res.status(201).json({ company });
});

/** PATCH /companies/:code: - update fields in company;
 *  request sent with JSON body of {name, description};
 *  return `{company: {code, name, description}}` */

router.patch("/:code", middleware.validateReqBody, async function (req, res, next) {
  if ("code" in req.body) throw new BadRequestError("Not allowed");

  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
         SET name=$1, description=$2
         WHERE code = $3
         RETURNING code, name, description`,
    [req.body.name, req.body.description, code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});

/** DELETE /:code - delete company, return `{status: "deleted"}` */

router.delete("/:code", async function (req, res, next) {
  const code = req.params.code;
  const results = await db.query(
    "DELETE FROM companies WHERE code = $1 RETURNING code", [code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ status: "deleted" });
});

module.exports = router;