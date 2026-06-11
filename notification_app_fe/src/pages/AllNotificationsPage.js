import { useState, useEffect, useCallback } from "react";
import {
  Container, Typography, Box, Chip, CircularProgress, Alert,
  Card, CardContent, Stack, Badge, Tooltip, ToggleButton, ToggleButtonGroup
} from "@mui/material";

const BASE_URL = "http://localhost:3001";
const READ_STORAGE_KEY = "readNotificationIds";

const typeColor = (type) => {
  if (type === "Placement") return "success";
  if (type === "Result") return "primary";
  return "warning";
};

const borderColor = (type) => {
  if (type === "Placement") return "#2e7d32";
  if (type === "Result") return "#1565c0";
  return "#e65100";
};

const typeEmoji = (type) => {
  if (type === "Placement") return "💼";
  if (type === "Result") return "📊";
  return "🎉";
};

const loadReadIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveReadIds = (ids) => {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
};

export default function AllNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [readIds, setReadIds] = useState(loadReadIds);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filter === "All"
          ? `${BASE_URL}/notifications`
          : `${BASE_URL}/notifications?notification_type=${filter}`;

      const res = await fetch(url);

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError("Failed to load notifications. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = (id) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    saveReadIds(updated);
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.ID)).length;

  return (
    <Container maxWidth="md">
      {}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <Badge badgeContent={unreadCount} color="error">
          <Typography variant="h5" component="span">🔔</Typography>
        </Badge>
        <Box sx={{ ml: 1 }}>
          <Typography variant="h5" fontWeight={700}>All Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} unread · Click a card to mark as read
          </Typography>
        </Box>
      </Box>

      {}
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, val) => val && setFilter(val)}
        sx={{ mb: 3, flexWrap: "wrap", gap: 0.5 }}
        size="small"
      >
        {["All", "Placement", "Event", "Result"].map((type) => (
          <ToggleButton
            key={type}
            value={type}
            sx={{ borderRadius: "20px !important", px: 2 }}
          >
            {typeEmoji(type) !== "🎉" || type === "Event" ? typeEmoji(type) : ""} {type}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {}
      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications found for this filter.</Alert>
      )}

      {}
      <Stack spacing={1.5}>
        {notifications.map((notif) => {
          const isRead = readIds.has(notif.ID);
          return (
            <Tooltip key={notif.ID} title={isRead ? "Already read" : "Click to mark as read"} placement="right">
              <Card
                onClick={() => markAsRead(notif.ID)}
                elevation={isRead ? 0 : 2}
                sx={{
                  cursor: "pointer",
                  borderLeft: `5px solid ${borderColor(notif.Type)}`,
                  opacity: isRead ? 0.6 : 1,
                  background: isRead ? "#f8fafc" : "#ffffff",
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                }}
              >
                <CardContent sx={{ py: "12px !important" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {}
                      <Chip label={`${typeEmoji(notif.Type)} ${notif.Type}`} color={typeColor(notif.Type)} size="small" variant="outlined" />
                      {}
                      <Typography variant="caption" color={isRead ? "text.disabled" : "primary.main"}>
                        {isRead ? "✓ Read" : "● Unread"}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.Timestamp).toLocaleString("en-IN")}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ fontWeight: isRead ? 400 : 600, mt: 0.5 }}
                  >
                    {notif.Message}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          );
        })}
      </Stack>
    </Container>
  );
}
