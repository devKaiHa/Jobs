import axios from "axios";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import JobsCompany from "../../models/jobs/jobsCompaniesModel";
import ApiError from "../../utils/apiError";
import multer, { FileFilterCallback } from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { IJobsCompany } from "../../models/interfaces/jobsCompany";
import sendEmail from "../../utils/sendEmail";

const multerStorage = multer.memoryStorage();
const logoFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.fieldname === "logo") {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new ApiError("Logo must be an image", 400));
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: logoFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const uploadCompanyFiles = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "files", maxCount: 5 },
]);

export const processCompanyFiles = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const filesField = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (filesField && filesField.logo && filesField.logo[0]) {
      const logoFile = filesField.logo[0];
      const filename = `company-logo-${uuidv4()}-${Date.now()}.png`;

      await sharp(logoFile.buffer)
        .toFormat("png")
        .png({ quality: 70 })
        .toFile(`uploads/jobCompanies/${filename}`);

      req.body.logo = filename;
    }

    if (filesField && filesField.files && filesField.files.length > 0) {
      const uploadDir = "uploads/jobCompanies/files";
      const savedFileNames: string[] = [];

      for (const file of filesField.files) {
        const ext = path.extname(file.originalname);
        const filename = `company-file-${uuidv4()}-${Date.now()}${ext}`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, file.buffer);
        savedFileNames.push(filename);
      }

      req.body.files = savedFileNames;
    }

    next();
  }
);

export const getCompanies = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const pageSize = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * pageSize;

    const query: Record<string, any> = {};
    if (req.query.keyword) {
      query.$or = [
        { companyName: { $regex: req.query.keyword as string, $options: "i" } },
        { industry: { $regex: req.query.keyword as string, $options: "i" } },
        {
          "address.city": {
            $regex: req.query.keyword as string,
            $options: "i",
          },
        },
        {
          "address.country": {
            $regex: req.query.keyword as string,
            $options: "i",
          },
        },
      ];
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

export const createCompany = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const company: IJobsCompany = await JobsCompany.create(req.body);
    res.status(201).json({
      status: "success",
      message: "Company created successfully",
      data: company,
    });
  }
);

export const getCompany = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const company = await JobsCompany.findById(id).populate("jobAdvertisement");

    if (!company) {
      return next(new ApiError(`No company found for ID: ${id}`, 404));
    }

    res.status(200).json({ status: "success", data: company });
  }
);

export const updateCompany = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const company = await JobsCompany.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!company) {
      return next(new ApiError(`Invalid company with ID ${id}`, 404));
    }

    if (req.body.status === "accepted") {
      try {
        // company.verified = true;
        await company.save();
        await axios.post("http://localhost:80/api/companyinfo", {
          companyName: company.companyName,
          companyEmail: company.email,
          email: company.email,
          name: company.companyName,
          companyTel: company.phone,
          companyAddress: company.address.city,
          companyLogo: company.logo,
          jobsCompanyId: req.body.jobsCompanyId,
        });

        res.status(200).json({
          status: "success",
          message:
            "Company has been approved and sent to the main system successfully",
          data: company,
        });
      } catch (err: any) {
        console.error("Error connecting to the main system:", err.message);
        return next(
          new ApiError("Failed to send company data to the main system", 500)
        );
      }
      return;
    }

    if (company.status === "rejected") {
      res.status(200).json({
        status: "rejected",
        message: "Company has been rejected",
        data: company,
      });
      return;
    }

    res.status(200).json({
      status: "pending",
      message: "Company data updated, awaiting approval",
      data: company,
    });
  }
);

export const deleteCompany = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { message } = req.body;

    const company = await JobsCompany.findByIdAndDelete(id);

    if (!company) {
      return next(new ApiError(`No company found for ID ${id}`, 404));
    }

    const email = company.email;

    await sendEmail({
      email,
      subject: "Company Registration Rejected",
      message:
        message ||
        `Hello ${company.companyName}, we're sorry to inform you that your registration request has been declined.`,
    });

    res.status(200).json({
      status: "success",
      message: "Company deleted and email sent",
    });
  }
);
