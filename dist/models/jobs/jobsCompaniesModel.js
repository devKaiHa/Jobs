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
const jobCompanyModel = new _mongoose.default.Schema({
    companyName: {
        type: String,
        required: true
    },
    legalName: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    contactPersonName: String,
    phone: String,
    website: String,
    industry: String,
    size: String,
    registrationNumber: String,
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    logo: String,
    about: String,
    foundedAt: String,
    status: {
        type: String,
        enum: [
            "pending",
            "accepted",
            "rejected"
        ],
        default: "pending"
    },
    verified: {
        type: Boolean,
        default: false
    },
    jobAdvertisement: [
        {
            type: _mongoose.default.Schema.Types.ObjectId,
            ref: "jobAdvertisement"
        }
    ],
    files: [
        String
    ],
    isActive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
const setImageURL = (doc)=>{
    if (doc.logo) {
        doc.logo = `${process.env.BASE_URL}:${process.env.PORT}/jobCompanies/${doc.logo}`;
    }
    if (doc.files && doc.files.length > 0) {
        doc.files = doc.files.map((file)=>{
            return `${process.env.BASE_URL}:${process.env.PORT}/jobCompanies/files/${file}`;
        });
    }
};
jobCompanyModel.post("init", function(doc) {
    setImageURL(doc);
});
jobCompanyModel.post("save", function(doc) {
    setImageURL(doc);
});
const JobsCompany = _mongoose.default.model("jobCompanies", jobCompanyModel);
const _default = JobsCompany;
