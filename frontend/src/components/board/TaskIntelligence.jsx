import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TaskIntelligence({ taskId }) {
  const [duration, setDuration] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient('/ml/duration/', {
        method: 'POST',
        body: JSON.stringify({ task_id: taskId }),
      }).catch(e => ({ error: true, message: e.message })),
      apiClient('/ml/risk/', {
        method: 'POST',
        body: JSON.stringify({ task_id: taskId }),
      }).catch(e => ({ error: true, message: e.message }))
    ]).then(([durationRes, riskRes]) => {
      if (!isMounted) return;
      
      let hasError = false;
      let errMsg = '';
      
      if (durationRes.error) {
        hasError = true;
        errMsg = durationRes.message || 'Duration prediction failed.';
      } else {
        setDuration(durationRes);
      }
      
      if (riskRes.error) {
        hasError = true;
        errMsg = riskRes.message || 'Risk prediction failed.';
      } else {
        setRisk(riskRes);
      }
      
      if (hasError) setError(errMsg);
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [taskId]);

  if (loading) {
    return (
      <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
        <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Task Intelligence
        </div>
        <div style={{ color: '#666', fontSize: '13px' }}>Loading predictions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
        <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Task Intelligence
        </div>
        <div style={{ color: '#d9534f', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={14} />
          Prediction Unavailable: {error}
        </div>
      </div>
    );
  }

  const isHighRisk = risk?.risk_class === 1;

  return (
    <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
      <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
        Task Intelligence
      </div>
      <div style={{ display: 'flex', gap: '24px' }}>
        {duration && (
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Remaining Time</div>
            <div style={{ fontSize: '15px', color: '#f5f5f5', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#888" />
              {duration.predicted_hours} hours
            </div>
          </div>
        )}
        {risk && (
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Execution Risk</div>
            <div style={{ fontSize: '15px', color: isHighRisk ? '#f0ad4e' : '#5cb85c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isHighRisk ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
              {Math.round(risk.risk_probability * 100)}%
              <span style={{ fontSize: '11px', padding: '2px 6px', background: isHighRisk ? 'rgba(240, 173, 78, 0.1)' : 'rgba(92, 184, 92, 0.1)', borderRadius: '4px', marginLeft: '4px' }}>
                {isHighRisk ? 'HIGH' : 'LOW'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
