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
exports.deleteCompany = exports.updateCompany = exports.getCompany = exports.createCompany = exports.getCompanies = exports.processCompanyFiles = exports.uploadCompanyFiles = void 0;
const axios_1 = __importDefault(require("axios"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jobsCompaniesModel_1 = __importDefault(require("../../models/jobs/jobsCompaniesModel"));
const apiError_1 = __importDefault(require("../../utils/apiError"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sendEmail_1 = __importDefault(require("../../utils/sendEmail"));
const multerStorage = multer_1.default.memoryStorage();
const logoFilter = (req, file, cb) => {
    if (file.fieldname === "logo") {
        if (file.mimetype.startsWith("image")) {
            cb(null, true);
        }
        else {
            cb(new apiError_1.default("Logo must be an image", 400));
        }
    }
    else {
        cb(null, true);
    }
};
const upload = (0, multer_1.default)({
    storage: multerStorage,
    fileFilter: logoFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
});
exports.uploadCompanyFiles = upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "files", maxCount: 5 },
]);
exports.processCompanyFiles = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const filesField = req.files;
    if (filesField && filesField.logo && filesField.logo[0]) {
        const logoFile = filesField.logo[0];
        const filename = `company-logo-${(0, uuid_1.v4)()}-${Date.now()}.png`;
        yield (0, sharp_1.default)(logoFile.buffer)
            .toFormat("png")
            .png({ quality: 70 })
            .toFile(`uploads/jobCompanies/${filename}`);
        req.body.logo = filename;
    }
    if (filesField && filesField.files && filesField.files.length > 0) {
        const uploadDir = "uploads/jobCompanies/files";
        const savedFileNames = [];
        for (const file of filesField.files) {
            const ext = path_1.default.extname(file.originalname);
            const filename = `company-file-${(0, uuid_1.v4)()}-${Date.now()}${ext}`;
            const filePath = path_1.default.join(uploadDir, filename);
            fs_1.default.writeFileSync(filePath, file.buffer);
            savedFileNames.push(filename);
        }
        req.body.files = savedFileNames;
    }
    next();
}));
exports.getCompanies = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * pageSize;
    const query = {};
    if (req.query.keyword) {
        query.$or = [
            { companyName: { $regex: req.query.keyword, $options: "i" } },
            { industry: { $regex: req.query.keyword, $options: "i" } },
            {
                "address.city": {
                    $regex: req.query.keyword,
                    $options: "i",
                },
            },
            {
                "address.country": {
                    $regex: req.query.keyword,
                    $options: "i",
                },
            },
        ];
    }
    const totalItems = yield jobsCompaniesModel_1.default.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);
    const companies = yield jobsCompaniesModel_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
    res.status(200).json({
        status: "success",
        totalPages,
        results: totalItems,
        data: companies,
    });
}));
exports.createCompany = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    req.body.industry = JSON.parse(req.body.industry);
    const company = yield jobsCompaniesModel_1.default.create(req.body);
    res.status(201).json({
        status: "success",
        message: "Company created successfully",
        data: company,
    });
}));
exports.getCompany = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const company = yield jobsCompaniesModel_1.default.findById(id)
        .populate("jobAdvertisement")
        .populate("industry");
    if (!company) {
        return next(new apiError_1.default(`No company found for ID: ${id}`, 404));
    }
    res.status(200).json({ status: "success", data: company });
}));
exports.updateCompany = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const company = yield jobsCompaniesModel_1.default.findByIdAndUpdate(id, req.body, {
        new: true,
    });
    if (!company) {
        console.error(`❌ Invalid company with ID ${id}`);
        return next(new apiError_1.default(`Invalid company with ID ${id}`, 404));
    }
    if (req.body.status === "accepted") {
        try {
            yield company.save();
            yield axios_1.default.post(`https://erpsy.testapi.smartinb.com/api/companyinfo`, {
                companyName: company.companyName,
                companyEmail: company.email,
                email: company.email,
                name: company.companyName,
                companyTel: company.phone,
                companyAddress: company.address.city,
                companyLogo: company.logo,
                jobsCompanyId: req.body.jobsCompanyId,
                models: ["HR"],
            });
            res.status(200).json({
                status: "success",
                message: "Company has been approved and sent to the main system successfully",
                data: company,
            });
        }
        catch (err) {
            console.error("🔥 Error connecting to main system:", err.message);
            return next(new apiError_1.default("Failed to send company data to the main system", 500));
        }
        return;
    }
    if (company.status === "rejected") {
        res.status(200).json({
            status: "rejected",
            message: "Company has been rejected",
            data: company,
        });
        return;
    }
    res.status(200).json({
        status: "pending",
        message: "Company data updated, awaiting approval",
        data: company,
    });
}));
const deleteCompany = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const company = yield jobsCompaniesModel_1.default.findById(id);
        if (!company) {
            console.log("❌ Company not found, aborting");
            return next(new apiError_1.default(`No company found for ID ${id}`, 404));
        }
        try {
            yield (0, sendEmail_1.default)({
                email: company.email,
                subject: "LinkedOut Company Registration Rejected",
                message: message ||
                    `Hello ${company.companyName}, we're sorry to inform you that your registration request has been declined.`,
            });
        }
        catch (err) {
            console.log("❌ Email sending failed:", err);
            return next(new apiError_1.default("Failed to send email", 500));
        }
        yield jobsCompaniesModel_1.default.findByIdAndDelete(id);
        res.status(200).json({
            status: "success",
            message: "Email sent and company deleted",
        });
    }
    catch (err) {
        console.log("❌ Unexpected error in deleteCompany:", err);
        next(err);
    }
});
exports.deleteCompany = deleteCompany;
