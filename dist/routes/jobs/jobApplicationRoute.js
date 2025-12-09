const express = require("express");
const authService = require("../../services/jobSeekersAuthService");
const { createJobApplication, deleteJobApplication, getAllJobApplications, getOneJobApplication, updateJobApplication, } = require("../../services/jobs/jobApplicationService");
const jobApplicationRoute = express.Router();
jobApplicationRoute
    .route("/")
    .get(getAllJobApplications)
    .post(authService.protect, createJobApplication);
jobApplicationRoute
    .route("/:id")
    .get(getOneJobApplication)
    .put(updateJobApplication)
    .delete(authService.protect, deleteJobApplication);
module.exports = jobApplicationRoute;
