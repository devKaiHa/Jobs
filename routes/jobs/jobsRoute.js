const express = require("express");
const authService = require("../../services/employeeAuthService");
const {
  createJob,
  deleteJob,
  getJob,
  resizeJobImage,
  updateJob,
  uploadJobsImage,
  getJobById
} = require("../../services/jobs/jobsService");

const jobsRoute = express.Router();

jobsRoute
  .route("/")
  .get(getJob)
  .post(authService.protect, uploadJobsImage, resizeJobImage, createJob);

jobsRoute
  .route("/:id")
  .get(getJobById)
  .put(authService.protect, uploadJobsImage, resizeJobImage, updateJob)
  .delete(authService.protect, deleteJob);

module.exports = jobsRoute;
