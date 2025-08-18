const { permissions } = require("../utils/Role");

exports.checkPermission = (module, accessLevel) => (req, res, next) => {
    const user = req.user;
    const hasPermission = permissions.some(
      (p) =>
        p.module === module &&
        p.access_level === accessLevel &&
        user.roles.includes(roles.find((r) => r.id === p.role_id)?.name)
    );
   
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }
   
    next();
  };