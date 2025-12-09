"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get createJobUser() {
    return createJobUser;
  },
  get deleteJobUser() {
    return deleteJobUser;
  },
  get getJobUser() {
    return getJobUser;
  },
  get getJobUsers() {
    return getJobUsers;
  },
  get updateJobUser() {
    return updateJobUser;
  },
});
const _expressasynchandler = /*#__PURE__*/ _interop_require_default(
  require("express-async-handler")
);
const _apiError = /*#__PURE__*/ _interop_require_default(
  require("../../../utils/apiError")
);
const _jobSeekersModel = /*#__PURE__*/ _interop_require_default(
  require("../../models/jobSeekersModel")
);
function _interop_require_default(obj) {
  return obj && obj.__esModule
    ? obj
    : {
        default: obj,
      };
}
const getJobUsers = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * pageSize;
    const query = {};
    if (req.query.keyword) {
      query.$or = [
        {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        },
      ];
    }
    const totalItems = await _jobSeekersModel.default.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);
    const jobsUsers = await _jobSeekersModel.default
      .find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageSize);
    res.status(200).json({
      status: "success",
      totalPages,
      results: totalItems,
      data: jobsUsers,
    });
  }
);
const createJobUser = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const user = await _jobSeekersModel.default.create(req.body);
    res.status(201).json({
      status: "success",
      message: "User inserted",
      data: user,
    });
  }
);
const getJobUser = (0, _expressasynchandler.default)(async (req, res, next) => {
  const { id } = req.params;
  const user = await _jobSeekersModel.default.findById(id);
  if (!user)
    return next(new _apiError.default(`No user found for ID: ${id}`, 404));
  res.status(200).json({
    status: "success",
    data: user,
  });
});
const updateJobUser = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { id } = req.params;
    const user = await _jobSeekersModel.default.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );
    if (!user)
      return next(new _apiError.default(`No user found for ID: ${id}`, 404));
    res.status(200).json({
      status: "success",
      message: "User updated",
      data: user,
    });
  }
);
const deleteJobUser = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { id } = req.params;
    const user = await _jobSeekersModel.default.findByIdAndDelete(id);
    if (!user)
      return next(new _apiError.default(`No user found for ID: ${id}`, 404));
    res.status(200).json({
      status: "success",
      message: "User deleted",
    });
  }
);
