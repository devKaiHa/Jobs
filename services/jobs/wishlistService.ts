import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import ApiError from "../../utils/apiError";
import wishlistModel from "../../models/jobs/wishlistModel";

export const getWishlists = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const pageSize = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * pageSize;

    const query: any = {};

    if (req.query.jobSeeker) {
      query.jobSeeker = req.query.jobSeeker;
    }

    const totalItems = await wishlistModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);

    const wishlists = await wishlistModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("jobSeeker", "lastName name")
      .populate("job");
    res.status(200).json({
      status: "success",
      totalPages,
      results: totalItems,
      data: wishlists,
    });
  }
);

export const createWishlist = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const wishlists = await wishlistModel.create(req.body);
    res.status(201).json({
      status: "success",
      message: "wishlists inserted",
      data: wishlists,
    });
  }
);

export const deleteWishlist = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const wishlists = await wishlistModel.findByIdAndDelete(id);

    if (!wishlists)
      return next(new ApiError(`No wishlists found for ID: ${id}`, 404));

    res.status(200).json({
      status: "success",
      message: "wishlists deleted",
    });
  }
);
