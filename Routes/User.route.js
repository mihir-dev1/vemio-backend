const express = require('express');
const router = express.Router();
const User =  require('../models/User.Model');
exports.router = router;

router.get('/details', async (req,res,next) => {
    try {
        const { user_id } = req.payload;
        const userDetails = await User.findOne({_id: user_id})
        const { email,firstName, lastName } = userDetails;
        res.send({email,firstName, lastName})
    } catch(error) {
        next(error);
    }
})

module.exports = router;