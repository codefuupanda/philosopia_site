/**
 * Lightweight request logging middleware (zero dependencies)
 * Logs: method, path, status, response time
 * Uses ANSI codes for terminal colors
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Capture the original end function
  const originalEnd = res.end;

  res.end = function(...args) {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Color code based on status
    let statusColor;
    if (status >= 500) statusColor = colors.red;
    else if (status >= 400) statusColor = colors.yellow;
    else if (status >= 300) statusColor = colors.cyan;
    else statusColor = colors.green;

    // Format: [timestamp] METHOD /path STATUS duration
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset}`,
      `${colors.bold}${req.method.padEnd(6)}${colors.reset}`,
      req.originalUrl,
      `${statusColor}${status}${colors.reset}`,
      `${colors.gray}${duration}ms${colors.reset}`
    );

    originalEnd.apply(res, args);
  };

  next();
}

module.exports = requestLogger;
