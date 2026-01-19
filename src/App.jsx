import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="ml-64 flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* DASHBOARD */}
            <Route path="/" element={<Dashboard />} />

            {/* OTHER PAGES */}
            <Route path="/tenders" element={<TenderListing />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/system-logs" element={<SystemLogs />} />
            <Route path="/profile" element={<MyProfile />} />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<DashboardLayout />} />
    </Routes>
  );
}
