const express = require("express");
const authService = require(".././services/employeeAuthService");
const {
  deleteEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
} = require(".././services/employeeService");

const jobsUsersRoute = express.Router();

jobsUsersRoute.route("/").get(getEmployees);

jobsUsersRoute
  .route("/:id")
  .get(getEmployee)
  .put(
    authService.protect,
    updateEmployee
  )
  .delete(authService.protect, deleteEmployee);

module.exports = jobsUsersRoute;
