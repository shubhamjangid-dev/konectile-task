const express = require('express');
const { createBackup, cleanOldBackups, downloadBackup, listBackups, restoreFromBackup } = require('../controller/DataBaseSecuriry');
const router = express.Router();

router.post('/create-backup',createBackup);

router.post('/clean-backup', cleanOldBackups)

router.get('/download-backup/:filename',downloadBackup)

router.get('/backup-list',listBackups)

router.post('/restore/:filename',restoreFromBackup)

router.options('/restore/:filename', (req, res,next) => {

    if (req.headers['content-type'] === 'application/json' && req.body) {
      try {
        JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }
    next();
});

module.exports = router;