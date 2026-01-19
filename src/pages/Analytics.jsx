import React,{ useState } from "react";

import {
  Bell,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ExternalLink,
} from "lucide-react";

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

export default function AnalyticsDashboard() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

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

  const handleRefreshData = () => {
    try {
      // duplicate refresh notification block
      const alreadyRefreshing = notifications.some(
        (n) => n.message === "Data refresh in progress"
      );

      if (alreadyRefreshing) return;

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
      }, 2000);
    } catch (error) {
      console.error("Refresh failed:", error);
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
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Analytics & Insights
          </h1>
          <p className="text-sm text-gray-500">
            Power BI integration and performance metrics
          </p>
        </div>
        {/* <Bell className="text-gray-500" /> */}
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="relative">
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
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* LIST */}
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b last:border-b-0 flex gap-3 ${
                        !n.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="mt-1">
                        {n.type === "success" && (
                          <CheckCircle className="text-green-600" size={18} />
                        )}
                        {n.type === "warning" && (
                          <AlertTriangle
                            className="text-yellow-500"
                            size={18}
                          />
                        )}

                        {!["success", "warning"].includes(n.type) && (
                          <AlertTriangle className="text-gray-400" size={18} />
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-800">
                          {n.message || "No message available"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {n.time || "Just now"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="p-6 space-y-6">
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
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
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
          <div className="h-[520px] flex flex-col items-center justify-center text-center px-6">
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
      <footer className="text-center text-xs text-gray-400 py-4">
        © 2026 Your Company. All rights reserved.
      </footer>
    </div>
  );
}
