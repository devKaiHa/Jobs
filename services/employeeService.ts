import { Request } from "express";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import axios from "axios";

import ApiError from "../utils/apiError";
import generatePassword from "../utils/tools/generatePassword";
import sendEmail from "../utils/sendEmail";
import isEmail from "../utils/tools/isEmail";
import createToken from "../utils/createToken";

import Employee from "../models/employeeModel";
import { IEmployee } from "../models/interfaces/employee";
import { AsyncHandler } from "../types/express";

interface EmployeeRequest extends Request {
  user?: IEmployee;
  file?: Express.Multer.File;
  body: {
    email?: string;
    name?: string;
    password?: string;
    newPassword?: string;
    image: string;
  };
  query: {
    limit?: string;
    page?: string;
    keyword?: string;
  };
  params: {
    id?: string;
  };
}

// Multer configuration
const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images Allowed", 400));
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadEmployeeImage = upload.single("image");

export const resizerEmployeeImage: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const filename = `image-${uuidv4()}-${Date.now()}.png`;

    if (req.file) {
      await sharp(req.file.buffer)
        .toFormat("webp")
        .png({ quality: 50 })
        .toFile(`uploads/Image/${filename}`);

      req.body.image = filename;
    }

    next();
  }
);

//@desc Get list of employee
//@route Get /api/user
//@access private
export const getEmployees: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    try {



      const pageSize = parseInt(req.query.limit || "10");
      const page = parseInt(req.query.page || "1");
      const skip = (page - 1) * pageSize;

      let query: any = {

      };

      if (req.query.keyword) {
        query.$or = [
          { email: { $regex: req.query.keyword, $options: "i" } },
          { name: { $regex: req.query.keyword, $options: "i" } },
        ];
      }

      const totalItems = await Employee.countDocuments(query);
      const totalPages = Math.ceil(totalItems / pageSize);

      const employees = await Employee.find(query)
        .skip(skip)
        .limit(pageSize)


      res.status(200).json({
        status: "true",
        Pages: totalPages,
        results: totalItems,
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ status: "false", error: "Internal Server Error" });
    }
  }
);


//@desc get specific Employee by ID
//@route Get /api/employee/:id
//@access private
export const getEmployee: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const { id } = req.params;


    const employee = await Employee.findOne({
      _id: id,

    })

    if (!employee) {
      return next(new ApiError(`No employee by this id ${id}`, 404));
    }

    res.status(200).json({
      status: "true",
      data: employee,
    });
  }
);

//@desc Update employee password by ID
//@route PUT /api/updatePassword
//@access Private
export const updateEmployeePassword: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {


    if (!req.user?._id) {
      return next(new ApiError("User not authenticated", 401));
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword || "", 12);

    const user = await Employee.findOneAndUpdate(
      { _id: req.user._id },
      {
        password: hashedPassword,
        passwordChangedAt: new Date().toISOString(),
      },
      { new: true }
    );

    if (!user) {
      return next(new ApiError("User not found", 404));
    }

    const token = createToken(user._id);

    res.status(200).json({ data: user, token });
  }
);

//@desc Update employee
//@route PUT /api/employee/:id
//@access Private
export const updateEmployee: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const { id } = req.params;



    if (!id) {
      return next(new ApiError("Employee ID is required", 400));
    }

    const updateData: any = { ...req.body };



    const employee = await Employee.findOneAndUpdate(
      { _id: id, },
      { $set: updateData },
      { new: true }
    );

    if (!employee) {
      return next(new ApiError(`There is no employee with this id ${id}`, 404));
    }

    res.status(200).json({
      status: "true",
      message: "Employee updated",
      data: employee,
    });
  }
);

//@desc Delete specific employee
//@route Delete /api/employee/:id
//@access private
export const deleteEmployee: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const { id } = req.params;

    const employeeToUpdate = await Employee.findById(id);

    if (!employeeToUpdate) {
      return next(new ApiError(`No employee by this id ${id}`, 404));
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id },
      { active: !employeeToUpdate.active },
      { new: true }
    );

    res.status(200).json({ status: "true", message: "Employee Deleted" });
  }
);
