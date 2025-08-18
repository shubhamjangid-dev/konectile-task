const { createLogger, format, transports } = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'noaclub-backend' },
  transports: [
    // Console transport (colored output)
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, stack }) => {
          if (stack) {
            return `${timestamp} [${level}] ${message}\n${stack}`;
          }
          return `${timestamp} [${level}] ${message}`;
        })
    )
    }),
    // Error log file (only errors)
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    }),
    // Combined log file (all levels)
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ]
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new transports.File({ filename: path.join(logDir, 'exceptions.log') })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new transports.File({ filename: path.join(logDir, 'rejections.log') })
);

module.exports = logger;    