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
    get createJobApplication () {
        return createJobApplication;
    },
    get deleteJobApplication () {
        return deleteJobApplication;
    },
    get getAllJobApplications () {
        return getAllJobApplications;
    },
    get getOneJobApplication () {
        return getOneJobApplication;
    },
    get updateJobApplication () {
        return updateJobApplication;
    }
});
const _expressasynchandler = /*#__PURE__*/ _interop_require_default(require("express-async-handler"));
const _apiError = /*#__PURE__*/ _interop_require_default(require("../../utils/apiError"));
const _jobApplicationModel = /*#__PURE__*/ _interop_require_default(require("../../models/jobs/jobApplicationModel"));
const _jobSeekersModel = /*#__PURE__*/ _interop_require_default(require("../../models/jobSeekersModel"));
const _jobAdvertisementModel = /*#__PURE__*/ _interop_require_default(require("../../models/jobs/jobAdvertisementModel"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const getAllJobApplications = (0, _expressasynchandler.default)(async (req, res)=>{
    let query = {};
    if (req.query.keyword) {
        query.$or = [
            {
                status: {
                    $regex: req.query.keyword,
                    $options: "i"
                }
            },
            {
                "jobSeekerId.name": {
                    $regex: req.query.keyword,
                    $options: "i"
                }
            },
            {
                "jobSeekerId.lastName": {
                    $regex: req.query.keyword,
                    $options: "i"
                }
            }
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
    const total = await _jobApplicationModel.default.countDocuments(query);
    const Applications = await _jobApplicationModel.default.find(query).skip(skip).limit(limit).sort({
        createdAt: -1
    }).populate("jobSeekerId").populate("jobId").populate({
        path: "jobId",
        populate: {
            path: "company",
            select: "companyName"
        }
    });
    res.status(200).json({
        status: "success",
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        results: Applications.length,
        data: Applications
    });
});
const getOneJobApplication = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    const Applications = await _jobApplicationModel.default.findById(id).populate("jobSeekerId").populate("jobId");
    if (!Applications) {
        return next(new _apiError.default(`No Applications found for this ID: ${id}`, 404));
    }
    res.status(200).json({
        status: "success",
        data: Applications
    });
});
const createJobApplication = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { jobSeekerId, jobId } = req.body;
    const jobSeeker = await _jobSeekersModel.default.findById(jobSeekerId);
    if (!jobSeeker || !jobId) {
        return next(new _apiError.default("Job seeker or jobId not found", 404));
    }
    const applicationData = req.body;
    const Applications = await _jobApplicationModel.default.create(applicationData);
    await _jobAdvertisementModel.default.findOneAndUpdate({
        _id: jobId
    }, {
        $inc: {
            applicantsNumber: 1
        }
    }, {
        new: true
    });
    res.status(201).json({
        status: "success",
        data: Applications
    });
});
const updateJobApplication = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    const Applications = await _jobApplicationModel.default.findByIdAndUpdate(id, req.body, {
        new: true
    });
    if (!Applications) return next(new _apiError.default(`No user found for ID: ${id}`, 404));
    res.status(200).json({
        status: "success",
        message: "Application updated",
        data: Applications
    });
});
const deleteJobApplication = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    const Applications = await _jobApplicationModel.default.findByIdAndDelete(id);
    if (!Applications) {
        return next(new _apiError.default(`No job found for ID: ${id}`, 404));
    }
    res.status(200).json({
        status: "deleted successfully"
    });
});
