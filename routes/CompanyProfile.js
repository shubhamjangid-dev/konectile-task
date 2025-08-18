const express = require('express');
const upload = require('../multer/upload');
const { isAuth } = require('../middleware/userAuth');
const { createCompanyProfile, fetchCompanyProfile, updateCompanyProfile } = require('../controller/CompanyProfile');

const router = express.Router();

router.post(
    '/create',
    upload.single('LOGO'), 
    isAuth,
    createCompanyProfile
);

router.put(
    '/update',
    upload.single('LOGO'), 
    isAuth,
    updateCompanyProfile
);

router.get(
    '/fetch',
    fetchCompanyProfile
)


module.exports = router

