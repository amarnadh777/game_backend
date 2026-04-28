import React, { useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- HELPER: GENERATE CALENDAR DAYS ---
const getDaysInMonth = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];
  
  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, current: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true, date: new Date(year, month, i) });
  }
  // Next month padding (to fill 42 cells / 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
  }
  return days;
};

// --- HELPER: DATE COMPARISON ---
const isSameDay = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();
const isWithinRange = (target, start, end) => start && end && target > start && target < end;

// --- HELPER: FORMAT FOR API (YYYY-MM-DD) ---
const formatForApi = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- HELPER: FORMAT FOR DISPLAY (e.g., April 17, 2026) ---
const formatForDisplay = (date) => {
  if (!date) return 'Select Date';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const ExportModal = ({ isOpen, onClose }) => {
  // 1. Date Selection State
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 2. Calendar View State (Controls which months are visible, defaults to today)
  const [viewDate, setViewDate] = useState(new Date());

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  // 3. Click Logic: Start Date -> End Date -> Reset
  const handleDayClick = (clickedDate) => {
    if (!startDate || (startDate && endDate)) {
      // Start a new selection
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (clickedDate < startDate) {
      // If they click a date before the start, make it the new start
      setStartDate(clickedDate);
    } else {
      // Complete the range
      setEndDate(clickedDate);
    }
  };

  // 4. Generate Data for Left and Right Calendars
  const leftMonthData = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const rightMonthData = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth() + 1);

  // 5. Download Handler
  const handleDownload = () => {
    if (!startDate || !endDate) {
      alert("Please select both a start and end date first.");
      return;
    }

    const startStr = formatForApi(startDate);
    const endStr = formatForApi(endDate);
    const downloadUrl = `${import.meta.env.VITE_API_URL}/game-sessions/leaderboard/download?startDate=${startStr}&endDate=${endStr}`;
    
    window.open(downloadUrl, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[650px] shadow-2xl relative border border-gray-200">
        
        {/* Header */}
        <div className="relative py-4 border-b border-gray-200 flex justify-center items-center">
          <h2 className="text-base font-bold text-black tracking-wide">Choose data range to export data</h2>
          <button onClick={onClose} className="absolute right-4 text-gray-500 hover:text-black transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="border border-gray-200 rounded p-4 mb-4 select-none">
            
            {/* Selected Range Display */}
            <div className="flex items-center justify-center gap-6 mb-6 text-sm font-bold text-black">
              <span className={!startDate ? "text-gray-400" : ""}>
                {formatForDisplay(startDate)}
              </span>
              <span className="text-gray-400">→</span>
              <span className={!endDate ? "text-gray-400" : ""}>
                {formatForDisplay(endDate)}
              </span>
            </div>

            {/* Dual Calendars */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-0">
              
              {/* LEFT CALENDAR */}
              <div className="flex-1 md:pr-4 md:border-r border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={handlePrevMonth} className="text-gray-400 hover:text-black p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{MONTHS[viewDate.getMonth()]}</span>
                    <span className="text-sm font-bold">{viewDate.getFullYear()}</span>
                  </div>
                  {/* Invisible spacer to keep month centered */}
                  <div className="w-6 hidden md:block"></div>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map(day => (
                    <div key={`left-${day}`} className="text-center text-[11px] font-medium text-gray-400">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1">
                  {leftMonthData.map((d, idx) => {
                    const isStart = isSameDay(d.date, startDate);
                    const isEnd = isSameDay(d.date, endDate);
                    const inRange = isWithinRange(d.date, startDate, endDate);
                    const isToday = isSameDay(d.date, new Date());

                    return (
                      <div key={`left-day-${idx}`} className={`h-8 flex items-center justify-center relative ${inRange ? 'bg-[#F2F2F2]' : ''} ${isStart && endDate ? 'bg-gradient-to-r from-transparent via-[#F2F2F2] to-[#F2F2F2]' : ''} ${isEnd && startDate ? 'bg-gradient-to-l from-transparent via-[#F2F2F2] to-[#F2F2F2]' : ''}`}>
                         <span 
                           onClick={() => handleDayClick(d.date)}
                           className={`
                             flex items-center justify-center w-7 h-7 text-xs z-10 cursor-pointer
                             ${!d.current ? 'text-gray-300 hover:text-gray-600' : 'text-black hover:bg-gray-200'}
                             ${(isStart || isEnd) ? 'bg-black text-white rounded-full hover:bg-gray-800' : 'rounded-full'}
                             ${(isToday && !isStart && !isEnd) ? 'border border-black' : ''}
                           `}
                         >
                           {d.day}
                         </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT CALENDAR */}
              <div className="flex-1 md:pl-4 mt-6 md:mt-0">
                <div className="flex items-center justify-between mb-4">
                  {/* Invisible spacer */}
                  <div className="w-6 hidden md:block"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{MONTHS[(viewDate.getMonth() + 1) % 12]}</span>
                    <span className="text-sm font-bold">{viewDate.getMonth() === 11 ? viewDate.getFullYear() + 1 : viewDate.getFullYear()}</span>
                  </div>
                  <button onClick={handleNextMonth} className="text-gray-400 hover:text-black p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map(day => (
                    <div key={`right-${day}`} className="text-center text-[11px] font-medium text-gray-400">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1">
                  {rightMonthData.map((d, idx) => {
                    const isStart = isSameDay(d.date, startDate);
                    const isEnd = isSameDay(d.date, endDate);
                    const inRange = isWithinRange(d.date, startDate, endDate);
                    const isToday = isSameDay(d.date, new Date());

                    return (
                      <div key={`right-day-${idx}`} className={`h-8 flex items-center justify-center relative ${inRange ? 'bg-[#F2F2F2]' : ''} ${isStart && endDate ? 'bg-gradient-to-r from-transparent via-[#F2F2F2] to-[#F2F2F2]' : ''} ${isEnd && startDate ? 'bg-gradient-to-l from-transparent via-[#F2F2F2] to-[#F2F2F2]' : ''}`}>
                         <span 
                           onClick={() => handleDayClick(d.date)}
                           className={`
                             flex items-center justify-center w-7 h-7 text-xs z-10 cursor-pointer
                             ${!d.current ? 'text-gray-300 hover:text-gray-600' : 'text-black hover:bg-gray-200'}
                             ${(isStart || isEnd) ? 'bg-black text-white rounded-full hover:bg-gray-800' : 'rounded-full'}
                             ${(isToday && !isStart && !isEnd) ? 'border border-black' : ''}
                           `}
                         >
                           {d.day}
                         </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Footer Button */}
          <div className="flex justify-center mt-6 mb-2">
            <button 
              onClick={handleDownload}
              className="bg-black hover:bg-gray-800 text-white text-xs font-bold py-2 px-8 rounded-sm shadow transition-colors"
            >
              Download
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExportModal;