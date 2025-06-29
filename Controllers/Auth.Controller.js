const express = require('express');
const router = express.Router();
exports.router = router;
const createError = require('http-errors');
const User =  require('../models/User.Model');
const { authSchema, authLoginSchema } = require('../helpers/validation_schema');
const { signAccessToken, signRefreshToken, verifyRefreshToken} = require('../helpers/jwt_helper');
const redisClient  = require('../helpers/init_redis');

const register = async (req,res,next) => {
    try {
        const  { firstName, lastName, email, password, termsAccepted} = req.body;
        const result = await authSchema.validateAsync(req.body);
        const doesExist = await User.findOne({email:result.email});
        if (doesExist) {
            throw createError.Conflict(result.email,' Email already exists');
        } else {
            const user = new User({
                firstName,
                lastName,
                email,
                password,
                termsAccepted
            });
            const savedUser = await user.save();
            const accessToken = await signAccessToken(savedUser.id);
            const refreshToken = await signRefreshToken(savedUser.id);

            res.status(201).send({ message: 'User created successfully', savedUser,accessToken, refreshToken });
        }
    } catch(error) {
        if(error.isJoi === true) error.status = 422;
        next(error);
    }
}

const login = async (req,res,next) => {
    try {
        const result = await authLoginSchema.validateAsync(req.body);
        const user = await User.findOne({email:result.email});
        if (!user) throw new Error("User not registered");
        
        const isMatch = await user.isValidPassword(result.password);
        if (!isMatch) throw createError.Unauthorized('Username/password not valid');
        
        const accessToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);
        res.send({accessToken,refreshToken})
    } catch(error) {
        if(error.isJoi === true) return next(createError.BadRequest("Invalid Username & Password"));
        next(error);
    }
}

const refreshToken =  async (req,res,next) => {
    try {
        const { refreshToken} = req.body;
        if (!refreshToken) throw createError.BadRequest('Refresh token not provided');
        const userId = await verifyRefreshToken(refreshToken);
        if (!userId) throw createError.Unauthorized('Invalid refresh token');
        const accessToken = await signAccessToken(userId);
        const refToken = await signRefreshToken(userId);
        res.send({ accessToken, refToken });
    } catch(error) {
        next(error);
    }
}

const logout = async (req,res,next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshToken);
        if (!userId) throw createError.Unauthorized('Invalid refresh token');
        
        // Here you would typically invalidate the refresh token in your database or cache
        // For example, you could delete it from a Redis store or a database collection
        await redisClient.del(`refresh_token:${userId}`);
        await redisClient.del(`access_token:${userId}`);
        console.log(`User ${userId} logged out successfully`);
        // Send a response to the client indicating successful logout     
        res.send({ message: 'Logged out successfully' });
    } catch(error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    refreshToken,
    logout   
}