import { useState, useEffect } from "react";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsImV4cCI6MTc4MTE2MzcyNCwiaWF0IjoxNzgxMTYyODI0LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiOWE3MGUzYzUtZTA4Yi00OTRhLTg4YmUtMDAwNDAyZWM2ODQ2IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhc2hhbnQga3VtYXIgc2luZ2giLCJzdWIiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMifSwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsIm5hbWUiOiJwcmFzaGFudCBrdW1hciBzaW5naCIsInJvbGxObyI6IjIzMDM0OTE1MzAwNzUiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMiLCJjbGllbnRTZWNyZXQiOiJaanpUQVl6cEtHWmhIWUJDIn0.tDHooIcwVuyo1Xm--srO0vks3PdAvZaD8X8nS4ZIRQ0";
const BASE_URL = "http://4.224.186.213/evaluation-service";

function App() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url =
        filter === "All"
          ? `${BASE_URL}/notifications`
          : `${BASE_URL}/notifications?notification_type=${filter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (type) => {
    if (type === "Placement") return "#22c55e";
    if (type === "Result") return "#3b82f6";
    return "#f97316";
  };

  const getBadgeColor = (type) => {
    if (type === "Placement") return "#dcfce7";
    if (type === "Result") return "#dbeafe";
    return "#ffedd5";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1e293b",
            marginBottom: "8px",
          }}
        >
          📢 Notification Platform
        </h1>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Stay updated with latest placements, events and results
        </p>

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          {["All", "Placement", "Event", "Result"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: "8px 20px",
                background: filter === type ? "#1d4ed8" : "#ffffff",
                color: filter === type ? "white" : "#374151",
                border: filter === type ? "none" : "1px solid #d1d5db",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s",
                boxShadow: filter === type ? "0 2px 8px rgba(29,78,216,0.3)" : "none",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ textAlign: "center", color: "#64748b" }}>Loading...</p>
        )}

        {/* Notification Cards */}
        {!loading && notifications.length === 0 && (
          <p style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px" }}>
            No notifications found.
          </p>
        )}

        {notifications.map((notif) => (
          <div
            key={notif.ID}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "12px",
              borderLeft: `4px solid ${getBorderColor(notif.Type)}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  background: getBadgeColor(notif.Type),
                  color: "#374151",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {notif.Type}
              </span>
              <small style={{ color: "#94a3b8", fontSize: "12px" }}>
                {new Date(notif.Timestamp).toLocaleString()}
              </small>
            </div>
            <p style={{ color: "#1e293b", margin: "0", fontSize: "15px" }}>
              {notif.Message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
