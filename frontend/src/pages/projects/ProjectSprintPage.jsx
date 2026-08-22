import { useParams } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';

function StatRow({ stats }) {
  return (
    <div style={{ display: 'flex', gap: '60px', marginBottom: '36px' }}>
      {stats.map(({ value, label }) => (
        <div key={label}>
          <div style={{ fontSize: '30px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '6px', fontWeight: 500 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ProjectSprintPage() {
  const { projectId } = useParams();
  const columns = useTaskStore(state => state.columns);
  const tasks = Object.values(columns).flat();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.columnId === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) + '%' : '0%';
  const blockedTasks = tasks.filter(t => t.labels && (t.labels.includes('blocked') || t.labels.includes('bug'))).length;

  return (
    <div style={{ padding: '32px 36px', height: '100vh', overflow: 'auto', background: '#0e0e10', color: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#1a1a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={20} color="#888" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Sprint Analytics</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Detailed sprint progress and velocity metrics for {projectId}.</p>
        </div>
      </div>

      <div style={{ padding: '24px', background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px', marginBottom: '24px' }}>
        <StatRow stats={[
          { value: totalTasks.toString(), label: 'Total Sprint Tasks' },
          { value: completionRate, label: 'Completion Rate' },
          { value: blockedTasks.toString(), label: 'Blocked Issues' }
        ]} />
      </div>

      <div style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#888', fontSize: '14px' }}>Sprint analytics charts and velocity data will be rendered here.</p>
      </div>
    </div>
  );
}
