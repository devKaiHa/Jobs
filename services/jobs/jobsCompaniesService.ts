import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import JobsCompany from "../../models/jobs/jobsCompaniesModel";
import ApiError from "../../utils/apiError";
import slugify from "slugify";
import multer, { FileFilterCallback } from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { IJobsCompany } from "../../models/interfaces/jobsCompany";

// Multer Config
const multerStorage = multer.memoryStorage();
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images allowed", 400));
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
export const uploadCompaniesImage = upload.single("image");
export const resizerCompanyImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const filename = `company-${uuidv4()}-${Date.now()}.png`;

    if (req.file) {
      await sharp(req.file.buffer)
        .toFormat("png")
        .png({ quality: 50 })
        .toFile(`uploads/jobs/${filename}`);

      req.body.image = filename;
    }

    next();
  }
);

// Get All Companies
export const getCompanies = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const pageSize = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * pageSize;

    const query: Record<string, any> = {};
    if (req.query.keyword) {
      query.$or = [
        { name: { $regex: req.query.keyword as string, $options: "i" } },
      ];
    }
    console.log(`req.query.isNewCompany`, req.query.isNewCompany);

    if (req.query.isNewCompany !== undefined) {
      const isNewCompany = req.query.isNewCompany == "true";
      query.isNewCompany = isNewCompany;
    }

    const totalItems = await JobsCompany.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);

    const companies = await JobsCompany.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      status: "success",
      totalPages,
      results: totalItems,
      data: companies,
    });
  }
);

// Create Company
export const createCompany = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    req.body.slug = slugify(req.body.name);
    const company: IJobsCompany = await JobsCompany.create(req.body);
    res.status(201).json({
      status: "success",
      message: "Company inserted",
      data: company,
    });
  }
);

// Get Specific Company
export const getCompany = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const company = await JobsCompany.findById(id);

    if (!company) {
      return next(new ApiError(`No company found for ID: ${id}`, 404));
    }

    res.status(200).json({ status: "success", data: company });
  }
);

// Update Company
export const updateCompany = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const company = await JobsCompany.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!company) {
      return next(new ApiError(`No company found for ID ${id}`, 404));
    }

    res.status(200).json({
      status: "success",
      message: "Company updated",
      data: company,
    });
  }
);

// Delete (Toggle Active)
export const deleteCompany = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { isActive } = req.body;

    const company = await JobsCompany.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!company) {
      return next(new ApiError(`No company found for ID ${id}`, 404));
    }

    res.status(200).json({
      status: "success",
      message: "Company deleted (status updated)",
    });
  }
);
