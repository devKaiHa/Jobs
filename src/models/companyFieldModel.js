"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const companyFieldSchema = new mongoose_1.default.Schema({
    title: String,
    titleAr: String,
    code: String,
}, { timestamps: true });
const CompanyField = mongoose_1.default.model("CompanyField", companyFieldSchema);
exports.default = CompanyField;
