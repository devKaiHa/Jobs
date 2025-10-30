import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import ApiError from "../../utils/apiError";
import JobSeekers from "../../models/jobSeekersModel";


// ====== Multer Setup for Image Upload ======
const multerStorage = multer.memoryStorage();
const multerFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images allowed", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
export const uploadJobUserImage = upload.single("profileImage");

export const resizeUserImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  const filename = `user-${uuidv4()}-${Date.now()}.png`;

  await sharp(req.file.buffer)
    .toFormat("png")
    .png({ quality: 50 })
    .toFile(`uploads/jobs/${filename}`);

  // save image filename to body
  req.body.profileImage = filename;

  next();
});

// ====== Get All Job Seekers ======
export const getJobUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const pageSize = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;
  const skip = (page - 1) * pageSize;

  const query: any = {};
  if (req.query.keyword) {
    query.$or = [{ name: { $regex: req.query.keyword, $options: "i" } }];
  }

  const totalItems = await JobSeekers.countDocuments(query);
  const totalPages = Math.ceil(totalItems / pageSize);

  const jobsUsers = await JobSeekers.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    status: "success",
    totalPages,
    results: totalItems,
    data: jobsUsers,
  });
});

// ====== Create Job Seeker ======
export const createJobUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await JobSeekers.create(req.body);
  res.status(201).json({
    status: "success",
    message: "User inserted",
    data: user,
  });
});

// ====== Get Job Seeker by ID ======
export const getJobUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = await JobSeekers.findById(id);

  if (!user) return next(new ApiError(`No user found for ID: ${id}`, 404));

  res.status(200).json({ status: "success", data: user });
});

// ====== Update Job Seeker ======
export const updateJobUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = await JobSeekers.findByIdAndUpdate(id, req.body, { new: true });

  if (!user) return next(new ApiError(`No user found for ID: ${id}`, 404));

  res.status(200).json({
    status: "success",
    message: "User updated",
    data: user,
  });
});

// ====== Delete Job Seeker ======
export const deleteJobUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = await JobSeekers.findByIdAndDelete(id);

  if (!user) return next(new ApiError(`No user found for ID: ${id}`, 404));

  res.status(200).json({
    status: "success",
    message: "User deleted",
  });
});
