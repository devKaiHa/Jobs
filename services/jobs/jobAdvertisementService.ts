import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import ApiError from "../../utils/apiError";
import jobsModel from "../../models/jobs/jobAdvertisementModel";
import jobsCompanies from "../../models/jobs/jobsCompaniesModel";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images are allowed", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadCompanyLogo = upload.single("companyInfo.logo");

export const resizeCompanyLogo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    const filename = `company-logo-${uuidv4()}-${Date.now()}.png`;

    await sharp(req.file.buffer)
      .toFormat("png")
      .png({ quality: 70 })
      .toFile(`uploads/jobAdvertisement/${filename}`);

    if (!req.body.companyInfo) req.body.companyInfo = {};
    (req.body.companyInfo as any).logo = filename;

    next();
  }
);

export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
  let query: any = {};

  if (req.query.keyword) {
    query.$or = [
      { jobTitle: { $regex: req.query.keyword as string, $options: "i" } },
      { location: { $regex: req.query.keyword as string, $options: "i" } },
    ];
  }

  if (req.query.companyId) {
    query.companyId = req.query.companyId;
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await jobsModel.countDocuments(query);

  const jobs = await jobsModel
    .find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate("companyId", "name  email");

  res.status(200).json({
    status: "success",
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    results: jobs.length,
    data: jobs,
  });
});

export const getOneJob = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const job = await jobsModel
      .findById(id)
      .populate("companyId");

    if (!job) {
      return next(new ApiError(`No job found for this ID: ${id}`, 404));
    }

    res.status(200).json({ status: "success", data: job });
  }
);

export const createJobs = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobsModel.create(req.body);
  res.status(201).json({ status: "success", data: job });
});

export const updateJob = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(`No job found for this ID: ${id}`, 404));
    }

    if (req.body.companyInfo && typeof req.body.companyInfo === "string") {
      try {
        req.body.companyInfo = JSON.parse(req.body.companyInfo);
      } catch (err) {
        return next(new ApiError("companyInfo must be a valid object", 400));
      }
    }

    const updateData: any = { ...req.body };

    if (req.body.companyInfo && typeof req.body.companyInfo === "object") {
      for (const key in req.body.companyInfo) {
        updateData[`companyInfo.${key}`] = req.body.companyInfo[key];
      }
      delete updateData.companyInfo;
    }

    const updatedJob = await jobsModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedJob) {
      return next(new ApiError(`No job found with ID: ${id}`, 404));
    }

    res.status(200).json({
      status: "success",
      data: updatedJob,
    });
  }
);

export const deleteJob = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const job = await jobsModel.findByIdAndDelete(id);

    if (!job) {
      return next(new ApiError(`No job found for ID: ${id}`, 404));
    }

    res.status(200).json({ status: "success", message: "job deleted" });
  }
);
