import React, { useState } from "react";
import { Bell, Mail, Trash2, Clock, Plus } from "lucide-react";

const PRIMARY_BLUE = "#3B82F6";

export default function Notifications() {
  const [desktop, setDesktop] = useState(true);
  const [email, setEmail] = useState(true);
  const [silent, setSilent] = useState(true);
  const [emailList, setEmailList] = useState(["john.doe@company.com", "tender.team@company.com"]);
  const [newEmail, setNewEmail] = useState("");
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("07:00");
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  const handleAddEmail = () => {
    if (newEmail.trim() && newEmail.includes("@")) {
      setEmailList([...emailList, newEmail.trim()]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (indexToRemove) => {
    setEmailList(emailList.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveChanges = () => {
    setShowSaveNotification(true);
    setTimeout(() => {
      setShowSaveNotification(false);
    }, 3000);
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
          <div className="relative">
            <Bell size={20} className="text-[#0F172A]" />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-medium text-white">
              3
            </span>
          </div>
        </div>
        <div className="h-px bg-[#E2E8F0]" />
      </div>

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

            {[
              "New tender published",
              "Keyword match found",
              "Deadline approaching (7 days)",
              "System errors or fetch failures",
            ].map((label, i) => (
              <label
                key={label}
                className="flex items-center gap-3 py-1 text-sm text-[#0F172A]"
              >
                <input
                  type="checkbox"
                  defaultChecked={i !== 3}
                  className="h-4 w-4"
                  style={{ accentColor: PRIMARY_BLUE }}
                />
                {label}
              </label>
            ))}
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

          <button
            onClick={handleSaveChanges}
            className="w-full rounded-md py-3 text-sm font-medium text-white"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            ✓ Save Changes
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