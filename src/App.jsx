import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
// import DashboardLayout from "./layout/DashboardLayout";
import Layout from "./layout/Layout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TenderListing from "./pages/TenderListing";
import Keywords from "./pages/Keywords";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Sources from "./pages/Sources";
import SystemLogs from "./pages/SystemLogs";
import MyProfile from "./pages/MyProfile";
import LoginHistory from "./pages/LoginHistory";

/* =========================
   DASHBOARD LAYOUT
========================= */
function DashboardLayout() {
  const sidebarHeader = {
    title: "Tender Intel",
    subtitle: "Intelligent System",
  };
  const withPageBoundary = (element) => (
    <ErrorBoundary
      fullScreen={false}
      showReload={false}
      title="We hit a snag on this page"
      message="Please try again. If it keeps happening, contact support."
    >
      {element}
    </ErrorBoundary>
  );

  return (
    <Layout>
      <Routes>
        {/* DASHBOARD */}
        <Route path="/dashboard" element={withPageBoundary(<Dashboard />)} />

        {/* OTHER PAGES */}
        <Route path="/tenders" element={withPageBoundary(<TenderListing />)} />
        <Route path="/keywords" element={withPageBoundary(<Keywords />)} />
        <Route
          path="/notifications"
          element={withPageBoundary(<Notifications />)}
        />
        <Route path="/analytics" element={withPageBoundary(<Analytics />)} />
        <Route path="/sources" element={withPageBoundary(<Sources />)} />
        <Route path="/system-logs" element={withPageBoundary(<SystemLogs />)} />
        <Route
          path="/login-history"
          element={withPageBoundary(<LoginHistory />)}
        />
        <Route path="/profile" element={withPageBoundary(<MyProfile />)} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

/* =========================
   APP ROUTES
========================= */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<DashboardLayout />} />
    </Routes>
  );
}
