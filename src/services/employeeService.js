"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.getEmployee = exports.getEmployees = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const employeeModel_1 = __importDefault(require("../models/employeeModel"));
//@desc Get list of employee
//@route Get /api/user
//@access private
exports.getEmployees = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const totalItems = yield employeeModel_1.default.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);
        const employees = yield employeeModel_1.default.find(query).skip(skip).limit(pageSize);
        res.status(200).json({
            status: "true",
            Pages: totalPages,
            results: totalItems,
            employees,
        });
    }
    catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ status: "false", error: "Internal Server Error" });
    }
}));
//@desc get specific Employee by ID
//@route Get /api/employee/:id
//@access private
exports.getEmployee = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const employee = yield employeeModel_1.default.findOne({
        _id: id,
    });
    if (!employee) {
        return next(new apiError_1.default(`No employee by this id ${id}`, 404));
    }
    res.status(200).json({
        status: "true",
        data: employee,
    });
}));
//@desc Update employee
//@route PUT /api/employee/:id
//@access Private
exports.updateEmployee = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return next(new apiError_1.default("Employee ID is required", 400));
    }
    const updateData = Object.assign({}, req.body);
    const employee = yield employeeModel_1.default.findOneAndUpdate({ _id: id }, { $set: updateData }, { new: true });
    if (!employee) {
        return next(new apiError_1.default(`There is no employee with this id ${id}`, 404));
    }
    res.status(200).json({
        status: "true",
        message: "Employee updated",
        data: employee,
    });
}));
//@desc Delete specific employee
//@route Delete /api/employee/:id
//@access private
exports.deleteEmployee = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const employeeToDelete = yield employeeModel_1.default.findByIdAndDelete(id);
    if (!employeeToDelete) {
        return next(new apiError_1.default(`No employee by this id ${id}`, 404));
    }
    res.status(200).json({ status: "true", message: "Employee Deleted" });
}));
