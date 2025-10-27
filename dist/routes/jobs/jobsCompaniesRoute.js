const express = require("express");
const authService = require("../../services/authService");
const { getCompanies, uploadCompaniesImage, resizerCompanyImage, createCompany, getCompany, updateCompany, deleteCompany, } = require("../../services/jobs/jobsCompaniesService");
const jobsCompaniesRoute = express.Router();
jobsCompaniesRoute
    .route("/")
    .get(getCompanies)
    .post(authService.protect, uploadCompaniesImage, resizerCompanyImage, createCompany);
jobsCompaniesRoute
    .route("/:id")
    .get(getCompany)
    .put(authService.protect, uploadCompaniesImage, resizerCompanyImage, updateCompany)
    .patch(authService.protect, deleteCompany);
module.exports = jobsCompaniesRoute;
