import { useMemo } from 'react';
import { useActivityStore, TYPE_COLORS } from '../../stores/activityStore';
import { formatDistanceToNow, parseISO } from 'date-fns';

const FILTERS = [
  { id: 'all',           label: 'All' },
  { id: 'tasks',         label: 'Tasks' },
  { id: 'members',       label: 'Members' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'code',          label: 'Code' },
  { id: 'comments',      label: 'Comments' },
];

const TYPE_ICONS = {
  task:    '📋',
  member:  '👤',
  docs:    '📄',
  code:    '💻',
  comment: '💬',
};

function getIntensityColor(count) {
  if (count === 0) return '#161616';
  if (count <= 2)  return '#333';
  if (count <= 4)  return '#666';
  if (count <= 6)  return '#999';
  return '#eee';
}

function groupEventsByDay(events) {
  const groups = {};
  for (const ev of events) {
    const date = ev.time.split('T')[0];
    const now = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const label = date === now ? 'Today' : date === yesterday ? 'Yesterday' : date;
    if (!groups[label]) groups[label] = [];
    groups[label].push(ev);
  }
  return groups;
}

export default function ProjectActivityPage({ projectId = 1 }) {
  const { activityGrid, activeFilter, setFilter, getFilteredEvents, fetchEvents, isLoaded, addEvent } = useActivityStore();
  const filteredEvents = getFilteredEvents();
  const grouped = useMemo(() => groupEventsByDay(filteredEvents), [filteredEvents]);

  import('react').then(({ useEffect }) => {
    useEffect(() => {
      if (!isLoaded) {
        fetchEvents(projectId);
      }
      
      const handleEngineEvent = (e) => {
        addEvent(e.detail);
      };
      
      document.addEventListener('engine_event', handleEngineEvent);
      return () => document.removeEventListener('engine_event', handleEngineEvent);
    }, [projectId, isLoaded, fetchEvents, addEvent]);
  });

  const weeks = useMemo(() => {
    const result = [];
    for (let w = 0; w < 13; w++) {
      result.push(activityGrid.slice(w * 7, w * 7 + 7));
    }
    return result;
  }, [activityGrid]);

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#080808', color: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Activity</h1>
        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>Project contribution history and event timeline.</p>
      </div>

      {/* Contribution Graph */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '20px 24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#d5d5d5' }}>Contributions — last 90 days</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '10px', color: '#555' }}>Less</span>
            {['#161616', '#333', '#666', '#999', '#eee'].map((c) => (
              <div key={c} style={{ width: '11px', height: '11px', borderRadius: '2px', background: c }} />
            ))}
            <span style={{ fontSize: '10px', color: '#555' }}>More</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: '4px', paddingTop: '2px' }}>
            {DAY_LABELS.map((d) => (
              <div key={d} style={{ height: '11px', fontSize: '9px', color: '#444', lineHeight: '11px', width: '22px' }}>{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((day, di) => (
                <div key={di} title={`${day.date}: ${day.count} activities`} style={{ width: '11px', height: '11px', borderRadius: '2px', background: getIntensityColor(day.count), cursor: 'pointer', transition: 'opacity 150ms' }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
              border: '1px solid',
              borderColor: activeFilter === f.id ? '#555' : '#2a2a2a',
              background: activeFilter === f.id ? '#1a1a1a' : 'transparent',
              color: activeFilter === f.id ? '#eee' : '#666',
              cursor: 'pointer', transition: 'all 120ms',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(grouped).map(([day, events]) => (
          <div key={day}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>{day}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {events.map((ev) => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: '#111', border: '1px solid #1a1a1a', marginBottom: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                    {TYPE_ICONS[ev.type]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', color: '#d5d5d5' }}><strong style={{ color: '#f5f5f5', fontWeight: 600 }}>{ev.user}</strong> {ev.action}</span>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>{formatDistanceToNow(parseISO(ev.time), { addSuffix: true })}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#1a1a1a', color: TYPE_COLORS[ev.type], border: '1px solid #2a2a2a', flexShrink: 0 }}>
                    {ev.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontSize: '14px' }}>No events for this filter.</div>}
      </div>
    </div>
  );
}
