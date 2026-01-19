import React, { useState } from "react";
import {
  FileText,
  Target,
  Globe,
  Bell,
  TrendingUp,
  Search,
  RefreshCw,
  Eye,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);

  //validation

  const isValidSearch = (value) => {
    if (!value) return true; // empty allowed
    if (value.length > 50) return false;
    return /^[a-zA-Z0-9\s.-]+$/.test(value);
  };

  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  const safeStatus = (status) =>
    ["NEW", "VIEWED", "SAVED"].includes(status) ? status : "VIEWED";

  const notifications = [
    {
      id: 1,
      message: "New tender added from SAM.gov",
      isRead: false,
    },
    {
      id: 2,
      message: "Tender deadline approaching (5 days left)",
      isRead: false,
    },
    {
      id: 3,
      message: "Source DHS Contract is in warning state",
      isRead: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const tenders = [
    {
      id: 1,
      title: "IT Infrastructure Modernization for federal facilities",
      code: "GSA-2026-IT-C01",
      agency: "General Service Administration (GSA)",
      location: "Washington DC",
      source: "SAM.gov",
      deadline: "FEB 15, 2026",
      daysLeft: "38 Days left",
      status: "NEW",
      keywords: ["IT Infrastructure", "Modernization"],
    },
    {
      id: 2,
      title: "Highway Construction Project - Interstate 95 Ex...",
      code: "DOT-HWY-2026-042",
      agency: "Department of Transportation",
      location: "Virginia",
      source: "DOT Portal",
      deadline: "Jan 30, 2026",
      daysLeft: "17 days left",
      status: "VIEWED",
      keywords: ["Construction", "Highway"],
    },
    {
      id: 3,
      title: "Healthcare Equipment Procurement - Medical I..",
      code: "VA-MED-2026-10",
      agency: "Veterans Affairs",
      location: "Multiple Locations",
      source: "VA Procurement",
      deadline: "Feb 28, 2026",
      daysLeft: "46 days left",
      status: "NEW",
      keywords: ["Healthcare", "Medical Equipment"],
    },
    {
      id: 4,
      title: "Cybersecurity Services - Federal Network Protectio",
      code: "DHS-CYBER-2026-015",
      agency: "Department of Homeland Security",
      location: "Remote/DC",
      source: "DHS Contracts",
      deadline: "Mar 1, 2026",
      daysLeft: "47 days left",
      status: "SAVED",
      keywords: ["Cybersecurity", "IT"],
    },
    {
      id: 5,
      title: "Building Renovation - Federal Courthouse",
      code: "GSA-CONST-2026-087",
      agency: "General Service Administration (GSA)",
      location: "New York, NY",
      source: "SAM.gov",
      deadline: "Jan 25, 2026",
      daysLeft: "12 days left",
      status: "NEW",
      keywords: ["Construction", "Renovation"],
    },
  ];

  const topKeywords = [
    { rank: 1, name: "IT Infrastructure", matches: 24, color: "green" },
    { rank: 2, name: "Cybersecurity", matches: 18, color: "green" },
    { rank: 3, name: "Construction", matches: 16, color: "red" },
    { rank: 4, name: "Healthcare", matches: 12, color: "green" },
    { rank: 5, name: "Software Development", matches: 9, color: "gray" },
  ];

  const sources = [
    {
      name: "SAM.gov",
      status: "ACTIVE",
      count: "53 new today",
      color: "green",
    },
    {
      name: "DOT portal",
      status: "ACTIVE",
      count: "8 new today",
      color: "green",
    },
    {
      name: "VA Procurement",
      status: "ACTIVE",
      count: "5 new today",
      color: "green",
    },
    {
      name: "DHS Contract",
      status: "WARNING",
      count: "3 new today",
      color: "orange",
    },
    { name: "EPA portal", status: "ERROR", count: "0 new today", color: "red" },
    {
      name: "DoD Connect",
      status: "ACTIVE",
      count: "12 new today",
      color: "green",
    },
  ];

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredTenders = tenders.filter((tender) => {
    if (!normalizedSearch) return true;

    return (
      tender.title.toLowerCase().includes(normalizedSearch) ||
      tender.code.toLowerCase().includes(normalizedSearch) ||
      tender.agency.toLowerCase().includes(normalizedSearch) ||
      tender.location.toLowerCase().includes(normalizedSearch) ||
      tender.source.toLowerCase().includes(normalizedSearch) ||
      // tender.keywords.some((keyword) =>

      (Array.isArray(tender.keywords) &&
        tender.keywords.some((keyword) =>
          keyword.toLowerCase().includes(normalizedSearch)
        ))
      // keyword.toLowerCase().includes(normalizedSearch)
    );
  });

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "NEW":
        return "bg-green-100 text-green-800";
      case "VIEWED":
        return "bg-gray-100 text-gray-600";
      case "SAVED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getDaysLeftClass = (daysText) => {
    const days = parseInt(daysText);
    if (days <= 10) return "text-gray-500";
    if (days <= 30) return "text-gray-500";
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
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
            {/* <div className="flex items-center gap-3"> */}

            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search size={16} />
                </span>

                <input
                  type="text"
                  placeholder="Search tenders..."
                  value={searchQuery}
                  // onChange={(e) => setSearchQuery(e.target.value)}

                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidSearch(value)) {
                      setSearchQuery(value);
                    }
                  }}
                  // className="w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  className="w-full md:w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                />
              </div>
              <div className="text-xs text-gray-500">
                Last sync: 2026-01-01 08:30 AM
              </div>
              <button className="flex items-center gap-4 px-5 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-blue-400 text-sm font-semibold">
                {/* <span>🔄</span> */}
                <RefreshCw size={18} className="text-gray-900 font-bold" />
                Sync Now
              </button>
              <button
                // onClick={() => setShowNotifications((prev) => !prev)}

                onClick={() => {
                  try {
                    setShowNotifications((prev) => !prev);
                  } catch (error) {
                    console.error("Notification toggle error:", error);
                  }
                }}
                className="relative p-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
              >
                {/* 🔔 */}

                <Bell size={18} className="text-gray-600" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-2 md:right-6 top-14 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold">
                    Notifications
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-500 text-center">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-2 text-xs border-b last:border-b-0 ${
                          n.isRead
                            ? "text-gray-500"
                            : "text-gray-900 font-medium"
                        }`}
                      >
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
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
          <div className="text-sm text-green-700">Next sync in 23 minutes</div>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-4 gap-4 px-6 mt-6 min-h-[140px] flex flex-col"> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 mt-6">
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> */}
          {/* <div className="bg-white p-6 min-h-[140px] rounded-xl"> */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">New Tenders Today</p>
                <div className="text-3xl font-bold mt-1">52</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp size={12} />
                  12% from yesterday
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Keyword Matches */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Keyword Matches</p>
                <div className="text-3xl font-bold mt-1">18</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp size={12} />
                  8% from yesterday
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Search className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Active Sources */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Sources</p>
                <div className="text-3xl font-bold mt-1">56/62</div>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Globe className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-center shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Alerts Today</p>
                <div className="text-3xl font-bold mt-1">7</div>
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
            {/* <div className="flex items-center justify-between px-5 py-4 border-b"> */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Tenders
              </h3>

              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                5 new today
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {/* <thead className="bg-gray-50"> */}
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"> */}
                      <th className="px-5 py-4 text-left font-semibold uppercase">
                        Tender
                      </th>
                      {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"> */}
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Agency
                      </th>
                      {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"> */}
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Sources
                      </th>
                      {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"> */}
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Deadline
                      </th>
                      {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"> */}
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Status
                      </th>
                      {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"> */}
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Keywords
                      </th>
                      {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"> */}
                      <th className="px-5 py-3 text-left font-semibold uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* {tenders.map((tender) => ( */}

                    {filteredTenders.map((tender) => (
                      <tr
                        key={tender.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-3 py-10">
                          {/* <div className="font-medium text-gray-900 text-xs"> */}
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
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClasses(
                              tender.status
                            )}`}
                          >
                            {tender.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(tender.keywords) &&
                              tender.keywords.map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 px-3 py-1 rounded-full text-xs"
                                >
                                  {keyword}
                                </span>
                              ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-3 text-gray-500">
                            <Eye
                              size={16}
                              className="hover:text-gray-900 cursor-pointer"
                              // onClick={() => setSelectedTender(tender)}

                              onClick={() => {
                                try {
                                  if (!tender || !tender.id) {
                                    throw new Error("Invalid tender data");
                                  }
                                  setSelectedTender(tender);
                                } catch (error) {
                                  console.error(
                                    "Tender selection failed:",
                                    error
                                  );
                                  alert(
                                    "Something went wrong. Please try again."
                                  );
                                }
                              }}
                            />

                            <Bookmark
                              size={16}
                              className="hover:text-gray-900 cursor-pointer"
                            />
                            <MoreHorizontal
                              size={16}
                              className="hover:text-gray-900 cursor-pointer"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* </div> */}

          {/* Top Keywords */}
          {/* <div className="bg-white border border-gray-200 rounded-lg"> */}

          {/* <div className="col-span-4 bg-white border border-gray-200 rounded-xl"> */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Top Keywords
              </h3>
              <TrendingUp size={16} className="text-gray-400" />
            </div>
            {/* <div className="p-4"> */}
            <div className="p-4 space-y-10">
              {topKeywords.map((keyword) => (
                <div
                  key={keyword.rank}
                  className="flex items-center justify-between mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium text-xs">
                      {keyword.rank}.
                    </span>
                    {/* <span className="text-gray-900 text-xs"> */}
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
              ))}
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
            {/* <div className="grid grid-cols-6 gap-3 p-4"> */}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
              {sources.map((source, idx) => (
                <div
                  key={idx}
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
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* ================= OVERLAY ================= */}

      {selectedTender && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"></div>
      )}

      {selectedTender && (
        // <div className="fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl transition-transform duration-300">

        <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transition-transform duration-300">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b">
            <div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                New
              </span>
              <h2 className="text-lg font-semibold mt-2">
                {selectedTender.title}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {selectedTender.code}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedTender(null)}
              className="text-gray-400 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 text-sm">
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
              </div>
            </div>

            {/* Keywords */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Keyword Matches</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(selectedTender.keywords) &&
                  selectedTender.keywords.map((k, i) => (
                    <span
                      key={i}
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs"
                    >
                      {k}
                    </span>
                  ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                Seeking qualified contractors for comprehensive IT
                infrastructure modernization across federal facilities
                nationwide.
              </p>
            </div>

            {/* Attachments */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Attachments</p>
              <div className="space-y-2">
                <div className="border rounded-lg p-3 text-xs hover:bg-gray-50 cursor-pointer">
                  📄 RFP_Document.pdf
                </div>
                <div className="border rounded-lg p-3 text-xs hover:bg-gray-50 cursor-pointer">
                  📄 Technical_Requirements.pdf
                </div>
              </div>
            </div>

            {/* Button */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm mt-4">
              View on SAM.gov
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
