const mongoose = require('mongoose');
const { ROLE_VALUES, ROLES } = require('../constants/roles');
const { STATUS_VALUES, STATUSES } = require('../constants/statuses');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'fullName is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
      default: ROLES.CUSTOMER,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      required: true,
      default: STATUSES.ACTIVE,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, status: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = { User };
