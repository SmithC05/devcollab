import { create } from 'zustand';
import { nanoid } from 'nanoid';

const SEED_PAGES = [
  {
    id: 'page-1',
    title: 'Getting Started',
    content: '<h2>Getting Started</h2><p>Welcome to the DevCollab project wiki. This space is used to document project decisions, architecture notes, and team processes.</p><h3>Quick Links</h3><ul><li>Project setup instructions</li><li>Contribution guidelines</li><li>Tech stack overview</li></ul>',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'page-2',
    title: 'API Documentation',
    content: '<h2>API Documentation</h2><p>All REST endpoints follow the <strong>DRF</strong> standard. Authentication uses JWT tokens passed in the Authorization header.</p><h3>Base URL</h3><pre><code>https://api.devcollab.io/v1/</code></pre>',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'page-3',
    title: 'Architecture Overview',
    content: '<h2>Architecture Overview</h2><p>DevCollab uses a decoupled frontend/backend architecture.</p><ul><li><strong>Frontend:</strong> React + Vite + Tailwind CSS</li><li><strong>Backend:</strong> Django + DRF</li><li><strong>Database:</strong> SQLite (dev) / PostgreSQL (prod)</li></ul>',
    updatedAt: new Date().toISOString(),
  },
];

export const useWikiStore = create((set, get) => ({
  pages: SEED_PAGES,
  activePage: SEED_PAGES[0],

  setActivePage: (pageId) => {
    const page = get().pages.find((p) => p.id === pageId);
    if (page) set({ activePage: page });
  },

  createPage: (title) => {
    const page = {
      id: `page-${nanoid(6)}`,
      title: title || 'Untitled Page',
      content: `<h2>${title || 'Untitled Page'}</h2><p>Start writing...</p>`,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ pages: [...state.pages, page], activePage: page }));
    return page;
  },

  updatePage: (pageId, updates) => {
    set((state) => {
      const pages = state.pages.map((p) =>
        p.id === pageId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      const activePage = state.activePage?.id === pageId
        ? { ...state.activePage, ...updates }
        : state.activePage;
      return { pages, activePage };
    });
  },

  deletePage: (pageId) => {
    set((state) => {
      const pages = state.pages.filter((p) => p.id !== pageId);
      const activePage = state.activePage?.id === pageId ? pages[0] || null : state.activePage;
      return { pages, activePage };
    });
  },
}));
