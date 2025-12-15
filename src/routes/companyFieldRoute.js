const express = require("express");
const authService = require(".././services/employeeAuthService");
const {
  getAllCompanyFields,
  getOneCompanyField,
  createCompanyField,
  updateCompanyField,
  deleteCompanyField,
} = require("../services/companyFieldService");

const companyFieldRoute = express.Router();

companyFieldRoute.route("/").get(getAllCompanyFields).post(createCompanyField);

companyFieldRoute
  .route("/:id")
  .get(getOneCompanyField)
  .put(updateCompanyField)
  .delete(deleteCompanyField);

module.exports = companyFieldRoute;
