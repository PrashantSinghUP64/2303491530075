const express = require('express');
const { Log } = require('../logging_middleware/index');
const app = express();
app.use(express.json());

const TOKEN = "APNA_BEARER_TOKEN_YAHAN_DAALO";

// Fetch notifications from Affordmed API
async function getNotifications() {
  await Log("backend", "info", "service", "Fetching notifications from API");

  const response = await fetch("http://4.224.186.213/evaluation-service/notifications", {
    headers: { "Authorization": `Bearer ${TOKEN}` }
  });
  const data = await response.json();
  return data.notifications;
}

// Priority scoring function
function getPriorityScore(notification) {
  const typeWeight = { "Placement": 3, "Result": 2, "Event": 1 };
  const weight = typeWeight[notification.Type] || 1;
  const recency = new Date(notification.Timestamp).getTime();
  return weight * 1000000 + recency;
}

// GET top N priority notifications
app.get('/priority', async (req, res) => {
  await Log("backend", "info", "handler", "Priority notifications requested");

  const n = parseInt(req.query.n) || 10;
  const notifications = await getNotifications();

  const sorted = notifications
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
    .slice(0, n);

  await Log("backend", "info", "handler", `Returning top ${n} notifications`);
  res.json({ notifications: sorted });
});

app.listen(3001, () => {
  Log("backend", "info", "service", "Backend server started on port 3001");
  console.log("Server running on port 3001");
});
