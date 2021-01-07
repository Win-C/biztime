"use strict";

/**  Middleware. */

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db");

/** Function checks if JSON body has required inputs.*/

function validateReqBody(req, res, next) {
  // Check if companies route is a patch or a post
  // QUESTION: Best way to handle more descriptive merror message to user
  // for what input is missing?
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

/** Function turns JSON body inputs into correct format.*/

function formatInputs(req, res, next) {
  req.body.code = req.body.code.toLowerCase();
  return next();
}

module.exports = { validateReqBody, formatInputs };