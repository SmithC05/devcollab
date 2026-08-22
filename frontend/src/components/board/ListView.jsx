import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useTaskStore, COLUMNS, PRIORITY_COLORS } from '../../stores/taskStore';
import { useMemberStore } from '../../stores/memberStore';

export default function ListView({ onTaskClick }) {
  const { getAllTasks } = useTaskStore();
  const { members } = useMemberStore();
  const tasks = getAllTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(t => t.columnId === statusFilter);
    }
    
    result.sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, sortConfig]);

  const getStatusLabel = (colId) => COLUMNS.find(c => c.id === colId)?.label || colId;
  const getAssignee = (name) => members.find(m => m.name === name);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ChevronDown size={12} color="#444" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} color="#fff" /> : <ChevronDown size={12} color="#fff" />;
  };

  const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1e1e1e', cursor: 'pointer', userSelect: 'none' };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #1a1a1a', color: '#ccc' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '0 12px', flex: 1, maxWidth: '300px' }}>
          <Search size={14} color="#666" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#e5e5e5', fontSize: '13px', padding: '8px', outline: 'none', width: '100%' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: '#111', border: '1px solid #1e1e1e', color: '#e5e5e5', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">All Statuses</option>
          {COLUMNS.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
        </select>
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => handleSort('title')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Task <SortIcon columnKey="title" /></div>
              </th>
              <th style={thStyle} onClick={() => handleSort('columnId')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Status <SortIcon columnKey="columnId" /></div>
              </th>
              <th style={thStyle} onClick={() => handleSort('assignee')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Assignee <SortIcon columnKey="assignee" /></div>
              </th>
              <th style={thStyle} onClick={() => handleSort('priority')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Priority <SortIcon columnKey="priority" /></div>
              </th>
              <th style={thStyle} onClick={() => handleSort('dueDate')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Due Date <SortIcon columnKey="dueDate" /></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
                  No tasks found matching criteria.
                </td>
              </tr>
            ) : filteredTasks.map(task => {
              const assignee = getAssignee(task.assignee);
              const pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.P2;
              
              return (
                <tr 
                  key={task.id} 
                  onClick={() => onTaskClick(task)}
                  style={{ cursor: 'pointer', transition: 'background 100ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#111'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: '#f5f5f5', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>{task.id}</span>
                      {task.title}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '12px', color: '#888', background: '#161616', padding: '4px 8px', borderRadius: '4px', border: '1px solid #222' }}>
                      {getStatusLabel(task.columnId)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: assignee.avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>
                          {assignee.avatar}
                        </div>
                        <span style={{ fontSize: '12px' }}>{assignee.name}</span>
                      </div>
                    ) : <span style={{ fontSize: '12px', color: '#555' }}>Unassigned</span>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: pColor.bg, color: pColor.text, border: `1px solid ${pColor.border}` }}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '12px', color: task.dueDate ? '#ccc' : '#555' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
