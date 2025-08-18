const mongoose = require('mongoose');
const argon2 = require('argon2');

const passwordResetTokenSchema = new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "MemberProfile",
        required: true
    },
    token:{
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        }
    }
});

//hashing email token/OTP
passwordResetTokenSchema.pre('save', async function(next) {
    // Only hash if token is modified (or new)
    if (!this.isModified("token")) return next();

    try {
        this.token = await argon2.hash(this.token);
        next();
    } catch (error) {
        next(error);
    }
});

// Add a method to check if token is expired
passwordResetTokenSchema.methods.isExpired = function() {
    return Date.now() >= this.expiresAt;
};

const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);

module.exports = PasswordResetToken;