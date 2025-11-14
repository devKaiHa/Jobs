import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import ApiError from "../../utils/apiError";
import jobApplicationModel from "../../models/jobs/jobApplicationModel";
import jobSeekersModel from "../../models/jobSeekersModel";
import jobAdvertisementModel from "../../models/jobs/jobAdvertisementModel";

export const getAllJobApplications = asyncHandler(
  async (req: Request, res: Response) => {
    let query: any = {};

    if (req.query.keyword) {
      query.$or = [
        { status: { $regex: req.query.keyword as string, $options: "i" } },
      ];
    }

    if (req.query.jobId) {
      query.jobId = req.query.jobId;
    }
    if (req.query.jobSeekerId) {
      query.jobSeekerId = req.query.jobSeekerId;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await jobApplicationModel.countDocuments(query);

    const Applications = await jobApplicationModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("jobSeekerId")
      .populate("jobId")
      .populate({
        path: "jobId",
        populate: {
          path: "company",
          select: "companyName",
        },
      });

    res.status(200).json({
      status: "success",
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      results: Applications.length,
      data: Applications,
    });
  }
);

export const getOneJobApplication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const Applications = await jobApplicationModel
      .findById(id)
      .populate("jobSeekerId")
      .populate("jobId");

    if (!Applications) {
      return next(
        new ApiError(`No Applications found for this ID: ${id}`, 404)
      );
    }

    res.status(200).json({ status: "success", data: Applications });
  }
);

export const createJobApplication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { jobSeekerId, jobId } = req.body;
    const jobSeeker = await jobSeekersModel.findById(jobSeekerId);
    if (!jobSeeker || !jobId) {
      return next(new ApiError("Job seeker or jobId not found", 404));
    }
    const applicationData = req.body;

    const Applications = await jobApplicationModel.create(applicationData);
    res.status(201).json({ status: "success", data: Applications });
  }
);

export const updateJobApplication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const Applications = await jobApplicationModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!Applications)
      return next(new ApiError(`No user found for ID: ${id}`, 404));

    res.status(200).json({
      status: "success",
      message: "Application updated",
      data: Applications,
    });
  }
);

export const deleteJobApplication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const Applications = await jobApplicationModel.findByIdAndDelete(id);

    if (!Applications) {
      return next(new ApiError(`No job found for ID: ${id}`, 404));
    }

    res.status(200).json({ status: "deleted successfully" });
  }
);
