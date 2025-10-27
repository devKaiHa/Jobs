const companyInfoRoute = require("./companyInfoRoute");
const RoleDashboardRoute = require("./roleDashboardRoute");
const authRoute = require("./authRoute");
const roleRoute = require("./roleRoute");
const jobsCompaniesRoute = require("./jobs/jobsCompaniesRoute");
const jobsUsersRoute = require("./jobs/jobsUsersRoute");
const E_userRoute = require("./ecommerce/E_usersRoutes");

const mountRoutes = (app) => {
  app.use("/api/roledashboard", RoleDashboardRoute);
  app.use("/api/role", roleRoute);
  app.use("/api/auth", authRoute);
  app.use("/api/companyinfo", companyInfoRoute);
  app.use("/api/jobCompanies", jobsCompaniesRoute);
  app.use("/api/jobUsers", jobsUsersRoute);
  app.use("/api/users", E_userRoute);
};
module.exports = mountRoutes;
