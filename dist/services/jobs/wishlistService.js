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
  get createWishlist() {
    return createWishlist;
  },
  get deleteWishlist() {
    return deleteWishlist;
  },
  get getWishlists() {
    return getWishlists;
  },
});
const _expressasynchandler = /*#__PURE__*/ _interop_require_default(
  require("express-async-handler")
);
const _apiError = /*#__PURE__*/ _interop_require_default(
  require("../../../utils/apiError")
);
const _wishlistModel = /*#__PURE__*/ _interop_require_default(
  require("../../models/jobs/wishlistModel")
);
function _interop_require_default(obj) {
  return obj && obj.__esModule
    ? obj
    : {
        default: obj,
      };
}
const getWishlists = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * pageSize;
    const query = {};
    if (req.query.jobSeeker) {
      query.jobSeeker = req.query.jobSeeker;
    }
    const totalItems = await _wishlistModel.default.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);
    const wishlists = await _wishlistModel.default
      .find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageSize)
      .populate("jobSeeker", "lastName name")
      .populate("job");
    res.status(200).json({
      status: "success",
      totalPages,
      results: totalItems,
      data: wishlists,
    });
  }
);
const createWishlist = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const wishlists = await _wishlistModel.default.create(req.body);
    res.status(201).json({
      status: "success",
      message: "wishlists inserted",
      data: wishlists,
    });
  }
);
const deleteWishlist = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const wishlists = await _wishlistModel.default.findOneAndDelete({
        job: id,
      });
      if (!wishlists)
        return next(
          new _apiError.default(`No wishlists found for ID: ${id}`, 404)
        );
      res.status(200).json({
        status: "success",
        message: "wishlists deleted",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "error",
        message: error,
      });
    }
  }
);
