const asyncHandler = require("express-async-handler");
const jobsCompaniesModel = require("../../models/jobs/jobsCompaniesModel");
const ApiError = require("../../utils/apiError");
const { default: slugify } = require("slugify");
const multer = require("multer");
const multerStorage = multer.memoryStorage();
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    }
    else {
        cb(new ApiError("Only images Allowed", 400), false);
    }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadCompaniesImage = upload.single("image");
exports.resizerCompanyImage = asyncHandler(async (req, res, next) => {
    const filename = `company-${uuidv4()}-${Date.now()}.png`;
    if (req.file) {
        await sharp(req.file.buffer)
            .toFormat("png")
            .png({ quality: 50 })
            .toFile(`uploads/jobs/${filename}`);
        //save image into our db
        req.body.image = filename;
    }
    next();
});
// Get All Companies
exports.getCompanies = asyncHandler(async (req, res, next) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * pageSize;
    let query = {};
    if (req.query.keyword) {
        query.$or = [{ name: { $regex: req.query.keyword, $options: "i" } }];
    }
    const totalItems = await jobsCompaniesModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);
    const companies = await jobsCompaniesModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
    res.status(200).json({
        status: "success",
        totalPages: totalPages,
        results: totalItems,
        data: companies,
    });
});
// Create Company
exports.createCompany = asyncHandler(async (req, res, next) => {
    req.body.slug = slugify(req.body.name);
    const company = await jobsCompaniesModel.create(req.body);
    res
        .status(201)
        .json({ status: "success", message: "Company Inserted", data: company });
});
// Get Specific Company by ID
exports.getCompany = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const company = await jobsCompaniesModel.findById(id);
    if (!company) {
        return next(new ApiError(`No Company found for ID: ${id}`, 404));
    }
    res.status(200).json({ status: "success", data: company });
});
// Update Company
exports.updateCompany = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const company = await jobsCompaniesModel.findByIdAndUpdate({ _id: id }, req.body, { new: true });
    if (!company) {
        return next(new ApiError(`No Company found for ID ${id}`, 404));
    }
    res
        .status(200)
        .json({ status: "success", message: "Company updated", data: company });
});
// Delete Company
exports.deleteCompany = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const company = await jobsCompaniesModel.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!company) {
        return next(new ApiError(`No Company found for ID ${id}`, 404));
    }
    res.status(200).json({ status: "success", message: "Company Deleted" });
});
