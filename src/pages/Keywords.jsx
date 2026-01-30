import React, { useState, useEffect, useRef } from "react";
import { Bell, BellOff, Plus, Pencil, Trash2, X } from "lucide-react";
import { EmptyState } from "../components/States";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function Keywords() {
  const [keywords, setKeywords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [predefinedCategories, setPredefinedCategories] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [editForm, setEditForm] = useState({ 
    keyword: "", 
    category: "", 
    priority: "high", 
    alerts: true 
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [newKeyword, setNewKeyword] = useState({ 
    keyword: "", 
    category: "", 
    priority: "high" 
  });
  
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showEditCategoryInput, setShowEditCategoryInput] = useState(false);
  const [editCategoryInput, setEditCategoryInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationMenuRef = useRef(null);

  const getAuthToken = () => {
    return localStorage.getItem("access_token");
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/keywords/categories`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setPredefinedCategories(data.predefined || []);
      setCategories(data.all || []);
      
      // Set default category for new keyword form if available
      if (data.all && data.all.length > 0 && !newKeyword.category) {
        setNewKeyword(prev => ({ ...prev, category: data.all[0] }));
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Fetch keywords
  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError("Please log in to view keywords");
        window.location.href = "/login";
        return;
      }

      // Get all keywords without pagination for this view
      const response = await fetch(`${API_BASE_URL}/api/keywords?page=1&size=100`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch keywords");
      }

      const data = await response.json();
      setKeywords(data.items || []);

    } catch (err) {
      console.error("Error fetching keywords:", err);
      setError(err.message || "Failed to load keywords");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchKeywords();
    fetchNotifications();
  }, []);

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

  const handleEdit = (item) => {
    setEditingKeyword(item);
    setEditForm({ 
      keyword: item.keyword, 
      category: item.category, 
      priority: item.priority, 
      alerts: item.enable_alerts 
    });
    setShowEditCategoryInput(false);
    setEditCategoryInput("");
    setShowEditModal(true);
  };

  const handleAdd = async () => {
    if (!newKeyword.keyword.trim()) {
      setError("Keyword is required");
      return;
    }
    if (!newKeyword.category.trim()) {
      setError("Category is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/keywords`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: newKeyword.keyword.trim(),
          category: newKeyword.category.trim(),
          priority: newKeyword.priority.toLowerCase(),
          enable_alerts: alertsEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add keyword");
      }

      setSuccessMessage("Keyword added successfully!");
      setShowModal(false);
      setNewKeyword({ 
        keyword: "", 
        category: categories[0] || "", 
        priority: "high" 
      });
      setAlertsEnabled(true);
      setShowCategoryInput(false);
      setNewCategoryInput("");
      
      fetchKeywords();
      fetchCategories();

    } catch (err) {
      console.error("Error adding keyword:", err);
      setError(err.message || "Failed to add keyword");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editForm.keyword.trim()) {
      setError("Keyword is required");
      return;
    }
    if (!editForm.category.trim()) {
      setError("Category is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/keywords/${editingKeyword.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: editForm.keyword.trim(),
          category: editForm.category.trim(),
          priority: editForm.priority.toLowerCase(),
          enable_alerts: editForm.alerts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update keyword");
      }

      setSuccessMessage("Keyword updated successfully!");
      setShowEditModal(false);
      setEditingKeyword(null);
      
      fetchKeywords();
      fetchCategories();

    } catch (err) {
      console.error("Error updating keyword:", err);
      setError(err.message || "Failed to update keyword");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
  setLoading(true);
  setError(null);
  setSuccessMessage(null);

  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/keywords/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to delete keyword");
    }

    fetchKeywords();

  } catch (err) {
    console.error("Error deleting keyword:", err);
    setError(err.message || "Failed to delete keyword");
  } finally {
    setLoading(false);
  }
};


  const toggleAlert = async (keyword) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/keywords/${keyword.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enable_alerts: !keyword.enable_alerts,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to toggle alerts");
      }

      fetchKeywords();

    } catch (err) {
      console.error("Error toggling alerts:", err);
      setError(err.message || "Failed to toggle alerts");
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      const token = getAuthToken();
      
      await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const token = getAuthToken();
      
      await fetch(`${API_BASE_URL}/api/notifications/clear`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const handleNotificationClick = async (id) => {
    try {
      const token = getAuthToken();
      
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotifications((list) =>
        list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleRemoveNotification = async (id) => {
    try {
      const token = getAuthToken();
      
      await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotifications((list) => list.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error removing notification:", err);
    }
  };

  const addCategory = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    return trimmed;
  };

  const removeCategory = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) return;
    if (categories.length <= 1) return;

    const remaining = categories.filter((category) => category !== trimmed);
    const fallback = remaining[0];

    setCategories(remaining);

    if (newKeyword.category === trimmed) {
      setNewKeyword({ ...newKeyword, category: fallback });
    }

    if (editForm.category === trimmed) {
      setEditForm({ ...editForm, category: fallback });
    }

    setShowCategoryInput(false);
    setNewCategoryInput("");
    setShowEditCategoryInput(false);
    setEditCategoryInput("");
  };

  // Filter keywords based on search term
  const safeKeywords = Array.isArray(keywords) ? keywords : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const filteredKeywords = safeKeywords.filter((item) =>
    item.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Get priority display name
  const getPriorityDisplay = (priority) => {
    if (!priority) return "Medium";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Get priority class
  const getPriorityClass = (priority) => {
    const p = priority?.toLowerCase() || "medium";
    if (p === "high") return "bg-red-100 text-red-600";
    if (p === "medium") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-600";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-gray-50 border-b border-gray-200">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Keyword Management</h1>
            <p className="text-sm text-gray-500">Configure keywords for intelligent tender matching</p>
          </div>
          <div className="relative" ref={notificationMenuRef}>
            <button
              onClick={handleToggleNotifications}
              className="relative p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1.5">
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
        <div className="px-8 pb-4 flex items-center justify-between">
          <input 
            placeholder="Search keywords..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
          >
            <Plus size={16} />
            Add Keyword
          </button>
        </div>
      </div>

      {loading && keywords.length === 0 && (
        <div className="mx-8 mt-4 text-sm text-gray-500 flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></span>
          Loading keywords...
        </div>
      )}
      
      {error && (
        <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mx-8 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-6 px-6 py-3 text-sm text-gray-500 font-medium bg-gray-50">
            <div>Keyword</div>
            <div>Category</div>
            <div>Priority</div>
            <div>Alerts</div>
            <div>Created</div>
            <div className="text-right">Actions</div>
          </div>

          {filteredKeywords.length > 0 ? (
            filteredKeywords.map((item) => (
              <div key={item.id} className="grid grid-cols-6 px-6 py-4 items-center border-t border-gray-100 text-sm">
                <div className="font-medium text-gray-900">{item.keyword}</div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{item.category}</span>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs ${getPriorityClass(item.priority)}`}>
                    {getPriorityDisplay(item.priority)}
                  </span>
                </div>
                <div>
                  {item.enable_alerts ? (
                    <div 
                      onClick={() => toggleAlert(item)}
                      className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center cursor-pointer hover:bg-green-200 transition-colors"
                    >
                      <Bell className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div 
                      onClick={() => toggleAlert(item)}
                      className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <BellOff className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="text-gray-600">{formatDate(item.created_at)}</div>
                <div className="flex justify-end gap-4">
                  <Pencil 
                    className="w-4 h-4 text-gray-500 cursor-pointer hover:text-blue-500" 
                    onClick={() => handleEdit(item)} 
                  />
                  <Trash2 
                    className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-600" 
                    onClick={() => handleDelete(item.id)} 
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8">
              <EmptyState
                title="No keywords found"
                message={searchTerm ? "No keywords match your search. Try different keywords." : "Add your first keyword to start monitoring tenders."}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
          <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">Add New Keyword</h2>
                <p className="text-sm text-gray-500">Add a new keyword to monitor for matching tenders.</p>
              </div>
              <X
                className="cursor-pointer text-gray-400"
                onClick={() => {
                  setShowModal(false);
                  setNewKeyword({ keyword: "", category: categories[0] || "", priority: "high" });
                  setAlertsEnabled(true);
                  setShowCategoryInput(false);
                  setNewCategoryInput("");
                }}
              />
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Keyword</label>
                <input 
                  value={newKeyword.keyword}
                  onChange={(e) => setNewKeyword({...newKeyword, keyword: e.target.value})}
                  placeholder="Enter keyword..." 
                  className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Category</label>
                  <button
                    type="button"
                    onClick={() => removeCategory(newKeyword.category)}
                    disabled={!newKeyword.category || categories.length <= 1}
                    className={`inline-flex items-center gap-1 text-xs ${
                      !newKeyword.category || categories.length <= 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-red-500 hover:text-red-600"
                    }`}
                    title="Remove selected category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
                <select 
                  value={newKeyword.category}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected === "__add_new__") {
                      setShowCategoryInput(true);
                      setNewKeyword({ ...newKeyword, category: "" });
                      return;
                    }
                    setShowCategoryInput(false);
                    setNewCategoryInput("");
                    setNewKeyword({ ...newKeyword, category: selected });
                  }}
                  className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  {safeCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="__add_new__">+ Add new category</option>
                </select>
                {showCategoryInput && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const added = addCategory(newCategoryInput);
                        if (added) {
                          setNewKeyword({ ...newKeyword, category: added });
                          setShowCategoryInput(false);
                          setNewCategoryInput("");
                        }
                      }}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select 
                  value={newKeyword.priority}
                  onChange={(e) => setNewKeyword({...newKeyword, priority: e.target.value})}
                  className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-medium text-gray-900">Enable Alerts</span>
                <button 
                  type="button" 
                  onClick={() => setAlertsEnabled(!alertsEnabled)} 
                  className={`w-11 h-6 rounded-full relative transition ${alertsEnabled ? "bg-blue-500" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${alertsEnabled ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewKeyword({ keyword: "", category: categories[0] || "", priority: "high" });
                  setAlertsEnabled(true);
                  setShowCategoryInput(false);
                  setNewCategoryInput("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Keyword"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
          <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">Edit Keyword</h2>
                <p className="text-sm text-gray-500">Update the keyword configuration below.</p>
              </div>
              <X
                className="cursor-pointer text-gray-400"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingKeyword(null);
                  setShowEditCategoryInput(false);
                  setEditCategoryInput("");
                }}
              />
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Keyword</label>
                <input 
                  value={editForm.keyword} 
                  onChange={(e) => setEditForm({...editForm, keyword: e.target.value})} 
                  placeholder="Enter keyword..." 
                  className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Category</label>
                  <button
                    type="button"
                    onClick={() => removeCategory(editForm.category)}
                    disabled={!editForm.category || categories.length <= 1}
                    className={`inline-flex items-center gap-1 text-xs ${
                      !editForm.category || categories.length <= 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-red-500 hover:text-red-600"
                    }`}
                    title="Remove selected category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
                <select
                  value={editForm.category}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected === "__add_new__") {
                      setShowEditCategoryInput(true);
                      setEditForm({ ...editForm, category: "" });
                      return;
                    }
                    setShowEditCategoryInput(false);
                    setEditCategoryInput("");
                    setEditForm({ ...editForm, category: selected });
                  }}
                  className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {safeCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="__add_new__">+ Add new category</option>
                </select>
                {showEditCategoryInput && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={editCategoryInput}
                      onChange={(e) => setEditCategoryInput(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const added = addCategory(editCategoryInput);
                        if (added) {
                          setEditForm({ ...editForm, category: added });
                          setShowEditCategoryInput(false);
                          setEditCategoryInput("");
                        }
                      }}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select 
                  value={editForm.priority} 
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})} 
                  className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-medium text-gray-900">Enable Alerts</span>
                <button 
                  type="button" 
                  onClick={() => setEditForm({...editForm, alerts: !editForm.alerts})} 
                  className={`w-11 h-6 rounded-full relative transition ${editForm.alerts ? "bg-blue-500" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${editForm.alerts ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingKeyword(null);
                  setShowEditCategoryInput(false);
                  setEditCategoryInput("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Keyword"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}