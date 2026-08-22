import { create } from 'zustand';
import { nanoid } from 'nanoid';

const SEED_SNIPPETS = [
  {
    id: 'snip-1',
    title: 'JWT Auth Header Helper',
    language: 'javascript',
    description: 'Attaches JWT token to every axios request via interceptor.',
    tags: ['auth', 'axios'],
    code: `import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1/' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export default api;`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'snip-2',
    title: 'Django DRF Serializer Base',
    language: 'python',
    description: 'Base serializer with common audit fields.',
    tags: ['django', 'drf'],
    code: `from rest_framework import serializers

class AuditSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        abstract = True`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'snip-3',
    title: 'Zustand Store Template',
    language: 'javascript',
    description: 'Minimal Zustand store boilerplate with immer.',
    tags: ['zustand', 'state'],
    code: `import { create } from 'zustand';

export const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
}));`,
    createdAt: new Date().toISOString(),
  },
];

export const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'bash', 'sql',
  'html', 'css', 'json', 'yaml', 'go', 'rust',
];

export const useSnippetStore = create((set, get) => ({
  snippets: SEED_SNIPPETS,
  searchQuery: '',
  activeLanguage: '',

  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveLanguage: (lang) => set({ activeLanguage: lang }),

  addSnippet: (data) => {
    const snippet = {
      id: `snip-${nanoid(6)}`,
      createdAt: new Date().toISOString(),
      tags: [],
      ...data,
    };
    set((state) => ({ snippets: [snippet, ...state.snippets] }));
    return snippet;
  },

  updateSnippet: (id, updates) => {
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  deleteSnippet: (id) => {
    set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) }));
  },

  getFiltered: () => {
    const { snippets, searchQuery, activeLanguage } = get();
    return snippets.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLang = !activeLanguage || s.language === activeLanguage;
      return matchesSearch && matchesLang;
    });
  },
}));
