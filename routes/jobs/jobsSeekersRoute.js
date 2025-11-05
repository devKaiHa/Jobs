const express = require("express");
const authService = require("../../services/jobSeekersAuthService");
const {
  getJobUser,
  updateJobUser,
  deleteJobUser,
  getJobUsers,
} = require("../../services/jobs/jobSeekersService");

const {
  uploadJobSeekerFiles,
  processJobSeekerFiles,
} = require("../../services/jobSeekersAuthService");

const jobsUsersRoute = express.Router();

jobsUsersRoute.route("/").get(getJobUsers);

jobsUsersRoute
  .route("/:id")
  .get(getJobUser)
  .put(
    authService.protect,
    uploadJobSeekerFiles,
    processJobSeekerFiles,
    updateJobUser
  )
  .delete(authService.protect, deleteJobUser);

module.exports = jobsUsersRoute;
