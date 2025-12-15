const authRoute = require("./authRoute");
const jobsCompaniesRoute = require("./jobs/jobsCompaniesRoute");
const jobsSeekersRoute = require("./jobs/jobsSeekersRoute");
const jobAdvertisementRoute = require("./jobAdvertisementRoute");
const jobApplicationRoute = require("./jobs/jobApplicationRoute");
const employeeRoute = require("./employeeRoute");
const wishlistRoute = require("./jobs/wishlistRoute");
const companyFieldRoute = require("./companyFieldRoute");

const mountRoutes = (app) => {
  app.use("/jobs/api/auth", authRoute);
  app.use("/jobs/api/jobCompanies", jobsCompaniesRoute);
  app.use("/jobs/api/jobsSeekers", jobsSeekersRoute);
  app.use("/jobs/api/jobAdvertisement", jobAdvertisementRoute);
  app.use("/jobs/api/jobApplication", jobApplicationRoute);
  app.use("/jobs/api/employee", employeeRoute);
  app.use("/jobs/api/wishlist", wishlistRoute);
  app.use("/jobs/api/field", companyFieldRoute);
};
module.exports = mountRoutes;
