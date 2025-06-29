const express = require('express');
const morgan  = require('morgan');
const createError = require('http-errors');
require('dotenv').config();
require('./helpers/init_mongodb');
const { verifyAccessToken } = require('./helpers/jwt_helper')
const AuthRoute = require('./Routes/Auth.route');
require('./helpers/init_redis');


const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', AuthRoute);

app.get('/', verifyAccessToken, async(req,res,next) => {
    res.send('Hello World');
})

const PORT = process.env.PORT || 3000;
app.use(async (req,res,next) => {
    // const error = new Error('Not Found');
    // error.status = 400;  
    // next(error);
    next(createError.NotFound())
});

app.use((err,req,res,next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
})

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
})