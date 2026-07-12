const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { Achievement, AuditLog, Department, Notification, Session, User } = require('./models');

const CREDIT_RULES = {
    certification: 5,
    publication: 12,
    workshop: 3,
    internship: 8,
    hackathon: 10,
    sports: 6,
    cultural: 4,
    research: 14,
    project: 8,
    competition: 7,
    seminar: 2,
    patent: 18,
    nss: 4,
    ncc: 4,
    volunteering: 3,
    technical_event: 4,
    article: 6,
    book: 10,
    award: 7,
    consultancy: 9,
    grants: 11,
    mentorship: 5
};

function normalizeCategory(category) {
    return String(category || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function getCategoryCredits(category) {
    return CREDIT_RULES[normalizeCategory(category)] || 0;
}

function generateTeacherCode(name) {
    const cleaned = String(name || 'TEACHER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'TEACHER';
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${cleaned}-${suffix}`;
}

async function findReviewerForStudent(student) {
    const studentProfile = student?.studentProfile || {};
    if (studentProfile.classTeacherEmail) {
        const byEmail = await User.findOne({ email: studentProfile.classTeacherEmail.toLowerCase(), role: 'faculty', deletedAt: null });
        if (byEmail) return byEmail;
    }
    if (studentProfile.classTeacherCode) {
        const byCode = await User.findOne({ 'facultyProfile.teacherCode': studentProfile.classTeacherCode, role: 'faculty', deletedAt: null });
        if (byCode) return byCode;
    }
    return User.findOne({ role: 'faculty', institution: student?.institution, deletedAt: null }).sort({ createdAt: 1 });
}

async function notifyInstitutions({ actor, achievement, action, remarks }) {
    const institutions = await User.find({ role: 'institution', deletedAt: null }).lean();
    await Promise.all(institutions.map(institution => pushNotification({
        recipientUserId: institution._id,
        recipientRole: 'institution',
        type: 'workflow-monitoring',
        title: `Achievement ${action}`,
        message: `${actor?.name || 'A reviewer'} ${action} ${achievement.title} (${achievement.category}).`,
        metadata: { achievementId: achievement._id, remarks, status: achievement.status, actorRole: actor?.role }
    })));
}

async function notifyStudentAndReviewer({ student, reviewer, achievement, action, remarks }) {
    const targets = [];
    if (student?._id) {
        targets.push(pushNotification({
            recipientUserId: student._id,
            recipientRole: 'student',
            type: 'achievement-status',
            title: `Achievement ${action}`,
            message: `${achievement.title} is now ${achievement.status}.`,
            metadata: { achievementId: achievement._id, remarks, status: achievement.status }
        }));
    }
    if (reviewer?._id) {
        targets.push(pushNotification({
            recipientUserId: reviewer._id,
            recipientRole: 'faculty',
            type: 'review-assignment',
            title: 'New verification task',
            message: `${student?.name || 'Student'} submitted ${achievement.title} for review.`,
            metadata: { achievementId: achievement._id, status: achievement.status, studentId: student?._id }
        }));
    }
    await Promise.all(targets);
}

function sanitizeUser(user) {
    if (!user) {
        return null;
    }
    const plain = typeof user.toObject === 'function' ? user.toObject() : user;
    delete plain.passwordHash;
    delete plain.emailVerificationTokenHash;
    delete plain.otpHash;
    delete plain.forgotPasswordTokenHash;
    return plain;
}

function tokenPair(user, sessionId) {
    const accessTokenId = crypto.randomUUID();
    const refreshTokenId = crypto.randomUUID();

    const accessToken = jwt.sign(
        { sub: String(user._id), role: user.role, jti: accessTokenId, sid: sessionId },
        config.jwtAccessSecret,
        { expiresIn: config.jwtAccessExpiresIn }
    );

    const refreshToken = jwt.sign(
        { sub: String(user._id), role: user.role, jti: refreshTokenId, sid: sessionId },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpiresIn }
    );

    return { accessToken, refreshToken, accessTokenId, refreshTokenId };
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function createError(message, statusCode, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

function assertStrongPassword(password) {
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/;
    if (!strong.test(password)) {
        throw createError('Password must be at least 10 characters and include uppercase, lowercase, number, and symbol', 400, 'WEAK_PASSWORD');
    }
}

function isValidEmailDomain(email) {
    return /@(?:[a-z0-9-]+\.)*anits\.edu\.in$/i.test(String(email).trim().toLowerCase());
}

function enforceRoleDomain(rule, email) {
    if (rule && !isValidEmailDomain(email)) {
        throw createError('Only anits.edu.in email addresses are allowed for this role', 400, 'INVALID_DOMAIN');
    }
}

function isFutureDate(date) {
    return date && new Date(date).getTime() > Date.now();
}

async function recordAudit({ actor, action, entityType, entityId, status, before, after, details, req }) {
    await AuditLog.create({
        actorId: actor?._id,
        actorRole: actor?.role,
        action,
        entityType,
        entityId: String(entityId),
        status,
        before,
        after,
        details,
        ip: req?.ip,
        userAgent: req?.headers?.['user-agent']
    });
}

async function pushNotification({ recipientUserId, recipientRole, type, title, message, metadata }) {
    return Notification.create({ recipientUserId, recipientRole, type, title, message, metadata });
}

async function registerUser(payload, req) {
    const { role, email, password, name } = payload;
    if (!role || !email || !password || !name) {
        throw createError('Role, name, email, and password are required', 400, 'MISSING_FIELDS');
    }
    assertStrongPassword(password);

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw createError('Invalid email address', 400, 'INVALID_EMAIL');
    }

    enforceRoleDomain(['student', 'faculty', 'admin'].includes(role), normalizedEmail);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        throw createError('An account with this email already exists', 409, 'DUPLICATE_ACCOUNT');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
        ...payload,
        email: normalizedEmail,
        passwordHash,
        role,
        name,
        status: payload.status || 'active',
        emailVerified: false,
        profileCompletion: payload.profileCompletion || 20
    });

    if (role === 'faculty') {
        user.facultyProfile = user.facultyProfile || {};
        user.facultyProfile.teacherCode = payload.facultyProfile?.teacherCode || generateTeacherCode(name);
    }

    const verificationToken = crypto.randomBytes(24).toString('hex');
    user.emailVerificationTokenHash = hashToken(verificationToken);
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await recordAudit({ actor: user, action: 'register', entityType: 'user', entityId: user._id, status: 'success', details: { role }, req });
    await pushNotification({ recipientUserId: user._id, recipientRole: role, type: 'email-verification', title: 'Verify your email', message: 'Please verify your email address to continue.', metadata: { token: verificationToken } });

    return { user: sanitizeUser(user), verificationToken };
}

async function loginUser(payload, req) {
    const { email, password, role, rememberMe, deviceFingerprint } = payload;
    if (!email || !password) {
        throw createError('Email and password are required', 400, 'MISSING_FIELDS');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (['student', 'faculty', 'admin'].includes(role) && !isValidEmailDomain(normalizedEmail)) {
        throw createError('Only anits.edu.in email addresses are allowed for this role', 403, 'INVALID_DOMAIN');
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.deletedAt) {
        throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (role && user.role !== role) {
        throw createError('Role mismatch for this account', 403, 'ROLE_MISMATCH');
    }

    if (user.status !== 'active') {
        throw createError('Account is not active', 403, 'INACTIVE_ACCOUNT');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
        await User.updateOne({ _id: user._id }, { $push: { loginHistory: { success: false, ip: req.ip, userAgent: req.headers['user-agent'], deviceFingerprint } } });
        throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const activeSessionCount = await Session.countDocuments({ userId: user._id, revokedAt: null, expiresAt: { $gt: new Date() } });
    const session = await Session.create({
        userId: user._id,
        refreshTokenHash: 'pending',
        accessTokenId: crypto.randomUUID(),
        deviceFingerprint,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        rememberMe: Boolean(rememberMe),
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
    });

    const { accessToken, refreshToken, accessTokenId } = tokenPair(user, session._id);
    session.accessTokenId = accessTokenId;
    session.refreshTokenHash = hashToken(refreshToken);
    session.expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    await session.save();

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    user.loginHistory.push({ ip: req.ip, userAgent: req.headers['user-agent'], deviceFingerprint, success: true });
    user.sessionVersion += 1;
    await user.save();

    await recordAudit({ actor: user, action: 'login', entityType: 'session', entityId: session._id, status: 'success', details: { activeSessionCount: activeSessionCount + 1 }, req });

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        session: { id: session._id, activeSessionCount: activeSessionCount + 1 }
    };
}

async function refreshSession({ refreshToken }, req) {
    if (!refreshToken) {
        throw createError('Refresh token required', 401, 'MISSING_REFRESH_TOKEN');
    }

    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const session = await Session.findOne({ _id: payload.sid, revokedAt: null });
    if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
        throw createError('Session is invalid or expired', 401, 'INVALID_SESSION');
    }

    const user = await User.findById(payload.sub);
    if (!user || user.status !== 'active') {
        throw createError('Account is not active', 403, 'INACTIVE_ACCOUNT');
    }

    const { accessToken, refreshToken: nextRefreshToken, accessTokenId } = tokenPair(user, session._id);
    session.accessTokenId = accessTokenId;
    session.refreshTokenHash = hashToken(nextRefreshToken);
    session.expiresAt = new Date(Date.now() + (session.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    await session.save();

    await recordAudit({ actor: user, action: 'refresh', entityType: 'session', entityId: session._id, status: 'success', req });
    return { user: sanitizeUser(user), accessToken, refreshToken: nextRefreshToken };
}

async function logoutSession({ sessionId, req, user }) {
    if (!sessionId) {
        return;
    }
    await Session.updateOne({ _id: sessionId }, { $set: { revokedAt: new Date() } });
    await recordAudit({ actor: user, action: 'logout', entityType: 'session', entityId: sessionId, status: 'success', req });
}

async function requestOtp({ email }, req) {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
        throw createError('If the account exists, an OTP has been generated', 200, 'OTP_REQUESTED');
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await pushNotification({ recipientUserId: user._id, recipientRole: user.role, type: 'otp', title: 'Login OTP', message: 'Your one-time password is ready.', metadata: { otp } });
    await recordAudit({ actor: user, action: 'otp_request', entityType: 'user', entityId: user._id, status: 'success', req });
    return { message: 'OTP generated', otp };
}

async function verifyOtp({ email, otp }, req) {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !user.otpHash || !user.otpExpiresAt) {
        throw createError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
        throw createError('Invalid or expired OTP', 400, 'EXPIRED_OTP');
    }
    const otpValid = await bcrypt.compare(String(otp), user.otpHash);
    if (!otpValid) {
        throw createError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.emailVerified = true;
    await user.save();
    await recordAudit({ actor: user, action: 'otp_verify', entityType: 'user', entityId: user._id, status: 'success', req });
    return { user: sanitizeUser(user) };
}

async function requestPasswordReset({ email }, req) {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
        return { message: 'If the account exists, reset instructions were sent' };
    }

    const token = crypto.randomBytes(24).toString('hex');
    user.forgotPasswordTokenHash = hashToken(token);
    user.forgotPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    await recordAudit({ actor: user, action: 'password_reset_requested', entityType: 'user', entityId: user._id, status: 'success', req });
    return { message: 'Reset token generated', token };
}

async function resetPassword({ token, password }, req) {
    assertStrongPassword(password);
    const tokenHash = hashToken(token);
    const user = await User.findOne({ forgotPasswordTokenHash: tokenHash });
    if (!user || !user.forgotPasswordExpiresAt || user.forgotPasswordExpiresAt.getTime() < Date.now()) {
        throw createError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    user.forgotPasswordTokenHash = undefined;
    user.forgotPasswordExpiresAt = undefined;
    user.sessionVersion += 1;
    await user.save();
    await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    await recordAudit({ actor: user, action: 'password_reset', entityType: 'user', entityId: user._id, status: 'success', req });
    return { message: 'Password updated' };
}

async function verifyEmail({ token }, req) {
    const tokenHash = hashToken(token);
    const user = await User.findOne({ emailVerificationTokenHash: tokenHash });
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
        throw createError('Invalid or expired email verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    await recordAudit({ actor: user, action: 'email_verified', entityType: 'user', entityId: user._id, status: 'success', req });
    return { user: sanitizeUser(user) };
}

async function getMe(userId) {
    const user = await User.findById(userId).lean();
    return sanitizeUser(user);
}

async function updateProfile(userId, payload, req) {
    const ALLOWED_TOP = ['name', 'headline', 'bio', 'phone', 'fatherName', 'motherName', 'socialMedia'];
    const user = await User.findById(userId);
    if (!user) throw createError('User not found', 404, 'NOT_FOUND');

    // Apply allowed top-level fields
    for (const field of ALLOWED_TOP) {
        if (payload[field] !== undefined) {
            user[field] = payload[field];
        }
    }

    // Handle studentProfile fields (classTeacherEmail, classTeacherCode)
    if (payload.studentProfile && user.role === 'student') {
        if (!user.studentProfile) user.studentProfile = {};
        const allowedStudentFields = ['classTeacherEmail', 'classTeacherCode'];
        for (const f of allowedStudentFields) {
            if (payload.studentProfile[f] !== undefined) {
                user.studentProfile[f] = payload.studentProfile[f];
            }
        }
    }

    // Handle facultyProfile fields (teacherCode, experience, specialization)
    if (payload.facultyProfile && user.role === 'faculty') {
        if (!user.facultyProfile) user.facultyProfile = {};
        const allowedFacultyFields = ['experience', 'specialization', 'designation', 'department'];
        for (const f of allowedFacultyFields) {
            if (payload.facultyProfile[f] !== undefined) {
                user.facultyProfile[f] = payload.facultyProfile[f];
            }
        }
    }

    // Also update top-level designation/department for faculty
    if (user.role === 'faculty') {
        if (payload.designation) user.designation = payload.designation;
        if (payload.department) user.department = payload.department;
        if (payload.experience !== undefined) user.experience = payload.experience;
    }

    await user.save();
    await recordAudit({ actor: user, action: 'profile_updated', entityType: 'user', entityId: user._id, status: 'success', req });
    return sanitizeUser(user.toObject ? user.toObject() : user);
}

async function getPortfolio(userId) {
    const user = await User.findById(userId).lean();
    if (!user || user.status !== 'active') {
        throw createError('User not found or inactive', 404, 'NOT_FOUND');
    }

    const query = { ownerUserId: userId, deletedAt: null, verificationStatus: 'verified' };
    const achievements = await Achievement.find(query).sort({ date: -1 }).lean();

    const sanitized = sanitizeUser(user);
    // Include specific public fields
    return {
        profile: {
            id: sanitized.id,
            name: sanitized.name,
            headline: sanitized.headline,
            bio: sanitized.bio,
            course: sanitized.course,
            year: sanitized.year,
            college: sanitized.institution,
            cgpa: sanitized.cgpa,
            skills: sanitized.skills || [],
            socialMedia: sanitized.socialMedia,
            profileImage: sanitized.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitized.name)}&background=1f4e79&color=fff&size=150&bold=true`
        },
        items: achievements.map(ach => ({
            id: ach._id,
            title: ach.title,
            description: ach.description,
            category: ach.category,
            date: ach.date,
            proofUrl: ach.proofUrl
        }))
    };
}

async function listSessions(userId) {
    return Session.find({ userId }).sort({ createdAt: -1 }).lean();
}

async function listUsers({ role, status, search, academicYear, certName, certStart, certEnd, page = 1, limit = 25 } = {}) {
    const query = { deletedAt: null };
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { institution: { $regex: search, $options: 'i' } }
        ];
    }
    if (academicYear) {
        query['studentProfile.academicYear'] = academicYear;
    }

    if (certName || certStart || certEnd) {
        const achQuery = { category: 'certification', status: 'approved' };
        if (certName) {
            achQuery.title = { $regex: certName, $options: 'i' };
        }
        if (certStart || certEnd) {
            achQuery.startDate = {};
            if (certStart) achQuery.startDate.$gte = new Date(certStart);
            if (certEnd) achQuery.startDate.$lte = new Date(certEnd);
        }
        
        const matchingAchievements = await Achievement.find(achQuery).select('ownerUserId').lean();
        const matchingUserIds = matchingAchievements.map(ach => ach.ownerUserId);
        
        if (query._id) {
            query._id = { $in: matchingUserIds.filter(id => query._id.$in.some(existingId => existingId.equals(id))) };
        } else {
            query._id = { $in: matchingUserIds };
        }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        User.countDocuments(query)
    ]);
    return { items: items.map(sanitizeUser), total, page: Number(page), limit: Number(limit) };
}

async function createAchievement(payload, actor, req) {
    const mandatory = ['category', 'title', 'description'];
    const missing = mandatory.filter(key => !payload[key]);
    if (missing.length) {
        throw createError(`Missing required fields: ${missing.join(', ')}`, 400, 'MISSING_FIELDS');
    }

    if (payload.startDate && isFutureDate(payload.startDate)) {
        throw createError('Start date cannot be in the future', 400, 'INVALID_DATE');
    }

    if (payload.endDate && isFutureDate(payload.endDate) && new Date(payload.endDate).getTime() - Date.now() > 0) {
        throw createError('End date cannot be in the future', 400, 'INVALID_DATE');
    }

    if (payload.certificateId) {
        const duplicateCertificate = await Achievement.findOne({ certificateId: payload.certificateId, softDeletedAt: null });
        if (duplicateCertificate) {
            throw createError('Duplicate certificate ID detected', 409, 'DUPLICATE_CERTIFICATE');
        }
    }

    const duplicateTitle = await Achievement.findOne({
        ownerUserId: payload.ownerUserId,
        title: payload.title,
        category: payload.category,
        academicYear: payload.academicYear,
        semester: payload.semester,
        softDeletedAt: null
    });
    if (duplicateTitle) {
        throw createError('Duplicate achievement submission detected', 409, 'DUPLICATE_ACHIEVEMENT');
    }

    const initialStatus = payload.status || (payload.ownerRole === 'faculty' ? 'institution_verification' : 'pending');

    const achievement = await Achievement.create({
        ...payload,
        status: initialStatus,
        credits: Number(payload.credits || getCategoryCredits(payload.category)),
        createdBy: actor?._id,
        updatedBy: actor?._id,
        history: [{ action: 'submitted', actorId: actor?._id, actorRole: actor?.role, statusFrom: null, statusTo: initialStatus }]
    });

    const owner = await User.findById(payload.ownerUserId);
    const reviewer = await findReviewerForStudent(owner);
    if (reviewer) {
        achievement.facultyAssignedId = reviewer._id;
        await achievement.save();
    }

    await recordAudit({ actor, action: 'submission', entityType: 'achievement', entityId: achievement._id, status: 'success', req, after: achievement });

    await notifyStudentAndReviewer({ student: owner, reviewer, achievement, action: 'submitted', remarks: payload.remarks });
    await notifyInstitutions({ actor, achievement, action: 'submitted', remarks: payload.remarks });
    return achievement;
}

async function reviewAchievement({ achievementId, decision, remarks }, actor, req) {
    const achievement = await Achievement.findById(achievementId);
    if (!achievement || achievement.softDeletedAt) {
        throw createError('Achievement not found', 404, 'NOT_FOUND');
    }

    const student = await User.findById(achievement.ownerUserId);
    const reviewer = await User.findById(actor._id);

    if (String(achievement.ownerUserId) === String(actor._id)) {
        throw createError('You cannot approve your own submission', 403, 'SELF_APPROVAL');
    }

    if (actor.role === 'faculty') {
        const teacherCode = reviewer?.facultyProfile?.teacherCode;
        const studentTeacherCode = student?.studentProfile?.classTeacherCode;
        const studentTeacherEmail = student?.studentProfile?.classTeacherEmail?.toLowerCase();
        const reviewerEmail = reviewer?.email?.toLowerCase();
        const isAssignedTeacher = teacherCode && studentTeacherCode && teacherCode === studentTeacherCode;
        const isAssignedEmail = reviewerEmail && studentTeacherEmail && reviewerEmail === studentTeacherEmail;
        if (!isAssignedTeacher && !isAssignedEmail) {
            throw createError('Only the assigned class teacher can review this submission', 403, 'UNAUTHORIZED_REVIEW');
        }
    }

    if (actor.role === 'institution' && achievement.status !== 'institution_verification') {
        throw createError('This achievement is not ready for college verification', 409, 'INVALID_WORKFLOW_STAGE');
    }

    const alreadyFinal = ['approved', 'rejected'].includes(achievement.status);
    if (alreadyFinal && decision !== 'request-correction') {
        throw createError('This record has already reached a final state', 409, 'DOUBLE_DECISION');
    }

    const statusMap = {
        approve: actor.role === 'faculty' ? 'institution_verification' : 'approved',
        reject: 'rejected',
        'request-correction': 'correction_requested'
    };

    const nextStatus = statusMap[decision];
    if (!nextStatus) {
        throw createError('Invalid decision', 400, 'INVALID_DECISION');
    }

    const previousStatus = achievement.status;
    achievement.status = nextStatus;
    achievement.reviewerRemarks = remarks;
    achievement.reviewedBy = actor._id;
    achievement.reviewedByRole = actor.role;
    achievement.updatedBy = actor._id;
    achievement.history.push({
        action: decision,
        actorId: actor._id,
        actorRole: actor.role,
        remarks,
        statusFrom: previousStatus,
        statusTo: nextStatus
    });
    await achievement.save();

    if (nextStatus === 'approved') {
        const reward = Number(achievement.credits || getCategoryCredits(achievement.category));
        const ownerUser = await User.findById(achievement.ownerUserId);
        if (ownerUser?.studentProfile) {
            ownerUser.studentProfile.credits = Number(ownerUser.studentProfile.credits || 0) + reward;
            await ownerUser.save();
        }
    }

    await pushNotification({
        recipientUserId: achievement.ownerUserId,
        recipientRole: achievement.ownerRole,
        type: 'approval-workflow',
        title: `Achievement ${nextStatus.replace('_', ' ')}`,
        message: remarks || 'Your achievement status has been updated.',
        metadata: { achievementId: achievement._id, status: nextStatus, reviewerRole: actor.role }
    });

    if (student && reviewer) {
        await notifyStudentAndReviewer({ student, reviewer, achievement, action: nextStatus, remarks });
    }

    await notifyInstitutions({ actor, achievement, action: nextStatus, remarks });

    await recordAudit({ actor, action: `achievement_${decision}`, entityType: 'achievement', entityId: achievement._id, status: 'success', before: { status: previousStatus }, after: { status: nextStatus, remarks }, req });
    return achievement;
}

async function listAchievements({ ownerUserId, ownerRole, status, category, search, page = 1, limit = 25 } = {}) {
    const query = { softDeletedAt: null };
    if (ownerUserId) query.ownerUserId = ownerUserId;
    if (ownerRole) query.ownerRole = ownerRole;
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { certificateId: { $regex: search, $options: 'i' } }
        ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
        Achievement.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('ownerUserId', 'name email role institution department profileImage').lean(),
        Achievement.countDocuments(query)
    ]);
    return { items, total, page: Number(page), limit: Number(limit) };
}

async function buildReports() {
    const [byStatus, byCategory, byRole, byDepartment, recentCounts] = await Promise.all([
        Achievement.aggregate([{ $match: { softDeletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Achievement.aggregate([{ $match: { softDeletedAt: null } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
        Achievement.aggregate([{ $match: { softDeletedAt: null } }, { $group: { _id: '$ownerRole', count: { $sum: 1 } } }]),
        Achievement.aggregate([{ $match: { softDeletedAt: null } }, { $group: { _id: '$department', count: { $sum: 1 } } }]),
        Achievement.aggregate([
            { $match: { softDeletedAt: null } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ])
    ]);

    return { byStatus, byCategory, byRole, byDepartment, recentCounts };
}

async function bootstrapData() {
    const [students, faculty, institutions, companies, achievements, departments] = await Promise.all([
        User.find({ role: 'student', deletedAt: null }).lean(),
        User.find({ role: 'faculty', deletedAt: null }).lean(),
        User.find({ role: 'institution', deletedAt: null }).lean(),
        User.find({ role: 'company', deletedAt: null }).lean(),
        Achievement.find({ softDeletedAt: null }).sort({ createdAt: -1 }).lean(),
        Department.find({ deletedAt: null }).lean()
    ]);

    function toFrontendStudent(user) {
        return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            college: user.institution,
            course: user.studentProfile?.course || '',
            year: user.studentProfile?.year || '',
            cgpa: user.studentProfile?.cgpa || 0,
            skills: user.skills || [],
            achievements: [],
            certificates: [],
            internships: [],
            profileImage: user.profileImage,
            headline: user.headline || 'Student Profile',
            bio: user.bio || '',
            credits: user.studentProfile?.credits || 0,
            fatherName: user.studentProfile?.fatherName || '',
            motherName: user.studentProfile?.motherName || '',
            phone: user.studentProfile?.phone || '',
            socialMedia: user.studentProfile?.socialMedia || { linkedin: '', github: '', portfolio: '' },
            department: user.department,
            semester: user.studentProfile?.semester,
            academicYear: user.studentProfile?.academicYear
        };
    }

    function toFrontendFaculty(user) {
        return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            college: user.institution,
            department: user.department,
            designation: user.designation,
            experience: user.facultyProfile?.experience || '',
            articles: user.articles || [],
            profileImage: user.profileImage
        };
    }

    function toFrontendInstitution(user) {
        return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            fullName: user.institution,
            location: user.companyProfile?.location || '',
            courses: user.courses || [],
            events: user.events || []
        };
    }

    function toFrontendCompany(user) {
        return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            industry: user.companyProfile?.industry || '',
            avatar: user.profileImage,
            companyData: {
                name: user.name,
                industry: user.companyProfile?.industry || '',
                size: user.companyProfile?.size || '',
                phone: user.companyProfile?.phone || '',
                website: user.companyProfile?.website || '',
                address: user.companyProfile?.location || '',
                hrContact: user.companyProfile?.hrContact || '',
                description: user.companyProfile?.description || ''
            },
            opportunities: user.opportunities || []
        };
    }

    return {
        students: students.map(toFrontendStudent),
        faculty: faculty.map(toFrontendFaculty),
        colleges: institutions.map(toFrontendInstitution),
        companies: companies.map(toFrontendCompany),
        achievements,
        departments
    };
}

async function uploadDocument(file) {
    if (!file) {
        throw createError('No file uploaded', 400, 'NO_FILE');
    }

    const allowedMimeTypes = new Set([
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
        throw createError('Invalid file type', 400, 'INVALID_FILE_TYPE');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw createError('File size exceeds 10 MB', 400, 'FILE_TOO_LARGE');
    }

    return {
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path
    };
}

async function softDeleteAchievement(achievementId, actor, req) {
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
        throw createError('Achievement not found', 404, 'NOT_FOUND');
    }

    if (achievement.status === 'approved') {
        const owner = await User.findById(achievement.ownerUserId);
        if (owner?.studentProfile) {
            owner.studentProfile.credits = Math.max(0, Number(owner.studentProfile.credits || 0) - Number(achievement.credits || 0));
            await owner.save();
        }
    }

    achievement.softDeletedAt = new Date();
    achievement.updatedBy = actor?._id;
    achievement.history.push({ action: 'delete', actorId: actor?._id, actorRole: actor?.role, statusFrom: achievement.status, statusTo: achievement.status });
    await achievement.save();
    await recordAudit({ actor, action: 'deletion', entityType: 'achievement', entityId: achievement._id, status: 'success', req });
    return achievement;
}

async function listNotifications(userId, role) {
    return Notification.find({ $or: [{ recipientUserId: userId }, { recipientRole: role }] }).sort({ createdAt: -1 }).lean();
}

async function getReviewQueue(user) {
    if (user.role === 'faculty') {
        const teacherCode = user.facultyProfile?.teacherCode;
        const teacherEmail = user.email?.toLowerCase();
        const students = await User.find({
            role: 'student',
            deletedAt: null,
            $or: [
                { 'studentProfile.classTeacherCode': teacherCode },
                { 'studentProfile.classTeacherEmail': teacherEmail }
            ]
        }).lean();
        const studentIds = students.map(student => student._id);
        return Achievement.find({ ownerUserId: { $in: studentIds }, softDeletedAt: null, status: { $in: ['pending', 'correction_requested'] } })
            .populate('ownerUserId', 'name email studentProfile department profileImage')
            .sort({ createdAt: -1 })
            .lean();
    }

    if (user.role === 'institution') {
        return Achievement.find({ softDeletedAt: null, status: 'institution_verification' })
            .populate('ownerUserId', 'name email studentProfile department profileImage')
            .sort({ createdAt: -1 })
            .lean();
    }

    return [];
}

async function listAuditLogs({ role, limit = 50 } = {}) {
    const query = {};
    if (role) query.actorRole = role;
    return AuditLog.find(query).sort({ createdAt: -1 }).limit(Number(limit)).lean();
}

async function markNotificationRead(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, $or: [{ recipientUserId: userId }, { recipientRole: { $exists: true } }] });
    if (!notification) {
        throw createError('Notification not found', 404, 'NOT_FOUND');
    }
    notification.readAt = new Date();
    await notification.save();
    return notification;
}

async function getDepartmentStats(institution) {
    const studentsAggregation = await User.aggregate([
        { $match: { institution, role: 'student', deletedAt: null } },
        { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);
    const facultyAggregation = await User.aggregate([
        { $match: { institution, role: 'faculty', deletedAt: null } },
        { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);

    const stats = {};
    studentsAggregation.forEach(item => {
        const dept = item._id || 'Unassigned';
        if (!stats[dept]) stats[dept] = { students: 0, faculty: 0 };
        stats[dept].students = item.count;
    });
    facultyAggregation.forEach(item => {
        const dept = item._id || 'Unassigned';
        if (!stats[dept]) stats[dept] = { students: 0, faculty: 0 };
        stats[dept].faculty = item.count;
    });

    return {
        departmentsCount: Object.keys(stats).length,
        stats
    };
}

async function generateNaacReport(institution) {
    // ── 1. Students ────────────────────────────────────────────────
    const students = await User.find({ role: 'student', deletedAt: null }).lean();
    const totalStudents = students.length || 1;

    // Excellence – CGPA >= 8.5
    const excellentCount = students.filter(s => (s.studentProfile?.cgpa || 0) >= 8.5).length;
    const excellencePercentage = ((excellentCount / totalStudents) * 100).toFixed(2);

    // Average CGPA
    const cgpaSum = students.reduce((acc, s) => acc + parseFloat(s.studentProfile?.cgpa || 0), 0);
    const avgCGPA = (cgpaSum / totalStudents).toFixed(2);

    // Dept breakdown
    const studentsByDept = {};
    students.forEach(s => {
        const dept = s.department || 'Unassigned';
        studentsByDept[dept] = (studentsByDept[dept] || 0) + 1;
    });

    // ── 2. Faculty ─────────────────────────────────────────────────
    const faculty = await User.find({ role: 'faculty', deletedAt: null }).lean();
    const totalFaculty = faculty.length || 1;

    const expSum = faculty.reduce((acc, f) => acc + (parseInt(f.experience || f.facultyProfile?.experience) || 0), 0);
    const avgExperience = (expSum / totalFaculty).toFixed(1);

    const facultyByDept = {};
    faculty.forEach(f => {
        const dept = f.department || 'Unassigned';
        facultyByDept[dept] = (facultyByDept[dept] || 0) + 1;
    });

    const phDCount = faculty.filter(f => f.name.startsWith('Dr.') || (f.qualification || '').toLowerCase().includes('phd')).length;
    const phDPercentage = ((phDCount / totalFaculty) * 100).toFixed(1);

    // ── 3. Achievements ────────────────────────────────────────────
    const studentIds = students.map(s => s._id);
    const facultyIds = faculty.map(f => f._id);

    const allStudentAch = await Achievement.find({ ownerUserId: { $in: studentIds }, deletedAt: null }).lean();
    const allFacultyAch = await Achievement.find({ ownerUserId: { $in: facultyIds }, deletedAt: null }).lean();

    const totalAch = allStudentAch.length || 1;
    const verifiedAch = allStudentAch.filter(a => a.verificationStatus === 'verified' || a.status === 'approved').length;
    const verificationRate = ((verifiedAch / totalAch) * 100).toFixed(2);

    const studentsWithAch = new Set(allStudentAch.map(a => a.ownerUserId.toString())).size;
    const participationPercentage = ((studentsWithAch / totalStudents) * 100).toFixed(2);

    // Certifications
    const certifications = allStudentAch.filter(a => a.category === 'certification');
    const certRate = ((certifications.length / totalAch) * 100).toFixed(2);

    // Achievement categories breakdown
    const categoryMap = {};
    allStudentAch.forEach(a => {
        const cat = a.category || 'other';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    // ── 4. Faculty Research / Publications ─────────────────────────
    const publications = allFacultyAch.filter(a => a.category === 'publication');
    const facultyWithPubs = new Set(publications.map(a => a.ownerUserId.toString())).size;
    const facultyArticlesPercentage = ((facultyWithPubs / totalFaculty) * 100).toFixed(2);
    const totalArticles = publications.length;

    // ── 5. Positive Insights ───────────────────────────────────────
    const insights = [];
    if (parseFloat(excellencePercentage) > 30) insights.push(`High Academic Excellence: ${excellencePercentage}% of students maintain CGPA ≥ 8.5 (benchmark: 30%).`);
    if (parseFloat(participationPercentage) > 50) insights.push(`Strong Student Engagement: ${participationPercentage}% participation in extracurricular activities (benchmark: 50%).`);
    if (parseFloat(verificationRate) > 70) insights.push(`Robust Validation Pipeline: ${verificationRate}% of student claims have been faculty-verified.`);
    if (parseFloat(facultyArticlesPercentage) > 40) insights.push(`Active Research Output: ${facultyArticlesPercentage}% of faculty have published research articles.`);
    if (parseFloat(avgCGPA) > 7.5) insights.push(`Healthy Average CGPA: Institutional average CGPA is ${avgCGPA}/10, above the 7.5 benchmark.`);
    if (parseFloat(phDPercentage) > 30) insights.push(`Qualified Faculty: ${phDPercentage}% of faculty hold doctoral qualifications (Ph.D.).`);
    if (insights.length === 0) insights.push('Institutional data collected. Areas of improvement identified for NAAC preparation.');

    return {
        // Key metrics
        excellencePercentage,
        participationPercentage,
        verificationRate,
        certificationRate: certRate,
        facultyArticlesPercentage,
        avgCGPA,
        avgExperience,
        phDPercentage,
        // Counts
        totalStudents,
        totalFaculty,
        totalAchievements: allStudentAch.length,
        verifiedAchievements: verifiedAch,
        totalCertifications: certifications.length,
        totalPublications: totalArticles,
        // Breakdowns
        studentsByDept,
        facultyByDept,
        categoryBreakdown: categoryMap,
        // Narrative
        insights,
        generatedAt: new Date(),
        institution: institution || 'Institution'
    };
}

module.exports = {
    sanitizeUser,
    tokenPair,
    createError,
    registerUser,
    loginUser,
    refreshSession,
    logoutSession,
    requestOtp,
    verifyOtp,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    getMe,
    updateProfile,
    getPortfolio,
    listSessions,
    listUsers,
    createAchievement,
    reviewAchievement,
    listAchievements,
    buildReports,
    bootstrapData,
    uploadDocument,
    softDeleteAchievement,
    listNotifications,
    markNotificationRead,
    getReviewQueue,
    listAuditLogs,
    recordAudit,
    pushNotification,
    getDepartmentStats,
    generateNaacReport
};