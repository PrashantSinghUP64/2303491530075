const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsImV4cCI6MTc4MTE2NjQzNSwiaWF0IjoxNzgxMTY1NTM1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMmIzMTYzN2MtOWRhNi00ZjdhLTgzNGEtNTVhMjdlNTdlMTllIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhc2hhbnQga3VtYXIgc2luZ2giLCJzdWIiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMifSwiZW1haWwiOiJwcmFzaGFudEBtcGdpLmVkdS5pbiIsIm5hbWUiOiJwcmFzaGFudCBrdW1hciBzaW5naCIsInJvbGxObyI6IjIzMDM0OTE1MzAwNzUiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI4ZmQ0Y2MzNC1jYWJjLTQ2ZmItOWI1Mi02MGYwMjBjMjRlYWMiLCJjbGllbnRTZWNyZXQiOiJaanpUQVl6cEtHWmhIWUJDIn0.NW14-yRqE1pPEpKhP9X7t4j5W91lrN5hfxSuNZZ5aZU";

const Log = async (stack, level, package_name, message) => {
  try {
    const response = await fetch("http://4.224.186.213/evaluation-service/logs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        stack: stack,
        level: level,
        package: package_name,
        message: message
      })
    });
    const data = await response.json();
    console.log("Log created:", data.logID);
  } catch (error) {
    console.error("Logging failed:", error);
  }
};

module.exports = { Log };
