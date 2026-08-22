import { useParams } from 'react-router-dom';
import { Columns3 } from 'lucide-react';

export default function ProjectMyTasksPage() {
  const { projectId } = useParams();

  return (
    <div style={{ padding: '32px 36px', height: '100vh', overflow: 'auto', background: '#0e0e10', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#1a1a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Columns3 size={20} color="var(--text-secondary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>My Tasks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Active work assigned directly to you in {projectId}.</p>
        </div>
      </div>

      <div style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>A personalized list of your assigned tasks, blockers, and upcoming deadlines.</p>
      </div>
    </div>
  );
}
