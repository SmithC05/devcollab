import React from 'react';
import { useAuthStore } from '../../../../stores/authStore';
import { EngineeringEvidenceControl } from './shared';
import { MemberInspector } from './ContextInspector';
import { DvCard } from '../../primitives/core';

export default function DeveloperEngineeringProfile() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div style={{ padding: '40px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'var(--dv-text-2xl)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>
          Engineering Profile
        </h1>
        <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>
          Your individual engineering evidence and AI analysis.
        </p>
      </div>

      <EngineeringEvidenceControl />
      
      <DvCard style={{ padding: 0, marginTop: 24 }}>
        <div style={{ padding: '20px' }}>
          <MemberInspector member={user} />
        </div>
      </DvCard>
    </div>
  );
}
