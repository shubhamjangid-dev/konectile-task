const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

const getDeviceInfo = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: `${result.browser.name} ${result.browser.version}`,
    os: `${result.os.name} ${result.os.version}`,
    device: result.device.type || 'desktop'
  };
};

const getClientIp = (req) => {
  // Try to get IP from various headers
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const remoteAddress = req.connection.remoteAddress;

  let ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : realIP || remoteAddress;

  // Handle IPv6 loopback
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  // Remove IPv6 prefix if present
  ip = ip.replace(/^::ffff:/, '');

  return ip;
};

const getLocationFromIp = (ip) => {
  try {
    // Skip geolocation for local IPs
    if (ip === '127.0.0.1' || ip === 'localhost') {
      return null;
    }

    const geo = geoip.lookup(ip);
    if (!geo) {
      return null;
    }

    return {
      city: geo.city || 'Unknown',
      country: geo.country || 'Unknown',
      latitude: geo.ll[0],
      longitude: geo.ll[1],
      timezone: geo.timezone
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return null;
  }
};

module.exports = {
  getDeviceInfo,
  getClientIp,
  getLocationFromIp
}; 