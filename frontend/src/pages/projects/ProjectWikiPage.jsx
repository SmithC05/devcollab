import { useState, useCallback, useEffect } from 'react';
import { useWikiStore } from '../../stores/wikiStore';
import { useAuthStore } from '../../store/authStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Plus, Trash2, Bold, Italic, List, ListOrdered, Code, Heading2 } from 'lucide-react';

function WikiSidebar({ pages, activePage, onSelect, onCreate, onDelete, canCreate, canDelete }) {
  return (
    <div style={{ width: '220px', minWidth: '220px', background: '#0e0e0e', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pages</span>
          {canCreate && (
            <button onClick={onCreate} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '4px', padding: '2px', transition: 'color 150ms' }} title="New page">
              <Plus size={15} />
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, padding: '8px' }}>
        {pages.map((page) => (
          <div
            key={page.id}
            onClick={() => onSelect(page.id)}
            style={{
              padding: '8px 10px', borderRadius: '7px', fontSize: '13px', fontWeight: 400,
              color: activePage?.id === page.id ? '#f5f5f5' : '#888',
              background: activePage?.id === page.id ? '#1c1c1c' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 120ms', marginBottom: '2px',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{page.title}</span>
            {activePage?.id === page.id && canDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(page.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', padding: '1px', borderRadius: '3px', flexShrink: 0, marginLeft: '6px' }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        background: active ? '#2a2a2a' : 'none',
        border: 'none', color: active ? '#f5f5f5' : '#888',
        cursor: 'pointer', padding: '5px 7px', borderRadius: '5px',
        display: 'flex', alignItems: 'center', transition: 'all 120ms',
      }}
    >
      {children}
    </button>
  );
}

export default function ProjectWikiPage() {
  const { pages, activePage, setActivePage, createPage, updatePage, deletePage } = useWikiStore();
  const { can } = useAuthStore();
  const [titleEdit, setTitleEdit] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const canEdit = can('wiki.edit');

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Start writing your documentation...' })],
    content: activePage?.content || '',
    editable: canEdit,
    onUpdate: ({ editor }) => { if (activePage && canEdit) updatePage(activePage.id, { content: editor.getHTML() }); },
  }, [activePage?.id, canEdit]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [canEdit, editor]);

  const handleSelectPage = useCallback((pageId) => {
    setActivePage(pageId);
    const page = pages.find((p) => p.id === pageId);
    if (editor && page) editor.commands.setContent(page.content || '');
  }, [editor, pages, setActivePage]);

  const handleCreatePage = () => {
    const page = createPage('Untitled Page');
    if (editor) editor.commands.setContent(page.content || '');
  };

  const handleDeletePage = (pageId) => {
    deletePage(pageId);
    const remaining = pages.filter((p) => p.id !== pageId);
    if (remaining[0] && editor) editor.commands.setContent(remaining[0].content || '');
  };

  const handleTitleSave = () => {
    if (activePage && titleEdit.trim()) updatePage(activePage.id, { title: titleEdit.trim() });
    setIsEditingTitle(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080808', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      <WikiSidebar 
        pages={pages} activePage={activePage} onSelect={handleSelectPage} 
        onCreate={handleCreatePage} onDelete={handleDeletePage} 
        canCreate={can('wiki.create')} canDelete={can('wiki.delete')}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {editor && canEdit && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '8px 16px', borderBottom: '1px solid #1a1a1a', background: '#0e0e0e', flexShrink: 0 }}>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading"><Heading2 size={14} /></ToolbarButton>
            <div style={{ width: '1px', height: '16px', background: '#2a2a2a', margin: '0 4px' }} />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={14} /></ToolbarButton>
            <div style={{ width: '1px', height: '16px', background: '#2a2a2a', margin: '0 4px' }} />
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code size={14} /></ToolbarButton>
          </div>
        )}

        <div style={{ padding: '24px 32px 0', flexShrink: 0 }}>
          {isEditingTitle && canEdit ? (
            <input autoFocus value={titleEdit} onChange={(e) => setTitleEdit(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setIsEditingTitle(false); }} style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '26px', fontWeight: 700, color: '#f5f5f5', width: '100%', fontFamily: 'inherit', marginBottom: '4px' }} />
          ) : (
            <h1 onClick={() => { if(canEdit) { setTitleEdit(activePage?.title || ''); setIsEditingTitle(true); } }} style={{ fontSize: '26px', fontWeight: 700, color: '#f5f5f5', margin: '0 0 4px 0', cursor: canEdit ? 'text' : 'default', letterSpacing: '-0.02em' }} title={canEdit ? "Click to rename" : ""}>
              {activePage?.title || 'No page selected'}
            </h1>
          )}
          <div style={{ fontSize: '11px', color: '#444', marginBottom: '16px' }}>Last updated: {activePage ? new Date(activePage.updatedAt).toLocaleString() : '—'}</div>
          <div style={{ borderTop: '1px solid #1a1a1a', marginBottom: '0' }} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px 32px' }}>
          <style>{`
            .ProseMirror { outline: none; font-size: 14px; color: #d5d5d5; line-height: 1.7; }
            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { color: #f5f5f5; margin: 20px 0 8px; }
            .ProseMirror p { margin: 0 0 12px; }
            .ProseMirror ul, .ProseMirror ol { padding-left: 20px; margin: 0 0 12px; }
            .ProseMirror pre { background: #111; border: 1px solid #1e1e1e; border-radius: 7px; padding: 14px 16px; font-size: 13px; color: #ccc; overflow-x: auto; }
            .ProseMirror code { background: #1a1a1a; border-radius: 4px; padding: 1px 5px; font-size: 13px; color: #ccc; }
            .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #444; pointer-events: none; float: left; height: 0; }
            .ProseMirror strong { color: #f5f5f5; }
          `}</style>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
