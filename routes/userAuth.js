const express = require('express');
const { signIn, signout, UserAndMemberSignIn, isAuth } = require('../middleware/userAuth');
const { checkPermission } = require('../middleware/CheckPermission');
const { resetPassword, verifyOTP, changePassword } = require('../controller/user');

const router = express.Router()

// user and member login endpoint
router.post('/user-member-login',UserAndMemberSignIn);
   

//  Logout endpoint
router.post('/sign-out', signout);


// check permission
router.post('/permissions',checkPermission);

// get OTP for reset password

router.post('/send-otp', resetPassword);

router.post('/verify-otp', verifyOTP);

router.post('/chnage-password', changePassword);

router.get('/is-auth',isAuth,(req,res)=>{

    const {user} = req;

    res.json({
        user: {
            id: user._id,
            name:user.name,
            email:user.email,
            role: user.roles,
            permissions: user.permissions
        }})
});

module.exports = router