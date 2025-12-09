"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const database_1 = __importDefault(require("./config/database"));
const routes_1 = __importDefault(require("./routes"));
dotenv_1.default.config({ path: "config.env" });
const app = (0, express_1.default)();
// Database connection
(0, database_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "uploads")));
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
    console.log(`mode: ${process.env.NODE_ENV}`);
}
// Mount Routes
(0, routes_1.default)(app);
// Global error handling middleware for express
app.use(errorMiddleware_1.globalError);
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`app running on port ${PORT}`);
});
process.on("unhandledRejection", (err) => {
    console.error(`unhandledRejection Errors:${err === null || err === void 0 ? void 0 : err.name} | ${err === null || err === void 0 ? void 0 : err.message}`);
    server.close(() => {
        console.error(`Shutting down....`);
        process.exit(1);
    });
});
