"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJobUser = exports.updateJobUser = exports.getJobUser = exports.createJobUser = exports.getJobUsers = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const apiError_1 = __importDefault(require("../../utils/apiError"));
const jobSeekersModel_1 = __importDefault(require("../../models/jobSeekersModel"));
// ====== Get All Job Seekers ======
exports.getJobUsers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * pageSize;
    const query = {};
    if (req.query.keyword) {
        query.$or = [{ name: { $regex: req.query.keyword, $options: "i" } }];
    }
    const totalItems = await jobSeekersModel_1.default.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);
    const jobsUsers = await jobSeekersModel_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
    res.status(200).json({
        status: "success",
        totalPages,
        results: totalItems,
        data: jobsUsers,
    });
});
// ====== Create Job Seeker ======
exports.createJobUser = (0, express_async_handler_1.default)(async (req, res, next) => {
    const user = await jobSeekersModel_1.default.create(req.body);
    res.status(201).json({
        status: "success",
        message: "User inserted",
        data: user,
    });
});
// ====== Get Job Seeker by ID ======
exports.getJobUser = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const user = await jobSeekersModel_1.default.findById(id);
    if (!user)
        return next(new apiError_1.default(`No user found for ID: ${id}`, 404));
    res.status(200).json({ status: "success", data: user });
});
// ====== Update Job Seeker ======
exports.updateJobUser = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const user = await jobSeekersModel_1.default.findByIdAndUpdate(id, req.body, {
        new: true,
    });
    if (!user)
        return next(new apiError_1.default(`No user found for ID: ${id}`, 404));
    res.status(200).json({
        status: "success",
        message: "User updated",
        data: user,
    });
});
// ====== Delete Job Seeker ======
exports.deleteJobUser = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const user = await jobSeekersModel_1.default.findByIdAndDelete(id);
    if (!user)
        return next(new apiError_1.default(`No user found for ID: ${id}`, 404));
    res.status(200).json({
        status: "success",
        message: "User deleted",
    });
});
