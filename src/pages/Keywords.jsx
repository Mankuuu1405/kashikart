import React, { useState } from "react";
import { Bell, BellOff, Plus, Pencil, Trash2, X } from "lucide-react";

const keywordsData = [
  { keyword: "IT Infrastructure", category: "Information Technology", priority: "High", alerts: true, created: "11/1/2025" },
  { keyword: "Cybersecurity", category: "Information Technology", priority: "High", alerts: true, created: "11/1/2025" },
  { keyword: "Construction", category: "Construction", priority: "Medium", alerts: true, created: "11/5/2025" },
  { keyword: "Healthcare", category: "Healthcare", priority: "High", alerts: true, created: "11/10/2025" },
  { keyword: "Environmental", category: "Environmental", priority: "Low", alerts: false, created: "11/15/2025" },
  { keyword: "Software Development", category: "Information Technology", priority: "High", alerts: true, created: "11/20/2025" },
  { keyword: "Facility Management", category: "Services", priority: "Medium", alerts: true, created: "12/1/2025" },
  { keyword: "Medical Equipment", category: "Healthcare", priority: "Medium", alerts: true, created: "12/5/2025" }
];

export default function Keywords() {
  const [keywords, setKeywords] = useState(keywordsData);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [editForm, setEditForm] = useState({ keyword: "", category: "", priority: "", alerts: true });

  const handleEdit = (item, index) => {
    setEditingKeyword(index);
    setEditForm({ keyword: item.keyword, category: item.category, priority: item.priority, alerts: item.alerts });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    const updatedKeywords = [...keywords];
    updatedKeywords[editingKeyword] = { ...updatedKeywords[editingKeyword], ...editForm };
    setKeywords(updatedKeywords);
    setShowEditModal(false);
    setEditingKeyword(null);
  };

  const handleDelete = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-gray-50 border-b border-gray-200">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Keyword Management</h1>
            <p className="text-sm text-gray-500">Configure keywords for intelligent tender matching</p>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1.5">3</span>
          </div>
        </div>
        <div className="px-8 pb-4 flex items-center justify-between">
          <input placeholder="Search keywords..." className="w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium">
            <Plus size={16} />
            Add Keyword
          </button>
        </div>
      </div>

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

          {keywords.map((item, i) => (
            <div key={i} className="grid grid-cols-6 px-6 py-4 items-center border-t border-gray-100 text-sm">
              <div className="font-medium text-gray-900">{item.keyword}</div>
              <div>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{item.category}</span>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs ${item.priority === "High" ? "bg-red-100 text-red-600" : item.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-600"}`}>{item.priority}</span>
              </div>
              <div>
                {item.alerts ? (
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <BellOff className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-gray-600">{item.created}</div>
              <div className="flex justify-end gap-4">
                <Pencil className="w-4 h-4 text-gray-500 cursor-pointer hover:text-blue-500" onClick={() => handleEdit(item, i)} />
                <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-600" onClick={() => handleDelete(i)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
          <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">Add New Keyword</h2>
                <p className="text-sm text-gray-500">Add a new keyword to monitor for matching tenders.</p>
              </div>
              <X className="cursor-pointer text-gray-400" onClick={() => { setShowModal(false); setAlertsEnabled(true); }} />
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Keyword</label>
                <input placeholder="Enter keyword..." className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Information Technology</option>
                  <option>Construction</option>
                  <option>Healthcare</option>
                  <option>Environmental</option>
                  <option>Services</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-medium text-gray-900">Enable Alerts</span>
                <button type="button" onClick={() => setAlertsEnabled(!alertsEnabled)} className={`w-11 h-6 rounded-full relative transition ${alertsEnabled ? "bg-blue-500" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${alertsEnabled ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setAlertsEnabled(true); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">Add Keyword</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
          <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">Edit Keyword</h2>
                <p className="text-sm text-gray-500">Update the keyword configuration below.</p>
              </div>
              <X className="cursor-pointer text-gray-400" onClick={() => { setShowEditModal(false); setEditingKeyword(null); }} />
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Keyword</label>
                <input value={editForm.keyword} onChange={(e) => setEditForm({...editForm, keyword: e.target.value})} placeholder="Enter keyword..." className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Information Technology</option>
                  <option>Construction</option>
                  <option>Healthcare</option>
                  <option>Environmental</option>
                  <option>Services</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select value={editForm.priority} onChange={(e) => setEditForm({...editForm, priority: e.target.value})} className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-medium text-gray-900">Enable Alerts</span>
                <button type="button" onClick={() => setEditForm({...editForm, alerts: !editForm.alerts})} className={`w-11 h-6 rounded-full relative transition ${editForm.alerts ? "bg-blue-500" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${editForm.alerts ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowEditModal(false); setEditingKeyword(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">Update Keyword</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}