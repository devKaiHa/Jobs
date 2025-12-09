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
    get createJobs () {
        return createJobs;
    },
    get deleteJob () {
        return deleteJob;
    },
    get getAllJobs () {
        return getAllJobs;
    },
    get getOneJob () {
        return getOneJob;
    },
    get resizeCompanyLogo () {
        return resizeCompanyLogo;
    },
    get updateJob () {
        return updateJob;
    },
    get uploadCompanyLogo () {
        return uploadCompanyLogo;
    }
});
const _expressasynchandler = /*#__PURE__*/ _interop_require_default(require("express-async-handler"));
const _apiError = /*#__PURE__*/ _interop_require_default(require("../../utils/apiError"));
const _jobAdvertisementModel = /*#__PURE__*/ _interop_require_default(require("../../models/jobs/jobAdvertisementModel"));
const _multer = /*#__PURE__*/ _interop_require_default(require("multer"));
const _sharp = /*#__PURE__*/ _interop_require_default(require("sharp"));
const _uuid = require("uuid");
const _jobApplicationModel = /*#__PURE__*/ _interop_require_default(require("../../models/jobs/jobApplicationModel"));
const _jobsCompaniesModel = /*#__PURE__*/ _interop_require_default(require("../../models/jobs/jobsCompaniesModel"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const multerStorage = _multer.default.memoryStorage();
const multerFilter = (req, file, cb)=>{
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new _apiError.default("Only images are allowed", 400), false);
    }
};
const upload = (0, _multer.default)({
    storage: multerStorage,
    fileFilter: multerFilter
});
const uploadCompanyLogo = upload.single("companyInfo.logo");
const resizeCompanyLogo = (0, _expressasynchandler.default)(async (req, res, next)=>{
    if (!req.file) return next();
    const filename = `company-logo-${(0, _uuid.v4)()}-${Date.now()}.png`;
    await (0, _sharp.default)(req.file.buffer).toFormat("png").png({
        quality: 70
    }).toFile(`uploads/jobAdvertisement/${filename}`);
    if (!req.body.companyInfo) req.body.companyInfo = {};
    req.body.companyInfo.logo = filename;
    next();
});
const getAllJobs = (0, _expressasynchandler.default)(async (req, res)=>{
    let query = {};
    if (req.query.keyword) {
        query.$or = [
            {
                jobTitle: {
                    $regex: req.query.keyword,
                    $options: "i"
                }
            },
            {
                location: {
                    $regex: req.query.keyword,
                    $options: "i"
                }
            },
            {
                skills: {
                    $regex: req.query.keyword,
                    $options: "i"
                }
            }
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
    const total = await _jobAdvertisementModel.default.countDocuments(query);
    const jobs = await _jobAdvertisementModel.default.find(query).skip(skip).limit(limit).sort({
        createdAt: -1
    }).populate("company", "companyName email logo");
    res.status(200).json({
        status: "success",
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        results: jobs.length,
        data: jobs
    });
});
const getOneJob = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    const userId = req.query.userId;
    const job = await _jobAdvertisementModel.default.findById(id).populate("company");
    if (!job) {
        return next(new _apiError.default(`No job found for this ID: ${id}`, 404));
    }
    let isApplied = false;
    if (userId) {
        const existingApplication = await _jobApplicationModel.default.findOne({
            jobId: id,
            jobSeekerId: userId
        });
        if (existingApplication) {
            isApplied = true;
        }
    }
    res.status(200).json({
        status: "success",
        data: {
            ...job.toObject(),
            isApplied
        }
    });
});
const createJobs = (0, _expressasynchandler.default)(async (req, res)=>{
    const job = await _jobAdvertisementModel.default.create(req.body);
    const company = await _jobsCompaniesModel.default.findById(req.body.company);
    if (!company) {
        res.status(404).json({
            status: "fail",
            data: "Company not found"
        });
    }
    company.jobAdvertisement.push(job._id);
    await company.save();
    res.status(201).json({
        status: "success",
        data: job
    });
});
const updateJob = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    if (!id) {
        return next(new _apiError.default(`No job found for this ID: ${id}`, 404));
    }
    if (req.body.companyInfo && typeof req.body.companyInfo === "string") {
        try {
            req.body.companyInfo = JSON.parse(req.body.companyInfo);
        } catch (err) {
            return next(new _apiError.default("companyInfo must be a valid object", 400));
        }
    }
    const updateData = {
        ...req.body
    };
    if (req.body.companyInfo && typeof req.body.companyInfo === "object") {
        for(const key in req.body.companyInfo){
            updateData[`companyInfo.${key}`] = req.body.companyInfo[key];
        }
        delete updateData.companyInfo;
    }
    const updatedJob = await _jobAdvertisementModel.default.findByIdAndUpdate(id, updateData, {
        new: true
    });
    if (!updatedJob) {
        return next(new _apiError.default(`No job found with ID: ${id}`, 404));
    }
    res.status(200).json({
        status: "success",
        data: updatedJob
    });
});
const deleteJob = (0, _expressasynchandler.default)(async (req, res, next)=>{
    const { id } = req.params;
    const job = await _jobAdvertisementModel.default.findByIdAndDelete(id);
    if (!job) {
        return next(new _apiError.default(`No job found for ID: ${id}`, 404));
    }
    res.status(200).json({
        status: "success",
        message: "job deleted"
    });
});
