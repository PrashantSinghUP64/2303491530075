/**
 * PriorityInboxPage
 * - Displays top-N priority notifications fetched from the backend
 * - Priority scoring: Placement (3) > Result (2) > Event (1) + recency
 * - User can select how many top notifications to view (10, 15, 20)
 * - Supports additional client-side filter by notification type
 */
import { useState, useEffect, useCallback } from "react";
import {
  Container, Typography, Box, Chip, LinearProgress, Alert,
  Card, CardContent, Stack, Select, MenuItem, FormControl,
  InputLabel, ToggleButton, ToggleButtonGroup
} from "@mui/material";

/* ------------------------------------------------------------------ */
/*  Config                                                               */
/* ------------------------------------------------------------------ */
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsImV4cCI6MTc4MTE2NzcxNywiaWF0IjoxNzgxMTY2ODE3LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZTgyM2Q0MmYtOWQwYS00MGQ1LWFhNTEtNWFjZDBlYWE5Y2QxIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhc2hhbnQga3VtYXIgc2luZ2giLCJzdWIiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMifSwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsIm5hbWUiOiJwcmFzaGFudCBrdW1hciBzaW5naCIsInJvbGxObyI6IjIzMDM0OTE1MzAwNzUiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMiLCJjbGllbnRTZWNyZXQiOiJaanpUQVl6cEtHWmhIWUJDIn0.u-dY_jO2Z9Fzrcuc8G3YXpqU5Ddvz9HeQK6OcNkgNkc";
const BACKEND_URL = "http://localhost:3001";

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */
/** MUI chip color per notification type */
const typeColor = (type) => {
  if (type === "Placement") return "success";
  if (type === "Result") return "primary";
  return "warning";
};

/** Left border color per notification type */
const borderColor = (type) => {
  if (type === "Placement") return "#2e7d32";
  if (type === "Result") return "#1565c0";
  return "#e65100";
};

/** Emoji rank label for top positions */
const rankLabel = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
};

/** Emoji per notification type */
const typeEmoji = (type) => {
  if (type === "Placement") return "💼";
  if (type === "Result") return "📊";
  return "🎉";
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                       */
/* ------------------------------------------------------------------ */
export default function PriorityInboxPage() {
  const [notifications, setNotifications] = useState([]);
  const [topN, setTopN] = useState(10);
  const [filterType, setFilterType] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** Fetch priority notifications from backend /priority endpoint */
  const fetchPriority = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/priority?n=${topN}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });

      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError("Could not fetch priority notifications. Make sure backend is running on port 3001.");
    } finally {
      setLoading(false);
    }
  }, [topN]);

  useEffect(() => {
    fetchPriority();
  }, [fetchPriority]);

  /** Optional client-side type filter after fetching */
  const displayed =
    filterType === "All"
      ? notifications
      : notifications.filter((n) => n.Type === filterType);

  return (
    <Container maxWidth="md">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>⭐ Priority Inbox</Typography>
        <Typography variant="body2" color="text.secondary">
          Sorted by importance: 💼 Placement {">"} 📊 Result {">"} 🎉 Event · then by recency
        </Typography>
      </Box>

      {/* Controls: Top-N selector + Type filter */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        {/* Top-N Dropdown */}
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Show Top</InputLabel>
          <Select
            value={topN}
            label="Show Top"
            onChange={(e) => setTopN(e.target.value)}
          >
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={15}>Top 15</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
          </Select>
        </FormControl>

        {/* Type filter toggle */}
        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={(_, val) => val && setFilterType(val)}
          size="small"
        >
          {["All", "Placement", "Result", "Event"].map((t) => (
            <ToggleButton key={t} value={t} sx={{ px: 2, borderRadius: "20px !important" }}>
              {t}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Loading bar */}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Empty state */}
      {!loading && !error && displayed.length === 0 && (
        <Alert severity="info">No notifications match this filter.</Alert>
      )}

      {/* Priority Notification Cards */}
      <Stack spacing={1.5}>
        {displayed.map((notif, index) => (
          <Card
            key={notif.ID}
            elevation={3}
            sx={{
              borderLeft: `5px solid ${borderColor(notif.Type)}`,
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateX(4px)" },
            }}
          >
            <CardContent sx={{ py: "12px !important" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {/* Rank badge */}
                  <Typography variant="h6" component="span" sx={{ minWidth: 36, fontSize: "1.1rem" }}>
                    {rankLabel(index)}
                  </Typography>
                  {/* Type chip */}
                  <Chip
                    label={`${typeEmoji(notif.Type)} ${notif.Type}`}
                    color={typeColor(notif.Type)}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notif.Timestamp).toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ ml: 5.5, color: "text.primary" }}>
                {notif.Message}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
