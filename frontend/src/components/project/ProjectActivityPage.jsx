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
  if (count === 0) return 'var(--surface-raised)';
  if (count <= 2)  return 'var(--border-strong)';
  if (count <= 4)  return 'var(--text-muted)';
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
    <div style={{ height: '100vh', overflow: 'auto', background: '#080808', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Activity</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Project contribution history and event timeline.</p>
      </div>

      {/* Contribution Graph */}
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '10px', padding: '20px 24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#d5d5d5' }}>Contributions — last 90 days</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Less</span>
            {['var(--surface-raised)', 'var(--border-strong)', 'var(--text-muted)', '#999', '#eee'].map((c) => (
              <div key={c} style={{ width: '11px', height: '11px', borderRadius: '2px', background: c }} />
            ))}
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>More</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: '4px', paddingTop: '2px' }}>
            {DAY_LABELS.map((d) => (
              <div key={d} style={{ height: '11px', fontSize: '9px', color: 'var(--focus-ring)', lineHeight: '11px', width: '22px' }}>{d}</div>
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
              borderColor: activeFilter === f.id ? 'var(--text-muted)' : 'var(--border-strong)',
              background: activeFilter === f.id ? 'var(--surface-hover)' : 'transparent',
              color: activeFilter === f.id ? '#eee' : 'var(--text-muted)',
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
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>{day}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {events.map((ev) => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', marginBottom: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                    {TYPE_ICONS[ev.type]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', color: '#d5d5d5' }}><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ev.user}</strong> {ev.action}</span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{formatDistanceToNow(parseISO(ev.time), { addSuffix: true })}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'var(--surface-hover)', color: TYPE_COLORS[ev.type], border: '1px solid var(--border-strong)', flexShrink: 0 }}>
                    {ev.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '14px' }}>No events for this filter.</div>}
      </div>
    </div>
  );
}
