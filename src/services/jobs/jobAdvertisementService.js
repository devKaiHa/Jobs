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
exports.deleteJob = exports.updateJob = exports.createJobs = exports.getOneJob = exports.getAllJobs = exports.resizeCompanyLogo = exports.uploadCompanyLogo = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const apiError_1 = __importDefault(require("../../utils/apiError"));
const jobAdvertisementModel_1 = __importDefault(require("../../models/jobs/jobAdvertisementModel"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const jobApplicationModel_1 = __importDefault(require("../../models/jobs/jobApplicationModel"));
const jobsCompaniesModel_1 = __importDefault(require("../../models/jobs/jobsCompaniesModel"));
const multerStorage = multer_1.default.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    }
    else {
        cb(new apiError_1.default("Only images are allowed", 400), false);
    }
};
const upload = (0, multer_1.default)({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadCompanyLogo = upload.single("companyInfo.logo");
exports.resizeCompanyLogo = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file)
        return next();
    const filename = `company-logo-${(0, uuid_1.v4)()}-${Date.now()}.png`;
    yield (0, sharp_1.default)(req.file.buffer)
        .toFormat("png")
        .png({ quality: 70 })
        .toFile(`uploads/jobAdvertisement/${filename}`);
    if (!req.body.companyInfo)
        req.body.companyInfo = {};
    req.body.companyInfo.logo = filename;
    next();
}));
exports.getAllJobs = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let query = {};
    if (req.query.keyword) {
        query.$or = [
            { jobTitle: { $regex: req.query.keyword, $options: "i" } },
            { location: { $regex: req.query.keyword, $options: "i" } },
            { skills: { $regex: req.query.keyword, $options: "i" } },
        ];
    }
    if (req.query.companyId) {
        query.companyId = req.query.companyId;
    }
    if (req.query.company) {
        query.company = req.query.company;
    }
    if (req.query.status) {
        query.status = req.query.status;
    }
    if (req.query.endDate) {
        query.endDate = req.query.endDate;
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const total = yield jobAdvertisementModel_1.default.countDocuments(query);
    const jobs = yield jobAdvertisementModel_1.default
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("company", "companyName email logo");
    res.status(200).json({
        status: "success",
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        results: jobs.length,
        data: jobs,
    });
}));
exports.getOneJob = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.query.userId;
    const job = yield jobAdvertisementModel_1.default.findById(id).populate("company");
    if (!job) {
        return next(new apiError_1.default(`No job found for this ID: ${id}`, 404));
    }
    let isApplied = false;
    if (userId) {
        const existingApplication = yield jobApplicationModel_1.default.findOne({
            jobId: id,
            jobSeekerId: userId,
        });
        if (existingApplication) {
            isApplied = true;
        }
    }
    res
        .status(200)
        .json({ status: "success", data: Object.assign(Object.assign({}, job.toObject()), { isApplied }) });
}));
exports.createJobs = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield jobAdvertisementModel_1.default.create(req.body);
    const company = yield jobsCompaniesModel_1.default.findById(req.body.company);
    if (!company) {
        res.status(404).json({ status: "fail", data: "Company not found" });
    }
    company.jobAdvertisement.push(job._id);
    yield company.save();
    res.status(201).json({ status: "success", data: job });
}));
exports.updateJob = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return next(new apiError_1.default(`No job found for this ID: ${id}`, 404));
    }
    if (req.body.companyInfo && typeof req.body.companyInfo === "string") {
        try {
            req.body.companyInfo = JSON.parse(req.body.companyInfo);
        }
        catch (err) {
            return next(new apiError_1.default("companyInfo must be a valid object", 400));
        }
    }
    const updateData = Object.assign({}, req.body);
    if (req.body.companyInfo && typeof req.body.companyInfo === "object") {
        for (const key in req.body.companyInfo) {
            updateData[`companyInfo.${key}`] = req.body.companyInfo[key];
        }
        delete updateData.companyInfo;
    }
    const updatedJob = yield jobAdvertisementModel_1.default.findByIdAndUpdate(id, updateData, {
        new: true,
    });
    if (!updatedJob) {
        return next(new apiError_1.default(`No job found with ID: ${id}`, 404));
    }
    res.status(200).json({
        status: "success",
        data: updatedJob,
    });
}));
exports.deleteJob = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const job = yield jobAdvertisementModel_1.default.findByIdAndDelete(id);
    if (!job) {
        return next(new apiError_1.default(`No job found for ID: ${id}`, 404));
    }
    res.status(200).json({ status: "success", message: "job deleted" });
}));
