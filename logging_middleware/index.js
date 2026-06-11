const TOKEN = "APNA_BEARER_TOKEN_YAHAN_DAALO";

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
