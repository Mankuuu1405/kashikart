import React, { useEffect, useState } from 'react';
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

const StatusBadge = ({ status }) => {
  const styles = {
    New: 'bg-green-100 text-green-700',    
    Viewed: 'bg-gray-100 text-gray-700',
    Saved: 'bg-blue-100 text-blue-700',
    Expired: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-md text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const TenderListing = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [showDatePicker, setShowDatePicker] = useState(false);
  // const [startDate, setStartDate] = useState(null);
  // const [endDate, setEndDate] = useState(null);

  const [startDate, setStartDate] = useState(null); // Date | null
  const [endDate, setEndDate] = useState(null);     // Date | null
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0));
  const [selectedTender, setSelectedTender] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);



  const allTenders = [
    {
      id: 1,
      title: 'IT Infrastructure Modernization for Federal facilities',
      code: 'GSA-2026-IT-001',
      agency: 'General Service Administration',
      location: 'Washington, DC',
      source: 'SAM.gov',
      deadline: 'FEB 15, 2026',
      daysLeft: 33,
      status: 'New',
      keywords: ['IT Infrastructure', 'Modernization'],
      published: 'Thursday, January 1, 2026',
      description: 'Seeking qualified contractors for comprehensive IT infrastructure modernization across federal facilities nationwide.',
      attachments: [
        { name: 'RFP_Document.pdf', size: '2.4 MB' },
        { name: 'Technical_Requirements.pdf', size: '1.8 MB' }
      ]
    },
    {
      id: 2,
      title: 'Highway Construction Project - Interstate 95 Expansion',
      code: 'DOT-HWY-2026-042',
      agency: 'Department of Transportation',
      location: 'Virginia',
      source: 'DOT Portal',
      deadline: 'JAN 30, 2026',
      daysLeft: 17,
      status: 'Viewed',
      keywords: ['Construction', 'Highway'],
      published: 'Sunday, December 28, 2025',
      description: 'Major highway expansion project requiring experienced contractors for Interstate 95 corridor improvements.',
    },
    {
      id: 3,
      title: 'Healthcare Equipment Procurement - Medical Imaging',
      code: 'VA-MED-2026-108',
      agency: 'Veterans Affairs',
      location: 'Multiple Locations',
      source: 'VA Procurement',
      deadline: 'FEB 28, 2026',
      daysLeft: 46,
      status: 'New',
      keywords: ['Medical Equipment', 'Healthcare'],
      published: 'Monday, January 5, 2026',
      description: 'Procurement of advanced medical imaging equipment for VA facilities across multiple locations.',
    },
    {
      id: 4,
      title: 'Cybersecurity Services - Federal Network Protection',
      code: 'DHS-CYBER-2026-015',
      agency: 'Department of Homeland Security',
      location: 'Remote/DC',
      source: 'DHS Contracts',
      deadline: 'MAR 1, 2026',
      daysLeft: 47,
      status: 'Saved',
      keywords: ['IT', 'Cybersecurity'],
      published: 'Wednesday, January 8, 2026',
      description: 'Comprehensive cybersecurity services for federal network protection and threat monitoring.',
    },
    {
      id: 5,
      title: 'Building Renovation - Federal Courthouse',
      code: 'GSA-CONST-2026-087',
      agency: 'General Services Administration (GSA)',
      location: 'New York, NY',
      source: 'SAM.gov',
      deadline: 'JAN 25, 2026',
      daysLeft: 12,
      status: 'New',
      keywords: ['Construction', 'Renovation'],
      published: 'Friday, December 20, 2025',
      description: 'Complete renovation of federal courthouse building including structural improvements and modernization.',
    },
    {
      id: 6,
      title: 'Environmental Consulting Services',
      code: 'EPA-ENV-2026-033',
      agency: 'Environmental Protection Agency',
      location: 'California',
      source: 'EPA Portal',
      deadline: 'FEB 10, 2026',
      daysLeft: 28,
      status: 'Expired',
      keywords: ['Environmental', 'Consulting'],
      published: 'Tuesday, December 15, 2025',
      description: 'Environmental impact assessment and consulting services for federal projects in California.',
    },
    {
      id: 7,
      title: 'Software Development - Case Management System',
      code: 'DOJ-IT-2026-022',
      agency: 'Department of Justice',
      location: 'Washington, DC',
      source: 'DOJ Procurement',
      deadline: 'MAR 15, 2026',
      daysLeft: 61,
      status: 'New',
      keywords: ['Software Development', 'IT'],
      published: 'Saturday, January 4, 2026',
      description: 'Development of comprehensive case management system for Department of Justice operations.',
    },
    {
      id: 8,
      title: 'Facility Management Services - Military Bases',
      code: 'DOD-FAC-2026-156',
      agency: 'Department of Defense',
      location: 'Multiple Locations',
      source: 'DoD Contracts',
      deadline: 'FEB 20, 2026',
      daysLeft: 38,
      status: 'Viewed',
      keywords: ['Facility Management'],
      published: 'Thursday, December 10, 2025',
      description: 'Comprehensive facility management services for military bases including maintenance and operations.',
    },
  ];


  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All Status');
    setSelectedSource('All Sources');
    setStartDate(null);
    setEndDate(null);
    setShowDatePicker(false);
  };

  const hasActiveFilters = searchQuery || selectedStatus !== 'All Status' || selectedSource !== 'All Sources' || startDate || endDate;



  useEffect(() => {
    if (startDate && endDate) {
      setShowDatePicker(false);
    }
  }, [startDate, endDate]);

  const filteredTenders = allTenders.filter(tender => {
    const matchesSearch = 
      searchQuery === '' ||
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'All Status' || tender.status === selectedStatus;
    const matchesSource = selectedSource === 'All Sources' || tender.source === selectedSource;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
       const tenderDeadline = new Date(tender.deadline + " 2026");
      // For now, we'll skip date filtering on tender data since tenders don't have dates
      // This would need deadline conversion if you want to filter by deadline

      matchesDate = tenderDeadline >= startDate && tenderDeadline <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesSource && matchesDate;
  });

  const sources = ['All Sources', 'SAM.gov', 'DOT Portal', 'VA Procurement', 'DHS Contracts', 'EPA Portal', 'DOJ Procurement','DoD Contracts','NASA Procurement'];
  const statuses = ['All Status', 'New', 'Viewed', 'Saved', 'Expired' ];

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
      // const isStart = startDate === dateStr;
      // const isEnd = endDate === dateStr;
      const isStart = startDate && currentDate.toDateString() === startDate.toDateString();
      const isEnd = endDate && currentDate.toDateString() === endDate.toDateString();
      
      // let isInRange = false;
      // if (startDate && endDate) {
      //   const startDateObj = new Date(startDate);
      //   const endDateObj = new Date(endDate);
      //   isInRange = currentDate > startDateObj && currentDate < endDateObj;
      // }

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
          className={`text-center py-2 text-sm rounded-lg transition ${
            isToday 
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 z-20 bg-gray-50 px-6 pt-4 pb-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 text-xl">
              Tender Listings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredTenders.length} tenders found
            </p>
          </div>
          <Bell size={18} className="text-gray-500 cursor-pointer hover:text-gray-700" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-10 py-6">
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 shadow-sm">
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, agency, reference ID, or keywords..."
              className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={14} />
              <span className="text-sm">Filters:</span>
            </div>

             {/* <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-gray-400">
              {statuses.map(status => (
                <option key={status}  value={status} >{status}</option>
              ))}
            </select>  */}


            <div className="relative">
              <button
                onClick={() => setStatusOpen(v => !v)}
                className="
                  flex items-center justify-between gap-2
                  border border-gray-300 rounded-md
                  px-4 py-2 text-sm text-gray-700
                  min-w-[160px]
                  hover:border-gray-400 hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
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
                          }}
                          className={`
                            flex w-full items-center gap-2 px-3 py-2 text-sm
                            transition  rounded hover:bg-blue-500 hover:text-white
                            ${isSelected ? ' text-gray-700 font-medium' : 'text-gray-700'}
                          `}
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

            

            {/* <select 
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-gray-400"
            >
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select> */}

            <div className="relative">
              <button
                onClick={() => setSourceOpen(v => !v)}
                className="
                  flex items-center justify-between gap-2
                  border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 min-w-[180px] hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                          }}
                          className={`
                            flex w-full items-center gap-2 px-3 py-2 text-sm
                            transition  rounded hover:bg-blue-500 hover:text-white
                            ${isSelected ? 'text-gray-700 font-medium' : 'text-gray-700'}
                          `}
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
                  className="
                    inline-flex items-center justify-center gap-2
                    whitespace-nowrap text-sm font-medium
                    text-muted-foreground hover:text-foreground
                    hover:bg-blue-400
                    rounded-md px-3 h-9
                    transition-colors
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-blue-500
                    focus-visible:ring-offset-2
                    disabled:pointer-events-none disabled:opacity-50
                    [&_svg]:pointer-events-none
                    [&_svg]:size-4
                    [&_svg]:shrink-0
                  "
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
                {filteredTenders.map((t) => (
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
                        {t.keywords.map((keyword, idx) => (
                          <span 
                            key={idx}
                            className="w-fit px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-gray-600">
                        <button
                          className="p-1.5 rounded hover:bg-blue-500 transition"
                          onClick={() => setSelectedTender(t)}
                        >
                          <Eye 
                            size={18} 
                            strokeWidth={2} 
                            className="cursor-pointer text-gray-600 hover:text-white" 
                          />
                        </button>
                        <button className="p-1.5 rounded hover:bg-blue-500 transition">
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
                                <button
                                  onClick={() => {
                                    setSelectedTender(t);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 rounded hover:bg-blue-500 hover:text-white flex items-center gap-2"
                                >
                                  <ExternalLink size={14} />
                                  Open Source URL
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTender(t);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700  rounded hover:bg-blue-500 hover:text-white flex items-center gap-2"
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>Showing {filteredTenders.length} of {allTenders.length} tenders</span>
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

              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition">
                <ExternalLink size={18} />
                View on {selectedTender.source}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TenderListing; 