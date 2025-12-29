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
exports.deleteCompanyField = exports.updateCompanyField = exports.createCompanyField = exports.getOneCompanyField = exports.getAllCompanyFields = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const companyFieldModel_1 = __importDefault(require("../models/companyFieldModel"));
const { default: slugify } = require("slugify");
const generateCompanyCode = (title) => {
    // ... (Definition from above) ...
    const cleanedTitle = title.trim().toLowerCase();
    const words = cleanedTitle.split(/\s+/).filter((word) => word.length > 0);
    if (words.length > 1) {
        return words.map((word) => word[0]).join("");
    }
    if (words.length === 1) {
        const word = words[0];
        return word.substring(0, 2);
    }
    return "";
};
// GET ALL
exports.getAllCompanyFields = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let query = {};
    // Search by keyword in title or code
    if (req.query.keyword) {
        const keyword = req.query.keyword;
        query.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { titleAr: { $regex: keyword, $options: "i" } },
            { code: { $regex: keyword, $options: "i" } },
        ];
    }
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const total = yield companyFieldModel_1.default.countDocuments(query);
    const fields = yield companyFieldModel_1.default.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    res.status(200).json({
        status: "success",
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        results: fields.length,
        data: fields,
    });
}));
// GET ONE
exports.getOneCompanyField = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const field = yield companyFieldModel_1.default.findById(id);
    if (!field) {
        return next(new apiError_1.default(`No CompanyField found for this ID: ${id}`, 404));
    }
    res.status(200).json({ status: "success", data: field });
}));
// CREATE
exports.createCompanyField = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const title = req.body.title;
    if (!title) {
        res.status(400).json({
            status: "error",
            message: "Title is required to create a field.",
        });
        return;
    }
    const companyCode = generateCompanyCode(title);
    req.body.code = companyCode.toUpperCase();
    const field = yield companyFieldModel_1.default.create(req.body);
    res.status(201).json({ status: "success", data: field });
}));
// UPDATE
exports.updateCompanyField = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (req.body.title) {
        const newCode = generateCompanyCode(req.body.title);
        req.body.code = newCode.toUpperCase();
    }
    const updatedField = yield companyFieldModel_1.default.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!updatedField) {
        return next(new apiError_1.default(`No CompanyField found for ID: ${id}`, 404));
    }
    res.status(200).json({
        status: "success",
        message: "Company field updated",
        data: updatedField,
    });
}));
// DELETE
exports.deleteCompanyField = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deleted = yield companyFieldModel_1.default.findByIdAndDelete(id);
    if (!deleted) {
        return next(new apiError_1.default(`No CompanyField found for ID: ${id}`, 404));
    }
    res.status(200).json({ status: "deleted successfully" });
}));
