import { useEffect, useState } from 'react';
import { fetchHealth } from "../../api/health";

/**
 * HomePage
 *
 * Entry point for the Engineering Decision Twin UI.
 * Calls the backend health endpoint on mount and displays the result.
 */
export default function HomePage() {
  const [status, setStatus]   = useState('loading'); // 'loading' | 'ok' | 'error'
  const [service, setService] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setStatus(data.status ?? 'ok');
        setService(data.service ?? '');
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6"
          style={{ background: 'var(--color-bg)' }}>

      {/* Logo / title block */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            ⚙️
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight"
            style={{ color: 'var(--color-text)' }}>
          Engineering&nbsp;
          <span style={{
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Decision Twin
          </span>
        </h1>

        <p style={{ color: 'var(--color-muted)', maxWidth: 480 }}>
          Simulate downstream consequences of engineering task ownership changes
          and recommend the least-disruptive intervention.
        </p>
      </div>

      {/* Backend status card */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem 2rem',
        minWidth: 320,
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Backend Status
        </p>

        {status === 'loading' && (
          <span style={{ color: 'var(--color-muted)' }}>Connecting…</span>
        )}

        {status === 'ok' && (
          <div className="flex flex-col items-center gap-2">
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(16,185,129,0.12)',
              color: 'var(--color-success)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 999,
              padding: '4px 14px',
              fontWeight: 600, fontSize: 15,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
              {status}
            </span>
            <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>{service}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-2">
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.12)',
              color: 'var(--color-error)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 999,
              padding: '4px 14px',
              fontWeight: 600, fontSize: 15,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)', display: 'inline-block' }} />
              unreachable
            </span>
            <span style={{ color: 'var(--color-error)', fontSize: 12, opacity: 0.7 }}>{error}</span>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>
        Hackathon prototype — initial setup complete
      </p>
    </main>
  );
}
