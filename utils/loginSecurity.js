const LoginHistory = require('../models/loginHistory');

const isNewDeviceOrLocation = async (userId, userModel, deviceInfo, ipAddress, location) => {
  // Get user's previous successful logins
  const previousLogins = await LoginHistory.find({
    userId,
    userModel,
    loginStatus: 'success'
  }).sort({ loginAt: -1 }).limit(1);

  if (previousLogins.length === 0) {
    return { isFirstLogin: true, isNewDevice: true, isNewLocation: true };
  }

  const lastLogin = previousLogins[0];
  const isNewDevice = lastLogin.deviceInfo.device !== deviceInfo.device ||
                     lastLogin.deviceInfo.browser !== deviceInfo.browser ||
                     lastLogin.deviceInfo.os !== deviceInfo.os;

  const isNewLocation = location && lastLogin.location && 
    (lastLogin.location.latitude !== location.latitude ||
     lastLogin.location.longitude !== location.longitude);

  return {
    isFirstLogin: false,
    isNewDevice,
    isNewLocation
  };
};

module.exports = {
  isNewDeviceOrLocation
}; 