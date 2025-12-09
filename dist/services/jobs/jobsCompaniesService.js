"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get createCompany() {
    return createCompany;
  },
  get deleteCompany() {
    return deleteCompany;
  },
  get getCompanies() {
    return getCompanies;
  },
  get getCompany() {
    return getCompany;
  },
  get processCompanyFiles() {
    return processCompanyFiles;
  },
  get updateCompany() {
    return updateCompany;
  },
  get uploadCompanyFiles() {
    return uploadCompanyFiles;
  },
});
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _expressasynchandler = /*#__PURE__*/ _interop_require_default(
  require("express-async-handler")
);
const _jobsCompaniesModel = /*#__PURE__*/ _interop_require_default(
  require("../../models/jobs/jobsCompaniesModel")
);
const _apiError = /*#__PURE__*/ _interop_require_default(
  require("../../../utils/apiError")
);
const _multer = /*#__PURE__*/ _interop_require_default(require("multer"));
const _uuid = require("uuid");
const _sharp = /*#__PURE__*/ _interop_require_default(require("sharp"));
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _sendEmail = /*#__PURE__*/ _interop_require_default(
  require("../../../utils/sendEmail")
);
function _interop_require_default(obj) {
  return obj && obj.__esModule
    ? obj
    : {
        default: obj,
      };
}
const multerStorage = _multer.default.memoryStorage();
const logoFilter = (req, file, cb) => {
  if (file.fieldname === "logo") {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new _apiError.default("Logo must be an image", 400));
    }
  } else {
    cb(null, true);
  }
};
const upload = (0, _multer.default)({
  storage: multerStorage,
  fileFilter: logoFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});
const uploadCompanyFiles = upload.fields([
  {
    name: "logo",
    maxCount: 1,
  },
  {
    name: "files",
    maxCount: 5,
  },
]);
const processCompanyFiles = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const filesField = req.files;
    if (filesField && filesField.logo && filesField.logo[0]) {
      const logoFile = filesField.logo[0];
      const filename = `company-logo-${(0, _uuid.v4)()}-${Date.now()}.png`;
      await (0, _sharp.default)(logoFile.buffer)
        .toFormat("png")
        .png({
          quality: 70,
        })
        .toFile(`uploads/jobCompanies/${filename}`);
      req.body.logo = filename;
    }
    if (filesField && filesField.files && filesField.files.length > 0) {
      const uploadDir = "uploads/jobCompanies/files";
      const savedFileNames = [];
      for (const file of filesField.files) {
        const ext = _path.default.extname(file.originalname);
        const filename = `company-file-${(0, _uuid.v4)()}-${Date.now()}${ext}`;
        const filePath = _path.default.join(uploadDir, filename);
        _fs.default.writeFileSync(filePath, file.buffer);
        savedFileNames.push(filename);
      }
      req.body.files = savedFileNames;
    }
    next();
  }
);
const getCompanies = (0, _expressasynchandler.default)(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * pageSize;
  const query = {};
  if (req.query.keyword) {
    query.$or = [
      {
        companyName: {
          $regex: req.query.keyword,
          $options: "i",
        },
      },
      {
        industry: {
          $regex: req.query.keyword,
          $options: "i",
        },
      },
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
  const totalItems = await _jobsCompaniesModel.default.countDocuments(query);
  const totalPages = Math.ceil(totalItems / pageSize);
  const companies = await _jobsCompaniesModel.default
    .find(query)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(pageSize);
  res.status(200).json({
    status: "success",
    totalPages,
    results: totalItems,
    data: companies,
  });
});
const createCompany = (0, _expressasynchandler.default)(async (req, res) => {
  const company = await _jobsCompaniesModel.default.create(req.body);
  res.status(201).json({
    status: "success",
    message: "Company created successfully",
    data: company,
  });
});
const getCompany = (0, _expressasynchandler.default)(async (req, res, next) => {
  const { id } = req.params;
  const company = await _jobsCompaniesModel.default
    .findById(id)
    .populate("jobAdvertisement");
  if (!company) {
    return next(new _apiError.default(`No company found for ID: ${id}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: company,
  });
});
const updateCompany = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { id } = req.params;
    const company = await _jobsCompaniesModel.default.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );
    if (!company) {
      return next(new _apiError.default(`Invalid company with ID ${id}`, 404));
    }
    if (req.body.status === "accepted") {
      try {
        // company.verified = true;
        await company.save();
        await _axios.default.post("http://localhost:80/api/companyinfo", {
          companyName: company.companyName,
          companyEmail: company.email,
          email: company.email,
          name: company.companyName,
          companyTel: company.phone,
          companyAddress: company.address.city,
          companyLogo: company.logo,
          jobsCompanyId: req.body.jobsCompanyId,
        });
        res.status(200).json({
          status: "success",
          message:
            "Company has been approved and sent to the main system successfully",
          data: company,
        });
      } catch (err) {
        console.error("Error connecting to the main system:", err.message);
        return next(
          new _apiError.default(
            "Failed to send company data to the main system",
            500
          )
        );
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
  }
);
const deleteCompany = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { id } = req.params;
    const { message } = req.body;
    const company = await _jobsCompaniesModel.default.findByIdAndDelete(id);
    if (!company) {
      return next(new _apiError.default(`No company found for ID ${id}`, 404));
    }
    const email = company.email;
    await (0, _sendEmail.default)({
      email,
      subject: "Company Registration Rejected",
      message:
        message ||
        `Hello ${company.companyName}, we're sorry to inform you that your registration request has been declined.`,
    });
    res.status(200).json({
      status: "success",
      message: "Company deleted and email sent",
    });
  }
);
