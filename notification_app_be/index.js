/**
 * notification_app_be — Priority Inbox Backend
 *
 * REST API that fetches notifications from the evaluation server,
 * applies priority scoring, and serves them to the React frontend.
 *
 * Priority Score = typeWeight * 1_000_000 + timestamp_ms
 *   Placement (3) > Result (2) > Event (1), recency as tiebreaker.
 *
 * Routes:
 *   GET /priority?n=<number>              — Top-n priority notifications
 *   GET /notifications?notification_type= — All notifications (with optional type filter)
 *
 * CORS enabled for localhost:3000 (React dev server)
 */

const express = require("express");
const { Log } = require("../logging_middleware/index");

const app = express();
app.use(express.json());

/* ------------------------------------------------------------------ */
/*  CORS Middleware — allows React frontend on localhost:3000            */
/* ------------------------------------------------------------------ */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ------------------------------------------------------------------ */
/*  Configuration                                                        */
/* ------------------------------------------------------------------ */
const PORT = 3001;
const NOTIFICATIONS_API = "http://4.224.186.213/evaluation-service/notifications";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsImV4cCI6MTc4MTE2OTg1MiwiaWF0IjoxNzgxMTY4OTUyLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZGI0MTljNTEtNjBhNy00YzUzLTg0MmUtOTQ2ODI0ZWNiZjFhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhc2hhbnQga3VtYXIgc2luZ2giLCJzdWIiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMifSwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsIm5hbWUiOiJwcmFzaGFudCBrdW1hciBzaW5naCIsInJvbGxObyI6IjIzMDM0OTE1MzAwNzUiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMiLCJjbGllbnRTZWNyZXQiOiJaanpUQVl6cEtHWmhIWUJDIn0.y4D4fpQ0i3nGUYLRdPqDg_-9BcxLxnVCBDblS8OChAM";

/* ------------------------------------------------------------------ */
/*  Service Layer — Fetches from evaluation API                          */
/* ------------------------------------------------------------------ */

/**
 * Fetches all notifications from the remote evaluation API.
 * Supports optional type filtering via query param.
 *
 * @param {string|null} notificationType - Optional: "Placement" | "Result" | "Event"
 * @returns {Promise<Array>} Array of notification objects
 */
async function getNotifications(notificationType = null) {
  await Log("backend", "info", "service", "Fetching notifications from evaluation API");

  let url = NOTIFICATIONS_API;
  if (notificationType) {
    url += `?notification_type=${notificationType}`;
    await Log("backend", "info", "service", `Filtering by type: ${notificationType}`);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!response.ok) {
    await Log("backend", "error", "service", `API responded with status ${response.status}`);
    throw new Error(`Upstream API error: ${response.status}`);
  }

  const data = await response.json();
  const notifications = data.notifications || [];
  await Log("backend", "info", "service", `Fetched ${notifications.length} notifications`);
  return notifications;
}

/* ------------------------------------------------------------------ */
/*  Domain Logic — Priority Scoring                                      */
/* ------------------------------------------------------------------ */

const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

function getPriorityScore(notification) {
  return TYPE_WEIGHTS[notification.Type] ?? 1;
}

/* ------------------------------------------------------------------ */
/*  Routes                                                               */
/* ------------------------------------------------------------------ */

/**
 * GET /notifications
 * Proxy endpoint: fetches all notifications from evaluation API.
 * Solves CORS issue for the React frontend.
 *
 * Query Params:
 *   notification_type {string} — Optional filter: Placement | Result | Event
 */
app.get("/notifications", async (req, res) => {
  const { notification_type } = req.query;
  await Log("backend", "info", "handler", `Notifications requested, type filter: ${notification_type || "none"}`);

  try {
    const notifications = await getNotifications(notification_type || null);
    await Log("backend", "info", "handler", `Returning ${notifications.length} notifications`);
    res.json({ notifications });
  } catch (err) {
    await Log("backend", "error", "handler", `Failed to fetch notifications: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch notifications", details: err.message });
  }
});

/**
 * GET /priority
 * Returns top-N notifications ranked by priority score.
 *
 * Query Params:
 *   n {number} — Number of top notifications to return (default: 10)
 */
app.get("/priority", async (req, res) => {
  const n = Math.max(1, parseInt(req.query.n, 10) || 10);
  await Log("backend", "info", "handler", `Priority inbox requested — top ${n} notifications`);

  try {
    const notifications = await getNotifications();

    const sorted = [...notifications]
      .sort((a, b) => {
        const weightA = getPriorityScore(a);
        const weightB = getPriorityScore(b);
        if (weightA !== weightB) {
          return weightB - weightA; // Higher weight first
        }
        // If weights are equal, sort by recency (newer first)
        const timeA = new Date(a.Timestamp).getTime();
        const timeB = new Date(b.Timestamp).getTime();
        return timeB - timeA;
      })
      .slice(0, n);

    await Log("backend", "info", "handler", `Returning ${sorted.length} priority notifications`);
    res.json({ notifications: sorted });
  } catch (err) {
    await Log("backend", "error", "handler", `Failed to process priority request: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch notifications", details: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Server Bootstrap                                                     */
/* ------------------------------------------------------------------ */
app.listen(PORT, async () => {
  await Log("backend", "info", "service", `Backend server started on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
