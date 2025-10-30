const express = require("express");
const authService = require("../services/employeeAuthService");
const {
  createJobs,
  deleteJob,
  getAllJobs,
  getOneJob,
  updateJob,
  resizeCompanyLogo,
  uploadCompanyLogo,
} = require("../services/jobs/jobAdvertisementService");

const jobRoute = express.Router();

jobRoute
  .route("/")
  .get(getAllJobs)
  .post(uploadCompanyLogo, resizeCompanyLogo, createJobs);

jobRoute
  .route("/:id")
  .get(getOneJob)
  .put(uploadCompanyLogo, resizeCompanyLogo, updateJob)
  .delete(deleteJob);

module.exports = jobRoute;
