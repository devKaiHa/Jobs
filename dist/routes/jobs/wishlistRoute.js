const express = require("express");
const { createWishlist, deleteWishlist, getWishlists, } = require("../../services/jobs/wishlistService");
const wishlistRoute = express.Router();
wishlistRoute.route("/").get(getWishlists).post(createWishlist);
wishlistRoute.route("/:id").delete(deleteWishlist);
module.exports = wishlistRoute;
