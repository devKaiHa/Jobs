const express = require("express");
const authService = require("../../services/employeeAuthService");
const {
  resizerUserImage,
  getJobUser,
  updateJobUser,
  deleteJobUser,
  getJobUsers,
  processJobUserFiles,
  uploadJobUserFiles,
  createJobUser,
} = require("../../services/jobs/jobSeekersService");

const jobsUsersRoute = express.Router();

jobsUsersRoute
  .route("/")
  .get(getJobUsers)
  .post(
    authService.protect,
    uploadJobUserFiles,
    processJobUserFiles,
    createJobUser
  );

jobsUsersRoute
  .route("/:id")
  .get(getJobUser)
  .put(
    authService.protect,
    uploadJobUserFiles,
    processJobUserFiles,
    updateJobUser
  )
  .delete(authService.protect, deleteJobUser);

module.exports = jobsUsersRoute;
