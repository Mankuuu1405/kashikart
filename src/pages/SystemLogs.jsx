import React from "react";
// import { useMemo, useState } from "react";
import { useMemo, useState, useEffect } from "react";
// import axios from "axios";

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

const VALID_STATUS = ["Success", "Warning", "Error", "Info"];

/* ================= MOCK DATA ================= */
const INITIAL_LOGS = [
  {
    date: "2026-01-01",
    time: "08:30:00",
    source: "SAM.gov",
    status: "Success",
    message: "Successfully fetched 24 new tenders",
  },
  {
    date: "2026-01-02",
    time: "08:30:00",
    source: "DOT Portal",
    status: "Success",
    message: "Successfully fetched 24 new tenders",
  },
  {
    date: "2026-01-03",
    time: "12:30:00",
    source: "VA Procurement",
    status: "Success",
    message: "Successfully fetched 24 new tenders",
  },
  {
    date: "2026-01-04",
    time: "08:30:00",
    source: "EPA Portal",
    status: "Warning",
    message: "Fetched with warnings - some pages unavailable",
  },
  {
    date: "2026-01-05",
    time: "05:30:00",
    source: "SAM.gov",
    status: "Error",
    message: "Failed to fetch - connection timeout",
  },
  {
    date: "2026-01-03",
    time: "08:30:00",
    source: "DOT Portal",
    status: "Info",
    message: "Scheduled sync started",
  },
  {
    date: "2026-01-01",
    time: "23:30:00",
    source: "VA Procurement",
    status: "Info",
    message: "System maintenance completed",
  },
];

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

  // if (typeof log.date !== "string" || typeof log.time !== "string")
  //   return false;
  if (!isValidDate(log.date)) return false;

  return true;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedDate, setSelectedDate] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);
  const [toast, setToast] = useState(null);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  //   const fetchLogs = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);

  //     const res = await axios.get("/api/system-logs");
  //     //  backend endpoint

  //     if (!Array.isArray(res.data)) {
  //       throw new Error("Invalid logs format from server");
  //     }

  //     setLogs(res.data);
  //   } catch (err) {
  //     console.error(err);
  //     setError(
  //       err.response?.data?.message ||
  //         err.message ||
  //         "Failed to load system logs"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchLogs();
  // }, []);

  if (!Array.isArray(logs)) return;

  const filteredLogs = useMemo(() => {
    try {
      if (!Array.isArray(logs)) return [];

      const safeSearch = search.trim().toLowerCase();

      const safeStatus =
        statusFilter === "All Status" || isValidStatus(statusFilter)
          ? statusFilter
          : "All Status";

      return logs
        .filter(isValidLog) //  MOST IMPORTANT
        .filter((log) => {
          // empty search → allow all
          if (!safeSearch) return true;

          const source = log.source?.toLowerCase() || "";
          const message = log.message?.toLowerCase() || "";

          return source.includes(safeSearch) || message.includes(safeSearch);
        })
        .filter((log) => {
          const matchStatus =
            safeStatus === "All Status" || log.status === safeStatus;

          const matchDate =
            !selectedDate ||
            getLocalDateOnly(log.date, log.time) === selectedDate;

          return matchStatus && matchDate;
        });
    } catch (err) {
      console.error("Error filtering logs:", err);
      return [];
    }
  }, [logs, search, statusFilter, selectedDate]);

  const exportableLogs = useMemo(() => {
    if (!Array.isArray(filteredLogs)) return [];

    return filteredLogs.filter(isValidLog);
  }, [filteredLogs]);

  const exportLogs = () => {
    try {
      if (exportableLogs.length === 0) {
        alert("No valid logs to export");
        return;
      }

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
      alert("Failed to export logs. See console for details.");
    }
  };

  const stats = useMemo(() => {
    const validLogs = logs.filter(isValidLog);
    const count = (s) => validLogs.filter((l) => l.status === s).length;
    return {
      Success: count("Success"),
      Warning: count("Warning"),
      Error: count("Error"),
      Info: count("Info"),
    };
  }, [logs]);

  const clearAll = () => setLogs([]);

  useEffect(() => {
    try {
      setNotifications((prev) => {
        const existingIds = prev.map((n) => n.id);

        const newAlerts = logs

          .filter(
            (l) =>
              isValidLog(l) &&
              (l.status === "Error" || l.status === "Warning") &&
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
        {/* <Bell className="text-gray-400 self-end sm:self-auto" /> */}
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
                      {/* <div className="text-sm text-gray-700 mt-1">
                        {n.message}
                      </div> */}

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
        {/* {loading && (
          <div className="mb-6 text-sm text-gray-500 flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
            Loading system logs...
          </div>
        )}
        :
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )} */}
        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          <StatCard
            icon={<CheckCircle className="text-green-500" />}
            value={stats.Success}
            label="Success"
            bg="bg-green-50"
          />
          <StatCard
            icon={<AlertTriangle className="text-yellow-500" />}
            value={stats.Warning}
            label="Warnings"
            bg="bg-yellow-50"
          />
          <StatCard
            icon={<XCircle className="text-red-500" />}
            value={stats.Error}
            label="Errors"
            bg="bg-red-50"
          />
          <StatCard
            icon={<Info className="text-blue-500" />}
            value={stats.Info}
            label="Info"
            bg="bg-blue-50"
          />
        </div>
        {/* ================= FILTER BAR ================= */}
        {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-8"> */}
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
              // className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm w-full lg:w-[180px]"
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
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-5 py-3 text-sm shadow-sm hover:bg-gray-50 transition"
              >
                <Download size={18} />
                Export
              </button>

              <button
                onClick={clearAll}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-5 py-3 text-sm text-red-600 shadow-sm hover:bg-red-50 transition"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          </div>
        </div>
        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
              {filteredLogs.map((log, i) => (
                <tr
                  key={i}
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
                    {/* {log.message} */}
                    {log.message || "—"}
                    {log.source || "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ===== FOOTER TEXT ===== */}
        <div className="px-2 py-4 text-sm text-gray-500 font-medium">
          Showing {filteredLogs.length} of {logs.length} logs
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
    Success: "bg-green-100 text-green-600",
    Warning: "bg-yellow-100 text-yellow-600",
    Error: "bg-red-100 text-red-600",
    Info: "bg-blue-100 text-blue-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${map[status]}`}
    >
      {status === "Success" && <CheckCircle size={14} />}
      {status === "Warning" && <AlertTriangle size={14} />}
      {status === "Error" && <XCircle size={14} />}
      {status === "Info" && <Info size={14} />}
      {status}
    </span>
  );
}
