import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Search,
  Globe,
  Bell,
  BarChart3,
  ScrollText,
  Settings,
  LogOut
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Tenders", path: "/tenders", icon: FileText },
  { name: "Keywords", path: "/keywords", icon: Search },
  { name: "Sources", path: "/sources", icon: Globe },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "System Logs", path: "/system-logs", icon: ScrollText }
];

export default function Sidebar({
  headerTitle = "Tender Intel",
  headerSubtitle = "Intelligent System"
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileName, setProfileName] = useState("Gaurav");
  const [profileEmail, setProfileEmail] = useState("gauravkumar@gmail.com");
  const [headerTitleText, setHeaderTitleText] = useState(headerTitle);
  const [headerSubtitleText, setHeaderSubtitleText] = useState(headerSubtitle);

  useEffect(() => {
    const readProfilePhoto = () => {
      const storedPhoto = localStorage.getItem("profilePhoto");
      setProfilePhoto(storedPhoto || null);
    };

    readProfilePhoto();
    window.addEventListener("profilePhotoUpdated", readProfilePhoto);
    window.addEventListener("storage", readProfilePhoto);

    return () => {
      window.removeEventListener("profilePhotoUpdated", readProfilePhoto);
      window.removeEventListener("storage", readProfilePhoto);
    };
  }, []);

  useEffect(() => {
    const readProfileInfo = () => {
      const storedName = localStorage.getItem("profileName");
      const storedEmail = localStorage.getItem("profileEmail");
      if (storedName) setProfileName(storedName);
      if (storedEmail) setProfileEmail(storedEmail);
    };

    readProfileInfo();
    window.addEventListener("profileInfoUpdated", readProfileInfo);
    window.addEventListener("storage", readProfileInfo);

    return () => {
      window.removeEventListener("profileInfoUpdated", readProfileInfo);
      window.removeEventListener("storage", readProfileInfo);
    };
  }, []);

  useEffect(() => {
    const storedTitle = localStorage.getItem("sidebarHeaderTitle");
    const storedSubtitle = localStorage.getItem("sidebarHeaderSubtitle");

    setHeaderTitleText(storedTitle || headerTitle);
    setHeaderSubtitleText(storedSubtitle || headerSubtitle);
  }, [headerTitle, headerSubtitle]);

  const handleEditHeader = () => {
    const nextTitle = window.prompt("Sidebar title", headerTitleText);
    if (nextTitle !== null) {
      const trimmedTitle = nextTitle.trim();
      const finalTitle = trimmedTitle || headerTitle;
      setHeaderTitleText(finalTitle);
      localStorage.setItem("sidebarHeaderTitle", finalTitle);
    }

    const nextSubtitle = window.prompt("Sidebar subtitle", headerSubtitleText);
    if (nextSubtitle !== null) {
      const trimmedSubtitle = nextSubtitle.trim();
      const finalSubtitle = trimmedSubtitle || headerSubtitle;
      setHeaderSubtitleText(finalSubtitle);
      localStorage.setItem("sidebarHeaderSubtitle", finalSubtitle);
    }
  };

  const handleProfileToggle = () => {
    if (location.pathname === "/profile") {
      navigate("/dashboard");
      return;
    }
    navigate("/profile");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0b1222] text-white flex flex-col">
      {/* ================= LOGO ================= */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* LOGO ICON */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f8cff] to-[#2563eb] flex items-center justify-center shadow-md">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 2L3 14H11L9 22L21 10H13V2Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <button
            type="button"
            onClick={handleEditHeader}
            className="text-left hover:text-red-400 transition"
            aria-label="Edit sidebar header"
          >
            <p className="text-[15px] font-semibold tracking-wide">
              {headerTitleText}
            </p>
            <p className="text-[12px] text-gray-400">
              {headerSubtitleText}
            </p>
          </button>
        </div>
      </div>

      {/* ================= MENU ================= */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `
                group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
                ${
                  isActive
                    ? "bg-[#1e2a44] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.25)]"
                    : "text-gray-300 hover:bg-white/5"
                }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={1.9}
                    className={
                      isActive
                        ? "text-[#4f8cff] drop-shadow-sm"
                        : "text-gray-400 group-hover:text-[#4f8cff]"
                    }
                  />
                  <span
                    className={`text-[14px] font-medium ${
                      isActive ? "text-white" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ================= FOOTER ================= */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleProfileToggle}
          className="flex items-center gap-3 w-full hover:bg-white/5 p-2 rounded-xl transition"
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover shadow"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f8cff] to-[#2563eb] flex items-center justify-center text-white font-semibold shadow">
              G
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-medium">{profileName}</p>
            <p className="text-xs text-gray-400">
              {profileEmail}
            </p>
          </div>
        </button>

        {/* SETTINGS & LOGOUT */}
        <div className="flex items-center justify-center mt-4 px-2 text-[12px] text-gray-400">
          {/* <button className="flex items-center gap-1 hover:text-[#4f8cff] transition">
            <Settings size={14} />
            Settings
          </button> */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1 hover:text-red-400 transition"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
