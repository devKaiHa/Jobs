"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true,
});
Object.defineProperty(exports, "default", {
  enumerable: true,
  get: function () {
    return _default;
  },
});
const _mongoose = /*#__PURE__*/ _interop_require_wildcard(require("mongoose"));
function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== "function") return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) {
    return {
      default: obj,
    };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {
    __proto__: null,
  };
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
const jobAdSchema = new _mongoose.Schema(
  {
    jobTitle: {
      type: String,
    },
    type: {
      type: String,
    },
    location: {
      type: String,
    },
    description: {
      type: String,
    },
    expectedSalary: {
      type: String,
    },
    responsibilities: [
      {
        type: String,
      },
    ],
    qualifications: [
      {
        type: String,
      },
    ],
    endDate: {
      type: String,
    },
    skills: [
      {
        type: String,
      },
    ],
    company: {
      type: _mongoose.Schema.Types.ObjectId,
      ref: "jobCompanies",
    },
    companyId: String,
    status: {
      type: Boolean,
    },
    applicantsNumber: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
const JobModel = _mongoose.default.model("jobAdvertisement", jobAdSchema);
const _default = JobModel;
