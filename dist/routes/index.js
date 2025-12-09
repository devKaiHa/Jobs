const authRoute = require("./authRoute");
const jobsCompaniesRoute = require("./jobs/jobsCompaniesRoute");
const jobsSeekersRoute = require("./jobs/jobsSeekersRoute");
const jobAdvertisementRoute = require("./jobAdvertisementRoute");
const jobApplicationRoute = require("./jobs/jobApplicationRoute");
const employeeRoute = require("./employeeRoute");
const wishlistRoute = require("./jobs/wishlistRoute");
const mountRoutes = (app) => {
    app.use("/api/auth", authRoute);
    app.use("/api/jobCompanies", jobsCompaniesRoute);
    app.use("/api/jobsSeekers", jobsSeekersRoute);
    app.use("/api/jobAdvertisement", jobAdvertisementRoute);
    app.use("/api/jobApplication", jobApplicationRoute);
    app.use("/api/employee", employeeRoute);
    app.use("/api/wishlist", wishlistRoute);
};
module.exports = mountRoutes;
