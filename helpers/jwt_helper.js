const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("../helpers/init_redis");

// Token constants
const ACCESS_TOKEN_EXPIRES_IN = 36000; // 10 hours in seconds
const REFRESH_TOKEN_EXPIRES_IN = 31536000; // 1 year in seconds
const ISSUER = "yourapp.com";

// Helper to get secrets safely
const getSecret = (keyName, defaultVal) => {
  const secret = process.env[keyName];
  if (!secret && !defaultVal) {
    throw new Error(`${keyName} is not defined in environment variables`);
  }
  return secret || defaultVal;
};

// Store token in Redis
const storeToken = (key, token, expiry) => {
  return new Promise((resolve, reject) => {
    client.set(key, token, "EX", expiry, (err) => {
      if (err) {
        console.error(`Redis Error [SET ${key}]:`, err);
        return reject(createError.InternalServerError("Token storage failed"));
      }
      resolve(token);
    });
  });
};

// Retrieve token from Redis
const getTokenFromRedis = (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, token) => {
      if (err) {
        console.error(`Redis Error [GET ${key}]:`, err);
        return reject(createError.InternalServerError("Redis retrieval failed"));
      }
      resolve(token);
    });
  });
};

module.exports = {
  signAccessToken: async (userId) => {
    const payload = { user_id: userId };
    const options = {
      expiresIn: `${ACCESS_TOKEN_EXPIRES_IN}s`,
      issuer: ISSUER,
      audience: userId,
    };
    const secret = getSecret("ACCESS_TOKEN_SECRET", "your_secret_key");

    return new Promise((resolve, reject) => {
      JWT.sign(payload, secret, options, async (err, token) => {
        if (err) return reject(createError.InternalServerError("Access token signing failed"));
        try {
          await storeToken(`access_token:${userId}`, token, ACCESS_TOKEN_EXPIRES_IN);
          resolve(token);
        } catch (e) {
          reject(e);
        }
      });
    });
  },

  verifyAccessToken: async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return next(createError.Unauthorized("Missing Authorization header"));

    const token = authHeader.split(" ")[1];
    const secret = getSecret("ACCESS_TOKEN_SECRET", "your_secret_key");

    JWT.verify(token, secret, async (err, payload) => {
      if (err) {
        const msg = err.name === "JsonWebTokenError" ? "Invalid Token" : err.message;
        return next(createError.Unauthorized(msg));
      }

      try {
        const storedToken = await getTokenFromRedis(`access_token:${payload.user_id}`);
        if (storedToken !== token) {
          return next(createError.Unauthorized("Token mismatch or expired"));
        }

        req.payload = payload;
        next();
      } catch (e) {
        return next(e);
      }
    });
  },

  signRefreshToken: async (userId) => {
    const payload = { user_id: userId };
    const options = {
      expiresIn: `${REFRESH_TOKEN_EXPIRES_IN}s`,
      issuer: ISSUER,
      audience: userId,
    };
    const secret = getSecret("REFRESH_TOKEN_SECRET", "your_secret_key");

    return new Promise((resolve, reject) => {
      JWT.sign(payload, secret, options, async (err, token) => {
        if (err) return reject(createError.InternalServerError("Refresh token signing failed"));
        try {
          await storeToken(`refresh_token:${userId}`, token, REFRESH_TOKEN_EXPIRES_IN);
          resolve(token);
        } catch (e) {
          reject(e);
        }
      });
    });
  },

  verifyRefreshToken: async (token) => {
    const secret = getSecret("REFRESH_TOKEN_SECRET", "your_secret_key");

    return new Promise((resolve, reject) => {
      JWT.verify(token, secret, async (err, payload) => {
        if (err) return reject(createError.Unauthorized("Invalid refresh token"));

        try {
          const storedToken = await getTokenFromRedis(`refresh_token:${payload.user_id}`);
          if (storedToken !== token) {
            return reject(createError.Unauthorized("Token mismatch or expired"));
          }

          resolve(payload.user_id);
        } catch (e) {
          reject(e);
        }
      });
    });
  },
};
