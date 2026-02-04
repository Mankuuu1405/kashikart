import React, { useState, useEffect, useRef } from "react";
import { Bell, Mail, Trash2, Clock, Plus, X } from "lucide-react";
import { getErrorMessage, requestJson, requestWithRetry } from "../utils/api";

const PRIMARY_BLUE = "#3B82F6";

export default function Notifications() {
  // Settings State
  const [desktop, setDesktop] = useState(true);
  const [email, setEmail] = useState(true);
  const [silent, setSilent] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("07:00");

  // Alert Triggers State
  const [newTenderPublished, setNewTenderPublished] = useState(true);
  const [keywordMatchFound, setKeywordMatchFound] = useState(true);
  const [deadlineApproaching, setDeadlineApproaching] = useState(true);
  const [systemErrors, setSystemErrors] = useState(false);

  // UI State
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationMenuRef = useRef(null);

  // ============================================
  // FETCH SETTINGS FROM BACKEND
  // ============================================
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await requestWithRetry(() =>
        requestJson("/api/notifications/settings")
      );

      // Map backend response to state
      setDesktop(data.enable_desktop ?? true);
      setEmail(data.enable_email ?? true);
      setSilent(data.enable_silent_hours ?? false);
      setEmailList(data.email_recipients ?? []);
      setStartTime(data.silent_start_time ?? "22:00");
      setEndTime(data.silent_end_time ?? "07:00");
      
      setNewTenderPublished(data.new_tender_published ?? true);
      setKeywordMatchFound(data.keyword_match_found ?? true);
      setDeadlineApproaching(data.deadline_approaching ?? true);
      setSystemErrors(data.system_errors ?? false);

    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to load notification settings"));
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FETCH NOTIFICATIONS (For /notifications page)
  // ============================================
  const fetchNotifications = async () => {
    try {
      setError(null);

      const data = await requestWithRetry(() =>
        requestJson("/api/notifications/page/notifications?page=1&page_size=25")
      );

      // Backend returns: { total, unread_count, items }
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);

    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to load notifications"));
    }
  };

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    fetchSettings();
    fetchNotifications();
  }, []);

  // ============================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ============================================
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

  // ============================================
  // EMAIL MANAGEMENT
  // ============================================
  const handleAddEmail = () => {
    if (newEmail.trim() && newEmail.includes("@")) {
      setEmailList([...emailList, newEmail.trim()]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (indexToRemove) => {
    setEmailList(emailList.filter((_, index) => index !== indexToRemove));
  };

  // ============================================
  // SAVE SETTINGS
  // ============================================
  const handleSaveChanges = async () => {
    try {
      setError(null);
      setLoading(true);

      const payload = {
        enable_desktop: desktop,
        enable_email: email,
        enable_silent_hours: silent,
        email_recipients: emailList,
        silent_start_time: startTime,
        silent_end_time: endTime,
        new_tender_published: newTenderPublished,
        keyword_match_found: keywordMatchFound,
        deadline_approaching: deadlineApproaching,
        system_errors: systemErrors,
      };

      await requestWithRetry(() =>
        requestJson("/api/notifications/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      setShowSaveNotification(true);
      setTimeout(() => {
        setShowSaveNotification(false);
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to save settings"));
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // NOTIFICATION ACTIONS
  // ============================================
  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await requestWithRetry(() =>
        requestJson("/api/notifications/mark-all-read", {
          method: "POST",
        })
      );

      // Update local state
      setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to mark all as read"));
    }
  };

  const handleClearNotifications = () => {
    // TODO: Add backend endpoint if you want to delete all
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotificationClick = async (id) => {
    try {
      await requestWithRetry(() =>
        requestJson(`/api/notifications/${id}/read`, {
          method: "PATCH",
        })
      );

      // Update local state
      setNotifications((list) =>
        list.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveNotification = async (id) => {
    try {
      await requestWithRetry(() =>
        requestJson(`/api/notifications/${id}`, {
          method: "DELETE",
        })
      );

      // Update local state
      const wasUnread = notifications.find((n) => n.id === id)?.is_read === false;
      setNotifications((list) => list.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to delete notification"));
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

          {/* Bell + badge */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              onClick={handleToggleNotifications}
              className="relative p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <Bell size={20} className="text-[#0F172A]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-medium text-white">
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
                      className={`flex items-start justify-between gap-2 px-4 py-2 text-xs border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        n.is_read
                          ? "text-gray-500"
                          : "text-gray-900 font-medium bg-blue-50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-[11px] mb-0.5">
                          {n.title}
                        </div>
                        <div className="text-[10px] text-gray-600">
                          {n.message}
                        </div>
                      </div>
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
        <div className="h-px bg-[#E2E8F0]" />
      </div>

      {loading && (
        <div className="mx-8 mt-4 text-sm text-gray-500 flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
          Loading notification settings...
        </div>
      )}
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
              >
                <Plus size={18} />
              </button>
            </div>

            {emailList.map((item, index) => (
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
                checked={newTenderPublished}
                onChange={(e) => setNewTenderPublished(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: PRIMARY_BLUE }}
              />
              New tender published
            </label>

            <label className="flex items-center gap-3 py-1 text-sm text-[#0F172A]">
              <input
                type="checkbox"
                checked={keywordMatchFound}
                onChange={(e) => setKeywordMatchFound(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: PRIMARY_BLUE }}
              />
              Keyword match found
            </label>

            <label className="flex items-center gap-3 py-1 text-sm text-[#0F172A]">
              <input
                type="checkbox"
                checked={deadlineApproaching}
                onChange={(e) => setDeadlineApproaching(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: PRIMARY_BLUE }}
              />
              Deadline approaching (7 days)
            </label>

            <label className="flex items-center gap-3 py-1 text-sm text-[#0F172A]">
              <input
                type="checkbox"
                checked={systemErrors}
                onChange={(e) => setSystemErrors(e.target.checked)}
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

            {silent && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <FigmaTimeInput label="Start Time" value={startTime} onChange={setStartTime} />
                <FigmaTimeInput label="End Time" value={endTime} onChange={setEndTime} />
              </div>
            )}
          </Card>

          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="w-full rounded-md py-3 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            {loading ? "Saving..." : "✓ Save Changes"}
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
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

/* ---------- UI HELPERS ---------- */

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