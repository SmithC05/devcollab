import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Columns3, Loader2 } from 'lucide-react';
import { taskApi } from '../../api/taskApi';
import { useAuthStore } from '../../stores/authStore';
import TaskModal from '../board/TaskModal';

export default function ProjectMyTasksPage() {
  const { projectId } = useParams();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await taskApi.getTasks(projectId);
      const allTasks = data.results || data;
      // Filter tasks assigned to the current user
      const myTasks = allTasks.filter(t => t.assignee === user.id || t.assignee === user.username || t.assignee === String(user.id));
      setTasks(myTasks);
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId, user]);

  return (
    <div style={{ padding: '32px 36px', height: '100vh', overflow: 'auto', background: '#0e0e10', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#1a1a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Columns3 size={20} color="var(--text-secondary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>My Tasks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Active work assigned directly to you in this project.</p>
        </div>
      </div>

      <div style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>You have no assigned tasks in this project.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                style={{
                  background: '#111',
                  border: '1px solid #1e1e1e',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = '#111'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#252525', color: '#888' }}>
                    {task.priority || 'P2'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>#{task.id}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#e5e5e5' }}>{task.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#888' }}>{task.status}</span>
                  {task.due_date && <span style={{ fontSize: '11px', color: '#f87171' }}>Due: {task.due_date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          defaultColumnId={selectedTask.status ? selectedTask.status.toLowerCase().replace(' ', '') : 'todo'} 
          onClose={() => {
            setSelectedTask(null);
            fetchTasks();
          }} 
        />
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
