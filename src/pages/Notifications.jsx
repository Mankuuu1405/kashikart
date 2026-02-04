import React, { useState, useEffect, useRef } from "react";
import { Bell, Mail, Trash2, Clock, Plus, X } from "lucide-react";
import { getErrorMessage, requestJson, requestWithRetry } from "../utils/api";

// API Endpoints
const NOTIFICATION_ENDPOINTS = {
  settings: "/api/notifications/settings",
  list: "/api/notifications",
  unreadCount: "/api/notifications/count/unread",
  markRead: (id) => `/api/notifications/${id}/read`,
  markAllRead: "/api/notifications/mark-all-read",
  delete: (id) => `/api/notifications/${id}`,
  clearAll: "/api/notifications/clear-all",
};

const PRIMARY_BLUE = "#3B82F6";

export default function Notifications() {
  // Settings state
  const [desktop, setDesktop] = useState(true);
  const [email, setEmail] = useState(true);
  const [silent, setSilent] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("07:00");
  
  // Alert triggers state
  const [triggerNewTender, setTriggerNewTender] = useState(true);
  const [triggerKeywordMatch, setTriggerKeywordMatch] = useState(true);
  const [triggerDeadlineApproaching, setTriggerDeadlineApproaching] = useState(true);
  const [triggerSystemErrors, setTriggerSystemErrors] = useState(false);
  
  // UI state
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationMenuRef = useRef(null);

  const safeEmailList = Array.isArray(emailList) ? emailList : [];

  // Fetch notification settings from backend
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.settings)
      );

      if (!data || typeof data !== "object") {
        throw new Error("Invalid notification settings");
      }

      // Update all state from backend response
      setDesktop(Boolean(data.desktop));
      setEmail(Boolean(data.email));
      setSilent(Boolean(data.silent));
      setEmailList(Array.isArray(data.emailList) ? data.emailList : []);
      setStartTime(data.startTime || "22:00");
      setEndTime(data.endTime || "07:00");
      setTriggerNewTender(Boolean(data.trigger_new_tender));
      setTriggerKeywordMatch(Boolean(data.trigger_keyword_match));
      setTriggerDeadlineApproaching(Boolean(data.trigger_deadline_approaching));
      setTriggerSystemErrors(Boolean(data.trigger_system_errors));
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(getErrorMessage(err, "Failed to load notification settings"));
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications list from backend
  const fetchNotifications = async () => {
    try {
      setError(null);
      const data = await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.list)
      );

      if (!data || typeof data !== "object") {
        throw new Error("Invalid notifications format from server");
      }

      setNotifications(Array.isArray(data.items) ? data.items : []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(getErrorMessage(err, "Failed to load notifications"));
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    try {
      const data = await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.unreadCount)
      );
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  // Load settings and notifications on mount
  useEffect(() => {
    fetchSettings();
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notification menu on outside click or ESC
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

  // Add email to list
  const handleAddEmail = () => {
    const trimmedEmail = newEmail.trim();
    if (trimmedEmail && trimmedEmail.includes("@")) {
      setEmailList([...emailList, trimmedEmail]);
      setNewEmail("");
    }
  };

  // Remove email from list
  const handleRemoveEmail = (indexToRemove) => {
    setEmailList(emailList.filter((_, index) => index !== indexToRemove));
  };

  // Save settings to backend
  const handleSaveChanges = async () => {
    setError(null);
    setLoading(true);

    try {
      await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.settings, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            desktop,
            email,
            silent,
            emailList: safeEmailList,
            startTime,
            endTime,
            trigger_new_tender: triggerNewTender,
            trigger_keyword_match: triggerKeywordMatch,
            trigger_deadline_approaching: triggerDeadlineApproaching,
            trigger_system_errors: triggerSystemErrors,
          }),
        })
      );

      // Show success notification
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(getErrorMessage(err, "Failed to save settings"));
    } finally {
      setLoading(false);
    }
  };

  // Toggle notifications dropdown
  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.markAllRead, { method: "POST" })
      );
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Clear all notifications
  const handleClearNotifications = async () => {
    try {
      await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.clearAll, { method: "DELETE" })
      );
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  // Mark single notification as read
  const handleNotificationClick = async (id) => {
    try {
      await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.markRead(id), { method: "PATCH" })
      );
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Delete single notification
  const handleRemoveNotification = async (id) => {
    try {
      await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.delete(id), { method: "DELETE" })
      );
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div className="relative bg-[#F8FAFC] min-h-screen">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-20 bg-[#F8FAFC]">
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h1 className="text-xl font-semibold text-[#0F172A]">
              Notification Settings
            </h1>
            <p className="text-sm text-[#64748B]">
              Configure how you receive alerts
            </p>
          </div>

          {/* Bell Icon with Badge */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              onClick={handleToggleNotifications}
              className="relative p-1.5 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle notifications"
            >
              <Bell size={20} className="text-[#0F172A]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-medium text-white px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
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

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-500 text-center">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id)}
                        className={`flex items-start justify-between gap-2 px-4 py-2 text-xs border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                          n.is_read
                            ? "text-gray-500"
                            : "text-gray-900 font-medium bg-blue-50"
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
              </div>
            )}
          </div>
        </div>
        <div className="h-px bg-[#E2E8F0]" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mx-8 mt-4 text-sm text-gray-500 flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
          Loading...
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* CONTENT — CENTERED */}
      <div className="px-8 py-6 flex justify-center">
        <div className="w-full max-w-[880px] space-y-6">
          {/* Desktop Notifications */}
          <Card>
            <Row
              icon={<Bell size={18} />}
              title="Desktop Notifications"
              desc="Receive real-time browser notifications when new tenders match your keywords"
            >
              <Toggle checked={desktop} onChange={setDesktop} />
            </Row>
          </Card>

          {/* Email Notifications */}
          <Card>
            <Row
              icon={<Mail size={18} />}
              title="Email Notifications"
              desc="Send alert emails to the specified recipients"
            >
              <Toggle checked={email} onChange={setEmail} />
            </Row>

            <p className="mt-4 mb-2 text-sm font-medium text-[#0F172A]">
              Email Recipients
            </p>

            <div className="flex gap-2 mb-3">
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                placeholder="Add email address..."
                className="flex-1 rounded-md border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ "--tw-ring-color": PRIMARY_BLUE }}
              />
              <button
                onClick={handleAddEmail}
                className="rounded-md px-3 text-white hover:opacity-90"
                style={{ backgroundColor: PRIMARY_BLUE }}
                aria-label="Add email"
              >
                <Plus size={18} />
              </button>
            </div>

            {safeEmailList.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-4 py-2.5 mb-2"
              >
                <span className="text-sm text-[#0F172A] font-normal">
                  {item}
                </span>
                <Trash2
                  size={16}
                  className="cursor-pointer text-[#94A3B8] hover:text-red-500"
                  onClick={() => handleRemoveEmail(index)}
                />
              </div>
            ))}
          </Card>

          {/* Alert Triggers */}
          <Card>
            <h3 className="font-medium text-[#0F172A] mb-1">
              Alert Triggers
            </h3>
            <p className="text-sm text-[#64748B] mb-4">
              Choose which events trigger notifications
            </p>

            <label className="flex items-center gap-3 py-1 text-sm text-[#0F172A]">
              <input
                type="checkbox"
                checked={triggerNewTender}
                onChange={(e) => setTriggerNewTender(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: PRIMARY_BLUE }}
              />
              New tender published
            </label>
            
            <label className="flex items-center gap-3 py-1 text-sm text-[#0F172A]">
              <input
                type="checkbox"
                checked={triggerKeywordMatch}
                onChange={(e) => setTriggerKeywordMatch(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: PRIMARY_BLUE }}
              />
              Keyword match found
            </label>
            
            <label className="flex items-center gap-3 py-1 text-sm text-[#0F172A]">
              <input
                type="checkbox"
                checked={triggerDeadlineApproaching}
                onChange={(e) => setTriggerDeadlineApproaching(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: PRIMARY_BLUE }}
              />
              Deadline approaching (7 days)
            </label>
            
            <label className="flex items-center gap-3 py-1 text-sm text-[#0F172A]">
              <input
                type="checkbox"
                checked={triggerSystemErrors}
                onChange={(e) => setTriggerSystemErrors(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: PRIMARY_BLUE }}
              />
              System errors or fetch failures
            </label>
          </Card>

          {/* Silent Hours */}
          <Card>
            <Row
              icon={<Clock size={18} />}
              title="Silent Hours"
              desc="Pause notifications during specified hours"
            >
              <Toggle checked={silent} onChange={setSilent} />
            </Row>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <FigmaTimeInput label="Start Time" value={startTime} onChange={setStartTime} />
              <FigmaTimeInput label="End Time" value={endTime} onChange={setEndTime} />
            </div>
          </Card>

          {/* Save Button */}
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="w-full rounded-md py-3 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            {loading ? "Saving..." : "✓ Save Changes"}
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {showSaveNotification && (
        <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[320px] z-50 border border-gray-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-[#0F172A]">Settings saved</h4>
            <p className="text-sm text-[#64748B] mt-0.5">Your notification preferences have been updated.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI HELPER COMPONENTS ---------- */

function Card({ children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_rgba(16,24,40,0.1)]">
      {children}
    </div>
  );
}

function Row({ icon, title, desc, children }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-[#0F172A]">{title}</h3>
        <p className="text-sm text-[#64748B]">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition"
      style={{ backgroundColor: checked ? PRIMARY_BLUE : "#CBD5E1" }}
      aria-label={`Toggle ${checked ? "on" : "off"}`}
    >
      <span
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function FigmaTimeInput({ label, value, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = React.useRef(null);

  const handleClockClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.showPicker?.();
      }
    }, 0);
  };

  const handleTimeChange = (e) => {
    onChange(e.target.value);
    setIsEditing(false);
  };

  return (
    <div>
      <p className="mb-1 text-sm text-[#64748B]">{label}</p>
      <div className="relative flex items-center justify-between rounded-md border border-[#E2E8F0] bg-white px-3 py-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="time"
            value={value}
            onChange={handleTimeChange}
            onBlur={() => setIsEditing(false)}
            className="text-sm text-[#0F172A] outline-none w-full"
          />
        ) : (
          <>
            <span className="text-sm text-[#0F172A]">{value}</span>
            <Clock 
              size={16} 
              className="text-[#94A3B8] cursor-pointer hover:text-[#64748B]" 
              onClick={handleClockClick}
            />
          </>
        )}
      </div>
    </div>
  );
}