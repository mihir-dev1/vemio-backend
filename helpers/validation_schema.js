const Joi = require('joi');

const authSchema = Joi.object({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    email: Joi.string().email().required(), // corrected usage of `.email()`
    password: Joi.string().min(2).required(),
    confirmPassword: Joi.any().valid(Joi.ref('password')).required().label('Confirm password')
        .messages({ 'any.only': '{{#label}} does not match' }),
    termsAccepted: Joi.boolean().valid(true).required().messages({
        'any.only': 'You must accept the termsAccepted and conditions'
    })
});

const authLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(2).required()
})

module.exports = {
    authSchema,
    authLoginSchema
};
