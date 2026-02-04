import React from "react";
import { useMemo, useState, useEffect } from "react";
import { EmptyState } from "../components/States";
import { getErrorMessage, requestJson, requestWithRetry } from "../utils/api";

import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Search,
  Filter,
  Download,
  Trash2,
  Bell,
} from "lucide-react";

const VALID_STATUS = ["SUCCESS", "WARNING", "ERROR", "INFO"];
const SYSTEM_LOGS_ENDPOINTS = {
  list: "/api/fetch/logs",
  clear: "/api/fetch/logs/clear",
  status: "/api/fetch/status",
};

function isValidStatus(status) {
  return VALID_STATUS.includes(status);
}

function isValidDate(dateStr) {
  if (typeof dateStr !== "string") return false;

  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function getLocalDateOnly(date, time) {
  try {
    // combine date + time → local timezone
    const d = new Date(`${date}T${time || "00:00:00"}`);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch (err) {
    console.error("Invalid date/time:", date, time, err);
    return ""; // fallback
  }
}

function isValidLog(log) {
  if (!log) return false;

  if (!VALID_STATUS.includes(log.status)) return false;

  if (typeof log.message !== "string" || log.message.trim() === "")
    return false;

  if (typeof log.source !== "string" || log.source.trim() === "") return false;

  if (!isValidDate(log.date)) return false;

  return true;
}

// Transform backend response to frontend format
function transformBackendLog(backendLog) {
  try {
    // Backend format: { created_at, status, message, source: { name } }
    // Frontend format: { date, time, status, message, source }
    const createdAt = new Date(backendLog.created_at);
    
    return {
      date: createdAt.toLocaleDateString("en-CA"), // YYYY-MM-DD format (Canada locale)
      time: createdAt.toLocaleTimeString("en-GB", { hour12: false }), // HH:MM:SS format
      status: backendLog.status,
      message: backendLog.message || "No message",
      source: backendLog.source?.name || "Unknown Source",
    };
  } catch (err) {
    console.error("Error transforming log:", backendLog, err);
    return null;
  }
}

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedDate, setSelectedDate] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Backend stats (separate from client-side filtering)
  const [backendStats, setBackendStats] = useState({
    SUCCESS: 0,
    WARNING: 0,
    ERROR: 0,
    INFO: 0,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 400ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, debouncedSearch, selectedDate]);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      // Add filters if present - backend expects uppercase status
      if (statusFilter !== "All Status") {
        params.append("status", statusFilter.toUpperCase());
      }

      // Search filter
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const data = await requestWithRetry(() =>
        requestJson(`${SYSTEM_LOGS_ENDPOINTS.list}?${params.toString()}`)
      );

      // Normalize backend response - support multiple formats
      let items = [];
      let total = 0;

      // Case 1: { items, total }
      if (Array.isArray(data?.items)) {
        items = data.items;
        total = data.total || data.items.length;
      } 
      // Case 2: { data, count }
      else if (Array.isArray(data?.data)) {
        items = data.data;
        total = data.count || data.data.length;
      } 
      // Case 3: plain array
      else if (Array.isArray(data)) {
        items = data;
        total = data.length;
      } 
      else {
        console.error("Unexpected logs response:", data);
        throw new Error("Invalid logs format from server");
      }

      // Transform backend logs to frontend format
      const transformedLogs = items
        .map(transformBackendLog)
        .filter(Boolean);

      setLogs(transformedLogs);
      setTotalCount(total);

      // Update stats from backend response (backend uses uppercase)
      setBackendStats({
        SUCCESS: data.success_count || 0,
        WARNING: data.warning_count || 0,
        ERROR: data.error_count || 0,
        INFO: data.info_count || 0,
      });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to load system logs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, statusFilter, debouncedSearch]);

  if (!Array.isArray(logs)) {
    return (
      <div className="w-full bg-white px-6 py-10 text-sm text-red-700">
        Unable to load system logs. Please try again.
      </div>
    );
  }

  const filteredLogs = useMemo(() => {
    try {
      if (!Array.isArray(logs)) return [];

      return logs
        .filter(isValidLog)
        .filter((log) => {
          const matchDate =
            !selectedDate ||
            getLocalDateOnly(log.date, log.time) === selectedDate;

          return matchDate;
        });
    } catch (err) {
      console.error("Error filtering logs:", err);
      return [];
    }
  }, [logs, selectedDate]);

  const exportableLogs = useMemo(() => {
    if (!Array.isArray(filteredLogs)) return [];

    return filteredLogs.filter(isValidLog);
  }, [filteredLogs]);

  const exportLogs = () => {
    try {
      setError(null);
      if (exportableLogs.length === 0) {
        alert("No valid logs to export");
        return;
      }
      setLoading(true);

      const blob = new Blob([JSON.stringify(exportableLogs, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `system-logs-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export logs:", err);
      setError("Failed to export logs. Please try again.");
      alert("Failed to export logs. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Use backend stats
  const stats = backendStats;

  const clearAll = async () => {
    if (!confirm("Are you sure you want to clear all logs older than 30 days?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call backend to clear logs older than 30 days
      await requestWithRetry(() =>
        requestJson(SYSTEM_LOGS_ENDPOINTS.clear, {
          method: "DELETE",
        })
      );

      // Refresh logs after clearing
      await fetchLogs(1);
      setCurrentPage(1);
      
      alert("Old logs cleared successfully");
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to clear logs"));
      alert("Failed to clear logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      setNotifications((prev) => {
        const existingIds = prev.map((n) => n.id);

        const newAlerts = logs
          .filter(
            (l) =>
              isValidLog(l) &&
              (l.status === "ERROR" || l.status === "WARNING") &&
              !existingIds.includes(l.date + l.time + l.source)
          )
          .map((l) => ({
            id: l.date + l.time + l.source,
            ...l,
            read: false,
          }));

        if (newAlerts.length > 0) {
          setToast(newAlerts[0]);
          setTimeout(() => setToast(null), 3000);
        }

        return [...newAlerts, ...prev];
      });
    } catch (err) {
      console.error("Error setting notifications:", err);
    }
  }, [logs]);
  
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Use backend total for pagination, not filtered logs length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  
  // Backend already paginates - no need to slice again
  // Apply only client-side filters (date)
  const paginatedLogs = filteredLogs;

  const goToPage = (page) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(next);
  };

  const getPageItems = (total, current) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, idx) => ({
        type: "page",
        value: idx + 1,
      }));
    }

    const items = [];
    const pushPage = (value) => items.push({ type: "page", value });
    const pushDots = (key) => items.push({ type: "dots", key });

    if (current <= 3) {
      pushPage(1);
      pushPage(2);
      pushPage(3);
      pushDots("end");
      pushPage(total);
      return items;
    }

    if (current >= total - 2) {
      pushPage(1);
      pushDots("start");
      pushPage(total - 2);
      pushPage(total - 1);
      pushPage(total);
      return items;
    }

    pushPage(1);
    pushDots("start");
    pushPage(current - 1);
    pushPage(current);
    pushPage(current + 1);
    pushDots("end");
    pushPage(total);
    return items;
  };

  const pageItems = getPageItems(totalPages, safePage);

  return (
    <div className="w-full bg-white">
      {/* ================= HEADER ================= */}
      <header className="w-full bg-white px-4 md:px-8 py-6 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">System Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor system activity and troubleshoot issues
          </p>
        </div>
        <div
          className="relative cursor-pointer self-end sm:self-auto"
          onClick={() => {
            setOpenNotif(!openNotif);
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }}
        >
          <Bell className="text-gray-500" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </header>
      {openNotif && (
        <div className="absolute right-6 top-20 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 font-semibold text-gray-700 border-b">
            Notifications
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notifications</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 border-b last:border-none ${
                    !n.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">{n.status}</div>
                      <div className="text-xs text-gray-500">
                        {n.source} • {n.date}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {n.message || "No details available"}
                      </div>
                    </div>

                    {!n.read && (
                      <button
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((x) =>
                              x.id === n.id ? { ...x, read: true } : x
                            )
                          )
                        }
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Mark
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <main className="bg-[#f7fbfb] px-4 md:px-8 pb-8 pt-6 w-full">
        {loading && (
          <div className="mb-6 text-sm text-gray-500 flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
            Loading system logs...
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          <StatCard
            icon={<CheckCircle className="text-green-500" />}
            value={stats.SUCCESS}
            label="Success"
            bg="bg-green-50"
          />
          <StatCard
            icon={<AlertTriangle className="text-yellow-500" />}
            value={stats.WARNING}
            label="Warnings"
            bg="bg-yellow-50"
          />
          <StatCard
            icon={<XCircle className="text-red-500" />}
            value={stats.ERROR}
            label="Errors"
            bg="bg-red-50"
          />
          <StatCard
            icon={<Info className="text-blue-500" />}
            value={stats.INFO}
            label="Info"
            bg="bg-blue-50"
          />
        </div>
        {/* ================= FILTER BAR ================= */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            {/* SEARCH */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 w-full lg:w-[280px]">
              <Search size={18} className="text-gray-400" />
              <input
                placeholder="Search sources..."
                className="outline-none bg-transparent text-sm w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* STATUS FILTER */}
            <select
              className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm w-full lg:w-[180px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Success</option>
              <option>Warning</option>
              <option>Error</option>
              <option>Info</option>
            </select>

            {/* DATE FILTER */}
            <div className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-sm w-full lg:w-auto">
              <Filter size={18} className="text-gray-500" />
              <input
                type="date"
                className="outline-none text-sm bg-transparent"
                value={selectedDate}
                onChange={(e) => {
                  console.log("DATE PICKED:", e.target.value);
                  setSelectedDate(e.target.value);
                }}
              />
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-4 lg:ml-auto w-full lg:w-auto">
              <button
                onClick={exportLogs}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-5 py-3 text-sm shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Export
              </button>

              <button
                onClick={clearAll}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-5 py-3 text-sm text-red-600 shadow-sm hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          </div>
        </div>
        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
            {/* ===== TABLE HEADER (DESKTOP ONLY) ===== */}
            <thead className="hidden md:table-header-group bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-6 py-4 font-medium">Timestamp</th>
                <th className="text-left px-7 py-4 font-medium">Source</th>
                <th className="text-center px-10 py-4 font-medium">Status</th>
                <th className="text-center px-20 py-4 font-medium">Message</th>
              </tr>
            </thead>

            {/* ===== TABLE BODY ===== */}
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8">
                    <EmptyState
                      title="No logs found"
                      message="Try adjusting filters or check back later."
                    />
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, i) => (
                  <tr
                    key={`${log.date}-${log.time}-${log.source}-${i}`}
                    className="
            border-t
            md:table-row
            flex flex-col md:flex-row
            px-4 py-3 md:p-0
            hover:bg-gray-50
            transition
          "
                  >
                    {/* TIMESTAMP */}
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                      <span className="md:hidden font-semibold text-gray-600">
                        Timestamp:&nbsp;
                      </span>
                      <span>{log.date}</span>
                      <span className="ml-4">{log.time}</span>
                    </td>

                    {/* SOURCE */}
                    <td className="px-6 py-3 font-medium text-gray-800 text-left">
                      <span className="md:hidden font-semibold text-gray-600">
                        Source:&nbsp;
                      </span>
                      {log.source}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-3 text-center">
                      <span className="md:hidden font-semibold text-gray-600">
                        Status:&nbsp;
                      </span>
                      <StatusBadge status={log.status} />
                    </td>

                    {/* MESSAGE */}
                    <td className="px-6 py-3 text-gray-600 text-center">
                      <span className="md:hidden font-semibold text-gray-600">
                        Message:&nbsp;
                      </span>
                      {log.message || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
        {/* ===== PAGINATION ===== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4">
          <div className="text-sm text-gray-500 font-medium">
            Showing {totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1}-
            {Math.min(safePage * pageSize, totalCount)} of{" "}
            {totalCount} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="px-3 py-1.5 text-sm shadow-sm rounded border border-gray-200 bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {pageItems.map((item) => {
                if (item.type === "dots") {
                  return (
                    <span
                      key={item.key}
                      className="w-8 h-8 text-xs text-gray-500 flex items-center justify-center"
                    >
                      ...
                    </span>
                  );
                }

                const page = item.value;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 text-xs rounded border ${
                      page === safePage
                        ? "bg-indigo-600 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 text-sm shadow-sm rounded border border-gray-200 bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </main>
      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-lg px-4 py-3 flex gap-3 items-start z-50">
          <div>
            <div className="font-semibold text-sm">{toast.status}</div>
            <div className="text-xs text-gray-600">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function StatCard({ icon, value, label, bg }) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
      <div className={`p-3 rounded ${bg}`}>{icon}</div>
      <div>
        <div className="text-lg font-semibold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    SUCCESS: "bg-green-100 text-green-600",
    WARNING: "bg-yellow-100 text-yellow-600",
    ERROR: "bg-red-100 text-red-600",
    INFO: "bg-blue-100 text-blue-600",
  };

  const displayMap = {
    SUCCESS: "Success",
    WARNING: "Warning",
    ERROR: "Error",
    INFO: "Info",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${map[status]}`}
    >
      {status === "SUCCESS" && <CheckCircle size={14} />}
      {status === "WARNING" && <AlertTriangle size={14} />}
      {status === "ERROR" && <XCircle size={14} />}
      {status === "INFO" && <Info size={14} />}
      {displayMap[status] || status}
    </span>
  );
}