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
exports.deleteJobApplication = exports.updateJobApplication = exports.createJobApplication = exports.getOneJobApplication = exports.getAllJobApplications = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const apiError_1 = __importDefault(require("../../utils/apiError"));
const jobApplicationModel_1 = __importDefault(require("../../models/jobs/jobApplicationModel"));
const jobSeekersModel_1 = __importDefault(require("../../models/jobSeekersModel"));
const jobAdvertisementModel_1 = __importDefault(require("../../models/jobs/jobAdvertisementModel"));
exports.getAllJobApplications = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let query = {};
    if (req.query.keyword) {
        query.$or = [
            { status: { $regex: req.query.keyword, $options: "i" } },
            {
                "jobSeekerId.name": {
                    $regex: req.query.keyword,
                    $options: "i",
                },
            },
            {
                "jobSeekerId.lastName": {
                    $regex: req.query.keyword,
                    $options: "i",
                },
            },
        ];
    }
    if (req.query.jobsCompanyId) {
        query.jobsCompanyId = req.query.jobsCompanyId;
    }
    if (req.query.jobId) {
        query.jobId = req.query.jobId;
    }
    if (req.query.jobSeekerId) {
        query.jobSeekerId = req.query.jobSeekerId;
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const total = yield jobApplicationModel_1.default.countDocuments(query);
    const Applications = yield jobApplicationModel_1.default
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("jobSeekerId")
        .populate("jobId")
        .populate({
        path: "jobId",
        populate: {
            path: "company",
            select: "companyName",
        },
    });
    res.status(200).json({
        status: "success",
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        results: Applications.length,
        data: Applications,
    });
}));
exports.getOneJobApplication = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const Applications = yield jobApplicationModel_1.default
        .findById(id)
        .populate("jobSeekerId")
        .populate("jobId");
    if (!Applications) {
        return next(new apiError_1.default(`No Applications found for this ID: ${id}`, 404));
    }
    res.status(200).json({ status: "success", data: Applications });
}));
exports.createJobApplication = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobSeekerId, jobId } = req.body;
    const jobSeeker = yield jobSeekersModel_1.default.findById(jobSeekerId);
    if (!jobSeeker || !jobId) {
        return next(new apiError_1.default("Job seeker or jobId not found", 404));
    }
    const applicationData = req.body;
    const Applications = yield jobApplicationModel_1.default.create(applicationData);
    yield jobAdvertisementModel_1.default.findOneAndUpdate({ _id: jobId }, { $inc: { applicantsNumber: 1 } }, { new: true });
    res.status(201).json({ status: "success", data: Applications });
}));
exports.updateJobApplication = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const Applications = yield jobApplicationModel_1.default.findByIdAndUpdate(id, req.body, { new: true });
    if (!Applications)
        return next(new apiError_1.default(`No user found for ID: ${id}`, 404));
    res.status(200).json({
        status: "success",
        message: "Application updated",
        data: Applications,
    });
}));
exports.deleteJobApplication = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const Applications = yield jobApplicationModel_1.default.findByIdAndDelete(id);
    if (!Applications) {
        return next(new apiError_1.default(`No job found for ID: ${id}`, 404));
    }
    res.status(200).json({ status: "deleted successfully" });
}));
