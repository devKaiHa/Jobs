const authRoute = require("./authRoute");
const jobsCompaniesRoute = require("./jobs/jobsCompaniesRoute");
const jobsUsersRoute = require("./jobs/jobsSeekersRoute");
const jobAdvertisementRoute = require("./jobAdvertisementRoute");
const jobApplicationRoute = require("./jobs/jobApplicationRoute");

const mountRoutes = (app) => {
  app.use("/api/auth", authRoute);
  app.use("/api/jobCompanies", jobsCompaniesRoute);
  app.use("/api/jobUsers", jobsUsersRoute);
  app.use("/api/jobAdvertisement", jobAdvertisementRoute);
  app.use("/api/jobApplication", jobApplicationRoute);
};
module.exports = mountRoutes;
