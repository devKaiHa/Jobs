const asyncHandler = require("express-async-handler");
const CompanyInfnoModel = require("../models/companyInfoModel");
const multer = require("multer");
const ApiError = require("../utils/apiError");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const roleDashboardModel = require("../models/roleDashboardModel");
const rolesModel = require("../models/roleModel");
const employeeModel = require("../models/employeeModel");
const generatePassword = require("../utils/tools/generatePassword");
const multerStorage = multer.memoryStorage();
const bcrypt = require("bcryptjs");

const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images allowed", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadCompanyLogo = upload.single("companyLogo");

exports.resizerLogo = asyncHandler(async (req, res, next) => {
  const filename = `company-${uuidv4()}-${Date.now()}.png`;

  if (req.file) {
    await sharp(req.file.buffer)
      .toFormat("png")
      .png({ quality: 90 })
      .toFile(`uploads/companyinfo/${filename}`);
    req.body.companyLogo = filename;
  }

  next();
});

//@desc Create company info
//@route POST /api/companyinfo
exports.createCompanyInfo = asyncHandler(async (req, res, next) => {
  //craet a company
  const companyInfo = await CompanyInfnoModel.create(req.body);

  const dashboardRoles = await roleDashboardModel.find();

  //insert the main role
  // Extract IDs from the inserted documents
  const dashboardRoleIds = dashboardRoles.map((role) => role._id);
  const insertMainRole = await rolesModel.create({
    name: "Super Admin",
    description: "Role Description",
    rolesDashboard: dashboardRoleIds,
    superAdmin: true,
    companyId: companyInfo._id,
  });
  req.body.name = req.body.companyName;
  req.body.company = {
    companyId: companyInfo._id,
    selectedRoles: insertMainRole._id,
    companyName: req.body.companyName,
  };
  const oldEmail = await employeeModel.findOne({ email: req.body.email });
  if (!oldEmail) {
    const employeePass = generatePassword();
    const hashedPassword = await bcrypt.hash(employeePass, 12);
    req.body.password = hashedPassword;
    const employee = await employeeModel.create(req.body);
  } else {
    await employeeModel.findOneAndUpdate(
      { email: req.body.email },
      {
        $push: {
          company: {
            companyId: companyInfo._id,
            selectedRoles: insertMainRole._id,
            companyName: req.body.companyName,
          },
        },
      }
    );
  }

  //Finally, make res
  res.status(201).json({
    status: "true",
    message: "Company info inserted",
    data: {
      company: companyInfo,
      mainRoleId: insertMainRole._id,
    },
  });
});

//Get company info
//@role: who has role can Get company info
exports.getCompanyInfo = asyncHandler(async (req, res, next) => {
  const companyId = req.query.companyId;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  const companyInfos = await CompanyInfnoModel.findOne({ _id: companyId });

  res.status(200).json({ status: "true", data: companyInfos });
});

exports.updataCompanyInfo = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyInfo = await CompanyInfnoModel.findByIdAndUpdate(
      { _id: id },
      {
        companyName: req.body.companyName,
        companyAddress: req.body.companyAddress,
        companyTax: req.body.companyTax,
        companyTel: req.body.companyTel,
        companyLogo: req.body.companyLogo,
        turkcellApiKey: req.body.turkcellApiKey,
        pinCode: req.body.pinCode,
        color: req.body.color,
        havePin: req.body.havePin,
        facebookUrl: req.body.facebookUrl,
        instagramUrl: req.body.instagramUrl,
        xtwitterUrl: req.body.xtwitterUrl,
        linkedinUrl: req.body.linkedinUrl,
        emails: req.body.emails,
        prefix: req.body.prefix,
        transactionReferenceFormat: req.body.transactionReferenceFormat,
        transactionReferenceExtra: req.body.transactionReferenceExtra,
      },
      {
        new: true,
      }
    );
    if (!companyInfo) {
      return next(new ApiError(`There is no company with this id ${id}`, 404));
    } else {
      res.status(200).json({
        status: "true",
        message: "Company info updated",
        data: companyInfo,
      });
    }
  } catch (error) {
    console.log(error);
  }
});
