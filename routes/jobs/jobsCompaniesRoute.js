const express = require("express");
const authService = require("../../services/employeeAuthService");
const {
  getCompanies,
  processCompanyFiles,
  uploadCompanyFiles,
  createCompany,
  getCompany,
  updateCompany,
  deleteCompany,
} = require("../../services/jobs/jobsCompaniesService");

const jobsCompaniesRoute = express.Router();

jobsCompaniesRoute
  .route("/")
  .get(getCompanies)
  .post(
    authService.protect,
    uploadCompanyFiles,
    processCompanyFiles,
    createCompany
  );

jobsCompaniesRoute
  .route("/:id")
  .get(getCompany)
  .put(
    authService.protect,
    uploadCompanyFiles,
    processCompanyFiles,
    updateCompany
  )
  .delete(authService.protect, deleteCompany);

module.exports = jobsCompaniesRoute;
