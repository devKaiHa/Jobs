import mongoose, { Document } from "mongoose";

export interface IRole extends Document {
  name: string;
  description?: string;
  rolesDashboard?: mongoose.Types.ObjectId[];
  superAdmin?: boolean;
  sync?: boolean;
  companyId: string;
  transfer?: boolean;
}

const rolesShcema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, " Role name is require"],
    },
    description: {
      type: String,
    },
    rolesDashboard: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "RoleDashboard",
      },
    ],

    superAdmin: { type: Boolean, default: false },
    sync: { type: Boolean, default: false },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    transfer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Roles = mongoose.model<IRole>("Roles", rolesShcema);
export default Roles;
