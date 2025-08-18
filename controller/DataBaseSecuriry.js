const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs');
const { sendError } = require('../utils/helper');
const axios = require('axios');

// List all backups
exports.listBackups = async (req, res) => {
  try {
    const authToken = Buffer.from(
      `${process.env.ATLAS_API_PUBLIC_KEY}:${process.env.ATLAS_API_PRIVATE_KEY}`
    ).toString('base64');

    const response = await axios.get(
      `https://cloud.mongodb.com/api/atlas/v2/groups/${process.env.ATLAS_GROUP_ID}/clusters/${process.env.ATLAS_CLUSTER_NAME}/backup/snapshots`,
      {
        headers: {
          'Authorization': `Basic ${authToken}`
        }
      }
    );

    res.status(200).json({
      success: true,
      count: response.data.totalCount,
      snapshots: response.data.results
    });
  } catch (error) {
    handleAtlasError(res, error, 'Failed to list backups');
  }
};

// Helper function for error handling
function handleAtlasError(res, error, defaultMessage) {
  console.error(defaultMessage, error);
  
  let errorMessage = defaultMessage;
  if (error.response) {
    errorMessage += `: ${error.response.data.error || error.response.statusText}`;
  } else {
    errorMessage += `: ${error.message}`;
  }

  res.status(error.response?.status || 500).json({
    success: false,
    message: errorMessage
  });
}

exports.createBackup = async (req, res) => {
  let backupFolderPath;
  let zipPath;

  try {
    // Validate environment variable
    if (!process.env.MONGO_DB_CONNECTION) {
      console.error('MongoDB connection string is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: MongoDB connection string is missing'
      });
    }

    // Create backup directory if it doesn't exist
    const rootDir = path.join(__dirname, '../');
    const backupDir = path.join(rootDir, 'backups');
    
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`Created backup directory at ${backupDir}`);
      }
    } catch (dirError) {
      console.error('Failed to create backup directory:', dirError);
      throw new Error('Could not create backup directory - check filesystem permissions');
    }

    const date = new Date().toISOString().replace(/[:.]/g, '-');
    backupFolderPath = path.join(backupDir, `backup-${date}`);
    zipPath = path.join(backupDir, `backup-${date}.zip`);
    
    console.log(`Starting MongoDB backup process to ${backupFolderPath}`);

    // Execute mongodump command with improved error handling
    try {
      const { stdout: dumpStdout, stderr: dumpStderr } = await execPromise(
        `mongodump --uri="${process.env.MONGO_DB_CONNECTION}" --out="${backupFolderPath}"`
      );

      if (dumpStderr) {
        console.warn('Mongodump stderr:', dumpStderr);
        // Don't throw yet - stderr might contain warnings but still succeed
      }

      // Verify mongodump created files
      try {
        const dumpFiles = fs.readdirSync(backupFolderPath);
        if (dumpFiles.length === 0) {
          throw new Error('Mongodump did not create any files');
        }
        console.log(`Mongodump created ${dumpFiles.length} files`);
      } catch (readError) {
        console.error('Failed to read dump directory:', readError);
        throw new Error('Backup directory could not be read - mongodump may have failed');
      }
    } catch (dumpError) {
      console.error('Mongodump failed:', dumpError);
      throw new Error(`Database backup failed: ${dumpError.message}`);
    }

    // Compress the backup
    console.log(`Compressing backup to ${zipPath}`);
    try {
      const { stderr: dittoStderr } = await execPromise(
        `ditto -c -k --sequesterRsrc --keepParent "${backupFolderPath}" "${zipPath}"`
      );

      if (dittoStderr) {
        console.warn('Ditto compression stderr:', dittoStderr);
      }

      // Verify zip was created
      if (!fs.existsSync(zipPath)) {
        throw new Error('Compressed backup file was not created successfully');
      }
      console.log(`Compression successful, file size: ${fs.statSync(zipPath).size} bytes`);
    } catch (compressError) {
      console.error('Compression failed:', compressError);
      throw new Error(`Backup compression failed: ${compressError.message}`);
    }

    // Clean up uncompressed backup
    try {
      console.log(`Removing uncompressed backup at ${backupFolderPath}`);
      await execPromise(`rm -rf "${backupFolderPath}"`);
    } catch (cleanupError) {
      console.error('Failed to clean up uncompressed backup:', cleanupError);
      // Don't fail the whole request for this
    }

    // Successful response
    res.status(200).json({
      success: true,
      message: 'Backup created and compressed successfully',
      backupFile: path.basename(zipPath),
      path: path.relative(rootDir, zipPath),
      size: fs.statSync(zipPath).size,
      timestamp: new Date().toISOString(),
      downloadUrl: `/api/v1/database/download-backup/${path.basename(zipPath)}`
    });

  } catch (error) {
    console.error('Backup process failed:', error);
    
    // Clean up any partial files
    try {
      if (backupFolderPath && fs.existsSync(backupFolderPath)) {
        await execPromise(`rm -rf "${backupFolderPath}"`);
      }
      if (zipPath && fs.existsSync(zipPath)) {
        await execPromise(`rm -rf "${zipPath}"`);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    res.status(500).json({
      success: false,
      message: `Backup failed: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../backups');
    const filePath = path.join(backupDir, filename);

    // Security check - prevent directory traversal
    if (!filename || filename.includes('../') || !fs.existsSync(filePath)) {
      return sendError(res, 'Invalid or missing backup file', 404);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    sendError(res, 'Failed to download backup', 500);
  }
};


exports.listBackups = async (req, res) => {
  try {
    // 1. Validate backup directory path
    const backupDir = path.resolve(__dirname, '../backups');
    console.log(`[Backup] Looking for backups in: ${backupDir}`);

    // 2. Check directory existence with better error handling
    let dirExists;
    try {
      dirExists = fs.existsSync(backupDir);
    } catch (fsError) {
      console.error('[Backup] Filesystem error:', fsError);
      return sendError(res, 'Could not access backup directory', 500, {
        error: fsError.message,
        path: backupDir
      });
    }

    if (!dirExists) {
      console.log('[Backup] Directory does not exist, creating...');
      try {
        fs.mkdirSync(backupDir, { recursive: true });
        return res.status(200).json({
          success: true,
          message: 'Backup directory created',
          backups: [],
          directory: {
            path: backupDir,
            created: true,
            exists: true
          }
        });
      } catch (mkdirError) {
        console.error('[Backup] Directory creation failed:', mkdirError);
        return sendError(res, 'Could not create backup directory', 500, {
          error: mkdirError.message,
          path: backupDir
        });
      }
    }

    // 3. Read directory with error handling
    let allFiles;
    try {
      allFiles = fs.readdirSync(backupDir);
      console.log(`[Backup] Found ${allFiles.length} files in directory`);
    } catch (readError) {
      console.error('[Backup] Directory read error:', readError);
      return sendError(res, 'Could not read backup directory', 500, {
        error: readError.message,
        path: backupDir
      });
    }

    // 4. Process backup files with validation
    const backupFiles = [];
    for (const file of allFiles) {
      try {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);

        // Flexible backup file pattern matching
        const isBackupFile = 
          file.startsWith('backup-') && 
          (file.endsWith('.tar.gz') || 
           file.endsWith('.zip') || 
           file.endsWith('.bak') ||
           /\d{4}-\d{2}-\d{2}/.test(file));

        if (isBackupFile) {
          backupFiles.push({
            filename: file,
            size: stats.size,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
            created: stats.birthtime,
            modified: stats.mtime,
            downloadUrl: `/api/v1/database/download/${file}`,
            absolutePath: filePath
          });
        }
      } catch (fileError) {
        console.error(`[Backup] Error processing file ${file}:`, fileError);
        // Continue with next file even if one fails
      }
    }

    // 5. Sort by creation date (newest first)
    backupFiles.sort((a, b) => b.created - a.created);

    // 6. Pagination with validation
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedFiles = backupFiles.slice(startIndex, endIndex);

    // 7. Successful response
    res.status(200).json({
      success: true,
      data: {
        backups: paginatedFiles,
        directory: {
          path: backupDir,
          exists: true,
          totalFiles: allFiles.length
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(backupFiles.length / limit),
          totalBackups: backupFiles.length,
          hasNext: endIndex < backupFiles.length,
          hasPrevious: startIndex > 0
        }
      }
    });

  } catch (error) {
    console.error('[Backup] Unexpected error in listBackups:', error);
    sendError(res, 'An unexpected error occurred', 500, {
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

const MAX_BACKUPS = 5;

exports.cleanOldBackups = async (req, res) => {
  try {
    const rootDir = path.join(__dirname, '../');
    const backupDir = path.join(rootDir, 'backups');
    
    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      return res.status(200).json({
        success: true,
        message: 'Backup directory does not exist - nothing to clean',
        deletedCount: 0
      });
    }

    // Get all backup files (without requiring .zip extension)
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-')) // Removed .zip check
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        ctime: fs.statSync(path.join(backupDir, file)).ctime.getTime()
      }))
      .sort((a, b) => b.ctime - a.ctime); // Newest first

    // Determine which files to delete
    const filesToDelete = files.slice(MAX_BACKUPS);
    
    // Delete old backups
    let deletedCount = 0;
    const deletionErrors = [];
    
    for (const file of filesToDelete) {
      try {
        fs.rmSync(file.path, { recursive: true, force: true }); // Handles both files and directories
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete ${file.name}:`, err);
        deletionErrors.push({
          file: file.name,
          error: err.message
        });
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: deletedCount > 0 
        ? `Successfully deleted ${deletedCount} old backup(s)` 
        : files.length <= MAX_BACKUPS
          ? `No old backups to delete (${files.length}/${MAX_BACKUPS} backups kept)`
          : 'No backups were deleted (check errors)',
      backupDirectoryPath: backupDir,
      totalBackups: files.length,
      keptBackups: files.slice(0, MAX_BACKUPS).map(f => f.name),
      deletedCount,
      deletionErrors
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Backup cleanup error:', error);
    sendError(res, `Failed to clean old backups: ${error.message}`, 500);
  }
};


exports.restoreFromBackup = async (req, res) => {
  const { filename } = req.params;
  const backupDir = path.join(__dirname, '../backups');
  const backupPath = path.join(backupDir, filename);

  try {
    // 1. Validate backup file exists
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
        path: backupPath
      });
    }

    // 2. Validate file extension
    const validExtensions = ['.zip', '.gz', '.bak', '.tar.gz'];
    const fileExt = path.extname(filename).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup file format',
        supportedFormats: validExtensions
      });
    }

    // 3. Create temporary extraction directory
    const tempDir = path.join(backupDir, 'temp_restore');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 4. Extract backup file based on type
    console.log(`Starting restoration from ${filename}`);
    let extractCmd;
    
    if (filename.endsWith('.zip')) {
      extractCmd = `unzip -o "${backupPath}" -d "${tempDir}"`;
    } else if (filename.endsWith('.tar.gz') || filename.endsWith('.gz')) {
      extractCmd = `tar -xzf "${backupPath}" -C "${tempDir}"`;
    } else {
      // For other formats, assume it's already a dump file
      extractCmd = `cp "${backupPath}" "${tempDir}"`;
    }

    await execPromise(extractCmd);
    console.log('Backup extracted successfully');

    // 5. Find the dump directory (mongodump creates a 'dump' folder)
    let dumpDir = tempDir;
    const possibleDumpDirs = ['dump', 'backup', 'mongodump'];
    
    for (const dir of possibleDumpDirs) {
      const testPath = path.join(tempDir, dir);
      if (fs.existsSync(testPath)) {
        dumpDir = testPath;
        break;
      }
    }

    // 6. Execute mongorestore
    console.log(`Restoring from ${dumpDir}`);
    const { stderr: restoreStderr } = await execPromise(
      `mongorestore --uri="${process.env.MONGO_DB_CONNECTION}" --drop "${dumpDir}"`
    );

    if (restoreStderr) {
      console.warn('Mongorestore stderr:', restoreStderr);
      // Don't fail unless it's actually an error
      if (restoreStderr.includes('error')) {
        throw new Error(restoreStderr);
      }
    }

    // 7. Clean up temporary files
    await execPromise(`rm -rf "${tempDir}"`);
    console.log('Restoration completed successfully');

    res.status(200).json({
      success: true,
      message: 'Database restored successfully',
      backupFile: filename,
      restoredAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Restoration error:', error);
    
    // Clean up temporary files if they exist
    try {
      const tempDir = path.join(backupDir, 'temp_restore');
      if (fs.existsSync(tempDir)) {
        await execPromise(`rm -rf "${tempDir}"`);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      message: 'Database restoration failed',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

