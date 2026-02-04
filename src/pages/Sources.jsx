import React from "react";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ExternalLink,
  Globe,
  Lock,
  RefreshCw,
  Edit,
  Bell,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";


const SOURCE_ENDPOINTS = {
  list: "/api/sources/",
  stats: "/api/sources/stats",
  create: "/api/sources/",
  update: (id) => `/api/sources/${id}`,
  delete: (id) => `/api/sources/${id}`,
  toggle: (id) => `/api/sources/${id}/toggle`,
  refresh: (id) => `/api/sources/${id}/refresh`,
};

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('access_token');

// Helper for API requests
const requestJson = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export default function Sources() {
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    disabled: 0,
    errors: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [refreshingSource, setRefreshingSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);


  const [formData, setFormData] = useState({
    name: "",
    url: "",
    loginRequired: false,
    password: "",
    excelPath: "",
  });

  // Fetch sources on component mount and when search changes
  useEffect(() => {
  setCurrentPage(1);
}, [searchQuery]);

useEffect(() => {
  fetchSources();
  fetchStats();
}, [currentPage]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params with pagination
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: "50", // Get more items per page
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const data = await requestJson(`/api/sources/?${params.toString()}`);

      // Transform backend data to match frontend format
      const transformedSources = data.items.map((source) => ({
        id: source.id,
        name: source.name,
        url: source.url,
        login: source.login_required ? "Required" : "Public",
        status: source.status,
        lastFetch: source.last_fetch_at
  ? new Date(source.last_fetch_at).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(",", "")
  : "Never",
        tenders: source.tender_count || 0,
        isPublic: !source.login_required,
        isEnabled: source.is_active,
        excelPath: source.excel_path,
      }));

      setSources(transformedSources);
    } catch (err) {
      setError(err.message || "Failed to fetch sources");
      console.error("Error fetching sources:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await requestJson("/api/sources/stats");
      setStats({
        total: data.total_sources,
        active: data.active_sources,
        disabled: data.disabled_sources,
        errors: data.error_sources,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "ERROR":
      return "bg-red-100 text-red-700";
    case "DISABLED":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newSourceData = {
        name: formData.name,
        url: formData.url,
        login_required: formData.loginRequired,
        password: formData.password || undefined,
        excel_path: formData.excelPath || undefined,
      };

      await requestJson("/api/sources/", {
        method: "POST",
        body: JSON.stringify(newSourceData),
      });

      setSuccessMessage("Source created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setIsModalOpen(false);
      setFormData({
        name: "",
        url: "",
        loginRequired: false,
        password: "",
        excelPath: "",
      });

      // Refresh the list
      await fetchSources();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to create source");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      url: "",
      loginRequired: false,
      password: "",
      excelPath: "",
    });
    setError(null);
  };

  const handleToggle = async (id) => {
    try {
      await requestJson(`/api/sources/${id}/toggle`, {
        method: "POST",
      });
      await fetchSources();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to toggle source");
    }
  };

  const handleRefresh = async (id) => {
    const source = sources.find((s) => s.id === id);

if (!source) return;

setRefreshingSource(source.name);

    setShowRefreshToast(true);

    try {
      // Call the actual refresh endpoint
      await requestJson(`/api/sources/${id}/refresh`, {
        method: "POST",
      });

      // Wait a bit then refresh the list
      setTimeout(async () => {
        await fetchSources();
        setShowRefreshToast(false);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to refresh source");
      setShowRefreshToast(false);
    }
  };

  const handleEdit = (id) => {
    const source = sources.find((s) => s.id === id);
    setEditingSource({
      id: source.id,
      name: source.name,
      url: source.url,
      loginRequired: source.login === "Required",
      excelPath: source.excelPath || "",
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        name: editingSource.name,
        url: editingSource.url,
        login_required: editingSource.loginRequired,
        excel_path: editingSource.excelPath || undefined,
      };

      if (editingSource.password) {
        updateData.password = editingSource.password;
      }

      await requestJson(`/api/sources/${editingSource.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      setSuccessMessage("Source updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setIsEditModalOpen(false);
      setEditingSource(null);

      await fetchSources();
    } catch (err) {
      setError(err.message || "Failed to update source");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingSource((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSource(null);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this source?")) {
      return;
    }

    try {
      setLoading(true);
      await requestJson(`/api/sources/${id}`, {
        method: "DELETE",
      });

      setSuccessMessage("Source deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      await fetchSources();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete source");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F7FAFC] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Source Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure and monitor tender data sources
            </p>
          </div>
          <div className="relative">
            <button className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                {stats.errors}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-[1400px] mx-auto mt-4 px-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-[1400px] mx-auto mt-4 px-6">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <span>✓ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="ml-auto text-green-700 hover:text-green-900"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Total Sources</div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-3xl font-semibold text-green-600">
              {stats.active}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Disabled</div>
            <div className="text-3xl font-semibold text-gray-600">
              {stats.disabled}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Errors</div>
            <div className="text-3xl font-semibold text-red-600">
              {stats.errors}
            </div>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="flex justify-between gap-3 mb-6">
          <div className="relative" style={{ width: "400px" }}>
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#3c83f6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition font-medium text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Add Source
          </button>
        </div>

        {/* Loading State */}
        {loading && !sources.length && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={32} />
            <p className="text-gray-500">Loading sources...</p>
          </div>
        )}

        {/* Table */}
        {!loading || sources.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Excel Path
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Login
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Fetch
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tenders
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sources.map((source) => (
                    <tr key={source.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {source.name}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#3c83f6] hover:text-[#2563eb] flex items-center gap-1.5"
                        >
                          {source.url}
                          <ExternalLink size={13} />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {source.excelPath ? (
                          <span className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                            {source.excelPath}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          {source.isPublic ? (
                            <>
                              <Globe size={16} className="text-gray-500" />
                              <span className="text-gray-700">Public</span>
                            </>
                          ) : (
                            <>
                              <Lock size={16} className="text-yellow-600" />
                              <span className="text-yellow-600 font-medium">
                                Required
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}
                        >
                          {source.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {source.lastFetch}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {source.tenders}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {source.status?.toUpperCase() !== "DISABLED" && (

                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={source.isEnabled}
                                onChange={() => handleToggle(source.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c83f6]"></div>
                            </label>
                          )}
                          <button
                            onClick={() => handleRefresh(source.id)}
                            className="text-gray-500 hover:text-[#3c83f6] transition"
                            title="Refresh"
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(source.id)}
                            className="text-gray-500 hover:text-[#3c83f6] transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(source.id)}
                            className="text-gray-500 hover:text-red-600 transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* Add Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add New Source
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new data source to monitor for tenders.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Source Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., SAM.gov"
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      URL *
                    </label>
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Excel File Path
                    </label>
                    <input
                      type="text"
                      name="excelPath"
                      value={formData.excelPath}
                      onChange={handleInputChange}
                      placeholder="e.g., D:\data\tenders.xlsx"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Local Excel file path used for offline tender sync
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-900">
                          Requires Login
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Enable if this source requires authentication
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.loginRequired}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              loginRequired: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c83f6]"></div>
                      </label>
                    </div>
                  </div>

                  {formData.loginRequired && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password"
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-sm bg-[#3c83f6] text-white rounded-lg hover:bg-[#2563eb] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Source"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Source Modal */}
      {isEditModalOpen && editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Source
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Update the source configuration below.
                </p>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Source Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editingSource.name}
                      onChange={handleEditInputChange}
                      placeholder="e.g., SAM.gov"
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      URL *
                    </label>
                    <input
                      type="url"
                      name="url"
                      value={editingSource.url}
                      onChange={handleEditInputChange}
                      placeholder="https://..."
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Excel File Path
                    </label>
                    <input
                      type="text"
                      name="excelPath"
                      value={editingSource.excelPath || ""}
                      onChange={handleEditInputChange}
                      placeholder="e.g., D:\data\tenders.xlsx"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Local Excel file path used for offline tender sync
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-900">
                          Requires Login
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Enable if this source requires authentication
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingSource.loginRequired}
                          onChange={(e) =>
                            setEditingSource((prev) => ({
                              ...prev,
                              loginRequired: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c83f6]"></div>
                      </label>
                    </div>
                  </div>

                  {editingSource.loginRequired && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Password (leave blank to keep current)
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={editingSource.password}
                        onChange={handleEditInputChange}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-5 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-sm bg-[#3c83f6] text-white rounded-lg hover:bg-[#2563eb] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Source"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refresh Toast Notification */}
      {showRefreshToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white px-5 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up">
          <RefreshCw size={20} className="animate-spin" />
          <div>
            <div className="font-medium">Fetching data</div>
            <div className="text-sm text-gray-300">
              Refreshing data from {refreshingSource}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}