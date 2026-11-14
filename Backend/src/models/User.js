const mongoose = require('mongoose');
const {
  ROLE_VALUES,
  ROLES,
  normalizeRoles,
  pickPrimaryRole,
} = require('../constants/roles');
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
    /**
     * Primary role (highest privilege). Kept for JWT + legacy callers.
     * Prefer `roles` for authorization checks.
     */
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
      default: ROLES.CUSTOMER,
    },
    /**
     * All roles this global account may use across portals.
     * Example: ADMIN + CUSTOMER → Console and Shop with one email.
     */
    roles: {
      type: [
        {
          type: String,
          enum: ROLE_VALUES,
        },
      ],
      default: undefined,
      validate: {
        validator(arr) {
          if (arr === undefined || arr === null) return true;
          return Array.isArray(arr) && arr.length >= 1;
        },
        message: 'roles must contain at least one role',
      },
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

userSchema.pre('validate', function syncRolesBeforeValidate() {
  const roles = normalizeRoles(this);
  if (roles.length === 0) {
    roles.push(this.role || ROLES.CUSTOMER);
  }
  this.roles = [...new Set(roles)];
  this.role = pickPrimaryRole(this.roles);
});

userSchema.index({ role: 1, status: 1 });
userSchema.index({ roles: 1, status: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = { User };
