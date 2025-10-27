import { Request } from "express";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import axios from "axios";

import ApiError from "../utils/apiError";
import generatePassword from "../utils/tools/generatePassword";
import { getDashboardRoles } from "./roleDashboardServices";
import sendEmail from "../utils/sendEmail";
import isEmail from "../utils/tools/isEmail";
import createToken from "../utils/createToken";

import Employee from "../models/employeeModel";
import Roles from "../models/roleModel";
import CompanyInfo from "../models/companyInfoModel";
import { IEmployee } from "../models/interfaces/employee";
import { AsyncHandler } from "../types/express";

interface EmployeeRequest extends Request {
  user?: IEmployee;
  file?: Express.Multer.File;
  body: {
    email?: string;
    name?: string;
    password?: string;
    companyId?: string;
    selectedRoles?: string;
    subscribtion?: string;
    userType?: string;
    companyName?: string;
    tags?: string;
    stocks?: string;
    expenseTags?: string;
    purchaseTags?: string;
    salesTags?: string;
    selectedQuickActions?: string;
    newPassword?: string;
    image: string;
    company?: Array<{
      companyId: string;
      selectedRoles: string;
      companyName: string;
    }>;
  };
  query: {
    companyId?: string;
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
      const companyId = req.query.companyId;

      if (!companyId) {
        res.status(400).json({ message: "companyId is required" });
        return;
      }

      const pageSize = parseInt(req.query.limit || "10");
      const page = parseInt(req.query.page || "1");
      const skip = (page - 1) * pageSize;

      let query: any = {
        company: {
          $elemMatch: { companyId },
        },
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
        .populate({
          path: "company.selectedRoles",
          select: "name _id",
        });

      const employeesWithRoles = employees.map((emp) => {
        const companyData = emp.company?.find((c) => c.companyId === companyId);
        return {
          ...emp.toObject(),
          selectedRoles: companyData?.selectedRoles || null,
        };
      });

      res.status(200).json({
        status: "true",
        Pages: totalPages,
        results: totalItems,
        data: employeesWithRoles,
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ status: "false", error: "Internal Server Error" });
    }
  }
);

//@desc Create specific employee
//@route Post /api/employee
//@access private
export const createEmployee: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const email = req.body.email;
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    if (!email || !isEmail(email)) {
      return next(new ApiError("There is an error in email format", 500));
    }

    req.body.companyId = companyId;
    const findEmployee = await Employee.findOne({ email });
    let employee;

    try {
      const employeePass = generatePassword();
      const company = await CompanyInfo.findById(companyId);

      if (!company) {
        return next(new ApiError("Company not found", 404));
      }

      req.body.tags = req.body.tags ? JSON.parse(req.body.tags) : [];
      req.body.stocks = req.body.stocks ? JSON.parse(req.body.stocks) : [];
      req.body.expenseTags = req.body.expenseTags
        ? JSON.parse(req.body.expenseTags)
        : [];
      req.body.purchaseTags = req.body.purchaseTags
        ? JSON.parse(req.body.purchaseTags)
        : [];
      req.body.salesTags = req.body.salesTags
        ? JSON.parse(req.body.salesTags)
        : [];
      req.body.company = [
        {
          companyId,
          selectedRoles: req.body.selectedRoles,
          companyName: company.companyName,
        },
      ];

      if (!findEmployee) {
        req.body.password = await bcrypt.hash(employeePass, 12);

        await sendEmail({
          email: req.body.email,
          subject: "New Password",
          message: `Hello ${req.body.name}, Your password is ${employeePass}`,
        });

        employee = await Employee.create(req.body);
      } else {
        employee = await Employee.findByIdAndUpdate(
          findEmployee._id,
          {
            $addToSet: {
              company: {
                companyId,
                selectedRoles: req.body.selectedRoles,
                companyName: company.companyName,
              },
            },
          },
          { new: true }
        );
      }

      res.status(201).json({
        status: "true",
        message: "Employee Inserted",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const createEmployeeInPos: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const email = req.body.email;
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    if (!email || !isEmail(email)) {
      return next(new ApiError("Invalid email format", 400));
    }

    req.body.companyId = companyId;

    try {
      const employeePass = generatePassword();
      const hashedPassword = await bcrypt.hash(employeePass, 12);

      req.body.password = hashedPassword;

      await sendEmail({
        email: req.body.email,
        subject: "New Password",
        message: `Hello ${req.body.name}, Your password is ${employeePass}`,
      });

      // req.body.companySubscribtionId = req.body.subscribtion;
      req.body.userType = "normal";

      if (req.body.userType === "normal" && req.body.subscribtion) {
        await axios.post(`${process.env.BASE_URL_FOR_SUB}:4001/api/allusers`, {
          email,
          subscribtion: [req.body.subscribtion],
          userType: req.body.userType,
        });
      }

      req.body.tags = req.body.tags ? JSON.parse(req.body.tags) : [];
      req.body.stocks = req.body.stocks ? JSON.parse(req.body.stocks) : [];
      req.body.expenseTags = req.body.expenseTags
        ? JSON.parse(req.body.expenseTags)
        : [];
      req.body.purchaseTags = req.body.purchaseTags
        ? JSON.parse(req.body.purchaseTags)
        : [];
      req.body.salesTags = req.body.salesTags
        ? JSON.parse(req.body.salesTags)
        : [];

      const employee = await Employee.create(req.body);

      res.status(201).json({
        status: 200,
        message: "Employee Inserted",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const reSendPassword: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const { email } = req.body;
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    const findEmployee = await Employee.findOne({ email });
    if (!findEmployee) {
      return next(new ApiError("Employee not found", 404));
    }

    try {
      const employeePass = generatePassword();
      const hashedPassword = await bcrypt.hash(employeePass, 12);

      await sendEmail({
        email,
        subject: "New Password",
        message: `Hello ${findEmployee.name}, Your password is ${employeePass}`,
      });

      const employee = await Employee.findOneAndUpdate(
        { email, companyId },
        { password: hashedPassword },
        { new: true }
      );

      res.status(201).json({
        status: 200,
        message: "Employee Update Password",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

//@desc get specific Employee by ID
//@route Get /api/employee/:id
//@access private
export const getEmployee: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const { id } = req.params;
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    const employee = await Employee.findOne({
      _id: id,
      company: {
        $elemMatch: { companyId },
      },
    }).select("-password -pin -createdAt -updatedAt");

    if (!employee) {
      return next(new ApiError(`No employee by this id ${id}`, 404));
    }

    const companyData = employee.company?.find(
      (c) => c.companyId.toString() === companyId.toString()
    );

    if (!companyData?.selectedRoles) {
      return next(new ApiError("No roles found for this employee", 404));
    }

    const roles = await Roles.findOne({
      _id: companyData.selectedRoles,
      companyId,
    });

    if (!roles) {
      return next(new ApiError("No roles found", 404));
    }

    const dashRoleName = await getDashboardRoles(
      roles.rolesDashboard,
      companyId
    );

    const employeeData = employee.toObject();
    employeeData.selectedRoles = roles._id;

    res.status(200).json({
      status: "true",
      data: employeeData,
      dashBoardRoles: dashRoleName,
    });
  }
);

//@desc Update employee password by ID
//@route PUT /api/updatePassword
//@access Private
export const updateEmployeePassword: AsyncHandler = asyncHandler(
  async (req: EmployeeRequest, res, next) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    if (!req.user?._id) {
      return next(new ApiError("User not authenticated", 401));
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword || "", 12);

    const user = await Employee.findOneAndUpdate(
      { _id: req.user._id, companyId },
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
    const companyId = req.query.companyId;
    const { id } = req.params;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

    if (!id) {
      return next(new ApiError("Employee ID is required", 400));
    }

    const updateData: any = { ...req.body };

    // Parse JSON strings if present
    if (req.body.tags) updateData.tags = JSON.parse(req.body.tags);
    if (req.body.stocks) updateData.stocks = JSON.parse(req.body.stocks);
    if (req.body.expenseTags)
      updateData.expenseTags = JSON.parse(req.body.expenseTags);
    if (req.body.purchaseTags)
      updateData.purchaseTags = JSON.parse(req.body.purchaseTags);
    if (req.body.salesTags)
      updateData.salesTags = JSON.parse(req.body.salesTags);
    if (req.body.selectedQuickActions)
      updateData.selectedQuickActions = JSON.parse(
        req.body.selectedQuickActions
      );

    if (req.body.selectedRoles) {
      updateData["company.$.selectedRoles"] = req.body.selectedRoles;
      delete updateData.selectedRoles;
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, "company.companyId": companyId },
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
    const companyId = req.query.companyId;

    if (!companyId) {
      res.status(400).json({ message: "companyId is required" });
      return;
    }

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
