const roles = [
    { id: 1, name: 'superadmin' },
    { id: 2, name: 'admin' },
    { id: 3, name: 'editor' },
    { id: 4, name: 'cashier' },
    { id: 5, name: 'viewer' },
    { id: 6, name: 'user' },
  ];
   
  exports.permissions = [
    // Super Admin: Full access to everything
    { role_id: 1, module: 'dashboard', access_level: 'read' },
    { role_id: 1, module: 'dashboard', access_level: 'write' },
    { role_id: 1, module: 'dashboard', access_level: 'update' },
    { role_id: 1, module: 'dashboard', access_level: 'delete' },
    { role_id: 1, module: 'reports', access_level: 'read' },
    { role_id: 1, module: 'reports', access_level: 'write' },
    { role_id: 1, module: 'reports', access_level: 'update' },
    { role_id: 1, module: 'reports', access_level: 'delete' },
    { role_id: 1, module: 'settings', access_level: 'read' },
    { role_id: 1, module: 'settings', access_level: 'write' },
    { role_id: 1, module: 'settings', access_level: 'update' },
    { role_id: 1, module: 'settings', access_level: 'delete' },
   
    // Admin: Read, write, update (no delete)
    { role_id: 2, module: 'dashboard', access_level: 'read' },
    { role_id: 2, module: 'dashboard', access_level: 'write' },
    { role_id: 2, module: 'dashboard', access_level: 'update' },
    { role_id: 2, module: 'reports', access_level: 'read' },
    { role_id: 2, module: 'reports', access_level: 'write' },
    { role_id: 2, module: 'reports', access_level: 'update' },
   
    // Editor: Read and write
    { role_id: 3, module: 'dashboard', access_level: 'read' },
    { role_id: 3, module: 'dashboard', access_level: 'write' },
    { role_id: 3, module: 'reports', access_level: 'read' },
    { role_id: 3, module: 'reports', access_level: 'write' },
   
    // Cashier: Read and write in transactions
    { role_id: 4, module: 'transactions', access_level: 'read' },
    { role_id: 4, module: 'transactions', access_level: 'write' },
   
    // Viewer: Read-only
    { role_id: 5, module: 'dashboard', access_level: 'read' },
    { role_id: 5, module: 'reports', access_level: 'read' },
   
    // User: Basic access
    { role_id: 6, module: 'dashboard', access_level: 'read' },
  ];