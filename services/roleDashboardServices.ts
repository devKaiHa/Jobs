import { Request } from "express";
import mongoose, { Types } from "mongoose";
import asyncHandler from "express-async-handler";

import RoleDashboard from "../models/roleDashboardModel";
import { AsyncHandler } from "../types/express";

interface RoleDashboardRequest extends Request {
  query: {
    databaseName?: string;
  };
}

//get all roles dashboard
//admin
export const getRoleDashboard: AsyncHandler = asyncHandler(
  async (req: RoleDashboardRequest, res, next) => {
    const dbName = req.query.databaseName;

    if (dbName) {
      const db = mongoose.connection.useDb(dbName);
    }

    const rolesDashboard = await RoleDashboard.find();
    res.status(201).json({ status: "true", data: rolesDashboard });
  }
);

//get roles on array of ids
export const getDashboardRoles = async (
  ids: Types.ObjectId[],
  companyId: string
): Promise<string[]> => {
  const dashboardRoles = await RoleDashboard.find({
    _id: { $in: ids },
  }).select("-_id title");

  return dashboardRoles.map((role) => role.title);
};
