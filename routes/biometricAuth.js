const express = require('express');
const router = express.Router();
const biometricAuthController = require('../controller/biometricAuth');
const { UserAndMemberSignIn } = require('../middleware/userAuth');

// All routes require authentication
// router.use(UserAndMemberSignIn);

// Register biometric
router.post('/register', biometricAuthController.registerBiometric);

// Verify biometric
router.post('/verify', biometricAuthController.verifyBiometric);

// Get registered biometrics
router.get('/list', biometricAuthController.getRegisteredBiometrics);

// Delete biometric registration
router.delete('/:biometricId', biometricAuthController.deleteBiometric);

module.exports = router; 