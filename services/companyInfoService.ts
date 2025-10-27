import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import bcrypt from "bcryptjs";

import { AsyncHandler } from "../types/express";

import ApiError from "../utils/apiError";
import generatePassword from "../utils/tools/generatePassword";

import CompanyInfo from "../models/companyInfoModel";
import RoleDashboard from "../models/roleDashboardModel";
import Roles from "../models/roleModel";
import Employee from "../models/employeeModel";

import { ICompanyInfo } from "../models/companyInfoModel";

interface CompanyInfoRequest extends Request {
  file?: Express.Multer.File;
  body: {
    companyName?: string;
    companyAddress?: string;
    companyTax?: string;
    companyTel?: string;
    companyLogo?: string;
    turkcellApiKey?: string;
    pinCode?: number;
    color?: string[];
    havePin?: boolean;
    facebookUrl?: string;
    instagramUrl?: string;
    xtwitterUrl?: string;
    linkedinUrl?: string;
    emails?: {
      support?: string;
      ecommerce?: string;
      accounting?: string;
    };
    prefix?: Record<string, any>;
    transactionReferenceFormat?: string;
    transactionReferenceExtra?: string;
    name?: string;
    email?: string;
    company?: {
      companyId?: string;
      selectedRoles?: string;
      companyName?: string;
    };
    password?: string;
  };
}

// Multer configuration
const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images allowed", 400));
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadCompanyLogo = upload.single("companyLogo");

export const resizerLogo: AsyncHandler = asyncHandler(
  async (req: CompanyInfoRequest, res, next) => {
    const filename = `company-${uuidv4()}-${Date.now()}.png`;

    if (req.file) {
      await sharp(req.file.buffer)
        .toFormat("png")
        .png({ quality: 90 })
        .toFile(`uploads/companyinfo/${filename}`);
      req.body.companyLogo = filename;
    }

    next();
  }
);

//@desc Create company info
//@route POST /api/companyinfo
export const createCompanyInfo: AsyncHandler = asyncHandler(
  async (req: CompanyInfoRequest, res, next) => {
    // Create a company
    const companyInfo = await CompanyInfo.create(req.body);

    const dashboardRoles = await RoleDashboard.find();

    // Insert the main role
    // Extract IDs from the inserted documents
    const dashboardRoleIds = dashboardRoles.map((role) => role._id);
    const insertMainRole = await Roles.create({
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

    const oldEmail = await Employee.findOne({ email: req.body.email });
    if (!oldEmail && req.body.email) {
      const employeePass = generatePassword();
      const hashedPassword = await bcrypt.hash(employeePass, 12);
      req.body.password = hashedPassword;
      await Employee.create(req.body);
    } else if (oldEmail && req.body.email) {
      await Employee.findOneAndUpdate(
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

    // Finally, make res
    res.status(201).json({
      status: "true",
      message: "Company info inserted",
      data: {
        company: companyInfo,
        mainRoleId: insertMainRole._id,
      },
    });
  }
);

// Get company info
// @role: who has role can Get company info
export const getCompanyInfo: AsyncHandler = asyncHandler(
  async (req: Request<{}, any, any, { companyId?: string }>, res, next) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    const companyInfos = await CompanyInfo.findOne({ _id: companyId });

    res.status(200).json({ status: "true", data: companyInfos });
  }
);

export const updateCompanyInfo: AsyncHandler = asyncHandler(
  async (req: CompanyInfoRequest, res, next) => {
    try {
      const { id } = req.params;
      const companyInfo = await CompanyInfo.findByIdAndUpdate(
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
        return next(
          new ApiError(`There is no company with this id ${id}`, 404)
        );
      }

      res.status(200).json({
        status: "true",
        message: "Company info updated",
        data: companyInfo,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);
