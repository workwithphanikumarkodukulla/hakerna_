const jwt = require('jsonwebtoken');
const config = require('./config');
const { Session, User } = require('./models');

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ message, code: err.code || 'SERVER_ERROR' });
}

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return req.cookies?.accessToken || null;
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, config.jwtAccessSecret);
    const session = await Session.findOne({ accessTokenId: payload.jti, revokedAt: null }).lean();
    if (!session) {
      return res.status(401).json({ message: 'Session expired or revoked' });
    }

    const user = await User.findById(payload.sub).lean();
    if (!user || user.status === 'deleted' || user.status === 'inactive') {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

function authorize(...roles) {
  return function authorizationMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to perform this action' });
    }
    next();
  };
}

function validateFields(fields) {
  return function fieldValidator(req, res, next) {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || String(value).trim() === '';
    });
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    next();
  };
}

module.exports = {
  asyncHandler,
  authenticate,
  authorize,
  errorHandler,
  notFound,
  validateFields
};