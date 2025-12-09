"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _mongoose = /*#__PURE__*/ _interop_require_default(require("mongoose"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const emoloyeeShcema = new _mongoose.default.Schema({
    name: {
        type: String,
        require: [
            true,
            "employee name is require"
        ]
    },
    email: {
        type: String,
        require: [
            true,
            "email is require"
        ],
        lowercase: true
    },
    active: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: [
            true,
            "Password is required"
        ],
        minlength: [
            4,
            "Password must be at least 4 characters long"
        ]
    },
    passwordChangedAt: String,
    passwordResetCode: String,
    passwordResetExpires: Number,
    resetCodeVerified: Boolean,
    passwordResetVerified: Boolean,
    twoFactorCode: String,
    twoFactorExpires: Date,
    twoFactorVerified: {
        type: Boolean,
        default: false
    },
    archives: {
        type: String,
        enum: [
            "true",
            "false"
        ],
        default: "false"
    },
    image: String
}, {
    timestamps: true
});
const setImageURL = (doc)=>{
    if (doc.image) {
        const imageUrl = `${process.env.BASE_URL}/employee/${doc.image}`;
        doc.image = imageUrl;
    }
};
emoloyeeShcema.post("init", function(doc) {
    setImageURL(doc);
});
emoloyeeShcema.post("save", (doc)=>{
    setImageURL(doc);
});
const Employee = _mongoose.default.model("Employee", emoloyeeShcema);
const _default = Employee;
