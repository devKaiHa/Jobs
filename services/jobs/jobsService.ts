import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jobsModel from "../../models/jobs/jobsModel";
import ApiError from "../../utils/apiError";
import slugify from "slugify";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

// Multer storage and filter
const multerStorage = multer.memoryStorage();
const multerFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images Allowed", 400));
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadJobsImage = upload.single("image");

export const resizeJobImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  const filename = `job-${uuidv4()}-${Date.now()}.png`;

  await sharp(req.file.buffer)
    .toFormat("png")
    .png({ quality: 50 })
    .toFile(`uploads/jobs/${filename}`);

  req.body.image = filename;
  next();
});

// Get All Jobs
export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const pageSize = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;
  const skip = (page - 1) * pageSize;

  let query: any = {};
  if (req.query.keyword) {
    query.$or = [{ title: { $regex: req.query.keyword, $options: "i" } }];
  }

  const totalItems = await jobsModel.countDocuments(query);
  const totalPages = Math.ceil(totalItems / pageSize);

  const jobs = await jobsModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    status: "success",
    totalPages,
    results: totalItems,
    data: jobs,
  });
});

// Create Job
export const createJob = asyncHandler(async (req: Request, res: Response) => {
  req.body.slug = slugify(req.body.name);
  const job = await jobsModel.create(req.body);

  res.status(201).json({ status: "success", message: "Job Inserted", data: job });
});

// Get Specific Job by ID
export const getJobById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const job = await jobsModel.findById(id);

  if (!job) {
    return next(new ApiError(`No job found for ID: ${id}`, 404));
  }
  res.status(200).json({ status: "success", data: job });
});

// Update Job
export const updateJob = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const job = await jobsModel.findByIdAndUpdate(id, req.body, { new: true });

  if (!job) {
    return next(new ApiError(`No job found for ID ${id}`, 404));
  }
  res.status(200).json({ status: "success", message: "Job updated", data: job });
});

// Delete Job
export const deleteJob = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const job = await jobsModel.findByIdAndDelete(id);

  if (!job) {
    return next(new ApiError(`No job found for ID ${id}`, 404));
  }
  res.status(200).json({ status: "success", message: "Job Deleted" });
});
