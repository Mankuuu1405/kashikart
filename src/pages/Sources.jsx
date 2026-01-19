import React from "react";
import { useState } from "react";
import { Search, Plus, ExternalLink, Globe, Lock, RefreshCw, Edit, Bell, X } from "lucide-react";

export default function Sources() {
  const [sources, setSources] = useState([
    {
      id: 1,
      name: "SAM.gov",
      url: "https://sam.gov",
      login: "Public",
      status: "Active",
      lastFetch: "2026-01-01 08:30",
      tenders: 1247,
      isPublic: true,
      isEnabled: true
    },
    {
      id: 2,
      name: "DOT Portal",
      url: "https://dot.gov/contracts",
      login: "Required",
      status: "Active",
      lastFetch: "2026-01-01 08:25",
      tenders: 342,
      isPublic: false,
      isEnabled: true
    },
    {
      id: 3,
      name: "VA Procurement",
      url: "https://va.gov/procurement",
      login: "Required",
      status: "Active",
      lastFetch: "2026-01-01 08:20",
      tenders: 189,
      isPublic: false,
      isEnabled: true
    },
    {
      id: 4,
      name: "DHS Contracts",
      url: "https://dhs.gov/contracts",
      login: "Required",
      status: "Active",
      lastFetch: "2026-01-01 08:15",
      tenders: 156,
      isPublic: false,
      isEnabled: true
    },
    {
      id: 5,
      name: "EPA Portal",
      url: "https://epa.gov/contracts",
      login: "Public",
      status: "Error",
      lastFetch: "2025-12-31 22:00",
      tenders: 98,
      isPublic: true,
      isEnabled: false
    },
    {
      id: 6,
      name: "DOJ Procurement",
      url: "https://doj.gov/procurement",
      login: "Required",
      status: "Active",
      lastFetch: "2026-01-01 08:10",
      tenders: 134,
      isPublic: false,
      isEnabled: true
    },
    {
      id: 7,
      name: "DoD Contracts",
      url: "https://defense.gov/contracts",
      login: "Required",
      status: "Active",
      lastFetch: "2026-01-01 08:05",
      tenders: 567,
      isPublic: false,
      isEnabled: true
    },
    {
      id: 8,
      name: "NASA Procurement",
      url: "https://nasa.gov/procurement",
      login: "Public",
      status: "Disabled",
      lastFetch: "2025-12-20 14:00",
      tenders: 45,
      isPublic: true,
      isEnabled: false
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [refreshingSource, setRefreshingSource] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    loginType: "Public"
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "Active": return "bg-green-100 text-green-700";
      case "Error": return "bg-red-100 text-red-700";
      case "Disabled": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newSource = {
      id: sources.length + 1,
      name: formData.name,
      url: formData.url,
      login: formData.loginType,
      status: "Active",
      lastFetch: new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
      }).replace(',', ''),
      tenders: 0,
      isPublic: formData.loginType === "Public",
      isEnabled: true
    };

    setSources(prev => [...prev, newSource]);
    setIsModalOpen(false);
    setFormData({
      name: "",
      url: "",
      loginType: "Public"
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      url: "",
      loginType: "Public"
    });
  };

  const handleToggle = (id) => {
    setSources(prev => prev.map(source => 
      source.id === id 
        ? { ...source, isEnabled: !source.isEnabled }
        : source
    ));
  };

  const handleRefresh = (id) => {
    const source = sources.find(s => s.id === id);
    setRefreshingSource(source.name);
    setShowRefreshToast(true);
    
    setSources(prev => prev.map(source => 
      source.id === id 
        ? { 
            ...source, 
            lastFetch: new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false 
            }).replace(',', '')
          }
        : source
    ));

    setTimeout(() => {
      setShowRefreshToast(false);
    }, 3000);
  };

  const handleEdit = (id) => {
    const source = sources.find(s => s.id === id);
    setEditingSource({
      ...source,
      loginType: source.login
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    setSources(prev => prev.map(source => 
      source.id === editingSource.id 
        ? {
            ...source,
            name: editingSource.name,
            url: editingSource.url,
            login: editingSource.loginType,
            isPublic: editingSource.loginType === "Public"
          }
        : source
    ));
    
    setIsEditModalOpen(false);
    setEditingSource(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingSource(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSource(null);
  };

  const filteredSources = sources.filter(source => 
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#F7FAFC] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Source Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure and monitor tender data sources</p>
          </div>
          <div className="relative">
            <button className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">3</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Total Sources</div>
            <div className="text-3xl font-semibold text-gray-900">{sources.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-3xl font-semibold text-green-600">
              {sources.filter(s => s.status === "Active").length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Disabled</div>
            <div className="text-3xl font-semibold text-gray-600">
              {sources.filter(s => s.status === "Disabled").length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-1">Errors</div>
            <div className="text-3xl font-semibold text-red-600">
              {sources.filter(s => s.status === "Error").length}
            </div>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="flex justify-between gap-3 mb-6">
          <div className="relative" style={{ width: '400px' }}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">Source</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">URL</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">Login</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Fetch</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">Tenders</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredSources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{source.name}</td>
                    <td className="px-6 py-4">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3c83f6] hover:text-[#2563eb] flex items-center gap-1.5">
                        {source.url}
                        <ExternalLink size={13} />
                      </a>
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
                            <span className="text-yellow-600 font-medium">Required</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                        {source.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{source.lastFetch}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{source.tenders}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {source.status !== "Disabled" && (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Source</h2>
                <p className="text-sm text-gray-500 mt-1">Add a new data source to monitor for tenders.</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Source Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., SAM.gov"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Requires Login
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Enable if this source requires authentication</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.loginType === "Required"}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          loginType: e.target.checked ? "Required" : "Public"
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c83f6]"></div>
                    </label>
                  </div>
                </div>
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
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2.5 text-sm bg-[#3c83f6] text-white rounded-lg hover:bg-[#2563eb] transition font-medium"
                >
                  Add Source
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Source Modal */}
      {isEditModalOpen && editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit Source</h2>
                <p className="text-sm text-gray-500 mt-1">Update the source configuration below.</p>
              </div>
              <button 
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Source Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingSource.name}
                    onChange={handleEditInputChange}
                    placeholder="e.g., SAM.gov"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={editingSource.url}
                    onChange={handleEditInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Requires Login
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Enable if this source requires authentication</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingSource.loginType === "Required"}
                        onChange={(e) => setEditingSource(prev => ({
                          ...prev,
                          loginType: e.target.checked ? "Required" : "Public"
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c83f6]"></div>
                    </label>
                  </div>
                </div>
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
                  type="button"
                  onClick={handleEditSubmit}
                  className="px-5 py-2.5 text-sm bg-[#3c83f6] text-white rounded-lg hover:bg-[#2563eb] transition font-medium"
                >
                  Update Source
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Toast Notification */}
      {showRefreshToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white px-5 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up">
          <RefreshCw size={20} className="animate-spin" />
          <div>
            <div className="font-medium">Fetching data</div>
            <div className="text-sm text-gray-300">Refreshing data from {refreshingSource}...</div>
          </div>
        </div>
      )}
    </div>
  );
}