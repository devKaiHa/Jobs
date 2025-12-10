const express = require("express");
const authService = require(".././services/employeeAuthService");
const {
  deleteEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
} = require(".././services/employeeService");

const {
  uploadEmployeeImage,
  processEmployeeImage,
} = require("../services/employeeAuthService");

const jobsUsersRoute = express.Router();

jobsUsersRoute.route("/").get(getEmployees);

jobsUsersRoute
  .route("/:id")
  .get(getEmployee)
  .put(
    authService.protect,
    uploadEmployeeImage,
    processEmployeeImage,
    updateEmployee
  )
  .delete(authService.protect, deleteEmployee);

module.exports = jobsUsersRoute;
