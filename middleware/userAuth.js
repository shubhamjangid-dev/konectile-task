const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { calculateDistance, sendError } = require('../utils/helper');
const User = require('../models/user');
const MemberProfile = require('../models/memberProfile');
const LoginHistory = require('../models/loginHistory');
const { getDeviceInfo, getClientIp, getLocationFromIp } = require('../utils/deviceInfo');
const { isNewDeviceOrLocation } = require('../utils/loginSecurity');
const { generateLoginAlertEmail } = require('../utils/EmailTemplate');
const { generateMailTransporter } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

  // user and member sign-in
exports.UserAndMemberSignIn = async (req, res) => {
    const { username, password, deviceFingerprint, latitude, longitude } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIp(req);
    const deviceInfo = getDeviceInfo(userAgent);
    
    // Get location from IP if coordinates not provided
    let location = latitude && longitude 
      ? { latitude, longitude } 
      : getLocationFromIp(ipAddress);


    console.log(deviceFingerprint, latitude,longitude);
  
    try {
      let user = await User.findOne({ username });
      let userModel = 'User';
  
      if (!user) {
        // If user is not found, check MemberProfile
        const member = await MemberProfile.findOne({ Email: username });
  
        if (member) {
          // Verify the password for MemberProfile
          const isPasswordValid = await argon2.verify(member.Password, password);
          if (!isPasswordValid) {
            // Log failed login attempt
            await LoginHistory.create({
              userId: member._id,
              userModel: 'MemberProfile',
              ipAddress,
              userAgent,
              deviceInfo,
              location,
              loginStatus: 'failed',
              sessionId: uuidv4()
            });
            return sendError(res, 'Invalid password');
          }
  
          // Create a user-like object for members
          user = {
            _id: member._id,
            username: member.Email,
            name: member.Name,
            roles: member.Role,
            allowed_device_fingerprint: null,
            allowed_latitude: null,
            allowed_longitude: null,
            session_id: null,
          };
          userModel = 'MemberProfile';
        } else {
          return sendError(res, 'User or member not found');
        }
      } else {
        // Verify the password for User
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
          // Log failed login attempt
          await LoginHistory.create({
            userId: user._id,
            userModel: 'User',
            ipAddress,
            userAgent,
            deviceInfo,
            location,
            loginStatus: 'failed',
            sessionId: uuidv4()
          });
          return sendError(res, 'Invalid password');
        }
      }
  
      // Super Admin specific checks (only for User model)
      if (user.roles === 'superadmin') {
        if (!user.allowed_device_fingerprint || !user.allowed_latitude || !user.allowed_longitude) {
          return sendError(res, 'Super admin configuration incomplete', 403);
        }
  
        // Verify device fingerprint
        if (deviceFingerprint !== user.allowed_device_fingerprint) {
          return sendError(res, 'Unauthorized device', 403);
        }
  
        // Verify location
        const allowedLatitude = user.allowed_latitude;
        const allowedLongitude = user.allowed_longitude;
  
        const distance = calculateDistance(latitude, longitude, allowedLatitude, allowedLongitude);
        if (distance > 100) {
          return sendError(res, `Unauthorized location: ${distance.toFixed(0)}m`);
        }
      }
  
      // Check if this is a new device or location
      const { isFirstLogin, isNewDevice, isNewLocation } = await isNewDeviceOrLocation(
        user._id || user.id,
        userModel,
        deviceInfo,
        ipAddress,
        location
      );
  
      // Send email alert if it's first login or new device/location
      if (isFirstLogin || isNewDevice || isNewLocation) {
        const { subject, html } = generateLoginAlertEmail(user, {
          deviceInfo,
          ipAddress,
          location,
          isFirstLogin
        });
  
        const transporter = generateMailTransporter();
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email || user.username,
          subject,
          html
        });
      }
  
      // Invalidate previous session (only for User model)
      if (user.session_id && user._id) {
        user.session_id = null;
        await User.findByIdAndUpdate(user._id, { session_id: null });
      }
  
      // Create new session
      const sessionId = uuidv4();
      user.session_id = sessionId;
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id || user.id, roles: user.roles, sessionId },
        process.env.SECRET_KEY,
        { expiresIn: '1h' }
      );
  
      // Log successful login
      await LoginHistory.create({
        userId: user._id || user.id,
        userModel,
        ipAddress,
        userAgent,
        deviceInfo,
        location,
        loginStatus: 'success',
        sessionId
      });
  
      // Set cookie and send response
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          roles: user.roles,
          token,
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


  exports.signout = async (req, res) => {
    const { jwtToken } = req.body;
  
    if (!jwtToken) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
  
    try {
      // Verify the token
      const decoded = jwt.verify(jwtToken, process.env.SECRET_KEY);
  
      // Find the user by ID
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Update login history with logout time
      await LoginHistory.findOneAndUpdate(
        { 
          userId: decoded.userId,
          sessionId: decoded.sessionId,
          isActive: true
        },
        { 
          logoutAt: new Date(),
          isActive: false
        }
      );
  
      // Clear the session ID
      user.session_id = null;
      await user.save();
  
      // Clear the token cookie
      res.clearCookie('token');
  
      // Send a success response
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
  
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      } else {
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  };


exports.isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authorization token required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Invalid token format', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY, {
        algorithms: ['HS256'], 
        ignoreExpiration: false,
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired', 401);
      }
      if (err.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token', 401);
      }
      return sendError(res, 'Authentication failed', 401);
    }

    // Try to find user first
    let user = await User.findById(decoded.userId).select('-password');
    
    // If user not found, try to find member
    if (!user) {
      user = await MemberProfile.findById(decoded.userId).select('-password');
      
      if (!user) {
        return sendError(res, 'User or Member not found', 401);
      }
      
      // Add a flag to identify if the authenticated entity is a member
      user.isMember = true;
    } else {
      // Add a flag to identify if the authenticated entity is a user
      user.isUser = true;
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(
        user.passwordChangedAt.getTime() / 1000,
        10
      );
      if (decoded.iat < changedTimestamp) {
        return sendError(res, 'Password changed recently. Please log in again.', 401);
      }
    }

    // Add user type to request for easier access in routes
    req.user = user;
    req.userType = user.isMember ? 'member' : 'user';
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return sendError(res, 'Authentication failed', 500);
  }
};
