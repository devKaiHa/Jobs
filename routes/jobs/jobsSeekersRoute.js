const express = require("express");
const authService = require("../../services/employeeAuthService");
const {
  resizerUserImage,
  getJobUser,
  updateJobUser,
  deleteJobUser,
  getJobUsers,
  resizeUserImage,
  uploadJobUserImage,
  createJobUser,
} = require("../../services/jobs/jobSeekersService");

const jobsUsersRoute = express.Router();

jobsUsersRoute
  .route("/")
  .get(getJobUsers)
  .post(
    authService.protect,
    uploadJobUserImage,
    resizeUserImage,
    createJobUser
  );

jobsUsersRoute
  .route("/:id")
  .get(getJobUser)
  .put(
    authService.protect,
    uploadJobUserImage,
    resizeUserImage,
    updateJobUser
  )
  .delete(authService.protect, deleteJobUser);

module.exports = jobsUsersRoute;
