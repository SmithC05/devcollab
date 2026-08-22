import { create } from 'zustand';
import { nanoid } from 'nanoid';

export const useChatStore = create((set, get) => ({
  channels: [],
  messages: {},
  activeChannelId: 'ch-general',

  setActiveChannel: (channelId) => {
    set((state) => ({
      activeChannelId: channelId,
      channels: state.channels.map((c) => c.id === channelId ? { ...c, unread: 0 } : c),
    }));
  },

  addChannel: (name, description = '') => {
    const channel = { id: `ch-${nanoid(6)}`, name: name.toLowerCase().replace(/\s+/g, '-'), description, unread: 0 };
    set((state) => ({
      channels: [...state.channels, channel],
      messages: { ...state.messages, [channel.id]: [] },
    }));
    return channel;
  },

  sendMessage: (channelId, text, sender = 'Libin') => {
    const msg = { id: `msg-${nanoid(6)}`, sender, avatar: sender[0].toUpperCase(), avatarBg: '#2a2a2a', text, time: new Date().toISOString() };
    set((state) => ({
      messages: { ...state.messages, [channelId]: [...(state.messages[channelId] || []), msg] },
    }));
  },

  getActiveChannel: () => {
    const { channels, activeChannelId } = get();
    return channels.find((c) => c.id === activeChannelId);
  },

  getMessages: (channelId) => get().messages[channelId] || [],
}));
