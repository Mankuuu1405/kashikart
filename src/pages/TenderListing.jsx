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
  FileSpreadsheet,
} from 'lucide-react';
import { EmptyState } from '../components/States';
import { getErrorMessage, requestJson, requestWithRetry } from '../utils/api';
import { isValidTender, mapExcelToTender, mapTenderForDisplay, setKeywords } from '../utils/Excelmapper';

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

const EXCEL_ENDPOINTS = {
  all: '/api/excel_control/excel/all',
};

const KEYWORD_ENDPOINTS = {
  active: '/api/keywords/active',
  list: '/api/keywords/',
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
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
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

  // Excel tenders state
  const [showExcelTenders, setShowExcelTenders] = useState(true);
  const [excelTenders, setExcelTenders] = useState([]);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [showAllExcelRows, setShowAllExcelRows] = useState(false); // Debug: show all rows

  // Keywords state
  const [keywordsLoaded, setKeywordsLoaded] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalTenders, setTotalTenders] = useState(0);

  // Tenders data
  const [tenders, setTenders] = useState([]);
  const [sources, setSources] = useState(['All Sources']);

  const statuses = ['All Status', 'new', 'viewed', 'saved', 'expired', 'open', 'closed', 'pending'];

  // Fetch keywords from backend and update the mapper
  const fetchKeywords = async () => {
    try {
      console.log('🔑 Fetching keywords from backend...');
      
      // Try the active keywords endpoint first
      let keywordData;
      try {
        keywordData = await requestJson(KEYWORD_ENDPOINTS.active);
      } catch (err) {
        console.log('Active endpoint failed, trying list endpoint...');
        keywordData = await requestJson(KEYWORD_ENDPOINTS.list);
      }
      
      console.log('📦 Raw keyword data:', keywordData);
      
      // Handle different response formats
      let keywords = [];
      if (Array.isArray(keywordData)) {
        keywords = keywordData.map(k => k.keyword || k.name || k).filter(Boolean);
      } else if (keywordData?.items && Array.isArray(keywordData.items)) {
        keywords = keywordData.items.map(k => k.keyword || k.name || k).filter(Boolean);
      } else if (keywordData?.data && Array.isArray(keywordData.data)) {
        keywords = keywordData.data.map(k => k.keyword || k.name || k).filter(Boolean);
      }
      
      if (keywords.length > 0) {
        console.log(`✅ Loaded ${keywords.length} keywords from backend`);
        console.log('📋 Sample keywords:', keywords.slice(0, 10));
        setKeywords(keywords); // Update the mapper's keyword list
        setKeywordsLoaded(true);
      } else {
        console.warn('⚠️ No keywords found in response, using default keyword list');
        setKeywordsLoaded(true);
      }
      
    } catch (err) {
      console.error('❌ Error fetching keywords:', err);
      console.log('ℹ️ Using default keyword list from mapper');
      setKeywordsLoaded(true); // Still mark as loaded to continue
    }
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch Excel tenders
  const fetchExcelTenders = async () => {
    // Wait for keywords to be loaded first
    if (!keywordsLoaded) {
      console.log('⏳ Waiting for keywords to load before fetching Excel tenders...');
      return;
    }

    try {
      setLoadingExcel(true);
      
      console.log('🔍 Fetching Excel data for tenders...');
      const data = await requestJson(`${EXCEL_ENDPOINTS.all}?page=1&limit=1000`);
      
      console.log('📦 Raw API response:', data);
      
      // Handle different response formats
      let rawData = null;
      if (Array.isArray(data)) {
        rawData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        rawData = data.data;
      } else if (data?.items && Array.isArray(data.items)) {
        rawData = data.items;
      } else {
        console.warn('⚠️ Unknown response format:', data);
        setExcelTenders([]);
        return;
      }
      
      console.log(`📊 Found ${rawData.length} raw Excel rows`);
      
      // Filter by detected_sheet_type
      const tenderRows = rawData; // Show all rows!
      
      console.log(`🎯 Found ${tenderRows.length} tender rows`);
      
      // Map tender rows using the mapper (which now includes keyword matching)
      const excelTenderData = tenderRows.map(row => mapExcelToTender(row));
      console.log(`🗺️ Mapped ${excelTenderData.length} tenders`);
      
      // Filter valid tenders
      const validTenders = excelTenderData.filter(isValidTender);
      console.log(`✅ ${validTenders.length} valid tenders after filtering`);
      
      // Map to display format (includes keyword matching)
      const mappedTenders = validTenders.map(tender => mapTenderForDisplay(tender));
      
      // Log keyword matching stats
      const tendersWithKeywords = mappedTenders.filter(t => t.keywords && t.keywords.length > 0);
      console.log(`🔑 ${tendersWithKeywords.length} tenders have keyword matches`);
      if (tendersWithKeywords.length > 0) {
        console.log('📋 Sample tender with keywords:', tendersWithKeywords[0].title, '→', tendersWithKeywords[0].keywords);
      }
      
      setExcelTenders(mappedTenders);
      console.log(`✅ Successfully loaded ${mappedTenders.length} tenders from Excel`);
      
    } catch (err) {
      console.error('❌ Error fetching Excel tenders:', err);
      setExcelTenders([]);
    } finally {
      setLoadingExcel(false);
    }
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
        keywords: tender.keyword_matches ? tender.keyword_matches.map(k => k.keyword) : [],
        published: tender.published_date ? new Date(tender.published_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
        description: tender.description || 'No description available',
        attachments: tender.attachments || [],
        source_url: tender.source_url,
        isExcelTender: false,
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

  // Get combined tenders with filtering
  const getCombinedTenders = () => {
    if (!showExcelTenders) {
      return tenders;
    }
    
    // Filter Excel tenders by search and status
    let filteredExcelTenders = [...excelTenders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredExcelTenders = filteredExcelTenders.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.code.toLowerCase().includes(query) ||
        t.agency.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.keywords && t.keywords.some(k => k.toLowerCase().includes(query)))
      );
    }
    
    if (selectedStatus !== 'All Status') {
      filteredExcelTenders = filteredExcelTenders.filter(t =>
        t.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    
    return [...tenders, ...filteredExcelTenders];
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
        keywords: data.keyword_matches ? data.keyword_matches.map(k => k.keyword) : [],
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

  // Fetch keywords first, then fetch tenders
  useEffect(() => {
    fetchKeywords();
  }, []);

  // Fetch tenders when keywords are loaded and filters change
  useEffect(() => {
    if (keywordsLoaded) {
      fetchTenders();
      fetchExcelTenders();
    }
  }, [keywordsLoaded, currentPage, searchQuery, selectedStatus, selectedSource, startDate, endDate]);

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
    if (tender.isExcelTender) {
      setSelectedTender(tender);
    } else {
      await fetchTenderDetails(tender.id);
    }
  };

  const handleSaveTender = async (tenderId) => {
    await updateTenderStatus(tenderId, 'saved');
    setOpenDropdown(null);
  };

  const displayTenders = getCombinedTenders();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 z-20 bg-gray-50 px-6 pt-4 pb-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 text-xl">
              Tender Listings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalTenders + excelTenders.length} tenders found
              {excelTenders.length > 0 && showExcelTenders && (
                <span className="text-blue-600"> (including {excelTenders.length} from Excel)</span>
              )}
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

      {(loading || loadingExcel) && (
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

            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={showExcelTenders}
                onChange={(e) => setShowExcelTenders(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <FileSpreadsheet size={14} />
              <span className="text-sm font-medium text-gray-700">
                Show Excel Tenders ({excelTenders.length})
              </span>
            </label>

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
                {displayTenders.length === 0 && !loading && !loadingExcel ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <EmptyState
                        title="No tenders found"
                        message="Try adjusting filters or check back later."
                      />
                    </td>
                  </tr>
                ) : (
                  displayTenders.map((t) => (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-gray-50 transition ${t.isExcelTender ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          {t.isExcelTender && (
                            <FileSpreadsheet size={14} className="text-blue-600 flex-shrink-0" />
                          )}
                          <p className="text-sm font-semibold text-gray-800 max-w-[300px]">
                            {t.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">{t.code}</p>
                        {t.isExcelTender && t.type && (
                          <p className="text-xs text-blue-600 mt-0.5">{t.type}</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 mb-1">{t.agency}</p>
                        <p className="text-xs text-gray-500">{t.location}</p>
                        {t.contact && (
                          <p className="text-xs text-gray-400 mt-0.5">{t.contact}</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {t.isExcelTender && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              Excel
                            </span>
                          )}
                          <span className="text-sm text-gray-600">{t.source}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800 font-medium mb-1">{t.deadline}</p>
                        <p className="text-xs text-gray-500">
                          {t.daysLeft > 0 ? `${t.daysLeft} days left` : 'Expired'}
                        </p>
                        {t.phase && (
                          <p className="text-xs text-blue-600 mt-0.5">Phase: {t.phase}</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {t.keywords && t.keywords.length > 0 ? (
                            t.keywords.slice(0, 3).map((keyword, idx) => (
                              <span
                                key={idx}
                                className="w-fit px-2.5 py-0.5 rounded-full bg-blue-100 text-xs font-medium text-blue-700"
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No keywords</span>
                          )}
                          {t.keywords && t.keywords.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{t.keywords.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-3 text-gray-600">
                          <button
                            className="p-1.5 rounded hover:bg-blue-500 transition"
                            onClick={() => handleViewTender(t)}
                            title="View details"
                          >
                            <Eye
                              size={18}
                              strokeWidth={2}
                              className="cursor-pointer text-gray-600 hover:text-white"
                            />
                          </button>
                          
                          {!t.isExcelTender && (
                            <>
                              <button
                                className="p-1.5 rounded hover:bg-blue-500 transition"
                                onClick={() => handleSaveTender(t.id)}
                                title="Save tender"
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
                            </>
                          )}
                          
                          {t.isExcelTender && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              From Excel
                            </span>
                          )}
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
          <span>
            Showing {displayTenders.length} of {totalTenders + excelTenders.length} tenders
          </span>
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
                <div className="flex gap-2">
                  <StatusBadge status={selectedTender.status} />
                  {selectedTender.isExcelTender && (
                    <span className="px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                      <FileSpreadsheet size={12} />
                      Excel Import
                    </span>
                  )}
                </div>
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

              {selectedTender.type && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="text-sm font-semibold text-blue-900">{selectedTender.type}</p>
                </div>
              )}

              {selectedTender.contact && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Contact</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedTender.contact}</p>
                </div>
              )}

              {selectedTender.keywords && selectedTender.keywords.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-gray-900">Keyword Matches</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {selectedTender.keywords.length}
                    </span>
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