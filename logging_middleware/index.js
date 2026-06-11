/**
 * logging_middleware — Reusable Logging Package
 *
 * Provides a structured Log() function that posts log entries to the
 * evaluation server API. Designed to be imported across both the backend
 * service and any other JavaScript/Node.js module in this project.
 *
 * Usage:
 *   const { Log } = require('../logging_middleware');
 *   await Log("backend", "info", "service", "Server started successfully");
 *
 * Supported Values:
 *   stack   : "backend" | "frontend"
 *   level   : "debug" | "info" | "warn" | "error" | "fatal"
 *   package : "service" | "handler" | "middleware" | "controller" | ...
 *   message : Any descriptive string
 */

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsImV4cCI6MTc4MTE2OTg1MiwiaWF0IjoxNzgxMTY4OTUyLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZGI0MTljNTEtNjBhNy00YzUzLTg0MmUtOTQ2ODI0ZWNiZjFhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhc2hhbnQga3VtYXIgc2luZ2giLCJzdWIiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMifSwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsIm5hbWUiOiJwcmFzaGFudCBrdW1hciBzaW5naCIsInJvbGxObyI6IjIzMDM0OTE1MzAwNzUiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMiLCJjbGllbnRTZWNyZXQiOiJaanpUQVl6cEtHWmhIWUJDIn0.y4D4fpQ0i3nGUYLRdPqDg_-9BcxLxnVCBDblS8OChAM";

const LOG_API = "http://4.224.186.213/evaluation-service/logs";

/**
 * Posts a structured log entry to the evaluation server.
 * Failures are caught silently so logging never breaks the main application flow.
 *
 * @param {string} stack    - Application layer: "backend" or "frontend"
 * @param {string} level    - Severity: "debug" | "info" | "warn" | "error" | "fatal"
 * @param {string} pkg      - Module/package name e.g. "service", "handler", "middleware"
 * @param {string} message  - Human-readable description of the event
 * @returns {Promise<void>}
 */
const Log = async (stack, level, pkg, message) => {
  try {
    const response = await fetch(LOG_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stack,
        level,
        package: pkg,
        message,
      }),
    });

    const data = await response.json();

    if (data.logID) {
      console.log(`[LOG] ${level.toUpperCase()} | ${stack}/${pkg} | ${message} → logID: ${data.logID}`);
    } else {
      console.warn("[LOG] Unexpected response from log API:", data);
    }
  } catch (error) {
    // Logging must never crash the application — catch and warn only
    console.error("[LOG] Failed to send log:", error.message);
  }
};

module.exports = { Log };
