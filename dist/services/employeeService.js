"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get deleteEmployee () {
        return deleteEmployee;
    },
    get getEmployee () {
        return getEmployee;
    },
    get getEmployees () {
        return getEmployees;
    },
    get updateEmployee () {
        return updateEmployee;
    }
});
const _expressasynchandler = /*#__PURE__*/ _interop_require_default(require("express-async-handler"));
const _apiError = /*#__PURE__*/ _interop_require_default(require("../utils/apiError"));
const _employeeModel = /*#__PURE__*/ _interop_require_default(require("../models/employeeModel"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const getEmployees = (0, _expressasynchandler.default)(async (req, res, next)=>{
    try {
        const pageSize = parseInt(req.query.limit || "10");
        const page = parseInt(req.query.page || "1");
        const skip = (page - 1) * pageSize;
        let query = {};
        if (req.query.keyword) {
            query.$or = [
                {
                    email: {
                        $regex: req.query.keyword,
                        $options: "i"
                    }
                },
                {
                    name: {
                        $regex: req.query.keyword,
                        $options: "i"
                    }
                }
            ];
        }
        const totalItems = await _employeeModel.default.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);
        const employees = await _employeeModel.default.find(query).skip(skip).limit(pageSize);
        res.status(200).json({
            status: "true",
            Pages: totalPages,
            results: totalItems,
            employees
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({
            status: "false",
            error: "Internal Server Error"
        });
    }
});
const getEmployee = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    const employee = await _employeeModel.default.findOne({
        _id: id
    });
    if (!employee) {
        return next(new _apiError.default(`No employee by this id ${id}`, 404));
    }
    res.status(200).json({
        status: "true",
        data: employee
    });
});
const updateEmployee = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    if (!id) {
        return next(new _apiError.default("Employee ID is required", 400));
    }
    const updateData = {
        ...req.body
    };
    const employee = await _employeeModel.default.findOneAndUpdate({
        _id: id
    }, {
        $set: updateData
    }, {
        new: true
    });
    if (!employee) {
        return next(new _apiError.default(`There is no employee with this id ${id}`, 404));
    }
    res.status(200).json({
        status: "true",
        message: "Employee updated",
        data: employee
    });
});
const deleteEmployee = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    const employeeToDelete = await _employeeModel.default.findByIdAndDelete(id);
    if (!employeeToDelete) {
        return next(new _apiError.default(`No employee by this id ${id}`, 404));
    }
    res.status(200).json({
        status: "true",
        message: "Employee Deleted"
    });
});
