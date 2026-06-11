/**
 * Notification Platform - Main App Entry Point
 * Uses React Router for multi-page navigation between:
 *   1. All Notifications (with filter + read/unread)
 *   2. Priority Inbox (top-n by Placement > Result > Event)
 */
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Button, Box, CssBaseline, ThemeProvider, createTheme
} from "@mui/material";
import AllNotificationsPage from "./pages/AllNotificationsPage";
import PriorityInboxPage from "./pages/PriorityInboxPage";

/* ------------------------------------------------------------------ */
/*  MUI Theme                                                            */
/* ------------------------------------------------------------------ */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#f57c00" },
    background: { default: "#f0f4f8" },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
});

/* ------------------------------------------------------------------ */
/*  Navigation Bar                                                       */
/* ------------------------------------------------------------------ */
function NavBar() {
  const location = useLocation();

  return (
    <AppBar position="sticky" color="primary" elevation={3}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          🔔 Campus Notifications
        </Typography>

        <Button
          component={Link}
          to="/"
          color="inherit"
          sx={{
            mr: 1,
            borderBottom: location.pathname === "/" ? "2px solid white" : "none",
            borderRadius: 0,
          }}
        >
          📋 All Notifications
        </Button>

        <Button
          component={Link}
          to="/priority"
          color="inherit"
          sx={{
            borderBottom: location.pathname === "/priority" ? "2px solid white" : "none",
            borderRadius: 0,
          }}
        >
          ⭐ Priority Inbox
        </Button>
      </Toolbar>
    </AppBar>
  );
}

/* ------------------------------------------------------------------ */
/*  App Root                                                             */
/* ------------------------------------------------------------------ */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavBar />
        <Box sx={{ minHeight: "calc(100vh - 64px)", background: "#f0f4f8", py: 3 }}>
          <Routes>
            <Route path="/" element={<AllNotificationsPage />} />
            <Route path="/priority" element={<PriorityInboxPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
