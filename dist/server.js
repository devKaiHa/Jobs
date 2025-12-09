"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _dotenv = /*#__PURE__*/ _interop_require_default(require("dotenv"));
const _cors = /*#__PURE__*/ _interop_require_default(require("cors"));
const _morgan = /*#__PURE__*/ _interop_require_default(require("morgan"));
const _errorMiddleware = require("./middlewares/errorMiddleware");
const _database = /*#__PURE__*/ _interop_require_default(require("./config/database"));
const _routes = /*#__PURE__*/ _interop_require_default(require("./routes"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
_dotenv.default.config({
    path: "config.env"
});
const app = (0, _express.default)();
// Database connection
(0, _database.default)();
// Middleware
app.use(_express.default.json());
app.use((0, _cors.default)());
app.use(_express.default.static(_path.default.join(__dirname, "uploads")));
if (process.env.NODE_ENV === "development") {
    app.use((0, _morgan.default)("dev"));
    console.log(`mode: ${process.env.NODE_ENV}`);
}
// Mount Routes
(0, _routes.default)(app);
// Global error handling middleware for express
app.use(_errorMiddleware.globalError);
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, ()=>{
    console.log(`app running on port ${PORT}`);
});
process.on("unhandledRejection", (err)=>{
    console.error(`unhandledRejection Errors:${err?.name} | ${err?.message}`);
    server.close(()=>{
        console.error(`Shutting down....`);
        process.exit(1);
    });
});
