import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';

import OverviewTab from './OverviewTab';
import PeopleTab from './PeopleTab';
import ProjectsTab from './ProjectsTab';
import WorkTab from './WorkTab';
import DependenciesTab from './DependenciesTab';
import DecisionsTab from './DecisionsTab';

export default function OrganizationTabs({ data, onSelectNode, onSyncSuccess }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view');
  const role = useAuthStore(state => state.role); // e.g., 'Owner', 'Admin', 'Lead', 'Dev'

  useEffect(() => {
    if (!currentView) {
      let defaultView = 'overview';
      if (role === 'Lead') defaultView = 'people';
      if (role === 'Dev') defaultView = 'work';
      
      setSearchParams({ view: defaultView }, { replace: true });
    }
  }, [currentView, role, setSearchParams]);

  const activeTab = currentView || 'overview';

  const { organization: org, members, projects, decisionPoints, dependencies } = data;

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'people', label: 'People', count: members?.length },
    { id: 'projects', label: 'Projects', count: projects?.length },
    { id: 'work', label: 'Work', count: org?.active_task_count },
    { id: 'dependencies', label: 'Dependencies', count: dependencies?.length },
    { id: 'decisions', label: 'Decisions', count: decisionPoints?.length },
  ];

  return (
    <div>
      {/* Sticky Secondary Navigation */}
      <div style={{
        position: 'sticky', top: 122, zIndex: 'var(--dv-z-sticky)',
        background: 'var(--dv-bg-surface)', borderBottom: '1px solid var(--dv-border-subtle)',
        padding: '0 40px', display: 'flex', gap: 24,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ view: tab.id })}
            style={{
              padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--dv-accent)' : 'transparent'}`,
              color: activeTab === tab.id ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
              fontSize: 'var(--dv-text-sm)', fontWeight: activeTab === tab.id ? 700 : 500,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.12s'
            }}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? 'var(--dv-accent-subtle)' : 'var(--dv-bg-elevated)',
                color: activeTab === tab.id ? 'var(--dv-accent)' : 'var(--dv-text-faint)',
                padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, fontFamily: 'var(--dv-font-mono)'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '28px 40px', maxWidth: 1440, margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <OverviewTab data={data} onSelectNode={onSelectNode} onSyncSuccess={onSyncSuccess} />
        )}
        {activeTab === 'people' && (
          <PeopleTab data={data} onSelectNode={onSelectNode} onSyncSuccess={onSyncSuccess} />
        )}
        {activeTab === 'projects' && (
          <ProjectsTab data={data} onSelectNode={onSelectNode} />
        )}
        {activeTab === 'work' && (
          <WorkTab data={data} onSelectNode={onSelectNode} />
        )}
        {activeTab === 'dependencies' && (
          <DependenciesTab data={data} onSelectNode={onSelectNode} />
        )}
        {activeTab === 'decisions' && (
          <DecisionsTab data={data} onSelectNode={onSelectNode} />
        )}
      </div>
    </div>
  );
}
