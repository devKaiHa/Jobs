const express = require("express");
const { getCompanies, processCompanyFiles, uploadCompanyFiles, createCompany, getCompany, updateCompany, deleteCompany, } = require("../../services/jobs/jobsCompaniesService");
const jobsCompaniesRoute = express.Router();
jobsCompaniesRoute
    .route("/")
    .get(getCompanies)
    .post(uploadCompanyFiles, processCompanyFiles, createCompany);
jobsCompaniesRoute
    .route("/:id")
    .get(getCompany)
    .put(uploadCompanyFiles, processCompanyFiles, updateCompany)
    .delete(deleteCompany);
module.exports = jobsCompaniesRoute;
