import { useState } from 'react';
import { useSnippetStore, SUPPORTED_LANGUAGES } from '../../stores/snippetStore';
import { useAuthStore } from '../../stores/authStore';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Search, Plus, Copy, Trash2, X, Check, Pencil } from 'lucide-react';

const INPUT_STYLE = {
  background: '#0e0e0e', border: '1px solid var(--border-strong)', borderRadius: '7px',
  padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)',
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
};

// Override Prism syntax highlighter colors to be mostly grayscale
// (Note: full grayscale syntax highlighting requires a custom theme object, but we'll tone down the container and language badge)
const LANG_COLORS = {
  javascript: 'var(--text-secondary)', typescript: 'var(--text-secondary)', python: 'var(--text-secondary)',
  bash: 'var(--text-secondary)', sql: 'var(--text-secondary)', html: 'var(--text-secondary)', css: 'var(--text-secondary)',
  json: 'var(--text-secondary)', yaml: 'var(--text-secondary)', go: 'var(--text-secondary)', rust: 'var(--text-secondary)',
};

function SnippetModal({ snippet, onClose }) {
  const { addSnippet, updateSnippet } = useSnippetStore();
  const isEdit = Boolean(snippet);
  const [form, setForm] = useState({
    title: snippet?.title || '',
    language: snippet?.language || 'javascript',
    description: snippet?.description || '',
    code: snippet?.code || '',
    tags: snippet?.tags?.join(', ') || '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim() || !form.code.trim()) return;
    const data = { ...form, tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [] };
    if (isEdit) updateSnippet(snippet.id, data);
    else addSnippet(data);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '12px', width: '600px', maxHeight: '92vh', overflow: 'auto', padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{isEdit ? 'Edit Snippet' : 'New Snippet'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={LABEL}>Title *</label><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Snippet title" style={INPUT_STYLE} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={LABEL}>Language</label><select value={form.language} onChange={(e) => set('language', e.target.value)} style={INPUT_STYLE}>{SUPPORTED_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label style={LABEL}>Tags (comma separated)</label><input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="auth, utils, api" style={INPUT_STYLE} /></div>
          </div>
          <div><label style={LABEL}>Description</label><input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What does this snippet do?" style={INPUT_STYLE} /></div>
          <div><label style={LABEL}>Code *</label><textarea value={form.code} onChange={(e) => set('code', e.target.value)} rows={10} placeholder="Paste your code here..." style={{ ...INPUT_STYLE, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '7px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '8px 20px', borderRadius: '7px', background: 'var(--text-primary)', color: '#080808', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>{isEdit ? 'Save' : 'Create Snippet'}</button>
        </div>
      </div>
    </div>
  );
}

function SnippetCard({ snippet, onEdit, onDelete, canEdit, canDelete }) {
  const [copied, setCopied] = useState(false);
  const langColor = LANG_COLORS[snippet.language] || 'var(--text-secondary)';

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--surface-hover)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', background: 'var(--surface-hover)', color: '#aaa', border: '1px solid var(--border-strong)', textTransform: 'capitalize' }}>
                {snippet.language}
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{snippet.title}</div>
            {snippet.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{snippet.description}</div>}
            {snippet.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', marginTop: '7px', flexWrap: 'wrap' }}>
                {snippet.tags.map((t) => (
                  <span key={t} style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '999px', background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button onClick={handleCopy} title="Copy code" style={ICON_BTN}>{copied ? <Check size={13} color="#ccc" /> : <Copy size={13} />}</button>
            {canEdit && <button onClick={() => onEdit(snippet)} title="Edit" style={ICON_BTN}><Pencil size={13} /></button>}
            {canDelete && <button onClick={() => onDelete(snippet.id)} title="Delete" style={{ ...ICON_BTN, color: 'var(--text-muted)' }}><Trash2 size={13} /></button>}
          </div>
        </div>
      </div>
      <div style={{ maxHeight: '160px', overflow: 'hidden', position: 'relative', filter: 'grayscale(100%) opacity(0.8)' }}>
        <SyntaxHighlighter language={snippet.language} style={oneDark} customStyle={{ margin: 0, background: '#080808', fontSize: '11px', padding: '12px 16px', borderRadius: 0 }} wrapLongLines>
          {snippet.code}
        </SyntaxHighlighter>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, #080808, transparent)' }} />
      </div>
    </div>
  );
}

export default function ProjectSnippetsPage() {
  const { searchQuery, activeLanguage, setSearchQuery, setActiveLanguage, getFiltered, deleteSnippet } = useSnippetStore();
  const { can } = useAuthStore();
  const [modalSnippet, setModalSnippet] = useState(null);
  const snippets = getFiltered();

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#080808', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Code Snippets</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Project-scoped reusable code storage.</p>
        </div>
        {can('snippet.create') && (
          <button onClick={() => setModalSnippet(false)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '8px', background: 'var(--text-primary)', color: '#080808', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
            <Plus size={14} strokeWidth={2.5} /> Save Snippet
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search snippets..." style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '8px', padding: '9px 12px 9px 34px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <select value={activeLanguage} onChange={(e) => setActiveLanguage(e.target.value)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="">All languages</option>
          {SUPPORTED_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
        {snippets.map((s) => (
          <SnippetCard 
            key={s.id} snippet={s} onEdit={(snip) => setModalSnippet(snip)} onDelete={deleteSnippet} 
            canEdit={can('snippet.edit')} canDelete={can('snippet.delete')} 
          />
        ))}
        {snippets.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '48px', fontSize: '14px' }}>No snippets found. Save your first snippet →</div>}
      </div>

      {modalSnippet === false && <SnippetModal onClose={() => setModalSnippet(null)} />}
      {modalSnippet && typeof modalSnippet === 'object' && <SnippetModal snippet={modalSnippet} onClose={() => setModalSnippet(null)} />}
    </div>
  );
}

const LABEL = { display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' };
const ICON_BTN = { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px', borderRadius: '5px', display: 'flex', alignItems: 'center', transition: 'color 150ms' };
