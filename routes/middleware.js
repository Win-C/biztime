"use strict";

/**  Middleware. */

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db");

/** Function checks if JSON body has required inputs.*/

function checkCompanyReqBody(req, res, next) {
  // Check if companies route is a put or a post
  // QUESTION: Best way to handle more descriptive merror message to user
  // for what input is missing?
  // RESPONSE: Have an array of field names and loop through, if not in body
  // add to array missing. Then make error message out of that. Could put array
  // of required fields in db.js
  if (req.params.code) {
    if (!(req.body.name) || !(req.body.description)) {
      throw new BadRequestError("Missing arguments in request");
    }
    return next();
  } else {
    if (!(req.body.code) || !(req.body.name) || !(req.body.description)) {
      throw new BadRequestError("Missing arguments in request");
    }
    return next();
  }
}

/** Function turns JSON body inputs into lowercase. */

function formatInputs(req, res, next) {
  req.body.code = req.body.code.toLowerCase();
  return next();
}

/** Function checks if JSON body has required inputs for invoice */  

function checkInvoiceReqBody(req, res, next) {
  // Check if invoices route is a put or a post

  if (req.params.id) {
    if (!req.body.amt) {
      throw new BadRequestError("Missing arguments in request");
    }
    return next();
  } else {
    if (!req.body.comp_code || !req.body.amt) {
      throw new BadRequestError("Missing arguments in request");
    }
    return next();
  }
}



module.exports = { checkCompanyReqBody,
                   formatInputs, 
                   checkInvoiceReqBody, 
                  };

