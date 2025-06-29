const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt'); 

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    termsAccepted: {
        type: Boolean,
        required: true,
    },
    termsAcceptedAt: {
        type: Date, 
        default: Date.now
    }
},
    {
        timestamps: true
    }
);

UserSchema.pre('save', async function(next) {
    try {
        const salt =  await bcrypt.genSalt(10);
        const hasPassword = await bcrypt.hash(this.password,salt);
        this.password = hasPassword;
        next();
        // console.log("Called before saving a user");
    } catch(error) {
        next(error);
    }
});

UserSchema.methods.isValidPassword =  async function(password){
    try {
        return await bcrypt.compare(password,this.password);
    } catch(error) {
        throw(error);
    }
}
// UserSchema.post('save', async function() {
//     try {
//         console.log('Called after saving a user');
//     } catch(error) {
//         next(error)
//     }
// });

const User = mongoose.model('User', UserSchema);
module.exports = User;

