const express = require('express');
const router = express.Router();
exports.router = router;
const createError = require('http-errors');
const User =  require('../models/User.Model');
const { authSchema, authLoginSchema } = require('../helpers/validation_schema');
const { signAccessToken, signRefreshToken, verifyRefreshToken} = require('../helpers/jwt_helper');
const AuthController = require('../Controllers/Auth.Controller');

router.post('/register',AuthController.register);

router.post('/login', AuthController.login);

router.post('/refresh-token', AuthController.refreshToken);

router.delete('/logout', AuthController.logout);

module.exports = router