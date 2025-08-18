const BiometricAuth = require('../models/biometricAuth');
const { getDeviceInfo } = require('../utils/deviceInfo');
const crypto = require('crypto');
const { sendError } = require('../utils/helper');

// Register new biometric data
exports.registerBiometric = async (req, res) => {

  // return console.log(req.body);
  try {
    const { biometricType, biometricData, userId } = req.body;
    const userAgent = req.headers['user-agent'];
    const deviceInfo = getDeviceInfo(userAgent);


    // Validate biometric type
    if (!['fingerprint', 'face'].includes(biometricType)) {
      return sendError(res, 'Invalid biometric type. Must be either "fingerprint" or "face"', 400);
    }

    // Generate device ID
    const deviceId = crypto
      .createHash('sha256')
      .update(deviceInfo.browser + deviceInfo.os + deviceInfo.device)
      .digest('hex');

    // Check if user already has biometrics registered for this device
    const existingBiometric = await BiometricAuth.findOne({
      userId: userId,
      'deviceInfo.deviceId': deviceId,
      isActive: true
    });

    if (existingBiometric) {
      return sendError(res, 'Biometric already registered for this device', 400);
    }
    
    // Create new biometric registration
    const biometric = new BiometricAuth({
      userId: userId,
      biometricType,
      biometricData,
      deviceInfo: {
        ...deviceInfo,
        deviceId
      }
    });

    await biometric.save();

    res.status(201).json({
      success: true,
      message: 'Biometric registered successfully',
      biometric: {
        id: biometric._id,
        type: biometric.biometricType,
        deviceInfo: biometric.deviceInfo
      }
    });
  } catch (error) {
    console.error('Biometric registration error:', error);
    sendError(res, 'Failed to register biometric', 500);
  }
};

// Verify biometric data
exports.verifyBiometric = async (req, res) => {
  try {
    const { biometricType, biometricData } = req.body;
    const userAgent = req.headers['user-agent'];
    const deviceInfo = getDeviceInfo(userAgent);

    // Generate device ID
    const deviceId = crypto
      .createHash('sha256')
      .update(deviceInfo.browser + deviceInfo.os + deviceInfo.device)
      .digest('hex');

    // Find matching biometric record
    const biometric = await BiometricAuth.findOne({
      userId: userId,
      biometricType,
      'deviceInfo.deviceId': deviceId,
      isActive: true
    });

    if (!biometric) {
      return sendError(res, 'No biometric found for this device', 404);
    }

    // In a real application, you would verify the biometric data here
    // For testing purposes, we'll just check if the data matches
    if (biometric.biometricData !== biometricData) {
      return sendError(res, 'Biometric verification failed', 401);
    }

    // Update last used timestamp
    biometric.lastUsed = new Date();
    await biometric.save();

    res.json({
      success: true,
      message: 'Biometric verified successfully'
    });
  } catch (error) {
    console.error('Biometric verification error:', error);
    sendError(res, 'Failed to verify biometric', 500);
  }
};

// Get all registered biometrics for the user
exports.getRegisteredBiometrics = async (req, res) => {
  try {
    const biometrics = await BiometricAuth.find({
      userId: userId,
      isActive: true
    }).select('-biometricData'); // Don't send sensitive data

    res.json({
      success: true,
      biometrics: biometrics.map(bio => ({
        id: bio._id,
        type: bio.biometricType,
        deviceInfo: bio.deviceInfo,
        lastUsed: bio.lastUsed,
        createdAt: bio.createdAt
      }))
    });
  } catch (error) {
    console.error('Get biometrics error:', error);
    sendError(res, 'Failed to get registered biometrics', 500);
  }
};

// Delete a biometric registration
exports.deleteBiometric = async (req, res) => {
  try {
    const { biometricId } = req.params;

    const biometric = await BiometricAuth.findOne({
      _id: biometricId,
      userId: userId,
      isActive: true
    });

    if (!biometric) {
      return sendError(res, 'Biometric registration not found', 404);
    }

    // Soft delete by setting isActive to false
    biometric.isActive = false;
    await biometric.save();

    res.json({
      success: true,
      message: 'Biometric registration deleted successfully'
    });
  } catch (error) {
    console.error('Delete biometric error:', error);
    sendError(res, 'Failed to delete biometric registration', 500);
  }
}; 