const express = require("express");
const authService = require("../../services/employeeAuthService");
const {
  createJobApplication,
  deleteJobApplication,
  getAllJobApplications,
  getOneJobApplication,
  updateJobApplication,
} = require("../../services/jobs/jobApplicationService");

const jobApplicationRoute = express.Router();

jobApplicationRoute
  .route("/")
  .get(getAllJobApplications)
  .post(authService.protect, createJobApplication);

jobApplicationRoute
  .route("/:id")
  .get(getOneJobApplication)
  .put(authService.protect, updateJobApplication)
  .patch(authService.protect, deleteJobApplication);

module.exports = jobApplicationRoute;
