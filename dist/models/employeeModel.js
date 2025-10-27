"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const emoloyeeShcema = new mongoose_1.default.Schema({
    name: {
        type: String,
        require: [true, "employee name is require"],
    },
    email: {
        type: String,
        require: [true, "email is require"],
        lowercase: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [4, "Password must be at least 4 characters long"],
    },
    passwordChangedAt: String,
    passwordResetCode: String,
    passwordResetExpires: String,
    passwordResetVerified: Boolean,
    archives: {
        type: String,
        enum: ["true", "false"],
        default: "false",
    },
    image: String,
}, { timestamps: true });
const setImageURL = (doc) => {
    if (doc.image) {
        const imageUrl = `${process.env.BASE_URL}/Image/${doc.image}`;
        doc.image = imageUrl;
    }
};
emoloyeeShcema.post("init", function (doc) {
    setImageURL(doc);
});
emoloyeeShcema.post("save", (doc) => {
    setImageURL(doc);
});
const Employee = mongoose_1.default.model("Employee", emoloyeeShcema);
exports.default = Employee;
