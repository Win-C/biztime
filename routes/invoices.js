"use strict";

/** Routes about invoices. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

const middleware = require("./middleware");

/** GET /invoices: - returns `{invoices: [{id, comp_code}, ...]}` */

router.get("/", async function (req, res, next) {
  const iResult = await db.query("SELECT id, comp_code FROM invoices");
  const invoices = iResult.rows;

  return res.json({ invoices });
});

/** GET /invoices/:id - returns {
 *     invoice: { id, amt, paid, add_date, paid_date
 *                company: {code, name, description }
 *  } 
 **/

router.get("/:id", async function (req, res, next) {
  const id = req.params.id;
  const iResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
           FROM invoices
           WHERE id = $1`, [id]);
  const invoice = iResults.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  const comp_code = invoice.comp_code;

  const cResults = await db.query(
    `SELECT code, name, description
           FROM companies
           WHERE companies.code = $1`, [comp_code]);
  invoice.company = cResults.rows[0];

  // Deleting comp code from API resp
  delete invoice.comp_code;

  return res.json({ invoice });
});

/** POST /invoices: - create invoice from data;
 *  request sent with JSON body of { comp_code, amt };
 *  return `{ invoice : {id, comp_code, amt, paid, add_date, paid_date }}` */

router.post("/", middleware.checkInvoiceReqBody, async function (req, res, next) {

  const { comp_code, amt } = req.body;
  let iResult;
  try {
    iResult = await db.query(
      `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2)
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]); 
  } catch (err) {
    throw new BadRequestError(`Invalid inputs`);
  }

  const invoice = iResult.rows[0];

  return res.status(201).json({ invoice });
});

/** PUT /invoices/:id: - update fields in invoice;
 *  request sent with JSON body of {amt};
 *  return `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */

router.put("/:id", middleware.checkInvoiceReqBody, async function (req, res, next) {

  const id = req.params.id;
  const { amt } = req.body;
  
  let iResult;
  try {
    iResult = await db.query(
      `UPDATE invoices
             SET amt=$1
             WHERE id = $2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id]
    );
  } catch (err) {
    throw new BadRequestError(`amt must be a number: ${amt}`);
  }

  const invoice = iResult.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${id}`);
  return res.json({ invoice });
});

/** DELETE /invoices/:id: - delete invoice, return `{status: "deleted"}` */

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  const iResult = await db.query(
    "DELETE FROM invoices WHERE id = $1 RETURNING id", [id]);
  const invoice = iResult.rows[0];

  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
  return res.json({ status: "deleted" });
});

module.exports = router;