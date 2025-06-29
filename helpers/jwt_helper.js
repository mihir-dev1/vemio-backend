const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("../helpers/init_redis"); // Assuming you have a Redis client initialized

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {
        user_id: userId,
      };

      const secret = process.env.ACCESS_TOKEN_SECRET || "your_secret_key"; // Replace in .env for security

      const options = {
        expiresIn: "10h", // human-readable
        issuer: "yourapp.com",
        audience: userId,
      };

      JWT.sign(payload, secret, options, (error, token) => {
        if (error) {
          reject(createError.InternalServerError());
        } else {
          client.set(`access_token:${userId}`, token, "EX", 36000, (err) => {
            if (err) {
              console.error("Error storing token in Redis:", err);
              return reject(createError.InternalServerError());
            }
            resolve(token);
          });
        }
      });
    });
  },
  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) {
      return next(createError.Unauthorized());
    }
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    JWT.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || "your_secret_key",
      (error, payload) => {
        if (error) {
          // if(error.name === 'JsonWebTokenError') {
          //   return next(createError.Unauthorized());
          // } else {
          //   return next(createError.Unauthorized(error.message));
          // }
          const message =
            error.name === "JsonWebTokenError" ? "Unauthorized" : error.message;
          return next(createError.Unauthorized(message));
        }
        client.get(`access_token:${payload.user_id}`, (err, result) => {
          if (err) {
            console.error("Error retrieving token from Redis:", err);
            return next(createError.InternalServerError());
          }
          if (result !== token) {
            return next(createError.Unauthorized());
          }
          req.payload = payload;
          next();
          console.log(`Access token verified for user ${payload.user_id}`);
        });
        // If the token is valid, attach the payload to the request object
        // so that it can be used in subsequent middleware or route handlers
      }
    );
  },
  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {
        user_id: userId,
      };

      const secret = process.env.REFRESH_TOKEN_SECRET || "your_secret_key"; // Replace in .env for security

      const options = {
        expiresIn: "1y", // human-readable
        issuer: "yourapp.com",
        audience: userId,
      };

      JWT.sign(payload, secret, options, (error, token) => {
        if (error) {
          reject(createError.InternalServerError());
        } else {
          // Store the refresh token in Redis with a longer expiration time
          client.set(
            `refresh_token:${userId}`,
            token,
            "EX",
            31536000,
            (err) => {
              // 1 year in seconds
              if (err) {
                console.error("Error storing refresh token in Redis:", err);
                return reject(createError.InternalServerError());
              } else {
                resolve(token);
              }
            }
          );
        }
      });
    });
  },
  verifyRefreshToken: (token) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET || "your_secret_key",
        (error, payload) => {
          if (error) {
            reject(createError.Unauthorized());
          } else {
            // Check if the refresh token exists in Redis
            client.get(`refresh_token:${payload.user_id}`, (err, result) => {
              if (err) {
                console.error(
                  "Error retrieving refresh token from Redis:",
                  err
                );
                return reject(createError.InternalServerError());
              } else if (result === token) {
                console.log(
                  `Refresh token verified for user ${payload.user_id}`
                );
                // If the token is valid, resolve with the user ID
                return resolve(payload.user_id);
              } else {
                return reject(createError.Unauthorized());
              }
            });
          }
        }
      );
    });
  },
};
