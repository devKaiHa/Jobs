"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWishlist = exports.createWishlist = exports.getWishlists = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const apiError_1 = __importDefault(require("../../utils/apiError"));
const wishlistModel_1 = __importDefault(require("../../models/jobs/wishlistModel"));
exports.getWishlists = (0, express_async_handler_1.default)(async (req, res, next) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * pageSize;
    const query = {};
    if (req.query.jobSeeker) {
        query.jobSeeker = req.query.jobSeeker;
    }
    const totalItems = await wishlistModel_1.default.countDocuments(query);
    const totalPages = Math.ceil(totalItems / pageSize);
    const wishlists = await wishlistModel_1.default
        .find(query)
        .sort({ createdAt: -1 })
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
});
exports.createWishlist = (0, express_async_handler_1.default)(async (req, res, next) => {
    const wishlists = await wishlistModel_1.default.create(req.body);
    res.status(201).json({
        status: "success",
        message: "wishlists inserted",
        data: wishlists,
    });
});
exports.deleteWishlist = (0, express_async_handler_1.default)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const wishlists = await wishlistModel_1.default.findOneAndDelete({ job: id });
        if (!wishlists)
            return next(new apiError_1.default(`No wishlists found for ID: ${id}`, 404));
        res.status(200).json({
            status: "success",
            message: "wishlists deleted",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: error,
        });
    }
});
