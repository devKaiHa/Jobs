"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.updateEmployeePassword = exports.getEmployee = exports.reSendPassword = exports.createEmployee = exports.getEmployees = exports.resizerEmployeeImage = exports.uploadEmployeeImage = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const generatePassword_1 = __importDefault(require("../utils/tools/generatePassword"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const isEmail_1 = __importDefault(require("../utils/tools/isEmail"));
const createToken_1 = __importDefault(require("../utils/createToken"));
const employeeModel_1 = __importDefault(require("../models/employeeModel"));
// Multer configuration
const multerStorage = multer_1.default.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    }
    else {
        cb(new apiError_1.default("Only images Allowed", 400));
    }
};
const upload = (0, multer_1.default)({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadEmployeeImage = upload.single("image");
exports.resizerEmployeeImage = (0, express_async_handler_1.default)(async (req, res, next) => {
    const filename = `image-${(0, uuid_1.v4)()}-${Date.now()}.png`;
    if (req.file) {
        await (0, sharp_1.default)(req.file.buffer)
            .toFormat("webp")
            .png({ quality: 50 })
            .toFile(`uploads/Image/${filename}`);
        req.body.image = filename;
    }
    next();
});
//@desc Get list of employee
//@route Get /api/user
//@access private
exports.getEmployees = (0, express_async_handler_1.default)(async (req, res, next) => {
    try {
        const pageSize = parseInt(req.query.limit || "10");
        const page = parseInt(req.query.page || "1");
        const skip = (page - 1) * pageSize;
        let query = {};
        if (req.query.keyword) {
            query.$or = [
                { email: { $regex: req.query.keyword, $options: "i" } },
                { name: { $regex: req.query.keyword, $options: "i" } },
            ];
        }
        const totalItems = await employeeModel_1.default.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);
        const employees = await employeeModel_1.default.find(query)
            .skip(skip)
            .limit(pageSize);
        res.status(200).json({
            status: "true",
            Pages: totalPages,
            results: totalItems,
        });
    }
    catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ status: "false", error: "Internal Server Error" });
    }
});
//@desc Create specific employee
//@route Post /api/employee
//@access private
exports.createEmployee = (0, express_async_handler_1.default)(async (req, res, next) => {
    const email = req.body.email;
    if (!email || !(0, isEmail_1.default)(email)) {
        return next(new apiError_1.default("There is an error in email format", 500));
    }
    try {
        const employeePass = (0, generatePassword_1.default)();
        await (0, sendEmail_1.default)({
            email: req.body.email,
            subject: "New Password",
            message: `Hello ${req.body.name}, Your password is ${employeePass}`,
        });
        const employee = await employeeModel_1.default.create(req.body);
        res.status(201).json({
            status: "true",
            message: "Employee Inserted",
            data: employee,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.reSendPassword = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email } = req.body;
    const findEmployee = await employeeModel_1.default.findOne({ email });
    if (!findEmployee) {
        return next(new apiError_1.default("Employee not found", 404));
    }
    try {
        const employeePass = (0, generatePassword_1.default)();
        const hashedPassword = await bcryptjs_1.default.hash(employeePass, 12);
        await (0, sendEmail_1.default)({
            email,
            subject: "New Password",
            message: `Hello ${findEmployee.name}, Your password is ${employeePass}`,
        });
        const employee = await employeeModel_1.default.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true });
        res.status(201).json({
            status: 200,
            message: "Employee Update Password",
            data: employee,
        });
    }
    catch (error) {
        next(error);
    }
});
//@desc get specific Employee by ID
//@route Get /api/employee/:id
//@access private
exports.getEmployee = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const employee = await employeeModel_1.default.findOne({
        _id: id,
    });
    if (!employee) {
        return next(new apiError_1.default(`No employee by this id ${id}`, 404));
    }
    res.status(200).json({
        status: "true",
        data: employee,
    });
});
//@desc Update employee password by ID
//@route PUT /api/updatePassword
//@access Private
exports.updateEmployeePassword = (0, express_async_handler_1.default)(async (req, res, next) => {
    if (!req.user?._id) {
        return next(new apiError_1.default("User not authenticated", 401));
    }
    const hashedPassword = await bcryptjs_1.default.hash(req.body.newPassword || "", 12);
    const user = await employeeModel_1.default.findOneAndUpdate({ _id: req.user._id }, {
        password: hashedPassword,
        passwordChangedAt: new Date().toISOString(),
    }, { new: true });
    if (!user) {
        return next(new apiError_1.default("User not found", 404));
    }
    const token = (0, createToken_1.default)(user._id);
    res.status(200).json({ data: user, token });
});
//@desc Update employee
//@route PUT /api/employee/:id
//@access Private
exports.updateEmployee = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return next(new apiError_1.default("Employee ID is required", 400));
    }
    const updateData = { ...req.body };
    const employee = await employeeModel_1.default.findOneAndUpdate({ _id: id, }, { $set: updateData }, { new: true });
    if (!employee) {
        return next(new apiError_1.default(`There is no employee with this id ${id}`, 404));
    }
    res.status(200).json({
        status: "true",
        message: "Employee updated",
        data: employee,
    });
});
//@desc Delete specific employee
//@route Delete /api/employee/:id
//@access private
exports.deleteEmployee = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const employeeToUpdate = await employeeModel_1.default.findById(id);
    if (!employeeToUpdate) {
        return next(new apiError_1.default(`No employee by this id ${id}`, 404));
    }
    const employee = await employeeModel_1.default.findOneAndUpdate({ _id: id }, { active: !employeeToUpdate.active }, { new: true });
    res.status(200).json({ status: "true", message: "Employee Deleted" });
});
