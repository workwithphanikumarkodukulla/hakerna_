const dotenv = require('dotenv');

dotenv.config();

const config = {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_student_hub',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: Number(process.env.SMTP_PORT || 587),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'Smart Student Hub <no-reply@smartstudenthub.local>'
    },
    email: {
        service: process.env.EMAIL_SERVICE || '',
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
        testEmail: process.env.TEST_EMAIL || '',
        testPhone: process.env.TEST_PHONE || ''
    },
    push: {
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || ''
    },
    oauth: {
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    },
    appOrigin: process.env.APP_ORIGIN || '*'
};

module.exports = config;