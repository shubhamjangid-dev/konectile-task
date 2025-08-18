const BiometricAuth = require('../models/biometricAuth');
const { getDeviceInfo } = require('../utils/deviceInfo');
const crypto = require('crypto');

exports.requireBiometricAuth = async (req, res, next) => {
  try {
    // Skip biometric check for super admin
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Get device information
    const deviceInfo = getDeviceInfo(req.headers['user-agent']);
    const deviceId = crypto
      .createHash('sha256')
      .update(deviceInfo.device + deviceInfo.os + deviceInfo.browser)
      .digest('hex');

    // Check if user has registered biometrics for this device
    const biometrics = await BiometricAuth.find({
      userId: req.user._id,
      'deviceInfo.deviceId': deviceId,
      isActive: true
    });

    if (biometrics.length === 0) {
      return next(); // No biometrics registered, proceed with normal authentication
    }

    // Check if biometric verification is provided in the request
    const { biometricType, biometricData } = req.body;

    if (!biometricType || !biometricData) {
      return res.status(403).json({
        success: false,
        message: 'Biometric authentication required',
        requireBiometric: true,
        registeredTypes: biometrics.map(b => b.biometricType)
      });
    }

    // Find matching biometric
    const biometric = biometrics.find(b => b.biometricType === biometricType);

    if (!biometric) {
      return res.status(400).json({
        success: false,
        message: 'Invalid biometric type'
      });
    }

    // Verify biometric data (in a real implementation, you would use proper biometric matching)
    const isMatch = biometricData === biometric.biometricData;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Biometric verification failed'
      });
    }

    // Update last used timestamp
    biometric.lastUsed = new Date();
    await biometric.save();

    next();
  } catch (error) {
    console.error('Biometric auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in biometric authentication'
    });
  }
}; 