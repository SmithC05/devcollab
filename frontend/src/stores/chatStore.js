import { create } from 'zustand';
import { nanoid } from 'nanoid';

const SEED_CHANNELS = [
  { id: 'ch-general',     name: 'general',     description: 'General project discussions', unread: 0 },
  { id: 'ch-engineering', name: 'engineering',  description: 'Engineering topics',          unread: 2 },
  { id: 'ch-design',      name: 'design',       description: 'Design feedback',             unread: 0 },
  { id: 'ch-random',      name: 'random',       description: 'Off-topic chat',              unread: 1 },
];

const SEED_MESSAGES = {
  'ch-general': [
    { id: 'msg-1', sender: 'Libin', avatar: 'L', avatarBg: '#2a2a2a', text: 'Good morning team! Stand-up in 10 minutes.', time: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: 'msg-2', sender: 'Arjun', avatar: 'A', avatarBg: '#222',    text: 'On it. Quick update: payment API integration is progressing well. Razorpay webhook is setup.', time: new Date(Date.now() - 3600000 * 2.8).toISOString() },
    { id: 'msg-3', sender: 'Priya', avatar: 'P', avatarBg: '#1a1a1a', text: 'Great. I just finished the User registration API. Moving to OAuth now.', time: new Date(Date.now() - 3600000 * 2.5).toISOString() },
    { id: 'msg-4', sender: 'Rahul', avatar: 'R', avatarBg: '#333',    text: 'I am working on the dashboard responsive layout today.', time: new Date(Date.now() - 3600000 * 2.2).toISOString() },
    { id: 'msg-5', sender: 'Libin', avatar: 'L', avatarBg: '#2a2a2a', text: 'Excellent progress everyone.', time: new Date(Date.now() - 3600000 * 2).toISOString() },
  ],
  'ch-engineering': [
    { id: 'msg-6', sender: 'Arjun', avatar: 'A', avatarBg: '#222',    text: 'Anyone used dnd-kit before? Setting it up for the kanban.', time: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 'msg-7', sender: 'Rahul', avatar: 'R', avatarBg: '#333',    text: 'Yes, it\'s solid. Use SortableContext with custom sensors. I can help if you get stuck.', time: new Date(Date.now() - 3600000 * 4.8).toISOString() },
    { id: 'msg-8', sender: 'Priya', avatar: 'P', avatarBg: '#1a1a1a', text: 'Make sure to add a drag-to-delete zone for tasks!', time: new Date(Date.now() - 3600000 * 4.5).toISOString() },
  ],
  'ch-design':  [
    { id: 'msg-9', sender: 'Libin', avatar: 'L', avatarBg: '#2a2a2a', text: 'Uploaded the new payment flow diagrams to the wiki.', time: new Date(Date.now() - 3600000 * 24).toISOString() },
  ],
  'ch-random':  [
    { id: 'msg-10', sender: 'Priya', avatar: 'P', avatarBg: '#1a1a1a', text: 'Coffee break?', time: new Date(Date.now() - 3600000 * 1).toISOString() },
  ],
};

export const useChatStore = create((set, get) => ({
  channels: SEED_CHANNELS,
  messages: SEED_MESSAGES,
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
