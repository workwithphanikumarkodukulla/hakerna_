const mongoose = require('mongoose');

const { Schema, model, models } = mongoose;

const loginHistorySchema = new Schema({
    at: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    deviceFingerprint: String,
    success: { type: Boolean, default: true }
}, { _id: false });

const sessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    accessTokenId: { type: String, required: true, index: true },
    deviceFingerprint: String,
    userAgent: String,
    ip: String,
    rememberMe: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

const userSchema = new Schema({
    role: { type: String, required: true, enum: ['student', 'faculty', 'institution', 'admin', 'company'] },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'graduated', 'transferred', 'deleted'], default: 'active', index: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: String,
    emailVerificationExpiresAt: Date,
    otpHash: String,
    otpExpiresAt: Date,
    forgotPasswordTokenHash: String,
    forgotPasswordExpiresAt: Date,
    rememberMeEnabled: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
    profileCompletion: { type: Number, default: 0 },
    lastLoginAt: Date,
    lastLoginIp: String,
    loginHistory: [loginHistorySchema],
    department: String,
    designation: String,
    institution: String,
    companyProfile: {
        industry: String,
        size: String,
        website: String,
        hrContact: String,
        phone: String,
        location: String,
        description: String
    },
    studentProfile: {
        course: String,
        year: String,
        semester: String,
        academicYear: String,
        credits: { type: Number, default: 0 },
        cgpa: Number,
        phone: String,
        classTeacherEmail: String,
        classTeacherCode: String,
        classTeacherName: String,
        fatherName: String,
        motherName: String,
        socialMedia: {
            linkedin: String,
            github: String,
            portfolio: String
        }
    },
    facultyProfile: {
        experience: String,
        employeeId: String,
        specialization: String,
        teacherCode: { type: String, index: true }
    },
    profileImage: String,
    deletedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function setUpdatedAt(next) {
    this.updatedAt = new Date();
    next();
});

userSchema.index({ role: 1, status: 1 });

const achievementHistorySchema = new Schema({
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    remarks: String,
    statusFrom: String,
    statusTo: String,
    at: { type: Date, default: Date.now }
}, { _id: false });

const achievementSchema = new Schema({
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerRole: { type: String, required: true, enum: ['student', 'faculty'] },
    category: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    department: String,
    academicYear: String,
    semester: String,
    organizer: String,
    venue: String,
    startDate: Date,
    endDate: Date,
    certificateId: { type: String, trim: true, sparse: true, index: true },
    verificationUrl: String,
    proofUploads: [{ fileName: String, originalName: String, mimeType: String, size: Number, path: String }],
    additionalImages: [String],
    remarks: String,
    status: { type: String, enum: ['pending', 'faculty_review', 'correction_requested', 'institution_verification', 'approved', 'rejected'], default: 'pending', index: true },
    credits: { type: Number, default: 0 },
    facultyAssignedId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewerRemarks: String,
    history: [achievementHistorySchema],
    softDeletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

achievementSchema.index({ ownerUserId: 1, title: 1, category: 1, academicYear: 1, semester: 1 }, { unique: true, partialFilterExpression: { softDeletedAt: null } });

const notificationSchema = new Schema({
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    recipientRole: { type: String, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: Schema.Types.Mixed,
    readAt: Date,
    createdAt: { type: Date, default: Date.now }
});

const auditLogSchema = new Schema({
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: String,
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    status: String,
    ip: String,
    userAgent: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    details: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

const departmentSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    active: { type: Boolean, default: true },
    deletedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

departmentSchema.pre('save', function setDepartmentUpdatedAt(next) {
    this.updatedAt = new Date();
    next();
});

const User = models.User || model('User', userSchema);
const Session = models.Session || model('Session', sessionSchema);
const Achievement = models.Achievement || model('Achievement', achievementSchema);
const Notification = models.Notification || model('Notification', notificationSchema);
const AuditLog = models.AuditLog || model('AuditLog', auditLogSchema);
const Department = models.Department || model('Department', departmentSchema);

module.exports = {
    User,
    Session,
    Achievement,
    Notification,
    AuditLog,
    Department
};