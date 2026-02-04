import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  FileText,
  Target,
  Globe,
  Bell,
  X,
  TrendingUp,
  Search,
  RefreshCw,
  Eye,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { getErrorMessage, requestJson, requestWithRetry } from "../utils/api";

const VALID_TENDER_STATUS = ["new", "viewed", "saved"];
const USE_MOCK_ATTACHMENTS = true;

const DASHBOARD_ENDPOINTS = {
  stats: "/api/dashboard/stats",
  recentTenders: "/api/dashboard/recent-tenders",
  sourceStatus: "/api/dashboard/source-status",

  tenderDetail: (id) => `/api/tenders/${id}`,
  tenderUpdate: (id) => `/api/tenders/${id}`,
};


const INITIAL_NOTIFICATIONS = [
  { id: 1, message: "New tender added from SAM.gov", isRead: false },
  { id: 2, message: "Tender deadline approaching (5 days left)", isRead: false },
  { id: 3, message: "Source DHS Contract is in warning state", isRead: true },
];

function isValidSearch(value) {
  if (!value) return true;
  if (value.length > 50) return false;
  return /^[a-zA-Z0-9\s.-]+$/.test(value);
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function safeStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return VALID_TENDER_STATUS.includes(normalized) ? normalized : "viewed";
}

function isValidTender(tender) {
  if (!tender) return false;
  if (!VALID_TENDER_STATUS.includes(safeStatus(tender.status))) return false;
  if (typeof tender.title !== "string" || tender.title.trim() === "") return false;
  if (typeof tender.reference_id !== "string" || tender.reference_id.trim() === "") return false;
  return true;
}

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [activeActionsId, setActiveActionsId] = useState(null);

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [tenderList, setTenderList] = useState([]);
  const [topKeywords, setTopKeywords] = useState([]);
  const [sources, setSources] = useState([]);
  const [lastSyncAt, setLastSyncAt] = useState("—");
  const [nextSyncIn, setNextSyncIn] = useState("—");
  const [stats, setStats] = useState({
    newTendersToday: 0,
    keywordMatches: 0,
    activeSources: { active: 0, total: 0 },
    alertsToday: 0,
    trendNewTenders: 0,
    trendKeywords: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const notificationMenuRef = useRef(null);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [statsData, tendersData, sourcesData] = await Promise.all([
        requestWithRetry(() => requestJson(DASHBOARD_ENDPOINTS.stats)),
        requestWithRetry(() => requestJson(`${DASHBOARD_ENDPOINTS.recentTenders}?limit=50`)),
        requestWithRetry(() => requestJson(DASHBOARD_ENDPOINTS.sourceStatus)),
      ]);

      // Update stats
      if (statsData) {
        setStats({
          newTendersToday: statsData.new_tenders_today || 0,
          keywordMatches: statsData.keyword_matches_today || 0,
          activeSources: {
            active: statsData.active_sources || 0,
            total: statsData.total_sources || 0,
          },
          alertsToday: statsData.alerts_today || 0,
          trendNewTenders: statsData.new_tenders_change || 0,
          trendKeywords: statsData.keyword_matches_change || 0,
        });

        // Update top keywords
        if (statsData.top_keywords && Array.isArray(statsData.top_keywords)) {
          setTopKeywords(
            statsData.top_keywords.map((kw, index) => ({
              rank: index + 1,
              name: kw.keyword,
              matches: kw.matches,
              color: kw.matches > 15 ? "green" : kw.matches > 10 ? "gray" : "red",
            }))
          );
        }
      }

      // Update tenders
      if (Array.isArray(tendersData)) {
        const mappedTenders = tendersData.map((tender) => ({
          id: tender.id,
          title: tender.title,
          code: tender.reference_id,
          agency: tender.agency_name || "N/A",
          location: tender.agency_location || "N/A",
          source: tender.source_name || "Unknown",
          deadline: tender.deadline_date
            ? new Date(tender.deadline_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A",
          daysLeft: tender.days_until_deadline
            ? `${tender.days_until_deadline} days left`
            : "—",
          status: safeStatus(tender.status),
          keywords: tender.matched_keywords
            ? tender.matched_keywords.split(",").map((k) => k.trim())
            : [],
          attachments: tender.attachments || [],
          description: tender.description || "No description available",
          source_url: tender.source_url,
        }));
        setTenderList(mappedTenders);
      }

      // Update sources
      if (Array.isArray(sourcesData)) {
        const mappedSources = sourcesData.map((source) => ({
          name: source.name,
          status: source.status || "UNKNOWN",
          count: `${source.tenders_today || 0} new today`,
          color:
            source.status === "ACTIVE"
              ? "green"
              : source.status === "WARNING"
              ? "orange"
              : "red",
        }));
        setSources(mappedSources);
      }

      // Update sync info
      const now = new Date();
      setLastSyncAt(
        now.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      setNextSyncIn("30 minutes");
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(getErrorMessage(err, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredTenders = useMemo(() => {
    if (!Array.isArray(tenderList)) return [];

    const validTenders = tenderList.filter(isValidTender);
    if (!normalizedSearch) return validTenders;
    if (!isValidSearch(searchQuery)) return validTenders;

    return validTenders.filter((tender) => {
      const title = tender.title?.toLowerCase() || "";
      const code = tender.code?.toLowerCase() || "";
      const agency = tender.agency?.toLowerCase() || "";
      const location = tender.location?.toLowerCase() || "";
      const source = tender.source?.toLowerCase() || "";
      const keywords = safeArray(tender.keywords).map((k) =>
        String(k || "").toLowerCase()
      );

      return (
        title.includes(normalizedSearch) ||
        code.includes(normalizedSearch) ||
        agency.includes(normalizedSearch) ||
        location.includes(normalizedSearch) ||
        source.includes(normalizedSearch) ||
        keywords.some((k) => k.includes(normalizedSearch))
      );
    });
  }, [tenderList, normalizedSearch, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tenderList]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleMarkAllRead = () => {
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (id) => {
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleRemoveNotification = (id) => {
    setNotifications((list) => list.filter((n) => n.id !== id));
  };

  const totalPages = Math.max(1, Math.ceil(filteredTenders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTenders = filteredTenders.slice(startIndex, endIndex);

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

  const getStatusBadgeClasses = (status) => {
    switch (safeStatus(status)) {
      case "new":
        return "bg-green-100 text-green-800";
      case "viewed":
        return "bg-gray-100 text-gray-600";
      case "saved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getDaysLeftClass = (daysText) => {
    const days = parseInt(daysText, 10);
    if (Number.isNaN(days)) return "text-gray-500";
    return "text-gray-500";
  };

  const getKeywordBadgeClasses = (color) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "gray":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getSourceDotColor = (color) => {
    switch (color) {
      case "green":
        return "bg-green-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSourceStatusColor = (color) => {
    switch (color) {
      case "green":
        return "text-green-600";
      case "orange":
        return "text-orange-600";
      case "red":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const updateTenderStatus = async (tenderId, status) => {
    try {
      // Update locally first
      setTenderList((prev) =>
        prev.map((tender) =>
          tender.id === tenderId ? { ...tender, status } : tender
        )
      );
      setSelectedTender((prev) =>
        prev?.id === tenderId ? { ...prev, status } : prev
      );

      // Update on backend
      await requestJson(DASHBOARD_ENDPOINTS.tenderUpdate(tenderId), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Failed to update tender status:", err);
      // Revert on error
      fetchDashboard();
    }
  };

  const handleViewTender = async (tender) => {
    try {
      // Fetch full tender details
      const tenderData = await requestWithRetry(() =>
        requestJson(DASHBOARD_ENDPOINTS.tenderDetail(tender.id))
      );

      const mappedTender = {
        id: tenderData.id,
        title: tenderData.title,
        code: tenderData.reference_id,
        agency: tenderData.agency_name || "N/A",
        location: tenderData.agency_location || "N/A",
        source: tenderData.source_name || "Unknown",
        deadline: tenderData.deadline_date
          ? new Date(tenderData.deadline_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A",
        daysLeft: tenderData.days_until_deadline
          ? `${tenderData.days_until_deadline} days left`
          : "—",
        status: safeStatus(tenderData.status),
        keywords: tenderData.matched_keywords
          ? tenderData.matched_keywords.split(",").map((k) => k.trim())
          : [],
        attachments: tenderData.attachments || [],
        description: tenderData.description || "No description available",
        source_url: tenderData.source_url,
      };

      setSelectedTender(mappedTender);

      // Auto-update status to viewed if it was new
      if (tenderData.status === "new") {
        updateTenderStatus(tender.id, "viewed");
      }
    } catch (err) {
      console.error("Failed to fetch tender details:", err);
      setError(getErrorMessage(err, "Failed to load tender details"));
    }
  };

  const handleToggleSave = (tender) => {
    const nextStatus = tender.status === "saved" ? "viewed" : "saved";
    updateTenderStatus(tender.id, nextStatus);
  };

  const handleAttachmentOpen = (attachment) => {
    if (!attachment) return;

    if (!USE_MOCK_ATTACHMENTS && attachment.url) {
      window.open(attachment.url, "_blank", "noopener,noreferrer");
      return;
    }

    const content = `Mock attachment: ${attachment.name}\nGenerated for UI preview.`;
    const blob = new Blob([content], { type: "text/plain" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = attachment.name || "attachment.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleSyncNow = async () => {
    await fetchDashboard();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
              <p className="text-xs text-gray-500">
                Monitor your tender opportunities
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search tenders..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidSearch(value)) {
                      setSearchQuery(value);
                    }
                  }}
                  className="w-full md:w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div className="text-xs text-gray-500">Last sync: {lastSyncAt}</div>

              <button
                onClick={handleSyncNow}
                disabled={loading}
                className="flex items-center gap-4 px-5 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-blue-400 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={18}
                  className={`text-gray-900 font-bold ${loading ? "animate-spin" : ""}`}
                />
                Sync Now
              </button>

              <div className="relative" ref={notificationMenuRef}>
                <button
                  onClick={handleToggleNotifications}
                  className="relative p-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                >
                  <Bell size={18} className="text-gray-600" />

                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <span className="text-sm font-semibold">Notifications</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          disabled={unreadCount === 0}
                          className={`text-[11px] ${
                            unreadCount === 0
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          Mark all
                        </button>
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          disabled={notifications.length === 0}
                          className={`text-[11px] ${
                            notifications.length === 0
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-red-500 hover:text-red-600"
                          }`}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-500 text-center">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n.id)}
                          className={`flex items-start justify-between gap-2 px-4 py-2 text-xs border-b last:border-b-0 cursor-pointer ${
                            n.isRead
                              ? "text-gray-500"
                              : "text-gray-900 font-medium"
                          }`}
                        >
                          <span className="flex-1">{n.message}</span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveNotification(n.id);
                            }}
                            className="text-gray-400 hover:text-red-500"
                            title="Remove notification"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mx-6 mt-4 bg-green-100 border border-green-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-green-900">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-sm font-semibold">
              System is active and monitoring
            </span>
          </div>
          <div className="text-sm text-green-700">Next sync in {nextSyncIn}</div>
        </div>

        {loading && (
          <div className="mx-6 mt-4 text-sm text-gray-500 flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
            Loading dashboard...
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">New Tenders Today</p>
                <div className="text-3xl font-bold mt-1">
                  {stats.newTendersToday}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp size={12} />
                  {stats.trendNewTenders}% from yesterday
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Keyword Matches</p>
                <div className="text-3xl font-bold mt-1">
                  {stats.keywordMatches}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp size={12} />
                  {stats.trendKeywords}% from yesterday
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Search className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Sources</p>
                <div className="text-3xl font-bold mt-1">
                  {stats.activeSources.active}/{stats.activeSources.total}
                </div>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Globe className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Alerts Today</p>
                <div className="text-3xl font-bold mt-1">
                  {stats.alertsToday}
                </div>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 md:px-6 mt-6">
          {/* Recent Tenders */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Tenders
              </h3>

              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                {filteredTenders.filter((t) => t.status === "new").length} new
                today
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold uppercase">
                        Tender
                      </th>
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Agency
                      </th>
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Sources
                      </th>
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Deadline
                      </th>
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Keywords
                      </th>
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTenders.map((tender) => (
                      <tr
                        key={tender.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-3 py-10">
                          <div className="font-medium text-gray-900 text-sm truncate max-w-xs">
                            {tender.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {tender.code}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-gray-900 text-xs">
                            {tender.agency}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {tender.location}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-semibold text-xs">
                          {tender.source}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-xs">
                            {tender.deadline}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${getDaysLeftClass(
                              tender.daysLeft
                            )}`}
                          >
                            {tender.daysLeft}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusBadgeClasses(
                              tender.status
                            )}`}
                          >
                            {tender.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            {safeArray(tender.keywords).slice(0, 2).map((keyword, idx) => (
                              <span
                                key={`${tender.id}-kw-${idx}`}
                                className="bg-gray-100 px-3 py-1 rounded-full text-xs"
                              >
                                {keyword}
                              </span>
                            ))}
                            {tender.keywords.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{tender.keywords.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="relative flex items-center justify-center gap-3 text-gray-500">
                            <Eye
                              size={16}
                              className="hover:text-gray-900 cursor-pointer"
                              onClick={() => handleViewTender(tender)}
                            />

                            <Bookmark
                              size={16}
                              className={`hover:text-gray-900 cursor-pointer ${
                                tender.status === "saved" ? "fill-current text-blue-600" : ""
                              }`}
                              onClick={() => handleToggleSave(tender)}
                            />
                            <MoreHorizontal
                              size={16}
                              className="hover:text-gray-900 cursor-pointer"
                              onClick={() =>
                                setActiveActionsId((prev) =>
                                  prev === tender.id ? null : tender.id
                                )
                              }
                            />
                            {activeActionsId === tender.id && (
                              <div className="absolute mt-10 right-6 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                                <button
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                                  onClick={() => {
                                    handleViewTender(tender);
                                    setActiveActionsId(null);
                                  }}
                                >
                                  View details
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                                  onClick={() => {
                                    updateTenderStatus(tender.id, "viewed");
                                    setActiveActionsId(null);
                                  }}
                                >
                                  Mark as viewed
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                                  onClick={() => {
                                    updateTenderStatus(tender.id, "new");
                                    setActiveActionsId(null);
                                  }}
                                >
                                  Mark as new
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedTenders.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-sm text-gray-500"
                        >
                          No tenders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4">
              <div className="text-sm text-gray-500 font-medium">
                Showing {filteredTenders.length === 0 ? 0 : startIndex + 1}-
                {Math.min(endIndex, filteredTenders.length)} of{" "}
                {filteredTenders.length} results
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
          </div>

          {/* Top Keywords */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Top Keywords
              </h3>
              <TrendingUp size={16} className="text-gray-400" />
            </div>
            <div className="p-4 space-y-10">
              {topKeywords.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-4">
                  No keywords data available
                </div>
              ) : (
                topKeywords.map((keyword) => (
                  <div
                    key={keyword.rank}
                    className="flex items-center justify-between mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium text-xs">
                        {keyword.rank}.
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {keyword.name}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getKeywordBadgeClasses(
                        keyword.color
                      )}`}
                    >
                      {keyword.matches} matches
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Source Status Overview */}
        <div className="px-6 pb-6 mt-4">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold">
                Source Status Overview
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
              {sources.length === 0 ? (
                <div className="col-span-full text-center text-sm text-gray-500 py-4">
                  No sources configured
                </div>
              ) : (
                sources.map((source, idx) => (
                  <div
                    key={`${source.name}-${idx}`}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${getSourceDotColor(
                          source.color
                        )}`}
                      ></div>
                      <span
                        className={`text-xs font-semibold uppercase ${getSourceStatusColor(
                          source.color
                        )}`}
                      >
                        {source.status}
                      </span>
                    </div>
                    <div className="font-medium text-gray-900 text-xs">
                      {source.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {source.count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= OVERLAY ================= */}
      {selectedTender && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"></div>
      )}

      {selectedTender && (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transition-transform duration-300">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b">
            <div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full uppercase ${getStatusBadgeClasses(
                  selectedTender.status
                )}`}
              >
                {selectedTender.status}
              </span>
              <h2 className="text-lg font-semibold mt-2">
                {selectedTender.title}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {selectedTender.code}
              </p>
            </div>

            <button
              onClick={() => setSelectedTender(null)}
              className="text-gray-400 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 text-sm overflow-y-auto h-[calc(100%-100px)]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Agency</p>
                <p className="font-medium">{selectedTender.agency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium">{selectedTender.location}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Source</p>
                <p className="font-medium">{selectedTender.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="font-medium">{selectedTender.deadline}</p>
                <p className="text-xs text-gray-500">{selectedTender.daysLeft}</p>
              </div>
            </div>

            {/* Keywords */}
            {selectedTender.keywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Keyword Matches</p>
                <div className="flex flex-wrap gap-2">
                  {safeArray(selectedTender.keywords).map((k, i) => (
                    <span
                      key={`${selectedTender.id}-kw-${i}`}
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {selectedTender.description}
              </p>
            </div>

            {/* Attachments */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Attachments</p>
              <div className="space-y-2">
                {safeArray(selectedTender.attachments).length === 0 ? (
                  <div className="border border-dashed rounded-lg p-3 text-xs text-gray-500">
                    No attachments available
                  </div>
                ) : (
                  safeArray(selectedTender.attachments).map((attachment) => (
                    <button
                      key={attachment.name}
                      type="button"
                      className="w-full text-left border rounded-lg p-3 text-xs hover:bg-gray-50"
                      onClick={() => handleAttachmentOpen(attachment)}
                    >
                      📎 {attachment.name}
                      {attachment.size ? ` • ${attachment.size}` : ""}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Button */}
            {selectedTender.source_url && (
              <a
                href={selectedTender.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm mt-4 text-center"
              >
                View on {selectedTender.source}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;