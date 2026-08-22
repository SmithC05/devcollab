/**
 * DevCollab Intelligence — Layout Shell
 * Isolated layout wrapper for the Intelligence experience.
 * Does NOT use WorkspaceLayout, Sidebar, or Topbar.
 */

import { Link, NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/tokens.css';
import '../styles/components.css';

const NAV_LINKS = [
  { to: '/intelligence',              label: 'Command Center' },
  { to: '/intelligence/organization', label: 'Organization Intelligence' },
  { to: '/intelligence/decision/dp1', label: 'Decision Point' },
  { to: '/intelligence/foundation-preview', label: 'Foundation Preview' },
];


export default function IntelligenceLayout() {
  return (
    <div className="dv-intelligence" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Topbar ── */}
      <header style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 24px',
        height:          '52px',
        background:      'var(--dv-bg-base)',
        borderBottom:    '1px solid var(--dv-border-subtle)',
        flexShrink:       0,
        position:        'sticky',
        top:              0,
        zIndex:           'var(--dv-z-sticky)',
      }}>
        {/* Brand */}
        <Link to="/intelligence" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="20" height="20" rx="5" fill="var(--dv-accent)" fillOpacity="0.15" />
            <path d="M10 4L14 8L10 12L6 8L10 4Z" fill="var(--dv-accent)" />
            <path d="M6 12L10 16L14 12" stroke="var(--dv-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 'var(--dv-text-sm)', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--dv-text-primary)' }}>
            DEVCOLLAB
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dv-accent)', opacity: 0.8 }}>
            INTELLIGENCE
          </span>
        </Link>

        {/* Nav */}
        <nav aria-label="Intelligence navigation" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding:        '5px 10px',
                borderRadius:   'var(--dv-radius-md)',
                fontSize:       'var(--dv-text-xs)',
                fontWeight:     500,
                letterSpacing:  'var(--dv-tracking-snug)',
                color:          isActive ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
                background:     isActive ? 'var(--dv-bg-elevated)' : 'transparent',
                textDecoration: 'none',
                border:         isActive ? '1px solid var(--dv-border-default)' : '1px solid transparent',
                transition:     'all 0.12s',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Back to App */}
        <Link
          to="/dashboard"
          style={{
            fontSize:      'var(--dv-text-xs)',
            color:         'var(--dv-text-muted)',
            textDecoration:'none',
            padding:       '5px 10px',
            borderRadius:  'var(--dv-radius-md)',
            border:        '1px solid var(--dv-border-subtle)',
            transition:    'color 0.12s, border-color 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--dv-text-secondary)';
            e.currentTarget.style.borderColor = 'var(--dv-border-default)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--dv-text-muted)';
            e.currentTarget.style.borderColor = 'var(--dv-border-subtle)';
          }}
        >
          ← Back to App
        </Link>
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
