import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import { getErrorMessage, requestJson, requestWithRetry } from "../utils/api";

import {
  Bell,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ExternalLink,
  X,
} from "lucide-react";

// NOTE BACKEND: mock notifications ko backend se replace karna hai
const initialNotifications = [
  {
    id: 1,
    type: "success",
    message: "Power BI connected successfully",
    time: "2 mins ago",
    read: false,
  },
  {
    id: 2,
    type: "warning",
    message: "3 tender sources failed to sync",
    time: "10 mins ago",
    read: false,
  },
];

const tenderCategories = [
  { name: "Information Technology", value: 72 },
  { name: "Construction", value: 64 },
  { name: "Healthcare", value: 51 },
  { name: "Services", value: 43 },
  { name: "Environmental", value: 35 },
];

const tenderSources = [
  { name: "SAM.gov", value: 78 },
  { name: "DoD Contracts", value: 62 },
  { name: "DOT Portal", value: 55 },
  { name: "VA Procurement", value: 40 },
  { name: "DHS Contracts", value: 32 },
];

const stats = [
  {
    value: "2487",
    title: "Total Tenders (30 d)",

    icon: <TrendingUp className="text-blue-600 shadow-sm" />,
    bg: "bg-blue-100",
  },
  {
    title: "Keyword Matches",
    value: "423",
    icon: <BarChart3 className="text-green-600 shadow-sm" />,
    bg: "bg-green-100",
  },
  {
    title: "Fetch Success Rate",
    value: "98.2%",
    icon: <CheckCircle className="text-blue-600 shadow-sm" />,
    bg: "bg-blue-100",
  },
  {
    title: "Source Errors",
    value: "3",
    icon: <AlertTriangle className="text-yellow-500 shadow-sm" />,
    bg: "bg-yellow-100",
  },
];

const USE_MOCK_ANALYTICS = true; // TODO BACKEND: API live hote hi false, mock hata dena
const ANALYTICS_ENDPOINTS = {
  refresh: "/api/analytics/refresh", // TODO BACKEND: yahi endpoint use hoga
};

const NotificationItem = memo(function NotificationItem({
  notification,
  onClick,
  onRemove,
}) {
  return (
    <div
      onClick={() => onClick(notification.id)}
      className={`px-4 py-3 border-b last:border-b-0 flex gap-3 ${
        !notification.read ? "bg-blue-50" : ""
      }`}
    >
      <div className="mt-1">
        {notification.type === "success" && (
          <CheckCircle className="text-green-600" size={18} />
        )}
        {notification.type === "warning" && (
          <AlertTriangle className="text-yellow-500" size={18} />
        )}
        {!["success", "warning"].includes(notification.type) && (
          <AlertTriangle className="text-gray-400" size={18} />
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm text-gray-800">
          {notification.message || "No message available"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {notification.time || "Just now"}
        </p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(notification.id);
        }}
        className="text-gray-400 hover:text-red-500 transition"
      >
        <X size={16} />
      </button>
    </div>
  );
});

export default function AnalyticsDashboard() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const notificationMenuRef = useRef(null);

  // const openPowerBI = () => {
  //   try {
  //     window.open("https://powerbi.microsoft.com", "_blank");
  //   } catch (error) {
  //     console.error("Power BI open failed", error);
  //     alert("Unable to open Power BI dashboard");
  //   }
  // };

  // future POwer BI API k liye

  //   const openPowerBI = (url) => {
  //   if (!url) return alert("Dashboard URL not available");

  //   try {
  //     window.open(url, "_blank");
  //   } catch {
  //     alert("Unable to open dashboard");
  //   }
  // };

  const handleRefreshData = useCallback(() => {
    try {
      // duplicate refresh notification block
      const alreadyRefreshing = notifications.some(
        (n) => n.message === "Data refresh in progress"
      );

      if (alreadyRefreshing) return;
      setLoading(true);
      setError(null);

      //  show refreshing notification
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "info",
          message: "Data refresh in progress",
          time: "Just now",
          read: false,
        },
        ...prev,
      ]);

      if (USE_MOCK_ANALYTICS) {
        //  simulate API call
        setTimeout(() => {
          setNotifications((prev) => {
            // remove "in progress"
            const filtered = prev.filter(
              (n) => n.message !== "Data refresh in progress"
            );

            return [
              {
                id: Date.now() + 1,
                type: "success",
                message: "Data refreshed successfully",
                time: "Just now",
                read: false,
              },
              ...filtered,
            ];
          });
          setLoading(false);
        }, 2000);
        return;
      }

      // TODO BACKEND: real refresh call yaha se hoga
      requestWithRetry(() =>
        requestJson(ANALYTICS_ENDPOINTS.refresh, { method: "POST" })
      )
        .then(() => {
          setNotifications((prev) => {
            const filtered = prev.filter(
              (n) => n.message !== "Data refresh in progress"
            );
            return [
              {
                id: Date.now() + 1,
                type: "success",
                message: "Data refreshed successfully",
                time: "Just now",
                read: false,
              },
              ...filtered,
            ];
          });
        })
        .catch((error) => {
          console.error("Refresh failed:", error);
          setError(getErrorMessage(error, "Failed to refresh analytics data."));
          setNotifications((prev) => [
            {
              id: Date.now() + 2,
              type: "error",
              message: "Failed to refresh data",
              time: "Just now",
              read: false,
            },
            ...prev,
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error("Refresh failed:", error);
      setError("Failed to refresh analytics data.");
      setLoading(false);
      setNotifications((prev) => [
        {
          id: Date.now() + 2,
          type: "error",
          message: "Failed to refresh data",
          time: "Just now",
          read: false,
        },
        ...prev,
      ]);
    }
  }, [notifications]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleToggleNotifications = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotificationClick = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleRemoveNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <div className="min-h-full bg-gray-50">
      {/* HEADER */}
      <header className="flex flex-col gap-3 px-4 py-4 border-b sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Analytics & Insights
          </h1>
          <p className="text-sm text-gray-500">
            Power BI integration and performance metrics
          </p>
        </div>
        {/* <Bell className="text-gray-500" /> */}
        <div className="relative" ref={notificationMenuRef}>
          <button onClick={handleToggleNotifications} className="relative">
            <Bell className="text-gray-600" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center rounded-full bg-red-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white border rounded-xl shadow-lg z-50">
              {/* HEADER */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="font-semibold text-gray-800">Notifications</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className={`text-xs ${
                      unreadCount === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-blue-600 hover:underline"
                    }`}
                  >
                    Mark all
                  </button>
                  <button
                    onClick={clearNotifications}
                    disabled={notifications.length === 0}
                    className={`text-xs ${
                      notifications.length === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-red-500 hover:underline"
                    }`}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* LIST */}
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClick={handleNotificationClick}
                      onRemove={handleRemoveNotification}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {loading && (
        <div className="mx-4 mt-4 text-sm text-gray-500 flex items-center gap-2 sm:mx-6">
          <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
          Loading analytics...
        </div>
      )}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:mx-6">
          {error}
        </div>
      )}

      <main className="p-4 space-y-6 sm:p-6">
        {/* POWER BI STATUS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border rounded-xl p-7 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                Power BI Connected
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Last data sync: January 1, 2026 at 8:30 AM
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-blue-300 font-semibold bg-gray-50">
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, i) => (
            <div
              key={i}
              className="bg-white border rounded-lg p-4 flex items-center gap-4 shadow-lg"
            >
              {/* <div className="p-2  bg-gray-100 rounded-md">{item.icon}</div> */}

              <div className={`p-2 rounded-md ${item.bg}`}>{item.icon}</div>

              <div>
                {/* <p className="text-lg font-bold text-gray-800">{item.value} </p>
                <p className="text-sm text-gray-500">{item.title}</p> */}

                <p className="text-lg font-bold text-gray-800">
                  {item.value ?? "--"}
                </p>
                <p className="text-sm text-gray-500">
                  {item.title ?? "Unknown"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* POWER BI DASHBOARD */}
        {/* POWER BI DASHBOARD SECTION */}
        <div className="bg-gray-50 border rounded-xl overflow-hidden">
          {/* TOP BAR */}
          <div className="flex items-center justify-between px-4 py-4 border-b bg-white sm:px-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              <p className="font-semibold text-gray-800">
                Tender Analytics Dashboard
              </p>
            </div>

            <button
              // onClick={openPowerBI}

              //future Power Bi k liye button

              //  onClick={() => openPowerBI(powerBiUrl)}>

              className="flex items-center gap-2 text-sm border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-100 font-semibold"
            >
              <ExternalLink size={14} />
              Open in Power BI
            </button>
          </div>

          {/* EMBED PLACEHOLDER AREA */}
          <div className="h-[360px] flex flex-col items-center justify-center text-center px-6 sm:h-[520px]">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <BarChart3 className="text-blue-400" />
            </div>

            <p className="font-medium text-gray-700 mb-1">Power BI Dashboard</p>

            <p className="text-sm text-gray-500 max-w-md mb-5">
              Your Power BI dashboard will be embedded here showing tender
              trends, sources performance, keyword analytics, and more.
            </p>

            <button className="bg-blue-600 text-white text-sm px-5 py-2 rounded-md hover:bg-blue-700">
              Configure Power BI Integration
            </button>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SOURCE */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-4">
              Tenders by source (Top 5)
            </h3>

            {tenderSources.map((source, i) => (
              // const safeValue = Math.min(100, Math.max(0, source.value || 0));

              <div key={i} className="mb-3">
                <div className="flex justify-between mb-1">
                  <p className="text-sm text-gray-600">{source.name}</p>
                  <span className="text-xs text-gray-500">{source.value}%</span>

                  {/* <span className="text-xs text-gray-500">{safeValue}%</span> */}
                </div>

                <div className="h-2 bg-gray-100 rounded">
                  <div
                    className="h-2 bg-blue-600 rounded"
                    style={{ width: `${source.value}%` }}
                    // style={{ width: `${safeValue}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* CATEGORY */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-4">
              Tenders by Category
            </h3>

            {tenderCategories.map((category, i) => (
              // const safeValue = Math.min(100, Math.max(0, source.value || 0));

              <div key={i} className="mb-3">
                <div className="flex justify-between mb-1">
                  <p className="text-sm text-gray-600">{category.name}</p>
                  <span className="text-xs text-gray-500">
                    {category.value}%
                    {/* <span className="text-xs text-gray-500">{safeValue}%</span> */}
                  </span>
                </div>

                <div className="h-2 bg-gray-100 rounded">
                  <div
                    className="h-2 bg-green-600 rounded"
                    style={{ width: `${category.value}%` }}
                    // style={{ width: `${safeValue}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      {/* <footer className="text-center text-xs text-gray-400 py-4">
        © 2026 Your Company. All rights reserved.
      </footer> */}
    </div>
  );
}
