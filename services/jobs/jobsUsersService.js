const asyncHandler = require("express-async-handler");
const jobsUserModel = require("../../models/jobs/jobsUsersModel");
const ApiError = require("../../utils/apiError");
const { default: slugify } = require("slugify");
const multer = require("multer");
const multerStorage = multer.memoryStorage();
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images Allowed", 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadJobUsersImage = upload.single("image");
exports.resizerUserImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.png`;

  if (req.file) {
    await sharp(req.file.buffer)
      .toFormat("png")
      .png({ quality: 50 })
      .toFile(`uploads/jobs/${filename}`);

    //save image into our db
    req.body.image = filename;
  }

  next();
});

// Get All Job users
exports.getJobUsers = asyncHandler(async (req, res, next) => {
  const pageSize = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * pageSize;
  let query = {};
  if (req.query.keyword) {
    query.$or = [{ name: { $regex: req.query.keyword, $options: "i" } }];
  }
  const totalItems = await jobsUserModel.countDocuments(query);
  const totalPages = Math.ceil(totalItems / pageSize);
  const jobsUsers = await jobsUserModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    status: "success",
    totalPages: totalPages,
    results: totalItems,
    data: jobsUsers,
  });
});

// Create Job User
exports.createJobUser = asyncHandler(async (req, res, next) => {
  req.body.slug = slugify(req.body.name);
  const user = await jobsUserModel.create(req.body);
  res
    .status(201)
    .json({ status: "success", message: "User Inserted", data: user });
});

// Get Specific Job User by ID
exports.getJobUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await jobsUserModel.findById(id);

  if (!user) {
    return next(new ApiError(`No User found for ID: ${id}`, 404));
  }
  res.status(200).json({ status: "success", data: user });
});

// Update Job User
exports.updateJobUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await jobsUserModel.findByIdAndUpdate({ _id: id }, req.body, {
    new: true,
  });
  if (!user) {
    return next(new ApiError(`No User found for ID ${id}`, 404));
  }
  res
    .status(200)
    .json({ status: "success", message: "User updated", data: user });
});

// Delete Job User
exports.deleteJobUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await jobsUserModel.findByIdAndDelete(id);
  if (!user) {
    return next(new ApiError(`No User found for ID ${id}`, 404));
  }
  res.status(200).json({ status: "success", message: "User Deleted" });
});
