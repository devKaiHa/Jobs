const express = require("express");
const authService = require("../../services/employeeAuthService");
const {
  resizerUserImage,
  getJobUser,
  updateJobUser,
  deleteJobUser,
  getJobUsers,
  uploadJobUsersImage,
  createJobUser,
} = require("../../services/jobs/jobsUsersService");

const jobsUsersRoute = express.Router();

jobsUsersRoute
  .route("/")
  .get(getJobUsers)
  .post(
    authService.protect,
    uploadJobUsersImage,
    resizerUserImage,
    createJobUser
  );

jobsUsersRoute
  .route("/:id")
  .get(getJobUser)
  .put(
    authService.protect,
    uploadJobUsersImage,
    resizerUserImage,
    updateJobUser
  )
  .delete(authService.protect, deleteJobUser);

module.exports = jobsUsersRoute;
