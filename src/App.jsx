import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

// Layout components
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

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

/* =========================
   DASHBOARD LAYOUT
========================= */
function DashboardLayout() {
  const sidebarHeader = {
    title: "Tender Intel",
    subtitle: "Intelligent System"
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
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar
        headerTitle={sidebarHeader.title}
        headerSubtitle={sidebarHeader.subtitle}
      />

      <div className="ml-64 flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* DASHBOARD */}
            <Route
              path="/dashboard"
              element={withPageBoundary(<Dashboard />)}
            />

            {/* OTHER PAGES */}
            <Route
              path="/tenders"
              element={withPageBoundary(<TenderListing />)}
            />
            <Route
              path="/keywords"
              element={withPageBoundary(<Keywords />)}
            />
            <Route
              path="/notifications"
              element={withPageBoundary(<Notifications />)}
            />
            <Route
              path="/analytics"
              element={withPageBoundary(<Analytics />)}
            />
            <Route path="/sources" element={withPageBoundary(<Sources />)} />
            <Route
              path="/system-logs"
              element={withPageBoundary(<SystemLogs />)}
            />
            <Route path="/profile" element={withPageBoundary(<MyProfile />)} />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
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
