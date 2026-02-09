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
  Upload,
  FileSpreadsheet,
  Download,
} from "lucide-react";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SOURCE_ENDPOINTS = {
  list: "/api/sources/",
  stats: "/api/sources/stats",
  create: "/api/sources/",
  update: (id) => `/api/sources/${id}`,
  delete: (id) => `/api/sources/${id}`,
  toggle: (id) => `/api/sources/${id}/toggle`,
  refresh: (id) => `/api/sources/${id}/refresh`,
};

const EXCEL_ENDPOINTS = {
  register: "/api/excel_control/excel/register-file",
  list: "/api/excel_control/excel/files",
  all: "/api/excel_control/excel/all",
  importStatus: "/api/excel_control/excel/import-status",
  manualImport: "/api/excel_control/excel/import-to-tenders",
};

// Helper to get auth token
const getAuthToken = () => localStorage.getItem("access_token");

// Helper for API requests
const requestJson = async (url, options = {}) => {
  console.log(`🌐 API Request: ${url}`);
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      ...options.headers,
    },
  });

  console.log(`📡 Response status: ${response.status}`);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "An error occurred" }));
    console.error(`❌ API Error:`, error);
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  console.log(`✅ Response data:`, data);
  return data;
};

export default function Sources() {
  const [sources, setSources] = useState([]);
  const [excelFiles, setExcelFiles] = useState([]);
  const [showExcelSources, setShowExcelSources] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    disabled: 0,
    errors: 0,
  });
  
  const [importStatus, setImportStatus] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isViewExcelFilesModalOpen, setIsViewExcelFilesModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [refreshingSource, setRefreshingSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExcelFiles, setLoadingExcelFiles] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [excelPath, setExcelPath] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    loginRequired: false,
    password: "",
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchSources();
    fetchStats();
    fetchExcelFiles();
    fetchImportStatus();
  }, [currentPage]);

  const fetchImportStatus = async () => {
    try {
      const status = await requestJson(EXCEL_ENDPOINTS.importStatus);
      setImportStatus(status);
    } catch (err) {
      console.error('Error fetching import status:', err);
    }
  };

  const pollImportStatus = () => {
    let pollCount = 0;
    const maxPolls = 10;
    
    const interval = setInterval(async () => {
      pollCount++;
      
      try {
        const status = await requestJson(EXCEL_ENDPOINTS.importStatus);
        
        console.log('📊 Import status:', status);
        setImportStatus(status);
        
        if (status.imported_tenders > 0 || pollCount >= maxPolls) {
          clearInterval(interval);
          
          await fetchSources();
          await fetchStats();
          await fetchExcelFiles();
          
          if (status.imported_tenders > 0) {
            setSuccessMessage(
              `✅ Import complete! ${status.imported_tenders} tenders and ${status.excel_sources} sources created.`
            );
            setTimeout(() => setSuccessMessage(""), 5000);
          }
        }
      } catch (err) {
        console.error('Error polling import status:', err);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleManualImport = async () => {
    if (!window.confirm('Manually trigger import of Excel data to tenders and sources?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await requestJson(EXCEL_ENDPOINTS.manualImport, {
        method: 'POST'
      });
      
      if (result.status === 'success') {
        setSuccessMessage(
          `✅ Import complete! ${result.tenders.imported} tenders and ${result.sources.created} sources created.`
        );
        
        await fetchSources();
        await fetchStats();
        await fetchImportStatus();
      } else {
        setError(result.message || 'Import failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to trigger import');
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: "50",
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const data = await requestJson(`/api/sources/?${params.toString()}`);

      const transformedSources = data.items.map((source) => ({
        id: source.id,
        name: source.name,
        url: source.url,
        login: source.login_required ? "Required" : "Public",
        status: source.status,
        lastFetch: source.last_fetch_at
          ? new Date(source.last_fetch_at)
              .toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
              .replace(",", "")
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

  const fetchExcelFiles = async () => {
    try {
      setLoadingExcelFiles(true);
      setError(null);
      
      console.log("🔍 Fetching Excel data...");
      const data = await requestJson(`${EXCEL_ENDPOINTS.all}?page=1&limit=1000`);
      
      console.log("📊 Received Excel data:", data);
      
      if (!data || !Array.isArray(data.data)) {
        console.warn("⚠️ Expected data.data array but got:", typeof data);
        setExcelFiles([]);
        return;
      }
      
      const transformedData = data.data
        .filter(row => {
          const url = row.row_data?.['Web Source Data Link (Links of Tender Release Sources)'];
          const source = row.row_data?.Source;
          return url && url !== 'Florida State' && url !== 'Washington State & Oregon State' && source;
        })
        .map(row => ({
          id: row.id,
          row_index: row.row_index,
          source: row.row_data?.Source || 'N/A',
          url: row.row_data?.['Web Source Data Link (Links of Tender Release Sources)'] || '',
          user: row.row_data?.User || '-',
          login_required: row.row_data?.['User Login Required?'] || 'No',
          password: row.row_data?.Password || '-',
          remarks: row.row_data?.Remarks || '',
          created_at: row.created_at
        }));
      
      setExcelFiles(transformedData);
      console.log(`✅ Successfully loaded ${transformedData.length} Excel rows`);
    } catch (err) {
      console.error("❌ Error fetching excel data:", err);
      setError(err.message || "Failed to fetch excel data");
      setExcelFiles([]);
    } finally {
      setLoadingExcelFiles(false);
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      });

      await fetchSources();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to create source");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUploadSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanPath = excelPath.replace(/\\/g, "/").trim();
      
      console.log("📤 Registering Excel path with auto-import:", cleanPath);
      
      const response = await requestJson(
        `${EXCEL_ENDPOINTS.register}?path=${encodeURIComponent(cleanPath)}&auto_import=true`,
        {
          method: "POST",
        }
      );

      console.log("📥 Registration response:", response);

      if (response.status === "already exists") {
        setSuccessMessage(
          `Excel path already registered (ID: ${response.id})`
        );
      } else if (response.status === "registered") {
        if (response.auto_import_triggered) {
          setSuccessMessage(
            `✅ File registered! Import started in background. Tenders and sources will appear shortly.`
          );
          
          pollImportStatus();
        } else {
          setSuccessMessage(
            `Excel path registered successfully (ID: ${response.id})`
          );
        }
      }

      setTimeout(() => setSuccessMessage(""), 5000);

      setIsExcelModalOpen(false);
      setExcelPath("");
      
      setTimeout(async () => {
        await fetchSources();
        await fetchStats();
        await fetchExcelFiles();
        await fetchImportStatus();
      }, 2000);
      
    } catch (err) {
      setError(err.message || "Failed to register Excel path");
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
    });
    setError(null);
  };

  const handleCloseExcelModal = () => {
    setIsExcelModalOpen(false);
    setExcelPath("");
    setError(null);
  };

  const handleOpenViewExcelFiles = async () => {
    console.log("👁️ Opening Excel files modal...");
    setIsViewExcelFilesModalOpen(true);
    await fetchExcelFiles();
  };

  const handleCloseViewExcelFiles = () => {
    setIsViewExcelFilesModalOpen(false);
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
      await requestJson(`/api/sources/${id}/refresh`, {
        method: "POST",
      });

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
    const { name, value, type, checked } = e.target;
    setEditingSource((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  const handleImportFromExcel = async (excelRow) => {
    try {
      setLoading(true);
      setError(null);

      const newSourceData = {
        name: excelRow.source,
        url: excelRow.url,
        login_required: excelRow.login_required === 'Yes',
        password: excelRow.password !== '-' ? excelRow.password : undefined,
      };

      await requestJson("/api/sources/", {
        method: "POST",
        body: JSON.stringify(newSourceData),
      });

      setSuccessMessage(`Source "${excelRow.source}" imported successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);

      await fetchSources();
      await fetchStats();
    } catch (err) {
      setError(err.message || `Failed to import source "${excelRow.source}"`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImportFromExcel = async () => {
    if (!window.confirm(`Are you sure you want to import all ${excelFiles.length} sources from Excel?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let successCount = 0;
      let errorCount = 0;

      for (const excelRow of excelFiles) {
        try {
          const newSourceData = {
            name: excelRow.source,
            url: excelRow.url,
            login_required: excelRow.login_required === 'Yes',
            password: excelRow.password !== '-' ? excelRow.password : undefined,
          };

          await requestJson("/api/sources/", {
            method: "POST",
            body: JSON.stringify(newSourceData),
          });
          
          successCount++;
        } catch (err) {
          console.error(`Failed to import ${excelRow.source}:`, err);
          errorCount++;
        }
      }

      setSuccessMessage(`Successfully imported ${successCount} sources. ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`);
      setTimeout(() => setSuccessMessage(""), 5000);

      await fetchSources();
      await fetchStats();
      setIsViewExcelFilesModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to bulk import sources");
    } finally {
      setLoading(false);
    }
  };

  const getCombinedSources = () => {
    if (!showExcelSources) {
      return sources;
    }

    const excelSources = excelFiles.map((row) => ({
      id: `excel-${row.id}`,
      name: row.source,
      url: row.url,
      login: row.login_required === 'Yes' ? "Required" : "Public",
      status: "EXCEL_SOURCE",
      lastFetch: "From Excel",
      tenders: 0,
      isPublic: row.login_required !== 'Yes',
      isEnabled: false,
      excelPath: null,
      isExcelSource: true,
      excelData: row,
    }));

    return [...sources, ...excelSources];
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Excel Sources</div>
            <div className="text-3xl font-semibold text-blue-600">
              {excelFiles.length}
            </div>
          </div>
          {importStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-600 mb-1">Import Rate</div>
              <div className="text-3xl font-semibold text-green-600">
                {importStatus.import_rate}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {importStatus.imported_tenders} of {importStatus.excel_rows} rows
              </div>
            </div>
          )}
        </div>

        {/* Search and Action Buttons */}
        <div className="flex justify-between gap-3 mb-6">
          <div className="flex gap-3 items-center">
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
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={showExcelSources}
                onChange={(e) => setShowExcelSources(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Excel Sources</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleManualImport}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition font-medium text-sm whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Import Excel Data
            </button>
            <button
              onClick={handleOpenViewExcelFiles}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition font-medium text-sm whitespace-nowrap"
            >
              <FileSpreadsheet size={18} />
              Manage Excel
            </button>
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition font-medium text-sm whitespace-nowrap"
            >
              <Upload size={18} />
              Add Excel Path
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#3c83f6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition font-medium text-sm whitespace-nowrap"
            >
              <Plus size={18} />
              Add Source
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !sources.length && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <RefreshCw
              className="animate-spin mx-auto mb-4 text-gray-400"
              size={32}
            />
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
                  {getCombinedSources().map((source) => (
                    <tr 
                      key={source.id} 
                      className={`hover:bg-gray-50 transition ${source.isExcelSource ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {source.isExcelSource && (
                            <FileSpreadsheet size={16} className="text-blue-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {source.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#3c83f6] hover:text-[#2563eb] flex items-center gap-1.5 max-w-md truncate"
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
                        {source.isExcelSource ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Excel Source
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              source.status
                            )}`}
                          >
                            {source.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {source.lastFetch}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {source.tenders}
                      </td>
                      <td className="px-6 py-4">
                        {source.isExcelSource ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleImportFromExcel(source.excelData)}
                              disabled={loading}
                              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              title="Import as source"
                            >
                              <Download size={14} />
                              Import
                            </button>
                          </div>
                        ) : (
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
                        )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Source
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Florida DOT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="loginRequired"
                      checked={formData.loginRequired}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Login Required
                    </span>
                  </label>
                </div>

                {formData.loginRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Source"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Excel Path Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Excel File Path
              </h2>
              <button
                onClick={handleCloseExcelModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleExcelUploadSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excel File Path *
                  </label>
                  <input
                    type="text"
                    value={excelPath}
                    onChange={(e) => setExcelPath(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="C:/path/to/file.xlsx or /path/to/file.xlsx"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the full path to your Excel file
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700">
                    ℹ️ The file will be automatically imported to create sources and tenders
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseExcelModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? "Registering..." : "Register & Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Excel Files Modal */}
      {isViewExcelFilesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Excel Sources ({excelFiles.length})
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Import sources from Excel data
                </p>
              </div>
              <button
                onClick={handleCloseViewExcelFiles}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loadingExcelFiles ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="animate-spin text-gray-400" size={32} />
                </div>
              ) : excelFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No Excel sources found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {excelFiles.map((row) => (
                    <div
                      key={row.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {row.source}
                            </h3>
                            {row.login_required === 'Yes' && (
                              <Lock size={14} className="text-yellow-600 flex-shrink-0" />
                            )}
                          </div>
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
                          >
                            {row.url}
                            <ExternalLink size={12} />
                          </a>
                          <div className="flex gap-4 text-xs text-gray-500">
                            {row.user !== '-' && <span>User: {row.user}</span>}
                            {row.remarks && <span>Note: {row.remarks}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleImportFromExcel(row)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Download size={14} />
                          Import
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6 flex justify-between">
              <button
                onClick={handleCloseViewExcelFiles}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </button>
              <button
                onClick={handleBulkImportFromExcel}
                disabled={loading || excelFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <Download size={18} />
                Import All ({excelFiles.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Source Modal */}
      {isEditModalOpen && editingSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Source
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingSource.name}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={editingSource.url}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excel Path (optional)
                  </label>
                  <input
                    type="text"
                    name="excelPath"
                    value={editingSource.excelPath}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/path/to/file.xlsx"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="loginRequired"
                      checked={editingSource.loginRequired}
                      onChange={handleEditInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Login Required
                    </span>
                  </label>
                </div>

                {editingSource.loginRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password (leave empty to keep current)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={editingSource.password}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
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