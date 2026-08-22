import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore, PRIORITY_COLORS } from '../../stores/taskStore';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function CalendarView({ onTaskClick }) {
  const { getAllTasks } = useTaskStore();
  const tasks = getAllTasks();
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  const getTasksForDay = (date) => {
    return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));
  };

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#f5f5f5' }}>
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={goToday} style={{ padding: '6px 12px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '6px', color: '#ccc', cursor: 'pointer', fontSize: '12px' }}>
            Today
          </button>
          <div style={{ display: 'flex', background: '#111', border: '1px solid #1e1e1e', borderRadius: '6px', overflow: 'hidden' }}>
            <button onClick={prevMonth} style={{ padding: '6px 8px', background: 'none', border: 'none', borderRight: '1px solid #1e1e1e', color: '#ccc', cursor: 'pointer' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextMonth} style={{ padding: '6px 8px', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #1e1e1e', background: '#111' }}>
          {WEEKDAYS.map(day => (
            <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr' }}>
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayTasks = getTasksForDay(day);

            return (
              <div 
                key={day.toString()} 
                style={{ 
                  borderRight: (idx + 1) % 7 !== 0 ? '1px solid #1e1e1e' : 'none',
                  borderBottom: idx < days.length - 7 ? '1px solid #1e1e1e' : 'none',
                  padding: '8px',
                  background: isCurrentMonth ? 'transparent' : '#0d0d0d',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                  <span style={{ 
                    fontSize: '12px', fontWeight: 600, 
                    color: isToday ? '#fff' : (isCurrentMonth ? '#888' : '#444'),
                    background: isToday ? '#333' : 'transparent',
                    padding: '2px 6px', borderRadius: '4px'
                  }}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                  {dayTasks.map(task => {
                    const pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.P2;
                    return (
                      <div 
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        style={{
                          fontSize: '11px', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer',
                          background: '#161616', border: `1px solid ${pColor.border}`,
                          color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          transition: 'background 150ms'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#161616'}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
