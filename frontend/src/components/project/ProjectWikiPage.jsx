import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Plus, Trash2, Pencil, Bold, Italic, List, ListOrdered,
  Code, Heading2, Loader2, Save, FileText, AlertCircle,
} from 'lucide-react';

// ─── API helpers ─────────────────────────────────────────────────────────────
async function api(endpoint, opts = {}) {
  const { apiClient } = await import('../../api/client');
  return apiClient(endpoint, opts);
}

// ─── debounce ────────────────────────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ─── sidebar ─────────────────────────────────────────────────────────────────
function WikiSidebar({ pages, activeId, onSelect, onCreate, onDelete, onRename, canCreate, canDelete, loading }) {
  return (
    <div style={{ width: '220px', minWidth: '220px', background: '#0e0e0e', borderRight: '1px solid #1a1a1e', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #1a1a1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pages</span>
        {canCreate && (
          <button onClick={onCreate} title="New page" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '4px', padding: '3px', transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Plus size={15} />
          </button>
        )}
      </div>
      <div style={{ flex: 1, padding: '8px' }}>
        {loading && <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</div>}
        {!loading && pages.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
            <FileText size={22} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            No pages yet.{canCreate && <><br /><span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={onCreate}>Create one →</span></>}
          </div>
        )}
        {pages.map(page => (
          <div key={page.id} onClick={() => onSelect(page)}
            style={{ padding: '8px 10px', borderRadius: '7px', fontSize: '13px', color: activeId === page.id ? 'var(--text-primary)' : 'var(--text-secondary)', background: activeId === page.id ? '#1c1c1c' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 120ms', marginBottom: '2px' }}
            onMouseEnter={e => e.currentTarget.style.background = activeId === page.id ? '#1c1c1c' : '#141414'}
            onMouseLeave={e => e.currentTarget.style.background = activeId === page.id ? '#1c1c1c' : 'transparent'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{page.title}</span>

            {/* Action buttons — only visible on active page */}
            {activeId === page.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, marginLeft: '4px' }}>
                {/* Rename */}
                <button
                  onClick={e => { e.stopPropagation(); onRename?.(page); }}
                  title="Rename page"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: '3px', display: 'flex', transition: 'color 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Pencil size={11} />
                </button>
                {/* Delete */}
                {canDelete && (
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(page.id); }}
                    title="Delete page"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: '3px', display: 'flex', transition: 'color 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── toolbar button ───────────────────────────────────────────────────────────
function TB({ onClick, active, children, title }) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick(); }} title={title}
      style={{ background: active ? '#2a2a2e' : 'none', border: 'none', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '5px 7px', borderRadius: '5px', display: 'flex', alignItems: 'center', transition: 'all 120ms' }}
    >{children}</button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function ProjectWikiPage() {
  const { projectId } = useParams();
  const { can } = useAuthStore();

  const [pages, setPages]         = useState([]);
  const [activePage, setActive]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState('');
  const [titleEdit, setTitleEdit] = useState('');
  const [editTitle, setEditTitle] = useState(false);

  const canEdit   = can('wiki.edit')   ?? true;
  const canCreate = can('wiki.create') ?? true;
  const canDelete = can('wiki.delete') ?? false;

  // ─── load pages on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api(`/projects/${projectId}/wiki/`);
        setPages(data);
        if (data.length > 0) setActive(data[0]);
      } catch (err) {
        console.error('Wiki load failed', err);
      } finally { setLoading(false); }
    };
    load();
  }, [projectId]);

  // ─── editor ───────────────────────────────────────────────────────────────
  const saveContent = useCallback(async (pageId, html) => {
    setSaving(true); setSaveErr('');
    try {
      const updated = await api(`/projects/${projectId}/wiki/${pageId}/`, {
        method: 'PUT',
        body: JSON.stringify({ content: html }),
      });
      setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
      setActive(prev => prev?.id === updated.id ? updated : prev);
    } catch {
      setSaveErr('Auto-save failed');
    } finally { setSaving(false); }
  }, [projectId]);

  const debouncedSave = useDebounce(saveContent, 800);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your documentation…' }),
    ],
    content: activePage?.content || '',
    editable: canEdit,
    onUpdate: ({ editor }) => {
      if (activePage && canEdit) debouncedSave(activePage.id, editor.getHTML());
    },
  }, [activePage?.id, canEdit]);

  // sync editor content when active page changes
  useEffect(() => {
    if (!editor || !activePage) return;
    // setContent is safe to call; editor is guaranteed non-null here
    try { editor.commands.setContent(activePage.content || ''); } catch (_) {}
  }, [activePage?.id, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(canEdit);
  }, [canEdit, editor]);

  // ─── create page ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    try {
      const newPage = await api(`/projects/${projectId}/wiki/`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled Page', content: '' }),
      });
      setPages(prev => [...prev, newPage]);
      setActive(newPage);
      editor?.commands?.setContent('');
    } catch (err) { console.error('Create page failed', err); }
  };

  // ─── delete page ──────────────────────────────────────────────────────────
  const handleDelete = async (pageId) => {
    try {
      await api(`/projects/${projectId}/wiki/${pageId}/`, { method: 'DELETE' });
      const remaining = pages.filter(p => p.id !== pageId);
      setPages(remaining);
      setActive(remaining[0] || null);
      editor?.commands?.setContent(remaining[0]?.content || '');
    } catch (err) { console.error('Delete page failed', err); }
  };

  // ─── rename page ──────────────────────────────────────────────────────────
  const handleTitleSave = async () => {
    if (!activePage || !titleEdit.trim()) { setEditTitle(false); return; }
    setEditTitle(false);
    try {
      const updated = await api(`/projects/${projectId}/wiki/${activePage.id}/`, {
        method: 'PUT',
        body: JSON.stringify({ title: titleEdit.trim() }),
      });
      setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
      setActive(updated);
    } catch (err) { console.error('Rename failed', err); }
  };

  // ─── select page ──────────────────────────────────────────────────────────
  const handleSelect = (page) => {
    setActive(page);
    editor?.commands?.setContent(page.content || '');
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080808', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .ProseMirror { outline: none; font-size: 14px; color: #d5d5d5; line-height: 1.8; min-height: 200px; }
        .ProseMirror h1,.ProseMirror h2,.ProseMirror h3 { color: var(--text-primary); margin: 22px 0 8px; letter-spacing: -0.01em; }
        .ProseMirror h1 { font-size: 22px; } .ProseMirror h2 { font-size: 18px; } .ProseMirror h3 { font-size: 15px; }
        .ProseMirror p { margin: 0 0 12px; }
        .ProseMirror ul,.ProseMirror ol { padding-left: 22px; margin: 0 0 12px; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror pre { background: #111; border: 1px solid #2a2a2e; border-radius: 8px; padding: 14px 16px; font-size: 12.5px; color: #ccc; overflow-x: auto; margin-bottom: 12px; }
        .ProseMirror code { background: #1a1a1e; border-radius: 4px; padding: 1px 6px; font-size: 12.5px; color: #a5b4fc; font-family: monospace; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #444; pointer-events: none; float: left; height: 0; }
        .ProseMirror strong { color: var(--text-primary); }
        .ProseMirror em { color: #c4b5fd; }
        .ProseMirror blockquote { border-left: 3px solid #333; padding-left: 14px; color: var(--text-muted); margin: 0 0 12px; }
        .ProseMirror hr { border: none; border-top: 1px solid #2a2a2e; margin: 20px 0; }
      `}</style>

      <WikiSidebar
        pages={pages} activeId={activePage?.id}
        onSelect={handleSelect} onCreate={handleCreate} onDelete={handleDelete}
        onRename={(page) => { setActive(page); setTitleEdit(page.title); setEditTitle(true); }}
        canCreate={canCreate} canDelete={canDelete} loading={loading}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        {editor && canEdit && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '8px 16px', borderBottom: '1px solid #1a1a1e', background: '#0e0e0e', flexShrink: 0 }}>
            <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></TB>
            <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></TB>
            <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></TB>
            <div style={{ width: '1px', height: '16px', background: '#2a2a2e', margin: '0 4px' }} />
            <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></TB>
            <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={14} /></TB>
            <div style={{ width: '1px', height: '16px', background: '#2a2a2e', margin: '0 4px' }} />
            <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code size={14} /></TB>
            <div style={{ flex: 1 }} />
            {/* Save status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: saveErr ? '#f87171' : 'var(--text-muted)' }}>
              {saving ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : saveErr ? <><AlertCircle size={11} /> {saveErr}</> : <><Save size={11} /> Auto-saved</>}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !activePage && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <FileText size={44} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px', margin: '0 0 12px' }}>No wiki pages yet.</p>
            {canCreate && <button onClick={handleCreate} style={{ padding: '8px 18px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Create First Page</button>}
          </div>
        )}

        {/* Page content */}
        {activePage && (
          <>
            <div style={{ padding: '28px 40px 0', flexShrink: 0 }}>
              {/* Title */}
              {editTitle && canEdit ? (
                <input autoFocus value={titleEdit} onChange={e => setTitleEdit(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditTitle(false); }}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', width: '100%', fontFamily: 'inherit', marginBottom: '4px', letterSpacing: '-0.02em' }}
                />
              ) : (
                <h1
                  onClick={() => { if (canEdit) { setTitleEdit(activePage.title); setEditTitle(true); } }}
                  style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', cursor: canEdit ? 'text' : 'default', letterSpacing: '-0.02em' }}
                  title={canEdit ? 'Click to rename' : ''}
                >{activePage.title}</h1>
              )}
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <span>Updated: {new Date(activePage.updated_at).toLocaleString()}</span>
                {activePage.updated_by && <span>by {activePage.updated_by}</span>}
              </div>
              <div style={{ borderTop: '1px solid #1a1a1e', marginBottom: '0' }} />
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 40px 48px' }}>
              <EditorContent editor={editor} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
