import { Request } from "express";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";

import ApiError from "../utils/apiError";
import Roles from "../models/roleModel";
import { IRole } from "../models/roleModel";
import { AsyncHandler } from "../types/express";

interface RoleRequest extends Request {
  body: Partial<IRole> & {
    companyId?: string;
  };
  query: {
    companyId?: string;
  };
  params: {
    id?: string;
  };
}

//@desc Get list of Role
//@route GET /api/role
//@access Private
export const getRoles: AsyncHandler = asyncHandler(
  async (req: RoleRequest, res, next) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    const roles = await Roles.find({ companyId }).populate({
      path: "rolesDashboard",
      select: "title _id",
    });

    res.status(200).json({ status: "true", data: roles });
  }
);

//@desc Create Role
//@route Post /api/role
//@access Private
export const createRole: AsyncHandler = asyncHandler(
  async (req: RoleRequest, res, next) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    req.body.companyId = companyId;
    const role = await Roles.create(req.body);

    res.status(200).json({
      status: "true",
      message: "Role Inserted",
      data: role,
    });
  }
);

//@desc Get specific Role by id
//@route Get /api/role/:id
//@access Private
export const getRole: AsyncHandler = asyncHandler(
  async (req: RoleRequest, res, next) => {
    const companyId = req.query.companyId;
    const { id } = req.params;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    const role = await Roles.findOne({ _id: id, companyId }).populate({
      path: "rolesDashboard",
      select: "title _id",
    });

    if (!role) {
      return next(new ApiError(`No Role for this id ${id}`, 404));
    }

    res.status(201).json({ status: "true", data: role });
  }
);

//@desc update specific Role by id
//@route Put /api/role/:id
//@access Private
export const updateRole: AsyncHandler = asyncHandler(
  async (req: RoleRequest, res, next) => {
    const { id } = req.params;
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    req.body.companyId = companyId;
    const role = await Roles.findOneAndUpdate(
      { _id: id, companyId },
      req.body,
      { new: true }
    );

    if (!role) {
      return next(new ApiError(`No Role for this id ${id}`, 404));
    }

    res.status(200).json({
      status: "true",
      message: "Role updated",
      data: role,
    });
  }
);

//@desc Delete specific Role
//@route Delete /api/role/:id
//@access private
export const deleteRole: AsyncHandler = asyncHandler(
  async (req: RoleRequest, res, next) => {
    const { id } = req.params;
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    const role = await Roles.findOneAndDelete({ _id: id, companyId });

    if (!role) {
      return next(new ApiError(`No Role for this id ${id}`, 404));
    }

    res.status(200).json({ status: "true", message: "Role Deleted" });
  }
);
