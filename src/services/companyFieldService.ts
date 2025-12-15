import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError";
import CompanyField from "../models/companyFieldModel";
const { default: slugify } = require("slugify");

const generateCompanyCode = (title: string): string => {
  // ... (Definition from above) ...
  const cleanedTitle = title.trim().toLowerCase();
  const words = cleanedTitle.split(/\s+/).filter((word) => word.length > 0);

  if (words.length > 1) {
    return words.map((word) => word[0]).join("");
  }

  if (words.length === 1) {
    const word = words[0];
    return word.substring(0, 2);
  }

  return "";
};

// GET ALL
export const getAllCompanyFields = asyncHandler(
  async (req: Request, res: Response) => {
    let query: any = {};

    // Search by keyword in title or code
    if (req.query.keyword) {
      const keyword = req.query.keyword as string;
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { titleAr: { $regex: keyword, $options: "i" } },
        { code: { $regex: keyword, $options: "i" } },
      ];
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await CompanyField.countDocuments(query);

    const fields = await CompanyField.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      results: fields.length,
      data: fields,
    });
  }
);

// GET ONE
export const getOneCompanyField = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const field = await CompanyField.findById(id);

    if (!field) {
      return next(
        new ApiError(`No CompanyField found for this ID: ${id}`, 404)
      );
    }

    res.status(200).json({ status: "success", data: field });
  }
);

// CREATE
export const createCompanyField = asyncHandler(
  async (req: Request, res: Response) => {
    const title: string | undefined = req.body.title;

    if (!title) {
      res.status(400).json({
        status: "error",
        message: "Title is required to create a field.",
      });
      return;
    }
    const companyCode = generateCompanyCode(title);
    req.body.code = companyCode.toUpperCase();
    const field = await CompanyField.create(req.body);
    res.status(201).json({ status: "success", data: field });
  }
);

// UPDATE
export const updateCompanyField = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (req.body.title) {
      const newCode = generateCompanyCode(req.body.title);
      req.body.code = newCode.toUpperCase();
    }

    const updatedField = await CompanyField.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedField) {
      return next(new ApiError(`No CompanyField found for ID: ${id}`, 404));
    }

    res.status(200).json({
      status: "success",
      message: "Company field updated",
      data: updatedField,
    });
  }
);

// DELETE
export const deleteCompanyField = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const deleted = await CompanyField.findByIdAndDelete(id);

    if (!deleted) {
      return next(new ApiError(`No CompanyField found for ID: ${id}`, 404));
    }

    res.status(200).json({ status: "deleted successfully" });
  }
);
