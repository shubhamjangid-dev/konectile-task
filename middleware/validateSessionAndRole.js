const jwt = require('jsonwebtoken');
const User = require('../models/user');

const validateSessionAndRole = (roles = []) => (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
   
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = User.find((u) => u.id === decoded.userId);
   
      if (!user || user.session_id !== decoded.sessionId) {
        return res.status(401).json({ message: 'Session expired' });
      }
   
      if (roles.length > 0 && !roles.some((role) => decoded.roles.includes(role))) {
        return res.status(403).json({ message: 'Access denied' });
      }
   
      req.user = user; // Attach user to the request object
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };

module.exports = validateSessionAndRole