import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Bell,
  X,
  Building2,
  MapPin,
  Download,
  ExternalLink,
  ChevronDown,
  Check,
} from 'lucide-react';
import { EmptyState } from '../components/States';
import { getErrorMessage, requestJson, requestWithRetry } from '../utils/api';

const USE_MOCK_TENDERS = false; // Set to false to use real API
const USE_MOCK_NOTIFICATIONS = true; // TODO BACKEND: real notifications API

const TENDER_ENDPOINTS = {
  list: '/api/tenders/',
  detail: (id) => `/api/tenders/${id}`,
  update: (id) => `/api/tenders/${id}`,
  delete: (id) => `/api/tenders/${id}`,
  export: '/api/tenders/export/excel',
  stats: '/api/tenders/stats/dashboard',
};

const NOTIFICATION_ENDPOINTS = {
  list: '/api/notifications',
};

const INITIAL_NOTIFICATIONS = [
  { id: 1, message: 'New tender matched: IT Infrastructure Modernization', isRead: false },
  { id: 2, message: 'Deadline approaching: DOT-HWY-2026-042', isRead: false },
  { id: 3, message: 'Tender saved: DHS-CYBER-2026-015', isRead: true },
];

const StatusBadge = ({ status }) => {
  const styles = {
    new: 'bg-green-100 text-green-700',
    viewed: 'bg-gray-100 text-gray-700',
    saved: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-700',
  };

  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`px-3 py-1 rounded-md text-xs font-medium ${styles[status.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
      {displayStatus}
    </span>
  );
};

const TenderListing = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0));
  const [selectedTender, setSelectedTender] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const notificationMenuRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalTenders, setTotalTenders] = useState(0);

  // Tenders data
  const [tenders, setTenders] = useState([]);
  const [sources, setSources] = useState(['All Sources']);

  const statuses = ['All Status', 'new', 'viewed', 'saved', 'expired'];

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch tenders from API
  const fetchTenders = async () => {
    if (USE_MOCK_TENDERS) return;

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('page_size', pageSize);

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (selectedStatus !== 'All Status') {
        params.append('status', selectedStatus.toLowerCase());
      }

      if (selectedSource !== 'All Sources') {
        // You'll need to map source name to source_id
        // For now, we'll skip this or you can add source_id mapping
        // params.append('source_id', sourceId);
      }

      if (startDate) {
        params.append('date_from', formatDateForAPI(startDate));
      }

      if (endDate) {
        params.append('date_to', formatDateForAPI(endDate));
      }

      const url = `${TENDER_ENDPOINTS.list}?${params.toString()}`;
      const data = await requestWithRetry(() => requestJson(url));

      if (!data || !data.items) {
        throw new Error('Invalid response format from server');
      }

      // Map backend data to frontend format
      const mappedTenders = data.items.map(tender => ({
        id: tender.id,
        title: tender.title,
        code: tender.reference_id,
        agency: tender.agency_name || 'N/A',
        location: tender.agency_location || 'N/A',
        source: tender.source_name || 'Unknown',
        deadline: tender.deadline_date ? new Date(tender.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        daysLeft: tender.days_until_deadline || 0,
        status: tender.status,
        keywords: [], // TODO: Map keyword_matches when available
        published: tender.published_date ? new Date(tender.published_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
        description: tender.description || 'No description available',
        attachments: tender.attachments || [],
        source_url: tender.source_url,
      }));

      setTenders(mappedTenders);
      setTotalTenders(data.total);

    } catch (err) {
      console.error('Error fetching tenders:', err);
      setError(getErrorMessage(err, 'Failed to load tenders'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch tender details
  const fetchTenderDetails = async (tenderId) => {
    try {
      const url = TENDER_ENDPOINTS.detail(tenderId);
      const data = await requestWithRetry(() => requestJson(url));

      if (!data) {
        throw new Error('Failed to load tender details');
      }

      // Map to frontend format
      const mappedTender = {
        id: data.id,
        title: data.title,
        code: data.reference_id,
        agency: data.agency_name || 'N/A',
        location: data.agency_location || 'N/A',
        source: data.source_name || 'Unknown',
        deadline: data.deadline_date ? new Date(data.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        daysLeft: data.days_until_deadline || 0,
        status: data.status,
        keywords: [], // TODO: Map keyword_matches
        published: data.published_date ? new Date(data.published_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
        description: data.description || 'No description available',
        attachments: data.attachments || [],
        source_url: data.source_url,
      };

      setSelectedTender(mappedTender);

    } catch (err) {
      console.error('Error fetching tender details:', err);
      setError(getErrorMessage(err, 'Failed to load tender details'));
    }
  };

  // Update tender status
  const updateTenderStatus = async (tenderId, newStatus) => {
    try {
      const url = TENDER_ENDPOINTS.update(tenderId);
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tender');
      }

      // Refresh tenders list
      fetchTenders();

    } catch (err) {
      console.error('Error updating tender:', err);
      setError(getErrorMessage(err, 'Failed to update tender'));
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();

      if (selectedStatus !== 'All Status') {
        params.append('status', selectedStatus.toLowerCase());
      }

      if (selectedSource !== 'All Sources') {
        // Add source_id mapping if available
      }

      if (startDate) {
        params.append('date_from', formatDateForAPI(startDate));
      }

      if (endDate) {
        params.append('date_to', formatDateForAPI(endDate));
      }

      const url = `${TENDER_ENDPOINTS.export}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // Add authorization if needed
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `tenders_export_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error('Error exporting tenders:', err);
      setError(getErrorMessage(err, 'Failed to export tenders'));
    }
  };

  // Fetch tenders when filters change
  useEffect(() => {
    fetchTenders();
  }, [currentPage, searchQuery, selectedStatus, selectedSource, startDate, endDate]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (USE_MOCK_NOTIFICATIONS) return;
    try {
      setError(null);
      const data = await requestWithRetry(() =>
        requestJson(NOTIFICATION_ENDPOINTS.list)
      );
      if (!Array.isArray(data)) {
        throw new Error('Invalid notifications format from server');
      }
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to load notifications'));
    }
  };

  useEffect(() => {
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
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All Status');
    setSelectedSource('All Sources');
    setStartDate(null);
    setEndDate(null);
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleMarkAllRead = () => {
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (id) => {
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleRemoveNotification = (id) => {
    setNotifications((list) => list.filter((n) => n.id !== id));
  };

  const hasActiveFilters = searchQuery || selectedStatus !== 'All Status' || selectedSource !== 'All Sources' || startDate || endDate;

  useEffect(() => {
    if (startDate && endDate) {
      setShowDatePicker(false);
    }
  }, [startDate, endDate]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const formatDateString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderCalendar = (monthOffset = 0) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset);
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days = [];
    const prevMonthDays = getDaysInMonth(new Date(date.getFullYear(), date.getMonth() - 1, 1));

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <div key={`prev-${i}`} className="text-center py-2 text-sm text-gray-300">
          {day}
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      const dateStr = formatDateString(currentDate);
      const isToday = day === 15 && monthOffset === 0;
      const isStart = startDate && currentDate.toDateString() === startDate.toDateString();
      const isEnd = endDate && currentDate.toDateString() === endDate.toDateString();
      const isInRange = startDate && endDate && currentDate > startDate && currentDate < endDate;

      days.push(
        <button
          key={day}
          onClick={() => {
            if (!startDate || endDate) {
              setStartDate(currentDate);
              setEndDate(null);
            } else if (currentDate < startDate) {
              setEndDate(startDate);
              setStartDate(currentDate);
            } else {
              setEndDate(currentDate);
            }
          }}
          className={`text-center py-2 text-sm rounded-lg transition ${isToday
            ? 'bg-blue-500 text-white hover:bg-blue-600 font-semibold'
            : isStart || isEnd
              ? 'bg-blue-500 text-white font-semibold'
              : isInRange
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="flex-1">
        <div className="font-semibold text-center mb-3 text-base text-gray-900">
          {monthNames[date.getMonth()]} {date.getFullYear()}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const handleViewTender = async (tender) => {
    await fetchTenderDetails(tender.id);
  };

  const handleSaveTender = async (tenderId) => {
    await updateTenderStatus(tenderId, 'saved');
    setOpenDropdown(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 z-20 bg-gray-50 px-6 pt-4 pb-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 text-xl">
              Tender Listings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalTenders} tenders found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Download size={16} />
              Export
            </button>
            <div className="relative" ref={notificationMenuRef}>
              <button
                onClick={handleToggleNotifications}
                className="relative p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <Bell size={18} className="text-gray-500 hover:text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1">
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
                        className={`text-[11px] ${unreadCount === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-700'
                          }`}
                      >
                        Mark all
                      </button>
                      <button
                        type="button"
                        onClick={handleClearNotifications}
                        disabled={notifications.length === 0}
                        className={`text-[11px] ${notifications.length === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-500 hover:text-red-600'
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
                        className={`flex items-start justify-between gap-2 px-4 py-2 text-xs border-b last:border-b-0 cursor-pointer ${n.isRead
                          ? 'text-gray-500'
                          : 'text-gray-900 font-medium'
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
        </div>
      </div>

      {loading && (
        <div className="mx-6 mt-4 text-sm text-gray-500 flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
          Loading tenders...
        </div>
      )}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-10 py-6">
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 shadow-sm">
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              placeholder="Search by title, agency, reference ID, or keywords..."
              className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={14} />
              <span className="text-sm">Filters:</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setStatusOpen(v => !v)}
                className="flex items-center justify-between gap-2 border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 min-w-[160px] hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{selectedStatus}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {statusOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setStatusOpen(false)}
                  />

                  <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    {statuses.map(status => {
                      const isSelected = status === selectedStatus;

                      return (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatus(status);
                            setStatusOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition rounded hover:bg-blue-500 hover:text-white ${isSelected ? 'text-gray-700 font-medium' : 'text-gray-700'
                            }`}
                        >
                          <span className="w-4">
                            {isSelected && <Check className="w-4 h-4" />}
                          </span>
                          <span>{status}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setSourceOpen(v => !v)}
                className="flex items-center justify-between gap-2 border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 min-w-[180px] hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{selectedSource}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {sourceOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSourceOpen(false)}
                  />

                  <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    {sources.map(source => {
                      const isSelected = source === selectedSource;

                      return (
                        <button
                          key={source}
                          onClick={() => {
                            setSelectedSource(source);
                            setSourceOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition rounded hover:bg-blue-500 hover:text-white ${isSelected ? 'text-gray-700 font-medium' : 'text-gray-700'
                            }`}
                        >
                          <span className="w-4">
                            {isSelected && <Check className="w-4 h-4" />}
                          </span>
                          <span>{source}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white transition text-sm font-semibold text-gray-600"
              >
                <Calendar size={14} />
                {startDate && endDate ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Date Range'}
              </button>

              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 z-30 w-[580px]">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-gray-600" />
                      <span className="font-semibold text-sm text-gray-900">
                        {startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                      </span>
                      {startDate && endDate && (
                        <>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">1 active</span>
                          <button
                            onClick={() => {
                              setStartDate(null);
                              setEndDate(null);
                              setCurrentPage(1);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline ml-1"
                          >
                            Clear all
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-1 hover:bg-gray-100 rounded transition"
                    >
                      <ChevronLeft size={18} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-1 hover:bg-gray-100 rounded transition"
                    >
                      <ChevronRight size={18} className="text-gray-600" />
                    </button>
                  </div>

                  <div className="flex gap-6">
                    {renderCalendar(0)}
                    {renderCalendar(1)}
                  </div>
                </div>
              )}
            </div>

            <div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-blue-400 rounded-md px-3 h-9 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Tender', 'Agency', 'Source', 'Deadline', 'Status', 'Keywords', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-sm font-semibold text-gray-600 tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {tenders.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <EmptyState
                        title="No tenders found"
                        message="Try adjusting filters or check back later."
                      />
                    </td>
                  </tr>
                ) : (
                  tenders.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-800 mb-1 max-w-[300px]">
                          {t.title}
                        </p>
                        <p className="text-xs text-gray-500">{t.code}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 mb-1">{t.agency}</p>
                        <p className="text-xs text-gray-500">{t.location}</p>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {t.source}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800 font-medium mb-1">{t.deadline}</p>
                        <p className="text-xs text-gray-500">{t.daysLeft} days left</p>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {t.keywords.length > 0 ? (
                            t.keywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="w-fit px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No keywords</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-3 text-gray-600">
                          <button
                            className="p-1.5 rounded hover:bg-blue-500 transition"
                            onClick={() => handleViewTender(t)}
                          >
                            <Eye
                              size={18}
                              strokeWidth={2}
                              className="cursor-pointer text-gray-600 hover:text-white"
                            />
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-blue-500 transition"
                            onClick={() => handleSaveTender(t.id)}
                          >
                            <Bookmark size={18} strokeWidth={2} className="cursor-pointer text-gray-600 hover:text-white" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                              className="p-1.5 rounded hover:bg-blue-500 transition"
                            >
                              <MoreHorizontal
                                size={18}
                                strokeWidth={2}
                                className="cursor-pointer text-gray-600 hover:text-white"
                              />
                            </button>
                            {openDropdown === t.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenDropdown(null)}
                                />
                                <div className="absolute right-0 top-6 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                  {t.source_url && (
                                    <a
                                      href={t.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 rounded hover:bg-blue-500 hover:text-white flex items-center gap-2"
                                      onClick={() => setOpenDropdown(null)}
                                    >
                                      <ExternalLink size={14} />
                                      Open Source URL
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleSaveTender(t.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 rounded hover:bg-blue-500 hover:text-white flex items-center gap-2"
                                  >
                                    <Bookmark size={14} />
                                    Save Tender
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>Showing {tenders.length} of {totalTenders} tenders</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={tenders.length < pageSize}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedTender && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setSelectedTender(null)}
          />

          <div className="fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <StatusBadge status={selectedTender.status} />
                <button
                  onClick={() => setSelectedTender(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedTender.title}
              </h2>
              <p className="text-sm text-gray-500 mb-8">{selectedTender.code}</p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Agency</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTender.agency}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTender.location}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Published</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTender.published}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Deadline</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTender.deadline}
                    </p>
                    <p className="text-xs text-gray-500">{selectedTender.daysLeft} days remaining</p>
                  </div>
                </div>
              </div>

              {selectedTender.keywords.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-gray-900">Keyword Matches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTender.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-md bg-blue-50 text-sm font-medium text-blue-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedTender.description}
                </p>
              </div>

              {selectedTender.attachments && selectedTender.attachments.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {selectedTender.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">PDF</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{attachment.size}</p>
                          </div>
                        </div>
                        <Download size={16} className="text-gray-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTender.source_url && (
                <a
                  href={selectedTender.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink size={18} />
                  View on {selectedTender.source}
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TenderListing;