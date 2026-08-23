import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Search, Plus, Copy, Trash2, X, Check, Pencil, Loader2, Code2, Tag } from 'lucide-react';

// ─── API helper ────────────────────────────────────────────────────────────
async function api(endpoint, opts = {}) {
  const { apiClient } = await import('../../api/client');
  return apiClient(endpoint, opts);
}

// ─── constants ─────────────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'bash', 'sql',
  'html', 'css', 'json', 'yaml', 'go', 'rust',
  'java', 'csharp', 'cpp', 'php', 'ruby', 'swift',
  'kotlin', 'markdown', 'text',
];

const LABEL = { display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' };
const INPUT = { background: '#0e0e0e', border: '1px solid #2a2a2e', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const ICON_BTN = { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px', borderRadius: '5px', display: 'flex', alignItems: 'center', transition: 'color 150ms' };

// ─── Snippet Modal ─────────────────────────────────────────────────────────
function SnippetModal({ snippet, projectId, onClose, onSaved }) {
  const isEdit = Boolean(snippet);
  const [form, setForm] = useState({
    title:       snippet?.title       || '',
    language:    snippet?.language    || 'javascript',
    description: snippet?.description || '',
    code:        snippet?.code        || '',
    tags:        snippet?.tags?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.code.trim()) { setErr('Title and code are required.'); return; }
    setSaving(true); setErr('');
    try {
      const body = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      let result;
      if (isEdit) {
        result = await api(`/projects/${projectId}/snippets/${snippet.id}/`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        result = await api(`/projects/${projectId}/snippets/`, { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved(result, isEdit);
      onClose();
    } catch (e) {
      setErr(e.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ background: '#141416', border: '1px solid #2a2a2e', borderRadius: '14px', width: '600px', maxHeight: '92vh', overflow: 'auto', padding: '28px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={15} color="#fff" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{isEdit ? 'Edit Snippet' : 'New Snippet'}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={LABEL}>Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Snippet title" style={INPUT} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LABEL}>Language</label>
              <select value={form.language} onChange={e => set('language', e.target.value)} style={INPUT}>
                {SUPPORTED_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Tags (comma separated)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="auth, utils, api" style={INPUT} />
            </div>
          </div>
          <div><label style={LABEL}>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this snippet do?" style={INPUT} /></div>
          <div><label style={LABEL}>Code *</label><textarea value={form.code} onChange={e => set('code', e.target.value)} rows={10} placeholder="Paste your code here…" style={{ ...INPUT, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }} /></div>
          {err && <div style={{ background: '#f8717118', border: '1px solid #f8717144', borderRadius: '7px', padding: '10px 14px', fontSize: '12px', color: '#f87171' }}>{err}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid #2a2a2e', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}>
            {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            {isEdit ? 'Save Changes' : 'Create Snippet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Snippet Card ──────────────────────────────────────────────────────────
function SnippetCard({ snippet, onEdit, onDelete, canEdit, canDelete }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '12px', overflow: 'hidden', transition: 'border-color 150ms' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2e'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1f1f24'}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #1a1a1e' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: '#1a1a1e', color: '#888', border: '1px solid #2a2a2e', textTransform: 'capitalize', letterSpacing: '0.04em' }}>
                {snippet.language}
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet.title}</div>
            {snippet.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet.description}</div>}
            {snippet.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Tag size={10} color="var(--text-muted)" />
                {snippet.tags.map(t => (
                  <span key={t} style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '999px', background: '#1a1a1e', color: 'var(--text-muted)', border: '1px solid #2a2a2e' }}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            <button onClick={handleCopy} title="Copy" style={ICON_BTN}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
            </button>
            {canEdit && <button onClick={() => onEdit(snippet)} title="Edit" style={ICON_BTN}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            ><Pencil size={13} /></button>}
            {canDelete && <button onClick={() => onDelete(snippet.id)} title="Delete" style={ICON_BTN}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            ><Trash2 size={13} /></button>}
          </div>
        </div>
      </div>
      {/* Code preview */}
      <div style={{ maxHeight: '160px', overflow: 'hidden', position: 'relative' }}>
        <SyntaxHighlighter
          language={snippet.language === 'text' ? 'plaintext' : snippet.language}
          style={oneDark}
          customStyle={{ margin: 0, background: '#0c0c0e', fontSize: '11px', padding: '12px 16px', borderRadius: 0 }}
          wrapLongLines
        >
          {snippet.code}
        </SyntaxHighlighter>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, #0c0c0e, transparent)' }} />
      </div>
      {/* Footer */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1a1a1e' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{snippet.created_by || 'Unknown'}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(snippet.updated_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────
export default function ProjectSnippetsPage() {
  const { projectId } = useParams();
  const { can } = useAuthStore();

  const [snippets, setSnippets]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [modal, setModal]           = useState(null); // null | false (new) | snippet (edit)

  const canCreate = can('snippet.create') ?? true;
  const canEdit   = can('snippet.edit')   ?? true;
  const canDelete = can('snippet.delete') ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/projects/${projectId}/snippets/`);
      setSnippets(data);
    } catch (err) { console.error('Snippets load failed', err); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (result, isEdit) => {
    if (isEdit) {
      setSnippets(prev => prev.map(s => s.id === result.id ? result : s));
    } else {
      setSnippets(prev => [result, ...prev]);
    }
  };

  const handleDelete = async (snippetId) => {
    try {
      await api(`/projects/${projectId}/snippets/${snippetId}/`, { method: 'DELETE' });
      setSnippets(prev => prev.filter(s => s.id !== snippetId));
    } catch (err) { console.error('Delete failed', err); }
  };

  const filtered = snippets.filter(s => {
    const q = search.toLowerCase();
    const matchText = s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags?.some(t => t.toLowerCase().includes(q));
    const matchLang = !langFilter || s.language === langFilter;
    return matchText && matchLang;
  });

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#0d0d0f', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', padding: '32px 36px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Code Snippets</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Project-scoped reusable code. {!loading && <span style={{ color: 'var(--text-secondary)' }}>{snippets.length} snippet{snippets.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setModal(false)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '9px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
            <Plus size={14} strokeWidth={2.5} /> New Snippet
          </button>
        )}
      </div>

      {/* Search + language filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snippets…" style={{ width: '100%', boxSizing: 'border-box', background: '#141416', border: '1px solid #1f1f24', borderRadius: '9px', padding: '9px 12px 9px 34px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '9px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="">All languages</option>
          {SUPPORTED_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px' }}>
          <Loader2 size={28} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '14px', fontSize: '14px' }}>Loading snippets…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px' }}>
          <Code2 size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
            {search || langFilter ? 'No snippets match your filters.' : 'No snippets yet. Save your first snippet!'}
          </p>
          {canCreate && !search && !langFilter && (
            <button onClick={() => setModal(false)} style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
              Create First Snippet
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
          {filtered.map(s => (
            <SnippetCard key={s.id} snippet={s}
              onEdit={snip => setModal(snip)}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal === false && <SnippetModal projectId={projectId} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal && typeof modal === 'object' && <SnippetModal snippet={modal} projectId={projectId} onClose={() => setModal(null)} onSaved={handleSaved} />}
    </div>
  );
}
