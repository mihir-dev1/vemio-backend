const express = require('express');
const router = express.Router();
exports.router = router;
const AuthController = require('../Controllers/Auth.Controller');

router.post('/register',AuthController.register);

router.post('/login', AuthController.login);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/logout', AuthController.logout);

module.exports = router