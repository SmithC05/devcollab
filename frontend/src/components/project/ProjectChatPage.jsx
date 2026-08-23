import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { Hash, Plus, Send, X } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

function NewChannelModal({ onClose }) {
  const { addChannel, setActiveChannel } = useChatStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const ch = addChannel(name.trim(), desc.trim());
    setActiveChannel(ch.id);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '12px', width: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>New Channel</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div><label style={LABEL}>Channel Name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} placeholder="e.g. backend, releases" style={INPUT_STYLE} /></div>
          <div><label style={LABEL}>Description (optional)</label><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this channel for?" style={INPUT_STYLE} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: '7px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          <button onClick={handleCreate} style={{ padding: '8px 18px', borderRadius: '7px', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Create</button>
        </div>
      </div>
    </div>
  );
}

function ChatSidebar({ channels, activeChannelId, onSelect, onNewChannel }) {
  return (
    <div style={{ width: '220px', minWidth: '220px', background: 'var(--surface-item)', borderRight: '1px solid var(--surface-hover)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--surface-hover)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Channels</span>
          {onNewChannel && <button onClick={onNewChannel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center' }} title="New channel"><Plus size={15} /></button>}
        </div>
      </div>
      <div style={{ flex: 1, padding: '8px' }}>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '7px',
              background: activeChannelId === ch.id ? 'var(--surface-raised)' : 'transparent',
              color: activeChannelId === ch.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', fontSize: '13px',
              fontFamily: 'inherit', transition: 'background 120ms', marginBottom: '2px',
            }}
          >
            <Hash size={13} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
            {ch.unread > 0 && <span style={{ background: 'var(--border-strong)', color: '#eee', fontSize: '9px', fontWeight: 700, borderRadius: '999px', padding: '1px 5px', flexShrink: 0 }}>{ch.unread}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, prevMsg }) {
  const isSameSender = prevMsg?.sender === msg.sender;
  const avatarBg = msg.avatarBg || 'var(--border-default)';

  return (
    <div style={{ display: 'flex', gap: '10px', paddingBottom: isSameSender ? '2px' : '12px', alignItems: 'flex-start' }}>
      {!isSameSender ? (
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avatarBg, color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
          {msg.sender[0].toUpperCase()}
        </div>
      ) : <div style={{ width: '30px', flexShrink: 0 }} />}
      <div>
        {!isSameSender && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{msg.sender}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatDistanceToNow(parseISO(msg.time), { addSuffix: true })}</span>
          </div>
        )}
        <div style={{ fontSize: '13px', color: '#c5c5c5', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

export default function ProjectChatPage() {
  const { channels, activeChannelId, setActiveChannel, sendMessage, getMessages, getActiveChannel } = useChatStore();
  const { can } = useAuthStore();
  const [text, setText] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const endRef = useRef(null);
  const messages = getMessages(activeChannelId);
  const activeChannel = getActiveChannel();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const handleSend = () => { if (!text.trim()) return; sendMessage(activeChannelId, text.trim()); setText(''); };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      <ChatSidebar channels={channels} activeChannelId={activeChannelId} onSelect={setActiveChannel} onNewChannel={can('channel.create') ? () => setShowNewChannel(true) : null} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--surface-hover)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', flexShrink: 0 }}>
          <Hash size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeChannel?.name || 'general'}</span>
          {activeChannel?.description && (
            <>
              <span style={{ color: 'var(--border-strong)', fontSize: '13px' }}>—</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeChannel.description}</span>
            </>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {messages.length === 0 && <div style={{ color: 'var(--focus-ring)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>No messages yet. Start the conversation!</div>}
          {messages.map((msg, i) => <MessageBubble key={msg.id} msg={msg} prevMsg={i > 0 ? messages[i - 1] : null} />)}
          <div ref={endRef} />
        </div>

        {can('chat.send') && (
          <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--surface-hover)', flexShrink: 0, background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '10px', padding: '8px 12px' }}>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Message #${activeChannel?.name || 'general'}...`} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              <button
                onClick={handleSend} disabled={!text.trim()}
                style={{
                  background: text.trim() ? '#eee' : 'var(--surface-hover)', border: 'none', borderRadius: '7px',
                  color: text.trim() ? 'var(--bg)' : 'var(--focus-ring)', cursor: text.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', padding: '6px 10px', transition: 'background 150ms',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      {showNewChannel && <NewChannelModal onClose={() => setShowNewChannel(false)} />}
    </div>
  );
}

const LABEL = { display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' };
const INPUT_STYLE = { background: 'var(--surface-item)', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
