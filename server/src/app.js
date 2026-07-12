const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const config = require('./config');
const { authenticate, authorize, asyncHandler, errorHandler, notFound, validateFields } = require('./middleware');
const {
    bootstrapData,
    buildReports,
    createAchievement,
    getMe,
    listAchievements,
    listNotifications,
    listSessions,
    listUsers,
    loginUser,
    logoutSession,
    getReviewQueue,
    listAuditLogs,
    markNotificationRead,
    refreshSession,
    getDepartmentStats,
    generateNaacReport,
    registerUser,
    requestOtp,
    requestPasswordReset,
    resetPassword,
    reviewAchievement,
    softDeleteAchievement,
    updateProfile,
    getPortfolio,
    uploadDocument,
    verifyEmail,
    verifyOtp
} = require('./services');

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, path.join(process.cwd(), 'uploads'));
        },
        filename(req, file, cb) {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            cb(null, `${Date.now()}_${safeName}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: config.appOrigin === '*' ? true : config.appOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'smart-student-hub-api', time: new Date().toISOString() });
});

app.get('/api/bootstrap', asyncHandler(async (req, res) => {
    res.json(await bootstrapData());
}));

app.post('/api/auth/register', validateFields(['role', 'name', 'email', 'password']), asyncHandler(async (req, res) => {
    const result = await registerUser(req.body, req);
    res.status(201).json(result);
}));

app.post('/api/auth/login', validateFields(['email', 'password']), asyncHandler(async (req, res) => {
    const result = await loginUser(req.body, req);
    const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.json(result);
}));

app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    const result = await refreshSession({ refreshToken }, req);
    const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.json(result);
}));

app.post('/api/auth/verify-email', asyncHandler(async (req, res) => {
    res.json(await verifyEmail(req.body, req));
}));

app.post('/api/auth/request-otp', asyncHandler(async (req, res) => {
    res.json(await requestOtp(req.body, req));
}));

app.post('/api/auth/verify-otp', asyncHandler(async (req, res) => {
    res.json(await verifyOtp(req.body, req));
}));

app.post('/api/auth/forgot-password', asyncHandler(async (req, res) => {
    res.json(await requestPasswordReset(req.body, req));
}));

app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
    res.json(await resetPassword(req.body, req));
}));

app.post('/api/auth/logout', authenticate, asyncHandler(async (req, res) => {
    await logoutSession({ sessionId: req.session._id, req, user: req.user });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
}));

app.get('/api/auth/me', authenticate, asyncHandler(async (req, res) => {
    res.json(await getMe(req.user._id));
}));

app.patch('/api/auth/me', authenticate, asyncHandler(async (req, res) => {
    res.json(await updateProfile(req.user._id, req.body, req));
}));

app.get('/api/auth/sessions', authenticate, asyncHandler(async (req, res) => {
    res.json(await listSessions(req.user._id));
}));

app.get('/api/users', authenticate, authorize('admin', 'institution'), asyncHandler(async (req, res) => {
    res.json(await listUsers(req.query));
}));

app.post('/api/achievements', authenticate, authorize('student', 'faculty'), asyncHandler(async (req, res) => {
    const result = await createAchievement({ ...req.body, ownerUserId: req.user._id, ownerRole: req.user.role }, req.user, req);
    res.status(201).json(result);
}));

app.get('/api/achievements', authenticate, asyncHandler(async (req, res) => {
    const query = { ...req.query };
    if (req.user.role === 'student' || req.user.role === 'faculty') {
        query.ownerUserId = req.user._id;
    }
    res.json(await listAchievements(query));
}));

app.get('/api/portfolio/:id', asyncHandler(async (req, res) => {
    res.json(await getPortfolio(req.params.id));
}));

app.get('/api/reviews/queue', authenticate, authorize('faculty', 'institution'), asyncHandler(async (req, res) => {
    res.json(await getReviewQueue(req.user));
}));

app.patch('/api/achievements/:id/review', authenticate, authorize('faculty', 'institution', 'admin'), asyncHandler(async (req, res) => {
    res.json(await reviewAchievement({ achievementId: req.params.id, decision: req.body.decision, remarks: req.body.remarks }, req.user, req));
}));

app.delete('/api/achievements/:id', authenticate, authorize('student', 'faculty', 'admin'), asyncHandler(async (req, res) => {
    res.json(await softDeleteAchievement(req.params.id, req.user, req));
}));

app.get('/api/college/department-stats', authenticate, authorize('institution', 'admin'), asyncHandler(async (req, res) => {
    res.json(await getDepartmentStats(req.user.institution));
}));

app.get('/api/reports/:type', authenticate, authorize('student', 'faculty', 'institution', 'admin', 'company'), asyncHandler(async (req, res) => {
    if (req.params.type === 'naac') {
        const data = await generateNaacReport(req.user.institution);
        return res.json({ type: 'naac', data });
    }
    const data = await buildReports();
    res.json({ type: req.params.type, data });
}));

app.get('/api/notifications', authenticate, asyncHandler(async (req, res) => {
    res.json(await listNotifications(req.user._id, req.user.role));
}));

app.patch('/api/notifications/:id/read', authenticate, asyncHandler(async (req, res) => {
    res.json(await markNotificationRead(req.params.id, req.user._id));
}));

app.get('/api/audit-logs', authenticate, authorize('institution', 'admin'), asyncHandler(async (req, res) => {
    res.json(await listAuditLogs({ role: req.query.role, limit: req.query.limit || 50 }));
}));

app.post('/api/uploads', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
    res.status(201).json(await uploadDocument(req.file));
}));

app.post('/api/achievements/:id/upload-proof', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
    const proof = await uploadDocument(req.file);
    res.status(201).json(proof);
}));

app.use(notFound);
app.use(errorHandler);

module.exports = app;