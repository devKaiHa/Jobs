import mongoose, { Document } from "mongoose";

export interface IRoleDashboard extends Document {
  title?: string;
  info?: string;
  desc?: string;
  type?: string;
  sync?: boolean;
}

const roleDashboardSchema = new mongoose.Schema({
  title: String,
  info: String,
  desc: String,
  type: String,
  sync: { type: Boolean, default: false },
});

const RoleDashboard = mongoose.model<IRoleDashboard>(
  "RoleDashboard",
  roleDashboardSchema
);
export default RoleDashboard;
