import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, BookOpen } from 'lucide-react';

export default function MeetingCalendar({ meetings, onDateClick, isSensei }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Helper to check if a day has meetings
  const getMeetingsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return meetings.filter(m => m.meeting_date === dateStr);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
        <h2 className="text-[15px] sm:text-[18px] font-black text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          Kalender Pertemuan
        </h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={prevMonth} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <span className="font-bold text-[12px] sm:text-[15px] min-w-[80px] sm:min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>
      </div>
      
      <div className="p-2 sm:p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
            <div key={i} className="text-center text-[10px] sm:text-[12px] font-bold text-slate-500 uppercase py-1 sm:py-2">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, index) => {
            let dayMeetings = getMeetingsForDay(day);
            const isWeekend = day && (index % 7 === 0 || index % 7 === 6);
            
            if (isWeekend && dayMeetings.length === 0) {
              dayMeetings = [{
                id: `weekend-${day}`,
                title: "Libur",
                description: "Libur rutin hari Sabtu dan Minggu.",
                type: "Libur",
                isAuto: true
              }];
            }

            const hasMeeting = dayMeetings.length > 0;
            const isToday = day === new Date().getDate() && 
                            currentDate.getMonth() === new Date().getMonth() && 
                            currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div 
                key={index} 
                onClick={() => {
                  if (day) {
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    onDateClick(dateStr, dayMeetings);
                  }
                }}
                className={`
                  aspect-square border rounded-[1rem] p-1.5 transition-all flex flex-col items-center justify-center relative
                  ${day ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md bg-white' : 'bg-transparent border-transparent'}
                  ${isToday ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-100'}
                  ${hasMeeting ? (dayMeetings.some(m => m.type === 'Libur') ? 'bg-rose-50/50' : 'bg-indigo-50/50') : ''}
                `}
              >
                {day && (
                  <div className="flex flex-col h-full w-full items-center justify-center relative">
                    <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-indigo-600 text-white shadow-sm' : (isWeekend ? 'text-rose-500' : 'text-slate-700')}`}>
                      {day}
                    </span>
                    
                    <div className="flex gap-1 mt-1 justify-center flex-wrap">
                      {dayMeetings.map((m, i) => (
                        <div key={m.id || i} title={m.title} className={`w-1.5 h-1.5 rounded-full ${m.type === 'Libur' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                      ))}
                    </div>

                    {isSensei && (
                      <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100">
                        <Plus className="w-3 h-3 text-slate-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
