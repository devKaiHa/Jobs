const authRoute = require("./authRoute");
const jobsCompaniesRoute = require("./jobs/jobsCompaniesRoute");
const jobsUsersRoute = require("./jobs/jobsUsersRoute");
const mountRoutes = (app) => {
    app.use("/api/auth", authRoute);
    app.use("/api/jobCompanies", jobsCompaniesRoute);
    app.use("/api/jobUsers", jobsUsersRoute);
};
module.exports = mountRoutes;
